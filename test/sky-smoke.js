/* sky-smoke.js — boot the viral page, build a card, prove the deep link. */
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let html = fs.readFileSync(path.join(ROOT, "sky.html"), "utf8")
             .replace('src="src/chakra-core.js"', 'src="test/chakra-core.js"');
const errs = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => errs.push(e.message));
vc.on("error", e => errs.push(String(e)));
const dom = new JSDOM(html, {
  runScripts: "dangerously", resources: "usable",
  url: "file://" + path.join(ROOT, "sky.html") + "?d=1990-05-15",
  virtualConsole: vc, pretendToBeVisual: true
});
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok   " + n); } else { fail++; console.log("  FAIL " + n + (x !== undefined ? " -> " + x : "")); } };
const t0 = Date.now();
(function wait() {
  const w = dom.window, d = w.document;
  if (w.__skyReady || Date.now() - t0 > 25000) {
    console.log("\n[sky.html]");
    ok("page boots", !!w.__skyReady);
    ok("engine and card renderer load", !!w.ChakraMoment && !!w.ChakraCard);
    ok("a shared link reproduces the moment without a click",
       d.querySelector("#out").style.display === "block", d.querySelector("#out").style.display);
    ok("the date from the URL was used", d.querySelector("#date").value === "1990-05-15");
    const head = d.querySelector("#head").textContent;
    ok("a headline a person would post", /Sun in .+Moon in /.test(head), head.slice(0, 60));
    ok("headline makes no prediction", !/will|destiny|fortune|luck|career|marriage/i.test(head));
    const cals = d.querySelectorAll("#cals tr").length;
    ok("a dozen or more calendars listed", cals >= 12, cals);
    const calTxt = d.querySelector("#cals").textContent;
    ok("reaches beyond India", /Hebrew/.test(calTxt) && /Maya/.test(calTxt) && /Hijr/.test(calTxt));
    ok("rarity shows its arithmetic", /1 in 27/.test(d.querySelector("#rar").textContent));
    ok("rarity disclaims being about the person",
       /not statements about/i.test(d.querySelector("#rar").textContent));
    ok("day count rendered", /\d{1,3},\d{3} days/.test(d.querySelector("#mile").textContent),
       d.querySelector("#mile").textContent.slice(0, 40));
    ok("returns include the ones nobody shows you",
       /Metonic/.test(d.querySelector("#rets").textContent) && /Saturn return/.test(d.querySelector("#rets").textContent));
    ok("caveats state what this is not",
       /predicts anything/.test(d.querySelector("#caveats").textContent));
    ok("share controls present", !!d.querySelector("#sh") && !!d.querySelector("#dl") && !!d.querySelector("#lnk"));
    ok("no uncaught page errors", errs.length === 0, errs.slice(0, 2).join(" | "));
    console.log("\n  sky: " + pass + " passed, " + fail + " failed");
    process.exit(fail ? 1 : 0);
  } else setTimeout(wait, 200);
})();
