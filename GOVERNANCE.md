# GOVERNANCE — FundAfrica

> Statut : `APPLICABLE`
> Nature : adaptateur transversal de gouvernance.
> Portee : `api_opcv` + `front_end_opcvm`.
> Principe : consolider l'existant sans remplacer `DIRECTIVE_TRAVAIL.md`, `CLAUDE.md` ou `SUIVI.md`.

## Contrat machine-readable

```text
ONE_PRODUCT_TWO_REPOSITORIES = TRUE
API_CANONICAL_WORK_BRANCH = claude/code-review-improvements-ikvuj
FRONTEND_CANONICAL_WORK_BRANCH = claude/code-review-improvements-ikvuj
NEW_BRANCH_CREATION = FORBIDDEN
NORMAL_WORK_PR = NOT_REQUIRED
FORCE_PUSH = FORBIDDEN
HISTORY_REWRITE = FORBIDDEN
SINGLE_WRITER = REQUIRED
IMPROVEMENT_ONLY = REQUIRED
ZERO_REGRESSION = REQUIRED
READ_EXISTING_BEFORE_CREATE = REQUIRED
PERSISTENT_MEMORY = REQUIRED
VERIFY_BEFORE_WRITE = REQUIRED
VERIFY_AFTER_WRITE = REQUIRED
MEASURED_PRODUCTION_FACTS_OVERRIDE_STALE_PROSE = TRUE
GITHUB_TO_S2_DEPLOYMENT_PATH = REQUIRED
DIRECT_SERVER_DEVELOPMENT_AS_AUTHORITY = FORBIDDEN
```

## Autorites existantes preservees

Cette gouvernance ne cree aucune politique concurrente. Elle organise les autorites deja presentes :

- `DIRECTIVE_TRAVAIL.md` : directive permanente transversale des deux depots ;
- `CLAUDE.md` : regles historiques/detaillees ;
- `front_end_opcvm/SUIVI.md` : historique et point de reprise operationnel unique ;
- `api_opcv/SUIVI.md` : pointeur uniquement ;
- `api_opcv/docs/ETAT_PRODUCTION_VERIFIE.md` et mesures live : autorite pour les faits observes en production ;
- code, migrations, tests et scripts des branches canoniques : autorite technique versionnee ;
- decisions explicites du proprietaire : autorite superieure pour modifier la gouvernance.

En cas de contradiction, ne jamais choisir silencieusement. Pour un fait d'execution, la mesure la plus recente et verifiable prime sur une prose plus ancienne. Pour une decision de gouvernance, la decision explicite la plus recente du proprietaire prime et doit ensuite etre persistee dans le depot.

## Une application, deux depots, un etat

FundAfrica est une seule application. L'etat canonique est :

```text
FUND_STATE = (API_HEAD, FRONTEND_HEAD, SUIVI_CHECKPOINT, PRODUCTION_ATTESTATION)
```

Une tache frontend peut avoir un impact backend, DB, SEO ou deployment ; une tache backend peut avoir un impact frontend. Toute analyse doit verifier la portee inter-repositories.

## Single Writer et concurrence

Plusieurs agents peuvent effectuer des lectures, audits ou analyses simultanement. Les ecritures sont serialisees.

Un agent qui veut ecrire doit :

1. capturer les HEAD API et frontend ;
2. lire le point de reprise courant ;
3. definir un lot borne et ses fichiers/objets impactes ;
4. relire les HEAD immediatement avant l'ecriture ;
5. interrompre et reconciler si l'un des HEAD a bouge ;
6. produire des commits atomiques, sans force-push ;
7. verifier les HEAD distants apres commit ;
8. seulement ensuite passer au lot suivant.

Aucune branche `chatgpt/*`, `codex/*`, `agent/*`, nouvelle `claude/*`, `feature/*`, `fix/*` ou equivalente ne doit etre creee pour le travail normal.

## Protocole bi-repository

Une evolution qui touche les deux depots est une transaction logique en plusieurs commits, pas deux chantiers independants.

- enregistrer les HEAD de depart des deux depots ;
- appliquer d'abord la partie compatible/backward-compatible qui ne casse pas l'autre depot ;
- re-verifier le HEAD du second depot avant son commit ;
- ne deployer aucun etat transitoire incompatible ;
- verifier ensuite le nouveau couple `(API_HEAD, FRONTEND_HEAD)` ;
- consigner le lot et ses preuves dans le suivi canonique.

## Improvement Only / Zero Regression

Il est interdit de :

- recommencer une fonctionnalite selon une architecture parallele sans decision ;
- dupliquer une autorite de donnees, une table canonique, un modele de fonds, une SGO, une authentification ou un suivi ;
- casser une API, une route, un format historique, un calcul financier, une URL, un comportement frontend ou un workflow deja valide ;
- modifier silencieusement une convention quantitative ;
- supprimer un test pour faire passer un changement ;
- transformer une anomalie de donnee en valeur acceptable pour obtenir un score ;
- declarer un build, test, deploiement ou etat production qui n'a pas ete verifie.

## Boucle obligatoire

```text
DISCOVER
-> BASELINE
-> SELECT_ATOMIC_LOT
-> IMPACT_ANALYSIS
-> RECHECK_BOTH_HEADS
-> IMPLEMENT_COMPATIBLY
-> VERIFY
-> REGRESSION_CHECK
-> CORRECT_IF_REQUIRED
-> VERIFY_AGAIN
-> PERSIST_STATE
-> COMMIT_WITHOUT_FORCE
-> VERIFY_REMOTE_HEADS
-> DEPLOY_IF_EXPLICITLY_AUTHORIZED
-> VERIFY_RUNTIME_IF_DEPLOYED
-> SELECT_NEXT
```

Si un HEAD a change entre BASELINE et RECHECK_BOTH_HEADS, le write est interrompu et la tache est rebaselined sur le nouvel etat.

## Etats de preuve

`SPECIFIED -> IMPLEMENTED -> TESTED -> CONFIGURED -> ACTIVATED -> DEPLOYED -> PRODUCTION_VERIFIED`.

Aucun etat ulterieur ne se deduit automatiquement du precedent.

## Definition of Done

Un lot n'est termine que si, selon sa portee : objectif et criteres d'acceptation satisfaits ; HEAD de depart connus ; existant reutilise ; impacts analyses ; controles executes ; non-regression verifiee ; anomalies preexistantes distinguees ; donnees et conventions financieres controlees ; migration compatible si necessaire ; suivi canonique synchronise ; HEAD finaux verifies ; deploiement/runtime prouves s'ils sont declares ; prochaine action unique definie.

Un statut `BLOCKED` ou `NON VERIFIE` documente vaut mieux qu'une cloture fictive.

## Serveur S2

S2 est une cible d'execution et de verification, pas une branche de developpement independante. La cible est :

```text
GitHub canonical API HEAD      == S2 API deployed HEAD
GitHub canonical FRONTEND HEAD == S2 frontend deployed HEAD
```

Toute divergence doit etre expliquee et reconciliee avant une nouvelle evolution sensible.

## Memoire persistante

La conversation d'un agent n'est jamais la memoire canonique du projet. Le depot et `front_end_opcvm/SUIVI.md` portent la reprise. Ne pas creer un second fichier de suivi operationnel pour un agent ou un module.
