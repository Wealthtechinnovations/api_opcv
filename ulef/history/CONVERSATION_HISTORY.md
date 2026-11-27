# Journal cumulatif ULEF

Identifiant : ULEF-CONTINUITY-20261127-01. Consolidation technique, non transcription verbatim.

## 2026-11-27 — Fondation

- Définition de l'usine universelle à point d'entrée unique et décomposition récursive.
- Frontend/Backend retenus initialement pour le produit web ; extension explicite du périmètre N1 à l'écosystème complet (GitHub, MCP, infrastructure, automatisations, etc.).
- Découverte réelle avant création ; classification et enregistrement des composants ; aucune conversation utilisée comme preuve technique.
- Cas AfricaFunds : inventaires initiaux des deux dépôts et du catalogue MCP, non certifiés exhaustifs. Les résultats sont distincts des autorités AfricaFunds.
- Décision : identité indépendante ULEF ; stockage séparé de l'historique et des registres métier AfricaFunds.
- Décision finale : héberger ULEF sur une branche dédiée du dépôt API ou frontend, sans intégrer ses travaux aux branches canoniques. Dépôt API choisi comme hôte ; chemin ulef/.
- Politique historique AfricaFunds : nouvelle branche signalée comme inattendue par le contrôle branch-policy tant que la baseline canonique n'est pas adaptée par une opération gouvernée distincte. L'exception de création est demandée explicitement par le propriétaire ; aucune modification de cette baseline n'est effectuée ici.

## Reprise

Compléter le journal et l'index à chaque intervention. Conserver propositions, décisions, observations et réalisations distinctes. Ne jamais renommer l'identifiant ni supprimer l'historique.

## 2026-11-27 — R20261127-01 : reconstruction chronologique approfondie

**Objectif initial confirmé par le propriétaire :** reconstruire les bases d'AfricaFunds à partir de l'existant réel des deux dépôts et de l'écosystème associé, sans reconstruire le produit depuis zéro. ULEF est le moyen d'ingénierie progressif ; son identité documentaire reste indépendante. La généralisation est une trajectoire ultérieure.

**Couverture :** restitution sémantique de la conversation disponible ; les extraits utilisateur ci-dessous sont accessibles dans le contexte ou les résumés des tours antérieurs. Aucun verbatim intégral ni URL/ID de conversation n'a pu être obtenu. Les lacunes sont conservées explicitement. Les anciennes décisions restent historisées ; les corrections ultérieures prévalent.

### E01 — Fondement antérieur confirmé

Statut : `RETROSPECTIVEMENT_CONFIRME_PAR_UTILISATEUR`.

L'objectif initial est de partir d'AfricaFunds et de reconstruire les bases existantes, sans réécrire le logiciel depuis zéro. Constituer un socle informationnel, retrouver fichiers et contenus, les identifier, classer, relier et tracer. Le tout premier message antérieur n'est pas disponible mot pour mot.

### E02 — Maquette d'usine en looping

Statut : `CONCEPTION`.

> Régistre une maquette pour créer une usine en looping. C'est tout un module de départ jusqu'à la fin. Je pense que c'est les techniques de projet, création de projet et logiciel informatique. Tu as ça quelque part ?

Créer une maquette couvrant le cycle logiciel de départ à la fin. Proposition ULEF, SDLC, WBS, ingénierie des exigences, Agile/Kanban, DevSecOps, CI/CD et PDCA comme méthodes complémentaires. Ne pas les considérer comme des implémentations déjà vérifiées.

### E03 — Entrée et sortie de l'étape 1

Statut : `CONCEPTION`.

> Donc déjà Maquette mère de l'usine logicielle Nom proposé : Étape 1 : Point d'entrée et on a quoi en sortie ?

Un seul objectif racine. Sortie : identité, périmètre, finalité, informations disponibles et manquantes, squelette initial. La sortie devient l'entrée suivante. Les inconnues restent inconnues.

### E04 — Architecture récursive

Statut : `CONCEPTION`.

> On va faire à plusieurs niveaux là, tu comprends ? Donc quand tu rentres dans le projet, premier niveau, t'as plusieurs éléments au premier niveau. Et chaque élément suit un processus de deuxième niveau

