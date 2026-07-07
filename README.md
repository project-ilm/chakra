# CHAKRA — Temporal Cycle Observatory

**One offline HTML file family that is simultaneously: a geared solar-system observatory, a 12-tradition calendrical almanac with a computed festival engine, a jyotiṣa instrument, a telescope-pointing readout, a tested computation library, and a zero-server JSON API.**

No dependencies. No network. No tracking. Open `index.html` from disk and everything runs.


## Collaborate — with Claude, ChatGPT, or by hand
CHAKRA is built to be extended in small, safe packets:
1. Pick an issue — `docs/BACKLOG.md` (B-series, 49 seeded) or `docs/FURTHER-WORK.md` (FW-series).
2. Paste it into Claude/ChatGPT together with `CONTEXT.md` + `CONTRACTS.md` (every AI prompt on the site is pre-seeded with these pointers, and each offers a one-tap **Open in Claude / ChatGPT** link).
3. Get a patch that respects the invariants (offline, lookup-free, JS↔C parity, zero-alloc in C, sole authorship).
4. Run the gate: `node test/run.js && make -C lib test`. Green everywhere → open a PR.

CI (`.github/workflows/ci.yml`) re-runs that gate plus an inline-script syntax check and a forbidden-name sweep on every push.

## The site
| page | what it is |
|---|---|
| [`index.html`](https://project-ilm.github.io/chakra/) | landing — the Moon as it is right now inside an astrolabe of true planet positions; today across ten calendars; what's coming up |
| [`pro.html`](https://project-ilm.github.io/chakra/pro.html) | the full observatory — nine instruments, every graph an input, ✦ AI prompts per view |
| [`learn.html`](https://project-ilm.github.io/chakra/learn.html) | the mathematics, the schools, the history, the spacecraft — six interactive sims |
| [`tour.html`](https://project-ilm.github.io/chakra/tour.html) | relativistic interstellar tour planner; arrival dates in ten calendars |
| [`tests.html`](https://project-ilm.github.io/chakra/tests.html) | fetches `test-plan.json` and runs 26 anchored cases in *your* browser |

Themes: append `?theme=solar` (or `terminal`, `contrast`) to any page.

## Quick start
```bash
git clone https://github.com/project-ilm/chakra && cd chakra
xdg-open index.html          # or just double-click it
node test/run.js             # 10 suites · 115 assertions · exits non-zero on failure
```

## The URL is an API
Append `?api=…` and the same file answers in JSON instead of pixels:

```
index.html?api=panchang&date=2026-08-12&lat=28.61&lon=77.21&tz=5.5
index.html?api=telescope&date=2026-07-04&time=21:30&lat=17.38&lon=78.48&tz=5.5
index.html?api=calendars&date=2026-06-16        ← the day Sunni and Shia tabular Hijrī diverge
index.html?api=yogas | dasha | chart | eclipses | almanac | moment | events&year=2026
```
Headless too: `require("./src/chakra-kernel.js").create({...}).moment()` in Node.

## What's inside
- **Observatory** — draggable geared orrery; drag *any* graph to set the epoch; drag the ascendant hand and CHAKRA solves for the time; click a spectrum peak to phase-lock; click an eclipse or festival to travel there. Every graph is an input.
- **Calendars, side by side** — Gregorian/JD · tabular Hijrī · **Sunni & Shia tabular reckonings separately** · Solar Hijrī · Vedic (saṁvatsara/Śaka/Vikrama/Kali) · **Hebrew** · **Sikh Nanakshahi** · Chinese sexagenary · Tibetan · Mayan Long Count · precessional age.
- **Computed festivals** — `annualEvents(Y)`: amānta Hindu months by the classical saṅkrānti rule (adhika-māsa handled), Islamic dates in both reckonings, Jewish, Sikh, all saṅkrāntis, the year's eclipses. 2026 verified: Holi lands on the 3 March lunar eclipse, Dīpāvalī 8 Nov (pradoṣa-vyāpinī @ Ujjain — `docs/ASSUMPTIONS.md`), Mahāśivarātri 15 Feb — 15/15 test assertions.
- **Jyotiṣa** — pañcāṅga (tithi/nakṣatra/yoga/karaṇa + Sufi manzil), rāśi chart, Kālasarpa · Maṅgala Doṣa · Gaja-Kesari · Mahāpuruṣa · Sāḍe-Sātī and more, Vimśottarī mahādaśā timeline. Framed as cultural computation, never prediction.
- **Sky & telescope** — dome/AR sky with all 27 nakṣatra yogatārās; RA/Dec · Alt/Az · hour-angle for the nine grahas, on screen and over the API.
- **Printable almanac** — 🖨 button; `@media print` produces a clean festival sheet.

## Architecture (see `docs/ARCHITECTURE.md`)
```
index.html  →  chakra-ui.js  /  chakra-api.js
                     ↓              ↓
               chakra-kernel.js (state · moment() · bus · inverse solvers)
                     ↓
               chakra-core.js  (pure: ephemeris · calendars · yoga · events)
```
The core is UMD — the identical file runs in the browser and under `require()` in Node, which is how the test suite consumes it.

## Verification anchors (all in `test/`)
Spica sidereal **179.99°** (the Lahiri definition) · all four 2026 eclipses on exact dates (17 Feb, 3 Mar, 12 Aug, 28 Aug) · full moon 2026-06-29 at elongation 180.000° · ascendant solver residual 0.0000° · Hebrew epoch calibrated to four published dates · Sunni/Shia divergence 2026-06-16 · 15 festival anchors for 2026.

## Precision, honestly
Low-precision analytic ephemeris (arcminutes for Sun/Moon, ≲1° planets), no ΔT/refraction/parallax, tabular (not sighted) Hijrī, noon-tithi convention (±1 day vs sunrise-rule panchāṅgas). Full detail: `docs/ASSUMPTIONS.md`. Feature matrix vs Drik Panchang / Jagannatha Hora / Stellarium / SkySafari — including where CHAKRA loses: `docs/COMPARISON.md`.


## The core in C (`lib/`)
The same engine in C99 for firmware, kiosks and e-paper: `make && make test` builds `libchakra.a`, a JSON CLI, and runs a **6,590-check parity harness** against vectors generated from the JS reference — calendar fields exact, festival strings byte-identical (diacritics included). No heap, `-lm` only. See [`lib/README.md`](lib/README.md).

## License & authorship
Code **GPL-3.0-or-later** (`LICENSE`) · documentation **CC BY-SA 4.0** (`LICENSE-docs`) · © 1993–2026 **Abhishek Choudhary**, sole author. Not for navigation, muhūrta-critical, or safety-critical use — `DISCLAIMER.md`.

Part of **Project ILM** · https://github.com/project-ilm · live: https://project-ilm.github.io/chakra/
