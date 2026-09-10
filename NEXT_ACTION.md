# NEXT_ACTION — AfricaFunds API

> Une seule prochaine action exécutable.

## Action courante

Poursuivre l’intégration Regulatory Plus en réconciliant les nouveaux registres avec les autorités historiques du dépôt, puis vérifier le nouvel arbre Git et les contrôles GitHub avant toute déclaration de clôture.

## Stop conditions

Arrêter l’écriture si le HEAD API ou frontend change de manière concurrente, si une autorité historique contredit le nouveau mécanisme, ou si une opération exigerait suppression, force-push, réécriture d’historique ou destruction d’un artefact `UNKNOWN`.