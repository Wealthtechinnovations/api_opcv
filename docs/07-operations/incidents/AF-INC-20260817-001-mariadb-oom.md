# AF-INC-20260817-001 — MariaDB arrêts répétés / OOM

**Statut : RCA_PENDING — SEV1 — root cause UNKNOWN**

## Impact
Plusieurs arrêts MariaDB ont rendu l'API indisponible. L'occurrence du 2026-09-14 a laissé la DB morte environ 3 h 56 avant recovery manuel.

## Faits et récurrence
Occurrences documentées : 2026-08-17 ; 2026-08-27 21:40 et 22:00 ; 2026-08-31 18:33 ; 2026-09-08 20:02:42 ; 2026-09-14 10:04:14.

## Mécanisme — PROVEN
Sur des occurrences documentées, le kernel OOM killer a tué `mariadbd`. Les observations pré-A/B montrent un RSS multi-Gio presque entièrement anonyme/privé alors que `Memory_used` reste de l'ordre de 450 Mio. Les buffers/session et le nombre de connexions ne suffisent pas à expliquer cet écart.

Preuve historique pré-A/B : `AF-EVD-040`.

## Root cause — UNKNOWN
L'hypothèse antérieure « rétention/fragmentation du system malloc (glibc) = PROBABLE » a été soumise à des A/B courts puis rétrogradée : ces tests ne discriminent pas le phénomène réel de plusieurs heures.

### A/B courts exécutés
- `34908277049` / `AF-EVD-041` : comparaison initiale confondue par l'âge du processus ; contrôle froid jemalloc 124 200 kB vs rollback glibc 122 732 kB (~1,2 %).
- `34908496545` / `AF-EVD-042` : processus frais / charge égale ; glibc +65 844 kB, jemalloc +63 952 kB.
- `34908755786` / `AF-EVD-043` : stress synthétique variable_alloc_free ; glibc +73 800 kB, jemalloc +97 484 kB.
- `34909181790` / `AF-EVD-044` : dry-run réel EUR/USD ; glibc +84 588 kB, jemalloc +83 728 kB (~-1,0 %).

Tous les runs ont rollbacké vers l'allocateur système avec contrôles DB/API/HTTP. Ces fenêtres de ~40–60 s sur processus frais ne prouvent ni une causalité glibc ni une supériorité durable de jemalloc.

## Facteurs contributifs
- absence de `Restart=on-failure` : défaut de résilience, pas root cause ;
- alerting insuffisant / faux-vert historique du contrôle production ;
- observabilité incomplète des fins réelles de handlers/batchs après timeout client.

## Mesures prises
- recovery gouverné diagnostique avant de démarrer MariaDB ;
- diagnostic mémoire read-only ;
- contrôle production faux-vert corrigé ;
- A/B allocateur courts exécutés et rollbackés ;
- corrélation cron/RSS et instrumentation handlers/timeouts ajoutées en lecture seule.

## Actions ouvertes
- `AF-OPS-001` : `Restart=on-failure`, gate humain séparé ;
- `AF-OPS-003` : poursuivre la RCA longue durée en lecture seule ;
- aucun nouvel A/B jemalloc sans nouvelle décision gouvernée appropriée.

## Prochaine preuve requise — corrélation longue durée read-only
Corréler PID/uptime/RSS/RssAnon/Private_Dirty/Memory_used, crons, batchs, timeouts clients, durée réelle des handlers Node, activité SQL et chevauchements éventuels, sans présumer la cause.

L'incident ne peut pas être CLOSED tant que la root cause n'est pas prouvée et qu'une corrective action n'est pas vérifiée sur une durée représentative.


## Preuves read-only supplémentaires — 2026-09-15

### Process age / RSS
`AF-EVD-045` : après le rollback vers system malloc, le RSS est passé d'environ 127–130 MiB vers ~5 minutes d'uptime à ~247 MiB vers ~50 minutes, puis reste plat sur six échantillons de 15 secondes. Cela démontre une croissance entre ces âges, pas une loi linéaire ni une cause.

### Timeout client != annulation serveur
`AF-EVD-046` : les crons appellent `saveperfdatemysql` avec `curl --max-time 300`. La route Express traite séquentiellement les fonds avec `await processFundmysql(fund)` et n'a aucun `req.aborted`, handler `close`, `AbortController` ou mécanisme équivalent. Le client peut donc cesser d'attendre sans qu'une annulation serveur soit explicitement déclenchée. Le chevauchement est possible mais doit encore être quantifié.

