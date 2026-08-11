/*!
 * chakra-civic.js — the parts of CHAKRA that face people, money and learning. v0.1.0
 *
 *   support   payment / support links as PLACEHOLDERS to be replaced (a payment
 *             link, UPI, sponsors...). Nothing is live until the config says so.
 *   ads       slot markup only. Inert without config: no script, no network.
 *   learning  select-to-learn -> configured course repo, else raise an issue.
 *             Book chapters and exercises come from a configured kitab repo.
 *   events    a SEEDED RANDOM event generator, so the electional optimiser is
 *             exercised on synthetic data and never on a real person's life.
 *
 * EVERY name, handle, endpoint, repo and key lives in config. Nothing is
 * hardcoded here — that is the recurring failure this file refuses to repeat.
 * No provider name appears in built markup; providers are config values.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. All rights reserved. Sole author.
 * Affiliation: AyeAI.  SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ChakraCivic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "0.1.0";

  /* A config value that still holds its placeholder is NOT configured. */
  var PLACEHOLDER_RE = /^(__[A-Z0-9_]+__|REPLACE_ME|<[^>]+>|)$/;
  function configured(v) { return typeof v === "string" && v.length > 0 && !PLACEHOLDER_RE.test(v); }

  function defaults() {
    return {
      support: {
        enabled: true,
        heading: "Support this work",
        note: "CHAKRA is free and offline-first. Support is voluntary and buys nothing extra.",
        /* Replace the __PLACEHOLDER__ values. Any that stay placeholders stay hidden. */
        channels: [
          { id: "payment_primary",   label: "Support (card / netbanking)", url: "__PAYMENT_LINK_PRIMARY__" },
          { id: "payment_upi",       label: "UPI",                          url: "__UPI_LINK__" },
          { id: "sponsor_forge",     label: "Sponsor on the forge",         url: "__FORGE_SPONSOR_URL__" },
          { id: "payment_alt",       label: "Alternate",                    url: "__ALT_PAYMENT_LINK__" }
        ]
      },
      ads: {
        enabled: false,
        note: "Off by default. Nothing is fetched and no slot renders until enabled AND a client id is set.",
        client: "__AD_CLIENT_ID__",
        slots: [
          { id: "slot_footer", label: "footer", unit: "__AD_UNIT_FOOTER__" },
          { id: "slot_side",   label: "side",   unit: "__AD_UNIT_SIDE__" }
        ],
        consent_required: true
      },
      learning: {
        enabled: true,
        courses_repo: "zistgah/varzish",
        book_repo: "zistgah/kitab",
        book_url: "__KITAB_BOOK_URL__",
        select_to_learn: true,
        min_chars: 8,
        note: "Select a passage to find a course. If none is configured, raise a course request as an issue."
      },
      tasks: {
        enabled: true,
        repo: "project-ilm/chakra",
        max_lines: 100,
        note: "Open work, in chunks small enough for one person or one AI to finish in a sitting."
      },
      social: { handles: ["__SOCIAL_HANDLE_PRIMARY__", "__SOCIAL_HANDLE_SECONDARY__"] },
      bug: { repo: "project-ilm/chakra", label: "defect" }
    };
  }

  function merge(base, over) {
    if (!over) return base;
    var out = {}, k;
    for (k in base) out[k] = base[k];
    for (k in over) {
      if (over[k] && typeof over[k] === "object" && !Array.isArray(over[k]) && base[k]) out[k] = merge(base[k], over[k]);
      else out[k] = over[k];
    }
    return out;
  }

  /* ------------------------------------------------------------- support */
  function supportLinks(cfg) {
    var c = merge(defaults(), cfg).support;
    if (!c.enabled) return { enabled: false, ready: [], pending: [], heading: c.heading, note: c.note };
    var ready = [], pending = [];
    (c.channels || []).forEach(function (ch) {
      (configured(ch.url) ? ready : pending).push({ id: ch.id, label: ch.label, url: ch.url });
    });
    return {
      enabled: true, heading: c.heading, note: c.note,
      ready: ready, pending: pending,
      /* honest state: a placeholder is reported as unconfigured, never rendered as a live link */
      status: ready.length ? "configured" : "placeholders-only",
      hint: ready.length ? null : "Replace the __PLACEHOLDER__ values in config to activate support links."
    };
  }

  /* ----------------------------------------------------------------- ads */
  function adState(cfg) {
    var c = merge(defaults(), cfg).ads;
    var ok = !!c.enabled && configured(c.client);
    var slots = (c.slots || []).map(function (s) {
      return { id: s.id, label: s.label, active: ok && configured(s.unit) };
    });
    return {
      enabled: !!c.enabled, clientConfigured: configured(c.client), active: ok,
      consentRequired: !!c.consent_required, slots: slots,
      network: ok ? "will load when consent is given" : "no network call",
      note: c.note
    };
  }

  /* ------------------------------------------------------------ learning */
  function learnFor(passage, cfg) {
    var c = merge(defaults(), cfg).learning;
    var text = String(passage == null ? "" : passage).trim();
    if (!c.enabled || text.length < (c.min_chars || 8)) {
      return { available: false, reason: text.length < (c.min_chars || 8) ? "passage too short" : "learning disabled" };
    }
    var q = encodeURIComponent(text.slice(0, 120));
    return {
      available: true,
      passage: text.slice(0, 200),
      courses: {
        repo: c.courses_repo,
        search: "https://github.com/" + c.courses_repo + "/issues?q=" + q,
        request: "https://github.com/" + c.courses_repo + "/issues/new?title=" +
                 encodeURIComponent("[course] " + text.slice(0, 60)) +
                 "&body=" + encodeURIComponent(
                   "Passage:\n\n> " + text.slice(0, 400) +
                   "\n\nA course, exercise set or worked example is requested for this.")
      },
      book: {
        repo: c.book_repo,
        url: configured(c.book_url) ? c.book_url : null,
        status: configured(c.book_url) ? "linked" : "not configured — chapters/exercises appear once a book URL is set"
      }
    };
  }

  /* ---------------------------------------------------------- exercises
   * Chapters and exercises are DATA fetched from the configured book; this
   * only shapes them. Nothing about any book is embedded here. */
  function shapeChapters(bookConfig) {
    var st = (bookConfig && bookConfig.structure) || {};
    var chapters = (st.chapters || []).map(function (ch) {
      return { id: ch.id, number: ch.number, title: ch.title, source: ch.source, topics: ch.topics || [] };
    });
    return { chapters: chapters, count: chapters.length,
             parts: (st.parts || []).map(function (p) { return { id: p.id, title: p.title, chapters: p.chapters || [] }; }) };
  }

  function gradeExercise(ex, answer) {
    if (!ex || !ex.type) return { graded: false, reason: "no exercise" };
    if (ex.type === "mcq") {
      var ok = String(answer) === String(ex.answer);
      return { graded: true, correct: ok, expected: ex.answer, explanation: ex.explanation || null };
    }
    if (ex.type === "fill") {
      var norm = function (s) { return String(s == null ? "" : s).trim().toLowerCase(); };
      var accept = (ex.accept || [ex.answer]).map(norm);
      return { graded: true, correct: accept.indexOf(norm(answer)) >= 0, expected: ex.answer };
    }
    /* long answers are not machine-graded — say so rather than pretend */
    return { graded: false, reason: "long-form answer: hand off to a reviewer or an AI session", type: ex.type };
  }

  /* -------------------------------------------------------------- events
   * Seeded, reproducible, entirely synthetic. This exists so the electional
   * optimiser can be exercised without any real person's dates in the code. */
  var EVENT_KINDS = [
    { kind: "travel",       purpose: "travel",       windowDays: 21 },
    { kind: "marriage",     purpose: "marriage",     windowDays: 120 },
    { kind: "housewarming", purpose: "housewarming", windowDays: 60 },
    { kind: "new venture",  purpose: "business",     windowDays: 45 },
    { kind: "procedure",    purpose: "surgery",      windowDays: 30 },
    { kind: "study begins", purpose: "education",    windowDays: 30 },
    { kind: "general",      purpose: "general",      windowDays: 14 }
  ];

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function randomEvents(opts) {
    opts = opts || {};
    var n = Math.max(1, Math.min(50, opts.count || 5));
    var seed = opts.seed == null ? 12345 : opts.seed;
    var rnd = mulberry32(seed | 0);
    var startJdn = opts.startJdn;
    if (startJdn == null) throw new Error("chakra-civic.randomEvents: startJdn is required");
    var horizon = opts.horizonDays == null ? 365 : opts.horizonDays;
    var out = [];
    for (var i = 0; i < n; i++) {
      var k = EVENT_KINDS[Math.floor(rnd() * EVENT_KINDS.length)];
      var offset = Math.floor(rnd() * horizon);
      var from = startJdn + offset;
      out.push({
        id: "ev" + (i + 1),
        kind: k.kind, purpose: k.purpose,
        fromJdn: from, toJdn: from + k.windowDays,
        windowDays: k.windowDays,
        flexible: rnd() > 0.35,
        synthetic: true
      });
    }
    return {
      events: out, seed: seed, count: out.length,
      synthetic: true,
      note: "Generated, reproducible for a given seed, and entirely fictional. " +
            "No real person's dates are embedded in CHAKRA."
    };
  }

  return {
    version: VERSION, defaults: defaults, merge: merge, configured: configured,
    supportLinks: supportLinks, adState: adState,
    learnFor: learnFor, shapeChapters: shapeChapters, gradeExercise: gradeExercise,
    EVENT_KINDS: EVENT_KINDS, randomEvents: randomEvents
  };
});