Chaque composante d'un niveau déclenche son propre processus vers le niveau inférieur ; la profondeur n'est pas imposée. Remontée des résultats, coordination transversale et assemblage. N0 projet ; N1 grandes composantes ; N2 modules ; N3 sous-modules ; N4 fonctionnalités ; N5 composants élémentaires ; N6 unités de réalisation : exemple provisoire, pas taxonomie figée.

### E05 — Information minimale

Statut : `CONCEPTION`.

> Il te fais quou ?

L'utilisateur fournit l'objectif, l'usine cherche l'architecture et les informations existantes puis construit le manquant. Le cahier des charges et la feuille de route ne sont pas des prérequis obligatoires.

### E06 — Architecture mère

Statut : `CONCEPTION`.

> Oh, donc je comprends tu veux une architecture, c'est ça ? Et l'architecture il y aura plusieurs niveaux

Séparer architecture des éléments (quoi) et architecture des processus (comment). Définir les niveaux progressivement sans mélanger les profondeurs.

### E07 — Catalogue N1 proposé

Statut : `PROPOSITION_NON_RETENUE_COMME_LISTE_FERMEE`.

> Trouve donc tous le composant niveau 1

13 familles initiales proposées : Frontend, Backend, Data, Integration, Infrastructure, Security, Intelligence, Automation, Quality Assurance, DevOps, Operations, Governance, Documentation. Proposition non normative ; distinguer branches produit et préoccupations transversales.

### E08 — Contrat Frontend et Backend

Statut : `DECISION_PARTIELLE_PUIS_PERIMETRE_ELARGI`.

> Retenons les composantes suivantes de niveau 1 pour la maquette mère ULEF : Frontend, Backend. Restons au niveau 1 pour définir leur contrat.

Deux branches produit web retenues à ce stade. Contrat C01 identité, C02 parent, C03 objectif, C04 entrée, C05 processus, C06 sortie, C07 interface, C08 validation, C09 continuité, C10 looping. Les deux branches sont indépendantes sous réserve de dépendances, compatibilité et coordination. Boucles descendante, ascendante, horizontale proposées.

### E09 — Découvrir avant de créer

Statut : `DECISION`.

> Et comment tu trouves ce composant ? Dans le code, dans la documentation, dans quoi ? Parce qu'on ne peut pas faire l'open generic dans la même composant qui existe déjà

Sources : arborescences, manifestes, code, documentation, runtime. Indices non suffisants isolément. Découvrir, identifier, rapprocher, qualifier, enregistrer, déterminer l'action. États EXISTING, PARTIAL, DOCUMENTED_ONLY, UNDOCUMENTED, INCONSISTENT, OBSOLETE, DUPLICATE, ABSENT, UNVERIFIED. Réutiliser l'identité et les autorités existantes ; ne pas créer un doublon de composant.

### E10 — Parcours des deux dépôts

Statut : `OBSERVATION_HISTORIQUE`.

> Non, maintenant parcours les deux repos, trouve tous les composants qui existent, d'accord, de niveau 1

Observation Git initiale : API 785 fichiers et 85 répertoires, frontend 6807 fichiers et 486 répertoires ; arbres non tronqués. .governance/project.json et repository.json établissent les rôles API et FRONTEND. Manifestes et points d'entrée corroborent. Deux conteneurs produit identifiés mais pas exhaustivité N1.

### E11 — Correction du périmètre N1

Statut : `CORRECTION_ET_CANDIDATS`.

> C'est tous les composants de niveau 1. Je pense qu'il y en a plusieurs.

Inventaire initial trop restrictif. 13 familles techniques frontend, 22 backend, 13 entrées fonctionnelles frontend et 9 services backend annoncés ; deux matrices de 37 capacités candidates. Ces listes se recouvrent, ne sont pas un total N1 certifié. Distinguer dossiers, services, fonctions, responsabilités, composantes et dépendances.

### E12 — Boucle exhaustive écosystème

Statut : `DECISION_ET_CONTRAT`.

> Bon, créer un loop ingénierie, un truc que tu vas me donner automatique qui va parcourir les deux repos le projet et ce qu'il y a sur le serveur GitHub et qui va donner tous les composants, tous les composants de niveau 1. C'est pas que frontend et tout, il y a les MCP, il y a les GitHub, tout qui parcourent et qui trouvent tous les composants de niveau 1 d'abord

