# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-13 07:07 UTC**

```
########## scripts/diag/ondemand/diag_scale_1141_1196.js ##########

============================================================
 DIAGNOSTIC ECHELLES — FONDS 1141 ET 1196 (LECTURE SEULE)
 Genere le 2026-08-13T07:07:30.229Z
============================================================

## A. Segments par ordre de grandeur et provenance

   fund_id  ordre  currency_code  price_type  data_quality  n    d_min                               d_max                               v_min      v_max      nb_docs  doc_min  doc_max  ecart_j  a_url
   -------  -----  -------------  ----------  ------------  ---  ----------------------------------  ----------------------------------  ---------  ---------  -------  -------  -------  -------  -----
   1141     1      NGN            BID         OK            2    Fri Mar 18 2022 00:00:00 GMT+0000   Fri Mar 25 2022 00:00:00 GMT+0000   92.19      94.93      2        386      387      0.0      2    
   1141     2      NULL           NULL        NULL          2    Fri Jul 17 2026 00:00:00 GMT+0000   Fri Jul 24 2026 00:00:00 GMT+0000   119.75     119.92     0        NULL     NULL     NULL     0    
   1141     2      NGN            BID         OK            5    Fri Aug 05 2022 00:00:00 GMT+0000   Fri Dec 19 2025 00:00:00 GMT+0000   104.9      114.55     5        1172     406      0.0      5    
   1141     2      NGN            BID         REVIEW        4    Fri Sep 08 2023 00:00:00 GMT+0000   Wed Dec 24 2025 00:00:00 GMT+0000   108.25     114.68     4        1171     366      0.0      4    
   1141     4      NULL           NULL        QUARANTINE    51   Wed Jul 29 2020 00:00:00 GMT+0000   Fri Sep 15 2023 00:00:00 GMT+0000   37777.47   79948.24   0        NULL     NULL     NULL     0    
   1141     4      NGN            BID         OK            102  Fri Dec 03 2021 00:00:00 GMT+0000   Fri Jan 26 2024 00:00:00 GMT+0000   37867.54   99182.97   100      1169     478      -0.1     102  
   1141     4      NGN            BID         REVIEW        1    Fri Oct 28 2022 00:00:00 GMT+0000   Fri Oct 28 2022 00:00:00 GMT+0000   46672      46672      1        418      418      0.0      1    
   1141     4      NGN            UNIT_PRICE  OK            21   Fri Sep 04 2020 00:00:00 GMT+0000   Fri Nov 26 2021 00:00:00 GMT+0000   37777.47   45886.26   21       427      531      0.0      21   
   1141     5      NULL           NULL        QUARANTINE    2    Fri Mar 08 2024 00:00:00 GMT+0000   Fri Jan 02 2026 00:00:00 GMT+0000   165297.52  167631.12  0        NULL     NULL     NULL     0    
   1141     5      NGN            BID         OK            121  Fri Dec 01 2023 00:00:00 GMT+0000   Fri Jul 10 2026 00:00:00 GMT+0000   104587.47  185518.25  121      1170     1497     0.0      121  
   1141     5      NGN            BID         REVIEW        1    Fri Mar 27 2026 00:00:00 GMT+0000   Fri Mar 27 2026 00:00:00 GMT+0000   160508.04  160508.04  1        1473     1473     0.0      1    
   1141     5      NGN            OFFER       OK            1    Fri Oct 31 2025 00:00:00 GMT+0000   Fri Oct 31 2025 00:00:00 GMT+0000   162130.6   162130.6   1        1388     1388     -7.0     1    
   1196     2      NULL           NULL        NULL          2    Fri Jul 17 2026 00:00:00 GMT+0000   Fri Jul 24 2026 00:00:00 GMT+0000   115.08     115.22     0        NULL     NULL     NULL     0    
   1196     3      NGN            BID         OK            21   Fri Nov 28 2025 00:00:00 GMT+0000   Fri Apr 17 2026 00:00:00 GMT+0000   1607.21    1704.45    21       1423     1473     0.0      21   
   1196     3      NGN            BID         REVIEW        2    Fri Apr 24 2026 00:00:00 GMT+0000   Fri May 08 2026 00:00:00 GMT+0000   1654.6     1664.54    2        1474     1480     0.0      2    
   1196     4      NULL           NULL        QUARANTINE    22   Fri May 14 2021 00:00:00 GMT+0000   Fri Nov 04 2022 00:00:00 GMT+0000   41920.23   45424.79   0        NULL     NULL     NULL     0    
   1196     4      NGN            BID         OK            106  Fri Dec 03 2021 00:00:00 GMT+0000   Fri Jan 26 2024 00:00:00 GMT+0000   42190.63   98324.9    104      1169     478      -0.1     106  
   1196     4      NGN            BID         REVIEW        1    Fri Oct 28 2022 00:00:00 GMT+0000   Fri Oct 28 2022 00:00:00 GMT+0000   45607.49   45607.49   1        418      418      0.0      1    
   1196     4      NGN            UNIT_PRICE  OK            8    Fri Jun 04 2021 00:00:00 GMT+0000   Fri Nov 26 2021 00:00:00 GMT+0000   41920.23   42894.74   8        448      473      0.0      8    
   1196     5      NGN            BID         OK            109  Fri Nov 10 2023 00:00:00 GMT+0000   Fri Jul 10 2026 00:00:00 GMT+0000   101962.04  184236.11  109      1170     374      0.0      109  
   1196     5      NGN            OFFER       OK            1    Fri Oct 31 2025 00:00:00 GMT+0000   Fri Oct 31 2025 00:00:00 GMT+0000   165401.48  165401.48  1        1388     1388     -7.0     1    

## B. Documents SEC produisant PLUSIEURS ordres de grandeur

   (si cette liste est non vide, le defaut est dans la LECTURE des colonnes,
    pas dans la source : le meme document a donne deux unites)

   (aucune ligne)

## C. Detail des 30 dernieres observations par fonds

### Fonds 1141

   date                                value        currency_code  price_type  data_quality  sec_document_id  report_date                         up_ngn  na_ngn      correction_batch        
   ----------------------------------  -----------  -------------  ----------  ------------  ---------------  ----------------------------------  ------  ----------  ------------------------
   Fri Jan 02 2026 00:00:00 GMT+0000   165297.5204  NULL           NULL        QUARANTINE    NULL             NULL                                NULL    NULL        NULL                    
   Fri Jan 09 2026 00:00:00 GMT+0000   163410.5003  NGN            BID         OK            1462             Fri Jan 09 2026 00:00:00 GMT+0000   NULL    3456462538  SECNGFIX_20260802_113036
   Fri Jan 16 2026 00:00:00 GMT+0000   163189.9683  NGN            BID         OK            1463             Fri Jan 16 2026 00:00:00 GMT+0000   NULL    3448614322  SECNGFIX_20260802_113036
   Fri Jan 23 2026 00:00:00 GMT+0000   163221.772   NGN            BID         OK            1464             Fri Jan 23 2026 00:00:00 GMT+0000   NULL    3456462538  SECNGFIX_20260802_113036
   Fri Jan 30 2026 00:00:00 GMT+0000   159300.9585  NGN            BID         OK            1465             Fri Jan 30 2026 00:00:00 GMT+0000   NULL    3456462538  SECNGFIX_20260802_113036
   Fri Feb 06 2026 00:00:00 GMT+0000   157137.0625  NGN            BID         OK            1466             Fri Feb 06 2026 00:00:00 GMT+0000   NULL    3456462538  SECNGFIX_20260802_113036
   Fri Feb 13 2026 00:00:00 GMT+0000   156975.5786  NGN            BID         OK            1467             Fri Feb 13 2026 00:00:00 GMT+0000   NULL    3456462538  SECNGFIX_20260802_113036
   Fri Feb 20 2026 00:00:00 GMT+0000   156238.0033  NGN            BID         OK            1468             Fri Feb 20 2026 00:00:00 GMT+0000   NULL    3456462538  SECNGFIX_20260802_113036
   Fri Feb 27 2026 00:00:00 GMT+0000   158237.7152  NGN            BID         OK            1469             Fri Feb 27 2026 00:00:00 GMT+0000   NULL    3407118694  SECNGFIX_20260802_113036
   Fri Mar 06 2026 00:00:00 GMT+0000   161660.8405  NGN            BID         OK            1470             Fri Mar 06 2026 00:00:00 GMT+0000   NULL    3468580468  SECNGFIX_20260802_113036
   Fri Mar 13 2026 00:00:00 GMT+0000   159496.9095  NGN            BID         OK            1471             Fri Mar 13 2026 00:00:00 GMT+0000   NULL    3426846916  SECNGFIX_20260802_113036
   Wed Mar 18 2026 00:00:00 GMT+0000   157166.9154  NGN            BID         OK            1472             Wed Mar 18 2026 00:00:00 GMT+0000   NULL    3653416496  SECNGFIX_20260802_113036
   Fri Mar 27 2026 00:00:00 GMT+0000   160508.0444  NGN            BID         REVIEW        1473             Fri Mar 27 2026 00:00:00 GMT+0000   NULL    3735390091  SECNGFIX_20260802_113036
   Thu Apr 02 2026 00:00:00 GMT+0000   160284.8     NGN            BID         OK            1452             Thu Apr 02 2026 00:00:00 GMT+0000   NULL    3731322307  SECNGFIX_20260802_113036
   Fri Apr 10 2026 00:00:00 GMT+0000   158457.8622  NGN            BID         OK            1459             Fri Apr 10 2026 00:00:00 GMT+0000   NULL    3641997287  SECNGFIX_20260802_113036
   Fri Apr 17 2026 00:00:00 GMT+0000   157239.0445  NGN            BID         OK            1460             Fri Apr 17 2026 00:00:00 GMT+0000   NULL    3608597260  SECNGFIX_20260802_113036
   Fri Apr 24 2026 00:00:00 GMT+0000   159951.386   NGN            BID         OK            1474             Fri Apr 24 2026 00:00:00 GMT+0000   NULL    3677091271  SECNGFIX_20260802_113036
   Thu Apr 30 2026 00:00:00 GMT+0000   162054.6436  NGN            BID         OK            1479             Thu Apr 30 2026 00:00:00 GMT+0000   NULL    3745979692  SECNGFIX_20260802_113036
   Fri May 08 2026 00:00:00 GMT+0000   160435.0913  NGN            BID         OK            1480             Fri May 08 2026 00:00:00 GMT+0000   NULL    3709446677  SECNGFIX_20260802_113036
   Fri May 15 2026 00:00:00 GMT+0000   161105.7318  NGN            BID         OK            1481             Fri May 15 2026 00:00:00 GMT+0000   NULL    3707113315  SECNGFIX_20260802_113036
   Fri May 22 2026 00:00:00 GMT+0000   162536.0838  NGN            BID         OK            1482             Fri May 22 2026 00:00:00 GMT+0000   NULL    3767679546  SECNGFIX_20260802_113036
   Fri May 29 2026 00:00:00 GMT+0000   162547.4661  NGN            BID         OK            1483             Fri May 29 2026 00:00:00 GMT+0000   NULL    3768603401  SECNGFIX_20260802_113036
   Fri Jun 05 2026 00:00:00 GMT+0000   161775.243   NGN            BID         OK            1484             Fri Jun 05 2026 00:00:00 GMT+0000   NULL    3766716737  SECNGFIX_20260802_113036
   Thu Jun 11 2026 00:00:00 GMT+0000   162039.7306  NGN            BID         OK            1494             Thu Jun 11 2026 00:00:00 GMT+0000   NULL    4474242742  SECNGFIX_20260802_113036
   Fri Jun 19 2026 00:00:00 GMT+0000   162898.6567  NGN            BID         OK            1488             Fri Jun 19 2026 00:00:00 GMT+0000   NULL    4497960045  SECNGFIX_20260802_113036
   Fri Jun 26 2026 00:00:00 GMT+0000   164298.9775  NGN            BID         OK            1491             Fri Jun 26 2026 00:00:00 GMT+0000   NULL    4532910642  SECNGFIX_20260802_113036
   Fri Jul 03 2026 00:00:00 GMT+0000   163440.6955  NGN            BID         OK            1496             Fri Jul 03 2026 00:00:00 GMT+0000   NULL    4491877609  SECNGFIX_20260802_113036
   Fri Jul 10 2026 00:00:00 GMT+0000   165207.2996  NGN            BID         OK            1497             Fri Jul 10 2026 00:00:00 GMT+0000   NULL    4565312531  SECNGFIX_20260802_113036
   Fri Jul 17 2026 00:00:00 GMT+0000   119.7484     NULL           NULL        NULL          NULL             NULL                                NULL    NULL        NULL                    
   Fri Jul 24 2026 00:00:00 GMT+0000   119.9184     NULL           NULL        NULL          NULL             NULL                                NULL    NULL        NULL                    

### Fonds 1196

   date                                value        currency_code  price_type  data_quality  sec_document_id  report_date                         up_ngn  na_ngn      correction_batch        
   ----------------------------------  -----------  -------------  ----------  ------------  ---------------  ----------------------------------  ------  ----------  ------------------------
   Fri Jan 02 2026 00:00:00 GMT+0000   1655.2377    NGN            BID         OK            1461             Fri Jan 02 2026 00:00:00 GMT+0000   NULL    4994155670  SECNGFIX_20260802_113036
   Fri Jan 09 2026 00:00:00 GMT+0000   1675         NGN            BID         OK            1462             Fri Jan 09 2026 00:00:00 GMT+0000   NULL    4996545217  SECNGFIX_20260802_113036
   Fri Jan 16 2026 00:00:00 GMT+0000   1648.08      NGN            BID         OK            1463             Fri Jan 16 2026 00:00:00 GMT+0000   NULL    4985802483  SECNGFIX_20260802_113036
   Fri Jan 23 2026 00:00:00 GMT+0000   1658.36      NGN            BID         OK            1464             Fri Jan 23 2026 00:00:00 GMT+0000   NULL    5003986596  SECNGFIX_20260802_113036
   Fri Jan 30 2026 00:00:00 GMT+0000   1646.39      NGN            BID         OK            1465             Fri Jan 30 2026 00:00:00 GMT+0000   NULL    4896445941  SECNGFIX_20260802_113036
   Fri Feb 06 2026 00:00:00 GMT+0000   1617.85      NGN            BID         OK            1466             Fri Feb 06 2026 00:00:00 GMT+0000   NULL    4770963447  SECNGFIX_20260802_113036
   Fri Feb 13 2026 00:00:00 GMT+0000   1615.64      NGN            BID         OK            1467             Fri Feb 13 2026 00:00:00 GMT+0000   NULL    4542542511  SECNGFIX_20260802_113036
   Fri Feb 20 2026 00:00:00 GMT+0000   1607.21      NGN            BID         OK            1468             Fri Feb 20 2026 00:00:00 GMT+0000   NULL    4744094867  SECNGFIX_20260802_113036
   Fri Feb 27 2026 00:00:00 GMT+0000   1634.17      NGN            BID         OK            1469             Fri Feb 27 2026 00:00:00 GMT+0000   NULL    4888024873  SECNGFIX_20260802_113036
   Fri Mar 06 2026 00:00:00 GMT+0000   1674.31      NGN            BID         OK            1470             Fri Mar 06 2026 00:00:00 GMT+0000   NULL    4933014157  SECNGFIX_20260802_113036
   Fri Mar 13 2026 00:00:00 GMT+0000   1637.02      NGN            BID         OK            1471             Fri Mar 13 2026 00:00:00 GMT+0000   NULL    4816698273  SECNGFIX_20260802_113036
   Wed Mar 18 2026 00:00:00 GMT+0000   1637.4373    NGN            BID         OK            1472             Wed Mar 18 2026 00:00:00 GMT+0000   NULL    4819919339  SECNGFIX_20260802_113036
   Fri Mar 27 2026 00:00:00 GMT+0000   1637.4373    NGN            BID         OK            1473             Fri Mar 27 2026 00:00:00 GMT+0000   NULL    4819919339  NULL                    
   Thu Apr 02 2026 00:00:00 GMT+0000   1637.4373    NGN            BID         OK            1452             Thu Apr 02 2026 00:00:00 GMT+0000   NULL    4819919339  NULL                    
   Fri Apr 10 2026 00:00:00 GMT+0000   1637.4373    NGN            BID         OK            1459             Fri Apr 10 2026 00:00:00 GMT+0000   NULL    4819919339  NULL                    
   Fri Apr 17 2026 00:00:00 GMT+0000   1640.53      NGN            BID         OK            1460             Fri Apr 17 2026 00:00:00 GMT+0000   NULL    4825912815  SECNGFIX_20260802_113036
   Fri Apr 24 2026 00:00:00 GMT+0000   1654.6       NGN            BID         REVIEW        1474             Fri Apr 24 2026 00:00:00 GMT+0000   NULL    4904016054  SECNGFIX_20260802_113036
   Thu Apr 30 2026 00:00:00 GMT+0000   159101.7117  NGN            BID         OK            1479             Thu Apr 30 2026 00:00:00 GMT+0000   NULL    4973855076  SECNGFIX_20260802_113036
   Fri May 08 2026 00:00:00 GMT+0000   1664.5438    NGN            BID         REVIEW        1480             Fri May 08 2026 00:00:00 GMT+0000   NULL    4937655257  SECNGFIX_20260802_113036
   Fri May 15 2026 00:00:00 GMT+0000   156778.44    NGN            BID         OK            1481             Fri May 15 2026 00:00:00 GMT+0000   NULL    4664178621  SECNGFIX_20260802_113036
   Fri May 22 2026 00:00:00 GMT+0000   157051.5375  NGN            BID         OK            1482             Fri May 22 2026 00:00:00 GMT+0000   NULL    4412335125  SECNGFIX_20260802_113036
   Fri May 29 2026 00:00:00 GMT+0000   157245       NGN            BID         OK            1483             Fri May 29 2026 00:00:00 GMT+0000   NULL    4446746329  SECNGFIX_20260802_113036
   Fri Jun 05 2026 00:00:00 GMT+0000   156143.5922  NGN            BID         OK            1484             Fri Jun 05 2026 00:00:00 GMT+0000   NULL    4415526174  SECNGFIX_20260802_113036
   Thu Jun 11 2026 00:00:00 GMT+0000   156278.85    NGN            BID         OK            1494             Thu Jun 11 2026 00:00:00 GMT+0000   NULL    4415767364  SECNGFIX_20260802_113036
   Fri Jun 19 2026 00:00:00 GMT+0000   157228.76    NGN            BID         OK            1488             Fri Jun 19 2026 00:00:00 GMT+0000   NULL    4440687109  SECNGFIX_20260802_113036
   Fri Jun 26 2026 00:00:00 GMT+0000   158855.52    NGN            BID         OK            1491             Fri Jun 26 2026 00:00:00 GMT+0000   NULL    4484901063  SECNGFIX_20260802_113036
   Fri Jul 03 2026 00:00:00 GMT+0000   157426.7     NGN            BID         OK            1496             Fri Jul 03 2026 00:00:00 GMT+0000   NULL    4447567151  SECNGFIX_20260802_113036
   Fri Jul 10 2026 00:00:00 GMT+0000   159006.036   NGN            BID         OK            1497             Fri Jul 10 2026 00:00:00 GMT+0000   NULL    4487913642  SECNGFIX_20260802_113036
   Fri Jul 17 2026 00:00:00 GMT+0000   115.08       NULL           NULL        NULL          NULL             NULL                                NULL    NULL        NULL                    
   Fri Jul 24 2026 00:00:00 GMT+0000   115.22       NULL           NULL        NULL          NULL             NULL                                NULL    NULL        NULL                    


## D. Lignes ou unit_price_ngn est renseigne : coincide-t-il avec value ?

   fund_id  date                                value       up_ngn      na_ngn     currency_code  price_type  data_quality  identique
   -------  ----------------------------------  ----------  ----------  ---------  -------------  ----------  ------------  ---------
   1141     Fri Sep 04 2020 00:00:00 GMT+0000   40608.0951  40608.0951  595072778  NGN            UNIT_PRICE  OK            1        
   1141     Fri Sep 25 2020 00:00:00 GMT+0000   37777.4726  37777.4726  553612243  NGN            UNIT_PRICE  OK            1        
   1141     Fri Nov 06 2020 00:00:00 GMT+0000   40003.778   40003.7780  627161876  NGN            UNIT_PRICE  OK            1        
   1141     Fri Dec 04 2020 00:00:00 GMT+0000   39966.0806  39966.0806  653667167  NGN            UNIT_PRICE  OK            1        
   1141     Thu Dec 31 2020 00:00:00 GMT+0000   43254.9668  43254.9668  690500384  NGN            UNIT_PRICE  OK            1        
   1141     Fri Jan 08 2021 00:00:00 GMT+0000   43725.6469  43725.6469  697629640  NGN            UNIT_PRICE  OK            1        
   1141     Fri Jan 29 2021 00:00:00 GMT+0000   43286.1585  43286.1585  690149715  NGN            UNIT_PRICE  OK            1        
   1141     Fri Feb 05 2021 00:00:00 GMT+0000   43400.37    43400.3700  689204077  NGN            UNIT_PRICE  OK            1        
   1141     Fri Feb 12 2021 00:00:00 GMT+0000   43286.1585  43286.1585  626927152  NGN            UNIT_PRICE  OK            1        
   1141     Fri Mar 05 2021 00:00:00 GMT+0000   41786.8345  41786.8345  636715452  NGN            UNIT_PRICE  OK            1        
   1141     Fri Mar 26 2021 00:00:00 GMT+0000   41135.8262  41135.8262  633875802  NGN            UNIT_PRICE  OK            1        
   1141     Fri Apr 09 2021 00:00:00 GMT+0000   41310.5452  41310.5452  642098901  NGN            UNIT_PRICE  OK            1        
   1141     Fri May 07 2021 00:00:00 GMT+0000   41878.2114  41878.2114  653599682  NGN            UNIT_PRICE  OK            1        
   1141     Fri Jun 04 2021 00:00:00 GMT+0000   45886.257   45886.2570  721772954  NGN            UNIT_PRICE  OK            1        
   1141     Fri Jul 09 2021 00:00:00 GMT+0000   45761.0581  45761.0581  740426448  NGN            UNIT_PRICE  OK            1        
   1141     Fri Aug 06 2021 00:00:00 GMT+0000   45600.377   45600.3770  725567486  NGN            UNIT_PRICE  OK            1        
   1141     Fri Sep 03 2021 00:00:00 GMT+0000   45540.4054  45540.4054  744509964  NGN            UNIT_PRICE  OK            1        
   1141     Fri Sep 24 2021 00:00:00 GMT+0000   44986.2238  44986.2238  766403988  NGN            UNIT_PRICE  OK            1        
   1141     Fri Nov 05 2021 00:00:00 GMT+0000   43635.9771  43635.9771  773188295  NGN            UNIT_PRICE  OK            1        
   1141     Fri Nov 19 2021 00:00:00 GMT+0000   42856.2124  42856.2124  753331790  NGN            UNIT_PRICE  OK            1        
   1141     Fri Nov 26 2021 00:00:00 GMT+0000   41081.8367  41081.8367  722863135  NGN            UNIT_PRICE  OK            1        
   1196     Fri Jun 04 2021 00:00:00 GMT+0000   41920.2319  41920.2319  615541338  NGN            UNIT_PRICE  OK            1        
   1196     Fri Jul 09 2021 00:00:00 GMT+0000   42045.9536  42045.9536  614877308  NGN            UNIT_PRICE  OK            1        
   1196     Fri Aug 06 2021 00:00:00 GMT+0000   42153.8945  42153.8945  610863734  NGN            UNIT_PRICE  OK            0        
   1196     Fri Sep 03 2021 00:00:00 GMT+0000   42407.2476  42407.2476  674829634  NGN            UNIT_PRICE  OK            1        
   1196     Fri Sep 24 2021 00:00:00 GMT+0000   42532.5027  42532.5027  748685298  NGN            UNIT_PRICE  OK            0        
   1196     Fri Nov 05 2021 00:00:00 GMT+0000   42756.39    42756.3900  717660554  NGN            UNIT_PRICE  OK            1        
   1196     Fri Nov 19 2021 00:00:00 GMT+0000   42855.7386  42855.7386  726418784  NGN            UNIT_PRICE  OK            0        
   1196     Fri Nov 26 2021 00:00:00 GMT+0000   42894.7404  42894.7404  725974442  NGN            UNIT_PRICE  OK            0        

## E. Rapport net_assets_ngn / value par ordre de grandeur

   (un rapport stable = nombre de parts coherent ; un rapport qui saute
    d un facteur ~1000 signale un changement d unite sur value)

   fund_id  ordre  n    ratio_min  ratio_moy  ratio_max  d_min                               d_max                             
   -------  -----  ---  ---------  ---------  ---------  ----------------------------------  ----------------------------------
   1141     1      2    6782153    6810853    6839554    Fri Mar 18 2022 00:00:00 GMT+0000   Fri Mar 25 2022 00:00:00 GMT+0000 
   1141     2      9    6917260    20932273   31135300   Fri Aug 05 2022 00:00:00 GMT+0000   Wed Dec 24 2025 00:00:00 GMT+0000 
   1141     4      124  14483      16374      19075      Fri Sep 04 2020 00:00:00 GMT+0000   Fri Jan 26 2024 00:00:00 GMT+0000 
   1141     5      123  15430      18161      27634      Fri Dec 01 2023 00:00:00 GMT+0000   Fri Jul 10 2026 00:00:00 GMT+0000 
   1196     3      23   2811606    2961015    3025219    Fri Nov 28 2025 00:00:00 GMT+0000   Fri May 08 2026 00:00:00 GMT+0000 
   1196     4      115  14491      20567      24914      Fri Jun 04 2021 00:00:00 GMT+0000   Fri Jan 26 2024 00:00:00 GMT+0000 
   1196     5      110  23924      28111      31671      Fri Nov 10 2023 00:00:00 GMT+0000   Fri Jul 10 2026 00:00:00 GMT+0000 

============================================================
 FIN — aucune ecriture effectuee.
============================================================


```
