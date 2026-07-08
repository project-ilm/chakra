/*!
 * @project-ilm/chakra — Node binding.
 *
 * Spawns the compiled `chakra` CLI and parses its JSON envelope. Note: if you
 * are already in JavaScript you can skip this entirely and
 * `require("../../src/chakra-core.js")` for the pure-JS reference engine — this
 * wrapper exists for parity with the other language bindings and to exercise
 * the same C core they use.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 * SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
 */
"use strict";
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function cliPath() {
  if (process.env.CHAKRA_CLI && fs.existsSync(process.env.CHAKRA_CLI))
    return process.env.CHAKRA_CLI;
  const local = path.join(__dirname, "..", "..", "lib", "chakra");
  if (fs.existsSync(local)) return local;
  return "chakra"; // hope it's on PATH
}

function call(ep, params = {}) {
  const args = [ep].concat(Object.entries(params).map(([k, v]) => `${k}=${v}`));
  const out = execFileSync(cliPath(), args, { encoding: "utf8" });
  return JSON.parse(out);
}

const pad = (n) => String(n).padStart(2, "0");
function dt(d) { return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }

module.exports = {
  panchang: (date, time = "12:00", lat = 17.385, lon = 78.486) =>
    call("panchang", { date, time, lat, lon, tz: 0 }).panchanga,
  calendars: (date) => call("calendars", { date }).calendars,
  events: (year) => call("events", { year }).events,
  telescope: (date, time = "12:00", lat = 17.385, lon = 78.486) =>
    call("telescope", { date, time, lat, lon, tz: 0 }).bodies,
  moment: (date, time = "12:00") => call("moment", { date, time }),
  raw: call,
};
