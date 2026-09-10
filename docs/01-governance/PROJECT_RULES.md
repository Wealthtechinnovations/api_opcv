# PROJECT_RULES — AfricaFunds API

> Statut : `CURRENT_SPECIALIZED`.
> Autorité supérieure : `GOVERNANCE.md`.
> Résolution des conflits d’autorité : `SOURCE_OF_TRUTH.md`.

Ce fichier **complète** les contrats racine ; il ne crée pas une politique concurrente et ne remplace aucune règle historique plus spécifique encore applicable.

## Règles projet

- branche canonique existante uniquement : `claude/code-review-improvements-ikvuj` ;
- single writer par scope ;
- deux HEAD AfricaFunds observés avant toute écriture ;
- si un HEAD change : `WRITE_GATE=CLOSED` jusqu’à réconciliation ;
- zéro régression introduite ;
- lecture et réutilisation de l’existant avant création ;
- préférer correction, renforcement, extension et migration compatible ;
- aucune donnée, preuve, validation, approbation ou attestation inventée ;
- documentation et preuves font partie du même chantier que le changement ;
- GitHub est l’autorité Git ; S2 est projection/runtime et source d’observation de production ;
- un document nouveau ne doit pas créer une deuxième source de vérité lorsqu’un canon historique existe ;
- les artefacts machine-readable structurent les IDs, états, relations et preuves mais ne remplacent pas les politiques humaines canoniques ;
- toute opération destructive exige une décision explicite, une analyse d’impact et un plan de rollback ;
- `force push`, réécriture destructive d’historique et nettoyage aveugle d’artefacts runtime sont interdits par défaut.

## Règle d’intégration documentaire

Pour toute capacité nouvelle :

`KEEP_EXISTING → ENRICH_EXISTING → CREATE_ADAPTER/INDEX → CREATE_CANONICAL uniquement si réellement absent`.

Les documents historiques restent consultables et leur statut doit être explicite lorsqu’ils ne décrivent plus l’état courant.

## AfricaFunds bi-repository

L’état complet est :

```text
FUND_STATE = {
  API_SHA,
  FRONTEND_SHA,
  SUIVI_CHECKPOINT,
  PRODUCTION_ATTESTATION
}
```

Un seul SHA ne suffit jamais à attester l’état global AfricaFunds.