Inclure GitHub, MCP, outils, serveurs, connexions, ressources, infrastructure, code, fichiers, documentation, agents, automatisations, registres, données, réseau, stockage, sécurité et monitoring. Exploration récursive des sources liées et autorisées, classification finale N1 uniquement. Réutiliser le Loop Engineering existant comme référence, ne pas créer d'autorité concurrente. Deux passages stables sans découverte nouvelle, file admissible vide, limites explicites avant convergence.

### E13 — Inventaire et registre effectifs

Statut : `OBSERVATION_ET_REALISATION_PARTIELLE`.

> Créé le loop engeniering et qu'il enregistre déjà le composant de niveau 1 dans un registre Note pas pas si ce qu'il y a dans le fichier et tout. Non, non, non. Va parcourir les deux repos. Je veux aussi découvrir tous les outils, tout ce qui existe et va découvrir aussi tous les fichiers, tout ce qui existe sur le repo pour maintenant créer d'abord tous les composants, pour les identifier, les classifier d'abord. Tous les composants de niveau 1, sans te baser sur ce que t'as vu dans les conversations

Inventaire initial 7592 chemins versionnés, 571 répertoires ; catalogue MCP 161 outils (103 lecture, 7 écriture opérationnelle, 51 écriture contrôlée), 2 ressources ; connecteur GitHub 89 outils exposés. Noms et chemins conservés dans le registre privé d'étude de cas. 20 familles candidates, non certifiées. MCP Live State V1678 ; S2 copies API d3e50cf76, frontend add4a5d diffèrent des HEAD Git observés ; ascendance non vérifiée. Aucune mutation runtime. Le quota d'automatisations a été signalé comme atteint ; aucun worker permanent attesté. Le contenu individuel de tous les fichiers n'est pas lu.

### E14 — Conservation permanente

Statut : `DEMANDE_ET_PROPOSITION_SUPERSEDEE`.

> Dis-moi, tu as connecté au Git ? Au bon repo Git ? Si tu trouves un endroit où tout ce qu'on va écrire dans cette conversation, il sera enregistré et stocké. Et bien organisé. Donc trouve une paire fixe qui ne devra pas bouger, associée à un ID canonique. Ne devra pas non plus bouger et qui devra être complété progressivement. Ok ? Avec tous les documents

Demande d'une paire fixe de documents et d'un ID canonique stable ; compléter progressivement, conserver documents et preuves. L'assistant avait proposé les historiques AfricaFunds existants ; aucune écriture dans ces historiques. Cette proposition de rattachement est explicitement supersédée.

### E15 — Identité indépendante

Statut : `DECISION_ET_REALISATION`.

> Non, c'est une idée canonique, c'est pas notre chantier. Donc il faut mettre un nouveau idée canonique. Quand je mets, on puisse le retrouver. Et tout ce que tu vas trouver, ne mélange pas avec ce qui existe. On va mettre ça tout à part. Donc ne va pas mélanger le repos qui existe. Prends-toi une place qui n'a rien à voir avec la collision des deux autres repos. Et mets ce qu'on va faire là-bas

Le propriétaire refuse la confusion avec le chantier AfricaFunds. ID ULEF-CONTINUITY-20261127-01 créé ; espace personnel indépendant, quatre documents (maquette, contrat N1, journal, étude de cas) ; registre antérieur déplacé sous cette racine en conservant son identité et ses preuves. Aucun nouveau dépôt créé.

### E16 — Branche dédiée Git

Statut : `DECISION_ET_REALISATION`.

> Non, non, il faut mettre ça sur une branche dans un des deux repos API ou frontend. Crée une branche tout à part sur laquelle on va travailler. Parce que quoi qu'il arrive, tu devras bien travailler sur les deux repos pour bien comprendre. Donc crée une branche indépendante sur laquelle on va travailler. On va tout consigner, on va tout bien organiser

Correction du support : une branche dans un des deux dépôts, non un nouveau dépôt. API choisi comme hôte ; branche ULEF-CONTINUITY-20261127-01, chemin ulef/. Commit fondateur b075e1ed360e5b1cfd9ebe16bb2b929075c3b4d6, 10 fichiers ajoutés, 206 lignes, zéro suppression/modification héritée. HEAD canoniques inchangés lors de cette intervention. Contrôle AfricaFunds Branch Policy en échec suite à branche non inscrite (run 46006544264) ; pas de désactivation, pas de régularisation dans les branches métier.

