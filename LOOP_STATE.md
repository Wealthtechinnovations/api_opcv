# LOOP_STATE — AfricaFunds API

> Statut : `IN_PROGRESS`
> Boucle : `AF-GOV-FINAL-CERT-20260911-01`
> Tâche parente : `AF-TASK-003` — attestation finale bi-repository.

## Baseline observée avant le premier write

- API : `b2753cd860e2f466f53ddc5e8651c80c62d41d12`.
- Frontend : `c4c3fba5bf90f3be1c2ebaeadb8fcd0f1d5b1d6d`.
- Branche canonique et default branch des deux dépôts : `claude/code-review-improvements-ikvuj`.
- GitHub rulesets observés : aucun dans les deux dépôts au démarrage de cette boucle.
- Production S2 : à réattester après les commits de gouvernance ; aucun état production n'est supposé.

Ces SHA sont des checkpoints d'ouverture, jamais des valeurs auto-référentielles. Toute écriture relit les deux HEAD.

## State

- `DISCOVER` : DONE — deux dépôts, branches, gouvernance et gaps relus.
- `RECONCILE` : DONE — drift des registres identifié ; task queue plus récente que handoff/state historiques.
- `BASELINE` : DONE.
- `SELECT` : DONE — programme final de certification demandé explicitement par le propriétaire.
- `IMPACT_ANALYSIS` : DONE pour le lot de gouvernance ; aucun changement métier/data prévu.
- `VERIFY_HEADS` : REQUIRED avant chaque write.
- `CLAIM_SINGLE_WRITER` : REQUIRED par lot.
- `IMPLEMENT_COMPATIBLY` : IN_PROGRESS.
- `VERIFY` : PENDING après chaque commit.
- `REGRESSION_CHECK` : PENDING après chaque commit.
- `PERSIST_STATE` : IN_PROGRESS.
- `VERIFY_REMOTE_STATE` : PENDING après chaque commit.
- `VERIFY_PRODUCTION` : PENDING ; uniquement par mesure GitHub↔S2/runtime/HTTP.

## Sous-lots de certification

1. `AF-TASK-004` — reconstruction de contexte + découverte croisée + gates.
2. `AF-TASK-005` — certification exhaustive de tous les Markdown courants, path-by-path.
3. `AF-TASK-006` — observabilité S2 / fallback GitHub Actions SSH indépendant du bridge.
4. `AF-TASK-007` — fallback déploiement API/front et unification des preflights GOV-006.
5. `AF-TASK-008` — enforcement GitHub au maximum des capacités disponibles.
6. `AF-TASK-009` — tests reprise multi-agent / bridge-down / attestation finale.

## Règle

Le suivi historique global reste `front_end_opcvm/SUIVI.md`. Ce fichier est l'état de boucle structuré pour la reprise et ne remplace pas cet historique.
