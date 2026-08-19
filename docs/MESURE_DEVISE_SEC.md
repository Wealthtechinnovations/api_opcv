# Mesure de la devise apres correctif d extraction

> Genere par `ops-sec-extract-dryrun.yml`. Ne pas modifier a la main.
> Extraction de TEST, bornee, ecrivant dans `sec_ng_devise_test.csv`.
> Ni `sec_ng_latest.csv` ni la base ne sont touches.

Derniere execution : **2026-08-19 17:38 UTC**

## Reference AVANT correctif (lot AE)

Etiquette USD repartie sur six ordres de grandeur, dont **238 lignes a 10^5**
— des nairas etiquetes dollars. Le correctif est valide si cette dispersion disparait.

```
==============================================
 1. RECUPERER LE CORRECTIF
==============================================
Commit courant : ae8259ad chore: snapshot production state 2026-08-19 17:00

Le correctif est-il bien present ?
2
  -> correctif de devise present

==============================================
 2. TESTS DU NOYAU (sans reseau)
==============================================
  OK    ColumnBlock.unit_price_header
  OK    NavRecord.vl_currency_source
  OK    NavRecord.vl_currency_confidence

  21 verifications OK, 0 echec(s)


==============================================
 2bis. STRUCTURE REELLE DES EN-TETES
==============================================
La mesure du lot AG montre que la devise n est PAS lisible dans
l en-tete de colonne. On regarde donc ou elle se trouve vraiment.

Fichier : Net_Asset_Value_and_Unit_Price_as_at_24th_July_2026.xlsx
Taille  : 137 Ko

=== Feuille « Weekly Valuation » — 14 premieres lignes, 111 colonnes ===

   ligne | c3   | c4   | c6   | c7   | c8   | c9   | c13  | c14  | c16  | c17  | c18  | c19  | c23  | c24 
   ------+------+------+------+------+------+------+------+------+------+------+------+------+------+-----
       1 | NAV, Unit Price and Yield  |                            |                            |                            |                            |                            | NAV, Unit Price and Yield  |                            |                            |                            |                            |                            | % Change (Current from Pre |                           
       2 | NAV ($)                    | NAV (N)                    | Bid Price ($)              | Bid Price (N)              | Offer Price ($)            | Offer Price (N)            | NAV ($)                    | NAV (N)                    | Bid Price ($)              | Bid Price (N)              | Offer Price ($)            | Offer Price (N)            | NAV (%)                    | Unit Price (%)            
       5 | N/A                        | 12077755584.47             | N/A                        | 875.9587                   | N/A                        | 886.3596                   | N/A                        | 12543114635.32             | N/A                        | 895.8178                   | N/A                        | 906.3944                   | 0.03853025900345055        | 0.022603467035275545      
       6 | N/A                        | 2252336266.07              | N/A                        | 596.1191                   | N/A                        | 604.7703                   | N/A                        | 2291570453.31              | N/A                        | 602.6626                   | N/A                        | 611.1302                   | 0.017419329356383243       | 0.010516224093676434      
       7 | N/A                        | 18134971347.59             | N/A                        | 72.6423                    | N/A                        | 74.80884392                | N/A                        | 18486159883.82             | N/A                        | 73.61                      | N/A                        | 75.8                       | 0.019365265568873913       | 0.013249183225715007      
       8 | N/A                        | 3307340527.22              | N/A                        | 367.1195                   | N/A                        | 367.1195                   | N/A                        | 3587813322.23              | N/A                        | 372.0329                   | N/A                        | 372.0329                   | 0.0848031198183735         | 0.013383653006718432      
       9 | N/A                        | 12751119005.43             | N/A                        | 2.8906                     | N/A                        | 2.9272                     | N/A                        | 13055068874.2              | N/A                        | 2.9338                     | N/A                        | 2.9734                     | 0.02383711332633355        | 0.015783000819896077      
      10 | N/A                        | 788877643.9                | N/A                        | 0.9747                     | N/A                        | 1.0011                     | N/A                        | 881078035.11               | N/A                        | 0.994                      | N/A                        | 1.023                      | 0.11687540130328193        | 0.021875936469882937      
      11 | N/A                        | 604418419.91               | N/A                        | 328.2217                   | N/A                        | 331.1232                   | N/A                        | 759602522.13               | N/A                        | 348.1193                   | N/A                        | 350.6057                   | 0.2567494588320248         | 0.058837616935328046      
      12 | N/A                        | 4242086855.58              | N/A                        | 8.1                        | N/A                        | 8.28                       | N/A                        | 4279099263.41              | N/A                        | 8.2                        | N/A                        | 8.37                       | 0.008725047150157749       | 0.010869565217391288      
      13 | N/A                        | 6944335234.81              | N/A                        | 612.14                     | N/A                        | 620.27                     | N/A                        | 6904064184.06              | N/A                        | 611.07                     | N/A                        | 620.41                     | -0.005799122506087054      | 0.00022570815934993852    

   Cellules fusionnees (25 premieres) : B214:AB214, B219:AB219, B235:AB235, B242:AA242, B120:AB120, B29:AB29, B243:AB243, B234:AB234, B174:AB174, B28:AB28, B257:AB257, B164:AB164, A1:AB1, B142:AB142, B256:AB256, B5:AB5, B80:AB80, B207:AB207, B213:AB213, D2:M2, B79:AB79, N2:W2, B4:AB4, X2:Z2, B173:AB173


==============================================
 3. EXTRACTION BORNEE — sortie de TEST isolee
==============================================
Sortie : sec_ng_devise_test.csv (sec_ng_latest.csv n est PAS touche)
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_10th_April_2026.xlsx | rows=222 | dates=2026-04-10
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_10th_July_2026.xlsx | rows=41 | dates=2026-07-10
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_11th_June_2026.xlsx | rows=41 | dates=2026-06-11
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_13th_February_2026.xlsx | rows=216 | dates=2026-02-13
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_13th_March_2026.xlsx | rows=219 | dates=2026-03-13

Extraction terminée.
Lignes extraites avant filtre qualité : 739
Lignes écrites : 739
Fichiers / feuilles audités : 5
Lignes de cohérence inter-fichiers : 0
Lignes de couverture annuelle : 1
Suggestions fuzzy naming : 1
CSV données : sec_ng_devise_test.csv
CSV audit : sec_ng_nav_audit_v6.csv
CSV cohérence : sec_ng_nav_coherence_v6.csv
CSV couverture annuelle : sec_ng_nav_annual_coverage_v6.csv
CSV fuzzy names : sec_ng_nav_fuzzy_names_v6.csv
Code de sortie extraction : 0

==============================================
 4. MESURE DE LA SORTIE
==============================================

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-08-19T17:38:34.226Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : sec_ng_devise_test.csv
   taille    : 0.93 Mo
   modifie   : 2026-08-19T17:38:34.048Z (il y a 0.0 h)
   lignes    : 739
   colonnes  : 55

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

   Fonds DOLLAR / EUROBOND / USD : USD=170  NGN=24
   Tous les autres fonds         : NGN=543  USD=2

## C. Echantillon des lignes de fonds en devise etrangere

   fonds                           devise  prix                source_prix           source_devise                   
   ------------------------------  ------  ------------------  --------------------  --------------------------------
   Afrinvest Dollar Fund           USD     160284.80000672     offer_price_fallback  inferred_fund_name              
   AIICO Eurobond Fund             NGN     144168.722422       offer_price_fallback  inferred_default_nigeria_context
   ARM Eurobond Fund               NGN     1684.0166063200002  offer_price_fallback  inferred_default_nigeria_context
   ARM Short-Term Eurobond Fund    NGN     1458.67099288       offer_price_fallback  inferred_default_nigeria_context
   CardinalStone Dollar Fund       USD     1731.23976796       offer_price_fallback  inferred_fund_name              
   Comercio Partners Dollar Fund   USD     1532.6815620000002  offer_price_fallback  inferred_fund_name              
   Cowry Eurobond Fund             NGN     1996.4903337800001  offer_price_fallback  inferred_default_nigeria_context
   EDC Dollar Fund                 USD     149816.17070000002  offer_price_fallback  inferred_fund_name              
   Emerging Africa Eurobond Fund   NGN     1637.43726          offer_price_fallback  inferred_default_nigeria_context
   FBN Dollar Fund (Retail)        USD     179907.81600000002  offer_price_fallback  inferred_fund_name              
   FBN Specialized Dollar Fund     USD     175627.584          offer_price_fallback  inferred_fund_name              
   FSL Eurobond Fund               NGN     1380.7942           offer_price_fallback  inferred_default_nigeria_context
   Futureview Dollar Fund          USD     190908.74417142     offer_price_fallback  inferred_fund_name              
   Legacy USD Bond Fund            USD     2071.1913           offer_price_fallback  inferred_fund_name              
   Myrtle Dollar Shield Fund       USD     0                   offer_price_fallback  inferred_fund_name              
   Norrenberger Dollar Fund        USD     144182.530364       offer_price_fallback  inferred_fund_name              
   PACAM Eurobond Fund             NGN     231669.650876       offer_price_fallback  inferred_default_nigeria_context
   United Capital Nigerian Eurobo  NGN     174755.8394487312   offer_price_fallback  inferred_default_nigeria_context
   Alpha10 Dollar Fund             USD     1394.602142         offer_price_fallback  inferred_fund_name              
   AVA GAM Fixed Income Dollar Fu  USD     170845.66636600002  offer_price_fallback  inferred_fund_name              
   AXA Mansard Dollar Bond Fund    USD     189652.08337        offer_price_fallback  inferred_fund_name              
   CFG AM Fixed Income Dollar Fun  USD     138079.42           offer_price_fallback  inferred_fund_name              
   Cordros Dollar Fund             USD     166840.1            offer_price_fallback  inferred_fund_name              
   Coronation Dollar Fund          USD     1453.9762925999999  offer_price_fallback  inferred_fund_name              
   FSDH Dollar Fund                USD     1881.62586953479    offer_price_fallback  inferred_fund_name              

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
      NGN / 10^3         15 lignes
      NGN / 10^5         9 lignes
      USD / 10^0         42 lignes
      USD / 10^1         2 lignes
      USD / 10^2         36 lignes
      USD / 10^3         43 lignes
      USD / 10^4         3 lignes
      USD / 10^5         42 lignes

   Lignes etiquetees USD avec un prix > 10 000 (incoherent pour un prix unitaire en dollars) :

   fonds                             devise  prix              date      
   --------------------------------  ------  ----------------  ----------
   Afrinvest Dollar Fund             USD     160284.80000672   2026-04-10
   EDC Dollar Fund                   USD     149816.170700000  2026-04-10
   FBN Dollar Fund (Retail)          USD     179907.816000000  2026-04-10
   FBN Specialized Dollar Fund       USD     175627.584        2026-04-10
   Futureview Dollar Fund            USD     190908.74417142   2026-04-10
   Norrenberger Dollar Fund          USD     144182.530364     2026-04-10
   AVA GAM Fixed Income Dollar Fund  USD     170845.666366000  2026-04-10
   AXA Mansard Dollar Bond Fund      USD     189652.08337      2026-04-10
   CFG AM Fixed Income Dollar Fund   USD     138079.42         2026-04-10
   Cordros Dollar Fund               USD     166840.1          2026-04-10
   Guaranty Trust Dollar Fund        USD     138672            2026-04-10
   Meristem Dollar Fund              USD     14733.0741140000  2026-04-10

## F. Ce que cela implique pour l etape 0

   L etiquette NE PREDIT PAS l echelle : USD couvre 6 ordres de grandeur,
   NGN en couvre 2. Une meme etiquette recouvre donc des unites differentes.

   -> Corriger dev_libelle en USD serait DANGEREUX : le contrat accepterait des
      valeurs en naira portant une etiquette USD, c est-a-dire de la donnee fausse
      avec un label rassurant. Pire que le blocage.

   -> Le defaut est en amont, dans l extracteur : `choose_vl_price` retient
      `offer_price` en priorite sans savoir de quelle colonne devise il provient,
      tandis que `infer_currency` deduit la devise du contexte. Les deux peuvent
      donc se contredire. C est la reparation a mener AVANT toute etape 0,
      ce qui confirme l arbitrage B.

============================================================
 FIN — aucune ecriture.
============================================================


Verification finale : sec_ng_latest.csv intact ?
-rw-r--r-- 1 root root 5125964 Aug 17 10:00 sec_ng_latest.csv
```
