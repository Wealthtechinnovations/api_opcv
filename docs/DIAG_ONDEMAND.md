# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-13 07:29 UTC**

```
########## scripts/diag/ondemand/diag_perimetre_et_couverture_usd.js ##########

============================================================
 PERIMETRE #73 ET FAISABILITE DE LA RE-PROMOTION USD
 Regle actee : la devise du fonds fait foi.
 Genere le 2026-08-13T07:29:40.992Z — LECTURE SEULE
============================================================

## A. Tous les fonds a echelle melangee (ratio > 20x sur 400 jours)

   TOTAL : 44 fonds touches

   fund_id  nom                                 pays     dev_libelle  n_vl  v_min    v_max        ratio
   -------  ----------------------------------  -------  -----------  ----  -------  -----------  -----
   2592     FCP BRIDGE EQUILIBRE                UEMOA    XOF          31    8775.53  44467985.22  5067 
   2866     United Capital Nigerian Eurobond F  NIGERIA  NGN          55    120.96   187995.09    1554 
   1274     UNITED CAPITAL GLOBAL FIXED INCOME  NIGERIA  NGN          55    1.2      1862.57      1548 
   2774     MERISTEM DOLLAR FUND                NIGERIA  USD          55    10.84    16671.8      1538 
   1239     NOVA DOLLAR FIXED INCOME FUND       NIGERIA  NGN          55    1.26     1934.88      1536 
   2809     MYRTLE DOLLAR SHIELD FUND           NIGERIA  USD          16    1        1534.91      1535 
   1154     ARM EUROBOND FUND                   NIGERIA  NGN          55    1.2      1835.75      1535 
   2768     FSL EUROBOND FUND                   NIGERIA  NGN          55    1        1535.04      1535 
   2773     GUARANTY TRUST DOLLAR FUND          NIGERIA  USD          55    100      153355       1534 
   2766     COMERCIO PARTNERS DOLLAR FUND       NIGERIA  USD          55    1.1      1685.77      1533 
   1175     CORDROS DOLLAR FUND                 NIGERIA  NGN          55    116.08   177672.8     1531 
   1170     NORRENBERGER DOLLAR FUND            NIGERIA  NGN          55    105.14   160518.91    1527 
   2771     CORONATION DOLLAR FUND              NIGERIA  USD          55    1.03     1567.58      1524 
   1160     AXA MANSARD DOLLAR BOND FUND        NIGERIA  NGN          55    139.18   211978.8     1523 
   1141     AFRINVEST DOLLAR FUND               NIGERIA  NGN          55    114.47   173958.05    1520 
   1168     NIGERIA DOLLAR INCOME FUND          NIGERIA  NGN          55    1.09     1654.1       1518 
   2856     LEAD DOLLAR FIXED INCOME FUND       NIGERIA  NGN          55    1.15     1734.23      1508 
   1196     EMERGING AFRICA EUROBOND FUND       NIGERIA  NGN          55    115.08   173193.26    1505 
   2772     GREENWICH FIXED INCOME DOLLAR FUND  NIGERIA  USD          50    1.05     1565.74      1498 
   1257     STANBIC IBTC DOLLAR FUND            NIGERIA  NGN          55    1.71     2527.9       1482 
   2861     ARM SHORT-TERM EUROBOND FUND        NIGERIA  NGN          55    1.07     1586.31      1482 
   1158     AVA GAM FIXED INCOME DOLLAR FUND    NIGERIA  NGN          55    119.12   176149.75    1479 
   1189     EDC DOLLAR FUND                     NIGERIA  NGN          55    111.67   164694.22    1475 
   2858     ARM SPECIALIZED DOLLAR FUND         NIGERIA  NGN          55    1.06     1557.45      1471 
   2775     PARTHIAN DOLLAR FIXED INCOME FUND   NIGERIA  USD          55    1.09     1592.79      1465 
   1213     FSDH DOLLAR FUND                    NIGERIA  NGN          55    1.39     2021.7       1453 
   2770     CFG AM FIXED INCOME DOLLAR FUND     NIGERIA  USD          50    105.95   153503.79    1449 
   2764     AIICO EUROBOND FUND                 NIGERIA  NGN          55    107.15   153503.79    1433 
   2777     VETIVA USD FIXED INCOME FUND        NIGERIA  USD          55    1.18     1684.17      1427 
   2857     RMBN DOLLAR FIXED INCOME FUND       NIGERIA  NGN          55    115.54   164832.37    1427 
   2778     ZEDCREST DOLLAR FUND                NIGERIA  USD          55    1.53     2182.1       1426 
   1244     PACAM EUROBOND FUND                 NIGERIA  NGN          55    169.49   240333.67    1418 
   1214     FUTUREVIEW DOLLAR FUND              NIGERIA  NGN          55    145.04   203121.33    1400 
   2878     FCMBAM USD Bond Fund                Nigeria  USD          14    1.52     2124.61      1398 
   2776     STL DOLLAR FUND                     NIGERIA  USD          55    117.98   164931.7     1398 
   2880     ValuAlliance Specialized Dollar Fu  Nigeria  USD          13    9.86     13711.08     1391 
   2767     COWRY EUROBOND FUND                 NIGERIA  NGN          55    1.51     2101.99      1389 
   2879     First Asset Blended Dollar Fund     Nigeria  USD          14    112.5    155940.58    1386 
   2769     ALPHA10 DOLLAR FUND                 NIGERIA  USD          20    1.01     1394.6       1382 
   2877     First Asset Specialized Dollar Fun  Nigeria  USD          14    129.85   179342.9     1381 
   2876     First Asset Dollar Fund (Retail)    Nigeria  USD          14    133      183694.88    1381 
   2765     CARDINALSTONE DOLLAR FUND           NIGERIA  USD          55    1.3      1799.02      1380 
   2796     FSDH HALAL FUND                     NIGERIA  NGN          53    138.21   13988.38     101  
   1251     SIAML ETF 40                        NIGERIA  NGN          53    320      14414.73     45   

   Repartition par pays et devise declaree :

     NIGERIA / NGN          25 fonds
     NIGERIA / USD          13 fonds
     Nigeria / USD          5 fonds
     UEMOA / XOF            1 fonds

## B. Fonds dont le NOM indique une devise etrangere mais dev_libelle dit autre chose

   (dev_libelle designe desormais la devise canonique : ces lignes doivent etre
    tranchees sur preuve prospectus ou SEC avant toute correction automatique)

   29 fonds a arbitrer

   id    nom                                 pays     dev_libelle  active
   ----  ----------------------------------  -------  -----------  ------
   1141  AFRINVEST DOLLAR FUND               NIGERIA  NGN          1     
   2764  AIICO EUROBOND FUND                 NIGERIA  NGN          1     
   1154  ARM EUROBOND FUND                   NIGERIA  NGN          1     
   2861  ARM SHORT-TERM EUROBOND FUND        NIGERIA  NGN          1     
   2858  ARM SPECIALIZED DOLLAR FUND         NIGERIA  NGN          1     
   1158  AVA GAM FIXED INCOME DOLLAR FUND    NIGERIA  NGN          1     
   1160  AXA MANSARD DOLLAR BOND FUND        NIGERIA  NGN          1     
   1175  CORDROS DOLLAR FUND                 NIGERIA  NGN          1     
   2767  COWRY EUROBOND FUND                 NIGERIA  NGN          1     
   1189  EDC DOLLAR FUND                     NIGERIA  NGN          1     
   1196  EMERGING AFRICA EUROBOND FUND       NIGERIA  NGN          1     
   1199  FBN DOLLAR FUND (RETAIL)            NIGERIA  NGN          1     
   2899  FBN Nigeria Eurobond USD Fund       NIGERIA  NGN          1     
   1204  FBN SPECIALIZED DOLLAR FUND         NIGERIA  NGN          1     
   1213  FSDH DOLLAR FUND                    NIGERIA  NGN          1     
   2768  FSL EUROBOND FUND                   NIGERIA  NGN          1     
   1214  FUTUREVIEW DOLLAR FUND              NIGERIA  NGN          1     
   2856  LEAD DOLLAR FIXED INCOME FUND       NIGERIA  NGN          1     
   1208  LEGACY USD BOND FUND                NIGERIA  NGN          1     
   1168  NIGERIA DOLLAR INCOME FUND          NIGERIA  NGN          1     
   2812  NIGERIAN EUROBOND FUND              NIGERIA  NGN          1     
   1170  NORRENBERGER DOLLAR FUND            NIGERIA  NGN          1     
   1239  NOVA DOLLAR FIXED INCOME FUND       NIGERIA  NGN          1     
   1244  PACAM EUROBOND FUND                 NIGERIA  NGN          1     
   2857  RMBN DOLLAR FIXED INCOME FUND       NIGERIA  NGN          1     
   1257  STANBIC IBTC DOLLAR FUND            NIGERIA  NGN          1     
   1272  UNITED CAPITAL EUROBOND FUND        NIGERIA  NGN          1     
   2866  United Capital Nigerian Eurobond F  NIGERIA  NGN          1     
   1224  VANTAGE DOLLAR FUND                 NIGERIA  NGN          1     

## C. Couverture USD dans sec_ng_observations pour les fonds touches


Erreur fatale : Table 'fund_opcvm.sec_ng_observations' doesn't exist
```
