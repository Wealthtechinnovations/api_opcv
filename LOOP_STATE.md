# LOOP_STATE — AfricaFunds API

<!-- PROGRAMME_DIRECTOR:BEGIN -->
### Projection gérée — état de boucle

- loop_id: `AF-GOV-FINAL-CERT-20260911-01`
- governance_current_task: `AF-TASK-010`
- operational_priority: `AF-OPS-003`
- operational_phase: `POST_FIX_VALIDATION`
- programme_task: `AF-TASK-026`

<!-- PROGRAMME_DIRECTOR:END -->

## État courant — clôture interne

> Boucle : `AF-GOV-FINAL-CERT-20260911-01`  
> Stage : `CLOSED_WITH_EXTERNAL_GAPS`  
> Tâche courante : `AF-TASK-010`  
> Parent certifié : `AF-TASK-003 = DONE_WITH_EXTERNAL_GAPS`

```text
AF-TASK-001 DONE
AF-TASK-002 DONE
AF-TASK-003 DONE_WITH_EXTERNAL_GAPS
AF-TASK-004 DONE
AF-TASK-005 DONE
AF-TASK-006 DONE_WITH_EXTERNAL_TRUST_GAP
AF-TASK-007 DONE
AF-TASK-008 DONE_WITH_EXTERNAL_GAP
AF-TASK-009 DONE
AF-TASK-010 BLOCKED_EXTERNAL_PROVIDER_ROTATION
AF-TASK-011 DONE
```

Preuves de clôture : `AF-EVD-035`, `AF-EVD-036`. Verdict : `GOVERNED_WITH_EXTERNAL_GAPS`.

### Priorité opérationnelle actuelle

```text
AF-OPS-003 = OPEN / POST_FIX_VALIDATION
AF-TASK-026 = IN_PROGRESS / WRITEBACK_GATE_PREFLIGHT
```

La boucle de certification historique reste fermée avec gaps externes. Le claim `AF-TASK-026` est borné aux surfaces gouvernance/projections et ne chevauche pas `AF-TASK-017`. Le write-back initial reste gated par un nouveau run generator+simulator sur le couple de HEAD courant.

### Historique conservé

> Boucle : `AF-GOV-FINAL-CERT-20260911-01`
> Stage : `FINAL_ATTESTATION`
> Tâche courante : `AF-TASK-011`
> Parent : `AF-TASK-003`

## Checkpoint observé

- API avant réconciliation finale des registres : `4890506f6e8155da68c678eb98e3f05358920ebe`
- Frontend : `d1aae176cc9ade8801f5e2e1ba69e752cd697316`

Les SHA sont des checkpoints observés et non auto-référentiels.

## État des lots

```text
AF-TASK-001 DONE
AF-TASK-002 DONE
AF-TASK-003 IN_PROGRESS
AF-TASK-004 DONE
AF-TASK-005 DONE
AF-TASK-006 DONE_WITH_EXTERNAL_TRUST_GAP
AF-TASK-007 DONE
AF-TASK-008 DONE_WITH_EXTERNAL_GAP
AF-TASK-009 IN_PROGRESS
AF-TASK-010 BLOCKED_EXTERNAL_PROVIDER_ROTATION
AF-TASK-011 IN_PROGRESS
```

## Sécurité

- le vrai `.env` n'est plus suivi dans le HEAD Git ;
- runtime S2 : même chemin `.env`, local, ignoré, mode 0600 ;
- `DB_PASSWORD` : rotaté, ancien credential rejeté ;
- `JWT_SECRET` : rotaté ; l'ancienne clé compromise a été désactivée et les anciens tokens révoqués ;
- `EMAIL_PASSWORD` : rotation fournisseur externe requise ;
- `MAGIC_SECRET_KEY` : rotation fournisseur externe requise.

## Prochaine étape

Exécuter la certification finale interne, puis conclure `GOVERNED_WITH_EXTERNAL_GAPS` si et seulement si tous les gates internes sont verts.


## Couche opérationnelle post-certification

La boucle `AF-GOV-FINAL-CERT-20260911-01` reste `CLOSED_WITH_EXTERNAL_GAPS` avec `AF-TASK-010` comme tâche de gouvernance externe.

Une priorité opérationnelle post-certification existe en parallèle dans **la même task queue** :
- `AF-OPS-003 = OPEN` ;
- incident `AF-INC-20260817-001 = RCA_PENDING` ;
- mécanisme OOM / large écart RSS-vs-Memory_used : prouvé ;
- root cause exacte : `UNKNOWN` ;
- A/B allocateur courts : terminés, preuves `AF-EVD-041..044` ;
- prochaine preuve : corrélation longue durée read-only des batchs/crons/timeouts/handlers avec le RSS MariaDB.

`AF-EVD-040` reste la preuve historique pré-A/B. `AF-OPS-001` reste un gate humain séparé. Ce n'est pas une réouverture d'`AF-TASK-011` ni une seconde queue.


## Operational data-quality layer — 2026-09-16

No second queue was created. Existing requirements `AF-REQ-011..015` remain OPEN and are executed through the canonical task queue:
- `AF-OPS-007 = OPEN / READ_ONLY_PREFLIGHT`
- `AF-OPS-009 = OPEN / READ_ONLY_RCA`
- `AF-OPS-008 = OPEN / DEPENDENCY_GATED`

`AF-OPS-003` remains the current operational priority. Data-quality preflights may proceed in parallel only when read-only and non-disruptive.
