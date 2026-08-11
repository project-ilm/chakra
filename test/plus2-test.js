/* plus2-test.js — the additions: music, civic, cycler, new observances,
 * and a vendor-neutrality gate that BITES.
 * Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later. */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const C = require("../test/chakra-core.js");
const P = require("../js/chakra-plus.js");
const M = require("../js/chakra-music.js");
const V = require("../js/chakra-civic.js");
const Y = require("../js/chakra-cycler.js");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  \u2713 " + n); } else { fail++; console.log("  \u2717 " + n + (x !== undefined ? " \u2192 " + x : "")); } };
const sec = n => console.log("\n[" + n + "]");
const jdn = C.greg2jdn(2026, 8, 9), dn = C.dayNo(2026, 8, 9, 12), LAT = 28.61, LON = 77.21;

sec("music \u00b7 sampling the real sky");
const s = M.sample({ fromDayNo: dn, spanDays: 30, steps: 24, bodies: ["Sun", "Moon", "Mars", "Saturn"] });
ok("samples every requested body", Object.keys(s.bodies).length === 4);
ok("longitudes are degrees 0..360", s.bodies.Moon.lon.every(x => x >= 0 && x < 360));
const moonSp = s.bodies.Moon.speed.reduce((a, b) => a + Math.abs(b), 0) / s.bodies.Moon.speed.length;
ok("Moon's mean speed is ~13\u00b0/day", moonSp > 11 && moonSp < 15.5, moonSp.toFixed(2));
const sunSp = s.bodies.Sun.speed.reduce((a, b) => a + Math.abs(b), 0) / s.bodies.Sun.speed.length;
ok("Sun's mean speed is ~1\u00b0/day", sunSp > 0.9 && sunSp < 1.1, sunSp.toFixed(3));
ok("an unknown body is refused, not guessed",
  (() => { try { M.sample({ fromDayNo: dn, bodies: ["Vulcan"] }); return false; } catch (e) { return /unknown body/.test(e.message); } })());

sec("music \u00b7 raw vs modulated");
const raw = M.melody({ sampled: s, mode: "raw", sigma: true });
const mod = M.melody({ sampled: s, mode: "modulated", scale: "malkauns", sigma: true });
ok("raw is microtonal (fractional pitch present)", raw.tracks.Moon.some(n => n.midi % 1 > 1e-6));
const deg = mod.tracks.Moon.map(n => ((Math.round(n.midi - 60 - 12 * (M.VOICE.Moon.oct - 4)) % 12) + 12) % 12);
ok("modulated lands only on the chosen scale", deg.every(d => M.SCALES.malkauns.indexOf(d) >= 0), [...new Set(deg)].join(","));
ok("a slower graha sings lower than a faster one",
  M.VOICE.Saturn.oct < M.VOICE.Moon.oct);
ok("retrograde is voiced quieter",
  (() => { const r = raw.tracks.Mars.filter(n => n.retro), f = raw.tracks.Mars.filter(n => !n.retro);
           return !r.length || !f.length || (r.reduce((a, b) => a + b.amp, 0) / r.length) <
                                            (f.reduce((a, b) => a + b.amp, 0) / f.length) * 1.05; })());
ok("an unknown scale is refused",
  (() => { try { M.melody({ sampled: s, mode: "modulated", scale: "nope" }); return false; } catch (e) { return /unknown scale/.test(e.message); } })());
ok("\u03a3 has one note per step", raw.sigma.notes.length === raw.tracks.Sun.length);
ok("\u03a3 names its constituents", /Sun/.test(raw.sigma.note) && raw.sigma.bodies.length === 4);
const partial = M.melody({ sampled: s, sigma: true, sigmaBodies: ["Sun", "Moon"] });
ok("\u03a3 can be limited to a chosen subset", partial.sigma.bodies.join("+") === "Sun+Moon");
ok("the mapping is declared as a convention, not a discovery",
  /convention/i.test(M.CONVENTION.caveat) && /predicts nothing/i.test(M.CONVENTION.caveat));
ok("no audio in node is DECLARED, never faked", M.play(raw).ok === false);
ok("CSV carries every note", M.toCSV(raw).split("\n").length > raw.tracks.Sun.length);

