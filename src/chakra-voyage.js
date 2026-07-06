/*!
 * chakra-voyage.js — interstellar tour planner engine: a catalogue of real
 * nearby stars and special-relativistic travel arithmetic (Earth-frame vs
 * ship proper time). Pure computation, no DOM. Powers tour.html.
 *
 * Distances are published estimates in light-years (rounded; parallax data
 * ultimately from Hipparcos/Gaia). Playful in spirit, honest in mathematics:
 * γ = 1/√(1−β²); Earth time = D/β years; ship time = Earth time / γ.
 * Fuel, acceleration phases and engineering are gleefully ignored.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Distributed WITHOUT ANY WARRANTY. See <https://www.gnu.org/licenses/>.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ChakraVoyage = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var STARS = [
    { nm: "Proxima Centauri",  ly: 4.2465,  sp: "M5.5V", note: "closest star · hosts Proxima b in the habitable zone" },
    { nm: "α Centauri A+B",    ly: 4.367,   sp: "G2V+K1V", note: "closest Sun-like pair" },
    { nm: "Barnard's Star",    ly: 5.963,   sp: "M4V",   note: "greatest proper motion in the sky" },
    { nm: "Wolf 359",          ly: 7.86,    sp: "M6.5V", note: "tiny red dwarf of science-fiction fame" },
    { nm: "Lalande 21185",     ly: 8.31,    sp: "M2V",   note: "brightest red dwarf in northern skies" },
    { nm: "Sirius A",          ly: 8.60,    sp: "A1V",   note: "brightest star in Earth's night sky · white-dwarf companion" },
    { nm: "Ross 154",          ly: 9.70,    sp: "M3.5V", note: "flare star in Sagittarius" },
    { nm: "ε Eridani",         ly: 10.45,   sp: "K2V",   note: "young Sun-like star with a debris disc" },
    { nm: "Lacaille 9352",     ly: 10.72,   sp: "M0.5V", note: "fast-moving southern red dwarf" },
    { nm: "Ross 128",          ly: 11.01,   sp: "M4V",   note: "quiet red dwarf · temperate planet Ross 128 b" },
    { nm: "61 Cygni",          ly: 11.40,   sp: "K5V+K7V", note: "first star ever to have its parallax measured (Bessel 1838)" },
    { nm: "Procyon",           ly: 11.46,   sp: "F5IV",  note: "the Little Dog star · white-dwarf companion" },
    { nm: "ε Indi",            ly: 11.87,   sp: "K5V",   note: "K dwarf with brown-dwarf companions" },
    { nm: "τ Ceti",            ly: 11.90,   sp: "G8V",   note: "nearest single Sun-like star · classic SETI target" },
    { nm: "Altair",            ly: 16.73,   sp: "A7V",   note: "rapid rotator, flattened at the poles" },
    { nm: "Vega",              ly: 25.04,   sp: "A0V",   note: "the ancient pole star · photometric standard · Abhijit" },
    { nm: "Fomalhaut",         ly: 25.13,   sp: "A3V",   note: "lonely autumn star with a famous dust ring" },
    { nm: "Pollux",            ly: 33.78,   sp: "K0III", note: "nearest giant star · has a confirmed planet" },
    { nm: "Arcturus",          ly: 36.66,   sp: "K1.5III", note: "brightest star of the northern hemisphere · Svātī" },
    { nm: "TRAPPIST-1",        ly: 40.66,   sp: "M8V",   note: "seven Earth-sized planets, three temperate" },
    { nm: "Capella",           ly: 42.92,   sp: "G8III+G0III", note: "two giant suns waltzing" },
    { nm: "Aldebaran",         ly: 65.23,   sp: "K5III", note: "the eye of the Bull · Rohiṇī" },
    { nm: "Regulus",           ly: 79.30,   sp: "B8IV",  note: "heart of the Lion · Maghā" },
    { nm: "Spica",             ly: 249.7,   sp: "B1V+B4V", note: "Citrā — the Lahiri zero-point star" },
    { nm: "Polaris",           ly: 447,     sp: "F7Ib",  note: "the present north star · Dhruva" },
    { nm: "Betelgeuse",        ly: 548,     sp: "M1-2Ia", note: "red supergiant, future supernova" },
    { nm: "Galactic Centre (Sgr A*)", ly: 26670, sp: "SMBH", note: "4-million-solar-mass black hole we orbit" },
    { nm: "Andromeda Galaxy (M31)", ly: 2537000, sp: "galaxy", note: "for folks from anywhere in the universe :)" }
  ];

  function gamma(beta) {
    if (!(beta > 0) || beta >= 1) return beta === 0 ? 1 : NaN;
    return 1 / Math.sqrt(1 - beta * beta);
  }
  function earthYears(ly, beta) { return ly / beta; }
  function shipYears(ly, beta) { return earthYears(ly, beta) / gamma(beta); }

  /* one leg */
  function plan(ly, beta, departYear) {
    var g = gamma(beta), tE = earthYears(ly, beta), tS = tE / g;
    return {
      ly: ly, beta: beta, gamma: g,
      earthYears: tE, shipYears: tS,
      departYear: departYear,
      arriveEarthYear: departYear + tE,
      agingSaved: tE - tS
    };
  }
  /* multi-hop tour: legs = [{ly, beta}] in order */
  function tour(legs, departYear) {
    var out = { legs: [], earthYears: 0, shipYears: 0, ly: 0, departYear: departYear };
    var y = departYear;
    for (var i = 0; i < legs.length; i++) {
      var p = plan(legs[i].ly, legs[i].beta, y);
      out.legs.push(p);
      out.earthYears += p.earthYears; out.shipYears += p.shipYears; out.ly += legs[i].ly;
      y = p.arriveEarthYear;
    }
    out.arriveEarthYear = y;
    out.agingSaved = out.earthYears - out.shipYears;
    return out;
  }
  function findStar(nm) {
    nm = String(nm).toLowerCase();
    for (var i = 0; i < STARS.length; i++)
      if (STARS[i].nm.toLowerCase().indexOf(nm) >= 0) return STARS[i];
    return null;
  }
  /* named drive presets — fractions of c (fun, order-of-magnitude honest) */
  var DRIVES = [
    { nm: "Chemical rocket (Voyager-class)", beta: 0.000057, note: "≈17 km/s — our actual starships so far" },
    { nm: "Nuclear pulse (Orion study)",     beta: 0.03,     note: "1960s paper design" },
    { nm: "Fusion torch (Daedalus study)",   beta: 0.12,     note: "1970s BIS flyby design" },
    { nm: "Light-sail (Starshot concept)",   beta: 0.20,     note: "gram-scale probes on laser light" },
    { nm: "Half light-speed",                beta: 0.5,      note: "γ = 1.155 — relativity wakes up" },
    { nm: "Nine-tenths c",                   beta: 0.9,      note: "γ = 2.294" },
    { nm: "99% c",                           beta: 0.99,     note: "γ = 7.089" },
    { nm: "99.99% c",                        beta: 0.9999,   note: "γ ≈ 70.7 — decades pass on Earth per ship-year" }
  ];

  return { STARS: STARS, DRIVES: DRIVES, gamma: gamma, earthYears: earthYears,
           shipYears: shipYears, plan: plan, tour: tour, findStar: findStar,
           version: "1.2.0" };
});
