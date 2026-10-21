# Recalcul des derives — journal des operations

> Genere par `ops-recalc-derives.yml`. Ne pas modifier a la main.

Derniere execution : **2026-10-21 23:58 UTC**
Pays : **MAROC** — Mode : **execute**
Declencheur : `workflow_dispatch` — par `Wealthtechinnovations`

```
Commit courant sur le serveur, avant mise a jour :
98fe2cc0d chore(ops): recalcul derives UEMOA — execute 2026-10-21 22:50 UTC [skip ci]
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
   98fe2cc0d..c661ef25c  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Updating 98fe2cc0d..c661ef25c
Fast-forward
 docs/OPS_RECALC_DERIVES.md | 209 ++++++++++++++++++++++-----------------------
 1 file changed, 100 insertions(+), 109 deletions(-)
Commit retenu :
c661ef25c chore(ops): recalcul derives TUNISIE — execute 2026-10-21 23:01 UTC [skip ci]

==============================================
 1. ETAT AVANT (dry-run) — pays : MAROC
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = MAROC
  Mode : DRY-RUN (aucune ecriture)
  Etapes : 3 et 4 seulement (--only-perf)
  Classements : EXCLUS
==========================================================

--- ETAT AVANT (MAROC) ---
  Fonds actifs           : 645
  Valorisations          : 569796 (derniere : 2026-10-20)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 1
    value_USD NULL       : 1
  Lignes performences    : 71985 (derniere : 2026-10-16)
    ytd renseigne        : 71985
    perf1an renseigne    : 71985
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 625
    - [968] CDG INSTITUTIONS : VL 2026-10-20 / perf 2026-05-18
    - [625] TWIN TREASURY : VL 2026-10-20 / perf 2026-05-18
    - [2737] STERLING SECUR RENDEMENT : VL 2026-10-20 / perf 2026-05-18
    - [1016] CAP MONETAIRE PREMIERE : VL 2026-10-20 / perf 2026-05-18
    - [1556] FCP MAROGEST BONDS : VL 2026-10-20 / perf 2026-05-18

--- PLAN (2 etapes, dans cet ordre) ---
  1. performances locales (YTD, 1A, 3A...)
     node scripts/fix/fix_populate_performances.js --pays MAROC --force
  2. performances EUR + USD
     node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays MAROC --force

DRY-RUN : rien n'a ete ecrit.
Pour executer reellement, relancer avec :  --execute --confirm
Ajouter --with-classements SEULEMENT si le deplacement des rangs
des autres pays (meme categorie) est accepte.

==============================================
 2. RECALCUL — pays : MAROC
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = MAROC
  Mode : EXECUTION
  Etapes : 3 et 4 seulement (--only-perf)
  Classements : EXCLUS
==========================================================

--- ETAT AVANT (MAROC) ---
  Fonds actifs           : 645
  Valorisations          : 569796 (derniere : 2026-10-20)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 1
    value_USD NULL       : 1
  Lignes performences    : 71985 (derniere : 2026-10-16)
    ytd renseigne        : 71985
    perf1an renseigne    : 71985
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 625
    - [609] UPLINE RETAIL SERENITE PLUS : VL 2026-10-20 / perf 2026-05-18
    - [2723] QUANTUM OPTIMUM CROISSANCE : VL 2026-10-20 / perf 2026-05-15
    - [743] FCP OCT DYNAMIQUE : VL 2026-10-20 / perf 2026-05-18
    - [872] EMERGENCE MONEY MARKET FUND : VL 2026-10-20 / perf 2026-05-18
    - [1002] CAPITAL TRUST BONDS : VL 2026-10-20 / perf 2026-05-18

======================================================================
ETAPE 1/2 — performances locales (YTD, 1A, 3A...)
  node scripts/fix/fix_populate_performances.js --pays MAROC --force
======================================================================
Connecte a la base fund_opcvm
Options: pays=MAROC, force=true, mode=ECRITURE
645 fonds a traiter

  [50/645] TWIN CASH (MAROC) date=2026-10-20
  [100/645] PATRIMOINE OBLIGATIONS (MAROC) date=2026-10-20
  [150/645] FCP UPLINE CAPITAL GARANTI (MAROC) date=2026-10-20
  [200/645] FCP EMERGENCE ALLOCATION (MAROC) date=2026-10-16
  [250/645] FCP CAP INSTITUTIONS (MAROC) date=2026-10-20
  [300/645] ELAN SOLIDARITE (MAROC) date=2024-04-15
  [350/645] CFG CORPORATE BONDS (MAROC) date=2026-10-16
  [400/645] CAPITAL TRUST RENDEMENT (MAROC) date=2026-10-16
  [450/645] BMCI PREMIUM LONG TERM BOND (MAROC) date=2026-10-16
  [500/645] ATLAS OBLIGBANCAIRES (MAROC) date=2026-10-20
  [550/645] AD BALANCED FUND (MAROC) date=2026-10-16
  [600/645] MONETAIRE PLUS (MAROC) date=2020-12-03
  [645/645] FCP EMERGENCE GROWTH (MAROC) date=2026-10-20

==========================================
=== RAPPORT PEUPLAGE PERFORMANCES ===
==========================================
Appels de ratios echoues     : 0 (periode non ecrite, contenu existant preserve)
Fonds sans les 10 ratios du classement : 57 — leurs rangs de risque resteraient vides (historique < 3 ans, ou appel echoue)
Fonds traites:    645
Inseres:          625
Mis a jour:       20
Ignores:          0
Erreurs:          0

=== PAR PAYS ===
  MAROC: 645 fonds

Termine.

[ETAPE 1] OK en 1407.4s

======================================================================
ETAPE 2/2 — performances EUR + USD
  node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays MAROC --force
======================================================================
Connecte a la base fund_opcvm
Options: devise=BOTH, pays=MAROC, force=true
645 fonds actifs a traiter


============================================================
=== EUR — table: performences_eurs ===
============================================================

  [100/645] PATRIMOINE OBLIGATIONS (MAROC) EUR date=2026-10-20
  [200/645] FCP EMERGENCE ALLOCATION (MAROC) EUR date=2026-10-16
  [300/645] ELAN SOLIDARITE (MAROC) EUR date=2024-04-15
  [400/645] CAPITAL TRUST RENDEMENT (MAROC) EUR date=2026-10-16
  [500/645] ATLAS OBLIGBANCAIRES (MAROC) EUR date=2026-10-20
  [600/645] MONETAIRE PLUS (MAROC) EUR date=2020-12-03
  [645/645] FCP EMERGENCE GROWTH (MAROC) EUR date=2026-10-20

--- EUR RAPPORT ---
Fonds traites:    645
Inseres:          0
Mis a jour:       645
Ignores (a jour): 0
Sans VL EUR:      0
Erreurs:          0

Par pays:
  MAROC: 645 fonds

============================================================
=== USD — table: performences_usds ===
============================================================

  [100/645] PATRIMOINE OBLIGATIONS (MAROC) USD date=2026-10-20
  [200/645] FCP EMERGENCE ALLOCATION (MAROC) USD date=2026-10-16
  [300/645] ELAN SOLIDARITE (MAROC) USD date=2024-04-15
  [400/645] CAPITAL TRUST RENDEMENT (MAROC) USD date=2026-10-16
  [500/645] ATLAS OBLIGBANCAIRES (MAROC) USD date=2026-10-20
  [600/645] MONETAIRE PLUS (MAROC) USD date=2020-12-03
  [645/645] FCP EMERGENCE GROWTH (MAROC) USD date=2026-10-20

--- USD RAPPORT ---
Fonds traites:    645
Inseres:          0
Mis a jour:       645
Ignores (a jour): 0
Sans VL USD:      0
Erreurs:          0

Par pays:
  MAROC: 645 fonds

============================================================
=== VERIFICATION FINALE ===
============================================================
performences_eurs: 45590 lignes, 1249 fonds
performences_usds: 45823 lignes, 1249 fonds

Termine.

[ETAPE 2] OK en 993.3s

--- ETAT APRES (MAROC) ---
  Fonds actifs           : 645
  Valorisations          : 569796 (derniere : 2026-10-20)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 1
    value_USD NULL       : 1
  Lignes performences    : 72610 (derniere : 2026-10-20)
    ytd renseigne        : 72610
    perf1an renseigne    : 72587
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 0

--- DELTA (MAROC) ---
  vl_ajuste NULL       : 0 -> 0
  value_EUR NULL       : 1 -> 1
  value_USD NULL       : 1 -> 1
  Lignes performences  : 71985 -> 72610
  ytd renseigne        : 71985 -> 72610
  perf1an renseigne    : 71985 -> 72587
  Perf en retard / VL  : 625 -> 0

Termine en 44.0 min.

RAPPEL : les classements/quartiles n'ont PAS ete recalcules.
Les rangs affiches restent ceux d'avant la correction.

==============================================
 3. VERIFICATION
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = MAROC
  Mode : DRY-RUN (aucune ecriture)
  Etapes : 3 et 4 seulement (--only-perf)
  Classements : EXCLUS
==========================================================

--- ETAT AVANT (MAROC) ---
  Fonds actifs           : 645
  Valorisations          : 569796 (derniere : 2026-10-20)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 1
    value_USD NULL       : 1
  Lignes performences    : 72610 (derniere : 2026-10-20)
    ytd renseigne        : 72610
    perf1an renseigne    : 72587
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 0

--- PLAN (2 etapes, dans cet ordre) ---
  1. performances locales (YTD, 1A, 3A...)
     node scripts/fix/fix_populate_performances.js --pays MAROC --force
  2. performances EUR + USD
     node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays MAROC --force

DRY-RUN : rien n'a ete ecrit.
Pour executer reellement, relancer avec :  --execute --confirm
Ajouter --with-classements SEULEMENT si le deplacement des rangs
des autres pays (meme categorie) est accepte.
```
