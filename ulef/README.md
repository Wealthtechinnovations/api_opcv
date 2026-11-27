# Universal Loop Engineering Factory — ULEF

Identifiant canonique permanent : `ULEF-CONTINUITY-20261127-01`.

Cette branche héberge exclusivement les travaux ULEF sous `ulef/`. ULEF est une idée autonome ; AfricaFunds est un cas d'observation, pas son parent. Les branches applicatives des deux dépôts restent les sources de lecture du cas d'étude. Aucune fusion vers elles, aucun déploiement, aucune écriture métier.

## Reprise

Lire PROJECT_IDENTITY.json, MAQUETTE_MERE.md, LOOP_ENGINEERING.md, DOCUMENT_INDEX.json, history/CONVERSATION_HISTORY.md et discovery/DISCOVERY_STATE.json. Enrichir les documents existants par deltas datés, avec preuves. Vérifier le HEAD de la branche ULEF avant écriture. Les fichiers hérités du commit de base ne deviennent pas des documents ULEF.

Le dépôt hôte est public : ne publier ici que les documents techniques autorisés et assainis. Les échanges privés et secrets restent hors Git. Aucun archivage automatique de chaque message ni exécuteur permanent attesté.

## Isolation impérative (E31)

Directive explicite du propriétaire : AfricaFunds et toutes ses ressources d'origine sont protégés en lecture seule. ULEF récupère les informations, reconstruit et recrée ses propres fichiers, boucles et mécanismes indépendants exclusivement sous ulef/ dans la branche ULEF-CONTINUITY-20261127-01. Ne modifier aucun fichier hérité du dépôt hôte, y compris sur la branche ULEF; ne modifier aucune branche applicative, registre opérationnel, workflow, paramètre GitHub, configuration MCP, serveur, base de données, service, cron ou production. Pas de fusion, PR vers l'existant, déploiement ou exécution d'un effet sur les sources; essais isolés uniquement sur données admissibles et fixtures. Les résultats dérivés référencent les sources et versions, sans remplacer leurs autorités. Les nouveaux fichiers et boucles peuvent être créés et les artefacts ULEF déjà créés enrichis dans ce seul périmètre. Aucun secret ni contenu privé dans Git public. Tout élargissement exige une décision explicite ultérieure. Conserver progressivement chaque décision et résultat significatif dans la paire historique existante et les artefacts indexés; ne pas prétendre à un archivage automatique ou verbatim exhaustif. La règle s'applique à ce chantier ULEF et ne modifie pas les mandats des autres automatisations.

Voir [ISOLATION_CONTRACT.md](ISOLATION_CONTRACT.md).
