# PROJECT_IDENTITY — AfricaFunds

> Statut : `CURRENT_CANONICAL` pour l’identité logique du projet.
> Représentation machine canonique : `.governance/project.json`.

## Identité

```text
PROJECT_UID  = CS-AFRICAFUNDS-001
PROJECT_ID   = chainsolutions.africafunds
PROJECT_NAME = AfricaFunds
```

`PROJECT_UID` identifie durablement le projet. `PROJECT_ID` est son identifiant technique stable. `PROJECT_NAME` est son nom humain canonique actuel.

## Un projet, deux repositories

AfricaFunds est une application logique unique composée de deux historiques Git indépendants :

```text
API       = Wealthtechinnovations/api_opcv
FRONTEND  = Wealthtechinnovations/front_end_opcvm
```

`PROJECT_ID != REPOSITORY_ID`. Les deux repositories déclarent le même `PROJECT_UID` et le même `PROJECT_ID`, mais chacun possède un `repository_role` local dans `.governance/repository.json`.

Aucun troisième repository, monorepo, submodule ou SHA global fictif n’est créé pour matérialiser ce lien.

## État global

```text
FUND_STATE = {
  API_SHA,
  FRONTEND_SHA,
  SUIVI_CHECKPOINT,
  PRODUCTION_ATTESTATION
}
```

Un seul SHA ne représente jamais l’état complet d’AfricaFunds.

## Autorités

- `.governance/project.json` : identité et topologie structurées du projet ;
- `.governance/repository.json` : rôle local du repository et repository pair ;
- `SOURCE_OF_TRUTH.md` : arbitrage global des autorités ;
- `GOVERNANCE.md` : règles de travail ;
- `front_end_opcvm/SUIVI.md` : checkpoint/historique opérationnel global ;
- GitHub : autorité Git ; S2 : cible/runtime selon GOV-006.

## Invariant cross-repository

Les deux copies de `.governance/project.json` doivent rester octet pour octet identiques. Les deux `repository.json` doivent être réciproques : `API ↔ FRONTEND`, avec le même `PROJECT_UID`, `PROJECT_ID` et la même branche canonique.

Toute modification de l’identité projet est une décision cross-repository et doit mettre à jour les deux dépôts de manière gouvernée.
