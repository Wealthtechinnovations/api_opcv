# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-10-28 06:06 UTC**

```
########## scripts/diag/ondemand/diag_1141_hors_perimetre_naira.js ##########
=== POURQUOI 1141 ECHAPPE-T-IL AU CORRECTIF NAIRA ? ===
Mesure le 2026-10-28 06:00:41 UTC — LECTURE SEULE

## LA SOURCE
  /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv
  41626 lignes | colonne vl_price_ngn : presente
  238 dates distinctes : 2022-01-07, 2022-01-14, 2022-01-21, 2022-01-28, 2022-02-04, 2022-02-11, 2022-02-18, 2022-02-25, 2022-03-04, 2022-03-11, 2022-03-18, 2022-03-25, 2022-04-01, 2022-04-08, 2022-04-14, 2022-04-22, 2022-04-29, 2022-05-06, 2022-05-13, 2022-05-20, 2022-05-27, 2022-06-03, 2022-06-10, 2022-06-17, 2022-06-24, 2022-07-01, 2022-07-08, 2022-07-15, 2022-07-22, 2022-07-29, 2022-08-05, 2022-08-12, 2022-08-19, 2022-08-26, 2022-09-02, 2022-09-09, 2022-09-16, 2022-09-23, 2022-09-30, 2022-10-07, 2022-10-14, 2022-10-21, 2022-10-28, 2022-11-04, 2022-11-11, 2022-11-18, 2022-11-25, 2022-12-02, 2022-12-16, 2022-12-23, 2022-12-30, 2023-01-06, 2023-01-13, 2023-01-20, 2023-01-27, 2023-02-03, 2023-02-10, 2023-02-17, 2023-02-24, 2023-03-03, 2023-03-10, 2023-03-17, 2023-03-24, 2023-03-31, 2023-04-06, 2023-04-14, 2023-04-20, 2023-05-05, 2023-05-12, 2023-05-19, 2023-05-26, 2023-06-02, 2023-06-09, 2023-06-16, 2023-06-23, 2023-06-30, 2023-07-07, 2023-07-14, 2023-07-21, 2023-07-28, 2023-08-04, 2023-08-11, 2023-08-18, 2023-08-25, 2023-09-01, 2023-09-08, 2023-09-15, 2023-09-22, 2023-09-29, 2023-10-06, 2023-10-13, 2023-10-20, 2023-10-27, 2023-11-03, 2023-11-10, 2023-11-17, 2023-11-24, 2023-12-01, 2023-12-08, 2023-12-15, 2023-12-22, 2023-12-29, 2024-01-05, 2024-01-12, 2024-01-19, 2024-01-26, 2024-02-02, 2024-02-09, 2024-02-16, 2024-02-23, 2024-03-01, 2024-03-08, 2024-03-15, 2024-03-22, 2024-03-28, 2024-04-05, 2024-04-12, 2024-04-19, 2024-04-26, 2024-05-03, 2024-05-10, 2024-05-17, 2024-05-24, 2024-05-31, 2024-06-07, 2024-06-14, 2024-06-21, 2024-06-28, 2024-07-05, 2024-07-12, 2024-07-19, 2024-07-26, 2024-08-02, 2024-08-09, 2024-08-16, 2024-08-23, 2024-08-30, 2024-09-06, 2024-09-13, 2024-09-20, 2024-09-27, 2024-10-04, 2024-10-11, 2024-10-18, 2024-10-25, 2024-11-01, 2024-11-08, 2024-11-15, 2024-11-22, 2024-11-29, 2024-12-06, 2024-12-13, 2024-12-20, 2024-12-27, 2025-01-03, 2025-01-10, 2025-01-17, 2025-01-24, 2025-01-31, 2025-02-07, 2025-02-14, 2025-02-21, 2025-02-28, 2025-03-07, 2025-03-14, 2025-03-21, 2025-03-28, 2025-04-04, 2025-04-11, 2025-04-17, 2025-04-25, 2025-05-02, 2025-05-09, 2025-05-16, 2025-05-23, 2025-05-30, 2025-06-05, 2025-06-13, 2025-06-20, 2025-06-27, 2025-07-04, 2025-07-11, 2025-07-18, 2025-07-25, 2025-08-01, 2025-08-08, 2025-08-15, 2025-08-22, 2025-08-29, 2025-09-04, 2025-09-12, 2025-09-19, 2025-09-26, 2025-10-03, 2025-10-10, 2025-10-17, 2025-10-24, 2025-11-07, 2025-11-14, 2025-11-21, 2025-11-28, 2025-12-05, 2025-12-12, 2025-12-19, 2025-12-24, 2026-01-02, 2026-01-09, 2026-01-16, 2026-01-23, 2026-01-30, 2026-02-06, 2026-02-13, 2026-02-20, 2026-02-27, 2026-03-06, 2026-03-13, 2026-03-18, 2026-03-27, 2026-04-02, 2026-04-10, 2026-04-17, 2026-04-24, 2026-04-30, 2026-05-08, 2026-05-15, 2026-05-22, 2026-05-29, 2026-06-05, 2026-06-11, 2026-06-19, 2026-06-26, 2026-07-03, 2026-07-10, 2026-07-17, 2026-07-24, 2026-07-31, 2026-08-07, 2026-08-14

## (b) APPARIEMENT PAR NOM
  40740/41626 lignes du CSV apparient un fonds nigerian actif
  12 nom(s) du CSV sans correspondance en base :
    GDL Canary Growth Fund                         239 ligne(s)
    Nigeria Real Estate Investment Trust           222 ligne(s)
    Women's Balanced Fund                          126 ligne(s)
    Vantage Dollar Fund (VDF)                      56 ligne(s)
    FBN Bond Fund (FBN Fixed Income Fund)          53 ligne(s)
    D'Namaz Halal Fixed Income Fund                43 ligne(s)
    Guaranty Dollar Fund                           37 ligne(s)
    FBN Dollar Fund (FBN Eurobond) - Retail        31 ligne(s)

## FONDS 1141 — AFRINVEST DOLLAR FUND
  nom normalise      : "AFRINVEST DOLLAR FUND"
  lignes dans le CSV : 239 aux dates 2022-01-07, 2022-01-14, 2022-01-21, 2022-01-28, 2022-02-04, 2022-02-11, 2022-02-18, 2022-02-25, 2022-03-04, 2022-03-11, 2022-03-18, 2022-03-25, 2022-04-01, 2022-04-08, 2022-04-14, 2022-04-22, 2022-04-29, 2022-05-06, 2022-05-13, 2022-05-20, 2022-05-27, 2022-06-03, 2022-06-10, 2022-06-17, 2022-06-24, 2022-07-01, 2022-07-08, 2022-07-15, 2022-07-22, 2022-07-29, 2022-08-05, 2022-08-12, 2022-08-19, 2022-08-26, 2022-09-02, 2022-09-09, 2022-09-16, 2022-09-23, 2022-09-30, 2022-10-07, 2022-10-14, 2022-10-21, 2022-10-28, 2022-11-04, 2022-11-11, 2022-11-18, 2022-11-25, 2022-12-02, 2022-12-16, 2022-12-23, 2022-12-30, 2023-01-06, 2023-01-13, 2023-01-20, 2023-01-27, 2023-02-03, 2023-02-10, 2023-02-17, 2023-02-24, 2023-03-03, 2023-03-10, 2023-03-17, 2023-03-24, 2023-03-31, 2023-04-06, 2023-04-14, 2023-04-20, 2023-05-05, 2023-05-12, 2023-05-19, 2023-05-26, 2023-06-02, 2023-06-09, 2023-06-16, 2023-06-23, 2023-06-30, 2023-07-07, 2023-07-14, 2023-07-21, 2023-07-28, 2023-08-04, 2023-08-11, 2023-08-18, 2023-08-25, 2023-09-01, 2023-09-08, 2023-09-15, 2023-09-22, 2023-09-29, 2023-10-06, 2023-10-13, 2023-10-20, 2023-10-27, 2023-11-03, 2023-11-10, 2023-11-17, 2023-11-24, 2023-12-01, 2023-12-08, 2023-12-15, 2023-12-22, 2023-12-29, 2024-01-05, 2024-01-12, 2024-01-19, 2024-01-26, 2024-02-02, 2024-02-09, 2024-02-16, 2024-02-23, 2024-03-01, 2024-03-08, 2024-03-15, 2024-03-22, 2024-03-28, 2024-04-05, 2024-04-12, 2024-04-19, 2024-04-26, 2024-05-03, 2024-05-10, 2024-05-17, 2024-05-24, 2024-05-31, 2024-06-07, 2024-06-14, 2024-06-21, 2024-06-28, 2024-07-05, 2024-07-12, 2024-07-19, 2024-07-26, 2024-08-02, 2024-08-09, 2024-08-16, 2024-08-23, 2024-08-30, 2024-09-06, 2024-09-13, 2024-09-20, 2024-09-27, 2024-10-04, 2024-10-11, 2024-10-18, 2024-10-25, 2024-11-01, 2024-11-08, 2024-11-15, 2024-11-22, 2024-11-29, 2024-12-06, 2024-12-13, 2024-12-20, 2024-12-27, 2025-01-03, 2025-01-10, 2025-01-17, 2025-01-24, 2025-01-31, 2025-02-07, 2025-02-14, 2025-02-21, 2025-02-28, 2025-03-07, 2025-03-14, 2025-03-21, 2025-03-28, 2025-04-04, 2025-04-11, 2025-04-17, 2025-04-25, 2025-05-02, 2025-05-09, 2025-05-16, 2025-05-23, 2025-05-30, 2025-06-05, 2025-06-13, 2025-06-20, 2025-06-27, 2025-07-04, 2025-07-11, 2025-07-18, 2025-07-25, 2025-08-01, 2025-08-08, 2025-08-15, 2025-08-22, 2025-08-29, 2025-09-04, 2025-09-12, 2025-09-19, 2025-09-26, 2025-10-03, 2025-10-10, 2025-10-17, 2025-10-24, 2025-11-07, 2025-11-14, 2025-11-21, 2025-11-28, 2025-12-05, 2025-12-12, 2025-12-19, 2025-12-24, 2026-01-02, 2026-01-09, 2026-01-16, 2026-01-23, 2026-01-30, 2026-02-06, 2026-02-13, 2026-02-20, 2026-02-27, 2026-03-06, 2026-03-13, 2026-03-18, 2026-03-27, 2026-04-02, 2026-04-10, 2026-04-17, 2026-04-24, 2026-04-30, 2026-05-08, 2026-05-15, 2026-05-22, 2026-05-29, 2026-06-05, 2026-06-11, 2026-06-19, 2026-06-26, 2026-07-03, 2026-07-10, 2026-07-17, 2026-07-24, 2026-07-31, 2026-08-07, 2026-08-14
  311 VL, max 185518.2475848 | 5 VL au moins 100x plus petites que le max :
    2022-03-25         92.1946   source SEC a cette date : OUI
    2023-12-15        109.8529   source SEC a cette date : OUI
    2025-12-12        114.4702   source SEC a cette date : OUI
    2025-12-19        114.5485   source SEC a cette date : OUI
    2025-12-24        114.6808   source SEC a cette date : OUI
  → 5/5 des VL suspectes ont un prix publie a leur date exacte
  → des dates sont couvertes : le rapport < 100 ou un autre filtre explique l absence. A instruire.

## FONDS 1196 — EMERGING AFRICA EUROBOND FUND
  nom normalise      : "EMERGING AFRICA EUROBOND FUND"
  lignes dans le CSV : 239 aux dates 2022-01-07, 2022-01-14, 2022-01-21, 2022-01-28, 2022-02-04, 2022-02-11, 2022-02-18, 2022-02-25, 2022-03-04, 2022-03-11, 2022-03-18, 2022-03-25, 2022-04-01, 2022-04-08, 2022-04-14, 2022-04-22, 2022-04-29, 2022-05-06, 2022-05-13, 2022-05-20, 2022-05-27, 2022-06-03, 2022-06-10, 2022-06-17, 2022-06-24, 2022-07-01, 2022-07-08, 2022-07-15, 2022-07-22, 2022-07-29, 2022-08-05, 2022-08-12, 2022-08-19, 2022-08-26, 2022-09-02, 2022-09-09, 2022-09-16, 2022-09-23, 2022-09-30, 2022-10-07, 2022-10-14, 2022-10-21, 2022-10-28, 2022-11-04, 2022-11-11, 2022-11-18, 2022-11-25, 2022-12-02, 2022-12-16, 2022-12-23, 2022-12-30, 2023-01-06, 2023-01-13, 2023-01-20, 2023-01-27, 2023-02-03, 2023-02-10, 2023-02-17, 2023-02-24, 2023-03-03, 2023-03-10, 2023-03-17, 2023-03-24, 2023-03-31, 2023-04-06, 2023-04-14, 2023-04-20, 2023-05-05, 2023-05-12, 2023-05-19, 2023-05-26, 2023-06-02, 2023-06-09, 2023-06-16, 2023-06-23, 2023-06-30, 2023-07-07, 2023-07-14, 2023-07-21, 2023-07-28, 2023-08-04, 2023-08-11, 2023-08-18, 2023-08-25, 2023-09-01, 2023-09-08, 2023-09-15, 2023-09-22, 2023-09-29, 2023-10-06, 2023-10-13, 2023-10-20, 2023-10-27, 2023-11-03, 2023-11-10, 2023-11-17, 2023-11-24, 2023-12-01, 2023-12-08, 2023-12-15, 2023-12-22, 2023-12-29, 2024-01-05, 2024-01-12, 2024-01-19, 2024-01-26, 2024-02-02, 2024-02-09, 2024-02-16, 2024-02-23, 2024-03-01, 2024-03-08, 2024-03-15, 2024-03-22, 2024-03-28, 2024-04-05, 2024-04-12, 2024-04-19, 2024-04-26, 2024-05-03, 2024-05-10, 2024-05-17, 2024-05-24, 2024-05-31, 2024-06-07, 2024-06-14, 2024-06-21, 2024-06-28, 2024-07-05, 2024-07-12, 2024-07-19, 2024-07-26, 2024-08-02, 2024-08-09, 2024-08-16, 2024-08-23, 2024-08-30, 2024-09-06, 2024-09-13, 2024-09-20, 2024-09-27, 2024-10-04, 2024-10-11, 2024-10-18, 2024-10-25, 2024-11-01, 2024-11-08, 2024-11-15, 2024-11-22, 2024-11-29, 2024-12-06, 2024-12-13, 2024-12-20, 2024-12-27, 2025-01-03, 2025-01-10, 2025-01-17, 2025-01-24, 2025-01-31, 2025-02-07, 2025-02-14, 2025-02-21, 2025-02-28, 2025-03-07, 2025-03-14, 2025-03-21, 2025-03-28, 2025-04-04, 2025-04-11, 2025-04-17, 2025-04-25, 2025-05-02, 2025-05-09, 2025-05-16, 2025-05-23, 2025-05-30, 2025-06-05, 2025-06-13, 2025-06-20, 2025-06-27, 2025-07-04, 2025-07-11, 2025-07-18, 2025-07-25, 2025-08-01, 2025-08-08, 2025-08-15, 2025-08-22, 2025-08-29, 2025-09-04, 2025-09-12, 2025-09-19, 2025-09-26, 2025-10-03, 2025-10-10, 2025-10-17, 2025-10-24, 2025-11-07, 2025-11-14, 2025-11-21, 2025-11-28, 2025-12-05, 2025-12-12, 2025-12-19, 2025-12-24, 2026-01-02, 2026-01-09, 2026-01-16, 2026-01-23, 2026-01-30, 2026-02-06, 2026-02-13, 2026-02-20, 2026-02-27, 2026-03-06, 2026-03-13, 2026-03-18, 2026-03-27, 2026-04-02, 2026-04-10, 2026-04-17, 2026-04-24, 2026-04-30, 2026-05-08, 2026-05-15, 2026-05-22, 2026-05-29, 2026-06-05, 2026-06-11, 2026-06-19, 2026-06-26, 2026-07-03, 2026-07-10, 2026-07-17, 2026-07-24, 2026-07-31, 2026-08-07, 2026-08-14
  270 VL, max 184236.1122822 | 23 VL au moins 100x plus petites que le max :
    2025-12-05         1668.46   source SEC a cette date : OUI
    2025-12-12          1673.1   source SEC a cette date : OUI
    2025-12-19      1704.45429   source SEC a cette date : OUI
    2025-12-24         1684.49   source SEC a cette date : OUI
    2026-01-02       1655.2377   source SEC a cette date : OUI
    2026-01-09            1675   source SEC a cette date : OUI
    2026-01-16         1648.08   source SEC a cette date : OUI
    2026-01-23         1658.36   source SEC a cette date : OUI
    2026-01-30         1646.39   source SEC a cette date : OUI
    2026-02-06         1617.85   source SEC a cette date : OUI
    2026-02-13         1615.64   source SEC a cette date : OUI
    2026-02-20         1607.21   source SEC a cette date : OUI
  → 23/23 des VL suspectes ont un prix publie a leur date exacte
  → des dates sont couvertes : le rapport < 100 ou un autre filtre explique l absence. A instruire.

## FONDS 2743 — APEL WEALTH MONEY MARKET FUND
  nom normalise      : "APEL WEALTH MONEY MARKET FUND"
  lignes dans le CSV : 25 aux dates 2026-02-27, 2026-03-06, 2026-03-13, 2026-03-18, 2026-03-27, 2026-04-02, 2026-04-10, 2026-04-17, 2026-04-24, 2026-04-30, 2026-05-08, 2026-05-15, 2026-05-22, 2026-05-29, 2026-06-05, 2026-06-11, 2026-06-19, 2026-06-26, 2026-07-03, 2026-07-10, 2026-07-17, 2026-07-24, 2026-07-31, 2026-08-07, 2026-08-14
  20 VL, max 100 | 0 VL au moins 100x plus petites que le max :
  → 0/0 des VL suspectes ont un prix publie a leur date exacte
  → CAUSE (a) : trou de DATES dans la source. Etendre la source, ne pas toucher au correctif.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_1141_rapport_naira_calcul.js ##########
=== LE RAPPORT DU CORRECTIF, CALCULE DATE PAR DATE ===
Mesure le 2026-10-28 06:00:46 UTC — LECTURE SEULE

Source : 41626 lignes | colonne vl_price_ngn : presente

## FONDS 1141 — AFRINVEST DOLLAR FUND
  active = 1 | devise declaree = NGN | pays = NIGERIA
  en base : 311 VL | min 92.1946 | max 185518.2475848 | 5 au moins 100x sous le max
  → l echelle MINORITAIRE represente 1.6 % des VL — ce sont elles que le correctif voudrait remonter

  date             en base    vl_price_ngn   rapport  verdict du correctif
  ----------------------------------------------------------------------------
  2025-12-24      114.6808        114.5214       1.0  CAUSE (e) : rapport < 100
  2025-12-19      114.5485        114.5214       1.0  CAUSE (e) : rapport < 100
  2025-12-12      114.4702        114.5214       1.0  CAUSE (e) : rapport < 100
  2023-12-15      109.8529        109.8529       1.0  CAUSE (e) : rapport < 100
  2022-03-25       92.1946         94.9343       1.0  CAUSE (e) : rapport < 100

  bilan : 0 corrigees | 0 bloquees par un vl_price_ngn vide | 5 sous le seuil | 0 sans ligne source
  → SENS DE LA CORRECTION A ARBITRER : nom ou devise de fonds en dollars.
    Si les VL a la petite echelle sont les JUSTES, remonter en naira les
    aggraverait. Ne rien ecrire avant que ce point soit tranche.

## FONDS 1196 — EMERGING AFRICA EUROBOND FUND
  active = 1 | devise declaree = NGN | pays = NIGERIA
  en base : 270 VL | min 1607.21 | max 184236.1122822 | 23 au moins 100x sous le max
  → l echelle MINORITAIRE represente 8.5 % des VL — ce sont elles que le correctif voudrait remonter

  date             en base    vl_price_ngn   rapport  verdict du correctif
  ----------------------------------------------------------------------------
  2026-05-08     1664.5438     159101.7117      95.6  CAUSE (e) : rapport < 100
  2026-04-30     1654.6000       1654.6000       1.0  CAUSE (e) : rapport < 100
  2026-04-24     1654.6000       1640.5300       1.0  CAUSE (e) : rapport < 100
  2026-04-17     1640.5300       1637.4373       1.0  CAUSE (e) : rapport < 100
  2026-04-10     1637.4373       1637.4373       1.0  CAUSE (e) : rapport < 100
  2026-04-02     1637.4373       1637.4373       1.0  CAUSE (e) : rapport < 100
  2026-03-27     1637.4373       1637.4373       1.0  CAUSE (e) : rapport < 100
  2026-03-18     1637.4373       1637.0200       1.0  CAUSE (e) : rapport < 100
  2026-03-13     1637.0200       1674.3100       1.0  CAUSE (e) : rapport < 100
  2026-03-06     1674.3100       1634.1700       1.0  CAUSE (e) : rapport < 100
  2026-02-27     1634.1700       1607.2100       1.0  CAUSE (e) : rapport < 100
  2026-02-20     1607.2100       1615.6400       1.0  CAUSE (e) : rapport < 100

  bilan : 0 corrigees | 0 bloquees par un vl_price_ngn vide | 12 sous le seuil | 0 sans ligne source
  → SENS DE LA CORRECTION A ARBITRER : nom ou devise de fonds en dollars.
    Si les VL a la petite echelle sont les JUSTES, remonter en naira les
    aggraverait. Ne rien ecrire avant que ce point soit tranche.

## FONDS 2743 — APEL WEALTH MONEY MARKET FUND
  active = 1 | devise declaree = NGN | pays = NIGERIA
  en base : 20 VL | min 11 | max 100 | 0 au moins 100x sous le max
  → l echelle MINORITAIRE represente 0.0 % des VL — ce sont elles que le correctif voudrait remonter
  aucune VL suspecte : rien a corriger pour ce fonds.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_backlog_confronte.js ##########
=== LE BACKLOG DU 2026-08-12, CONFRONTE A LA PRODUCTION ===
Mesure le 2026-10-28 06:00:51 UTC — LECTURE SEULE
Verdict par les chiffres du jour, pas par la prose d aout.

## P1-02 — fonds 2825, YTD 239,20 % sur historique troue

  ✘ TOUJOURS VRAI  P1-02
     BALANCED STRATEGY FUND (ZENITH EQUITY) | active=1 | 59 VL de 2021-10-08 a 2026-07-10
     VL dans la fenetre du trou annonce (2022-11 → 2026-05) : 0
     colonne de date de `performences` : `date` (lue dans le schema)
     YTD stockee la plus recente : 239.20254800036057 au Fri Jul 10
     → |YTD| = 239.20 % reste aberrante.

## P2-03 — index UNIQUE sur valorisations(fund_id, date)

  ✘ TOUJOURS VRAI  P2-03
     index sur la table : 11 | UNIQUE (fund_id, date) : NON
     doublons reels : 1909 paire(s) (fonds, date) en double, 16144 ligne(s) en surnombre
     → pas de contrainte ET 1909 doublon(s) : il faut trancher lequel garder
       AVANT de creer l index, sinon la migration echoue.

## P2-04 — performances orphelines (date sans VL correspondante)

  ✘ TOUJOURS VRAI  P2-04
     performences     62477 ligne(s) orpheline(s)  (date = `date`)
     EUR                258 ligne(s) orpheline(s)  (date = `date`)
     USD                418 ligne(s) orpheline(s)  (date = `date`)
     → 63153 ligne(s) de performance portent une date sans VL. Chacune peut
       alimenter un classement avec une valeur qui ne repose sur rien.

## P2-01 — CEMAC : 34 fonds sans VL depuis 2024-12-12, 0 % indRef

  !! AGGRAVE      P2-01
     34 fonds CEMAC (34 actifs) | 2134 VL | derniere 2024-12-12
     age de la derniere VL : 685 jours
     couverture indRef : 0.0 % (0/2134)
     → TOUJOURS VRAI, et le retard s est creuse : 685 j contre 243 j au 2026-08-12.

## P1-03 — /api/listeopcvm : colonnes DB manquantes
     fond_investissements porte 86 colonnes.
     Le backlog ne nomme pas les colonnes manquantes : la verification
     exige de lire la route et son modele Sequelize, pas seulement la base.
     → a trancher par un appel reel a la route, en lot dedie.

## LA PREMISSE DE LA SECTION 4 DU BACKLOG
     Le backlog affirme : « le vrai blocage de D2/D3/D5 est l acces MCP/DB ».
     Ce script vient de lire 1053006 lignes de valorisations sur la base de
     PRODUCTION. L acces en lecture existe, par le canal a la demande.
     → PREMISSE PERIMEE. D2 (CEMAC), D3 (fonds dormants) et D5 (build) ne
       sont plus bloques par l acces. Corriger cette ligne du backlog, et
       ne plus repartir de ce constat a chaque reprise.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_benchmark_fraicheur.js ##########
=== FRAICHEUR DU BENCHMARK ET VITALITE DE LA SOURCE NIGERIANE ===
Mesure le 2026-10-28 06:00:52 UTC — LECTURE SEULE

## A. Derniere VL vs derniere VL portant un benchmark

  pays       derniere VL   dernier benchmark   retard du benchmark
  ---------- ------------  -----------------   -------------------
  CEMAC      2024-12-12    ?                   JAMAIS AUCUN
  MAROC      2026-10-26    2026-10-23          3 j
  NIGERIA    2026-10-09    2026-10-09          0 j
  TUNISIE    2026-10-27    2026-10-27          0 j
  UEMOA      2026-10-26    2026-10-26          0 j

## B. Le niveau du benchmark varie-t-il ? (90 derniers jours)

  pays       fonds avec benchmark   dont indice FIGE   dont indice qui varie
  ---------- --------------------   ----------------   ---------------------
  MAROC      629                  0                  629
  NIGERIA    29                   0                  27
  TUNISIE    126                  0                  126
  UEMOA      78                   0                  73

  Un indice FIGE signifie : une seule valeur d indRef sur au moins
  5 dates distinctes. Le fonds est alors compare a une constante,
  et sa surperformance affichee est un artefact. C6 et C9 le notent [OK].

## C. Table source `indice_references` — l import des indices vit-il ?

  Rattachement reel des VL a un indice :
    libelle porte par la VL              VL        derniere VL
    -----------------------------------  --------  -----------
    MASI                                 560518    2026-10-23
    Tunindex                             313101    2026-10-27
    (aucun)                              73637     2026-10-26
    NSE All Share                        54147     2026-10-09
    BRVM Composite                       45359     2026-10-23
    Sovereign_bond_index                 6243      2018-02-20
    BRVM Composite (BRVMCI)              1         2023-02-27

  indice                          derniere date     valeur          age     lignes/30j   total
  ------------------------------  --------------    ------------    -----   ----------   -----
  Tunindex                        2026-10-27        18400.38        1 j     21           6988
  BRVM Composite                  2026-10-27        532.09          1 j     22           6966
  MASI                            2026-10-27        17020.28        1 j     22           6952
  NSE All Share                   2026-10-27        253990.06       1 j     21           6992
  MONIA                           2026-05-14        2.20            167 j   0            1000
  masi_all_shares                 2024-10-28        14211.68        730 j   0            5689
  Sovereign_bond_index            2024-10-25        170.66          733 j   0            243
  Indice_monetaire_maroc          2024-10-25        2.70            733 j   0            231
  S&P Tunisia Sovereign Bond Ind  2024-03-01        161.79          971 j   0            2556
  INDICE MONETAIRE MAROC          2023-11-17        2.90            1076 j   0            971
  S&P Morocco Sovereign Bond Ind  2023-11-17        157.06          1076 j   0            2609

## D. Maroc — a quelle semaine l ecriture du benchmark a-t-elle cesse ?

  semaine du    VL      avec benchmark   couverture
  ----------    -----   --------------   ----------
  2026-06-24    1260    1260             100.0 %
  2026-06-29    1913    1913             100.0 %
  2026-07-06    1896    1896             100.0 %
  2026-07-13    1900    1900             100.0 %
  2026-07-20    1907    1907             100.0 %
  2026-07-27    1592    1592             100.0 %
  2026-08-03    1919    1238             64.5 %
  2026-08-10    1292    0                0.0 %
  2026-08-17    1256    0                0.0 %
  2026-08-24    1577    0                0.0 %
  2026-08-31    1919    0                0.0 %
  2026-09-07    1919    0                0.0 %
  2026-09-14    1919    0                0.0 %
  2026-09-21    1919    1919             100.0 %
  2026-09-28    1951    1951             100.0 %
  2026-10-05    1920    1920             100.0 %
  2026-10-12    1924    1924             100.0 %
  2026-10-19    1938    1938             100.0 %
  2026-10-26    344     0                0.0 %

## E. Nigeria — la SEC publie-t-elle plus recent que notre base ?

  Derniere VL Nigeria en base : 2026-10-09
  Fichier lu : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
  11951498 o, modifie le 2026-10-26 10:00

  Lignes CSV exploitables : 9023 (61 illisibles ou prix <= 0)
  Plage de dates publiee  : 2026-01-02 → 2026-10-09

  Les 12 dates les plus recentes du fichier :
    date         lignes   posterieure a la base ?
    ----------   ------   -----------------------
    2026-07-24   225      non
    2026-07-31   225      non
    2026-08-07   225      non
    2026-08-14   227      non
    2026-08-21   227      non
    2026-08-28   227      non
    2026-09-04   227      non
    2026-09-11   227      non
    2026-09-18   228      non
    2026-09-25   228      non
    2026-10-02   228      non
    2026-10-09   228      non

  VERDICT : le fichier ne contient AUCUNE date posterieure a la base.
  La chaine d import n a rien a inserer. Le retard vient de la SOURCE,
  pas de nous — et le budget de 14 j de C4.NIGERIA est alors mal
  calibre pour la cadence reelle de publication de la SEC.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_cas_isoles.js ##########

=== CAS ISOLES — ruptures hors defaut de devise SEC ===
Mesure le 2026-10-28 06:01:05 UTC — LECTURE SEULE

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

  18 ligne(s)

  fonds pays     dev  date                 valeur       precedente     fact. insere     nom
    636 MAROC    MAD  Mon Oct 19         143.0200        4840.8800      33.8 Tue Oct 20 SICAV MAROC CROISSANCE
    636 MAROC    MAD  Fri Oct 23        4836.2300         143.0200      33.8 Mon Oct 26 SICAV MAROC CROISSANCE
    790 MAROC    MAD  Fri Jun 08           0.4600          11.2700      24.5 Thu Apr 30 UPLINE BONDS
    834 MAROC    MAD  Mon Oct 19         128.3800        4313.2500      33.6 Tue Oct 20 FCP CAM INVESTISSEMENT
    834 MAROC    MAD  Fri Oct 23        4314.1700         128.3800      33.6 Mon Oct 26 FCP CAM INVESTISSEMENT
    836 MAROC    MAD  Mon Oct 19         175.0700        4039.5600      23.1 Tue Oct 20 FCP CAM DYNAMIQUE
    836 MAROC    MAD  Fri Oct 23        4041.6000         175.0700      23.1 Mon Oct 26 FCP CAM DYNAMIQUE
    953 MAROC    MAD  Mon Oct 26        2328.1000         177.0800      13.1 Tue Oct 27 CDG SOLIDARITE
    963 MAROC    MAD  Mon Oct 26        1149.9300      207575.2200     180.5 Tue Oct 27 CDG OBLIG PLUS
   1113 MAROC    MAD  Mon Oct 26        3080.3200         148.9300      20.7 Tue Oct 27 AL BARID ISTITMAR
   1223 NIGERIA  NGN  Fri Dec 08           1.0000         100.0000       100 Sun May 17 GUARANTY TRUST MONEY MARKET FUND
   1223 NIGERIA  NGN  Fri Jul 05         100.0000           1.0000       100 Sun May 17 GUARANTY TRUST MONEY MARKET FUND
   2450 TUNISIE  TND  Wed Jan 02          20.3190         212.9880      10.5 Fri May 22 MAC EPARGNE ACTIONS FCP
   2505 TUNISIE  TND  Mon Nov 09         100.0000       10485.6600     104.9 Fri May 22 MAC HORIZON 2032 FCP
   2505 TUNISIE  TND  Mon Jan 16       10000.0000         106.2630      94.1 Thu Apr 30 MAC HORIZON 2032 FCP
   2592 UEMOA    XOF  Mon Jun 26    29487443.4600        5674.0000    5196.9 Fri Jun 12 FCP BRIDGE EQUILIBRE
   2592 UEMOA    XOF  Fri Mar 27        8781.7800    44420101.2700    5058.2 Fri Jun 12 FCP BRIDGE EQUILIBRE
   2642 UEMOA    XOF  Wed Apr 13       20048.0000    21841493.0000    1089.5 Thu Apr 30 FCP ECOBANK UEMOA OBLIGATAIRE

## C. Ruptures hors Nigeria — quelles chaines d import ?

  16 ligne(s) sur 11 fonds

  MAROC    [ 636] SICAV MAROC CROISSANCE         Mon Oct 19 : 143.0200 apres 4840.8800 (x33.8) — insere Tue Oct 20, devise -, source non
  MAROC    [ 636] SICAV MAROC CROISSANCE         Fri Oct 23 : 4836.2300 apres 143.0200 (x33.8) — insere Mon Oct 26, devise -, source non
  MAROC    [ 790] UPLINE BONDS                   Fri Jun 08 : 0.4600 apres 11.2700 (x24.5) — insere Thu Apr 30, devise -, source non
  MAROC    [ 834] FCP CAM INVESTISSEMENT         Mon Oct 19 : 128.3800 apres 4313.2500 (x33.6) — insere Tue Oct 20, devise -, source non
  MAROC    [ 834] FCP CAM INVESTISSEMENT         Fri Oct 23 : 4314.1700 apres 128.3800 (x33.6) — insere Mon Oct 26, devise -, source non
  MAROC    [ 836] FCP CAM DYNAMIQUE              Mon Oct 19 : 175.0700 apres 4039.5600 (x23.1) — insere Tue Oct 20, devise -, source non
  MAROC    [ 836] FCP CAM DYNAMIQUE              Fri Oct 23 : 4041.6000 apres 175.0700 (x23.1) — insere Mon Oct 26, devise -, source non
  MAROC    [ 953] CDG SOLIDARITE                 Mon Oct 26 : 2328.1000 apres 177.0800 (x13.1) — insere Tue Oct 27, devise -, source non
  MAROC    [ 963] CDG OBLIG PLUS                 Mon Oct 26 : 1149.9300 apres 207575.2200 (x180.5) — insere Tue Oct 27, devise -, source non
  MAROC    [1113] AL BARID ISTITMAR              Mon Oct 26 : 3080.3200 apres 148.9300 (x20.7) — insere Tue Oct 27, devise -, source non
  TUNISIE  [2450] MAC EPARGNE ACTIONS FCP        Wed Jan 02 : 20.3190 apres 212.9880 (x10.5) — insere Fri May 22, devise -, source non
  TUNISIE  [2505] MAC HORIZON 2032 FCP           Mon Nov 09 : 100.0000 apres 10485.6600 (x104.9) — insere Fri May 22, devise -, source non
  TUNISIE  [2505] MAC HORIZON 2032 FCP           Mon Jan 16 : 10000.0000 apres 106.2630 (x94.1) — insere Thu Apr 30, devise -, source non
  UEMOA    [2592] FCP BRIDGE EQUILIBRE           Mon Jun 26 : 29487443.4600 apres 5674.0000 (x5196.9) — insere Fri Jun 12, devise -, source non
  UEMOA    [2592] FCP BRIDGE EQUILIBRE           Fri Mar 27 : 8781.7800 apres 44420101.2700 (x5058.2) — insere Fri Jun 12, devise -, source non
  UEMOA    [2642] FCP ECOBANK UEMOA OBLIGATAIRE  Wed Apr 13 : 20048.0000 apres 21841493.0000 (x1089.5) — insere Thu Apr 30, devise -, source non


########## scripts/diag/ondemand/diag_classement_index_plan.js ##########
=== L0.b — PLAN D EXECUTION DU CLASSEMENT LOCAL, ET CONTENU REEL DU CRON ===
Mesure le 2026-10-28 06:01:59 UTC — LECTURE SEULE

## 1. Index existants sur `performences`
  PRIMARY                            (id) [UNIQUE] cardinalite ≈ 86219
  idx_perf_fond_id                   (fond_id) cardinalite ≈ 3193
  idx_perf_code_isin                 (code_ISIN) cardinalite ≈ 1690
  idx_perf_date                      (date) cardinalite ≈ 4105
  idx_perf_nat_fond_date             (categorie_nationale, fond_id, date) cardinalite ≈ 70
  idx_perf_reg_fond_date             (categorie_fundafrica_regionale, fond_id, date) cardinalite ≈ 16
  idx_perf_glo_fond_date             (categorie_fundafrica_globale, fond_id, date) cardinalite ≈ 8
  → index couvrant (categorie_nationale, fond_id, date) : OUI
  → L6 n a de sens que si cette reponse est NON.

## 2. Taille de `performences`
  ≈ 86219 lignes | donnees 121.8 Mo | index 22.1 Mo | ratio index/donnees 0.18

## 3. Cinq plus grosses categories nationales (selectivite)
  OBLIGATIONS MAROC                           34647 lignes |  300 fonds | 40.2 % de la table
  DIVERSIFIE MAROC                            15585 lignes |  143 fonds | 18.1 % de la table
  ACTIONS MAROC                               15288 lignes |  123 fonds | 17.7 % de la table
  MONETAIRE MAROC                              7634 lignes |   71 fonds | 8.9 % de la table
  OBLIGATIONS NIGERIA                          3436 lignes |   87 fonds | 4.0 % de la table

## 4. Plan et duree de la sous-requete reelle (ranking.service.js:87-100)
  OBLIGATIONS MAROC                  type=ref    key=idx_perf_nat_fond_date rows=  43109 extra="Using where; Using index"
                                     cout=? | 17 ms | 300 lignes rendues
  DIVERSIFIE MAROC                   type=ref    key=idx_perf_nat_fond_date rows=  31908 extra="Using where; Using index"
                                     cout=? | 7 ms | 143 lignes rendues
  ACTIONS MAROC                      type=ref    key=idx_perf_nat_fond_date rows=  32738 extra="Using where; Using index"
                                     cout=? | 7 ms | 123 lignes rendues
  MONETAIRE MAROC                    type=ref    key=idx_perf_nat_fond_date rows=  16072 extra="Using where; Using index"
                                     cout=? | 3 ms | 71 lignes rendues
  OBLIGATIONS NIGERIA                type=ref    key=idx_perf_nat_fond_date rows=   6870 extra="Using where; Using index"
                                     cout=? | 2 ms | 87 lignes rendues
  moyenne : 7 ms par sous-requete
  → projection : 1 245 fonds x 3 niveaux x 7 ms ≈ 0.4 min de SQL seul — a comparer au --max-time du cron ci-dessous.

## 5. Fonds actifs sans categorie (perimetre de la garde L7)
  sur 1258 fonds actifs : categorie_national nulle 8 | fundafrica_regionale nulle 56 | fundafrica_globale nulle 56
  → la garde `if (!category) return` n evite que des analyses completes inutiles : `categorie_nationale = NULL` n est jamais vrai en SQL, le jeu de resultats est vide et la route n ecrit rien.

## 6. Cron reellement deploye sur ce serveur
  racine lue : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api
  /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_daily_update.sh — 178 lignes, modifie le 2026-10-27T19:11:06
    15: #   9. Classements local + EUR + USD
    32: run_step() {
    55: run_curl() {
    59: local max_time="${4:-300}"
    71: http_code=$(curl -s -o "$body" -w '%{http_code}' "$url" --max-time "$max_time")
    92: run_step "1/9" "Scrape ASFIM VL Maroc ($START_DATE -> $TODAY)" \
    95: run_step "2/9" "Mise a jour Forex (derniers jours)" \
    98: run_step "3/9" "Recalcul EUR/USD daily rates" \
   101: run_step "4/9" "Recalcul VL Ajuste (tous fonds actifs)" \
   105: # saveperfdatemysql sur 1-600, 601-1200 et 1201-3000 — appelaient une route qui
   129: # `diag_classements.js` cite litteralement « [9a/9] », et les journaux de
   133: # `run_step` n a pas de plafond de temps, contrairement a `run_curl` et ses
   136: run_step "5/9" "Recalcul performances locale (calcul direct, tous pays)" \
   139: run_step "8/9" "Recalcul performances EUR/USD" \
   142: # Delai porte a 1800 s. Les trois classements sortaient en HTTP 000 chaque soir —
   145: # puis « [9a/9] Classement local... ERREUR (HTTP 000) ».
   148: # d attendre. La route `classementmysql` vide la table puis la reconstruit fonds
   154: # sans qu on sache si le classement a ete recalcule ou non — et une alerte qui se
   156: run_curl "9a/9" "Classement local" \
   157: "http://localhost:3005/api/classementmysql" 1800
   159: run_curl "9b/9" "Classement EUR" \
   160: "http://localhost:3005/api/classementeur" 1800
   162: run_curl "9c/9" "Classement USD" \
   163: "http://localhost:3005/api/classementusd" 1800

  crontab -l : 9 entree(s) active(s)
    0 10 * * 1 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_nigeria_weekly.sh >> /var/log/africafunds_nigeria.log
    0 20 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_daily_update.sh >> /var/log/africafunds_cron.log 2>
    */5 * * * * /usr/bin/python3 /usr/local/bin/fix-brvm-nginx.py >> /var/log/brvm-nginx-fix.log 2>&1
    0 * * * * cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/deploy/sync_production.sh >> /var/log/sync_production
    30 21 * * * cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_daily_eur_usd.sh >> /var/log/cron_eur_usd
    0 19 * * 1-5  cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_tunisie_daily.sh >> /var/log/cron_tunis
    0 22 * * *    cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_health_check.sh >> /var/log/africafunds
    30 19 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_brvm_daily.sh >> /var/log/cron_brvm.log 2>&1
    30 18 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_indices_daily.sh >> /var/log/cron_indices_daily.lo

=== FIN L0.b — aucune ecriture, aucun ALTER ===

########## scripts/diag/ondemand/diag_classements.js ##########

=== FRAICHEUR DES CLASSEMENTS ET DES PERFORMANCES ===
Mesure le 2026-10-28 06:01:59 UTC — LECTURE SEULE

## A. Tables de classement

  classementfonds             3648 lignes — updated_at max =  ue Oct 27 2026 21: (0.4 j)
  classementfonds_eurs        2880 lignes — updated_at max =  ue Oct 27 2026 22: (0.3 j)
  classementfonds_usds        2890 lignes — updated_at max =  ue Oct 27 2026 22: (0.3 j)
  performences               91214 lignes — updated_at max = aucune (?)
  performences_eurs          47442 lignes — date max =  ue Oct 27 2026 00: (1.3 j)
  performences_usds          47675 lignes — date max =  ue Oct 27 2026 00: (1.3 j)

## B. Retard des performances par pays

  pays        fonds  a jour      %  retard moy.  retard max
  ---------- ------ ------- ------ ------------ -----------
  NIGERIA       330     325 98.5 %        4.0 j       665 j
  TUNISIE       131     131 100.0 %        0.0 j         0 j
  CEMAC          34      34 100.0 %        0.0 j         0 j
  UEMOA         109     109 100.0 %       -0.2 j         0 j
  MAROC         646     646 100.0 %       -2.0 j         0 j

## C. Le classement suit-il les performances actuelles ?

  OBLIGATIONS MAROC                strict  300/300  (100.0 %) · rho  1.000 · top10 10/10 · ex aequo 0
                                   CONCORDE — recalcule
  DIVERSIFIE MAROC                 strict  143/143  (100.0 %) · rho  1.000 · top10 10/10 · ex aequo 0
                                   CONCORDE — recalcule
  ACTIONS MAROC                    strict  123/123  (100.0 %) · rho  1.000 · top10 10/10 · ex aequo 0
                                   CONCORDE — recalcule
  OBLIGATIONS NIGERIA              strict   85/87   (97.7 %) · rho  1.000 · top10 10/10 · ex aequo 1
                                   CONCORDE — recalcule
  MONETAIRE MAROC                  strict   71/71   (100.0 %) · rho  1.000 · top10 10/10 · ex aequo 0
                                   CONCORDE — recalcule


########## scripts/diag/ondemand/diag_classement_tri_texte.js ##########
=== L0.d — LE TRI DU COMPARATEUR EST-IL LA CAUSE DU « DIVERGE » ? ===
Mesure le 2026-10-28 06:02:02 UTC — LECTURE SEULE

## 0. Type REEL des colonnes en cause (la base fait foi, pas le modele)
  classementfonds.rank1erJanvier         varchar(255)
  classementfonds.rank1erJanviertotal    varchar(255)
  performences.perf3m                 varchar(255)
  performences.perf6m                 varchar(255)
  performences.ytd                    varchar(255)
  → performences.ytd est du TEXTE : un ORDER BY dessus trie par ordre alphabetique, pas par valeur

## 0bis. Les cinq plus grands ytd selon chacun des deux tris SQL
  ORDER BY ytd DESC                  : 97.8408163265306 | 97.8408163265306 | 97.8408163265306 | 97.8408163265306 | 97.8408163265306
  ORDER BY CAST(ytd AS DECIMAL) DESC : 559855.7227256253 | 559855.7227256253 | 559855.7227256253 | 559855.7227256253 | 559855.7227256253
  → les deux tris DIFFERENT : le tri par SQL sur cette colonne n est pas un tri par valeur

########## OBLIGATIONS MAROC — 300 fonds classes
  type JS du rang stocke : string | egalite STRICTE (===) : A 0, B 0, C 0 ← le rang est une chaine : tout === contre un nombre est faux
    A. ORDER BY ytd DESC (ancien comparateur)      53/300  exacts ( 17.7 %) | rho  0.634 | ecart max  168
    B. ORDER BY CAST(ytd AS DECIMAL) DESC         300/300  exacts (100.0 %) | rho  1.000 | ecart max    0
    C. rankFundInList — code de la production     300/300  exacts (100.0 %) | rho  1.000 | ecart max    0
  → VERDICT : les rangs stockes correspondent EXACTEMENT a l ordre que la production calcule. Le « DIVERGE » venait du TRI du comparateur, pas de la base.

########## DIVERSIFIE MAROC — 143 fonds classes
  type JS du rang stocke : string | egalite STRICTE (===) : A 0, B 0, C 0 ← le rang est une chaine : tout === contre un nombre est faux
    A. ORDER BY ytd DESC (ancien comparateur)      10/143  exacts (  7.0 %) | rho  0.191 | ecart max  120
    B. ORDER BY CAST(ytd AS DECIMAL) DESC         143/143  exacts (100.0 %) | rho  1.000 | ecart max    0
    C. rankFundInList — code de la production     143/143  exacts (100.0 %) | rho  1.000 | ecart max    0
  → VERDICT : les rangs stockes correspondent EXACTEMENT a l ordre que la production calcule. Le « DIVERGE » venait du TRI du comparateur, pas de la base.

########## ACTIONS MAROC — 123 fonds classes
  type JS du rang stocke : string | egalite STRICTE (===) : A 0, B 0, C 0 ← le rang est une chaine : tout === contre un nombre est faux
    A. ORDER BY ytd DESC (ancien comparateur)      14/123  exacts ( 11.4 %) | rho  0.258 | ecart max  109
    B. ORDER BY CAST(ytd AS DECIMAL) DESC         123/123  exacts (100.0 %) | rho  1.000 | ecart max    0
    C. rankFundInList — code de la production     123/123  exacts (100.0 %) | rho  1.000 | ecart max    0
  → VERDICT : les rangs stockes correspondent EXACTEMENT a l ordre que la production calcule. Le « DIVERGE » venait du TRI du comparateur, pas de la base.

########## OBLIGATIONS NIGERIA — 87 fonds classes
  type JS du rang stocke : string | egalite STRICTE (===) : A 0, B 0, C 0 ← le rang est une chaine : tout === contre un nombre est faux
    A. ORDER BY ytd DESC (ancien comparateur)      14/87   exacts ( 16.1 %) | rho  0.811 | ecart max   37
    B. ORDER BY CAST(ytd AS DECIMAL) DESC          85/87   exacts ( 97.7 %) | rho  1.000 | ecart max    1
    C. rankFundInList — code de la production      87/87   exacts (100.0 %) | rho  1.000 | ecart max    0
  → VERDICT : les rangs stockes correspondent EXACTEMENT a l ordre que la production calcule. Le « DIVERGE » venait du TRI du comparateur, pas de la base.

########## MONETAIRE MAROC — 71 fonds classes
  type JS du rang stocke : string | egalite STRICTE (===) : A 0, B 0, C 0 ← le rang est une chaine : tout === contre un nombre est faux
    A. ORDER BY ytd DESC (ancien comparateur)      41/71   exacts ( 57.7 %) | rho  0.972 | ecart max   28
    B. ORDER BY CAST(ytd AS DECIMAL) DESC          71/71   exacts (100.0 %) | rho  1.000 | ecart max    0
    C. rankFundInList — code de la production      71/71   exacts (100.0 %) | rho  1.000 | ecart max    0
  → VERDICT : les rangs stockes correspondent EXACTEMENT a l ordre que la production calcule. Le « DIVERGE » venait du TRI du comparateur, pas de la base.

=== FIN L0.d — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_classement_vs_perf.js ##########
=== L0.c — RANGS STOCKES CONTRE PERFORMANCES STOCKEES : QUATRE HYPOTHESES ===
Mesure le 2026-10-28 06:02:05 UTC — LECTURE SEULE

## 0. Volumetrie de `classementfonds`
  type 1 (national) : 1246 lignes, 1246 fonds
  type 2 (regional) : 1201 lignes, 1201 fonds
  type 3 (global) : 1201 lignes, 1201 fonds
  (aucune colonne de date : l age de ces lignes est inconnaissable — c est precisement ce que la migration L2 corrige)

########## OBLIGATIONS MAROC — 300 fonds classes
  H4 perimetre : 300 fonds cote performances, 300 cote classement | absents du classement : 0 | classes mais hors performances : 0
  H1 fraicheur : total stocke le plus frequent = 300 (sur 300 lignes) | total recalcule aujourd hui = 300 | CONCORDE → la table n est pas perimee sur ce point
               dates des performances lues : 5 distinctes, de Fri Oct 23 a Thu Dec 03
  H2 champ :
    ytd           300/300  exacts (100.0 %) | rho = 1.000
    ytdm           12/300  exacts (  4.0 %) | rho = 0.948
    perfveille      6/300  exacts (  2.0 %) | rho = 0.655
    perfveillem     1/300  exacts (  0.3 %) | rho = 0.415
    perf3m         12/300  exacts (  4.0 %) | rho = 0.859
    perf6m         19/300  exacts (  6.3 %) | rho = 0.864
    perf1an        17/292  exacts (  5.8 %) | rho = 0.986
    perf3ans        6/274  exacts (  2.2 %) | rho = -0.047
    → meilleur candidat : ytd (rho 1.000, 100.0 % exacts) — c est bien le champ attendu, H2 ecartee
  H3 ex aequo sur ytd : 0/300 fonds dans 0 paquet(s), plus gros paquet = 0 fonds
               ecart de rang max = 0 | 0/300 ecarts STRICTEMENT superieurs au plus gros paquet → H3 suffit a tout expliquer : le correctif est le departage deterministe (L7), pas la reconstruction

########## DIVERSIFIE MAROC — 143 fonds classes
  H4 perimetre : 143 fonds cote performances, 143 cote classement | absents du classement : 0 | classes mais hors performances : 0
  H1 fraicheur : total stocke le plus frequent = 143 (sur 143 lignes) | total recalcule aujourd hui = 143 | CONCORDE → la table n est pas perimee sur ce point
               dates des performances lues : 8 distinctes, de Fri Apr 12 a Mon Oct 26
  H2 champ :
    ytd           143/143  exacts (100.0 %) | rho = 1.000
    ytdm           13/143  exacts (  9.1 %) | rho = 0.972
    perfveille      5/143  exacts (  3.5 %) | rho = 0.225
    perfveillem     0/143  exacts (  0.0 %) | rho = -0.083
    perf3m         10/143  exacts (  7.0 %) | rho = 0.704
    perf6m         12/143  exacts (  8.4 %) | rho = 0.542
    perf1an        11/137  exacts (  8.0 %) | rho = 0.952
    perf3ans        4/130  exacts (  3.1 %) | rho = 0.065
    → meilleur candidat : ytd (rho 1.000, 100.0 % exacts) — c est bien le champ attendu, H2 ecartee
  H3 ex aequo sur ytd : 0/143 fonds dans 0 paquet(s), plus gros paquet = 0 fonds
               ecart de rang max = 0 | 0/143 ecarts STRICTEMENT superieurs au plus gros paquet → H3 suffit a tout expliquer : le correctif est le departage deterministe (L7), pas la reconstruction

########## ACTIONS MAROC — 123 fonds classes
  H4 perimetre : 123 fonds cote performances, 123 cote classement | absents du classement : 0 | classes mais hors performances : 0
  H1 fraicheur : total stocke le plus frequent = 123 (sur 123 lignes) | total recalcule aujourd hui = 123 | CONCORDE → la table n est pas perimee sur ce point
               dates des performances lues : 3 distinctes, de Fri Oct 23 a Mon Oct 26
  H2 champ :
    ytd           123/123  exacts (100.0 %) | rho = 1.000
    ytdm           23/123  exacts ( 18.7 %) | rho = 0.994
    perfveille      1/123  exacts (  0.8 %) | rho = -0.043
    perfveillem     2/123  exacts (  1.6 %) | rho = -0.234
    perf3m          3/123  exacts (  2.4 %) | rho = 0.424
    perf6m         10/123  exacts (  8.1 %) | rho = 0.502
    perf1an         8/117  exacts (  6.8 %) | rho = 0.954
    perf3ans        0/111  exacts (  0.0 %) | rho = 0.222
    → meilleur candidat : ytd (rho 1.000, 100.0 % exacts) — c est bien le champ attendu, H2 ecartee
  H3 ex aequo sur ytd : 0/123 fonds dans 0 paquet(s), plus gros paquet = 0 fonds
               ecart de rang max = 0 | 0/123 ecarts STRICTEMENT superieurs au plus gros paquet → H3 suffit a tout expliquer : le correctif est le departage deterministe (L7), pas la reconstruction

########## OBLIGATIONS NIGERIA — 87 fonds classes
  H4 perimetre : 87 fonds cote performances, 87 cote classement | absents du classement : 0 | classes mais hors performances : 0
  H1 fraicheur : total stocke le plus frequent = 87 (sur 87 lignes) | total recalcule aujourd hui = 87 | CONCORDE → la table n est pas perimee sur ce point
               dates des performances lues : 14 distinctes, de Fri Apr 19 a Fri Sep 16
  H2 champ :
    ytd            87/87   exacts (100.0 %) | rho = 1.000
    ytdm           13/87   exacts ( 14.9 %) | rho = 0.902
    perfveille      1/87   exacts (  1.1 %) | rho = 0.054
    perfveillem     0/87   exacts (  0.0 %) | rho = 0.110
    perf3m          4/87   exacts (  4.6 %) | rho = 0.669
    perf6m          9/87   exacts ( 10.3 %) | rho = 0.806
    perf1an         2/81   exacts (  2.5 %) | rho = 0.751
    perf3ans        1/61   exacts (  1.6 %) | rho = -0.441
    → meilleur candidat : ytd (rho 1.000, 100.0 % exacts) — c est bien le champ attendu, H2 ecartee
  H3 ex aequo sur ytd : 2/87 fonds dans 1 paquet(s), plus gros paquet = 2 fonds
               ecart de rang max = 0 | 0/87 ecarts STRICTEMENT superieurs au plus gros paquet → H3 suffit a tout expliquer : le correctif est le departage deterministe (L7), pas la reconstruction

########## MONETAIRE MAROC — 71 fonds classes
  H4 perimetre : 71 fonds cote performances, 71 cote classement | absents du classement : 0 | classes mais hors performances : 0
  H1 fraicheur : total stocke le plus frequent = 71 (sur 71 lignes) | total recalcule aujourd hui = 71 | CONCORDE → la table n est pas perimee sur ce point
               dates des performances lues : 1 distinctes, de Mon Oct 26 a Mon Oct 26
  H2 champ :
    ytd            71/71   exacts (100.0 %) | rho = 1.000
    ytdm           60/71   exacts ( 84.5 %) | rho = 1.000
    perfveille      1/71   exacts (  1.4 %) | rho = 0.174
    perfveillem     2/71   exacts (  2.8 %) | rho = 0.174
    perf3m          1/71   exacts (  1.4 %) | rho = 0.240
    perf6m         26/71   exacts ( 36.6 %) | rho = 0.916
    perf1an        33/69   exacts ( 47.8 %) | rho = 0.977
    perf3ans        4/67   exacts (  6.0 %) | rho = 0.709
    → meilleur candidat : ytd (rho 1.000, 100.0 % exacts) — c est bien le champ attendu, H2 ecartee
  H3 ex aequo sur ytd : 0/71 fonds dans 0 paquet(s), plus gros paquet = 0 fonds
               ecart de rang max = 0 | 0/71 ecarts STRICTEMENT superieurs au plus gros paquet → H3 suffit a tout expliquer : le correctif est le departage deterministe (L7), pas la reconstruction

=== FIN L0.c — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_crons_journaux.js ##########

=== VERDICT DE LA DERNIERE EXECUTION DE CHAQUE CRON ===

  cron                   cadence              journal le plus recent                  age  verdict
  ---------------------- -------------------- ---------------------------------- --------  ------------------------
  cron_nigeria_weekly    lundi 10:00          africafunds_nigeria_20261026.log     43.9 h  ECHEC — 1 erreur(s)
  cron_daily_update      lun-ven 20:00        africafunds_daily_20261027.log        8.8 h  OK
  cron_daily_eur_usd     tous les j 21:30     cron_eur_usd.log                      8.0 h  ECHEC — 2 erreur(s)
  cron_tunisie_daily     lun-ven 19:00        cron_tunisie.log                     11.0 h  OK
  cron_brvm_daily        lun-ven 19:30        cron_brvm.log                        10.5 h  OK
  cron_indices_daily     lun-ven 18:30        cron_indices_daily.log               11.5 h  OK  (reserve : Echecs scraping: 16)
  cron_health_check      tous les j 22:00     africafunds_health_20261027.log       8.0 h  ECHEC — 2 probleme(s)
  sync_production        toutes les heures    sync_production.log                   0.0 h  aucun marqueur de fin


=== FIN DES JOURNAUX EN ECHEC OU SANS VERDICT ===

--- cron_nigeria_weekly (ECHEC — 1 erreur(s)) — /var/log/africafunds_nigeria_20261026.log
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
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Oct 26 10:09:13 AM UTC 2026 ===
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
  |   performences_eurs        47442 lignes / 1250 fonds
  |   performences_usds        47675 lignes / 1250 fonds
  |   classementfonds_eurs     2880 lignes / 1124 fonds
  |   classementfonds_usds     2890 lignes / 1124 fonds
  | CRON EUR/USD TERMINE AVEC 2 ERREUR(S) — 2026-10-27 22:03:05

--- cron_health_check (ECHEC — 2 probleme(s)) — /var/log/africafunds_health_20261027.log
  |   eur_usd      /var/log/cron_eur_usd.log — 183 Ko, modifie il y a 0h
  |   nigeria      pas attendu aujourd'hui (pas lundi)
  | === RESUME ===
  | STATUT: 2 PROBLEME(S) DETECTE(S)
  |   [!] NIGERIA: derniere VL il y a 18 jours (budget 14j)
  |   [!] CEMAC: derniere VL il y a 684 jours (budget 400j)
  |   [OK] TUNISIE: VL a jour
  |   [OK] MAROC: VL a jour
  |   [OK] UEMOA: VL a jour
  |   [OK] Classement local peuple
  |   [OK] Performances a jour sur 99.6 % des fonds
  |   [OK] Forex a jour
  | === HEALTH CHECK TERMINE Tue Oct 27 10:00:03 PM UTC 2026 ===
  | ========================================

--- sync_production (aucun marqueur de fin) — /var/log/sync_production.log
  | ============================================
  | Etat production runtime: /var/lib/fundafrica/runtime/PRODUCTION_STATE.json
  | Le depot Git reste une source de code canonique, pas une sortie de cron.
  | ============================================
  | SNAPSHOT PRODUCTION — 2026-10-28 06:00:01
  | ============================================
  | --- Generation du snapshot base de donnees ---
  |   -> Snapshot runtime genere: /var/lib/fundafrica/runtime/PRODUCTION_STATE.json (44867 octets)
  |   -> Git non modifie: aucun add/commit/push
  | ============================================
  | SNAPSHOT TERMINE — 2026-10-28 06:00:15
  | ============================================
  | Etat production runtime: /var/lib/fundafrica/runtime/PRODUCTION_STATE.json
  | Le depot Git reste une source de code canonique, pas une sortie de cron.

=== RESUME : 4 OK · 3 en echec · 1 non verifiable(s) ===
  « non verifiable » ne veut pas dire « sain » : journal absent, illisible,
  ou sans marqueur de fin. A instruire avant de conclure quoi que ce soit.


########## scripts/diag/ondemand/diag_csv_devise_sec.js ##########

============================================================
 DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE
 Genere le 2026-10-28T06:02:06.410Z — LECTURE SEULE
============================================================

## A. Etat du CSV

   fichier   : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
   taille    : 11.40 Mo
   modifie   : 2026-10-26T10:00:40.048Z (il y a 44.0 h)
   lignes    : 9084
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

   [devise de la MESURE] fonds DOLLAR/EUROBOND : USD=957  NGN=643
   Tous les autres fonds         : NGN=7456  USD=28

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
      USD / 10^-2        2 lignes
      USD / 10^0         472 lignes
      USD / 10^1         28 lignes
      USD / 10^2         416 lignes

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


########## scripts/diag/ondemand/diag_devise_declaree_nigeria.js ##########

=== DEVISE DECLAREE vs CONTENU REEL DE `value` — NIGERIA ===
Mesure le 2026-10-28 06:02:07 UTC — LECTURE SEULE

Fonds Nigeria examines : 337
  etiquette CONFORME au contenu : 122
  etiquette EN DESACCORD        : 8
  indetermines                  : 207

## Etiquette en desaccord avec le contenu de `value`

  fonds declare  reel       VL   couv  act  nom / motif
  ----- -------- ------ ------ ------  ---- ---
   2823 USD      NGN        31     31  oui  FBN DOLLAR FUND (FBN EUROBOND ) 
                                         100 % des VL collent au prix naira
   2926 USD      NGN        18     10  oui  Zenith Balanced Strategy Fund
                                         100 % des VL collent au prix naira
   2828 USD      NGN       214      6  oui  FBN EUROBOND (NIGERIA EUROBOND U
                                         100 % des VL collent au prix naira
   2829 USD      NGN       209      6  oui  FBN EUROBOND (NIGERIA EUROBOND U
                                         100 % des VL collent au prix naira
   2927 USD      NGN        12      4  oui  Radix Money Market Fund
                                         100 % des VL collent au prix naira
   2928 USD      NGN        12      4  oui  Apel Wealth Balanced Fund
                                         100 % des VL collent au prix naira
   2929 USD      NGN         9      1  oui  Parthian Equity Fund
                                         100 % des VL collent au prix naira
   2930 USD      NGN         9      1  oui  Alpha10 Halal Fund
                                         100 % des VL collent au prix naira

## Indetermines — a NE PAS basculer automatiquement (205 avec VL)

  fonds declare      VL   couv  nom / motif
  ----- -------- ------ ------  ---
   1263 NGN         725    233  STANBIC IBTC NIGERIAN EQUITY FUN
                                 aucune colonne ne colle (naira 39 %, dollar 0 %)
   1268 NGN         725    233  STANBIC IBTC ETHICAL FUND
                                 aucune colonne ne colle (naira 48 %, dollar 0 %)
   1142 NGN         724    233  AFRINVEST EQUITY FUND
                                 aucune colonne ne colle (naira 36 %, dollar 0 %)
   1151 NGN         724    233  ARM AGGRESSIVE GROWTH FUND
                                 aucune colonne ne colle (naira 12 %, dollar 0 %)
   1212 NGN         724    233  FRONTIER FUND
                                 aucune colonne ne colle (naira 19 %, dollar 0 %)
   1247 NGN         721    233  PARAMOUNT EQUITY FUND
                                 aucune colonne ne colle (naira 33 %, dollar 0 %)
   1254 NGN         715    233  STANBIC IBTC BALANCED FUND
                                 aucune colonne ne colle (naira 48 %, dollar 0 %)
   1236 NGN         698    233  NEW GOLD ETF
                                 aucune colonne ne colle (naira 20 %, dollar 0 %)
   1153 NGN         664    173  ARM ETHICAL FUND
                                 aucune colonne ne colle (naira 8 %, dollar 0 %)
   1261 NGN         636    233  STANBIC IBTC IMAAN FUND
                                 aucune colonne ne colle (naira 35 %, dollar 0 %)
   1285 NGN         622    233  VG 30 ETF
                                 aucune colonne ne colle (naira 42 %, dollar 0 %)
   1259 NGN         588    233  STANBIC IBTC ETF 30 FUND
                                 aucune colonne ne colle (naira 17 %, dollar 0 %)
   1206 NGN         566    222  LEGACY EQUITY FUND
                                 aucune colonne ne colle (naira 33 %, dollar 0 %)
   1242 NGN         549    233  PACAM BALANCED FUND
                                 aucune colonne ne colle (naira 28 %, dollar 0 %)
   1282 NGN         545    233  VCG ETF
                                 aucune colonne ne colle (naira 30 %, dollar 0 %)
   1283 NGN         545    233  VETBANK ETF
                                 aucune colonne ne colle (naira 25 %, dollar 0 %)
   1286 NGN         545    233  VI ETF
                                 aucune colonne ne colle (naira 45 %, dollar 0 %)
   1232 NGN         541    233  MERISTEM EQUITY MARKET FUND
                                 aucune colonne ne colle (naira 38 %, dollar 0 %)
   1203 NGN         531    222  FBN NIGERIA SMART BETA EQUITY FU
                                 aucune colonne ne colle (naira 38 %, dollar 0 %)
   1253 NGN         527    233  STANBIC IBTC AGGRESSIVE FUND (SU
                                 aucune colonne ne colle (naira 39 %, dollar 0 %)
   1256 NGN         527    233  STANBIC IBTC CONSERVATIVE FUND (
                                 aucune colonne ne colle (naira 80 %, dollar 0 %)
   1270 NGN         525    233  UNITED CAPITAL BALANCED FUND
                                 aucune colonne ne colle (naira 49 %, dollar 0 %)
   1271 NGN         525    233  UNITED CAPITAL EQUITY FUND
                                 aucune colonne ne colle (naira 32 %, dollar 0 %)
   1161 NGN         520    233  AXA MANSARD EQUITY INCOME FUND
                                 aucune colonne ne colle (naira 49 %, dollar 0 %)
   1245 NGN         499    233  PACAM FIXED INCOME FUND
                                 aucune colonne ne colle (naira 27 %, dollar 0 %)
   1284 NGN         496    233  VETIVA S & P NIG. SOVEREIGN BOND
                                 aucune colonne ne colle (naira 25 %, dollar 0 %)
   1251 NGN         493    233  SIAML ETF 40
                                 aucune colonne ne colle (naira 44 %, dollar 0 %)
   1257 NGN         493    233  STANBIC IBTC DOLLAR FUND
                                 aucune colonne ne colle (naira 61 %, dollar 0 %)
   1190 NGN         481    233  EDC FIXED INCOME FUND
                                 aucune colonne ne colle (naira 67 %, dollar 0 %)
   2832 NGN         481      0  WOMEN INVESTMENT FUND
                                 aucune VL couverte par le rejeu
   2835 NGN         474      0  ZENITH ETHICAL FUND
                                 aucune VL couverte par le rejeu
   2833 NGN         473      0  ZENITH EQUITY FUND
                                 aucune VL couverte par le rejeu
   1182 NGN         453    233  CORONATION BALANCED FUND
                                 aucune colonne ne colle (naira 46 %, dollar 0 %)
   2839 NGN         452      0  CORAL GROWTH FUND
                                 aucune VL couverte par le rejeu
   2842 NGN         444      0  ACAP CANARY GROWTH FUND
                                 aucune VL couverte par le rejeu
   1266 NGN         438    233  UPDC REAL ESTATE INVESTMENT TRUS
                                 aucune colonne ne colle (naira 40 %, dollar 0 %)
   2841 NGN         431      0  ARM DISCOVERY FUND
                                 aucune VL couverte par le rejeu
   1278 NGN         426    193  UNITED CAPITAL WEALTH FOR WOMEN 
                                 aucune colonne ne colle (naira 56 %, dollar 0 %)
   1145 NGN         419    233  AIICO BALANCED FUND
                                 aucune colonne ne colle (naira 42 %, dollar 0 %)
   2811 NGN         399    142  LOTUS CAPITAL HALAL ETF
                                 aucune colonne ne colle (naira 30 %, dollar 0 %)
  ... et 165 autre(s)

## Les 33 fonds declares USD — les deux taux, cote a cote

  fonds    VL  couv   naira  dollar  verdict      nom
  ----- ----- ----- ------- -------  ------------ ---
   2774   139   130    55 %     3 %  INDETERMINE  MERISTEM DOLLAR FUND
   2778   135   126    43 %     7 %  INDETERMINE  ZEDCREST DOLLAR FUND
   2765   131   122    58 %     3 %  INDETERMINE  CARDINALSTONE DOLLAR FUND
   2766   126   117    47 %     7 %  INDETERMINE  COMERCIO PARTNERS DOLLAR FUND
   2776    92    83    66 %     5 %  INDETERMINE  STL DOLLAR FUND
   2771    88    79    52 %     5 %  INDETERMINE  CORONATION DOLLAR FUND
   2773   119    73    62 %    16 %  INDETERMINE  GUARANTY TRUST DOLLAR FUND
   2775    79    70    73 %     6 %  INDETERMINE  PARTHIAN DOLLAR FIXED INCOME F
   2777    78    69    43 %    19 %  INDETERMINE  VETIVA USD FIXED INCOME FUND
   2770    61    52    60 %     8 %  INDETERMINE  CFG AM FIXED INCOME DOLLAR FUN
   2772    61    52    42 %    21 %  INDETERMINE  GREENWICH FIXED INCOME DOLLAR 
   2804    52    51    69 %     0 %  INDETERMINE  FBN BLENDED DOLLAR FUND
   2823    31    31   100 %     0 %  NGN          FBN DOLLAR FUND (FBN EUROBOND 
   2769    31    23    22 %    52 %  INDETERMINE  ALPHA10 DOLLAR FUND
   2809    27    19    37 %    32 %  INDETERMINE  MYRTLE DOLLAR SHIELD FUND
   2876    23    16    56 %    25 %  INDETERMINE  First Asset Dollar Fund (Retai
   2877    25    16    56 %    25 %  INDETERMINE  First Asset Specialized Dollar
   2878    25    16     6 %    81 %  USD          FCMBAM USD Bond Fund
   2879    25    16    56 %    25 %  INDETERMINE  First Asset Blended Dollar Fun
   2880    24    16    56 %    25 %  INDETERMINE  ValuAlliance Specialized Dolla
   2926    18    10   100 %     0 %  NGN          Zenith Balanced Strategy Fund
   2828   214     6   100 %     0 %  NGN          FBN EUROBOND (NIGERIA EUROBOND
   2829   209     6   100 %     0 %  NGN          FBN EUROBOND (NIGERIA EUROBOND
   2927    12     4   100 %     0 %  NGN          Radix Money Market Fund
   2928    12     4   100 %     0 %  NGN          Apel Wealth Balanced Fund
   2929     9     1   100 %     0 %  NGN          Parthian Equity Fund
   2930     9     1   100 %     0 %  NGN          Alpha10 Halal Fund
   2931     2     0     0 %     0 %  INDETERMINE  First Asset Dollar Fund
   2932     3     0     0 %     0 %  INDETERMINE  Samtl Money Market Income Fund
   2933     2     0     0 %     0 %  INDETERMINE  FSDH Global Fixed Opportunity 
   2934     2     0     0 %     0 %  INDETERMINE  GDL Canary Balanced Fund
   2935     2     0     0 %     0 %  INDETERMINE  Meristem Commodities Fund
   2937     1     0     0 %     0 %  INDETERMINE  Samtl Money Market Fund

  9 de ces fonds sur 27 couverts par le rejeu n ont AUCUNE VL
  correspondant a un prix en dollars publie par la SEC.

## Consequence mesuree

  8 fonds declares USD contiennent en fait du naira.
  514 VL en tirent aujourd hui un `value_USD` faux d un facteur ~1 400,
  ainsi que les performances et classements USD qui en decoulent.


########## scripts/diag/ondemand/diag_doublons_et_orphelines_forme.js ##########
=== DOUBLONS ET ORPHELINES : DEFAUTS OU ARTEFACTS ? ===
Mesure le 2026-10-28 06:02:12 UTC — LECTURE SEULE

## A. DOUBLONS DE VL — ou sont-ils, et portent-ils la meme valeur ?
  1909 paire(s) dupliquee(s) | 16144 ligne(s) en surnombre | pire paire : 14 exemplaires
  ratio : 8.5 ligne(s) en trop par paire
  Des accidents disperses donneraient ~1. Au-dela, la duplication est systematique.

  Les 12 fonds les plus touches :
   fonds pays      paires  en trop  periode                 nom
    null ?           1890    16125  2016-12-26 → 2024-07-12 ?
    2597 UEMOA         15       15  2022-07-14 → 2023-09-07 FCPE FORCE PAD
    2615 UEMOA          1        1  2022-09-19 → 2022-09-19 FCP IFC-BOAD
    1552 MAROC          1        1  2024-10-01 → 2024-10-01 AZ TAWFIR
    2596 UEMOA          1        1  2022-12-23 → 2022-12-23 FCPCR SONATEL
    2601 UEMOA          1        1  2024-07-03 → 2024-07-03 FCP RENTE PERPETUELLE

  ces 12 fonds portent 16144/16144 lignes en trop = 100.0 %
  → DUPLICATION CONCENTREE. Une poignee de fonds explique l essentiel :
    chercher une cause commune (un import rejoue, une fusion de fonds)
    plutot que de nettoyer 1 909 cas un par un.

  LA QUESTION QUI DECIDE DE TOUT :
  paires dont les exemplaires portent la MEME valeur      : 0
  paires dont les exemplaires portent des valeurs DIFFERENTES : 1909
  → 1909 paire(s) exigent un ARBITRAGE : deux valeurs differentes
    pour un meme fonds a une meme date, et rien ne dit laquelle est juste.
    Ce n est pas un nettoyage, c est une decision sur donnee financiere.
    exemples (id:valeur) :

  paires dupliquees sur les 400 derniers jours : 0/1909
  → AUCUNE recente : les doublons sont un heritage, pas une fuite active.
    L index UNIQUE empecherait les futurs ; l urgence est faible.


## B. PERFORMANCES ORPHELINES — defaut, ou desaccord de calendrier ?
  Test : le taux d orphelines suit-il la FREQUENCE des VL par pays ?
  Si oui, mon controle mesure un calendrier et non une corruption.

  pays       lignes perf  orphelines    taux  dates VL/an  rythme
  MAROC            74117       52177  70.4 %          242  quotidien
  NIGERIA          10687        8072  75.5 %           50  hebdomadaire
  UEMOA             2038        1151  56.5 %          257  quotidien
  TUNISIE           3841         652  17.0 %          218  quotidien
  CEMAC              531         425  80.0 %            ?  ?

  taux moyen, pays a VL quotidiennes   : 67.5 %
  taux moyen, pays a VL hebdomadaires  : 75.5 %
  → pas d artefact de calendrier : les taux ne suivent pas la frequence.
    Les orphelines sont alors un defaut reel, a instruire.

  TEST STRICT — performances sans AUCUNE VL a leur date ni avant : 65
  → 65 ligne(s) ne reposent sur AUCUNE VL. Celles-la sont le
    vrai P2-04 : une performance calculee sur rien. C est ce nombre qu il
    faut porter au backlog, pas le total.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_doublons_vl_dryrun.js ##########
=== PHASE SECHE DE fix_doublons_vl.js ===
Appel le 2026-10-28 06:02:34 UTC
Invoque SANS --execute : aucune ecriture possible.

=== DOUBLONS DE VL PORTANT ZERO ===
Mode : DRY-RUN (aucune ecriture)
Mesure le 2026-10-28 06:02:34 UTC

19 paire(s) dupliquee(s), fonds reels uniquement.

--- A SUPPRIMER : 19 ligne(s) a zero ---
         id  fonds date         garde l id   valeur gardee
    3175143   1552 Tue Oct 01      3243394       827269.72
    3183726   2596 Fri Dec 23      3204335         7029.13
    3183723   2597 Thu Jul 14      3196676         1791.27
    3183727   2597 Thu Aug 11      3196694         1803.09
    3183725   2597 Thu Oct 20      3196707         1808.37
    3183720   2597 Thu Nov 03      3196714         1814.39
    3183722   2597 Thu Nov 24      3196645         1767.87
    3183721   2597 Thu Dec 15      3196670         1785.13
    3183718   2597 Thu Jan 26      3196664         1780.54
    3183713   2597 Thu Feb 09      3196669         1784.87
    3183729   2597 Thu Mar 09      3196710         1811.63
    3183715   2597 Thu Mar 16      3196715         1815.72
    3183730   2597 Thu Mar 23      3196713         1813.07
    3183717   2597 Thu Apr 20      3196682         1797.94
    3183728   2597 Thu May 25      3196709         1809.03
    3183716   2597 Thu Aug 31      3196826         1855.44
    3183719   2597 Thu Sep 07      3196880         1863.16
    3183712   2601 Wed Jul 03      3185869         1113.88
    3183724   2615 Mon Sep 19      3190776        125433.6

--- APRES CE NETTOYAGE, L INDEX UNIQUE SERAIT-IL CREABLE ? ---
  OUI : plus aucune paire en double entre fonds reels.
  MySQL autorisant plusieurs NULL dans un index UNIQUE, les 18 087 lignes
  a `fund_id = NULL` ne le bloquent pas.
  Migration : ALTER TABLE valorisations
    ADD UNIQUE INDEX uq_valorisations_fund_date (fund_id, date);
  Retour arriere : DROP INDEX uq_valorisations_fund_date ON valorisations;

DRY-RUN — aucune ecriture. Relancer avec --execute pour appliquer.


=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_ecart_csv_base.js ##########

=== ECART ENTRE LE FICHIER SEC RELU ET LA BASE ===
Mesure le 2026-10-28 06:02:35 UTC — LECTURE SEULE
CSV : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_replay.csv

Lignes CSV : 41626
Fonds Nigeria en base : 337
VL Nigeria en base : 77568

## A. Appariement

    40828 ligne(s) CSV appariees a un fonds en base
      644 ligne(s) sans fonds correspondant (nom inconnu)
     1028 ligne(s) dont la date n est pas en base — un import les AJOUTERAIT
    27123 ligne(s) identiques a moins de 1 %
    12677 ligne(s) EN ECART

## B. Nature des ecarts

      391 changement(s) d ECHELLE (facteur >= 10) — les ruptures visees
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
   1189 NGN  2026-07-10      153009.1620         111.6700    1370.2 USD       EDC DOLLAR FUND
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
  ... et 331 autre(s)

  Sens : 378 correction(s) vers une valeur PLUS PETITE, 13 vers une PLUS GRANDE

## D. Devise que l extracteur corrige attribue a ces mesures

     350 ligne(s)   USD (source : column_header_matched_fund)
      28 ligne(s)   NGN (source : column_header_matched_fund)
      13 ligne(s)   NGN (source : column_header)


########## scripts/diag/ondemand/diag_import_nigeria.js ##########

=== IMPORT NIGERIA — POURQUOI PLUS AUCUNE VL DEPUIS LE 2026-08-10 ===

[1] Journaux du cron hebdomadaire (/var/log/africafunds_nigeria_*.log)
  africafunds_nigeria_20260921.log  (17481 o, modifie le 2026-09-21 10:02:28)
  africafunds_nigeria_20260928.log  (18512 o, modifie le 2026-09-28 10:08:59)
  africafunds_nigeria_20261005.log  (18748 o, modifie le 2026-10-05 10:09:36)
  africafunds_nigeria_20261012.log  (18842 o, modifie le 2026-10-12 10:09:36)
  africafunds_nigeria_20261019.log  (18940 o, modifie le 2026-10-19 10:09:19)
  africafunds_nigeria_20261026.log  (18932 o, modifie le 2026-10-26 10:09:13)

[2] Fin du dernier journal — /var/log/africafunds_nigeria_20261026.log
  | Fonds SANS dividendes:     1173
  | VL recalculees:            1007040
  | Erreurs:                   0
  | 
  | Verification globale:
  |   Total VL (value > 0):     1051158
  |   Avec vl_ajuste > 0:       1051086
  |   Avec vl_ajuste_EUR > 0:   1011143
  |   Avec vl_ajuste_USD > 0:   1011143
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
  | === NIGERIA WEEKLY UPDATE TERMINE AVEC 1 ERREUR(S) Mon Oct 26 10:09:13 AM UTC 2026 ===
  | ========================================
  | 

[3] Artefacts d extraction attendus a la racine du depot
  present sec_ng_latest.csv                11951498 o, modifie le 2026-10-26 10:00:40 — 9085 lignes
  present sec_ng_audit_latest.csv          31384 o, modifie le 2026-10-26 10:00:40 — 42 lignes
  present sec_ng_coherence_latest.csv      5 o, modifie le 2026-10-26 10:00:40 — 1 lignes
  present sec_ng_coverage_latest.csv       815 o, modifie le 2026-10-26 10:00:40 — 2 lignes
  present sec_ng_fuzzy_latest.csv          471 o, modifie le 2026-10-26 10:00:40 — 3 lignes
  present sec_ng_nav_extractor_v6.py       91088 o, modifie le 2026-08-29 14:45:15

[4] Cache de telechargement sec_ng_downloads/
  9 fichiers. Les plus recents :
    2026-10-19  2026
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
  HEAD : 39be051d1 — diag: S5 — les 39 785 VL detachees sont-elles recuperables ou perdues ?
  present          correctif C8 (lots de performances non menteurs)
  present          budgets de fraicheur en source unique
  present          health check corrige
  present          correctif #73 (present, NON execute)

  Process PM2 :
    api-monolith             online     redemarrages  170  depuis 10.9 h
    fundafrique-frontend     online     redemarrages   48  depuis 1749.9 h
    worker-recalculation     online     redemarrages    3  depuis 1107.8 h
    worker-data-import       online     redemarrages    3  depuis 1107.8 h

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


########## scripts/diag/ondemand/diag_index_config_divergence.js ##########
=== INDEX_CONFIG EN TROIS COPIES : DETTE, OU DONNEE FAUSSE ? ===
Mesure le 2026-10-28 06:02:41 UTC — LECTURE SEULE

## 0. TABLES D INDICES : indices, indice_categorie, indice_references, indice_comparaison, ref_indices_fundafrica, type_indice
  table retenue : `indice_references` | colonne d identite : `nom_indice`
  collation : utf8mb3_general_ci
  → collation INSENSIBLE a la casse : MySQL confond `Tunindex` et `TUNINDEX`.
    La divergence de casse n a donc PAS pu creer deux series separees.
    Elle reste une dette, mais elle n a pas produit de donnee fausse.

## 1. `Tunindex` ET `TUNINDEX` COEXISTENT-ILS EN BASE ?
  valeur exacte (casse respectee)       lignes  derniere
  NSE All Share                           6992  2026-10-27
  Tunindex                                6988  2026-10-27
  BRVM Composite                          6966  2026-10-27
  MASI                                    6952  2026-10-27
  MONIA                                   1000  2026-05-14

  → chaque indice n existe que sous une seule casse : la divergence des
    trois copies n a pas (encore) produit de serie parallele.

## 2. MONIA — mort faute de SOURCE, ou faute de DESTINATION ?
  (colonne de libelle sur `valorisations` : `indice_name`, lue dans le schema)
  dans `indice_references` : 1000 valeur(s), de 2019-12-31 a 2026-05-14 (age 167 j)
  VL portant MONIA comme indice : 0
  → HYPOTHESE CONFIRMEE. La SOURCE a produit des valeurs, mais AUCUNE VL
    ne porte MONIA. Le propagateur ne le connait pas, et son `pays` est
    un tableau vide dans les deux copies ou il figure : la propagation
    n a aucune ligne a viser. MONIA n est pas mort faute de source — il
    est mort faute de DESTINATION. Le remede n est pas de reparer un
    scraper qui marche, c est de lui donner un pays et de l ajouter au
    propagateur.

## 3. LES CINQ INDICES MORTS ONT-ILS UNE DESTINATION ?
  Un indice frais mais rattache a zero VL est aussi inutile qu un indice mort.
  indice                            valeurs    derniere  VL rattachees
  monia                                1000  2026-05-14              0
  masi_all_shares                         0           —              0
  sovereign_bond_index                 2609  2023-11-17           6243
  indice_monetaire_maroc                971  2023-11-17              0
  s&p tunisia                             0           —              0

  Lire la derniere colonne avant de reparer une source : un indice a zero VL
  rattachee ne manque a personne tant qu il n a pas de destination.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_mariadb_incident_timeline.js ##########

=== MARIADB — TIMELINE INCIDENTS RECENTS (LECTURE SEULE) ===
Mesure le 2026-10-28T06:03:03.772Z


--- etat systemd courant ---
Restart=on-abort
Result=success
NRestarts=0
ExecMainStartTimestamp=Tue 2026-09-22 06:25:02 UTC
ExecMainPID=3041009
MemoryCurrent=4253970432
ActiveState=active
SubState=running
StateChangeTimestamp=Tue 2026-09-22 06:25:02 UTC
ActiveEnterTimestamp=Tue 2026-09-22 06:25:02 UTC

--- processus mariadbd courant ---
MARIADB_PROCESS pid=3041009 uptime_s=3109082 rss_kb=4021728 rssanon_kb=4011496 private_dirty_kb=4012644 swap_kb=1877720

--- listener TCP 3306 courant ---
LISTEN 0      80                                       127.0.0.1:3306       0.0.0.0:*    users:(("mariadbd",pid=3041009,fd=19))

--- mariadb.service — evenements significatifs sur 14 jours ---
(aucune ligne)

--- kernel — OOM sur 14 jours ---
(aucune ligne)

--- fenetre cible 2026-09-21 09:30 -> 2026-09-22 11:30 — service ---
2026-09-21T10:02:23+0000 priceless-mayer systemd[1]: mariadb.service: A process of this unit has been killed by the OOM killer.
2026-09-21T10:02:25+0000 priceless-mayer systemd[1]: mariadb.service: Main process exited, code=killed, status=9/KILL
2026-09-21T10:02:25+0000 priceless-mayer systemd[1]: mariadb.service: Failed with result 'oom-kill'.
2026-09-22T06:25:02+0000 priceless-mayer mariadbd[3041009]: 2026-09-22  6:25:02 0 [Note] /usr/sbin/mariadbd: ready for connections.
2026-09-22T06:25:02+0000 priceless-mayer systemd[1]: Started MariaDB 10.6.23 database server.

--- fenetre cible 2026-09-21 09:30 -> 2026-09-22 11:30 — kernel OOM ---
2026-09-21T10:02:23+0000 priceless-mayer kernel: npm start invoked oom-killer: gfp_mask=0x1100cca(GFP_HIGHUSER_MOVABLE), order=0, oom_score_adj=0
2026-09-21T10:02:23+0000 priceless-mayer kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=user.slice,mems_allowed=0,global_oom,task_memcg=/system.slice/mariadb.service,task=mariadbd,pid=2100513,uid=113
2026-09-21T10:02:23+0000 priceless-mayer kernel: Out of memory: Killed process 2100513 (mariadbd) total-vm:19569132kB, anon-rss:15054704kB, file-rss:0kB, shmem-rss:0kB, UID:113 pgtables:34252kB oom_score_adj:0

=== CLASSIFICATION BORNEE DE LA FENETRE 21/09 ===
SEP21_MARIADB_OOM_PROVEN=YES
SEP21_KERNEL_OOM_PRESENT=YES
SEP21_MARIADB_SERVICE_FAILURE_PRESENT=YES
SEP21_MARIADB_START_OR_READY_PRESENT=YES

=== FIN — AUCUNE MUTATION ===


########## scripts/diag/ondemand/diag_masi_historique_ft.js ##########
=== SERIE HISTORIQUE MASI — ACCES DEPUIS S2 ===
Mesure le 2026-10-28 06:03:04 UTC — LECTURE SEULE

## 1. Page tearsheet et extraction de l identifiant interne
  https://markets.ft.com/data/indices/tearsheet/historical?s=MASI:CAS
  statut 200 | 80500 o
  identifiant interne : 601207

## 2. Point d acces historique
  statut 200 | 26045 o
  lignes de tableau trouvees : 44

  Quatre lignes brutes, toutes colonnes :
    Monday, October 05, 2026 Mon, Oct 05, 2026  |  17,303.69  |  17,447.75  |  17,159.50  |  17,159.50  |  0 0.00
    Friday, October 02, 2026 Fri, Oct 02, 2026  |  17,579.17  |  17,698.72  |  17,295.18  |  17,303.69  |  0 0.00
    Thursday, October 01, 2026 Thu, Oct 01, 2026  |  17,733.06  |  17,780.94  |  17,579.17  |  17,579.17  |  0 0.00
    Wednesday, September 30, 2026 Wed, Sep 30, 2026  |  17,754.91  |  17,916.34  |  17,725.83  |  17,733.06  |  0 0.00

  Ligne temoin du Oct 02, 2026 : Friday, October 02, 2026 Fri, Oct 02, 2026  |  17,579.17  |  17,698.72  |  17,295.18  |  17,303.69  |  0 0.00
  colonne portant la cloture connue 17303.69 : n°4

## 3. Verdict
  La serie est accessible ET la colonne de cloture est identifiee
  (n°4) par concordance avec une valeur connue de deux
  sources independantes. Le rattrapage du 06/08 au 02/10 peut donc
  etre fait avec des clotures PUBLIEES, sans deduire aucune valeur.

  Clotures disponibles sur la fenetre manquante :
    Monday, October 05, 2026 Mon, Oct 05, 2026 cloture 17,159.50
    Friday, October 02, 2026 Fri, Oct 02, 2026 cloture 17,303.69
    Thursday, October 01, 2026 Thu, Oct 01, 2026 cloture 17,579.17
    Wednesday, September 30, 2026 Wed, Sep 30, 2026 cloture 17,733.06
    Tuesday, September 29, 2026 Tue, Sep 29, 2026 cloture 17,754.91
    Monday, September 28, 2026 Mon, Sep 28, 2026 cloture 17,648.90
    Friday, September 25, 2026 Fri, Sep 25, 2026 cloture 17,818.09
    Thursday, September 24, 2026 Thu, Sep 24, 2026 cloture 17,869.06
  total : 44 cloture(s) datee(s)

## 4. Jonction avec notre propre serie
  cloture FT au 31/07/2026 : 17,843.70
  valeur stockee par nous  : 17843.7
  ecart                    : 0.00 (0.0000 %)
  IDENTIQUES. FT publie la meme serie que celle suivie jusqu a la
  panne : le rattrapage est une continuation, pas un raccord.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_nigeria_cadence_extraction.js ##########
=== NIGERIA : LA CADENCE D EXTRACTION TIENT-ELLE LE BUDGET ? ===
Mesure le 2026-10-28 06:03:05 UTC — LECTURE SEULE

## 1. DELAI PUBLICATION - VALORISATION (releve sur la page d index)
  valorisation  mise en ligne  delai
  2026-09-18    2026-09-25       7 j
  2026-09-25    2026-10-02       7 j
  2026-10-02    2026-10-09       7 j
  2026-10-09    2026-10-16       7 j
  2026-10-16    2026-10-25       9 j
  delai moyen : 7.4 j — et les jours de mise en ligne varient.

## 2. CE QU UN CRON HEBDOMADAIRE DU LUNDI EN FAIT
  valorisation  en ligne    1er lundi apres  age a l arrivee
  2026-09-18    2026-09-25  2026-09-28        10 j
  2026-09-25    2026-10-02  2026-10-05        10 j
  2026-10-02    2026-10-09  2026-10-12        10 j
  2026-10-09    2026-10-16  2026-10-19        10 j
  2026-10-16    2026-10-25  2026-10-26        10 j
  age moyen a l arrivee : 10.0 j | PIRE CAS : 10 j
  budget de C4.NIGERIA : 14 j
  → le budget tient avec cette cadence.

## 3. CE QU UNE EXTRACTION QUOTIDIENNE CHANGERAIT
  age a l arrivee : 8 j, 8 j, 8 j, 8 j, 10 j
  pire cas : 10 j — DANS le budget de 14 j
  Cout : l extracteur ne retelecharge pas ce qu il a en cache
  (`download_file` sort des que le fichier existe et depasse 1 Ko), et
  l import est en INSERT IGNORE. Une execution a vide est donc quasi
  gratuite. C est une decision de cadence, pas de code.

## 4. LE CLASSEUR DU 16 OCTOBRE (document 1537) EST-IL EN CACHE ?
  ABSENT. Confirme : l extraction du 26/10 ne l a pas pris.
  Il n arrivera qu au prochain cron hebdomadaire (lundi 2 novembre),
  soit 24 jours apres sa date de valorisation.

## 5. CLASSEURS 2026 EN CACHE — a perimetre egal (correction de ma mesure)
  Ma mesure precedente annoncait « 523 orphelins = parsing en echec ». Elle
  comparait un CSV limite a l annee courante a un cache couvrant 2022-2026.
  41 classeur(s) 2026 en cache
  Le CSV du 26/10 en declare 41 lus. Un ecart ici — et SEULEMENT ici —
  signalerait un parsing en echec.

## 6. TRACE DE L ETAPE [1/8] AU DERNIER CRON HEBDOMADAIRE
  africafunds_nigeria_20261026.log
  | [1/8] Extraction SEC Nigeria (2026)...
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_10th_April_2026.xlsx | rows=222 | dates=2026-04-10
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_10th_July_2026.xlsx | rows=223 | dates=2026-07-10
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_11th_June_2026.xlsx | rows=222 | dates=2026-06-11
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_11th_September_2026.xlsx | rows=228 | dates=2026-09-11
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_13th_February_2026.xlsx | rows=216 | dates=2026-02-13
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_13th_March_2026.xlsx | rows=219 | dates=2026-03-13
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_14th_August_2026.xlsx | rows=227 | dates=2026-08-14
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_15th_May_2026.xlsx | rows=221 | dates=2026-05-15
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_16th_January_2026.xlsx | rows=214 | dates=2026-01-16
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_17th_April_2026.xlsx | rows=221 | dates=2026-04-17
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_17th_July_2026.xlsx | rows=225 | dates=2026-07-17
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_18th_March_2026.xlsx | rows=219 | dates=2026-03-18
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_18th_September_2026.xlsx | rows=228 | dates=2026-09-18
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_19th_June_2026.xlsx | rows=222 | dates=2026-06-19
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_20th_February_2026.xlsx | rows=216 | dates=2026-02-20
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_21st_August_2026.xlsx | rows=227 | dates=2026-08-21
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_22nd_May_2026.xlsx | rows=221 | dates=2026-05-22
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_23rd_January_2026.xlsx | rows=214 | dates=2026-01-23
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_24th_April_2026.xlsx | rows=221 | dates=2026-04-24
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_24th_July_2026.xlsx | rows=225 | dates=2026-07-24
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_25th_September_2026.XLSX | rows=230 | dates=2026-09-25
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_26th_June_2026.xlsx | rows=222 | dates=2026-06-26
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_27th_February_2026.xlsx | rows=217 | dates=2026-02-27
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_27th_March_2026.xlsx | rows=219 | dates=2026-03-27
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_28th_August_2026.xlsx | rows=227 | dates=2026-08-28
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_29th_May_2026.xlsx | rows=221 | dates=2026-05-29
  | [OK] 2026 | Net_Asset_Value_and_Unit_Price_as_at_2nd_April_2026.xlsx | rows=220 | dates=2026-04-02

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_nigeria_csv_vers_base.js ##########
=== NIGERIA : POURQUOI LE CSV N ARRIVE-T-IL PAS EN BASE ? ===
Mesure le 2026-10-28 06:03:05 UTC — LECTURE SEULE

## 1. LA BASE
  78152 VL nigerianes | derniere date : 2026-10-09
  dernieres dates : 2026-10-09 (27), 2026-10-02 (27), 2026-09-25 (24), 2026-09-18 (24), 2026-09-11 (23), 2026-09-04 (23), 2026-08-28 (23), 2026-08-21 (23)
  fonds nigerians : 336 actifs, 1 inactifs

## 2. LE CSV
  /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/sec_ng_latest.csv
  12.0 Mo, modifie le 2026-10-26 10:00
  9084 lignes | colonnes : ﻿source_file, source_url, source_title, source_page_url, source_year_page, downloaded_at_utc, file_size_bytes, sheet_name, source_row_number, header_row_number …
  41 dates valides | de 2026-01-02 a 2026-10-09
  8 plus recentes : 2026-08-21, 2026-08-28, 2026-09-04, 2026-09-11, 2026-09-18, 2026-09-25, 2026-10-02, 2026-10-09

## 3. CAUSE (1) — la source a-t-elle des dates POSTERIEURES a 2026-10-09 ?
  0 ligne(s) du CSV portent une date > 2026-10-09
  → CAUSE (1) CONFIRMEE : il n y a RIEN de plus recent a importer.
    Le defaut est en amont, chez la SEC ou dans l extraction, pas dans
    l import. `C4.NIGERIA` mesure alors la fraicheur de la SOURCE, et le
    budget de 14 jours est peut-etre simplement inadapte a sa cadence.
    cadence recente du CSV (dates par mois) : 2026-05:4, 2026-06:4, 2026-07:5, 2026-08:4, 2026-09:4, 2026-10:2

########## scripts/diag/ondemand/diag_nigeria_extraction_amont.js ##########
=== NIGERIA : L EXTRACTION A-T-ELLE RATE QUELQUE CHOSE EN AMONT ? ===
Mesure le 2026-10-28 06:03:06 UTC — LECTURE SEULE

CSV : 9084 lignes, modifie le 2026-10-26 10:00

## 1. DATES DE TELECHARGEMENT declarees dans le CSV
  2026-10-26  9084 ligne(s)
  dernier telechargement : 2026-10-26 (il y a 2 j)
  → l extraction a bien TELECHARGE recemment. Si rien de neuf n en sort,
    c est que la source etait muette : piste (A).

## 2. CLASSEURS LUS par l extraction : 41
  2026-08-07     227 lignes  Net_Asset_Value_and_Unit_Price_as_at_7th_August_2026.xlsx
  2026-08-14     227 lignes  Net_Asset_Value_and_Unit_Price_as_at_14th_August_2026.xlsx
  2026-08-21     227 lignes  Net_Asset_Value_and_Unit_Price_as_at_21st_August_2026.xlsx
  2026-08-28     227 lignes  Net_Asset_Value_and_Unit_Price_as_at_28th_August_2026.xlsx
  2026-09-04     227 lignes  Net_Asset_Value_and_Unit_Price_as_at_4th_September_2026.xlsx
  2026-09-11     228 lignes  Net_Asset_Value_and_Unit_Price_as_at_11th_September_2026.xlsx
  2026-09-18     228 lignes  Net_Asset_Value_and_Unit_Price_as_at_18th_September_2026.xlsx
  2026-09-25     230 lignes  Net_Asset_Value_and_Unit_Price_as_at_25th_September_2026.XLSX
  2026-10-02     228 lignes  Net_Asset_Value_and_Unit_Price_as_at_2nd_October_2026.xlsx
  2026-10-09     229 lignes  Net_Asset_Value_and_Unit_Price_as_at_9th_October_2026.xlsx

  classeur le plus recent : Net_Asset_Value_and_Unit_Price_as_at_9th_October_2026.xlsx
  derniere date qu il porte : 2026-10-09
  url : https://sec.gov.ng/documents/1536/Net_Asset_Value_and_Unit_Price_as_at_9th_October_2026.xlsx
  page d index : https://sec.gov.ng/for-operators/keep-track-of-capital-market-data/net-asset-value-data/weekly-net-asset-value-for-cis/2026-weekly-nav-for-cis/
  → c est cette URL qu il faut ouvrir pour savoir si la SEC a publie depuis.

## 3. FICHIERS TELECHARGES SUR LE DISQUE vs CLASSEURS LUS
  564 classeur(s) sur le disque
  telecharge le          Mo  lu ?   nom
  2026-10-19 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_9th_October_2026.
  2026-10-12 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_2nd_October_2026.
  2026-10-05 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_25th_September_20
  2026-10-05 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_18th_September_20
  2026-09-21 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_4th_September_202
  2026-09-21 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_11th_September_20
  2026-09-14 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_28th_August_2026.
  2026-09-14 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_21st_August_2026.
  2026-08-28 20:42      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_14th_August_2026.
  2026-08-24 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_7th_August_2026.x
  2026-08-24 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_31st_July_2026.xl
  2026-08-10 10:00      0.1  oui   Net_Asset_Value_and_Unit_Price_as_at_24th_July_2026.xl

  perimetre de comparaison : annee(s) 2026 — 41 classeur(s) sur 564 en cache
  Aucun orphelin dans le perimetre : tout ce qui est telecharge est lu.
  → l extraction ne perd rien au parsing. Le defaut est AVANT le
    telechargement. Mesure du 2026-10-28 sur la page d index de la SEC :
    le document 1537 (donnees du 16 octobre) y est, mis en ligne le 25,
    et notre cron du 26 ne l a pas pris. La source N EST PAS muette.

## CE QUE CELA IMPLIQUE
  Si (A) — source muette : recalibrer le budget de C4.NIGERIA sur la cadence
  hebdomadaire reelle, en documentant POURQUOI dans le script de controle.
  Ne jamais desactiver le controle : un budget justifie reste un controle,
  un controle eteint ne mesure plus rien.
  Si (B) — extraction en defaut : reparer le telechargement ou le parsing, et
  faire en sorte que l etape 1/8 du cron COMPTE ce qu elle n a pas pu lire.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_nigeria_liens_vus.js ##########
=== LA PAGE D INDEX LIVRE-T-ELLE LE 1537 A NOTRE CODE ? ===
Mesure le 2026-10-28 06:03:07 UTC — LECTURE SEULE
Une requete GET sur la page publique que le cron interroge chaque lundi.

## 1. REPONSE : HTTP 200, 119988 octets

## 2. CE QUE NOS FILTRES RETIENNENT
  179 ancre(s) dans la page | 42 classeur(s) retenu(s)
  Le cron du 26/10 en avait lu 41.

## 3. LE DOCUMENT 1537 (donnees du 16 octobre)
  TROUVE : https://sec.gov.ng/documents/1537/Net_Asset_Value_and_Unit_Price_as_at_16th_October_2026.xlsx
           « Net Asset Value and Unit Price as at 16th October 2026 xlsx • 138.6 KB October 25, 2026 »

  → PISTE (B2b) CONFIRMEE. La page le livre a nos propres filtres,
    depuis ce serveur, maintenant. Deux lectures possibles, et seule
    l instrumentation de l etape 1/8 les separera a la prochaine
    execution : soit la page a ete mise a jour APRES le 26/10 10:00,
    soit la requete du 26/10 a echoue ou rendu une page partielle.
    Dans les deux cas le defaut est le MEME : rien ne compte les liens
    vus, donc un lien manquant a la page est indistinguable d un lien
    manquant a notre lecture. C est ce qui a rendu ce trou invisible
    pendant trois semaines.

## 4. LES SIX VALORISATIONS LES PLUS RECENTES QUE LA PAGE OFFRE
  2026-09-11  /Net_Asset_Value_and_Unit_Price_as_at_11th_September_2026.xlsx
  2026-09-18  /Net_Asset_Value_and_Unit_Price_as_at_18th_September_2026.xlsx
  2026-09-25  /Net_Asset_Value_and_Unit_Price_as_at_25th_September_2026.XLSX
  2026-10-02  534/Net_Asset_Value_and_Unit_Price_as_at_2nd_October_2026.xlsx
  2026-10-09  536/Net_Asset_Value_and_Unit_Price_as_at_9th_October_2026.xlsx
  2026-10-16  37/Net_Asset_Value_and_Unit_Price_as_at_16th_October_2026.xlsx

  derniere valorisation offerte : 2026-10-16
  derniere valorisation en base  : 2026-10-09 (mesure du 2026-10-28)
  → ECART CONFIRME : la source offre plus recent que ce que nous avons.

## CORRECTIF RECOMMANDE, par ordre d utilite
  1. INSTRUMENTER l etape 1/8 : imprimer le nombre de liens VUS sur la
     page, TELECHARGES, et DEJA EN CACHE. Sans cela le prochain raté
     sera aussi muet que celui-ci. C est le correctif de fond.
  2. Faire ECHOUER l etape quand la derniere valorisation offerte par la
     page est plus recente que la derniere importee : le cron a alors vu
     un fichier et ne l a pas pris, ce qui doit etre une erreur, pas un OK.
  3. Cadence quotidienne : filet utile — un rate se rattrape le lendemain
     au lieu de la semaine suivante — mais PAS le correctif. La cadence
     hebdomadaire rend 10 jours, dans le budget de 14.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_perf10ans_zero_ou_ancrage.js ##########
=== perf10ans : ZERO ARTEFACT EN BASE, OU ANCRAGE TROP COURT ? ===
Fonds instruit : 1543
Mesure le 2026-10-28 06:03:08 UTC — LECTURE SEULE

## 1. Type REEL des colonnes longues (la base fait foi)
  perf10ans      double
  perf10ansm     varchar(255)
  perf5ans       varchar(255)
  perf8ans       double

## 2. Distribution des zeros exacts sur toute la table
  perf5ans     91214 lignes | NULL    594 | '-'  12672 | zero exact  27199 (29.8 %) | autre  63421
  perf8ans     91214 lignes | NULL    876 | '-'  35083 | zero exact  35083 (38.5 %) | autre  55255
  perf10ans    91214 lignes | NULL    963 | '-'  41493 | zero exact  41493 (45.5 %) | autre  48758
  perf10ansm   91214 lignes | NULL  42146 | '-'      0 | zero exact    368 (0.4 %) | autre  48700
  → une part elevee de zeros exacts, surtout si les tirets sont a 0,
    indique une coercition de la chaine '-' vers 0 (sql_mode non strict).

## 3. Fonds 1543 — son historique porte-t-il un « dix ans » ?
  1528 VL | premiere 2016-10-28 | derniere 2024-11-01 | profondeur 8.01 ans
  AUCUNE VL a dix ans ou avant la derniere.
  → un perf10ans n a PAS de sens pour ce fonds. Si le calcul direct en
    produit un, il mesure une fenetre plus courte : explication (B), et
    c est le SCRIPT qui a tort.
  ligne MAX(date) en base (2024-11-13) : perf5ans=58.34731769729258 perf8ans=19.707600000000003 perf10ans=19.707600000000003 perf10ansm=20.864799999999995

## 4. Perimetre : fonds a historique < 10 ans portant malgre tout un perf10ans
  8 fonds. → ce n est pas un cas isole mais une CLASSE de defaut, a traiter comme telle.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_perf_colonnes_manquantes.js ##########
=== L0.a — RATIOS MANQUANTS SUR LA LIGNE MAX(date), ET COUT D UN APPEL DE RATIOS ===
Mesure le 2026-10-28 06:03:16 UTC — LECTURE SEULE

## 1. Volumetrie de `performences`
  91214 lignes | 1252 fonds distincts | de NaN-NaN-NaN a 2026-10-27

## 2. Ligne MAX(date) de chaque fonds actif — ratios absents (NULL ou `-`)
   LIGNE DE BASE : apres le rattrapage, ces nombres ne doivent pas augmenter.
  NIGERIA         330 fonds | volatility3an vide :  155 | les 10 ratios vides :  145 (43.9 %) | retard perf.    4.0 j
  MAROC           646 fonds | volatility3an vide :   60 | les 10 ratios vides :   60 (9.3 %) | retard perf.   -2.0 j
  CEMAC            34 fonds | volatility3an vide :   32 | les 10 ratios vides :   32 (94.1 %) | retard perf.    0.0 j
  UEMOA           109 fonds | volatility3an vide :   15 | les 10 ratios vides :   15 (13.8 %) | retard perf.   -0.2 j
  TUNISIE         131 fonds | volatility3an vide :   13 | les 10 ratios vides :   13 (9.9 %) | retard perf.    0.0 j
  TOTAL          1250 fonds | les 10 ratios vides : 265 (21.2 %)

## 3. Perimetre reel du rattrapage (sans `--force`)
  NIGERIA          10 fonds a rattraper
  MAROC            10 fonds a rattraper
  UEMOA             4 fonds a rattraper
  TOTAL            24 fonds

## 4. Temps de reponse de `/api/ratiosnewithdate/3/:fond/:date`
   Ce chiffre seul dicte la duree de L3 : il sera multiplie par le perimetre ci-dessus.
  fonds   569 (MAROC   ) date=2026-10-23 → HTTP 200 en    184 ms, 1236 octets
  fonds  1141 (NIGERIA ) date=2026-07-10 → HTTP 200 en    357 ms, 1713 octets
  fonds  1539 (UEMOA   ) date=2024-11-01 → HTTP 200 en   1043 ms, 2116 octets
  moyenne : 528 ms sur 3 appel(s) reussi(s)
  → projection L3 : 24 fonds x 1 appel(s) ≈ 0.00 h
  → projection L3 : 24 fonds x 3 appel(s) ≈ 0.01 h

## 4bis. Type REEL des colonnes de ratios, et mode SQL
  alpha3an         double         nullable=YES
  perfannu3an      varchar(255)   nullable=YES
  r2_3an           double         nullable=YES
  ratiosharpe3an   varchar(255)   nullable=YES
  volatility3an    varchar(255)   nullable=YES
  lastdatepreviousmonth : ABSENTE de la table → la route ne l ecrit pas, le script ne doit pas l ecrire non plus
  table performences : 97 colonnes au total — c est le denominateur du « 0 divergence sur N colonnes » attendu en L1.
  sql_mode : IGNORE_SPACE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
  → mode strict : NON (une ecriture de `-` dans un DOUBLE donnerait 0 — faux ratio valide)
  volatility3an sur 91214 lignes : 7913 NULL | 11714 exactement 0 | 71587 > 0 | 0 < 0
  → des zeros exacts existent : a instruire, une volatilite nulle n a pas de sens financier

## 5. Prerequis de la migration L2 (horodatage des classements)
  DB_SYNC_ALTER  : ABSENTE | vaut 'true' : non
  DB_SYNC        : ABSENTE | vaut 'true' : non
  classementfonds        ≈ 3564 lignes | donnees 2.0 Mo | index 0.2 Mo
  classementfonds_eurs   ≈ 2964 lignes | donnees 2.0 Mo | index NaN Mo
  classementfonds_usds   ≈ 2836 lignes | donnees 2.0 Mo | index NaN Mo

=== FIN L0.a — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_perf_locale_equivalence.js ##########
=== PERFORMANCES LOCALES — EQUIVALENCE CALCUL DIRECT / ROUTE API ===
Mesure le 2026-10-28 06:03:21 UTC — DRY-RUN, AUCUNE ECRITURE

########## NIGERIA
Options: pays=NIGERIA, force=false, mode=DRY-RUN (aucune ecriture), limit=10
335 fonds a traiter
  limite de 10 fonds atteinte
--- DRY-RUN : comparaison avec la table performences ---
Colonnes comparees par fonds : 90 (performances ET ratios — le dry-run du 2026-10-06 n en comparait que dix, d ou une equivalence affirmee a tort)
Fonds sans aucun desaccord : 10
Fonds avec desaccord       : 0
Fonds absents en base      : 0
--- DIVERGENT — desaccord de valeur (doit etre vide) : aucune ---
--- PERDU — la table avait une valeur, le script non (doit etre vide) : aucune ---
--- COMBLE — le script remplit une colonne vide (attendu) : aucune ---
--- REFUSE — horizon non couvert par l historique (attendu, corrige un faux chiffre) : aucune ---
=== INVARIANT DU JUGE ===
  DIVERGENT + PERDU + COMBLE + REFUSE = 0 + 0 + 0 + 0 = 0
  Desaccords constates                = 0
  → INVARIANT VERIFIE. Les compteurs couvrent tous les desaccords constates.
=== CRITERE DE BASCULE, sur 90 colonnes comparees ===
  DIVERGENT : 0 (exige : 0)
  PERDU     : 0 (exige : 0)
  COMBLE    : 0 (attendu non nul : les ratios que la table n a pas)
  REFUSE    : 0 (attendu non nul : les horizons que l historique ne couvre pas)
  → CRITERE ATTEINT. Les deux calculs donnent les memes chiffres la ou les deux en ont un, et le script ne fait perdre aucune valeur existante. La substitution est non destructrice sur ce perimetre.
Appels de ratios echoues     : 0 (periode non ecrite, contenu existant preserve)
Fonds sans les 10 ratios du classement : 1 — leurs rangs de risque resteraient vides (historique < 3 ans, ou appel echoue)
-- code de sortie : 0

########## UEMOA
Options: pays=UEMOA, force=false, mode=DRY-RUN (aucune ecriture), limit=10
111 fonds a traiter
  limite de 10 fonds atteinte
--- DRY-RUN : comparaison avec la table performences ---
Colonnes comparees par fonds : 90 (performances ET ratios — le dry-run du 2026-10-06 n en comparait que dix, d ou une equivalence affirmee a tort)
Fonds sans aucun desaccord : 10
Fonds avec desaccord       : 0
Fonds absents en base      : 0
--- DIVERGENT — desaccord de valeur (doit etre vide) : aucune ---
--- PERDU — la table avait une valeur, le script non (doit etre vide) : aucune ---
--- COMBLE — le script remplit une colonne vide (attendu) : aucune ---
--- REFUSE — horizon non couvert par l historique (attendu, corrige un faux chiffre) : aucune ---
=== INVARIANT DU JUGE ===
  DIVERGENT + PERDU + COMBLE + REFUSE = 0 + 0 + 0 + 0 = 0
  Desaccords constates                = 0
  → INVARIANT VERIFIE. Les compteurs couvrent tous les desaccords constates.
=== CRITERE DE BASCULE, sur 90 colonnes comparees ===
  DIVERGENT : 0 (exige : 0)
  PERDU     : 0 (exige : 0)
  COMBLE    : 0 (attendu non nul : les ratios que la table n a pas)
  REFUSE    : 0 (attendu non nul : les horizons que l historique ne couvre pas)
  → CRITERE ATTEINT. Les deux calculs donnent les memes chiffres la ou les deux en ont un, et le script ne fait perdre aucune valeur existante. La substitution est non destructrice sur ce perimetre.
Appels de ratios echoues     : 0 (periode non ecrite, contenu existant preserve)
Fonds sans les 10 ratios du classement : 2 — leurs rangs de risque resteraient vides (historique < 3 ans, ou appel echoue)
-- code de sortie : 0

########## FONDS 1543 — passe ciblee, detail complet
Connecte a la base fund_opcvm
Options: pays=TOUS, force=false, mode=DRY-RUN (aucune ecriture)
1 fonds a traiter
==========================================
=== RAPPORT PEUPLAGE PERFORMANCES ===
==========================================
--- DRY-RUN : comparaison avec la table performences ---
Colonnes comparees par fonds : 90 (performances ET ratios — le dry-run du 2026-10-06 n en comparait que dix, d ou une equivalence affirmee a tort)
Fonds sans aucun desaccord : 1
Fonds avec desaccord       : 0
Fonds absents en base      : 0
--- DIVERGENT — desaccord de valeur (doit etre vide) : aucune ---
--- PERDU — la table avait une valeur, le script non (doit etre vide) : aucune ---
--- COMBLE — le script remplit une colonne vide (attendu) : aucune ---
--- REFUSE — horizon non couvert par l historique (attendu, corrige un faux chiffre) : aucune ---
=== INVARIANT DU JUGE ===
  DIVERGENT + PERDU + COMBLE + REFUSE = 0 + 0 + 0 + 0 = 0
  Desaccords constates                = 0
  → INVARIANT VERIFIE. Les compteurs couvrent tous les desaccords constates.
=== CRITERE DE BASCULE, sur 90 colonnes comparees ===
  DIVERGENT : 0 (exige : 0)
  PERDU     : 0 (exige : 0)
  COMBLE    : 0 (attendu non nul : les ratios que la table n a pas)
  REFUSE    : 0 (attendu non nul : les horizons que l historique ne couvre pas)
  → CRITERE ATTEINT. Les deux calculs donnent les memes chiffres la ou les deux en ont un, et le script ne fait perdre aucune valeur existante. La substitution est non destructrice sur ce perimetre.
Appels de ratios echoues     : 0 (periode non ecrite, contenu existant preserve)
Fonds sans les 10 ratios du classement : 0 — leurs rangs de risque resteraient vides (historique < 3 ans, ou appel echoue)
Fonds traites:    1
Inseres:          0
Mis a jour:       0
Ignores:          0
Erreurs:          0
=== PAR PAYS ===
  UEMOA: 1 fonds
Termine.
-- code de sortie : 0

########## FONDS 1145 — passe ciblee, detail complet
Connecte a la base fund_opcvm
Options: pays=TOUS, force=false, mode=DRY-RUN (aucune ecriture)
1 fonds a traiter
==========================================
=== RAPPORT PEUPLAGE PERFORMANCES ===
==========================================
--- DRY-RUN : comparaison avec la table performences ---
Colonnes comparees par fonds : 90 (performances ET ratios — le dry-run du 2026-10-06 n en comparait que dix, d ou une equivalence affirmee a tort)
Fonds sans aucun desaccord : 1
Fonds avec desaccord       : 0
Fonds absents en base      : 0
--- DIVERGENT — desaccord de valeur (doit etre vide) : aucune ---
--- PERDU — la table avait une valeur, le script non (doit etre vide) : aucune ---
--- COMBLE — le script remplit une colonne vide (attendu) : aucune ---
--- REFUSE — horizon non couvert par l historique (attendu, corrige un faux chiffre) : aucune ---
=== INVARIANT DU JUGE ===
  DIVERGENT + PERDU + COMBLE + REFUSE = 0 + 0 + 0 + 0 = 0
  Desaccords constates                = 0
  → INVARIANT VERIFIE. Les compteurs couvrent tous les desaccords constates.
=== CRITERE DE BASCULE, sur 90 colonnes comparees ===
  DIVERGENT : 0 (exige : 0)
  PERDU     : 0 (exige : 0)
  COMBLE    : 0 (attendu non nul : les ratios que la table n a pas)
  REFUSE    : 0 (attendu non nul : les horizons que l historique ne couvre pas)
  → CRITERE ATTEINT. Les deux calculs donnent les memes chiffres la ou les deux en ont un, et le script ne fait perdre aucune valeur existante. La substitution est non destructrice sur ce perimetre.
Appels de ratios echoues     : 0 (periode non ecrite, contenu existant preserve)
Fonds sans les 10 ratios du classement : 0 — leurs rangs de risque resteraient vides (historique < 3 ans, ou appel echoue)
Fonds traites:    1
Inseres:          0
Mis a jour:       0
Ignores:          0
Erreurs:          0
=== PAR PAYS ===
  NIGERIA: 1 fonds
Termine.
-- code de sortie : 0

=== FIN — dry-run uniquement, aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_plan_dollar.js ##########

=== OPTION DOLLAR — COUT MESURE AVANT ECRITURE ===
Mesure le 2026-10-28 06:03:47 UTC — LECTURE SEULE

Fonds pour lesquels la SEC publie au moins une mesure en dollars : 41

## Devise emise par l extracteur, par annee (fonds concernes seulement)

  annee      USD     NGN    vide   autre   part USD
  2022         0     554       0       0   0.0 %
  2023         0     777       0       0   0.0 %
  2024         0    1141       0       0   0.0 %
  2025         0    1587       0       0   0.0 %
  2026       613     589       0       0   51.0 %

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
   2774 USD     131     15    113     3     18  MERISTEM DOLLAR FUND
   2778 USD     127     15    109     3     18  ZEDCREST DOLLAR FUND
   2765 USD     123     15    105     3     18  CARDINALSTONE DOLLAR FUND
   2764 NGN     114     10    101     3     13  AIICO EUROBOND FUND
   2766 USD     118     15    100     3     18  COMERCIO PARTNERS DOLLAR FUND
   2857 NGN     105     10     92     3     13  RMBN DOLLAR FIXED INCOME FUND
   2861 NGN      79     10     66     3     13  ARM SHORT-TERM EUROBOND FUND
   2776 USD      84     15     66     3     18  STL DOLLAR FUND
   2771 USD      80     15     62     3     18  CORONATION DOLLAR FUND
   2768 NGN      71     10     58     3     13  FSL EUROBOND FUND
   2773 USD     111     15     57    39     54  GUARANTY TRUST DOLLAR FUND
   2775 USD      71     15     53     3     18  PARTHIAN DOLLAR FIXED INCOME FUND
  ... et 11 autre(s) fonds

## Total

     5314 VL en base sur la periode du rejeu
      498 seraient REECRITES en dollars (valeur lue dans la source)
     4648 n ont AUCUNE source dollar — a retirer, sinon melange d echelles
      168 absentes du rejeu (hors periode ou fichier manquant) — inchangees

  Part de la serie perdue : 87.5 %

  *** ATTENTION : l option dollar retirerait plus de la moitie de la serie.
      La SEC ne publie de colonne dollar que pour une minorite de semaines.
      A rearbitrer avant toute ecriture.


########## scripts/diag/ondemand/diag_plan_naira.js ##########

=== CORRECTION VERS LE NAIRA — CE QUI SERAIT ECRIT ===
Mesure le 2026-10-28 06:03:51 UTC — LECTURE SEULE

Lignes CSV portant un prix naira explicite : 40867 sur 41626
Fenetre couverte par le rejeu : 2022-01-07 -> 2026-08-14

Ruptures d echelle Nigeria encore en base : 140

## A. Ce que la source permet

     60 rupture(s) avec un prix naira publie
      4 rupture(s) dans la fenetre mais SANS naira publie — rien a ecrire
     76 rupture(s) HORS fenetre du rejeu — non mesurees, pas « sans source »

## B. Et ce que la correction produirait

     27 RESOLUE(S) — la valeur naira retombe dans la serie
     18 NON RESOLUE(S) — la valeur naira reste aberrante, NE PAS ECRIRE
     15 deja conforme(s) — la base porte deja la valeur source
      0 sans voisin sain — aucune reference pour juger, ne pas ecrire

## C. Detail (50 premieres)

  fonds date               en base    naira source      precedente statut               nom
  ----- ---------- --------------- --------------- --------------- -------------------- ---
   2815 2017-12-29        100.0000               -          1.0000 HORS FENETRE DU REJEU ABACUS MONEY MARKET FUND
   2842 2015-12-18       6206.0000               -          0.6447 HORS FENETRE DU REJEU ACAP CANARY GROWTH FUND
   2842 2015-12-23          0.6202               -       6206.0000 HORS FENETRE DU REJEU ACAP CANARY GROWTH FUND
   1141 2022-03-25         92.1946         94.9343      39043.5368 NE RESOUT PAS        AFRINVEST DOLLAR FUND
   1141 2022-04-01      39441.4650         92.1946         92.1946 NE RESOUT PAS        AFRINVEST DOLLAR FUND
   1141 2023-12-15        109.8529        109.8529     104587.4659 DEJA CONFORME        AFRINVEST DOLLAR FUND
   1141 2023-12-22     114459.8322      94709.8974        109.8529 RESOUT               AFRINVEST DOLLAR FUND
   1141 2025-12-12        114.4702        114.5214     165682.9307 DEJA CONFORME        AFRINVEST DOLLAR FUND
   1141 2026-01-02     165297.5204     165297.5204        114.6808 DEJA CONFORME        AFRINVEST DOLLAR FUND
   1142 2014-07-18       1990.0300               -        172.0100 HORS FENETRE DU REJEU AFRINVEST EQUITY FUND
   1142 2014-07-25        170.3400               -       1990.0300 HORS FENETRE DU REJEU AFRINVEST EQUITY FUND
   1146 2014-12-12          1.0000               -        100.0000 HORS FENETRE DU REJEU AIICO MONEY MARKET FUND
   1146 2014-12-19        100.0000               -          1.0000 HORS FENETRE DU REJEU AIICO MONEY MARKET FUND
   2769 2026-05-22          1.0088       1384.7495       1373.3753 RESOUT               ALPHA10 DOLLAR FUND
   2769 2026-06-05       1375.8344       1385.3391          1.0088 DEJA CONFORME        ALPHA10 DOLLAR FUND
   2769 2026-06-11          1.0100       1375.8344       1375.8344 NE RESOUT PAS        ALPHA10 DOLLAR FUND
   2841 2011-09-30      21487.0000               -        219.6500 HORS FENETRE DU REJEU ARM DISCOVERY FUND
   2841 2011-10-07        216.7807               -      21487.0000 HORS FENETRE DU REJEU ARM DISCOVERY FUND
   2841 2014-10-24    3242792.0000               -        320.1792 HORS FENETRE DU REJEU ARM DISCOVERY FUND
   2841 2014-10-31        317.5450               -    3242792.0000 HORS FENETRE DU REJEU ARM DISCOVERY FUND
   1153 2013-04-19        523.4007               -         23.3802 HORS FENETRE DU REJEU ARM ETHICAL FUND
   1153 2013-04-26         23.3905               -        523.4007 HORS FENETRE DU REJEU ARM ETHICAL FUND
   1156 2014-07-25        339.7568               -          1.0000 HORS FENETRE DU REJEU ARM MONEY MARKET FUND
   1156 2014-08-01          1.0000               -        339.7568 HORS FENETRE DU REJEU ARM MONEY MARKET FUND
   1156 2014-12-12        100.0000               -          1.0000 HORS FENETRE DU REJEU ARM MONEY MARKET FUND
   1156 2014-12-19          1.0000               -        100.0000 HORS FENETRE DU REJEU ARM MONEY MARKET FUND
   1158 2021-11-05        107.1500               -      49755.0000 HORS FENETRE DU REJEU AVA GAM FIXED INCOME DOLLAR 
   1158 2021-11-12      49931.7000               -        107.1500 HORS FENETRE DU REJEU AVA GAM FIXED INCOME DOLLAR 
   2765 2026-07-24          1.3055       1801.8311       1799.0246 RESOUT               CARDINALSTONE DOLLAR FUND
   2770 2026-07-24        106.0800     146409.9930     146170.7496 RESOUT               CFG AM FIXED INCOME DOLLAR F
   1209 2017-04-07        100.0000               -          2.2600 HORS FENETRE DU REJEU CHAPEL HILL DENHAM MONEY MAR
   2766 2026-05-29          1.1110       1528.1338       1517.6804 RESOUT               COMERCIO PARTNERS DOLLAR FUN
   2766 2026-06-19       1519.4241       1515.2096          1.1110 DEJA CONFORME        COMERCIO PARTNERS DOLLAR FUN
   2766 2026-06-26          1.1200       1534.9103       1519.4241 NE RESOUT PAS        COMERCIO PARTNERS DOLLAR FUN
   2766 2026-07-03       1489.3970       1546.6448          1.1200 RESOUT               COMERCIO PARTNERS DOLLAR FUN
   2766 2026-07-24          1.1000       1518.2032       1517.5821 RESOUT               COMERCIO PARTNERS DOLLAR FUN
   1179 2021-12-03         10.0000               -        100.0000 HORS FENETRE DU REJEU CORDROS MONEY MARKET FUND
   1179 2021-12-10        100.0000               -         10.0000 HORS FENETRE DU REJEU CORDROS MONEY MARKET FUND
   2771 2026-07-24          1.0297       1421.1762       1419.3532 RESOUT               CORONATION DOLLAR FUND
   1196 2025-12-05       1668.4600       1657.4200     169387.5400 DEJA CONFORME        EMERGING AFRICA EUROBOND FUN
   1196 2026-05-15     156778.4400     155683.3181       1664.5438 DEJA CONFORME        EMERGING AFRICA EUROBOND FUN
   2878 2026-05-15          1.5200       2069.3204       2089.9135 RESOUT               FCMBAM USD Bond Fund
   2878 2026-07-10       2124.6150       2096.3913          1.5300 NE RESOUT PAS        FCMBAM USD Bond Fund
   2878 2026-07-17          1.5400       2124.6150       2124.6150 NE RESOUT PAS        FCMBAM USD Bond Fund
   2879 2026-07-24        112.5000     155441.2500     154603.3704 RESOUT               First Asset Blended Dollar F
   2876 2026-07-24        133.2300     184083.8910     182418.8100 RESOUT               First Asset Dollar Fund (Ret
   2877 2026-07-24        130.0700     179717.7190     178098.3645 RESOUT               First Asset Specialized Doll
   1212 2026-01-16        267.4600        274.1700         26.5700 NE RESOUT PAS        FRONTIER FUND
   2796 2026-05-22       1387.6754       1384.2100        138.2100 DEJA CONFORME        FSDH HALAL FUND
   2768 2026-05-15          1.0000       1361.3950       1374.9431 RESOUT               FSL EUROBOND FUND
  ... et 90 autre(s)

## D. Ruptures que le naira source NE resout pas

  [1141] 2022-03-25  base 92.1946 -> source 94.9343  mais voisins a 39043.5368 (ecart x411.3)  AFRINVEST DOLLAR FUND
  [1141] 2022-04-01  base 39441.4650 -> source 92.1946  mais voisins a 92.1946 (ecart x473.1)  AFRINVEST DOLLAR FUND
  [2769] 2026-06-11  base 1.0100 -> source 1375.8344  mais voisins a 1375.8344 (ecart x1362.2)  ALPHA10 DOLLAR FUND
  [2766] 2026-06-26  base 1.1200 -> source 1534.9103  mais voisins a 1519.4241 (ecart x1381.6)  COMERCIO PARTNERS DOLLAR F
  [2878] 2026-07-10  base 2124.6150 -> source 2096.3913  mais voisins a 1.5300 (ecart x1370.2)  FCMBAM USD Bond Fund
  [2878] 2026-07-17  base 1.5400 -> source 2124.6150  mais voisins a 2124.6150 (ecart x1379.6)  FCMBAM USD Bond Fund
  [1212] 2026-01-16  base 267.4600 -> source 274.1700  mais voisins a 26.5700 (ecart x10.3)  FRONTIER FUND
  [2772] 2026-06-05  base 1.0800 -> source 1483.1149  mais voisins a 1483.1149 (ecart x1373.3)  GREENWICH FIXED INCOME DOL
  [2772] 2026-07-03  base 1.0700 -> source 1477.5982  mais voisins a 1477.5982 (ecart x1380.9)  GREENWICH FIXED INCOME DOL
  [2779] 2025-04-11  base 111.0368 -> source 1.1100  mais voisins a 1.1100 (ecart x100.5)  HOUSING SOLUTION FUND
  [2856] 2026-06-11  base 1.1600 -> source 1580.1663  mais voisins a 1580.1663 (ecart x1362.2)  LEAD DOLLAR FIXED INCOME F
  [1168] 2022-04-01  base 427.1666 -> source 1.0259  mais voisins a 1.0259 (ecart x416.7)  NIGERIA DOLLAR INCOME FUND
  [1239] 2026-05-29  base 1.2700 -> source 1747.0755  mais voisins a 1747.0755 (ecart x1375.7)  NOVA DOLLAR FIXED INCOME F
  [1239] 2026-06-19  base 1863.8120 -> source 1729.8035  mais voisins a 1.2700 (ecart x1362.0)  NOVA DOLLAR FIXED INCOME F
  [1239] 2026-06-26  base 1.3600 -> source 1863.8120  mais voisins a 1863.8120 (ecart x1370.5)  NOVA DOLLAR FIXED INCOME F
  [2777] 2026-07-10  base 1641.7479 -> source 1616.8247  mais voisins a 1.1800 (ecart x1370.2)  VETIVA USD FIXED INCOME FU
  [2777] 2026-07-17  base 1.1900 -> source 1641.7479  mais voisins a 1641.7479 (ecart x1379.6)  VETIVA USD FIXED INCOME FU
  [2778] 2026-06-11  base 2045.7375 -> source 2084.1848  mais voisins a 1.5300 (ecart x1362.2)  ZEDCREST DOLLAR FUND

  Ces lignes relevent d une autre cause. A instruire separement.


########## scripts/diag/ondemand/diag_plateaux_nigeria.js ##########

=== SEGMENTS EN DOLLARS DANS DES SERIES EN NAIRA — NIGERIA ===
Mesure le 2026-10-28 06:03:57 UTC — LECTURE SEULE

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
   2777 USD     78       13         30      25     10  VETIVA USD FIXED INCOME FU
   2878 USD     25       13          1       2      9  FCMBAM USD Bond Fund
   2769 USD     31       12          5       5      9  ALPHA10 DOLLAR FUND
   2773 USD    119       12         45      16     46  GUARANTY TRUST DOLLAR FUND
   2772 USD     61       11         22      18     10  GREENWICH FIXED INCOME DOL
   2768 NGN     71        9         40      20      2  FSL EUROBOND FUND
   2778 USD    135        9         54      62     10  ZEDCREST DOLLAR FUND
   2766 USD    126        8         55      53     10  COMERCIO PARTNERS DOLLAR F
   2856 NGN    131        8         34      87      2  LEAD DOLLAR FIXED INCOME F
   1239 NGN    292        7         78     148     59  NOVA DOLLAR FIXED INCOME F
   2809 USD     27        6          7       5      9  MYRTLE DOLLAR SHIELD FUND
   2765 USD    131        4         71      46     10  CARDINALSTONE DOLLAR FUND
   2770 USD     61        4         31      16     10  CFG AM FIXED INCOME DOLLAR
   2771 USD     88        4         41      33     10  CORONATION DOLLAR FUND
   2774 USD    139        4         71      54     10  MERISTEM DOLLAR FUND
   2775 USD     79        4         51      14     10  PARTHIAN DOLLAR FIXED INCO
   2776 USD     92        4         55      23     10  STL DOLLAR FUND
   2876 USD     23        4          9       3      7  First Asset Dollar Fund (R
   2877 USD     25        4          9       3      9  First Asset Specialized Do
   2879 USD     25        4          9       3      9  First Asset Blended Dollar
   2880 USD     24        4          9       2      9  ValuAlliance Specialized D
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


########## scripts/diag/ondemand/diag_rang_decale_diversifie_maroc.js ##########
=== QUEL FONDS EST DECALE, ET POURQUOI ? ===
Categorie : DIVERSIFIE MAROC
Mesure le 2026-10-28 06:04:02 UTC — LECTURE SEULE

## Fonds compares : 143 | decales : 0
  Aucun decalage : les rangs stockes correspondent exactement a l ordre de la production sur cette categorie.

########## scripts/diag/ondemand/diag_rang_doublon_ou_trou.js ##########
=== DOUBLON OU TROU DANS LES RANGS STOCKES ? ===
Categorie : DIVERSIFIE MAROC
Mesure le 2026-10-28 06:04:02 UTC — LECTURE SEULE

## 1. La suite des rangs stockes
  143 lignes | 143 rangs distincts | rang max 143
  doublons : 0 — aucun
  trous    : 0 — aucun
  → la suite est une permutation propre de 1..N : l explication est ailleurs.

## 2. Autour du rang 80
  rang  78 | en base : [705] IRGAM DISTRIEQUILIBRE              | attendu : [705] IRGAM DISTRIEQUILIBRE
  rang  79 | en base : [909] CIH EPARGNE                        | attendu : [909] CIH EPARGNE
  rang  80 | en base : [1071] ATTIJARI FINANCES CORP            | attendu : [1071] ATTIJARI FINANCES CORP
  rang  81 | en base : [932] CFG DIVERSIFIE                     | attendu : [932] CFG DIVERSIFIE
  rang  82 | en base : [594] WG DYNAMIC                         | attendu : [594] WG DYNAMIC

## 3. Denominateurs
  fonds de la categorie cote performances : 143
  dont ytd nul ou '-' (ecartes par rankFundInList) : 0
  fonds classables selon la production : 143
  totaux stockes : 143 (x143)
  → aucun fonds ecarte : le denominateur n est pas la cause.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_rangs_permutation_invalide.js ##########
=== LES CLASSEMENTS STOCKES SONT-ILS DES PERMUTATIONS DE 1..N ? ===
Mesure le 2026-10-28 06:04:03 UTC — LECTURE SEULE

## classementfonds
  3648 lignes | categorie lue dans `categorie_nationale` (rempli 3648/3648) | type_classement present
  (cles externes essayees aussi, depuis fond_investissements : categorie_id, categorie_libelle, categorie_globale, categorie_national, categorie_regional, categorie_fundafrica_locale, categorie_fundafrica_regionale, categorie_fundafrica_globale)
  Cles de regroupement essayees — la bonne est celle qui rend une permutation propre :
    categorie_nationale                      22 groupes |    0 hors permutation |    0 doublon(s) |    0 trou(s)   ← PROPRE
    categorie                                11 groupes |    8 hors permutation |  463 doublon(s) |   74 trou(s)
    categorie_regionale                      19 groupes |   14 hors permutation |  235 doublon(s) |  154 trou(s)
    categorie_nationale + categorie + categorie_regionale   26 groupes |   16 hors permutation |    0 doublon(s) |  128 trou(s)
    JOIN fond_investissements.categorie_id    0 groupes |    0 hors permutation |    0 doublon(s) |    0 trou(s)
    JOIN fond_investissements.categorie_libelle   11 groupes |    8 hors permutation |  463 doublon(s) |   74 trou(s)
    JOIN fond_investissements.categorie_globale    9 groupes |    6 hors permutation |  508 doublon(s) |   32 trou(s)
    JOIN fond_investissements.categorie_national   22 groupes |    0 hors permutation |    0 doublon(s) |    0 trou(s)   ← PROPRE
    JOIN fond_investissements.categorie_regional   19 groupes |   14 hors permutation |  235 doublon(s) |  154 trou(s)
    JOIN fond_investissements.categorie_fundafrica_locale   15 groupes |   13 hors permutation |   96 doublon(s) |  114 trou(s)
    JOIN fond_investissements.categorie_fundafrica_regionale    8 groupes |    8 hors permutation |  357 doublon(s) |   89 trou(s)
    JOIN fond_investissements.categorie_fundafrica_globale    4 groupes |    4 hors permutation |  561 doublon(s) |   33 trou(s)
  Cle retenue pour le verdict : categorie_nationale — numerotation propre sous cette cle.
  22 categories d au moins 5 fonds | 0 dont la numerotation n est PAS une permutation de 1..N | 0 rang(s) double(s) au total
  → toutes les numerotations sont propres sur les 22 categories JUGEES.

## classementfonds_eurs
  2880 lignes | categorie lue dans `categorie_regionale` (rempli 2858/2880) | type_classement present
  colonne(s) de categorie presente(s) mais JAMAIS renseignee(s) : categorie_nationale — a signaler, pas a contourner en silence
  (cles externes essayees aussi, depuis fond_investissements : categorie_id, categorie_libelle, categorie_globale, categorie_national, categorie_regional, categorie_fundafrica_locale, categorie_fundafrica_regionale, categorie_fundafrica_globale)
  Cles de regroupement essayees — la bonne est celle qui rend une permutation propre :
    categorie                                11 groupes |    8 hors permutation |  461 doublon(s) |   73 trou(s)
    categorie_regionale                      19 groupes |   14 hors permutation |  233 doublon(s) |  101 trou(s)
    categorie + categorie_regionale          19 groupes |   14 hors permutation |  201 doublon(s) |   87 trou(s)
    JOIN fond_investissements.categorie_id    0 groupes |    0 hors permutation |    0 doublon(s) |    0 trou(s)
    JOIN fond_investissements.categorie_libelle   11 groupes |    8 hors permutation |  461 doublon(s) |   73 trou(s)
    JOIN fond_investissements.categorie_globale    9 groupes |    6 hors permutation |  506 doublon(s) |   31 trou(s)
    JOIN fond_investissements.categorie_national   22 groupes |    0 hors permutation |    0 doublon(s) |    0 trou(s)   ← PROPRE
    JOIN fond_investissements.categorie_regional   19 groupes |   14 hors permutation |  233 doublon(s) |  101 trou(s)
    JOIN fond_investissements.categorie_fundafrica_locale   15 groupes |   12 hors permutation |   92 doublon(s) |   66 trou(s)
    JOIN fond_investissements.categorie_fundafrica_regionale    8 groupes |    8 hors permutation |  356 doublon(s) |   46 trou(s)
    JOIN fond_investissements.categorie_fundafrica_globale    4 groupes |    4 hors permutation |  558 doublon(s) |    7 trou(s)
  Cle retenue pour le verdict : JOIN fond_investissements.categorie_national — numerotation propre sous cette cle.
  22 categories d au moins 5 fonds | 0 dont la numerotation n est PAS une permutation de 1..N | 0 rang(s) double(s) au total
  → toutes les numerotations sont propres sur les 22 categories JUGEES.

## classementfonds_usds
  2890 lignes | categorie lue dans `categorie_regionale` (rempli 2868/2890) | type_classement present
  colonne(s) de categorie presente(s) mais JAMAIS renseignee(s) : categorie_nationale — a signaler, pas a contourner en silence
  (cles externes essayees aussi, depuis fond_investissements : categorie_id, categorie_libelle, categorie_globale, categorie_national, categorie_regional, categorie_fundafrica_locale, categorie_fundafrica_regionale, categorie_fundafrica_globale)
  Cles de regroupement essayees — la bonne est celle qui rend une permutation propre :
    categorie                                11 groupes |    8 hors permutation |  461 doublon(s) |   85 trou(s)
    categorie_regionale                      19 groupes |   14 hors permutation |  233 doublon(s) |   99 trou(s)
    categorie + categorie_regionale          19 groupes |   14 hors permutation |  201 doublon(s) |  102 trou(s)
    JOIN fond_investissements.categorie_id    0 groupes |    0 hors permutation |    0 doublon(s) |    0 trou(s)
    JOIN fond_investissements.categorie_libelle   11 groupes |    8 hors permutation |  461 doublon(s) |   85 trou(s)
    JOIN fond_investissements.categorie_globale    9 groupes |    6 hors permutation |  506 doublon(s) |   31 trou(s)
    JOIN fond_investissements.categorie_national   22 groupes |    0 hors permutation |    0 doublon(s) |    0 trou(s)   ← PROPRE
    JOIN fond_investissements.categorie_regional   19 groupes |   14 hors permutation |  233 doublon(s) |   99 trou(s)
    JOIN fond_investissements.categorie_fundafrica_locale   15 groupes |   12 hors permutation |   92 doublon(s) |   67 trou(s)
    JOIN fond_investissements.categorie_fundafrica_regionale    8 groupes |    8 hors permutation |  356 doublon(s) |   47 trou(s)
    JOIN fond_investissements.categorie_fundafrica_globale    4 groupes |    4 hors permutation |  558 doublon(s) |    7 trou(s)
  Cle retenue pour le verdict : JOIN fond_investissements.categorie_national — numerotation propre sous cette cle.
  22 categories d au moins 5 fonds | 0 dont la numerotation n est PAS une permutation de 1..N | 0 rang(s) double(s) au total
  → toutes les numerotations sont propres sur les 22 categories JUGEES.

## Mecanisme (i) — valeurs ytd qui passent le filtre et donnent NaN
  performences         0 valeur(s) non numerique(s)
  performences_eurs    0 valeur(s) non numerique(s)
  performences_usds    0 valeur(s) non numerique(s)
  → si ce compte est nul partout, le mecanisme (i) est ecarte et il reste
    (ii) : un instantane incoherent entre les ~1 245 appels de la route.

## Categorie temoin — les deux fonds du rang double
  [594] ytd = "-6.3295157896060275" | Number() = -6.3295157896060275 | numerique : OUI
  [828] ytd = "-7.268992930605483" | Number() = -7.268992930605483 | numerique : OUI
  → deux ytd numeriques et differents ne peuvent pas donner le meme rang
    dans un seul appel : la cause est dans le fait qu il y a 1 245 appels.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_rattrapage_masi_dryrun.js ##########
=== RATTRAPAGE MASI — CE QU IL COUVRIRAIT, SANS RIEN ECRIRE ===
Mesure le 2026-10-28 06:04:05 UTC — LECTURE SEULE

## A. Ce que la source publie, en UNE requete

  42 seances, du 2026-07-31 au 2026-10-06
  colonnes confirmees : 31/41 paires « ouverture J = cloture J-1 »

## B. Croisement avec indice_references

  deja en base sur la periode : 23
  seances a inserer           : 34

## C. Coherence de la serie

  jonction 2026-07-31 : base 17843.7021 / FT 17843.7 → ecart -0.00
  jonction 2026-09-28 : base 17648.9 / FT 17648.9 → ecart 0.00
  jonction 2026-09-29 : base 17754.91 / FT 17754.91 → ecart 0.00
  jonction 2026-09-30 : base 17733.06 / FT 17733.06 → ecart 0.00
  jonction 2026-10-01 : base 17579.17 / FT 17579.17 → ecart 0.00
  jonction 2026-10-02 : base 17303.69 / FT 17303.69 → ecart 0.00
  jonction 2026-10-05 : base 17159.5 / FT 17159.5 → ecart 0.00
  jonction 2026-10-06 : base 16892.55 / FT 16892.55 → ecart 0.00
  plus grande variation entre deux seances : 2.27 % (2026-09-18 → 2026-09-21)
  Aucune rupture d echelle.

## D. Les dix premieres dates qui seraient ecrites

    2026-08-03  17876.25
    2026-08-04  18063.39
    2026-08-05  18329.91
    2026-08-06  18479.44
    2026-08-07  18864.02
    2026-08-10  18832.18
    2026-08-11  18703.79
    2026-08-12  18825.54
    2026-08-13  18819.08
    2026-08-17  18834.22
    … et 24 autre(s)

  Commande correspondante, A NE LANCER QU APRES ACCORD :
    node scripts/scraper/scrape_indices_daily.js --execute --backfill-days 67 --skip-indref
  puis, separement et en dry-run d abord :
    node scripts/scraper/propagate_indref_range.js --since 2026-08-06 --indice MASI

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_recalc_prepared_stmt_pressure.js ##########

=== PREPARED STATEMENT PRESSURE — READ ONLY ===
Mesure: 2026-10-28T06:04:06.037Z
STEP3_RECALC_EUR_USD funds=1256 vl_rows=1007675 dynamic_update_statements=2625 batch_size=500
STEP4_RECALC_VL_AJUSTE funds=1257 vl_rows=1008279 dynamic_update_statements=5771 batch_size=200
COMBINED_DYNAMIC_UPDATE_STATEMENTS=8396
MYSQL_MAX_PREPARED_STMT_COUNT=16382
MYSQL_PERFORMANCE_SCHEMA=OFF
MYSQL_PREPARED_STMT_COUNT_NOW=0
MYSQL_COM_STMT_PREPARE_SINCE_RESTART=15952
MYSQL_COM_STMT_EXECUTE_SINCE_RESTART=1388709
MYSQL_COM_STMT_CLOSE_SINCE_RESTART=10
MYSQL_MEMORY_USED_NOW=481621896
MYSQL_UPTIME=3109151
PREPARE_MINUS_THEORETICAL_DYNAMIC=7556
NOTE=Step3 count is an upper geometry bound before currency/rate skips; current daily log reported 1249 funds and 994766 VL actually processed. Step4 geometry is exact for active-fund row batches. Com_stmt_prepare is server-global and cumulative, so numerical proximity is evidence for correlation, not causal identity.
MUTATION=NONE

########## scripts/diag/ondemand/diag_recalc_sql_protocol_contract.js ##########

=== RECALC SQL PROTOCOL CONTRACT — READ ONLY ===
STEP3_RECALC_EUR_USD protocol=QUERY_TEXT parameterized_select_execute_preserved=YES
STEP4_RECALC_VL_AJUSTE protocol=QUERY_TEXT parameterized_select_execute_preserved=YES
MUTATION=NONE
CONTRACT=GREEN

########## scripts/diag/ondemand/diag_ruptures_restantes.js ##########

=== RUPTURES D ECHELLE RESTANTES — toutes dates confondues ===
Mesure le 2026-10-28 06:04:14 UTC — LECTURE SEULE
Critere : saut d un facteur >= 10 par rapport a la VL precedente du meme fonds

TOTAL : 156 ligne(s) sur 70 fonds

## Repartition par pays et lot d insertion

     86 ligne(s)   NIGERIA | insere le Sun Aug 02
      9 ligne(s)   NIGERIA | insere le Sun May 17
      9 ligne(s)   NIGERIA | insere le Thu Jun 04
      8 ligne(s)   NIGERIA | insere le Mon Aug 31
      6 ligne(s)   NIGERIA | insere le Mon Jun 22
      5 ligne(s)   Nigeria | insere le Mon Aug 31
      4 ligne(s)   NIGERIA | insere le Mon Jun 08
      3 ligne(s)   MAROC | insere le Tue Oct 20
      3 ligne(s)   MAROC | insere le Mon Oct 26
      3 ligne(s)   MAROC | insere le Tue Oct 27
      3 ligne(s)   NIGERIA | insere le Mon Jul 06
      3 ligne(s)   NIGERIA | insere le Mon Jul 13
      2 ligne(s)   NIGERIA | insere le Mon Jun 29
      2 ligne(s)   NIGERIA | insere le Mon Jul 27
      2 ligne(s)   TUNISIE | insere le Fri May 22
      2 ligne(s)   UEMOA | insere le Fri Jun 12
      1 ligne(s)   MAROC | insere le Thu Apr 30
      1 ligne(s)   NIGERIA | insere le Mon Oct 05
      1 ligne(s)   Nigeria | insere le Thu Jun 04
      1 ligne(s)   Nigeria | insere le Mon Jul 27
      1 ligne(s)   TUNISIE | insere le Thu Apr 30
      1 ligne(s)   UEMOA | insere le Thu Apr 30

## Detail (60 premieres)

  fonds dev  date               valeur     precedente   fact. insere     devise src  nom
  ----- ---- ---------- -------------- -------------- ------- ---------- ------ ---  ---
    636 MAD  Mon Oct 19       143.0200      4840.8800    33.8 Tue Oct 20 -      non  SICAV MAROC CROISSANCE
    636 MAD  Fri Oct 23      4836.2300       143.0200    33.8 Mon Oct 26 -      non  SICAV MAROC CROISSANCE
    790 MAD  Fri Jun 08         0.4600        11.2700    24.5 Thu Apr 30 -      non  UPLINE BONDS
    834 MAD  Mon Oct 19       128.3800      4313.2500    33.6 Tue Oct 20 -      non  FCP CAM INVESTISSEMENT
    834 MAD  Fri Oct 23      4314.1700       128.3800    33.6 Mon Oct 26 -      non  FCP CAM INVESTISSEMENT
    836 MAD  Mon Oct 19       175.0700      4039.5600    23.1 Tue Oct 20 -      non  FCP CAM DYNAMIQUE
    836 MAD  Fri Oct 23      4041.6000       175.0700    23.1 Mon Oct 26 -      non  FCP CAM DYNAMIQUE
    953 MAD  Mon Oct 26      2328.1000       177.0800    13.1 Tue Oct 27 -      non  CDG SOLIDARITE
    963 MAD  Mon Oct 26      1149.9300    207575.2200   180.5 Tue Oct 27 -      non  CDG OBLIG PLUS
   1113 MAD  Mon Oct 26      3080.3200       148.9300    20.7 Tue Oct 27 -      non  AL BARID ISTITMAR
   1141 NGN  Fri Mar 25        92.1946     39043.5368   423.5 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Apr 01     39441.4650        92.1946   427.8 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 15       109.8529    104587.4659   952.1 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 22    114459.8322       109.8529  1041.9 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Dec 12       114.4702    165682.9307  1447.4 Sun Aug 02 NGN    oui  AFRINVEST DOLLAR FUND
   1141 NGN  Fri Jan 02    165297.5204       114.6808  1441.4 Sun May 17 -      non  AFRINVEST DOLLAR FUND
   1142 NGN  Fri Jul 18      1990.0300       172.0100    11.6 Sun Aug 02 NGN    oui  AFRINVEST EQUITY FUND
   1142 NGN  Fri Jul 25       170.3400      1990.0300    11.7 Sun Aug 02 NGN    oui  AFRINVEST EQUITY FUND
   1146 NGN  Fri Dec 12         1.0000       100.0000     100 Sun Aug 02 NGN    oui  AIICO MONEY MARKET FUND
   1146 NGN  Fri Dec 19       100.0000         1.0000     100 Sun Aug 02 NGN    oui  AIICO MONEY MARKET FUND
   1153 NGN  Fri Apr 19       523.4007        23.3802    22.4 Sun Aug 02 NGN    oui  ARM ETHICAL FUND
   1153 NGN  Fri Apr 26        23.3905       523.4007    22.4 Sun Aug 02 NGN    oui  ARM ETHICAL FUND
   1156 NGN  Fri Jul 25       339.7568         1.0000   339.8 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Aug 01         1.0000       339.7568   339.8 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Dec 12       100.0000         1.0000     100 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1156 NGN  Fri Dec 19         1.0000       100.0000     100 Sun Aug 02 NGN    oui  ARM MONEY MARKET FUND
   1158 NGN  Fri Nov 05       107.1500     49755.0000   464.3 Sun Aug 02 NGN    oui  AVA GAM FIXED INCOME DOLLAR FU
   1158 NGN  Fri Nov 12     49931.7000       107.1500     466 Sun May 17 -      non  AVA GAM FIXED INCOME DOLLAR FU
   1168 NGN  Fri Nov 26       415.7564         1.0100   411.6 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Mar 25         1.0259       425.9998   415.2 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1168 NGN  Fri Apr 01       427.1666         1.0259   416.4 Sun Aug 02 NGN    oui  NIGERIA DOLLAR INCOME FUND
   1169 NGN  Fri Aug 29 1046071210.6800       552.2000 1894370.2 Sun Aug 02 NGN    oui  NIGERIA ENERGY SECTOR FUND
   1169 NGN  Fri Sep 05       552.2000 1046071210.6800 1894370.2 Sun Aug 02 NGN    oui  NIGERIA ENERGY SECTOR FUND
   1171 NGN  Fri Oct 21       988.8300         1.2200   810.5 Sun Aug 02 NGN    oui  SFS FIXED INCOME FUND
   1171 NGN  Fri Oct 28         1.2200       988.8300   810.5 Sun Aug 02 NGN    oui  SFS FIXED INCOME FUND
   1179 NGN  Fri Dec 03        10.0000       100.0000      10 Sun May 17 NGN    oui  CORDROS MONEY MARKET FUND
   1179 NGN  Fri Dec 10       100.0000        10.0000      10 Sun May 17 NGN    oui  CORDROS MONEY MARKET FUND
   1196 NGN  Fri Dec 05      1668.4600    169387.5400   101.5 Sun Aug 02 NGN    oui  EMERGING AFRICA EUROBOND FUND
   1196 NGN  Fri May 15    156778.4400      1664.5438    94.2 Thu Jun 04 NGN    oui  EMERGING AFRICA EUROBOND FUND
   1206 NGN  Thu Dec 31         0.0100         0.9000      90 Sun Aug 02 NGN    oui  LEGACY EQUITY FUND
   1206 NGN  Fri Jan 22         0.8300         0.0100      83 Sun Aug 02 NGN    oui  LEGACY EQUITY FUND
   1207 NGN  Fri Feb 22         1.0000       100.0000     100 Sun Aug 02 NGN    oui  LEGACY MONEY MARKET FUND
   1209 NGN  Fri Apr 07       100.0000         2.2600    44.2 Sun Aug 02 NGN    oui  CHAPEL HILL DENHAM MONEY MARKE
   1212 NGN  Fri Jan 16       267.4600        26.5700    10.1 Sun May 17 NGN    oui  FRONTIER FUND
   1223 NGN  Fri Dec 08         1.0000       100.0000     100 Sun May 17 -      non  GUARANTY TRUST MONEY MARKET FU
   1223 NGN  Fri Jul 05       100.0000         1.0000     100 Sun May 17 -      non  GUARANTY TRUST MONEY MARKET FU
   1239 NGN  Fri May 15         1.2600      1732.7394  1375.2 Thu Jun 04 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1239 NGN  Fri May 22      1747.0755         1.2600  1386.6 Thu Jun 04 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1239 NGN  Fri May 29         1.2700      1747.0755  1375.6 Mon Jun 08 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1239 NGN  Fri Jun 19      1863.8120         1.2700  1467.6 Mon Jun 29 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1239 NGN  Fri Jun 26         1.3600      1863.8120  1370.4 Mon Jul 06 NGN    oui  NOVA DOLLAR FIXED INCOME FUND
   1249 NGN  Fri Aug 19       100.0000      1620.0800    16.2 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Aug 26      1622.4100       100.0000    16.2 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Sep 02       100.0000      1622.4100    16.2 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Sep 09      1627.7000       100.0000    16.3 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Apr 05       100.0000      1786.8800    17.9 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Apr 19      1805.4800       100.0000    18.1 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Mar 14       100.0000      1894.6800    18.9 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Mar 21      1902.8600       100.0000      19 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
   1249 NGN  Fri Apr 11       117.7600      1910.2400    16.2 Sun Aug 02 NGN    oui  NIGERIA INTERNATIONAL DEBT FUN
  ... et 96 autre(s)

## Provenance

  21 ligne(s) SANS provenance — meme signature que les 82 deja retirees
  135 ligne(s) AVEC provenance — a corriger a la source, jamais par suppression aveugle


########## scripts/diag/ondemand/diag_source_masi.js ##########
=== SOURCE MASI — POURQUOI LE SCRAPING ECHOUE ===
Mesure le 2026-10-28 06:04:48 UTC — LECTURE SEULE
URL : https://medias24.com/content/api?method=getMasiHistory&periode=1m&format=json

## A. Client HTTPS de Node — celui que `scrapeMASI` utilise aujourd hui
  statut : 403
  charge : interstitielle Cloudflare — « <!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="Content-Type" content="text/htm »

## B. curl — le contournement deja employe dans ce fichier pour bkam.ma
  statut : 403
  charge : interstitielle Cloudflare — « <!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="Content-Type" content="text/htm »

## C. Verdict
  Ni Node ni curl n obtiennent la charge attendue depuis ce serveur.
  Changer de client ne suffira pas : il faut une autre source MASI
  ou une negociation d acces. Ne pas fabriquer de valeur d indice.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_source_monia.js ##########
=== MONIA — ENJEU REEL ET ACCES A LA SOURCE ===
Mesure le 2026-10-28 06:04:48 UTC — LECTURE SEULE

## A. Qui se refere a MONIA ?

  MAROC      1 fonds (dont 1 actifs)

## B. Combien de VL portent un indRef issu de MONIA ?

  0 VL, du null au null

## C. La source repond-elle depuis ce serveur ?

  page EN (voie principale)
    https://www.bkam.ma/en/Markets/Key-indicators/Money-market/Monia-index-moroccan-overnight-index-average
    HTTP 403 | 919 o | ip 3.160.39.72
    page de blocage : OUI

  page FR (voie secondaire)
    https://www.bkam.ma/Marche-monetaire/Taux-du-marche-interbancaire-MONIA
    HTTP 403 | 919 o | ip 3.160.39.38
    page de blocage : OUI

  racine bkam.ma
    https://www.bkam.ma/
    HTTP 403 | 919 o | ip 3.160.39.72
    page de blocage : OUI

## D. Conclusion a tirer, et celle a ne pas tirer

  Si la racine et les deux pages rendent un blocage, le probleme est
  l adresse de ce serveur, pas le code : aucun en-tete ne le resoudra,
  et il faudra une autre source ou un accord d acces. Ne jamais
  reconstituer un taux a partir d une variation affichee.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_sources_masi_alternatives.js ##########
=== SOURCES MASI ALTERNATIVES — CE QUI REPOND DEPUIS S2 ===
Mesure le 2026-10-28 06:04:52 UTC — LECTURE SEULE

## African Markets — page indices
  https://www.african-markets.com/en/stock-markets/bvc/indices
  reponse : HTTP 404 | text/html | 2870 o | ip 104.21.42.129
      → interstitielle Cloudflare : inutilisable par script

## African Markets — donnees de marche
  https://www.african-markets.com/en/stock-markets/bvc/market-data
  reponse : HTTP 404 | text/html | 2870 o | ip 172.67.205.222
      → interstitielle Cloudflare : inutilisable par script

## FT — historique MASI:CAS
  https://markets.ft.com/data/indices/tearsheet/historical?s=MASI:CAS
  reponse : HTTP 200 | text/html | 80500 o | ip 209.234.238.17
      → candidats « MASI + nombre > 1000 » : 17,020.28 (→ 17020.28)
      → serie datee : aucune date reperable — source inutilisable telle quelle
      → ce que la page dit autour du mot MASI :
          « ALL SHARES INDEX, MASI:CAS Historical Prices - FT.com Subscribe Sign In Menu Search Financial Times myFT if you don't need to support both core and enhanced --> Search »
          « Indices ALL SHARES INDEX + Add to watchlist + Add an alert MASI:CAS ALL SHARES INDEX Actions Add to watchlist Add an alert Price (MAD) 17,020.28 Today's Change 20.73 / 0.12% Shares traded -- 1 Year change -12. »

## WSJ — historique MASI
  https://www.wsj.com/market-data/quotes/index/MA/MASI/historical-prices
  reponse : HTTP 401 | text/html | 767 o | ip 13.225.245.25
      → candidats « MASI + nombre > 1000 » : aucun
      → serie datee : aucune date reperable — source inutilisable telle quelle

## Stooq — symbole marocain alternatif
  https://stooq.com/q/d/l/?s=%5Emasi&i=d
  reponse : HTTP 200 | text/html | 796 o | ip 159.69.202.225
      → candidats « MASI + nombre > 1000 » : aucun
      → serie datee : aucune date reperable — source inutilisable telle quelle

## Yahoo — nouvelle tentative MASI.CS
  https://query2.finance.yahoo.com/v8/finance/chart/MASI.CS?range=3mo&interval=1d
  reponse : HTTP 429 | text/html | 23 o | ip 87.248.119.251
      → candidats « MASI + nombre > 1000 » : aucun
      → serie datee : aucune date reperable — source inutilisable telle quelle

Rappel : la source retenue devra etre autoritative et fournir une
SERIE datee, pas un cours instantane — `propagateIndRef` apparie une
date de VL a une date d indice a +/- 7 jours.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_test_masi_ft_dryrun.js ##########

########## 2026-10-02 — seance ouvree — cloture connue : 17 303,69
Mode: DRY-RUN
  [MASI] MASI...
    [MASI] medias24 : ERROR HTTP 403 for https://medias24.com/content/api?method=getMasiHistory&periode=3m&format=json
    [MASI] FT : identifiant interne 601207 (mis en cache pour cette execution)
    [MASI] FT : colonnes confirmees — OHLC 9/9, enchainement 7/8
    [MASI] SUCCESS via FT markets MASI:CAS (cloture Oct 02, 2026): 17303.69
    [MONIA] ERROR curl failed: Command failed: curl -s -f -L --compressed --max-time 30 -H User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 AfricafundsBot/1.0 -H Accept-Language: fr-FR,fr;q=0.9,en;q=0.8 -H Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8 -H Sec-Fetch-Dest: document -H Sec-Fetch-Mode: navigate -H Sec-Fetch-Site: same-origin -H Referer: https://www.bkam.ma/en/Markets/Key-indicators/Money-market/Monia-index-moroccan-overnight-index-average https://www.bkam.ma/en/export/blockcsv/566622/30551c1667f5f2004fb0019220d41795/06f7b466ca91da0596a810776852ee51?block=06f7b466ca91da0596a810776852ee51
  Resume scraping: 4 indices recuperes, 1 echecs
--- PHASE 2: Insertion dans indice_references ---
  [MASI] SKIP: valeur identique deja en base (17303.69)
  Resume insertion: 0 inseres, 4 ignores (deja existants)
RESUME 2026-10-02
  MASI: 17303.69 (via FT markets MASI:CAS (cloture))
  >>> MODE DRY-RUN: aucune modification effectuee <<<
-- code de sortie : 0

########## 2026-09-30 — seance ouvree — cloture attendue : 17 733,06
Mode: DRY-RUN
  [MASI] MASI...
    [MASI] medias24 : ERROR HTTP 403 for https://medias24.com/content/api?method=getMasiHistory&periode=3m&format=json
    [MASI] FT : identifiant interne 601207 (mis en cache pour cette execution)
    [MASI] FT : colonnes confirmees — OHLC 9/9, enchainement 7/8
    [MASI] SUCCESS via FT markets MASI:CAS (cloture Sep 30, 2026): 17733.06
    [MONIA] ERROR curl failed: Command failed: curl -s -f -L --compressed --max-time 30 -H User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 AfricafundsBot/1.0 -H Accept-Language: fr-FR,fr;q=0.9,en;q=0.8 -H Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8 -H Sec-Fetch-Dest: document -H Sec-Fetch-Mode: navigate -H Sec-Fetch-Site: same-origin -H Referer: https://www.bkam.ma/en/Markets/Key-indicators/Money-market/Monia-index-moroccan-overnight-index-average https://www.bkam.ma/en/export/blockcsv/566622/30551c1667f5f2004fb0019220d41795/06f7b466ca91da0596a810776852ee51?block=06f7b466ca91da0596a810776852ee51
  Resume scraping: 4 indices recuperes, 1 echecs
--- PHASE 2: Insertion dans indice_references ---
  [MASI] SKIP: valeur identique deja en base (17733.06)
  Resume insertion: 0 inseres, 4 ignores (deja existants)
RESUME 2026-09-30
  MASI: 17733.06 (via FT markets MASI:CAS (cloture))
  >>> MODE DRY-RUN: aucune modification effectuee <<<
-- code de sortie : 0

########## 2026-10-04 — dimanche — doit etre refuse, pas rempli par la veille
Mode: DRY-RUN
  [MASI] MASI...
    [MASI] medias24 : ERROR HTTP 403 for https://medias24.com/content/api?method=getMasiHistory&periode=1m&format=json
    [MASI] FT : identifiant interne 601207 (mis en cache pour cette execution)
    [MASI] FT : colonnes confirmees — OHLC 8/8, enchainement 7/7
    [MASI] FT : pas de seance au 2026-10-04 (jour non ouvre ?)
    [MASI] ECHEC: aucune source n'a retourne de valeur
    [MONIA] ERROR curl failed: Command failed: curl -s -f -L --compressed --max-time 30 -H User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 AfricafundsBot/1.0 -H Accept-Language: fr-FR,fr;q=0.9,en;q=0.8 -H Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8 -H Sec-Fetch-Dest: document -H Sec-Fetch-Mode: navigate -H Sec-Fetch-Site: same-origin -H Referer: https://www.bkam.ma/en/Markets/Key-indicators/Money-market/Monia-index-moroccan-overnight-index-average https://www.bkam.ma/en/export/blockcsv/566622/30551c1667f5f2004fb0019220d41795/06f7b466ca91da0596a810776852ee51?block=06f7b466ca91da0596a810776852ee51
  Resume scraping: 0 indices recuperes, 5 echecs
-- code de sortie : 1

=== FIN — dry-run uniquement, aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_vl_detachees_rattachables.js ##########
=== LES VL DETACHEES SONT-ELLES RECUPERABLES ? ===
Mesure le 2026-10-28 06:05:21 UTC — LECTURE SEULE

## A. CELLES QUI PORTENT UN `fund_id` VERS UN FONDS DISPARU
  21698 ligne(s), reparties sur 17 identifiant(s) de fonds disparus.

  Les 10 identifiants les plus charges :
   fund_id      VL  periode
      1425    1548  2011-05-25 → 2018-02-20
      1429    1548  2011-05-25 → 2018-02-20
      1430    1548  2011-05-25 → 2018-02-20
      1419    1548  2011-05-25 → 2018-02-20
      1421    1548  2011-05-25 → 2018-02-20
      1438    1548  2011-05-25 → 2018-02-20
      1422    1548  2011-05-25 → 2018-02-20
      1439    1548  2011-05-25 → 2018-02-20
      1423    1548  2011-05-25 → 2018-02-20
      1424    1548  2011-05-25 → 2018-02-20

  CES IDENTIFIANTS LAISSENT-ILS UNE TRACE NOMMEE AILLEURS ?
  performences             0 identifiant(s) retrouve(s) | nom disponible dans `fond`
  classementfonds          0 identifiant(s) retrouve(s) | nom disponible dans `fond`
  performences_eurs        0 identifiant(s) retrouve(s) | nom disponible dans `fond`

  → aucune trace nommee ailleurs : ces identifiants ne renvoient a rien.
    (A) ARCHIVABLES au mieux.


## B. CELLES A `fund_id IS NULL`
  18087 ligne(s).

  Ce que porte CHAQUE colonne texte de ces lignes :
  fund_name                    0 remplie(s)  vide
  code_ISIN                18015 remplie(s)  14 valeur(s) distincte(s) — trop peu pour identifier un fonds
  libelle_fond                 0 remplie(s)  vide
  classification               0 remplie(s)  vide
  souscription                 0 remplie(s)  vide
  nbre_part                    0 remplie(s)  vide
  rachat                       0 remplie(s)  vide
  actif_net                    0 remplie(s)  vide
  ID_indice                    0 remplie(s)  vide
  indice_name                  0 remplie(s)  vide
  price_type                   0 remplie(s)  vide
  currency_code                0 remplie(s)  vide
  sec_document_id              0 remplie(s)  vide
  source_url                   0 remplie(s)  vide
  data_quality                 0 remplie(s)  vide
  correction_batch             0 remplie(s)  vide

  → (A) ARCHIVABLES. Aucune colonne ne porte assez d information pour
    identifier un fonds. La piste `code_ISIN` est morte : 14 valeurs
    distinctes, et ce sont des dates Excel abimees — « févr-03 », « mai-14 ».
    Signature d un import tableur aux colonnes DESALIGNEES : la date s est
    ecrite dans la colonne ISIN, et le fonds s est perdu dans le meme
    decalage. Ces VL sont des donnees reelles d origine irrecuperable.

## CE QUE COUTE L INACTION
  Aucun chiffre affiche a l utilisateur n est faux : toute requete joignant
  `fond_investissements` exclut ces lignes.
  Mais tout COUNT(*) brut les inclut. La table annonce 1053006 VL ;
  39785 ne se rattachent a rien, soit 3.78 %.
  Tout document du projet citant une volumetrie les compte sans le dire —
  y compris `PRODUCTION_STATE.json` et `ROADMAP.md`.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_vl_sans_fonds.js ##########
=== VALORISATIONS RATTACHEES A AUCUN FONDS ===
Mesure le 2026-10-28 06:05:24 UTC — LECTURE SEULE

## 1. COMBIEN, ET DE QUELLE FORME ?
  total valorisations          : 1053006
  fund_id IS NULL              : 18087 (1.72 %)
  fund_id vers un fonds absent : 21698
  Les deux formes sont distinctes : la premiere n a jamais eu de fonds,
  la seconde en a perdu un. Elles ne se reparent pas de la meme facon.

## 2. INCIDENT DATE, OU FUITE CONTINUE ?
  de 2012-11-19 a 2024-07-12 | 1962 date(s) distincte(s)
  annee   lignes
  2012         30
  2013         42
  2016         28
  2017       2012
  2018       2058
  2019       2240
  2020       2228
  2021       2338
  2022       2534
  2023       2878
  2024       1699
  → etalees sur 11 annees : ce n est pas un incident, c est un chemin
    d ecriture qui a laisse passer des lignes sans fonds pendant des annees.

## 3. DONNEES PERDUES, OU RESIDU VIDE ?
  avec une valeur non nulle : 18087
  sans valeur               : 0
  plage des valeurs         : 1.038 → 10981.672
  portant un indRef         : 0
  → DONNEES REELLES. Ce ne sont pas des lignes vides : des VL existent,
    detachees de tout fonds. Peut-etre rattachables, peut-etre perdues.

## 4. UNE COLONNE GARDE-T-ELLE LA TRACE DU FONDS D ORIGINE ?
  fund_name                    0 remplie(s), 0 valeur(s) distincte(s)
  code_ISIN                18015 remplie(s), 14 valeur(s) distincte(s)
                         exemples : févr-03 | févr-07 | mai-14 | juin-14 | juil-14
  libelle_fond                 0 remplie(s), 0 valeur(s) distincte(s)
  currency_code                0 remplie(s), 0 valeur(s) distincte(s)
  source_url                   0 remplie(s), 0 valeur(s) distincte(s)
  correction_batch             0 remplie(s), 0 valeur(s) distincte(s)

## 5. FAUSSENT-ELLES UN CHIFFRE AFFICHE ?
  Toute requete joignant `fond_investissements` les exclut d office :
  elles sont donc absentes des fiches, performances et classements.
  Elles ne pesent que sur un COUNT(*) brut : 18087/1053006 = 1.72 %.
  → impact affichage NUL, impact sur les comptes de pilotage REEL.
  Gravite : faible pour l utilisateur, mais tout chiffre de volumetrie
  cite dans un document les inclut sans le dire.

## 6. LES VRAIS DOUBLONS — fonds reels uniquement
  Ma requete d exemples precedente ne rendait RIEN, et c etait un piege
  SQL : `t.fund_id = v.fund_id` n est jamais vrai quand fund_id est NULL,
  car NULL = NULL est inconnu. Les exemples portaient tous sur des paires
  NULL et disparaissaient en silence. Ici le NULL est exclu.

  19 paire(s) | 19 ligne(s) en trop
  memes valeurs : 0 | valeurs divergentes : 19

   fonds pays    date        id:valeur
    1552 MAROC   2024-10-01  3175143:0  3243394:827269.72
    2596 UEMOA   2022-12-23  3183726:0  3204335:7029.13
    2597 UEMOA   2022-07-14  3183723:0  3196676:1791.27
    2597 UEMOA   2022-08-11  3183727:0  3196694:1803.09
    2597 UEMOA   2022-10-20  3183725:0  3196707:1808.37
    2597 UEMOA   2022-11-03  3183720:0  3196714:1814.39
    2597 UEMOA   2022-11-24  3183722:0  3196645:1767.87
    2597 UEMOA   2022-12-15  3183721:0  3196670:1785.13
    2597 UEMOA   2023-01-26  3183718:0  3196664:1780.54
    2597 UEMOA   2023-02-09  3183713:0  3196669:1784.87
    2597 UEMOA   2023-03-09  3183729:0  3196710:1811.63
    2597 UEMOA   2023-03-16  3183715:0  3196715:1815.72
    2597 UEMOA   2023-03-23  3183730:0  3196713:1813.07
    2597 UEMOA   2023-04-20  3183717:0  3196682:1797.94
    2597 UEMOA   2023-05-25  3183728:0  3196709:1809.03
    2597 UEMOA   2023-08-31  3183716:0  3196826:1855.44
    2597 UEMOA   2023-09-07  3183719:0  3196880:1863.16
    2601 UEMOA   2024-07-03  3183712:0  3185869:1113.88
    2615 UEMOA   2022-09-19  3183724:0  3190776:125433.6

  → 19 paire(s) a arbitrer, sur 19. C est un volume
    TRAITABLE a la main, et c est la difference avec mon chiffre errone de
    1 909 : le chantier P2-03 redevient faisable.

  Rappel : MySQL autorise plusieurs NULL dans un index UNIQUE. Les lignes
  sans fonds ne bloqueraient donc PAS la creation de l index.

=== FIN — aucune ecriture effectuee ===

########## scripts/diag/ondemand/diag_w1_benchmark_lookahead_scope.js ##########
=== W1 BENCHMARK LOOK-AHEAD — HIGH CONFIDENCE SCOPE ===
Mesure le 2026-10-28T06:05:47.058Z — LECTURE SEULE

## A. Scope par pays
  pays   rows  distinct_funds  distinct_vl_dates  min_vl_date  max_vl_date
  -----  ----  --------------  -----------------  -----------  -----------
  MAROC  1919  627             5                  2026-09-21   2026-09-25 

## B. Distribution des ecarts futurs
  pays   gap_days  rows  distinct_funds
  -----  --------  ----  --------------
  MAROC  3         627   627           
  MAROC  4         323   323           
  MAROC  5         323   323           
  MAROC  6         323   323           
  MAROC  7         323   323           

## C. Principales dates affectees
  pays   vl_date     future_date  gap_days  index_id  rows  distinct_funds
  -----  ----------  -----------  --------  --------  ----  --------------
  MAROC  2026-09-25  2026-09-28   3         MASI      627   627           
  MAROC  2026-09-21  2026-09-28   7         MASI      323   323           
  MAROC  2026-09-22  2026-09-28   6         MASI      323   323           
  MAROC  2026-09-23  2026-09-28   5         MASI      323   323           
  MAROC  2026-09-24  2026-09-28   4         MASI      323   323           

## D. Total
  high_confidence_rows=1919
  high_confidence_funds=627
  high_confidence_dates=5

VERDICT=W1_BENCHMARK_LOOKAHEAD_SCOPE_MEASURED_READ_ONLY

########## scripts/diag/ondemand/diag_w1_foundations.js ##########
=== W1 FOUNDATIONS — LIVE SCHEMA / RELATIONSHIPS / PROVENANCE ===
Mesure le 2026-10-28T06:05:48.977Z — LECTURE SEULE

## A. Tables canoniques / referentielles presentes
  table                      present  approx_rows
  -------------------------  -------  -----------
  fond_investissements       YES      1299       
  societes                   YES      156        
  documents                  YES      5          
  personnel_sgs              YES      5          
  valorisations              YES      1038432    
  indice_references          YES      40642      
  devisedechanges            YES      130260     
  ref_asset_classes          YES      4          
  ref_geo_zones              YES      29         
  ref_categories_fundafrica  YES      140        
  ref_indices_fundafrica     YES      137        
  ref_index_sources          YES      10         
  sec_ng_observations        NO       -          
  sec_ng_fund_aliases        NO       -          
  sec_ng_corrections_audit   YES      48980      

## B. valorisations — parite schema additive / provenance
  column            present
  ----------------  -------
  net_assets_ngn    YES    
  net_assets_usd    YES    
  unit_price_ngn    YES    
  unit_price_usd    YES    
  bid_price_ngn     YES    
  bid_price_usd     YES    
  offer_price_ngn   YES    
  offer_price_usd   YES    
  price_type        YES    
  currency_code     YES    
  sec_document_id   YES    
  source_url        YES    
  report_date       YES    
  data_quality      YES    
  correction_batch  YES    

## C. Relations societe_id et contraintes FK reelles
  table                 societe_id_column  real_fk_to_societes  fk_names
  --------------------  -----------------  -------------------  --------
  fond_investissements  YES                NO                   -       
  documents             YES                NO                   -       
  personnel_sgs         YES                NO                   -       

## D. Couverture societe_id — agrégats uniquement
  table                 total  missing_societe_id
  --------------------  -----  ------------------
  fond_investissements  1266   44                
  documents             5      2                 
  personnel_sgs         5      2                 

## E. Identite fonds — agrégats de collision, sans données sensibles
  total  active  missing_isin  missing_societe_id  duplicate_isin_keys  duplicate_name_country_keys
  -----  ------  ------------  ------------------  -------------------  ---------------------------
  1266   1258    456           44                  0                    1                          

## F. Provenance valorisations — couverture globale et par pays
Global:
  total    with_currency  with_price_type  with_source  with_report_date  with_quality  with_batch
  -------  -------------  ---------------  -----------  ----------------  ------------  ----------
  1053006  68746          68442            68442        68442             76124         52003     
Par pays:
  pays     total   with_currency  with_price_type  with_source  with_quality
  -------  ------  -------------  ---------------  -----------  ------------
  MAROC    571425  0              0                0            0           
  TUNISIE  313101  0              0                0            0           
  NIGERIA  78152   68746          68442            68442        76124       
  UEMOA    48409   0              0                0            0           
  CEMAC    2134    0              0                0            0           

## G. Referentiels FundAfrica — comptes exacts
  table                      count
  -------------------------  -----
  ref_asset_classes          4    
  ref_geo_zones              29   
  ref_categories_fundafrica  140  
  ref_indices_fundafrica     137  
  ref_index_sources          10   

## H. Indices / FX — bornes temporelles
  authority          rows_count  series_count  min_date                                                        max_date                                                      
  -----------------  ----------  ------------  --------------------------------------------------------------  --------------------------------------------------------------
  indice_references  41197       9             Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time)  Tue Oct 27 2026 00:00:00 GMT+0000 (Coordinated Universal Time)
  devisedechanges    133214      21            Mon Jan 03 2000 00:00:00 GMT+0000 (Coordinated Universal Time)  Tue Oct 27 2026 00:00:00 GMT+0000 (Coordinated Universal Time)

## I. Colonnes documents — capacité de provenance documentaire
  id, nom, fichier, societe, date, annee, mois, type_fichier, fond_id, objet, fond, created_at, updated_at, societe_id

VERDICT=W1_FOUNDATION_SCHEMA_OBSERVED_READ_ONLY

########## scripts/diag/ondemand/diag_w1_identity_gaps.js ##########
=== W1 FUND / MANAGER IDENTITY GAPS ===
Mesure le 2026-10-28T06:05:59.734Z — LECTURE SEULE

## A. Completude par pays
  pays     total  active  missing_isin  missing_societe_id  missing_manager_text  text_without_id
  -------  -----  ------  ------------  ------------------  --------------------  ---------------
  MAROC    646    646     0             24                  0                     24             
  NIGERIA  337    336     337           17                  1                     16             
  TUNISIE  131    131     7             3                   0                     3              
  UEMOA    118    111     112           0                   0                     0              
  CEMAC    34     34      0             0                   0                     0              

## B. Fonds avec texte gestionnaire mais sans societe_id
  pays     funds  distinct_manager_labels  exact_name_match_available
  -------  -----  -----------------------  --------------------------
  MAROC    24     4                        0                         
  NIGERIA  16     11                       0                         
  TUNISIE  3      3                        0                         

## C. Doublons nom exact normalise dans un meme pays (max 50)
  pays   normalized_name    rows_count  fund_ids   isin_variants
  -----  -----------------  ----------  ---------  -------------
  UEMOA  SICAV ABDOU DIOUF  2           1539,2582  2            

## D. Relations documents/personnel
  entity         total  missing_societe_id  missing_fond_id
  -------------  -----  ------------------  ---------------
  documents      5      2                   0              
  personnel_sgs  5      2                   -              

VERDICT=W1_IDENTITY_GAPS_MEASURED_READ_ONLY

########## scripts/diag/ondemand/diag_w1_manager_alias_candidates.js ##########
=== W1 MANAGER ALIAS CANDIDATES — READ ONLY ===
Mesure le 2026-10-28T06:05:59.879Z

## A. Classification des labels
  classification         count
  ---------------------  -----
  EXACT_NORMALIZED       2    
  HIGH_CONFIDENCE_FUZZY  1    
  AMBIGUOUS              1    
  NO_CANDIDATE           14   

## B. Candidats — revue humaine obligatoire
  pays     source_label                               funds  class                  best_societe_id  best_name                                score  same_country
  -------  -----------------------------------------  -----  ---------------------  ---------------  ---------------------------------------  -----  ------------
  MAROC    ALPHAVEST ASSET MANAGEMENT                 7      NO_CANDIDATE           186              MAROGEST                                 0.316  YES         
  MAROC    QUANTUM CAPITAL GESTION                    6      NO_CANDIDATE           184              CDG CAPITAL GESTION                      0.593  YES         
  MAROC    SAHAM CAPITAL GESTION                      5      NO_CANDIDATE           184              CDG CAPITAL GESTION                      0.640  YES         
  MAROC    STERLING ASSET MANAGEMENT                  6      NO_CANDIDATE           181              UPLINE CAPITAL MANAGEMENT                0.250  YES         
  NIGERIA  BGL Asset Management Limited               1      NO_CANDIDATE           282              AVA GLOBAL ASSET MANAGERS LIMITED        0.267  YES         
  NIGERIA  BGL Asset Mgt Limited                      2      NO_CANDIDATE           278              AFRINVEST ASSET MGT LTD.                 0.600  YES         
  NIGERIA  DVCF Oil & Gas Plc                         2      NO_CANDIDATE           287              CHAPEL HILL DENHAM MGT. LIMITED          0.176  YES         
  NIGERIA  FBN Capital Asset Mgt                      3      EXACT_NORMALIZED       332              FBN CAPITAL ASSET MGT. LIMITED           1.000  YES         
  NIGERIA  First City Asset Management Plc            2      EXACT_NORMALIZED       297              FIRST CITY ASSET MANAGEMENT LIMITED      1.000  YES         
  NIGERIA  Global Asset Management Ltd                1      AMBIGUOUS              282              AVA GLOBAL ASSET MANAGERS LIMITED        0.778  YES         
  NIGERIA  Intecontinental Capital Mkt. Ltd           1      NO_CANDIDATE           343              ONE17 CAPITAL LIMITED                    0.556  YES         
  NIGERIA  Intercontinental Capital Market            1      NO_CANDIDATE           305              MARBLE CAPITAL LIMITED                   0.537  YES         
  NIGERIA  Lighthouse Asset Management                1      NO_CANDIDATE           316              VALUALLIANCE ASSET MANAGEMENT LIMITED    0.174  YES         
  NIGERIA  Oceanic Bank Int’l Plc                     1      NO_CANDIDATE           340              INVESTMENT ONE FUNDS MANAGEMENT LIMITED  0.261  YES         
  NIGERIA  Utica Custodian Assured Fixed Income Fund  1      NO_CANDIDATE           284              CAPITAL EXPRESS ASSET AND TRUST LIMITED  0.328  YES         
  TUNISIE  AFC                                        1      NO_CANDIDATE           230              MAC SA                                   0.250  YES         
  TUNISIE  BNA CAPITAUX                               1      HIGH_CONFIDENCE_FUZZY  224              BNA CAPITAUX -BNAC                       0.929  YES         
  TUNISIE  SBT                                        1      NO_CANDIDATE           233              SMART ASSET MANAGEMENT                   0.400  YES         

FUNDS_WITHOUT_SOCIETE_ID_AND_WITH_TEXT=43
DISTINCT_MANAGER_LABELS=18
RULE=No mapping is authorized by this report; exact/fuzzy candidates require source-backed review before any write.
VERDICT=W1_MANAGER_ALIAS_CANDIDATES_MEASURED_READ_ONLY

########## scripts/diag/ondemand/diag_w1_nigeria_transport_readiness.js ##########
=== W1 NIGERIA METADATA TRANSPORT READINESS ===
Mesure le 2026-10-28T06:05:59.963Z — LECTURE SEULE
CSV_PRESENT=YES
CSV_SIZE_BYTES=11951498
CSV_MTIME=2026-10-26T10:00:40.048Z

## A. Colonnes attendues dans le CSV courant
  column                  present  nonempty_rows  coverage
  ----------------------  -------  -------------  --------
  valuation_date          YES      9084           100.0%  
  fund_name_clean         YES      9084           100.0%  
  vl_price                YES      9084           100.0%  
  currency_code           YES      9084           100.0%  
  vl_price_source         YES      9084           100.0%  
  source_url              YES      9084           100.0%  
  source_file             YES      0              0.0%    
  source_title            YES      9084           100.0%  
  source_page_url         YES      9084           100.0%  
  source_year_page        YES      9084           100.0%  
  sheet_name              YES      9084           100.0%  
  source_row_number       YES      9084           100.0%  
  vl_currency_code        YES      9084           100.0%  
  vl_currency_source      YES      9084           100.0%  
  vl_currency_confidence  YES      9084           100.0%  

## B. vl_price_source brut
  value                 count
  --------------------  -----
  offer_price_fallback  9084 

## C. Mapping possible vers vl_contract PRICE_TYPES
  price_type  count
  ----------  -----
  OFFER       9084 

## D. Transportabilite
  total_rows  basic_importable  source_url_plus_price_type  currency_source_price  source_url_plus_price_pct  full_contract_core_pct
  ----------  ----------------  --------------------------  ---------------------  -------------------------  ----------------------
  9084        9084              9084                        9084                   100.0%                     100.0%                

REPORT_DATE_HEADER=NO
SEC_DOCUMENT_ID_HEADER=NO
RULE=Do not fabricate report_date or sec_document_id when absent.
VERDICT=W1_NIGERIA_METADATA_TRANSPORT_READINESS_MEASURED_READ_ONLY

########## scripts/diag/ondemand/diag_w1_recent_provenance.js ##########
=== W1 RECENT PROVENANCE — CANONICAL VALUATIONS ===
Mesure le 2026-10-28T06:06:00.501Z — LECTURE SEULE

## Fenetre 30 jours
  pays     total  currency  price_type  source  report_date  quality  batch 
  -------  -----  --------  ----------  ------  -----------  -------  ------
  MAROC    8077   0.0%      0.0%        0.0%    0.0%         0.0%     0.0%  
  TUNISIE  2514   0.0%      0.0%        0.0%    0.0%         0.0%     0.0%  
  UEMOA    311    0.0%      0.0%        0.0%    0.0%         0.0%     0.0%  
  NIGERIA  54     100.0%    0.0%        0.0%    0.0%         100.0%   100.0%

## Fenetre 90 jours
  pays     total  currency  price_type  source  report_date  quality  batch 
  -------  -----  --------  ----------  ------  -----------  -------  ------
  MAROC    22424  0.0%      0.0%        0.0%    0.0%         0.0%     0.0%  
  TUNISIE  7171   0.0%      0.0%        0.0%    0.0%         0.0%     0.0%  
  UEMOA    1241   0.0%      0.0%        0.0%    0.0%         0.0%     0.0%  
  NIGERIA  259    100.0%    0.0%        0.0%    0.0%         100.0%   100.0%

## Fenetre 365 jours
  pays     total  currency  price_type  source  report_date  quality  batch
  -------  -----  --------  ----------  ------  -----------  -------  -----
  MAROC    67979  0.0%      0.0%        0.0%    0.0%         0.0%     0.0% 
  TUNISIE  27340  0.0%      0.0%        0.0%    0.0%         0.0%     0.0% 
  NIGERIA  8529   98.5%     94.9%       94.9%   94.9%        98.5%    80.8%
  UEMOA    6195   0.0%      0.0%        0.0%    0.0%         0.0%     0.0% 

## Nigeria — statuts data_quality par annee de VL
  year  quality      rows_count
  ----  -----------  ----------
  2026  OK           6139      
  2026  UNQUALIFIED  304       
  2026  (NULL)       84        
  2026  SOURCE_ZERO  16        
  2026  REVIEW       13        
  2026  QUARANTINE   5         
  2025  OK           10623     
  2025  (NULL)       258       
  2025  SOURCE_ZERO  30        
  2025  REVIEW       9         
  2025  QUARANTINE   7         
  2024  OK           9057      
  2024  (NULL)       253       
  2024  SOURCE_ZERO  29        
  2024  REVIEW       21        
  2024  QUARANTINE   7         
  2023  OK           7675      
  2023  (NULL)       195       
  2023  REVIEW       60        
  2023  QUARANTINE   47        
  2023  SOURCE_ZERO  14        
  2022  OK           7096      
  2022  (NULL)       194       
  2022  REVIEW       50        
  2022  QUARANTINE   25        
  2022  SOURCE_ZERO  14        
  2021  OK           3918      
  2021  QUARANTINE   2474      
  2021  (NULL)       183       
  2021  REVIEW       52        
  2021  SOURCE_ZERO  13        
  2020  OK           3385      
  2020  QUARANTINE   2021      
  2020  (NULL)       249       
  2020  REVIEW       20        
  2020  SOURCE_ZERO  4         
  2019  OK           3582      
  2019  QUARANTINE   1009      
  2019  (NULL)       247       
  2019  REVIEW       19        
  2019  SOURCE_ZERO  15        
  2018  OK           2322      
  2018  QUARANTINE   1742      
  2018  (NULL)       359       
  2018  SOURCE_ZERO  53        
  2018  REVIEW       18        
  2017  OK           3481      
  2017  SOURCE_ZERO  104       
  2017  QUARANTINE   41        
  2017  REVIEW       16        
  2017  (NULL)       6         
  2016  OK           2457      
  2016  SOURCE_ZERO  147       
  2016  REVIEW       16        
  2016  PARTIAL      3         
  2015  OK           1945      
  2015  SOURCE_ZERO  34        
  2015  REVIEW       5         
  2015  PARTIAL      1         
  2014  OK           1484      
  2014  REVIEW       599       
  2014  SOURCE_ZERO  28        
  2014  PARTIAL      2         
  2013  OK           1711      
  2013  SOURCE_ZERO  63        
  2013  PARTIAL      4         
  2013  REVIEW       2         
  2012  OK           1348      
  2012  SOURCE_ZERO  19        
  2012  REVIEW       9         
  2012  PARTIAL      1         
  2011  OK           707       
  2011  PARTIAL      5         
  2011  SOURCE_ZERO  3         
  2011  REVIEW       1         

## Nigeria — 180 jours, combinaison qualification/source
  quality      source_state  price_state      rows_count  min_date    max_date  
  -----------  ------------  ---------------  ----------  ----------  ----------
  OK           WITH_SOURCE   WITH_PRICE_TYPE  2214        Fri May 08  Fri Jul 10
  UNQUALIFIED  NO_SOURCE     NO_PRICE_TYPE    304         Thu Jun 11  Fri Oct 09
  REVIEW       WITH_SOURCE   WITH_PRICE_TYPE  6           Fri May 08  Fri Jun 19
  SOURCE_ZERO  WITH_SOURCE   WITH_PRICE_TYPE  1           Fri Jun 26  Fri Jun 26

VERDICT=W1_RECENT_PROVENANCE_MEASURED_READ_ONLY

########## scripts/diag/ondemand/diag_w1_runtime_schema_gate.js ##########
=== W1 RUNTIME SCHEMA GATE ===
Mesure le 2026-10-28T06:06:05.563Z — LECTURE SEULE
DB_SYNC_ALTER_TRUE=NO
DB_SYNC_TRUE=NO
NODE_ENV=production
RULE=Model parity changes are allowed only through governed code + migration review; this diagnostic never enables sync.
VERDICT=W1_RUNTIME_SCHEMA_GATE_OBSERVED_READ_ONLY

########## scripts/diag/ondemand/diag_w1_temporal_integrity.js ##########
=== W1 TEMPORAL INTEGRITY — FX / BENCHMARK LOOK-AHEAD ===
Mesure le 2026-10-28T06:06:05.681Z — LECTURE SEULE

## A. Bornes des series FX pertinentes
  paire    min_date    max_date    rows_count
  -------  ----------  ----------  ----------
  EUR/MAD  2000-01-03  2026-10-27  7555      
  EUR/TND  2003-12-01  2026-10-27  6087      
  EUR/XAF  2000-01-03  2026-10-27  6998      
  EUR/XOF  2000-01-03  2026-10-27  6998      
  USD/MAD  2000-01-03  2026-10-27  7657      
  USD/TND  2003-12-01  2026-10-27  6410      
  USD/XAF  2000-01-03  2026-10-27  6927      
  USD/XOF  2000-01-03  2026-10-27  6916      

## B. Exposition historique avant le premier taux disponible
  pays     pair     first_fx    vl_before_first_fx
  -------  -------  ----------  ------------------
  MAROC    EUR/MAD  2000-01-03  0                 
  MAROC    USD/MAD  2000-01-03  0                 
  TUNISIE  EUR/TND  2003-12-01  0                 
  TUNISIE  USD/TND  2003-12-01  0                 

## C. Benchmark recent — comparaison stored vs latest<=VL vs nearest absolu
  pays     rows   exact  stored_matches_latest_prior  stored_matches_future  future_nearest_candidate  no_series
  -------  -----  -----  ---------------------------  ---------------------  ------------------------  ---------
  MAROC    19780  16623  17861                        1919                   1919                      0        
  TUNISIE  6919   6793   6793                         126                    0                         0        
  UEMOA    1704   1696   1696                         8                      0                         0        
  NIGERIA  88     88     88                           0                      0                         0        
  Nigeria  54     54     54                           0                      0                         0        

Exemples stored correspondant a une valeur future (IDs/date uniquement, max 20):
  pays     fund_id  vl_date     index_id  future_date  gap_days
  -------  -------  ----------  --------  -----------  --------
  TUNISIE  2439     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2471     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2443     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2513     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2422     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2455     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2523     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2425     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2427     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2479     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2418     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2421     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2517     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2869     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2870     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2873     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2485     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2526     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2478     2026-07-09  Tunindex  2026-07-10   1       
  TUNISIE  2493     2026-07-09  Tunindex  2026-07-10   1       

## D. Chemins de code temporalement sensibles — constat
  FOREX_SHARED_GETRATE=FALLS_FORWARD_TO_FIRST_FUTURE_WHEN_NO_PRIOR
  MAROC_ASFIM=FIRST_FUTURE_FX_PLUS_HARDCODED_RATE_FALLBACK
  TUNISIE_CMF=FIRST_FUTURE_FX_WHEN_NO_PRIOR
  BRVM_BOC=LATEST_GLOBAL_USD_XOF_AT_PROMOTION
  BVMAC_BOC=LATEST_GLOBAL_USD_XAF_AT_PROMOTION
  INDEX_PROPAGATION=ABSOLUTE_NEAREST_WITHIN_7D_CAN_SELECT_FUTURE

VERDICT=W1_TEMPORAL_EXPOSURE_MEASURED_READ_ONLY

########## scripts/diag/ondemand/diag_w2_cemac_source_mapping.js ##########
=== W2 CEMAC/BVMAC — JS WRAPPER FOR READ-ONLY PYTHON PREFLIGHT ===
MODE=READ_ONLY_DELEGATE_NO_DDL_NO_FILE_WRITE_NO_CANONICAL_WRITE
PYTHON_SCRIPT=/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/diag/ondemand/diag_w2_cemac_source_mapping.py
=== W2 CEMAC/BVMAC — SOURCE + FUND MATCH PREFLIGHT ===
MODE=READ_ONLY_NO_DDL_NO_FILE_WRITE_NO_CANONICAL_WRITE
INDEX_REFS=817
LATEST_BOC=2026-10-27
PDF_HTTP_STATUS=200
PDF_URL=https://www.bvm-ac.org/wp-content/uploads/2026/10/BOC-20261027.pdf
PDF_BYTES=1807787
PDF_SHA256=7435d8924c1954a8c4549ecf5eb9ca4ed9b95a660fca47d0061072ba67f905fc
PDF_PAGES=31
OPCVM_PAGES=13,14,15,16,17
PARSED_ROWS=20
PARSE_FAILURES=0
QUALITY_COUNTS={"OK": 18, "SUSPECT_VARIATION": 2}
LIVE_CEMAC_FUNDS=34
LIVE_CEMAC_ACTIVE_FUNDS=34
LIVE_CEMAC_MAX_DATEJOUR=2024-12-12
LIVE_CEMAC_VL_ROWS=2134
LIVE_CEMAC_LATEST_VL=2024-12-12
MATCH_COUNTS={"MATCHED_EXACT": 16, "MATCHED_FUZZY": 1, "UNMATCHED": 3}
FUZZY_ENGINE_AVAILABLE=YES
MATCHED_ROWS=17
UNMATCHED_OR_AMBIGUOUS_ROWS=3
UNMATCHED_OR_AMBIGUOUS_SAMPLE=[{"source_name": "FCP HARVEST DIVERSIFIE", "management_company": "HARVEST ASSET MANAGEMENT AFG BANK CAMEROUN", "section": "QUOTIDIENNES", "periodicity": "Journaliere", "nav_date": "2026-10-23", "current_nav": 108500.75, "quality": "SUSPECT_VARIATION", "match_status": "UNMATCHED", "matched_fund_id": null, "confidence": null}, {"source_name": "FCP ESS PREMIUM PERSO", "management_company": "ESS ASSET MANAGEMENT CCA -Bank", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-20", "current_nav": 10507.0, "quality": "OK", "match_status": "UNMATCHED", "matched_fund_id": null, "confidence": null}, {"source_name": "FCPHARVEST DIVERSIFIE", "management_company": "HARVEST ASSET MANAGEMENT AFG BANK CAMEROUN", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-23", "current_nav": 108500.75, "quality": "SUSPECT_VARIATION", "match_status": "UNMATCHED", "matched_fund_id": null, "confidence": null}]
MATCHED_SAMPLE=[{"source_name": "FCP AB AVENIR", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT BGFIBANK CAMEROUN", "section": "QUOTIDIENNES", "periodicity": "Journaliere", "nav_date": "2026-10-23", "current_nav": 1297.74, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2655, "confidence": 100.0}, {"source_name": "FCP ECOBANK MONETAIRE CEMAC", "management_company": "EDC ASSET MANAGEMENT CEMAC ECOBANK CAMEROUN", "section": "QUOTIDIENNES", "periodicity": "Journaliere", "nav_date": "2026-10-26", "current_nav": 1194.96, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2663, "confidence": 100.0}, {"source_name": "FCP AB CASH", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT UBA BANK CAMEROUN", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 13337.42, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2650, "confidence": 100.0}, {"source_name": "FCP AB INVEST", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT UBA BANK CAMEROUN", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 12802.21, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2651, "confidence": 100.0}, {"source_name": "FCP PERFORMANCE", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT ORABANK GABON", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 11994.84, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2652, "confidence": 100.0}, {"source_name": "FCP CAP OBLIGATIONS", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT BGFIBANK CAMEROUN", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 12848.89, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2649, "confidence": 100.0}, {"source_name": "FCP AB DIVERSIFIE", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT BGFIBANK CAMEROUN", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 11423.83, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2654, "confidence": 100.0}, {"source_name": "FCP ASCA LIQUIDITES", "management_company": "ASCA ASSET MANAGEMENT ASCA", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-16", "current_nav": 15049.92, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2656, "confidence": 100.0}, {"source_name": "FCP ASCA PATRIMOINE", "management_company": "ASCA ASSET MANAGEMENT ASCA", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-16", "current_nav": 16262.11, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2657, "confidence": 100.0}, {"source_name": "FCP ASCA HORIZON", "management_company": "ASCA ASSET MANAGEMENT CREDIT DU CONGO", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-16", "current_nav": 15853.82, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2658, "confidence": 100.0}, {"source_name": "FCP CRBC PROSPERITE 0", "management_company": "ASCA ASSET MANAGEMENT ASCA", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-16", "current_nav": 14420.84, "quality": "OK", "match_status": "MATCHED_FUZZY", "matched_fund_id": 2659, "confidence": 95.0}, {"source_name": "FCP ABD KOMO", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT ORABANK GABON", "section": "MENSUELLES", "periodicity": "Mensuelle", "nav_date": "2026-10-23", "current_nav": 9717.04, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2653, "confidence": 100.0}, {"source_name": "FCP ESS CONFORT", "management_company": "ESS ASSET MANAGEMENT ORABANK GABON", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-20", "current_nav": 13063.0, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2668, "confidence": 100.0}, {"source_name": "FCP ESS TRESO PRIVILEGE", "management_company": "ESS ASSET MANAGEMENT ORABANK GABON", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-20", "current_nav": 12705.0, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2669, "confidence": 100.0}, {"source_name": "FCP ESS PROMO PME", "management_company": "ESS ASSET MANAGEMENT ORABANK GABON", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-20", "current_nav": 12229.0, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2670, "confidence": 100.0}, {"source_name": "FCP ATLANTIQUE PERFORMANCE", "management_company": "HARVEST ASSET MANAGEMENT AFG BANK CAMEROUN", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-23", "current_nav": 15539.1, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2671, "confidence": 100.0}, {"source_name": "FCP HARVEST LIQUIDITÉS", "management_company": "HARVEST ASSET MANAGEMENT AFG BANK CAMEROUN", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-23", "current_nav": 12795.23, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2677, "confidence": 100.0}]

DRYRUN_DISPOSITION_COUNTS={"BLOCK_UNMATCHED": 3, "WOULD_INSERT": 17}
SOURCE_DUPLICATE_KEYS=0
SOURCE_DUPLICATE_SAME_VALUE_KEYS=0
SOURCE_DUPLICATE_CONFLICT_KEYS=0
SOURCE_DUPLICATE_DETAILS=[]
FX_ASOF_METHOD_COUNTS={"USD/XAF_PRIOR": 17}
FX_ASOF_BY_DATE=[{"nav_date": "2026-10-16", "available": true, "method": "USD/XAF_PRIOR", "source_date": "2026-10-16", "gap_days": 0}, {"nav_date": "2026-10-20", "available": true, "method": "USD/XAF_PRIOR", "source_date": "2026-10-20", "gap_days": 0}, {"nav_date": "2026-10-23", "available": true, "method": "USD/XAF_PRIOR", "source_date": "2026-10-23", "gap_days": 0}, {"nav_date": "2026-10-26", "available": true, "method": "USD/XAF_PRIOR", "source_date": "2026-10-26", "gap_days": 0}]
DRYRUN_ACTIONABLE_SAMPLE=[{"source_name": "FCP AB AVENIR", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT BGFIBANK CAMEROUN", "section": "QUOTIDIENNES", "periodicity": "Journaliere", "nav_date": "2026-10-23", "current_nav": 1297.74, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2655, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}, {"source_name": "FCP ECOBANK MONETAIRE CEMAC", "management_company": "EDC ASSET MANAGEMENT CEMAC ECOBANK CAMEROUN", "section": "QUOTIDIENNES", "periodicity": "Journaliere", "nav_date": "2026-10-26", "current_nav": 1194.96, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2663, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-26"}, {"source_name": "FCP AB CASH", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT UBA BANK CAMEROUN", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 13337.42, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2650, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}, {"source_name": "FCP AB INVEST", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT UBA BANK CAMEROUN", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 12802.21, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2651, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}, {"source_name": "FCP PERFORMANCE", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT ORABANK GABON", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 11994.84, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2652, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}, {"source_name": "FCP CAP OBLIGATIONS", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT BGFIBANK CAMEROUN", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 12848.89, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2649, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}, {"source_name": "FCP AB DIVERSIFIE", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT BGFIBANK CAMEROUN", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-23", "current_nav": 11423.83, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2654, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}, {"source_name": "FCP ASCA LIQUIDITES", "management_company": "ASCA ASSET MANAGEMENT ASCA", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-16", "current_nav": 15049.92, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2656, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-16"}, {"source_name": "FCP ASCA PATRIMOINE", "management_company": "ASCA ASSET MANAGEMENT ASCA", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-16", "current_nav": 16262.11, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2657, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-16"}, {"source_name": "FCP ASCA HORIZON", "management_company": "ASCA ASSET MANAGEMENT CREDIT DU CONGO", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-16", "current_nav": 15853.82, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2658, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-16"}, {"source_name": "FCP CRBC PROSPERITE 0", "management_company": "ASCA ASSET MANAGEMENT ASCA", "section": "HEBDOMADAIRES", "periodicity": "Hebdomadaire", "nav_date": "2026-10-16", "current_nav": 14420.84, "quality": "OK", "match_status": "MATCHED_FUZZY", "matched_fund_id": 2659, "confidence": 95.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-16"}, {"source_name": "FCP ABD KOMO", "management_company": "AFRICA BRIGHT ASSET MANAGEMENT ORABANK GABON", "section": "MENSUELLES", "periodicity": "Mensuelle", "nav_date": "2026-10-23", "current_nav": 9717.04, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2653, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}, {"source_name": "FCP ESS CONFORT", "management_company": "ESS ASSET MANAGEMENT ORABANK GABON", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-20", "current_nav": 13063.0, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2668, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-20"}, {"source_name": "FCP ESS TRESO PRIVILEGE", "management_company": "ESS ASSET MANAGEMENT ORABANK GABON", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-20", "current_nav": 12705.0, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2669, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-20"}, {"source_name": "FCP ESS PROMO PME", "management_company": "ESS ASSET MANAGEMENT ORABANK GABON", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-20", "current_nav": 12229.0, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2670, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-20"}, {"source_name": "FCP ATLANTIQUE PERFORMANCE", "management_company": "HARVEST ASSET MANAGEMENT AFG BANK CAMEROUN", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-23", "current_nav": 15539.1, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2671, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}, {"source_name": "FCP HARVEST LIQUIDITÉS", "management_company": "HARVEST ASSET MANAGEMENT AFG BANK CAMEROUN", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-23", "current_nav": 12795.23, "quality": "OK", "match_status": "MATCHED_EXACT", "matched_fund_id": 2677, "confidence": 100.0, "disposition": "WOULD_INSERT", "existing_value": null, "fx_method": "USD/XAF_PRIOR", "fx_source_date": "2026-10-23"}]
DRYRUN_BLOCKED_SAMPLE=[{"source_name": "FCP HARVEST DIVERSIFIE", "management_company": "HARVEST ASSET MANAGEMENT AFG BANK CAMEROUN", "section": "QUOTIDIENNES", "periodicity": "Journaliere", "nav_date": "2026-10-23", "current_nav": 108500.75, "quality": "SUSPECT_VARIATION", "match_status": "UNMATCHED", "matched_fund_id": null, "confidence": null, "disposition": "BLOCK_UNMATCHED", "existing_value": null, "fx_method": null, "fx_source_date": null}, {"source_name": "FCP ESS PREMIUM PERSO", "management_company": "ESS ASSET MANAGEMENT CCA -Bank", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-20", "current_nav": 10507.0, "quality": "OK", "match_status": "UNMATCHED", "matched_fund_id": null, "confidence": null, "disposition": "BLOCK_UNMATCHED", "existing_value": null, "fx_method": null, "fx_source_date": null}, {"source_name": "FCPHARVEST DIVERSIFIE", "management_company": "HARVEST ASSET MANAGEMENT AFG BANK CAMEROUN", "section": "TRIMESTRIELLES", "periodicity": "Trimestrielle", "nav_date": "2026-10-23", "current_nav": 108500.75, "quality": "SUSPECT_VARIATION", "match_status": "UNMATCHED", "matched_fund_id": null, "confidence": null, "disposition": "BLOCK_UNMATCHED", "existing_value": null, "fx_method": null, "fx_source_date": null}]

RULE_FX=Exact/prior only: USD/XAF <= nav_date, else USD/EUR <= nav_date derived through fixed EUR/XAF parity. Never future.
RULE=No alias, fund, staging table, cron or VL is written by this probe.
VERDICT=W2_CEMAC_DRYRUN_SCOPE_MEASURED_READ_ONLY
PYTHON_EXIT_CODE=0

########## scripts/diag/ondemand/diag_w2_country_panel_contracts.js ##########
=== W2 COUNTRY PANEL CONTRACTS — LIVE GET PROBE ===
Mesure le 2026-10-28T06:06:20.925Z — GET ONLY
  name                         path                                   status  content_type      json_top_keys  body_bytes_seen
  ---------------------------  -------------------------------------  ------  ----------------  -------------  ---------------
  getPays                      /api/getPays                           200     application/json  code,data      1189           
  getRegulateur_MAROC          /api/getRegulateur?pays=MAROC          200     application/json  code,data      154            
  getDevise_MAROC              /api/getDevise?pays=MAROC              200     application/json  code,data      61             
  getfondbyuser_MAROC          /api/getfondbyuser/0?pays=MAROC        200     application/json  code,data      32             
  getfondbyuservalide_MAROC    /api/getfondbyuservalide/0?pays=MAROC  200     application/json  NON_JSON       64585          
  getallfondsvlanomalie_MAROC  /api/getallfondsvlanomalie?pays=MAROC  200     application/json  NON_JSON       64584          
  getfondbypays_MAROC          /api/getfondbypays/MAROC               200     application/json  NON_JSON       64584          

STATIC_FINDING=app.js mounts routes_vl.js and routes_vl.js transitively mounts routes_vl_admin.js
STATIC_FINDING=/api/importfondsvl has no current API implementation found by repository search
RULE=Preserve current working route URLs; certify route-by-route auth/ownership and reconcile missing/renamed contracts additively.
VERDICT=W2_COUNTRY_PANEL_CONTRACTS_OBSERVED_READ_ONLY

########## scripts/diag/ondemand/diag_w2_country_pipelines.js ##########
=== W2 COUNTRY PIPELINES — LIVE READ-ONLY INVENTORY ===
Mesure le 2026-10-28T06:06:23.534Z — LECTURE SEULE

## A. Canonical fund/VL state by market
  pays     funds  active_funds  vl_rows  latest_vl   vl_30d
  -------  -----  ------------  -------  ----------  ------
  MAROC    646    646           571425   2026-10-26  8077  
  NIGERIA  337    336           78152    2026-10-09  54    
  TUNISIE  131    131           313101   2026-10-27  2514  
  UEMOA    118    111           48409    2026-10-26  311   
  CEMAC    34     34            2134     2024-12-12  0     

## B. Staging/audit tables
  table                     present  approx_rows
  ------------------------  -------  -----------
  cmf_import_audit          YES      63         
  cmf_extreme_variations    YES      2          
  cmf_new_funds_queue       YES      0          
  brvm_boc_sources          YES      1127       
  brvm_boc_navs_raw         YES      114250     
  brvm_fund_aliases         YES      103        
  brvm_import_logs          YES      130        
  brvm_missing_navs         YES      2          
  bvmac_boc_sources         NO       -          
  bvmac_boc_navs_raw        NO       -          
  bvmac_fund_aliases        NO       -          
  bvmac_import_logs         NO       -          
  bvmac_missing_navs        NO       -          
  sec_ng_observations       NO       -          
  sec_ng_fund_aliases       NO       -          
  sec_ng_corrections_audit  YES      48980      

## C. Current crontab pipeline entries
  script                  active_entries  schedule_or_line                                                                                                                                                 
  ----------------------  --------------  -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  cron_tunisie_daily.sh   1               0 19 * * 1-5  cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_tunisie_daily.sh >> /var/log/cron_tunisie.log 2>&1
  cron_brvm_daily.sh      1               30 19 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_brvm_daily.sh >> /var/log/cron_brvm.log 2>&1                 
  cron_daily_update.sh    1               0 20 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_daily_update.sh >> /var/log/africafunds_cron.log 2>&1         
  cron_nigeria_weekly.sh  1               0 10 * * 1 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_nigeria_weekly.sh >> /var/log/africafunds_nigeria.log 2>&1      
  cron_indices_daily.sh   1               30 18 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_indices_daily.sh >> /var/log/cron_indices_daily.log 2>&1     

## D. Evidence/artifact directories
  path              present  files
  ----------------  -------  -----
  data/tunisie_cmf  YES      368  
  data/brvm_boc     YES      1550 
  data/bvmac_boc    NO       0    
  sec_ng_downloads  YES      564  

## E. Source-specific recent audit counts
  surface                    table                     present  rows  
  -------------------------  ------------------------  -------  ------
  TUNISIA_AUDIT              cmf_import_audit          YES      63    
  UEMOA_SOURCES              brvm_boc_sources          YES      1191  
  UEMOA_RAW                  brvm_boc_navs_raw         YES      123608
  CEMAC_SOURCES              bvmac_boc_sources         NO       -     
  CEMAC_RAW                  bvmac_boc_navs_raw        NO       -     
  NIGERIA_CORRECTIONS_AUDIT  sec_ng_corrections_audit  YES      51750 

## F. Runtime classification
  market   pipeline_code  active_cron  classification                               
  -------  -------------  -----------  ---------------------------------------------
  MAROC    YES            YES          ACTIVE_IF_DAILY_UPDATE_PRESENT               
  NIGERIA  YES            YES          ACTIVE_IF_WEEKLY_PRESENT                     
  TUNISIE  YES            YES          ACTIVE_IF_CMF_CRON_PRESENT                   
  UEMOA    YES            YES          ACTIVE_IF_BRVM_CRON_PRESENT                  
  CEMAC    YES            NO           CANDIDATE_UNTIL_BVMAC_CRON_AND_STAGING_PROVEN

VERDICT=W2_COUNTRY_PIPELINES_OBSERVED_READ_ONLY

########## scripts/diag/ondemand/diag_w2_p1_source_pilots.js ##########
=== W2 P1 GHANA / KENYA SOURCE PILOTS — TECHNICAL REACHABILITY ===
Mesure le 2026-10-28T06:06:24.689Z — HTTP GET ONLY / NO WRITE
IMPLEMENTATION=NODE_CORE_HTTP_ONLY
{"market":"GHANA","manager":"CAL Asset Management","role":"DAILY_PRICE_HISTORY_CANDIDATE","status":200,"content_type":"text/html","bytes_seen":841285,"elapsed_ms":288,"marker_counts":{"PRICE":4,"GHS":2,"Performance":18},"final_url":"https://calassetmanagement.net/about-us/reports-2/performance-update"}
{"market":"GHANA","manager":"EDC / Ecobank","role":"DATED_FUND_VALUES_CANDIDATE","status":"ERROR","content_type":"-","bytes_seen":0,"elapsed_ms":79,"marker_counts":{"fund":0,"GHS":0,"GHC":0},"error":"unable to get local issuer certificate"}
{"market":"KENYA","manager":"NCBA","role":"DIRECT_DAILY_PRICE_CANDIDATE","status":200,"content_type":"text/html","bytes_seen":362586,"elapsed_ms":3387,"marker_counts":{"Buy Price":1,"Sell Price":1,"daily price":1,"KES":7},"final_url":"https://ncbagroup.com/investment-banking/equity-fund/"}
REACHABLE_SOURCES=2/3
RULE=HTTP reachability and markers prove only technical source feasibility, not NAV semantics, licence, identity mapping or permission to import.
VERDICT=W2_P1_SOURCE_PILOTS_MEASURED_READ_ONLY

########## scripts/diag/ondemand/diag_w2_runtime_route_drift.js ##########
=== W2 RUNTIME ROUTE DRIFT — READ ONLY ===
Mesure le 2026-10-28T06:06:28.501Z

## A. Process vs checkout
  git_head      head_message                                                             pm2_script  pm2_cwd  process_started  restart_count  commits_since_process_start
  ------------  -----------------------------------------------------------------------  ----------  -------  ---------------  -------------  ---------------------------
  39be051d108f  diag: S5 — les 39 785 VL detachees sont-elles recuperables ou perdues ?  -           -        -                -              UNKNOWN                    

FIRST_COMMIT_AFTER_PROCESS_START=-

## B. Current checkout route wiring
APP_MOUNTS_ROUTES_VL=YES
ROUTES_VL_MOUNTS_ROUTES_VL_ADMIN=YES
CURRENT_TRANSITIVE_ADMIN_MOUNT=YES
ROUTES_VL_ADMIN_FILE_PRESENT=YES

## C. Routes served by the live in-memory process
  path                                   status  bytes 
  -------------------------------------  ------  ------
  /api/getfondbyuser/0?pays=MAROC        200     32    
  /api/getfondbyuservalide/0?pays=MAROC  200     99354 
  /api/getfondbypays/MAROC               200     141618
  /api/getallfondsvlanomalie?pays=MAROC  200     321791

RUNTIME_ROUTE_DRIFT_CANDIDATE=NO
RULE=Current transitive mount is the authority. Process age alone is not route drift; preserve working Country Panel contracts and harden auth/RBAC before any refactor.
VERDICT=W2_RUNTIME_ROUTE_DRIFT_OBSERVED_READ_ONLY

```
