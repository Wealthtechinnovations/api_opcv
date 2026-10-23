# Runbook — Réconciliation GitHub ↔ S2 sans régression

## Objectif

Réconcilier un dépôt AfricaFunds déployé sur S2 avec GitHub sans perdre de code, de données ou d’artefacts utiles.

Ce runbook s’applique aux deux dépôts :

- `Wealthtechinnovations/api_opcv`
- `Wealthtechinnovations/front_end_opcvm`

Branche canonique actuelle : `claude/code-review-improvements-ikvuj`.

## Interdictions de départ

Ne jamais commencer une divergence par :

```bash
git reset --hard
git clean -fd
git push --force
```

Ne jamais considérer `git pull` comme un outil de diagnostic.

## Phase A — DISCOVER

Relever séparément pour API et frontend :

- remote Git ;
- branche courante ;
- HEAD local ;
- HEAD de `origin/<branch>` ;
- HEAD GitHub frais ;
- `git status -sb` ;
- ahead/behind ;
- fichiers tracked modifiés ;
- fichiers untracked ;
- processus runtime ;
- endpoints de santé ;
- état DB read-only si pertinent.

Aucune écriture avant cette photographie.

## Phase B — RECONCILE EVIDENCE

Si divergence :

1. lister les commits exclusifs de chaque côté ;
2. lister les fichiers touchés par chaque commit ;
3. classifier code, configuration, documentation, snapshot, log, cache, données et téléchargement ;
4. identifier les modifications tracked locales ;
5. identifier les untracked ;
6. détecter les producteurs automatiques de divergence : cron, hook, script, workflow ;
7. vérifier si un autre writer est actif.

Une divergence de 100 commits ne signifie pas 100 changements fonctionnels. La classification précède toujours la décision.

## Phase C — BACKUP GATE

Avant tout repositionnement de branche :

- créer un bundle Git ou une référence de sauvegarde ;
- vérifier le bundle ;
- conserver ancien HEAD, nouveau HEAD et merge-base ;
- sauvegarder tout tracked local légitime ;
- préserver les untracked ;
- documenter le chemin de restauration.

Si un commit applicatif local n’est pas expliqué ou sauvegardé :

```text
WRITE_GATE = CLOSED
```

## Phase D — ROOT CAUSE

Ne pas seulement réaligner Git.

Si un cron ou script recrée la divergence, corriger d’abord son modèle.

Cas GOV-006 :

```text
ancien snapshotter
runtime → PRODUCTION_STATE.json → git commit/push
```

modifié vers :

```text
runtime → /var/lib/fundafrica/runtime/PRODUCTION_STATE.json
```

sans mutation Git.

## Phase E — PRÉSERVER LES ÉCARTS LÉGITIMES

Une modification locale peut être correcte.

Exemple GOV-006 frontend : `package-lock.json` contenait la même contrainte `engines.node` que `package.json` devait déjà porter. Cette correction a été remontée dans GitHub avant le fast-forward S2.

Règle :

```text
LOCAL != REMOTE
n’implique pas
LOCAL = À SUPPRIMER
```

## Phase F — RECONCILE

Choisir la méthode la moins destructive compatible avec l’état observé.

### Fast-forward

À privilégier si le serveur n’a pas de commit exclusif :

```bash
git fetch origin <branch>
git merge --ff-only origin/<branch>
```

### Repositionnement explicite

Autorisé seulement si :
- tous les commits locaux exclusifs sont classifiés ;
- aucun commit applicatif non sauvegardé n’existe ;
- un bundle Git vérifié existe ;
- les untracked sont préservés ;
- le remote cible est relu immédiatement avant mutation.

Ne pas transformer cette exception gouvernée en commande de routine.

## Phase G — VERIFY GIT

Prouver :

```text
local branch == expected canonical branch
local HEAD == fresh GitHub HEAD
ahead == 0
behind == 0
tracked working tree acceptable
untracked known or explicitly UNKNOWN/preserved
```

Un `git status` sans `ahead/behind` contre une référence locale ne remplace pas une relecture distante fraîche.

## Phase H — VERIFY RUNTIME

Contrôler selon le scope :

- PM2/services ;
- `api-monolith` ;
- `fundafrique-frontend` ;
- workers ;
- HTTP public ;
- API pertinente ;
- DB read-only ;
- cron ;
- génération du snapshot runtime.

Pour le snapshot :

```text
HEAD_before_snapshot == HEAD_after_snapshot
```

## Phase I — DOCUMENT

Mettre à jour les autorités existantes, sans créer de second système de suivi :

- `docs/governance/...` pour post-mortem/attestation ;
- `GOVERNANCE.md` pour les règles normatives ;
- `SOURCE_OF_TRUTH.md` pour les autorités ;
- `LOOP_ENGINEERING.md` pour le cycle opératoire ;
- `AGENTS.md` pour les comportements agent ;
- `front_end_opcvm/SUIVI.md` pour le checkpoint opérationnel unique.

## Phase J — POST-DOCUMENTATION ATTESTATION

Un commit documentaire avance le HEAD GitHub. Il faut donc refaire :

```text
GitHub API HEAD ↔ S2 API HEAD
GitHub FRONT HEAD ↔ S2 FRONT HEAD
runtime health
```

avant de déclarer le lot complètement terminé.

## Check-list opérateur

```text
[ ] branche canonique confirmée
[ ] remote confirmé
[ ] HEAD GitHub frais
[ ] HEAD S2 frais
[ ] commits exclusifs classifiés
[ ] tracked locaux classifiés
[ ] untracked classifiés ou préservés UNKNOWN
[ ] root cause identifiée
[ ] backup créé si repositionnement
[ ] backup vérifié
[ ] aucune commande destructive non justifiée
[ ] réalignement effectué
[ ] ahead=0 / behind=0
[ ] CI applicable verte
[ ] PM2/runtime vérifié
[ ] HTTP/API vérifié
[ ] SUIVI mis à jour
[ ] attestation post-documentation effectuée
```

## Stop conditions

Arrêter immédiatement si :

- HEAD distant change pendant l’opération ;
- un commit applicatif local inexpliqué apparaît ;
- un tracked local ne peut pas être classifié ;
- un artefact potentiellement métier devrait être supprimé pour continuer ;
- la sauvegarde échoue ;
- un test ou contrôle runtime échoue sans cause comprise ;
- une action nécessiterait force-push, destruction d’historique ou contournement d’un gate.

## Principe final

> On ne synchronise jamais d’abord pour comprendre ensuite. On observe, on classe, on sauvegarde, on corrige la cause, puis on réconcilie et on prouve le nouvel état.