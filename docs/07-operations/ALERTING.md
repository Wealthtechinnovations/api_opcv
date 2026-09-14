# ALERTING — AfricaFunds

Une alerte n'est `ACTIVE` que si son mécanisme et sa destination sont prouvés. Sinon elle reste `TARGET_NOT_ENFORCED`.

Toute alerte doit définir : signal, source, seuil, sévérité, destinataire, anti-bruit, incident type, runbook, preuve de test et comportement en cas de mesure impossible.

## Règle fail-closed de mesure

Un contrôle qui **n'a pas pu mesurer** la production doit être bruyant. Il est interdit de transformer une erreur de connexion/parsing en état sain.

## Récurrence

La même signature détectée au moins deux fois doit ouvrir/mettre à jour l'incident canonique et exiger une action RCA dans la task queue.

## Données financières

Distinguer obligatoirement : retard de source externe, échec import, anomalie métier, anomalie de calcul et indisponibilité de la mesure.

## Anti-faux-vert

Les health checks critiques doivent tester les dépendances réellement nécessaires au produit, pas seulement une page statique. Pour AfricaFunds, l'autorité production doit au minimum pouvoir distinguer frontend vivant, API vivante et DB mesurable.
