# B01-INVENTORY — boucle permanente d'inventaire

Directive utilisateur : créer B01-INVENTORY, boucle quotidienne d'inventaire incrémentale, avec registre visible et sortie consommable. Reprendre le dernier inventaire valide, observer les versions, détecter les écarts, actualiser les résultats dérivés et conserver les preuves. Premier passage B01-INVENTORY-0001 : comparaison intégrale des 8163 entrées enregistrées aux deux arbres Git actuels, zéro ajout/modification/disparition, huit tests du comparateur réussis. OK borné aux métadonnées Git. Planification quotidienne refusée par quota 5/5, aucune autre automatisation modifiée. Module de comparaison créé; orchestration automatique distante non attestée. E31/E32 restent applicables; aucun effet sur les sources.

## Contrat d'exécution

1. Lire le registre, l'index, les lots et la dernière preuve; vérifier les identités, versions et compteurs.
2. Observer les HEAD et tree SHA des deux branches canoniques en lecture seule. Si arbre inchangé, réutiliser les lots validés et contrôler leurs références. Si arbre changé, obtenir un arbre complet non tronqué et comparer chemins/types/modes/SHA.
3. Conserver ajouts, modifications, suppressions historiques. Les changements de contenu ouvrent une requalification sémantique; les renommages restent ajout/suppression sauf preuve. Ne jamais supprimer des fichiers des sources.
4. Produire index et lots actualisés, reçu immuable daté, registre JSON et vue Markdown. Garder les anciennes versions dans Git. Si erreur, préserver dernière sortie valide, marquer PARTIAL/ERROR et ne pas avancer le checkpoint valide.
5. Reobserver les deux HEAD, vérifier HEAD ULEF attendu, écrire exclusivement sous ulef/, publier sans force puis relire. En cas de conflit, reprendre. Aucun effet sur les sources.
6. Consommateurs : B01 découverte sémantique, B02 et agents de reprise. Vérifier la fraîcheur avant usage. Un contrôle ancien n'est pas live. Si un jour est manqué, marquer contrôle dû et reprendre.

Cadence voulue : quotidienne. Déclencheur planifié non actif (quota). Mode manuel utilisable. Le comparateur pur calcule les écarts; la collecte GitHub, la persistance CAS et le déclenchement restent orchestrés par le connecteur/agent, pas par ce module seul.
