/*!
 * chakra-cycler.js — small work, cycled with any AI.  v0.1.0
 *
 * Pulls the OPEN tasks from a configured repo, parses them into chunks small
 * enough for one sitting (default: 100 lines of code, or a doc, or a post),
 * and runs the handoff loop:
 *
 *     copy prompt  ->  paste into YOUR AI  ->  copy its reply  ->  one click
 *     pastes the reply back AND copies the next prompt
 *
 * No key, no server, no vendor. The visitor drives their own AI session; we
 * only move text. Endpoints and repo names are config, never literals.
 *
 * HONESTY: the forge API is rate-limited for anonymous callers. When a fetch
 * fails this says so and offers the plain link — it never invents a task list.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. All rights reserved. Sole author.
 * Affiliation: AyeAI.  SPDX-License-Identifier: GPL-3.0-or-later
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ChakraCycler = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "0.1.0";

  var DEFAULTS = {
    repo: "project-ilm/chakra",
    api: "https://api.github.com",
    web: "https://github.com",
    maxLines: 100,
    perPage: 30,
    /* A chunk is judged by what it asks for, not by who does it (contract C36). */
    kinds: {
      "needs:code":     { label: "code",          size: "S", hint: "<= 100 lines, one file if possible" },
      "needs:visual":   { label: "interface",     size: "S", hint: "markup + styles, no new dependencies" },
      "needs:testing":  { label: "testing",       size: "S", hint: "run it, report what happened" },
      "needs:ontology": { label: "documentation", size: "S", hint: "a page or a section, plain language" },
      "needs:legal":    { label: "policy",        size: "M", hint: "wording, disclaimers, licence notes" },
      "needs:human":    { label: "judgement",     size: "?", hint: "a decision only the author can make" },
      "documentation":  { label: "documentation", size: "S", hint: "a page or a section" },
      "social":         { label: "social",        size: "S", hint: "a short post, no more than a screen" }
    }
  };

  function cfg(over) {
    var c = {}, k;
    for (k in DEFAULTS) c[k] = DEFAULTS[k];
    for (k in (over || {})) c[k] = over[k];
    return c;
  }

  /* --------------------------------------------------------------- parse
   * Turn forge issues into chunks. Pure — testable without a network. */
  function parseIssues(issues, options) {
    var c = cfg(options), out = [];
    (issues || []).forEach(function (it) {
      if (!it || it.pull_request) return;                 /* issues only, not PRs */
      var labels = (it.labels || []).map(function (l) { return typeof l === "string" ? l : l.name; });
      var kind = null, kk;
      for (kk = 0; kk < labels.length; kk++) { if (c.kinds[labels[kk]]) { kind = c.kinds[labels[kk]]; break; } }
      var body = String(it.body || "").trim();
      var acceptance = null;
      var m = body.match(/(?:acceptance|oracle|done when)\s*[:\-]?\s*([\s\S]{0,400})/i);
      if (m) acceptance = m[1].split("\n\n")[0].trim();
      out.push({
        number: it.number,
        title: String(it.title || "").trim(),
        kind: kind ? kind.label : "unclassified",
        size: kind ? kind.size : "?",
        hint: kind ? kind.hint : "scope it small; ask before growing it",
        labels: labels,
        body: body.slice(0, 1200),
        acceptance: acceptance,
        url: it.html_url || (c.web + "/" + c.repo + "/issues/" + it.number),
        maxLines: c.maxLines
      });
    });
    return { repo: c.repo, count: out.length, chunks: out, maxLines: c.maxLines };
  }

  /* ---------------------------------------------------------------- pull */
  function pull(options) {
    var c = cfg(options);
    var url = c.api + "/repos/" + c.repo + "/issues?state=open&per_page=" + c.perPage;
    if (typeof fetch !== "function") {
      return Promise.resolve({ ok: false, reason: "no fetch in this environment",
                               link: c.web + "/" + c.repo + "/issues", repo: c.repo });
    }
    return fetch(url, { headers: { "Accept": "application/vnd.github+json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("forge returned " + r.status +
          (r.status === 403 ? " (anonymous rate limit — try again later)" : ""));
        return r.json();
      })
      .then(function (j) { var p = parseIssues(j, c); p.ok = true; return p; })
      .catch(function (e) {
        return { ok: false, reason: String(e.message || e),
                 link: c.web + "/" + c.repo + "/issues", repo: c.repo,
                 note: "The task list could not be fetched, so none is shown. Open the link to see it." };
      });
  }

  /* ------------------------------------------------------------- prompts
   * A cycle is an ordered list of prompts. Each carries enough context to be
   * answered cold, because the AI on the other side has never seen this repo. */
  function buildCycle(chunk, options) {
    var c = cfg(options);
    var ctx =
      "Project: " + c.repo + " — CHAKRA, an offline-first astronomical and calendrical instrument.\n" +
      "Rules that bind this work:\n" +
      "  - The computation core is verified and MUST NOT be edited. Build additively.\n" +
      "  - Nothing is accepted without a check that proves it: run it, show the output.\n" +
      "  - No fabricated numbers, dates, citations or DOIs. A gap is reported, not filled.\n" +
      "  - Keep it small: " + c.maxLines + " lines or fewer.\n";

    var task =
      "Task #" + chunk.number + " — " + chunk.title + "\n" +
      "Kind: " + chunk.kind + " (" + chunk.hint + ")\n" +
      (chunk.body ? "\nDescription:\n" + chunk.body + "\n" : "") +
      (chunk.acceptance ? "\nAcceptance:\n" + chunk.acceptance + "\n" : "");

    return {
      chunk: chunk.number,
      title: chunk.title,
      steps: [
        { n: 1, name: "Understand", prompt: ctx + "\n" + task +
          "\nFirst, restate this task in your own words and list what you would need to see " +
          "in the repository before writing anything. Ask me for exactly those files. " +
          "Do not write code yet." },
        { n: 2, name: "Propose", prompt:
          "Here is what you asked for:\n\n[PASTE THE FILES OR EXCERPTS HERE]\n\n" +
          "Now propose the smallest change that completes the task, as a plan, in under 20 lines. " +
          "Name the check that will prove it works." },
        { n: 3, name: "Write", prompt:
          "The plan is approved. Write the change now — no more than " + c.maxLines + " lines. " +
          "Additive only; do not modify the computation core. Include the check you named." },
        { n: 4, name: "Prove", prompt:
          "Here is the output of running it:\n\n[PASTE THE OUTPUT HERE]\n\n" +
          "If it passed, summarise what changed in two sentences for the commit message. " +
          "If it failed, fix it and say exactly what was wrong." }
      ],
      note: "Copy step 1, paste it into your AI, bring its reply back, and press Next. " +
            "Nothing is sent anywhere by this page."
    };
  }

  /* ------------------------------------------------------------ the loop
   * State machine for the handoff. The page binds clipboard + buttons to it. */
  function makeCycle(chunk, options) {
    var cy = buildCycle(chunk, options), i = 0, replies = [];
    return {
      title: cy.title, total: cy.steps.length, note: cy.note,
      index: function () { return i; },
      current: function () { return cy.steps[i]; },
      /* paste the AI's reply back, then advance and hand over the next prompt */
      accept: function (reply) {
        replies[i] = String(reply == null ? "" : reply);
        if (i < cy.steps.length - 1) { i++; return { done: false, next: cy.steps[i], index: i }; }
        return { done: true, replies: replies.slice() };
      },
      back: function () { if (i > 0) i--; return cy.steps[i]; },
      reset: function () { i = 0; replies = []; return cy.steps[0]; },
      transcript: function () {
        return cy.steps.map(function (s, k) {
          return "### " + s.name + "\n" + s.prompt + "\n\n--- reply ---\n" + (replies[k] || "(none yet)");
        }).join("\n\n");
      }
    };
  }

  return {
    version: VERSION, DEFAULTS: DEFAULTS, cfg: cfg,
    parseIssues: parseIssues, pull: pull, buildCycle: buildCycle, makeCycle: makeCycle
  };
});
