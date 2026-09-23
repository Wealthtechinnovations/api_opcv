# CURRENT_ITERATION — AfricaFunds API

<!-- PROGRAMME_DIRECTOR:BEGIN -->
### Projection gérée — itération courante

- operational_priority: `AF-OPS-003`
- operational_phase: `POST_FIX_VALIDATION`
- programme_task: `AF-TASK-027`
- programme_status: `IN_PROGRESS`
- programme_phase: `WRITEBACK_ENGINE_DRY_RUN`
- active_claims: `AF-TASK-017, AF-TASK-027`

<!-- PROGRAMME_DIRECTOR:END -->

## AF-GOV-FINAL-CERT-20260911-01 — CLOSED_WITH_EXTERNAL_GAPS

`AF-TASK-011` est terminée et `AF-TASK-003` est fermée avec gaps externes. L'état interne attendu est atteint sans nouvelle branche, sans suppression d'untracked, sans rotation DB supplémentaire et sans correction opportuniste des anomalies métier C2/C3/C4/C7/C8.

La seule tâche gouvernée restante est `AF-TASK-010 = BLOCKED_EXTERNAL_PROVIDER_ROTATION`.

### Priorité opérationnelle courante — Programme Directeur

- `AF-OPS-003 = OPEN / POST_FIX_VALIDATION` reste la priorité opérationnelle runtime ;
- `AF-TASK-026 = IN_PROGRESS / WRITEBACK_GATE_PREFLIGHT` porte le gate d'insertion initiale des blocs gérés ;
- preuves amont `AF-EVD-065..066` : déterminisme + simulation idempotente zéro-write ;
- `AF-TASK-017 = IN_PROGRESS` garde son claim Allocation séparé ;
- paire `AF-TASK-017 ↔ AF-TASK-026` certifiée non chevauchante ;
- aucun write-back n'est autorisé si HEAD, claims, marqueurs ou contenu hors bloc dérivent.

### Historique conservé

## AF-GOV-FINAL-CERT-20260911-01 — FINAL_ATTESTATION

Le programme Regulatory Plus / Loop Engineering n'est plus en phase d'installation. Les fonctions centrales sont en service et testées.

### Terminé

- reconstruction déterministe Claude/ChatGPT depuis l'un ou l'autre repo ;
- découverte croisée API ↔ frontend ;
- certification exhaustive des Markdown ;
- branch drift CI ;
- SSH GitHub Actions→S2 indépendant du bridge MCP ;
- GOV-006 partagé ;
- fallbacks API/frontend safe path ;
- détachement du vrai `.env` de Git sans changer son chemin runtime ;
- rotation DB ;
- rotation JWT + révocation de l'ancienne clé.

### Actif

`AF-TASK-011` : synchronisation finale des registres, du `SUIVI.md` global et de S2, puis attestation finale.

### Externes

SMTP/EMAIL provider rotation, Magic provider rotation, OOB host-key verification et GitHub native rulesets.


## Priorité opérationnelle pré-V2 — AF-OPS-003

La certification de gouvernance reste fermée et son verdict reste `GOVERNED_WITH_EXTERNAL_GAPS`.

La priorité opérationnelle distincte est `AF-OPS-003` / `AF-INC-20260817-001`. Les A/B courts glibc/jemalloc ont été exécutés et rollbackés avec succès (runs `34908277049`, `34908496545`, `34908755786`, `34909181790`). Ils ne discriminent pas causalement la dérive RSS de plusieurs heures.

La root cause exacte revient à `UNKNOWN` sous incident `RCA_PENDING`. La prochaine preuve est une corrélation longue durée read-only RSS ↔ âge du processus ↔ crons ↔ batchs ↔ timeouts ↔ handlers ↔ activité MariaDB. Aucun nouvel A/B jemalloc ou restart MariaDB n'est requis à ce stade.


## Data-quality reconciliation — 2026-09-16

The production control at 11:15 UTC remains authoritative: 8/16 OK, 6 critical failures, 2 alerts. Existing `AF-REQ-011..015` are now connected to the single task queue as `AF-OPS-007..009`. The dependency order is VL integrity/freshness first, then derived performances. This does not replace or close `AF-OPS-003`.
