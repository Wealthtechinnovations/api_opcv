# NEXT_ACTION — AfricaFunds API

## Priorité opérationnelle pré-V2 — AF-OPS-003

La boucle de certification de gouvernance reste fermée :

```text
AF-TASK-003 = DONE_WITH_EXTERNAL_GAPS
AF-TASK-011 = DONE
```

Le prochain chantier interne déterministe demandé par le propriétaire est :

```text
AF-OPS-003
MariaDB — RCA des OOM répétés
status = BLOCKED_HUMAN_APPROVAL
phase = ALLOCATOR_A_B_REQUIRED
incident = AF-INC-20260817-001
evidence = AF-EVD-040
```

### Ce qui est prouvé

- OOM-kill de `mariadbd` : PROVEN ;
- RSS multi-Gio presque entièrement `RssAnon/Private_Dirty` : PROVEN ;
- buffers SQL / connexions insuffisants pour expliquer le RSS : PROVEN ;
- `Memory_used` MariaDB ≈ 444 Mio contre RSS ≈ 6,68 Gio : PROVEN ;
- allocateur courant : `system` / glibc : PROVEN ;
- rétention/fragmentation system malloc : **PROBABLE**, pas PROVEN.

### Prochaine preuve

Exécuter l'A/B gouverné décrit dans :

`docs/07-operations/MARIADB_ALLOCATOR_AB_RUNBOOK.md`

Cette expérience exige une approbation humaine explicite car elle implique :
1. installation de `libjemalloc2` ;
2. drop-in systemd `LD_PRELOAD` ;
3. redémarrage MariaDB ;
4. observation comparative sous workload comparable ;
5. rollback immédiat en cas de régression.

Aucun changement de buffer SQL, de version MariaDB ou de schéma ne doit être mélangé à cet A/B.

## Autres blockers indépendants

`AF-TASK-010` reste bloquée sur :
- rotation fournisseur `EMAIL_PASSWORD` ;
- rotation fournisseur `MAGIC_SECRET_KEY`.

Restent également externes :
- vérification OOB de la clé hôte S2 ;
- GitHub native rulesets.

## Interdictions

Ne jamais déclarer la RCA PROVEN avant l'A/B, ne pas redémarrer MariaDB sans gate humain, ne pas réactiver d'ancienne clé/secrets, ne pas créer de branche, ne pas modifier le frontend concurrent sans revalidation des deux HEAD.
