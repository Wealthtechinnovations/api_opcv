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
latest evidence = AF-EVD-044
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

### Prochaine preuve

Poursuivre **en lecture seule** la corrélation longue durée déjà amorcée par `f082c33...` et `94ed36d...`.

Mesurer et corréler PID/uptime/RSS/RssAnon/Private_Dirty/Memory_used, crons, batchs, timeouts clients, fin réelle des handlers Node, activité MariaDB et chevauchements. `AF-EVD-047` prouve que l'OOM du 14/09 survient pendant le cron Nigeria, étape `recalc_vl_ajuste`; `AF-EVD-046` prouve qu'un timeout curl ne déclenche aucune annulation explicite du handler `saveperfdatemysql`. La prochaine preuve doit quantifier la continuation/overlap réelle et vérifier si un même motif existe sur les autres OOM.

Aucun nouvel A/B jemalloc, restart MariaDB, changement systemd, buffer, schéma ou version n'est autorisé par cette prochaine action.

## Autres blockers indépendants

- `AF-OPS-001` reste `BLOCKED_HUMAN_APPROVAL` pour `Restart=on-failure` ;
- `AF-TASK-010` reste bloquée sur les rotations fournisseur `EMAIL_PASSWORD` et `MAGIC_SECRET_KEY` ;
- OOB host-key et GitHub native rulesets restent des gaps externes.
