"""
chakra_obs.core — backend resolution and the public computation surface.

Prefers ctypes against lib/libchakra.so; falls back to spawning the `chakra`
CLI (also in lib/) and parsing its JSON envelope. Both return plain Python
dicts with identical shapes, so callers never care which backend ran.

Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
"""
from __future__ import annotations
import ctypes as _c
import json as _json
import os as _os
import shutil as _shutil
import subprocess as _subprocess
from ctypes import c_double, c_int, c_long, c_char_p, POINTER, Structure, byref


class ChakraError(RuntimeError):
    """Raised when neither backend can satisfy a request."""


# ── name tables (mirror lib/chakra.c / src/chakra-core.js) ──────────────────
_VARA = ["Ravivāra", "Somavāra", "Maṅgalavāra", "Budhavāra",
         "Guruvāra", "Śukravāra", "Śanivāra"]
_TITHI = ["Pratipadā", "Dvitīyā", "Tṛtīyā", "Chaturthī", "Pañcamī", "Ṣaṣṭhī",
          "Saptamī", "Aṣṭamī", "Navamī", "Daśamī", "Ekādaśī", "Dvādaśī",
          "Trayodaśī", "Chaturdaśī", "Pūrṇimā/Amāvāsyā"]
_NAK = ["Aśvinī", "Bharaṇī", "Kṛttikā", "Rohiṇī", "Mṛgaśira", "Ārdrā",
        "Punarvasu", "Puṣya", "Āśleṣā", "Maghā", "P.Phalgunī", "U.Phalgunī",
        "Hasta", "Chitrā", "Svātī", "Viśākhā", "Anurādhā", "Jyeṣṭhā", "Mūla",
        "P.Āṣāḍhā", "U.Āṣāḍhā", "Śravaṇa", "Dhaniṣṭhā", "Śatabhiṣā",
        "P.Bhādrapada", "U.Bhādrapada", "Revatī"]
_RASHI = ["Meṣa", "Vṛṣabha", "Mithuna", "Karka", "Siṃha", "Kanyā", "Tulā",
          "Vṛścika", "Dhanu", "Makara", "Kumbha", "Mīna"]


# ── locate the compiled artifacts relative to this file / the repo ──────────
def _repo_lib_dir() -> str:
    here = _os.path.dirname(_os.path.abspath(__file__))
    # bindings/python/chakra_obs -> ../../../lib
    return _os.path.normpath(_os.path.join(here, "..", "..", "..", "lib"))


def _find_so() -> str | None:
    cand = []
    env = _os.environ.get("CHAKRA_SO")
    if env:
        cand.append(env)
    ld = _repo_lib_dir()
    for name in ("libchakra.so", "libchakra.dylib", "chakra.dll"):
        cand.append(_os.path.join(ld, name))
    for p in cand:
        if p and _os.path.exists(p):
            return p
    return None


def _find_cli() -> str | None:
    env = _os.environ.get("CHAKRA_CLI")
    if env and _os.path.exists(env):
        return env
    local = _os.path.join(_repo_lib_dir(), "chakra")
    if _os.path.exists(local):
        return local
    return _shutil.which("chakra")


# ── ctypes struct mirroring ck_panchanga ────────────────────────────────────
class _CkPanch(Structure):
    _fields_ = [
        ("vara_i", c_int), ("tithi_i", c_int), ("shukla", c_int),
        ("nak_i", c_int), ("yoga_i", c_int), ("karana_i", c_int),
        ("manzil_i", c_int), ("moon_lat", c_double),
    ]


class _CtypesBackend:
    name = "ctypes"

    def __init__(self, so_path: str):
        self.lib = _c.CDLL(so_path)
        L = self.lib
        L.ck_dayno.restype = c_double
        L.ck_dayno.argtypes = [c_int, c_int, c_int, c_double]
        L.ck_jdn_of.restype = c_long
        L.ck_jdn_of.argtypes = [c_double]
        L.ck_panchanga_calc.restype = None
        L.ck_panchanga_calc.argtypes = [c_double, c_double, POINTER(_CkPanch)]
        L.ck_karana_name.restype = c_char_p
        L.ck_karana_name.argtypes = [c_int]
        L.ck_ascendant.restype = c_double
        L.ck_ascendant.argtypes = [c_double, c_double, c_double]
        L.ck_ayan.restype = c_double
        L.ck_ayan.argtypes = [c_double]

    def panchanga(self, Y, M, D, ut, lat, lon):
        d = self.lib.ck_dayno(Y, M, D, ut)
        y = Y + (M - 1) / 12.0
        p = _CkPanch()
        self.lib.ck_panchanga_calc(d, y, byref(p))
        karana = self.lib.ck_karana_name(p.karana_i)
        return {
            "vara": _VARA[p.vara_i % 7],
            "tithi": _TITHI[p.tithi_i % 15]
            + (" (Śukla)" if p.shukla else " (Kṛṣṇa)"),
            "tithi_index": p.tithi_i + 1,
            "paksha": "Śukla" if p.shukla else "Kṛṣṇa",
            "nakshatra": _NAK[p.nak_i % 27],
            "yoga_index": p.yoga_i + 1,
            "karana": karana.decode() if karana else "",
            "jdn": int(self.lib.ck_jdn_of(d)),
            "backend": self.name,
        }


