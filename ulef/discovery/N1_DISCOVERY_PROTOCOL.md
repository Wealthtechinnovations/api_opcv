# B01 — Protocole de découverte N1

Continuité : ULEF-CONTINUITY-20261127-01. Statut : spécification proposée E22 ; non exécutée comme moteur autonome.

## Objectif

Précision proposée pour B01 : découvrir toutes les composantes N1 réelles de l'écosystème AfricaFunds, noter où elles existent, identifier, classifier et enregistrer. D'abord inventorier les chemins, noms, types, versions, outils et ressources sans présumer du contenu ; lire ensuite les manifestes, points d'entrée et extraits admissibles nécessaires pour établir la responsabilité et le rattachement, sans lancer une décomposition N2 ni une analyse exhaustive métier. Conserver séparément observations brutes, candidats, composantes qualifiées et inconnues. Déduplication manifeste en B01 ; réconciliation approfondie en B02. Tout conserver dans la branche ULEF, sources observées en lecture seule. La boucle ne peut déclarer une convergence que sur preuves et périmètre stable; les limites d'accès demeurent explicites. Le protocole est une spécification, pas un moteur déjà exécuté.

## Entrée

Projet AfricaFunds, ses deux dépôts canoniques et les sources associées autorisées. Vérifier leurs identités et versions à chaque reprise. Ne pas prendre les conversations pour preuves techniques.

## Procédure

| Étape | Action | Sortie |
|---|---|---|
| B01.01 | Localiser les sources | Liste des sources accessibles et rattachements |
| B01.02 | Parcourir récursivement | Inventaire brut des ressources |
| B01.03 | Enregistrer les observations | Registre avec identité, chemin, version, provenance |
| B01.04 | Identifier la nature | Type et rôle observables; inconnues explicites |
| B01.05 | Classifier et regrouper | Familles et composantes candidates |
| B01.06 | Rapprocher les identités | Déduplication manifeste, conflits préservés pour B02 |
| B01.07 | Qualifier les composantes N1 | Registre de grandes responsabilités et rattachements prouvés |
| B01.08 | Vérifier la couverture | Sources parcourues, restantes, inaccessibles |
| B01.09 | Persister le checkpoint | Versions, curseurs, résultats et prochaine action |
| B01.10 | Recommencer | Nouvelle source, version changée ou convergence vérifiée |

## Sources initiales extensibles

Arborescences Git des deux dépôts, GitHub (dépôts, branches, workflows, intégrations, outils accessibles), catalogue MCP (outils, ressources, connexions), infrastructures et runtime autorisés, configurations, documents, services et dépendances rattachés. Les nouveaux liens alimentent la file; une ressource commune n'est pas nécessairement rattachée au projet. Ne pas lire ni publier les valeurs secrètes ou données privées.

## Trois registres logiques (pas trois nouvelles autorités)

1. Observations brutes : source, identifiant, nature, emplacement, version, horodatage, statut de lecture et preuve. 2. Candidats : regroupements, rôle présumé, références, alias, questions. 3. Composantes N1 qualifiées : identité stable, responsabilité principale, relation directe ou dépendance partagée, preuves et état. Utiliser COMPONENT_REGISTRY.json et DISCOVERY_STATE.json existants et les artefacts d'inventaire dérivés; ne pas créer de registre concurrent. Les noms et extensions sont des indices, pas des preuves de fonction.

## Convergence

File des sources admissibles vide, inventaires complets dans leur périmètre, deux passages réels stables sans nouveau N1, preuves et limites explicites. Si des surfaces restent inaccessibles, état PARTIAL ou convergence du seul périmètre observable, jamais exhaustivité absolue. Aucune construction N2, aucune modification métier ou déploiement. La sortie N1 est l'entrée de B02 lorsque les critères de passage sont remplis.

## Conservation obligatoire des résultats (E23)

Exigence confirmée par le propriétaire : conserver et organiser tous les résultats de B01 de façon cumulative, persistante, traçable et réutilisable. Chaque passage doit produire un delta enregistré et vérifié avant d'être considéré terminé. Préserver observations brutes, candidats, composantes qualifiées, sources et versions, relations, preuves, classifications, divergences, limites d'accès et checkpoints. Aucun résultat pertinent ne doit rester uniquement dans le chat. Les changements et déduplications conservent les observations historiques et les alias; pas d'écrasement silencieux. Le registre de composantes et l'état de découverte existants restent les points de rattachement; les inventaires détaillés dérivés sont indexés et référencés, sans créer d'autorité concurrente. Le dépôt hôte étant public, conserver les données confidentielles et secrets hors Git et n'y référencer que des métadonnées autorisées. La sortie structurée B01 doit être directement exploitable par B02 sans refaire la collecte. Ceci est une exigence de conception; l'implémentation et la migration complète des résultats existants restent à réaliser.

### Règles de persistance

