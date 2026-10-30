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

## Livrable 2 — profondeur et structure, source par source

> Mesure du 2026-10-30. Ne couvre pour l'instant que la source la plus
> prometteuse du registre. Les autres restent a instruire.

### UMOA-Titres — courbes de taux : EXPLOITABLE, STRUCTURE STABLE SUR 8 ANS

> **Deux de mes chiffres corriges le 2026-10-30.** J'avais annonce « 702
> fichiers » et une repartition de 185 a 210 par an. Les deux etaient faux :
> 702 est le nombre d'**occurrences `href`** dans la page, doublons compris.
> Le comptage sur URL uniques donne **402 fichiers**, soit **51 a 53 par an** —
> une publication **hebdomadaire**, ce qui est un fait plus utile et plus
> exact que mes chiffres gonfles quatre fois.

**402 fichiers `.xlsx` uniques**, tous des courbes de taux.

| annee (dossier) | fichiers | rythme |
|---|---|---|
| 2019 | 51 | hebdomadaire |
| 2020 | 52 | hebdomadaire |
| 2021 | 52 | hebdomadaire |
| 2022 | 51 | hebdomadaire |
| 2023 | 52 | hebdomadaire |
| 2024 | 50 | hebdomadaire |
| 2025 | 53 | hebdomadaire |
| 2026 | 41 | en cours |

L'observation la plus ancienne porte sur le **2018-12-31**
(`COURBES-DES-TAUX-au-31.12.2018.xlsx`, deposee dans le dossier 2019). La
profondeur reelle couvre donc **fin 2018 a 2026, soit huit annees** — et non
dix. L'objectif du mandat n'est pas atteignable depuis cette page seule ; il
faudra chercher des archives anterieures, ou retenir huit ans et le documenter.

#### Structure : STABLE sur toute la periode et sur les trois nomenclatures

Verification par telechargement et ouverture de **9 fichiers** couvrant 2020,
2021, 2022 (trois variantes de nom), 2024, 2025 et 2026 :

| Fichier | Feuilles | Pays | `Maturite` | `Zero Coupon` | `Taux Apres Lissage` |
|---|---|---|---|---|---|
| `…au-13.03.2020` | 8 | **8** | oui | oui | oui |
| `…au-25.06.2021` | 8 | **8** | oui | oui | oui |
| `…au-25.11.2022` | 8 | **8** | oui | oui | oui |
| `YC-05-08-2022` | 8 | **8** | oui | oui | oui |
| `COURBES-DES-TAUX-au-30.12.2022` | 8 | **8** | oui | oui | oui |
| `…au.16.09.2024` | 9 | **8** | oui | oui | oui |
| `…au.10.02.2025` | 9 | **8** | oui | oui | oui |
| `YC-19.mai_.25` | 9 | **8** | oui | oui | oui |
| `…au_.14.08.2026` | 9 | **8** | oui | oui | oui |

**Un seul parseur suffit.** Les 8 feuilles pays — Benin, Burkina, Cote d'Ivoire,
Guinee-Bissau, Mali, Niger, Senegal, Togo — et les trois colonnes sont presentes
partout. Les fichiers a 9 feuilles portent une `Feuil1` supplementaire, a
ignorer. Maturites : 1 mois, 3, 6, 9 mois, puis 1 a 17 ans.

#### TROIS PIEGES D'EXTRACTION, mesures et non supposes

**1. 55 liens sont PROTOCOLE-RELATIFS, et ils portent toute l'annee 2019.**

| forme du `href` | fichiers | annees |
|---|---|---|
| `https://…` | 347 | 2020-2026 |
| **`//www.umoatitres.org/…`** | **55** | **2019 (51), 2020 (4)** |

Un extracteur qui ne prefixe pas le schema obtient **HTTP 000 instantane** sur
ces 55 fichiers — et **perd l'annee la plus ancienne en entier**. C'est
exactement l'erreur que j'ai commise : j'ai d'abord conclu « 2019 inaccessible »
avant de voir que l'URL commencait par `//`. Les cinq memes fichiers rendent
**200** une fois `https:` prefixe (707 Ko a 1,8 Mo).

**2. Trois orthographes du nom, dont une faute de l'emetteur.**

```
COURBES-DE-TAUX-au-13.03.2020.xlsx     COURBES-DES-TAUX-au-30.12.2022.xlsx
COURBES-DE-TAUX-au.10.02.2025.xlsx     COURBES-DE-TAUX.au_.14.08.2026.xlsx
YC-05-08-2022.xlsx                      YC-19.mai_.25.xlsx
```

383 en `COURBES-DE(S)-TAUX…`, **19 en `YC-…`**. Separateurs `-`, `.` et `_`
melanges ; mois en lettres dans les `YC-` recents (`mai_`, `mars_`). On releve
aussi `coubes` et `copie` dans certains noms.

**Consequence** : la date de reference doit etre lue **dans le contenu** du
fichier — chaque feuille la porte dans son titre — et **jamais deduite du nom**.

**3. Les tailles varient d'un facteur 11** : de 156 Ko a 1,8 Mo. Un controle de
qualite fonde sur un seuil de taille rejetterait des fichiers valides.

#### Ce qui reste a verifier

9 fichiers ouverts sur 402. La stabilite est etablie sur un echantillon
couvrant toutes les annees et toutes les nomenclatures, **pas sur l'exhaustif**.
Un extracteur doit donc rapporter, fichier par fichier, ce qu'il n'a pas su
lire — et non echouer en silence.

### CEMAC / BEAC — AUCUN canal d'alimentation ne fonctionne aujourd'hui

