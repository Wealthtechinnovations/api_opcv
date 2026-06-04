# TODO — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/TODO.md` et `SUIVI.md` (frontend). Deploiement detaille : `TODO_DEPLOY.md` (ce depot).
> Ce fichier liste les actions backend a court terme.

## Deploye le 2026-06-03
- [x] `git pull --rebase` + `pm2 restart api-monolith` — FAIT
- [x] Recalcul classements : `classementmysql`, `classementeur`, `classementusd` — FAIT, type1 OK
- [x] Crons ajoutes : `cron_tunisie_daily.sh` (19h L-V), `cron_health_check.sh` (22h) — FAIT

## Actions a venir (suite T13 diagnostic indices)
- [ ] T15: Recalc indRef TND complet (dry-run puis production) — couverture TUNISIE 24%→100%
- [x] T15: Corriger mapping BRVM→UEMOA dans import_indices_excel.js — FAIT (commit `f6d7cb2`), a deployer+executer
- [ ] T15: Decision metier CEMAC (sourcer indice BVMAC) — couverture CEMAC 0%
- [ ] T17: Fix routes_vl.js lignes 3027-3039 multiplication→division (conversion devise)

## Dette technique backend (cf ../front_end_opcvm/CODE_REVIEW.md)
- [ ] #2 Index UNIQUE valorisations(fund_id, date) apres nettoyage doublons
- [ ] #15 Parametrer INSERT ClickHouse batch (apigestionsavequotidien.js)
- [ ] #27 Backfill ClickHouse performance_historique
