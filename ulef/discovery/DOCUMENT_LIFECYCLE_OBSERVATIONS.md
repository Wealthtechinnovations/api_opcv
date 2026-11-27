# Observations B01 — cycle documentaire AfricaFunds

Audit documentaire direct : 251/251 chemins Markdown présents correspondent aux git_blob_sha du registre .governance/knowledge/markdown-registry.json, aucun manquant ni différent, sur API eae81c5db5a4d46f3741ab6fa2922017aa2215eb et frontend 1640ad2277cb913b53782ca0a428a0b9ca44e4a6. Le registre référence un HEAD API antérieur 356bf86aeeb77615b6d71b75a63241b4173d2c52, sans divergence des blobs Markdown observés. L'audit Markdown 46003559055 est SUCCESS le 27/11 à 13:01:43 UTC; contrat frontend 45883714648 SUCCESS; Programme Director 45944313431 SUCCESS. Ces preuves ne certifient pas la vérité métier ni runtime. LOOP_STATE.md juxtapose la projection AF-TASK-028 et une section dite actuelle AF-TASK-026: candidat à qualification, pas correction automatique. Les six projections gérées proviennent des autorités JSON; writeback manuel dry-run/apply-local, sans push; SUIVI 25/11 atteste gate writer fermé et autonomie non certifiée. Proposition : PROJECT_CONTEXT reste index d'identité, vision/périmètre, constitution N0/N1, références et autorités, règles de consommation et évolution; état volatil reste dans STATUS/SUIVI/queue, liens plutôt que duplications. Réutiliser registre Markdown existant, distinguer couverture, actualité sémantique, cohérence et preuve runtime. B01 collecte les faits et mécanismes; B02 réconcilie; aucune mutation canonique.

## Sources et mécanismes existants

- `.governance/knowledge/markdown-registry.json` : 251 entrées, 21 CURRENT_CANONICAL, 199 CURRENT_SPECIALIZED, 7 ADAPTER, 5 TEMPLATE, 3 HISTORICAL, 3 DIAGNOSTIC_SNAPSHOT, 13 CONDITIONAL. Registre déclare zéro autorité orpheline et contradiction critique selon son audit déterministe.
- `.governance/knowledge/authority-map.json` : 19 domaines ; `DOCUMENTATION_POLICY.md` et `SOURCE_OF_TRUTH.md` régissent les rôles et contradictions.
- `.github/workflows/governance-markdown-audit.yml` : push Markdown, cron minute 37 UTC, manuel, audit des deux dépôts, persistance du registre sous garde HEAD API.
- Frontend `.github/workflows/governance-markdown-contract.yml` : contrôle lors des changements Markdown et manuel, artefact lecture seule.
- `.github/workflows/doc-drift.yml` : contrôle production planifié 06:00 UTC, exécution récente non attestée dans cet échantillon.
- `program_projection_generator.py` lit project, queue, state, handoff; génère six blocs ciblés (NEXT_ACTION, CURRENT_ITERATION, LOOP_STATE, HANDOFF, STATUS API, SUIVI frontend). PROJECT_CONTEXT n'est pas parmi ces six.
- `governance-programme-projection-writeback.yml` : dry-run/apply-local explicite sans push.

## Proposition de cycle

Lire les autorités → qualifier les changements → mettre à jour l'autorité concernée → régénérer les projections pertinentes → conserver l'historique → contrôler les liens, empreintes et cohérence → vérifier les preuves métier/runtime lorsque pertinent → persister le checkpoint. Ne pas réécrire tous les Markdown pour un changement sans impact. Les documents historiques restent datés. B01 relève et conserve; B02 réconcilie. Aucun changement de code ni de documents canoniques effectué.
