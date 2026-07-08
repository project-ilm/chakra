# Changelog

## v1.4.1 — 2026-07-08
- **Physical-map globe (regression fix, political-sensitivity).** The location
  globe's `COAST` dataset has been replaced wholesale with the canonical
  **Natural Earth "physical" coastline** (133 rings, coastline-only by definition
  — Natural Earth strictly separates physical from cultural/political layers).
  The previous dataset could render lines readable as political boundaries; the
  new one carries **only shorelines**. `COAST` is UI-only, so the 6,590-check
  C-parity harness is unaffected (still 0 failed).
- **CUDA binding (B-30).** New `bindings/cuda/chakra_ephem.cu`: a
  `__host__ __device__` port of the ephemeris core that batches N epochs × 11
  bodies on the GPU, with a built-in CPU/GPU parity self-check and throughput
  benchmark. Verified faithful to the JS/C cores at the 2026-08-12 06:30 UT
  anchor — max deviation < 0.0023° across all eleven bodies (Sun and Moon exact
  to 3 decimals). The device math also compiles as ordinary host C++ for
  GPU-free validation.
- **Version now self-deriving in `seed-chakra.sh`.** The release script
  previously hardcoded `VER="1.2.0"`, so its final "published" line reported the
  wrong version through three releases (the git history and artifacts were always
  correct; only the echo drifted). `VER` is now derived directly from
  `src/chakra-core.js`, and the stale commit message was de-versioned to point at
  this CHANGELOG. This is the substantive reason for the 1.4.0 → 1.4.1 bump.
- **Version bumped to 1.4.1** across the JS core, C header (`CK_VERSION`),
  `misty.json`, and all binding manifests.


## v1.4.0 — 2026-07-08
- **Five language bindings, all calling the same C core** (`bindings/`):
  - **Python** `chakra-observatory` — ctypes against `libchakra.so` with an automatic CLI fallback, and a real **`chakra-cli`** (`panchang`, `calendars`, `events`, `kundali` with an ASCII North-Indian diamond chart; `--json` on any command). `pip install`-ready.
  - **Rust** `chakra-sys` — `build.rs` compiles `chakra.c` into the crate; raw FFI plus a safe `panchanga()`; two `cargo test` anchors.
  - **Go** — cgo package including `chakra.c` directly, with a test and example.
  - **C#** — P/Invoke `Chakra.cs` + `.csproj`.
  - **Node** `@project-ilm/chakra` — spawns the `chakra` CLI; `test.js` passes 3 cross-checks against the core.
  Every binding was verified to reproduce the reference anchors exactly (2026-08-12 06:30 UT → **Budhavāra · Amāvāsyā · Āśleṣā · JDN 2461265**, and the Sunni/Shia Hijrī split on 2026-06-16). The BASIC ports (GW-BASIC + QB64) from v1.3.0 remain.
