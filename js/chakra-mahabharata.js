/*!
 * chakra-mahabharata.js — the Kurukṣetra sky-anchor mapper.  v0.1.0
 *
 * Vyāsa records specific celestial states around the war. Researchers convert
 * those verses into data points and search for a year whose computed sky matches.
 * This module does exactly that ON CHAKRA'S OWN EPHEMERIS, and reports the match
 * honestly — including where the instrument itself is not trustworthy.
 *
 * IT DOES NOT SETTLE THE DATE. Competing results (3067 BCE, 5561 BCE and others)
 * differ mainly on how the Sanskrit is READ, not on arithmetic. Two researchers
 * with the same ephemeris get different answers because they interpret
 * "Saturn afflicting Rohiṇī" or "Mars retrograde toward Maghā" differently, and
 * because pre-1000-BCE ΔT is itself uncertain. Read RESULT.caveats every time.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author. AyeAI.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    var tried = ["./chakra-core.js", "../src/chakra-core.js", "../js/chakra-core.js", "../test/chakra-core.js"], core = null, i;
    for (i = 0; i < tried.length; i++) { try { core = require(tried[i]); break; } catch (e) { } }
    var plus = require("./chakra-plus.js");
    if (!core) throw new Error("chakra-mahabharata: core not found. Tried " + tried.join(", "));
    module.exports = factory(core, plus);
  } else root.ChakraMB = factory(root.Chakra, root.ChakraPlus);
})(typeof self !== "undefined" ? self : this, function (Ck, P) {
  "use strict";
  var rev = Ck.rev, NAK = Ck.NAK;

  /* ---- The textual anchors, each carried with its citation ---- */
  var ANCHORS = [
    {
      id: "twin_eclipses", weight: 3,
      name: "Two eclipses within thirteen days",
      cite: "Bhīṣma Parva, ch. 3",
      says: "A lunar and a solar eclipse in one lunar fortnight, separated by thirteen days rather than the usual fourteen–fifteen.",
      why: "Rare geometry — the tightest filter available, because eclipse pairs are computable from first principles."
    },
    {
      id: "bhishma_uttarayana", weight: 2,
      name: "Bhīṣma waits for Uttarāyaṇa",
      cite: "Anuśāsana Parva, ch. 167",
      says: "He leaves his body on Māgha Śukla Aṣṭamī, after the Sun has turned northward (winter solstice).",
      why: "Ties a solar station (solstice) to a lunar date — a strong combined anchor."
    },
    {
      id: "balarama_42", weight: 2,
      name: "Balarāma's forty-two day pilgrimage",
      cite: "Śalya Parva, ch. 34",
      says: "Departed under Puṣya, returned under Śravaṇa, forty-two days later.",
      why: "A rigid celestial clock: the nakṣatra pair must be 42 days apart."
    },
    {
      id: "krishna_mission", weight: 1,
      name: "Kṛṣṇa's peace mission",
      cite: "Udyoga Parva, ch. 83",
      says: "Set out for Hāstinapura in Kārtika, on a day when the Moon was in Revatī.",
      why: "Month plus nakṣatra — a moderate constraint."
    },
    {
      id: "saturn_rohini", weight: 2,
      name: "Saturn afflicting Rohiṇī",
      cite: "Bhīṣma Parva, ch. 3",
      says: "Śani stationed in / oppressing the Rohiṇī constellation.",
      why: "Saturn's ~29.5-year cycle makes this repeat often; useful only in combination."
    },
    {
      id: "mars_retro", weight: 2,
      name: "Mars retrograde near Maghā / Jyeṣṭhā",
      cite: "Bhīṣma Parva, ch. 3",
      says: "Maṅgala moving backward (vakrī) toward Maghā.",
      why: "Retrogression is directly computable; the nakṣatra target is the contested part."
    },
    {
      id: "jup_sat_vishakha", weight: 1,
      name: "Jupiter and Saturn near Viśākhā",
      cite: "Bhīṣma Parva, ch. 3",
      says: "The two slow movers close to Viśākhā — a rare conjunction of slow planets.",
      why: "Jupiter–Saturn conjunctions recur ~every 20 years; the nakṣatra pins it."
    }
  ];

  function nakOf(sidLon) { return Math.floor(rev(sidLon) / (360 / 27)); }
  function nakName(i) { return NAK[i]; }
  var NAK_INDEX = {};
  NAK.forEach(function (n, i) { NAK_INDEX[typeof n === "string" ? n : n[0]] = i; });
  function nakIdxByName(name) {
    for (var i = 0; i < NAK.length; i++) {
      var n = NAK[i], s = (typeof n === "string") ? n : n[0];
      if (s.indexOf(name) === 0 || name.indexOf(s) === 0) return i;
    }
    return -1;
  }

  function sidGrahas(d) {
    var y = P.yearOf(d), g = Ck.grahas(d), a = Ck.ayan(y), out = {};
    for (var k in g) if (Object.prototype.hasOwnProperty.call(g, k)) out[k] = rev(g[k] - a);
    return out;
  }

  /* ---- individual anchor tests over one year ---- */

  function testTwinEclipses(Y) {
    var d0 = Ck.dayNo(Y, 1, 1, 0), d1 = Ck.dayNo(Y, 12, 31, 0);
    var ec;
    try { ec = Ck.eclipses(d0, d1); } catch (e) { return { hit: false, note: "eclipse scan failed" }; }
    var best = null;
    for (var i = 0; i < ec.length; i++) for (var j = 0; j < ec.length; j++) {
      if (i === j || ec[i].type === ec[j].type) continue;
      var gap = Math.abs(ec[i].d - ec[j].d);
      if (gap > 0 && gap < 16) {
        if (!best || Math.abs(gap - 13) < Math.abs(best.gap - 13)) best = { gap: gap, a: ec[i], b: ec[j] };
      }
    }
    if (!best) return { hit: false, note: "no solar/lunar pair inside 16 days this year", eclipses: ec.length };
    var hit = best.gap >= 12.0 && best.gap <= 14.5;
    return {
      hit: hit, gapDays: +best.gap.toFixed(2), eclipses: ec.length,
      pair: [Ck.d2date(best.a.d) + " (" + best.a.type + ")", Ck.d2date(best.b.d) + " (" + best.b.type + ")"],
      note: hit ? "pair separated by " + best.gap.toFixed(1) + " days" : "closest pair " + best.gap.toFixed(1) + " days"
    };
  }

  function testBhishma(Y) {
    /* winter solstice: Sun's tropical longitude = 270°, then the first Māgha Śukla Aṣṭamī after it */
    /* Do NOT assume the solstice sits in December: before 1582 the core's calendar
       is JULIAN, which drifts ~1 day/128 yr against the tropical year (~39 days by
       3000 BCE). Scan the whole year for the 270° crossing. */
    var f = function (x) { return ((rev(Ck.sunLon(x).lon - 270) + 180) % 360) - 180; };
    var y0 = Ck.dayNo(Y, 1, 1, 0), sols = null, m, i, a, b, fa;
    for (i = 0; i < 370; i++) {
      if (f(y0 + i) >= 0 && f(y0 + i + 1) < 0) { a = y0 + i; b = y0 + i + 1; break; }
      if (f(y0 + i) < 0 && f(y0 + i + 1) >= 0) { a = y0 + i; b = y0 + i + 1; break; }
    }
    if (a == null) return { hit: false, note: "solstice crossing not found in this year" };
    fa = f(a);
    for (i = 0; i < 50; i++) { m = (a + b) / 2; if (fa * f(m) <= 0) b = m; else { a = m; fa = f(m); } }
    sols = (a + b) / 2;
    for (i = 0; i < 70; i++) {
      var d = sols + i;
      var ds = Ck.d2date(d), pr = ds.match(/^(-?\d+)-(\d\d)-(\d\d)$/);
      if (!pr) continue;
      var y = P.yearOf(d);
      var hm = P.hinduMonth(d, y, "amanta");
      var ti = P.tithiIndexAt(d);
      if (hm.masa === "Māgha" && ti === 7) {
        return { hit: true, solstice: Ck.d2date(sols), date: ds, note: "Māgha Śukla Aṣṭamī, " + i + " days after solstice" };
      }
    }
    return { hit: false, solstice: Ck.d2date(sols), note: "no Māgha Śukla Aṣṭamī within 70 days of solstice" };
  }

  function testBalarama(Y) {
    var pushya = nakIdxByName("Puṣya"), shravana = nakIdxByName("Śravaṇa");
    if (pushya < 0 || shravana < 0) return { hit: false, note: "nakṣatra names unresolved" };
    var d0 = Ck.dayNo(Y, 1, 1, 6), best = null;
    for (var i = 0; i < 365; i++) {
      var d = d0 + i, y = P.yearOf(d);
      if (nakOf(rev(Ck.moonLon(d) - Ck.ayan(y))) !== pushya) continue;
      var d2 = d + 42, y2 = P.yearOf(d2);
      var n2 = nakOf(rev(Ck.moonLon(d2) - Ck.ayan(y2)));
      var off = Math.min(Math.abs(n2 - shravana), 27 - Math.abs(n2 - shravana));
      if (!best || off < best.off) best = { off: off, dep: Ck.d2date(d), ret: Ck.d2date(d2), got: nakName(n2) };
      if (off === 0) break;
    }
    if (!best) return { hit: false, note: "no Puṣya day found" };
    return {
      hit: best.off === 0, offNak: best.off, departure: best.dep, ret: best.ret,
      note: best.off === 0 ? "Puṣya → +42d → Śravaṇa exactly" : "closest: +42d lands on " + best.got + " (" + best.off + " nakṣatra away)"
    };
  }

  function testKrishna(Y) {
    var revati = nakIdxByName("Revatī");
    var d0 = Ck.dayNo(Y, 1, 1, 6);
    for (var i = 0; i < 365; i++) {
      var d = d0 + i, y = P.yearOf(d);
      if (nakOf(rev(Ck.moonLon(d) - Ck.ayan(y))) !== revati) continue;
      var hm = P.hinduMonth(d, y, "amanta");
      if (hm.masa === "Kārtika") return { hit: true, date: Ck.d2date(d), note: "Kārtika + Revatī" };
    }
    return { hit: false, note: "no Kārtika day with Moon in Revatī" };
  }

  function testSaturnRohini(Y) {
    var rohini = nakIdxByName("Rohiṇī");
    var d0 = Ck.dayNo(Y, 1, 1, 6), best = 99, when = null;
    for (var i = 0; i < 365; i += 5) {
      var g = sidGrahas(d0 + i), n = nakOf(g.Saturn);
      var off = Math.min(Math.abs(n - rohini), 27 - Math.abs(n - rohini));
      if (off < best) { best = off; when = Ck.d2date(d0 + i); }
    }
    return { hit: best === 0, offNak: best, when: when, note: best === 0 ? "Saturn in Rohiṇī" : "Saturn " + best + " nakṣatra from Rohiṇī" };
  }

  function testMarsRetro(Y) {
    var magha = nakIdxByName("Maghā"), jye = nakIdxByName("Jyeṣṭhā");
    var d0 = Ck.dayNo(Y, 1, 1, 6), found = null, best = 99;
    for (var i = 0; i < 365; i += 3) {
      var d = d0 + i;
      if (!Ck.retro("Mars", d)) continue;
      var g = sidGrahas(d), n = nakOf(g.Mars);
      var o = Math.min(
        Math.min(Math.abs(n - magha), 27 - Math.abs(n - magha)),
        Math.min(Math.abs(n - jye), 27 - Math.abs(n - jye)));
      if (o < best) { best = o; found = { date: Ck.d2date(d), nak: nakName(n) }; }
    }
    if (!found) return { hit: false, note: "Mars not retrograde at any sampled day this year" };
    return { hit: best <= 1, offNak: best, when: found.date, nak: found.nak, note: "Mars retrograde in " + found.nak + " (" + best + " from target)" };
  }

  function testJupSat(Y) {
    var vis = nakIdxByName("Viśākhā");
    var d0 = Ck.dayNo(Y, 1, 1, 6), best = 99, when = null, sep = null;
    for (var i = 0; i < 365; i += 5) {
      var g = sidGrahas(d0 + i);
      var s = Math.abs(((rev(g.Jupiter - g.Saturn) + 180) % 360) - 180);
      if (s > 30) continue;
      var n = nakOf(g.Jupiter);
      var o = Math.min(Math.abs(n - vis), 27 - Math.abs(n - vis));
      if (o < best) { best = o; when = Ck.d2date(d0 + i); sep = +s.toFixed(1); }
    }
    if (when == null) return { hit: false, note: "Jupiter–Saturn never within 30° this year" };
    return { hit: best <= 1, offNak: best, when: when, sepDeg: sep, note: "Jupiter–Saturn " + sep + "° apart, " + best + " nakṣatra from Viśākhā" };
  }

  var TESTS = {
    twin_eclipses: testTwinEclipses, bhishma_uttarayana: testBhishma,
    balarama_42: testBalarama, krishna_mission: testKrishna,
    saturn_rohini: testSaturnRohini, mars_retro: testMarsRetro,
    jup_sat_vishakha: testJupSat
  };

  /* DISCRIMINATING POWER — the honest correction to a naive percentage.
     An anchor satisfied by most years cannot date anything. Measured, not assumed. */
  function discriminatingPower(Yfrom, Yto, step) {
    step = step || 7;
    var counts = {}, n = 0;
    ANCHORS.forEach(function (a) { counts[a.id] = 0; });
    for (var Y = Yfrom; Y <= Yto; Y += step) {
      n++;
      ANCHORS.forEach(function (a) {
        var r; try { r = TESTS[a.id](Y); } catch (e) { r = { hit: false }; }
        if (r.hit) counts[a.id]++;
      });
    }
    var out = ANCHORS.map(function (a) {
      var frac = n ? counts[a.id] / n : 0;
      return {
        id: a.id, name: a.name, cite: a.cite, hitRate: +(100 * frac).toFixed(1),
        power: frac <= 0.05 ? "high" : frac <= 0.25 ? "moderate" : frac <= 0.6 ? "low" : "negligible",
        verdict: frac > 0.6
          ? "Satisfied by most years — a consistency check on the text, NOT a year discriminator."
          : frac > 0.25 ? "Weak on its own; useful only in combination."
            : "Genuinely selective."
      };
    });
    return {
      sampled: n, range: [Yfrom, Yto], step: step, anchors: out,
      lesson: "This is why the published debate needs ~140 observations, not seven. " +
        "Any single omen recurs; only a large simultaneous set is rare. A high percentage " +
        "from a handful of loose anchors means nothing on its own."
    };
  }

  /* INSTRUMENT HEALTH — C37: a miss caused by the tool being out of range is NOT
     evidence about the year. Measured against a property we can check: every year
     really has 4–7 eclipses. If the finder reports fewer, the geometry has drifted
     and this year's results are INADMISSIBLE, not negative. */
  function instrumentHealth(Y) {
    var n = 0;
    try { n = Ck.eclipses(Ck.dayNo(Y, 1, 1, 0), Ck.dayNo(Y, 12, 31, 0)).length; } catch (e) { n = 0; }
    var w = P.epochWarning(Y);
    var degraded = n < 4;
    return {
      eclipsesFound: n, expected: "4–7 in any real year",
      degraded: degraded, epoch: w,
      verdict: degraded
        ? "DEGRADED: the ephemeris has drifted enough that eclipse geometry is being missed. " +
        "Misses in this year are instrument artefacts and must NOT be read as evidence against the date."
        : "Nominal: eclipse density is physically plausible for this year."
    };
  }

  function scoreYear(Y, opt) {
    opt = opt || {};
    var only = opt.anchors || null, got = 0, max = 0, detail = {};
    ANCHORS.forEach(function (a) {
      if (only && only.indexOf(a.id) < 0) return;
      max += a.weight;
      var r;
      try { r = TESTS[a.id](Y); } catch (e) { r = { hit: false, note: "error: " + e.message }; }
      r.weight = a.weight; r.name = a.name; r.cite = a.cite;
      if (r.hit) got += a.weight;
      detail[a.id] = r;
    });
    var health = instrumentHealth(Y);
    return {
      year: Y, era: Y <= 0 ? (1 - Y) + " BCE" : Y + " CE",   /* astronomical numbering: year 0 exists */
      score: max ? +(100 * got / max).toFixed(1) : 0, matched: got, possible: max,
      anchors: detail, health: health,
      admissible: !health.degraded,
      note: health.degraded
        ? "SCORE NOT ADMISSIBLE — " + health.verdict
        : "Score computed on a nominally healthy ephemeris for this year."
    };
  }

  function searchYears(Yfrom, Yto, opt) {
    opt = opt || {};
    var step = opt.step || 1, out = [];
    for (var Y = Yfrom; Y <= Yto; Y += step) out.push(scoreYear(Y, opt));
    out.sort(function (a, b) { return b.score - a.score || a.year - b.year; });
    return {
      range: [Yfrom, Yto], step: step, examined: Math.floor((Yto - Yfrom) / step) + 1,
      inadmissible: out.filter(function (r) { return !r.admissible; }).length,
      best: out.slice(0, opt.top || 10), all: opt.keepAll ? out : undefined,
      caveats: caveats(Math.min(Math.abs(Yfrom), Math.abs(Yto)))
    };
  }

  /* Reference candidates published by researchers — shown for comparison only,
     never as CHAKRA's own claim. */
  var REFERENCE_YEARS = [
    { year: -3066, label: "3067 BCE", who: "planetarium-software chronology (Achar)", note: "Derived from the same verse set, treating them as literal eyewitness data." },
    { year: -5560, label: "5561 BCE", who: "alternative reading (Oak)", note: "Pushes far earlier by reading certain terms differently, notably Arundhatī–Vasiṣṭha." },
    { year: -3138, label: "3139 BCE", who: "traditional Kali-yuga-adjacent reckoning", note: "Close to the traditional 3102 BCE Kali epoch." },
    { year: -1792, label: "1793 BCE", who: "later-chronology proposals", note: "Argued by those who read the omens as literary rather than observational." }
  ];

  function caveats(minAbsYear) {
    var w = P.epochWarning(-Math.abs(minAbsYear));
    return [
      "CHAKRA IS NOT A DEEP-TIME EPHEMERIS. " + (w ? w.text : ""),
      "ΔT (the drift between uniform time and Earth's rotation) is uncertain by hours before ~1000 BCE, " +
      "which moves any computed eclipse across the globe and can change which day a tithi belongs to.",
      "The verses are read differently by different scholars. 'Saturn afflicting Rohiṇī' may mean occupying it, " +
      "aspecting it, or being stationary near it; 'Mars turning back toward Maghā' fixes a direction, not a degree. " +
      "The arithmetic here cannot settle a question that is textual.",
      "Ayanāṁśa is extrapolated linearly by the core (Lahiri form). Across five millennia that linear model is itself an approximation.",
      "Mainstream historians hold that the omens may be literary intensifiers rather than observations. " +
      "This tool takes no position; it shows what the sky computes to under one ephemeris.",
      "USE: study, teaching, and reproducing the METHOD. Not evidence, and not a dating claim."
    ];
  }

  return {
    version: "0.1.0",
    ANCHORS: ANCHORS, REFERENCE_YEARS: REFERENCE_YEARS,
    scoreYear: scoreYear, searchYears: searchYears, caveats: caveats,
    discriminatingPower: discriminatingPower, instrumentHealth: instrumentHealth,
    testTwinEclipses: testTwinEclipses, testBhishma: testBhishma, testBalarama: testBalarama,
    testKrishna: testKrishna, testSaturnRohini: testSaturnRohini, testMarsRetro: testMarsRetro,
    testJupSat: testJupSat,
    sidGrahas: sidGrahas, nakOf: nakOf
  };
});
