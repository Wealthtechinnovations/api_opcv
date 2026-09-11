# NEXT_ACTION — AfricaFunds API

> Projection humaine de la task queue centrale. Une seule action exécutable à la fois.

## Action courante — AF-TASK-006

Établir un **pin SSH S2 auditable**, puis exécuter l'observation S2 read-only sans dépendre du bridge MCP.

État déjà prouvé :

```text
AF-TASK-004 CONTEXT RECONSTRUCTION = DONE
AF-TASK-005 MARKDOWN CERTIFICATION = DONE
MULTI_AGENT_RESUME = PASS
STATE_COHERENCE = PASS
BRANCH_POLICY_CI = PASS
FRONTEND_MARKDOWN_CONTRACT = PASS
```

Le workflow `ops-s2-hostkey-bootstrap.yml` a produit un candidat de clé hôte. Aucune empreinte historique indépendante n'a été retrouvée dans Git. Si aucun canal OOB n'est accessible, le seul déblocage non aveugle permis est un **TOFU borné et explicitement classé non OOB-vérifié** : collecter une seule fois, persister le pin public, puis imposer `StrictHostKeyChecking=yes` pour toutes les connexions suivantes. Ce statut ne doit jamais être présenté comme une vérification OOB.

Après connexion read-only réussie :

1. produire `S2_OBSERVATION.json` ;
2. réobserver Git API/frontend, PM2, HTTP, DB read-only, ressources et cron ;
3. compléter AF-TASK-007 par des dry-runs sans mutation ;
4. ouvrir la remédiation AF-TASK-010 des secrets suivis à partir de la réalité S2 ;
5. ne redémarrer/déployer/rotater aucun secret tant que le lot concerné n'a pas ses propres gates.

## Blockers distincts à conserver

- `S2_HOST_KEY_NOT_OOB_VERIFIED` — déblocable par TOFU borné, mais reste à confirmer OOB ultérieurement ;
- `TRACKED_REAL_SECRETS_SECURITY_GATE` — nécessite migration runtime puis rotations ;
- `GITHUB_NATIVE_RULESETS_UNAVAILABLE_VIA_CURRENT_CONNECTOR` — la détection CI est active mais ne remplace pas l'enforcement natif ;
- `AF-OPS-001` MariaDB Restart — opération production séparée à approbation humaine.

## Interdictions

Aucun force-push, reset destructif, git clean, suppression d'artefact UNKNOWN, shell distant arbitraire, affichage de secret, nouvelle branche ou travail production sans observation réelle.
