# ADR-AF-0001 — Intégration Regulatory Plus

**Statut :** Accepted — 2026-09-10.

## Contexte
AfricaFunds possédait déjà un corpus riche, un premier socle de gouvernance et GOV-006. `chainsolutions-wealthtech/Regulatory` apporte un système plus complet de mémoire opérationnelle, qualité, décisions, loop, IA et preuves.

## Décision
Intégrer les mécanismes génériques absents sans copier les règles métier Regulatory et sans supprimer/reclassifier destructivement les canons AfricaFunds.

Ordre : `KEEP_EXISTING → ENRICH_EXISTING → CREATE_ADAPTER/INDEX → CREATE_CANONICAL`.

## Conséquences
Les anciens documents restent consultables et autoritatifs selon `SOURCE_OF_TRUTH.md`. Les nouveaux registres ont des rôles distincts. Toute contradiction est documentée et résolue explicitement.

## Rollback
Comme l’intégration est additive, un rollback consiste à revenir au commit précédent ; aucune donnée métier ou production n’est migrée par cet ADR.