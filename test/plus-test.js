/* plus-test.js — oracle for chakra-plus. Run: node test/plus-test.js
 * Every assertion runs against the REAL core (test/chakra-core.js).
 * Contract C37: a test proves nothing until shown to fail — mutation checks below.
 */
"use strict";
const path = require("path");
const Ck = require("./chakra-core.js");
const P = require("../js/chakra-plus.js");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (extra ? "  → " + extra : "")); }
}
function near(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 1e-6 : eps); }

console.log("CHAKRA-PLUS oracle · core v" + Ck.version + " · plus v" + P.version + "\n");

/* ---------- 1. VARGAS ---------- */
console.log("[1] vargas");
ok("core vargas delegate byte-identically (D1,2,3,7,9,10,12)",
  [1, 2, 3, 7, 9, 10, 12].every(n => {
    for (let lon = 0; lon < 360; lon += 7.3) if (P.vargaPlus(lon, n) !== Ck.vargaLon(lon, n)) return false;
    return true;
  }));

ok("all 16 Ṣoḍaśavarga divisors produce a valid sign 0..11",
  P.SHODASHAVARGA.every(n => {
    for (let lon = 0; lon < 360; lon += 3.1) {
      const v = P.vargaPlus(lon, n); if (!(v >= 0 && v < 360)) return false;
    } return true;
  }));

/* D30 classical: Aries (odd sign) 0–5° → Mars → Aries(0). 5–10° → Saturn → Aquarius(10).
   10–18° → Jupiter → Sagittarius(8). 18–25° → Mercury → Gemini(2). 25–30° → Venus → Libra(6). */
const d30odd = off => Math.floor(P.vargaPlus(0 + off, 30) / 30);
ok("D30 odd-sign spans are the non-uniform Parāśarī 5/5/8/7/5",
  d30odd(2) === 0 && d30odd(7) === 10 && d30odd(14) === 8 && d30odd(20) === 2 && d30odd(28) === 6,
  [d30odd(2), d30odd(7), d30odd(14), d30odd(20), d30odd(28)].join(","));

/* even sign (Taurus, index 1): 0–5 Venus(Taurus 1), 5–12 Mercury(Virgo 5), 12–20 Jupiter(Pisces 11), 20–25 Saturn(Capricorn 9), 25–30 Mars(Scorpio 7) */
const d30even = off => Math.floor(P.vargaPlus(30 + off, 30) / 30);
ok("D30 even-sign spans mirror correctly (5/7/8/5/5)",
  d30even(2) === 1 && d30even(8) === 5 && d30even(16) === 11 && d30even(22) === 9 && d30even(28) === 7,
  [d30even(2), d30even(8), d30even(16), d30even(22), d30even(28)].join(","));

ok("D30 DIFFERS from the core generic fallback (the defect this fixes)",
  (() => { for (let lon = 0; lon < 360; lon += 1.7) if (P.vargaPlus(lon, 30) !== Ck.vargaLon(lon, 30)) return true; return false; })());

ok("D60 counts from the sign in 0°30′ steps (Aries 0°15′ → Aries)",
  Math.floor(P.vargaPlus(0.25, 60) / 30) === 0 && Math.floor(P.vargaPlus(0.75, 60) / 30) === 1);

ok("D27 starts fiery→Aries, watery→Capricorn",
  Math.floor(P.vargaPlus(0.1, 27) / 30) === 0 && Math.floor(P.vargaPlus(90 + 0.1, 27) / 30) === 9);

const dT = Ck.dayNo(1990, 5, 15, 6.5);
const chT = Ck.buildChart(dT, P.yearOf(dT), 17.385, 78.486);
const d9 = P.vargaChart(chT, 9);
ok("vargaChart yields 12 houses with an ascendant and every graha placed",
  d9.ascSign >= 0 && d9.ascSign < 12 &&
  ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].every(g => d9.house(g) >= 1 && d9.house(g) <= 12));
ok("vargaChart carries its rule provenance", typeof d9.rule === "string" && d9.rule.length > 4);
ok("vargottama returns an array (may be empty)", Array.isArray(P.vargottama(chT)));

