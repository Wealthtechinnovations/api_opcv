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
| monetaire | BEAC | **BDEMF, navigateur sans interface** | **502** (retest 2026-10-30) | 174 | 0 | 0 | 0 | — |
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

#### Mesure du 2026-10-30 : la regle est INSATISFIABLE, pas seulement stricte

Lecture directe de la page BKAM, le **30 octobre**. Les dix seances offertes,
avec leurs **deux** dates :

| date de reference | date de publication | MONIA |
|---|---|---|
| **28/10/2026** | 29/10/2026 | 2,171 % |
| 27/10/2026 | 28/10/2026 | 2,198 % |
| 26/10/2026 | 27/10/2026 | 2,184 % |
| **23/10/2026** (vendredi) | **26/10/2026** (lundi) | 2,177 % |
| 22/10/2026 | 23/10/2026 | 2,169 % |

**La reference la plus recente est le 28 octobre, lue le 30.** Un collecteur
lance avec `targetDate = aujourd'hui` ne peut donc **jamais** trouver de ligne :
la condition `iso === targetDate` de `parseMoniaHtml()` n'est pas trop stricte,
elle est **insatisfiable par construction**. Ce n'est pas un reglage a assouplir
mais une regle a remplacer.

**Et « J-1 » ne suffit pas non plus** : les dates de reference sautent les
week-ends — vendredi 23/10 publie le lundi 26/10. Un lundi, `targetDate = J-1`
tombe sur un dimanche et echoue a son tour. **Seule la regle « derniere
reference a une date ≤ date cible » aboutit**, celle precisement retenue par
F3/M2.

**Point favorable, contrairement a la BCEAO** : la page porte les **deux** dates,
reference et publication, cote a cote. `publication_date` est donc reellement
disponible pour MONIA — ce que le mandat exige (« dates d'observation et de
publication distinctes ») est ici atteignable sans approximation.

**Ce que cette mesure ne resout PAS, et pourquoi rien n'est modifie ici.**
`parseMoniaHtml()` ne rend aujourd'hui que la **valeur** : la date de reference
lue est jetee avant d'atteindre l'appelant, qui insere sous la date demandee.
Relacher la comparaison sans faire remonter la date de reference ecrirait une
valeur sous une date qui n'est pas la sienne — **exactement ce que le mandat
interdit explicitement**. Le correctif est structurel : la fonction doit rendre
`{ valeur, date_de_reference, date_de_publication }` et l'insertion doit se
faire sous la date de reference. Il touche un script d'import en production :
diagnostic d'abord, modification ensuite, conformement a la regle des taches
sensibles.

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

### UEMOA / BCEAO — taux interbancaires par maturite : QUALIFIE ET EXPLOITABLE

> Mesure du 2026-10-30. C'est la source du **taux sans risque UEMOA**, et elle
> est en bien meilleur etat que son equivalent CEMAC.

#### Deux pages, deux natures a ne pas confondre

| Page | Nature | Utilite |
|---|---|---|
| « **Evolution** du marche interbancaire de l'UMOA » | **rapports ANNUELS** (« Situation … en 2021 », « … en 2022 ») | contexte, **pas** une serie |
| « **Operations** effectuees sur le marche interbancaire » | **PDF HEBDOMADAIRES** | **la serie exploitable** |

#### Profondeur mesuree : 2017-10 → 2026-10, neuf annees

- **27 pages** de listing (`?page=0` a `?page=26`). **391 documents**, mesure du
  2026-10-30 par `scripts/diag/recensement_bceao_interbancaire.py`, et non
  « ≈ 531 » comme l affirmait ce document.

  > **Correction d un chiffre de moi.** « ≈ 531 » etait une EXTRAPOLATION
  > (27 pages x ~20 liens), pas un comptage — elle surestimait de **26 %**. Le
  > recensement reel : 396 liens PDF distincts sur les 27 pages, moins les **5**
  > « Rapport sur la politique monetaire » de la barre laterale, presents
  > **27 fois chacun**. Ce sont exactement les cinq documents qui avaient fait
  > echouer l extracteur a sa premiere execution, et ils expliquent pourquoi
  > « 2022 » et « 2023 » apparaissaient sur toutes les pages du listing.
  > La mesure prime sur la prose, y compris sur la mienne.

