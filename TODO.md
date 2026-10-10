# TODO — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/TODO.md` et `SUIVI.md` (frontend). Deploiement detaille : `TODO_DEPLOY.md` (ce depot).
> Ce fichier liste les actions backend a court terme.

## Deploye (confirme en production)
- [x] T8-T12 : classements, securite admin, .catch routes — 2026-06-03
- [x] T15 : indRef UEMOA 100% — 2026-06-04
- [x] T17 : routes_vl.js multiplication→division — 2026-06-05
- [x] T20 : Nigeria mise a jour — 2026-06-05
- [x] T35 : module BRVM BOC + cron_brvm_daily.sh — 2026-06-12
- [x] AUDIT-C : ClickHouse 410 + multer path traversal — 2026-06-13
- [x] AUDIT-D : worker SQL injection fix — 2026-06-13
- [x] LOT 1 (#54) : rankings null/Infinity fix — 2026-06-17
- [x] LOT 2 (#55) : category averages fix (25 moyennes non-null) — 2026-06-17
- [x] LOT 3 (#56) : transaction consistency fix (3545+3579+3579 classements OK) — 2026-06-18

## Actions crons (sans risque de regression)
- [x] **#49** cron_daily_update.sh : `set -e` remplace par gardes par etape — commit `26d1f93` (verifie 06-26)
- [x] **#50** validation HTTP status aux curl — commit `26d1f93` (verifie 06-26)
- [x] **Cron indices auto-reparant** `--backfill-days 7` (`ebf1305`) + fix MONIA v2 HTML (`bfd1a64`) — deployes 07-14
- [ ] **#40** Supprimer ghost cron fix-brvm-nginx.py

## Dette technique (cf ../front_end_opcvm/CODE_REVIEW.md)
- [ ] #53 — ClickHouse dead code cleanup
- [x] #46 — .catch() promise chains apigestionperformance.js — commit `89cabd4` (verifie 06-26)
- [x] #45 — CSV formula injection sanitisation — commit `277ae47` (verifie 06-26)
- [ ] #44 — authenticate middleware sur POST routes (attente Eric)
- [ ] #2 — Index UNIQUE valorisations(fund_id, date) (attente Eric)
- [ ] #15 — Parametrer INSERT ClickHouse batch
- [ ] #27 — Backfill ClickHouse performance_historique

## Donnees en attente
- [ ] TUNISIE EUR/USD gap 24% (attente fichier dividendes)
- [ ] CEMAC : indice = BVMAC ALL SHARE identifie (referentiel_fundafrica.json, bvm-ac.org/indices) ; **VL fonds = source COSUMAF a fournir par l'utilisateur** (cf front CODE_REVIEW #70 MAJ 07-14)
- [ ] UEMOA Excel (attente fichiers + script Python Eric)
