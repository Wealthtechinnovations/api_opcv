# AF-INC-20260817-001 — MariaDB arrêts répétés / OOM

**Statut : RCA_PENDING — SEV1**

## Impact
Plusieurs arrêts MariaDB ont rendu l'API indisponible. L'occurrence du 2026-09-14 a laissé la DB morte environ 3 h 56 avant recovery manuel.

## Faits et récurrence
Occurrences documentées : 2026-08-17 ; 2026-08-27 21:40 et 22:00 ; 2026-08-31 18:33 ; 2026-09-08 20:02:42 ; 2026-09-14 10:04:14.

## Mécanisme — PROVEN
Sur des occurrences documentées, le kernel OOM killer a tué `mariadbd`.

## Root cause — UNKNOWN
La source de la croissance mémoire anormale n'est pas prouvée. Les buffers par session, tables temporaires et fuite/version MariaDB restent des hypothèses à discriminer par mesure.

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
