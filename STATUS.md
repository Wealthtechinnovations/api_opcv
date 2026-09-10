# STATUS — AfricaFunds API

> Nature : photographie courante, complémentaire au `SUIVI.md` global.
> Statut : `APPLICABLE`.

## État connu au démarrage de Regulatory Plus

- Repository : `Wealthtechinnovations/api_opcv`.
- Branche canonique : `claude/code-review-improvements-ikvuj`.
- Baseline avant intégration : `cd24305db790f4c0c3f663ef1cca037978145ef6`.
- Production : S2.
- GOV-006 : mécanisme GitHub ↔ S2 ↔ runtime existant et conservé.
- Runtime : les artefacts non suivis restent soumis à classification avant nettoyage.

## Gouvernance

Le socle `00_START_HERE.md`, `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md`, `AGENTS.md` et `LOOP_ENGINEERING.md` existait avant ce lot et n’est pas remplacé.

Le présent fichier n’est pas un second `SUIVI.md`. Il doit rester une vue courte de l’état courant et être mis à jour lorsqu’un changement rend cette photographie fausse.

## Etat mesure au 2026-09-10 02:02 UTC

Source : `docs/ETAT_PRODUCTION_VERIFIE.md` (autorite `production_measured_state`).

**8/16 controles OK — 6 echecs critiques, 2 alertes.**

| Controle | Etat | Fait mesure |
|---|---|---|
| C2 | ECHEC | performances orphelines : 14 local, 23 EUR, 23 USD |
| C3 | ECHEC | 3 performances > 500 % (1141 a 143 958 %) |
| C4.NIGERIA | ECHEC | derniere VL 27 j (budget 14) |
| C4.TUNISIE | ECHEC | derniere VL 13 j (budget 9) |
| C7 | ECHEC | 15 series melangeant deux echelles, facteur ~1500 |
| C8 | ECHEC | MAROC 1.4 %, TUNISIE 6.1 %, UEMOA 32.4 % de perf a jour |
| C4.CEMAC / C6.CEMAC | ALERTE | 637 j sans VL, 0 % de benchmark — aucun pipeline |

Ces echecs sont desormais traces : `AF-REQ-011` a `AF-REQ-015`, preuve `AF-EVD-011`.

## HEAD courants

- API : `58cbefe3d4e439053b36343d4a16df5ec585a458`
- Frontend : `9cf5ddfbbeb8b595d03f1a24243d0e88b7a4d5fb`