### E17 — Rappel de l'ambition

Statut : `CLARIFICATION`.

> Oui mais ULF c'est quoi ? C'est quoi notre objectif à la base ? Rappelle-moi l'objectif global. ULF c'est juste un départ

ULEF est le modèle de départ, pas une fin. Cycle de vie complet : compréhension, découverte, conception, décomposition, planification, programmation, intégration, tests/corrections, déploiement autorisé, exploitation, maintenance, amélioration, continuité et gouvernance. Objectif de conception, non capacité déjà démontrée.

### E18 — Retour à l'objectif initial

Statut : `CLARIFICATION_UTILISATEUR`.

> Qu'est-ce qu'on voulait faire au départ ? Sois clair. Parce qu'au départ on partait sur le projet Africa Fund qui est le repo et l'idée c'était vraiment de pouvoir reconstruire les bases. On est d'accord ?

Priorité : reconstruire les fondations d'AfricaFunds à partir de ses deux dépôts et de l'écosystème existant, non réécrire le produit. Socles informationnel, documentaire, architectural, fonctionnel, technique, infrastructurel, opérationnel, organisationnel, automatisation, continuité, développement. ULEF est le moyen progressif ; généralisation ultérieure. N1 encore en découverte. Identité ULEF autonome ne signifie pas abandon de l'objectif initial AfricaFunds.

### E19 — Exigence d'historique complet

Statut : `DEMANDE_ACTUELLE`.

> Je t'ai dit aussi que tu m'as tout enregistré de ce qu'on dit. Tu as laissé des points. Et t'as ça juste avec l'idée canonique. Il faut retrouver toute la conversation

Ne pas limiter la mémoire au nom ou à l'identifiant. Retrouver la conversation depuis son origine, préserver tous les points et leur ordre, distinguer les textes visibles, les restitutions sémantiques et les lacunes. Compléter la paire historique existante sous le même ID. Ne pas prétendre avoir exporté un verbatim intégral inaccessible.

### Reprise et traçabilité

Conserver cette paire de fichiers sous le même ID ; chaque nouvelle intervention ajoute un delta daté et un checkpoint. Ne jamais confondre historique conversationnel et preuve technique. Les données détaillées et documents privés ne sont pas publiés implicitement dans ce dépôt public. L'export intégral, les textes assistant mot pour mot et le premier échange exact demeurent à récupérer si une source complète devient accessible. Aucun changement de branche métier, de runtime ou de gouvernance.

### E20 — Boucle 01 : découverte et consignation N1

Statut : `CLARIFICATION_UTILISATEUR`.

L'usine de génération autonome est la finalité progressive ; la reconstruction des fondations d'AfricaFunds est le point de départ. La boucle 01 est exclusivement la découverte N1 : parcourir les sources réelles autorisées, consigner chaque observation pertinente avec provenance, inventorier fichiers, outils, ressources et relations, identifier et classifier les composantes N1 sans liste fermée ni doublon, conserver les inconnues, puis vérifier et persister les résultats. Distinguer observation brute, candidat et composante qualifiée. Ne pas engager N2 ni générer de code métier à ce stade. La mise au point de la boucle et sa convergence restent à réaliser ; aucune exhaustivité ni autonomie d'exécution n'est attestée.

### E21 — Cartographie générale des boucles et niveaux

Statut : `PROPOSITION_A_VALIDER`.

Proposition de cartographie générale en douze boucles B01–B12. Les niveaux N0, N1, N2… décrivent la structure, les boucles décrivent les processus ; un processus peut intervenir à plusieurs niveaux. B01 demeure le seul travail actuel, niveau N1 strict. B02–B12 sont des propositions non validées et non implémentées. Gouvernance, sécurité, continuité et non-collision transversales. Toute boucle reprend son checkpoint, traite une unité bornée, persiste et vérifie ses résultats, puis continue, revient en arrière ou signale les blocages.

Voir [LOOP_MAP.md](../LOOP_MAP.md).

### E22 — Objectif et procédure B01

Statut : `SPECIFICATION_PROPOSEE`.

