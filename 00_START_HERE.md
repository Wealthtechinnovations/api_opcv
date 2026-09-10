# 00_START_HERE — AfricaFunds

> Statut : `APPLICABLE`
> Portée : les deux dépôts `Wealthtechinnovations/api_opcv` et `Wealthtechinnovations/front_end_opcvm`.
> Nature : point d’entrée multi-agent. Ce fichier complète `DIRECTIVE_TRAVAIL.md`, `CLAUDE.md`, le `SUIVI.md` historique et les règles existantes sans les remplacer.

## Finalité

AfricaFunds est une seule application répartie sur deux dépôts Git. Aucun agent, assistant, automatisation ou outil ne doit intervenir en considérant un seul dépôt, une conversation, une copie locale ou le serveur comme une nouvelle vérité indépendante.

Le socle est adapté de la gouvernance de `chainsolutions-wealthtech/Regulatory` à partir de `main@483da3e11c30dd0b4f2a4cee114909d512a1b426`. Seuls les mécanismes transversaux de gouvernance, Loop Engineering, qualité, sécurité, mémoire et preuve sont repris ; les règles métier propres au moteur de prospectus Regulatory ne s’appliquent pas à AfricaFunds.

Les anciennes mentions `FundAfrica` et les chemins techniques historiques contenant `fundafrica` sont conservés lorsqu’ils décrivent l’histoire ou l’infrastructure réelle. Le nom produit canonique pour les nouvelles décisions et documentations est **AfricaFunds**.

## Ordre de lecture obligatoire

Avant toute analyse ou écriture :

1. `00_START_HERE.md`
2. `GOVERNANCE.md`
3. `README.md`
4. `AGENTS.md`
5. `SOURCE_OF_TRUTH.md`
6. `PROJECT_CONTEXT.md`
7. `STATUS.md`
8. `front_end_opcvm/SUIVI.md` — historique/checkpoint opérationnel global
9. `TODO.md` / `TASKS.md` pertinent selon le dépôt et la tâche
10. `NEXT_ACTION.md`
11. `LOOP_STATE.md`
12. `CURRENT_ITERATION.md`
13. `LOOP_ENGINEERING.md` et `LOOP_CONTRACT.md`
14. `WORK_LOG.md`
15. `HANDOFF.md`
16. `OPEN_QUESTIONS.md` lorsque pertinent
17. `docs/DECISIONS.md` et les ADR applicables
18. `DOCUMENT_INDEX.md`, `FILES_CATALOG.md` et `DOCUMENT_INTEGRATION_MATRIX.md` si la tâche touche la documentation/gouvernance
19. `docs/governance/GOV-006_GITHUB_S2_RECONCILIATION_2026-09-10.md`
20. `docs/architecture/GITHUB_S2_RUNTIME_AUTHORITY_MODEL.md`
21. `docs/runbooks/GITHUB_S2_RECONCILIATION_RUNBOOK.md`
22. `DIRECTIVE_TRAVAIL.md`
23. `CLAUDE.md` des deux dépôts et tout adaptateur agent pertinent
24. les `README*`, `ROADMAP.md`, `CODE_REVIEW.md`, `CHANGELOG.md`, `DEPLOYMENT_PRODUCTION.md` et documents spécialisés pertinents
25. `api_opcv/docs/ETAT_PRODUCTION_VERIFIE.md` et toute mesure live disponible pour les faits de production
26. les fichiers, migrations, scripts, routes, composants, modèles, données structurées et tests directement concernés
27. les HEAD, commits récents, checks et travaux en cours des deux dépôts.

`LOOP_ENGINEERING.md` définit COMMENT le travail gouverné est exécuté. GOV-006 définit en plus comment traiter toute divergence GitHub/S2 sans perte ni raccourci destructif.

Le `SUIVI.md` de `api_opcv` reste un pointeur/mémoire locale et ne devient pas un second suivi global.

## Rôles documentaires complémentaires

Un recouvrement de sujet n’est pas une duplication. Les rôles suivants sont distincts :

