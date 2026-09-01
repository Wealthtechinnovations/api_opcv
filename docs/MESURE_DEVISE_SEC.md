# Mesure de la devise apres correctif d extraction

> Genere par `ops-sec-extract-dryrun.yml`. Ne pas modifier a la main.
> Extraction de TEST, bornee, ecrivant dans `sec_ng_devise_test.csv`.
> Ni `sec_ng_latest.csv` ni la base ne sont touches.

Derniere execution : **2026-08-29 14:45 UTC**

## Reference AVANT correctif (lot AE)

Etiquette USD repartie sur six ordres de grandeur, dont **238 lignes a 10^5**
— des nairas etiquetes dollars. Le correctif est valide si cette dispersion disparait.

```
==============================================
 1. RECUPERER LE CORRECTIF
==============================================
Commit courant : bea2e9c6 chore: snapshot production state 2026-08-29 14:00

Le correctif est-il bien present ?
8
  -> correctif de devise present

==============================================
 2. TESTS DU NOYAU (sans reseau)
==============================================
  OK    NavRecord.vl_currency_source
  OK    NavRecord.vl_currency_confidence
  OK    ColumnBlock.price_columns

  40 verifications OK, 0 echec(s)


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

   === Fonds en devise etrangere : valeur par colonne ===

   --- DOLLAR FUNDS ---

   --- EUROBONDS ---

   --- Afrinvest Dollar Fund ---
      c3   NAV, Unit Price and Yiel = 3317083.12
      c4   NAV (N)                  = 4578187370.852264
      c6   Bid Price ($)            = 119.9184
      c7   Bid Price (N)            = 165509.54092848
      c8   Offer Price ($)          = 119.9184
      c9   Offer Price (N)          = 165509.54092848
      c13  NAV, Unit Price and Yiel = 3312565.92
      c14  NAV (N)                  = 4512001651.2486725
      c16  Bid Price ($)            = 120.1259
      c17  Bid Price (N)            = 163621.87870294
      c18  Offer Price ($)          = 120.1259

--- Fichier du 10 avril 2026 : le SEUL encore incoherent ---
Apres correctif, toutes les lignes fautives restantes portent cette date.
Sa structure differe donc des quatre autres fichiers, qui sont propres.

Fichier : Net_Asset_Value_and_Unit_Price_as_at_10th_April_2026.xlsx
Taille  : 125 Ko

=== Feuille « Weekly Valuation » — 14 premieres lignes, 28 colonnes ===

   ligne | c3   | c5   | c6   | c10  | c12  | c13  | c17  | c18 
   ------+------+------+------+------+------+------+------+-----
       1 | NAV, Unit Price and Yield  |                            |                            | NAV, Unit Price and Yield  |                            |                            | % Change (Current from Pre |                           
       2 | NAV (N)                    | Bid Price (N)              | Offer Price (N)            | NAV (N)                    | Bid Price (N)              | Offer Price (N)            | NAV (%)                    | Unit Price (%)            
       5 | 10196027074.07             | 790.647                    | 794.1546                   | 10385460485.78             | 802.1324                   | 805.7062                   | 0.01857913973097993        | 0.014545782395518465      
       6 | 1794091931.85              | 532.7479                   | 539.6337                   | 1807192968.54              | 536.9699                   | 543.9225                   | 0.007302321836145131       | 0.007947613353280267      
       7 | 13390572116.61             | 67.1674                    | 69.1925                    | 14089650102.39             | 68.4121                    | 70.4748                    | 0.052206730204816636       | 0.018532355385338102      
       8 | 2299920059.65              | 316.0827                   | 316.0827                   | 2439502334.13              | 322.7073                   | 322.7073                   | 0.060690054810531774       | 0.02095843904142804       
       9 | 6556404938.68              | 2.4489                     | 2.4788                     | 7060077309.34              | 2.5212                     | 2.5543                     | 0.0768214250600275         | 0.030458286267548772      
      10 | 575754146.9                | 286.0856                   | 288.4676                   | 590258688.9                | 294.6197                   | 297.0934                   | 0.02519224929268156        | 0.02990214498959318       
      11 | 5144896219.59              | 555.4                      | 563.8                      | 5308402755.85              | 567.26                     | 575.84                     | 0.031780337111062304       | 0.02135509045760922       
      12 | 552242451.58               | 275.83                     | 288.08                     | 613362440.67               | 306.38                     | 320.02                     | 0.11067600637207774        | 0.11087198000555401       
      13 | 123196265.4739             | 427.7364                   | 441.9325                   | 125792078.0914             | 436.5425                   | 451.0928                   | 0.02107054631497684        | 0.02072782608203743       

   Cellules fusionnees (25 premieres) : B77:V77, A213:V213, B140:V140, A5:V5, B253:V253, A254:V254, A141:V141, A206:V206, B119:V119, A121:V121, A28:V28, U2:V2, B205:V205, A249:V249, B172:V172, A173:V173, B240:U240, B211:V211, R2:T2, A1:V1, A241:V241, B216:V216, D2:J2, A78:V78, B163:V163

   === Fonds en devise etrangere : valeur par colonne ===

   --- DOLLAR FUNDS ---

   --- EUROBONDS ---

   --- Afrinvest Dollar Fund ---
      c3   NAV, Unit Price and Yiel = 3731322306.89101
      c5   Bid Price (N)            = 160284.80000672
      c6   Offer Price (N)          = 160284.80000672
      c10  NAV, Unit Price and Yiel = 3641997287.177214
      c12  Bid Price (N)            = 158457.86222195998
      c13  Offer Price (N)          = 158457.86222195998
      c17  NAV (%)                  = -0.023939239863795772
      c18  Unit Price (%)           = -0.01139807258507002


==============================================
 3. EXTRACTION BORNEE — sortie de TEST isolee
==============================================
Sortie : sec_ng_devise_test.csv (sec_ng_latest.csv n est PAS touche)
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_10th_April_2026.xlsx | rows=222 | dates=2026-04-10
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_10th_July_2026.xlsx | rows=223 | dates=2026-07-10
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_11th_June_2026.xlsx | rows=222 | dates=2026-06-11
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_13th_February_2026.xlsx | rows=216 | dates=2026-02-13
[OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_13th_March_2026.xlsx | rows=219 | dates=2026-03-13

Extraction terminée.
Lignes extraites avant filtre qualité : 1102
Lignes écrites : 1102
Fichiers / feuilles audités : 5
Lignes de cohérence inter-fichiers : 0
Lignes de couverture annuelle : 1
Suggestions fuzzy naming : 2
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
 Genere le 2026-08-29T14:45:22.285Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : sec_ng_devise_test.csv
   taille    : 1.38 Mo
   modifie   : 2026-08-29T14:45:22.128Z (il y a 0.0 h)
   lignes    : 1102
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

   [devise de la MESURE] fonds DOLLAR/EUROBOND : NGN=114  USD=80
   Tous les autres fonds         : NGN=906  USD=2

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
      NGN / 10^3         58 lignes
      NGN / 10^4         3 lignes
      NGN / 10^5         51 lignes
      USD / 10^0         42 lignes
      USD / 10^1         2 lignes
      USD / 10^2         36 lignes

## F. Ce que cela implique pour l etape 0

   USD occupe les ordres [0, 1, 2]
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


Verification finale : sec_ng_latest.csv intact ?
-rw-r--r-- 1 root root 8999633 Aug 24 10:00 sec_ng_latest.csv
```
