# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-28 20:56 UTC**

```
########## scripts/diag/ondemand/diag_cas_isoles.js ##########

=== CAS ISOLES — ruptures hors defaut de devise SEC ===
Mesure le 2026-08-28 20:54:38 UTC — LECTURE SEULE

## A. Fonds dont la rupture n est pas un taux de change

  [1169] NIGERIA ENERGY SECTOR FUND — NIGERIA / NGN — actif=1
    date                    value            actif_net        parts   parts impl. devise insere     src
    Fri Aug 08           552.2000           1082899568            -       1961064 NGN    Sun Aug 02 oui
    Fri Aug 15           552.2000           1040200887            -       1883739 NGN    Sun Aug 02 oui
    Fri Aug 22           552.2000           1042267749            -       1887482 NGN    Sun Aug 02 oui
    Fri Aug 29    1046071210.6800           1046071211            -             1 NGN    Sun Aug 02 oui
    Fri Sep 05           552.2000           1040672550            -       1884594 NGN    Sun Aug 02 oui
    Fri Sep 12           552.2000           1047216961            -       1896445 NGN    Sun Aug 02 oui
    Fri Sep 19           552.2000           1047216961            -       1896445 NGN    Sun Aug 02 oui
    Fri Sep 26           552.2000           1046004581            -       1894250 NGN    Sun Aug 02 oui

  [790] UPLINE BONDS — MAROC / MAD — actif=1
    date                    value            actif_net        parts   parts impl. devise insere     src
    Fri Dec 04           107.0300              1070287            -         10000 -      Thu Apr 30 non
    Fri Dec 11           107.0500              1070450            -         10000 -      Thu Apr 30 non
    Fri Dec 25           105.3800             99497149            -        944175 -      Thu Apr 30 non
    Fri Jan 08           103.7200             97924115            -        944120 -      Thu Apr 30 non
    Fri Nov 13           106.8900              1068905            -         10000 -      Thu Apr 30 non
    Fri Nov 20           106.9300              1069308            -         10000 -      Thu Apr 30 non
    Fri Nov 27           106.9000              1068966            -         10000 -      Thu Apr 30 non
    Mon Dec 21           105.8600             99946579            -        944139 -      Thu Apr 30 non

  [2592] FCP BRIDGE EQUILIBRE — UEMOA / XOF — actif=1
    date                    value            actif_net        parts   parts impl. devise insere     src
    Fri Feb 13      43150544.6800                    0            -             - -      Fri Jun 12 non
    Fri Feb 20      43701153.3300                    0            -             - -      Fri Jun 12 non
    Fri Feb 27      44467382.2100                    0            -             - -      Fri Jun 12 non
    Fri Mar 06      44235240.9500                    0            -             - -      Fri Jun 12 non
    Fri Mar 13      44420101.2700                    0            -             - -      Fri Jun 12 non
    Fri Mar 27          8781.7800                    0            -             - -      Fri Jun 12 non
    Sat Feb 28      44467985.2200                    0            -             - -      Fri Jun 12 non
    Sat Jan 31      42490028.5600                    0            -             - -      Fri Jun 12 non

## B. Les 25 lignes sans provenance, en detail

  9 ligne(s)

  fonds pays     dev  date                 valeur       precedente     fact. insere     nom
    790 MAROC    MAD  Fri Jun 08           0.4600          11.2700      24.5 Thu Apr 30 UPLINE BONDS
   1223 NIGERIA  NGN  Fri Dec 08           1.0000         100.0000       100 Sun May 17 GUARANTY TRUST MONEY MARKET FUND
   1223 NIGERIA  NGN  Fri Jul 05         100.0000           1.0000       100 Sun May 17 GUARANTY TRUST MONEY MARKET FUND
   2450 TUNISIE  TND  Wed Jan 02          20.3190         212.9880      10.5 Fri May 22 MAC EPARGNE ACTIONS FCP
   2505 TUNISIE  TND  Mon Nov 09         100.0000       10485.6600     104.9 Fri May 22 MAC HORIZON 2032 FCP
   2505 TUNISIE  TND  Mon Jan 16       10000.0000         106.2630      94.1 Thu Apr 30 MAC HORIZON 2032 FCP
   2592 UEMOA    XOF  Mon Jun 26    29487443.4600        5674.0000    5196.9 Fri Jun 12 FCP BRIDGE EQUILIBRE
   2592 UEMOA    XOF  Fri Mar 27        8781.7800    44420101.2700    5058.2 Fri Jun 12 FCP BRIDGE EQUILIBRE
   2642 UEMOA    XOF  Wed Apr 13       20048.0000    21841493.0000    1089.5 Thu Apr 30 FCP ECOBANK UEMOA OBLIGATAIRE

## C. Ruptures hors Nigeria — quelles chaines d import ?

  7 ligne(s) sur 5 fonds

  MAROC    [ 790] UPLINE BONDS                   Fri Jun 08 : 0.4600 apres 11.2700 (x24.5) — insere Thu Apr 30, devise -, source non
  TUNISIE  [2450] MAC EPARGNE ACTIONS FCP        Wed Jan 02 : 20.3190 apres 212.9880 (x10.5) — insere Fri May 22, devise -, source non
  TUNISIE  [2505] MAC HORIZON 2032 FCP           Mon Nov 09 : 100.0000 apres 10485.6600 (x104.9) — insere Fri May 22, devise -, source non
  TUNISIE  [2505] MAC HORIZON 2032 FCP           Mon Jan 16 : 10000.0000 apres 106.2630 (x94.1) — insere Thu Apr 30, devise -, source non
  UEMOA    [2592] FCP BRIDGE EQUILIBRE           Mon Jun 26 : 29487443.4600 apres 5674.0000 (x5196.9) — insere Fri Jun 12, devise -, source non
  UEMOA    [2592] FCP BRIDGE EQUILIBRE           Fri Mar 27 : 8781.7800 apres 44420101.2700 (x5058.2) — insere Fri Jun 12, devise -, source non
  UEMOA    [2642] FCP ECOBANK UEMOA OBLIGATAIRE  Wed Apr 13 : 20048.0000 apres 21841493.0000 (x1089.5) — insere Thu Apr 30, devise -, source non


########## scripts/diag/ondemand/diag_classements.js ##########

=== FRAICHEUR DES CLASSEMENTS ET DES PERFORMANCES ===
Mesure le 2026-08-28 20:55:52 UTC — LECTURE SEULE

## A. Tables de classement

  classementfonds             3619 lignes — aucune colonne de date
  classementfonds_eurs        3635 lignes — aucune colonne de date
  classementfonds_usds        3635 lignes — aucune colonne de date
  performences               72169 lignes — updated_at max = aucune (?)
  performences_eurs          28654 lignes — date max = Fri Aug 28 2026 00: (0.9 j)
  performences_usds          28887 lignes — date max = Fri Aug 28 2026 00: (0.9 j)

## B. Retard des performances par pays

  pays        fonds  a jour      %  retard moy.  retard max
  ---------- ------ ------- ------ ------------ -----------
  MAROC         640      18  2.8 %       93.6 j       104 j
  TUNISIE       131       6  4.6 %       91.3 j       102 j
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
  OBLIGATIONS NIGERIA              strict   12/87   (13.8 %) · rho  0.827 · top10 4/10 · ex aequo 1
                                   DIVERGE — le classement ne reflete pas les performances en base
  DIVERSIFIE TUNISIE               strict    3/70   (4.3 %) · rho  0.421 · top10 2/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base


########## scripts/diag/ondemand/diag_crons_journaux.js ##########

=== VERDICT DE LA DERNIERE EXECUTION DE CHAQUE CRON ===

  cron                   cadence              journal le plus recent                  age  verdict
  ---------------------- -------------------- ---------------------------------- --------  ------------------------
  cron_nigeria_weekly    lundi 10:00          africafunds_nigeria_20260824.log      4.4 j  ECHEC — 1 erreur(s)
  cron_daily_update      lun-ven 20:00        africafunds_daily_20260828.log        0.0 h  ECHEC — 5 erreur(s)
  cron_daily_eur_usd     tous les j 21:30     cron_eur_usd.log                     23.3 h  ECHEC — 3 erreur(s)
  cron_tunisie_daily     lun-ven 19:00        cron_tunisie.log                      1.9 h  OK
  cron_brvm_daily        lun-ven 19:30        cron_brvm.log                         1.4 h  OK
  cron_indices_daily     lun-ven 18:30        cron_indices_daily.log                2.4 h  OK  (reserve : Echecs scraping: 27)
  cron_health_check      tous les j 22:00     africafunds_health_20260827.log      22.9 h  aucun marqueur de fin
  sync_production        toutes les heures    sync_production.log                   0.9 h  aucun marqueur de fin


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

=== RESUME : 3 OK · 3 en echec · 2 non verifiable(s) ===
  « non verifiable » ne veut pas dire « sain » : journal absent, illisible,
  ou sans marqueur de fin. A instruire avant de conclure quoi que ce soit.


########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-08-28T20:56:01.711Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 8.58 Mo
   modifie   : 2026-08-24T10:00:27.368Z (il y a 106.9 h)
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


########## scripts/diag/ondemand/diag_ecart_csv_base.js ##########

CSV de rejeu introuvable : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv
Lancer d abord le workflow « OPS — rejeu SEC etape 2 (phase seche) ».


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
  HEAD : bdacd278 — chore: snapshot production state 2026-08-28 20:00
  present          correctif C8 (lots de performances non menteurs)
  present          budgets de fraicheur en source unique
  present          health check corrige
  present          correctif #73 (present, NON execute)

  Process PM2 :
    api-monolith             online     redemarrages  161  depuis 155.8 h
    fundafrique-frontend     online     redemarrages   48  depuis 300.8 h
    worker-recalculation     online     redemarrages    1  depuis 2227.2 h
    worker-data-import       online     redemarrages    1  depuis 2227.2 h

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


########## scripts/diag/ondemand/diag_ruptures_restantes.js ##########

=== RUPTURES D ECHELLE RESTANTES — toutes dates confondues ===
Mesure le 2026-08-28 20:56:03 UTC — LECTURE SEULE
Critere : saut d un facteur >= 10 par rapport a la VL precedente du meme fonds

TOTAL : 233 ligne(s) sur 84 fonds

## Repartition par pays et lot d insertion

     91 ligne(s)   NIGERIA | insere le Sun Aug 02
     54 ligne(s)   NIGERIA | insere le Sun May 17
     16 ligne(s)   NIGERIA | insere le Mon Jun 22
     16 ligne(s)   NIGERIA | insere le Thu Jun 04
      9 ligne(s)   NIGERIA | insere le Mon Aug 24
      7 ligne(s)   NIGERIA | insere le Mon Jul 06
      7 ligne(s)   NIGERIA | insere le Mon Jun 08
      7 ligne(s)   NIGERIA | insere le Mon Jun 01
      5 ligne(s)   Nigeria | insere le Mon Aug 24
      4 ligne(s)   NIGERIA | insere le Mon Jun 29
      3 ligne(s)   NIGERIA | insere le Mon Jul 27
      3 ligne(s)   NIGERIA | insere le Mon Jul 13
      2 ligne(s)   TUNISIE | insere le Fri May 22
      2 ligne(s)   UEMOA | insere le Fri Jun 12
      1 ligne(s)   MAROC | insere le Thu Apr 30
      1 ligne(s)   Nigeria | insere le Mon Jun 01
      1 ligne(s)   Nigeria | insere le Mon Jul 27
      1 ligne(s)   Nigeria | insere le Thu Jun 04
      1 ligne(s)   Nigeria | insere le Mon Jun 08
      1 ligne(s)   TUNISIE | insere le Thu Apr 30
      1 ligne(s)   UEMOA | insere le Thu Apr 30

## Detail (60 premieres)

  fonds dev  date               valeur     precedente   fact. insere     devise src  nom
  ----- ---- ---------- -------------- -------------- ------- ---------- ------ ---  ---
    790 MAD  Fri Jun 08         0.4600        11.2700    24.5 Thu Apr 30 -      non  UPLINE BONDS
   1141 NGN  Fri Mar 18        94.9343     39043.5368   411.3 Sun May 17 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Apr 01     39441.4650        92.1946   427.8 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Aug 05       104.8954     43556.5716   415.2 Sun May 17 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Aug 12     43766.6883       104.8954   417.2 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Sep 08       108.2513     80066.7401   739.6 Sun May 17 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Sep 15     79948.2399       108.2513   738.5 Sun May 17 -      non  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 08       109.8529    104587.4659   952.1 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 22    114459.8322       109.8529  1041.9 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Mar 01       108.9403    163810.9357  1503.7 Sun May 17 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Mar 08    167631.1240       108.9403  1538.7 Sun May 17 -      non  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 05       114.4800    165682.9307  1447.3 Sun May 17 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Jan 02    165297.5204       114.6808  1441.4 Sun May 17 -      non  AFRINVEST DOLLAR FUND
   1142 NGN  Fri Jul 18      1990.0300       172.0100    11.6 Sun Aug 02 NGN    oui  AFRINVEST EQUITY FUND
   1142 NGN  Fri Jul 25       170.3400      1990.0300    11.7 Sun Aug 02 NGN    oui  AFRINVEST EQUITY FUND
   1146 NGN  Fri Dec 12         1.0000       100.0000     100 Sun Aug 02 NGN    oui  AIICO MONEY MARKET FUND
   1146 NGN  Fri Dec 19       100.0000         1.0000     100 Sun Aug 02 NGN    oui  AIICO MONEY MARKET FUND
   1153 NGN  Fri Apr 19       523.4007        23.3802    22.4 Sun Aug 02 NGN    oui  ARM ETHICAL FUND
   1153 NGN  Fri Apr 26        23.3905       523.4007    22.4 Sun Aug 02 NGN    oui  ARM ETHICAL FUND
   1153 NGN  Fri Aug 25       633.5456        49.1683    12.9 Sun May 17 NGN    oui  ARM ETHICAL FUND
   1153 NGN  Fri Sep 01        51.4624       633.5456    12.3 Sun May 17 -      non  ARM ETHICAL FUND
   1154 NGN  Fri Aug 29         1.1962      1835.7518  1534.7 Sun May 17 NGN    oui  ARM EUROBOND FUND
   1154 NGN  Thu Sep 04      1832.0644         1.1962  1531.6 Sun May 17 -      non  ARM EUROBOND FUND
   1154 NGN  Fri Jun 19         1.2360      1681.9916  1360.8 Mon Jun 29 NGN    oui  ARM EUROBOND FUND
   1154 NGN  Fri Jun 26      1703.7064         1.2360  1378.4 Mon Jul 06 NGN    oui  ARM EUROBOND FUND
   1155 NGN  Fri Dec 13       812.0000         1.2204   665.4 Sun May 17 NGN    oui  ARM FIXED INCOME FUND
   1155 NGN  Fri Dec 20         1.2218       812.0000   664.6 Sun May 17 NGN    oui  ARM FIXED INCOME FUND
   1156 NGN  Fri Jul 25       339.7568         1.0000   339.8 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Aug 01         1.0000       339.7568   339.8 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Dec 12       100.0000         1.0000     100 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Dec 19         1.0000       100.0000     100 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1157 NGN  Fri Dec 13       201.0000         1.1087   181.3 Sun May 17 NGN    oui  ARM SHORT TERM BOND FUND
   1157 NGN  Fri Dec 20         1.1137       201.0000   180.5 Sun May 17 NGN    oui  ARM SHORT TERM BOND FUND
   1158 NGN  Fri Nov 05       107.1500     49755.0000   464.3 Sun Aug 02 NGN    oui  AVA GAM FIXED INCOME DOLLAR FU
   1158 NGN  Fri Nov 12     49931.7000       107.1500     466 Sun May 17 -      non  AVA GAM FIXED INCOME DOLLAR FU
   1158 NGN  Fri Aug 05      1081.2400     42186.2600      39 Sun May 17 NGN    oui  AVA GAM FIXED INCOME DOLLAR FU
   1158 NGN  Fri Aug 12     37665.2600      1081.2400    34.8 Sun May 17 -      non  AVA GAM FIXED INCOME DOLLAR FU
   1158 NGN  Fri Jun 05       119.1200    163582.0760  1373.3 Mon Jun 22 NGN    oui  AVA GAM FIXED INCOME DOLLAR FU
   1158 NGN  Thu Jun 11    162622.4930       119.1200  1365.2 Mon Jun 22 NGN    oui  AVA GAM FIXED INCOME DOLLAR FU
   1159 NGN  Fri Aug 05     39822.0700      1090.8200    36.5 Sun May 17 NGN    oui  AVA GAM FIXED INCOME FUND
   1159 NGN  Fri Aug 12      1093.1800     39822.0700    36.4 Sun May 17 -      non  AVA GAM FIXED INCOME FUND
   1168 NGN  Fri Nov 26       415.7564         1.0100   411.6 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Mar 18         1.0244       424.8504   414.7 Sun May 17 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Apr 01       427.1666         1.0259   416.4 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri May 06         1.0317       428.3685   415.2 Sun May 17 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri May 13       428.3849         1.0317   415.2 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri May 27         1.0353       429.7513   415.1 Sun May 17 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Jun 03       430.7589         1.0353   416.1 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Aug 05         1.0168       422.1230   415.1 Sun May 17 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Aug 12       424.9919         1.0168     418 Sun May 17 -      non  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Dec 20         1.0689      1628.9460  1523.9 Sun May 17 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Dec 27      1644.5124         1.0689  1538.5 Sun May 17 -      non  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri May 15         1.1200      1524.7624  1361.4 Thu Jun 04 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri May 22      1526.7584         1.1200  1363.2 Thu Jun 04 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1169 NGN  Fri Aug 29 1046071210.6800       552.2000 1894370.2 Sun Aug 02 NGN    oui  NIGERIA ENERGY SECTOR FUND
   1169 NGN  Fri Sep 05       552.2000 1046071210.6800 1894370.2 Sun Aug 02 NGN    oui  NIGERIA ENERGY SECTOR FUND
   1171 NGN  Fri Oct 21       988.8300         1.2200   810.5 Sun Aug 02 NGN    oui  SFS FIXED INCOME FUND
   1171 NGN  Fri Oct 28         1.2200       988.8300   810.5 Sun Aug 02 NGN    oui  SFS FIXED INCOME FUND
   1175 NGN  Fri May 22       116.0800    159261.7600    1372 Thu Jun 04 NGN    oui  CORDROS DOLLAR FUND
   1175 NGN  Fri May 29    159747.5000       116.0800  1376.2 Mon Jun 08 NGN    oui  CORDROS DOLLAR FUND
  ... et 173 autre(s)

## Provenance

  25 ligne(s) SANS provenance — meme signature que les 82 deja retirees
  208 ligne(s) AVEC provenance — a corriger a la source, jamais par suppression aveugle


```
