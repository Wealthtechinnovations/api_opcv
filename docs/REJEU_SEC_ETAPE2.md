# Rejeu SEC — etape 2, phase seche

> Genere par `ops-sec-replay-dryrun.yml`. Ne pas modifier a la main.
> **Aucune ecriture en base** : extraction dans un fichier dedie, import en dry-run.

Derniere execution : **2026-08-28 21:07 UTC**

```
==============================================
 0. VERSION DU CODE
==============================================
bdacd278 chore: snapshot production state 2026-08-28 20:00
extracteur : 2026-08-19 17:46:50
annees rejouees : 2026 2025 2024 2023 2022

==============================================
 1. REJEU DE L EXTRACTION
==============================================
[OK] 2022 | NAV-as-at-23rd-December-2022.xlsx | rows=147 | dates=2022-12-23
[OK] 2022 | NAV-as-at-23rd-September-2022.xlsx | rows=143 | dates=2022-09-23
[OK] 2022 | NAV-as-at-24th-June-2022.xlsx | rows=139 | dates=2022-06-24
[OK] 2022 | NAV-as-at-25th-February-2022.xlsx | rows=135 | dates=2022-02-25
[OK] 2022 | NAV-as-at-25th-March-2022.xlsx | rows=135 | dates=2022-03-25
[OK] 2022 | NAV-as-at-25th-November-2022.xlsx | rows=143 | dates=2022-11-25
[OK] 2022 | NAV-as-at-26th-August-2022.xlsx | rows=140 | dates=2022-08-26
[OK] 2022 | NAV-as-at-27th-May-2022.xlsx | rows=136 | dates=2022-05-27
[OK] 2022 | NAV-as-at-28th-January-2022.xlsx | rows=135 | dates=2022-01-28
[OK] 2022 | NAV-as-at-28th-October-2022.xlsx | rows=143 | dates=2022-10-28
[OK] 2022 | NAV-as-at-29th-April-2022-1.xlsx | rows=136 | dates=2022-04-29
[OK] 2022 | NAV-as-at-29th-July-2022.xlsx | rows=140 | dates=2022-07-29
[OK] 2022 | NAV-as-at-2nd-December-2022-1.xlsx | rows=144 | dates=2022-12-02
[OK] 2022 | NAV-as-at-2nd-September-2022-1.xlsx | rows=140 | dates=2022-09-02
[OK] 2022 | NAV-as-at-30th-December-2022-2.xlsx | rows=147 | dates=2022-12-30
[OK] 2022 | NAV-as-at-30th-September-2022.xlsx | rows=143 | dates=2022-09-30
[OK] 2022 | NAV-as-at-3rd-June-2022.xlsx | rows=138 | dates=2022-06-03
[OK] 2022 | NAV-as-at-4th-February-2022.xlsx | rows=135 | dates=2022-02-04
[OK] 2022 | NAV-as-at-4th-March-2022.xlsx | rows=135 | dates=2022-03-04
[OK] 2022 | NAV-as-at-4th-November-2022.xlsx | rows=143 | dates=2022-11-04
[OK] 2022 | NAV-as-at-5th-August-2022.xlsx | rows=140 | dates=2022-08-05
[OK] 2022 | NAV-as-at-6th-May-2022.xlsx | rows=136 | dates=2022-05-06
[OK] 2022 | NAV-as-at-7th-January-2022.xlsx | rows=134 | dates=2022-01-07
[OK] 2022 | NAV-as-at-7th-October-2022.xlsx | rows=143 | dates=2022-10-07
[OK] 2022 | NAV-as-at-8th-April-2022.xlsx | rows=136 | dates=2022-04-08
[OK] 2022 | NAV-as-at-8th-July-2022.xlsx | rows=139 | dates=2022-07-08
[OK] 2022 | NAV-as-at-9th-September-2022.xlsx | rows=143 | dates=2022-09-09

Extraction terminée.
Lignes extraites avant filtre qualité : 41626
Lignes écrites : 41626
Fichiers / feuilles audités : 239
Lignes de cohérence inter-fichiers : 155
Lignes de couverture annuelle : 5
Suggestions fuzzy naming : 4
CSV données : sec_ng_replay.csv
CSV audit : sec_ng_replay_audit.csv
CSV cohérence : sec_ng_replay_coherence.csv
CSV couverture annuelle : sec_ng_nav_annual_coverage_v6.csv
CSV fuzzy names : sec_ng_nav_fuzzy_names_v6.csv
code de sortie extraction : 0
lignes extraites : 41627

==============================================
 2. SIMULATION DE L IMPORT (aucune ecriture)
==============================================
Lecture de sec_ng_replay.csv...
41626 lignes lues depuis le CSV
41471 lignes valides (avec date + prix + nom)
  155 lignes rejetees (VL hors bornes [0.0001-1000000] ou NAV > 5000000000000)
314 fonds distincts identifies
*** MODE DRY-RUN: aucune ecriture en base ***

Connecte a la base fund_opcvm
Chargement des taux de change...
  132196 entrees forex chargees
329 fonds Nigeria existants en base
  Progression: 20/314 fonds (0 VL inserees)...
  Progression: 40/314 fonds (0 VL inserees)...
  Progression: 60/314 fonds (0 VL inserees)...
  Progression: 80/314 fonds (0 VL inserees)...
  Progression: 100/314 fonds (0 VL inserees)...
  Progression: 120/314 fonds (0 VL inserees)...
  Progression: 140/314 fonds (0 VL inserees)...
  Progression: 160/314 fonds (0 VL inserees)...
  Progression: 180/314 fonds (0 VL inserees)...
  Progression: 200/314 fonds (0 VL inserees)...
  Progression: 220/314 fonds (0 VL inserees)...
  Progression: 240/314 fonds (0 VL inserees)...
  Progression: 260/314 fonds (0 VL inserees)...
  Progression: 280/314 fonds (0 VL inserees)...
  Progression: 300/314 fonds (0 VL inserees)...


==========================================
=== RAPPORT IMPORT VL NIGERIA (SEC) ===
==========================================
Fichier CSV:                   sec_ng_replay.csv
Lignes CSV totales:            41626
Lignes valides:                41471
Fonds dans le CSV:             314
Fonds matches (existants):     306
  dont fuzzy match:            4
Fonds crees (nouveaux):        8
Fonds ignores (--skip-existing): 0
Fonds metadata MAJ:            0
VL inserees:                   0
VL deja existantes (gardees):  0
VL sans taux forex:            0
Erreurs:                       0

Contrat d ecriture:            mode warn, lot SECNG_20260828_210707
  Qualite des mesures:         (aucune)
  Mesures refusees:            0
  Rollback de ce lot:          DELETE FROM valorisations WHERE correction_batch = 'SECNG_20260828_210707'

Matches fuzzy (a verifier):
  CSV: "Nigeria Real Estate Investment Trust" <-> DB: "NIGERIAN REAL ESTATE INVESTMENT TRUST" (sim=0.954)
  CSV: "D'Namaz Halal Fixed Income Fund" <-> DB: "D NAMAZ HALAL FIXED INCOME FUND" (sim=0.963)
  CSV: "FBN Bond Fund (FBN Fixed Income Fund)" <-> DB: "FBN BOND FUND (FIXED INCOME)" (sim=0.977)
  CSV: "Women's Balanced Fund (Gender/Diversity)" <-> DB: "WOMEN S BALANCED FUND (GENDER/DIVERSITY)" (sim=0.954)

Categories extraites:
  OBLIGATAIRE (73 fonds) => OBLIGATIONS / OBLIGATIONS
  MONETAIRE (58 fonds) => MONETAIRE / MONETAIRE
  AUTRE (53 fonds) => AUTRE / AUTRE
  DIVERSIFIE (40 fonds) => DIVERSIFIE / DIVERSIFIE
  DOLLAR (32 fonds) => DOLLAR / DOLLAR
  ACTIONS (29 fonds) => ACTIONS / ACTIONS
  ETF (13 fonds) => ETF / ETF
  IMMOBILIER (7 fonds) => IMMOBILIER / IMMOBILIER
  ETHIQUE (5 fonds) => ETHIQUE / ETHIQUE
  INFRASTRUCTURE (3 fonds) => INFRASTRUCTURE / INFRASTRUCTURE
  CHARIA (1 fonds) => CHARIA / CHARIA

VL par annee:
  2022: 7079 VL
  2023: 7630 VL
  2024: 9050 VL
  2025: 10355 VL
  2026: 7203 VL

*** MODE DRY-RUN: aucune modification en base ***

Connexion fermee

==============================================
 3. ECART ENTRE LE FICHIER RELU ET LA BASE
==============================================

=== ECART ENTRE LE FICHIER SEC RELU ET LA BASE ===
Mesure le 2026-08-28 21:07:10 UTC — LECTURE SEULE
CSV : sec_ng_replay.csv

Lignes CSV : 41626
Fonds Nigeria en base : 329
VL Nigeria en base : 77315

## A. Appariement

    40826 ligne(s) CSV appariees a un fonds en base
      646 ligne(s) sans fonds correspondant (nom inconnu)
    40826 ligne(s) dont la date n est pas en base — un import les AJOUTERAIT
        0 ligne(s) identiques a moins de 1 %
        0 ligne(s) EN ECART

Aucun ecart : le fichier relu confirme la base. Rien a corriger par cette voie.


==============================================
 4. RUPTURES ENCORE PRESENTES EN BASE
==============================================

=== RUPTURES D ECHELLE RESTANTES — toutes dates confondues ===
Mesure le 2026-08-28 21:07:16 UTC — LECTURE SEULE
Critere : saut d un facteur >= 10 par rapport a la VL precedente du meme fonds

TOTAL : 233 ligne(s) sur 84 fonds

## Repartition par pays et lot d insertion

     91 ligne(s)   NIGERIA | insere le Sun Aug 02
     54 ligne(s)   NIGERIA | insere le Sun May 17
     16 ligne(s)   NIGERIA | insere le Mon Jun 22
     16 ligne(s)   NIGERIA | insere le Thu Jun 04
      9 ligne(s)   NIGERIA | insere le Mon Aug 24
      7 ligne(s)   NIGERIA | insere le Mon Jul 06
      7 ligne(s)   NIGERIA | insere le Mon Jun 08
      7 ligne(s)   NIGERIA | insere le Mon Jun 01
      5 ligne(s)   Nigeria | insere le Mon Aug 24
      4 ligne(s)   NIGERIA | insere le Mon Jun 29
      3 ligne(s)   NIGERIA | insere le Mon Jul 27
```
