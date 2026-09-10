# AGENTS.md — Regles universelles FundAfrica

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
```

Le nom historique `claude/` ne confere aucune exclusivite a Claude. Tous les agents utilisent la meme ligne de verite.

## Protocole obligatoire de debut

Avant toute modification :

1. lire `00_START_HERE.md`, `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md` et `DIRECTIVE_TRAVAIL.md` ;
2. lire les deux `CLAUDE.md` ;
3. lire le `front_end_opcvm/SUIVI.md` et son POINT DE REPRISE COURANT ;
4. relever les HEAD courants des deux branches canoniques ;
5. inspecter les derniers commits intervenus ;
6. lire les fichiers et tests directement concernes ;
7. identifier l'existant a reutiliser avant toute creation ;
8. identifier les dependances API/frontend/DB/data/SEO/deployment ;
9. definir la baseline et le risque de regression ;
10. verifier qu'aucun write concurrent n'a rendu le contexte obsolete.

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

## Verification

Apres modification, executer les controles applicables : syntaxe/typecheck/lint/tests/build, routes/API/pages, calculs, data, compatibilite historique, securite et comparaison avant/apres. Une modification ecrite n'est pas automatiquement TESTED, DEPLOYED ou PRODUCTION_VERIFIED.

## Handoff

Le suivi operationnel officiel reste `front_end_opcvm/SUIVI.md`. Ne pas creer `CHATGPT_STATUS.md`, `CODEX_STATUS.md`, un second `SUIVI.md` ou toute memoire d'agent concurrente. Une conversation n'est pas une source de verite.
