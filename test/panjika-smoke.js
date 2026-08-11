/* panjika-smoke.js — boot panjika.html from disk and prove it computes. */
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let html = fs.readFileSync(path.join(ROOT, "panjika.html"), "utf8")
             .replace('src="src/chakra-core.js"', 'src="test/chakra-core.js"');
const errs = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => errs.push(e.message));
vc.on("error", e => errs.push(String(e)));
const dom = new JSDOM(html, {
  runScripts: "dangerously", resources: "usable",
  url: "file://" + path.join(ROOT, "panjika.html"),
  virtualConsole: vc, pretendToBeVisual: true
});
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok   " + n); } else { fail++; console.log("  FAIL " + n + (x ? " -> " + x : "")); } };
const t0 = Date.now();
(function wait() {
  const d = dom.window.document;
  const rows = d.querySelectorAll("#out tbody tr");
  if (rows.length > 0 || Date.now() - t0 > 30000) {
    console.log("\n[panjika.html]");
    ok("a Bengali month renders 28-33 days", rows.length >= 28 && rows.length <= 33, rows.length);
    const head = (d.querySelector(".masahead") || {}).textContent || "";
    ok("month header names the Bengali month + era", /\u0985|\u09ac|Bai|Jyai|\u09ac\u0999/.test(head) || /BS \d+/.test(head), head.slice(0, 60));
    const cells = rows.length ? Array.from(rows[0].querySelectorAll("td")).map(td => td.textContent.trim()) : [];
    ok("row carries date/vara/tithi/nakshatra", cells.length >= 10 && !!cells[0] && !!cells[2] && !!cells[3], cells.join("|").slice(0, 90));
    ok("sunrise is a clock time", /^\d\d:\d\d$/.test(cells[7] || ""), cells[7]);
    ok("sunset is a clock time", /^\d\d:\d\d$/.test(cells[8] || ""), cells[8]);
    const txt = d.body.textContent;
    ok("declares Drik vs Gupta Press divergence", /Bishuddha/.test(txt) && /Gupta Press/.test(txt));
    ok("ceremony windows rendered", d.querySelectorAll("#out .card").length >= 4, d.querySelectorAll("#out .card").length);
    ok("at least one observance found in the month",
       Array.from(rows).some(r => (r.querySelector("td.f") || {}).textContent), "none");
    ok("no uncaught page errors", errs.length === 0, errs.slice(0, 2).join(" | "));
    console.log("\n  panjika: " + pass + " passed, " + fail + " failed");
    process.exit(fail ? 1 : 0);
  } else setTimeout(wait, 250);
})();
