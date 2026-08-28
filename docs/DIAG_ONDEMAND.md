# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-28 20:20 UTC**

```
########## scripts/diag/ondemand/diag_classements.js ##########

=== FRAICHEUR DES CLASSEMENTS ET DES PERFORMANCES ===
Mesure le 2026-08-28 20:20:34 UTC — LECTURE SEULE

## A. Tables de classement

  classementfonds             3619 lignes — aucune colonne de date
  classementfonds_eurs        3635 lignes — aucune colonne de date
  classementfonds_usds        3635 lignes — aucune colonne de date
  performences               72085 lignes — updated_at max = aucune (?)
  performences_eurs          28260 lignes — date max =  hu Aug 27 2026 00: (1.8 j)
  performences_usds          28121 lignes — date max = Mon Aug 24 2026 00: (4.8 j)

## B. Retard des performances par pays

  pays        fonds  a jour      %  retard moy.  retard max
  ---------- ------ ------- ------ ------------ -----------
  MAROC         640      18  2.8 %       93.6 j       104 j
  TUNISIE       131       5  3.8 %       91.4 j       102 j
  UEMOA         109      44 40.4 %       17.6 j        98 j
  NIGERIA       320     297 92.8 %        5.7 j       665 j
  CEMAC          34      34 100.0 %        0.0 j         0 j

## C. Le classement suit-il les performances actuelles ?

  OBLIGATIONS MAROC                strict  110/300  (36.7 %) · rho  0.690 · top10 3/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base
  DIVERSIFIE MAROC                 strict   18/141  (12.8 %) · rho  0.186 · top10 6/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base
  ACTIONS MAROC                    strict    6/122  (4.9 %) · rho  0.462 · top10 7/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base
  OBLIGATIONS NIGERIA              strict   14/87   (16.1 %) · rho  0.827 · top10 4/10 · ex aequo 1
                                   DIVERGE — le classement ne reflete pas les performances en base
  DIVERSIFIE TUNISIE               strict    3/70   (4.3 %) · rho  0.421 · top10 2/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base


########## scripts/diag/ondemand/diag_crons_journaux.js ##########

=== VERDICT DE LA DERNIERE EXECUTION DE CHAQUE CRON ===

  cron                   cadence              journal le plus recent                  age  verdict
  ---------------------- -------------------- ---------------------------------- --------  ------------------------
  cron_nigeria_weekly    lundi 10:00          africafunds_nigeria_20260824.log      4.4 j  ECHEC — 1 erreur(s)
  cron_daily_update      lun-ven 20:00        africafunds_daily_20260828.log        0.0 h  aucun marqueur de fin
  cron_daily_eur_usd     tous les j 21:30     cron_eur_usd.log                     22.7 h  ECHEC — 3 erreur(s)
  cron_tunisie_daily     lun-ven 19:00        cron_tunisie.log                      1.3 h  OK
  cron_brvm_daily        lun-ven 19:30        cron_brvm.log                         0.8 h  OK
  cron_indices_daily     lun-ven 18:30        cron_indices_daily.log                1.8 h  OK  (reserve : Echecs scraping: 27)
  cron_health_check      tous les j 22:00     africafunds_health_20260827.log      22.3 h  aucun marqueur de fin
  sync_production        toutes les heures    sync_production.log                   0.3 h  aucun marqueur de fin


=== FIN DES JOURNAUX EN ECHEC OU SANS VERDICT ===

--- cron_nigeria_weekly (ECHEC — 1 erreur(s)) — /var/log/africafunds_nigeria_20260824.log
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
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Aug 24 10:08:44 AM UTC 2026 ===
  | ========================================

--- cron_daily_update (aucun marqueur de fin) — /var/log/africafunds_daily_20260828.log
  | [6/9] ERREUR (HTTP 000)
  | [7/9] Recalcul performances locale (fonds 1201-3000)...
  | [7/9] ERREUR (HTTP 000)
  | [8/9] Recalcul performances EUR/USD...
  | Connecte a la base fund_opcvm
  | Options: devise=BOTH, pays=TOUS, force=false
  | 1247 fonds actifs a traiter
  | ============================================================
  | === EUR — table: performences_eurs ===
  | ============================================================
  |   [100/1247] SG NOVA (MAROC) EUR date=2026-08-27
  |   [200/1247] FCP OBLIG OPPORTUNITES (MAROC) EUR date=2026-08-27
  |   [300/1247] FCP ALPHA MONETAIRE PROTECTION (MAROC) EUR date=2026-08-27
  |   [400/1247] CDG-ACTIONS (MAROC) EUR date=2026-08-24

--- cron_daily_eur_usd (ECHEC — 3 erreur(s)) — /var/log/cron_eur_usd.log
  | (node:1154855) UnhandledPromiseRejectionWarning: Error: connect ECONNREFUSED 127.0.0.1:3306
  |     at Object.createConnection (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/node_modules/mysql2/promise.js:253:31)
  |     at [eval]:5:25
  |     at [eval]:11:3
  |     at Script.runInThisContext (vm.js:133:18)
  |     at Object.runInThisContext (vm.js:310:38)
  |     at internal/process/execution.js:77:19
  |     at [eval]-wrapper:6:22
  |     at evalScript (internal/process/execution.js:76:60)
  |     at internal/main/eval_string.js:23:3
  | (Use `node --trace-warnings ...` to show where the warning was created)
  | (node:1154855) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise whic
  | (node:1154855) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit
  | CRON EUR/USD TERMINE AVEC 3 ERREUR(S) — 2026-08-27 21:40:01

--- cron_health_check (aucun marqueur de fin) — /var/log/africafunds_health_20260827.log
  | ========================================
  | === AFRICAFUNDS HEALTH CHECK ===
  | === Thu Aug 27 10:00:01 PM UTC 2026 ===
  | ========================================
  | === AFRICAFUNDS CRON HEALTH CHECK — 2026-08-27 ===
  | ERREUR: connect ECONNREFUSED 127.0.0.1:3306
  | === HEALTH CHECK TERMINE Thu Aug 27 10:00:01 PM UTC 2026 ===
  | ========================================

--- sync_production (aucun marqueur de fin) — /var/log/sync_production.log
  | ============================================
  | SYNC PRODUCTION — 2026-08-28 20:00:01
  | ============================================
  | --- Generation du snapshot base de donnees ---
  |   -> PRODUCTION_STATE.json genere (44764 octets)
  | [claude/code-review-improvements-ikvuj 89868443] chore: snapshot production state 2026-08-28 20:00
  |  1 file changed, 10 insertions(+), 10 deletions(-)
  | fatal: could not read Username for 'https://github.com': No such device or address
  |   -> Push ECHEC
  | ============================================
  | SYNC TERMINE — 2026-08-28 20:00:14
  | ============================================
  | Claude Code peut maintenant lire PRODUCTION_STATE.json
  | pour connaitre l'etat exact de la production.

=== RESUME : 3 OK · 2 en echec · 3 non verifiable(s) ===
  « non verifiable » ne veut pas dire « sain » : journal absent, illisible,
  ou sans marqueur de fin. A instruire avant de conclure quoi que ce soit.


########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-08-28T20:20:38.317Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 8.58 Mo
   modifie   : 2026-08-24T10:00:27.368Z (il y a 106.3 h)
   lignes    : 7033
   colonnes  : 55

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

   [devise de la MESURE] fonds DOLLAR/EUROBOND : NGN=643  USD=596
   Tous les autres fonds         : NGN=5779  USD=15

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

   40 fonds dollar/eurobond actifs en base : NGN=23  USD=17

   id    nom                               dev_libelle
   ----  --------------------------------  -----------
   1141  AFRINVEST DOLLAR FUND             NGN        
   2764  AIICO EUROBOND FUND               NGN        
   2769  ALPHA10 DOLLAR FUND               USD        
   1154  ARM EUROBOND FUND                 NGN        
   2861  ARM SHORT-TERM EUROBOND FUND      NGN        
   2858  ARM SPECIALIZED DOLLAR FUND       NGN        
   1158  AVA GAM FIXED INCOME DOLLAR FUND  NGN        
   1160  AXA MANSARD DOLLAR BOND FUND      NGN        
   2765  CARDINALSTONE DOLLAR FUND         USD        
   2770  CFG AM FIXED INCOME DOLLAR FUND   USD        
   2766  COMERCIO PARTNERS DOLLAR FUND     USD        
   1175  CORDROS DOLLAR FUND               NGN        
   ... et 28 autres

## E. L etiquette de devise correspond-elle a l echelle ?

   Repartition croisee etiquette x ordre de grandeur :
      NGN / 10^3         332 lignes
      NGN / 10^4         18 lignes
      NGN / 10^5         290 lignes
      USD / 10^-2        1 lignes
      USD / 10^0         292 lignes
      USD / 10^1         14 lignes
      USD / 10^2         251 lignes

## F. Ce que cela implique pour l etape 0

   USD occupe les ordres [-2, 0, 1, 2]
   NGN occupe les ordres [3, 4, 5]
   Ordres partages : AUCUN

   SEPARATION NETTE. Les deux devises n occupent aucun ordre de grandeur
   commun : USD s arrete a 10^2, NGN commence a 10^3. L ecart
   correspond au taux de change. Chaque valeur est donc etiquetee dans son
   unite reelle.

   -> L extraction est FIABLE sur ce lot. L etape 0 devient sure : corriger
      dev_libelle alignera le referentiel sans faire accepter de naira
      etiquete dollar, puisqu il n en existe plus.

============================================================
 FIN — aucune ecriture.
============================================================


########## scripts/diag/ondemand/diag_import_nigeria.js ##########

=== IMPORT NIGERIA — POURQUOI PLUS AUCUNE VL DEPUIS LE 2026-08-10 ===

[1] Journaux du cron hebdomadaire (/var/log/africafunds_nigeria_*.log)
  africafunds_nigeria_20260720.log  (11633 o, modifie le 2026-07-20 10:08:12)
  africafunds_nigeria_20260727.log  (11721 o, modifie le 2026-07-27 10:08:34)
  africafunds_nigeria_20260803.log  (11726 o, modifie le 2026-08-03 10:08:17)
  africafunds_nigeria_20260810.log  (11878 o, modifie le 2026-08-10 10:08:38)
  africafunds_nigeria_20260817.log  (11463 o, modifie le 2026-08-17 10:02:23)
  africafunds_nigeria_20260824.log  (18071 o, modifie le 2026-08-24 10:08:44)

[2] Fin du dernier journal — /var/log/africafunds_nigeria_20260824.log
  | Fonds SANS dividendes:     1163
  | VL recalculees:            984024
  | Erreurs:                   0
  | 
  | Verification globale:
  |   Total VL (value > 0):     1027977
  |   Avec vl_ajuste > 0:       1027905
  |   Avec vl_ajuste_EUR > 0:   987962
  |   Avec vl_ajuste_USD > 0:   987962
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
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Aug 24 10:08:44 AM UTC 2026 ===
  | ========================================
  | 

[3] Artefacts d extraction attendus a la racine du depot
  present sec_ng_latest.csv                8999633 o, modifie le 2026-08-24 10:00:27 — 7034 lignes
  present sec_ng_audit_latest.csv          24481 o, modifie le 2026-08-24 10:00:27 — 33 lignes
  present sec_ng_coherence_latest.csv      5 o, modifie le 2026-08-24 10:00:27 — 1 lignes
  present sec_ng_coverage_latest.csv       698 o, modifie le 2026-08-24 10:00:27 — 2 lignes
  present sec_ng_fuzzy_latest.csv          471 o, modifie le 2026-08-24 10:00:27 — 3 lignes
  present sec_ng_nav_extractor_v6.py       86886 o, modifie le 2026-08-19 17:46:50

[4] Cache de telechargement sec_ng_downloads/
  9 fichiers. Les plus recents :
    2026-08-24  2026
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
  HEAD : 89868443 — chore: snapshot production state 2026-08-28 20:00
  present          correctif C8 (lots de performances non menteurs)
  present          budgets de fraicheur en source unique
  present          health check corrige
  present          correctif #73 (present, NON execute)

  Process PM2 :
    api-monolith             online     redemarrages  161  depuis 155.2 h
    fundafrique-frontend     online     redemarrages   48  depuis 300.2 h
    worker-recalculation     online     redemarrages    1  depuis 2226.6 h
    worker-data-import       online     redemarrages    1  depuis 2226.6 h

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


```
