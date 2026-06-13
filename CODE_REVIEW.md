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
- ~~#31 UEMOA indRef~~ RESOLU T15c: 22%→**100%** (111/111 fonds, 33830/33830 VL). TUNISIE 24% EUR/USD (attente fichier). CEMAC 0% (sourcer BVMAC).
- ~~#32~~ CORRIGE T17: routes_vl.js 10 lignes multiplication→division (updateValues + uploadsfilevl)
- ~~#33~~ CORRIGE ET DEPLOYE T15c: import_indices_excel.js step4 multiplication→division `f6d7cb2`

## Audit securite 2026-06-13
- ~~#42~~ CORRIGE: Route ClickHouse /api/classementquartile/:id crash ReferenceError → 410 Gone
- ~~#43~~ CORRIGE: Path traversal multer filename → path.basename()
- #44 Routes POST sans authenticate (ajoutVL, uploadsfilevl, postfond, updatefond) — a corriger apres validation Eric
- #45 CSV formula injection (uploadsfilevl/indice) — sanitisation a ajouter
- #46 Promise chains sans .catch() (apigestionperformance.js)

Voir l'audit complet et l'historique dans `../front_end_opcvm/CODE_REVIEW.md`.
