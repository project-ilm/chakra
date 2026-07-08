# CHAKRA — BASIC bindings

Two heritage-target ports of the CHAKRA panchāṅga core, sharing the same
astronomy as `src/chakra-core.js` (the reference implementation).

## Files

| file | target | what it does |
|---|---|---|
| `CHAKRA.BAS` | **GW-BASIC 3.23**, PC-BASIC, DOSBox | line-numbered, text-only panchāṅga: enter a date/time, get tithi, nakṣatra, vāra, Sun/Moon longitude, Lahiri ayanāṁśa, and a tabular-Hijrī date. |
| `CHAKRA_QB64.BAS` | **QB64 / QB64-PE** | graphical: draws an astrolabe (Moon with a computed terminator, planets on a zodiac ring) beside a panchāṅga panel. |

Same math, two eras: `CHAKRA.BAS` runs on a 1983 interpreter; `CHAKRA_QB64.BAS`
uses QB64's `SCREEN`/`_RGB32` graphics for a modern window.

## Running

**GW-BASIC** (via [PC-BASIC](https://robhagemans.github.io/pcbasic/), recommended):
```
pcbasic CHAKRA.BAS
```
or inside DOSBox with a real `GWBASIC.EXE`:
```
GWBASIC CHAKRA.BAS
```

**QB64** ([qb64phoenix.com](https://qb64phoenix.com/)):
open `CHAKRA_QB64.BAS` in the QB64 IDE and press **F5**, or compile:
```
qb64 -c CHAKRA_QB64.BAS -o chakra_qb64
./chakra_qb64
```

## How each routine maps to `chakra-core.js`

| BASIC (GW line / QB64 SUB) | `chakra-core.js` | computes |
|---|---|---|
| `GOSUB 2000` / `SUB DayNumber` | `dayNo()` / `jdnOf()` | days from J2000.0, Julian Day Number |
| `GOSUB 2500` / `SUB SunLon` | `sunLon()` | Sun's ecliptic longitude (Schlyter) |
| `GOSUB 3000` / `SUB MoonLon` | `moonLon()` | Moon's longitude with the 10 main perturbation terms |
| `GOSUB 3500` (inline in QB64) | `ayan()` | Lahiri ayanāṁśa (linear fit) |
| `GOSUB 2900` / `FUNCTION Rev#` | `rev()` | reduce an angle to 0–360° |
| `GOSUB 9100` / `FUNCTION Atan2#` | `Math.atan2` | two-argument arctangent (GW-BASIC has only `ATN`) |
| `GOSUB 4000` | naming tables | tithi / pakṣa / nakṣatra / vāra names |
| `GOSUB 5000` | `hijriTabular()` | Kuwaiti/Sunni 30-year tabular Hijrī |
| `SUB PlanetRing` (QB64) | `grahas()` (approx.) | rough planet longitudes for the astrolabe ring only |

## Precision — read this

These are **teaching/heritage ports**, single-precision-friendly:

- Sun and Moon longitudes reproduce the JS core within a fraction of a degree —
  enough that **tithi, pakṣa, nakṣatra and vāra names match** the website for
  ordinary dates. For 2026-08-12 06:30 UT both give **Amāvāsyā · Āśleṣā ·
  Budhavāra**, Sun ≈ 139.6°, Moon ≈ 133.3°.
- The QB64 astrolabe's **planet** ring uses crude mean longitudes (`SUB
  PlanetRing`) purely to place dots — it is *not* chart-grade for planets. The
  Sun, Moon, tithi and nakṣatra are the accurate parts.
- Near a tithi boundary the fractional-degree difference can shift the tithi by
  one; the authoritative computation is the C core (`lib/`) and the JS core.
- Full planetary accuracy, eclipses, the other nine calendars and the pradoṣa
  Dīpāvalī rule live in the C/JS cores, not here. Porting more of them to BASIC
  is tracked as backlog **B-24**.

© 1993–2026 Abhishek Choudhary, sole author. GPL-3.0-or-later.
