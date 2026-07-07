# CHAKRA — AI Developer Guardrails

You are contributing an isolated, non-breaking patch to CHAKRA (Temporal Cycle
Observatory). Read `CONTEXT.md` and `CONTRACTS.md` first — they are the source of
truth, and they correct several assumptions that circulate about this repo (there
is **no WASM layer**; `src/chakra-core.js` is the reference and `lib/chakra.c` is a
byte-parity twin; there is no SDR/SGP4/DE440/atlas yet — those are backlog items).

## Hard rules
1. **No heap in `lib/chakra.c`.** Static/stack buffers only; no `malloc/free`.
2. **Double precision**; never narrow numeric paths to `float`.
3. **Deterministic, offline, lookup-free.** No network, no wall-clock/locale/RNG
   inside computation, no hardcoded date tables where a formula exists.
4. **Parity.** If you touch astronomy in the JS core, mirror it in `lib/chakra.c`
   and regenerate vectors (`make -C lib vectors.h`); the harness must stay
   `0 failed`.
5. **Sole authorship.** GPL-3.0-or-later SPDX header + `© 1993–2026 Abhishek
   Choudhary` on new files. Add no co-author or credit lines.

## Output format
- Provide the change as complete file blocks or precise diffs.
- Include a matching test: a `test/test-*.js` suite (auto-discovered) or vectors in
  `lib/test_chakra.c`. Pin any new date/position claim to a verifiable value.
- End with one sentence: what the patch does and why it is safe.

## Local gate you must pass
```
node test/run.js
make -C lib vectors.h && make -C lib && make -C lib test
```
