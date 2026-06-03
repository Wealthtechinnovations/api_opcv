# TODO — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/TODO.md` et `SUIVI.md` (frontend). Deploiement detaille : `TODO_DEPLOY.md` (ce depot).
> Ce fichier liste les actions backend a court terme.

## Deploiement en attente
- [ ] `git pull --rebase` + `pm2 restart api-monolith` (commit `6644682`)
- [ ] Recalcul classements : `classementmysql`, `classementeur`, `classementusd` (applique T10/T11)
- [ ] Ajouter crons : `cron_tunisie_daily.sh`, `cron_health_check.sh`

## Dette technique backend (cf ../front_end_opcvm/CODE_REVIEW.md)
- [ ] #2 Index UNIQUE valorisations(fund_id, date) apres nettoyage doublons
- [ ] #15 Parametrer INSERT ClickHouse batch (apigestionsavequotidien.js)
- [ ] #27 Backfill ClickHouse performance_historique
- [ ] Scraper automatise UEMOA (BRVM) ; source CEMAC (COSUMAF)
- [ ] Couverture indRef EUR/USD : TUNISIE 24%, UEMOA 22%, CEMAC 0%
