# CURRENT_ITERATION — AfricaFunds API

## AF-GOV-FINAL-CERT-20260911-01 — CLOSED_WITH_EXTERNAL_GAPS

`AF-TASK-011` est terminée et `AF-TASK-003` est fermée avec gaps externes. L'état interne attendu est atteint sans nouvelle branche, sans suppression d'untracked, sans rotation DB supplémentaire et sans correction opportuniste des anomalies métier C2/C3/C4/C7/C8.

La seule tâche gouvernée restante est `AF-TASK-010 = BLOCKED_EXTERNAL_PROVIDER_ROTATION`.

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

La priorité opérationnelle distincte est désormais `AF-OPS-003` / `AF-INC-20260817-001`. La RCA allocator est au niveau `PROBABLE`, soutenue par `AF-EVD-040`. Le prochain test causal est l'A/B jemalloc documenté dans `docs/07-operations/MARIADB_ALLOCATOR_AB_RUNBOOK.md`, sous `REQUIRED_HUMAN_APPROVAL`.
