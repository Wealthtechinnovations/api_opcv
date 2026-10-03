# LOOP_CONTRACT — AfricaFunds

Toute boucle doit définir avant écriture :

- `TRIGGER` — raison vérifiable ;
- `SCOPE` — lot borné ;
- `ACTION` — plus petit changement compatible ;
- `BUDGET` — fichiers, dépôts, services, droits et interdictions ;
- `STOP` — conditions objectives de blocage/fin ;
- `REPORT` — preuves, état final et une seule prochaine action.

Pour AfricaFunds, une boucle d’écriture vérifie toujours les deux HEAD canoniques. Si l’un change, `WRITE_GATE=CLOSED` jusqu’à réconciliation.

Le contrat complète `LOOP_ENGINEERING.md` et ne remplace aucune autorité historique.