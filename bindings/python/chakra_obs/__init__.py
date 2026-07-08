"""
chakra-observatory — Python binding for the CHAKRA Temporal Cycle Observatory.

Two backends, chosen automatically:
  1. ctypes against the compiled C core (lib/libchakra.so) — fast, in-process.
  2. spawning the `chakra` CLI and parsing its JSON — zero build, works anywhere.

The C core (src/chakra-core.js is the reference; lib/chakra.c is a byte-parity
C99 twin) computes everything from geometry: no network, no lookup tables.

Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
"""
from .core import (
    Chakra, panchanga, calendars, events, telescope, moment,
    ChakraError, __backend__,
)

__version__ = "1.4.0"
__all__ = [
    "Chakra", "panchanga", "calendars", "events", "telescope", "moment",
    "ChakraError", "__backend__", "__version__",
]
