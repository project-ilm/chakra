# Changelog

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
