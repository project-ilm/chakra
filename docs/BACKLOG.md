# CHAKRA — Engineering Backlog (B-series)

Structured, self-contained issue specs. `./seed-chakra.sh` files each `### B-NN` block
below as a GitHub issue (label `backlog`), idempotently. Numbering continues from the
FW-series in `FURTHER-WORK.md`. Every item is sized for an AI-assisted packet: pick one,
paste it with `CONTEXT.md` + `CONTRACTS.md` (B-16) into Claude/ChatGPT, run the local
gate (`node test/run.js && make -C lib test`), raise a PR.

Invariants that bind every item: zero network, zero lookup tables where an equation
exists, zero `malloc` in `lib/chakra.c` hot paths, JS↔C byte parity via `lib/gen_vectors.js`,
GPL-3.0-or-later, © 1993–2026 Abhishek Choudhary sole author.

---

## Ecosystem & infrastructure

### B-16: Author CONTEXT.md + CONTRACTS.md at repo root
**Category:** Collaboration · **Priority:** Critical
Write the two coordination documents referenced by every AI prompt on the site. They must state the *true* architecture (correcting drafts in circulation): `src/chakra-core.js` is the **reference implementation**; `lib/chakra.c` is a **byte-parity C99 twin** verified by generated vectors (6,590 checks); the UI is **plain JS reading the core directly — there is no WASM layer today** (WASM is B-29); zero-allocation applies to `lib/chakra.c`; parity means JS↔C via `gen_vectors.js`, not "binary identity across compilers". CONTRACTS.md lists the PR gate: node suite green, `make -C lib test` green, no new `malloc`, no network calls, no hardcoded date tables, forbidden-name sweep clean, headers present.
**Done when:** both files exist, README links them, and the site's AI-prompt prefix resolves to real files.

### B-17: `.github/ai_coding_manifest.md` + prompt packet templates
**Category:** Collaboration · **Priority:** High
A single guardrail file an AI can be handed verbatim: double-precision only, no heap in lib, deterministic outputs, write a matching test (node suite or `test_chakra.c` vectors), one-sentence patch rationale. Add `.github/ai-prompts/` with 2–3 filled examples (one core-math packet, one UI packet, one binding packet).
**Done when:** copying manifest + an issue into a fresh AI chat yields a patch that passes the local gate unmodified.

### B-18: GitHub Actions CI — the invariant gate
**Category:** CI/CD · **Priority:** Critical
`.github/workflows/ci.yml` on push/PR: (1) `node test/run.js`; (2) `make -C lib vectors.h && make -C lib && make -C lib test`; (3) regenerate `test-plan.json` via its generator and diff against committed; (4) `node --check` every inline `<script>` extracted from the five pages; (5) case-insensitive forbidden-name sweep must return zero.
**Done when:** a PR that flips one byte of a festival string goes red.

### B-19: RELEASE-NOTES.md + `share.html` announcements page
**Category:** Growth · **Priority:** High
Ship-ready launch copy with **real URLs** (`https://github.com/project-ilm/chakra`, `https://project-ilm.github.io/chakra/`): a LinkedIn broadcast, a 6–10 tweet X thread, a short Mastodon/HN blurb. `share.html` renders each block with a copy button and X/LinkedIn share-intent links, styled like the rest of the site, `data-page="share"`. Landing footer's "Releases" link upgrades to this page.
**Done when:** owner can announce the alpha with two taps per network.

### B-20: JPL DE440 Chebyshev ingestion behind the same API
**Category:** Core astronomy · **Priority:** High
Add an optional high-precision path: packed per-body, per-segment Chebyshev coefficient sets (subset years, e.g. 1900–2100 Sun/Moon/planets) as compile-time static C arrays + a mirrored JS typed-array module. Evaluate with Clenshaw; velocities from derivative coefficients; time argument TDB with a ΔT bridge (B-49). Engine flag `theory: "schlyter"|"de440"`; Schlyter remains the zero-asset default. `learn.html` §8 already teaches the mathematics and links here.
**Done when:** positions match published DE440 vectors < 1e-7 AU on sampled epochs and the test console shows the live delta between theories.

