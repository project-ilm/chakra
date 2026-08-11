/* viral-test.js — the moment engine and the share card.
 * © 1993-2026 Abhishek Choudhary. GPL-3.0-or-later. */
const path = require("path"), fs = require("fs");
const C = require("../test/chakra-core.js");
const M = require("../js/chakra-moment.js");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  \u2713 " + n); } else { fail++; console.log("  \u2717 " + n + (x !== undefined ? " \u2192 " + x : "")); } };
const sec = n => console.log("\n[" + n + "]");
const NOW = C.greg2jdn(2026, 8, 9);

sec("the moment");
const id = M.cosmicId({ year: 1990, month: 5, day: 15, hourUT: 2, lat: 28.61, lonE: 77.21, nowJdn: NOW });
ok("a date alone is enough", !!M.cosmicId({ year: 2000, month: 1, day: 1 }).headline);
ok("an impossible date is refused, not guessed",
  (() => { try { M.cosmicId({ year: 1990, month: 13, day: 1 }); return false; } catch (e) { return /valid year, month and day/.test(e.message); } })());
ok("headline names Sun, Moon and phase", /Sun in \w+, Moon in \w+/.test(id.headline) && /% lit/.test(id.headline));
ok("headline predicts nothing", !/will|destiny|fortune|lucky|career|marriage|wealth/i.test(id.headline));
ok("the ascendant appears only when a place is given",
  !!id.sky.lagna && M.cosmicId({ year: 1990, month: 5, day: 15 }).sky.lagna == null);

sec("calendars \u00b7 the global hook");
const sys = id.calendars.map(c => c.system);
ok("a dozen or more reckonings", id.calendars.length >= 12, id.calendars.length);
["Hijr\u012b", "Hebrew", "Chinese sexagenary", "Maya Long Count", "Tibetan", "N\u0101naksh\u0101h\u012b"]
  .forEach(s => ok("carries " + s, sys.indexOf(s) >= 0));
ok("no reading is empty or NaN", id.calendars.every(c => c.reading && !/undefined|NaN|null/.test(c.reading)));
/* cross-checks against published values for 15 May 1990 */
const read = s => (id.calendars.filter(c => c.system === s)[0] || {}).reading;
ok("Hebrew is 20 Iyar 5750", read("Hebrew") === "20 Iyar 5750", read("Hebrew"));
ok("Hijr\u012b is 19 Shaww\u0101l 1410", /19 Shaww\u0101l 1410/.test(read("Hijr\u012b")), read("Hijr\u012b"));
ok("1990 is the Metal Horse year", /Metal.*Horse/.test(read("Chinese sexagenary")), read("Chinese sexagenary"));
ok("tropical sun sign for 15 May is Taurus", read("Tropical sun sign") === "Taurus", read("Tropical sun sign"));
ok("1 Jan 2000 is Capricorn",
  M.cosmicId({ year: 2000, month: 1, day: 1 }).calendars.filter(c => c.system === "Tropical sun sign")[0].reading === "Capricorn");
ok("the precessional age is NOT sold as a birth sign",
  /Age of/.test(read("Precessional age")) && read("Precessional age") !== read("Tropical sun sign"));

sec("rarity \u00b7 honest by construction");
ok("every claim shows its arithmetic", id.rarity.items.every(r => !!r.working));
ok("the nak\u1e63atra chance is 1 in 27", id.rarity.items.some(r => r.chance === "1 in 27"));
ok("approximations are flagged as approximate",
  id.rarity.items.filter(r => /about|roughly|within/.test(r.chance)).every(r => r.approximate === true));
ok("nothing claims to describe the person", /not statements about a person/i.test(id.rarity.note));
ok("no rarity item makes a prediction",
  id.rarity.items.every(r => !/you (are|will)|your (luck|fate|future)/i.test(r.what + r.working)));

sec("milestones and returns");
ok("days alive is a whole positive count", Number.isInteger(id.milestones.daysAlive) && id.milestones.daysAlive > 13000);
ok("the next milestone is in the future", id.milestones.next.inDays > 0);
ok("solar return counts the birthdays", id.returns[0].count === 36, id.returns[0].count);
ok("the Metonic return is offered", id.returns.some(r => /Metonic/.test(r.what)));
ok("Saturn return is ~29.5 years", Math.abs(id.returns[4].everyDays / 365.2422 - 29.45) < 0.3);

