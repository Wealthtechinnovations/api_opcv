# TASKS — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/TASKS.md` (journal des lots unifie) et `SUIVI.md` (frontend).
> Ce fichier renvoie au journal complet pour eviter la duplication.

Les lots (LOT Tx) sont traces dans `../front_end_opcvm/TASKS.md` et detailles dans `../front_end_opcvm/SUIVI.md`.

Derniers lots API :
- LOT 3 (#56) — transaction consistency fix (3545+3579+3579 classements OK) — commit `e3d8fec` — DEPLOYE 2026-06-18
- LOT 2 (#55) — category averages fix (25 moyennes non-null) — DEPLOYE 2026-06-17
- LOT 1 (#54) — rankings null/Infinity fix — DEPLOYE 2026-06-17
- AUDIT-D — worker SQL injection fix (#48) — DEPLOYE 2026-06-13
- AUDIT-C (`e5dddb6`) — ClickHouse dead route 410 + multer path traversal — DEPLOYE 2026-06-13
- T35 (`8a3a707`) — module BRVM BOC + 4406 VL UEMOA + cron_brvm_daily.sh — DEPLOYE 2026-06-12
- T17 — routes_vl.js mul→div (10 lignes) — DEPLOYE 2026-06-05
- T15 (`f6d7cb2`) — indRef UEMOA 100% — DEPLOYE 2026-06-04
- T10/T11 (`6644682`) — classements national local + dedup EUR/USD — DEPLOYE 2026-06-03
- T9 (`5b70838`) — routes_vl.js .catch() — DEPLOYE
- T8 (`5540d95`, `bb03081`) — auth admin + valLiq 404 — DEPLOYE