### B-21: `misty.json` + `scripts/mint-doi.sh` (Zenodo DOI via misty-doi)
**Category:** Release automation · **Priority:** High
Use the real misty-doi interface — binary `misty`, `misty publish -m misty.json -f dist/chakra-vX.Y.Z.tar.gz`, token via `ZENODO_TOKEN` env (never a flag in scripts), `ORCID` env applied to creators; exit codes 0 ok / 2 metadata / 3 creds / 4 zenodo. Commit canonical `misty.json` (title, Choudhary, Abhishek; GPL-3.0-or-later; keywords; related-identifier → GitHub). The script builds the tarball via `git archive`, then runs misty **defaulting to `--sandbox --dry-run`; a real mint requires an explicit `--live` flag** and a version-match check against `chakra-core.js`. Install hint: `pipx install misty-doi`.
**Done when:** sandbox dry-run round-trips cleanly and `--live` is the only path to a real DOI.

### B-22: Arbitrary reference epochs — B1950 and friends
**Category:** Astronomy math · **Priority:** Medium
Implement rigorous frame rotation between mean equinoxes: IAU precession matrix P(t₁,t₂) (Capitaine/IAU-2006 angles or Lieske for classical spans), optional nutation. API/engine accept `epoch=J2000|B1950|JD…`; internal computation stays J2000-of-date, outputs rotate on request. Round-trip J2000→B1950→J2000 must close < 0.01″; spot-check Aldebaran's catalogued B1950 vs J2000 places.
**Done when:** `?api=telescope&epoch=B1950` returns frame-correct RA/Dec with tests pinning the rotation.

### B-23: PyPI package `chakra-observatory` + `chakra-cli`
**Category:** Bindings · **Priority:** High
`bindings/python/`: pyproject (module `chakra_obs`), ctypes bindings to `libchakra.so` (add a `-fPIC -shared` target to `lib/Makefile`) with graceful fallback to spawning the `lib/chakra` CLI. Console script `chakra-cli` subcommands: `panchang`, `calendars`, `events --year`, `kundali --date --time --lat --lon` (ASCII North-diamond render + planet table). Descriptive docstrings sized for AI packet work.
**Done when:** `pipx install .` works and `chakra-cli calendars --date 2026-06-16` byte-matches the HTML test console's engine output for the same query.

### B-24: BASIC ports — GW-BASIC + QB64 graphical UI  *(partially shipped v1.3.0)*
**Category:** Bindings / heritage · **Priority:** Medium
**Shipped:** `bindings/gwbasic/CHAKRA.BAS` (line-numbered GW-BASIC 3.23 / PC-BASIC: JDN, Sun & Moon longitude with the 10 main perturbation terms, tithi/nakṣatra/vāra, Lahiri ayanāṁśa, tabular Hijrī, GOSUB-based atan2) and `bindings/gwbasic/CHAKRA_QB64.BAS` (QB64/QB64-PE graphical astrolabe: Moon-with-terminator + planet ring + panchāṅga panel via `SCREEN`/`_RGB32`), with a README mapping every routine to its `chakra-core.js` twin. Verified: 2026-08-12 06:30 UT → Amāvāsyā · Āśleṣā · Budhavāra, Sun ≈ 139.6°, Moon ≈ 133.3°.
**Remaining:** the QB64 planet ring uses crude mean longitudes (not chart-grade); port the full `grahas()` planetary theory, the other nine calendars, eclipses and the pradoṣa Dīpāvalī rule to BASIC; add an automated emulator smoke-test.
**Done when:** BASIC planet longitudes match the C/JS cores within a degree and an emulator run is checked in CI.

### B-25: Node.js binding
**Category:** Bindings · **Priority:** Low
Phase 1 (now): `bindings/node/` wrapper that spawns the `lib/chakra` CLI and parses JSON — zero build steps, works everywhere. Phase 2: N-API addon compiling `lib/chakra.c` directly, same surface. Note honestly in the README that pure-JS users should just `require("src/chakra-core.js")`.
**Done when:** `npm test` in the folder cross-checks three endpoints against the JS core.

