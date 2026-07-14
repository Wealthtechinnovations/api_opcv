# CHANTIER BENCHMARKS — F3 : Mapping + Schema de donnees + Plan de migration

> 2026-07-10. Phase F3. **PROPOSITION A VALIDER AVANT TOUTE IMPLEMENTATION**
> (regle du complement obligatoire). S'appuie sur F1 (audit code : `docs/BENCHMARKS_AUDIT_F1.md`)
> et F2 (sources en ligne : `docs/BENCHMARKS_SOURCES_F2.md`).
> Principe directeur : **additif, versionne, derriere feature flag, zero regression.**

---

## 0. Rappel du socle deja present (a NE PAS reconstruire)

- **Referentiel `04_REF_INDICES_FUNDAFRICA`** (`referentiel_fundafrica.json`, seede en base via `scripts/seed/seed_referentiel_fundafrica.js`) : **137 indices** deja structures en 3 couches. Champs : `INDICE_ID`, `CATEGORIE_FUNDAFRICA`, `NIVEAU_CATEGORIE` (LOCAL 120 / REGIONAL 12 / GLOBAL_AFRIQUE 5), `CLASSIFICATION_REGULATEUR` (ACTIONS / OBLIGATIONS / MONETAIRE / DIVERSIFIE / …), `NOM_INDICE_USD_OU_BASE`, `NOM_INDICE_EUR`, `INDICE_SUPPLEMENTAIRE_USD/EUR`, `DEVISE_BASE_INDICE`, `UTILISATION_PAGE_LOCALE/EUR/USD`, `SOURCE_PRIMAIRE`, `STATUT_INDICE`, `REGLE_CONVERSION`.
- **Statuts existants** : VALIDATED_OR_TO_VERIFY 30 · COMPOSITE_TO_BUILD 34 · RATE_TO_DEFINE 34 · MISSING_OR_TO_VERIFY 24 · MISSING_BENCHMARK 15.
- **Tables de series historiques deja peuplees** (`indice_references`) : BRVM, MASI, NSE, Tunindex (6000+ points chacun), MONIA (taux). Ce sont les series NATIONALES devise locale, deja consommees par les fiches fonds via `valorisations.indRef`.

**Conclusion** : le chantier n'ajoute PAS un nouveau referentiel — il (a) source les series manquantes (REGIONAL/GLOBAL_AFRIQUE/obligataire/monetaire), (b) ajoute les couches converties et Afrique en NOUVELLES series (jamais dans `indRef`), (c) cable le referentiel aux fonds + au frontend derriere un flag.

---

## 1. Mapping cible pays x categorie x couche x devise (reconcilie avec F2)

Legende disponibilite source (F2) :
- ✅ = serie exploitable maintenant (daily ; historique deja en base ou backfillable)
- 🟠 = accessible mais necessite travail (headless / parsing PDF / scrape pagine)
- 🔒 = sous licence (historique) → fallback synthetique
- ❌ = source a definir / decision requise

### COUCHE 1 — National, devise locale (pilote les metriques natives)

| Pays | Categorie | Benchmark cible | Source F2 | Dispo |
|---|---|---|---|---|
| Maroc | Actions | MASI | medias24 (daily) + 6900 pts en base | ✅ (backfill long ❌) |
| Maroc | Obligataire CT | MBI Court Terme | AUCUNE source libre identifiee | ❌ |
| Maroc | Obligataire LT | MBI MLT/LT | idem | ❌ |
| Maroc | Monetaire / RFR overnight | MONIA | bkam HTML (UA navigateur) | 🟠 (fix scrapeMONIA) |
| Maroc | Courbe RFR | BKAM BDT ref rates | bkam HTML | 🟠 |
| Maroc | Diversifie | composite MBI+MASI par fonds | derive | ❌ (compose) |
| Tunisie | Actions | TUNINDEX | BVMT (daily) + 6900 pts en base | ✅ (backfill long via tunis-stockexchange 🟠) |
| Tunisie | Obligataire CT/MT/MLT/LT | TBI CT/MT/MLT/LT | BIAT PDF hebdo | 🟠 (parse PDF) |
| Tunisie | Monetaire / RFR | TM / TMM (cash synthetique) | BCT HTML | 🟠 |
| Tunisie | Courbe RFR | CMF / tunisiayieldcurve | injoignable datacenter | 🟠 (headless) |
| Nigeria | Actions | NGX All Share | NGX doclib (daily, en cron) | ✅ |
| Nigeria | Obligataire | S&P/FMDQ Nigeria Sovereign | FMDQ (valeur jour gratuite) | 🟠 (hist licence) |
| Nigeria | Monetaire CT | NITTY / NTB | FMDQ HTML | 🟠 |
| Nigeria | RFR overnight | NOFR | CBN HTML/Excel | 🟠 |
| UEMOA | Actions | BRVM Composite | BRVM BOC (daily, en cron) | ✅ |
| UEMOA/CEMAC | (autres) | — | mapping pays manquant (F1) + CEMAC 0 source | ❌ |

