# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-22 04:21 UTC**

```
########## scripts/diag/ondemand/diag_classements.js ##########

=== FRAICHEUR DES CLASSEMENTS ET DES PERFORMANCES ===
Mesure le 2026-08-22 04:21:31 UTC — LECTURE SEULE

## A. Tables de classement

  classementfonds             3619 lignes — aucune colonne de date
  classementfonds_eurs        3632 lignes — aucune colonne de date
  classementfonds_usds        3632 lignes — aucune colonne de date
  performences               71488 lignes — updated_at max = aucune (?)
  performences_eurs          27383 lignes — date max = Fri Aug 21 2026 00: (1.2 j)
  performences_usds          27616 lignes — date max = Fri Aug 21 2026 00: (1.2 j)

## B. Retard des performances par pays

  pays        fonds  a jour      %  retard moy.  retard max
  ---------- ------ ------- ------ ------------ -----------
  TUNISIE       131       5  3.8 %       86.2 j        95 j
  MAROC         640      20  3.1 %       86.0 j        95 j
  UEMOA         109      43 39.4 %       15.3 j        91 j
  NIGERIA       320     274 85.6 %        5.9 j       665 j
  CEMAC          34      34 100.0 %        0.0 j         0 j

## C. Le classement suit-il les performances actuelles ?

  OBLIGATIONS MAROC                strict  110/300  (36.7 %) · rho  0.690 · top10 3/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base
  DIVERSIFIE MAROC                 strict   18/141  (12.8 %) · rho  0.186 · top10 6/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base
  ACTIONS MAROC                    strict    6/122  (4.9 %) · rho  0.462 · top10 7/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base
  OBLIGATIONS NIGERIA              strict   12/87   (13.8 %) · rho  0.827 · top10 4/10 · ex aequo 1
                                   PROCHE — permutations locales, a instruire
  MONETAIRE MAROC                  strict   44/70   (62.9 %) · rho  0.978 · top10 8/10 · ex aequo 0
                                   PROCHE — permutations locales, a instruire


########## scripts/diag/ondemand/diag_crons_journaux.js ##########

=== VERDICT DE LA DERNIERE EXECUTION DE CHAQUE CRON ===

  cron                   cadence              journal le plus recent                  age  verdict
  ---------------------- -------------------- ---------------------------------- --------  ------------------------
  cron_nigeria_weekly    lundi 10:00          africafunds_nigeria_20260817.log      4.8 j  ECHEC — 6 erreur(s)
  cron_daily_update      lun-ven 20:00        africafunds_daily_20260821.log        7.5 h  ECHEC — 5 erreur(s)
  cron_daily_eur_usd     tous les j 21:30     cron_eur_usd.log                      6.3 h  OK
  cron_tunisie_daily     lun-ven 19:00        cron_tunisie.log                      9.4 h  OK
  cron_brvm_daily        lun-ven 19:30        cron_brvm.log                         8.9 h  OK
  cron_indices_daily     lun-ven 18:30        cron_indices_daily.log                9.8 h  OK  (reserve : Echecs scraping: 23)
  cron_health_check      tous les j 22:00     africafunds_health_20260821.log       6.4 h  ECHEC — 2 probleme(s)
  sync_production        toutes les heures    sync_production.log                   0.4 h  aucun marqueur de fin


=== FIN DES JOURNAUX EN ECHEC OU SANS VERDICT ===

--- cron_nigeria_weekly (ECHEC — 6 erreur(s)) — /var/log/africafunds_nigeria_20260817.log
  | [6b/8] Recalcul performances EUR (fonds 601-1200)...
  | {"error":"connect ECONNREFUSED 127.0.0.1:3306"}
  | [6b/8] ERREUR (HTTP {"error":"connect ECONNREFUSED 127.0.0.1:3306"}500)
  | [7a/8] Recalcul performances USD (fonds 1-600)...
  | {"error":"connect ECONNREFUSED 127.0.0.1:3306"}
  | [7a/8] ERREUR (HTTP {"error":"connect ECONNREFUSED 127.0.0.1:3306"}500)
  | [7b/8] Recalcul performances USD (fonds 601-1200)...
  | {"error":"connect ECONNREFUSED 127.0.0.1:3306"}
  | [7b/8] ERREUR (HTTP {"error":"connect ECONNREFUSED 127.0.0.1:3306"}500)
  | [8/8] Resynchronisation datejour (Nigeria)...
  | Erreur fatale : connect ECONNREFUSED 127.0.0.1:3306
  | [8/8] OK
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 6 ERREUR(S) Mon Aug 17 10:02:23 AM UTC 2026 ===
  | ========================================

--- cron_daily_update (ECHEC — 5 erreur(s)) — /var/log/africafunds_daily_20260821.log
  | === VERIFICATION FINALE ===
  | ============================================================
  | performences_eurs: 27383 lignes, 1238 fonds
  | performences_usds: 27616 lignes, 1238 fonds
  | Termine.
  | [8/9] OK
  | [9a/9] Classement local...
  | [9a/9] ERREUR (HTTP 000)
  | [9b/9] Classement EUR...
  | [9b/9] ERREUR (HTTP 000)
  | [9c/9] Classement USD...
  | [9c/9] ERREUR (HTTP 000)
  | === MISE A JOUR TERMINEE AVEC 5 ERREUR(S) Fri Aug 21 08:53:27 PM UTC 2026 ===
  | ========================================

--- cron_health_check (ECHEC — 2 probleme(s)) — /var/log/africafunds_health_20260821.log
  |   nigeria      pas attendu aujourd'hui (pas lundi)
  | === RESUME ===
  | STATUT: 2 PROBLEME(S) DETECTE(S)
  |   [!] CEMAC: derniere VL il y a 617 jours
  |   [!] Seulement 4 fonds avec perf recente
  |   [OK] UEMOA: VL a jour
  |   [OK] TUNISIE: VL a jour
  |   [OK] MAROC: VL a jour
  |   [OK] NIGERIA: VL a jour
  |   [OK] Classement local peuple
  |   [OK] Performances/classements recents
  |   [OK] Forex a jour
  | === HEALTH CHECK TERMINE Fri Aug 21 10:00:03 PM UTC 2026 ===
  | ========================================

--- sync_production (aucun marqueur de fin) — /var/log/sync_production.log
  | ============================================
  | SYNC PRODUCTION — 2026-08-22 04:00:01
  | ============================================
  | --- Generation du snapshot base de donnees ---
  |   -> PRODUCTION_STATE.json genere (44780 octets)
  | [claude/code-review-improvements-ikvuj ba68fe8f] chore: snapshot production state 2026-08-22 04:00
  |  1 file changed, 3 insertions(+), 3 deletions(-)
  | fatal: could not read Username for 'https://github.com': No such device or address
  |   -> Push ECHEC
  | ============================================
  | SYNC TERMINE — 2026-08-22 04:00:15
  | ============================================
  | Claude Code peut maintenant lire PRODUCTION_STATE.json
  | pour connaitre l'etat exact de la production.

=== RESUME : 4 OK · 3 en echec · 1 non verifiable(s) ===
  « non verifiable » ne veut pas dire « sain » : journal absent, illisible,
  ou sans marqueur de fin. A instruire avant de conclure quoi que ce soit.


########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-08-22T04:21:34.599Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 4.89 Mo
   modifie   : 2026-08-17T10:00:22.276Z (il y a 114.4 h)
   lignes    : 4221
   colonnes  : 53

   En-tetes pertinents :
      fund_name_clean      present (col 24)
      currency_code        present (col 33)
      vl_currency_code     present (col 46)
      vl_currency_source   ABSENT
      vl_price             present (col 44)
      vl_price_source      present (col 45)
      nav_value            present (col 38)
      valuation_date       present (col 12)

## B. Devise emise, fonds en devise etrangere contre les autres

   [devise de la MESURE] fonds DOLLAR/EUROBOND : USD=915  NGN=240
   Tous les autres fonds         : NGN=3066

## C. Echantillon des lignes de fonds en devise etrangere

   fonds                         dev_fonds  dev_mesure  prix                source_prix  source_devise
   ----------------------------  ---------  ----------  ------------------  -----------  -------------
   Afrinvest Dollar Fund         USD        USD         160284.80000672     offer_price  (absent)     
   AIICO Eurobond Fund           NGN        NGN         144168.722422       offer_price  (absent)     
   ARM Eurobond Fund             NGN        NGN         1684.0166063200002  offer_price  (absent)     
   ARM Short-Term Eurobond Fund  NGN        NGN         1458.67099288       offer_price  (absent)     
   CardinalStone Dollar Fund     USD        USD         1731.23976796       offer_price  (absent)     
   Comercio Partners Dollar Fun  USD        USD         1532.6815620000002  offer_price  (absent)     
   Cowry Eurobond Fund           NGN        NGN         1996.4903337800001  offer_price  (absent)     
   EDC Dollar Fund               USD        USD         149816.17070000002  offer_price  (absent)     
   Emerging Africa Eurobond Fun  NGN        NGN         1637.43726          offer_price  (absent)     
   FBN Dollar Fund (Retail)      USD        USD         179907.81600000002  offer_price  (absent)     
   FBN Specialized Dollar Fund   USD        USD         175627.584          offer_price  (absent)     
   FSL Eurobond Fund             NGN        NGN         1380.7942           offer_price  (absent)     
   Futureview Dollar Fund        USD        USD         190908.74417142     offer_price  (absent)     
   Legacy USD Bond Fund          USD        USD         2071.1913           offer_price  (absent)     
   Myrtle Dollar Shield Fund     USD        USD         0                   offer_price  (absent)     
   Norrenberger Dollar Fund      USD        USD         144182.530364       offer_price  (absent)     
   PACAM Eurobond Fund           NGN        NGN         231669.650876       offer_price  (absent)     
   United Capital Nigerian Euro  NGN        NGN         174755.8394487312   offer_price  (absent)     
   Alpha10 Dollar Fund           USD        USD         1394.602142         offer_price  (absent)     
   AVA GAM Fixed Income Dollar   USD        USD         170845.66636600002  offer_price  (absent)     
   AXA Mansard Dollar Bond Fund  USD        USD         189652.08337        offer_price  (absent)     
   CFG AM Fixed Income Dollar F  USD        USD         138079.42           offer_price  (absent)     
   Cordros Dollar Fund           USD        USD         166840.1            offer_price  (absent)     
   Coronation Dollar Fund        USD        USD         1453.9762925999999  offer_price  (absent)     
   FSDH Dollar Fund              USD        USD         1881.62586953479    offer_price  (absent)     

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
      NGN / 10^0         48 lignes
      NGN / 10^2         48 lignes
      NGN / 10^3         85 lignes
      NGN / 10^5         51 lignes
      USD / 10^0         202 lignes
      USD / 10^1         12 lignes
      USD / 10^2         168 lignes
      USD / 10^3         246 lignes
      USD / 10^4         17 lignes
      USD / 10^5         238 lignes

## F. Ce que cela implique pour l etape 0

   USD occupe les ordres [0, 1, 2, 3, 4, 5]
   NGN occupe les ordres [0, 2, 3, 5]
   Ordres partages : 0, 2, 3, 5

   MELANGE PERSISTANT : 12 lignes etiquetees USD portent un prix
   superieur a 10 000, incoherent pour un prix unitaire en dollars.
   -> Ne pas engager l etape 0 : le contrat accepterait de la donnee fausse
      sous un label rassurant.

============================================================
 FIN — aucune ecriture.
============================================================


########## scripts/diag/ondemand/diag_import_nigeria.js ##########

=== IMPORT NIGERIA — POURQUOI PLUS AUCUNE VL DEPUIS LE 2026-08-10 ===

[1] Journaux du cron hebdomadaire (/var/log/africafunds_nigeria_*.log)
  africafunds_nigeria_20260713.log  (9150 o, modifie le 2026-07-13 10:01:18)
  africafunds_nigeria_20260720.log  (11633 o, modifie le 2026-07-20 10:08:12)
  africafunds_nigeria_20260727.log  (11721 o, modifie le 2026-07-27 10:08:34)
  africafunds_nigeria_20260803.log  (11726 o, modifie le 2026-08-03 10:08:17)
  africafunds_nigeria_20260810.log  (11878 o, modifie le 2026-08-10 10:08:38)
  africafunds_nigeria_20260817.log  (11463 o, modifie le 2026-08-17 10:02:23)

[2] Fin du dernier journal — /var/log/africafunds_nigeria_20260817.log
  |   [400/1245] CAPITAL TRUST RENDEMENT: 386 VL
  |   [450/1245] BMCI PREMIUM LONG TERM BOND: 405 VL
  |   [500/1245] ATLAS OBLIGBANCAIRES: 1810 VL
  | Erreur fatale: Error: Can't add new command when connection is in closed state
  |     at PromiseConnection.execute (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/node_modules/mysql2/promise.js:112:22)
  |     at run (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/recalc/recalc_vl_ajuste.js:88:33) {
  |   code: undefined,
  |   errno: undefined,
  |   sql: undefined,
  |   sqlState: undefined,
  |   sqlMessage: undefined
  | }
  | [4/8] OK
  | 
  | [5a/8] Recalcul performances locale (fonds 1-600)...
  | {"error":"Une erreur s'est produite lors du traitement."}
  | [5a/8] ERREUR (HTTP {"error":"Une erreur s'est produite lors du traitement."}500)
  | 
  | [5b/8] Recalcul performances locale (fonds 601-1200)...
  | {"error":"Une erreur s'est produite lors du traitement."}
  | [5b/8] ERREUR (HTTP {"error":"Une erreur s'est produite lors du traitement."}500)
  | 
  | [6a/8] Recalcul performances EUR (fonds 1-600)...
  | {"error":"connect ECONNREFUSED 127.0.0.1:3306"}
  | [6a/8] ERREUR (HTTP {"error":"connect ECONNREFUSED 127.0.0.1:3306"}500)
  | 
  | [6b/8] Recalcul performances EUR (fonds 601-1200)...
  | {"error":"connect ECONNREFUSED 127.0.0.1:3306"}
  | [6b/8] ERREUR (HTTP {"error":"connect ECONNREFUSED 127.0.0.1:3306"}500)
  | 
  | [7a/8] Recalcul performances USD (fonds 1-600)...
  | {"error":"connect ECONNREFUSED 127.0.0.1:3306"}
  | [7a/8] ERREUR (HTTP {"error":"connect ECONNREFUSED 127.0.0.1:3306"}500)
  | 
  | [7b/8] Recalcul performances USD (fonds 601-1200)...
  | {"error":"connect ECONNREFUSED 127.0.0.1:3306"}
  | [7b/8] ERREUR (HTTP {"error":"connect ECONNREFUSED 127.0.0.1:3306"}500)
  | 
  | [8/8] Resynchronisation datejour (Nigeria)...
  | Erreur fatale : connect ECONNREFUSED 127.0.0.1:3306
  | [8/8] OK
  | 
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 6 ERREUR(S) Mon Aug 17 10:02:23 AM UTC 2026 ===
  | ========================================
  | 

[3] Artefacts d extraction attendus a la racine du depot
  present sec_ng_latest.csv                5125964 o, modifie le 2026-08-17 10:00:22 — 4222 lignes
  present sec_ng_audit_latest.csv          22954 o, modifie le 2026-08-17 10:00:22 — 31 lignes
  present sec_ng_coherence_latest.csv      5 o, modifie le 2026-08-17 10:00:22 — 1 lignes
  present sec_ng_coverage_latest.csv       672 o, modifie le 2026-08-17 10:00:22 — 2 lignes
  present sec_ng_fuzzy_latest.csv          285 o, modifie le 2026-08-17 10:00:22 — 2 lignes
  present sec_ng_nav_extractor_v6.py       86886 o, modifie le 2026-08-19 17:46:50

[4] Cache de telechargement sec_ng_downloads/
  9 fichiers. Les plus recents :
    2026-08-10  2026
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