- **New shared-library target** `make -C lib libchakra.so` (`-fPIC -shared`, 45 exported `ck_` symbols) so ctypes/P-Invoke consumers can load the core without a rebuild.
- **Node binding smoke test added to the suite** (`test/test-bindings.js`, skips gracefully if the CLI isn't built): node suite **115 → 120 assertions**.
- **Unified UT convention across bindings:** all bindings treat their time argument as UT (the CLI-backed paths pass `tz=0`), so Python/Rust/Go/C#/Node agree to the byte.
- **Backlog:** B-23, B-25, B-26, B-27, B-28 marked *shipped*; the cross-language CI matrix (running `cargo test`/`go test`/`dotnet test` and the Python byte-match) remains B-31.
- **DOI metadata fix (carried from the interrupted 1.3.0 mint):** `misty.json` now sets `access_right: "open"` explicitly — misty's shipped JSON Schema (active when the `jsonschema` extra is installed) otherwise misfires its embargo conditional and demands `embargo_date`. Verified: `misty validate` and a sandbox dry-run both pass.
- **C parity preserved:** 6,590-check JS↔C harness still `0 failed`; version bumped to 1.4.0 across the JS core, C header (`CK_VERSION`), `misty.json`, and all binding manifests.


## v1.3.0 — 2026-07-06
- **Dīpāvalī fixed to the classical rule.** `annualEvents()` now dates Dīpāvalī by the **pradoṣa-vyāpinī** criterion computed at Ujjain (23.18°N, 75.78°E): the day whose geometric sunset falls inside the Āśvina amāvāsyā tithi. 2026 → **8 Nov** (matching civil practice; the bare tithi-instant would mislead to 9 Nov). New engine primitive `sunsetUT(jdn,lat,lonE)`; ported to C (`ck_sunset_ut`) with parity preserved (6,590 checks). A generalized udaya/pradoṣa/niśītha engine for all festivals is seeded as B-42.
- **Landing is now a live instrument.** Drag the moon-in-astrolabe sideways to **scrub time** — ten calendars, the lagna diamond, the Moon's terminator and the coming-up board all follow; double-tap returns to now. Added a **location globe** (real coastlines back in, only the political map was ever meant to go; drag to spin, tap to relocate) with day/night terminator + subsolar point, a **live North-Indian lagna card**, a **daily-rotating calendar ribbon** (no tradition owns the top slot), and sci-fi polish (aurora sweep, shooting stars, title shimmer). `index.html?api=…` still serves JSON.
- **Interstellar tour gains a warp-field view** that scales streak length, speed and blue-shift with β and goes properly Star-Trek past 0.92 c (reduced-motion aware).
- **Learn** adds Mathematics **§8 — standard ephemerides**: the Chebyshev/Clenshaw math behind JPL DE440, TDB vs ΔT, why the basis is minimax-optimal, linking the ingestion roadmap (B-20).
- **AI prompts everywhere are now actionable:** every prompt is prefixed with the repo + CONTEXT/CONTRACTS pointers and offers **one-tap open in Claude and ChatGPT** (`claude.ai/new?q=` / `chatgpt.com/?q=`) alongside copy — on the Pro popups, the learn cards, and the tour.
- **Collaboration framework:** `CONTEXT.md` + `CONTRACTS.md` (truth-corrected — the UI is plain JS, there is *no* WASM layer yet; parity is JS↔C via generated vectors), `.github/ai_coding_manifest.md`, and a real **CI gate** (`.github/workflows/ci.yml`: node suite + C parity + inline-script syntax + forbidden-name sweep).
- **Release preservation:** canonical `misty.json` + `scripts/mint-doi.sh` using the real misty-doi interface (`misty publish -m misty.json -f …`, `ZENODO_TOKEN` env), **safe by default — sandbox dry-run unless `--live` is passed**, with a version-match guard.
- **Backlog seeded:** `docs/BACKLOG.md` carries **49 issues (B-16…B-64)** — DE440 ingestion, B1950/arbitrary epochs, Shadbala, Avasthās, antar/pratyantar daśā nesting, Aṣṭakavarga, D4–D60 + irregular D30, multi-ayanāṁśa switch, kṣaya-māsa, SGP4 + satellite radar, lost-in-space star-tracker, PyPI/GWBASIC/Rust/Go/C#/Node/WASM bindings, CUDA kernel, Android app **and home-screen widget**, atlas/DST, PWA, i18n, social exporter, gamified badges, and a three-volume textbook (maths/physics, then tradition-wise). `seed-chakra.sh` parses and files them (label `backlog`).
- **Note kept honest:** the divisional-chart selector (D1–D12), South/North renderers, drag-a-graha-into-a-house time solver, sky constellations and Esc-to-exit-AR were already shipped in the alpha and remain green; this release builds around them rather than reinventing them.
- **Globe is shorelines-only.** Regression fix: the location globe on the landing page and in Observatory Pro now draws **only natural coastlines**; the lat/long graticule is reduced to a barely-visible dotted grid so nothing can be read as a political border. CHAKRA has never carried border or country data — only the `COAST` shoreline set — and the code now says so explicitly.
- **BASIC bindings (B-24, partial):** `bindings/gwbasic/CHAKRA.BAS` (line-numbered GW-BASIC 3.23 / PC-BASIC panchāṅga) and `CHAKRA_QB64.BAS` (QB64 graphical astrolabe — Moon with computed terminator, planet ring, panchāṅga panel), sharing the JS core's astronomy and verified to name the same tithi/nakṣatra/vāra.
- **DOI pipeline proven.** `scripts/mint-doi.sh` + `misty.json` were run end-to-end against the real `misty-doi` CLI: canonical metadata **validates**, transforms to Zenodo/DataCite/codemeta/CFF, and a **sandbox dry-run** builds the artifact and records its SHA-256 with zero network calls. A real DOI still requires the operator's `ZENODO_TOKEN` and the explicit `--live` flag with typed confirmation.
- **Tests:** node suite **98 → 115 assertions** (tightened Dīpāvalī pin, vargas, orbits, voyage) · C parity 6,590 · browser plan resynced to the pradoṣa date.


## v1.2.0 — 2026-07-05
- **Site**: new graphic landing (`index.html`) — the Moon with its computed terminator inside an astrolabe ring of true planetary longitudes, a ten-calendar "today" ribbon, and a computed coming-up board. The full instrument moved intact to **`pro.html`**; published `index.html?api=…` URLs keep working (the dispatcher shell stays on the landing).
- **New pages**: `learn.html` — six interactive sims (equal areas, Newton on Kepler's equation, precession rings, tithi dial, synodic beats, Hohmann planner) plus the schools (ayanāṁśa comparison, dṛk vs vākya, Sūrya Siddhānta, Jaimini clarified, amānta/pūrṇimānta, Hijrī reckonings, Hebrew arithmetic), a 3,000-year history relay, spacecraft mechanics, references and AI study prompts, with per-topic links to the exact functions on GitHub; `tour.html` — relativistic interstellar planner over a 28-star catalogue with arrival dates written in ten calendars; `tests.html` + `test-plan.json` — a 26-case public plan fetched from the site and executed in the reader's browser (embedded fallback for `file://`).
- **Site chrome** (`src/chakra-site.js`): four colour themes carried via `?theme=`, a social share bar, a "Built with Claude" badge, and — on the Pro page only — per-view "ask an AI about this" prompt popups.
- **Observatory (pro.html)**: sky-map bodies are draggable through *time* (inverse dome/AR projection → per-body longitude solver); the orrery gains a **true-orbit mode** (Kepler ellipses with perihelion/aphelion marked in AU, √AU radial scale); the globe drops map art for reference circles plus a **computed day/night terminator and subsolar point**; the default tab's wave finally has its year axis, the chaos return-map gets numeric ticks, and every view now refreshes uniformly on moment change (stale moon-face fix).
- **API**: new `?api=events&year=YYYY` endpoint returning the full computed festival + eclipse list.
- **C library** (`lib/`): complete C99 port of the core — ephemeris, pañcāṅga, twelve calendars, yogas, Vimśottarī, eclipses, telescope, and the amānta festival engine — verified by a generated-vector parity harness: **6,590 checks, festival strings byte-identical for 2026 and 2027, diacritics included**. Static library + JSON CLI (`./chakra events year=2026`). No heap, libm only.
- **Voyage engine** (`src/chakra-voyage.js`): real-star catalogue + special-relativistic arithmetic (γ, Earth vs ship time, multi-leg tours), unit-tested.
- **Tests**: node suite 74 → **98 assertions** (`test-voyage.js`, `test-orbits.js`, events-endpoint checks) · 26-case browser plan · C parity harness.
- **Docs**: festival-date convention documented (tithi-instant vs udaya-vyāpinī; Dīpāvalī 2026 = 9 Nov by this convention — FW-2); field note under FW-6 on the spurious second adhika flag of 2026; `.gitignore` restored and hardened (`*.zip`, C build outputs).
- **seed-chakra.sh v2**: manifest guard (refuses to run outside the extracted `chakra/` tree), nested-`.git` and stray-archive refusal, and history-aware publishing (fetch → graft → fast-forward) so re-seeding an existing repo cannot recreate the 2026-07-04 wrapper-directory incident.

## v1.1.0 — 2026-07-03
- **Library split (4 layers)**: `chakra-core.js` (pure computation), `chakra-kernel.js` (state facade + event bus + inverse-solver actions), `chakra-api.js` (URL→JSON), `chakra-ui.js` (rendering); `index.html` reduced to a thin dispatcher shell. Same files work via `require()` in Node and `<script src>` from `file://`.
- **URL API**: `?api=moment|almanac|panchang|chart|yogas|dasha|telescope|calendars|eclipses` with `date,time,tz,lat,lon,zodiac` params → JSON with disclaimer + version.
- **Five new calendars**: Hebrew (fixed arithmetic, calibrated epoch 347999), Sikh Nanakshahi, Sunni tabular Hijrī, Shia (Ithnā-ʿAsharī) tabular Hijrī — divergence e.g. 2026-06-16 — alongside the existing tabular Hijrī, Solar Hijrī, Vedic, Chinese, Tibetan, Mayan, Gregorian/JD, precessional age.
- **Jyotiṣa engines**: whole-sign chart; Kālasarpa, Maṅgala Doṣa (Lagna/Moon/Venus), Gaja-Kesari, Sunapha/Anapha/Durudhara/Kemadruma, Pañca Mahāpuruṣa, Śani Sāḍe-Sātī; Vimśottarī mahādaśā timeline.
- **Computed festival engine** `annualEvents(Y)`: Hindu (amānta saṅkrānti rule with adhika-māsa handling), Islamic (both reckonings), Jewish, Sikh, plus all saṅkrāntis and the year's eclipses — 15 anchored 2026 assertions. Almanac gains a clickable, printable Festivals panel.
- **Telescope**: RA/Dec (of-date), Alt/Az, hour angle for all nine grahas — Lagna-tab readout and `?api=telescope`.
- **UI**: labelled axes on waveform/spectrum/stave; Sunni/Shia/Hebrew/Nanakshahi rows in the almanac; yoga/daśā/telescope panels; `@media print` almanac stylesheet.
- **Tests**: `test/run.js`, seven suites, 74 assertions, non-zero exit on failure.

## v1.0.x — 2026-07-02
Single-file observatory: geared draggable orrery, 9 tabs, every-graph-an-input inverse solvers, moment cards, sky viewer (45 yogatārā stars, dome + AR sensors), globe location picker with GPS, Sun–Earth–Moon eclipse geometry, multi-tradition almanac. Verified: Spica 179.99°, four 2026 eclipses, ascendant solver 0.0000°.
