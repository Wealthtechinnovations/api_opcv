# T13 — Diagnostic liaison Indices ↔ Fonds (couverture indRef EUR/USD)

> **MAJ 2026-06-25 — Continuite des series d'indices** : l'audit a etabli que les valeurs DB
> NSE / Tunindex / MASI au 2026-05-15 etaient FAUSSES (queue gelee par l'ancien scraper HTML
> depuis ~jan 2025), et non un rebase. Sources autoritatives 2026 rebranchees (commit `5314fe0`).
> Outils ajoutes : `scripts/scraper/diagnose_index_history.js` (read-only) et `fix_index_tail.js`
> (correction queue gelee). Ordre d'execution et verdict detailles dans
> `../front_end_opcvm/SUIVI.md` → POINT DE REPRISE COURANT.

> Revue de CODE uniquement. La DB de production n'est PAS accessible depuis l'environnement de revue.
> Source de vérité utilisée : `PRODUCTION_STATE.json` (généré le 2026-06-03T05:00:01Z par `sync_production.sh`).
> AUCUNE modification de code ni de DB n'a été effectuée. Ce fichier est purement documentaire.

---

## 1. Schéma de la liaison indices ↔ fonds

### Tables et colonnes impliquées

| Table | Colonnes clés | Rôle |
|-------|---------------|------|
| `fond_investissements` | `indice_benchmark` (str), `indice` (str), `pays` (str), `dev_libelle` (devise locale), `active` | Déclaration du benchmark/indice du fonds + devise locale + pays |
| `indices_references` | `id_indice`, `nom_indice`, `date`, `valeur` | Historique de valeur des indices (MASI, Tunindex, BRVM, NSE, MONIA…) |
| `valorisations` | `indRef`, `indRef_EUR`, `indRef_USD`, `ID_indice`, `indice_name`, `value`, `date`, `fund_id`, `dev_libelle` (via fond) | Valeur de l'indice **collée à la date de chaque VL** (devise locale, EUR, USD) |
| `devisedechanges` | `paire` (ex `EUR/TND`), `date`, `value` | Taux de change historiques |

Modèles : `src/models/fond.js` (lignes 14-17 `indice_benchmark`/`indice`, 26 `pays`, 44 `dev_libelle`, 114 `active`), `src/models/vl.js` (lignes 72-83 `indRef`/`indRef_EUR`/`indRef_USD`, 108 `ID_indice`).

### Chaîne de peuplement (2 étapes distinctes)

```
ÉTAPE A — indRef LOCAL
  Source: indices_references / fichier Excel Historique_Indices_Complet.xlsx
  Script: scripts/import/import_indices_excel.js  (étape 2 = populateIndRef)
  Matching: pour chaque VL d'un fonds, on prend la valeur d'indice à la même date (±7 jours)
  Écrit: valorisations.indRef, .indice_name, .ID_indice
  Mapping pays->indice: INDEX_CONFIG (lignes 51-92)

ÉTAPE B — indRef EUR/USD (conversion)
  Source: valorisations.indRef (local) + devisedechanges
  Scripts:
    - scripts/recalc/recalc_eur_usd_daily_rate.js  (recalcul de masse, taux QUOTIDIEN)
    - src/routes/routes_vl.js  (à l'import VL, lignes 6058-6068 et 6350-6353, 6521-6525)
  Règle: indRef_EUR = indRef_local / taux(EUR/devise, date)  (DIVISION)
         indRef_USD = indRef_local / taux(USD/devise, date)
  Condition stricte: n'écrit indRef_EUR/USD QUE si indRef_local > 0 ET taux trouvé
```

Citation clé (recalc) — `scripts/recalc/recalc_eur_usd_daily_rate.js:272-274` :
```js
const indRef = parseFloat(row.indRef) || 0;
const newIndRefEUR = indRef > 0 ? indRef / eurRate : null;   // NULL si indRef local absent
const newIndRefUSD = indRef > 0 ? indRef / usdRate : null;
```

