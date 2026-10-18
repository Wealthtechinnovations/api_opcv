# ITERATION_PROTOCOL — AfricaFunds

Ouvrir : réconcilier les deux HEAD, lire état/checkpoint, définir contrat de boucle. Exécuter : changement borné, tests, régression. Fermer : persister preuves, commits, remote state, production si touchée, handoff et next action. Si un gate échoue, état `BLOCKED`, jamais succès supposé.