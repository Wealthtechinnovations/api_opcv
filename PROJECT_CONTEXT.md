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
