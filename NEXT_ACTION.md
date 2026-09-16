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

Mesurer et corréler PID/uptime/RSS/RssAnon/Private_Dirty/Memory_used avant, pendant et après les vrais batchs. `AF-EVD-048` montre que les contextes lourds diffèrent entre 31/08, 08/09 et 14/09 : aucun job unique n'est prouvé comme cause commune. La prochaine preuve doit tester le modèle accumulation/rétention MariaDB sur la durée + pression finale du workload. `AF-EVD-050` interdit d'interpréter le label kernel `npm start` comme preuve d'un build frontend.

Aucun nouvel A/B jemalloc, restart MariaDB, changement systemd, buffer, schéma ou version n'est autorisé par cette prochaine action.

## Autres blockers indépendants

- `AF-OPS-001` reste `BLOCKED_HUMAN_APPROVAL` pour `Restart=on-failure` ;
- `AF-TASK-010` reste bloquée sur les rotations fournisseur `EMAIL_PASSWORD` et `MAGIC_SECRET_KEY` ;
- OOB host-key et GitHub native rulesets restent des gaps externes.


### AF-OPS-005 en parallèle read-only

`AF-EVD-049` prouve six `Access denied fund_opcvm@localhost` après le restart de 23:32, entre 23:36:29 et 23:38:56, puis aucun autre jusqu'au relevé 00:38. Aucun cron AfricaFunds n'apparaît dans la fenêtre. Le consommateur est intermittent et non attribué : poursuivre l'inventaire process/config avec comparaison de secrets par empreinte uniquement, sans afficher de valeur et sans rotation/restart.


## Data-quality operational queue — measured 2026-09-16

The live production authority `docs/ETAT_PRODUCTION_VERIFIE.md` measured 6 critical failures (`AF-EVD-052`). They are not a new backlog: they map to existing requirements `AF-REQ-011..015` and are now materialized in the single governed task queue:

- `AF-OPS-007` — C7/C3: mixed-scale VL series then absurd performances; read-only preflight first.
- `AF-OPS-009` — C4: Nigeria/Tunisia VL freshness; diagnose pipelines/source availability before import.
- `AF-OPS-008` — C2/C8: orphan/stale derived performances; dependency-gated behind VL integrity/freshness.

Execution order: base VL integrity/freshness before derived performance cleanup/recalculation. Do not recalculate rankings on top of unvalidated performance data.

## AF-OPS-005 update

`AF-EVD-051` proves two stale credential-bearing files exist on S2 (`.env.production`, `.env.production.plan-b`) while the active `.env` matches the current DB credential. No active process/load path is yet proven to consume the stale files. Continue read-only attribution; no DB rotation/restart.
