# NEXT_ACTION — AfricaFunds API

> Projection humaine de la task queue centrale. Une seule prochaine action exécutable.

## Action courante — AF-TASK-011

Finaliser la synchronisation et l'attestation bi-repository :

1. mettre à jour le checkpoint global frontend sans supprimer l'historique ;
2. rejouer les gates Regulatory Plus, State Coherence, Multi-Agent Resume, Markdown, Branch Policy et Secret Gate ;
3. attendre le registre Markdown durable final ;
4. réconcilier S2 API + frontend vers les HEAD GitHub finaux avec le guard GOV-006 ;
5. exécuter une dernière observation/attestation S2 (Git, PM2, DB, HTTP) ;
6. produire le verdict final.

## État désormais prouvé

```text
CONTEXT_RECONSTRUCTION = PASS
CROSS_REPO_DISCOVERY = PASS
MARKDOWN_CERTIFICATION = 242/242 (dernier registre observé)
MCP_INDEPENDENT_SSH = PASS
S2_OBSERVATION = PASS
GOV006_RECONCILIATION = PASS
API_FALLBACK_SAFE_PATH = PASS
FRONTEND_FALLBACK_SAFE_PATH = PASS
TRACKED_REAL_ENV_IN_CURRENT_GIT = NO
DB_PASSWORD_ROTATED = PASS
OLD_DB_PASSWORD_REJECTED = PASS
JWT_SECRET_ROTATED = PASS
OLD_JWT_KEY_REVOKED = PASS
```

## Gaps externes conservés

- rotation fournisseur de `EMAIL_PASSWORD` ;
- rotation fournisseur de `MAGIC_SECRET_KEY` ;
- vérification OOB indépendante de la clé hôte S2 (le pin TOFU strict fonctionne) ;
- rulesets/protection GitHub natifs non créables via la surface connector actuelle.

Ces gaps interdisent `FULLY_GOVERNED`. Si tous les contrôles internes finaux passent, le verdict cible est `GOVERNED_WITH_EXTERNAL_GAPS`.

## Interdictions

Aucun force-push, history rewrite, nouvelle branche, suppression d'untracked/UNKNOWN, secret affiché ou mutation métier opportuniste.
