# ADR-AF-0002 — Mémoire opérationnelle structurée et Loop Engineering

**Statut :** Accepted — 2026-09-10.

## Décision
Conserver `SUIVI.md` frontend comme historique/checkpoint global et ajouter des vues complémentaires : `STATUS`, `LOOP_STATE`, `CURRENT_ITERATION`, `WORK_LOG`, `HANDOFF`, `NEXT_ACTION`, `OPEN_QUESTIONS`.

Ces documents ne se recopient pas et ne remplacent pas `SUIVI.md`.

Loop Engineering orchestre leur mise à jour et impose une seule prochaine action à la fin de chaque boucle.

## Motivation
Réduire la dépendance à la conversation ou à un agent particulier et permettre une reprise déterministe depuis Git.