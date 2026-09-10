# NEXT_ACTION — AfricaFunds API

> Une seule prochaine action exécutable.

## Action courante

Lancer `.github/workflows/ops-fix-segments-naira.yml` en mode `execute`, entrée
`recalculer: false`, avec la phrase exacte `VALIDER CORRECTION SEGMENTS NAIRA`.

Cela corrige les 157 VL libellées en dollars dans des séries tenues en naira
(`AF-REQ-011` / C7) et, par voie de conséquence, les performances aberrantes
(`AF-REQ-012` / C3). Périmètre mesuré et dry-run validé le 2026-09-01 : 41
segments sur 30 fonds, dont 145 VL dans 29 plateaux. Chaque valeur écrite est
LUE dans la source SEC pour sa date exacte — aucune n'est calculée.

## Gate

`REQUIRED_HUMAN_APPROVAL`. La phrase de confirmation est un verrou délibéré : il
existe pour que cette écriture en base financière de production soit un acte
tracé du propriétaire, non un effet de bord d'une boucle automatique. Une session
disposant d'un accès API GitHub authentifié pourrait techniquement la fournir
elle-même — elle ne doit pas.

`recalculer: false` est recommandé : le recalcul EUR/USD porte sur ~990 000
lignes, et c'est ce profil de charge qui a fait tuer `mariadbd` par l'OOM-killer
le 2026-08-31. Le cron de 20 h s'en charge.

## Stop conditions

Arrêter l'écriture si le HEAD API ou frontend change de manière concurrente, si
une autorité historique contredit le nouveau mécanisme, ou si une opération
exigerait suppression, force-push, réécriture d'historique ou destruction d'un
artefact `UNKNOWN`.
