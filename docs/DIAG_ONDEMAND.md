# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-09-11 22:10 UTC**

```
########## scripts/diag/ondemand/diag_cas_isoles.js ##########

=== CAS ISOLES — ruptures hors defaut de devise SEC ===
Mesure le 2026-09-11 22:08:34 UTC — LECTURE SEULE

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
Mesure le 2026-09-11 22:09:40 UTC — LECTURE SEULE

## A. Tables de classement

  classementfonds             3619 lignes — aucune colonne de date
  classementfonds_eurs        3635 lignes — aucune colonne de date
  classementfonds_usds        3635 lignes — aucune colonne de date
  performences               75652 lignes — updated_at max = aucune (?)
  performences_eurs          32034 lignes — date max =  hu Sep 10 2026 00: (1.9 j)
  performences_usds          32267 lignes — date max =  hu Sep 10 2026 00: (1.9 j)

## B. Retard des performances par pays

  pays        fonds  a jour      %  retard moy.  retard max
  ---------- ------ ------- ------ ------------ -----------
  MAROC         640      19  3.0 %      104.5 j       118 j
  TUNISIE       131       8  6.1 %       89.7 j       102 j
  UEMOA         109      38 34.9 %       26.6 j        98 j
  NIGERIA       320     297 92.8 %        6.1 j       665 j
  CEMAC          34      34 100.0 %        0.0 j         0 j

## C. Le classement suit-il les performances actuelles ?

  OBLIGATIONS MAROC                strict  108/300  (36.0 %) · rho  0.690 · top10 3/10 · ex aequo 1
                                   DIVERGE — le classement ne reflete pas les performances en base
  DIVERSIFIE MAROC                 strict   18/141  (12.8 %) · rho  0.210 · top10 6/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base
  ACTIONS MAROC                    strict    3/122  (2.5 %) · rho  0.469 · top10 7/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base
  OBLIGATIONS NIGERIA              strict   12/87   (13.8 %) · rho  0.827 · top10 4/10 · ex aequo 1
                                   DIVERGE — le classement ne reflete pas les performances en base
  DIVERSIFIE TUNISIE               strict    3/70   (4.3 %) · rho  0.421 · top10 2/10 · ex aequo 0
                                   DIVERGE — le classement ne reflete pas les performances en base


########## scripts/diag/ondemand/diag_crons_journaux.js ##########

=== VERDICT DE LA DERNIERE EXECUTION DE CHAQUE CRON ===

  cron                   cadence              journal le plus recent                  age  verdict
  ---------------------- -------------------- ---------------------------------- --------  ------------------------
  cron_nigeria_weekly    lundi 10:00          africafunds_nigeria_20260907.log      4.5 j  ECHEC — 1 erreur(s)
  cron_daily_update      lun-ven 20:00        africafunds_daily_20260911.log        0.9 h  ECHEC — 2 erreur(s)
  cron_daily_eur_usd     tous les j 21:30     cron_eur_usd.log                      0.1 h  ECHEC — 2 erreur(s)
  cron_tunisie_daily     lun-ven 19:00        cron_tunisie.log                      3.2 h  OK
  cron_brvm_daily        lun-ven 19:30        cron_brvm.log                         2.7 h  OK
  cron_indices_daily     lun-ven 18:30        cron_indices_daily.log                3.6 h  OK  (reserve : Echecs scraping: 23)
  cron_health_check      tous les j 22:00     africafunds_health_20260911.log       0.2 h  ECHEC — 5 probleme(s)
  sync_production        toutes les heures    sync_production.log                   0.2 h  aucun marqueur de fin


=== FIN DES JOURNAUX EN ECHEC OU SANS VERDICT ===

--- cron_nigeria_weekly (ECHEC — 1 erreur(s)) — /var/log/africafunds_nigeria_20260907.log
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
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Sep  7 10:08:56 AM UTC 2026 ===
  | ========================================

--- cron_daily_update (ECHEC — 2 erreur(s)) — /var/log/africafunds_daily_20260911.log
  | === VERIFICATION FINALE ===
  | ============================================================
  | performences_eurs: 32034 lignes, 1241 fonds
  | performences_usds: 32267 lignes, 1241 fonds
  | Termine.
  | [8/9] OK
  | [9a/9] Classement local...
  | "finishrank"[9a/9] OK (HTTP 200)
  | [9b/9] Classement EUR...
  | "finishrank"[9b/9] OK (HTTP 200)
  | [9c/9] Classement USD...
  | "finishrank"[9c/9] OK (HTTP 200)
  | === MISE A JOUR TERMINEE AVEC 2 ERREUR(S) Fri Sep 11 09:15:36 PM UTC 2026 ===
  | ========================================

--- cron_daily_eur_usd (ECHEC — 2 erreur(s)) — /var/log/cron_eur_usd.log
  | Termine.
  | [1/3] OK
  | --- [2/3] Classements EUR ---
  | 000
  | [2a/3] ERREUR (HTTP 000)
  | --- Classements USD ---
  | 000
  | [2b/3] ERREUR (HTTP 000)
  | --- [3/3] Verification ---
  |   performences_eurs        32034 lignes / 1241 fonds
  |   performences_usds        32267 lignes / 1241 fonds
  |   classementfonds_eurs     3635 lignes / 1235 fonds
  |   classementfonds_usds     3635 lignes / 1235 fonds
  | CRON EUR/USD TERMINE AVEC 2 ERREUR(S) — 2026-09-11 22:06:42

--- cron_health_check (ECHEC — 5 probleme(s)) — /var/log/africafunds_health_20260911.log
  |   nigeria      pas attendu aujourd'hui (pas lundi)
  | === RESUME ===
  | STATUT: 5 PROBLEME(S) DETECTE(S)
  |   [!] TUNISIE: derniere VL il y a 14 jours (budget 9j)
  |   [!] NIGERIA: derniere VL il y a 28 jours (budget 14j)
  |   [!] CEMAC: derniere VL il y a 638 jours (budget 400j)
  |   [!] Performances en retard sur les VL: 396/1234 a jour (32.1 %), retard moyen 67.6 j
  |   [!] Seulement 3 fonds avec perf recente
  |   [OK] MAROC: VL a jour
  |   [OK] UEMOA: VL a jour
  |   [OK] Classement local peuple
  |   [OK] Forex a jour
  | === HEALTH CHECK TERMINE Fri Sep 11 10:00:04 PM UTC 2026 ===
  | ========================================

--- sync_production (aucun marqueur de fin) — /var/log/sync_production.log
  | ============================================
  | Etat production runtime: /var/lib/fundafrica/runtime/PRODUCTION_STATE.json
  | Le depot Git reste une source de code canonique, pas une sortie de cron.
  | ============================================
  | SNAPSHOT PRODUCTION — 2026-09-11 22:00:01
  | ============================================
  | --- Generation du snapshot base de donnees ---
  |   -> Snapshot runtime genere: /var/lib/fundafrica/runtime/PRODUCTION_STATE.json (44746 octets)
  |   -> Git non modifie: aucun add/commit/push
  | ============================================
  | SNAPSHOT TERMINE — 2026-09-11 22:00:16
  | ============================================
  | Etat production runtime: /var/lib/fundafrica/runtime/PRODUCTION_STATE.json
  | Le depot Git reste une source de code canonique, pas une sortie de cron.

=== RESUME : 3 OK · 4 en echec · 1 non verifiable(s) ===
  « non verifiable » ne veut pas dire « sain » : journal absent, illisible,
  ou sans marqueur de fin. A instruire avant de conclure quoi que ce soit.


########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-09-11T22:09:53.887Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 9.09 Mo
   modifie   : 2026-09-07T10:00:29.080Z (il y a 108.2 h)
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
      USD / 10^-2        2 lignes
      USD / 10^0         313 lignes
      USD / 10^1         15 lignes
      USD / 10^2         268 lignes

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


########## scripts/diag/ondemand/diag_devise_declaree_nigeria.js ##########

CSV de rejeu introuvable : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv
Lancer d abord le workflow « OPS — rejeu SEC etape 2 ».


########## scripts/diag/ondemand/diag_ecart_csv_base.js ##########

CSV de rejeu introuvable : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv
Lancer d abord le workflow « OPS — rejeu SEC etape 2 (phase seche) ».


########## scripts/diag/ondemand/diag_import_nigeria.js ##########

=== IMPORT NIGERIA — POURQUOI PLUS AUCUNE VL DEPUIS LE 2026-08-10 ===

[1] Journaux du cron hebdomadaire (/var/log/africafunds_nigeria_*.log)
  africafunds_nigeria_20260803.log  (11726 o, modifie le 2026-08-03 10:08:17)
  africafunds_nigeria_20260810.log  (11878 o, modifie le 2026-08-10 10:08:38)
  africafunds_nigeria_20260817.log  (11463 o, modifie le 2026-08-17 10:02:23)
  africafunds_nigeria_20260824.log  (18071 o, modifie le 2026-08-24 10:08:44)
  africafunds_nigeria_20260831.log  (18095 o, modifie le 2026-08-31 10:09:04)
  africafunds_nigeria_20260907.log  (18093 o, modifie le 2026-09-07 10:08:56)

[2] Fin du dernier journal — /var/log/africafunds_nigeria_20260907.log
  | Fonds SANS dividendes:     1165
  | VL recalculees:            987718
  | Erreurs:                   0
  | 
  | Verification globale:
  |   Total VL (value > 0):     1031711
  |   Avec vl_ajuste > 0:       1031639
  |   Avec vl_ajuste_EUR > 0:   991696
  |   Avec vl_ajuste_USD > 0:   991696
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
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Sep  7 10:08:56 AM UTC 2026 ===
  | ========================================
  | 

[3] Artefacts d extraction attendus a la racine du depot
  present sec_ng_latest.csv                9531356 o, modifie le 2026-09-07 10:00:29 — 7261 lignes
  present sec_ng_audit_latest.csv          25243 o, modifie le 2026-09-07 10:00:29 — 34 lignes
  present sec_ng_coherence_latest.csv      5 o, modifie le 2026-09-07 10:00:29 — 1 lignes
  present sec_ng_coverage_latest.csv       711 o, modifie le 2026-09-07 10:00:29 — 2 lignes
  present sec_ng_fuzzy_latest.csv          471 o, modifie le 2026-09-07 10:00:29 — 3 lignes
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
  HEAD : d57810153 — security(ssh): pin S2 host key across legacy workflows
  present          correctif C8 (lots de performances non menteurs)
  present          budgets de fraicheur en source unique
  present          health check corrige
  present          correctif #73 (present, NON execute)

  Process PM2 :
    api-monolith             online     redemarrages  161  depuis 493.0 h
    fundafrique-frontend     online     redemarrages   48  depuis 638.0 h
    worker-recalculation     online     redemarrages    1  depuis 2564.4 h
    worker-data-import       online     redemarrages    1  depuis 2564.4 h

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

CSV de rejeu introuvable : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv


########## scripts/diag/ondemand/diag_plan_naira.js ##########

CSV de rejeu introuvable : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv


########## scripts/diag/ondemand/diag_plateaux_nigeria.js ##########

CSV de rejeu introuvable : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv
Lancer d abord le workflow « OPS — rejeu SEC etape 2 ».


########## scripts/diag/ondemand/diag_ruptures_restantes.js ##########

=== RUPTURES D ECHELLE RESTANTES — toutes dates confondues ===
Mesure le 2026-09-11 22:09:56 UTC — LECTURE SEULE
Critere : saut d un facteur >= 10 par rapport a la VL precedente du meme fonds

TOTAL : 146 ligne(s) sur 64 fonds

## Repartition par pays et lot d insertion

     86 ligne(s)   NIGERIA | insere le Sun Aug 02
      9 ligne(s)   NIGERIA | insere le Sun May 17
      9 ligne(s)   NIGERIA | insere le Thu Jun 04
      8 ligne(s)   NIGERIA | insere le Mon Aug 31
      6 ligne(s)   NIGERIA | insere le Mon Jun 22
      5 ligne(s)   Nigeria | insere le Mon Aug 31
      4 ligne(s)   NIGERIA | insere le Mon Jun 08
      3 ligne(s)   NIGERIA | insere le Mon Jul 06
      3 ligne(s)   NIGERIA | insere le Mon Jul 13
      2 ligne(s)   NIGERIA | insere le Mon Jun 29
      2 ligne(s)   NIGERIA | insere le Mon Jul 27
      2 ligne(s)   TUNISIE | insere le Fri May 22
      2 ligne(s)   UEMOA | insere le Fri Jun 12
      1 ligne(s)   MAROC | insere le Thu Apr 30
      1 ligne(s)   Nigeria | insere le Thu Jun 04
      1 ligne(s)   Nigeria | insere le Mon Jul 27
      1 ligne(s)   TUNISIE | insere le Thu Apr 30
      1 ligne(s)   UEMOA | insere le Thu Apr 30

## Detail (60 premieres)

  fonds dev  date               valeur     precedente   fact. insere     devise src  nom
  ----- ---- ---------- -------------- -------------- ------- ---------- ------ ---  ---
    790 MAD  Fri Jun 08         0.4600        11.2700    24.5 Thu Apr 30 -      non  UPLINE BONDS
   1141 NGN  Fri Mar 25        92.1946     39043.5368   423.5 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Apr 01     39441.4650        92.1946   427.8 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 15       109.8529    104587.4659   952.1 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 22    114459.8322       109.8529  1041.9 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 12       114.4702    165682.9307  1447.4 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Jan 02    165297.5204       114.6808  1441.4 Sun May 17 -      non  AFRINVEST DOLLAR FUND
   1142 NGN  Fri Jul 18      1990.0300       172.0100    11.6 Sun Aug 02 NGN    oui  AFRINVEST EQUITY FUND
   1142 NGN  Fri Jul 25       170.3400      1990.0300    11.7 Sun Aug 02 NGN    oui  AFRINVEST EQUITY FUND
   1146 NGN  Fri Dec 12         1.0000       100.0000     100 Sun Aug 02 NGN    oui  AIICO MONEY MARKET FUND
   1146 NGN  Fri Dec 19       100.0000         1.0000     100 Sun Aug 02 NGN    oui  AIICO MONEY MARKET FUND
   1153 NGN  Fri Apr 19       523.4007        23.3802    22.4 Sun Aug 02 NGN    oui  ARM ETHICAL FUND
   1153 NGN  Fri Apr 26        23.3905       523.4007    22.4 Sun Aug 02 NGN    oui  ARM ETHICAL FUND
   1156 NGN  Fri Jul 25       339.7568         1.0000   339.8 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Aug 01         1.0000       339.7568   339.8 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Dec 12       100.0000         1.0000     100 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Dec 19         1.0000       100.0000     100 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1158 NGN  Fri Nov 05       107.1500     49755.0000   464.3 Sun Aug 02 NGN    oui  AVA GAM FIXED INCOME DOLLAR FU
   1158 NGN  Fri Nov 12     49931.7000       107.1500     466 Sun May 17 -      non  AVA GAM FIXED INCOME DOLLAR FU
   1168 NGN  Fri Nov 26       415.7564         1.0100   411.6 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Mar 25         1.0259       425.9998   415.2 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Apr 01       427.1666         1.0259   416.4 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1169 NGN  Fri Aug 29 1046071210.6800       552.2000 1894370.2 Sun Aug 02 NGN    oui  NIGERIA ENERGY SECTOR FUND
   1169 NGN  Fri Sep 05       552.2000 1046071210.6800 1894370.2 Sun Aug 02 NGN    oui  NIGERIA ENERGY SECTOR FUND
   1171 NGN  Fri Oct 21       988.8300         1.2200   810.5 Sun Aug 02 NGN    oui  SFS FIXED INCOME FUND
   1171 NGN  Fri Oct 28         1.2200       988.8300   810.5 Sun Aug 02 NGN    oui  SFS FIXED INCOME FUND
   1179 NGN  Fri Dec 03        10.0000       100.0000      10 Sun May 17 NGN    oui  CORDROS MONEY MARKET FUND
   1179 NGN  Fri Dec 10       100.0000        10.0000      10 Sun May 17 NGN    oui  CORDROS MONEY MARKET FUND
   1196 NGN  Fri Dec 05      1668.4600    169387.5400   101.5 Sun Aug 02 NGN    oui  EMERGING AFRICA EUROBOND FUND
   1196 NGN  Fri May 15    156778.4400      1664.5438    94.2 Thu Jun 04 NGN    oui  EMERGING AFRICA EUROBOND FUND
   1206 NGN  Thu Dec 31         0.0100         0.9000      90 Sun Aug 02 NGN    oui  LEGACY EQUITY FUND
   1206 NGN  Fri Jan 22         0.8300         0.0100      83 Sun Aug 02 NGN    oui  LEGACY EQUITY FUND
   1207 NGN  Fri Feb 22         1.0000       100.0000     100 Sun Aug 02 NGN    oui  LEGACY MONEY MARKET FUND
   1209 NGN  Fri Apr 07       100.0000         2.2600    44.2 Sun Aug 02 NGN    oui  CHAPEL HILL DENHAM MONEY MARKE
   1212 NGN  Fri Jan 16       267.4600        26.5700    10.1 Sun May 17 NGN    oui  FRONTIER FUND
   1223 NGN  Fri Dec 08         1.0000       100.0000     100 Sun May 17 -      non  GUARANTY TRUST MONEY MARKET FU
   1223 NGN  Fri Jul 05       100.0000         1.0000     100 Sun May 17 -      non  GUARANTY TRUST MONEY MARKET FU
   1239 NGN  Fri May 15         1.2600      1732.7394  1375.2 Thu Jun 04 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1239 NGN  Fri May 22      1747.0755         1.2600  1386.6 Thu Jun 04 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1239 NGN  Fri May 29         1.2700      1747.0755  1375.6 Mon Jun 08 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1239 NGN  Fri Jun 19      1863.8120         1.2700  1467.6 Mon Jun 29 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1239 NGN  Fri Jun 26         1.3600      1863.8120  1370.4 Mon Jul 06 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1249 NGN  Fri Aug 19       100.0000      1620.0800    16.2 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Aug 26      1622.4100       100.0000    16.2 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Sep 02       100.0000      1622.4100    16.2 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Sep 09      1627.7000       100.0000    16.3 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Apr 05       100.0000      1786.8800    17.9 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Apr 19      1805.4800       100.0000    18.1 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Mar 14       100.0000      1894.6800    18.9 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Mar 21      1902.8600       100.0000      19 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Apr 11       117.7600      1910.2400    16.2 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Thu Apr 17      1916.6600       117.7600    16.3 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Nov 28       100.0000      1973.5600    19.7 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Dec 05      1980.3700       100.0000    19.8 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1252 NGN  Fri Feb 27      4522.0000        45.2200     100 Sun Aug 02 NGN    oui  UNION HOMES REITS
   1252 NGN  Fri Mar 06        45.2200      4522.0000     100 Sun Aug 02 NGN    oui  UNION HOMES REITS
   1255 NGN  Fri Aug 29         1.2926       129.5200   100.2 Sun Aug 02 NGN    oui  STANBIC IBTC BOND FUND
   1255 NGN  Fri Sep 05       129.7700         1.2926   100.4 Sun Aug 02 NGN    oui  STANBIC IBTC BOND FUND
   1259 NGN  Fri Dec 16      7819.0000        78.1900     100 Sun Aug 02 NGN    oui  STANBIC IBTC ETF 30 FUND
   1259 NGN  Fri Dec 30        78.1900      7819.0000     100 Sun Aug 02 NGN    oui  STANBIC IBTC ETF 30 FUND
  ... et 86 autre(s)

## Provenance

  12 ligne(s) SANS provenance — meme signature que les 82 deja retirees
  134 ligne(s) AVEC provenance — a corriger a la source, jamais par suppression aveugle


```
