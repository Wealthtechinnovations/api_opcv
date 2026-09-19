# POSTMORTEM_TEMPLATE — AfricaFunds

## Identité
- Incident ID :
- Type :
- Sévérité :
- Statut :
- Première détection :
- Dernière occurrence :
- Récurrence / signature :

## Impact
Services, utilisateurs, durée, données financières, intégrité, disponibilité et blast radius.

## Détection
Signal exact, source, qui/quoi l'a détecté et éventuel angle mort de monitoring.

## Chronologie
Uniquement faits horodatés et vérifiés.

## Mécanisme de panne
- Statut : PROVEN / PROBABLE / UNKNOWN
- Énoncé :
- Preuves :

## Cause racine
- Statut : PROVEN / PROBABLE / UNKNOWN
- Énoncé :
- Preuves :
- Si non prouvée : pourquoi et quelle tâche doit la prouver ?

## Facteurs contributifs
Séparer explicitement root cause, facteur aggravant, défaut de résilience et défaut d'observabilité.

## Containment / recovery
Action minimale, résultat, risques, preuves.

## Correctifs
Pour chaque correctif : task ID, commit/fichiers, tests, rollback, gate humain/externe, preuve production.

## Prévention / récurrence
Mesures qui empêchent ou détectent plus tôt la même signature.

## Vérification de fermeture
Critères mesurés, timestamp, références CI/runtime.

## Risques résiduels
Aucun risque ne doit disparaître parce que l'incident est ancien.

Aucune cause ou réussite ne doit être inventée.
