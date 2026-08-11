/*!
 * chakra-shell.js — the layer every page carries.  v0.1.0
 *
 *   showcase   on the landing page: what CHAKRA can actually do, shown rather
 *              than hidden behind a menu
 *   work       a compact open-work strip: pull the open tasks, take a small one,
 *              cycle it with whatever assistant you already use
 *   support    support placeholders — pending text until replaced, never a
 *              dead link presented as live
 *   learn      select a passage -> a course if configured, else raise a request
 *   share      the page's own URL, with the site's handles from config
 *
 * Every name, handle, endpoint and repo is configuration. No vendor is named
 * here. Nothing renders that is not configured, and nothing is fetched that was
 * not asked for.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. All rights reserved. Sole author.
 * Affiliation: AyeAI.  SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root) {
  "use strict";

  var VERSION = "0.1.0";
  var CFG = null, CFG_URL = "config/chakra.config.json";

  /* What CHAKRA can do, in the order a newcomer should meet it. Pages that do
     not exist yet are simply not shown — the strip never advertises a 404. */
  var SHOWCASE = [
    { href: "kundali.html",     title: "Kuṇḍalī",        blurb: "Your chart, sixteen vargas, the daśā — printable." },
    { href: "panjika.html",     title: "পঞ্জিকা Panjika", blurb: "A Bengali-style almanac, computed for your own meridian." },
    { href: "tools.html#music", title: "Music of the Stars", blurb: "The real ephemeris, heard. Raw or scaled, alone or in Σ." },
    { href: "mahabharata.html", title: "Mahābhārata",    blurb: "Seven parva-cited sky anchors, scored honestly." },
    { href: "tools.html",       title: "Tools",          blurb: "Muhūrta, matching, batch pañcāṅga, calendars, BASIC." },
    { href: "pro.html",         title: "The sky",        blurb: "Drag a graha — or a star — and time moves with it." }
  ];

  function el(tag, attrs, html) {
    var e = root.document.createElement(tag), k;
    for (k in (attrs || {})) {
      if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function configured(v) {
    return typeof v === "string" && v.length > 0 && !/^(__[A-Z0-9_]+__|REPLACE_ME|)$/.test(v);
  }

  function loadConfig() {
    if (CFG) return Promise.resolve(CFG);
    if (typeof root.fetch !== "function") { CFG = {}; return Promise.resolve(CFG); }
    return root.fetch(CFG_URL)
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { CFG = j || {}; return CFG; })
      .catch(function () { CFG = {}; return CFG; });
  }

  /* ------------------------------------------------------------- showcase */
  function mountShowcase(host) {
    host = host || root.document.getElementById("chakra-showcase");
    if (!host) return null;
    var here = (root.location && root.location.pathname || "").split("/").pop();
    var items = SHOWCASE.filter(function (s) { return s.href.split("#")[0] !== here; });
    host.innerHTML =
      '<div class="cs-strip">' +
      items.map(function (s) {
        return '<a class="cs-card" href="' + esc(s.href) + '">' +
               '<span class="cs-t">' + esc(s.title) + "</span>" +
               '<span class="cs-b">' + esc(s.blurb) + "</span></a>";
      }).join("") + "</div>";
    return items.length;
  }

  /* ----------------------------------------------------------------- work */
  function mountWork(host, cfg) {
    host = host || root.document.getElementById("chakra-work");
    if (!host) return null;
    var C = (cfg && cfg.tasks) || {};
    if (C.enabled === false) { host.innerHTML = ""; return 0; }
    var repo = C.repo || "project-ilm/chakra", max = C.max_lines || 100;
    host.innerHTML =
      '<div class="cw"><b>Open work</b> — small pieces, cycled with any assistant. ' +
      '<button type="button" id="cwPull">Show what is open</button> ' +
      '<a href="https://github.com/' + esc(repo) + '/issues" target="_blank" rel="noopener">all issues \u2197</a>' +
      '<div id="cwList" class="cw-list"></div></div>';
    var btn = host.querySelector("#cwPull"), list = host.querySelector("#cwList");
    btn.addEventListener("click", function () {
      if (!root.ChakraCycler) { list.textContent = "The cycler is not loaded on this page."; return; }
      list.textContent = "reading\u2026";
      root.ChakraCycler.pull({ repo: repo, maxLines: max }).then(function (r) {
        if (!r.ok || !r.chunks || !r.chunks.length) {
          list.innerHTML = "Could not read the task list" + (r.reason ? " (" + esc(r.reason) + ")" : "") +
            '. <a href="' + esc((r && r.link) || ("https://github.com/" + repo + "/issues")) +
            '" target="_blank" rel="noopener">Open the issues \u2197</a>';
          return;
        }
        list.innerHTML = r.chunks.slice(0, 6).map(function (c) {
          return '<div class="cw-item"><a href="' + esc(c.url) + '" target="_blank" rel="noopener">#' +
                 c.number + " " + esc(c.title) + "</a> <span>" + esc(c.kind) + " \u00b7 \u2264" + max + " lines</span></div>";
        }).join("") + '<div class="cw-item"><a href="https://zistgah.org/alam/" target="_blank" rel="noopener">' +
        "Cycle one of these with an assistant \u2197</a></div>";
      });
    });
    return 1;
  }

  /* -------------------------------------------------------------- support */
  function mountSupport(host, cfg) {
    host = host || root.document.getElementById("chakra-support");
    if (!host) return null;
    if (!root.ChakraCivic) { host.innerHTML = ""; return 0; }
    var s = root.ChakraCivic.supportLinks(cfg);
    if (!s.enabled) { host.innerHTML = ""; return 0; }
    var h = '<div class="cs-sup"><b>' + esc(s.heading) + "</b> <span>" + esc(s.note) + "</span>";
    if (s.ready.length) {
      h += " " + s.ready.map(function (c) {
        return '<a class="cs-pay" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.label) + "</a>";
      }).join(" ");
    } else {
      h += ' <span class="cs-pending">Support links are not configured yet.</span>';
    }
    h += "</div>";
    host.innerHTML = h;
    return s.ready.length;
  }

  /* --------------------------------------------------------------- learn */
  function mountLearn(cfg) {
    if (!root.ChakraCivic) return 0;
    var L = (cfg && cfg.learning) || {};
    if (L.enabled === false || L.select_to_learn === false) return 0;
    var bar = el("div", { id: "chakra-learnbar", class: "cs-learn" });
    bar.style.display = "none";
    root.document.body.appendChild(bar);
    root.document.addEventListener("mouseup", function () {
      var sel = root.getSelection && root.getSelection();
      var text = sel ? String(sel).trim() : "";
      var info = root.ChakraCivic.learnFor(text, cfg);
      if (!info.available) { bar.style.display = "none"; return; }
      bar.innerHTML = '<a href="' + esc(info.courses.search) + '" target="_blank" rel="noopener">Find a course</a>' +
        ' <a href="' + esc(info.courses.request) + '" target="_blank" rel="noopener">Ask for one</a>' +
        (info.book.url ? ' <a href="' + esc(info.book.url) + '" target="_blank" rel="noopener">Read the chapter</a>' : "") +
        ' <button type="button" id="clClose">\u00d7</button>';
      bar.style.display = "block";
      var c = bar.querySelector("#clClose");
      if (c) c.addEventListener("click", function () { bar.style.display = "none"; });
    });
    return 1;
  }

  /* --------------------------------------------------------------- style */
  function style() {
    if (root.document.getElementById("chakra-shell-css")) return;
    var css =
      ".cs-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.5rem;margin:.8rem 0}" +
      ".cs-card{display:block;border:1px solid rgba(140,160,210,.28);border-radius:9px;padding:.6rem .7rem;" +
      "text-decoration:none;background:rgba(20,26,58,.5)}" +
      ".cs-card:hover{border-color:#d4a843}" +
      ".cs-t{display:block;font-weight:700;color:#e6bd5c;font-size:.92rem}" +
      ".cs-b{display:block;font-size:.76rem;color:#aeb8d8;margin-top:.15rem;line-height:1.35}" +
      ".cw{font-size:.82rem;color:#aeb8d8;margin:.7rem 0}" +
      ".cw b{color:#e6bd5c}" +
      ".cw button,.cs-pay{font:inherit;font-size:.74rem;background:transparent;border:1px solid #d4a843;" +
      "color:#d4a843;border-radius:5px;padding:.2rem .5rem;cursor:pointer;text-decoration:none;display:inline-block}" +
      ".cw-list{margin-top:.35rem}" +
      ".cw-item{font-size:.76rem;padding:.15rem 0}" +
      ".cw-item span{color:#828cb2;font-family:ui-monospace,monospace;font-size:.68rem}" +
      ".cs-sup{font-size:.8rem;color:#aeb8d8;margin:.7rem 0}" +
      ".cs-sup b{color:#e6bd5c}" +
      ".cs-pending{font-style:italic;opacity:.75}" +
      ".cs-learn{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);background:#060818;" +
      "border:1px solid #28305a;border-radius:8px;padding:.4rem .6rem;z-index:60;font-size:.76rem}" +
      ".cs-learn a{color:#d4a843;margin-right:.5rem;text-decoration:none}" +
      ".cs-learn button{background:none;border:none;color:#828cb2;cursor:pointer;font-size:.9rem}" +
      "@media print{.cw,.cs-sup,.cs-learn{display:none!important}}";
    var s = el("style", { id: "chakra-shell-css" }, css);
    root.document.head.appendChild(s);
  }

  function mountAll() {
    style();
    return loadConfig().then(function (cfg) {
      var r = {
        showcase: mountShowcase(null),
        work: mountWork(null, cfg),
        support: mountSupport(null, cfg),
        learn: mountLearn(cfg)
      };
      root.__chakraShell = r;
      return r;
    });
  }

  root.ChakraShell = {
    version: VERSION, SHOWCASE: SHOWCASE,
    loadConfig: loadConfig, mountShowcase: mountShowcase, mountWork: mountWork,
    mountSupport: mountSupport, mountLearn: mountLearn, mountAll: mountAll, configured: configured
  };

  if (root.document) {
    if (root.document.readyState === "loading")
      root.document.addEventListener("DOMContentLoaded", function () { mountAll(); });
    else mountAll();
  }
})(typeof self !== "undefined" ? self : this);
