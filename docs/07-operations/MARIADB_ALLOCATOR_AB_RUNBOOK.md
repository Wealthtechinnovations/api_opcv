# MARIADB_ALLOCATOR_AB_RUNBOOK — AF-OPS-003

## Objet

Prouver ou réfuter la RCA `PROBABLE system malloc fragmentation/retention` de `AF-INC-20260817-001`.

Ce runbook **n'autorise pas** l'exécution. Toute phase qui installe un paquet, modifie systemd ou redémarre MariaDB exige `REQUIRED_HUMAN_APPROVAL`.

## Baseline prouvée

Au 2026-09-14 ~22:53 UTC :
- MariaDB `10.6.23-MariaDB-0ubuntu0.22.04.1` ;
- allocateur : `system` / glibc ;
- RSS ~6.68 Gio après ~8h52 ;
- `Memory_used` ~444 Mio, initial ~422 Mio ;
- `RssAnon/Private_Dirty` ~6.65 Gio ;
- 9 connexions, 18 threads, max historique 19 ;
- plafond global+sessions calculé ~0.70 Gio ;
- aucun jemalloc/tcmalloc installé ;
- aucun outil BPF memleak installé.

## Préflight obligatoire

1. Réobserver les deux HEAD GitHub et S2.
2. Vérifier DB=PASS, PM2 online, HTTP local/public 200.
3. Vérifier `active_sensitive_jobs=0`.
4. Sauvegarder la configuration MariaDB et les overrides systemd.
5. Capturer un nouveau baseline `ops-mysql-memoire.yml`.
6. Vérifier le chemin exact de `libjemalloc.so` du paquet candidat avant tout override.
7. Ne modifier aucun buffer SQL pendant l'expérience : un seul facteur doit changer.

## A/B proposé

### A — contrôle

Allocateur courant `system`. Baseline versionnée via `AF-EVD-040`.

### B — candidat

Après approbation humaine uniquement :
1. installer le paquet distribution `libjemalloc2` ;
2. créer un drop-in systemd minimal pour MariaDB avec `LD_PRELOAD` vers le chemin vérifié de jemalloc ;
3. `systemctl daemon-reload` ;
4. redémarrer MariaDB dans une fenêtre contrôlée ;
5. vérifier immédiatement DB SELECT, PM2, API locale et HTTP public ;
6. collecter exactement les mêmes métriques RSS / RssAnon / Memory_used / connexions / OOM sous workload comparable.

Aucun changement de version MariaDB, de buffer ou de schéma dans le même A/B.

## Critère de preuve

La conclusion doit être comparative :
- même ordre de grandeur d'uptime et de workload ;
- `Memory_used` comparable ;
- disparition ou forte réduction du différentiel multi-Gio `RSS - Memory_used` ;
- absence d'OOM et aucune régression DB/API.

Un simple redémarrage avec RSS bas immédiatement après démarrage n'est **pas** une preuve.

## Rollback

Si MariaDB ne démarre pas, si DB/API échoue ou si la mémoire ne s'améliore pas :
1. supprimer le drop-in `LD_PRELOAD` ;
2. `systemctl daemon-reload` ;
3. redémarrer MariaDB avec l'allocateur `system` ;
4. vérifier DB/PM2/HTTP ;
5. conserver les preuves du test négatif.

## Après A/B

- si B corrige durablement le différentiel : root cause peut passer à `PROVEN` et le correctif permanent doit être gouverné ;
- sinon : root cause retourne à `UNKNOWN/PROBABLE` et le prochain diagnostic est un profiling BPF/heap dans une fenêtre contrôlée.

## Version MariaDB

Le serveur observé est en 10.6.23. Le cycle de support/version MariaDB est un chantier de maintenance distinct ; il ne doit pas être utilisé pour masquer ou prétendre prouver la RCA allocator.
