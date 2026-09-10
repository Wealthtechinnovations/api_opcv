# SOURCE_OF_TRUTH — FundAfrica

> Statut : `APPLICABLE`
> Portee : les deux depots FundAfrica.

## Etat canonique

FundAfrica est une seule application repartie sur deux depots. Son etat est :

```text
FUND_STATE = (API_HEAD, FRONTEND_HEAD, SUIVI_CHECKPOINT, PRODUCTION_ATTESTATION)
```

## Matrice d'autorite

| Domaine | Source canonique |
|---|---|
| Decision explicite de gouvernance | proprietaire du projet, puis decision persistee dans Git |
| Gouvernance transversale | `DIRECTIVE_TRAVAIL.md`, `GOVERNANCE.md`, `AGENTS.md` |
| Regles historiques/detaillees | `CLAUDE.md` des deux depots |
| Etat operationnel / point de reprise | `front_end_opcvm/SUIVI.md` uniquement |
| Backend versionne | `Wealthtechinnovations/api_opcv` / `claude/code-review-improvements-ikvuj` |
| Frontend versionne | `Wealthtechinnovations/front_end_opcvm` / `claude/code-review-improvements-ikvuj` |
| Faits production | mesure live la plus recente ; `api_opcv/docs/ETAT_PRODUCTION_VERIFIE.md` lorsqu'il reflete cette mesure |
| Schema attendu | migrations + modeles versionnes, confrontes au schema DB reel avant migration |
| Donnees financieres | sources et pipelines canoniques documentes pour chaque pays/domaine ; jamais une supposition IA |
| Deploiement | scripts/procedures versionnes confrontes au runtime reel |
| Historique | Git + `SUIVI.md` + `CHANGELOG.md` selon leur role |

## Regles

1. Une conversation n'est jamais la memoire canonique.
2. Le serveur S2 n'est pas une branche de developpement independante.
3. Une photographie historique reste vraie pour sa date ; elle n'est pas reecrite pour correspondre au present.
4. Pour un fait runtime, une mesure recente et verifiable prime sur une documentation plus ancienne.
5. Pour une contradiction structurante, appliquer la regle la plus restrictive et ne jamais trancher silencieusement.
6. Une source secondaire, un exemple ou une donnee calculee ne remplace jamais l'autorite primaire qui existe deja.
7. `api_opcv/SUIVI.md` reste un pointeur ; aucune information operationnelle nouvelle ne doit y etre stockee.

## Branches de verite

```text
api_opcv        -> claude/code-review-improvements-ikvuj
front_end_opcvm -> claude/code-review-improvements-ikvuj
```

Ces branches sont communes a tous les agents. Tout changement de branche canonique exige une decision explicite du proprietaire et une migration de gouvernance documentee.

## Attestation production cible

```text
GitHub API HEAD      == S2 API deployed HEAD
GitHub FRONTEND HEAD == S2 frontend deployed HEAD
```

Si cette egalite n'est pas mesuree, le statut est `NON VERIFIE`, pas `OK`.

## Provenance de l'adoption

Le mecanisme transversal est adapte de `chainsolutions-wealthtech/Regulatory` `main@483da3e11c30dd0b4f2a4cee114909d512a1b426`.

Baseline historique d'adoption :

```text
API_BASE = f4e1ef4163aa33a0b1abaf2f82b46e89611cfb90
FRONTEND_BASE = b9af99e99ebc239997625999fdaa4844d5972e19
```

Ces SHA documentent le point de depart de l'adoption et ne sont pas des HEAD perpetuels. Aucune regle metier specifique au produit Regulatory n'est importee dans FundAfrica.
