/* dom-smoke.js — boot the REAL pages in jsdom and assert they render.
 * Inspection is not verification: this executes the pages as a browser would.
 * Run: node test/dom-smoke.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n + (x ? " → " + x : "")); } }

function boot(page) {
  let html = fs.readFileSync(path.join(ROOT, page), "utf8");
  /* map the page's script srcs to the files as laid out in this bundle */
  html = html.replace('src="src/chakra-core.js"', 'src="test/chakra-core.js"');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(e.message));
  vc.on("error", e => errors.push(String(e)));
  const dom = new JSDOM(html, {
    runScripts: "dangerously", resources: "usable",
    /* file:// so the pages load their libraries FROM DISK — the suite must not
       depend on the public internet (and CHAKRA is an offline-first PWA). */
    url: "file://" + path.join(ROOT, page),
    virtualConsole: vc, pretendToBeVisual: true
  });
  return { dom, errors };
}

/* jsdom loads external scripts asynchronously; wait for them */
function waitFor(dom, testFn, ms) {
  return new Promise((res, rej) => {
    const t0 = Date.now();
    (function poll() {
      let good = false;
      try { good = testFn(dom.window); } catch (e) { }
      if (good) return res(true);
      if (Date.now() - t0 > (ms || 8000)) return res(false);
      setTimeout(poll, 60);
    })();
  });
}