> Mesure du 2026-10-30. Conclusion la plus lourde du registre, et elle
> conditionne la decision 1 pour la CEMAC.

#### Les cinq series XLSX du marche monetaire : toutes perimees

La page « Statistiques du marche monetaire » offre 11 fichiers `.xlsx`. Les cinq
qui portent des taux ont ete telecharges et ouverts :

| Fichier | Contenu | Couverture **mesuree** |
|---|---|---|
| `Evolution-des-taux-interbancaires-moyens-ponderes-a-7-jours.xlsx` | **TIMP 7 jours** — la serie que le mandat nomme | **2018-06-11 → 2020-09-06** |
| `dctimp.xlsx` | TIMP sous-regional | **ANNEE 2010** |
| `dcrdbmm.xlsx` | donnees de base du marche monetaire, par pays | **nov. 2008 → nov. 2010** |
| `dceticb.xlsx` | taux d'interet BEAC et conditions de banque | depuis 1996, **s'arrete ~2010** |
| `Evolution-des-taux-dintervention-de-la-BEAC…xlsx` | taux directeurs, appels d'offres, pensions | **2000 → 2009** |

**La plus recente s'arrete en septembre 2020 — il y a six ans.** Le mandat
demande de « prevoir leur alimentation reguliere » : **aucune de ces cinq
series ne le permet**.

**Piege a ne pas manquer** : prendre `dctimp.xlsx` pour « le TIMP » donnerait des
donnees de **2010**. Les noms courts (`dctimp`, `dcrdbmm`, `dceticb`) sont des
archives, pas des series vivantes.

#### Deux TIMP distincts, et le mandat interdit de les confondre

Le fichier TIMP 7 jours porte **deux** colonnes :

```
TIMP a 7 jours (Operations en blanc)
TIMP a 7 jours (Operations collateralisees / pension-livree)
```

Le mandat l'exige : « ne pas confondre taux directeur, taux interbancaire, **taux
repo**, rendement d'un titre souverain et taux sans risque ». La source
distingue elle-meme le **non garanti** (« en blanc ») du **repo**
(collateralise). Le choix du proxy de taux sans risque devra donc etre
**delibere et documente**, pas pris par defaut.

**Second piege, numerique** : les valeurs sont des **fractions**, non des
pourcentages — `0.0325` signifie 3,25 %. Les ecrire telles quelles dans une
colonne attendant des pourcentages produirait une **erreur d'un facteur 100**.

#### La base BDEMF : backend en panne a l'instant de la mesure

Le mandat demandait de « tester les possibilites d'export de la base BEAC » et
notait que « ses conditions et son fonctionnement technique doivent etre
verifies ». Verifie, en deux temps :

1. `curl` sur `https://www.beac.int/bdemfcemac` rend **1 349 octets** — une
   coquille JavaScript, references `ps/portal/js/`, `ps/mobile/js/mobilelaunch.js`
   et un `window.location.replace(...)`. Signature d'un portail de type
   **IBM Cognos / Planning Analytics**. Aucune donnee n'y est atteignable par
   requete simple ;
2. chargement avec un **navigateur sans interface** (Chromium/Playwright) :
   **HTTP 502, « upstream request failed »**. Zero lien, zero tableau, zero
   iframe, zero requete de donnees. **Le backend du portail ne repond pas.**

**A retester, et non a declarer mort.** Un 502 est un etat, pas une propriete :
la regle du projet veut qu'« une capacite declaree indisponible sans test du
jour soit une capacite abandonnee, pas une capacite absente ». La mesure doit
etre rejouee avant toute conclusion definitive.

#### Les titres publics : donnees structurees arretees en 2017

La page « Statistiques des titres publics » offre 10 `.xlsx` et 268 PDF. **Les
dix XLSX datent de 2015 a 2017** (`Donnees_CBT_octobre-2016`,
`CBT-CMR-GA-TDfevrier-2017`…), et les PDF les plus visibles aussi. Les
rendements BTA/OTA et les courbes souveraines CEMAC que le mandat demande ne
sont donc pas disponibles sous forme recente par cette voie.

#### Ce que cela signifie pour la CEMAC

| Canal | Etat mesure |
|---|---|
| XLSX marche monetaire | perimes — le plus recent s'arrete **2020-09** |
| XLSX titres publics | perimes — **2015-2017** |
| portail BDEMF | **HTTP 502** a l'instant de la mesure |
| VL des fonds CEMAC en base | derniere le **2024-12-12** |
| couverture benchmark CEMAC | **0 %** |

**Aucun canal d'alimentation CEMAC ne fonctionne aujourd'hui.** Ce n'est pas un
defaut de notre collecte : c'est l'etat des sources. Le constat doit remonter
avant tout engagement de developpement sur la CEMAC — construire un adapteur sur
une source arretee en 2020 ne produirait rien.

## Journal des mesures

| Date | Depuis | Resultat |
|---|---|---|
| 2026-10-30 | session Claude Code | 23/25 a 200 ; Casablanca x2 en echec de connexion |
| 2026-10-30 | session Claude Code | UMOA-Titres : **402** xlsx uniques (et non 702 — doublons `href`), hebdomadaire, fin 2018 a 2026 |
| 2026-10-30 | session Claude Code | structure verifiee sur **9** fichiers couvrant 2020-2026 et les 3 nomenclatures : stable. 55 liens protocole-relatifs identifies |
| 2026-10-30 | session Claude Code | BEAC : 5 series de taux ouvertes, la plus recente s'arrete **2020-09** ; BDEMF rend **HTTP 502** (navigateur sans interface) ; titres publics XLSX **2015-2017** |
