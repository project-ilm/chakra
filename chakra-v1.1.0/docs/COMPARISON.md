# CHAKRA vs the field — an honest matrix

Compared against the tools people actually use: **Drik Panchang** (web panchāṅga), **Jagannatha Hora** (deep jyotiṣa desktop), **Stellarium** (planetarium), **SkySafari** (mobile telescope control). CHAKRA is not trying to beat any of them at their core game; the point is what it uniquely combines.

| Capability | CHAKRA | Drik Panchang | Jagannatha Hora | Stellarium | SkySafari |
|---|---|---|---|---|---|
| Ephemeris precision | ~arcmin luminaries, ≲1° planets | high (Swiss Eph-class) | high (Swiss Eph) | very high | very high |
| Sunrise-rule tithi (udaya) | ✗ (noon convention, ±1 d) | ✓ | ✓ | n/a | n/a |
| Muhūrta / horā / choghaḍiyā | ✗ | ✓ | ✓ | n/a | n/a |
| Divisional charts (D9…) | ✗ (D1 only) | partial | ✓ deep | n/a | n/a |
| Daśā depth | mahā only | mahā+antar | 5 levels, many systems | n/a | n/a |
| Yogas | 12 named, tested | many | hundreds | n/a | n/a |
| Multi-tradition calendars on one screen | **12 traditions** | Hindu+Gregorian | Hindu | ✗ | ✗ |
| Sunni **and** Shia Hijrī side by side | **✓ (tabular)** | ✗ | ✗ | ✗ | ✗ |
| Hebrew + Nanakshahi + Mayan + Tibetan + Chinese | **✓** | ✗ | ✗ | ✗ | ✗ |
| Computed festival engine w/ adhika-māsa | ✓ (15 anchored tests) | ✓ (authoritative) | partial | ✗ | ✗ |
| Star catalogue | 45 stars (every nakṣatra yogatārā) | n/a | n/a | millions | millions |
| Telescope | RA/Dec/Alt/Az/HA readout + JSON API | ✗ | ✗ | ✓ full control | ✓ ASCOM/INDI control |
| Eclipse engine | dates ✓ (4/4 2026), magnitudes ✗ | ✓ | ✓ | ✓ full | ✓ |
| Works as one offline `file://` HTML | **✓** | ✗ (online) | ✗ (install) | ✗ (install) | ✗ (app) |
| URL → JSON API, zero server | **✓** | ✗ | ✗ | partial (scripting) | ✗ |
| Every graph is an input (inverse solvers) | **✓** | ✗ | ✗ | ✗ | ✗ |
| Open source | **GPL-3.0** | ✗ | free, closed | GPL | ✗ |
| Test suite in repo | 74 assertions | — | — | ✓ | — |

**Where CHAKRA loses, clearly**: astrometric precision, muhūrta-grade panchāṅga, jyotiṣa depth (JHora is decades ahead), sky-catalogue depth, and actual mount control.

**Where nothing else sits**: a single self-contained offline file that is simultaneously a multi-tradition calendrical observatory, a tested computation library, and a JSON API — with the inverse-solver interaction model (drag the ascendant to solve for time, click a spectrum peak to phase-lock an epoch, click a festival to travel there).


---
© 1993–2026 Abhishek Choudhary. This document is licensed under [CC BY-SA 4.0](../LICENSE-docs).
CHAKRA is study/heritage software — see [DISCLAIMER](../DISCLAIMER.md).
