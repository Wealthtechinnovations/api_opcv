# Fondations et circulation documentaire — observations E38

Relecture des fondations AfricaFunds et cartographies existantes. 19 domaines d'autorité, 37 intakes sous 35 labels de programme, 37 entrées de couverture, 27 propositions non tâches, 25 exigences, 37 entrées queue, 7 services du gateway, 14 familles documentaires indexées. Ne pas additionner ces objets ni les considérer tous N1. 00_START_HERE prescrit 28 étapes; PROJECT_CHARTER exige documentation dans le même changement; LOOP_ENGINEERING PERSIST_STATE actualise uniquement les registres affectés et checkpoint SUIVI frontend, jamais un second suivi. Matrices d'intake, gap, couverture et promotion non autoritaires; task-queue seule autorité des tâches. Contrôles de dérive existants HEAD/Git/S2/doc/code/schema/API/consommateur/tâche. Audit Markdown déterministe (classification et marqueurs) ne garantit pas la vérité sémantique; générateur six projections ne couvre pas toute la chaîne documentaire. Architecture adaptateur et COMPONENTS index conceptuel; README frontend historique GitLab; ambiguity snapshot runtime vs Git à qualifier. Proposition non validée: cartographie documentaire avec parcours de lecture, dépendances de connaissance, propagation d'impacts, autorités et consommateurs, liens avec roadmap/architecture/exécution/suivi; vues constitution/travaux/pilotage, pas une taxonomie N1 imposée. LIV doit inventorier ces fondations et leurs liens, B02 qualifier les divergences et préparer les améliorations. Pas de modification des sources, pas de nouveau mécanisme de production.

## Versions observées

API `eae81c5db5a4d46f3741ab6fa2922017aa2215eb`, Frontend `1640ad2277cb913b53782ca0a428a0b9ca44e4a6`. Aucun changement des sources effectué. Lecture ciblée des fondations, non certification sémantique des 251 documents.

## Sources et relations déclarées

| Source | Rôle observé |
|---|---|
| PROJECT_CHARTER.md | Documentation dans le même changement, réutilisation, preuve |
| 00_START_HERE.md | Parcours obligatoire 28 étapes, reconstruction de contexte |
| GOVERNANCE.md / SOURCE_OF_TRUTH.md | Autorités, double HEAD, single writer, priorité de la mesure runtime |
| PROJECT_CONTEXT.md | Identité, périmètre, matrices et gate de promotion |
| DOCUMENT_INDEX.md / DOCUMENTATION_POLICY.md | Familles et rôles, pas de copie concurrente |
| DIRECTIVE_TRAVAIL.md | Analyse d'impact, mise à jour des documents appropriés |
| LOOP_ENGINEERING.md / LOOP_CONTRACT.md | DISCOVER, RECONCILE, SELECT, IMPLEMENT, VERIFY, PERSIST_STATE, reprise |
| .governance/knowledge/authority-map.json | 19 domaines d'autorité |
| .governance/matrices/africafunds-product-intake-matrix.json | 37 candidats, 35 labels distincts |
| .governance/matrices/africafunds-capability-coverage-matrix.json | 37 états déclarés |
| .governance/matrices/africafunds-task-promotion-plan.json | 27 propositions, non tâches |
| scripts/governance/audit_markdown.py | Inventaire/classification et marqueurs déterministes |
| services/gateway/serviceRegistry.js | 7 services et routes déclarés; runtime non vérifié |

## Parcours à cartographier dans LIV (proposition)

Entrée/reprise → vision et besoins → architecture et contrats → qualification des écarts et propositions → queue autoritaire → exécution et vérification → persistance sélective des registres, suivi global et prochaine action → reprise. Ce flux n'est pas une cascade rigide. Les liens exacts, leurs déclencheurs, leurs consommateurs, leurs preuves et leur couverture restent à recenser. Ne pas imposer un sens de propagation non démontré ni créer une nouvelle autorité. Les documents historiques ne sont pas à actualiser pour refléter le présent.

## Remise en ordre et priorités de contrôle (E39)

Le propriétaire demande de remettre de l'ordre avant d'avancer, de synthétiser les découvertes et d'organiser hiérarchiquement les fondations, connaissances, structures, processus, fonctionnement et mise à jour. Priorité de contrôle : SUIVI et points d'arrêt/reprise, architecture et son avancement, ROADMAP/BACKLOG, exigences/candidats/matrices, mécanismes de planification/développement/qualité/livraison/exploitation, puis coordination documentaire. Proposition de six familles de lecture, non N1 définitif : (1) fondations — identité, vision/objectifs, périmètre, produit/exigences, architecture; (2) planification — roadmap, programmes/chantiers, backlog, lots/tâches, dépendances/priorités; (3) réalisation/exploitation — développement, qualité/tests, livraison/déploiement, exploitation/maintenance; (4) suivi/continuité — suivi global, état courant, avancement, arrêt/reprise, historique/preuves; (5) connaissances/documentation — inventaires, registres/matrices, autorités, relations/parcours, actualisation/synchronisation; (6) gouvernance/fonctionnement — règles, processus/workflows, boucles/automatisations, agents/outils, contrôles/réconciliation. Vérifier pour chaque famille existence, rôle, autorité, entrées/sorties, règle d'actualisation, mécanisme réel, preuve d'exécution, divergences. Ne pas confondre existence du fichier et fonctionnement. ARCHITECTURE.md existe sous docs/03-architecture/ mais est un adaptateur, non une carte consolidée. Conserver les autorités existantes, ne pas inventer de flux automatique; préparer les corrections dans ULEF seulement. Réutiliser E38 et les inventaires; aucun nouveau fichier métier ni nouveau registre concurrent. Proposition d'organisation à qualifier avec les sources, priorité LIV inchangée.
