# Changelog

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
