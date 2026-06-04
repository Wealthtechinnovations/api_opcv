# CHANGELOG — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/CHANGELOG.md` (changelog produit unifie front + back).
> Ce fichier liste uniquement les jalons cote API pour un developpeur travaillant dans ce depot.
> Eviter la duplication : detail complet dans le CHANGELOG frontend et SUIVI.md.

## [2026-06-04] — DEPLOYE (T15) + A DEPLOYER (T17)
- **UEMOA indRef 22% → 100%** (DEPLOYE): 111/111 fonds, 33830/33830 VL (local + EUR + USD)
- T15 (`f6d7cb2`): Ajout 'UEMOA' dans BRVM_UEMOA pays mapping + step 4 multiplication→division
- T15b (`ac1cf98`, `2990351`): DB fallback si Excel absent + case-insensitive id_indice matching
- Nouveau script: `scripts/diag/check_indref_coverage.js` (read-only diagnostic)
- Execution prod T15c: step 2 (33829 VL), step 4 (26253 VL), perfs EUR/USD (108 fonds), classements recalcules
- **T17** (A DEPLOYER): Fix routes_vl.js 10 lignes multiplication→division (updateValues + uploadsfilevl) — conversion local→EUR/USD en base

## [2026-06-03] — DEPLOYE EN PRODUCTION
- Classements: national local (MAX(date)/fond) + dedup EUR/USD — `src/services/ranking.service.js` (`6644682`). **Recalcul effectue, type1 OK.**
- routes_vl.js: 10 `.catch()` ajoutes (`5b70838`)
- routes_recalc_admin.js: auth JWT admin sur 8 routes (`5540d95`)
- apigestionfonds.js: valLiq/valLiqdev 404 au lieu de 500 (`bb03081`)
- 2 crons ajoutes au crontab VPS : cron_tunisie_daily.sh (19h L-V), cron_health_check.sh (22h)
- T13: Diagnostic liaison indices↔fonds + couverture indRef EUR/USD (`e06798b`) — rapport seul, aucun code modifie

## Anterieur
Voir `CORRECTIONS.md` (ce depot) et `../front_end_opcvm/CHANGELOG.md`.