- Une observation possède une identité stable, une source, une version, une date et un état de qualification. Les preuves sont référencées par chemin, SHA ou identifiant de source, selon le cas.
- Les inventaires de fichiers, d'outils, de ressources et de relations sont conservés comme artefacts dérivés indexés; les identités N1 sont rattachées au registre existant COMPONENT_REGISTRY.json.
- DISCOVERY_STATE.json conserve la file, les curseurs, les versions observées, les compteurs, les inconnues, les blocages et le prochain travail.
- DOCUMENT_INDEX.json indexe les nouveaux artefacts lorsqu'ils sont effectivement créés. Ne pas déclarer un artefact présent avant sa persistance et sa relecture.
- À chaque lot : enregistrer les résultats et le checkpoint ensemble, vérifier les références et la couverture, puis passer au lot suivant. En cas d'échec de persistance, conserver le statut incomplet et reprendre le lot.
- Pas de fusion vers les branches applicatives, pas de déploiement, pas de publication de données confidentielles, pas de N2.

## Finalité de B01 : préparer le squelette global (E24)

B01 constitue la matière première vérifiable du squelette N1 d'AfricaFunds. Le registre de découverte alimente la reconstruction et la consolidation B02. La présence de structures existantes doit être recherchée et conservée, non niée a priori. La boucle reste au N1 et n'engage aucune reconstruction du code métier.

## Périmètre de découverte élargi aux plans existants (E26)

Le squelette global AfricaFunds ne se limite pas à l'architecture technique. B01 doit découvrir aussi l'identité, la vision, les objectifs, les grands axes, programmes, chantiers, sous-chantiers, capacités existantes et prévues, exigences et travaux. Distinguer vues de composition produit/technique, fonctionnelle et programmatique, et ressources habilitantes; relier les vues par identifiants, sans confondre programme, tâche, composante logicielle et outil. Un grand axe ou programme peut être N1 dans la vue programmatique, uniquement si son rattachement direct est établi; un sous-chantier est enfant du chantier concerné, pas automatiquement N1. La découverte des sources peut être profonde mais la qualification du squelette reste N1. Les structures et IDs existants sont conservés. Observations directes : la matrice produit contient 37 intakes candidats et la queue canonique 37 entrées de travail au HEAD observé, non additionnables comme total de N1. Roadmap frontend et contexte API attestent des ambitions et plans documentés, pas de leur exécution. La taxonomie multi-vues est une proposition à stabiliser; aucun nouveau programme ni tâche métier créé.

Voir PROJECT_SCOPE_OBSERVATIONS.json pour les observations source, distinctes du registre N1.

## Ordre de consultation des sources (E27)

L'objectif immédiat est la cartographie et la squelettisation d'AfricaFunds, existant et cible, non la création d'une roadmap nouvelle ni une liste technique isolée. Proposition d'ordre de lecture B01 : (1) identifier le projet N0 et ses objectifs dans les documents d'identité, contexte, README et vision; (2) découvrir la cible et l'ambition documentées dans ROADMAP, spécifications, exigences et programmes; (3) découvrir les structures et composantes déclarées dans les documents d'architecture; (4) relever les réalisations et travaux prévus, en cours ou déclarés terminés dans SUIVI, TASKS, TODO, queue et historiques; (5) corroborer l'existant avec arbres Git, code, manifestes, outils, infrastructures et preuves runtime autorisées; (6) enregistrer les observations, candidats N1, rattachements, états documentés versus observés, écarts et inconnues. L'ordre est une priorité de découverte, pas une cascade rigide : les sources se recoupent, peuvent être lues en parallèle et rouvrent les questions. Roadmap, SUIVI et architecture sont des sources, pas le squelette final. Le squelette N1 représente les grandes composantes fonctionnelles et structurelles de l'existant et de la cible, liées aux objectifs et aux travaux, sans confondre tâches, outils et composants. B02 réconciliera et consolidera le squelette, aucune descente N2 ni création de chantier métier à ce stade. Ne pas traiter une déclaration DONE comme preuve de production. Proposition d'organisation à valider.

## État des lieux et non-duplication (E33)

Le propriétaire précise que ULEF doit comprendre l'existant réel d'AfricaFunds, relever les problèmes, préparer et tester les ajustements dans son périmètre indépendant, puis proposer une directive et des patches pour intégration ultérieure uniquement sur autorisation explicite. Ne pas recopier tous les documents ou le projet dans ULEF: conserver références immuables, observations dérivées, connaissances, écarts, propositions et preuves. B01 commence par l'état des lieux global, réutilise les inventaires et autorités déjà présents, puis inspecte le contenu utile, sans modifier les sources. B02 réconcilie et qualifie les écarts; les corrections et tests restent isolés. Inventaire Git metadata complet pour les deux arbres observés, contenu des fichiers non copié. Aucun patch applicatif appliqué. E31 et E32 restent applicables.
