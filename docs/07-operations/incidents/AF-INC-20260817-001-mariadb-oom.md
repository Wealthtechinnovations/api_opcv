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
