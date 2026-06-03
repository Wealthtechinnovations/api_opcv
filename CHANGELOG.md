# CHANGELOG — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/CHANGELOG.md` (changelog produit unifie front + back).
> Ce fichier liste uniquement les jalons cote API pour un developpeur travaillant dans ce depot.
> Eviter la duplication : detail complet dans le CHANGELOG frontend et SUIVI.md.

## [2026-06-03]
- Classements: national local (MAX(date)/fond) + dedup EUR/USD — `src/services/ranking.service.js` (`6644682`). Recalcul requis.
- routes_vl.js: 10 `.catch()` ajoutes (`5b70838`)
- routes_recalc_admin.js: auth JWT admin sur 8 routes (`5540d95`)
- apigestionfonds.js: valLiq/valLiqdev 404 au lieu de 500 (`bb03081`)

## Anterieur
Voir `CORRECTIONS.md` (ce depot) et `../front_end_opcvm/CHANGELOG.md`.
