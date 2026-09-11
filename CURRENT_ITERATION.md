# CURRENT_ITERATION — AfricaFunds API

## AF-GOV-FINAL-CERT-20260911-01

**Objectif :** terminer de bout en bout la certification AfricaFunds demandée par le propriétaire : reconstruction obligatoire de contexte pour toute nouvelle session, découverte croisée des deux repositories, certification 100 % des Markdown, reprise multi-agent déterministe, observabilité S2 sans travail à l'aveugle même sans bridge MCP, fallback GitHub Actions/SSH gouverné, enforcement GitHub et attestation finale.

**Scope :** gouvernance/versioning, mémoire persistante, CI GitHub, workflows d'observation/déploiement S2, validateurs, registres machine-readable et tests de reprise.

**Hors scope sans gate distinct :** changement métier des fonds, correction de données financières, migration DB destructive, suppression d'artefacts S2 `UNKNOWN`, rotation de secrets ou mutation de configuration production non autorisée.

**Invariant :** `KEEP/ENRICH/ADAPT/CREATE`, jamais `DELETE/REPLACE/RENAME` lorsqu'une autorité existante peut être enrichie.

**Baseline d'ouverture :**
- API `b2753cd860e2f466f53ddc5e8651c80c62d41d12`
- Frontend `c4c3fba5bf90f3be1c2ebaeadb8fcd0f1d5b1d6d`

Toute écriture réobserve les deux HEAD avant commit.
