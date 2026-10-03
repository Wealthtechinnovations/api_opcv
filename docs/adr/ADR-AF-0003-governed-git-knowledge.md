# ADR-AF-0003 — Système Git de connaissance gouvernée

**Statut :** Accepted — 2026-09-10.

## Décision
Git porte, en plus des documents humains, des objets machine-readable reliant exigences, critères d’acceptation, tâches, changements, tests, preuves, SHA et handoff.

Une carte d’autorité doit distinguer clairement la politique humaine normative et les registres structurés afin d’éviter une deuxième vérité concurrente.

## Invariant
Une tâche ne peut être déclarée `DONE` si les preuves requises ou son point de reprise ne sont pas persistés.