Citation clé (import VL) — `src/routes/routes_vl.js:6066-6068` :
```js
indRef:     vlEntry.indRef != undefined ? parseFloat(vlEntry.indRef) : null,
indRef_EUR: vlEntry.indRef != undefined && exchangeRatesEUR ? parseFloat(vlEntry.indRef) / exchangeRatesEUR.value : null,
indRef_USD: vlEntry.indRef != undefined && exchangeRatesUSD ? parseFloat(vlEntry.indRef) / exchangeRatesUSD.value : null
```
Le taux est résolu par `paireEUR = "EUR/" + fonds.dev_libelle` (ligne 6030) → **dépend entièrement de la valeur exacte de `dev_libelle`** et n'a **aucune gestion de parité fixe CFA** (contrairement au script recalc qui, lui, traite XOF/XAF à 655.957, lignes 44-45/151-153/238-243).

---

## 2. État réel de la couverture (PRODUCTION_STATE.json, 2026-06-03)

`valorisations_indref_coverage` :

| Pays | total VL | avec indRef LOCAL | avec indRef_EUR | avec indRef_USD | Lecture |
|------|---------:|------------------:|----------------:|----------------:|---------|
| MAROC | 533 497 | 529 823 (99 %) | 529 823 (99 %) | 529 823 (99 %) | OK — référence |
| NIGERIA | 53 718 | 53 718 (100 %) | 53 679 (99.9 %) | 53 679 (99.9 %) | OK |
| **TUNISIE** | 302 780 | **302 780 (100 %)** | **73 523 (24 %)** | **73 523 (24 %)** | Local complet, **conversion incomplète** |
| **UEMOA** | 33 830 | **7 577 (22 %)** | 7 577 (22 %) | 7 577 (22 %) | **Local lui-même incomplet** (EUR suit le local) |
| **CEMAC** | 2 134 | **0 (0 %)** | 0 (0 %) | 0 (0 %) | **Aucun indRef local du tout** |

`devisedechanges_stats` — TOUTES les paires nécessaires existent et couvrent jusqu'au 2026-06-03 :
`EUR/TND` (depuis 2003-12-01), `USD/TND` (2003-12-01), `EUR/XOF` & `USD/XOF` (depuis 2000-01-03), **`EUR/XAF` & `USD/XAF` existent aussi** (depuis 2000-01-03, ~6800-6900 entrées).

`indices_references_stats` — indices présents : MASI, MASI all shares, Indice_monetaire_maroc, MONIA, Sovereign_bond (Maroc), Tunindex, S&P Tunisia Sovereign Bond, BRVM, NSE.
→ **Aucun indice pour la zone CEMAC** (pas de BVMAC / COSUMAF).

---

## 3. Cause racine par pays (chacune différente)

### 3.1 CEMAC = 0 % — Cause : pas d'indice + pas de mapping

Deux verrous cumulés, le déterminant étant l'absence d'indRef **local** :

1. **Aucun indice CEMAC dans `indices_references`** (cf. `indices_references_stats` : aucune ligne BVMAC/COSUMAF). Il n'y a donc rien à coller.
2. **Aucune config de mapping pour CEMAC** dans `import_indices_excel.js:51-92`. Le seul item susceptible de couvrir l'Afrique centrale (MONIA, lignes 84-91) a `pays: []` (liste vide) et est **explicitement filtré** à l'étape 2 :

`scripts/import/import_indices_excel.js:252` :
```js
const indexConfigs = INDEX_CONFIG.filter(cfg => cfg.pays.length > 0);  // MONIA exclu
```

Conséquence : pour les 34 fonds CEMAC, `matchingCfg` est toujours `undefined` (ligne 286-293) → `fundsSkipped` → `indRef` reste NULL → l'étape B (recalc) refuse d'écrire EUR/USD car `indRef > 0` est faux.

