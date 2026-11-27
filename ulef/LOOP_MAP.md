# Cartographie directrice des boucles ULEF

Identifiant : ULEF-CONTINUITY-20261127-01. Statut : PROPOSITION_A_VALIDER (E21).

Objectif initial : reconstruire les fondations d'AfricaFunds à partir de l'existant réel ; ULEF est le modèle progressif de génération autonome. B01 reste le seul chantier de conception actif, strictement N1 ; la cartographie n'autorise ni N2 ni développement métier.

## Boucles proposées

| ID | Boucle | Niveau | Entrée | Sortie | Condition de passage |
|---|---|---|---|---|---|
| B01 | Découverte et inventaire | N1 initialement, puis récursive | Sources réelles autorisées | Observations, identités, classes, relations et preuves N1 | File admissible traitée, couverture et inconnues documentées |
| B02 | Réconciliation et reconstruction | N1 à N… | Registre et preuves | Socle cohérent, contradictions et état réel | Identités rapprochées et conflits résolus ou explicités |
| B03 | Définition des objectifs et exigences | N0 à N… | Objectif parent et socle | Exigences et critères d'acceptation | Exigences attribuées, vérifiables et non contradictoires |
| B04 | Architecture et décomposition | N1 → N2 → N… | Composante qualifiée et exigences | Enfants, interfaces et dépendances | Décomposition suffisante, sans doublons; réappliquer B01 à la profondeur autorisée |
| B05 | Analyse des écarts | N1 à N… | Existant et cible | Écarts et actions de réutilisation, correction ou création | Écarts justifiés et traçables |
| B06 | Génération et organisation du travail | N1 à N… | Écarts, architecture, critères | Unités de travail ordonnées et dépendances | Unités exécutables, critères et périmètre définis |
| B07 | Orchestration et attribution | Tous niveaux utiles | Unités admissibles, ressources | Attribution, verrous, ressources et checkpoints | Permissions et absence de collision vérifiées |
| B08 | Réalisation et génération | Unités de réalisation | Unité attribuée et critères | Artefact, code, correction ou configuration | Résultat persistant, prêt à vérifier |
| B09 | Vérification et correction | Tous niveaux | Résultats et critères | Preuves de tests et corrections | Critères satisfaits ou blocage explicite; retour B08 si nécessaire |
| B10 | Intégration et certification | N… → N0 | Éléments vérifiés | Assemblage et preuves de cohérence | Contrats, dépendances et non-régression vérifiés |
| B11 | Déploiement et exploitation | Composantes déployables | Artefact certifié et autorisations | Déploiement et état runtime observé | Gates de déploiement et vérification runtime satisfaits |
| B12 | Maintenance et évolution | Tous niveaux | Observations runtime et besoins | Corrections, améliorations et nouvelles entrées | Delta enregistré et réactivation de la boucle appropriée |

## Fonctionnement commun

Reprendre le checkpoint → observer les entrées et versions → sélectionner une unité admissible → vérifier autorisations et dépendances → exécuter → consigner et vérifier la persistance → qualifier le résultat → poursuivre, réessayer après correction ou signaler un blocage. Les niveaux sont des profondeurs de décomposition et non des étapes temporelles. Chaque boucle peut être réutilisée sur un élément autorisé ; la descente est récursive, l'intégration remonte vers le parent, la coordination est transversale. Ne pas imposer une profondeur fixe. B01 et B02 alimentent la reconstruction ; B03 à B06 construisent le plan ; B07 à B10 exécutent et vérifient ; B11 et B12 ne sont admissibles qu'après gates et autorisations. B12 relance la boucle pertinente en cas de changement. Continuité, sécurité, gouvernance, preuves, non-régression et single writer s'appliquent partout. Aucun moteur exécutable ni déploiement n'est attesté.
