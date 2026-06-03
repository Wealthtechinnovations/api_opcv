# ROADMAP — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/ROADMAP.md` (roadmap produit unifiee).
> Ce fichier note les chantiers techniques backend moyen/long terme.

## Court terme
- ~~Fiabilisation classements (national + EUR/USD)~~ — CORRIGE et DEPLOYE 2026-06-03 (type1 OK)
- Amelioration couverture indRef EUR/USD : recalc TND, mapping BRVM→UEMOA, decision CEMAC (cf T13_DIAGNOSTIC_INDICES.md)
- Fix conversion routes_vl.js multiplication→division (#32)
- Automatisation data UEMOA (scraper BRVM) et CEMAC (COSUMAF)

## Moyen terme
- Index UNIQUE valorisations(fund_id, date) + nettoyage doublons
- ClickHouse analytics : installation production + backfill performance_historique
- Extraction continue de apigestionsavequotidien.js et routes_vl.js (monolithes)

## Long terme
- Activation eventuelle de l'architecture microservices (services/gateway) — actuellement monolithe en prod
- Tests automatises sur les calculs financiers critiques (performances, ratios, classements)

Voir la roadmap produit complete dans `../front_end_opcvm/ROADMAP.md`.
