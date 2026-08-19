# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-19 16:49 UTC**

```
########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-08-19T16:49:38.399Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 4.89 Mo
   modifie   : 2026-08-17T10:00:22.276Z (il y a 54.8 h)
   lignes    : 4221
   colonnes  : 53

   En-tetes pertinents :
      fund_name_clean      present (col 24)
      currency_code        present (col 33)
      vl_price             present (col 44)
      vl_price_source      present (col 45)
      nav_value            present (col 38)
      nav_ngn              present (col 37)
      valuation_date       present (col 12)
      block_type           present (col 11)

## B. Devise emise, fonds en devise etrangere contre les autres

   Fonds DOLLAR / EUROBOND / USD : USD=915  NGN=240
   Tous les autres fonds         : NGN=3066

## C. Echantillon des lignes de fonds en devise etrangere

   fonds                               devise  prix                source       date      
   ----------------------------------  ------  ------------------  -----------  ----------
   Afrinvest Dollar Fund               USD     160284.80000672     offer_price  2026-04-10
   AIICO Eurobond Fund                 NGN     144168.722422       offer_price  2026-04-10
   ARM Eurobond Fund                   NGN     1684.0166063200002  offer_price  2026-04-10
   ARM Short-Term Eurobond Fund        NGN     1458.67099288       offer_price  2026-04-10
   CardinalStone Dollar Fund           USD     1731.23976796       offer_price  2026-04-10
   Comercio Partners Dollar Fund       USD     1532.6815620000002  offer_price  2026-04-10
   Cowry Eurobond Fund                 NGN     1996.4903337800001  offer_price  2026-04-10
   EDC Dollar Fund                     USD     149816.17070000002  offer_price  2026-04-10
   Emerging Africa Eurobond Fund       NGN     1637.43726          offer_price  2026-04-10
   FBN Dollar Fund (Retail)            USD     179907.81600000002  offer_price  2026-04-10
   FBN Specialized Dollar Fund         USD     175627.584          offer_price  2026-04-10
   FSL Eurobond Fund                   NGN     1380.7942           offer_price  2026-04-10
   Futureview Dollar Fund              USD     190908.74417142     offer_price  2026-04-10
   Legacy USD Bond Fund                USD     2071.1913           offer_price  2026-04-10
   Myrtle Dollar Shield Fund           USD     0                   offer_price  2026-04-10
   Norrenberger Dollar Fund            USD     144182.530364       offer_price  2026-04-10
   PACAM Eurobond Fund                 NGN     231669.650876       offer_price  2026-04-10
   United Capital Nigerian Eurobond F  NGN     174755.8394487312   offer_price  2026-04-10
   Alpha10 Dollar Fund                 USD     1394.602142         offer_price  2026-04-10
   AVA GAM Fixed Income Dollar Fund    USD     170845.66636600002  offer_price  2026-04-10
   AXA Mansard Dollar Bond Fund        USD     189652.08337        offer_price  2026-04-10
   CFG AM Fixed Income Dollar Fund     USD     138079.42           offer_price  2026-04-10
   Cordros Dollar Fund                 USD     166840.1            offer_price  2026-04-10
   Coronation Dollar Fund              USD     1453.9762925999999  offer_price  2026-04-10
   FSDH Dollar Fund                    USD     1881.62586953479    offer_price  2026-04-10

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

## E. Ce que cela implique pour l etape 0

   L extracteur emet majoritairement USD (915/1155).
   -> Corriger dev_libelle en USD ALIGNERAIT le referentiel sur la source :
      le contrat accepterait ces mesures, aucun gel. L etape 0 est gratuite.

============================================================
 FIN — aucune ecriture.
============================================================


```
