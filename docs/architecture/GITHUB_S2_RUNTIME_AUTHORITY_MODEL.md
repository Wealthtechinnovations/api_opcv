# Architecture — Autorité GitHub, working tree S2 et état runtime

## Décision

Pour AfricaFunds, trois catégories d’état doivent être séparées.

### 1. État canonique

Autorité : **GitHub**.

Contient :
- code source ;
- migrations et scripts versionnés ;
- configuration non secrète ;
- contrats CI ;
- documentation canonique ;
- décisions de gouvernance ;
- historique validé.

### 2. État de déploiement

Autorité d’observation : **working tree S2**.

Il doit être une projection du code GitHub autorisé. Il ne doit jamais devenir une branche de développement autonome.

### 3. État runtime

Autorité d’observation : **runtime S2**.

Contient notamment :
- processus PM2 ;
- logs ;
- caches ;
- snapshots de production ;
- téléchargements temporaires ;
- fichiers générés ;
- données opérationnelles hors Git.

## Flux cible

```text
GitHub canonical branch
        │
        │ controlled sync/deploy
        ▼
S2 working tree
        │
        │ start/reload
        ▼
Runtime processes
        │
        ├── logs
        ├── metrics
        ├── generated snapshots
        └── runtime state
```

Le flux inverse n’est jamais un flux Git automatique :

```text
Runtime ─X─> git commit
Runtime ─X─> git push
Cron    ─X─> Git history
```

Un changement légitime découvert sur S2 doit être :
1. isolé ;
2. compris ;
3. reproduit dans le dépôt canonique par le writer autorisé ;
4. vérifié ;
5. puis redéployé.

## Identité des deux dépôts

| Rôle | Dépôt | Branche canonique |
|---|---|---|
| API | `Wealthtechinnovations/api_opcv` | `claude/code-review-improvements-ikvuj` |
| Frontend | `Wealthtechinnovations/front_end_opcvm` | `claude/code-review-improvements-ikvuj` |

Le préfixe `claude/` est historique ; il ne donne aucune exclusivité à Claude.

## État projet

AfricaFunds n’a jamais un seul SHA canonique abstrait. Son état est :

```text
FUND_STATE = (
  API_HEAD,
  FRONTEND_HEAD,
  SUIVI_CHECKPOINT,
  PRODUCTION_ATTESTATION
)
```

Une intervention peut donc être correcte côté API et obsolète côté frontend ; les deux HEAD doivent toujours être mesurés.

## Snapshot runtime

Chemin canonique live :

```text
/var/lib/fundafrica/runtime/PRODUCTION_STATE.json
```

Propriété obligatoire :

```text
HEAD_before_snapshot == HEAD_after_snapshot
```

Le fichier `api_opcv/PRODUCTION_STATE.json`, lorsqu’il existe dans Git, est un historique/fallback et non l’autorité live.

## Artefacts S2

`untracked` ne signifie pas `inutile`.

Tout artefact local doit être classé dans l’un des états :

```text
GENERATED_SAFE
LOG
CACHE
DOWNLOAD
BUSINESS_DATA
UNKNOWN
```

Seuls les artefacts explicitement classifiés peuvent être ignorés ou nettoyés selon une politique séparée.

`UNKNOWN` implique :

```text
PRESERVE
→ IDENTIFY CONTENT
→ IDENTIFY PRODUCER
→ IDENTIFY PURPOSE
→ THEN DECIDE
```

L’artefact API S2 nommé `0`, observé le 10 septembre 2026, reste `UNKNOWN` jusqu’à investigation dédiée.

## Divergence GitHub/S2

Une divergence ne se résout pas par réflexe avec `git pull`, `reset --hard`, `git clean` ou force-push.

Le chemin obligatoire est :

```text
OBSERVE
→ CLASSIFY COMMITS AND FILES
→ IDENTIFY ROOT CAUSE
→ BACKUP RECOVERABLE STATE
→ PRESERVE UNKNOWN ARTIFACTS
→ CORRECT ROOT CAUSE
→ RECONCILE
→ VERIFY REMOTE EQUALITY
→ VERIFY RUNTIME
```

## État de preuve

Les statuts suivants sont distincts :

```text
DOCUMENTED
IMPLEMENTED
TESTED
CONFIGURED
DEPLOYED
REMOTE_VERIFIED
PRODUCTION_VERIFIED
CERTIFIED
```

Aucun statut ne doit être déduit automatiquement du précédent.

## Invariant final

```text
GitHub = autorité Git
S2 working tree = projection déployée
S2 runtime = état vivant et mesuré
```

Toute évolution future doit préserver cette séparation.