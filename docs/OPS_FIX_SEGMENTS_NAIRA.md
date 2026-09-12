# Segments en dollars vers naira — journal des operations

> Genere par `ops-fix-segments-naira.yml`. Ne pas modifier a la main.

Derniere execution : **2026-09-12 01:37 UTC**
Mode : **dry-run**
Declencheur : `push` — par `Wealthtechinnovations`

```
Commit avant mise a jour : dd2ddb5b5 chore(governance): certify all current Markdown [skip ci]
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
   dd2ddb5b5..4bdcff783  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Updating dd2ddb5b5..4bdcff783
Fast-forward
 .github/workflows/ops-fix-segments-naira.yml | 13 +++-
 .governance/knowledge/markdown-registry.json | 88 ++++++++++++++++++++--------
 HANDOFF.md                                   |  8 +++
 docs/OPS_FIX_SCALE_BREAK.md                  | 24 ++++++++
 docs/OPS_FIX_SEGMENTS_NAIRA.md               | 86 +++++++++++++++++++++++++--
 docs/OPS_MYSQL_MEMOIRE.md                    | 10 ++--
 6 files changed, 190 insertions(+), 39 deletions(-)
 create mode 100644 docs/OPS_FIX_SCALE_BREAK.md
Commit retenu        : 4bdcff783 docs(ops): retirer une vitesse de fuite memoire que la mesure a dementie

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


Mode dry-run — aucune ecriture. Fin.
```
