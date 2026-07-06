# CHAKRA — Architecture

Four strictly-layered files. Each layer sees only the ones below it.

```
┌──────────────────────────────────────────────────────┐
│ index.html — thin shell                              │
│   reads location.search → ?api=… ? ChakraAPI : UI    │
├───────────────────────────┬──────────────────────────┤
│ chakra-ui.js (ChakraUI)   │ chakra-api.js (ChakraAPI)│
│ DOM/SVG, every graph an   │ URLSearchParams → JSON   │
│ input, tabs, print        │ 9 endpoints, headless    │
├───────────────────────────┴──────────────────────────┤
│ chakra-kernel.js (ChakraKernel) — abstraction layer  │
│ one {date,time,tz,lat,lon,zodiac} state · moment()   │
│ snapshot · subscribe() bus · inverse solvers as      │
│ actions (solveAscendant, solveElongation, phaseLock, │
│ jumpToEclipse)                                       │
├──────────────────────────────────────────────────────┤
│ chakra-core.js (Chakra) — pure computation library   │
│ ephemeris · 12 calendar traditions · pañcāṅga ·      │
│ yogas · Vimśottarī · telescope · annualEvents ·      │
│ zero DOM, runs identically in Node and the browser   │
└──────────────────────────────────────────────────────┘
```

## Contracts
- **core** exports only pure functions (UMD: `module.exports` in Node, `window.Chakra` in the browser). No `document`, no `window` use, no state.
- **kernel** is the *only* holder of mutable state. `moment()` returns the complete computed snapshot (ascendant, pañcāṅga, yogas, daśā, all calendars, telescope table, ±18-month eclipses). `subscribe(fn)` notifies on every action; the returned function unsubscribes.
- **api** is a pure function of a `URLSearchParams` → `{contentType, body, data}`. Every response carries the disclaimer and generator version.
- **ui** owns all rendering. It may keep view-local state (drag handles, caches) but time/place truth lives in the shared state.

## Layering your own consumer
```html
<script src="src/chakra-core.js"></script>
<script src="src/chakra-kernel.js"></script>
<script>
  const K = ChakraKernel.create({ refDate:"2026-08-12", lat:11.0, lon:78.0, tz:5.5 });
  K.subscribe((state, reason) => console.log(reason, K.moment().panchanga));
  K.solveElongation(180);          // jump to nearest full moon — subscribers fire
</script>
```
Or in Node: `const K = require("./src/chakra-kernel.js").create({...})`.

## Why classic scripts, not ES modules
The app must open from `file://` fully offline. Browsers block module imports from `file://` (CORS), so the four files attach UMD-style globals and `index.html` loads them with plain `<script src>`. In Node the same files are `require()`-able — which is exactly how the test suite consumes them.

## Tests
`node test/run.js` — seven suites (ephemeris, calendars, yoga/daśā, kernel+API, annual events, hardening, integration smoke), exits non-zero on any failure. Every algorithm listed in ASSUMPTIONS.md has at least one anchored assertion.


---
© 1993–2026 Abhishek Choudhary. This document is licensed under [CC BY-SA 4.0](../LICENSE-docs).
CHAKRA is study/heritage software — see [DISCLAIMER](../DISCLAIMER.md).

---
## v1.2.0 additions

### Page tier
```
index.html   landing — hero instrument (moon-in-astrolabe) + ten-calendar ribbon + API dispatcher shell
pro.html     the full observatory UI (chakra-ui.js) + per-view AI prompt popups
learn.html   six self-contained sims + schools/history/spacecraft/references
tour.html    interstellar planner (chakra-voyage.js + core calendars for arrival dates)
tests.html   fetches test-plan.json, executes it via ChakraAPI.handle in-browser
```
All pages load `src/chakra-site.js`: theme sets applied to `:root` custom properties and carried by `?theme=`; share bar; "Built with Claude" badge; prompt popups gated on `body[data-page="pro"]`.

### New modules
- `src/chakra-voyage.js` — pure relativistic tour arithmetic (`STARS`, `DRIVES`, `gamma`, `plan`, `tour`); no DOM; covered by `test/test-voyage.js`.
- `src/chakra-site.js` — page chrome only; no computation.

### `lib/` — the C99 twin
```
gen_vectors.js ──(node, reads ../src/chakra-core.js)──▶ vectors.h
chakra.h / chakra.c ──▶ libchakra.a ── chakra_cli.c ──▶ ./chakra (JSON CLI)
test_chakra.c + vectors.h ──▶ ./test_chakra   (6,590 parity checks; byte-exact annualEvents 2026–27)
```
`make vectors.h && make && make test`. The vector file is committed so C users can verify without node; regenerating it re-derives truth from the JS reference.

### Browser test plan
`test-plan.json` (26 cases) is produced by a generator that executes every check against the live engine before writing — a red case aborts generation. `tests.html` embeds a byte-identical fallback for `file://` use.

