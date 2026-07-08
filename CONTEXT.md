# CHAKRA — Architecture Context (for humans and AI collaborators)

Read this and `CONTRACTS.md` before proposing changes. Every AI prompt on the
live site is prefixed with a pointer to these two files.

## What CHAKRA actually is

An **offline-first, dependency-free astronomical & calendrical observatory**. It
computes ten calendar traditions, planetary positions, pañcāṅga, eclipses and
jyotiṣa structures from **live geometry and orbital mechanics** — not lookup
tables. Ships as a set of static web pages plus a byte-parity C99 core.

## Ground truth about the codebase (read carefully — some circulating drafts are wrong)

- **`src/chakra-core.js` is the reference implementation.** All astronomy lives
  here (Schlyter-based ephemeris, Lahiri ayanāṁśa, pañcāṅga, twelve calendars,
  eclipses, yogas, Vimśottarī, `annualEvents` festival engine). It is a UMD
  module: `require()` in Node, `window.Chakra` in the browser.
- **`lib/chakra.c` is a byte-parity C99 twin**, verified against JS-generated
  vectors by `lib/test_chakra.c` — **6,590 checks, festival strings identical to
  the byte, diacritics included**. It is not a separate design; it must track the
  JS core. Regenerate parity with `make -C lib vectors.h`.
- **The web UI is plain JavaScript reading `chakra-core.js` directly. There is no
  WebAssembly layer today.** WASM is a *planned* binding (backlog B-29). Do not
  write code that assumes `wasm`, `emscripten`, or a `/src/wasm` path exists.
- **Parity means JS ↔ C agreement via `gen_vectors.js`**, not "binary identity
  across all compilers/platforms". Don't over-claim it.
- **Zero-allocation applies to `lib/chakra.c`** (static/stack buffers only, no
  `malloc` in hot paths). The JS core is ordinary JS.
- There is **no SDR, no SGP4, no DE440, no atlas** in the tree yet — all are
  seeded backlog items (B-20, B-45, B-47, B-52…). Don't reference them as if present.
- **The globe carries ONLY physical coastlines, never political borders.** The
  `COAST` array in `chakra-core.js` is the Natural Earth *physical* coastline
  (their "physical" vs "cultural" split — cultural/political layers are excluded
  by construction). This is a hard, politically-sensitive requirement: never
  introduce a border/country/admin dataset, and if asked to "add a map," add only
  shorelines. `COAST` is UI-only and does not touch the C parity harness.
- **Versions are single-sourced from `src/chakra-core.js`.** `seed-chakra.sh`
  derives `VER` from the core's `version:` field; never hardcode a version in the
  seed script or any binding will drift. Bump the core first, then mirror to the
  C header (`CK_VERSION`), `misty.json`, and the binding manifests.
- **Six bindings all call the ONE C core.** They must reproduce the reference
  anchor exactly: 2026-08-12 06:30 UT → Budhavāra · Amāvāsyā · Āśleṣā ·
  JDN 2461265; the CUDA binding adds all-body longitude parity (max |Δ| < 0.0023°).
  A binding that computes anything itself, rather than deferring to the core, is a bug.

## Layout

```
index.html   landing — live moon-in-astrolabe you drag to scrub time, ten-calendar
             ribbon, live lagna diamond, location globe; also the ?api= dispatcher
pro.html     the full observatory (src/chakra-ui.js): orrery, waveforms, spectra,
             dynamics, D1–D12 lagna (draggable), live sky with constellations, almanac
learn.html   the mathematics (8 sims), schools, history, spacecraft, references, prompts
tour.html    interstellar planner (src/chakra-voyage.js) with a warp-field view
tests.html   fetches test-plan.json and runs it in-browser (embedded fallback)

src/chakra-core.js    reference engine (astronomy, calendars, festivals)
src/chakra-kernel.js  event/periodicity helpers used by the API
src/chakra-api.js     ?api= → JSON envelope dispatcher (ChakraAPI.handle)
src/chakra-ui.js      all Observatory-Pro rendering & interaction
src/chakra-voyage.js  relativistic star-travel arithmetic (pure, tested)
src/chakra-site.js    shared chrome: themes, share bar, AI-prompt popups

lib/         C99 twin + generated vectors.h + parity harness + JSON CLI + libchakra.so
bindings/    six language faces of the SAME C core (all verified to the anchor):
             python/ (chakra-observatory + chakra-cli), rust/ (chakra-sys),
             go/ (cgo), csharp/ (P/Invoke), node/ (CLI-spawn),
             cuda/ (batch ephemeris), gwbasic/ (GW-BASIC + QB64 graphical)
test/        node suite (auto-discovered test-*.js) — run: node test/run.js
docs/        ARCHITECTURE, ASSUMPTIONS, FURTHER-WORK (FW-series), BACKLOG (B-series)
scripts/     mint-doi.sh (Zenodo via misty-doi), close-completed-issues.sh
```

## The one rule that matters most

**Before you change or "rebuild" anything, read what already exists.** The engine
is dense and correct; reinventing a function usually breaks parity. For example,
`annualEvents()` already emits a complete festival + eclipse list, and Dīpāvalī
already uses the pradoṣa-vyāpinī-at-Ujjain rule (v1.3.0). Verify against the real
code and the test suite before editing.

## How to make a change

1. Pick an issue (FW-series in `FURTHER-WORK.md`, B-series in `docs/BACKLOG.md`).
2. Read the relevant source file(s) fully.
3. Make the smallest correct change. If it touches astronomy, update **both**
   `src/chakra-core.js` and `lib/chakra.c`, then regenerate vectors.
4. Run the gate in `CONTRACTS.md`. Green everywhere → open a PR.

© 1993–2026 Abhishek Choudhary, sole author. Code GPL-3.0-or-later; docs CC BY-SA 4.0.