- document le plus recent : « Semaine du 13 au 19 octobre 2026 » ;
- documents de la **derniere** page, dates lues **dans leur contenu** :
  « Semaine du 31 octobre au 06 novembre **2017** », « du 13 au 19 fevrier 2018 »,
  « du 20 au 26 fevrier 2018 ».

**Neuf annees de donnees hebdomadaires.** L'objectif de dix ans du mandat est
presque atteint, et de loin le meilleur des trois zones.

#### Contenu d'un document — exactement la liste du mandat

Extrait de « Semaine du 07 au 13 juillet 2026 », via `pdftotext -layout` :

| | UN JOUR | 1 SEM | 2 SEM | 1 MOIS | 3 MOIS | 6 / 9 / 12 MOIS |
|---|---|---|---|---|---|---|
| **Taux moyen pondere (%)** | **4,21** | 3,94 | 3,95 | 5,12 | 5,03 | **–** |
| Taux minimum (%) | 3,00 | 3,00 | 3,05 | 4,00 | 4,75 | – |
| Taux maximum (%) | 6,00 | 6,50 | 7,00 | 6,75 | 5,50 | – |

Plus les **volumes prets / emprunts par pays** pour les huit Etats et l'agregat
UMOA, en millions de FCFA.

Les huit maturites — un jour, une semaine, deux semaines, un mois, trois mois,
six mois, neuf mois, douze mois — correspondent **mot pour mot** a ce que le
mandat demande.

**Le taux moyen pondere AU JOUR LE JOUR est le candidat naturel au taux sans
risque overnight UEMOA.** Le mandat impose cependant de ne pas confondre les
natures : ce taux est une **moyenne de transactions interbancaires**, pas un taux
directeur BCEAO ni un rendement souverain. Le choix doit etre documente comme
tel.

**Extraction** : `pdftotext -layout` rend un tableau aligne et lisible. **Aucun
OCR n'est necessaire.**

#### SEPT PIEGES, mesures

**1. Le nom de fichier ne porte NI la date NI le type reel.** Les documents
anciens s'appellent `05-Situation des Prets interbancaires par maturites_0.pdf`,
`…-177.pdf` — sans aucune date — alors que leur contenu est bien
« Operations par maturites effectuees sur le marche interbancaire de l'UMOA ».
**Le nom mente sur le type autant que sur la date.** La date et la nature doivent
donc etre lues **dans le contenu**, systematiquement.

**2. Au moins quatre nomenclatures coexistent** :

```
01-Opérations-par-maturité-effectuées-du-7-au-13-juillet-2026.pdf
01 Opérations par maturité effectuées du 13 au 19 octobre 2026.pdf
01-Opérations-par-maturité-effectuées-sur-le-marché-interbancaire-de-l-UMOA-du-17-au-2….pdf
05-Situation des Prêts interbancaires par maturités_1.pdf
```

Accents encodes en URL (`Op%C3%A9rations`), separateurs espace / tiret /
soulignement melanges, suffixes `_0`, `_1`, `-177`.

**3. Le tiret « – » signifie AUCUNE TRANSACTION, jamais zero.** Les maturites 6,
9 et 12 mois sont vides sur la semaine mesuree. Le mandat l'exige : « ne jamais
assimiler une absence de transaction a une cotation valable ou a un rendement
observe ». Un `0` ecrit a la place d'un tiret serait une **valeur financiere
inventee**.

**4. Convention numerique OPPOSEE a celle de la BEAC.** Ici, pourcentages a
virgule decimale (`4,21`). A la BEAC, **fractions** (`0.0325` pour 3,25 %). Un
extracteur commun aux deux zones qui ne distingue pas les deux conventions
produirait une **erreur d'un facteur 100**.

**5. La date de PUBLICATION n'existe QUE sur les documents anciens.** Mesure du
2026-10-30, sur le document de 2026 et celui de 2017 :

| document | mention « Dakar, le … » | date de publication |
|---|---|---|
| semaine du 31 oct. au 06 nov. **2017** | `Dakar, le 10 novembre 2017` | **presente** |
| semaine du 07 au 13 juillet **2026** | **0 occurrence de « Dakar »** | **ABSENTE** |

Le format a change, et la direction emettrice avec lui : « Operations et
Activites Fiduciaires » en 2017, « Economie et Monnaie » en 2026. Le seul
millesime du PDF recent est `13 juillet 2026`, qui est la **fin de la semaine de
reference** — donc `as_of_date`, pas une date de publication.