### B-26: Rust crate `chakra-sys` (+ safe wrapper)
**Category:** Bindings · **Priority:** Medium
`build.rs` compiles `../../lib/chakra.c` via the `cc` crate; raw FFI decls for the `ck_*` surface; a safe `panchanga(y,m,d,ut,lat,lon)` returning an owned struct. No unsafe leaks past the boundary.
**Done when:** `cargo test` reproduces the 2026-06-16 Hijrī divergence from Rust.

### B-27: Go binding (cgo)
**Category:** Bindings · **Priority:** Low
`bindings/go/`: cgo package including `lib/chakra.c` directly, exposing Panchanga/Calendars/Events; example server streaming today's pañcāṅga as JSON.
**Done when:** `go test ./...` passes with vector spot-checks.

### B-28: C# binding (P/Invoke)
**Category:** Bindings · **Priority:** Low
`Chakra.cs` DllImport surface over `libchakra` + build notes for Linux/Windows; one xUnit test pinning Dīpāvalī 2026 = 2026-11-08.
**Done when:** `dotnet test` green on Linux CI.

### B-29: WebAssembly build of the C core
**Category:** Bindings · **Priority:** Medium
Emscripten target for `lib/chakra.c` exporting the `ck_*` surface; a triple-parity harness (JS core vs native C vs WASM) over the generated vectors. This creates the WASM layer some drafts wrongly assumed already exists.
**Done when:** triple parity is byte-exact on the events strings.

### B-30: CUDA kernel — batch ephemerides
**Category:** Compute · **Priority:** Medium
`cuda/chakra_ephem.cu`: `__device__` ports of kepler/helio/sunLon/moonLon/planetLon (branch-light, no globals), kernel mapping N epochs × 11 bodies → longitude array. Host program compares 32 samples against CPU (`lib/chakra.o` linked as reference) and reports throughput (epochs/s) vs single-thread C.
**Done when:** max |Δ| < 1e-9° on samples and a benchmark table prints on any CUDA GPU. CI execution is B-31.

### B-31: Validation CI matrix for bindings + CUDA
**Category:** CI/CD · **Priority:** Medium
Extend CI with jobs: python (build .so, run chakra-cli byte-match), rust (`cargo test`), go, dotnet, node; CUDA compiled with `nvcc --dry-run`-style check on hosted runners and executed on an optional self-hosted GPU runner label.
**Done when:** a PR touching `lib/chakra.c` runs the whole matrix.

### B-32: Android app + `build-android.sh` (preflight → debug APK)
**Category:** Mobile · **Priority:** High
`android/` Gradle project: `MainActivity` WebView loading `file:///android_asset/www/index.html` (JS on, no network perms needed). `build-android.sh`: `--doctor` preflight (JDK 17, `ANDROID_HOME`, platform + build-tools, NDK for B-33, gradle), copies the five pages + `src/` + `test-plan.json` into `assets/www/`, runs `:app:assembleDebug`, prints the APK path loudly.
**Done when:** the script takes a clean SDK machine to an installable debug APK of the full offline observatory.

### B-33: Android home-screen pañcāṅga widget (JNI → libchakra)
**Category:** Mobile · **Priority:** High
`AppWidgetProvider` + `chakra_jni.c` (CMake adds `../../lib/chakra.c`) exposing `panchangLine(y,m,d,ut,lat,lon)` → "Tithi · Nakṣatra · Vāra"; midnight + manual refresh; variants (moon phase %, next computed festival) as follow-ups. This is the popularity feature — the sky on the home screen, computed on-device, no network.
**Done when:** widget shows the correct live tithi and survives reboot.

### B-34: Play Store pipeline
**Category:** Mobile · **Priority:** Medium
`bundleRelease` + signing-config template (keystore instructions, secrets via env), versionCode from git tag, listing assets checklist, and the data-safety form answers (trivially: no collection).
**Done when:** an `.aab` uploads to the Play Console internal track without warnings.

## Jyotiṣa completeness

### B-35: Shadbala engine
**Category:** Jyotiṣa · **Priority:** High
Six strengths per classical Parāśara: Sthāna (incl. saptavargaja over the divisional set), Dig, Kāla (incl. horā/māsa/varṣa lords), Cheṣṭā (from true motion vs mean), Naisargika, Dṛk; output in ṣaṣṭiāṁśas + required-minimum table. Implement JS + C twins with pinned vectors for two published example charts.
**Done when:** both charts match a classical worked example within rounding.

