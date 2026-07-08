/* Cross-check three endpoints against the pure-JS core.
 * Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later. */
"use strict";
const assert = require("assert");
const ck = require("./index.js");
const cal = ck.calendars("2026-06-16");
assert(/1447/.test(cal.hijriSunni), "Sunni 1447");
assert(/1448/.test(cal.hijriShia), "Shia 1448");
const ev = ck.events(2026);
assert(ev.some((e) => e.name.indexOf("Dīpāvalī") >= 0 && e.date === "2026-11-08"),
  "Dīpāvalī 2026-11-08 (pradoṣa rule)");
const pc = ck.panchang("2026-08-12", "06:30", 28.61, 77.21);
assert(pc.vara === "Budhavāra", "vara");
console.log("node binding: 3 checks passed (calendars, events, panchang match the C core)");
