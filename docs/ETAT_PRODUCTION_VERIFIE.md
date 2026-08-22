# Etat de production verifie automatiquement

> **Fichier genere par le workflow `doc-drift.yml`. Ne pas modifier a la main.**
> Il contient l'etat de la production **mesure**, pas l'etat **affirme** par la
> documentation. En cas de contradiction avec un autre .md, c'est ce fichier qui
> fait foi : les autres decrivent ce qu'on croyait vrai a leur date de redaction.

Derniere verification : **2026-08-22 09:09 UTC**

```

=== BOUCLE DE CONTROLE — DERIVE DOCUMENTATION / PRODUCTION ===

[OK   ] C1           Cache datejour synchronise avec la derniere VL
             aucun ecart
[ECHEC] C2           Aucune performance orpheline en tete de serie
             performences:13 fonds dont la perf la plus recente porte une date sans VL — c'est elle que l'API sert. Instruire fonds par fonds AVANT toute suppression.
[ECHEC] C3           Aucune performance recente au-dela de 500 %
             [1141] AFRINVEST DOLLAR FUND (NIGERIA) YTD 143958 % au Fri Jul 10 | [1196] EMERGING AFRICA EUROBOND FUND (NIGERIA) YTD 9339 % au Fri Jul 10 | [2743] APEL WEALTH MONEY MARKET FUND (NIGERIA) YTD 809 % au Fri Jul 10
[ALERTE] C4.CEMAC     Fraicheur VL CEMAC (budget 400 j)
             derniere VL Thu Dec 12, soit 618 j
[OK   ] C4.MAROC     Fraicheur VL MAROC (budget 6 j)
             derniere VL Tue Aug 18, soit 4 j
[ECHEC] C4.NIGERIA   Fraicheur VL NIGERIA (budget 14 j)
             derniere VL Fri Jul 24, soit 29 j
[OK   ] C4.TUNISIE   Fraicheur VL TUNISIE (budget 9 j)
             derniere VL Fri Aug 21, soit 1 j
[OK   ] C4.UEMOA     Fraicheur VL UEMOA (budget 6 j)
             derniere VL Fri Aug 21, soit 1 j
[OK   ] C5           Snapshot PRODUCTION_STATE.json frais (< 6 h)
             genere le 2026-08-22T09:00, soit 0.2 h
[ECHEC] C7           Aucune serie de VL melangeant deux echelles (12 mois)
             [2592] FCP BRIDGE EQUILIBRE (UEMOA/XOF) 5067x [8775.53 .. 44467985] | [2866] United Capital Nigerian Eurobo (NIGERIA/NGN) 1554x [120.96 .. 187995] | [1274] UNITED CAPITAL GLOBAL FIXED IN (NIGERIA/NGN) 1548x [1.20 .. 1863] | [2774] MERISTEM DOLLAR FUND (NIGERIA/USD) 1538x [10.84 .. 16672] | [1239] NOVA DOLLAR FIXED INCOME FUND (NIGERIA/NGN) 1536x [1.26 .. 1935] | [2768] FSL EUROBOND FUND (NIGERIA/NGN) 1535x [1.00 .. 1535] | [2809] MYRTLE DOLLAR SHIELD FUND (NIGERIA/USD) 1535x [1.00 .. 1535] | [1154] ARM EUROBOND FUND (NIGERIA/NGN) 1535x [1.20 .. 1836] | [2773] GUARANTY TRUST DOLLAR FUND (NIGERIA/USD) 1534x [100.00 .. 153355] | [2766] COMERCIO PARTNERS DOLLAR FUND (NIGERIA/USD) 1533x [1.10 .. 1686] | [1175] CORDROS DOLLAR FUND (NIGERIA/NGN) 1531x [116.08 .. 177673] | [1170] NORRENBERGER DOLLAR FUND (NIGERIA/NGN) 1527x [105.14 .. 160519] | [2771] CORONATION DOLLAR FUND (NIGERIA/USD) 1524x [1.03 .. 1568] | [1160] AXA MANSARD DOLLAR BOND FUND (NIGERIA/NGN) 1523x [139.18 .. 211979] | [1168] NIGERIA DOLLAR INCOME FUND (NIGERIA/NGN) 1518x [1.09 .. 1654]
[ECHEC] C8           Les performances suivent les VL
             MAROC : 10/644 a jour (1.6 %), retard moyen 86.0 j | TUNISIE : 5/131 a jour (3.8 %), retard moyen 86.2 j | UEMOA : 41/111 a jour (36.9 %), retard moyen 15.3 j — VL fraiches mais performances perimees : le site affiche des chiffres plausibles et faux
[ALERTE] C6.CEMAC     Couverture indRef CEMAC
             0.0 % (2134 VL sans benchmark sur 2134)
[OK   ] C6.MAROC     Couverture indRef MAROC
             99.5 % (2923 VL sans benchmark sur 553789)
[OK   ] C6.NIGERIA   Couverture indRef NIGERIA
             100.0 % (0 VL sans benchmark sur 77930)
[OK   ] C6.TUNISIE   Couverture indRef TUNISIE
             100.0 % (0 VL sans benchmark sur 307311)
[OK   ] C6.UEMOA     Couverture indRef UEMOA
             100.0 % (0 VL sans benchmark sur 47581)

9/16 controles OK — 5 echec(s) critique(s), 2 alerte(s).

Un echec critique signifie que la production contredit ce que la
documentation affirme. Corriger la production OU corriger le document,
puis consigner dans SUIVI.md > POINT DE REPRISE COURANT.
```

## Comment lire ce rapport

- `OK` : l'invariant tient.
- `ECHEC` : contradiction **critique** entre la production et ce qui est documente.
  Corriger l'un ou l'autre, puis consigner dans `SUIVI.md` > POINT DE REPRISE COURANT.
- `ALERTE` : ecart connu et tolere (CEMAC sans pipeline, Nigeria tributaire du
  rythme de publication de la SEC). A surveiller, pas a corriger dans l'urgence.

Detail des controles et seuils : `scripts/diag/check_doc_drift.js`.
