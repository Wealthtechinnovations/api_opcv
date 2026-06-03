# CODE_REVIEW — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/CODE_REVIEW.md` (audit unifie, items #1 a #31).
> Ce fichier liste les points specifiques backend et renvoie a l'audit complet.

## Corrige recemment (cote API)
- #29 Classement national local vide → MAX(date)/fond (`6644682`)
- #30 Totaux EUR/USD gonfles → keepLatestPerFund() (`6644682`)
- #25 routes_vl.js .catch() (`5b70838`)
- #22 Auth JWT routes admin (`5540d95`)
- #23 valLiq/valLiqdev 404 (`bb03081`)

## Dette technique backend ouverte
- #2 Index UNIQUE valorisations(fund_id, date)
- #5 apigestionsavequotidien.js monolithique (~1800 l) — extraction en cours (ranking.service.js)
- #15 INSERT ClickHouse batch non parametres (risque faible, donnees internes)
- #27 ClickHouse performance_historique jamais peuple
- #31 Couverture indRef EUR/USD (diagnostic T13, `e06798b`): TUNISIE 24%, UEMOA 22%, CEMAC 0%
- #32 Incohérence conversion routes_vl.js:3027-3039 (multiplication vs division)

Voir l'audit complet et l'historique dans `../front_end_opcvm/CODE_REVIEW.md`.