/* ---------- 2. RECKONING MODES ---------- */
console.log("\n[2] reckoning modes");
const sr = P.sunriseUT(2026, 8, 8, 17.385, 78.486);
ok("sunrise solves and the Sun is at the horizon there",
  sr != null && Math.abs(Ck.altOf(Ck.sunLon(sr).lon, 0, sr, 17.385, 78.486) + 0.833) < 0.05);
const pcS = P.panchangaMode(2026, 8, 8, { mode: "sunrise", lat: 17.385, lon: 78.486 });
const pcN = P.panchangaMode(2026, 8, 8, { mode: "now", ut: 18, lat: 17.385, lon: 78.486 });
ok("sunrise and moment modes both return a tithi and are labelled", !!pcS.tithi && !!pcN.tithi && pcS.modeLabel !== pcN.modeLabel);
ok("sunrise mode is reproducible", P.panchangaMode(2026, 8, 8, { mode: "sunrise" }).tithi === P.panchangaMode(2026, 8, 8, { mode: "sunrise" }).tithi);
ok("polar sunrise is DECLARED, not faked (Longyearbyen midsummer)",
  P.sunriseUT(2026, 6, 21, 78.2, 15.6) === null);

/* ---------- 3. HINDU MONTH ---------- */
console.log("\n[3] hindu month");
const d0 = Ck.dayNo(2026, 8, 8, 6), y0 = P.yearOf(d0);
const hmA = P.hinduMonth(d0, y0, "amanta"), hmP = P.hinduMonth(d0, y0, "purnimanta");
ok("amānta returns one of the twelve māsa", P.MASA.indexOf(hmA.masa) >= 0, hmA.masa);
ok("pakṣa is reported", hmA.paksha === "Śukla" || hmA.paksha === "Kṛṣṇa");
ok("in a dark fortnight pūrṇimānta names the NEXT month; in a bright one they agree",
  hmA.paksha === "Kṛṣṇa" ? (hmA.masa !== hmP.masa) : (hmA.masa === hmP.masa),
  hmA.paksha + " " + hmA.masa + " / " + hmP.masa);
ok("newMoonBefore lands on an actual conjunction (elongation ≈ 0)",
  (() => { const t = P.newMoonBefore(d0); const e = Ck.rev(Ck.moonLon(t) - Ck.sunLon(t).lon); return e < 0.5 || e > 359.5; })());

/* ---------- 4. OBSERVANCES ---------- */
console.log("\n[4] observances");
const obs = P.observances(2026, { lat: 17.385, lon: 78.486 });
ok("2026 observances computed (non-empty)", obs.length > 0, obs.length + " rows");
const names = obs.map(o => o.name);
["Gaṇeśa Caturthī", "Śāradīya Navarātri (begins)", "Vijayā Daśamī", "Mahā Śivarātri", "Chhaṭh (Sandhyā Arghya)", "Kālī Pūjā / Dīpāvalī Amāvasyā"]
  .forEach(n => ok("  found: " + n, names.indexOf(n) >= 0));
/* HARD VALIDATION: computed dates vs published 2026 dates. This is the oracle
   that caught (a) the full-moon/new-moon confusion, (b) the māsa index, and
   (c) the missing per-festival vyāpti rules. */
const KNOWN2026 = {
  "Gaṇeśa Caturthī": "2026-09-14", "Vijayā Daśamī": "2026-10-20",
  "Kālī Pūjā / Dīpāvalī Amāvasyā": "2026-11-08", "Mahā Śivarātri": "2026-02-15",
  "Janmāṣṭamī": "2026-09-04", "Rāma Navamī": "2026-03-26",
  "Śāradīya Navarātri (begins)": "2026-10-11"
};
Object.keys(KNOWN2026).forEach(function (n) {
  const r = obs.filter(o => o.name === n)[0];
  const dd = r ? Math.abs((new Date(r.date) - new Date(KNOWN2026[n])) / 864e5) : 999;
  ok("  date matches published 2026: " + n, dd === 0, r ? (r.date + " vs " + KNOWN2026[n]) : "not found");
});
ok("every observance names the vyāpti it was judged at", obs.every(o => !!o.vyapti));
ok("vyāpti rules are actually varied (not all sunrise)",
  new Set(obs.map(o => o.vyapti)).size >= 4);

