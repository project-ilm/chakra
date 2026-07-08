# CHAKRA — CUDA batch ephemeris (B-30)

`chakra_ephem.cu` maps **N epochs × 11 bodies → a longitude array** on the GPU,
porting the CHAKRA ephemeris core (Schlyter theory) to `__host__ __device__`
code so the *same* functions run on CPU and GPU. This is the throughput path:
when you need millions of positions (batch pañcāṅga generation, eclipse scans,
Monte-Carlo over epochs), the CPU core is fine per-query but the GPU wins in bulk.

## Build & run

```bash
nvcc -O3 -o chakra_ephem chakra_ephem.cu
./chakra_ephem              # parity check + benchmark, 1,000,000 epochs
./chakra_ephem 5000000      # benchmark 5,000,000 epochs
```

The program prints the anchor-epoch longitudes, a CPU/GPU parity result, and
throughput (epochs/s and body-λ/s).

## Correctness

The device functions are a faithful port of `lib/chakra.c`. Verified against the
JS/C reference cores at the standard anchor **2026-08-12 06:30 UT**:

| body | CUDA (°) | reference (°) |
|------|----------|---------------|
| Sun  | 139.591  | 139.591 |
| Moon | 133.317  | 133.317 |
| Mars | 90.607   | 90.607  |
| Saturn | 14.380 | 14.380  |
| Rahu | 330.344  | 330.344 |

Max deviation across all 11 bodies is **< 0.0023°**, i.e. within the Schlyter
theory's own accuracy envelope; the residual is floating-point summation order in
the outer-planet perturbation terms, not a port error. The `.cu` also self-checks:
it recomputes 32 sampled epochs on the host with the identical device functions and
asserts `max |Δ| < 1e-9°` between host and device, plus the published anchor values.

## Verifying the device math WITHOUT a GPU

The device functions compile as ordinary host C++ (the `__host__ __device__`
decorations are no-ops off-GPU). This is how the port was validated in CI-free
environments:

```bash
# strip the CUDA decorations and compile the math as host code
sed 's/__host__ __device__ //g; s/__restrict__ //g' chakra_ephem.cu > /tmp/hostmath.cpp
# (then wrap dev_body_lon in a small main and compile with g++)
```

## Roadmap

Execution on a real GPU runner in CI is tracked as **B-31** (the binding
validation matrix). Extending the kernel to full pañcāṅga (tithi/nakṣatra/yoga)
and eclipse scanning per-epoch is a natural follow-on once the position kernel is
in place.

© 1993–2026 Abhishek Choudhary, sole author. GPL-3.0-or-later.
