/*!
 * chakra-site.js — shared page chrome for the CHAKRA site:
 * selectable colour themes (?theme=), social share bar, "Built with Claude"
 * badge, and — on the Pro observatory page only — per-view "how to prompt
 * an AI" popups. No storage, no network, no dependencies.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Distributed WITHOUT ANY WARRANTY. See <https://www.gnu.org/licenses/>.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ChakraSite = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ── themes: override sets for the :root custom properties ─────────── */
  var THEMES = {
    nocturne: { label: "Nocturne", vars: {} }, /* the built-in default */
    solar: { label: "Solar (light)", vars: {
      "--bg":"#eef1f8","--bg2":"#e2e7f2","--panel":"rgba(255,255,255,.82)","--panelb":"rgba(14,127,146,.25)",
      "--ink":"#1b2334","--dim":"#54658a","--faint":"#8b99ba",
      "--cy":"#0e7f92","--cy2":"#0a95b0","--amber":"#8f6206","--grn":"#177a4a","--mag":"#a63d7e","--vio":"#5a4bd1",
      "--sun":"#b57900","--moon":"#4d5b77","--mercury":"#5c6d80","--venus":"#b06a3a","--mars":"#c14a3c",
      "--jupiter":"#a5821f","--saturn":"#5f6d92","--uranus":"#0e7f92","--neptune":"#4a63c0","--pluto":"#7a4fb0",
      "--rahu":"#8452b0","--ketu":"#3f8a78" } },
    terminal: { label: "Amber terminal", vars: {
      "--bg":"#0a0700","--bg2":"#140d00","--panel":"rgba(22,14,0,.82)","--panelb":"rgba(255,176,0,.22)",
      "--ink":"#ffcf7a","--dim":"#c08a2e","--faint":"#7a5a1e",
      "--cy":"#ffb000","--cy2":"#ffd23e","--amber":"#ffb000","--grn":"#ffd23e","--mag":"#ff8f3e","--vio":"#ffcf7a",
      "--sun":"#ffb000","--moon":"#ffcf7a","--mercury":"#e0a840","--venus":"#ff9a4d","--mars":"#ff7a3c",
      "--jupiter":"#ffc040","--saturn":"#d0a050","--uranus":"#ffb000","--neptune":"#ffcf7a","--pluto":"#ff9a4d",
      "--rahu":"#ffb974","--ketu":"#d8a850" } },
    contrast: { label: "High contrast", vars: {
      "--bg":"#000","--bg2":"#000","--panel":"#000","--panelb":"#fff",
      "--ink":"#fff","--dim":"#e6e6e6","--faint":"#c9c9c9",
      "--cy":"#00e5ff","--cy2":"#7df4ff","--amber":"#ffd400","--grn":"#4dff6a","--mag":"#ff5ad1","--vio":"#b09cff",
      "--sun":"#ffd400","--moon":"#ffffff","--mercury":"#e6e6e6","--venus":"#ffb27a","--mars":"#ff7a6a",
      "--jupiter":"#ffe066","--saturn":"#cfd6ff","--uranus":"#00e5ff","--neptune":"#8fb0ff","--pluto":"#d0a8ff",
      "--rahu":"#d0a8ff","--ketu":"#8fe0c8" } }
  };
  var ALL_KEYS = (function () {
    var s = {};
    for (var t in THEMES) for (var k in THEMES[t].vars) s[k] = 1;
    return Object.keys(s);
  })();
  var current = "nocturne";

  function applyTheme(name) {
    if (!THEMES[name]) name = "nocturne";
    current = name;
    var st = document.documentElement.style;
    ALL_KEYS.forEach(function (k) { st.removeProperty(k); });
    var v = THEMES[name].vars;
    for (var k in v) st.setProperty(k, v[k]);
    document.querySelectorAll("select[data-themesel-el]").forEach(function (s) { s.value = name; });
    try {
      var u = new URL(location.href);
      if (name === "nocturne") u.searchParams.delete("theme"); else u.searchParams.set("theme", name);
      history.replaceState(null, "", u.pathname + (u.search || "") + u.hash);
    } catch (e) {}
    decorateNav();
  }
  function themedHref(href) {
    if (current === "nocturne") return href.replace(/([?&])theme=[^&#]*(&?)/, function (_, a, b) { return b ? a : ""; });
    try {
      var u = new URL(href, location.href);
      u.searchParams.set("theme", current);
      return u.pathname.split("/").pop() + u.search + u.hash;
    } catch (e) { return href; }
  }
  function decorateNav() {
    document.querySelectorAll("a[data-keep-theme]").forEach(function (a) {
      var base = a.getAttribute("data-href") || a.getAttribute("href");
      a.setAttribute("data-href", base);
      a.setAttribute("href", themedHref(base));
    });
  }
  function injectThemeSelect() {
    document.querySelectorAll("[data-themesel]").forEach(function (slot) {
      if (slot.querySelector("select")) return;
      var lab = document.createElement("label");
      lab.style.cssText = "display:inline-flex;gap:6px;align-items:center;font-size:11px;color:var(--dim)";
      lab.textContent = "theme";
      var sel = document.createElement("select");
      sel.setAttribute("data-themesel-el", "1");
      sel.style.cssText = "background:var(--bg2);color:var(--ink);border:1px solid var(--panelb);border-radius:6px;padding:3px 6px;font:inherit;font-size:11px";
      for (var k in THEMES) {
        var o = document.createElement("option");
        o.value = k; o.textContent = THEMES[k].label; sel.appendChild(o);
      }
      sel.value = current;
      sel.onchange = function () { applyTheme(sel.value); };
      lab.appendChild(sel); slot.appendChild(lab);
    });
  }

  /* ── share bar (plain intent links — no SDKs, no trackers) ─────────── */
  function shareTargets(url, title) {
    var u = encodeURIComponent(url), t = encodeURIComponent(title);
    return [
      ["X", "https://twitter.com/intent/tweet?text=" + t + "&url=" + u],
      ["WhatsApp", "https://wa.me/?text=" + t + "%20" + u],
      ["Telegram", "https://t.me/share/url?url=" + u + "&text=" + t],
      ["Facebook", "https://www.facebook.com/sharer/sharer.php?u=" + u],
      ["LinkedIn", "https://www.linkedin.com/sharing/share-offsite/?url=" + u],
      ["Reddit", "https://www.reddit.com/submit?url=" + u + "&title=" + t],
      ["Email", "mailto:?subject=" + t + "&body=" + u]
    ];
  }
  function copyText(txt, btn) {
    function done() { var old = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = old; }, 1400); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { legacy(); });
    else legacy();
    function legacy() {
      var ta = document.createElement("textarea");
      ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }
  function injectShare() {
    var url = location.href.split("#")[0];
    var title = document.title || "CHAKRA — Temporal Cycle Observatory";
    document.querySelectorAll("[data-sharebar]").forEach(function (slot) {
      if (slot.getAttribute("data-mounted")) return;
      slot.setAttribute("data-mounted", "1");
      var wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;align-items:center";
      var lbl = document.createElement("span");
      lbl.textContent = "share"; lbl.style.cssText = "font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-right:2px";
      wrap.appendChild(lbl);
      shareTargets(url, title).forEach(function (s) {
        var a = document.createElement("a");
        a.href = s[1]; a.target = "_blank"; a.rel = "noopener";
        a.textContent = s[0];
        a.style.cssText = "font-size:10.5px;color:var(--dim);border:1px solid var(--panelb);border-radius:999px;padding:3px 9px;text-decoration:none";
        a.onmouseenter = function () { a.style.color = "var(--cy2)"; };
        a.onmouseleave = function () { a.style.color = "var(--dim)"; };
        wrap.appendChild(a);
      });
      var cp = document.createElement("button");
      cp.textContent = "Copy link";
      cp.style.cssText = "font-size:10.5px;color:var(--dim);background:none;border:1px solid var(--panelb);border-radius:999px;padding:3px 9px;cursor:pointer;font-family:inherit";
      cp.onclick = function () { copyText(url, cp); };
      wrap.appendChild(cp);
      slot.appendChild(wrap);
    });
  }

  /* ── "Built with Claude" badge ──────────────────────────────────────── */
  function injectBadges() {
    document.querySelectorAll("[data-claude-badge]").forEach(function (slot) {
      if (slot.getAttribute("data-mounted")) return;
      slot.setAttribute("data-mounted", "1");
      var a = document.createElement("a");
      a.href = "https://www.anthropic.com/claude";
      a.target = "_blank"; a.rel = "noopener";
      a.textContent = "✦ Built with Claude";
      a.title = "This observatory was built in collaboration with Claude (Anthropic)";
      a.style.cssText = "font-size:10.5px;color:var(--dim);border:1px solid var(--panelb);border-radius:999px;padding:3px 10px;text-decoration:none;display:inline-block";
      slot.appendChild(a);
    });
  }

  /* ── Pro-page only: per-view "ask an AI about this" prompt popups ──── */
  var PROMPTS = {
    orrery: [
      ["Gears & commensurability", "I am looking at a geared orrery where each planetary cycle is a ring with period P years, and events are folded onto each ring as phase marks. Explain how phase-folding works, what it means when marks cluster at one phase, and how the Rayleigh test statistic R measures that clustering. Assume I know high-school trigonometry."],
      ["True vs schematic orbits", "Explain the difference between a schematic orrery (equal decorative rings) and true Keplerian orbits: semi-major axis a, eccentricity e, perihelion a(1−e), aphelion a(1+e), and why Mercury's orbit looks visibly off-centre while Venus's looks circular. Use Mercury (e≈0.206) and Neptune (e≈0.009) as examples."]
    ],
    timeline: [
      ["Reading a period stave", "I have a chart where each horizontal lane is one astronomical or calendrical cycle and vertical ticks mark when that cycle returns to its phase-zero. Explain how to read coincidences between lanes, and why cycles with an irrational period ratio never truly realign (quasiperiodicity)."],
      ["Metonic & Saros", "Explain the Metonic cycle (19 years ≈ 235 synodic months) and the Saros (≈18.03 years) — how each was discovered, what each predicts, and why lunisolar calendars and eclipse prediction both fall out of these near-commensurabilities."]
    ],
    wave: [
      ["Cycles as waveforms", "Explain how a periodic phenomenon with period P can be represented as sin(2π(t−t₀)/P), what changing the anchor t₀ does, and why summing several such waves produces beats. Then explain what a rectified or square version of the same cycle would model differently."],
      ["Beats & synodic periods", "Two planets have periods P₁ and P₂. Derive the synodic period 1/S = 1/P₁ − 1/P₂ and connect it to the beat frequency of two sine waves. Use Jupiter (11.86 y) and Saturn (29.46 y) to get the ≈19.86-year great conjunction cycle."]
    ],
    spectrum: [
      ["Rayleigh spectrum", "Explain the Rayleigh test: given event times t_i and a trial period P, you place each event at phase 2πt_i/P on a circle and measure the resultant vector length R. Why does R near 1 indicate phase coherence? How does scanning P produce a period spectrum, and what are its pitfalls (harmonics, small-N noise)?"],
      ["Periodograms in general", "Compare the Rayleigh test with the Lomb–Scargle periodogram and a chi-squared epoch-folding search for detecting periodicity in sparse event data. When is each appropriate?"]
    ],
    chaos: [
      ["Return maps", "Explain what a return map (Δₙ vs Δₙ₊₁ of inter-event intervals) reveals: fixed points mean strict periodicity, closed loops mean quasiperiodicity, structured scatter can mean deterministic chaos. How would I distinguish chaos from randomness with so few points?"],
      ["KAM & resonance", "Explain in accessible terms what KAM theory says about quasiperiodic orbits surviving perturbation, why near-rational period ratios lock into resonance, and give solar-system examples (Jupiter's Trojans 1:1, Neptune–Pluto 3:2, the Kirkwood gaps)."]
    ],
    lagna: [
      ["Ascendant geometry", "Explain astronomically what the ascendant (lagna) is: the ecliptic point rising on the eastern horizon, computed from local sidereal time, latitude, and the obliquity of the ecliptic. Derive why it moves through all 12 signs every day and why its speed varies with latitude."],
      ["Tropical vs sidereal", "Explain the difference between the tropical zodiac (anchored to the equinox) and the sidereal zodiac (anchored to the stars), what the ayanāṁśa is, why it grows ~50.3″/year due to precession, and how the Lahiri value is defined via Spica at 180°."]
    ],
    sky: [
      ["Alt-az from ecliptic", "Walk me through converting an ecliptic longitude/latitude to horizontal altitude and azimuth: ecliptic → equatorial (RA/Dec) via obliquity, then RA/Dec → alt/az via hour angle and observer latitude. I want the actual formulas with a worked example."],
      ["Why planets hug the ecliptic", "Explain why the Sun, Moon and planets all appear near one great circle in the sky (the ecliptic), what the ±5° lunar deviation means for eclipses, and how the nakṣatra system divides this band into 27 lunar mansions."]
    ],
    almanac: [
      ["Amānta month rule", "Explain the amānta lunisolar month: it runs new moon → new moon and is named after the sidereal sign the Sun enters within it; if the Sun enters no new sign, the month is adhika (intercalary) and carries no festivals. Show how this fixes Dīpāvalī to the Āśvina amāvāsyā and why an adhika month shifts festival dates in some years."],
      ["Why Hijrī dates differ", "Explain why tabular Sunni and Shia (Ithnā-ʿAsharī) Hijrī calendars can differ by a day: both use the 30-year cycle with 11 leap years but choose different leap-year sets. Also explain how sighting-based practice differs from both."]
    ],
    optimize: [
      ["Period fitting", "I have a handful of dated events and a fitted period P with phase-coherence r. Explain what it means to fit a period to sparse events, why small samples produce spuriously high coherence, and what cross-validation or surrogate-data tests would make the fit trustworthy."],
      ["Hand results to an AI", "Take the JSON block this observatory produced (events, candidate periods, coherence scores) and analyse it: check the period arithmetic, flag overfitting risks, propose which astronomical or calendrical cycle each candidate might correspond to, and suggest what additional events would confirm or break each fit."]
    ]
  };

  var AI_CTX = "Project: CHAKRA \u2014 Temporal Cycle Observatory. Repo: https://github.com/project-ilm/chakra (GPL-3.0-or-later). Read CONTEXT.md + CONTRACTS.md in the repo before proposing changes. Live site: https://project-ilm.github.io/chakra/\n\n";
  function aiWrap(t) { return AI_CTX + t; }

  function mountPromptFab() {
    if (document.body.getAttribute("data-page") !== "pro") return;
    var css = document.createElement("style");
    css.textContent =
      ".ck-fab{position:fixed;right:16px;bottom:16px;z-index:900;background:var(--panel);border:1px solid var(--panelb);color:var(--cy2);border-radius:999px;padding:9px 14px;font-family:var(--mono);font-size:12px;cursor:pointer;backdrop-filter:blur(8px)}" +
      ".ck-fab:hover{color:var(--ink);border-color:var(--cy)}" +
      ".ck-modal{position:fixed;inset:0;z-index:901;display:flex;align-items:center;justify-content:center;background:rgba(2,4,10,.66)}" +
      ".ck-card{max-width:640px;width:min(92vw,640px);max-height:80vh;overflow:auto;background:var(--bg2);border:1px solid var(--panelb);border-radius:10px;padding:18px}" +
      ".ck-card h3{margin:0 0 4px;font-size:14px;color:var(--ink)}" +
      ".ck-card .sub{font-size:11px;color:var(--dim);margin-bottom:12px}" +
      ".ck-p{border:1px solid var(--panelb);border-radius:8px;padding:10px;margin-bottom:10px}" +
      ".ck-p b{display:block;font-size:12px;color:var(--cy2);margin-bottom:6px}" +
      ".ck-p pre{white-space:pre-wrap;font-size:11px;color:var(--dim);margin:0 0 8px;font-family:var(--mono);line-height:1.45}" +
      ".ck-p button{font-size:10.5px;background:none;color:var(--cy2);border:1px solid var(--panelb);border-radius:999px;padding:3px 10px;cursor:pointer;font-family:inherit}" +
      ".ck-x{float:right;background:none;border:0;color:var(--dim);font-size:16px;cursor:pointer}";
    document.head.appendChild(css);
    var fab = document.createElement("button");
    fab.className = "ck-fab"; fab.textContent = "✦ Ask an AI about this view";
    fab.setAttribute("aria-haspopup", "dialog");
    document.body.appendChild(fab);
    fab.onclick = function () {
      var view = (document.querySelector(".tab.on") || {}).dataset ? (document.querySelector(".tab.on").dataset.v || "orrery") : "orrery";
      var list = PROMPTS[view] || PROMPTS.orrery;
      var m = document.createElement("div");
      m.className = "ck-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
      var card = document.createElement("div"); card.className = "ck-card";
      var x = document.createElement("button"); x.className = "ck-x"; x.textContent = "✕"; x.setAttribute("aria-label", "Close");
      card.appendChild(x);
      var h = document.createElement("h3"); h.textContent = "Seed an AI conversation — " + view; card.appendChild(h);
      var sub = document.createElement("div"); sub.className = "sub";
      sub.textContent = "Open a prompt directly in Claude or ChatGPT, or copy it anywhere. Each is prefixed with the repo + CONTEXT/CONTRACTS pointers, so the conversation can end in a pull request.";
      card.appendChild(sub);
      list.forEach(function (p) {
        var box = document.createElement("div"); box.className = "ck-p";
        var b = document.createElement("b"); b.textContent = p[0]; box.appendChild(b);
        var pre = document.createElement("pre"); pre.textContent = p[1]; box.appendChild(pre);
        var row = document.createElement("div");
        row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
        var btn = document.createElement("button"); btn.textContent = "Copy prompt";
        btn.onclick = function () { copyText(aiWrap(p[1]), btn); };
        row.appendChild(btn);
        var q = encodeURIComponent(aiWrap(p[1]));
        [["Claude \u2197", "https://claude.ai/new?q=" + q], ["ChatGPT \u2197", "https://chatgpt.com/?q=" + q]].forEach(function (Lk) {
          var a2 = document.createElement("a"); a2.textContent = Lk[0]; a2.href = Lk[1]; a2.target = "_blank"; a2.rel = "noopener";
          a2.style.cssText = "font-size:10.5px;color:var(--cy2);border:1px solid var(--panelb);border-radius:999px;padding:3px 10px;text-decoration:none;font-family:inherit";
          row.appendChild(a2);
        });
        box.appendChild(row); card.appendChild(box);
      });
      m.appendChild(card); document.body.appendChild(m);
      function close() { document.body.removeChild(m); document.removeEventListener("keydown", esc); }
      function esc(e) { if (e.key === "Escape") close(); }
      m.onclick = function (e) { if (e.target === m) close(); };
      x.onclick = close;
      document.addEventListener("keydown", esc);
    };
  }

  function init() {
    var name = "nocturne";
    try { name = new URL(location.href).searchParams.get("theme") || "nocturne"; } catch (e) {}
    applyTheme(name);
    injectThemeSelect();
    injectShare();
    injectBadges();
    mountPromptFab();
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  return { THEMES: THEMES, PROMPTS: PROMPTS, applyTheme: typeof document !== "undefined" ? applyTheme : null, version: "1.4.1" };
});
