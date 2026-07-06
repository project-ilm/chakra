# libchakra — the CHAKRA core in C99

A faithful C port of `src/chakra-core.js`: Schlyter ephemeris, Lahiri
ayanāṁśa, pañcāṅga, twelve calendar traditions (Sunni & Shia tabular Hijrī,
Solar Hijrī, Hebrew, Nanakshahi, saṁvatsara/Śaka/Vikrama, Chinese, Mayan),
Vimśottarī daśā, yogas, eclipses, telescope coordinates, and the computed
amānta festival engine — for microcontrollers, kiosks, e-paper panels, and
anywhere JavaScript doesn't reach.

**Parity, mechanically enforced.** `make vectors` runs the JS reference and
writes `vectors.h`; `make test` then checks the C build against it — hundreds
of ephemeris/calendar samples, solver outputs, all 2026 eclipses, and the
**byte-exact** festival lists for 2026 and 2027 (UTF-8 diacritics included).
If the two cores ever disagree, the build fails.

```sh
make            # libchakra.a + the `chakra` CLI
make vectors    # regenerate expected values from the JS core (needs node)
make test       # C ↔ JS parity run

./chakra panchang  date=2026-08-12 time=06:30 lat=28.61 lon=77.21 tz=5.5
./chakra calendars date=2026-06-16          # Sunni/Shia divergence day
./chakra events    year=2026                # full computed festival list
./chakra telescope date=2026-07-04 time=21:30
```

C99 + libm only. No heap allocation — every function fills caller buffers.
Strings are UTF-8, byte-identical to the JS core's output. `ck_annual_events`
uses a static scratch buffer and is not re-entrant; everything else is.

Same assumptions and precision as the JS core — see `../docs/ASSUMPTIONS.md`.
GPL-3.0-or-later · © 1993–2026 Abhishek Choudhary · not for navigation or
muhūrta-critical use (`../DISCLAIMER.md`).
