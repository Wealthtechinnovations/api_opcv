# NEXT_ACTION — AfricaFunds API

## Priorité opérationnelle pré-V2 — AF-OPS-003

La boucle de certification de gouvernance reste fermée :

```text
AF-TASK-003 = DONE_WITH_EXTERNAL_GAPS
AF-TASK-011 = DONE
```

La priorité opérationnelle distincte reste :

```text
AF-OPS-003
MariaDB — RCA des OOM répétés
status = OPEN
phase = RCA_PENDING
incident = AF-INC-20260817-001
latest evidence = AF-EVD-054
```

### Ce qui est prouvé

- OOM-kill de `mariadbd` : PROVEN ;
- RSS multi-Gio presque entièrement `RssAnon/Private_Dirty` : PROVEN ;
- buffers SQL / connexions insuffisants pour expliquer le RSS : PROVEN ;
- large écart `Memory_used` MariaDB vs RSS : PROVEN ;
- A/B allocateur courts : COMPLETED, rollback et health checks PASS ;
- causalité glibc/jemalloc sur la dérive de plusieurs heures : NON PROUVÉE.

### Historique A/B à ne pas rejouer

- `34908277049` — comparaison initiale confondue par l'âge du processus ;
- `34908496545` — processus frais / charge égale, comportement proche ;
- `34908755786` — stress synthétique variable_alloc_free, résultat workload-dependent ;
- `34909181790` — dry-run réel EUR/USD, croissance RSS pratiquement équivalente.

Preuves : `AF-EVD-041` à `AF-EVD-044`. `AF-EVD-040` reste la preuve historique pré-A/B.

### Nouvelle récurrence et trajectoire longue prouvées

- `AF-EVD-053` : **7e OOM documenté**, le 2026-09-21 à 10:02:23 UTC. `mariadbd` PID 2100513 est tué à `anon-rss=15054704 kB`; le service ne redevient ready que le 2026-09-22 à 06:25:02 UTC sous `Restart=on-abort`.
- `AF-EVD-054` : trajectoire post-redémarrage reconstruite — ~127-130 MB à ~3 min, ~247 MB vers 1 h, puis `8961068 kB` (~8.55 GiB) à ~46 h 52, presque entièrement `RssAnon/Private_Dirty`, alors que `Memory_used` ne passe que d'environ 450 à 482 MB.

Ces faits **prouvent l'accumulation multi-heure**, pas sa cause exacte. Le cron Nigeria est temporellement proche du nouvel OOM mais son sous-traitement exact au moment du kill n'est pas encore attribué.

### Prochaine preuve

Instrumenter **en lecture seule** une série temporelle périodique suffisamment fine pour corréler PID/uptime/RSS/RssAnon/Private_Dirty/Memory_used avec START/END/timeouts des vrais batchs. L'objectif est de localiser les paliers de croissance, sans restart, sans nouvel A/B jemalloc et sans mutation MariaDB. `AF-EVD-050` interdit toujours d'interpréter le label kernel `npm start` comme preuve d'un build frontend.

Aucun nouvel A/B jemalloc, restart MariaDB, changement systemd, buffer, schéma ou version n'est autorisé par cette prochaine action.

## Autres blockers indépendants

- `AF-OPS-001` reste `BLOCKED_HUMAN_APPROVAL` pour `Restart=on-failure` ;
- `AF-TASK-010` reste bloquée sur les rotations fournisseur `EMAIL_PASSWORD` et `MAGIC_SECRET_KEY` ;
- OOB host-key et GitHub native rulesets restent des gaps externes.


### AF-OPS-005 en parallèle read-only

`AF-EVD-049` prouve six `Access denied fund_opcvm@localhost` après le restart de 23:32, entre 23:36:29 et 23:38:56, puis aucun autre jusqu'au relevé 00:38. Aucun cron AfricaFunds n'apparaît dans la fenêtre. Le consommateur est intermittent et non attribué : poursuivre l'inventaire process/config avec comparaison de secrets par empreinte uniquement, sans afficher de valeur et sans rotation/restart.


## Data-quality operational queue — measured 2026-09-22

The live production authority `docs/ETAT_PRODUCTION_VERIFIE.md` now measures **10/16 controls OK, 4 critical failures and 2 alerts** (`AF-EVD-055`). Nigeria and Tunisia freshness are back within budget; the remaining critical set is C2/C3/C7/C8. Historical `AF-EVD-052` is preserved, not rewritten. These failures map to existing requirements `AF-REQ-011..015` in the single governed task queue:

- `AF-OPS-007` — C7/C3: mixed-scale VL series then absurd performances; read-only preflight first.
- `AF-OPS-009` — pipeline reliability: C4 freshness is currently within budget, but the Nigeria weekly run on 21/09 failed downstream after the MariaDB OOM; verify the next cycle without forcing a backfill.
- `AF-OPS-008` — C2/C8: orphan/stale derived performances; dependency-gated behind VL integrity/freshness.

Execution order: base VL integrity/freshness before derived performance cleanup/recalculation. Do not recalculate rankings on top of unvalidated performance data.

## AF-OPS-005 update

`AF-EVD-051` proves two stale credential-bearing files exist on S2 (`.env.production`, `.env.production.plan-b`) while the active `.env` matches the current DB credential. No active process/load path is yet proven to consume the stale files. Continue read-only attribution; no DB rotation/restart.
