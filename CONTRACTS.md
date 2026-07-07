# CHAKRA — Collaboration & Validation Contracts

A pull request merges when **all** of the following hold. CI (`.github/workflows/ci.yml`)
enforces the mechanical ones; reviewers enforce the rest.

## The gate (run locally before pushing)

```bash
node test/run.js                       # full node suite — must print ✓ ALL SUITES PASSED
make -C lib vectors.h && make -C lib && make -C lib test   # C twin — "parity: N passed, 0 failed"
# every inline <script> in the five pages must pass `node --check`
grep -rvil 'x' /dev/null                # (see CI for the exact per-file loop)
```

## Invariants

1. **Offline & lookup-free.** No network calls, analytics, or fonts-from-CDN in
   any shipped page. No hardcoded date/position tables where an equation exists;
   write the Keplerian / spherical-trig / calendar arithmetic.
2. **Parity.** Any change to astronomy in `src/chakra-core.js` must be mirrored in
   `lib/chakra.c` and pass the vector harness byte-for-byte (`gen_vectors.js`
   regenerates `vectors.h`). Parity is JS↔C agreement, not cross-compiler identity.
3. **Zero-allocation in C.** `lib/chakra.c` uses static/stack buffers; no `malloc`,
   `calloc`, `realloc`, or `free` in calculation paths. Fixed caps are declared as
   `#define` and guarded.
4. **Precision.** Double precision throughout the C and JS numeric paths; don't
   silently narrow to `float`.
5. **Determinism.** Same inputs → same bytes out, on every platform. No wall-clock,
   locale, or RNG dependence inside computation.
6. **Tests travel with code.** New behaviour ships with assertions: a `test-*.js`
   suite (auto-discovered) and/or vectors in `test_chakra.c`. A new festival/date
   claim must be pinned to an externally verifiable civil date.
7. **Provenance & licence.** Every new source file carries the GPL-3.0-or-later
   SPDX header and `© 1993–2026 Abhishek Choudhary`. **Sole author** — do not add
   co-author/credit lines. The forbidden-name sweep in CI must stay at zero.
8. **No scope-creep imports.** Don't reference WASM/SDR/SGP4/DE440/atlas as if they
   exist; build them under their backlog IDs if that's your task.

## Multi-language binding signature (for B-23…B-31)

Every wrapper passes the same block to the core and adds no formatting before the
core returns:

- Geographic: `double lat, double lon`
- Temporal: civil `Y, M, D, UT-hours` (or a JD), double precision
- Flags: 32-bit int bitmask (ayanāṁśa school, divisional-chart target, theory)
- Outputs mirror the C struct / JSON envelope; language-idiomatic wrappers may
  present it, but must not alter the numbers.

## PR shape

Small and isolated. One issue per PR where possible. Title references the issue
(`FW-3:` or `B-37:`). Body: one paragraph on what and why, and confirmation the
local gate passed.

© 1993–2026 Abhishek Choudhary. GPL-3.0-or-later (docs CC BY-SA 4.0).