### B-36: Avasthās
**Category:** Jyotiṣa · **Priority:** Medium
Bālādi (degree-quintile by odd/even sign), Jāgradādi (dignity-based), Dīptādi (nine-state) per planet; expose in the chart API envelope and as a Pro-view table with one-line meanings (cultural computation framing per DISCLAIMER).
**Done when:** states match Parāśara's rules on the vector charts from B-35.

### B-37: Vimśottarī nesting — antardaśā & pratyantardaśā
**Category:** Jyotiṣa · **Priority:** High
Extend `vimshottari()` to recursive proportional sub-periods (lord sequence restarting at the mahādaśā lord), exact day-level boundaries from the balance; Pro UI becomes an expandable tree; API `?api=dasha&depth=3`. Extends FW-3.
**Done when:** boundary dates match a published ephemeris table for a known birth datum to the day.

### B-38: Aṣṭakavarga
**Category:** Jyotiṣa · **Priority:** Medium
Bhinnāṣṭakavarga bindu matrices for the seven grahas + lagna from the classical benefic-house tables, and Sarvāṣṭakavarga totals; heat-strip UI over the chart; vectors pinning two charts.
**Done when:** SAV row sums equal the classical 337 total on test charts.

### B-39: Divisional charts D4–D60 (complete classical set)
**Category:** Jyotiṣa · **Priority:** Medium
Extend `vargaLon()` beyond the shipped D1/D2/D3/D7/D9/D10/D12 to the Parāśara set: D4, D16, D20, D24, D27 (bhāṁśa = nakṣatra grid), D40, D45, D60 with their distinct starting-sign rules; UI selector grows accordingly; extend `test-vargas.js` per varga (worked examples from BPHS commentaries).
**Done when:** every added varga has ≥2 pinned assertions and the selector renders it.

### B-40: D30 trimśāṁśa (irregular divisions)
**Category:** Jyotiṣa · **Priority:** Medium
The one non-uniform varga: odd signs 5°/5°/8°/7°/5° → Mars/Saturn/Jupiter/Mercury/Venus, even signs reversed; degrees-within by proportional stretch. Kept separate from B-39 because its rule shape breaks the uniform `(off*n)%30` pattern.
**Done when:** boundary cases (4°59′, 5°00′, 17°59′, 18°00′) land in the classical lords, tested.

### B-41: Runtime multi-ayanāṁśa switch
**Category:** Astronomy math · **Priority:** Medium
`ayan(y, school)` for Lahiri (default), Raman, KP, Fagan–Bradley, True-Citrā (Spica proper-motion anchored); flag threads through panchanga/chart/API (`&ayanamsa=kp`) and a Pro selector; learn-page table drives from the same constants.
**Done when:** switching schools moves a boundary lagna across a sign line exactly as the offsets predict, under test.

### B-42: Generalized udaya/pradoṣa/niśītha festival engine
**Category:** Core astronomy · **Priority:** High
Promote the v1.3.0 Dīpāvalī special-case into a rule table: each lunisolar festival declares its prevailing-window (sunrise / pradoṣa / niśītha / aparāhna) and the engine resolves the civil day at a reference location (Ujjain default, observer optional). Janmāṣṭamī (niśītha) and Mahāśivarātri (niśītha) are the next two consumers. Extends FW-2; C twin + vectors mandatory.
**Done when:** all three festivals match Drik-style published dates for 2024–2028 at Ujjain.

### B-43: Kṣaya-māsa + single-adhika guarantee
**Category:** Core astronomy · **Priority:** High
Fix the lunation-edge saṅkrānti test that produced the spurious second adhika flag of 2026 (field note under FW-6): evaluate saṅkrānti presence with exact crossing times rather than ±0.3 d endpoint sampling, and implement kṣaya (two saṅkrāntis in one lunation) with its classical paired-adhika resolution.
**Done when:** 2026 yields exactly one adhika row; the kṣaya test year 1982–83 (Māgha kṣaya) reproduces the classical sequence.