Précision proposée pour B01 : découvrir toutes les composantes N1 réelles de l'écosystème AfricaFunds, noter où elles existent, identifier, classifier et enregistrer. D'abord inventorier les chemins, noms, types, versions, outils et ressources sans présumer du contenu ; lire ensuite les manifestes, points d'entrée et extraits admissibles nécessaires pour établir la responsabilité et le rattachement, sans lancer une décomposition N2 ni une analyse exhaustive métier. Conserver séparément observations brutes, candidats, composantes qualifiées et inconnues. Déduplication manifeste en B01 ; réconciliation approfondie en B02. Tout conserver dans la branche ULEF, sources observées en lecture seule. La boucle ne peut déclarer une convergence que sur preuves et périmètre stable; les limites d'accès demeurent explicites. Le protocole est une spécification, pas un moteur déjà exécuté.

Voir [N1_DISCOVERY_PROTOCOL.md](../discovery/N1_DISCOVERY_PROTOCOL.md).

### E23 — Conservation et organisation des résultats B01

Statut : `EXIGENCE_CONFIRMEE`.

Exigence confirmée par le propriétaire : conserver et organiser tous les résultats de B01 de façon cumulative, persistante, traçable et réutilisable. Chaque passage doit produire un delta enregistré et vérifié avant d'être considéré terminé. Préserver observations brutes, candidats, composantes qualifiées, sources et versions, relations, preuves, classifications, divergences, limites d'accès et checkpoints. Aucun résultat pertinent ne doit rester uniquement dans le chat. Les changements et déduplications conservent les observations historiques et les alias; pas d'écrasement silencieux. Le registre de composantes et l'état de découverte existants restent les points de rattachement; les inventaires détaillés dérivés sont indexés et référencés, sans créer d'autorité concurrente. Le dépôt hôte étant public, conserver les données confidentielles et secrets hors Git et n'y référencer que des métadonnées autorisées. La sortie structurée B01 doit être directement exploitable par B02 sans refaire la collecte. Ceci est une exigence de conception; l'implémentation et la migration complète des résultats existants restent à réaliser.

### E24 — Raison fondatrice : reconstruire le squelette global AfricaFunds

Statut : `CLARIFICATION_UTILISATEUR`.

Clarification fondatrice du propriétaire : la démarche est née du besoin de disposer d'un squelette global structuré du projet AfricaFunds. Il ne s'agit pas d'affirmer qu'aucune architecture, documentation ou structure n'existait dans les dépôts, mais de reconstruire et consolider un squelette global exploitable à partir de leur existant réel et des ressources associées. B01 découvre, inventorie, identifie, classifie et conserve les composantes N1 ; B02 réconcilie et reconstruit les fondations ; les boucles ultérieures approfondissent la hiérarchie et exploitent ce squelette pour la génération autonome. ULEF est le moyen progressif, et non une substitution à cet objectif initial. Ne pas inventer le squelette ni réécrire le produit ; ne pas descendre en N2 avant qualification N1. Cette clarification est une décision de conception, non une attestation d'absence de documents architecturaux ou de réalisation du squelette.

### E25 — Constitution récursive des composantes du squelette

Statut : `PRECISION_DE_CONCEPTION`.

Principe de constitution du squelette : un projet N0 contient des composantes N1 ; chaque composante contient des éléments N2 ; chaque élément peut à son tour être un parent d'éléments N3, et ainsi de suite jusqu'au niveau terminal utile. La profondeur est variable selon la branche et ne doit pas être imposée ; les noms fonctionnels ou techniques (module, service, fonctionnalité, fichier, etc.) sont des types à découvrir, non des niveaux universellement fixes. Chaque noeud est identifié et relié à son parent, ses enfants, ses dépendances et ses preuves ; les relations transversales ne sont pas assimilées à une relation de composition. Les processus de découverte s'appliquent récursivement lorsque la descente est autorisée. Un élément terminal n'est pas nécessairement une tâche : une unité de travail peut lui être associée ultérieurement. Pour l'instant, identifier uniquement les composantes N1 d'AfricaFunds, sans prétendre avoir découvert N2. Proposition de précision de la maquette mère en réponse à la question du propriétaire.

### E26 — Périmètre du squelette : axes, programmes, chantiers et composition

