# AGENTS.md — Regles universelles AfricaFunds

> S'applique a Claude, ChatGPT, Codex, Copilot, Gemini, agents MCP, automatisations et tout autre intervenant.
> Complete les `CLAUDE.md` existants ; ne les remplace pas.

## Contrat canonique

```text
API_BRANCH = claude/code-review-improvements-ikvuj
FRONTEND_BRANCH = claude/code-review-improvements-ikvuj
NEW_BRANCH_CREATION = FORBIDDEN
FORCE_PUSH = FORBIDDEN
SINGLE_WRITER = REQUIRED
READ_EXISTING_BEFORE_CREATE = REQUIRED
ZERO_REGRESSION = REQUIRED
VERIFY_BEFORE_WRITE = REQUIRED
VERIFY_AFTER_WRITE = REQUIRED
S2_IS_RUNTIME_NOT_GIT_AUTHORITY = REQUIRED
CLASSIFY_BEFORE_RECONCILE = REQUIRED
PRESERVE_UNKNOWN_UNTRACKED = REQUIRED
CONTEXT_RECONSTRUCTION_BEFORE_WORK = REQUIRED
CROSS_REPO_DISCOVERY = REQUIRED
NO_BLIND_WORK = REQUIRED
WORK_GATE_REQUIRES_CONTEXT_PASS = TRUE
```

Le nom historique `claude/` ne confere aucune exclusivite a Claude. Tous les agents utilisent la meme ligne de verite.

## Protocole obligatoire de debut

Avant toute modification :

1. lire `00_START_HERE.md`, `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md` et `DIRECTIVE_TRAVAIL.md` ;
2. lire `LOOP_ENGINEERING.md` et, pour toute tache touchant S2/prod, `docs/governance/GOV-006_GITHUB_S2_RECONCILIATION_2026-09-10.md` + le runbook associe ;
3. lire les deux `CLAUDE.md` ;
4. lire le `front_end_opcvm/SUIVI.md` et son POINT DE REPRISE COURANT ;
5. relever les HEAD courants des deux branches canoniques ;
6. inspecter les derniers commits intervenus ;
7. lire les fichiers et tests directement concernes ;
8. identifier l'existant a reutiliser avant toute creation ;
9. identifier les dependances API/frontend/DB/data/SEO/deployment ;
10. definir la baseline et le risque de regression ;
11. verifier qu'aucun write concurrent n'a rendu le contexte obsolete.

## Continuite obligatoire

Il est interdit de creer une seconde architecture, un second modele canonique, un second suivi, une seconde authentification, une table dupliquee ou un composant concurrent lorsqu'une autorite existante peut etre etendue.

Pour toute evolution : `REUTILISER -> CORRIGER -> RENFORCER -> ETENDRE -> MIGRER COMPATIBLEMENT`.

## Single Writer

Les lectures paralleles sont autorisees. Les ecritures doivent etre serialisees.

L'agent capture `(API_HEAD, FRONTEND_HEAD)` au debut. Juste avant d'ecrire, il les relit. Si un HEAD a change, il doit interrompre le write, lire les changements intervenus et rebaseliner sa tache. Aucun `force` ne peut contourner cette regle.

## Lots atomiques

Chaque intervention doit avoir un objectif borne, des fichiers/objets identifies, des controles prevus et une prochaine action unique. Les ameliorations opportunistes non necessaires au lot sont consignees mais ne sont pas melees au diff.

## Donnees et finance

Ne jamais inventer une donnee, un benchmark, une performance, une categorie, une devise, une date, un taux ou un resultat de calcul. Une donnee manquante reste manquante. Une anomalie doit etre qualifiee avant utilisation. Les conventions quantitatives validees ne sont jamais modifiees silencieusement.

## Base de donnees et production

Toute tache sensible DB/migration/prod/cron/auth/secrets/PM2/calcul financier commence par un diagnostic. Les migrations doivent etre additives sauf decision explicite contraire. S2 ne devient jamais une autorite de developpement parallele. Aucun deployement, restart, migration destructive ou ecriture de production n'est deduit d'une autorisation de coder.

## Comportement obligatoire en cas de divergence S2 — GOV-006

Un agent ne doit jamais inferer qu'une difference serveur est jetable.

Avant toute mutation visant a realigner S2 :

1. observer API et frontend separement ;
2. confirmer remotes, branche et HEAD ;
3. relever `(API_HEAD, FRONTEND_HEAD)` GitHub et S2 ;
4. classifier les commits exclusifs ;
5. classifier les fichiers tracked modifies ;
6. classifier ou preserver les untracked ;
7. identifier cron/script/hook/workflow pouvant recreer la divergence ;
8. conserver toute modification locale legitime en la remontant vers GitHub ;
9. creer et verifier une sauvegarde avant tout repositionnement lorsque des commits locaux exclusifs existent ;
10. realigner seulement apres correction de la cause ;
11. verifier GitHub ↔ S2 ↔ runtime apres l'operation.

Interdits comme raccourcis :

```text
git reset --hard
git clean -fd
git push --force
suppression d'untracked UNKNOWN
```

Le snapshot live `/var/lib/fundafrica/runtime/PRODUCTION_STATE.json` est un artefact runtime. Sa generation ne doit jamais produire de commit Git.

L'artefact API S2 `0`, observe le 2026-09-10, reste `UNKNOWN` jusqu'a classification et doit etre preserve.

## Verification

Apres modification, executer les controles applicables : syntaxe/typecheck/lint/tests/build, routes/API/pages, calculs, data, compatibilite historique, securite et comparaison avant/apres. Une modification ecrite n'est pas automatiquement TESTED, DEPLOYED ou PRODUCTION_VERIFIED.

Une modification documentaire de gouvernance qui avance un HEAD doit etre incluse dans la prochaine attestation GitHub ↔ S2 avant de declarer le lot `CERTIFIED`.

## Handoff

Le suivi operationnel officiel reste `front_end_opcvm/SUIVI.md`. Ne pas creer `CHATGPT_STATUS.md`, `CODEX_STATUS.md`, un second `SUIVI.md` ou toute memoire d'agent concurrente. Une conversation n'est pas une source de verite.


## Gate de nouvelle session

Avant toute écriture, tout agent doit reconstruire le contexte depuis Git : identifier AfricaFunds, découvrir automatiquement l'autre repository via `.governance/project.json` / `.governance/repository.json`, vérifier les default/canonical branches et les deux HEAD, lire les registres de reprise et reconstruire `FUND_STATE`. La conversation précédente ne peut pas être une dépendance.

Si une tâche dépend de production, observer S2/runtime avant décision. Bridge MCP disponible : utiliser le canal nominal. Bridge MCP indisponible : utiliser le fallback GitHub Actions → SSH S2 en lecture/diagnostic gouverné. En l'absence de preuve serveur, l'état vaut `UNKNOWN/NOT_ATTESTED`, jamais `OK` supposé.
