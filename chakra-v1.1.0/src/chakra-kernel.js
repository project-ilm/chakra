/*!
 * chakra-kernel.js — CHAKRA abstraction layer: one time/place state, a computed
 * "moment" snapshot, inverse solvers as actions, and a subscribe() event bus.
 * UI and API are both mere consumers of this facade — layer anything on top.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * DISCLAIMER: study/heritage computation only; not for navigation or safety-critical use.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./chakra-core.js"));
  else root.ChakraKernel = factory(root.Chakra);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";

  function makeKernel(init) {
    var state = Object.assign({
      refDate: "2026-07-04", refTime: "12:00", tz: 5.5,
      lat: 28.61, lon: 77.21, zodiac: "sidereal", anchor: 1990,
      events: []
    }, init || {});
    var subs = [];

    function ymd() { var p = state.refDate.split("-").map(Number); return { Y: p[0], M: p[1], D: p[2] }; }
    function hm()  { var p = state.refTime.split(":").map(Number); return { h: p[0]||0, m: p[1]||0 }; }
    function dayNo() { var a = ymd(), b = hm(); return C.dayNo(a.Y, a.M, a.D, b.h + b.m/60 - state.tz); }
    function year()  { var a = ymd(); return a.Y + (a.M-1)/12 + (a.D-1)/365; }
    function jdnCivil() { var a = ymd(); return C.greg2jdn(a.Y, a.M, a.D); }
    function sid(lon) { return C.siderealAdj(lon, year(), state.zodiac !== "tropical"); }

    /* the full computed snapshot — the single source other layers read */
    function moment() {
      var d = dayNo(), y = year(), Y = ymd().Y, jc = jdnCivil();
      var ph = C.phaseInfo(d), pc = C.panchanga(d, y);
      var chart = C.buildChart(d, y, state.lat, state.lon);
      var sv = C.samvInfo(d, Y), sh = C.solarHijri(d, Y);
      var hjS = C.hijriSunni(jc), hjSh = C.hijriShia(jc), heb = C.hebrew(jc), nan = C.nanakshahi(jc);
      var sunAlt = C.altAz(C.sunLon(d).lon, 0, d, state.lat, state.lon).alt;
      var moonSid = sid(C.moonLon(d));
      var vim = C.vimshottari(moonSid, y);
      return {
        input: Object.assign({}, state),
        jd: d + 2451543.5, jdnCivil: jc, dayNo: d, decimalYear: y,
        ascendant: sid(C.ascendant(d, state.lat, state.lon)),
        mc: sid(C.mcLon(d, state.lon)),
        moon: { longitude: moonSid, phase: ph.name, illum: ph.illum, waxing: ph.waxing, elongation: ph.elong, latitude: pc.moonLat, nakshatra: pc.nak },
        sun: { altitude: sunAlt, dayState: sunAlt>0?"day":sunAlt>-6?"civil twilight":sunAlt>-12?"nautical twilight":sunAlt>-18?"astronomical twilight":"night" },
        panchanga: { vara: pc.vara, tithi: pc.tithi, nakshatra: pc.nak, yoga: pc.yoga, karana: pc.karana, manzil: pc.manzil },
        yogas: C.computeYogas(chart),
        dasha: vim,
        chart: chart.pos,
        retrogrades: ["Mercury","Venus","Mars","Jupiter","Saturn"].filter(function(n){return C.retro(n,d);}),
        eclipses: C.eclipses(d-560, d+560).map(function(e){return {type:e.type, date:C.d2date(e.d), sunNode:+e.dist.toFixed(2), central:e.central};}),
        telescope: C.ephemerisTable(d, state.lat, state.lon),
        calendars: {
          gregorian: state.refDate,
          julianDay: +(d + 2451543.5).toFixed(3),
          hijriSunni: hjS.d + " " + (C.HIJRI_M[hjS.m-1]||hjS.m) + " " + hjS.y + " AH",
          hijriShia: hjSh.d + " " + (C.HIJRI_M[hjSh.m-1]||hjSh.m) + " " + hjSh.y + " AH",
          solarHijri: sh.d + " " + sh.m + " " + sh.y + " SH",
          samvatsara: sv.name, saka: sv.saka, vikrama: sv.vikrama, kali: sv.y + 3101,
          chinese: C.chineseYear(Y), tibetan: C.tibetYear(Y),
          mayan: (function(m){return m.lc + " · " + m.tz + " · Haab " + m.haab;})(C.mayan(jc)),
          hebrew: heb.d + " " + heb.month + " " + heb.y + " AM",
          nanakshahi: nan.d + " " + nan.month + " " + nan.y + " NS",
          age: "Age of " + C.astroAge(y)
        }
      };
    }

    /* actions — inverse solvers mutate the state, then everyone is notified */
    function setMomentFromDayNo(d) {
      var jd = d + state.tz/24 + 2451543.5, z = Math.floor(jd + 0.5), F = jd + 0.5 - z, a = z;
      if (z >= 2299161) { var al = Math.floor((z - 1867216.25)/36524.25); a = z + 1 + al - Math.floor(al/4); }
      var b = a + 1524, c = Math.floor((b - 122.1)/365.25), dsz = Math.floor(365.25*c), ee = Math.floor((b - dsz)/30.6001);
      var day = b - dsz - Math.floor(30.6001*ee), mo = ee < 14 ? ee - 1 : ee - 13, yr = mo > 2 ? c - 4716 : c - 4715;
      var mins = Math.min(1439, Math.round(F*1440)), h = Math.floor(mins/60), mi = mins % 60;
      state.refDate = yr + "-" + String(mo).padStart(2,"0") + "-" + String(Math.floor(day)).padStart(2,"0");
      state.refTime = String(h).padStart(2,"0") + ":" + String(mi).padStart(2,"0");
    }

    var api = {
      get: function () { return Object.assign({}, state); },
      set: function (patch) { Object.assign(state, patch); emit("set"); return api; },
      subscribe: function (fn) { subs.push(fn); return function () { var i = subs.indexOf(fn); if (i>=0) subs.splice(i,1); }; },
      moment: moment,
      dayNo: dayNo, year: year, jdnCivil: jdnCivil, sid: sid,
      /* inverse solvers as first-class actions */
      solveAscendant: function (targetSidDeg) {
        var trop = state.zodiac !== "tropical" ? C.rev(targetSidDeg + C.ayan(year())) : targetSidDeg;
        setMomentFromDayNo(C.solveAsc(dayNo(), trop, state.lat, state.lon)); emit("solveAscendant"); return api;
      },
      solveElongation: function (targetDeg) { setMomentFromDayNo(C.solveElong(dayNo(), targetDeg)); emit("solveElongation"); return api; },
      phaseLockEpoch: function (P, harm) {
        state.anchor = C.phaseLockEpoch(state.events.map(function(e){return e.t;}), P, harm||1, state.anchor); emit("phaseLock"); return api;
      },
      jumpToEclipse: function (dir) {
        var d0 = dayNo(), list = dir>0 ? C.eclipses(d0+1, d0+560) : C.eclipses(d0-560, d0-1);
        if (!list.length) return api;
        var e = dir>0 ? list[0] : list[list.length-1]; setMomentFromDayNo(e.d); emit("jumpEclipse"); return api;
      },
      setMomentFromDayNo: function (d) { setMomentFromDayNo(d); emit("set"); return api; },
      core: C
    };
    function emit(reason) { var snap = api.get(); for (var i=0;i<subs.length;i++) subs[i](snap, reason); }
    return api;
  }

  return { create: makeKernel };
});
