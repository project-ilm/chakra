# CHAKRA — Assumptions & Precision

Every number CHAKRA shows is computed from first principles inside `chakra-core.js`. These are the modelling choices and their consequences. Read this before trusting any output for anything that matters.

## Ephemeris
- **Model**: Paul Schlyter's low-precision analytic elements, all planets + Moon + mean lunar node.
- **Accuracy**: Sun and Moon to arcminutes over ±1 century of J2000; planets to ≲1°; the Moon uses a truncated perturbation series.
- **Not modelled**: ΔT (TT−UT), nutation, aberration, topocentric parallax, atmospheric refraction. Rise/set-adjacent quantities can shift by minutes; the Moon's parallax alone can approach 1°.
- **Node**: mean node (Rāhu/Ketu). True-node option is future work.
- **Verification anchors** (in `test/`): Spica sidereal longitude 179.99° (the Lahiri/Citrā-pakṣa definition), all four 2026 eclipses on their exact civil dates, full moon 2026-06-29 at elongation 180.000°, ascendant solver residual 0.0000°.

## Ayanāṁśa
Lahiri (Citrā-pakṣa) via polynomial fit. Divergence from the official Rashtriya Panchang value stays within ~0.01° across 1900–2100 — invisible at the app's precision, but it is a fit, not the IAE tables.

## Calendars
- **Hijrī (both)**: *tabular* 30-year cycles — Sunni (Kuwaiti) leap set {2,5,7,10,13,16,18,21,24,26,29}, Shia (Ithnā-ʿAsharī) {2,5,8,10,13,16,19,21,24,27,29}. Real months begin at *sighting*; tabular dates can differ by ±1–2 days and by region. The two reckonings genuinely diverge (e.g. 2026-06-16 is 30 Dhū al-Ḥijja 1447 Sunni but 1 Muḥarram 1448 Shia).
- **Hebrew**: standard fixed (Hillel II) arithmetic; epoch offset **347999** calibrated against published anchors (2000-01-01 = 23 Tevet 5760; 2026-04-06 = 19 Nisan 5786; Rosh Hashana 5786 = 2025-09-23; Pesach 5784 = 2024-04-23). Civil-day convention: observance begins the *previous sunset*.
- **Nanakshahi**: New Year fixed 14 March; Phagun takes 31 days when the *following* Gregorian year is leap.
- **Solar Hijrī**: astronomical Nowruz (Sun crossing tropical 0° in Tehran-noon terms at this precision).
- **Vedic solar**: saṁvatsara/Śaka/Vikrama switch at sidereal Meṣa saṅkrānti (sauramāna convention).

## Hindu luni-solar months & festivals
- **Amānta rule, computed**: a month runs new moon → new moon and is named for the sidereal rāśi the Sun **enters** during it. A month containing **no** saṅkrānti is **adhika** and hosts no festivals (2026's adhika māsa is handled by construction). **Kṣaya** (two saṅkrāntis in one lunation — rare, clustered near perihelion) is flagged as future work and currently takes the first entry's name.
- **Tithi convention**: festival tithis are evaluated at **noon UT-of-day**, not at local sunrise (udaya-vyāpinī). Regional panchāṅgas using sunrise rules can differ by one day — this is the single largest source of ±1-day disagreement with published panchāṅgas.
- **Verified against 2026**: Makara Saṅkrānti, Mahāśivarātri (15 Feb), Holi pūrṇimā (3 Mar — the lunar-eclipse day), Rāma Navamī, Buddha Pūrṇimā (1 May), Rakṣā Bandhana & Janmāṣṭamī (post-adhika, late Aug/early Sep), Vijayadaśamī, Dīpāvalī (~8 Nov), plus Pesach, Rosh Hashana, Eid al-Fiṭr, ʿĀshūrā, Arbaʿīn, Vaisakhi — 15/15 assertions in `test/test-events.js`.

## Jyotiṣa
- **Houses**: whole-sign from the sidereal ascendant. **Kālasarpa**: strict definition — all seven grahas on one side of the Rāhu–Ketu axis (schools differ; some exclude the Moon or accept partial). **Maṅgala Doṣa**: houses {1,2,4,7,8,12} checked from Lagna, Moon *and* Venus — many traditions use subsets and cancellation rules CHAKRA does not apply. **Vimśottarī**: mahādaśā sequence only (no antardaśā yet), computed from the Moon's sidereal longitude; the app deliberately frames any chart as "this moment read as janma-kuṇḍalī".
- All astrological output is **cultural/heritage computation, not prediction or advice**.

## Telescope numbers
RA/Dec are **of-date** (ecliptic→equatorial via mean obliquity), Alt/Az geometric — **no refraction**, no parallax. Fine for finding a planet in a finder scope; do not drive unattended GoTo slews near the horizon from these numbers.


---
© 1993–2026 Abhishek Choudhary. This document is licensed under [CC BY-SA 4.0](../LICENSE-docs).
CHAKRA is study/heritage software — see [DISCLAIMER](../DISCLAIMER.md).