Consequence pour M2, et elle est dictee par le mandat (« dates d'observation et
de publication distinctes ») : `publication_date` est renseignee quand elle
existe et vaut `NULL` sinon. Elle ne doit **PAS** etre deduite du chemin de
stockage de l'URL (`/sites/default/files/2026-07/`), qui porte un **mois** et
decrit **ou** le fichier est range, non **quand** il a ete publie. Quand la date
de publication n'est pas publiee, la reponse honnete est `NULL` : une
approximation inscrirait dans `benchmark_series` une date que la source n'a
jamais donnee.

**6. Trois orthographes fautives de l'emetteur, et deux espaces manquants.** Les
documents de fevrier 2025 ecrivent **`fevriérr`** — « fevrier » mal orthographie
a la source. Ceux de 2019 ecrivent **`juillet2019`**, sans espace avant l'annee,
y compris dans `au 1er juillet2019`. Un de janvier 2026 ecrit **`au12 janvier`**,
sans espace apres « au ». Une correspondance exacte rejetait **11 documents** —
dont quatre semaines consecutives de fevrier 2025, soit la forme exacte d'un faux
trou d'un mois **cree par la lecture, pas par la source**.

**7. Trois URL `.pdf` du portail rendent HTTP 404 avec une page HTML.** Ce sont
les trois `05-Situation des Prets interbancaires par maturites_{0,1,2}.pdf` de
`2022-04`. `curl` reussit (le serveur a bien repondu), et un controle fonde sur
le code de retour de `curl` les prend pour des PDF valides puis pour des
documents **illisibles** — diagnostic qui envoie chercher un probleme d'OCR
inexistant. **Le code HTTP doit etre verifie, pas le code de retour de `curl`.**
Ces 404 confirment au passage que l'extraction n'exige **aucun OCR** : le seul
cas « illisible » rencontre sur 391 documents n'etait pas un PDF.

#### La serie n'est PAS continue — 379 semaines sur ~465 attendues

> Mesure du 2026-10-30, les **391 documents ouverts un par un**, date lue dans
> le contenu. C'est le resultat le plus important de la qualification UEMOA, et
> il corrige ce document.

| Grandeur | Valeur **mesuree** |
|---|---|
| documents ouverts | **391** — 388 exploitables, **3 en HTTP 404** |
| semaines DISTINCTES datees | **379** |
| doublons de semaine | **9** (deux fichiers pour la meme semaine) |
| couverture | **2017-11-06 → 2026-10-19** |
| semaines attendues sur l'intervalle | ~465 |
| **manquantes** | **~86, soit 18 %** |
| trous de plus de 14 jours | **15**, le plus long **49 jours (7 semaines)** |

**2017 ne compte qu'UNE semaine**, suivie d'un trou de **105 jours**. Dire
« profondeur 2017-10 » est donc trompeur : le point de 2017 est isole. **Le debut
reellement continu est 2018-02-19.**

Semaines par annee — aucune annee n'atteint 52 :

```
2017 :  1     2020 : 42     2023 : 40     2026 : 37 (annee en cours)
2018 : 44     2021 : 48     2024 : 41
2019 : 48     2022 : 37     2025 : 41
```

**Ce que la mesure ne dit pas** : si les ~86 semaines absentes n'ont jamais ete
publiees, ou si elles existent hors de ce listing. Le listing en offre 379 ;
le reste est inconnu, et ne doit pas etre presume.

**CONSEQUENCE POUR LE CALCUL DE RISQUE, et elle est structurelle.** La regle
retenue par F3/M2 — « derniere valeur disponible a une date anterieure ou egale
a la date cible » — reste la bonne, et ces trous en sont la justification
chiffree. Mais ils en fixent aussi le **budget de peremption** : un taux sans
risque UEMOA peut etre **vieux de 49 jours** et rester le dernier publie. Un
Sharpe ou un Sortino calcule sur cette base herite de cette anciennete. Elle
doit etre **portee jusqu'a l'affichage** — `as_of_date` et le statut
`OK_PREVIOUS_AVAILABLE_DATE` sont dans `benchmark_series` pour cela — et non
absorbee silencieusement. Un taux de 7 semaines presente comme le taux du jour
serait une donnee financiere faussement datee.

#### Extracteur livre — `scripts/extract/extract_bceao_interbancaire.py`

