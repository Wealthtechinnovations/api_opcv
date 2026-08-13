# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-13 07:48 UTC**

```
########## scripts/diag/ondemand/diag_staging_et_cas_particuliers.js ##########

============================================================
 STAGING REEL, SOURCES SEC ET CAS HORS TAUX DE CHANGE
 Genere le 2026-08-13T07:48:15.081Z — LECTURE SEULE
============================================================

## A. Tables de staging / alias / audit reellement presentes

   TABLE_NAME                TABLE_ROWS  mb    CREATE_TIME                             
   ------------------------  ----------  ----  ----------------------------------------
   brvm_boc_navs_raw         111994      37.6  Fri Jun 12 2026 17:06:37 GMT+0000 (Coord
   brvm_boc_sources          1103        0.3   Fri Jun 12 2026 17:06:37 GMT+0000 (Coord
   brvm_fund_aliases         102         0.0   Fri Jun 12 2026 17:06:37 GMT+0000 (Coord
   brvm_import_logs          45          0.1   Fri Jun 12 2026 17:06:37 GMT+0000 (Coord
   brvm_missing_navs         2           0.0   Fri Jun 12 2026 17:06:37 GMT+0000 (Coord
   cmf_extreme_variations    0           0.0   Tue Jun 02 2026 18:01:38 GMT+0000 (Coord
   cmf_import_audit          29          0.0   Tue Jun 02 2026 18:01:38 GMT+0000 (Coord
   cmf_new_funds_queue       0           0.0   Tue Jun 02 2026 18:01:38 GMT+0000 (Coord
   recalc_audit              0           0.0   Thu May 21 2026 21:04:43 GMT+0000 (Coord
   sec_ng_corrections_audit  48980       15.5  Sat Aug 01 2026 12:29:51 GMT+0000 (Coord

   Attendu par les scripts, mais ABSENT de la base :

     sec_ng_observations
     sec_ng_fund_aliases
     sec_ng_load_logs
     bvmac_boc_navs_raw
     bvmac_boc_sources
     bvmac_fund_aliases
     bvmac_import_logs
     bvmac_missing_navs

## B. Fichiers sources SEC sur le serveur

   sec_ng_downloads     553 fichiers, 106.6 Mo
                        types : .xls:108 .xlsx:445
                        modifies du 2026-05-17 au 2026-08-10
   data/sec_ng          ABSENT
   data/brvm_boc        1339 fichiers, 3674.8 Mo
                        types : .log:122 .pdf:1141 .json:76
                        modifies du 2026-06-12 au 2026-08-12
   data/bvmac_boc       ABSENT

## C. Fonds 1196 — les trois echelles, avec provenance

   ordre  currency_code  price_type  data_quality  n    v_min      v_max      d_min                                     d_max                                     docs  na_ngn_moy  parts_implicites
   -----  -------------  ----------  ------------  ---  ---------  ---------  ----------------------------------------  ----------------------------------------  ----  ----------  ----------------
   2      NULL           NULL        NULL          2    115.08     115.22     Fri Jul 17 2026 00:00:00 GMT+0000 (Coord  Fri Jul 24 2026 00:00:00 GMT+0000 (Coord  0     NULL        NULL            
   3      NGN            BID         OK            21   1607.21    1704.45    Fri Nov 28 2025 00:00:00 GMT+0000 (Coord  Fri Apr 17 2026 00:00:00 GMT+0000 (Coord  21    4885187540  2960624         
   3      NGN            BID         REVIEW        2    1654.6     1664.54    Fri Apr 24 2026 00:00:00 GMT+0000 (Coord  Fri May 08 2026 00:00:00 GMT+0000 (Coord  2     4920835656  2965120         
   4      NULL           NULL        QUARANTINE    22   41920.23   45424.79   Fri May 14 2021 00:00:00 GMT+0000 (Coord  Fri Nov 04 2022 00:00:00 GMT+0000 (Coord  0     NULL        NULL            
   4      NGN            BID         OK            106  42190.63   98324.9    Fri Dec 03 2021 00:00:00 GMT+0000 (Coord  Fri Jan 26 2024 00:00:00 GMT+0000 (Coord  104   1186239483  20918           
   4      NGN            BID         REVIEW        1    45607.49   45607.49   Fri Oct 28 2022 00:00:00 GMT+0000 (Coord  Fri Oct 28 2022 00:00:00 GMT+0000 (Coord  1     909194645   19935           
   4      NGN            UNIT_PRICE  OK            8    41920.23   42894.74   Fri Jun 04 2021 00:00:00 GMT+0000 (Coord  Fri Nov 26 2021 00:00:00 GMT+0000 (Coord  8     679356386   15997           
   5      NGN            BID         OK            109  101962.04  184236.11  Fri Nov 10 2023 00:00:00 GMT+0000 (Coord  Fri Jul 10 2026 00:00:00 GMT+0000 (Coord  109   4655078370  28108           
   5      NGN            OFFER       OK            1    165401.48  165401.48  Fri Oct 31 2025 00:00:00 GMT+0000 (Coord  Fri Oct 31 2025 00:00:00 GMT+0000 (Coord  1     4691023420  28361           

   Lecture : si `parts_implicites` (actif net / valeur) est stable entre deux
   ordres de grandeur, la valeur est la meme mesure dans deux unites. S il varie
   d un facteur equivalent, ce sont deux mesures differentes.


## D. Fonds hors taux de change : 2592, 2796, 1251

   fund_id  nom                   pays     dev_libelle  ordre  n    v_min        v_max        d_min                                     d_max                                     a_devise
   -------  --------------------  -------  -----------  -----  ---  -----------  -----------  ----------------------------------------  ----------------------------------------  --------
   1251     SIAML ETF 40          NIGERIA  NGN          1      73   49           98           Fri Jan 14 2022 00:00:00 GMT+0000 (Coord  Fri Aug 11 2023 00:00:00 GMT+0000 (Coord  73      
   1251     SIAML ETF 40          NIGERIA  NGN          2      369  100          950.4        Fri Feb 03 2017 00:00:00 GMT+0000 (Coord  Fri Dec 12 2025 00:00:00 GMT+0000 (Coord  366     
   1251     SIAML ETF 40          NIGERIA  NGN          3      45   1010         9349.99      Fri Feb 02 2024 00:00:00 GMT+0000 (Coord  Fri Jul 10 2026 00:00:00 GMT+0000 (Coord  45      
   1251     SIAML ETF 40          NIGERIA  NGN          4      6    10350        14414.73     Fri Feb 06 2026 00:00:00 GMT+0000 (Coord  Fri Apr 17 2026 00:00:00 GMT+0000 (Coord  6       
   2592     FCP BRIDGE EQUILIBRE  UEMOA    XOF          3      23   5184         8963.3       Fri Oct 15 2021 00:00:00 GMT+0000 (Coord  Fri May 15 2026 00:00:00 GMT+0000 (Coord  0       
   2592     FCP BRIDGE EQUILIBRE  UEMOA    XOF          7      104  29487443.46  44467985.22  Mon Jun 26 2023 00:00:00 GMT+0000 (Coord  Fri Mar 13 2026 00:00:00 GMT+0000 (Coord  0       
   2796     FSDH HALAL FUND       NIGERIA  NGN          2      1    138.21       138.21       Fri May 15 2026 00:00:00 GMT+0000 (Coord  Fri May 15 2026 00:00:00 GMT+0000 (Coord  1       
   2796     FSDH HALAL FUND       NIGERIA  NGN          3      134  1021.66      1411.78      Fri Dec 08 2023 00:00:00 GMT+0000 (Coord  Fri Jul 10 2026 00:00:00 GMT+0000 (Coord  134     
   2796     FSDH HALAL FUND       NIGERIA  NGN          4      1    13988.38     13988.38     Thu Jun 11 2026 00:00:00 GMT+0000 (Coord  Thu Jun 11 2026 00:00:00 GMT+0000 (Coord  1       

## E. Incoherence de casse sur le champ pays

   pays     nb_fonds
   -------  --------
   CEMAC    34      
   MAROC    644     
   NIGERIA  326     
   TUNISIE  131     
   UEMOA    118     

============================================================
 FIN — aucune ecriture effectuee.
============================================================


```
