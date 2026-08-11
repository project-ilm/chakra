/* test-ext.js — extension surface, executed against the real core.
 * Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later. */
var C = require("../src/chakra-core.js");
var E = require("../src/chakra-ext.js");
var pass = 0, fail = 0;
function ok(name, cond, got) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + "  got: " + got); }
}
var jdn = C.greg2jdn(2026, 8, 9), lat = 28.61, lon = 77.21;

/* rise/set: Delhi, 9 Aug — day length must be ~13.3h, never the 0.57h a wrong
 * epoch produces. This assertion exists because that exact error was made. */
var dl = E.dayLength(jdn, lat, lon) * 24;
ok("dayLength Delhi ~13.3h", dl > 12.5 && dl < 14.0, dl.toFixed(3));
var sr = E.sunriseUT(jdn, lat, lon), ss = E.sunsetUT(jdn, lat, lon);
ok("sunrise before sunset", sr < ss, sr + " / " + ss);

var m = E.masa(C.dayNo(2026, 8, 9, 12));
ok("masa names both schemes", !!m.amanta && !!m.purnimanta && !!m.paksha, JSON.stringify(m).slice(0, 60));

var t = E.tithiAt(C.dayNo(2026, 8, 9, 12));
ok("tithi index in 0..29", t.index >= 0 && t.index < 30, t.index);

var f = E.festivals(2026, lat, lon);
ok("festivals >= 50 in a year", f.length >= 50, f.length);
ok("festivals carry tradition+tags", !!f[0].tradition && !!f[0].tags, JSON.stringify(f[0]).slice(0, 60));

var v = E.allVargas(123.4);
ok("16 vargas returned", Object.keys(v).length === 16, Object.keys(v).length);

var k = E.kutaScore(5, 9);
ok("kuta total <= 36", k.total <= 36 && k.total >= 0, k.total);

var mc = E.monteCarloMatch([{name:"A",nak:5},{name:"B",nak:12}], [{name:"X",nak:9},{name:"Y",nak:20}], {trials:200, seed:42});
var mc2 = E.monteCarloMatch([{name:"A",nak:5},{name:"B",nak:12}], [{name:"X",nak:9},{name:"Y",nak:20}], {trials:200, seed:42});
ok("monte carlo is seed-reproducible", JSON.stringify(mc) === JSON.stringify(mc2), "differs");
ok("monte carlo carries a disclaimer", /cultural|not predictive|convention/i.test(mc.disclaimer || ""), mc.disclaimer);

var mu = E.findMuhurta(jdn, jdn + 7, lat, lon, { tradition: "vedic" });
ok("muhurta returns ranked windows", mu.best && mu.best.length > 0, JSON.stringify(mu).slice(0, 60));

var b = E.batchPanchanga(jdn, jdn + 2, lat, lon);
ok("batch panchanga 3 rows", b.length === 3, b.length);
ok("batch rows carry masa", !!b[0].masa, JSON.stringify(b[0]).slice(0, 60));
ok("CSV header matches keys", E.toCSV(b).split("\n")[0].indexOf("masa") >= 0, E.toCSV(b).split("\n")[0]);

/* DEFECT-1 regression: Earth must be a usable origin body. */
var lw = E.launchWindows("Earth", "Mars", jdn, 3);
ok("DEFECT-1 launchWindows Earth->Mars works", !lw.error && lw.windows && lw.windows.length === 3,
   JSON.stringify(lw).slice(0, 80));
/* physical sanity: Earth-Mars synodic ~779.9d, Hohmann transfer ~259d */
ok("Earth-Mars synodic ~780d", Math.abs(lw.synodicDays - 779.9) < 5, lw.synodicDays);
ok("Hohmann transfer ~259d", Math.abs(lw.transferDays - 259) < 8, lw.transferDays);
ok("windows spaced ~1 synodic period",
   Math.abs((lw.windows[1].jdn - lw.windows[0].jdn) - lw.synodicDays) < 25,
   lw.windows[1].jdn - lw.windows[0].jdn);

var ns = E.nameSuggestions(5);
ok("name suggestions give syllables", !!ns.syllable && ns.padaSyllables.length === 4, JSON.stringify(ns).slice(0, 60));

var gc = E.geocode("delhi");
ok("geocode resolves offline", gc.matches.length > 0 && gc.matches[0].lat > 28 && gc.matches[0].lat < 29, JSON.stringify(gc).slice(0, 60));

var mb = E.mahabharataScan({ fromYear: -3200, toYear: -3000 });
ok("mahabharata scan cites constraints", mb.constraints && mb.constraints.length > 0, JSON.stringify(mb).slice(0, 60));
ok("mahabharata constraints carry parva sources",
   mb.constraints.every(function (c) { return !!c.source; }), "missing source");

var bas = E.CBasic().run("10 LET X = TITHI(0)\n20 PRINT X");
ok("BASIC interpreter runs", bas.output.length === 1 && isFinite(+bas.output[0]), JSON.stringify(bas));

console.log("\n  ext tests: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
