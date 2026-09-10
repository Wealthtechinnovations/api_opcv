# 00_START_HERE — FundAfrica

> Statut : `APPLICABLE`
> Portee : les deux depots `Wealthtechinnovations/api_opcv` et `Wealthtechinnovations/front_end_opcvm`.
> Nature : point d'entree multi-agent. Ce fichier complete `DIRECTIVE_TRAVAIL.md`, `CLAUDE.md` et le `SUIVI.md` existants sans les remplacer.

## Finalite

FundAfrica est une seule application repartie sur deux depots Git. Aucun agent, assistant, automatisation ou outil ne doit intervenir en considerant un seul depot, une conversation, une copie locale ou le serveur comme une nouvelle verite independante.

Le socle ci-dessous est adapte de la gouvernance de `chainsolutions-wealthtech/Regulatory` a partir de `main@483da3e11c30dd0b4f2a4cee114909d512a1b426`. Seuls les mecanismes de gouvernance transversaux sont repris ; les regles metier propres a Regulatory ne s'appliquent pas a FundAfrica.

## Ordre de lecture obligatoire

Avant toute analyse ou ecriture :

1. `00_START_HERE.md`
2. `GOVERNANCE.md`
3. `SOURCE_OF_TRUTH.md`
4. `AGENTS.md`
5. `LOOP_ENGINEERING.md`
6. `DIRECTIVE_TRAVAIL.md`
7. `CLAUDE.md` des deux depots
8. `front_end_opcvm/SUIVI.md` — suivi operationnel officiel unique
9. les `README*`, `TODO.md`, `ROADMAP.md`, `CODE_REVIEW.md`, `CHANGELOG.md`, `DEPLOYMENT_PRODUCTION.md` pertinents
10. `api_opcv/docs/ETAT_PRODUCTION_VERIFIE.md` et toute mesure live disponible pour les faits de production
11. les fichiers, migrations, scripts, routes, composants et tests directement concernes
12. les HEAD, commits recents, checks et travaux en cours des deux depots.

`LOOP_ENGINEERING.md` definit COMMENT le travail gouverne est execute. Il complete mais ne remplace aucune instruction de plus haute autorite ou specifique au depot.

Le `SUIVI.md` de `api_opcv` reste un pointeur et ne devient pas un second suivi.

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

Le prefixe `claude/` est historique : la branche n'appartient pas a Claude. Elle est la branche d'integration canonique commune a tous les agents tant qu'une decision explicite du proprietaire ne la remplace pas.

## Etat FundAfrica

Un etat de reference n'est jamais un SHA unique. Il est identifie par :

```text
FUND_STATE = (
  API_HEAD,
  FRONTEND_HEAD,
  SUIVI_CHECKPOINT,
  PRODUCTION_ATTESTATION
)
```

Les deux HEAD doivent etre relus avant toute ecriture. Si l'un d'eux a change depuis la baseline de la tache, l'agent doit relire les changements intervenus, recalculer l'impact et etablir une nouvelle baseline avant d'ecrire.

## Single Writer

Plusieurs agents peuvent lire et analyser en parallele. Un seul agent peut etre ecrivain d'un lot donne a un instant donne.

Avant le premier write et avant toute suite de modifications :

- relire les deux HEAD canoniques ;
- comparer aux HEAD attendus ;
- refuser l'ecriture si le contexte est devenu obsolete ;
- ne jamais utiliser `force` pour contourner un mouvement concurrent ;
- garder le lot atomique et borne.

## Principe de modification

Toujours privilegier :

`REUTILISER -> CORRIGER -> RENFORCER -> ETENDRE -> MIGRER COMPATIBLEMENT`.

Ne jamais recreer un Fund Master, un Manager Master, une authentification, un suivi, une branche ou une architecture parallele lorsqu'une autorite existante peut etre etendue.

## Fin d'intervention

Une intervention ne peut etre declaree terminee qu'apres les controles applicables de `GOVERNANCE.md`, la boucle applicable de `LOOP_ENGINEERING.md`, la verification de non-regression, la mise a jour du suivi canonique lorsqu'elle est requise et la verification du nouvel etat distant. Une validation non executee doit etre marquee `NON VERIFIE` ou `BLOCKED`, jamais inventee.