### B-44: Tamil vākya mode
**Category:** Schools · **Priority:** Low
Optional vākya-gaṇita lunar computation (Vākya candra sentences as data) selectable as a school, displaying its drift against dṛk live — pedagogy through contrast, honouring the tradition without pretending it is the observed sky.
**Done when:** vākya vs dṛk Moon differs by the historically expected minutes-of-arc band across a sample month.

## Astronomy & space operations

### B-45: SGP4/SDP4 propagator in the C core
**Category:** Space ops · **Priority:** High
Zero-allocation SGP4 (+SDP4 deep-space branch) from TLE inputs → ECI position/velocity → geodetic lat/lon/alt and observer Az/El; pass-prediction (`rise/peak/set`) scanner. Validate against published NORAD test vectors (< 1 km over 24 h).
**Done when:** the canonical SGP4 test-suite TLEs pass within tolerance in `test_chakra.c`-style vectors.

### B-46: Satellite radar UI
**Category:** UI · **Priority:** Medium
Pro view: paste TLEs → ground-track on the terminator globe, next-pass cards (Az/El/time), live sky-dome overlay of the satellite among the planets. Depends B-45; no network (user pastes TLEs).
**Done when:** ISS TLE pasted at a known epoch reproduces a published pass table.

### B-47: Vision star-tracker — lost-in-space solver
**Category:** Autonomy · **Priority:** Medium
Packed magnitude-filtered catalog (Hipparcos subset) as static arrays; triangle-hash of angular distances; match → QUEST quaternion attitude; on Earth, intersect boresight with sidereal time → lat/lon. Simulator page feeds synthetic frames; ≥95% ID rate on clean synthetic skies.
**Done when:** the simulator solves 100 random orientations with ≥95 correct matches, no network, no allocation in the C path.

### B-48: Topocentric positions toggle
**Category:** Astronomy math · **Priority:** Medium
Observer-surface parallax correction (dominant for the Moon, up to ~1°): flag through grahas/panchanga/telescope + Pro toggle; document effect on tithi edge cases.
**Done when:** Moon's topocentric–geocentric delta matches textbook values at horizon/zenith test cases.

### B-49: ΔT model (TT/UT bridge)
**Category:** Astronomy math · **Priority:** Medium
Espenak–Meeus polynomial ΔT(year) spanning −500…+2150; plumb TT internally where theory demands (prereq for B-20/B-22 precision claims); expose `?api=moment` field.
**Done when:** ΔT(2026) ≈ 69 s and historical spot values match the published table within their stated error.

### B-50: Full IAU constellation set
**Category:** Sky UI · **Priority:** Low
Grow the shipped 8-figure line set to all 88 (compact stick-figure dataset, equatorial, converted at load as today); optional IAU boundary polylines behind a second toggle.
**Done when:** toggling shows all 88 with labels, at no measurable frame cost on mobile.

### B-51: SDR hooks (experimental)
**Category:** Hardware · **Priority:** Low
Optional native-side interface (librtlsdr) turning engine-computed Doppler (from B-45 velocities) into tuning offsets; browser demo consumes pre-recorded IQ only. Clearly fenced as experimental; nothing in the core may depend on it.
**Done when:** a recorded ISS pass IQ file, replayed, tracks within the predicted Doppler curve.

## UI, growth & documentation

### B-52: Offline atlas + DST resolver
**Category:** UX · **Priority:** High
Bundled city gazetteer (top ~10k, name→lat/lon/tz) + compiled tz transition table (or coarse tz polygon pack) so birth-data entry stops requiring manual coordinates; strictly offline assets.
**Done when:** "Hyderabad, 1985-03-12 04:30" resolves to correct coordinates and historical UTC offset without network.

### B-53: Audience-mode slider
**Category:** UX · **Priority:** Medium
Header control — Layman / Ham / Astrologer / Researcher — progressively disclosing: story overlays → TLE/Doppler panels (B-45/46) → dense D-chart + daśā trees → delta plots & LaTeX (B-59/60). Pure client state, `?mode=` shareable.
**Done when:** each mode reads coherent on mobile and deep-links restore it.