En **dry-run**, aucune ecriture : M1 est livree mais non appliquee, donc
`benchmark_series` n'existe pas encore. Le dry-run valide le parsing, les dates,
les conventions numeriques et les statuts **avant** que la table existe, ce qui
separe les erreurs de LECTURE des erreurs d'ECRITURE. Resultat sur 5 documents :
40 lignes, 26 avec valeur, 14 en `NO_VALUE_MARKET_CLOSED`.

Les codes `UMOA_INTERBANK_WAR_1D` … `_12M` sont une **PROPOSITION** du script,
marquee comme telle : F3 definit le schema mais ne nomme aucun indicateur pour
les taux interbancaires UMOA par maturite. A valider avant toute ecriture reelle,
de meme que `category = RFR` pour le 1 jour et `MONETAIRE` pour les autres.

#### Ce qui reste a faire

- ~~parcourir les 27 pages~~ **FAIT** le 2026-10-30 : 391 documents, liste
  complete etablie ;

  **Et le nom de fichier ne permet PAS de dater la serie.** Sur les 391,
  **330 (84 %)** ne portent aucune annee lisible dans leur nom. La distribution
  par annee tiree des noms est donc sans valeur : elle montre « 2020, 2021 et
  2023 absentes », ce qui ne prouve **aucun trou** — seulement que les noms ne
  portent pas de date. Un recensement chronologique exige d ouvrir les
  documents, ce que fait `--dates-du-contenu` du meme script. Conclure a un
  trou depuis les noms aurait ete une erreur de la meme famille que le
  « 2019 inaccessible » d UMOA-Titres : prendre un defaut de ma lecture pour
  une propriete de la source ;

- verifier que le tableau garde la meme forme sur les neuf annees — **4 documents
  ouverts sur 391** par lecture integrale a ce stade ; la passe
  `--dates-du-contenu` ouvre les 391 pour trancher la continuite ;
- ~~decider et documenter le proxy retenu~~ **FAIT** — `DEC-AF-009`, fondee sur
  l'extraction des 388 documents (3 104 points). Couverture par maturite :

  | maturite | semaines cotees | couverture |
  |---|---|---|
  | 1 jour / 1 sem. / 2 sem. / 1 mois | 379 | **100 %** |
  | 3 mois | 370 | 97,6 % |
  | 6 mois | 264 | 69,7 % |
  | 9 mois | 95 | 25,1 % |
  | **12 mois** | **25** | **6,6 %** |

  Un proxy adosse au **12 mois** aurait ete absent **93 % du temps**, et son
  absence serait passee pour un trou de donnees. Retenu : le **1 jour** (100 %,
  meme convention que MONIA au Maroc, donc comparabilite entre zones), avec le
  **1 mois** comme benchmark monetaire distinct. Le 1 jour est 88 points de base
  sous le 1 mois en mediane : le choix n'est **pas neutre sur les Sharpe
  affiches** et doit etre documente a l'affichage.

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
| 2026-10-30 | session Claude Code | BCEAO : serie hebdomadaire **2017-10 → 2026-10**, ≈531 PDF sur 27 pages, 8 maturites, extraction `pdftotext -layout` validee |
| 2026-10-30 | session Claude Code | BCEAO : date de publication **absente** des PDF recents (0 « Dakar ») alors que 2017 la porte ; extracteur dry-run livre, 40 lignes / 26 valeurs sur 5 documents |
| 2026-10-30 | session Claude Code | BCEAO recensement reel : **391** documents (et non ≈531, extrapolation erronee de 26 %) ; 5 PDF de barre laterale vus 27x ; **330/391 sans annee dans le nom** |
| 2026-10-30 | session Claude Code | BCEAO, 391 documents ouverts : **379 semaines distinctes**, 2017-11-06 → 2026-10-19, **18 % manquantes**, 15 trous, le plus long **49 jours** ; debut reellement continu **2018-02** |
| 2026-10-30 | session Claude Code | MONIA : reference la plus recente **28/10** lue le **30/10** ; `iso === targetDate` est **insatisfiable**, et « J-1 » echoue aussi le lundi (vendredi publie lundi) |
| 2026-10-30 | session Claude Code | BDEMF retestee : **toujours 502**, 174 octets, zero lien. Deux mesures le meme jour — ecarte un incident momentane, pas une panne de plusieurs jours |
