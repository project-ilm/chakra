/*!
 * chakra-ext.js — CHAKRA extension surface. ADDITIVE ONLY.
 *
 * This module NEVER modifies chakra-core.js. It consumes the core's exported
 * primitives (sunLon, moonLon, planetLon, panchanga, vargaLon, solveElong,
 * altOf, dayNo, jdn2greg, eclipses, ...) and layers new features on top.
 * The verified ephemeris/parity surface (6,590 checks) is untouched by design.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. All rights reserved. Sole author.
 * Affiliation: AyeAI.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * DISCLAIMER: study/heritage computation only. Astrological outputs are cultural,
 * not predictive. Not for navigation, muhurta-critical or safety-critical use.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./chakra-core.js"));
  else root.ChakraExt = factory(root.Chakra);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";

  var EXT_VERSION = "0.1.0";
  var rev = C.rev, dayNo = C.dayNo, jdn2greg = C.jdn2greg, greg2jdn = C.greg2jdn;

  /* --- epoch + sidereal helpers, derived from the core's ACTUAL interface ---
   * Core uses two time scales: `d` (dayNo, epoch J2000-ish) and `jdn`.
   *   jdOf(d) -> JDN ;  rise/set take a JDN and RETURN a dayNo.
   * Core's ayan() takes a DECIMAL YEAR (not a time), and decYear() takes a
   * JS Date (not a dayNo) — so the year is derived here from the calendar.
   * Verified by execution against chakra-core 1.4.1. */
  function toJDN(d) { return Math.floor(C.jdOf(d) + 0.5); }
  function fmtDayNo(d) { var g = jdn2greg(toJDN(d));
    return g.Y + "-" + String(g.M).padStart(2, "0") + "-" + String(g.D).padStart(2, "0"); }
  function yearOf(d) { var g = jdn2greg(toJDN(d)); return g.Y + (g.M - 0.5) / 12; }
  function sid(lon, d) { return rev(lon - C.ayan(yearOf(d))); }
  function nakIndexAt(d) { return Math.floor(sid(C.moonLon(d), d) / (360 / 27)); }

  /* ============================================================ 1. RISE / SET
   * Mirror of core's sunsetUT bracketing, inverted for the morning crossing.
   * Core's own function is used unchanged for sunset. */
  function sunriseUT(jdn, lat, lonE) {
    var g = jdn2greg(jdn);
    var t = dayNo(g.Y, g.M, g.D, 6 - lonE / 15);           /* ~local solar 06:00, in UT */
    var alt = function (x) { return C.altOf(C.sunLon(x).lon, 0, x, lat, lonE) + 0.833; };
    var lo = t - 0.14, hi = t + 0.14;                       /* rising: alt(lo)<0, alt(hi)>0 */
    if (!(alt(lo) < 0 && alt(hi) > 0)) { lo = t - 0.3; hi = t + 0.3; }
    if (!(alt(lo) < 0 && alt(hi) > 0)) return t;            /* polar fallback, declared */
    for (var i = 0; i < 34; i++) { var m = (lo + hi) / 2; if (alt(m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function sunsetUT(jdn, lat, lonE) { return C.sunsetUT(jdn, lat, lonE); }
  function dayLength(jdn, lat, lonE) { return sunsetUT(jdn, lat, lonE) - sunriseUT(jdn, lat, lonE); }

  /* ============================================================ 2. MASA
   * The Hindu lunar month. Named for the solar sign entered during the month
   * (the sankranti rule); a month with NO sankranti is adhika (intercalary). */
  var MASA = ["Chaitra","Vaisakha","Jyaishtha","Ashadha","Shravana","Bhadrapada",
              "Ashvina","Kartika","Margashirsha","Pausha","Magha","Phalguna"];
  var MASA_DEV = ["चैत्र","वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद",
                  "आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"];

  function elong(t) { return rev(C.moonLon(t) - C.sunLon(t).lon); }
  /* nearest new moon at or before t */
  function newMoonBefore(t) {
    var e = elong(t);                       /* days since conjunction, approx */
    var t0 = t - e / 12.19;
    var r = C.solveElong(t0, 0);
    if (r > t) r = C.solveElong(t0 - 29.53, 0);
    return r;
  }
  function newMoonAfter(t) { var r = newMoonBefore(t); return C.solveElong(r + 29.53, 0); }

  function sunSign(t) { return Math.floor(sid(C.sunLon(t).lon, t) / 30); }

  function masa(t) {
    var start = newMoonBefore(t), end = newMoonAfter(t);
    var s0 = sunSign(start + 0.01), s1 = sunSign(end - 0.01);
    var adhika = (s0 === s1);                       /* no sankranti inside -> intercalary */
    /* The month is named for the SANKRANTI THAT FALLS INSIDE it, i.e. the sign
     * the sun holds at the month's end: Karka sankranti -> Shravana, and so on.
     * An adhika month (no sankranti) carries the succeeding month's name. */
    var idx = s1;   /* Makara->Pausha, Kanya->Bhadrapada, Mesha->Chaitra */
    var el = elong(t);
    var paksha = el < 180 ? "Shukla" : "Krishna";
    var amanta = MASA[idx];
    /* purnimanta: the krishna paksha belongs to the NEXT-named month */
    var pIdx = (paksha === "Krishna") ? (idx + 1) % 12 : idx;
    return {
      amanta: amanta, amantaDev: MASA_DEV[idx], amantaIndex: idx,
      purnimanta: MASA[pIdx], purnimantaDev: MASA_DEV[pIdx], purnimantaIndex: pIdx,
      paksha: paksha, adhika: adhika,
      label: (adhika ? "Adhika " : "") + amanta + " " + paksha,
      monthStart: start, monthEnd: end
    };
  }

  /* ============================================================ 3. TITHI MODE
   * Two conventions, both offered: the tithi running at THIS moment, and the
   * tithi current at local sunrise (the convention almanacs print). */
  function tithiAt(t, lat, lonE, mode) {
    var use = t;
    if (mode === "sunrise") use = sunriseUT(toJDN(t), lat, lonE);
    var el = elong(use), ti = Math.floor(el / 12);
    var frac = (el / 12) - ti;
    return {
      mode: mode === "sunrise" ? "sunrise" : "moment",
      at: use,
      index: ti,
      name: C.TITHI[ti % 15],
      paksha: ti < 15 ? "Shukla" : "Krishna",
      elapsedPct: +(frac * 100).toFixed(2),
      endsAt: C.solveElong(use, (ti + 1) * 12)
    };
  }

  /* ============================================================ 4. FESTIVALS
   * Rule table: [name, masaIndex|null, paksha, tithi(1-15), tradition, tags]
   * Scanned against masa+tithi at local sunrise for each day of the year. */
  var FESTIVALS = [
    ["Gudi Padwa / Ugadi",        0,"Shukla",1,  "pan-Hindu","new-year"],
    ["Chaitra Navratri (begins)", 0,"Shukla",1,  "pan-Hindu","navratri,fasting"],
    ["Rama Navami",               0,"Shukla",9,  "pan-Hindu","fasting"],
    ["Hanuman Jayanti",           0,"Shukla",15, "pan-Hindu",""],
    ["Akshaya Tritiya",           1,"Shukla",3,  "pan-Hindu","auspicious"],
    ["Buddha Purnima",            1,"Shukla",15, "Buddhist",""],
    ["Ganga Dussehra",            2,"Shukla",10, "north",""],
    ["Jagannath Rath Yatra",      3,"Shukla",2,  "Odia",""],
    ["Ashadha Gupta Navratri",    3,"Shukla",1,  "tantric","navratri,fasting"],
    ["Guru Purnima",              3,"Shukla",15, "pan-Hindu",""],
    ["Nag Panchami",              4,"Shukla",5,  "pan-Hindu",""],
    ["Raksha Bandhan",            4,"Shukla",15, "north",""],
    ["Janmashtami",               4,"Krishna",8, "pan-Hindu","fasting"],
    ["Ganesh Chaturthi",          5,"Shukla",4,  "Maharashtra","ganesh"],
    ["Anant Chaturdashi",         5,"Shukla",14, "Maharashtra","ganesh"],
    ["Pitru Paksha (begins)",     5,"Krishna",1, "pan-Hindu","shraddha","P"],
    ["Mahalaya Amavasya",         6,"Krishna",15,"Bengal","shraddha"],
    ["Sharada Navratri (begins)", 6,"Shukla",1,  "pan-Hindu","navratri,fasting"],
    ["Durga Puja Shashthi",       6,"Shukla",6,  "Bengal","durga"],
    ["Durga Puja Saptami",        6,"Shukla",7,  "Bengal","durga"],
    ["Durga Puja Ashtami",        6,"Shukla",8,  "Bengal","durga,fasting"],
    ["Durga Puja Navami",         6,"Shukla",9,  "Bengal","durga"],
    ["Vijayadashami / Dussehra",  6,"Shukla",10, "pan-Hindu","durga"],
    ["Sharad Purnima",            6,"Shukla",15, "pan-Hindu",""],
    ["Karva Chauth",              7,"Krishna",4, "north","fasting","P"],
    ["Dhanteras",                 7,"Krishna",12,"pan-Hindu","diwali","P"],
    ["Naraka Chaturdashi",        7,"Krishna",14,"pan-Hindu","diwali","P"],
    ["Diwali / Lakshmi Puja",     7,"Krishna",15,"pan-Hindu","diwali","P"],
    ["Kali Puja",                 7,"Krishna",15,"Bengal","kali,diwali","P"],
    ["Govardhan Puja",            7,"Shukla",1,  "north","diwali"],
    ["Bhai Dooj",                 7,"Shukla",2,  "north","diwali"],
    ["Chhath Puja (Nahay Khay)",  7,"Shukla",4,  "Bihar","chhath,fasting"],
    ["Chhath Puja (Sandhya Argh)",7,"Shukla",6,  "Bihar","chhath,fasting"],
    ["Kartik Purnima",            7,"Shukla",15, "pan-Hindu",""],
    ["Vivah Panchami",            8,"Shukla",5,  "Mithila",""],
    ["Gita Jayanti",              8,"Shukla",11, "pan-Hindu",""],
    ["Pausha Purnima",            9,"Shukla",15, "pan-Hindu",""],
    ["Magha Gupta Navratri",     10,"Shukla",1,  "tantric","navratri,fasting"],
    ["Vasant Panchami",          10,"Shukla",5,  "pan-Hindu",""],
    ["Magha Purnima",            10,"Shukla",15, "pan-Hindu","fasting"],
    ["Maha Shivaratri",          10,"Krishna",14,"pan-Hindu","fasting"],
    ["Holika Dahan",             11,"Shukla",15, "pan-Hindu","holi"],
    ["Holi",                     11,"Krishna",1, "pan-Hindu","holi"]
  ];
  /* recurring observances, every month */
  var RECURRING = [
    ["Ekadashi (Shukla)", "Shukla", 11, "pan-Hindu","fasting,ekadashi"],
    ["Ekadashi (Krishna)","Krishna",11, "pan-Hindu","fasting,ekadashi"],
    ["Pradosha (Shukla)", "Shukla", 13, "Shaiva","fasting"],
    ["Pradosha (Krishna)","Krishna",13, "Shaiva","fasting"],
    ["Sankashti Chaturthi","Krishna",4, "Ganapatya","fasting,ganesh"],
    ["Purnima",           "Shukla", 15, "pan-Hindu","fasting"],
    ["Amavasya",          "Krishna",15, "pan-Hindu",""]
  ];

  function festivals(year, lat, lonE, opts) {
    opts = opts || {};
    var want = opts.traditions || null;          /* array filter, null = all */
    var includeRecurring = opts.recurring !== false;
    var out = [], jd0 = greg2jdn(year, 1, 1), jd1 = greg2jdn(year, 12, 31);
    for (var j = jd0; j <= jd1; j++) {
      var sr = sunriseUT(j, lat, lonE);
      var m = masa(sr), ti = tithiAt(sr, lat, lonE, "moment");
      var tnum = (ti.index % 15) + 1, pk = ti.paksha;
      var g = jdn2greg(j);
      var date = g.Y + "-" + String(g.M).padStart(2, "0") + "-" + String(g.D).padStart(2, "0");
      var push = function (name, trad, tags) {
        if (want && want.indexOf(trad) < 0) return;
        out.push({ date: date, jdn: j, name: name, tradition: trad, tags: tags,
                   masa: m.amanta, masaPurnimanta: m.purnimanta, paksha: pk,
                   tithi: tnum, tithiName: ti.name, adhika: m.adhika });
      };
      for (var f = 0; f < FESTIVALS.length; f++) {
        var F = FESTIVALS[f];
        /* F[6] === "P": the rule names the month in PURNIMANTA reckoning (north
         * Indian usage for krishna-paksha festivals). Shukla-paksha month names
         * are identical in both reckonings, so no flag is needed there. */
        var monthIdx = (F[6] === "P") ? m.purnimantaIndex : m.amantaIndex;
        if (F[1] === monthIdx && F[2] === pk && F[3] === tnum) push(F[0], F[4], F[5]);
      }
      if (includeRecurring) for (var r = 0; r < RECURRING.length; r++) {
        var R = RECURRING[r];
        if (R[1] === pk && R[2] === tnum) push(R[0], R[3], R[4]);
      }
    }
    return out;
  }

  /* ============================================================ 5. VARGAS
   * The full shodasavarga set, built on core's vargaLon (untouched). */
  var VARGAS = [
    [1,"D1","Rashi","body / overall"],           [2,"D2","Hora","wealth"],
    [3,"D3","Drekkana","siblings, courage"],     [4,"D4","Chaturthamsha","fortune, home"],
    [7,"D7","Saptamsha","children"],             [9,"D9","Navamsha","spouse, dharma"],
    [10,"D10","Dashamsha","career"],             [12,"D12","Dwadashamsha","parents"],
    [16,"D16","Shodashamsha","vehicles, comfort"],[20,"D20","Vimshamsha","spiritual practice"],
    [24,"D24","Chaturvimshamsha","learning"],    [27,"D27","Bhamsha","strengths"],
    [30,"D30","Trimshamsha","adversity"],        [40,"D40","Khavedamsha","maternal legacy"],
    [45,"D45","Akshavedamsha","paternal legacy"],[60,"D60","Shashtiamsha","past karma"]
  ];
  function vargaChart(chart, n) {
    var out = {};
    for (var k in chart.pos) if (Object.prototype.hasOwnProperty.call(chart.pos, k))
      out[k] = C.vargaLon(chart.pos[k], n);
    return out;
  }
  function allVargas(chart) {
    var res = [];
    for (var i = 0; i < VARGAS.length; i++) {
      var V = VARGAS[i];
      res.push({ n: V[0], code: V[1], name: V[2], signifies: V[3], positions: vargaChart(chart, V[0]) });
    }
    return res;
  }

  /* ============================================================ 6. MATCHING
   * Ashtakoota (8 kutas, 36 points). CULTURAL SCORING, NOT ADVICE. */
  var GANA = [0,1,2,1,0,2,0,0,2, 2,1,1,0,2,0,2,0,2, 2,1,1,2,0,2,1,1,0]; /* 0 dev 1 manushya 2 rakshasa */
  var YONI = [0,1,1,2,2,3,4,5,5, 6,6,7,7,8,8,9,4,10, 10,3,11,11,12,12,13,13,0];
  var NADI = [0,1,2,0,1,2,0,1,2, 0,1,2,0,1,2,0,1,2, 0,1,2,0,1,2,0,1,2];
  var VASHYA_G = [0,1,1,2,2,3,3,4,4,0,1,1]; /* by moon sign group */
  var RAJJU = [0,1,2,3,4,3,2,1,0, 0,1,2,3,4,3,2,1,0, 0,1,2,3,4,3,2,1,0];

  function kutaScore(a, b) {
    /* a,b = {nak: 0..26, moonSign: 0..11} */
    var k = {};
    k.varna     = { max: 1, got: ((a.moonSign % 4) >= (b.moonSign % 4)) ? 1 : 0 };
    k.vashya    = { max: 2, got: (VASHYA_G[a.moonSign] === VASHYA_G[b.moonSign]) ? 2 : 1 };
    var d = ((b.nak - a.nak) + 27) % 27;
    k.tara      = { max: 3, got: ((d % 9) === 2 || (d % 9) === 4 || (d % 9) === 6) ? 0 : 3 };
    k.yoni      = { max: 4, got: (YONI[a.nak] === YONI[b.nak]) ? 4 : 2 };
    var lord = function (s) { return [2,3,4,1,0,3,4,2,5,6,6,5][s]; };
    k.grahaMaitri = { max: 5, got: (lord(a.moonSign) === lord(b.moonSign)) ? 5 : 3 };
    var g1 = GANA[a.nak], g2 = GANA[b.nak];
    k.gana      = { max: 6, got: (g1 === g2) ? 6 : (Math.abs(g1 - g2) === 2 ? 0 : 3) };
    var diff = ((b.moonSign - a.moonSign) + 12) % 12;
    k.bhakoot   = { max: 7, got: ([6,8,5,9,1,11].indexOf(diff) >= 0) ? 0 : 7 };
    k.nadi      = { max: 8, got: (NADI[a.nak] === NADI[b.nak]) ? 0 : 8 };
    var tot = 0, max = 0;
    for (var key in k) { tot += k[key].got; max += k[key].max; }
    return {
      kutas: k, total: tot, max: max, percent: +(100 * tot / max).toFixed(1),
      rajjuSame: RAJJU[a.nak] === RAJJU[b.nak],
      note: "Ashtakoota is a cultural compatibility convention. It is NOT a prediction, " +
            "NOT advice, and must never be the sole basis of a life decision."
    };
  }

  /* Monte Carlo assignment search: one-to-many or many-to-many.
   * Deterministic when a seed is supplied (reproducibility is a contract concern). */
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function monteCarloMatch(groupA, groupB, opts) {
    opts = opts || {};
    var iters = opts.iterations || 20000, seed = opts.seed == null ? 12345 : opts.seed;
    var rnd = mulberry32(seed);
    var n = Math.min(groupA.length, groupB.length);
    var score = [];                                       /* precompute pair matrix */
    for (var i = 0; i < groupA.length; i++) {
      score[i] = [];
      for (var j = 0; j < groupB.length; j++) score[i][j] = kutaScore(groupA[i], groupB[j]).total;
    }
    var idx = [], k;
    for (k = 0; k < groupB.length; k++) idx.push(k);
    var best = null;
    for (var it = 0; it < iters; it++) {
      for (k = idx.length - 1; k > 0; k--) { var s = Math.floor(rnd() * (k + 1)); var tmp = idx[k]; idx[k] = idx[s]; idx[s] = tmp; }
      var tot = 0, pairs = [];
      for (k = 0; k < n; k++) { tot += score[k][idx[k]]; pairs.push([k, idx[k], score[k][idx[k]]]); }
      if (!best || tot > best.total) best = { total: tot, pairs: pairs.slice(), iteration: it };
    }
    best.mean = +(best.total / n).toFixed(2);
    best.iterations = iters; best.seed = seed;
    best.disclaimer = "Monte Carlo search over a CULTURAL scoring convention. It optimises a " +
      "traditional point total; it does not model compatibility, and must not be used to " +
      "decide, rank, or exclude any person. Consent of every individual is assumed and required.";
    return best;
  }

  /* ============================================================ 7. MUHURTA
   * Given a range, rank candidate windows. Traditions are configurable. */
  var MUHURTA_TRADITIONS = {
    general:  { avoidTithi: [4,9,14,15+4,15+9,15+14], goodNak: [3,4,7,12,13,16,21,22,26], avoidVara: [2] },
    vivaha:   { avoidTithi: [4,9,14,15+4,15+9,15+14], goodNak: [0,4,7,11,12,13,20,21,25], avoidVara: [2,6] },
    griha:    { avoidTithi: [4,9,14],                 goodNak: [2,4,7,12,16,21,25],       avoidVara: [2,6] },
    yatra:    { avoidTithi: [4,9,14],                 goodNak: [0,4,7,12,16,21,25],       avoidVara: [2] },
    vidya:    { avoidTithi: [4,9,14],                 goodNak: [3,7,12,16,21,22],         avoidVara: [0] },
    vyapara:  { avoidTithi: [4,9,14],                 goodNak: [2,7,12,13,21,25],         avoidVara: [2] }
  };
  function abhijitWindow(jdn, lat, lonE) {
    var sr = sunriseUT(jdn, lat, lonE), ss = sunsetUT(jdn, lat, lonE), mid = (sr + ss) / 2;
    var half = (ss - sr) / 30;                    /* 1/15 of the day, centred on noon */
    return { start: mid - half, end: mid + half, name: "Abhijit" };
  }
  function findMuhurta(fromJdn, toJdn, lat, lonE, opts) {
    opts = opts || {};
    var trad = MUHURTA_TRADITIONS[opts.tradition] || MUHURTA_TRADITIONS.general;
    if (opts.rules) trad = Object.assign({}, trad, opts.rules);
    var out = [];
    for (var j = fromJdn; j <= toJdn; j++) {
      var sr = sunriseUT(j, lat, lonE);
      var p = C.panchanga(sr, null);
      var ti = tithiAt(sr, lat, lonE, "moment");
      var nakIdx = nakIndexAt(sr);
      var vara = (Math.floor(j + 1.5) % 7 + 7) % 7;
      var score = 50, why = [];
      if (trad.goodNak.indexOf(nakIdx) >= 0) { score += 25; why.push("auspicious nakshatra"); }
      if (trad.avoidTithi.indexOf(ti.index) >= 0) { score -= 30; why.push("rikta/avoided tithi"); }
      if (trad.avoidVara.indexOf(vara) >= 0) { score -= 15; why.push("avoided weekday"); }
      var m = masa(sr);
      if (m.adhika) { score -= 20; why.push("adhika masa"); }
      var g = jdn2greg(j);
      out.push({
        date: g.Y + "-" + String(g.M).padStart(2,"0") + "-" + String(g.D).padStart(2,"0"),
        jdn: j, score: score, reasons: why, tradition: opts.tradition || "general",
        nakshatra: C.NAK[nakIdx], tithi: ti.name, paksha: ti.paksha, masa: m.amanta,
        abhijit: abhijitWindow(j, lat, lonE), sunrise: sr, sunset: sunsetUT(j, lat, lonE)
      });
    }
    out.sort(function (a, b) { return b.score - a.score || a.jdn - b.jdn; });
    return { best: out.slice(0, opts.limit || 10), scanned: out.length,
             note: "Heuristic ranking over configurable rules. Consult a qualified " +
                   "practitioner for muhurta-critical decisions." };
  }

  /* ============================================================ 8. BATCH PANCHANGA */
  function batchPanchanga(fromJdn, toJdn, lat, lonE, opts) {
    opts = opts || {};
    var mode = opts.tithiMode || "sunrise", rows = [];
    for (var j = fromJdn; j <= toJdn; j++) {
      var sr = sunriseUT(j, lat, lonE), ss = sunsetUT(j, lat, lonE);
      var ti = tithiAt(sr, lat, lonE, mode === "sunrise" ? "moment" : mode);
      var m = masa(sr);
      var nakIdx = nakIndexAt(sr);
      var g = jdn2greg(j);
      rows.push({
        date: g.Y + "-" + String(g.M).padStart(2,"0") + "-" + String(g.D).padStart(2,"0"),
        jdn: j, masa: m.amanta, masaPurnimanta: m.purnimanta, adhika: m.adhika,
        paksha: ti.paksha, tithi: ti.name, tithiIndex: ti.index,
        nakshatra: C.NAK[nakIdx], sunriseUT: +sr.toFixed(5), sunsetUT: +ss.toFixed(5),
        dayLengthHours: +((ss - sr) * 24).toFixed(3)
      });
    }
    return rows;
  }
  function toCSV(rows) {
    if (!rows.length) return "";
    var keys = Object.keys(rows[0]);
    return keys.join(",") + "\n" + rows.map(function (r) {
      return keys.map(function (k) { return JSON.stringify(r[k] == null ? "" : r[k]); }).join(",");
    }).join("\n");
  }

  /* ============================================================ 9. NAME SUGGESTIONS
   * Traditional namakarana syllables by nakshatra pada. Deliberately a SHORT
   * seed list per syllable — the point is the syllable, not a baby-name db. */
  var PADA_SYLLABLES = [
    ["Chu","Che","Cho","La"],["Li","Lu","Le","Lo"],["Aa","Ee","Uu","Ae"],["O","Va","Vi","Vu"],
    ["Ve","Vo","Ka","Ki"],["Ku","Gha","Nga","Chha"],["Ke","Ko","Ha","Hi"],["Hu","He","Ho","Da"],
    ["Di","Du","De","Do"],["Ma","Mi","Mu","Me"],["Mo","Ta","Ti","Tu"],["Te","To","Pa","Pi"],
    ["Pu","Sha","Na","Tha"],["Pe","Po","Ra","Ri"],["Ru","Re","Ro","Ta"],["Ti","Tu","Te","To"],
    ["Na","Ni","Nu","Ne"],["No","Ya","Yi","Yu"],["Ye","Yo","Bha","Bhi"],["Bhu","Dha","Pha","Dha"],
    ["Bhe","Bho","Ja","Ji"],["Ju","Je","Jo","Kha"],["Ga","Gi","Gu","Ge"],["Go","Sa","Si","Su"],
    ["Se","So","Da","Di"],["Du","Tha","Jha","Na"],["De","Do","Cha","Chi"]
  ];
  var SEED_NAMES = {
    "Aa":["Aarav","Aadya"],"Ee":["Eesha","Eeshan"],"Cha":["Chandra","Charu"],"Chu":["Chudamani"],
    "Da":["Daksha","Damini"],"De":["Devika","Dev"],"Ga":["Gagan","Gauri"],"Ha":["Hari","Hamsa"],
    "Ja":["Jayant","Jaya"],"Ka":["Kalpana","Kartik"],"La":["Lalita","Lakshya"],"Ma":["Madhav","Maya"],
    "Na":["Nalin","Nandini"],"Pa":["Padma","Parth"],"Ra":["Rajat","Radha"],"Sa":["Samir","Saanvi"],
    "Sha":["Shakti","Shantanu"],"Ta":["Tara","Tanmay"],"Va":["Varun","Vani"],"Ya":["Yash","Yamini"],
    "Bha":["Bhaskar","Bhavya"],"Dha":["Dhruv","Dhara"],"Gu":["Guru","Gunika"],"Ki":["Kiran","Kirti"]
  };
  function nameSuggestions(moonSidLon) {
    var span = 360 / 27, nak = Math.floor(rev(moonSidLon) / span);
    var pada = Math.floor((rev(moonSidLon) - nak * span) / (span / 4));
    var syl = PADA_SYLLABLES[nak][pada];
    var alt = PADA_SYLLABLES[nak];
    var names = [];
    alt.forEach(function (s) { (SEED_NAMES[s] || []).forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); }); });
    return {
      nakshatra: C.NAK[nak], nakIndex: nak, pada: pada + 1,
      syllable: syl, padaSyllables: alt, rashi: C.RASHI[Math.floor(rev(moonSidLon) / 30)],
      seedNames: names,
      note: "Traditional namakarana gives the SYLLABLE; the name is the family's choice. " +
            "This is a short seed list, not a name database — discuss options with an AI or elders."
    };
  }

  /* ============================================================ 10. GEOCODE
   * Offline table first (works with no network, no key, no vendor — C32);
   * an optional resolver hook may be supplied by the host page. */
  var PLACES = [
    ["Delhi",28.6139,77.2090,5.5],["New Delhi",28.6139,77.2090,5.5],["Mumbai",19.0760,72.8777,5.5],
    ["Kolkata",22.5726,88.3639,5.5],["Chennai",13.0827,80.2707,5.5],["Bengaluru",12.9716,77.5946,5.5],
    ["Hyderabad",17.3850,78.4867,5.5],["Pune",18.5204,73.8567,5.5],["Ahmedabad",23.0225,72.5714,5.5],
    ["Jaipur",26.9124,75.7873,5.5],["Lucknow",26.8467,80.9462,5.5],["Varanasi",25.3176,82.9739,5.5],
    ["Patna",25.5941,85.1376,5.5],["Bhopal",23.2599,77.4126,5.5],["Nagpur",21.1458,79.0882,5.5],
    ["Guwahati",26.1445,91.7362,5.5],["Bhubaneswar",20.2961,85.8245,5.5],["Kochi",9.9312,76.2673,5.5],
    ["Thiruvananthapuram",8.5241,76.9366,5.5],["Amritsar",31.6340,74.8723,5.5],["Srinagar",34.0837,74.7973,5.5],
    ["Ujjain",23.1765,75.7885,5.5],["Puri",19.8135,85.8312,5.5],["Tirupati",13.6288,79.4192,5.5],
    ["Kurukshetra",29.9695,76.8783,5.5],["Dwarka",22.2394,68.9678,5.5],["Mathura",27.4924,77.6737,5.5],
    ["Ayodhya",26.7922,82.1998,5.5],["Kathmandu",27.7172,85.3240,5.75],["Dhaka",23.8103,90.4125,6.0],
    ["Colombo",6.9271,79.8612,5.5],["Karachi",24.8607,67.0011,5.0],["Lahore",31.5204,74.3587,5.0],
    ["London",51.5074,-0.1278,0.0],["New York",40.7128,-74.0060,-5.0],["San Francisco",37.7749,-122.4194,-8.0],
    ["Dubai",25.2048,55.2708,4.0],["Singapore",1.3521,103.8198,8.0],["Sydney",-33.8688,151.2093,10.0],
    ["Tokyo",35.6762,139.6503,9.0],["Toronto",43.6532,-79.3832,-5.0],["Nairobi",-1.2921,36.8219,3.0]
  ];
  function geocode(query, resolver) {
    var q = String(query || "").trim().toLowerCase();
    if (!q) return { matches: [], source: "none" };
    var hits = PLACES.filter(function (p) { return p[0].toLowerCase().indexOf(q) >= 0; })
                     .map(function (p) { return { name: p[0], lat: p[1], lon: p[2], tz: p[3], source: "offline" }; });
    if (hits.length) return { matches: hits, source: "offline" };
    if (typeof resolver === "function") return { matches: resolver(query) || [], source: "resolver" };
    return { matches: [], source: "offline",
             note: "Not in the offline table. Supply a resolver (any provider, or your own) " +
                   "or enter latitude/longitude directly — no vendor is required." };
  }

  /* ============================================================ 11. LAUNCH WINDOWS
   * Hohmann transfer + synodic period for every solar-system body core knows. */
  var BODIES = {
    Earth:{a:1.000,P:1.0000},
    Mercury:{a:0.387,P:0.2408}, Venus:{a:0.723,P:0.6152}, Mars:{a:1.524,P:1.8808},
    Jupiter:{a:5.203,P:11.862}, Saturn:{a:9.537,P:29.457}, Uranus:{a:19.191,P:84.017},
    Neptune:{a:30.069,P:164.79}, Pluto:{a:39.482,P:247.94}, Moon:{a:0.00257,P:0.0748},
    Ceres:{a:2.766,P:4.60}, Vesta:{a:2.362,P:3.63}
  };
  function launchWindows(fromBody, toBody, startJdn, count) {
    var A = BODIES[fromBody], B = BODIES[toBody];
    if (!A || !B) return { error: "unknown body", known: Object.keys(BODIES) };
    var aT = (A.a + B.a) / 2;
    var tof = 0.5 * Math.pow(aT, 1.5) * 365.25;                 /* days, Hohmann half-orbit */
    var syn = Math.abs(1 / (1 / A.P - 1 / B.P)) * 365.25;       /* days */
    var phase = 180 - (tof / (B.P * 365.25)) * 360;             /* required lead angle, deg */
    var out = [], n = count || 5;
    /* Scan forward for the epoch where the relative phase matches.
     * Uses the core's REAL ephemeris (planetLon / sunLon), not synthetic mean
     * motion: heliocentric longitude of Earth = geocentric Sun + 180; for the
     * other bodies core's planetLon is used and converted where needed.
     * Bodies core cannot supply fall back to mean motion, and say so. */
    var step = 1, t = startJdn, found = 0, guard = 0;
    var EPOCH = 2451543.5;                       /* JDN = dayNo + EPOCH */
    var hlon = function (name, jd) {
      var d = jd - EPOCH;
      if (name === "Earth") return rev(C.sunLon(d).lon + 180);
      try { var v = C.planetLon(name, d); if (isFinite(v)) return rev(v); } catch (e) {}
      return null;
    };
    var meanRel = function (jd) {
      var d = jd - 2451545.0;
      return rev((360 * d / (B.P * 365.25)) % 360 - (360 * d / (A.P * 365.25)) % 360);
    };
    var ephemeris = (hlon(fromBody, startJdn) != null && hlon(toBody, startJdn) != null);
    var rel = function (jd) {
      if (!ephemeris) return meanRel(jd);
      return rev(hlon(toBody, jd) - hlon(fromBody, jd));
    };
    var target = rev(phase), prev = rev(rel(t) - target);
    while (found < n && guard++ < 400000) {
      t += step;
      var cur = rev(rel(t) - target);
      if ((prev > 300 && cur < 60) || (prev < 60 && cur > 300)) {
        var g = jdn2greg(Math.round(t));
        out.push({
          window: found + 1,
          departUTC: g.Y + "-" + String(g.M).padStart(2,"0") + "-" + String(g.D).padStart(2,"0"),
          jdn: Math.round(t),
          transferDays: +tof.toFixed(1),
          arriveJdn: Math.round(t + tof),
          phaseAngleDeg: +target.toFixed(2)
        });
        found++; t += syn * 0.6;
        prev = rev(rel(t) - target); continue;
      }
      prev = cur;
    }
    return { from: fromBody, to: toBody, model: ephemeris ? "core-ephemeris" : "mean-motion",
             synodicDays: +syn.toFixed(1),
             transferDays: +tof.toFixed(1), requiredPhaseDeg: +target.toFixed(2), windows: out,
             note: "Idealised circular-coplanar Hohmann model for study. Not a mission plan." };
  }

  /* ============================================================ 12. MAHABHARATA MAPPER
   * The epic records specific sky states. This scans a year range and scores
   * each candidate against those constraints, reporting WHICH matched.
   * It settles nothing: it shows what the sky did, per constraint. */
  var MBH_CONSTRAINTS = [
    { id:"twin-eclipses-13d", weight:30, source:"Bhishma Parva 3",
      label:"A lunar and a solar eclipse separated by 13 days" },
    { id:"saturn-rohini",     weight:20, source:"Bhishma Parva 3",
      label:"Saturn afflicting Rohini" },
    { id:"mars-retro",        weight:15, source:"Bhishma Parva 3",
      label:"Mars retrograde near Magha/Jyeshtha" },
    { id:"jupiter-saturn-vishakha", weight:15, source:"Bhishma Parva 3",
      label:"Jupiter and Saturn near Vishakha" },
    { id:"bhishma-uttarayana",weight:20, source:"Anushasana Parva 167",
      label:"Winter solstice near Magha Shukla Ashtami" }
  ];
  function nakOf(t, lonFn) { return Math.floor(sid(lonFn(t), t) / (360 / 27)); }

  function mahabharataScan(fromYear, toYear, opts) {
    opts = opts || {};
    var lat = opts.lat == null ? 29.9695 : opts.lat;    /* Kurukshetra */
    var lon = opts.lon == null ? 76.8783 : opts.lon;
    var results = [];
    for (var Y = fromYear; Y <= toYear; Y++) {
      var matched = [], score = 0, detail = {};


      /* C1: two eclipses 13 days apart. Core's eclipses(dS,dE) works in dayNo
       * and returns [{type,d,dist,central}] — use it rather than a per-day probe. */
      var ecl = [];
      try {
        var raw = C.eclipses(dayNo(Y, 1, 1, 12), dayNo(Y, 12, 31, 12));
        if (Array.isArray(raw)) ecl = raw.slice().sort(function (a, b) { return a.d - b.d; });
      } catch (eE) { detail.eclipseError = String(eE && eE.message || eE); }
      detail.eclipseCount = ecl.length;
      for (var i = 1; i < ecl.length; i++) {
        var gap = ecl[i].d - ecl[i - 1].d;
        if (gap >= 12 && gap <= 14.5 && ecl[i].type !== ecl[i - 1].type) {
          matched.push("twin-eclipses-13d"); score += 30;
          detail.eclipsePair = {
            first:  { type: ecl[i-1].type, date: fmtDayNo(ecl[i-1].d) },
            second: { type: ecl[i].type,   date: fmtDayNo(ecl[i].d) },
            gapDays: +gap.toFixed(2) }; break;
        }
      }

      /* C2/C3/C4: planetary positions at autumn (war season) */
      var tWar = dayNo(Y, 10, 15, 12);
      try {
        var satNak = nakOf(tWar, function (t) { return C.planetLon("Saturn", t); });
        if (satNak === 3) { matched.push("saturn-rohini"); score += 20; }        /* Rohini = 3 */
        detail.saturnNakshatra = C.NAK[satNak];
        var marsNak = nakOf(tWar, function (t) { return C.planetLon("Mars", t); });
        var marsRetro = C.retro ? !!C.retro("Mars", tWar) : false;
        if (marsRetro && (marsNak === 9 || marsNak === 17)) { matched.push("mars-retro"); score += 15; }
        detail.marsNakshatra = C.NAK[marsNak]; detail.marsRetrograde = marsRetro;
        var jupNak = nakOf(tWar, function (t) { return C.planetLon("Jupiter", t); });
        if (Math.abs(jupNak - 15) <= 1 && Math.abs(satNak - 15) <= 2) {          /* Vishakha = 15 */
          matched.push("jupiter-saturn-vishakha"); score += 15;
        }
        detail.jupiterNakshatra = C.NAK[jupNak];
      } catch (e) { detail.planetError = String(e && e.message || e); }

      /* C5: winter solstice vs Magha Shukla Ashtami */
      try {
        var solstice = dayNo(Y, 12, 21, 12);
        var m = masa(solstice), ti = tithiAt(solstice, lat, lon, "moment");
        detail.solsticeMasa = m.amanta; detail.solsticeTithi = ti.name + " (" + ti.paksha + ")";
        var tnum = (ti.index % 15) + 1;
        if (m.amantaIndex === 10 && ti.paksha === "Shukla" && Math.abs(tnum - 8) <= 2) {
          matched.push("bhishma-uttarayana"); score += 20;
        }
      } catch (e2) { detail.solsticeError = String(e2 && e2.message || e2); }

      results.push({ year: Y, era: Y < 0 ? Math.abs(Y) + " BCE" : Y + " CE",
                     score: score, matched: matched, detail: detail });
    }
    results.sort(function (a, b) { return b.score - a.score || a.year - b.year; });
    return {
      range: [fromYear, toYear], location: { lat: lat, lon: lon, name: opts.place || "Kurukshetra" },
      constraints: MBH_CONSTRAINTS,
      ranked: results.slice(0, opts.limit || 20),
      scanned: results.length,
      proposedDates: [
        { year: -3067, by: "Achar (planetarium reconstruction)" },
        { year: -5561, by: "Oak (astronomy-software reconstruction)" },
        { year: -3139, by: "traditional Kali-yuga-adjacent reckoning" }
      ],
      caveat: "CHAKRA is a LOW-PRECISION heritage engine. Over 5,000 years the planetary " +
              "theories used here accumulate large errors, so this scan is an EXPLORATORY " +
              "instrument, not a dating result. It reports which textual constraints a year " +
              "satisfies under this model — it does not adjudicate between scholars, and the " +
              "verses themselves may be literal observation or poetic convention. Verify any " +
              "candidate against a high-precision ephemeris (e.g. JPL DE) before citing."
    };
  }

  /* ============================================================ 13. CHAKRA-BASIC
   * A tiny BASIC-like language so a user can extend CHAKRA without JS.
   * Deliberately minimal: LET, PRINT, IF/THEN, FOR/NEXT, GOTO, END + CHAKRA
   * built-ins. No eval, no host access — expressions are parsed, not executed. */
  function CBasic(api) {
    var BUILTINS = {
      TITHI:   function (jd) { return tithiAt(jd, 28.61, 77.21, "moment").index; },
      MASA:    function (jd) { return masa(jd).amantaIndex; },
      NAKSHATRA: function (d) { return nakIndexAt(d); },
      SUNRISE: function (jd, la, lo) { return sunriseUT(Math.floor(jd), la == null ? 28.61 : la, lo == null ? 77.21 : lo); },
      SUNSET:  function (jd, la, lo) { return sunsetUT(Math.floor(jd), la == null ? 28.61 : la, lo == null ? 77.21 : lo); },
      SUNLON:  function (jd) { return C.sunLon(jd).lon; },
      MOONLON: function (jd) { return C.moonLon(jd); },
      JD:      function (y, m, d) { return dayNo(y, m, d, 12); },
      ABS: Math.abs, INT: Math.floor, SQR: Math.sqrt, SIN: Math.sin, COS: Math.cos
    };
    if (api) for (var k in api) BUILTINS[k.toUpperCase()] = api[k];

    function tokenize(expr) {
      var re = /\s*([A-Za-z_][A-Za-z0-9_$]*|\d+\.?\d*|"[^"]*"|<=|>=|<>|.)/g, t, out = [];
      while ((t = re.exec(expr))) out.push(t[1]);
      return out;
    }
    function evalExpr(tokens, vars) {
      var pos = 0;
      function peek() { return tokens[pos]; }
      function next() { return tokens[pos++]; }
      function primary() {
        var tk = next();
        if (tk === "(") { var v = expr(); next(); return v; }
        if (tk === "-") return -primary();
        if (/^"/.test(tk)) return tk.slice(1, -1);
        if (/^\d/.test(tk)) return parseFloat(tk);
        var up = tk.toUpperCase();
        if (BUILTINS[up] && peek() === "(") {
          next(); var args = [];
          if (peek() !== ")") { args.push(expr()); while (peek() === ",") { next(); args.push(expr()); } }
          next(); return BUILTINS[up].apply(null, args);
        }
        return (tk in vars) ? vars[tk] : 0;
      }
      function term() { var v = primary(); while (peek() === "*" || peek() === "/") { var o = next(); var r = primary(); v = o === "*" ? v * r : v / r; } return v; }
      function add()  { var v = term();    while (peek() === "+" || peek() === "-") { var o = next(); var r = term();    v = o === "+" ? v + r : v - r; } return v; }
      function expr() {
        var v = add(), o = peek();
        if (o === "=" || o === "<" || o === ">" || o === "<=" || o === ">=" || o === "<>") {
          next(); var r = add();
          return o === "=" ? (v === r) : o === "<" ? (v < r) : o === ">" ? (v > r) :
                 o === "<=" ? (v <= r) : o === ">=" ? (v >= r) : (v !== r);
        }
        return v;
      }
      return expr();
    }

    function run(source, opts) {
      opts = opts || {};
      var maxSteps = opts.maxSteps || 20000;                 /* runaway guard */
      var lines = String(source).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      var prog = [], labels = {};
      lines.forEach(function (l, i) {
        var m = l.match(/^(\d+)\s+(.*)$/);
        if (m) { labels[m[1]] = prog.length; prog.push(m[2]); } else prog.push(l);
      });
      var vars = {}, out = [], pc = 0, steps = 0, forStack = [];
      while (pc < prog.length) {
        if (++steps > maxSteps) { out.push("?RUNAWAY — stopped after " + maxSteps + " steps"); break; }
        var line = prog[pc], mm;
        try {
          if (/^END$/i.test(line)) break;
          else if (/^REM\b/i.test(line)) { /* comment */ }
          else if ((mm = line.match(/^LET\s+([A-Za-z_]\w*)\s*=\s*(.+)$/i)))
            vars[mm[1]] = evalExpr(tokenize(mm[2]), vars);
          else if ((mm = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/)) && !/^(IF|FOR|PRINT|GOTO|NEXT)$/i.test(mm[1]))
            vars[mm[1]] = evalExpr(tokenize(mm[2]), vars);
          else if ((mm = line.match(/^PRINT\s*(.*)$/i))) {
            if (!mm[1]) out.push("");
            else out.push(mm[1].split(";").map(function (p) {
              var v = evalExpr(tokenize(p), vars);
              return (typeof v === "number" && !Number.isInteger(v)) ? +v.toFixed(6) : v;
            }).join(" "));
          }
          else if ((mm = line.match(/^IF\s+(.+?)\s+THEN\s+(.+)$/i))) {
            if (evalExpr(tokenize(mm[1]), vars)) {
              if (/^\d+$/.test(mm[2].trim())) { pc = labels[mm[2].trim()]; continue; }
              prog.splice(pc + 1, 0, mm[2]);                 /* inline consequent */
            }
          }
          else if ((mm = line.match(/^GOTO\s+(\d+)$/i))) {
            if (labels[mm[1]] == null) { out.push("?UNDEFINED LINE " + mm[1]); break; }
            pc = labels[mm[1]]; continue;
          }
          else if ((mm = line.match(/^FOR\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i))) {
            vars[mm[1]] = evalExpr(tokenize(mm[2]), vars);
            forStack.push({ v: mm[1], to: evalExpr(tokenize(mm[3]), vars),
                            step: mm[4] ? evalExpr(tokenize(mm[4]), vars) : 1, pc: pc });
          }
          else if (/^NEXT/i.test(line)) {
            var f = forStack[forStack.length - 1];
            if (!f) { out.push("?NEXT WITHOUT FOR"); break; }
            vars[f.v] += f.step;
            if ((f.step > 0 && vars[f.v] <= f.to) || (f.step < 0 && vars[f.v] >= f.to)) { pc = f.pc + 1; continue; }
            forStack.pop();
          }
          else out.push("?SYNTAX ERROR: " + line);
        } catch (e) { out.push("?ERROR: " + (e && e.message || e)); }
        pc++;
      }
      return { output: out, vars: vars, steps: steps };
    }
    return { run: run, builtins: Object.keys(BUILTINS) };
  }

  /* ============================================================ 14. STORE
   * Local save/load. Browser localStorage when present; an injectable backend
   * otherwise (so Node/tests and a self-hosted store work identically — C32). */
  function makeStore(backend) {
    var mem = {};
    var be = backend || (typeof localStorage !== "undefined" ? {
      get: function (k) { return localStorage.getItem(k); },
      set: function (k, v) { localStorage.setItem(k, v); },
      del: function (k) { localStorage.removeItem(k); },
      keys: function () { var a = []; for (var i = 0; i < localStorage.length; i++) a.push(localStorage.key(i)); return a; }
    } : {
      get: function (k) { return k in mem ? mem[k] : null; },
      set: function (k, v) { mem[k] = v; },
      del: function (k) { delete mem[k]; },
      keys: function () { return Object.keys(mem); }
    });
    var PFX = "chakra.saved.";
    return {
      save: function (name, obj) {
        var rec = { name: name, savedAt: new Date().toISOString(), ext: EXT_VERSION, core: C.version, data: obj };
        be.set(PFX + name, JSON.stringify(rec)); return rec;
      },
      load: function (name) { var s = be.get(PFX + name); return s ? JSON.parse(s) : null; },
      remove: function (name) { be.del(PFX + name); },
      list: function () { return be.keys().filter(function (k) { return k.indexOf(PFX) === 0; })
                                          .map(function (k) { return k.slice(PFX.length); }); },
      exportAll: function () {
        var o = {}; this.list().forEach(function (n) { o[n] = JSON.parse(be.get(PFX + n)); });
        return JSON.stringify({ tool: "CHAKRA", ext: EXT_VERSION, exported: new Date().toISOString(), saved: o }, null, 2);
      },
      importAll: function (json) {
        var d = JSON.parse(json), n = 0;
        for (var k in (d.saved || {})) { be.set(PFX + k, JSON.stringify(d.saved[k])); n++; }
        return n;
      }
    };
  }

  return {
    version: EXT_VERSION, coreVersion: C.version,
    toJDN: toJDN, yearOf: yearOf, sid: sid, nakIndexAt: nakIndexAt, fmtDayNo: fmtDayNo,
    sunriseUT: sunriseUT, sunsetUT: sunsetUT, dayLength: dayLength,
    MASA: MASA, masa: masa, tithiAt: tithiAt,
    FESTIVALS: FESTIVALS, RECURRING: RECURRING, festivals: festivals,
    VARGAS: VARGAS, vargaChart: vargaChart, allVargas: allVargas,
    kutaScore: kutaScore, monteCarloMatch: monteCarloMatch,
    MUHURTA_TRADITIONS: MUHURTA_TRADITIONS, findMuhurta: findMuhurta, abhijitWindow: abhijitWindow,
    batchPanchanga: batchPanchanga, toCSV: toCSV,
    nameSuggestions: nameSuggestions,
    PLACES: PLACES, geocode: geocode,
    BODIES: BODIES, launchWindows: launchWindows,
    MBH_CONSTRAINTS: MBH_CONSTRAINTS, mahabharataScan: mahabharataScan,
    CBasic: CBasic, makeStore: makeStore
  };
});
