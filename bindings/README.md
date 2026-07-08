# CHAKRA — Language Bindings

The CHAKRA engine has one reference implementation (`src/chakra-core.js`) and a
byte-parity C99 twin (`lib/chakra.c`). These bindings let other ecosystems call
that same C core, so a pañcāṅga computed from Python, Rust, Go, C#, Node or BASIC
matches the website to the byte.

| binding | dir | approach | build / run |
|---|---|---|---|
| **Python** (`chakra-observatory`) | `python/` | ctypes → `libchakra.so`, CLI fallback; ships `chakra-cli` | `pip install .` then `chakra-cli panchang --date 2026-08-12 --time 06:30` |
| **Rust** (`chakra-sys`) | `rust/` | `build.rs` compiles `chakra.c`; FFI + safe wrapper | `cargo test` |
| **Go** | `go/` | cgo includes `chakra.c` directly | `go test ./...` |
| **C#** | `csharp/` | P/Invoke over `libchakra.so`/`chakra.dll` | `make -C ../../lib libchakra.so && cp ../../lib/libchakra.so . && dotnet run` |
| **Node** (`@project-ilm/chakra`) | `node/` | spawns the `chakra` CLI, parses JSON | `node test.js` |
| **GW-BASIC / QB64** | `gwbasic/` | independent port (text + graphical) | see `gwbasic/README.md` |

## The shared signature

Every binding passes the same block to the core and adds no formatting before it
returns (see `CONTRACTS.md`):

- geographic: `double lat, double lon`
- temporal: civil `Y, M, D, UT-hours`
- outputs mirror the C `ck_panchanga` struct / JSON envelope

## Prerequisites

Most bindings compile or load the C core, so build it once from the repo root:

```bash
make -C lib libchakra.so chakra      # shared library + JSON CLI
```

Rust and Go compile `lib/chakra.c` themselves and need no prebuilt library.

## Which should I use?

- **Already in JavaScript?** Skip the Node binding and
  `require("src/chakra-core.js")` — that's the reference engine itself.
- **Scientific Python / notebooks?** `chakra-observatory` (ctypes, fast).
- **Systems / embedded / WASM-bound?** Rust or Go compile the C in directly.
- **.NET app?** C# P/Invoke.
- **A 1983 interpreter or a retro demo?** GW-BASIC / QB64.

Verification anchor used across bindings: **2026-08-12 06:30 UT → Budhavāra ·
Amāvāsyā · Āśleṣā · JDN 2461265**, and the Sunni/Shia Hijrī split on 2026-06-16.

Full CI validation of every binding is tracked as backlog **B-31**.

© 1993–2026 Abhishek Choudhary, sole author. GPL-3.0-or-later.
