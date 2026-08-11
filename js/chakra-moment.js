/*!
 * chakra-moment.js — one instant, told every way there is.  v0.1.0
 *
 * Give it a moment. It returns:
 *   sky        where the Sun, Moon and grahas actually were
 *   calendars  that same instant in a dozen of the world's reckonings
 *   rarity     how common that configuration is — computed, with the arithmetic
 *              shown, never asserted
 *   milestones day-counts a person can feel (10,000 days alive; the next one)
 *   returns    when the sky comes back to where it was
 *
 * WHY THIS EXISTS: everything else here needs you to care about jyotiṣa. This
 * needs only that you were born. It works for a sceptic, a believer, and a
 * child, in any country, and it says nothing about anyone's future.
 *
 * HONESTY (contract C37): no prediction, no character reading, no fortune.
 * Every "rare" number is a frequency we compute and can show the working for.
 * Ephemeris accuracy degrades far from the present — see epoch warnings.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. All rights reserved. Sole author.
 * Affiliation: AyeAI.  SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    var tried = ["./chakra-core.js", "../src/chakra-core.js", "../js/chakra-core.js",
                 "../test/chakra-core.js", "../chakra-core.js"], core = null, i;
    for (i = 0; i < tried.length; i++) { try { core = require(tried[i]); break; } catch (e) {} }
    if (!core) throw new Error("chakra-moment: chakra-core.js not found. Tried: " + tried.join(", "));
    module.exports = factory(core);
  } else root.ChakraMoment = factory(root.Chakra);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";

  var VERSION = "0.1.0";
  var GRAHAS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  var SIGNS = ["Meṣa", "Vṛṣabha", "Mithuna", "Karka", "Siṃha", "Kanyā",
               "Tulā", "Vṛścika", "Dhanus", "Makara", "Kumbha", "Mīna"];
  var SIGNS_EN = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  function pad(n) { return String(n).padStart(2, "0"); }
  function decYearOf(Y, M) { return Y + (M - 0.5) / 12; }
  function sid(lon, dy) { return C.rev(lon - C.ayan(dy)); }

  /* ------------------------------------------------------------------ sky */
  function sky(Y, M, D, hourUT, lat, lonE) {
    var d = C.dayNo(Y, M, D, hourUT), dy = decYearOf(Y, M), g = C.grahas(d);
    var out = { grahas: {}, dayNo: d, jdn: C.greg2jdn(Y, M, D) };
    GRAHAS.forEach(function (b) {
      var L = sid(g[b], dy), s = Math.floor(L / 30);
      out.grahas[b] = {
        lon: +L.toFixed(3), sign: SIGNS[s], signEn: SIGNS_EN[s],
        deg: +(L % 30).toFixed(2)
      };
    });
    var ph = C.phaseInfo(d);
    out.moonPhase = { name: ph.name, illum: +(ph.illum * 100).toFixed(1), waxing: !!ph.waxing };
    out.panchanga = C.panchanga(d, dy);
    if (lat != null && lonE != null) {
      try {
        var asc = C.ascendant(d, lat, lonE);
        var a = sid(asc, dy), si = Math.floor(a / 30);
        out.lagna = { lon: +a.toFixed(3), sign: SIGNS[si], signEn: SIGNS_EN[si], deg: +(a % 30).toFixed(2) };
      } catch (e) { out.lagna = null; }
    }
    return out;
  }

  /* ------------------------------------------------------------ calendars
   * The same instant, in the reckonings people actually live by. This is the
   * part that needs no belief and travels anywhere. */
  function calendars(Y, M, D, hourUT) {
    var d = C.dayNo(Y, M, D, hourUT == null ? 12 : hourUT);
    var j = C.greg2jdn(Y, M, D), dy = decYearOf(Y, M), out = [];
    function add(system, region, reading) {
      if (reading != null && reading !== "" && !/undefined|null|NaN/.test(String(reading)))
        out.push({ system: system, region: region, reading: String(reading) });
    }
    add("Gregorian", "worldwide", Y + "-" + pad(M) + "-" + pad(D));
    add("Julian Day", "astronomy", "JDN " + j);
    try { var s = C.samvInfo(d, Y);
      add("Śaka", "India (civil)", s.saka + " · " + s.name);
      add("Vikrama Saṃvat", "North India / Nepal", String(s.vikrama)); } catch (e) {}
    try { var p = C.panchanga(d, dy);
      add("Pañcāṅga", "India", p.tithi + " · " + p.nak); } catch (e) {}
    try { var hs = C.hijriSunni(j); add("Hijrī", "Islamic world", hs.d + " " + C.HIJRI_M[hs.m - 1] + " " + hs.y); } catch (e) {}
    try { var sh = C.solarHijri(d, Y); if (sh && sh.y) add("Solar Hijrī", "Iran / Afghanistan", sh.d + " " + sh.m + " " + sh.y); } catch (e) {}
    try { var hb = C.hebrew(j); add("Hebrew", "Jewish world", hb.d + " " + hb.month + " " + hb.y); } catch (e) {}
    try { add("Chinese sexagenary", "East Asia", C.chineseYear(Y)); } catch (e) {}
    try { add("Tibetan", "Tibet / Himalaya", C.tibetYear(Y)); } catch (e) {}
    try { var my = C.mayan(j); add("Maya Long Count", "Mesoamerica", my.lc + " · " + my.tz + " · " + my.haab); } catch (e) {}
    try { var nk = C.nanakshahi(j); add("Nānakshāhī", "Sikh", nk.d + " " + nk.month + " " + nk.y); } catch (e) {}
    /* astroAge() is the PRECESSIONAL age (the "Age of Pisces"), not a sun sign.
       Labelling it as a birth sign would be simply wrong; both are given, named
       for what they actually are. */
    try { add("Precessional age", "astronomy", "Age of " + C.astroAge(dy)); } catch (e) {}
    try {
      var trop = C.rev(C.sunLon(d).lon);
      add("Tropical sun sign", "Western", SIGNS_EN[Math.floor(trop / 30)]);
    } catch (e) {}
    try {
      var sidr = sid(C.sunLon(d).lon, dy);
      add("Sidereal sun sign", "Indian (nirayana)", SIGNS[Math.floor(sidr / 30)] + " / " + SIGNS_EN[Math.floor(sidr / 30)]);
    } catch (e) {}
    return out;
  }

  /* --------------------------------------------------------------- rarity
   * Every figure below is a frequency with its arithmetic attached. Nothing
   * here says anything about the person — only about how often the sky does
   * this. That distinction is the whole ethic of this file. */
  function rarity(sk) {
    var out = [];
    var nak = sk.panchanga && sk.panchanga.nak;
    var tit = sk.panchanga && sk.panchanga.tithi;
    if (nak) out.push({
      what: "Moon in " + nak,
      chance: "1 in 27",
      pct: +(100 / 27).toFixed(1),
      working: "The Moon crosses 27 nakṣatras each circuit, so any one of them is 1/27 of the time."
    });
    if (tit) out.push({
      what: tit.split(" (")[0] + " tithi",
      chance: "1 in 30",
      pct: +(100 / 30).toFixed(1),
      working: "A lunar month holds 30 tithis; one of them is 1/30 of the month."
    });
    if (nak && tit) out.push({
      what: "that tithi AND that nakṣatra together",
      chance: "about 1 in 810",
      pct: +(100 / 810).toFixed(2),
      working: "27 \u00d7 30 = 810 combinations. They are not quite independent, so this is close, not exact.",
      approximate: true
    });
    var ph = sk.moonPhase;
    if (ph) out.push({
      what: "the Moon " + ph.illum + "% lit",
      chance: "within 1% of that, about 1 day in 50",
      pct: 2,
      working: "Illumination sweeps 0\u2013100% and back over ~29.5 days, so a 1% band is hit roughly twice a month.",
      approximate: true
    });
    var retro = [];
    GRAHAS.forEach(function (b) {
      if (b === "Sun" || b === "Moon") return;
      /* a body is retrograde when its longitude is decreasing */
      try {
        var dy = 0.5, g1 = C.grahas(sk.dayNo - dy), g2 = C.grahas(sk.dayNo + dy);
        var dl = C.rev(g2[b] - g1[b]); if (dl > 180) dl -= 360;
        if (dl < 0) retro.push(b);
      } catch (e) {}
    });
    if (retro.length) out.push({
      what: retro.join(" and ") + (retro.length > 1 ? " were" : " was") + " retrograde",
      chance: retro.length === 1 ? "roughly 1 day in 5 for that body" : "less common still",
      pct: retro.length === 1 ? 20 : 6,
      working: "Outer bodies spend part of each synodic cycle apparently moving backwards; " +
               "the fraction differs by body. Computed here from the actual motion, not assumed.",
      approximate: true
    });
    return { items: out, note: "These are frequencies of the sky, not statements about a person." };
  }

  /* ----------------------------------------------------------- milestones
   * Day counts. Universally legible, needs no tradition, and people share them. */
  function milestones(jdnBirth, jdnNow) {
    var days = Math.floor(jdnNow - jdnBirth);
    var out = { daysAlive: days, note: "Whole days elapsed, counted from the date given." };
    var marks = [1000, 5000, 10000, 15000, 20000, 25000, 30000, 40000];
    out.passed = marks.filter(function (m) { return m <= days; });
    var next = marks.filter(function (m) { return m > days; })[0] || (Math.ceil((days + 1) / 10000) * 10000);
    out.next = { mark: next, inDays: next - days, onJdn: jdnBirth + next };
    /* the ones people actually enjoy */
    out.fun = [];
    if (days >= 10000) out.fun.push("You passed 10,000 days on day " + 10000 + ".");
    var pi = Math.round(days / 3141.592653589793 * 100) / 100;
    if (pi >= 1) out.fun.push("That is " + pi + " \u00d7 1000\u03c0 days.");
    out.fun.push("About " + (days / 365.2422).toFixed(2) + " tropical years.");
    return out;
  }

  /* -------------------------------------------------------------- returns
   * When does this sky come back? Solar return is the birthday everyone knows;
   * the lunar one is the part nobody has ever been shown. */
  function returns(sk, jdnNow) {
    var out = [];
    var lunarMonth = 29.530588;
    var since = jdnNow - sk.jdn;
    out.push({
      what: "Solar return (your birthday, astronomically)",
      everyDays: 365.2422,
      count: Math.floor(since / 365.2422),
      nextInDays: +(365.2422 - (since % 365.2422)).toFixed(1)
    });
    out.push({
      what: "Lunar return \u2014 the Moon back to the same phase",
      everyDays: lunarMonth,
      count: Math.floor(since / lunarMonth),
      nextInDays: +(lunarMonth - (since % lunarMonth)).toFixed(1)
    });
    out.push({
      what: "Metonic return \u2014 Sun AND Moon together again",
      everyDays: 6939.688,
      count: Math.floor(since / 6939.688),
      nextInDays: +(6939.688 - (since % 6939.688)).toFixed(1),
      note: "19 years. The sky repeats itself almost exactly; every calendar-maker in history has leaned on it."
    });
    var sat = 10759.22, jup = 4332.59;
    out.push({ what: "Jupiter return", everyDays: jup, count: Math.floor(since / jup),
               nextInDays: +(jup - (since % jup)).toFixed(1) });
    out.push({ what: "Saturn return", everyDays: sat, count: Math.floor(since / sat),
               nextInDays: +(sat - (since % sat)).toFixed(1) });
    return out;
  }

  /* ------------------------------------------------------------- the whole */
  function cosmicId(opts) {
    opts = opts || {};
    var Y = opts.year, M = opts.month, D = opts.day;
    if (!(Y > -5000 && Y < 5000) || !(M >= 1 && M <= 12) || !(D >= 1 && D <= 31))
      throw new Error("chakra-moment: a valid year, month and day are required");
    var h = opts.hourUT == null ? 12 : opts.hourUT;
    var lat = opts.lat, lonE = opts.lonE;
    var sk = sky(Y, M, D, h, lat, lonE);
    var now = opts.nowJdn == null ? null : opts.nowJdn;
    var res = {
      version: VERSION,
      date: Y + "-" + pad(M) + "-" + pad(D),
      timeGiven: opts.hourUT != null,
      placeGiven: lat != null && lonE != null,
      sky: sk,
      calendars: calendars(Y, M, D, h),
      rarity: rarity(sk),
      returns: now == null ? null : returns(sk, now),
      milestones: now == null ? null : milestones(sk.jdn, now),
      headline: headline(sk),
      caveats: caveats(Y, opts)
    };
    return res;
  }

  /* One line a person would actually post. Descriptive, never predictive. */
  function headline(sk) {
    var m = sk.grahas.Moon, s = sk.grahas.Sun, p = sk.moonPhase;
    var nak = sk.panchanga && sk.panchanga.nak;
    return "Sun in " + s.signEn + ", Moon in " + m.signEn +
      (nak ? " (" + nak + ")" : "") + ", " + p.name.toLowerCase() + " at " + p.illum + "% lit.";
  }

  function caveats(Y, opts) {
    var out = [];
    var away = Math.abs(2000 - Y);
    if (away > 400) out.push("This is " + away + " years from the present; positions drift as you go further out.");
    if (!opts || opts.hourUT == null)
      out.push("No time was given, so noon UT was used. The Moon moves about half a degree an hour \u2014 " +
               "the tithi and nakṣatra can differ if your birth time was far from midday.");
    if (!opts || opts.lat == null)
      out.push("No place was given, so there is no ascendant. Everything else is independent of where you stood.");
    out.push("Nothing here predicts anything or describes a character. It is a record of where things were.");
    return out;
  }

  return {
    version: VERSION, GRAHAS: GRAHAS, SIGNS: SIGNS, SIGNS_EN: SIGNS_EN,
    sky: sky, calendars: calendars, rarity: rarity, milestones: milestones,
    returns: returns, cosmicId: cosmicId, headline: headline
  };
});
