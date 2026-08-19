# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-19 19:57 UTC**

```
########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-08-19T19:57:10.215Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 4.89 Mo
   modifie   : 2026-08-17T10:00:22.276Z (il y a 57.9 h)
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


```
