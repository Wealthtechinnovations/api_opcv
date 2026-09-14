# INCIDENT_RESPONSE — AfricaFunds

## Autorité et objectif

Ce document est la politique normative de réponse aux incidents. Le registre machine canonique est `.governance/incidents/registry.json`. Il ne crée **aucune seconde task queue** : toute action corrective/préventive exécutable doit pointer vers `.governance/loop/task-queue.json`.

## Détection

Un incident peut provenir de CI, S2, PM2, DB, HTTP, contrôles C1-C8, collecte, sécurité, utilisateur ou observation humaine. Dès qu'un signal peut affecter disponibilité, intégrité financière, sécurité ou capacité d'observer la production :

```text
PRESERVE EVIDENCE
→ MEASURE IMPACT
→ ASSIGN INCIDENT ID
→ CLASSIFY SEVERITY/TYPE
→ CONTAIN MINIMALLY
→ LINK/CREATE GOVERNED TASK
→ RCA
→ PATCH THROUGH LOOP ENGINEERING
→ VERIFY
→ MONITOR RECURRENCE
→ CLOSE ONLY WITH PROOF
```

## Identifiant

`AF-INC-YYYYMMDD-NNN`. Une récurrence du même mécanisme/root issue enrichit l'incident existant quand c'est le même problème racine; elle ne crée pas artificiellement un incident isolé.

## Sévérité

- **SEV0** : compromission majeure, corruption/perte de données financières, impact critique généralisé.
- **SEV1** : indisponibilité production significative, risque élevé d'afficher des données financières fausses, contrôle d'autorité faux-vert.
- **SEV2** : service dégradé, canal d'exploitation instable, incident auth sans impact courant démontré.
- **SEV3** : impact contenu/faible.
- **SEV4** : anomalie informative sans impact.

## Type

Types usuels : `AVAILABILITY`, `DATA_INTEGRITY`, `SECURITY`, `AUTHENTICATION`, `OBSERVABILITY`, `DEPLOYMENT`, `INFRASTRUCTURE`, `EXTERNAL_DEPENDENCY`.

## Mécanisme vs cause racine

Toujours séparer :
- **mécanisme** : ce qui s'est produit (ex. `mariadbd OOM-killed`) ;
- **root cause** : pourquoi le système a permis/provoqué ce mécanisme (ex. source précise de croissance mémoire).

Statuts autorisés pour chacun : `PROVEN`, `PROBABLE`, `UNKNOWN`.

Une hypothèse ne devient jamais une cause racine par répétition.

## Récurrence

Deux occurrences partageant la même signature dans une fenêtre opérationnelle significative déclenchent `escalation_required=true`. À partir de la récurrence :
- un simple restart ne clôture plus l'incident ;
- une tâche gouvernée RCA/prévention est obligatoire ;
- les occurrences, dates et preuves sont agrégées ;
- les facteurs de résilience/observabilité sont traités séparément de la root cause.

## Cycle de vie

`DETECTED → TRIAGED → CONTAINED → MITIGATED → RCA_PENDING → CORRECTIVE_ACTION_IN_PROGRESS → VERIFYING → RESOLVED → CLOSED`.

`BLOCKED_EXTERNAL` est permis si la résolution dépend d'une autorité/fournisseur externe.

**Interdiction :** `CLOSED` exige root cause `PROVEN`, critères de fermeture vérifiés et références de preuve. Si la cause reste inconnue, l'incident reste au minimum `RCA_PENDING` ou `MITIGATED`.

## Patch et Loop Engineering

Un patch incident suit exactement le Loop Engineering normal : baseline, impact, single-writer, tests, rollback, commit, CI, déploiement gouverné si nécessaire, vérification production, persistance. Le registre doit lier :
- tâche(s) gouvernée(s) ;
- commit(s)/fichier(s) patch ;
- tests ;
- rollback ;
- preuves de vérification ;
- risques résiduels.

Un correctif urgent de containment ne dispense jamais de la tâche et du postmortem après stabilisation.

## Postmortem

Obligatoire pour SEV0/SEV1, tout incident récurrent et tout incident dont un contrôle d'autorité était faux-vert. Recommandé pour SEV2. Le postmortem est factuel, horodaté et non destructif : on ajoute les nouvelles preuves sans réécrire l'histoire.

## Secret / sécurité

Ne jamais stocker dans un rapport : mot de passe, token, clé privée, secret, hash exploitable de secret. Toute rotation est référencée par résultat et preuve, jamais par valeur.

## Fermeture

Un incident est `CLOSED` seulement si :
1. impact terminé ;
2. mécanisme et cause racine prouvés ;
3. actions correctives nécessaires terminées ;
4. tests/non-régression passés ;
5. production vérifiée si touchée ;
6. récurrence surveillée ;
7. postmortem et registre à jour ;
8. risques résiduels explicités.
