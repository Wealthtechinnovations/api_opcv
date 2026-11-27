# LIV — routes et contrat de consommation (E35)

Identifiant stable B01-INVENTORY. WF-LIV-001 est un workflow logique, non un workflow GitHub déployé. ACT-LIV-RECONCILE est l'action logique, PROC-LIV-001 le processus. Aucun déclencheur actif.

## Processus

Reprendre INVENTORY_STATUS.json et INVENTORY_CATALOG.json → vérifier identité, fraîcheur et dernière preuve → observer version/digest de chaque source autorisée → comparer au dernier état valide et à l'autorité applicable → détecter delta ou absence de preuve → actualiser seulement les sorties dérivées concernées → conserver différences, références, statut et reçu → vérifier HEAD des sources et HEAD ULEF attendu → publier sous ulef/ uniquement → relire. En cas d'erreur, conserver dernière sortie valide, marquer PARTIAL/ERROR/STALE; ne pas déclarer OK. La fraîcheur doit être calculée à la lecture par rapport au dernier contrôle et à la cadence, jamais déduite d'un label persistant.

## Routes de collecte et comparaison

| Domaine | Source | Référence de comparaison | Contrôles | Couverture |
|---|---|---|---|---|
| INV-01 — Identité et périmètre projet | PROJECT_CONTEXT.md; .governance/project.json; repository.json | Identité canonique et rattachements versionnés | Identifiants, rôles, dépôts associés, conflits | PARTIAL |
| INV-02 — Dépôts et références Git | GitHub repo/branches; deux HEAD canoniques; branches autorisées | Derniers HEAD, IDs dépôt et politique de branches | Existence, identité, branche, accès, HEAD, branches ajoutées/supprimées | PARTIAL |
| INV-03 — Arborescences et fichiers | GitHub Git trees récursifs exact SHA | Dernier inventaire valide par dépôt | Chemins, types, modes, SHA, taille, répertoires, ajouts/modifications/disparitions | VERIFIED |
| INV-04 — Documents Markdown | Arbres Git filtrés .md; registre Markdown central API | Inventaire ULEF précédent et registre central au HEAD API | Couverture, doublons, empreintes, orphelins; rôles et autorités déclarés; sémantique à qualifier | VERIFIED_METADATA |
| INV-05 — Registres structurés et autorités | JSON/YAML/SQL de gouvernance; authority-map; index; schemas | Dernière liste versionnée et schémas/contrats déclarés | Identité, rôle, schéma, références, empreintes, autorités concurrentes | PARTIAL |
| INV-06 — Code et interfaces/routes | Manifestes, imports, points d'entrée, routes API, pages frontend, services | Dernier catalogue d'interfaces et contrats versionnés | Modules, endpoints, méthodes, handlers, liens front/API, routes ajoutées ou mortes; pas de requête à effet | PARTIAL |
| INV-07 — Données et stockage | Modèles ORM, migrations, schémas, sources data; observations runtime autorisées | Schéma attendu versionné vs schéma observé et références de sources | Tables, relations, migrations, sources, volumes agrégés, bindings; aucun accès aux secrets | PENDING |
| INV-08 — Workflows et exécutions GitHub | Fichiers .github/workflows et métadonnées Actions | Workflow YAML versionné, dernier état d'activation et reçu observé | Déclencheurs, jobs, actions, permissions déclarées, runs, statut; jamais déclencher | PARTIAL |
| INV-09 — Outils MCP, fonctions et ressources | MCP ping puis reconcile governed context puis inventory; outils exposés | Catalogue/version/digest précédents et bindings projet attestés | Outils, signatures, ressources, disponibilité, modes d'accès, lien projet; pas de commande à effet | PARTIAL |
| INV-10 — Serveurs et environnements | S1/S2, ressources autorisées, git_status_project_s2, mesures read-only | Dernier état mesuré, configuration déclarée et HEAD canoniques | Hôtes, environnements, déploiements, capacité, santé, services, ports déclarés; secrets exclus | PARTIAL |
| INV-11 — Automatisations, agents, workers et crons | Registres agents/automations, workflows, scripts, observations runtime autorisées | Derniers identifiants, cadence, état et reçus | Déclencheurs, liaisons, dernière exécution, activation, propriétaire, blocage | PARTIAL |
| INV-12 — Programmes, exigences et travaux | ROADMAP, SUIVI, intake matrix, requirements, task-queue | Derniers IDs et états déclarés, preuves de clôture | Axes, programmes, chantiers, tâches, dépendances, états; ne pas certifier DONE par déclaration | PARTIAL |
| INV-13 — Dépendances et intégrations externes | Manifestes/lockfiles, contrats, liens et bindings projet | Dernière liste de dépendances et versions déclarées | Bibliothèques, fournisseurs, APIs, contrats, disponibilité si lecture autorisée | PENDING |
| INV-14 — Tests, qualité et preuves | Tests, configs CI, rapports, evidence registry, check runs | Dernier catalogue de tests et preuves liées à une version | Suites, couverture déclarée, résultats, dates, régression; jamais assimiler existence à exécution | PARTIAL |
| INV-15 — Sécurité et accès (métadonnées) | Politiques, rulesets, permissions, gates, références de secrets sans valeurs | Dernier état de politique et preuves non sensibles | Identités et périmètres, dérives, gates, politiques; aucune valeur secrète | PENDING |
| INV-16 — Relations et chemins de navigation | Références entre toutes les sources; liens document/code/runtime/projet | Dernière carte des relations résolues et référencées | Identifiants, source→cible, relation, preuve; références cassées/orphelines | PENDING |

## Consommation

L'entrée publique du chantier est INVENTORY_STATUS.md, sa vue machine INVENTORY_STATUS.json. Le catalogue décrit les routes et sorties. INV-03 utilise TREE_INVENTORY_INDEX.json et ses lots; INV-04 utilise DOCUMENT_INVENTORY_INDEX.json qui lie chaque document réel à son entrée du registre central, avec empreinte et autorité déclarée. Les agents vérifient la version et la couverture du domaine requis, puis consomment les références précises sans refaire tout l'inventaire. Les changements alimentent une file de requalification existante, pas une queue AfricaFunds. Un lien non résolu reste UNKNOWN. Toute source hors Git et tout domaine non vérifié restent explicitement partiels. Pas de correction sur les sources.
