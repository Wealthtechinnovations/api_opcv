# Recalcul des derives — journal des operations

> Genere par `ops-recalc-derives.yml`. Ne pas modifier a la main.

Derniere execution : **2026-10-21 23:01 UTC**
Pays : **TUNISIE** — Mode : **execute**
Declencheur : `workflow_dispatch` — par `Wealthtechinnovations`

```
Commit courant sur le serveur, avant mise a jour :
4c1074528 chore(ops): recalcul derives UEMOA — dry-run 2026-10-21 22:47 UTC [skip ci]
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
   4c1074528..98fe2cc0d  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Updating 4c1074528..98fe2cc0d
Fast-forward
 docs/OPS_RECALC_DERIVES.md | 197 ++++++++++++++++++++++++++++++++++++++++++---
 1 file changed, 186 insertions(+), 11 deletions(-)
Commit retenu :
98fe2cc0d chore(ops): recalcul derives UEMOA — execute 2026-10-21 22:50 UTC [skip ci]

==============================================
 1. ETAT AVANT (dry-run) — pays : TUNISIE
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = TUNISIE
  Mode : DRY-RUN (aucune ecriture)
  Etapes : 3 et 4 seulement (--only-perf)
  Classements : EXCLUS
==========================================================

--- ETAT AVANT (TUNISIE) ---
  Fonds actifs           : 131
  Valorisations          : 312597 (derniere : 2026-10-21)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 0
    value_USD NULL       : 0
  Lignes performences    : 3528 (derniere : 2026-10-16)
    ytd renseigne        : 3528
    perf1an renseigne    : 3528
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 126
    - [2432] SICAV LEPARGNANT : VL 2026-10-21 / perf 2026-05-18
    - [2480] FCP INNOVATION : VL 2026-10-21 / perf 2026-05-18
    - [2528] FCP PROSPER + CEA : VL 2026-10-21 / perf 2026-05-18
    - [2448] MAC CROISSANCE FCP : VL 2026-10-21 / perf 2026-05-18
    - [2496] FCP BNA CAPITALISATION : VL 2026-10-21 / perf 2026-05-18

--- PLAN (2 etapes, dans cet ordre) ---
  1. performances locales (YTD, 1A, 3A...)
     node scripts/fix/fix_populate_performances.js --pays TUNISIE --force
  2. performances EUR + USD
     node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays TUNISIE --force

DRY-RUN : rien n'a ete ecrit.
Pour executer reellement, relancer avec :  --execute --confirm
Ajouter --with-classements SEULEMENT si le deplacement des rangs
des autres pays (meme categorie) est accepte.

==============================================
 2. RECALCUL — pays : TUNISIE
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = TUNISIE
  Mode : EXECUTION
  Etapes : 3 et 4 seulement (--only-perf)
  Classements : EXCLUS
==========================================================

--- ETAT AVANT (TUNISIE) ---
  Fonds actifs           : 131
  Valorisations          : 312597 (derniere : 2026-10-21)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 0
    value_USD NULL       : 0
  Lignes performences    : 3528 (derniere : 2026-10-16)
    ytd renseigne        : 3528
    perf1an renseigne    : 3528
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 126
    - [2426] SICAV AVENIR : VL 2026-10-21 / perf 2026-05-18
    - [2474] FCP AXIS PLACEMENT EQUILIBRE : VL 2026-10-21 / perf 2026-05-18
    - [2522] UBCI - FCP CEA : VL 2026-10-21 / perf 2026-05-18
    - [2442] UNION FINANCIERE HANNIBAL SICAV : VL 2026-10-21 / perf 2026-05-18
    - [2490] TUNISIAN PRUDENCE FUND : VL 2026-10-21 / perf 2026-05-18

======================================================================
ETAPE 1/2 — performances locales (YTD, 1A, 3A...)
  node scripts/fix/fix_populate_performances.js --pays TUNISIE --force
======================================================================
Connecte a la base fund_opcvm
Options: pays=TUNISIE, force=true, mode=ECRITURE
131 fonds a traiter

  [50/131] FCP MAGHREBIA PRUDENCE (TUNISIE) date=2026-10-21
  [100/131] AMEN ALLIANCE SICAV (TUNISIE) date=2026-10-21
  [131/131] FCP VALEURS MONETAIRE (TUNISIE) date=2026-10-21

==========================================
=== RAPPORT PEUPLAGE PERFORMANCES ===
==========================================
Appels de ratios echoues     : 0 (periode non ecrite, contenu existant preserve)
Fonds sans les 10 ratios du classement : 13 — leurs rangs de risque resteraient vides (historique < 3 ans, ou appel echoue)
Fonds traites:    131
Inseres:          126
Mis a jour:       5
Ignores:          0
Erreurs:          0

=== PAR PAYS ===
  TUNISIE: 131 fonds

Termine.

[ETAPE 1] OK en 297.5s

======================================================================
ETAPE 2/2 — performances EUR + USD
  node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays TUNISIE --force
======================================================================
Connecte a la base fund_opcvm
Options: devise=BOTH, pays=TUNISIE, force=true
131 fonds actifs a traiter


============================================================
=== EUR — table: performences_eurs ===
============================================================

  [100/131] AMEN ALLIANCE SICAV (TUNISIE) EUR date=2026-10-21
  [131/131] FCP VALEURS MONETAIRE (TUNISIE) EUR date=2026-10-21

--- EUR RAPPORT ---
Fonds traites:    131
Inseres:          0
Mis a jour:       131
Ignores (a jour): 0
Sans VL EUR:      0
Erreurs:          0

Par pays:
  TUNISIE: 131 fonds

============================================================
=== USD — table: performences_usds ===
============================================================

  [100/131] AMEN ALLIANCE SICAV (TUNISIE) USD date=2026-10-21
  [131/131] FCP VALEURS MONETAIRE (TUNISIE) USD date=2026-10-21

--- USD RAPPORT ---
Fonds traites:    131
Inseres:          0
Mis a jour:       131
Ignores (a jour): 0
Sans VL USD:      0
Erreurs:          0

Par pays:
  TUNISIE: 131 fonds

============================================================
=== VERIFICATION FINALE ===
============================================================
performences_eurs: 45590 lignes, 1249 fonds
performences_usds: 45823 lignes, 1249 fonds

Termine.

[ETAPE 2] OK en 208.8s

--- ETAT APRES (TUNISIE) ---
  Fonds actifs           : 131
  Valorisations          : 312597 (derniere : 2026-10-21)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 0
    value_USD NULL       : 0
  Lignes performences    : 3654 (derniere : 2026-10-21)
    ytd renseigne        : 3654
    perf1an renseigne    : 3652
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 0

--- DELTA (TUNISIE) ---
  vl_ajuste NULL       : 0 -> 0
  value_EUR NULL       : 0 -> 0
  value_USD NULL       : 0 -> 0
  Lignes performences  : 3528 -> 3654
  ytd renseigne        : 3528 -> 3654
  perf1an renseigne    : 3528 -> 3652
  Perf en retard / VL  : 126 -> 0

Termine en 9.0 min.

RAPPEL : les classements/quartiles n'ont PAS ete recalcules.
Les rangs affiches restent ceux d'avant la correction.

==============================================
 3. VERIFICATION
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = TUNISIE
  Mode : DRY-RUN (aucune ecriture)
  Etapes : 3 et 4 seulement (--only-perf)
  Classements : EXCLUS
==========================================================

--- ETAT AVANT (TUNISIE) ---
  Fonds actifs           : 131
  Valorisations          : 312597 (derniere : 2026-10-21)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 0
    value_USD NULL       : 0
  Lignes performences    : 3654 (derniere : 2026-10-21)
    ytd renseigne        : 3654
    perf1an renseigne    : 3652
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 0

--- PLAN (2 etapes, dans cet ordre) ---
  1. performances locales (YTD, 1A, 3A...)
     node scripts/fix/fix_populate_performances.js --pays TUNISIE --force
  2. performances EUR + USD
     node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays TUNISIE --force

DRY-RUN : rien n'a ete ecrit.
Pour executer reellement, relancer avec :  --execute --confirm
Ajouter --with-classements SEULEMENT si le deplacement des rangs
des autres pays (meme categorie) est accepte.
```