class _CliBackend:
    name = "cli"

    def __init__(self, cli_path: str):
        self.cli = cli_path

    def _run(self, ep, **kw):
        args = [self.cli, ep] + [f"{k}={v}" for k, v in kw.items()]
        try:
            out = _subprocess.check_output(args, text=True)
        except (_subprocess.CalledProcessError, OSError) as e:
            raise ChakraError(f"CLI '{self.cli}' failed: {e}") from e
        try:
            return _json.loads(out)
        except _json.JSONDecodeError as e:
            raise ChakraError(f"CLI returned non-JSON: {e}") from e

    def panchanga(self, Y, M, D, ut, lat, lon):
        date = f"{Y:04d}-{M:02d}-{D:02d}"
        hh = int(ut)
        mm = int(round((ut - hh) * 60))
        env = self._run("panchang", date=date, time=f"{hh:02d}:{mm:02d}",
                        lat=lat, lon=lon, tz=0)
        pc = env.get("panchanga", env)
        pc["backend"] = self.name
        pc.setdefault("jdn", env.get("jd"))
        return pc

    def calendars(self, Y, M, D):
        date = f"{Y:04d}-{M:02d}-{D:02d}"
        return self._run("calendars", date=date).get("calendars", {})

    def events(self, year):
        return self._run("events", year=year).get("events", [])

    def telescope(self, Y, M, D, ut, lat, lon):
        date = f"{Y:04d}-{M:02d}-{D:02d}"
        hh = int(ut); mm = int(round((ut - hh) * 60))
        return self._run("telescope", date=date, time=f"{hh:02d}:{mm:02d}",
                         lat=lat, lon=lon, tz=0).get("bodies", {})

    def moment(self, Y, M, D, ut, lat, lon):
        date = f"{Y:04d}-{M:02d}-{D:02d}"
        hh = int(ut); mm = int(round((ut - hh) * 60))
        return self._run("moment", date=date, time=f"{hh:02d}:{mm:02d}",
                         lat=lat, lon=lon)


# ── resolve the best available backend once ─────────────────────────────────
def _resolve():
    so = _find_so()
    cli = _find_cli()
    ct = None
    if so:
        try:
            ct = _CtypesBackend(so)
        except OSError:
            ct = None
    cl = _CliBackend(cli) if cli else None
    if ct is None and cl is None:
        raise ChakraError(
            "No CHAKRA backend found. Build the C core first:\n"
            "    make -C lib libchakra.so chakra\n"
            "or set CHAKRA_SO / CHAKRA_CLI to their paths."
        )
    return ct, cl


class Chakra:
    """Unified handle. ctypes for panchāṅga where available; CLI for the
    endpoints only the CLI exposes (calendars, events, telescope, moment)."""

    def __init__(self):
        self._ct, self._cli = _resolve()
        self.backend = (self._ct or self._cli).name

    def panchanga(self, Y, M, D, ut=12.0, lat=17.385, lon=78.486):
        be = self._ct or self._cli
        return be.panchanga(Y, M, D, ut, lat, lon)

    def _need_cli(self, what):
        if not self._cli:
            raise ChakraError(
                f"{what} needs the `chakra` CLI (build: make -C lib chakra)."
            )
        return self._cli

    def calendars(self, Y, M, D):
        return self._need_cli("calendars").calendars(Y, M, D)

    def events(self, year):
        return self._need_cli("events").events(year)

    def telescope(self, Y, M, D, ut=12.0, lat=17.385, lon=78.486):
        return self._need_cli("telescope").telescope(Y, M, D, ut, lat, lon)

    def moment(self, Y, M, D, ut=12.0, lat=17.385, lon=78.486):
        return self._need_cli("moment").moment(Y, M, D, ut, lat, lon)


# module-level convenience singletons/functions
_default = None


def _handle():
    global _default
    if _default is None:
        _default = Chakra()
    return _default


def panchanga(Y, M, D, ut=12.0, lat=17.385, lon=78.486):
    return _handle().panchanga(Y, M, D, ut, lat, lon)


def calendars(Y, M, D):
    return _handle().calendars(Y, M, D)


def events(year):
    return _handle().events(year)


def telescope(Y, M, D, ut=12.0, lat=17.385, lon=78.486):
    return _handle().telescope(Y, M, D, ut, lat, lon)


def moment(Y, M, D, ut=12.0, lat=17.385, lon=78.486):
    return _handle().moment(Y, M, D, ut, lat, lon)


try:
    __backend__ = _handle().backend
except ChakraError:
    __backend__ = None
