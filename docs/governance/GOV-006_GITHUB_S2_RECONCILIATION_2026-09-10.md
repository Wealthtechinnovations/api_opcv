# GOV-006 — Réconciliation GitHub ↔ S2 et séparation de l’autorité runtime

**Projet :** AfricaFunds / FundAfrica  
**Date :** 10 septembre 2026  
**Portée :** `Wealthtechinnovations/api_opcv` + `Wealthtechinnovations/front_end_opcvm`  
**Branche canonique :** `claude/code-review-improvements-ikvuj`

> Ce document est le post-mortem canonique de GOV-006. Il explique la divergence GitHub/S2, sa cause racine, les preuves obtenues, la méthode de réconciliation, les sauvegardes, les règles de non-régression et les conditions de clôture.

## 1. Objectif

GOV-006 devait prouver qu’AfricaFunds pouvait être ramené à une seule autorité Git sans perdre de code, de données ou d’artefacts utiles, avant toute nouvelle évolution sensible telle que `INST-001`.

La cible est :

```text
GitHub API HEAD      == S2 API HEAD
GitHub FRONTEND HEAD == S2 FRONTEND HEAD
runtime               == healthy
```

## 2. Autorités réelles

| Rôle | Autorité |
|---|---|
| Backend versionné | `Wealthtechinnovations/api_opcv` |
| Frontend versionné | `Wealthtechinnovations/front_end_opcvm` |
| Branche canonique des deux repos | `claude/code-review-improvements-ikvuj` |
| État opérationnel | `front_end_opcvm/SUIVI.md` |
| Runtime | S2 / `africafunds.chainsolutions.fr` |
| Snapshot live | `/var/lib/fundafrica/runtime/PRODUCTION_STATE.json` |

Le préfixe `claude/` est historique ; il ne signifie pas que la branche appartient exclusivement à Claude.

## 3. Incident découvert côté API

L’API S2 présentait **854 commits locaux exclusifs**. Une classification exhaustive a établi :

```text
854 / 854 commits = modification de PRODUCTION_STATE.json uniquement
0 / 854 commit     = modification de code applicatif local
```

Cette preuve a permis d’écarter le scénario le plus dangereux : aucun lot applicatif Claude n’était enfermé uniquement dans ces 854 commits.

### Cause racine

L’ancien `scripts/deploy/sync_production.sh`, exécuté périodiquement par cron, couplait mesure runtime et Git :

```text
mesure production
→ écriture PRODUCTION_STATE.json
→ git add
→ git commit
→ git push
```

Lorsque le push ne conservait pas l’alignement attendu, S2 accumulait son propre historique local.

Ce modèle est désormais interdit :

```text
S2 = runtime / cible de déploiement
S2 != seconde autorité Git
```

## 4. Correction structurelle

Le snapshot live est maintenant destiné à :

```text
/var/lib/fundafrica/runtime/PRODUCTION_STATE.json
```

Le producteur de snapshot ne doit plus exécuter de mutation Git (`git add`, `git commit`, `git push`, `git pull`, `git reset`, `git checkout`).

Le diagnostic `scripts/diag/check_doc_drift.js` a été rendu backward-compatible : il lit d’abord le snapshot runtime, puis peut utiliser l’ancien fichier historique du dépôt comme fallback.

Invariant permanent :

```text
HEAD_before_snapshot == HEAD_after_snapshot
```

## 5. Sauvegarde avant réalignement

Avant de repositionner la branche locale API, une sauvegarde a été créée pendant GOV-006 sous :

```text
/var/backups/fundafrica-governance/20260910T020803Z
```

avec notamment :

```text
api/local-branch-before.bundle
```

Le `git bundle verify` avait réussi pendant l’opération. L’ancienne pointe locale enregistrée était :

```text
cbcaf66966ba54e2ba52c7f3ea76140733278078
```

Une restauration future doit d’abord revalider physiquement la présence et l’intégrité du bundle.

## 6. Réalignement API

Aucun `git reset --hard`, `git clean -fd` ni force-push n’a été utilisé pour produire la réconciliation.

Après classification des 854 commits et création du bundle, la branche locale a été repositionnée explicitement sur le SHA distant, sans suppression des untracked.

Les répertoires suivants ont été volontairement préservés :

```text
data/datejour_snapshots/
data/naira_snapshots/
data/scale_break_snapshots/
sec_ng_downloads/
```

Une observation ultérieure a également révélé :

```text
?? 0
```

L’artefact non suivi `0` reste `UNKNOWN`. Il est interdit de le supprimer, de l’ignorer automatiquement ou de le committer avant classification de son contenu, sa taille, son producteur et sa fonction.

## 7. Frontend : package-lock et logs MCP

Le frontend S2 présentait :

```text
package-lock.json modifié
.mcp_logs/ non suivi
```

Le diff du lockfile était légitime : `package.json` imposait déjà `node >=18.17.0`, alors que la racine du lockfile ne le reflétait pas encore. Cette correction a été préservée dans le canon GitHub, au lieu d’être écrasée.

