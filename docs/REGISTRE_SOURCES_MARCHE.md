# Registre des sources institutionnelles de marche — UEMOA, CEMAC, Maroc

> **Livrable 1** du mandat du 2026-10-30 (decisions 1, 2 et 4).
> Mesure du **2026-10-30**, depuis une session Claude Code.
> Rejouable par `python3 scripts/diag/registre_sources_marche.py`.

## Ce que ce document est, et ce qu'il n'est pas

Il enregistre ce que chaque source **a repondu**, pas ce qu'elle promet. Chaque
ligne vient d'une requete HTTP reelle, horodatee.

**Il ne prouve pas** :

- qu'un code 200 implique la presence des donnees voulues ;
- que le nombre de tableaux, de liens CSV/XLS ou de PDF mesure la **profondeur
  d'historique extractible** — il mesure la structure offerte ;
- que la plage d'annees detectee soit une couverture certifiee : elle vient des
  dates visibles dans le HTML et ne donne qu'un ordre de grandeur.

Le mandat l'exige explicitement : « la publication d'une archive ne suffit pas a
certifier que toutes ses annees ont ete extraites ou normalisees ». La
profondeur par serie, instrument et maturite releve du livrable 2.

**A REJOUER DEPUIS S2.** Le reseau du serveur de production peut differer :
`BENCHMARKS_F3_MAPPING_SCHEMA.md` note deja une source « injoignable
datacenter ». Une source accessible depuis une session n'est pas forcement
accessible la ou tourne la collecte.

## Resultat — 23 sources sur 25 repondent 200

Legende : `tbl` = tableaux HTML · `csv` = liens CSV/XLS/XLSX · `pdf` = liens PDF

### UEMOA

| Famille | Fournisseur | Libelle | Code | Octets | tbl | csv | pdf | Annees vues |
|---|---|---|---|---|---|---|---|---|
| monetaire | BCEAO | Portail | 200 | 150 945 | 1 | 0 | 16 | 2023 |
| monetaire | BCEAO | Evolution marche interbancaire | 200 | 127 323 | 0 | 0 | **25** | — |
| monetaire | BCEAO | Operations marche interbancaire | 200 | 128 475 | 0 | 0 | **25** | — |
| obligataire | UMOA-Titres | Portail | 200 | 54 711 | 11 | 0 | 0 | 2026 |
| obligataire | UMOA-Titres | **Courbe des taux** | 200 | 61 122 | 11 | **702** | 1 | 2026 |
| actions | BRVM | Portail | 200 | 13 370 | 5 | 0 | 0 | — |
| actions | BRVM | Indices | 200 | 9 726 | 6 | 0 | 0 | — |
| obligataire | BRVM | Marche des obligations | 200 | 11 288 | 5 | 0 | 4 | — |
| actions | BRVM | Donnees fin de journee | 200 | 9 701 | 3 | 0 | 0 | — |
| actions | BRVM | **Base financiere `bfin`** | 200 | 448 894 | **33** | 0 | 0 | **2000-2026** |

### CEMAC

| Famille | Fournisseur | Libelle | Code | Octets | tbl | csv | pdf | Annees vues |
|---|---|---|---|---|---|---|---|---|
| monetaire | BEAC | Portail | 200 | 41 643 | 0 | 0 | **392** | 2025-2026 |
| monetaire | BEAC | Stats marche monetaire | 200 | 21 144 | 1 | **11** | 4 | — |
| monetaire | BEAC | Base BDEMF (presentation) | 200 | 20 579 | 0 | 0 | 1 | — |
| monetaire | BEAC | **Base BDEMF (acces)** | 200 | **1 349** | 0 | 0 | 0 | — |
| obligataire | BEAC | Stats titres publics | 200 | 27 169 | 1 | **10** | 268 | — |
| obligataire | BEAC | Marche des titres publics | 200 | 20 733 | 0 | 0 | 0 | — |
| obligataire | BEAC | Annonces et communiques | 200 | 45 702 | 1 | 0 | **1 007** | — |
| actions | BVMAC | Portail | 200 | 29 040 | 0 | 0 | 5 | 2025 |

### Maroc

