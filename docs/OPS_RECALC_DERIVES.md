# Recalcul des derives — journal des operations

> Genere par `ops-recalc-derives.yml`. Ne pas modifier a la main.

Derniere execution : **2026-10-21 22:50 UTC**
Pays : **UEMOA** — Mode : **execute**
Declencheur : `workflow_dispatch` — par `Wealthtechinnovations`

```
Commit courant sur le serveur, avant mise a jour :
a41a4d315 chore(governance): certify all current Markdown [skip ci]
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
   a41a4d315..4c1074528  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Updating a41a4d315..4c1074528
Fast-forward
 docs/OPS_RECALC_DERIVES.md | 68 ++++++++++++++++++++++++----------------------
 1 file changed, 35 insertions(+), 33 deletions(-)
Commit retenu :
4c1074528 chore(ops): recalcul derives UEMOA — dry-run 2026-10-21 22:47 UTC [skip ci]

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

==============================================
 2. RECALCUL — pays : UEMOA
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = UEMOA
  Mode : EXECUTION
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
    - [2617] FCP AAM SERENITIS : VL 2026-10-20 / perf 2026-07-29
    - [2636] FCP SAPHIR QUIETUDE : VL 2026-10-20 / perf 2026-07-29
    - [2539] FCP AAM EPARGNE ACTION : VL 2026-10-20 / perf 2026-07-29
    - [2557] FCP AAM EPARGNE CROISSANCE : VL 2026-10-20 / perf 2026-07-29
    - [2577] FCP-3 OPTI CAPITAL : VL 2026-10-20 / perf 2026-07-29

======================================================================
ETAPE 1/2 — performances locales (YTD, 1A, 3A...)
  node scripts/fix/fix_populate_performances.js --pays UEMOA --force
======================================================================
Connecte a la base fund_opcvm
Options: pays=UEMOA, force=true, mode=ECRITURE
111 fonds a traiter

  [50/111] SICAV WAFI CAPITAL (UEMOA) date=2025-10-15
  [100/111] FCP BOA OBLIGATIONS (UEMOA) date=2026-10-16
  [111/111] ATTIJARI PATRIMOINE (UEMOA) date=2026-09-04

==========================================
=== RAPPORT PEUPLAGE PERFORMANCES ===
==========================================
Appels de ratios echoues     : 0 (periode non ecrite, contenu existant preserve)
Fonds sans les 10 ratios du classement : 13 — leurs rangs de risque resteraient vides (historique < 3 ans, ou appel echoue)
Fonds traites:    108
Inseres:          73
Mis a jour:       35
Ignores:          3
Erreurs:          0

=== PAR PAYS ===
  UEMOA: 108 fonds

Termine.

[ETAPE 1] OK en 72.9s

======================================================================
ETAPE 2/2 — performances EUR + USD
  node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays UEMOA --force
======================================================================
Connecte a la base fund_opcvm
Options: devise=BOTH, pays=UEMOA, force=true
111 fonds actifs a traiter


============================================================
=== EUR — table: performences_eurs ===
============================================================

  [100/111] FCP BOA OBLIGATIONS (UEMOA) EUR date=2026-10-16
  [111/111] ATTIJARI PATRIMOINE (UEMOA) EUR date=2026-09-04

--- EUR RAPPORT ---
Fonds traites:    108
Inseres:          0
Mis a jour:       108
Ignores (a jour): 0
Sans VL EUR:      3
Erreurs:          0

Par pays:
  UEMOA: 108 fonds

============================================================
=== USD — table: performences_usds ===
============================================================

  [100/111] FCP BOA OBLIGATIONS (UEMOA) USD date=2026-10-16
  [111/111] ATTIJARI PATRIMOINE (UEMOA) USD date=2026-09-04

--- USD RAPPORT ---
Fonds traites:    108
Inseres:          0
Mis a jour:       108
Ignores (a jour): 0
Sans VL USD:      3
Erreurs:          0

Par pays:
  UEMOA: 108 fonds

============================================================
=== VERIFICATION FINALE ===
============================================================
performences_eurs: 45590 lignes, 1249 fonds
performences_usds: 45823 lignes, 1249 fonds

Termine.

[ETAPE 2] OK en 61.0s

--- ETAT APRES (UEMOA) ---
  Fonds actifs           : 111
  Valorisations          : 43665 (derniere : 2026-10-20)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 19
    value_USD NULL       : 19
  Lignes performences    : 1796 (derniere : 2026-10-20)
    ytd renseigne        : 1796
    perf1an renseigne    : 1794
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 2
    - [2564] FCP "BRM DYNAMIQUE" : VL 2014-09-08 / perf aucune
    - [2595] FCP "SDE" : VL 2014-09-05 / perf aucune

--- DELTA (UEMOA) ---
  vl_ajuste NULL       : 0 -> 0
  value_EUR NULL       : 19 -> 19
  value_USD NULL       : 19 -> 19
  Lignes performences  : 1723 -> 1796
  ytd renseigne        : 1723 -> 1796
  perf1an renseigne    : 1723 -> 1794
  Perf en retard / VL  : 75 -> 2

Termine en 2.3 min.

ATTENTION : il reste des fonds dont la perf est plus ancienne que
la derniere VL. Causes normales possibles : historique trop court
pour calculer une perf, ou fonds sans VL exploitable. A verifier
avec scripts/diag/check_dormant_funds_coverage.js.

RAPPEL : les classements/quartiles n'ont PAS ete recalcules.
Les rangs affiches restent ceux d'avant la correction.

==============================================
 3. VERIFICATION
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
  Lignes performences    : 1796 (derniere : 2026-10-20)
    ytd renseigne        : 1796
    perf1an renseigne    : 1794
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 2
    - [2564] FCP "BRM DYNAMIQUE" : VL 2014-09-08 / perf aucune
    - [2595] FCP "SDE" : VL 2014-09-05 / perf aucune

--- PLAN (2 etapes, dans cet ordre) ---
  1. performances locales (YTD, 1A, 3A...)
     node scripts/fix/fix_populate_performances.js --pays UEMOA --force
  2. performances EUR + USD
     node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays UEMOA --force

DRY-RUN : rien n'a ete ecrit.
Pour executer reellement, relancer avec :  --execute --confirm
Ajouter --with-classements SEULEMENT si le deplacement des rangs
des autres pays (meme categorie) est accepte.
```