> NB : la paire `EUR/XAF` **existe** (≠ ce qu'on pouvait supposer). Le problème CEMAC n'est donc PAS le taux de change, mais l'absence totale d'indice de référence et de mapping. Le script recalc gère même déjà XAF en parité fixe (lignes 151-153, 238-243).

### 3.2 UEMOA = 22 % — Cause : mismatch `pays` dans le matching d'indice

Le local lui-même n'est peuplé qu'à 22 %, et EUR/USD suit mécaniquement (22 % = 22 %).

`fonds_par_pays` montre les fonds UEMOA stockés avec **`pays = "UEMOA"`** (118 fonds). Or la config BRVM liste des **noms de pays individuels** :

`scripts/import/import_indices_excel.js:68-75` :
```js
{
  excelColumn: 'BRVM_UEMOA',
  id_indice: 'BRVM',
  pays: ["Côte d'Ivoire", 'Cote d\'Ivoire', 'Senegal', 'Sénégal', 'Burkina Faso',
         'Mali', 'Togo', 'Benin', 'Bénin', 'Niger', 'Guinee-Bissau', 'Guinée-Bissau'],
  devise_locale: 'XOF',
}
```

Le matching est une égalité stricte (insensible à la casse) entre `fund.pays` et un élément de `cfg.pays` :

`scripts/import/import_indices_excel.js:286-288` :
```js
const matchingCfg = indexConfigs.find(cfg =>
  cfg.pays.some(p => p.toLowerCase() === (fund.pays || '').toLowerCase())
);
```

`"uemoa"` n'est dans aucune liste → la majorité des fonds UEMOA ne matchent jamais BRVM → `indRef` reste NULL. Les ~22 % qui passent sont vraisemblablement les rares fonds dont `pays` est encore renseigné par pays individuel (ex. "Côte d'Ivoire"), ou des fonds traités avant la normalisation `pays="UEMOA"` (cf. SUIVI : Phase 1 a renommé certaines valeurs vers "UEMOA").

> Cause secondaire possible (mineure) : trous de dates dans la colonne Excel `BRVM_UEMOA` au-delà de la fenêtre ±7 jours (`import_indices_excel.js:335`), ce qui produirait des `noMatch` ligne par ligne. À confirmer via SQL (§4).

### 3.3 TUNISIE = 24 % — Cause : étape de CONVERSION incomplète (local à 100 %)

Cas inverse d'UEMOA : `indRef` local = 100 % (302 780/302 780) mais `indRef_EUR/USD` = 24 %. Le mapping et l'indice (Tunindex, 6881 entrées 2000→2026) sont sains. **Le déficit est entièrement dans l'étape B (conversion).**

Les paires `EUR/TND` et `USD/TND` existent et sont à jour (2003-12-01 → 2026-06-03), donc le taux N'EST PAS le blocage pour les VL ≥ 2003. Causes probables, par ordre de vraisemblance :

1. **Le recalc de masse n'a pas (encore) été passé sur l'intégralité de l'historique TND.** `recalc_eur_usd_daily_rate.js` ne traite que `WHERE active = 1` (ligne 105) et n'écrit EUR/USD que pour les VL parcourues. Si seul un sous-ensemble de fonds TND a été recalculé (ex. lancements ciblés `node recalc... <id>`), le reste garde `indRef_EUR` NULL alors que le local existe. 24 % ≈ proportion déjà recalculée.
2. **`dev_libelle` ≠ exactement `'TND'`** pour une partie des fonds tunisiens (NULL, minuscule, espace, libellé long). Dans le recalc, `devise` vide → `fondsSkipped` (lignes 130-135) ; dans l'import VL, `paireEUR="EUR/"+dev_libelle` ne matche aucune paire → `exchangeRatesEUR=null` → indRef_EUR NULL (`routes_vl.js:6030`, `6067`).
3. **VL antérieures à 2003-12-01** (début de `EUR/TND`) : dans le recalc, `getRate` retourne le plus ancien taux disponible (fallback floor, lignes 60-67) donc EUR ne serait PAS NULL — ce point n'explique donc PAS le 24 % à lui seul, mais l'import VL historique (sans fallback floor, recherche `date <= vl.date` ligne 6041 → null si VL plus ancienne que le 1er taux) le pourrait pour les VL ≤ 2003.

→ Diagnostic le plus probable : **(1) recalc non exécuté sur tout le périmètre TND**, éventuellement aggravé par **(2) `dev_libelle` non normalisé**. À trancher via les requêtes §4.

---

## 4. Requêtes SQL de DIAGNOSTIC (SELECT only — à coller sur le VPS)

> Toutes en lecture seule. AUCUN UPDATE/DELETE. À exécuter par l'admin pour confirmer les causes.

```sql
-- 4.1 Confirmer le ratio local vs EUR/USD par pays (reproduit le snapshot)
SELECT f.pays,
       COUNT(*)                                                      AS total_vl,
       SUM(v.indRef     > 0)                                         AS avec_local,
       SUM(v.indRef_EUR > 0)                                         AS avec_eur,
       SUM(v.indRef_USD > 0)                                         AS avec_usd
FROM valorisations v
JOIN fond_investissements f ON f.id = v.fund_id
WHERE f.active = 1
GROUP BY f.pays
ORDER BY f.pays;
```

```sql
-- 4.2 TUNISIE : VL avec indRef local MAIS sans EUR (le cœur du 24%)
--     Ventilation par disponibilité du taux EUR/TND à la date
SELECT (d.value IS NOT NULL) AS taux_eurtnd_dispo,
       COUNT(*)              AS nb_vl
FROM valorisations v
JOIN fond_investissements f ON f.id = v.fund_id
LEFT JOIN devisedechanges d
       ON d.paire = 'EUR/TND' AND d.date = v.date
WHERE f.pays = 'TUNISIE' AND v.indRef > 0
  AND (v.indRef_EUR IS NULL OR v.indRef_EUR = 0)
GROUP BY taux_eurtnd_dispo;
```

```sql
-- 4.3 TUNISIE : les dev_libelle réellement présents (détecte 'TND' non normalisé)
SELECT f.dev_libelle, COUNT(*) AS nb_fonds
FROM fond_investissements f
WHERE f.pays = 'TUNISIE' AND f.active = 1
GROUP BY f.dev_libelle;
```

```sql
-- 4.4 TUNISIE : combien de fonds ont 0 VL convertie (recalc jamais passé dessus)
SELECT v.fund_id, f.nom_fond,
       SUM(v.indRef > 0)     AS local_ok,
       SUM(v.indRef_EUR > 0) AS eur_ok
FROM valorisations v
JOIN fond_investissements f ON f.id = v.fund_id
WHERE f.pays = 'TUNISIE' AND f.active = 1
GROUP BY v.fund_id, f.nom_fond
HAVING local_ok > 0 AND eur_ok = 0
ORDER BY local_ok DESC;
```

```sql
-- 4.5 UEMOA : valeurs de pays réellement stockées (confirme le mismatch "UEMOA")
SELECT f.pays, COUNT(*) AS nb_fonds
FROM fond_investissements f
WHERE f.dev_libelle = 'XOF' OR f.pays LIKE '%UEMOA%'
   OR f.pays IN ('Côte d''Ivoire','Cote d''Ivoire','Senegal','Sénégal',
                 'Burkina Faso','Mali','Togo','Benin','Bénin','Niger',
                 'Guinee-Bissau','Guinée-Bissau')
GROUP BY f.pays;
```

```sql
-- 4.6 UEMOA : confirmer que les VL sans indRef appartiennent à des fonds pays='UEMOA'
SELECT f.pays,
       SUM(v.indRef > 0) AS avec_local,
       SUM(v.indRef IS NULL OR v.indRef = 0) AS sans_local
FROM valorisations v
JOIN fond_investissements f ON f.id = v.fund_id
WHERE f.dev_libelle = 'XOF' AND f.active = 1
GROUP BY f.pays;
```

```sql
-- 4.7 CEMAC : confirmer l'absence totale d'indice de référence pour ces fonds
SELECT f.dev_libelle, f.indice_benchmark, f.indice, COUNT(*) AS nb_fonds
FROM fond_investissements f
WHERE f.pays = 'CEMAC' AND f.active = 1
GROUP BY f.dev_libelle, f.indice_benchmark, f.indice;

-- Existe-t-il un indice CEMAC dans indices_references ?
SELECT id_indice, nom_indice, COUNT(*) AS nb
FROM indices_references
GROUP BY id_indice, nom_indice;
```

```sql
-- 4.8 Vérifier la présence des paires de change clés (confirme XAF dispo)
SELECT paire, COUNT(*) AS nb, MIN(date) AS dmin, MAX(date) AS dmax
FROM devisedechanges
WHERE paire IN ('EUR/TND','USD/TND','EUR/XOF','USD/XOF','EUR/XAF','USD/XAF')
GROUP BY paire;
```

---

## 5. Propositions de correction (additives, non destructives — à VALIDER avant exécution)

> Aucune n'a été appliquée. Toutes respectent la règle zéro régression : additif, ciblé, réversible.

### P1 — TUNISIE : (re)lancer le recalc EUR/USD sur le périmètre TND  ★ priorité, gain ≈ +76 %
- **Action** : exécuter `node scripts/recalc/recalc_eur_usd_daily_rate.js` (déjà en cron `cron_daily_update.sh:52`), d'abord en `--dry-run` pour mesurer, puis en réel. Possibilité de cibler par plage d'IDs TND.
- **Pré-requis** : si §4.3 révèle des `dev_libelle` non normalisés, d'abord les corriger (voir P2) sinon le recalc skippera ces fonds.
- **Pourquoi sûr** : le script ne touche QUE les colonnes `_EUR`/`_USD` (en-tête lignes 30, 313-323), jamais `value`/`indRef`/`dividende` locaux. Idempotent (recalcule à partir du local).
- **Risque de régression** : TRÈS FAIBLE. Recalcul déterministe de colonnes dérivées déjà alimentées par le même cron en prod. Recommandation : `--dry-run` + sauvegarde logique avant.

### P2 — Normaliser `dev_libelle='TND'` pour les fonds tunisiens (si §4.3 le montre)
- **Action** : UPDATE ciblé `dev_libelle='TND'` WHERE `pays='TUNISIE'` AND (dev_libelle NULL/variant). À documenter + script dédié.
- **Pourquoi** : débloque la résolution `EUR/TND`/`USD/TND` dans le recalc ET les futurs imports.
- **Risque** : FAIBLE-MOYEN. Modifie une colonne statique de `fond_investissements`. À faire en SELECT-puis-UPDATE par IDs explicites, avec liste avant/après. Ne pas appliquer en masse à l'aveugle.

### P3 — UEMOA : étendre le mapping d'indice à `pays='UEMOA'`
- **Action** : ajouter `'UEMOA'` (et `'CEMAC'` ? non, pas d'indice) à `cfg.pays` de l'entrée BRVM dans `scripts/import/import_indices_excel.js:73`, puis relancer l'étape 2 (`--step 2`) en mode report puis execute.
  ```js
  // BRVM_UEMOA, ligne 73 — ajout additif
  pays: ['UEMOA', "Côte d'Ivoire", 'Cote d\'Ivoire', 'Senegal', ... ],
  ```
- **Variante plus robuste** : matcher aussi par `dev_libelle='XOF'` (en plus de `pays`) pour capturer tous les fonds zone BRVM quel que soit le libellé pays.
- **Effet** : peuple `indRef` local manquant pour UEMOA ; l'étape B (recalc P1) le convertira ensuite en EUR/USD (XOF géré en parité fixe, recalc lignes 151-153).
- **Risque** : FAIBLE. `import_indices_excel.js` n'écrit `indRef` que si valeur d'indice trouvée à ±7 j et différente de l'existant (lignes 350-361) ; ne touche pas value/perf. Toujours passer `--step 2` sans `--execute` d'abord.

### P4 — CEMAC : décision métier requise (pas de correction technique seule)
- **Constat** : il n'existe aujourd'hui **aucun indice de référence pour la zone CEMAC** dans `indices_references`, donc rien à coller. La couverture 0 % est attendue, pas un bug de conversion.
- **Option A (recommandée court terme)** : laisser CEMAC sans benchmark (statu quo) — aucune régression, le front doit déjà gérer l'absence de courbe indice (à vérifier côté front).
- **Option B (moyen terme)** : sourcer un indice BVMAC / COSUMAF, l'importer dans `indices_references`, ajouter une entrée `INDEX_CONFIG` (`pays:['CEMAC'], devise_locale:'XAF'`), puis étape 2 + recalc. XAF déjà géré (parité fixe + paires EUR/XAF & USD/XAF présentes).
- **Risque** : Option A = NUL. Option B = additive (nouvel indice + nouveau mapping), pas de régression sur l'existant, mais nécessite une **source de données fiable** (ne jamais inventer un benchmark — règle métier).

### P5 (technique, hors couverture) — Incohérence multiplication/division à signaler
- Dans `routes_vl.js`, certains chemins d'import convertissent par **multiplication** (`* exchangeRates.value`, lignes 3027-3028, 3038-3039) alors que la règle projet et le recalc utilisent la **division** (`/ value`, lignes 6058-6068). Si ces chemins (lignes ~3007-3039) sont actifs en prod, ils produisent des EUR/USD erronés.
- **Action** : NE PAS corriger dans ce lot. À vérifier : ces routes sont-elles encore appelées ? (le recalc nocturne écrase de toute façon les `_EUR/_USD` des fonds `active=1`, ce qui masque l'éventuel bug). À tracer dans un lot dédié.
- **Risque si on touchait maintenant** : MOYEN — route VL utilisée en prod. D'où report en diagnostic uniquement.

---

## 6. Résumé exécutif

### 3 causes racines (une par pays déficitaire, toutes DIFFÉRENTES)

1. **TUNISIE 24 %** — `indRef` **local complet à 100 %** mais l'étape de **conversion EUR/USD n'a pas été passée sur tout le périmètre TND** (recalc `active=1` partiel et/ou `dev_libelle` non normalisé). Les taux `EUR/TND`/`USD/TND` existent et sont à jour : ce n'est PAS un problème de taux. Réf : `recalc_eur_usd_daily_rate.js:272-274`, `:105`, `:130-135`.
2. **UEMOA 22 %** — Le déficit est sur l'**indRef local lui-même** : le mapping pays→indice (`import_indices_excel.js:73,286-288`) liste des noms de pays individuels mais les fonds sont stockés `pays='UEMOA'` → la plupart ne matchent jamais BRVM → `indRef` NULL → EUR/USD NULL par cascade.
3. **CEMAC 0 %** — **Aucun indice de référence CEMAC** dans `indices_references` ET aucun mapping (`INDEX_CONFIG` n'a pas d'entrée CEMAC ; MONIA a `pays:[]` filtré ligne 252). Le taux `EUR/XAF` existe pourtant et XAF est déjà géré par le recalc : le blocage est l'absence d'indice/mapping, pas le change.

### 3 actions recommandées (sûres, additives, par ordre de gain/risque)

1. **(P1) Relancer le recalc EUR/USD sur TND** en `--dry-run` puis réel → débloque ~+76 % de couverture Tunisie immédiatement. Risque très faible (colonnes dérivées uniquement). Si `dev_libelle` non normalisé, faire P2 d'abord.
2. **(P3) Étendre le mapping BRVM à `pays='UEMOA'`** (et idéalement matcher aussi `dev_libelle='XOF'`) dans `import_indices_excel.js`, puis `--step 2` report→execute, puis recalc → peuple le local UEMOA manquant puis sa conversion. Risque faible.
3. **(P4) Décision métier CEMAC** : statu quo sûr (Option A) OU sourcer un indice BVMAC/COSUMAF puis import + mapping + recalc (Option B, additif). Ne jamais inventer le benchmark.

---

*Diagnostic produit en revue de code (LOT T13). Données prod issues de `PRODUCTION_STATE.json` du 2026-06-03. Aucune écriture code/DB effectuée. Validation et exécution des SELECT §4 puis des actions §5 à réaliser par l'admin sur le VPS.*
