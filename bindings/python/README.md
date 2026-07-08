# chakra-observatory

Offline, dependency-free astronomical & calendrical computation — the Python
face of the [CHAKRA Temporal Cycle Observatory](https://github.com/project-ilm/chakra).
Pañcāṅga, ten calendar traditions, planetary positions, eclipses and jyotiṣa,
all from live geometry (no lookup tables, no network).

## Install

```bash
# from the repo (builds against the bundled C core)
make -C ../../lib libchakra.so chakra
pip install .
```

## Use

```python
import chakra_obs as ck
ck.panchanga(2026, 8, 12, 6.5, lat=28.61, lon=77.21)
# {'vara': 'Budhavāra', 'tithi': 'Pūrṇimā/Amāvāsyā (Kṛṣṇa)', 'nakshatra': 'Āśleṣā', ...}

ck.calendars(2026, 6, 16)   # the ten reckonings, incl. Sunni/Shia Hijrī split
ck.events(2026)             # computed festivals & eclipses
```

## CLI

```bash
chakra-cli panchang  --date 2026-08-12 --time 06:30 --lat 28.61 --lon 77.21
chakra-cli calendars --date 2026-06-16
chakra-cli events    --year 2026
chakra-cli kundali   --date 1990-05-15 --time 06:30 --lat 17.38 --lon 78.48
```

Add `--json` to any command for the raw envelope (handy for piping into other
tools or an AI packet). Backend is chosen automatically: ctypes against
`libchakra.so` when present, else the `chakra` CLI.

© 1993–2026 Abhishek Choudhary. GPL-3.0-or-later.
