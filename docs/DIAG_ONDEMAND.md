# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-29 00:15 UTC**

```
########## scripts/diag/ondemand/diag_cas_isoles.js ##########

=== CAS ISOLES — ruptures hors defaut de devise SEC ===
Mesure le 2026-08-29 00:13:48 UTC — LECTURE SEULE

## A. Fonds dont la rupture n est pas un taux de change

  [1169] NIGERIA ENERGY SECTOR FUND — NIGERIA / NGN — actif=1
    date                    value            actif_net        parts   parts impl. devise insere     src
    Fri Aug 01           552.2000           1043231027            -       1889227 NGN    Sun Aug 02 oui
    Fri Aug 08           552.2000           1082899568            -       1961064 NGN    Sun Aug 02 oui
    Fri Aug 15           552.2000           1040200887            -       1883739 NGN    Sun Aug 02 oui
    Fri Aug 22           552.2000           1042267749            -       1887482 NGN    Sun Aug 02 oui
    Fri Aug 29    1046071210.6800           1046071211            -             1 NGN    Sun Aug 02 oui
    Fri Sep 05           552.2000           1040672550            -       1884594 NGN    Sun Aug 02 oui
    Fri Sep 12           552.2000           1047216961            -       1896445 NGN    Sun Aug 02 oui
    Fri Sep 19           552.2000           1047216961            -       1896445 NGN    Sun Aug 02 oui

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
Mesure le 2026-08-29 00:14:41 UTC — LECTURE SEULE

## A. Tables de classement

  classementfonds             3619 lignes — aucune colonne de date
  classementfonds_eurs        3635 lignes — aucune colonne de date
  classementfonds_usds        3635 lignes — aucune colonne de date
  performences               72278 lignes — updated_at max = aucune (?)
  performences_eurs          28654 lignes — date max = Fri Aug 28 2026 00: (1.0 j)
  performences_usds          28887 lignes — date max = Fri Aug 28 2026 00: (1.0 j)

## B. Retard des performances par pays

  pays        fonds  a jour      %  retard moy.  retard max
  ---------- ------ ------- ------ ------------ -----------
  MAROC         640      18  2.8 %       93.6 j       104 j
  TUNISIE       131       7  5.3 %       90.5 j       102 j
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
  cron_nigeria_weekly    lundi 10:00          africafunds_nigeria_20260824.log      4.6 j  ECHEC — 1 erreur(s)
  cron_daily_update      lun-ven 20:00        africafunds_daily_20260828.log        3.3 h  ECHEC — 5 erreur(s)
  cron_daily_eur_usd     tous les j 21:30     cron_eur_usd.log                      2.2 h  ECHEC — 2 erreur(s)
  cron_tunisie_daily     lun-ven 19:00        cron_tunisie.log                      5.2 h  OK
  cron_brvm_daily        lun-ven 19:30        cron_brvm.log                         4.7 h  OK
  cron_indices_daily     lun-ven 18:30        cron_indices_daily.log                5.7 h  OK  (reserve : Echecs scraping: 27)
  cron_health_check      tous les j 22:00     africafunds_health_20260828.log       2.2 h  ECHEC — 4 probleme(s)
  sync_production        toutes les heures    sync_production.log                   0.2 h  aucun marqueur de fin


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
  |   performences_eurs        28654 lignes / 1241 fonds
  |   performences_usds        28887 lignes / 1241 fonds
  |   classementfonds_eurs     3635 lignes / 1235 fonds
  |   classementfonds_usds     3635 lignes / 1235 fonds
  | CRON EUR/USD TERMINE AVEC 2 ERREUR(S) — 2026-08-28 22:03:06

--- cron_health_check (ECHEC — 4 probleme(s)) — /var/log/africafunds_health_20260828.log
  |   nigeria      pas attendu aujourd'hui (pas lundi)
  | === RESUME ===
  | STATUT: 4 PROBLEME(S) DETECTE(S)
  |   [!] NIGERIA: derniere VL il y a 21 jours (budget 14j)
  |   [!] CEMAC: derniere VL il y a 624 jours (budget 400j)
  |   [!] Performances en retard sur les VL: 400/1234 a jour (32.4 %), retard moyen 61.2 j
  |   [!] Seulement 5 fonds avec perf recente
  |   [OK] TUNISIE: VL a jour
  |   [OK] MAROC: VL a jour
  |   [OK] UEMOA: VL a jour
  |   [OK] Classement local peuple
  |   [OK] Forex a jour
  | === HEALTH CHECK TERMINE Fri Aug 28 10:00:03 PM UTC 2026 ===
  | ========================================

--- sync_production (aucun marqueur de fin) — /var/log/sync_production.log
  | SYNC PRODUCTION — 2026-08-29 00:00:01
  | ============================================
  | --- Generation du snapshot base de donnees ---
  |   -> PRODUCTION_STATE.json genere (44780 octets)
  | [claude/code-review-improvements-ikvuj b7cf608d] chore: snapshot production state 2026-08-29 00:00
  |  1 file changed, 364 insertions(+), 364 deletions(-)
  |  rewrite PRODUCTION_STATE.json (72%)
  | fatal: could not read Username for 'https://github.com': No such device or address
  |   -> Push ECHEC
  | ============================================
  | SYNC TERMINE — 2026-08-29 00:00:17
  | ============================================
  | Claude Code peut maintenant lire PRODUCTION_STATE.json
  | pour connaitre l'etat exact de la production.

=== RESUME : 3 OK · 4 en echec · 1 non verifiable(s) ===
  « non verifiable » ne veut pas dire « sain » : journal absent, illisible,
  ou sans marqueur de fin. A instruire avant de conclure quoi que ce soit.


########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-08-29T00:14:45.040Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 8.58 Mo
   modifie   : 2026-08-24T10:00:27.368Z (il y a 110.2 h)
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

=== ECART ENTRE LE FICHIER SEC RELU ET LA BASE ===
Mesure le 2026-08-29 00:14:45 UTC — LECTURE SEULE
CSV : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv

Lignes CSV : 41626
Fonds Nigeria en base : 329
VL Nigeria en base : 77315

## A. Appariement

    40826 ligne(s) CSV appariees a un fonds en base
      646 ligne(s) sans fonds correspondant (nom inconnu)
     1085 ligne(s) dont la date n est pas en base — un import les AJOUTERAIT
    27077 ligne(s) identiques a moins de 1 %
    12664 ligne(s) EN ECART

## B. Nature des ecarts

      378 changement(s) d ECHELLE (facteur >= 10) — les ruptures visees
    12286 ecart(s) mineur(s) (1 % a 10x) — a instruire separement, ne pas corriger en masse

## C. Changements d echelle — ce qu une correction ecrirait

  fonds dev  date                en base    relu dans SEC     fact. dev.relue nom
  ----- ---- ---------- ---------------- ---------------- --------- --------- ---
   1141 NGN  2026-07-10      165207.2996         119.2832    1385.0 USD       AFRINVEST DOLLAR FUND
   2764 NGN  2026-07-10      147826.2937         107.0000    1381.6 USD       AIICO EUROBOND FUND
   1154 NGN  2026-07-10        1708.3601           1.2368    1381.3 USD       ARM EUROBOND FUND
   2861 NGN  2026-07-10        1475.9698           1.0694    1380.2 USD       ARM SHORT-TERM EUROBOND FUND
   2765 USD  2026-07-10        1799.0246           1.2988    1385.1 USD       CARDINALSTONE DOLLAR FUND
   2766 USD  2026-07-10        1391.3469           1.0900    1276.5 USD       COMERCIO PARTNERS DOLLAR FUND
   2767 NGN  2026-07-10        2101.9892           1.5209    1382.1 USD       COWRY EUROBOND FUND
   1196 NGN  2026-07-10      159006.0360         114.9100    1383.7 USD       EMERGING AFRICA EUROBOND FUND
   2878 USD  2026-07-10        2124.6150           1.5300    1388.6 USD       FCMBAM USD Bond Fund
   2876 USD  2026-07-10      183694.8768         132.7800    1383.5 USD       First Asset Dollar Fund (Retai
   2877 USD  2026-07-10      179342.8998         129.6400    1383.4 USD       First Asset Specialized Dollar
   1214 NGN  2026-07-10      203121.3294         147.0575    1381.2 USD       FUTUREVIEW DOLLAR FUND
   1170 NGN  2026-07-10      145053.2573         104.9000    1382.8 USD       NORRENBERGER DOLLAR FUND
   1244 NGN  2026-07-10      224767.7067         168.8500    1331.2 USD       PACAM EUROBOND FUND
   2866 NGN  2026-07-10      167122.1339         120.7800    1383.7 USD       United Capital Nigerian Eurobo
   1158 NGN  2026-07-10      165085.3412         119.2600    1384.2 USD       AVA GAM FIXED INCOME DOLLAR FU
   1160 NGN  2026-07-10      192015.5255         139.0600    1380.8 USD       AXA MANSARD DOLLAR BOND FUND
   2770 USD  2026-07-10      146170.7496         105.8100    1381.4 USD       CFG AM FIXED INCOME DOLLAR FUN
   1175 NGN  2026-07-10      161556.6000         116.9400    1381.5 USD       CORDROS DOLLAR FUND
   2771 USD  2026-07-10        1419.3532           1.0248    1385.0 USD       CORONATION DOLLAR FUND
   1213 NGN  2026-07-10        1920.0700           1.3890    1382.3 USD       FSDH DOLLAR FUND
   2774 USD  2026-07-10       15065.4515          10.8800    1384.7 USD       MERISTEM DOLLAR FUND
   1168 NGN  2026-07-10        1503.7859           1.0845    1386.6 USD       NIGERIA DOLLAR INCOME FUND
   2775 USD  2026-07-10        1499.9230           1.0842    1383.4 USD       PARTHIAN DOLLAR FIXED INCOME F
   1257 NGN  2026-07-10        2355.8702           1.7040    1382.6 USD       STANBIC IBTC DOLLAR FUND
   2776 USD  2026-07-10      162767.5794         117.8200    1381.5 USD       STL DOLLAR FUND
   1274 NGN  2026-07-10        1662.7315           1.2023    1382.9 USD       UNITED CAPITAL GLOBAL FIXED IN
   2857 NGN  2026-07-10      159627.7500         116.2000    1373.7 USD       RMBN DOLLAR FIXED INCOME FUND
   2777 USD  2026-07-10        1641.7479           1.1800    1391.3 USD       VETIVA USD FIXED INCOME FUND
   2858 NGN  2026-07-10        1462.0144           1.0591    1380.4 USD       ARM SPECIALIZED DOLLAR FUND
   2879 USD  2026-07-10      155731.6976         112.3000    1386.7 USD       First Asset Blended Dollar Fun
   2880 USD  2026-07-10       13711.0784           9.9228    1381.8 USD       ValuAlliance Specialized Dolla
   1141 NGN  2026-06-11      162039.7306         118.7592    1364.4 USD       AFRINVEST DOLLAR FUND
   2764 NGN  2026-06-11      145315.5537         106.6300    1362.8 USD       AIICO EUROBOND FUND
   1154 NGN  2026-06-11        1681.9916           1.2352    1361.7 USD       ARM EUROBOND FUND
   2861 NGN  2026-06-11        1452.2827           1.0662    1362.1 USD       ARM SHORT-TERM EUROBOND FUND
   2765 USD  2026-06-11        1766.5625           1.3005    1358.4 USD       CARDINALSTONE DOLLAR FUND
   2767 NGN  2026-06-11        2063.7400           1.5246    1353.6 USD       COWRY EUROBOND FUND
   1189 NGN  2026-06-11      151466.4045         111.6600    1356.5 USD       EDC DOLLAR FUND
   1196 NGN  2026-06-11      156278.8500         114.3909    1366.2 USD       EMERGING AFRICA EUROBOND FUND
   2876 USD  2026-06-11      179937.4508         131.9600    1363.6 USD       First Asset Dollar Fund (Retai
   2877 USD  2026-06-11      175673.0136         128.8400    1363.5 USD       First Asset Specialized Dollar
   1214 NGN  2026-06-11      199875.7820         146.3042    1366.2 USD       FUTUREVIEW DOLLAR FUND
   2809 USD  2026-06-11        1533.6744           1.0060    1524.5 USD       MYRTLE DOLLAR SHIELD FUND
   1170 NGN  2026-06-11      147047.6115         107.8700    1363.2 USD       NORRENBERGER DOLLAR FUND
   1244 NGN  2026-06-11      222603.5165         169.7200    1311.6 USD       PACAM EUROBOND FUND
   2866 NGN  2026-06-11      174368.2666         127.6365    1366.1 USD       United Capital Nigerian Eurobo
   1158 NGN  2026-06-11      162622.4930         119.1200    1365.2 USD       AVA GAM FIXED INCOME DOLLAR FU
   1160 NGN  2026-06-11      189176.1657         138.5800    1365.1 USD       AXA MANSARD DOLLAR BOND FUND
   2770 USD  2026-06-11      143760.7932         105.3200    1365.0 USD       CFG AM FIXED INCOME DOLLAR FUN
   1175 NGN  2026-06-11      158680.4600         116.3100    1364.3 USD       CORDROS DOLLAR FUND
   2771 USD  2026-06-11        1432.9709           1.0529    1361.0 USD       CORONATION DOLLAR FUND
   1213 NGN  2026-06-11        1883.2300           1.3799    1364.8 USD       FSDH DOLLAR FUND
   2774 USD  2026-06-11       14811.1395          10.8400    1366.3 USD       MERISTEM DOLLAR FUND
   1168 NGN  2026-06-11        1530.7572           1.1265    1358.9 USD       NIGERIA DOLLAR INCOME FUND
   2775 USD  2026-06-11        1480.9776           1.0874    1361.9 USD       PARTHIAN DOLLAR FIXED INCOME F
   1257 NGN  2026-06-11        2316.4710           1.6989    1363.5 USD       STANBIC IBTC DOLLAR FUND
   2776 USD  2026-06-11      159840.2900         117.0400    1365.7 USD       STL DOLLAR FUND
   1274 NGN  2026-06-11        1743.8939           1.2756    1367.1 USD       UNITED CAPITAL GLOBAL FIXED IN
   2857 NGN  2026-06-11      158351.2300         116.3300    1361.2 USD       RMBN DOLLAR FIXED INCOME FUND
  ... et 318 autre(s)

  Sens : 339 correction(s) vers une valeur PLUS PETITE, 39 vers une PLUS GRANDE

## D. Devise que l extracteur corrige attribue a ces mesures

     306 ligne(s)   USD (source : column_header_matched_fund)
      43 ligne(s)   NGN (source : column_header_matched_fund)
      29 ligne(s)   NGN (source : column_header)


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
  HEAD : 2ee34e75 — chore: snapshot production state 2026-08-29 00:00
  present          correctif C8 (lots de performances non menteurs)
  present          budgets de fraicheur en source unique
  present          health check corrige
  present          correctif #73 (present, NON execute)

  Process PM2 :
    api-monolith             online     redemarrages  161  depuis 159.1 h
    fundafrique-frontend     online     redemarrages   48  depuis 304.1 h
    worker-recalculation     online     redemarrages    1  depuis 2230.5 h
    worker-data-import       online     redemarrages    1  depuis 2230.5 h

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

=== OPTION DOLLAR — COUT MESURE AVANT ECRITURE ===
Mesure le 2026-08-29 00:14:50 UTC — LECTURE SEULE

Fonds pour lesquels la SEC publie au moins une mesure en dollars : 41

Periode couverte par le rejeu : 2022-01-07 -> 2026-08-14
Les VL hors de cette periode ne sont pas jugees ici — le rejeu ne les couvre pas.

## Cout par fonds (les 30 plus exposes)

  fonds dev      VL  ->USD  trous  hors  reste  nom
  ----- ---- ------ ------ ------ ----- ------  ---
   1141 NGN     236     10    222     4     14  AFRINVEST DOLLAR FUND
   1154 NGN     236     10    222     4     14  ARM EUROBOND FUND
   1196 NGN     236     10    222     4     14  EMERGING AFRICA EUROBOND FUND
   1244 NGN     236     10    222     4     14  PACAM EUROBOND FUND
   1158 NGN     236     10    222     4     14  AVA GAM FIXED INCOME DOLLAR FUND
   1175 NGN     236     10    222     4     14  CORDROS DOLLAR FUND
   1213 NGN     236     10    222     4     14  FSDH DOLLAR FUND
   1168 NGN     236     10    222     4     14  NIGERIA DOLLAR INCOME FUND
   1239 NGN     236     10    222     4     14  NOVA DOLLAR FIXED INCOME FUND
   1257 NGN     236     10    222     4     14  STANBIC IBTC DOLLAR FUND
   1160 NGN     215     10    200     5     15  AXA MANSARD DOLLAR BOND FUND
   1214 NGN     201     10    186     5     15  FUTUREVIEW DOLLAR FUND
   1170 NGN     183     10    169     4     14  NORRENBERGER DOLLAR FUND
   1274 NGN     178     10    164     4     14  UNITED CAPITAL GLOBAL FIXED INCOME
   2866 NGN     175     10    160     5     15  United Capital Nigerian Eurobond F
   1189 NGN     152     10    139     3     13  EDC DOLLAR FUND
   2767 NGN     141     10    128     3     13  COWRY EUROBOND FUND
   2856 NGN     131     10    118     3     13  LEAD DOLLAR FIXED INCOME FUND
   2774 USD     128     12    113     3     15  MERISTEM DOLLAR FUND
   2778 USD     124     12    109     3     15  ZEDCREST DOLLAR FUND
   2765 USD     120     12    105     3     15  CARDINALSTONE DOLLAR FUND
   2764 NGN     114     10    101     3     13  AIICO EUROBOND FUND
   2766 USD     115     12    100     3     15  COMERCIO PARTNERS DOLLAR FUND
   2857 NGN     105     10     92     3     13  RMBN DOLLAR FIXED INCOME FUND
   2861 NGN      79     10     66     3     13  ARM SHORT-TERM EUROBOND FUND
   2776 USD      81     12     66     3     15  STL DOLLAR FUND
   2771 USD      77     12     62     3     15  CORONATION DOLLAR FUND
   2768 NGN      71     10     58     3     13  FSL EUROBOND FUND
   2773 USD     108     12     57    39     51  GUARANTY TRUST DOLLAR FUND
   2775 USD      68     12     53     3     15  PARTHIAN DOLLAR FIXED INCOME FUND
  ... et 11 autre(s) fonds

## Total

     5260 VL en base sur la periode du rejeu
      444 seraient REECRITES en dollars (valeur lue dans la source)
     4648 n ont AUCUNE source dollar — a retirer, sinon melange d echelles
      168 absentes du rejeu (hors periode ou fichier manquant) — inchangees

  Part de la serie perdue : 88.4 %

  *** ATTENTION : l option dollar retirerait plus de la moitie de la serie.
      La SEC ne publie de colonne dollar que pour une minorite de semaines.
      A rearbitrer avant toute ecriture.


########## scripts/diag/ondemand/diag_ruptures_restantes.js ##########

=== RUPTURES D ECHELLE RESTANTES — toutes dates confondues ===
Mesure le 2026-08-29 00:14:54 UTC — LECTURE SEULE
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