- `SUIVI.md` frontend : histoire et checkpoint global ;
- `STATUS.md` : photographie actuelle ;
- `LOOP_STATE.md` : état persistant de la boucle ;
- `CURRENT_ITERATION.md` : objectif borné en cours ;
- `WORK_LOG.md` : actions, preuves et anomalies ;
- `HANDOFF.md` : transmission ;
- `NEXT_ACTION.md` : une seule action suivante ;
- `OPEN_QUESTIONS.md` : inconnues non résolues ;
- `.governance/` : projections/identifiants structurés machine-readable selon `authority-map.json`.

Aucun de ces registres ne remplace l’historique de `SUIVI.md`.

## Branches canoniques

```text
API_REPOSITORY = Wealthtechinnovations/api_opcv
API_CANONICAL_WORK_BRANCH = claude/code-review-improvements-ikvuj

FRONTEND_REPOSITORY = Wealthtechinnovations/front_end_opcvm
FRONTEND_CANONICAL_WORK_BRANCH = claude/code-review-improvements-ikvuj

NEW_BRANCH_CREATION = FORBIDDEN
BRANCH_SWITCH = OWNER_EXPLICIT_ONLY
FORCE_PUSH = FORBIDDEN
HISTORY_REWRITE = FORBIDDEN
```

Le préfixe `claude/` est historique : la branche n’appartient pas à Claude. Elle est la branche d’intégration canonique commune à tous les agents tant qu’une décision explicite du propriétaire ne la remplace pas.

## État AfricaFunds

Un état de référence n’est jamais un SHA unique :

```text
FUND_STATE = (
  API_HEAD,
  FRONTEND_HEAD,
  SUIVI_CHECKPOINT,
  PRODUCTION_ATTESTATION
)
```

Les deux HEAD doivent être relus avant toute écriture. Si l’un a changé depuis la baseline, l’agent relit les changements, recalcule l’impact et établit une nouvelle baseline avant d’écrire.

## Single Writer

Plusieurs agents peuvent lire/analyser en parallèle. Un seul agent peut être writer d’un lot donné à un instant donné.

Avant le premier write et avant toute suite de modifications : relire les deux HEAD, comparer aux HEAD attendus, refuser l’écriture si le contexte est obsolète, ne jamais utiliser `force` pour contourner un mouvement concurrent et garder le lot atomique/borné.

## Principe de modification

Toujours privilégier :

`RÉUTILISER -> CORRIGER -> RENFORCER -> ÉTENDRE -> MIGRER COMPATIBLEMENT`.

Ne jamais recréer un Fund Master, Manager Master, authentification, suivi, branche, pipeline ou architecture parallèle lorsqu’une autorité existante peut être étendue.

Avant de créer/modifier/fusionner/déprécier un document : le lire, identifier rôle/autorité/informations uniques/consommateurs/historique et préserver toute connaissance utile. Les nouveaux chemins Regulatory Plus deviennent des adaptateurs lorsqu’un canon historique couvre déjà la fonction.

## Gate GitHub ↔ S2 issu de GOV-006

Une production saine n’est pas une preuve d’alignement Git.

Si S2 diverge de GitHub :

```text
OBSERVE
-> CLASSIFY COMMITS AND FILES
-> IDENTIFY ROOT CAUSE
-> BACKUP
-> PRESERVE UNKNOWN ARTIFACTS
-> RECONCILE
-> VERIFY FRESH REMOTE EQUALITY
-> VERIFY RUNTIME
```

Interdits comme raccourcis : `git pull` sans diagnostic, `git reset --hard`, `git clean -fd`, force-push et toute suppression d’untracked non classifié.

GitHub est l’autorité Git. S2 est une cible de déploiement et un runtime. Le snapshot live reste techniquement `/var/lib/fundafrica/runtime/PRODUCTION_STATE.json` tant que l’infrastructure n’est pas migrée ; sa génération ne doit jamais fabriquer d’historique Git autonome.

## Fin d’intervention

Une intervention n’est terminée qu’après les contrôles applicables de `GOVERNANCE.md`, la boucle `LOOP_ENGINEERING.md`, la non-régression, la persistance des registres appropriés, la mise à jour append-only du suivi global lorsque nécessaire et la vérification du nouvel état distant.

Une validation non exécutée est `NON_VERIFIE`, `NOT_RUN`, `UNKNOWN` ou `BLOCKED`, jamais inventée. Une modification documentaire qui avance un HEAD GitHub exige elle aussi une attestation GitHub ↔ S2 avant de déclarer un lot production `CERTIFIED`.