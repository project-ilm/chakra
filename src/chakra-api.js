/*!
 * chakra-api.js — URL-parameter API. The HTML shell hands the query string here;
 * this returns {contentType, body} (JSON when headless). Endpoints:
 *   ?api=almanac|panchang|chart|yogas|dasha|telescope|calendars|moment
 *   &date=YYYY-MM-DD&time=HH:MM&lat=..&lon=..&tz=..&zodiac=sidereal|tropical&format=json
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * DISCLAIMER: study/heritage computation only; not for navigation or safety-critical use.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./chakra-core.js"), require("./chakra-kernel.js"));
  else root.ChakraAPI = factory(root.Chakra, root.ChakraKernel);
})(typeof self !== "undefined" ? self : this, function (C, Kernel) {
  "use strict";

  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }

  function handle(params) {
    var get = params && params.get ? function (k) { return params.get(k); } : function (k) { return params[k]; };
    var ep = (get("api") || "moment").toLowerCase();
    var VALID = ["moment","almanac","panchang","panchanga","chart","yogas","yoga","dasha","telescope","calendars","eclipses","events"];
    if (VALID.indexOf(ep) < 0) ep = "moment";   /* unknown endpoints fall back — raw input is never echoed */
    var init = {};
    if (get("date")) init.refDate = get("date");
    if (get("time")) init.refTime = get("time");
    if (get("lat") != null) init.lat = num(get("lat"), 28.61);
    if (get("lon") != null) init.lon = num(get("lon"), 77.21);
    if (get("tz")  != null) init.tz  = num(get("tz"), 0);
    if (get("zodiac")) init.zodiac = get("zodiac");
    var K = Kernel.create(init);
    var M = K.moment();

    var body;
    switch (ep) {
      case "panchang": case "panchanga": body = { input: M.input, panchanga: M.panchanga, moon: M.moon, sun: M.sun }; break;
      case "chart":     body = { input: M.input, ascendant: M.ascendant, mc: M.mc, chart: M.chart, retrogrades: M.retrogrades }; break;
      case "yogas": case "yoga": body = { input: M.input, yogas: M.yogas }; break;
      case "dasha":     body = { input: M.input, dasha: M.dasha }; break;
      case "telescope": body = { input: M.input, lst: null, bodies: M.telescope, note: "raH/dec for equatorial GoTo; alt/az for alt-az mounts; haH = hour angle (hours)." }; break;
      case "calendars": body = { input: M.input, calendars: M.calendars }; break;
      case "eclipses":  body = { input: M.input, eclipses: M.eclipses }; break;
      case "events":  { var yy=parseInt(get("year"))||parseInt(M.input.refDate)||2026; body={ year: yy, events: C.annualEvents(yy) }; } break;
      case "almanac":   body = M; break;
      case "moment": default: body = M; break;
    }
    body.disclaimer = "CHAKRA — low-precision heritage computation. Not for navigation, muhūrta-critical, or safety use. Astrological outputs are cultural, not predictive.";
    body.generator = "chakra-core " + C.version;
    return { contentType: "application/json", body: JSON.stringify(body, null, 2), endpoint: ep, data: body };
  }

  return { handle: handle, endpoints: ["moment","almanac","panchang","chart","yogas","dasha","telescope","calendars","eclipses","events"] };
});