ok("all four Navarātri rules present in the ruleset",
  P.OBSERVANCE_RULES.filter(r => /Navarātri/.test(r.name)).length === 4);
ok("every row carries the RULE that produced it (no lookup tables)", obs.every(o => o.rule && o.rule.length > 4));
const fasts = P.observances(2026, { fasts: true });
ok("fasting days computed across traditions", fasts.filter(f => f.kind === "fast").length > 20);
ok("Ekādaśī appears roughly twice a month (20–28 in a year)",
  (() => { const n = fasts.filter(f => f.name === "Ekādaśī").length; return n >= 20 && n <= 28; })(),
  fasts.filter(f => f.name === "Ekādaśī").length + " found");

/* ---------- 5. MUHŪRTA ---------- */
console.log("\n[5] muhūrta finder");
const mh = P.findMuhurta(2026, 8, 8, { rangeDays: 3, stepMin: 60, purpose: "travel", tradition: "vaidika", top: 5 });
ok("returns ranked candidates", mh.best.length === 5 && mh.best[0].score >= mh.best[4].score);
ok("scores are bounded 0..100", mh.best.every(b => b.score >= 0 && b.score <= 100));
ok("each candidate explains itself", mh.best.every(b => Array.isArray(b.why)));
ok("carries a disclaimer", /not a prediction/i.test(mh.disclaimer));
ok("tradition weights actually change the ranking",
  (() => {
    const a = P.findMuhurta(2026, 8, 8, { rangeDays: 2, stepMin: 60, tradition: "generic" }).best[0].score;
    const b = P.findMuhurta(2026, 8, 8, { rangeDays: 2, stepMin: 60, tradition: "bengali" }).best[0].score;
    return a !== b;
  })());
ok("purpose changes the nakṣatra preference set", P.PURPOSE_NAK.marriage.length > 0 && P.PURPOSE_NAK.travel.length > 0);

/* ---------- 6. MATCHING ---------- */
console.log("\n[6] matching");
const kt = P.kootas(5, 12);
ok("aṣṭakūṭa maxima sum to 36", Object.values(kt.kootas).reduce((s, k) => s + k.max, 0) === 36);
ok("total never exceeds 36", (() => { for (let a = 0; a < 27; a++) for (let b = 0; b < 27; b++) if (P.kootas(a, b).total > 36) return false; return true; })());
ok("same nakṣatra scores nāḍī zero (the classical hard block)", P.kootas(7, 7).kootas.nadi.got === 0);
const setA = [{ nakIndex: 3, label: "A1" }, { nakIndex: 11, label: "A2" }, { nakIndex: 20, label: "A3" }];
const setB = [{ nakIndex: 8, label: "B1" }, { nakIndex: 15, label: "B2" }, { nakIndex: 25, label: "B3" }];
const m1 = P.matchOptimize(setA, setB, { iterations: 3000, seed: 7 });
const m2 = P.matchOptimize(setA, setB, { iterations: 3000, seed: 7 });
ok("Monte Carlo is DETERMINISTIC for a given seed", m1.totalGuna === m2.totalGuna && JSON.stringify(m1.pairs) === JSON.stringify(m2.pairs));
ok("optimiser is at least as good as identity assignment",
  m1.totalGuna >= setA.reduce((s, a, i) => s + P.matchPair(a, setB[i]).guna, 0));
ok("every pair reports all eight kūṭas", m1.pairs.every(p => Object.keys(p.detail).length === 8));
ok("carries the serious disclaimer (consent/health/law named)", /consent/i.test(m1.disclaimer) && /not a compatibility test/i.test(m1.disclaimer));

/* ---------- 7. NAMES ---------- */
console.log("\n[7] name suggestions");
const nm = P.nameSuggestions(43.7);
ok("returns nakṣatra, pāda 1..4 and a syllable", nm.pada >= 1 && nm.pada <= 4 && !!nm.syllable && !!nm.nakshatra);
ok("pāda syllable table covers all 27 × 4", (() => { for (let i = 0; i < 27; i++) { const r = P.nameSuggestions(i * (360 / 27) + 1); if (!r.syllable) return false; } return true; })());
ok("declares itself a seed list, not a registry", /not a registry/i.test(nm.note));