| Famille | Fournisseur | Libelle | Code | Octets | tbl | csv | pdf | Annees vues |
|---|---|---|---|---|---|---|---|---|
| monetaire | BKAM | MONIA | 200 | 23 854 | 1 | 0 | 1 | 2026 |
| monetaire | BKAM | Marche monetaire interbancaire | 200 | 28 559 | 1 | 0 | 0 | 2026 |
| obligataire | BKAM | Methodologie courbe BDT | 200 | 188 752 | — | — | — | PDF |
| actions | Casablanca | Indices (market-data) | **000** | 0 | — | — | — | **ECHEC** |
| actions | Casablanca | Indices (live-market) | **000** | 0 | — | — | — | **ECHEC** |
| macro | MEF | Portail | 200 | 30 193 | 0 | 0 | 9 | 2024-2026 |
| macro | HCP | Portail | 200 | 12 761 | 14 | 0 | 0 | 2026 |

## Ce que la mesure change dans l'approche

### 1. UMOA-Titres est structuree — pas de PDF a eplucher

**702 liens CSV/XLS** sur la seule page « Courbe des taux ». L'obligataire UEMOA
n'exige donc pas l'extraction de tableaux PDF que le mandat prevoyait en
secours. **A verifier avant de s'en rejouir** : que ces liens portent bien des
courbes et des resultats d'adjudication, et non des documents annexes.

### 2. BRVM `bfin` porte un historique profond

33 tableaux, dates de **2000 a 2026**. C'est aussi la source que
`scrape_indices_daily.js` utilise deja pour le BRVM Composite, par un
telechargement de PDF BOC journalier — **une voie de collecte existe donc deja**
et ne doit pas etre reconstruite.

### 3. BEAC offre du CSV, mais sa base n'est pas accessible directement

11 liens CSV sur le marche monetaire, 10 sur les titres publics : exploitable.
Mais la page d'**acces** a la base BDEMF ne rend que **1 349 octets** — une page
quasi vide. Le mandat signalait que « ses conditions et son fonctionnement
technique doivent etre verifies » : la mesure confirme qu'il y a la une marche a
instruire avant d'annoncer la BDEMF comme source exploitable.

### 4. Casablanca est le seul blocage, et il est deja contourne

Les deux URL d'indices rendent **000** — echec de connexion, non un refus HTTP.
Mais le MASI **est deja collecte** : `diag_test_masi_ft_dryrun.js` montre
`SUCCESS via FT markets MASI:CAS`, et `medias24` y rend 403. Une voie de secours
fonctionne donc, et la panne de casablanca-bourse.com n'empeche pas la
collecte du MASI aujourd'hui.

**Ne pas en conclure que la source officielle est inutile** : FT est un
intermediaire, pas l'emetteur. Pour une serie financiere publiee, la source
officielle reste preferable des qu'elle redevient joignable.

## Statut de collecte — ce qui existe DEJA, a ne pas reconstruire

Releve dans le code, non suppose :

| Serie | Collecteur existant | Dernier point mesure |
|---|---|---|
| MASI | `scrape_indices_daily.js` → FT markets | **2026-10-27** (1 j) |
| Tunindex | idem | **2026-10-27** |
| NSE All Share | idem | **2026-10-27** |
| BRVM Composite | idem (PDF BOC `bfin`) | **2026-10-27** |
| MONIA | idem, fonction `scrapeMONIA` | **2026-05-14** — scraper en echec |

**MONIA est le seul des cinq qui soit en panne**, et sa cause est etablie
(lot DA de `SUIVI.md`) : le parseur exige une egalite stricte de date alors que
MONIA du jour J est publie en J+1 — et l'insertion etant indexee sur la date
demandee, relacher l'egalite seule **fabriquerait** un point de donnee.

## Points ouverts, et a qui ils reviennent

| # | Point | Qui |
|---|---|---|
| 1 | `Patricked-code/africafunds-market-data-pipeline` : **« you don't have access »**. Le mandat en fait le prealable de la decision 4 — « examiner les composants avant tout nouveau developpement ». | **Proprietaire** : accorder l'acces |
| 2 | `chainsolutions-wealthtech/front` : **1 seul fichier**, un README du 2026-07-08 disant « depot cible **prepare pour recevoir** la migration ». La migration n'a pas eu lieu ; la production tourne depuis `Wealthtechinnovations/front_end_opcvm`. | **Proprietaire** : confirmer si la migration doit etre engagee, et quand |
| 3 | Profondeur d'historique par serie, instrument et maturite | livrable 2, mesure a conduire |
| 4 | Conditions d'acces reelles a la BDEMF de la BEAC | a instruire |
| 5 | Rejouer ce registre **depuis S2** | a conduire |

## Journal des mesures

| Date | Depuis | Resultat |
|---|---|---|
| 2026-10-30 | session Claude Code | 23/25 a 200 ; Casablanca x2 en echec de connexion |