Le squelette global AfricaFunds ne se limite pas à l'architecture technique. B01 doit découvrir aussi l'identité, la vision, les objectifs, les grands axes, programmes, chantiers, sous-chantiers, capacités existantes et prévues, exigences et travaux. Distinguer vues de composition produit/technique, fonctionnelle et programmatique, et ressources habilitantes; relier les vues par identifiants, sans confondre programme, tâche, composante logicielle et outil. Un grand axe ou programme peut être N1 dans la vue programmatique, uniquement si son rattachement direct est établi; un sous-chantier est enfant du chantier concerné, pas automatiquement N1. La découverte des sources peut être profonde mais la qualification du squelette reste N1. Les structures et IDs existants sont conservés. Observations directes : la matrice produit contient 37 intakes candidats et la queue canonique 37 entrées de travail au HEAD observé, non additionnables comme total de N1. Roadmap frontend et contexte API attestent des ambitions et plans documentés, pas de leur exécution. La taxonomie multi-vues est une proposition à stabiliser; aucun nouveau programme ni tâche métier créé.

### E27 — Ordre de cartographie : sources, existant, cible, squelette

L'objectif immédiat est la cartographie et la squelettisation d'AfricaFunds, existant et cible, non la création d'une roadmap nouvelle ni une liste technique isolée. Proposition d'ordre de lecture B01 : (1) identifier le projet N0 et ses objectifs dans les documents d'identité, contexte, README et vision; (2) découvrir la cible et l'ambition documentées dans ROADMAP, spécifications, exigences et programmes; (3) découvrir les structures et composantes déclarées dans les documents d'architecture; (4) relever les réalisations et travaux prévus, en cours ou déclarés terminés dans SUIVI, TASKS, TODO, queue et historiques; (5) corroborer l'existant avec arbres Git, code, manifestes, outils, infrastructures et preuves runtime autorisées; (6) enregistrer les observations, candidats N1, rattachements, états documentés versus observés, écarts et inconnues. L'ordre est une priorité de découverte, pas une cascade rigide : les sources se recoupent, peuvent être lues en parallèle et rouvrent les questions. Roadmap, SUIVI et architecture sont des sources, pas le squelette final. Le squelette N1 représente les grandes composantes fonctionnelles et structurelles de l'existant et de la cible, liées aux objectifs et aux travaux, sans confondre tâches, outils et composants. B02 réconciliera et consolidera le squelette, aucune descente N2 ni création de chantier métier à ce stade. Ne pas traiter une déclaration DONE comme preuve de production. Proposition d'organisation à valider.

### E28 — PROJECT_CONTEXT et organisation documentaire existante

Le PROJECT_CONTEXT.md des deux dépôts établit l'identité unique AfricaFunds, leurs rôles API/frontend, les branches canoniques, S2 déclaré, le checkpoint global SUIVI frontend et les registres structurés. L'API décrit aussi les matrices de 37 intakes, 125 marqueurs de gaps et historique consolidé. 00_START_HERE.md prescrit déjà un ordre de lecture, DOCUMENT_INDEX.md organise les familles documentaires, SOURCE_OF_TRUTH.md les autorités, PROJECT_BRIEF.md le produit, PROJECT_CHARTER.md le mandat, SCOPE.md le périmètre. Reprendre cette organisation existante avant de proposer un autre squelette. Inventaire nominatif Markdown Git : Wealthtechinnovations/api_opcv 226, Wealthtechinnovations/front_end_opcvm 25. Les arbres ne sont pas tronqués. Les 251 fichiers n'ont pas tous été lus intégralement; l'inventaire de chemins ne prouve pas leur analyse. N0 à qualifier puis N1; sources en lecture seule. La présente étape n'est pas une nouvelle cartographie certifiée.

### E29 — Actualité, consommation et cycle de vie des Markdown

