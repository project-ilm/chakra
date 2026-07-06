# CHAKRA — Further work

Each item below is filed as a GitHub issue by `seed-chakra.sh`. Numbers are stable references.

1. **ΔT, nutation, topocentric parallax** — biggest single precision win; Moon parallax ≈1° matters for occultation-adjacent questions.
2. **Sunrise-based tithi (udaya-vyāpinī) + local sunrise/sunset** — removes the ±1-day festival divergence vs regional panchāṅgas; prerequisite for muhūrta.
3. **Antardaśā / pratyantardaśā** — extend `vimshottari()` to nested periods with the same proportional rule.
4. **Divisional charts** — navāṁśa (D9) first, then D2/D3/D10/D12; pure functions over existing chart positions.
5. **Muhūrta layer** — horā, choghaḍiyā, rāhu-kāla/yama-ghaṇṭa/gulika from sunrise octaves (blocked on #2).
6. **Kṣaya-māsa handling** — detect two saṅkrāntis in one lunation; name per classical rule; add a synthetic test (next kṣaya cluster).
7. **True lunar node option** — oscillating Rāhu; toggle mean/true.
8. **Star catalogue expansion + proper motion** — Hipparcos bright subset; epoch-correct positions.
9. **ASCOM Alpaca / INDI bridge** — serve `?api=telescope` in the wire format mounts consume; CHAKRA already computes HA/Dec and Alt/Az.
10. **ILM i18n** — UI strings through the native→hincc→…→GCC pipeline: hi, ur, bn, te, pa first; script projection via the ILM tables (no #define substitution).
11. **Sighting-based Hijrī option** — regional offset table (Umm al-Qura, Karachi, Tehran) layered over tabular.
12. **PWA manifest + service worker** — installable, still single-origin offline.
13. **Print layouts per tradition** — dedicated one-page Hindu / Muslim / Jewish / Sikh annual sheets from `annualEvents()`.
14. **Accessibility pass** — keyboard drag alternatives for every inverse solver; ARIA on readouts; prefers-reduced-motion.
15. **Publish `chakra-core` to npm** — the library is already UMD + tested; add package.json and CI.
> **Field note (v1.2.0, 2026-07-05):** the 2026 run flags *two* adhika pūrṇimās — 31 May (correct: Adhika Jyaiṣṭha) and 29 Jun (spurious). The lunation-edge saṅkrānti test needs the refined rule this item describes; until then, treat a second consecutive adhika row as suspect.



---
© 1993–2026 Abhishek Choudhary. This document is licensed under [CC BY-SA 4.0](../LICENSE-docs).
CHAKRA is study/heritage software — see [DISCLAIMER](../DISCLAIMER.md).
