# Recalcul des derives — journal des operations

> Genere par `ops-recalc-derives.yml`. Ne pas modifier a la main.

Derniere execution : **2026-09-11 22:08 UTC**
Pays : **** — Mode : **dry-run**
Declencheur : `push` — par `Wealthtechinnovations`

```
Commit courant sur le serveur, avant mise a jour :
d57810153 security(ssh): pin S2 host key across legacy workflows
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
Already up to date.
Commit retenu :
d57810153 security(ssh): pin S2 host key across legacy workflows

==============================================
 1. ETAT AVANT (dry-run) — pays : NIGERIA
==============================================
==========================================================
  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS
  Perimetre : pays = NIGERIA
  Mode : DRY-RUN (aucune ecriture)
  Etapes : 1 a 4
  Classements : EXCLUS
==========================================================

--- ETAT AVANT (NIGERIA) ---
  Fonds actifs           : 330
  Valorisations          : 77711 (derniere : 2026-08-14)
    vl_ajuste NULL       : 0
    value_EUR NULL       : 0
    value_USD NULL       : 0
  Lignes performences    : 5920 (derniere : 2026-07-10)
    ytd renseigne        : 5910
    perf1an renseigne    : 5905
  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : 32
    - [2769] ALPHA10 DOLLAR FUND : VL 2026-08-14 / perf 2026-07-10
    - [2927] Radix Money Market Fund : VL 2026-08-14 / perf aucune
    - [2770] CFG AM FIXED INCOME DOLLAR FUND : VL 2026-08-14 / perf 2026-07-10
    - [2928] Apel Wealth Balanced Fund : VL 2026-08-14 / perf aucune
    - [2771] CORONATION DOLLAR FUND : VL 2026-08-14 / perf 2026-07-10

--- PLAN (4 etapes, dans cet ordre) ---
  1. vl_ajuste = value + cumul dividendes
     node scripts/recalc/recalc_vl_ajuste.js --pays NIGERIA
  2. value_EUR / value_USD au taux du jour
     node scripts/recalc/recalc_eur_usd_daily_rate.js --pays NIGERIA
  3. performances locales (YTD, 1A, 3A...)
     node scripts/fix/fix_populate_performances.js --pays NIGERIA --force
  4. performances EUR + USD
     node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --pays NIGERIA --force

DRY-RUN : rien n'a ete ecrit.
Pour executer reellement, relancer avec :  --execute --confirm
Ajouter --with-classements SEULEMENT si le deplacement des rangs
des autres pays (meme categorie) est accepte.

Mode dry-run — aucune ecriture. Fin.
```
