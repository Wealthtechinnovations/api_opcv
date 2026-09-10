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
| Methode d'execution | `LOOP_ENGINEERING.md` |
| Regles historiques/detaillees | `CLAUDE.md` des deux depots |
| Etat operationnel / point de reprise | `front_end_opcvm/SUIVI.md` uniquement |
| Backend versionne | `Wealthtechinnovations/api_opcv` / `claude/code-review-improvements-ikvuj` |
| Frontend versionne | `Wealthtechinnovations/front_end_opcvm` / `claude/code-review-improvements-ikvuj` |
| Faits production | mesure live la plus recente ; snapshot runtime `/var/lib/fundafrica/runtime/PRODUCTION_STATE.json` sur S2 ; `api_opcv/docs/ETAT_PRODUCTION_VERIFIE.md` lorsqu'il reflete cette mesure |
| Snapshot historique Git | `api_opcv/PRODUCTION_STATE.json` est un fallback/historique ; il n'est pas l'autorite live et ne doit plus etre rafraichi par des commits automatiques S2 |
| Post-mortem GOV-006 | `docs/governance/GOV-006_GITHUB_S2_RECONCILIATION_2026-09-10.md` |
| Modele d'autorite GitHub/S2/runtime | `docs/architecture/GITHUB_S2_RUNTIME_AUTHORITY_MODEL.md` |
| Runbook de reconciliation | `docs/runbooks/GITHUB_S2_RECONCILIATION_RUNBOOK.md` |
| Preuves structurees GOV-006 | `docs/evidence/GOV-006_EVIDENCE_2026-09-10.json` |
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
8. Un cron S2 peut mesurer et ecrire des artefacts runtime hors Git ; il ne doit jamais creer, commiter ou pousser un historique Git autonome.
9. Le snapshot production live est runtime et hors working tree. Git conserve le code, la gouvernance et l'historique valide ; il ne sert pas de journal horaire de production.
10. Un `git status` S2 sans indication ahead/behind ne remplace pas une relecture distante GitHub fraiche.
11. Tout artefact untracked est preserve tant qu'il n'est pas classifie ; `UNKNOWN` n'est jamais synonyme de supprimable.
12. Une modification locale legitime detectee sur S2 doit etre preservee et reconciliee vers GitHub avant de realigner le serveur.
13. Une documentation qui avance un HEAD GitHub recree temporairement un ecart S2 et impose une attestation post-documentation.
14. HTTP 200 prouve la sante d'un endpoint, pas l'egalite GitHub/S2.

## Branches de verite

```text
api_opcv        -> claude/code-review-improvements-ikvuj
front_end_opcvm -> claude/code-review-improvements-ikvuj
```

Ces branches sont communes a tous les agents. Tout changement de branche canonique exige une decision explicite du proprietaire et une migration de gouvernance documentee.

## Separation Git / deployment / runtime

```text
GitHub
= code + historique valide + gouvernance + documentation + CI

S2 working tree
= projection de deploiement du canon GitHub

S2 runtime
= processus + logs + caches + snapshots + fichiers generes + mesures live
```

Flux interdit :

```text
Runtime -> git commit
Runtime -> git push
Cron    -> historique Git
```

## Classification des artefacts S2

Tout artefact local non suivi doit appartenir explicitement a une categorie :

```text
GENERATED_SAFE
LOG
CACHE
DOWNLOAD
BUSINESS_DATA
UNKNOWN
```

Seuls les artefacts classifies peuvent etre ignores/nettoyes selon une politique separee. `UNKNOWN` implique preservation et investigation.

L'artefact API S2 `0`, observe le 2026-09-10, reste `UNKNOWN` tant que son contenu, sa taille, son producteur et sa finalite ne sont pas etablis.

## Attestation production cible

```text
GitHub API HEAD      == S2 API deployed HEAD
GitHub FRONTEND HEAD == S2 frontend deployed HEAD
```

Si cette egalite n'est pas mesuree, le statut est `NON VERIFIE`, pas `OK`.

Pour une cloture GOV-006 complete, cette egalite doit etre mesuree **apres** les derniers commits documentaires.

## Provenance de l'adoption

Le mecanisme transversal est adapte de `chainsolutions-wealthtech/Regulatory` `main@483da3e11c30dd0b4f2a4cee114909d512a1b426`.

Baseline historique d'adoption :

```text
API_BASE = f4e1ef4163aa33a0b1abaf2f82b46e89611cfb90
FRONTEND_BASE = b9af99e99ebc239997625999fdaa4844d5972e19
```

Ces SHA documentent le point de depart de l'adoption et ne sont pas des HEAD perpetuels. Aucune regle metier specifique au produit Regulatory n'est importee dans FundAfrica.
