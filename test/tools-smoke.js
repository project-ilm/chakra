/* tools-smoke.js — boot tools.html from disk and drive every panel. */
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let html = fs.readFileSync(path.join(ROOT, "tools.html"), "utf8")
             .replace('src="src/chakra-core.js"', 'src="test/chakra-core.js"');
const errs = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => errs.push(e.message));
vc.on("error", e => errs.push(String(e)));
const dom = new JSDOM(html, {
  runScripts: "dangerously", resources: "usable",
  url: "file://" + path.join(ROOT, "tools.html"),
  virtualConsole: vc, pretendToBeVisual: true
});
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok   " + n); } else { fail++; console.log("  FAIL " + n + (x ? " -> " + x : "")); } };
const t0 = Date.now();
(function wait() {
  const w = dom.window, d = w.document;
  if (w.__toolsReady || Date.now() - t0 > 30000) {
    console.log("\n[tools.html]");
    ok("page booted", !!w.__toolsReady);
    ok("all libraries present",
      !!w.Chakra && !!w.ChakraPlus && !!w.ChakraMusic && !!w.ChakraCivic && !!w.ChakraCycler);
    ok("10 tabs rendered", d.querySelectorAll(".tab").length === 10, d.querySelectorAll(".tab").length);

    /* music */
    ok("every graha is selectable", d.querySelectorAll("#mzBodies .chip").length === w.ChakraMusic.BODIES.length);
    ok("scale list populated", d.querySelectorAll("#mzScale option").length >= 8);
    d.querySelector("#mzCsv"); d.querySelector("#mzPlay").click();
    const mzTxt = d.querySelector("#mzOut").textContent;
    ok("music reports honestly when audio is absent", /cannot play|Web Audio/.test(mzTxt), mzTxt.slice(0, 60));
    ok("music still computed the melody", /mode raw|notes/.test(mzTxt), mzTxt.slice(0, 60));

    /* batch */
    d.querySelector("#bGo").click();
    const bRows = d.querySelectorAll("#bOut tbody tr").length;
    ok("batch panchanga rows rendered", bRows > 20, bRows);
    ok("batch table names masa", /masa/i.test(d.querySelector("#bOut").textContent));

    /* electional + synthetic events */
    d.querySelector("#uGo").click();
    ok("electional search returns rows", d.querySelectorAll("#uOut tbody tr").length > 0);
    d.querySelector("#uGen").click();
    const uTxt = d.querySelector("#uOut").textContent;
    ok("synthetic events generated", d.querySelectorAll("#uOut tbody tr").length >= 5);
    ok("events declare themselves fictional", /fictional|No real person/.test(uTxt), uTxt.slice(0, 80));

    /* matching */
    d.querySelector("#mGo").click();
    ok("matching produces pairs", d.querySelectorAll("#mOut tbody tr").length > 0);
    ok("matching disclaimer visible in the panel",
      /not a measure of a person|consent/i.test(d.querySelector('.panel[data-p="match"]').textContent));

    /* calendars */
    d.querySelector("#kGo").click();
    ok("calendars read multiple reckonings", d.querySelectorAll("#kOut tbody tr").length >= 3,
       d.querySelectorAll("#kOut tbody tr").length);
    ok("hindu month present in calendars", /hindu month/i.test(d.querySelector("#kOut").textContent));

    /* place */
    d.querySelector("#pQ").value = "kol"; d.querySelector("#pGo").click();
    ok("place search finds a city offline", /Kolkata/.test(d.querySelector("#pOut").textContent));
    d.querySelector("#pQ").value = "zzzz"; d.querySelector("#pGo").click();
    ok("unknown place says so, never invents coordinates",
      /not in the built-in list/i.test(d.querySelector("#pOut").textContent));

    /* BASIC */
    d.querySelector("#zRun").click();
    const zTxt = d.querySelector("#zOut").textContent;
    ok("BASIC runs the sample program", zTxt.trim().length > 0 && !/^error/.test(zTxt), zTxt.slice(0, 50));
    d.querySelector("#zEx").click();
    ok("BASIC docs list statements and the sandbox", /SANDBOX/.test(d.querySelector("#zDoc").textContent));

    /* support + ads */
    const sup = d.querySelector("#supOut").textContent;
    ok("support shows placeholders as pending, not as live links",
      /Awaiting configuration/.test(sup) && d.querySelectorAll("#supOut a").length === 0, sup.slice(0, 60));
    const ad = d.querySelector("#adOut").textContent;
    ok("ads are inert and make no network call", /active: false/.test(ad) && /no network call/.test(ad));

    /* store */
    d.querySelector("#sSave").click();
    ok("a working set saves locally", !/No saved sets/.test(d.querySelector("#sOut").textContent),
       d.querySelector("#sOut").textContent.slice(0, 40));

    /* cycler (offline: must degrade honestly) */
    ok("cycler panel present with repo field", !!d.querySelector("#cyRepo"));

    ok("no uncaught page errors", errs.length === 0, errs.slice(0, 2).join(" | "));
    console.log("\n  tools: " + pass + " passed, " + fail + " failed");
    process.exit(fail ? 1 : 0);
  } else setTimeout(wait, 250);
})();