### OOM du 14 septembre : workload actif prouvé
`AF-EVD-047` : `cron_nigeria_weekly.sh` démarre à 10:00:01 UTC. Les étapes extraction, import Nigeria et recalcul FX terminent. L'étape 4 `recalc_vl_ajuste` est en cours lorsque le kernel enregistre `npm start invoked oom-killer` à 10:04:11 puis tue `mariadbd` à 10:04:12 (anon-rss 14,902,200 kB). Le recalcul échoue immédiatement sur `Can't add new command when connection is in closed state`; les étapes suivantes échouent en 500/ECONNREFUSED.

Cela prouve le contexte de l'occurrence du 14/09. Cela ne prouve pas que `recalc_vl_ajuste`, Nigeria ou un chevauchement soit la cause commune des six occurrences.

### Prochaine discrimination
Reconstruire le contexte workload de chaque OOM et quantifier les chevauchements réels après timeouts clients, tout en poursuivant la série RSS/uptime. Aucune mutation MariaDB n'est requise pour cette phase.


## Corrélation multi-incidents — 2026-09-15 00:38 UTC

`AF-EVD-048` montre que les workloads actifs diffèrent :
- 31/08 18:33 : correction/recalcul Nigeria manuelle documentée ; le scraper indices exécute également un backfill à partir de 18:30:20. Le chevauchement exact à la milliseconde de l'OOM doit être distingué de la simple concurrence de fenêtre, mais « aucun cron à cette heure » est réfuté.
- 08/09 ~20:02 : le cron daily est dans `recalc_eur_usd_daily_rate`, environ 600/1250 fonds traités, lorsque la connexion DB tombe ; les saveperf suivants reviennent 500.
- 14/09 10:04 : le cron Nigeria est dans `recalc_vl_ajuste` lorsque `mariadbd` est tué.
- 27/08 21:30 : le cron EUR/USD rencontre immédiatement `ECONNREFUSED`, donc cette exécution n'est pas prouvée comme déclencheur initial.

Ce tableau ne désigne aucun script unique comme root cause. Il rend au contraire nécessaire de séparer :
1. l'accumulation/rétention RSS MariaDB avant le point critique ;
2. le workload qui crée la pression finale ;
3. le processus qui invoque l'OOM-killer ;
4. la victime choisie par le kernel.

`AF-EVD-050` corrige une attribution documentaire : la ligne kernel `npm start invoked oom-killer` n'identifie pas un build frontend. L'API définit `npm start = node app.js`, le frontend définit `npm start = scripts/start.sh`, tandis que son build est `npm run build`. L'invocateur exact reste à attribuer par PID/cwd si la trace existe.


---

## Mise à jour 2026-09-22 — 7e OOM prouvé

Le diagnostic read-only `scripts/diag/ondemand/diag_mariadb_incident_timeline.js`, exécuté via le workflow existant `doc-drift.yml` (run `35776765338`), prouve une nouvelle récurrence :

- `2026-09-21 10:02:23 UTC` : systemd indique que `mariadb.service` a été frappé par l'OOM-killer ;
- kernel : `mariadbd` PID `2100513` tué avec `anon-rss=15054704 kB` ;
- `2026-09-21 10:02:25 UTC` : service en échec `oom-kill` ;
- `2026-09-22 06:25:02 UTC` : MariaDB redevient `ready for connections` ;
- politique observée : `Restart=on-abort`, `NRestarts=0`.

Une reconstruction à partir des runs read-only `34909577475`, `34913390476`, `34914261590` et `35157538491` établit aussi une trajectoire multi-heure : RSS ~127-130 MB quelques minutes après redémarrage, ~247 MB après environ une heure, puis ~8.55 GiB après ~46 h 52, presque entièrement anonyme/privé, alors que `Memory_used` MariaDB reste autour de 450-482 MB.

**Conclusion bornée :** accumulation RSS anonyme/privée multi-heure = PROVEN ; 7e OOM = PROVEN ; root cause exacte = UNKNOWN. La proximité du cron Nigeria avec l'OOM du 21/09 est factuelle mais ne suffit pas à attribuer la cause au cron ou à un sous-traitement précis.

Preuves structurées : `AF-EVD-053`, `AF-EVD-054`. Prochaine étape : série temporelle read-only périodique autour des batchs réels, sans nouvelle mutation MariaDB.
