# Etat de production verifie automatiquement

> **Fichier genere par le workflow `doc-drift.yml`. Ne pas modifier a la main.**
> Il contient l'etat de la production **mesure**, pas l'etat **affirme** par la
> documentation. En cas de contradiction avec un autre .md, c'est ce fichier qui
> fait foi : les autres decrivent ce qu'on croyait vrai a leur date de redaction.

Derniere verification : **2026-10-27 11:58 UTC**

```

=== BOUCLE DE CONTROLE — DERIVE DOCUMENTATION / PRODUCTION ===

[OK   ] C1           Cache datejour synchronise avec la derniere VL
             aucun ecart
[ECHEC] C2           Aucune performance orpheline en tete de serie
             performences:12, performences_eurs:23, performences_usds:23 fonds dont la perf la plus recente porte une date sans VL — c'est elle que l'API sert. Instruire fonds par fonds AVANT toute suppression.
[ECHEC] C3           Aucune performance recente au-dela de 500 %
             [1141] AFRINVEST DOLLAR FUND (NIGERIA) YTD 143958 % au Fri Jul 10 | [1196] EMERGING AFRICA EUROBOND FUND (NIGERIA) YTD 9339 % au Fri Jul 10 | [2743] APEL WEALTH MONEY MARKET FUND (NIGERIA) YTD 809 % au Fri Jul 10 | [757] FCP MAROC CREANCES (MAROC) YTD 586 % au Mon Oct 19
[ALERTE] C4.CEMAC     Fraicheur VL CEMAC (budget 400 j)
             derniere VL Thu Dec 12, soit 684 j
[OK   ] C4.MAROC     Fraicheur VL MAROC (budget 6 j)
             derniere VL Fri Oct 23, soit 4 j
[ECHEC] C4.NIGERIA   Fraicheur VL NIGERIA (budget 14 j)
             derniere VL Fri Oct 09, soit 18 j
[OK   ] C4.TUNISIE   Fraicheur VL TUNISIE (budget 9 j)
             derniere VL Mon Oct 26, soit 1 j
[OK   ] C4.UEMOA     Fraicheur VL UEMOA (budget 6 j)
             derniere VL Fri Oct 23, soit 4 j
[OK   ] C5           Snapshot production runtime frais (< 6 h)
             runtime: genere le 2026-10-27T11:00, soit 0.9 h
[ECHEC] C7           Aucune serie de VL melangeant deux echelles (12 mois)
             [2592] FCP BRIDGE EQUILIBRE (UEMOA/XOF) 5067x [8775.53 .. 44467985] | [1239] NOVA DOLLAR FIXED INCOME FUND (NIGERIA/NGN) 1536x [1.26 .. 1935] | [2809] MYRTLE DOLLAR SHIELD FUND (NIGERIA/USD) 1535x [1.00 .. 1535] | [2773] GUARANTY TRUST DOLLAR FUND (NIGERIA/USD) 1531x [100.00 .. 153145] | [2766] COMERCIO PARTNERS DOLLAR FUND (NIGERIA/USD) 1524x [1.09 .. 1662] | [2774] MERISTEM DOLLAR FUND (NIGERIA/USD) 1499x [10.65 .. 15963] | [2771] CORONATION DOLLAR FUND (NIGERIA/USD) 1495x [1.01 .. 1504] | [2768] FSL EUROBOND FUND (NIGERIA/NGN) 1481x [1.00 .. 1481] | [2775] PARTHIAN DOLLAR FIXED INCOME F (NIGERIA/USD) 1472x [1.08 .. 1593] | [1141] AFRINVEST DOLLAR FUND (NIGERIA/NGN) 1467x [114.47 .. 167885] | [2772] GREENWICH FIXED INCOME DOLLAR  (NIGERIA/USD) 1457x [1.05 .. 1523] | [2856] LEAD DOLLAR FIXED INCOME FUND (NIGERIA/NGN) 1455x [1.15 .. 1673] | [2777] VETIVA USD FIXED INCOME FUND (NIGERIA/USD) 1452x [1.16 .. 1684] | [2778] ZEDCREST DOLLAR FUND (NIGERIA/USD) 1426x [1.53 .. 2182] | [2765] CARDINALSTONE DOLLAR FUND (NIGERIA/USD) 1425x [1.26 .. 1799]
[ECHEC] C8           Les performances suivent les VL
             MAROC : 11/646 a jour (1.7 %), retard moyen 2.8 j | TUNISIE : 5/131 a jour (3.8 %), retard moyen 4.8 j — VL fraiches mais performances perimees : le site affiche des chiffres plausibles et faux
[ALERTE] C6.CEMAC     Couverture indRef CEMAC
             0.0 % (2134 VL sans benchmark sur 2134)
[OK   ] C6.MAROC     Couverture indRef MAROC
             98.0 % (11192 VL sans benchmark sur 571081)
[OK   ] C6.NIGERIA   Couverture indRef NIGERIA
             100.0 % (0 VL sans benchmark sur 78152)
[OK   ] C6.TUNISIE   Couverture indRef TUNISIE
             100.0 % (0 VL sans benchmark sur 312975)
[OK   ] C6.UEMOA     Couverture indRef UEMOA
             100.0 % (0 VL sans benchmark sur 48404)
[ALERTE] C9.MAROC     Couverture indRef des VL recentes MAROC (30 j)
             91.9 % (629 VL sans benchmark sur 7733 entrees en 30 j) — les VL neuves arrivent sans benchmark ; C6 ne peut pas le voir, son denominateur est tout l historique.
[OK   ] C9.NIGERIA   Couverture indRef des VL recentes NIGERIA (30 j)
             100.0 % (0 VL sans benchmark sur 54 entrees en 30 j)
[OK   ] C9.TUNISIE   Couverture indRef des VL recentes TUNISIE (30 j)
             100.0 % (0 VL sans benchmark sur 2388 entrees en 30 j)
[OK   ] C9.UEMOA     Couverture indRef des VL recentes UEMOA (30 j)
             100.0 % (0 VL sans benchmark sur 306 entrees en 30 j)
[OK   ] C10.MONIA    Fraicheur de l indice MONIA
             derniere valeur le Thu May 14, soit 166 j — non juge : aucune VL ne porte cet indice, ce n est pas un benchmark de fonds mais une statistique.
[OK   ] C10.NSE All Share Fraicheur de l indice NSE All Share
             derniere valeur le Fri Oct 23, soit 4 j (porte par 54147 VL)
[OK   ] C10.MASI     Fraicheur de l indice MASI
             derniere valeur le Mon Oct 26, soit 1 j (porte par 559889 VL)
[OK   ] C10.BRVM Composite Fraicheur de l indice BRVM Composite
             derniere valeur le Mon Oct 26, soit 1 j (porte par 45345 VL)
[OK   ] C10.Tunindex Fraicheur de l indice Tunindex
             derniere valeur le Mon Oct 26, soit 1 j (porte par 312975 VL)
[ALERTE] C11.classementfonds Fraicheur de reconstruction de classementfonds
             colonne `created_at` absente : l age du dernier recalcul est inconnaissable. Appliquer la migration 20261007000001-add-rebuild-timestamps-classementfonds.js (ADD COLUMN seul, aucune ligne metier touchee).
[ALERTE] C11.classementfonds_eurs Fraicheur de reconstruction de classementfonds_eurs
             colonne `created_at` absente : l age du dernier recalcul est inconnaissable. Appliquer la migration 20261007000001-add-rebuild-timestamps-classementfonds.js (ADD COLUMN seul, aucune ligne metier touchee).
[ALERTE] C11.classementfonds_usds Fraicheur de reconstruction de classementfonds_usds
             colonne `created_at` absente : l age du dernier recalcul est inconnaissable. Appliquer la migration 20261007000001-add-rebuild-timestamps-classementfonds.js (ADD COLUMN seul, aucune ligne metier touchee).
[OK   ] C12.OBLIGATIONS MAROC Les rangs correspondent aux performances
             298/300 fonds au rang que leur performance stockee leur donne (99.3 %)
[OK   ] C12.DIVERSIFIE MAROC Les rangs correspondent aux performances
             129/143 fonds au rang que leur performance stockee leur donne (90.2 %)
[OK   ] C12.ACTIONS MAROC Les rangs correspondent aux performances
             123/123 fonds au rang que leur performance stockee leur donne (100.0 %)
[OK   ] C12.OBLIGATIONS NIGERIA Les rangs correspondent aux performances
             87/87 fonds au rang que leur performance stockee leur donne (100.0 %)
[OK   ] C12.DIVERSIFIE TUNISIE Les rangs correspondent aux performances
             70/70 fonds au rang que leur performance stockee leur donne (100.0 %)

22/33 controles OK — 5 echec(s) critique(s), 6 alerte(s).

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
