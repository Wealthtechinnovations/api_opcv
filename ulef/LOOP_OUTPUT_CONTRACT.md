# Contrat de sortie et d'admission des boucles — E36

Un domaine LIV est un périmètre cohérent d'observation et de contrôle; il n'est pas nécessairement une composante du projet. Chaque boucle doit produire ou compléter les sorties et inventaires nécessaires à sa mission, réutiliser les identités existantes, définir modèles, collecteurs, comparateurs, relations, preuves, critères d'admission, reprise et automatisation. Ne pas déclarer opérationnelle une boucle dont les collecteurs, déclencheurs, actualisation et tests de bout en bout ne sont pas attestés; les sorties non applicables doivent être justifiées. INV-01 : quatre sources structurées des deux dépôts lues en direct, identité commune et rôles réciproques vérifiés, six tests de logique réussis dans le runtime JS; le périmètre global et l'automatisation restent partiels. Aucun changement dans les sources.

## Contrat commun

Chaque boucle possède : identité stable, mission, périmètre, entrées référencées et validées, processus et actions, sortie(s) versionnée(s), registre d'état, modèles de données, collecteurs si nécessaires, comparateurs si nécessaires, relations et consommateurs, preuves, divergences, déclencheurs, reprise, contrôles et critères de clôture. Produire ou compléter l'inventaire existant plutôt que le dupliquer. Les domaines sont des périmètres cohérents d'observation, pas des niveaux architecturaux fixes.

## Admission opérationnelle

Pour chaque sortie applicable : modèle et collecteur effectivement réalisés, couverture vérifiée, comparaison sur changements réels ou fixtures clairement qualifiées, références résolues, persistance et reprise vérifiées, contrôle d'erreur, absence d'effet sur les sources, déclenchement automatisé effectif et preuves de bout en bout. Les obligations non applicables sont justifiées. Une spécification ou un test unitaire vert ne suffit pas. Respecter ISOLATION_CONTRACT.md et ne pas altérer les autres automatisations.
