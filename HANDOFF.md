# HANDOFF — AfricaFunds API

## Point de reprise courant

Boucle `AF-GOV-FINAL-CERT-20260911-01` en cours sur la branche canonique existante `claude/code-review-improvements-ikvuj`, sans création de branche.

Le socle Regulatory Plus est déjà installé. Il est interdit de le reconstruire en parallèle. Le travail courant consiste à le rendre auto-cohérent, exhaustivement certifié et résilient à l'indisponibilité du bridge MCP.

## Baseline observée

- API : `b2753cd860e2f466f53ddc5e8651c80c62d41d12`
- Frontend : `c4c3fba5bf90f3be1c2ebaeadb8fcd0f1d5b1d6d`
- Default/canonical branch des deux dépôts : `claude/code-review-improvements-ikvuj`

Les SHA sont des checkpoints d'ouverture ; la reprise relit toujours GitHub.

## État

- `AF-TASK-001` : DONE — intégration Regulatory Plus API.
- `AF-TASK-002` : DONE — intégration Regulatory Plus frontend.
- `AF-TASK-003` : IN_PROGRESS — certification finale bi-repository.
- `AF-TASK-004` : IN_PROGRESS — reconstruction de contexte/découverte croisée/gates.
- `AF-OPS-001` : BLOCKED_HUMAN_APPROVAL — MariaDB Restart=on-failure après OOM.
- `AF-TASK-005` : DONE — Certification exhaustive de tous les Markdown courants.
- `AF-TASK-006` : IN_PROGRESS — Observabilité S2 sans bridge MCP.
- `AF-TASK-007` : IMPLEMENTED_AWAITING_LIVE_PROOF — Fallback déploiement API/frontend et preflight GOV-006 commun.
- `AF-TASK-008` : PARTIALLY_ENFORCED — Enforcement GitHub et détection de drift.
- `AF-TASK-009` : IN_PROGRESS — Tests reprise multi-agent, bridge-down et certification finale.
- `AF-TASK-010` : SECURITY_GATE — Remédiation des secrets suivis sans régression runtime.
- `AF-TASK-011` : PENDING — Synchronisation finale des registres et attestation bi-repository.
- lots suivants : voir `.governance/loop/task-queue.json`.

## Reprise obligatoire par tout agent

1. ouvrir un des deux repos ;
2. lire `.governance/project.json` et `.governance/repository.json` pour découvrir l'autre repo ;
3. vérifier default/canonical branches + HEAD des deux repos ;
4. lire `00_START_HERE.md`, `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md`, `AGENTS.md`, `DIRECTIVE_TRAVAIL.md`, `PROJECT_CONTEXT.md`, `LOOP_ENGINEERING.md` ;
5. lire `STATUS.md`, le `SUIVI.md` global frontend, `CURRENT_ITERATION.md`, `LOOP_STATE.md`, `HANDOFF.md`, `NEXT_ACTION.md`, `OPEN_QUESTIONS.md` et la task queue ;
6. inspecter commits/CI récents ;
7. observer S2/runtime si la tâche dépend de production, via bridge MCP ou fallback GitHub Actions/SSH ;
8. reconstruire `FUND_STATE` avant tout write.

## Production

Aucun état S2 n'est supposé à partir de ce handoff. `PRODUCTION_ATTESTATION` reste à mesurer après les commits du programme.