Audit documentaire direct : 251/251 chemins Markdown présents correspondent aux git_blob_sha du registre .governance/knowledge/markdown-registry.json, aucun manquant ni différent, sur API eae81c5db5a4d46f3741ab6fa2922017aa2215eb et frontend 1640ad2277cb913b53782ca0a428a0b9ca44e4a6. Le registre référence un HEAD API antérieur 356bf86aeeb77615b6d71b75a63241b4173d2c52, sans divergence des blobs Markdown observés. L'audit Markdown 46003559055 est SUCCESS le 27/11 à 13:01:43 UTC; contrat frontend 45883714648 SUCCESS; Programme Director 45944313431 SUCCESS. Ces preuves ne certifient pas la vérité métier ni runtime. LOOP_STATE.md juxtapose la projection AF-TASK-028 et une section dite actuelle AF-TASK-026: candidat à qualification, pas correction automatique. Les six projections gérées proviennent des autorités JSON; writeback manuel dry-run/apply-local, sans push; SUIVI 25/11 atteste gate writer fermé et autonomie non certifiée. Proposition : PROJECT_CONTEXT reste index d'identité, vision/périmètre, constitution N0/N1, références et autorités, règles de consommation et évolution; état volatil reste dans STATUS/SUIVI/queue, liens plutôt que duplications. Réutiliser registre Markdown existant, distinguer couverture, actualité sémantique, cohérence et preuve runtime. B01 collecte les faits et mécanismes; B02 réconcilie; aucune mutation canonique.

### E30 — Système de connaissances et évaluation

Proposition précédente à conserver : système de connaissances vivant en cinq fonctions (connaître, structurer, consommer, actualiser, évaluer) et trois couches (sources, connaissances structurées, mécanismes). Chaque connaissance est identifiée, typée, sourcée, localisée, versionnée, reliée à ses autorités et consommateurs, qualifiée et accompagnée de preuves et déclencheurs. Évaluer exhaustivité, couverture, exactitude, actualité, cohérence, unicité, traçabilité, hiérarchisation, connectivité, consommabilité, évolutivité et continuité. Le cycle de changement identifie l'information, rapproche l'existant, analyse l'impact, actualise les connaissances et documents dérivés, vérifie, persiste et reprend. Découvrir d'abord les connaissances et mécanismes existants, puis consolider N0 et qualifier N1. Proposition non implémentée. Toute actualisation prévue par cette conception est exclusivement interne à ULEF conformément à E31; aucune écriture vers les sources observées.

### E31 — Isolation stricte et non-modification de l'existant

Directive explicite du propriétaire : AfricaFunds et toutes ses ressources d'origine sont protégés en lecture seule. ULEF récupère les informations, reconstruit et recrée ses propres fichiers, boucles et mécanismes indépendants exclusivement sous ulef/ dans la branche ULEF-CONTINUITY-20261127-01. Ne modifier aucun fichier hérité du dépôt hôte, y compris sur la branche ULEF; ne modifier aucune branche applicative, registre opérationnel, workflow, paramètre GitHub, configuration MCP, serveur, base de données, service, cron ou production. Pas de fusion, PR vers l'existant, déploiement ou exécution d'un effet sur les sources; essais isolés uniquement sur données admissibles et fixtures. Les résultats dérivés référencent les sources et versions, sans remplacer leurs autorités. Les nouveaux fichiers et boucles peuvent être créés et les artefacts ULEF déjà créés enrichis dans ce seul périmètre. Aucun secret ni contenu privé dans Git public. Tout élargissement exige une décision explicite ultérieure. Conserver progressivement chaque décision et résultat significatif dans la paire historique existante et les artefacts indexés; ne pas prétendre à un archivage automatique ou verbatim exhaustif. La règle s'applique à ce chantier ULEF et ne modifie pas les mandats des autres automatisations.

### E32 — Lien de finalité AfricaFunds et indépendance d'exécution ULEF

Clarification du propriétaire : ULEF est directement lié à AfricaFunds par sa finalité d'amélioration, et indépendant uniquement dans son périmètre de conception, de stockage, de programmation et d'expérimentation. AfricaFunds CS-AFRICAFUNDS-001 est le projet de référence et bénéficiaire prioritaire, pas un simple exemple interchangeable. ULEF conserve son identifiant ULEF-CONTINUITY-20261127-01 et sa branche dédiée; il ne constitue ni un deuxième AfricaFunds ni une autorité de production concurrente. À partir de l'existant réel, reconstruire le squelette, structurer les connaissances, créer les fichiers, boucles et mécanismes propres à ULEF, tester et évaluer les améliorations. Préserver les rattachements, identités existantes, références de source, versions et historique. Toute intégration future reste soumise à autorisation explicite. E31 reste intégralement applicable : aucun changement sur les branches applicatives, fichiers hérités, MCP, serveurs, données ou workflows existants. Écrire exclusivement sous ulef/. La généralisation éventuelle ne doit pas détourner du besoin AfricaFunds. Aucun nouveau projet, branche ou identifiant de continuité.