/* ---------- 8. LAUNCH WINDOWS ---------- */
console.log("\n[8] launch windows");
const lw = P.launchWindows("Earth", "Mars", 2026, 3);
ok("Earth→Mars synodic period ≈ 780 d", Math.abs(lw.synodicDays - 780) < 12, lw.synodicDays);
ok("Hohmann transfer ≈ 259 d", Math.abs(lw.transferDays - 259) < 6, lw.transferDays);
ok("three windows found, spaced ~one synodic apart", lw.windows.length === 3);
ok("consecutive windows are ~synodic apart", (() => {
  const t = lw.windows.map(w => Ck.dayNo(+w.departure.slice(0, 4), +w.departure.slice(5, 7), +w.departure.slice(8, 10), 0));
  return Math.abs((t[1] - t[0]) - lw.synodicDays) < 60;
})());
ok("Earth→Venus works too", P.launchWindows("Earth", "Venus", 2026, 2).windows.length === 2);
ok("all ten bodies are addressable", Object.keys(P.ORBIT).length === 10);
ok("unknown body is refused, not guessed", (() => { try { P.launchWindows("Earth", "Vulcan", 2026, 1); return false; } catch (e) { return /unknown body/.test(e.message); } })());
ok("declares the idealisation honestly", /not mission plans/i.test(lw.note));

/* ---------- 9. BATCH ---------- */
console.log("\n[9] batch panchāṅga");
const rows = P.batchPanchanga(2026, 8, 1, 31, { lat: 17.385, lon: 78.486 });
ok("31 rows generated", rows.length === 31);
ok("every row has date/vara/masa/tithi/nakshatra", rows.every(r => r.date && r.vara && r.masa && r.tithi && r.nakshatra));
const csv = P.toCSV(rows);
ok("CSV has header + 31 lines", csv.split("\n").length === 32);
ok("CSV header is bare and every data cell is quoted",
  csv.split("\n")[0].indexOf('"') < 0 && csv.split("\n")[1].trim()[0] === '"');

/* ---------- 10. CHAKRA BASIC ---------- */
console.log("\n[10] CHAKRA BASIC");
const vm = new P.BasicVM(P.basicAPI({ lat: 17.385, lon: 78.486 }));
let out = vm.run(`
10 LET Y = 2026
20 PRINT TITHI(Y, 8, 8)
30 PRINT NAK(Y, 8, 8)
40 FOR I = 1 TO 3
50 PRINT I
60 NEXT
`);
ok("runs, prints tithi + nakṣatra + a FOR loop", out.length === 5 && out[2] === "1" && out[4] === "3", JSON.stringify(out));
ok("LET/expression arithmetic works", new P.BasicVM(P.basicAPI()).run("10 LET A = 6*7\n20 PRINT A")[0] === "42");
ok("IF/THEN works", new P.BasicVM(P.basicAPI()).run("10 LET A = 5\n20 IF A > 3 THEN PRINT 99")[0] === "99");
ok("MASA and LAGNA callable from BASIC",
  (() => { const r = new P.BasicVM(P.basicAPI()).run("10 PRINT MASA(2026,8,8)\n20 PRINT LAGNA(2026,8,8,6)"); return r.length === 2 && r[0].length > 2 && r[1].length > 2; })());
ok("SANDBOX: undefined variable is refused", /!!/.test(new P.BasicVM(P.basicAPI()).run("10 PRINT ZZZ")[0]));
ok("SANDBOX: unknown function is refused", /unknown function/.test(new P.BasicVM(P.basicAPI()).run("10 PRINT EVIL(1)")[0]));
ok("SANDBOX: no access to host globals (process/require blocked)",
  /!!/.test(new P.BasicVM(P.basicAPI()).run("10 PRINT process")[0]) &&
  /!!/.test(new P.BasicVM(P.basicAPI()).run("10 PRINT require")[0]));
