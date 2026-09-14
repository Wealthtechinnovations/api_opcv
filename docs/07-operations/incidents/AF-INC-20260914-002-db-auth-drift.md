# AF-INC-20260914-002 — DB auth drift post-rotation

**Statut : RCA_PENDING — SEV2**

## Faits
Des `Access denied` exacts pour `fund_opcvm@localhost` existent avant le restart MariaDB du 2026-09-14. Après recovery, les compteurs server-wide restent non attribuables précisément.

## État courant observé
DB SELECT PASS, sessions authentifiées présentes, PM2 online, HTTP public 200. Aucun stale process/env/cron/workflow AfricaFunds courant n'a été prouvé.

## Root cause — UNKNOWN
La télémétrie disponible ne permet pas d'attribuer les échecs historiques/post-restart à un exécutable précis. Une nouvelle rotation ou un restart serait injustifié sans preuve.

## Action
`AF-OPS-005` : améliorer l'attribution future des refus, sans exposer les secrets ni perturber le runtime sain.