### COUCHE 2 — National CONVERTI en devise de page (EUR/USD)
- Regle : **si une serie officielle existe deja dans la devise cible, la preferer** ; sinon convertir la serie locale par DIVISION avec le FX officiel (meme methode/date que la VL du fonds).
- **Exception majeure (F2)** : **TUNINDEX est publie officiellement en TND/USD/EUR** (tunis-stockexchange) → utiliser la serie officielle, PAS une conversion maison. 🟠 (scrape pagine).
- MASI/NGX/BRVM converti : DIVISION par EUR/{dev} et USD/{dev} depuis `devisedechanges` (mecanisme existant, cf F1 §4). Pont EUR/USD = BCE ✅.
- EUR/NGN : non fourni par BCE → cross EUR/USD(BCE) x USD/NGN(CBN). Statut FX_MISSING si rupture.

### COUCHE 3 — Afrique (distincte de la couche 2, jamais fusionnee)
- Actions Afrique : S&P All Africa / ex-SA / Africa 40. 🔒 historique sous licence.
- Obligataire Afrique : S&P Africa Sovereign Bond (+ ex-SA). 🔒.
- Monetaire Afrique : **aucun indice public** → composite synthetique explicite obligatoire.
- **Strategie F3 retenue** (sans licence) : **proxy Afrique maison** `is_synthetic=true`, versionne, documente — panier d'indices pays libres (NGX ASI, BRVM, MASI, TUNINDEX, + EGX/JSE si ajoutes) pondere selon une cle publiee ; et/ou suivi de la NAV d'un ETF replicant (obligataire). Marque `SYNTHETIC_BENCHMARK_USED`. La valeur du jour S&P (headless) et les factsheets PDF restent une option de calibration/validation, pas une source de redistribution.

### Taux sans risque & MAR Sortino (transverse, corrige le bug F1)
- **Bug F1** : `calculateSortinoRatio(returns, tauxsr, 0.01)` ignore le 3e arg → MAR effectif 0 ; TSR par pays via `tsrhisto` puis constantes en dur (fallback 1,42 %, override -0,0234). 
- **Cible** : `MAR_default = RFR local, meme devise, meme frequence que les rendements` ; overrides `MAR_override_by_fund/strategy/share_class`. RFR par pays : Maroc=MONIA, Nigeria=NOFR, Tunisie=TM, UEMOA/CEMAC=taux BCEAO/BEAC (a definir). Couche RFR = objet distinct du benchmark de portefeuille.

---

## 2. Schema de donnees propose (ADDITIF — aucune colonne existante modifiee)

