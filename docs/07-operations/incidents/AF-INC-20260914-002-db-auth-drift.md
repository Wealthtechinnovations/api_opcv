# AF-INC-20260914-002 — DB auth drift post-rotation

**Statut : RCA_PENDING — SEV2**

## Faits

`AF-EVD-049` prouve désormais des refus **après** restart MariaDB : six `Access denied for user 'fund_opcvm'@'localhost'` à 23:36:29, 23:36:33, 23:36:48, 23:36:51, 23:38:53 et 23:38:56 UTC.

Le journal cron 23:30–23:45 ne montre aucun cron AfricaFunds. Les quatre premiers refus chevauchent temporellement un diagnostic GitHub Actions read-only, mais ce diagnostic utilise le `.env` runtime courant et réussit ses propres requêtes MariaDB ; les deux derniers refus surviennent après sa fin. Cette proximité ne permet donc pas une attribution.

Aucun nouveau refus `fund_opcvm` n'apparaît ensuite dans la fenêtre observée jusqu'au relevé 00:38.

## État courant observé

DB SELECT PASS, sessions authentifiées présentes et diagnostics read-only fonctionnels. Le défaut est **intermittent**, pas un credential runtime principal continuellement cassé.

## Root cause — UNKNOWN

La télémétrie MariaDB disponible n'expose pas le PID/exécutable client pour ces refus : `general_log=OFF`, `performance_schema=OFF`, `userstat=OFF`.

Le consommateur intermittent reste donc à identifier. Aucune nouvelle rotation DB ni restart MariaDB n'est justifié.

## Action

`AF-OPS-005` : inventorier en lecture seule processus et fichiers de configuration locaux qui déclarent `fund_opcvm`, comparer les credentials par empreinte/égalité avec le `.env` courant **sans afficher les valeurs**, et conserver `UNKNOWN` si aucun consommateur précis n'est prouvé.
