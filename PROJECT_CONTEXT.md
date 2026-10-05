# PROJECT_CONTEXT — AfricaFunds API

> Statut : `APPLICABLE`
> Produit canonique : **AfricaFunds**.
> Repository : `Wealthtechinnovations/api_opcv`.
> Branche canonique : `claude/code-review-improvements-ikvuj`.
> Production : S2.

## Identité projet versionnée

```text
PROJECT_UID  = CS-AFRICAFUNDS-001
PROJECT_ID   = chainsolutions.africafunds
PROJECT_NAME = AfricaFunds
REPOSITORY_ROLE = API
PEER_REPOSITORY = Wealthtechinnovations/front_end_opcvm
```

L’identité structurée commune est `.governance/project.json`. Le rôle local de ce dépôt est `.governance/repository.json`. L’explication humaine canonique du lien se trouve dans `docs/01-governance/PROJECT_IDENTITY.md`.

## Rôle

Ce dépôt porte le backend, les APIs, modèles, migrations, calculs financiers, imports, crons, workers et contrôles de données d’AfricaFunds.

AfricaFunds est une application unique composée de deux historiques Git indépendants : ce dépôt API et `Wealthtechinnovations/front_end_opcvm` pour le frontend.

## État global

`FUND_STATE = (API_HEAD, FRONTEND_HEAD, SUIVI_CHECKPOINT, PRODUCTION_ATTESTATION)`.

Le `SUIVI.md` canonique global reste dans le frontend. Le `SUIVI.md` API est un pointeur/mémoire technique locale selon la gouvernance existante.

## Héritage

Les mentions historiques `FundAfrica` ou chemins techniques contenant `fundafrica` restent conservés lorsqu’ils décrivent l’histoire ou l’infrastructure réelle. Ils ne changent pas le nom produit canonique AfricaFunds.

## Principe

La gouvernance Regulatory Plus complète l’existant : lire, réutiliser, corriger, renforcer, étendre puis migrer compatiblement. Aucun document, script, donnée ou workflow historique utile n’est supprimé pour adopter cette structure.

## Matrices de découverte et de promotion

Les surfaces non autoritaires qui consolident la vision produit/tech/data sont :

- `.governance/matrices/africafunds-product-intake-matrix.json` — 37 intakes candidats couvrant les grands domaines historiques et futurs ;
- `.governance/matrices/africafunds-gap-qualification-matrix.json` — qualification/déduplication des 125 marqueurs détectés par le Gap Harvester ;
- `.governance/matrices/africafunds-capability-coverage-matrix.json` — état de couverture live/partiel/planifié des 37 intakes et vagues de dépendances ;
- `.governance/matrices/africafunds-task-promotion-plan.json` — propositions de tâches/epics et mini-lots avec DoR/DoD, à promouvoir seulement après les gates.

Ces matrices sont **non autoritaires** et ne remplacent jamais la queue canonique `.governance/loop/task-queue.json`. Elles évitent qu'un chantier historique (Fund/ShareClass, organisations, lineage, documents, pays, analytics, Atomic Design, espaces utilisateurs, institutionnel/Due Diligence, SEO/Schema.org, accessibilité, observabilité, tests, dette legacy) reste uniquement dans une ancienne conversation.

Avant de créer ou promouvoir une nouvelle tâche, tout agent doit :

1. relire la queue canonique, les requirements et les claims actifs ;
2. rechercher l'existant dans le code, la data, les documents et le runtime pertinent ;
3. lire les quatre matrices ci-dessus et le Gap Harvester ;
4. dédupliquer contre les tâches/programmes existants et les travaux terminés depuis la génération des matrices ;
5. étendre une autorité existante plutôt que créer un système parallèle ;
6. revalider les deux HEAD et les surfaces revendiquées ;
7. ne promouvoir un intake/proposal vers la queue qu'après preuve live, dépendances, DoR/DoD, preuves attendues, priorité et surfaces à réclamer.

Les intakes et propositions ne donnent **aucune autorisation implicite** de modifier production, DB, secrets, crons ou ressources partagées. Les tâches et gates live restent prioritaires.

