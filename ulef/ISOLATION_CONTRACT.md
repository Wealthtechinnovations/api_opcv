# Contrat d'isolation ULEF — E31

Statut : directive explicite du propriétaire, applicable.

Directive explicite du propriétaire : AfricaFunds et toutes ses ressources d'origine sont protégés en lecture seule. ULEF récupère les informations, reconstruit et recrée ses propres fichiers, boucles et mécanismes indépendants exclusivement sous ulef/ dans la branche ULEF-CONTINUITY-20261127-01. Ne modifier aucun fichier hérité du dépôt hôte, y compris sur la branche ULEF; ne modifier aucune branche applicative, registre opérationnel, workflow, paramètre GitHub, configuration MCP, serveur, base de données, service, cron ou production. Pas de fusion, PR vers l'existant, déploiement ou exécution d'un effet sur les sources; essais isolés uniquement sur données admissibles et fixtures. Les résultats dérivés référencent les sources et versions, sans remplacer leurs autorités. Les nouveaux fichiers et boucles peuvent être créés et les artefacts ULEF déjà créés enrichis dans ce seul périmètre. Aucun secret ni contenu privé dans Git public. Tout élargissement exige une décision explicite ultérieure. Conserver progressivement chaque décision et résultat significatif dans la paire historique existante et les artefacts indexés; ne pas prétendre à un archivage automatique ou verbatim exhaustif. La règle s'applique à ce chantier ULEF et ne modifie pas les mandats des autres automatisations.

## Vérification minimale avant et après écriture

- Vérifier l'identité de la branche et le HEAD attendu.
- Refuser tout chemin de modification hors du préfixe ulef/.
- Observer les HEAD canoniques des deux dépôts sans les modifier; une évolution concurrente externe doit être signalée et ne doit pas être écrasée.
- Publier exclusivement le commit ULEF sans force, vérifier son HEAD et relire les artefacts concernés.
- Ne pas déclencher des workflows applicatifs ou des effets runtime. Une réaction automatique GitHub à un événement de branche ne constitue pas un déploiement voulu; la gouvernance de branche reste à régulariser séparément si autorisée.

## Limite

Ce contrat documentaire n'est pas encore un garde technique exécuté automatiquement. Les tests de non-écriture et d'isolation restent à construire dans ULEF.

## Lien de finalité sans élargissement des permissions (E32)

Clarification du propriétaire : ULEF est directement lié à AfricaFunds par sa finalité d'amélioration, et indépendant uniquement dans son périmètre de conception, de stockage, de programmation et d'expérimentation. AfricaFunds CS-AFRICAFUNDS-001 est le projet de référence et bénéficiaire prioritaire, pas un simple exemple interchangeable. ULEF conserve son identifiant ULEF-CONTINUITY-20261127-01 et sa branche dédiée; il ne constitue ni un deuxième AfricaFunds ni une autorité de production concurrente. À partir de l'existant réel, reconstruire le squelette, structurer les connaissances, créer les fichiers, boucles et mécanismes propres à ULEF, tester et évaluer les améliorations. Préserver les rattachements, identités existantes, références de source, versions et historique. Toute intégration future reste soumise à autorisation explicite. E31 reste intégralement applicable : aucun changement sur les branches applicatives, fichiers hérités, MCP, serveurs, données ou workflows existants. Écrire exclusivement sous ulef/. La généralisation éventuelle ne doit pas détourner du besoin AfricaFunds. Aucun nouveau projet, branche ou identifiant de continuité.
