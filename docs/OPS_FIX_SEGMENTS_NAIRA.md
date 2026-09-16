# Segments en dollars vers naira — journal des operations

> Genere par `ops-fix-segments-naira.yml`. Ne pas modifier a la main.

Derniere execution : **2026-09-16 21:48 UTC**
Mode : **dry-run**
Declencheur : `push` — par `Wealthtechinnovations`

```
Commit avant mise a jour : 8895783f9 chore(ops): refresh AF-OPS-007 dry-run preflight
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
   8895783f9..750c793ec  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Updating 8895783f9..750c793ec
Fast-forward
 .github/workflows/ops-fix-segments-naira.yml |  4 ++++
 docs/OPS_FIX_SEGMENTS_NAIRA.md               | 29 ++++++++++++++++++++--------
 2 files changed, 25 insertions(+), 8 deletions(-)
Commit retenu        : 750c793ec feat(ops): add source-aware C7 diagnostic to dry-run

==============================================
 1. PERIMETRE (dry-run de controle)
==============================================

=== SEGMENTS EN DOLLARS -> NAIRA PUBLIE ===
CSV       : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv
Mode      : DRY-RUN (aucune ecriture)
Critere   : prix_naira_publie / valeur_en_base >= 100
A corriger: 157 VL sur 30 fonds

  fonds date             en base       -> naira  rapport  nom
  ----- ---------- ------------- -------------- --------  ---
   1163 2022-05-06          1.04        1099.95     1063  CARDINALSTONE FIXED INCOME
   1171 2022-05-06          1.03         318.80      310  SFS FIXED INCOME FUND
   1183 2022-05-06          1.47         189.15      129  CORONATION FIXED INCOME FU
   1195 2022-05-06          1.03        1444.40     1396  EMERGING AFRICA BOND FUND
   1220 2022-05-06          0.70        1151.97     1648  GDL INCOME FUND
   1239 2026-05-15          1.26        1715.35     1361  NOVA DOLLAR FIXED INCOME F
   1239 2026-05-29          1.27        1747.08     1376  NOVA DOLLAR FIXED INCOME F
   1239 2026-06-05          1.27        1743.96     1373  NOVA DOLLAR FIXED INCOME F
   1239 2026-06-11          1.27        1730.01     1362  NOVA DOLLAR FIXED INCOME F
   1239 2026-06-26          1.36        1863.81     1370  NOVA DOLLAR FIXED INCOME F
   1239 2026-07-03          1.36        1878.06     1381  NOVA DOLLAR FIXED INCOME F
   1239 2026-07-10          1.36        1859.12     1367  NOVA DOLLAR FIXED INCOME F
   1245 2022-05-06         11.71        4073.15      348  PACAM FIXED INCOME FUND
   1271 2022-05-27          1.11        1490.00     1348  UNITED CAPITAL EQUITY FUND
   1273 2022-05-06          2.00        3537.83     1767  UNITED CAPITAL FIXED INCOM
   1277 2024-06-14          1.23         689.00      559  UNITED CAPITAL SUKUK FUND
   2765 2026-07-24          1.31        1801.83     1380  CARDINALSTONE DOLLAR FUND
   2765 2026-07-31          1.30        1773.85     1362  CARDINALSTONE DOLLAR FUND
   2765 2026-08-07          1.30        1785.39     1368  CARDINALSTONE DOLLAR FUND
   2765 2026-08-14          1.31        1785.77     1366  CARDINALSTONE DOLLAR FUND
   2766 2026-05-29          1.11        1528.13     1375  COMERCIO PARTNERS DOLLAR F
   2766 2026-06-05          1.11        1525.69     1373  COMERCIO PARTNERS DOLLAR F
   2766 2026-06-11          1.11        1513.42     1362  COMERCIO PARTNERS DOLLAR F
   2766 2026-06-26          1.12        1534.91     1370  COMERCIO PARTNERS DOLLAR F
   2766 2026-07-24          1.10        1518.20     1380  COMERCIO PARTNERS DOLLAR F
   2766 2026-07-31          1.10        1498.30     1362  COMERCIO PARTNERS DOLLAR F
   2766 2026-08-07          1.10        1503.13     1368  COMERCIO PARTNERS DOLLAR F
   2766 2026-08-14          1.10        1502.25     1366  COMERCIO PARTNERS DOLLAR F
   2768 2026-05-15          1.00        1361.39     1361  FSL EUROBOND FUND
   2768 2026-05-22          1.00        1371.04     1371  FSL EUROBOND FUND
   2768 2026-05-29          1.00        1375.46     1375  FSL EUROBOND FUND
   2768 2026-06-05          1.00        1373.25     1373  FSL EUROBOND FUND
   2768 2026-06-11          1.00        1362.21     1362  FSL EUROBOND FUND
   2768 2026-06-19          1.00        1363.83     1364  FSL EUROBOND FUND
   2768 2026-06-26          1.00        1370.46     1370  FSL EUROBOND FUND
   2768 2026-07-03          1.00        1380.93     1381  FSL EUROBOND FUND
   2768 2026-07-10          1.00        1370.19     1370  FSL EUROBOND FUND
   2769 2026-05-22          1.01        1384.75     1373  ALPHA10 DOLLAR FUND
   2769 2026-05-29          1.01        1387.56     1375  ALPHA10 DOLLAR FUND
   2769 2026-06-11          1.01        1375.83     1362  ALPHA10 DOLLAR FUND
   2769 2026-06-19          1.01        1377.46     1364  ALPHA10 DOLLAR FUND
   2769 2026-06-26          1.01        1384.16     1370  ALPHA10 DOLLAR FUND
   2769 2026-07-03          1.01        1394.74     1381  ALPHA10 DOLLAR FUND
   2769 2026-07-10          1.01        1383.89     1370  ALPHA10 DOLLAR FUND
   2769 2026-07-17          1.01        1393.42     1380  ALPHA10 DOLLAR FUND
   2769 2026-07-24          1.01        1393.99     1380  ALPHA10 DOLLAR FUND
   2769 2026-07-31          1.01        1375.71     1362  ALPHA10 DOLLAR FUND
   2769 2026-08-07          1.01        1381.91     1368  ALPHA10 DOLLAR FUND
   2769 2026-08-14          1.01        1379.34     1367  ALPHA10 DOLLAR FUND
   2770 2026-07-24        106.08      146409.99     1380  CFG AM FIXED INCOME DOLLAR
  ... et 107 autre(s)

DRY-RUN — aucune ecriture. Relancer avec --execute pour appliquer.


 1bis. DIAGNOSTIC PLATEAUX NIGERIA (lecture seule)

=== SEGMENTS EN DOLLARS DANS DES SERIES EN NAIRA — NIGERIA ===
Mesure le 2026-09-16 21:48:51 UTC — LECTURE SEULE

## Ce que la source revele

      41 segment(s) en dollars, sur 30 fonds
     157 VL concernees au total
      12 points isoles — deja traitables par la detection de rupture
      29 PLATEAUX de 2 releves ou plus — invisibles a cette detection
     145 VL dans ces plateaux

## Les plateaux, du plus long au plus court

  fonds   n debut      fin              en base   source naira  nom
  ----- --- ---------- ---------- ------------- --------------  ---
   2773  12 2026-05-15 2026-07-31        100.00      136139.50  GUARANTY TRUST DOLLAR FUND
   2769  10 2026-06-11 2026-08-14          1.01        1375.83  ALPHA10 DOLLAR FUND
   2768   9 2026-05-15 2026-07-10          1.00        1361.39  FSL EUROBOND FUND
   2777   8 2026-05-15 2026-07-03          1.18        1606.45  VETIVA USD FIXED INCOME FUND
   2878   8 2026-05-15 2026-07-03          1.52        2069.32  FCMBAM USD Bond Fund
   2772   7 2026-07-03 2026-08-14          1.07        1477.60  GREENWICH FIXED INCOME DOLLA
   2778   7 2026-07-03 2026-08-14          1.54        2126.64  ZEDCREST DOLLAR FUND
   2809   6 2026-07-10 2026-08-14          1.00        1370.19  MYRTLE DOLLAR SHIELD FUND
   2777   5 2026-07-17 2026-08-14          1.19        1641.75  VETIVA USD FIXED INCOME FUND
   2856   5 2026-06-11 2026-07-10          1.16        1580.17  LEAD DOLLAR FIXED INCOME FUN
   2878   5 2026-07-17 2026-08-14          1.54        2124.61  FCMBAM USD Bond Fund
   2765   4 2026-07-24 2026-08-14          1.31        1801.83  CARDINALSTONE DOLLAR FUND
   2766   4 2026-07-24 2026-08-14          1.10        1518.20  COMERCIO PARTNERS DOLLAR FUN
   2770   4 2026-07-24 2026-08-14        106.08      146409.99  CFG AM FIXED INCOME DOLLAR F
   2771   4 2026-07-24 2026-08-14          1.03        1421.18  CORONATION DOLLAR FUND
   2774   4 2026-07-24 2026-08-14         10.94       15099.22  MERISTEM DOLLAR FUND
   2775   4 2026-07-24 2026-08-14          1.09        1501.50  PARTHIAN DOLLAR FIXED INCOME
   2776   4 2026-07-24 2026-08-14        118.14      163055.02  STL DOLLAR FUND
   2876   4 2026-07-24 2026-08-14        133.23      184083.89  First Asset Dollar Fund (Ret
   2877   4 2026-07-24 2026-08-14        130.07      179717.72  First Asset Specialized Doll
   2879   4 2026-07-24 2026-08-14        112.50      155441.25  First Asset Blended Dollar F
   2880   4 2026-07-24 2026-08-14          9.93       13709.51  ValuAlliance Specialized Dol
   1239   3 2026-05-29 2026-06-11          1.27        1747.08  NOVA DOLLAR FIXED INCOME FUN
   1239   3 2026-06-26 2026-07-10          1.36        1863.81  NOVA DOLLAR FIXED INCOME FUN
   2766   3 2026-05-29 2026-06-11          1.11        1528.13  COMERCIO PARTNERS DOLLAR FUN
   2772   3 2026-06-05 2026-06-19          1.08        1483.11  GREENWICH FIXED INCOME DOLLA
   2856   3 2026-05-15 2026-05-29          1.15        1565.60  LEAD DOLLAR FIXED INCOME FUN
   2769   2 2026-05-22 2026-05-29          1.01        1384.75  ALPHA10 DOLLAR FUND
   2778   2 2026-05-29 2026-06-05          1.53        2104.45  ZEDCREST DOLLAR FUND

## Par fonds — ce qui resterait apres correction

  fonds dev     VL  dollars  conformes  ecarts   hors  nom
  ----- ---- ----- -------- ---------- ------- ------  ---
   2777 USD     72       13         30      25      4  VETIVA USD FIXED INCOME FU
   2878 USD     19       13          1       2      3  FCMBAM USD Bond Fund
   2769 USD     25       12          5       5      3  ALPHA10 DOLLAR FUND
   2773 USD    113       12         45      16     40  GUARANTY TRUST DOLLAR FUND
   2772 USD     55       11         22      18      4  GREENWICH FIXED INCOME DOL
   2768 NGN     71        9         40      20      2  FSL EUROBOND FUND
   2778 USD    129        9         54      62      4  ZEDCREST DOLLAR FUND
   2766 USD    120        8         55      53      4  COMERCIO PARTNERS DOLLAR F
   2856 NGN    131        8         34      87      2  LEAD DOLLAR FIXED INCOME F
   1239 NGN    292        7         78     148     59  NOVA DOLLAR FIXED INCOME F
   2809 USD     21        6          7       5      3  MYRTLE DOLLAR SHIELD FUND
   2765 USD    125        4         71      46      4  CARDINALSTONE DOLLAR FUND
   2770 USD     55        4         31      16      4  CFG AM FIXED INCOME DOLLAR
   2771 USD     82        4         41      33      4  CORONATION DOLLAR FUND
   2774 USD    133        4         71      54      4  MERISTEM DOLLAR FUND
   2775 USD     73        4         51      14      4  PARTHIAN DOLLAR FIXED INCO
   2776 USD     86        4         55      23      4  STL DOLLAR FUND
   2876 USD     18        4          9       3      2  First Asset Dollar Fund (R
   2877 USD     19        4          9       3      3  First Asset Specialized Do
   2879 USD     19        4          9       3      3  First Asset Blended Dollar
   2880 USD     18        4          9       2      3  ValuAlliance Specialized D
   1163 NGN    267        1        211      21     34  CARDINALSTONE FIXED INCOME
   1171 NGN    608        1        224       8    375  SFS FIXED INCOME FUND
   1183 NGN    453        1        188      44    220  CORONATION FIXED INCOME FU
   1195 NGN    270        1        220      12     37  EMERGING AFRICA BOND FUND
   1220 NGN    268        1        203      29     35  GDL INCOME FUND
   1245 NGN    499        1         62     170    266  PACAM FIXED INCOME FUND
   1271 NGN    525        1         74     158    292  UNITED CAPITAL EQUITY FUND
   1273 NGN    294        1        227       5     61  UNITED CAPITAL FIXED INCOM
   1277 NGN    287        1        225       7     54  UNITED CAPITAL SUKUK FUND

## Ce que cette mesure autorise

  Chaque VL ci-dessus a un prix naira PUBLIE pour sa date exacte : la
  correction serait donc lue, jamais calculee, et ne dependrait d aucun
  voisinage — c est ce qui a fait echouer les deux tentatives precedentes.
  Les colonnes « ecarts » et « hors » restent en dehors de ce perimetre :
  ce sont des sujets distincts, a ne pas melanger a celui-ci.


Mode dry-run — aucune ecriture. Fin.
```