### 2.1 Table `benchmark_series` (nouvelle) — series de valeurs, toutes couches/devises
Une ligne = un point (indicateur, date, devise d'affichage). N'ecrit JAMAIS dans `valorisations.indRef` ni `indice_references`.

```
benchmark_series
  id                BIGINT PK AUTO_INCREMENT
  indicator_code    VARCHAR(64)   -- ex MASI, TUNINDEX, SP_ALL_AFRICA, AFRICA_CASH_SYNTH
  indicator_name    VARCHAR(255)
  country           VARCHAR(32)   -- MAROC/TUNISIE/NIGERIA/UEMOA/CEMAC/AFRIQUE
  category          VARCHAR(64)   -- ACTIONS/OBLIGATIONS_CT/OBLIGATIONS_LT/MONETAIRE/DIVERSIFIE/RFR/MAR
  benchmark_scope   ENUM('national','converted','africa')
  return_type       ENUM('price','total_return','yield','rate','synthetic')
  original_currency VARCHAR(8)
  display_currency  VARCHAR(8)    -- LOCAL/EUR/USD
  value             DECIMAL(20,6)
  as_of_date        DATE          -- date de marche
  publication_date  DATE NULL     -- date de publication (peut differer, cf MONIA)
  fetched_at        DATETIME
  source_name       VARCHAR(128)
  source_url        VARCHAR(512)
  source_rank       TINYINT       -- 1=officielle, 2=fallback reglemente, 3=fallback technique
  is_official       BOOLEAN
  is_synthetic      BOOLEAN
  confidence_level  ENUM('high','medium','low')
  status            VARCHAR(48)   -- OK_EXACT_DATE / OK_PREVIOUS_AVAILABLE_DATE / NO_VALUE_* / SYNTHETIC_BENCHMARK_USED / FX_MISSING ...
  raw_payload_hash  CHAR(64) NULL
  UNIQUE KEY (indicator_code, display_currency, benchmark_scope, as_of_date)
  INDEX (country, category, as_of_date)
```

### 2.2 Table `benchmark_mapping` (nouvelle) — quel indicateur pour quel fonds/couche
Derivee de `04_REF_INDICES_FUNDAFRICA` + overrides par fonds (prospectus). Ne modifie pas `fond_investissements`.

```
benchmark_mapping
  id               BIGINT PK
  fond_id          INT NULL        -- NULL = regle par (pays,categorie) ; sinon override fonds
  pays             VARCHAR(32) NULL
  categorie        VARCHAR(64) NULL
  benchmark_scope  ENUM('national','converted','africa')
  indicator_code   VARCHAR(64)     -- FK logique -> benchmark_series.indicator_code
  weight           DECIMAL(6,4) DEFAULT 1.0  -- pour composites (diversifie)
  is_composite     BOOLEAN
  mapping_status   VARCHAR(48)     -- VALIDATED / BENCHMARK_MAPPING_PENDING / HOUSE_COMPOSITE_EXPLICIT
  effective_from   DATE
  source_prospectus VARCHAR(255) NULL
  UNIQUE KEY (fond_id, pays, categorie, benchmark_scope, indicator_code)
```

### 2.3 Composites (diversifie) & synthetiques
Definis par plusieurs lignes `benchmark_mapping` (meme scope, `is_composite=1`, `weight` sommant a 1). La valeur composite est calculee a la volee (ou materialisee en `benchmark_series` avec `is_synthetic=1`). Toujours `HOUSE_COMPOSITE_EXPLICIT`, jamais presente comme officiel.

---

## 3. Plan de migration NON destructif (feature-flag)

**Flag** : `BENCHMARKS_V2_ENABLED` (env var, patron clone de `CLICKHOUSE_ENABLED`, cf F1 §7). OFF par defaut → aucun changement de comportement.

- **M1 (migrations)** : creer `benchmark_series` + `benchmark_mapping` (CREATE TABLE, additif). Seed `benchmark_mapping` depuis `04_REF_INDICES_FUNDAFRICA`. Aucune ecriture sur tables existantes.
- **M2 (adapters de sources, F4)** : un adapter par source avec statuts structures + regle « derniere valeur <= date cible » (remplace `date==today`). Ecrit UNIQUEMENT dans `benchmark_series`. Reutilise scrape_indices_daily pour les 4 series deja vivantes ; ajoute MONIA(HTML)/BDT/NOFR/NITTY/TBI/BCT/TUNINDEX-devise/BCE/S&P-proxy progressivement.
- **M3 (backfill)** : par source, apres rapport de profondeur (F2 : long seulement pour tunis-stockexchange & BCE ; MASI/NGX = incremental + existant). Jamais de backfill massif sans rapport prealable.
- **M4 (API, additif)** : nouvelle route `/api/benchmarks/:fondId/:devise` renvoyant les 3 couches depuis `benchmark_series`+`benchmark_mapping`. Les routes existantes `valLiq`/`valLiqdev` restent inchangees.
- **M5 (frontend, additif)** : sous flag, ajouter les series couche-2/couche-3 en options de courbe dans `FundView.tsx` (aujourd'hui mono-serie `item.InRef`, cf F1 §6). Le benchmark national local reste la serie par defaut.
- **M6 (ratios/Sortino)** : brancher le RFR/MAR par pays+devise ; corriger `calculateSortinoRatio` (passer et utiliser le MAR). Sous flag + tests de non-regression sur les ratios existants.

**Regle d'or** : a chaque etape, `valorisations.indRef` et le rendu actuel restent la reference. Les nouvelles couches sont lues en parallele, jamais en remplacement.

---

## 4. Risques residuels (F3)

1. **Sources sous licence (S&P Afrique)** : la couche 3 « officielle » n'est pas backfillable librement → on livre un proxy synthetique explicite ; l'utilisateur doit accepter que la couche Afrique soit `is_synthetic` (ou souscrire une licence S&P DJI).
2. **Historique court des API JSON** (MASI/Tunindex) : la profondeur repose sur l'existant en base + sources d'archive fragiles (headless). Documenter les trous, ne pas fabriquer.
3. **Scraping HTML/PDF fragile** (MONIA, BDT, BCT, TBI, tunis-stockexchange) : prevoir monitoring d'echec + statuts structures (un echec ne doit jamais ecraser une valeur existante).
4. **RFR UEMOA/CEMAC** : taux BCEAO/BEAC a sourcer ; CEMAC deja bloque cote VL (decision utilisateur).
5. **Cout** : la couche 3 + obligataire/monetaire represente ~107 indices `MISSING/COMPOSITE/RATE` → chantier long, a livrer par lots pays.

---

## 5. Decisions (mises a jour 2026-07-14 — reponses utilisateur)

1. **Couche Afrique = DECIDE** : proxy synthetique maison, sans licence S&P DJI. `is_synthetic=true` obligatoire sur toutes les series Afrique (composite pondere a partir des indices pays deja disponibles : NGX, BRVM, MASI, TUNINDEX). Aucune migration lancee pour l'instant (F4 non demarre).
2. **CEMAC (VL des 34 fonds) = DEBLOQUE (2026-07-14)** : sources transmises par l'utilisateur — `https://www.bvm-ac.org/bulletin-officiel-de-la-cote-boc/` (743 BOC references depuis 2023-01) + `https://www.bvm-ac.org/wp-content/uploads/2026/07/BOC-20260714.pdf`. **Format PDF verifie identique a BRVM** (memes colonnes Societe de gestion/Depositaire/OPCVM/Categorie/VL Origine-Precedente-Actuelle/Variation, section "OPCVM : FONDS COMMUN DE PLACEMENT..." pages 14-17 du BOC). Script livre : `scripts/scraper/bvmac_boc_daily.py` (adaptation de `brvm_boc_daily.py`, tables additives prefixees `bvmac_` — zero collision avec `brvm_boc_*`). **Valide reellement contre le PDF du 2026-07-14** (environnement isole, pdfplumber 0.11.10) : 30/30 lignes extraites, 0 echec parsing, 24 OK + 6 SUSPECT_VARIATION (flag securite, non promues automatiquement). Selftest inclut le cas reel de ligne corrompue. **Reste a valider avant --production** : rapprochement des noms de fonds contre les 34 fonds CEMAC reels en base (necessite acces DB via MCP) ; executer `--dry-run` sur le serveur en premier.
3. **337 fonds dormants = DECIDE : diagnostic + mise a jour (pas de desactivation aveugle)**. Diagnostic lecture seule livre : `scripts/diag/check_dormant_funds_coverage.js` (commit `a2b0458`) — distingue par pays : UEMOA/NIGERIA (pipeline cron continu, fonds absents = tres probablement dissous, candidats desactivation APRES verification) vs MAROC/TUNISIE/CEMAC (import periodique par fichier, pas de cron continu -> dormants tant qu'un nouvel export ASFIM/CMF/COSUMAF n'est pas fourni). Executer ce script (SELECT uniquement) des que le MCP repond, puis decider fonds par fonds.
4. **Priorite F4 = DECIDE : par COUCHE.** Ordre retenu : couche 1 (national local, tous pays — RFR + fix Sortino + obligataire/monetaire) -> couche 2 (converti EUR/USD, TUNINDEX-devise officiel en pilote) -> couche 3 (proxy Afrique synthetique, decision 1).
5. **Build+restart frontend = DECIDE : OUI.** Deploiement des fixes UI en attente depuis le 13/06 (quartile EUR/USD AUDIT-D `8a60083`, barres ratios dynamiques `cf6dba2`) autorise. A executer via `deploy_project_s2 project=front_end_opcvm` des que le MCP repond (build + restart PM2 fundafrique-frontend).

---

## 6. Addendum — precisions du document 2026-07-14 (« benchmarks_afrique_prompt_claude.md »)

> Document uploade le 14/07, verifie IDENTIQUE au rapport deep-research deja exploite en F1/F2 pour son contenu narratif ; seules les sections ci-dessous apportent des elements NOUVEAUX, absorbes ici de facon additive (aucun impact sur le schema ni sur une decision deja actee).

### 6.1 Statuts structures — liste etendue (17 au lieu de 12)
A la liste deja retenue en F3 §2.1 (`status` de `benchmark_series`), ajouter ces 5 valeurs precisees par le document du 14/07 (distinction plus fine source-officielle-indisponible vs page-dynamique vs sous-licence) :
```
SOURCE_OFFICIAL_UNREACHABLE_TRY_FALLBACK   -- source officielle identifiee mais injoignable (ex Casablanca-Bourse WAF) -> tenter le fallback documente avant d'echouer
SOURCE_DYNAMIC_NEEDS_BROWSER               -- distinct de NO_VALUE_DYNAMIC_PAGE_NEEDS_BROWSER : la page EXISTE et repond, mais le contenu est charge en JS (ex Bourse de Tunis market-watch)
SOURCE_UNDER_LICENSE                       -- la source existe et est documentee mais son usage est sous licence payante (S&P DJI, NGX historique EOD)
BACKFILL_NOT_AUTHORIZED                    -- backfill techniquement possible mais non autorise (attente validation utilisateur, cf §5.8 du protocole)
MIGRATION_PENDING_VALIDATION               -- mapping/serie pret cote code mais migration DB non executee (etat exact actuel de F3 -> F4)
```
Ces 5 statuts se distinguent des equivalents deja retenus par un niveau de granularite supplementaire (raison precise de l'echec, pas juste "echec"). A adopter tel quel dans l'adapter-layer (F4/M2).

### 6.2 Sources Maroc — precisions actionnables
- **Fallback MASI PDF confirme avec URLs reelles** : `https://media.casablanca-bourse.com/sites/default/files/AAAA-MM/flash_quotidien_YYYYMMDD.pdf` (Flash Quotidien quotidien, contient l'historique MASI) — utilisable si la voie API medias24 tombe en panne (aujourd'hui c'est elle qui marche, cf F2).
- **AMMC — fiches signaletiques et prospectus reels identifies** pour sourcer les poids MBI+MASI par fonds (au lieu d'un mapping generique) :
  `ammc.ma/sites/default/files/FS%20Maroc%20opportunit%C3%A9.pdf`, `FS%20SG%20TRESOR%20PLUS.pdf`, `FS_MAJVINI-1.pdf`, `FicheSignal%C3%A9tique%20BMCI%20TRESO%20PLUS%202011.pdf`, `Prospectus_ARADEI_031_2024.pdf`, `Prospectus_LEMO_038_2025.pdf`. A utiliser en F4/M2 pour peupler `benchmark_mapping.source_prospectus` fonds par fonds (diversifies Maroc), au lieu du mapping provisoire generique — respecte la regle "aucun benchmark invente".
- Confirme : distinction **MASI Price Return / Rentabilite Brute / Rentabilite Nette** a verifier par prospectus (`MASI_TR_VARIANT` optionnel deja prevu au schema implicitement via `return_type`).

### 6.3 Nigeria — circulaire FMAN pour fonds diversifies
Reference precise pour la gouvernance des benchmarks des Money Market/Balanced/Ethical Funds nigerians :
`https://sec.gov.ng/for-investors/keep-track-of-circulars/new-rules-on-collective-investment-schemes/`
Tant que la circulaire operationnelle FMAN du millesime en cours n'est pas recuperee, les fonds diversifies Nigeria restent `HOUSE_COMPOSITE_EXPLICIT` (deja la position F3 — confirmee, pas de changement).

### 6.4 BCE — endpoints precis (deja identifies F2, reconfirmes)
```
https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml    -- quotidien
https://data.ecb.europa.eu/data/datasets/EXR/EXR.D.USD.EUR.SP00.A -- dataset structure (alternative a eurofxref-hist.zip deja documente F2)
```
Aucun changement de recommandation : BCE reste niveau 4 (integrable cron), pont EUR/USD.

### 6.5 Regle de tolerance de date — confirmation chiffree (deja F3, desormais explicite)
```
Indices actions       : tolerance 3 a 5 jours calendaires
Taux monetaires       : tolerance 3 a 7 jours
Courbes obligataires  : tolerance 3 a 5 jours ouvres
TMM Tunisie           : dernier mois disponible <= mois cible
FX                    : dernier fixing disponible <= date cible
```
A coder explicitement dans l'adapter-layer F4/M2 (remplace le `date==today` strict deja corrige pour les indices via `--backfill-days`, cf `ebf1305` — mais l'adapter-layer benchmarks generique n'existe pas encore, F4 non demarre).

### 6.6 Conclusion de l'addendum
Aucune de ces precisions ne remet en cause le schema (`benchmark_series`/`benchmark_mapping`), le plan de migration M1-M6, ni les 5 decisions en attente (§5). Elles enrichissent uniquement F4/M2 (adapters) quand celui-ci demarrera. **Rien n'a ete installe suite a cet addendum — additif documentaire uniquement, zero risque.**

> Rien n'est implemente a ce stade. F4 ne demarre qu'apres validation de ces points.
