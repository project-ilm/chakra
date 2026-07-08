"""
chakra_obs.cli — the `chakra-cli` console entry point.

Subcommands mirror what the website and the HTML test console show:

    chakra-cli panchang   --date 2026-08-12 --time 06:30 --lat 28.61 --lon 77.21
    chakra-cli calendars  --date 2026-06-16
    chakra-cli events     --year 2026
    chakra-cli kundali    --date 1990-05-15 --time 06:30 --lat 17.38 --lon 78.48
    chakra-cli almanac    --year 2026          (alias for events, grouped)

Output is human text by default; add --json for the raw envelope so other tools
(or an AI packet) can consume it. Every number comes from the same C core as
the site, so `chakra-cli calendars --date 2026-06-16` matches the browser to
the byte.

Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
"""
from __future__ import annotations
import argparse
import json as _json
import sys

from .core import Chakra, ChakraError, _RASHI, _find_cli, _CliBackend


def _parse_dt(date, time):
    Y, M, D = (int(x) for x in date.split("-"))
    hh, mm = 12, 0
    if time:
        parts = time.split(":")
        hh = int(parts[0]); mm = int(parts[1]) if len(parts) > 1 else 0
    return Y, M, D, hh + mm / 60.0


# ── ASCII North-Indian diamond chart ────────────────────────────────────────
# Houses laid out in the classic diamond; house 1 is the top-centre triangle,
# counted anticlockwise. We place each graha's glyph in its house cell.
_GLYPH = {"Sun": "Su", "Moon": "Mo", "Mars": "Ma", "Mercury": "Me",
          "Jupiter": "Ju", "Venus": "Ve", "Saturn": "Sa",
          "Rahu": "Ra", "Ketu": "Ke"}


