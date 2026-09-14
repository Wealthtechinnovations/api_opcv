# AF-INC-20260817-001 — MariaDB arrêts répétés / OOM

**Statut : RCA_PENDING — SEV1 — root cause PROBABLE**

## Impact
Plusieurs arrêts MariaDB ont rendu l'API indisponible. L'occurrence du 2026-09-14 a laissé la DB morte environ 3 h 56 avant recovery manuel.

## Faits et récurrence
Occurrences documentées : 2026-08-17 ; 2026-08-27 21:40 et 22:00 ; 2026-08-31 18:33 ; 2026-09-08 20:02:42 ; 2026-09-14 10:04:14.

## Mécanisme — PROVEN
Sur des occurrences documentées, le kernel OOM killer a tué `mariadbd`.

## Root cause — PROBABLE

Le meilleur diagnostic actuel est **rétention/fragmentation du system malloc (glibc)**, hors des allocations que MariaDB comptabilise dans `Memory_used`.

Preuve S2 du 2026-09-14 ~22:53 UTC :
- RSS `mariadbd` : ~6,68 Gio ;
- `RssAnon` / `Private_Dirty` : ~6,65 Gio ;
- `Memory_used` MariaDB : ~444 Mio ;
- `Memory_used_initial` : ~422 Mio ;
- 9 connexions, 18 threads, maximum historique 19 connexions ;
- plafond configuration/buffers calculé : ~0,70 Gio ;
- `version_malloc_library=system`, libc liée ;
- nombreux mappings anonymes ~64/128 Mio presque entièrement dirty ;
- pas de jemalloc/tcmalloc ni de BPF memleak disponible.

Les buffers/session et la configuration SQL ne peuvent donc pas expliquer les 6–15 Gio de RSS. La causalité glibc reste néanmoins **PROBABLE**, pas PROVEN, tant qu'un A/B avec jemalloc/tcmalloc n'a pas reproduit un workload comparable sans le différentiel RSS-Memory_used.

## Facteurs contributifs
- absence de `Restart=on-failure` : défaut de résilience, pas root cause ;
- alerting insuffisant / faux-vert historique du contrôle production ;
- diagnostic initial longtemps visible uniquement dans Actions.

## Mesures prises
- recovery gouverné diagnostique avant de démarrer MariaDB ;
- journal des incidents persisté dans `docs/OPS_MARIADB.md` ;
- diagnostic mémoire read-only ;
- contrôle production faux-vert corrigé.

## Actions ouvertes
- `AF-OPS-001` : Restart=on-failure, gate humain ;
- `AF-OPS-003` : prouver la root cause mémoire puis la corriger.

L'incident ne peut pas être CLOSED tant que la root cause n'est pas prouvée.


## Prochaine preuve requise — A/B allocateur

Gate : **REQUIRED_HUMAN_APPROVAL** car l'expérience nécessite installation de librairie et redémarrage MariaDB.

Runbook : `docs/07-operations/MARIADB_ALLOCATOR_AB_RUNBOOK.md`.

La root cause ne passera à `PROVEN` que si l'expérience démontre que, sous un workload comparable, le passage à jemalloc/tcmalloc supprime ou réduit fortement le différentiel RSS-Memory_used sans régression DB/API. Si le différentiel persiste, rollback immédiat et poursuite du profiling (BPF/heap) ; ne pas forcer la conclusion.