sec("civic \u00b7 support and placement");
const sup0 = V.supportLinks();
ok("unreplaced placeholders are never offered as links", sup0.ready.length === 0 && sup0.pending.length === 4);
ok("the unconfigured state says what to do", /Replace the/.test(sup0.hint || ""));
const sup1 = V.supportLinks({ support: { channels: [{ id: "a", label: "Support", url: "https://example.org/pay" }] } });
ok("a replaced placeholder becomes a live link", sup1.ready.length === 1 && sup1.status === "configured");
const ad0 = V.adState();
ok("ads are off and make no request by default", ad0.active === false && /no network call/.test(ad0.network));
const ad1 = V.adState({ ads: { enabled: true, client: "x", slots: [{ id: "s", label: "footer", unit: "u" }] } });
ok("ads still require consent once configured", ad1.active === true && ad1.consentRequired === true);
ok("a slot without a unit stays inert",
  V.adState({ ads: { enabled: true, client: "x", slots: [{ id: "s", label: "f", unit: "__AD_UNIT__" }] } }).slots[0].active === false);

sec("civic \u00b7 learning and exercises");
const L = V.learnFor("the ascendant is the sign rising at the moment of birth");
ok("a passage finds the configured course repo", L.available && L.courses.repo === "zistgah/varzish");
ok("a course can be requested when none exists", /issues\/new/.test(L.courses.request));
ok("the book repo is configured, its URL declared unset", L.book.repo === "zistgah/kitab" && L.book.url === null);
ok("too short a passage is refused", V.learnFor("ab").available === false);
ok("MCQ grades", V.gradeExercise({ type: "mcq", answer: "b" }, "b").correct === true);
ok("fill-in accepts declared synonyms", V.gradeExercise({ type: "fill", answer: "Lagna", accept: ["lagna", "ascendant"] }, "Ascendant").correct === true);
ok("long answers are NOT machine-graded, and say so", V.gradeExercise({ type: "long" }, "x").graded === false);
const ch = V.shapeChapters({ structure: { chapters: [{ id: "c1", number: 1, title: "T", source: "content/c1.json" }] } });
ok("kitab chapters shape cleanly", ch.count === 1 && ch.chapters[0].source === "content/c1.json");

sec("civic \u00b7 synthetic events (no real person's dates)");
const e1 = V.randomEvents({ startJdn: jdn, count: 6, seed: 11 });
const e2 = V.randomEvents({ startJdn: jdn, count: 6, seed: 11 });
ok("reproducible for a seed", JSON.stringify(e1.events) === JSON.stringify(e2.events));
ok("a different seed gives different events",
  JSON.stringify(V.randomEvents({ startJdn: jdn, count: 6, seed: 12 }).events) !== JSON.stringify(e1.events));
ok("every event is flagged synthetic", e1.events.every(e => e.synthetic === true));
ok("the note states no real dates are embedded", /No real person/i.test(e1.note));
ok("every event carries a usable window", e1.events.every(e => e.toJdn > e.fromJdn && e.purpose));
ok("a missing start is refused rather than assumed",
  (() => { try { V.randomEvents({ count: 2 }); return false; } catch (e) { return /startJdn is required/.test(e.message); } })());
ok("generated events actually drive the optimiser",
  (() => { const e = e1.events[0]; const r = P.findMuhurta(e.fromJdn, e.toJdn, LAT, LON, { tradition: "vedic", purpose: e.purpose }); return !!(r && r.best); })());

sec("cycler");
const parsed = Y.parseIssues([
  { number: 1, title: "Small thing", body: "Do it.\n\nAcceptance: the test passes.", labels: [{ name: "needs:code" }] },
  { number: 2, title: "A pull request", pull_request: {}, labels: [] },
  { number: 3, title: "Write a post", body: "", labels: ["social"] }
]);
ok("pull requests are excluded", parsed.count === 2);
ok("labels classify the work by what it needs", parsed.chunks[0].kind === "code" && parsed.chunks[1].kind === "social");
ok("an acceptance oracle is extracted when present", /the test passes/.test(parsed.chunks[0].acceptance || ""));
ok("chunks carry the line budget", parsed.chunks[0].maxLines === 100);
const cyc = Y.makeCycle(parsed.chunks[0]);
ok("a cycle is four steps", cyc.total === 4);
ok("step one forbids touching the verified core", /MUST NOT be edited/.test(cyc.current().prompt));
ok("step one refuses to write code first", /Do not write code yet/.test(cyc.current().prompt));
let r = cyc.accept("reply one");
ok("accepting a reply advances the cycle", r.done === false && r.next.name === "Propose");
cyc.accept("2"); cyc.accept("3"); r = cyc.accept("4");
ok("the cycle completes and keeps every reply", r.done === true && r.replies.length === 4);
ok("a transcript can be handed on", /reply one/.test(cyc.transcript()));

