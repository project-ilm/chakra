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
9. **Physical map only.** The globe renders coastlines (`COAST`, Natural Earth
   physical) and never political borders/countries/admin lines. Introducing any
   cultural/political geographic dataset is a hard rejection — this is a
   sensitivity requirement, not a preference.
10. **Single-source the version.** Bump `src/chakra-core.js` first; mirror to
    `CK_VERSION`, `misty.json`, and every binding manifest. `seed-chakra.sh`
    derives its version from the core — never hardcode it.
11. **Bindings defer to the core.** Every language binding calls the C core (or
    spawns the CLI) and must reproduce the anchor (2026-08-12 06:30 UT →
    Budhavāra · Amāvāsyā · Āśleṣā · JDN 2461265). No binding recomputes astronomy
    itself. The CUDA device port additionally holds all-body |Δ| < 0.0023° vs the
    reference and self-checks host-vs-device to < 1e-9°.

## Multi-language binding signature (for B-23…B-31)

Every wrapper passes the same block to the core and adds no formatting before the
core returns:

- Geographic: `double lat, double lon`
- Temporal: civil `Y, M, D, UT-hours` (or a JD), double precision
- Flags: 32-bit int bitmask (ayanāṁśa school, divisional-chart target, theory)
- Outputs mirror the C struct / JSON envelope; language-idiomatic wrappers may
  present it, but must not alter the numbers.

## Release & DOI workflow (learned, load-bearing)

- **The human owns the push and the mint.** The AI prepares the tree; it does not
  push to GitHub or mint DOIs from its own environment. `seed-chakra.sh` publishes;
  `scripts/mint-doi.sh` mints.
- **DOI minting is guarded (P3).** `mint-doi.sh` defaults to a Zenodo *sandbox
  dry-run* (validates metadata + builds the artifact, zero network) and requires an
  explicit `--live` flag plus a typed confirmation to mint for real. `misty.json`
  MUST carry `access_right: "open"` — misty's shipped JSON Schema otherwise
  misfires its embargo conditional and demands `embargo_date`. For a **version
  update** of an existing record, mint under the same Zenodo concept DOI (new
  version), do not create a fresh concept.
- **Closing shipped issues.** When a backlog item ships, `scripts/close-completed-
  issues.sh` closes it by title prefix (`B-NN:`), artifact-guarded, idempotent.

## PR shape

Small and isolated. One issue per PR where possible. Title references the issue
(`FW-3:` or `B-37:`). Body: one paragraph on what and why, and confirmation the
local gate passed.

© 1993–2026 Abhishek Choudhary. GPL-3.0-or-later (docs CC BY-SA 4.0).