(async function () {
  console.log("DOM smoke test — booting the real pages in jsdom\n");

  /* ---------------- kundali.html ---------------- */
  console.log("[kundali.html]");
  const k = boot("kundali.html");
  const kReady = await waitFor(k.dom, w => w.Chakra && w.ChakraPlus && w.document.querySelector("#summary").children.length > 0);
  ok("libraries load and the page computes on open", kReady);
  if (kReady) {
    const D = k.dom.window.document;
    ok("D1 chart is drawn (SVG has house cells)", D.querySelector("#d1chart").querySelectorAll("text").length >= 12,
      D.querySelector("#d1chart").querySelectorAll("text").length + " text nodes");
    ok("summary table populated with lagna & māsa",
      /Lagna/.test(D.querySelector("#summary").textContent) && /Māsa/.test(D.querySelector("#summary").textContent));
    ok("all 16 varga cards rendered", D.querySelectorAll(".vg").length === 16, D.querySelectorAll(".vg").length + " cards");
    ok("every varga card names its rule", Array.from(D.querySelectorAll(".vg .rule")).every(e => /rule:/.test(e.textContent)));
    ok("mahādaśā table has 9 rows + header", D.querySelector("#dasha").querySelectorAll("tr").length === 10);
    ok("antardaśā table populated", D.querySelector("#antar").querySelectorAll("tr").length >= 2);
    ok("nāmākṣara section rendered", /pāda/.test(D.querySelector("#names").textContent));
    ok("language chips rendered (16 languages)", D.querySelectorAll("#langs .pill").length === 16);
    ok("topic chips rendered", D.querySelectorAll("#topics .pill").length >= 10);
    ok("share buttons rendered incl. image share", D.querySelectorAll("#share button").length >= 7 && !!D.querySelector("#shareImg"));
    ok("city datalist populated", D.querySelectorAll("#cities option").length > 80,
      D.querySelectorAll("#cities option").length + " cities");
    ok("ad slot inert without config (no network call)", /disabled by default/.test(D.querySelector("#adslot").textContent));

    /* the AI prompt must actually carry the whole horoscope */
    D.querySelector('[data-ai="show"]').dispatchEvent(new k.dom.window.Event("click"));
    const p = D.querySelector("#promptPreview").value;
    ok("AI prompt carries grahas, all vargas, daśā and yogas",
      /GRAHAS/.test(p) && /VARGAS/.test(p) && /VIMŚOTTARĪ/.test(p) && /YOGAS/.test(p));
    ok("AI prompt carries the language instruction", /Reply ENTIRELY in: English/.test(p));
    ok("AI prompt forbids prediction and advice", /do not make predictions/i.test(p) && /medical/i.test(p));
    ok("AI prompt tells the model not to invent positions", /Do not invent positions/.test(p));
    ok("prompt contains no tracking or upload", !/fetch\(|XMLHttpRequest/.test(p));

    /* recompute with a deep-time date must surface the epoch warning */
    D.querySelector("#dob").value = "-1000-01-01";
    D.querySelector("#dob").value = "0900-06-15";
    D.querySelector("#calc").dispatchEvent(new k.dom.window.Event("click"));
    ok("far-from-present birth year raises the epoch notice",
      /Epoch notice/.test(D.querySelector("#epochWarn").textContent), D.querySelector("#epochWarn").textContent.slice(0, 40));
  }
  ok("no uncaught page errors", k.errors.length === 0, k.errors.slice(0, 2).join(" | "));

  /* ---------------- mahabharata.html ---------------- */
  console.log("\n[mahabharata.html]");
  const m = boot("mahabharata.html");
  const mReady = await waitFor(m.dom, w => w.ChakraMB && w.document.querySelectorAll(".anchor").length > 0
    && w.document.querySelector("#scoreOut").textContent.length > 0);
  ok("libraries load and the default year scores on open", mReady);
  if (mReady) {
    const D = m.dom.window.document;
    ok("all seven anchors rendered with citations",
      D.querySelectorAll(".anchor").length === 7 && D.querySelectorAll(".anchor .cite").length === 7);
    ok("each anchor shows the verse paraphrase", D.querySelectorAll(".anchor .says").length === 7);
    ok("each anchor shows a computed result", D.querySelectorAll(".anchor .res").length === 7);
    ok("instrument health is displayed", D.querySelector("#health").textContent.length > 20);
    ok("default (3067 BCE) is flagged DEGRADED / not admissible",
      /degraded/i.test(D.querySelector("#health").textContent) || /NOT ADMISSIBLE/.test(D.querySelector("#scoreOut").textContent),
      D.querySelector("#health").textContent.slice(0, 60));
    ok("reference candidates table populated & attributed",
      D.querySelector("#refs").querySelectorAll("tr").length >= 5);
    ok("caveats list rendered", D.querySelectorAll("#caveats li").length >= 6);
    ok("top warning states it is not evidence", /Nothing here is evidence/.test(D.querySelector("#topWarn").textContent));

    /* discriminating power must run and name a negligible anchor */
    D.querySelector("#dpFrom").value = "-800"; D.querySelector("#dpTo").value = "-700"; D.querySelector("#dpStep").value = "50";
    D.querySelector("#dpBtn").dispatchEvent(new m.dom.window.Event("click"));
    await new Promise(r => setTimeout(r, 900));
    ok("discriminating-power table renders", D.querySelector("#dpOut").querySelectorAll("tr").length >= 8);
    ok("the honest lesson is shown", /140 observations/.test(D.querySelector("#dpOut").textContent));

    /* range search */
    D.querySelector("#from").value = "-3070"; D.querySelector("#to").value = "-3060"; D.querySelector("#step").value = "1";
    D.querySelector("#searchBtn").dispatchEvent(new m.dom.window.Event("click"));
    await new Promise(r => setTimeout(r, 1500));
    ok("range search renders a ranking", D.querySelector("#searchOut").querySelectorAll("tr").length >= 5);
    ok("ranking explicitly disclaims being a probability/dating claim",
      /not a probability and not a dating claim/i.test(D.querySelector("#searchOut").textContent));
  }
  ok("no uncaught page errors", m.errors.length === 0, m.errors.slice(0, 2).join(" | "));

  console.log("\n" + "=".repeat(52));
  console.log(fail === 0 ? `ALL PASS — ${pass}/${pass} DOM assertions` : `FAIL — ${fail} of ${pass + fail} failed`);
  console.log("=".repeat(52));
  process.exit(fail === 0 ? 0 : 1);
})();
