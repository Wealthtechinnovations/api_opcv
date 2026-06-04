# CHANGELOG — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/CHANGELOG.md` (changelog produit unifie front + back).
> Ce fichier liste uniquement les jalons cote API pour un developpeur travaillant dans ce depot.
> Eviter la duplication : detail complet dans le CHANGELOG frontend et SUIVI.md.

## [2026-06-04] — Commite, a deployer
- T15: Fix import_indices_excel.js (`f6d7cb2`):
  - Ajout 'UEMOA' dans BRVM_UEMOA pays mapping (111 fonds ne matchaient pas)
  - Step 4 indRef EUR/USD: multiplication→division (regle OPCVM: `indRef_local / taux`)

## [2026-06-03] — DEPLOYE EN PRODUCTION
- Classements: national local (MAX(date)/fond) + dedup EUR/USD — `src/services/ranking.service.js` (`6644682`). **Recalcul effectue, type1 OK.**
- routes_vl.js: 10 `.catch()` ajoutes (`5b70838`)
- routes_recalc_admin.js: auth JWT admin sur 8 routes (`5540d95`)
- apigestionfonds.js: valLiq/valLiqdev 404 au lieu de 500 (`bb03081`)
- 2 crons ajoutes au crontab VPS : cron_tunisie_daily.sh (19h L-V), cron_health_check.sh (22h)
- T13: Diagnostic liaison indices↔fonds + couverture indRef EUR/USD (`e06798b`) — rapport seul, aucun code modifie

## Anterieur
Voir `CORRECTIONS.md` (ce depot) et `../front_end_opcvm/CHANGELOG.md`.
