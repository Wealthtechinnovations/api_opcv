# Recalcul des derives — journal des operations

> Genere par `ops-recalc-derives.yml`. Ne pas modifier a la main.

Derniere execution : **2026-10-21 22:47 UTC**
Pays : **UEMOA** — Mode : **dry-run**
Declencheur : `workflow_dispatch` — par `Wealthtechinnovations`

```
Commit courant sur le serveur, avant mise a jour :
4acefd355 diag: les classements EUR et USD sont PROPRES — mon alerte etait fausse
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
   4acefd355..a41a4d315  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Updating 4acefd355..a41a4d315
Fast-forward
 .governance/knowledge/markdown-registry.json | 104 +++++-----
 docs/DIAG_ONDEMAND.md                        | 289 +++++++++++++--------------
 docs/ETAT_PRODUCTION_VERIFIE.md              |   4 +-
 3 files changed, 192 insertions(+), 205 deletions(-)
Commit retenu :
a41a4d315 chore(governance): certify all current Markdown [skip ci]

==============================================
 1. ETAT AVANT (dry-run) — pays : UEMOA
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = UEMOA
  Mode : DRY-RUN (aucune ecriture)
  Etapes : 3 et 4 seulement (--only-perf)
  Classements : EXCLUS
==========================================================

--- ETAT AVANT (UEMOA) ---
  Fonds actifs           : 111
  Valorisations          : 43665 (derniere : 2026-10-20)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 19
    value_USD NULL       : 19
  Lignes performences    : 1723 (derniere : 2026-09-16)
    ytd renseigne        : 1723
    perf1an renseigne    : 1723
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 75
    - [2547] FCP-1 OPTI PLACEMENT : VL 2026-10-20 / perf 2026-07-29
    - [2584] FCP SAPHIR DYNAMIQUE : VL 2026-10-20 / perf 2026-07-29
    - [2616] FCP AAM OBLIGATIS : VL 2026-10-20 / perf 2026-07-29
    - [2617] FCP AAM SERENITIS : VL 2026-10-20 / perf 2026-07-29
    - [2636] FCP SAPHIR QUIETUDE : VL 2026-10-20 / perf 2026-07-29

--- PLAN (2 etapes, dans cet ordre) ---
  1. performances locales (YTD, 1A, 3A...)
     node scripts/fix/fix_populate_performances.js --pays UEMOA --force
  2. performances EUR + USD
     node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays UEMOA --force

DRY-RUN : rien n'a ete ecrit.
Pour executer reellement, relancer avec :  --execute --confirm
Ajouter --with-classements SEULEMENT si le deplacement des rangs
des autres pays (meme categorie) est accepte.

Mode dry-run — aucune ecriture. Fin.
```
