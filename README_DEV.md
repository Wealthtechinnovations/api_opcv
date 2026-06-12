# README_DEV — api_opcv (Backend)

> **Doc canonique developpeur** : `../front_end_opcvm/README_DEV.md`.
> Ce fichier couvre les specificites backend.

## Stack
- Express.js + Sequelize ORM + MySQL/MariaDB (`fund_opcvm`)
- ClickHouse (optionnel, analytics) — degrade en 503 si indisponible
- PM2 : `api-monolith` (port 3005), workers `worker-recalculation`, `worker-data-import`

## Lancer en local
```bash
npm install
cp .env.example .env   # renseigner DB_HOST/DB_USER/DB_PASSWORD/JWT_SECRET (jamais commiter .env)
node src/app.js        # ou via pm2
```

## Tests
```bash
npm test            # lance jest --forceExit (125 tests, 9 suites)
npx jest tests/slug.test.js   # lancer un fichier specifique
```

Fichiers de tests : `tests/`
- `slug.test.js` — generateSlug, generateFundSlug, extractIdFromSlug
- `dates.test.js` — date finding + grouping functions
- `performances.test.js` — calculatePerformance, annualized variants
- `newratios2.test.js` — maxDrawdown, covariance, variance
- `utils.test.js` — rendements journaliers/hebdo/mensuels, groupers
- `delai_Beta.test.js` — recouvrement, beta, betaHaussier/Baissier
- `forex.service.test.js`, `ranking.service.test.js`, `performance.service.test.js` — services

## Fichiers cles
- Routes : `src/routes/` (apigestionfonds, apigestionperformance, apigestionratios, apigestionsavequotidien, apigestionquartile, routes_vl, routes_recalc_admin)
- Services : `src/services/ranking.service.js` (calculs classements national/regional/global, local + EUR/USD, keepLatestPerFund dedup)
- Modeles : `src/models/` (fond, vl, performences[_eurs/_usds], classementfonds[_eurs/_usds])
- Crons : `scripts/cron/` (daily_update, daily_eur_usd, nigeria_weekly, tunisie_daily, health_check)
- Scripts recalc/import/fix : `scripts/recalc/`, `scripts/import/`, `scripts/fix/`
- Diagnostic : `T13_DIAGNOSTIC_INDICES.md` (audit liaison indices↔fonds, couverture indRef EUR/USD)

## Classements (rappel logique)
- type_classement 1 = national (categorie_nationale), 2 = regional (categorie_fundafrica_regionale), 3 = global (categorie_fundafrica_globale)
- Comparaison de chaque fond a sa derniere date dispo (MAX(date)/fond) — local et dev
- Generation via routes batch : `/api/classementmysql`, `/api/classementeur`, `/api/classementusd`
- Lecture : `/api/classementquartilemysql/:id` (local), `/api/classementquartiledev/:id/:dev` (EUR/USD)
- Apres deploiement modifiant ranking.service.js : RECALCUL OBLIGATOIRE des 3 routes batch

## Crons production (7, tous dans crontab VPS depuis 2026-06-03)
```
0 19 * * 1-5   cron_tunisie_daily.sh     — CMF Tunisie scraper + import
0 20 * * 1-5   cron_daily_update.sh      — ASFIM + forex + recalculs (9 etapes)
30 21 * * *    cron_daily_eur_usd.sh     — Perf EUR/USD + classements
0 22 * * *     cron_health_check.sh      — Monitoring sante systeme
0 10 * * 1     cron_nigeria_weekly.sh    — SEC Nigeria import + recalc
0 * * * *      sync_production.sh        — Snapshot horaire
*/5 * * * *    fix-brvm-nginx.py         — Fix Nginx BRVM (ATTENTION: script absent du filesystem)
```

Cron additionnel A INSTALLER apres validation (module BRVM BOC) :
```
30 19 * * 1-5  cron_brvm_daily.sh        — BOC BRVM : VL OPCVM UEMOA (idempotent)
```

## Module BRVM BOC (VL OPCVM UEMOA)
- Script : `scripts/scraper/brvm_boc_daily.py` (deps : `scripts/scraper/requirements_brvm.txt`)
- Cron wrapper : `scripts/cron/cron_brvm_daily.sh`
- Source officielle : Bulletins Officiels de la Cote `https://bfin.brvm.org/boc/BOC_JOUR/BOC_YYYYMMDD.pdf`
- Tables additives (creees par le script) : `brvm_boc_sources`, `brvm_boc_navs_raw`,
  `brvm_fund_aliases`, `brvm_import_logs`, `brvm_missing_navs`
- Promotion vers `valorisations` : jamais d'overwrite, ND jamais inseres,
  conflits conserves en staging, fonds inconnus en attente de validation
- Routes supervision (lecture seule) : `/api/brvm/boc/status`, `/imports`, `/unmatched`, `/missing`
- Commandes :
  ```bash
  python3 scripts/scraper/brvm_boc_daily.py --selftest
  python3 scripts/scraper/brvm_boc_daily.py --latest --dry-run
  python3 scripts/scraper/brvm_boc_daily.py --latest --production
  python3 scripts/scraper/brvm_boc_daily.py --start-date 2026-01-01 --end-date 2026-06-12 --production --throttle 3
  python3 scripts/scraper/brvm_boc_daily.py --repair-missing --production            # diagnostic
  python3 scripts/scraper/brvm_boc_daily.py --repair-missing --apply --production    # comblement
  ```

## Deploiement
Voir `../front_end_opcvm/SUIVI.md` (POINT DE REPRISE > Prochaine action).
