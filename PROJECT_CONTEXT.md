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

## Matrice d'intakes candidats

La surface de découverte produit/tech/data est :

`.governance/matrices/africafunds-product-intake-matrix.json`

Cette matrice est **non autoritaire** et ne remplace jamais la queue canonique `.governance/loop/task-queue.json`. Elle regroupe les grands chantiers historiques et les gaps à qualifier (Fund/ShareClass, organisations, lineage, documents, pays, analytics, Atomic Design, espaces utilisateurs, institutionnel/Due Diligence, SEO/Schema.org, accessibilité, observabilité, tests et dette legacy).

Avant de créer une nouvelle tâche, tout agent doit :

1. relire la queue canonique et les claims actifs ;
2. rechercher l'existant dans le code, la data, les documents et le runtime pertinent ;
3. rapprocher le besoin de cette matrice et du Gap Harvester ;
4. dédupliquer contre les tâches/programmes existants ;
5. étendre une autorité existante plutôt que créer un système parallèle ;
6. ne promouvoir un intake vers la queue qu'après vérification live, dépendances, DoR/DoD, preuves attendues et surfaces à réclamer.

Les intakes candidats ne donnent **aucune autorisation implicite** de modifier production, DB, secrets, crons ou ressources partagées. Les tâches et gates live restent prioritaires.

