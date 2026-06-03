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

## Fichiers cles
- Routes : `src/routes/` (apigestionfonds, apigestionperformance, apigestionratios, apigestionsavequotidien, apigestionquartile, routes_vl, routes_recalc_admin)
- Services : `src/services/ranking.service.js` (calculs classements national/regional/global, local + EUR/USD)
- Modeles : `src/models/` (fond, vl, performences[_eurs/_usds], classementfonds[_eurs/_usds])
- Crons : `scripts/cron/` (daily_update, daily_eur_usd, nigeria_weekly, tunisie_daily, health_check)
- Scripts recalc/import/fix : `scripts/recalc/`, `scripts/import/`, `scripts/fix/`

## Classements (rappel logique)
- type_classement 1 = national (categorie_nationale), 2 = regional (categorie_fundafrica_regionale), 3 = global (categorie_fundafrica_globale)
- Comparaison de chaque fond a sa derniere date dispo (MAX(date)/fond) — local et dev
- Generation via routes batch : `/api/classementmysql`, `/api/classementeur`, `/api/classementusd`
- Lecture : `/api/classementquartilemysql/:id` (local), `/api/classementquartiledev/:id/:dev` (EUR/USD)

## Deploiement
Voir `TODO_DEPLOY.md` (ce depot) et `../front_end_opcvm/SUIVI.md` (POINT DE REPRISE > Prochaine action).