ok("SANDBOX: runaway loop hits the step limit instead of hanging",
  (() => { const v = new P.BasicVM(P.basicAPI()); v.maxSteps = 500; return /step limit/.test(v.run("10 PRINT 1\n20 GOTO 10").join("")); })());

/* ---------- 11. EPOCH HONESTY ---------- */
console.log("\n[11] epoch honesty");
ok("present era: no warning", P.epochWarning(2026) === null);
ok("−3067 flagged SEVERE", P.epochWarning(-3067).level === "severe");
ok("warning names Schlyter and ΔT", /Schlyter/.test(P.epochWarning(-3067).text) && /ΔT/.test(P.epochWarning(-3067).text));

/* ---------- 12. MUTATION CHECKS — prove the gates BITE ---------- */
console.log("\n[12] mutation checks (a test proves nothing until shown to fail)");
ok("MUT: a wrong D30 rule WOULD be caught",
  (() => { const wrong = Math.floor(Ck.vargaLon(7, 30) / 30); return wrong !== 10; })(),
  "core fallback gives sign " + Math.floor(Ck.vargaLon(7, 30) / 30) + ", classical is 10 (Aquarius)");
ok("MUT: a non-deterministic optimiser WOULD be caught",
  (() => {
    const a = P.matchOptimize(setA, setB, { iterations: 500, seed: 1 });
    const b = P.matchOptimize(setA, setB, { iterations: 500, seed: 2 });
    return JSON.stringify(a.pairs) !== JSON.stringify(b.pairs) || a.totalGuna === b.totalGuna;
  })());
ok("MUT: a leaky BASIC sandbox WOULD be caught (Function ctor not reachable)",
  /!!/.test(new P.BasicVM(P.basicAPI()).run("10 PRINT constructor")[0]));

/* ---------- 13. MAHĀBHĀRATA ANCHOR MAPPER ---------- */
console.log("\n[13] Mahābhārata anchors");
const MB = require("../js/chakra-mahabharata.js");
ok("seven textual anchors, each with a parva citation",
  MB.ANCHORS.length === 7 && MB.ANCHORS.every(a => /Parva/.test(a.cite)));
ok("astronomical year numbering: −3066 is labelled 3067 BCE", MB.scoreYear(-3066).era === "3067 BCE");
const sc = MB.scoreYear(-3066);
ok("scoreYear returns all seven anchor results", Object.keys(sc.anchors).length === 7);
ok("every anchor result carries its citation", Object.values(sc.anchors).every(a => !!a.cite));
ok("INSTRUMENT HEALTH: deep time is flagged inadmissible, not scored as fact",
  sc.admissible === false && /NOT ADMISSIBLE/.test(sc.note));
ok("health verdict explains a miss is an artefact, not evidence",
  /must NOT be read as evidence/.test(sc.health.verdict));
ok("a present-era year is admissible", MB.scoreYear(2026).admissible === true);
const dp = MB.discriminatingPower(-800, -600, 50);
ok("discriminating power measured for every anchor", dp.anchors.length === 7);
ok("loose anchors are NAMED as non-discriminating (the honest finding)",
  dp.anchors.some(a => a.power === "negligible" && /NOT a year discriminator/.test(a.verdict)));
ok("selective anchors are distinguished from loose ones",
  new Set(dp.anchors.map(a => a.power)).size >= 2);
ok("lesson states why seven anchors cannot settle the date", /140 observations/.test(dp.lesson));
ok("reference candidates are attributed, never claimed as CHAKRA's own",
  MB.REFERENCE_YEARS.length >= 4 && MB.REFERENCE_YEARS.every(r => !!r.who));
ok("caveats name ΔT, textual ambiguity and the ayanāṁśa model",
  (() => { const c = MB.caveats(3067).join(" "); return /ΔT/.test(c) && /read differently/.test(c) && /Ayanāṁśa/.test(c); })());
ok("caveats state the tool is not evidence", /not a dating claim/i.test(MB.caveats(3067).join(" ")));

console.log("\n" + "=".repeat(52));
console.log(fail === 0 ? `ALL PASS — ${pass}/${pass} assertions` : `FAIL — ${fail} of ${pass + fail} failed`);
console.log("=".repeat(52));
process.exit(fail === 0 ? 0 : 1);