`.mcp_logs/` a été classé comme log local non canonique et ajouté au `.gitignore`; les logs existants n’ont pas été supprimés.

## 8. Contrôles ajoutés

Les contrôles GOV-006 comprennent notamment :

- `bash -n scripts/deploy/sync_production.sh` ;
- `node --check scripts/diag/check_doc_drift.js` ;
- contrôle CI empêchant le retour de commandes Git mutantes dans le snapshotter ;
- `governance-contract` inter-repository ;
- attestation S2 read-only ;
- workflow de réconciliation S2 sauvegardé et borné ;
- vérification de cohérence `package.json` / `package-lock.json`.

Un premier workflow package-lock a échoué à cause de sa syntaxe YAML/heredoc. Il a été diagnostiqué puis corrigé ; l’échec n’a pas été ignoré ni requalifié en succès.

## 9. Résultat de la réconciliation

Pendant GOV-006, les deux working trees ont été ramenés à une absence d’ahead/behind contre leurs références suivies, puis vérifiés par les outils S2.

À la reprise documentaire du 10 septembre 2026 :

```text
API S2 HEAD
723f893da2d6925b03cd1c81c9a91b6440ddaacf

FRONTEND S2 HEAD
edd597b18e5879667152c92164226437a259f42b
```

Une relecture GitHub fraîche a ensuite confirmé, avant le lot documentaire, que les branches GitHub étaient **identiques** à ces deux SHA (`ahead_by=0`, `behind_by=0`).

## 10. Runtime observé

Après réconciliation, les processus importants observés étaient online, notamment :

```text
api-monolith
fundafrique-frontend
worker-data-import
worker-recalculation
```

Le domaine public `https://africafunds.chainsolutions.fr` a également été observé en HTTP 200 pendant les contrôles GOV-006.

Une divergence de version PM2 a été observée (`in-memory 6.0.14`, local 6.0.13). Elle est classée comme maintenance distincte et n’a pas été corrigée opportunistement dans GOV-006.

## 11. Santé DB observée pendant GOV-006

Une lecture SQL read-only avait notamment retourné :

```text
fonds                 2985
sociétés de gestion   1915
valorisations         798462
```

Ces comptages attestent une lecture DB fonctionnelle à cet instant ; ils ne constituent pas une certification de qualité complète des données.

## 12. Règles normatives issues de GOV-006

1. GitHub est la seule autorité Git canonique.
2. S2 est un runtime et une cible de déploiement, pas une seconde branche de développement.
3. Aucun cron de production ne doit `git commit` ou `git push` automatiquement.
4. Les snapshots runtime sont stockés hors du working tree Git ou explicitement classés non canoniques.
5. Aucun `reset --hard`, `git clean` ou force-push ne peut être utilisé avant classification et sauvegarde des différences locales.
6. Tout commit local exclusif doit être classifié avant réalignement.
7. Tout changement légitime découvert sur S2 doit être remonté dans GitHub avant synchronisation ; il ne doit pas être écrasé.
8. `untracked` ne signifie jamais `inutile`.
9. L’état FundAfrica est toujours un couple `API_SHA + FRONTEND_SHA`, complété par le checkpoint SUIVI et l’attestation production.
10. Toute modification documentaire canonique avance le HEAD et exige donc une nouvelle attestation post-documentation.

## 13. S2 divergence gate

Toute divergence suit obligatoirement :

```text
OBSERVE
→ CLASSIFY
→ IDENTIFY ROOT CAUSE
→ BACKUP
→ PRESERVE UNKNOWN ARTIFACTS
→ CORRECT ROOT CAUSE
→ RECONCILE
→ VERIFY FRESH REMOTE EQUALITY
→ VERIFY RUNTIME
```

Jamais :

```text
divergence
→ git pull/reset/clean/force
→ espérer que cela fonctionne
```

## 14. Critère de clôture GOV-006

GOV-006 est `CERTIFIED` seulement lorsque :

- cette documentation est committée ;
- le `SUIVI.md` canonique est mis à jour ;
- les HEAD GitHub API et frontend sont relus après les commits documentaires ;
- S2 est réaligné sur ces nouveaux HEAD ;
- API S2 = API GitHub ;
- frontend S2 = frontend GitHub ;
- les contrôles de gouvernance applicables sont verts ;
- runtime et HTTP AfricaFunds sont vérifiés ;
- aucun artefact `UNKNOWN` n’est détruit pour obtenir la certification.

Jusqu’à cette dernière attestation, le statut exact est :

```text
TECHNICALLY_RECONCILED / DOCUMENTATION_CLOSURE_IN_PROGRESS
```

## 15. Point de reprise

Le prochain agent doit relire ce document avant toute évolution sensible, observer les deux HEAD GitHub et S2, classifier tout nouvel écart, puis seulement sélectionner la prochaine tâche.

`INST-001` ne doit être considéré ouvert qu’après clôture formelle de GOV-006 dans le suivi canonique et attestation finale post-documentation.