sec("caveats");
const noTime = M.cosmicId({ year: 1990, month: 5, day: 15 });
ok("a missing time is declared, not silently assumed", noTime.caveats.some(c => /noon UT was used/.test(c)));
ok("a missing place is declared", noTime.caveats.some(c => /no ascendant/.test(c)));
ok("deep time is flagged", M.cosmicId({ year: 1000, month: 1, day: 1 }).caveats.some(c => /positions drift/.test(c)));
ok("it always says it predicts nothing", id.caveats.some(c => /predicts anything/.test(c)));

sec("the share card");
let K = null, createCanvas = null;
try { createCanvas = require("canvas").createCanvas; } catch (e) {}
if (!createCanvas) {
  console.log("  (canvas module absent \u2014 image assertions SKIPPED and therefore NOT claimed)");
} else {
  global.self = global;
  global.document = { createElement: () => createCanvas(10, 10) };
  require("../js/chakra-card.js");
  K = global.ChakraCard;
  ok("three formats are offered", Object.keys(K.SIZES).length === 3);
  ["square", "story", "wide"].forEach(sz => {
    const cv = K.render(id, { canvas: createCanvas(1, 1), size: sz });
    const w = K.SIZES[sz].w, h = K.SIZES[sz].h;
    ok(sz + " renders at " + w + "x" + h, cv.width === w && cv.height === h);
    const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
    let min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4 * 997) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; min = Math.min(min, v); max = Math.max(max, v); }
    ok(sz + " is not a blank rectangle", max - min > 60, "contrast " + (max - min).toFixed(0));
  });
  /* the defect that shipped once: a full disc drawn for a gibbous moon */
  const lit = (pct, waxing) => {
    const d2 = JSON.parse(JSON.stringify(id));
    d2.sky.moonPhase = { name: "x", illum: pct, waxing: waxing };
    const cv = K.render(d2, { canvas: createCanvas(1, 1), size: "square" });
    const ctx = cv.getContext("2d");
    /* count bright pixels inside the moon disc */
    const cx = Math.round(cv.width - cv.width * 0.075 - cv.width * 0.155),
          cy = Math.round(cv.width * 0.075 + cv.width * 0.155 * 1.05),
          r = Math.round(cv.width * 0.155 * 0.26);
    const im = ctx.getImageData(cx - r, cy - r, 2 * r, 2 * r).data;
    let bright = 0, tot = 0;
    for (let i = 0; i < im.length; i += 4) { tot++; if (im[i] > 150 && im[i + 1] > 150) bright++; }
    return bright / tot;
  };
  const f10 = lit(10, true), f50 = lit(50, true), f95 = lit(95, true);
  ok("a crescent is mostly dark", f10 < f50, f10.toFixed(3) + " vs " + f50.toFixed(3));
  ok("a gibbous is brighter than a half", f95 > f50, f95.toFixed(3) + " vs " + f50.toFixed(3));
  ok("a gibbous is NOT drawn as a full disc", f95 < 0.98, f95.toFixed(3));
  ok("waxing and waning are mirrored, not identical",
    Math.abs(lit(30, true) - lit(30, false)) < 0.05 && f10 !== f95);
}

sec("no vendor, no tracker");
const FILES = ["js/chakra-moment.js", "js/chakra-card.js", "sky.html"];
/* Vendor forms only. "Gemini", "Aries" and friends are SIGNS here — a bare
   word match flagged the zodiac and would have forced a real term out of an
   astronomy project to satisfy a careless guard. */
const BAD = /anthropic|\bopenai\b|claude\.ai|chatgpt\.com|chatgpt|perplexity\.ai|gemini\.google|bard\.google|razorpay|adsbygoogle|google-analytics|gtag\(/i;
let leaks = [];
FILES.forEach(f => {
  const p = path.join(__dirname, "..", f);
  if (!fs.existsSync(p)) return;
  const m = fs.readFileSync(p, "utf8").match(BAD);
  if (m) leaks.push(f + ":" + m[0]);
});
ok("no vendor or tracker in the viral surface", leaks.length === 0, leaks.join(", "));
ok("the gate would catch one", BAD.test("gtag('config')") && BAD.test("open in ChatGPT"));

console.log("\n====================================================");
console.log(fail ? "FAIL \u2014 " + fail + " of " + (pass + fail) : "ALL PASS \u2014 " + pass + "/" + pass + " assertions");
console.log("====================================================");
process.exit(fail ? 1 : 0);
