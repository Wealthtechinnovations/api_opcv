# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-31 18:33 UTC**

```
########## scripts/diag/ondemand/diag_cas_isoles.js ##########
ERREUR : connect ECONNREFUSED 127.0.0.1:3306

########## scripts/diag/ondemand/diag_classements.js ##########
ERREUR : connect ECONNREFUSED 127.0.0.1:3306

########## scripts/diag/ondemand/diag_crons_journaux.js ##########

=== VERDICT DE LA DERNIERE EXECUTION DE CHAQUE CRON ===

  cron                   cadence              journal le plus recent                  age  verdict
  ---------------------- -------------------- ---------------------------------- --------  ------------------------
  cron_nigeria_weekly    lundi 10:00          africafunds_nigeria_20260831.log      8.4 h  ECHEC — 1 erreur(s)
  cron_daily_update      lun-ven 20:00        africafunds_daily_20260828.log        2.9 j  ECHEC — 5 erreur(s)
  cron_daily_eur_usd     tous les j 21:30     cron_eur_usd.log                     20.5 h  OK
  cron_tunisie_daily     lun-ven 19:00        cron_tunisie.log                      3.0 j  OK
  cron_brvm_daily        lun-ven 19:30        cron_brvm.log                         3.0 j  OK
  cron_indices_daily     lun-ven 18:30        cron_indices_daily.log                0.0 h  OK  (reserve : Echecs scraping: 27)
  cron_health_check      tous les j 22:00     africafunds_health_20260830.log      20.6 h  ECHEC — 4 probleme(s)
  sync_production        toutes les heures    sync_production.log                   0.5 h  aucun marqueur de fin


=== FIN DES JOURNAUX EN ECHEC OU SANS VERDICT ===

--- cron_nigeria_weekly (ECHEC — 1 erreur(s)) — /var/log/africafunds_nigeria_20260831.log
  | {"message":"EUR performances: 586/586 fonds traites, 0 erreur(s)","total":586,"traites":586,"erreurs":0}[6b/8] OK (HTTP 200)
  | [7a/8] Recalcul performances USD (fonds 1-600)...
  | {"message":"USD performances: 25/25 fonds traites, 0 erreur(s)","total":25,"traites":25,"erreurs":0}[7a/8] OK (HTTP 200)
  | [7b/8] Recalcul performances USD (fonds 601-1200)...
  | {"message":"USD performances: 586/586 fonds traites, 0 erreur(s)","total":586,"traites":586,"erreurs":0}[7b/8] OK (HTTP 200)
  | [8/8] Resynchronisation datejour (Nigeria)...
  | === SYNCHRONISATION datejour <- MAX(valorisations.date) ===
  | Perimetre : NIGERIA
  | Mode      : EXECUTION
  | Ecarts    : 0 fonds
  | Aucun ecart. Rien a faire.
  | [8/8] OK
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Aug 31 10:09:04 AM UTC 2026 ===
  | ========================================

--- cron_daily_update (ECHEC — 5 erreur(s)) — /var/log/africafunds_daily_20260828.log
  | === VERIFICATION FINALE ===
  | ============================================================
  | performences_eurs: 28654 lignes, 1241 fonds
  | performences_usds: 28887 lignes, 1241 fonds
  | Termine.
  | [8/9] OK
  | [9a/9] Classement local...
  | [9a/9] ERREUR (HTTP 000)
  | [9b/9] Classement EUR...
  | [9b/9] ERREUR (HTTP 000)
  | [9c/9] Classement USD...
  | [9c/9] ERREUR (HTTP 000)
  | === MISE A JOUR TERMINEE AVEC 5 ERREUR(S) Fri Aug 28 08:55:01 PM UTC 2026 ===
  | ========================================

--- cron_health_check (ECHEC — 4 probleme(s)) — /var/log/africafunds_health_20260830.log
  |   nigeria      pas attendu aujourd'hui (pas lundi)
  | === RESUME ===
  | STATUT: 4 PROBLEME(S) DETECTE(S)
  |   [!] NIGERIA: derniere VL il y a 23 jours (budget 14j)
  |   [!] CEMAC: derniere VL il y a 626 jours (budget 400j)
  |   [!] Performances en retard sur les VL: 400/1234 a jour (32.4 %), retard moyen 61.2 j
  |   [!] Seulement 5 fonds avec perf recente
  |   [OK] TUNISIE: VL a jour
  |   [OK] MAROC: VL a jour
  |   [OK] UEMOA: VL a jour
  |   [OK] Classement local peuple
  |   [OK] Forex a jour
  | === HEALTH CHECK TERMINE Sun Aug 30 10:00:04 PM UTC 2026 ===
  | ========================================

--- sync_production (aucun marqueur de fin) — /var/log/sync_production.log
  | ============================================
  | SYNC PRODUCTION — 2026-08-31 18:00:01
  | ============================================
  | --- Generation du snapshot base de donnees ---
  |   -> PRODUCTION_STATE.json genere (44774 octets)
  | [claude/code-review-improvements-ikvuj 911b6729] chore: snapshot production state 2026-08-31 18:00
  |  1 file changed, 3 insertions(+), 3 deletions(-)
  | fatal: could not read Username for 'https://github.com': No such device or address
  |   -> Push ECHEC
  | ============================================
  | SYNC TERMINE — 2026-08-31 18:00:15
  | ============================================
  | Claude Code peut maintenant lire PRODUCTION_STATE.json
  | pour connaitre l'etat exact de la production.

=== RESUME : 4 OK · 3 en echec · 1 non verifiable(s) ===
  « non verifiable » ne veut pas dire « sain » : journal absent, illisible,
  ou sans marqueur de fin. A instruire avant de conclure quoi que ce soit.


########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-08-31T18:33:05.540Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 9.09 Mo
   modifie   : 2026-08-31T10:00:29.926Z (il y a 8.5 h)
   lignes    : 7260
   colonnes  : 59

   En-tetes pertinents :
      fund_name_clean      present (col 24)
      currency_code        present (col 33)
      vl_currency_code     present (col 46)
      vl_currency_source   present (col 47)
      vl_price             present (col 44)
      vl_price_source      present (col 45)
      nav_value            present (col 38)
      valuation_date       present (col 12)

## B. Devise emise, fonds en devise etrangere contre les autres

   [devise de la MESURE] fonds DOLLAR/EUROBOND : NGN=643  USD=636
   Tous les autres fonds         : NGN=5965  USD=16

## C. Echantillon des lignes de fonds en devise etrangere

   fonds                         dev_fonds  dev_mesure  prix                source_prix           source_devise             
   ----------------------------  ---------  ----------  ------------------  --------------------  --------------------------
   Afrinvest Dollar Fund         USD        NGN         160284.80000672     offer_price_fallback  column_header             
   AIICO Eurobond Fund           NGN        NGN         144168.722422       offer_price_fallback  column_header_matched_fund
   ARM Eurobond Fund             NGN        NGN         1684.0166063200002  offer_price_fallback  column_header_matched_fund
   ARM Short-Term Eurobond Fund  NGN        NGN         1458.67099288       offer_price_fallback  column_header_matched_fund
   CardinalStone Dollar Fund     USD        NGN         1731.23976796       offer_price_fallback  column_header             
   Comercio Partners Dollar Fun  USD        NGN         1532.6815620000002  offer_price_fallback  column_header             
   Cowry Eurobond Fund           NGN        NGN         1996.4903337800001  offer_price_fallback  column_header_matched_fund
   EDC Dollar Fund               USD        NGN         149816.17070000002  offer_price_fallback  column_header             
   Emerging Africa Eurobond Fun  NGN        NGN         1637.43726          offer_price_fallback  column_header_matched_fund
   FBN Dollar Fund (Retail)      USD        NGN         179907.81600000002  offer_price_fallback  column_header             
   FBN Specialized Dollar Fund   USD        NGN         175627.584          offer_price_fallback  column_header             
   FSL Eurobond Fund             NGN        NGN         1380.7942           offer_price_fallback  column_header_matched_fund
   Futureview Dollar Fund        USD        NGN         190908.74417142     offer_price_fallback  column_header             
   Legacy USD Bond Fund          USD        NGN         2071.1913           offer_price_fallback  column_header             
   Myrtle Dollar Shield Fund     USD        NGN         0                   offer_price_fallback  column_header             
   Norrenberger Dollar Fund      USD        NGN         144182.530364       offer_price_fallback  column_header             
   PACAM Eurobond Fund           NGN        NGN         231669.650876       offer_price_fallback  column_header_matched_fund
   United Capital Nigerian Euro  NGN        NGN         174755.8394487312   offer_price_fallback  column_header_matched_fund
   Alpha10 Dollar Fund           USD        NGN         1394.602142         offer_price_fallback  column_header             
   AVA GAM Fixed Income Dollar   USD        NGN         170845.66636600002  offer_price_fallback  column_header             
   AXA Mansard Dollar Bond Fund  USD        NGN         189652.08337        offer_price_fallback  column_header             
   CFG AM Fixed Income Dollar F  USD        NGN         138079.42           offer_price_fallback  column_header             
   Cordros Dollar Fund           USD        NGN         166840.1            offer_price_fallback  column_header             
   Coronation Dollar Fund        USD        NGN         1453.9762925999999  offer_price_fallback  column_header             
   FSDH Dollar Fund              USD        NGN         1881.62586953479    offer_price_fallback  column_header             

## D. Confrontation au referentiel (dev_libelle en base)

Erreur fatale : connect ECONNREFUSED 127.0.0.1:3306

########## scripts/diag/ondemand/diag_devise_declaree_nigeria.js ##########
ERREUR : connect ECONNREFUSED 127.0.0.1:3306

########## scripts/diag/ondemand/diag_ecart_csv_base.js ##########
ERREUR : connect ECONNREFUSED 127.0.0.1:3306

########## scripts/diag/ondemand/diag_import_nigeria.js ##########

=== IMPORT NIGERIA — POURQUOI PLUS AUCUNE VL DEPUIS LE 2026-08-10 ===

[1] Journaux du cron hebdomadaire (/var/log/africafunds_nigeria_*.log)
  africafunds_nigeria_20260727.log  (11721 o, modifie le 2026-07-27 10:08:34)
  africafunds_nigeria_20260803.log  (11726 o, modifie le 2026-08-03 10:08:17)
  africafunds_nigeria_20260810.log  (11878 o, modifie le 2026-08-10 10:08:38)
  africafunds_nigeria_20260817.log  (11463 o, modifie le 2026-08-17 10:02:23)
  africafunds_nigeria_20260824.log  (18071 o, modifie le 2026-08-24 10:08:44)
  africafunds_nigeria_20260831.log  (18095 o, modifie le 2026-08-31 10:09:04)

[2] Fin du dernier journal — /var/log/africafunds_nigeria_20260831.log
  | Fonds SANS dividendes:     1165
  | VL recalculees:            985700
  | Erreurs:                   0
  | 
  | Verification globale:
  |   Total VL (value > 0):     1029668
  |   Avec vl_ajuste > 0:       1029596
  |   Avec vl_ajuste_EUR > 0:   989653
  |   Avec vl_ajuste_USD > 0:   989653
  |   Avec dividende > 0:       854
  | 
  | Termine.
  | [4/8] OK
  | 
  | [5a/8] Recalcul performances locale (fonds 1-600)...
  | {"message":"Performances locales: 25/25 fonds traites, 0 erreur(s)","total":25,"traites":25,"erreurs":0}[5a/8] OK (HTTP 200)
  | 
  | [5b/8] Recalcul performances locale (fonds 601-1200)...
  | [5b/8] ERREUR (HTTP 000)
  | 
  | [6a/8] Recalcul performances EUR (fonds 1-600)...
  | {"message":"EUR performances: 25/25 fonds traites, 0 erreur(s)","total":25,"traites":25,"erreurs":0}[6a/8] OK (HTTP 200)
  | 
  | [6b/8] Recalcul performances EUR (fonds 601-1200)...
  | {"message":"EUR performances: 586/586 fonds traites, 0 erreur(s)","total":586,"traites":586,"erreurs":0}[6b/8] OK (HTTP 200)
  | 
  | [7a/8] Recalcul performances USD (fonds 1-600)...
  | {"message":"USD performances: 25/25 fonds traites, 0 erreur(s)","total":25,"traites":25,"erreurs":0}[7a/8] OK (HTTP 200)
  | 
  | [7b/8] Recalcul performances USD (fonds 601-1200)...
  | {"message":"USD performances: 586/586 fonds traites, 0 erreur(s)","total":586,"traites":586,"erreurs":0}[7b/8] OK (HTTP 200)
  | 
  | [8/8] Resynchronisation datejour (Nigeria)...
  | 
  | === SYNCHRONISATION datejour <- MAX(valorisations.date) ===
  | Perimetre : NIGERIA
  | Mode      : EXECUTION
  | Ecarts    : 0 fonds
  | 
  | Aucun ecart. Rien a faire.
  | [8/8] OK
  | 
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Aug 31 10:09:04 AM UTC 2026 ===
  | ========================================
  | 

[3] Artefacts d extraction attendus a la racine du depot
  present sec_ng_latest.csv                9531356 o, modifie le 2026-08-31 10:00:29 — 7261 lignes
  present sec_ng_audit_latest.csv          25243 o, modifie le 2026-08-31 10:00:29 — 34 lignes
  present sec_ng_coherence_latest.csv      5 o, modifie le 2026-08-31 10:00:29 — 1 lignes
  present sec_ng_coverage_latest.csv       711 o, modifie le 2026-08-31 10:00:29 — 2 lignes
  present sec_ng_fuzzy_latest.csv          471 o, modifie le 2026-08-31 10:00:29 — 3 lignes
  present sec_ng_nav_extractor_v6.py       91088 o, modifie le 2026-08-29 14:45:15

[4] Cache de telechargement sec_ng_downloads/
  9 fichiers. Les plus recents :
    2026-08-28  2026
    2026-05-17  2018
    2026-05-17  2019
    2026-05-17  2020
    2026-05-17  2021
    2026-05-17  2022
    2026-05-17  2023
    2026-05-17  2024

[5] Le contrat d ecriture est-il cable dans l importeur ?
  require(vl_contract) : OUI
  ecrit currency_code  : OUI

[6] Dependances Python de l extracteur
  present requests
  present bs4
  present openpyxl
  present dateutil
  python3 : Python 3.10.12
  present libreoffice (conversion .xls -> .xlsx)

[7] Version des scripts cron reellement deployee sur le serveur
  cron_daily_update.sh       statut-commande:oui  curl-non-melange:NON  sortie-non-nulle:oui
  cron_nigeria_weekly.sh     statut-commande:oui  curl-non-melange:NON  sortie-non-nulle:oui
  cron_daily_eur_usd.sh      statut-commande:oui  curl-non-melange:oui  sortie-non-nulle:oui
  cron_health_check.sh       statut-commande:oui  curl-non-melange:oui  sortie-non-nulle:oui

[7bis] Version du code REELLEMENT deployee
  HEAD : b8920d98 — chore: snapshot production state 2026-08-31 18:00
  present          correctif C8 (lots de performances non menteurs)
  present          budgets de fraicheur en source unique
  present          health check corrige
  present          correctif #73 (present, NON execute)

  Process PM2 :
    api-monolith             online     redemarrages  161  depuis 225.4 h
    fundafrique-frontend     online     redemarrages   48  depuis 370.4 h
    worker-recalculation     online     redemarrages    1  depuis 2296.8 h
    worker-data-import       online     redemarrages    1  depuis 2296.8 h

[8] Entrees crontab actives
  0 10 * * 1 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_nigeria_weekly.sh >> /var/log/africafunds_nigeria.log 2>&1
  0 20 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_daily_update.sh >> /var/log/africafunds_cron.log 2>&1
  */5 * * * * /usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1
  0 * * * * cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/deploy/sync_production.sh >> /var/log/sync_production.log 2>&1
  30 21 * * * cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_daily_eur_usd.sh >> /var/log/cron_eur_usd.log 2>&1
  0 19 * * 1-5  cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_tunisie_daily.sh >> /var/log/cron_tunisie.log 2>&1
  0 22 * * *    cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_health_check.sh >> /var/log/africafunds_health.log 2>&1
  30 19 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_brvm_daily.sh >> /var/log/cron_brvm.log 2>&1
  30 18 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_indices_daily.sh >> /var/log/cron_indices_daily.log 2>&1


########## scripts/diag/ondemand/diag_plan_dollar.js ##########
ERREUR : connect ECONNREFUSED 127.0.0.1:3306

########## scripts/diag/ondemand/diag_plan_naira.js ##########
ERREUR : connect ECONNREFUSED 127.0.0.1:3306

########## scripts/diag/ondemand/diag_ruptures_restantes.js ##########
ERREUR : connect ECONNREFUSED 127.0.0.1:3306

```
