# CHANTIER BENCHMARKS — F1 : Audit de l'existant (LECTURE SEULE)

> Genere le 2026-07-09 (agent d'audit, verifie sur code + PRODUCTION_STATE.json).
> Phase F1 du chantier « architecture benchmarks 3 couches » (cf. ROADMAP.md).
> AUCUNE modification effectuee. Toutes les affirmations sont sourcees file:line.

## 1. Liaison FONDS <-> INDICE

Colonnes porteuses :
- `fond_investissements` : `indice_benchmark` (src/models/fond.js:14), `indice` (:17), `pays` (:26), `indice_fundafrica` (:192), `indice_fundafrica_id` (:196).
- `valorisations` : `indice_name` (src/models/vl.js:52), `indRef` (:72), `indRef_EUR` (:76), `indRef_USD` (:80), `indice_comparaison` (:84 — **jamais ecrit, legacy**), `ID_indice` (:108), `base_100_InRef` (:60).

**Le mapping fonds->indice est decide PAR PAYS, code en dur** dans `INDEX_CONFIG`, **TRIPLIQUE** dans :
- scripts/scraper/scrape_indices_daily.js:64-106 (reference, 5 indices : BRVM, MASI, Tunindex, NSE, MONIA)
- scripts/scraper/propagate_indref_range.js:55-65 (copie)
- scripts/import/import_indices_excel.js:51-92 (copie)

Matching = egalite insensible a la casse entre `fund.pays` et `cfg.pays` (scrape:620-622, propagate:174-176, import:330-332).

Ecrivains de `valorisations.indRef/indice_name/ID_indice` : propagate_indref_range.js:205-206 ; scrape_indices_daily.js:674-675 (propagation quotidienne, matching ±7j :644-658) ; import_indices_excel.js:401-403 ; routes_vl.js uploadsfileindice (:6555-6575), ajoutVL (:6114-6116), ajoutIndice (:6236-6238).

Mapping PAR CATEGORIE (obligataire) = **SQL manuel hors code** : src/sql/REQUEQUES.sql:51-52, :99-104, :196-198, :54. Reference une table `indice_categorie` (:187-194) **sans modele Sequelize** — alimentee a la main.

## 2. Indices en base (`indice_references`)

Modele : src/models/indice.js (`id_indice` :12, `nom_indice` :16 — les deux NULLABLE).

Inserteurs actifs : scrape_indices_daily.js:559-565 (+ anti-overwrite :776-784) ; import_indices_excel.js:270-273, :249-252.

Inventaire prod (PRODUCTION_STATE.json:58-136) :
- **Vivants (scraper quotidien)** : BRVM Composite (-> 07-09), MASI (-> 06-25), NSE All Share (-> 06-25), Tunindex (-> 07-08), MONIA (-> 05-14 ; `pays:[]` = non propage aux fonds, scrape:102).
- **GELES, nom NULL/vide, AUCUN scraper** :
  - `Indice_monetaire_maroc` nom NULL (231 pts, max 2024-10-25) + doublon nom "INDICE MONETAIRE MAROC" (971 pts, max 2023-11-17)
  - `masi_all_shares` nom NULL (5689 pts, max **2024-10-28**) — **c'est l'« indice au nom vide » de l'audit fraicheur**
  - `S&P Tunisia Sovereign Bond Index` nom NULL (2556 pts, max 2024-03-01)
  - `Sovereign_bond_index` nom NULL (243 pts) + doublon nom "S&P Morocco Sovereign Bond Index" (2609 pts, max 2023-11-17)
- Ces indices geles ont ete inseres par SQL manuel / importeur retire : aucun `.js` actif ne les reference (grep : uniquement PRODUCTION_STATE.json, T13_DIAGNOSTIC_INDICES.md, src/sql/REQUEQUES.sql).
- Chemins code pouvant produire `id_indice=''` (routes_vl.js:6567, :6243) : **commentes** (:6599-6633, :6267-6294) = morts.

## 3. Taux sans risque / Sharpe / Sortino / VAR

Tout dans src/routes/apigestionratios.js (fonctions de src/functions/newratios.js, importees :98).

**TSR_DEFAULTS code en dur** (apigestionratios.js:159-165) :
`MAROC 0.0275 | NIGERIA 0.275 | TUNISIE 0.08 | UEMOA 0.035 | CEMAC 0.05`

Resolution (apigestionratios.js:355-364) :
1. table `tsrhisto` (moyenne `value` par pays MAJUSCULES, :167-225) -> `tauxsr = tsr/100` (:358)
2. sinon `TSR_DEFAULTS[pays] || 0.01420` (:360, :363) — **fallback final 1,42 %**.
- Table `taux_sans_risques` interrogee :378 mais **resultat jamais reutilise** = code mort.
- **Override en dur `tauxsr = -0.0234`** dans DEUX routes (:2050, :2253) — ignorent la logique pays.

Formules :
- Sharpe : `(CAGR - tauxsr) / volatilite` — :549-551, :868-870, :1151-1153, :2177-2179 ; volatilite annualisee x sqrt(52) (:133).
- **Sortino : `calculateSortinoRatio(returns, tauxsr, 0.01)` MAIS la fonction (newratios.js:50-66) ne prend que 2 arguments -> le MAR `0.01` est IGNORE, seuil effectif = 0.** (Directement pertinent pour la regle MAR du chantier.)
- VAR95/99 : percentile historique sans TSR (newratios.js:68-86) ; NB `sort()` **mute le tableau d'entree**.

## 4. Conversion benchmark EUR/USD

Regle unique = DIVISION `indRef / taux(paire, date)`, taux de `devisedechanges` :
- recalc_eur_usd_daily_rate.js : indRef_EUR :273, indRef_USD :274 ; **parite CFA fixe 655.957** (:44-45, :238-243) ; **fallback EUR/USD = 1.08 code en dur** (:223, :242, :255, :259) ; ne traite que active=1 (:105).
- import_indices_excel.js:520-521 ; routes_vl.js (:6574-6575, :6115-6116, :6237-6238) — **routes_vl SANS gestion de la parite CFA fixe** (incoherence connue, T13:72).
- Lecture : apigestionfonds.js valLiqdev (:615 choix champ, :640-641 base 100 a la volee).

## 5. Table `rendements` (~1,09 M lignes)

Ecrite par apigestionrendement.js (:137, :212, :228) et scripts/fix/fix_populate_rendements.js. **LUE NULLE PART** (aucun findAll/findOne ; absente de clickhouse-sync). Les ratios recalculent les rendements a la volee depuis `valorisations`. => **table orpheline en lecture** (candidate a reutilisation ou dette).

## 6. Frontend — affichage benchmark

- FundView.tsx:738-747 : **exactement 2 series** (fonds + UN benchmark, donnees `item.InRef`). Meme schema summary-eur / summary-usd (FundSubView.tsx).
- **Aucune notion de 2e benchmark ni de benchmark Afrique en serie** (grep indice2|benchmark2|africaBenchmark|indRef2|secondBenchmark = 0). La dimension FundAfrica n'existe qu'en libelles/classements (FundView.tsx:225, :1343-1346, :2166).

## 7. Feature flags / referentiel reutilisable

- Pas de table settings ; config = env vars. **Patron a cloner : `CLICKHOUSE_ENABLED`** (src/db/clickhouse.js:4-14) -> ex. `BENCHMARK_AFRICA_ENABLED`.
- **DECOUVERTE CLE : le squelette 3 couches EXISTE DEJA en base referentiel (non cable aux series)** : `ref_indices_fundafrica` (**137 indices**, seed scripts/seed/seed_referentiel_fundafrica.js depuis referentiel_fundafrica.json) + `ref_categories_fundafrica` (140).
  - `NIVEAU_CATEGORIE` : LOCAL 120 / REGIONAL 12 / GLOBAL_AFRIQUE 5.
  - Champs : `NOM_INDICE_USD_OU_BASE`, `NOM_INDICE_EUR`, `DEVISE_BASE_INDICE`, `REGLE_CONVERSION`, `UTILISATION_PAGE_LOCALE/EUR/USD`, `STATUT_INDICE`.
  - Statuts : 30 VALIDATED_OR_TO_VERIFY ; 34 COMPOSITE_TO_BUILD ; 34 RATE_TO_DEFINE ; 24 MISSING_OR_TO_VERIFY ; 15 MISSING_BENCHMARK.
  - Seul le label LOCAL est reporte sur les fonds (scripts/seed/lot3_indice_fundafrica.js). Aucune serie temporelle REGIONAL/GLOBAL_AFRIQUE.

## 8. Hypotheses en dur dangereuses (resume)

1. INDEX_CONFIG x3 (divergence de casse reelle : `TUNINDEX` import vs `Tunindex` scraper).
2. Mapping pays-only : UEMOA non matche (couverture indRef 22 %, T13:114-140), **CEMAC 0 %**.
3. TSR_DEFAULTS avec cles regions (UEMOA/CEMAC) jamais matchees par un nom de pays -> fallback 1,42 % ; NIGERIA 27,5 % ; override -0,0234 en dur.
4. EUR/USD 1.08 en dur ; CFA 655.957 absent du chemin routes_vl.
5. Indices obligataires/monetaires geles, alimentes par SQL manuel + table `indice_categorie` non suivie.
6. Incoherences multiplication/division residuelles sur certains chemins routes_vl (T13:287-290).
7. Lien fonds->indice par egalite de chaine STRING(255) libre, sans cle etrangere.

## Synthese « avant modification »

**EXISTANT exploitable** : indRef national + conversions par fonds (division) pour BRVM/MASI/NSE/Tunindex ; MONIA (taux) ; referentiel 3 couches structure mais inerte (30/137 valides).

**MANQUANT** : series indice converties EUR/USD au niveau INDICE (la conversion n'existe que par fonds dans valorisations) ; series REGIONAL et GLOBAL_AFRIQUE (107/137 non sourcees) ; indices CEMAC ; obligataire/monetaire a jour ; 2e courbe frontend.

**RISQUES DE REGRESSION pour le chantier** :
- Toucher INDEX_CONFIG sans synchroniser les 3 copies casse propagation + import.
- Reutiliser `valorisations.indRef` pour les couches 2/3 **ecraserait** le benchmark national -> NOUVELLES colonnes ou nouvelle table series indice, jamais indRef.
- Le recalc nocturne (active=1) reecrit _EUR/_USD : tout nouveau champ doit y etre integre.
- `indice_comparaison` + table `rendements` = surfaces mortes, ne pas s'appuyer dessus sans reactivation explicite.
- Frontend lit `item.InRef` en dur : 2e serie = modifier FundView.tsx:738-747 + payloads valLiq/valLiqdev (additif).

**POINT D'ENTREE RECOMMANDE** : patron `CLICKHOUSE_ENABLED` + referentiel `ref_indices_fundafrica` (niveaux + REGLE_CONVERSION + STATUT_INDICE) comme cartographie canonique des 3 couches. Nouvelle table de series par indice (ex. `benchmark_series` : indicator_code, scope, devise, valeur, as_of_date, source, is_official, is_synthetic, status...) conformement au complement obligatoire.

## Prochaines phases

- **F2 (en attente)** : matrice sources en ligne Maroc/Tunisie/Nigeria/Afrique-S&P/BCE (4 niveaux : identifiee/accessible/backfillable/integree). 2 agents a relancer.
- F3 : mapping pays x categorie x devise x couche + plan schema (s'appuyer sur ref_indices_fundafrica).
- F4 : adapters + statuts structures + last-available<=date + feature flags.
- F5 : tests + backfill + prod progressive.