### B-54: Gamified badges (no storage)
**Category:** Growth · **Priority:** Low
Deterministic achievements — *Time Weaver* (scrub landing to an actual 2026 eclipse geometry), *Wormhole Cartographer* (tune β so tour arrival lands on a chosen tithi), *Cosmic Navigator* (solve a B-47 sim frame) — emitting a verifiable hash string + shareable SVG card. No localStorage; state lives in the URL/hash. (Badge names credited as community-suggested concepts.)
**Done when:** badge hashes verify with a documented one-liner and screenshots look share-worthy.

### B-55: Client-side social exporter
**Category:** Growth · **Priority:** Medium
1080×1920 canvas "My Cosmic Footprint": birth-sky mini-astrolabe + lagna diamond + three hyper-specific computed lines; PNG in <50 ms, fully client-side; hooks on landing + Pro.
**Done when:** export renders crisply on a mid-range phone and contains zero network calls.

### B-56: Print layouts
**Category:** UX · **Priority:** Low
`@media print` stylesheets + a print action for chart/pañcāṅga/almanac (A4, ink-light theme). Extends FW-13.
**Done when:** browser print of the Pro lagna view yields a clean one-pager.

### B-57: PWA / installable offline
**Category:** UX · **Priority:** Medium
Manifest + service worker precaching the five pages, `src/`, and `test-plan.json`; update-on-reload strategy; verify `?api=` still functions offline. Extends FW-12.
**Done when:** airplane-mode reload serves the full observatory and Lighthouse installability passes.

### B-58: i18n through ILM scripts
**Category:** Accessibility · **Priority:** Medium
Label/string tables routed through Romenagri-safe ASCII-7 keys so UI chrome renders in Devanāgarī, Telugu, Urdu (and onward per the ILM three-axis architecture) without touching computation; language picker in the theme row.
**Done when:** switching to Devanāgarī relabels the Pro chrome with zero layout breakage.

### B-59: Researcher export modes
**Category:** Research · **Priority:** Low
Per-view exports: CSV telemetry (event lists, ephemeris tables), LaTeX equation+result blocks, and a generated Jupyter notebook that recomputes the current view via the Python binding (B-23).
**Done when:** the notebook runs top-to-bottom on a clean venv and matches the page's numbers.

### B-60: Ephemeris-delta dashboard
**Category:** Research · **Priority:** Low
Live Schlyter-vs-DE440 comparison plots (Δλ per body over time, tithi-boundary shifts), powered by B-20 — the honesty instrument for the precision upgrade.
**Done when:** the dashboard reproduces the known arcminute-scale Schlyter error envelope.

### B-61: Textbook Vol. I — Celestial Mechanics & Spherical Trigonometry
**Category:** Documentation · **Priority:** Medium
`/textbooks/vol1-celestial-mechanics/` in Markdown+LaTeX: expand learn §1–§7 into a teachable book — ellipse geometry, Kepler's equation, frames & rotations, sidereal time, eclipse limits — each chapter ending with "the code that runs this" pointing at the exact functions, plus exercises with answers generated by the engine.
**Done when:** `pandoc` builds a clean PDF and every formula cross-links a function.

### B-62: Textbook Vol. II — Relativistic & Interstellar Timekeeping
**Category:** Documentation · **Priority:** Medium
Lorentz kinematics, proper vs coordinate time, the twin resolution, 1 g brachistochrone profiles, calendars at relativistic arrival — formalising `tour.html` + `chakra-voyage.js` with worked problems.
**Done when:** the α Cen worked example matches the site to the digit.

### B-63: Textbook Vol. III — Tradition-wise Divergence Matrices
**Category:** Documentation · **Priority:** Medium
The comparative volume al-Bīrūnī would have wanted executable: ayanāṁśa schools, dṛk vs vākya, amānta/pūrṇimānta, Sunni/Shia tabular sets, Hebrew deḥiyyot, Gregorian reform — each divergence stated as *rule → formula → computed example table* generated from the engine.
**Done when:** every divergence table in the book is regenerable by a committed script.

### B-64: Auto-mint DOI on release tag
**Category:** Release automation · **Priority:** Low
CI job on `v*` tags: build tarball, run B-21's script against Zenodo **sandbox** by default; the production mint stays a manually-triggered workflow requiring a maintainer approval environment. Depends B-18, B-21.
**Done when:** tagging `v1.4.0-test` produces a sandbox deposition link in the job log and nothing real.