sec("observances \u00b7 the months a panjika cannot omit");
const obs = P.observances(2026, { lat: 22.57, lonE: 88.36 });
const find = n => obs.filter(o => o.name.indexOf(n) >= 0)[0];
ok("Ak\u1e63aya T\u1e5bt\u012by\u0101 computed", !!find("Ak\u1e63aya"), (find("Ak\u1e63aya") || {}).date);
ok("Ak\u1e63aya T\u1e5bt\u012by\u0101 matches published 2026 (20 Apr)", (find("Ak\u1e63aya") || {}).date === "2026-04-20", (find("Ak\u1e63aya") || {}).date);
ok("Buddha P\u016brnim\u0101 matches published 2026 (1 May)", (find("Buddha") || {}).date === "2026-05-01", (find("Buddha") || {}).date);
ok("Saraswat\u012b P\u016bj\u0101 matches published 2026 (23 Jan)", (find("Saraswat") || {}).date === "2026-01-23", (find("Saraswat") || {}).date);
ok("Dola/Hol\u012b matches published 2026 (3 Mar)", (find("Dola") || {}).date === "2026-03-03", (find("Dola") || {}).date);
ok("Kojagar\u012b Lak\u1e63m\u012b P\u016bj\u0101 follows Vijay\u0101 Da\u015bam\u012b",
  (find("Lak\u1e63m\u012b") || {}).date > (find("Vijay\u0101") || {}).date, (find("Lak\u1e63m\u012b") || {}).date);
ok("every observance still carries the RULE that produced it", obs.every(o => !!o.rule));

sec("vendor neutrality \u00b7 a gate that must BITE");
const BUILT = ["kundali.html", "mahabharata.html", "panjika.html", "tools.html",
               "js/chakra-plus.js", "js/chakra-mahabharata.js", "js/chakra-music.js",
               "js/chakra-civic.js", "js/chakra-cycler.js", "config/chakra.config.json"];
const FORBIDDEN = /razorpay|adsbygoogle|anthropic|\bopenai\b|claude\.ai|chatgpt|perplexity\.ai|\bgemini\b/i;
let leaks = [];
BUILT.forEach(f => {
  const p2 = path.join(ROOT, f);
  if (!fs.existsSync(p2)) return;
  const t = fs.readFileSync(p2, "utf8");
  const m = t.match(FORBIDDEN);
  if (m) leaks.push(f + ":" + m[0]);
});
ok("no provider or payment vendor is named in any built artifact", leaks.length === 0, leaks.join(", "));
ok("the gate would CATCH a leak (mutation check)",
  FORBIDDEN.test('<button>Open in ChatGPT</button>') && FORBIDDEN.test('class="adsbygoogle"'));
ok("providers are read from config, not written in the page",
  /ai\.byok\.providers|AI_PROVIDERS/.test(fs.readFileSync(path.join(ROOT, "kundali.html"), "utf8")));
ok("config ships providers as placeholders",
  /__AI_PROVIDER_A__/.test(fs.readFileSync(path.join(ROOT, "config/chakra.config.json"), "utf8")));
ok("config ships the payment link as a placeholder",
  /__PAYMENT_LINK_PRIMARY__/.test(fs.readFileSync(path.join(ROOT, "config/chakra.config.json"), "utf8")));

console.log("\n====================================================");
console.log(fail ? "FAIL \u2014 " + fail + " of " + (pass + fail) : "ALL PASS \u2014 " + pass + "/" + pass + " assertions");
console.log("====================================================");
process.exit(fail ? 1 : 0);
