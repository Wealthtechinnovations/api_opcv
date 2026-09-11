# NEXT_ACTION — AfricaFunds API

> Une seule prochaine action exécutable, sélectionnée par directive explicite du propriétaire le 2026-09-11.

## Action courante

Terminer `AF-TASK-004` : imposer et vérifier la reconstruction de contexte à chaque nouvelle session et la découverte croisée des deux repositories depuis l'un ou l'autre, puis brancher cette règle sur les validateurs CI.

Critères immédiats :

```text
CONTEXT_RECONSTRUCTION_BEFORE_WORK = REQUIRED
CROSS_REPO_DISCOVERY = REQUIRED
DEFAULT_BRANCH == CANONICAL_WORK_BRANCH
READ_BOTH_HEADS = REQUIRED
WORK_GATE = CLOSED UNTIL CONTEXT_RECONSTRUCTION_PASS
```

La règle doit être portée par les autorités existantes (`00_START_HERE.md`, `GOVERNANCE.md`, `AGENTS.md`, `LOOP_ENGINEERING.md`) et par les contrats machine-readable existants ; aucun nouveau système parallèle.

## Ensuite

`AF-TASK-005` : certification dynamique path-by-path de **tous** les `.md` présents au HEAD réel des deux repositories, avec preuve `TOTAL_MD_DISCOVERED == TOTAL_MD_CERTIFIED`.

## Opération production différée conservée

L'ancien `NEXT_ACTION` concernant `mariadb.service Restart=on-failure` n'est pas supprimé de la connaissance projet : il reste une opération séparée nécessitant `REQUIRED_HUMAN_APPROVAL`. La directive actuelle du propriétaire priorise le programme de certification de gouvernance ; aucune mutation `/etc/systemd` n'est effectuée dans ce lot.

## Stop conditions

Arrêter l'écriture si un HEAD change de manière concurrente, si une autorité historique contredit le changement sans résolution, ou si une action exigerait force-push, réécriture d'historique, suppression non autorisée ou destruction d'un artefact `UNKNOWN`.