def _north_chart(asc_sign, houses):
    """houses: dict 1..12 -> list of body names. asc_sign: 0..11.
    Returns a list of text lines drawing the diamond."""
    def cell(h):
        sign = (asc_sign + h - 1) % 12 + 1
        bodies = " ".join(_GLYPH.get(b, b[:2]) for b in houses.get(h, []))
        return sign, bodies

    s = {h: cell(h) for h in range(1, 13)}
    L = []
    W = 48
    L.append("+" + "-" * W + "+")

    def row(txt):
        L.append("|" + txt.center(W) + "|")

    def two(a, b):
        L.append("|" + a.center(W // 2) + b.center(W - W // 2) + "|")

    # top band: H12  H1  H2  (H1 is the top diamond)
    row(f"[{s[1][0]}] {s[1][1]}".strip())
    two(f"[{s[12][0]}] {s[12][1]}".strip(), f"[{s[2][0]}] {s[2][1]}".strip())
    # upper-middle: H11  (center diamonds H1/H... ) H3
    two(f"[{s[11][0]}] {s[11][1]}".strip(), f"[{s[3][0]}] {s[3][1]}".strip())
    row("- - - - - - - - - - - - - - -")
    # middle: H10  H4
    two(f"[{s[10][0]}] {s[10][1]}".strip(), f"[{s[4][0]}] {s[4][1]}".strip())
    # lower-middle: H9  H5
    two(f"[{s[9][0]}] {s[9][1]}".strip(), f"[{s[5][0]}] {s[5][1]}".strip())
    row("- - - - - - - - - - - - - - -")
    # bottom band: H8  H6 ; H7 bottom diamond
    two(f"[{s[8][0]}] {s[8][1]}".strip(), f"[{s[6][0]}] {s[6][1]}".strip())
    row(f"[{s[7][0]}] {s[7][1]}".strip())
    L.append("+" + "-" * W + "+")
    return L


def _cmd_panchang(ck, a):
    Y, M, D, ut = _parse_dt(a.date, a.time)
    pc = ck.panchanga(Y, M, D, ut, a.lat, a.lon)
    if a.json:
        print(_json.dumps(pc, ensure_ascii=False, indent=2)); return
    print(f"Pañcāṅga · {a.date} {a.time or '12:00'} UT · {a.lat}°, {a.lon}°")
    print("-" * 44)
    print(f"  Vāra      : {pc.get('vara')}")
    print(f"  Tithi     : {pc.get('tithi')}  (#{pc.get('tithi_index','?')})")
    print(f"  Nakṣatra  : {pc.get('nakshatra')}")
    if pc.get("karana"):
        print(f"  Karaṇa    : {pc.get('karana')}")
    print(f"  JDN       : {pc.get('jdn')}")
    print(f"  [backend: {pc.get('backend')}]")


def _cmd_calendars(ck, a):
    cals = ck.calendars(*(int(x) for x in a.date.split("-")))
    if a.json:
        print(_json.dumps(cals, ensure_ascii=False, indent=2)); return
    print(f"Ten calendars · {a.date}")
    print("-" * 44)
    for k, v in cals.items():
        print(f"  {k:22s}: {v}")


def _cmd_events(ck, a):
    ev = ck.events(a.year)
    if a.json:
        print(_json.dumps(ev, ensure_ascii=False, indent=2)); return
    print(f"Almanac · {a.year} · {len(ev)} computed events")
    print("-" * 60)
    for e in ev:
        note = f"  · {e.get('note')}" if e.get("note") else ""
        print(f"  {e['date']}  {e['name']:38s} [{e.get('tradition','')}]" + note)


def _cmd_kundali(ck, a):
    Y, M, D, ut = _parse_dt(a.date, a.time)
    cli = _find_cli()
    if not cli:
        raise ChakraError("kundali needs the `chakra` CLI (make -C lib chakra).")
    be = _CliBackend(cli)
    bodies = be.telescope(Y, M, D, ut, a.lat, a.lon)
    pc = ck.panchanga(Y, M, D, ut, a.lat, a.lon)
    # sidereal ascendant sign: derive from CLI moment if available, else from telescope asc
    env = be.moment(Y, M, D, ut, a.lat, a.lon)
    asc = env.get("ascendant") or env.get("lagna") or {}
    asc_sign = 0
    if isinstance(asc, dict) and "sign_index" in asc:
        asc_sign = int(asc["sign_index"])
    elif isinstance(asc, dict) and "lon" in asc:
        asc_sign = int(asc["lon"] // 30)
    # place bodies by their sidereal sign relative to ascendant
    houses = {h: [] for h in range(1, 13)}
    for nm, b in bodies.items():
        lon = b.get("sidLon", b.get("lon"))
        if lon is None:
            continue
        sign = int(lon // 30)
        h = ((sign - asc_sign) % 12) + 1
        houses[h].append(nm)
    if a.json:
        print(_json.dumps({"ascendant_sign": _RASHI[asc_sign],
                           "houses": houses, "panchanga": pc},
                          ensure_ascii=False, indent=2)); return
    print(f"Janma Kuṇḍalī (North Indian) · {a.date} {a.time or '12:00'} UT · "
          f"{a.lat}°, {a.lon}°")
    print(f"Lagna: {_RASHI[asc_sign]}  ·  {pc.get('tithi')}  ·  "
          f"{pc.get('nakshatra')}  ·  {pc.get('vara')}\n")
    for line in _north_chart(asc_sign, houses):
        print(line)
    print("\n[N] = rāśi number in that house · glyphs: Su Mo Ma Me Ju Ve Sa Ra Ke")


def main(argv=None):
    p = argparse.ArgumentParser(
        prog="chakra-cli",
        description="CHAKRA — offline panchāṅga, calendars, almanac & kundali.")
    p.add_argument("--json", action="store_true",
                   help="emit raw JSON instead of formatted text")
    sub = p.add_subparsers(dest="cmd", required=True)

    def add_dt(sp, need_year=False):
        if need_year:
            sp.add_argument("--year", type=int, required=True)
        else:
            sp.add_argument("--date", required=True, help="YYYY-MM-DD")
            sp.add_argument("--time", default="", help="HH:MM (UT)")
            sp.add_argument("--lat", type=float, default=17.385)
            sp.add_argument("--lon", type=float, default=78.486)

    add_dt(sub.add_parser("panchang", help="tithi, nakṣatra, vāra, karaṇa"))
    sp = sub.add_parser("calendars", help="the ten calendar reckonings")
    sp.add_argument("--date", required=True, help="YYYY-MM-DD")
    add_dt(sub.add_parser("events", help="computed festivals & eclipses"), need_year=True)
    add_dt(sub.add_parser("almanac", help="alias for events"), need_year=True)
    add_dt(sub.add_parser("kundali", help="ASCII North-Indian birth chart"))

    a = p.parse_args(argv)
    try:
        ck = Chakra()
        if a.cmd == "panchang":
            _cmd_panchang(ck, a)
        elif a.cmd == "calendars":
            _cmd_calendars(ck, a)
        elif a.cmd in ("events", "almanac"):
            _cmd_events(ck, a)
        elif a.cmd == "kundali":
            _cmd_kundali(ck, a)
    except ChakraError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
