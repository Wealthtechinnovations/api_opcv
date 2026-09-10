# NEXT_ACTION — AfricaFunds API

> Une seule prochaine action exécutable.

## Action courante

Donner à `mariadb.service` une politique de redémarrage automatique couvrant
l'arrêt par OOM, sur S2 :

```ini
# /etc/systemd/system/mariadb.service.d/override.conf
[Service]
Restart=on-failure
RestartSec=10
```
puis `systemctl daemon-reload`.

## Pourquoi celle-ci d'abord

Mesure du 2026-09-10 (`AF-EVD-012`) : le 2026-09-08 à 20:02:42, `mariadbd` a été
tué par l'OOM-killer à 14,6 Go, par un `node` lancé depuis `cron.service` — deux
minutes après le démarrage de `cron_daily_update.sh`. `systemd` a constaté
`Failed with result 'oom-kill'` **puis n'a rien fait**. Le service n'est reparti
que le 2026-09-09 à 06:25:03 : **10 h 22 sans base, donc sans API**.

L'incident se reproduira — le cron de recalcul tourne chaque jour ouvré à 20:00.
Cette ligne ramène l'indisponibilité de dix heures à quelques secondes. Elle ne
traite pas la cause (pic de RSS à 14,6 Go pour un buffer pool de 128 Mo,
`AF-REQ-016` second critère), mais elle en supprime la conséquence la plus
coûteuse.

## Gate

`REQUIRED_HUMAN_APPROVAL` — modification de configuration d'un service de
production. Aucun outil gouverné de cette session n'écrit dans `/etc/systemd`.

## Action suivante, une fois celle-ci faite

Lancer `.github/workflows/ops-fix-segments-naira.yml` en mode `execute`,
`recalculer: false`, phrase `VALIDER CORRECTION SEGMENTS NAIRA` — corrige les 157
VL (`AF-REQ-011` / C7) et les performances aberrantes (`AF-REQ-012` / C3).
`recalculer: false` reste recommandé : le recalcul EUR/USD porte sur ~990 000
lignes, exactement le profil de charge qui provoque l'OOM.

## Stop conditions

Arrêter l'écriture si le HEAD API ou frontend change de manière concurrente, si
une autorité historique contredit le nouveau mécanisme, ou si une opération
exigerait suppression, force-push, réécriture d'historique ou destruction d'un
artefact `UNKNOWN`.
