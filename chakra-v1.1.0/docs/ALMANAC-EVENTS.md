# CHAKRA — Computed annual events

`Chakra.annualEvents(year)` returns every observance below **computed from the ephemeris and calendar engines** — nothing is a lookup table. Rules, in the order applied:

## Jewish (Hebrew fixed calendar)
Rosh Hashana (1 Tishri), Yom Kippur (10 Tishri), Sukkot (15 Tishri), Pesach (15 Nisan), Shavuot (6 Sivan), Hanukkah (25 Kislev). Civil-day convention; observance begins the previous sunset.

## Islamic (both tabular reckonings, ±1–2 d vs sighting)
Islamic New Year (1 Muḥarram), ʿĀshūrā (10 Muḥarram), Arbaʿīn (20 Ṣafar, Shia), Mawlid (12 Rabīʿ I Sunni / 17 Rabīʿ I Shia), Ramaḍān (1 Ramaḍān), Eid al-Fiṭr (1 Shawwāl), Eid al-Aḍḥā (10 Dhū al-Ḥijja). Sunni and Shia rows are listed separately when their tabular dates differ.

## Sikh (Nanakshahi)
Nanakshahi New Year (1 Chet = 14 Mar), Vaisakhi (1 Vaisakh = 14 Apr), Guru Nanak Gurpurab (Kārtika pūrṇimā — luni-solar, shared with the Hindu list).

## Hindu — solar
All twelve saṅkrāntis (sidereal, Lahiri), with Meṣa flagged as solar new year and Makara as Uttarāyaṇa.

## Hindu — luni-solar (amānta, computed)
Month = new moon → new moon, named for the rāśi the Sun **enters** inside it; a month with no saṅkrānti is **adhika** and hosts no festivals. Then: Holi (Phālguna pūrṇimā), Ugadi/Gudi Padwa (Caitra Ś1), Rāma Navamī (Caitra Ś9), Buddha Pūrṇimā (Vaiśākha), Guru Pūrṇimā (Āṣāḍha), Rakṣā Bandhana (Śrāvaṇa pūrṇimā), Janmāṣṭamī (Śrāvaṇa K8), Navarātri (Āśvina Ś1), Vijayadaśamī (Āśvina Ś10), Dīpāvalī (Āśvina amāvāsyā), Kārtika Pūrṇimā, Mahāśivarātri (Māgha K14). Tithis evaluated at noon-of-day — see ASSUMPTIONS.md for the ±1-day caveat vs sunrise-rule panchāṅgas.

## Astronomical
All solar and lunar eclipses of the year (dates; the four 2026 eclipses are test anchors).

## 2026 verification (all asserted in `test/test-events.js`)
| Event | Computed | 
|---|---|
| Makara Saṅkrānti | 2026-01-14 |
| Mahāśivarātri | 2026-02-15 |
| Holi pūrṇimā | 2026-03-03 (lunar-eclipse day) |
| Eid al-Fiṭr (tabular) | ~2026-03-20 |
| Pesach | 2026-04-02 |
| Vaisakhi | 2026-04-14 |
| Buddha Pūrṇimā | 2026-05-01 |
| ʿĀshūrā | 2026-06-25/26 (Shia/Sunni tabular) |
| Rakṣā Bandhana | late Aug (post-adhika) |
| Janmāṣṭamī | early Sep |
| Rosh Hashana 5787 | 2026-09-12 |
| Vijayadaśamī | ~2026-10-20 |
| Dīpāvalī | ~2026-11-08 |

In the app: **Almanac → Festivals** — every row is clickable and time-travels the whole observatory to that day; 🖨 prints the almanac.


---
© 1993–2026 Abhishek Choudhary. This document is licensed under [CC BY-SA 4.0](../LICENSE-docs).
CHAKRA is study/heritage software — see [DISCLAIMER](../DISCLAIMER.md).
