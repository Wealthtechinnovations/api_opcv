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

## Actions crons (sans risque de regression)
- [ ] **#49** cron_daily_update.sh : remplacer `set -e` par gardes par etape
- [ ] **#50** Ajouter validation HTTP status aux curl
- [ ] **#40** Supprimer ghost cron fix-brvm-nginx.py

## Dette technique (cf ../front_end_opcvm/CODE_REVIEW.md)
- [ ] #46 — .catch() promise chains apigestionperformance.js
- [ ] #45 — CSV formula injection sanitisation
- [ ] #44 — authenticate middleware sur POST routes (attente Eric)
- [ ] #2 — Index UNIQUE valorisations(fund_id, date) (attente Eric)
- [ ] #15 — Parametrer INSERT ClickHouse batch
- [ ] #27 — Backfill ClickHouse performance_historique

## Donnees en attente
- [ ] TUNISIE EUR/USD gap 24% (attente fichier dividendes)
- [ ] CEMAC 0% couverture (decision metier sourcer indice BVMAC)
- [ ] UEMOA Excel (attente fichiers + script Python Eric)
