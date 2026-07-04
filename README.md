# CHAKRA — Temporal Cycle Observatory

**One offline HTML file family that is simultaneously: a geared solar-system observatory, a 12-tradition calendrical almanac with a computed festival engine, a jyotiṣa instrument, a telescope-pointing readout, a tested computation library, and a zero-server JSON API.**

No dependencies. No network. No tracking. Open `index.html` from disk and everything runs.

## Quick start
```bash
git clone https://github.com/project-ilm/chakra && cd chakra
xdg-open index.html          # or just double-click it
node test/run.js             # 7 suites · 74 assertions · exits non-zero on failure
```

## The URL is an API
Append `?api=…` and the same file answers in JSON instead of pixels:

```
index.html?api=panchang&date=2026-08-12&lat=28.61&lon=77.21&tz=5.5
index.html?api=telescope&date=2026-07-04&time=21:30&lat=17.38&lon=78.48&tz=5.5
index.html?api=calendars&date=2026-06-16        ← the day Sunni and Shia tabular Hijrī diverge
index.html?api=yogas | dasha | chart | eclipses | almanac | moment
```
Headless too: `require("./src/chakra-kernel.js").create({...}).moment()` in Node.

## What's inside
- **Observatory** — draggable geared orrery; drag *any* graph to set the epoch; drag the ascendant hand and CHAKRA solves for the time; click a spectrum peak to phase-lock; click an eclipse or festival to travel there. Every graph is an input.
- **Calendars, side by side** — Gregorian/JD · tabular Hijrī · **Sunni & Shia tabular reckonings separately** · Solar Hijrī · Vedic (saṁvatsara/Śaka/Vikrama/Kali) · **Hebrew** · **Sikh Nanakshahi** · Chinese sexagenary · Tibetan · Mayan Long Count · precessional age.
- **Computed festivals** — `annualEvents(Y)`: amānta Hindu months by the classical saṅkrānti rule (adhika-māsa handled), Islamic dates in both reckonings, Jewish, Sikh, all saṅkrāntis, the year's eclipses. 2026 verified: Holi lands on the 3 March lunar eclipse, Dīpāvalī ≈ 8 Nov, Mahāśivarātri 15 Feb — 15/15 test assertions.
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

## License & authorship
Code **GPL-3.0-or-later** (`LICENSE`) · documentation **CC BY-SA 4.0** (`LICENSE-docs`) · © 1993–2026 **Abhishek Choudhary**, sole author. Not for navigation, muhūrta-critical, or safety-critical use — `DISCLAIMER.md`.

Part of **Project ILM** · https://github.com/project-ilm · live: https://project-ilm.github.io/chakra/
