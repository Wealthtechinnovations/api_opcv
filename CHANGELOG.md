# CHANGELOG — api_opcv (Backend)

> **Doc canonique** : `../front_end_opcvm/CHANGELOG.md` (changelog produit unifie front + back).
> Ce fichier liste uniquement les jalons cote API pour un developpeur travaillant dans ce depot.
> Eviter la duplication : detail complet dans le CHANGELOG frontend et SUIVI.md.

## [2026-06-25] — A DEPLOYER (Indices : rebranchement sources + fix MONIA + continuite)
- **Scraper indices rebranche sur sources officielles 2026** (`scripts/scraper/scrape_indices_daily.js`, commit `5314fe0`) :
  BRVM→BOC PDF (helper Python pdfplumber), MASI→API medias24, Tunindex→API REST BVMT,
  NSE→NGX doclib JSON, MONIA→CSV BKAM via curl. Insertion DB et propagation indRef INCHANGEES (additif).
- **Fix MONIA** : `curlGetText` durci (`-f` → echec sur HTTP 4xx/5xx, entetes Sec-Fetch) et
  `scrapeMONIA` (double URL EN/FR + validation contenu CSV) pour eviter l'echec silencieux sur VPS
  (WAF bkam.ma renvoyait une page de blocage 200 prise pour le CSV).
- **Analyse de continuite (NON destructive, diagnostic)** : les valeurs DB NSE/Tunindex/MASI au
  2026-05-15 etaient FAUSSES (queue gelee par l'ancien scraper HTML depuis ~jan 2025). Le scraper
  neuf renvoie les vraies valeurs (confirme multi-sources). Aucun rebase d'indice.
- **Nouveaux scripts** (zero ecriture par defaut) :
  - `scripts/scraper/diagnose_index_history.js` — READ-ONLY : compare DB vs source autoritative,
    detecte la date de gel et le verdict.
  - `scripts/scraper/fix_index_tail.js` — corrige le segment gele (UPDATE+INSERT vraies valeurs),
    DRY-RUN par defaut, `--since` obligatoire, idempotent, scope `indice_references`.
- Detail operationnel + ordre d'execution : `../front_end_opcvm/SUIVI.md` (POINT DE REPRISE COURANT).

## [2026-06-18] — DEPLOYE (LOT 1-3 classements/rankings)
- **#54 LOT 1** — Fix rankings null/Infinity dans `ranking.service.js` :
  - `buildRankResult()` retournait Infinity quand total=0 (division par zero) → corrige
  - Null handling ajoute dans les calculs de classement
- **#55 LOT 2** — Fix moyennes par categorie dans `apigestionsavequotidien.js` :
  - Calcul des moyennes categorie corrige (25 moyennes non-null verifiees en production)
- **#56 LOT 3** — Fix consistance transactionnelle dans `apigestionsavequotidien.js` :
  - 3 routes classement (classementmysql, classementeur, classementusd) corrigees
  - Ajout `{ transaction }` aux 27 operations Sequelize findOne/save/create hors transaction
  - Ajout null guards sur l'acces aux donnees de classement
  - Commit: `e3d8fec`
  - Verifie en production : 3545 local + 3579 EUR + 3579 USD classements peuples correctement
  - Fonds 866 : rank3Mois=86/300, rank3Moistotalm=300 confirme

## [2026-06-17] — A DEPLOYER (ClickHouse resilience)
- **Incident** : ClickHouse serveur a sature le disque (stderr.log ~41 Go), bloquant
  toutes les applications du VPS. Cause : crash-loop + logging verbeux sans rotation.
- **#52** Durcissement code (additif, zero regression frontend) :
  - Flag `CLICKHOUSE_ENABLED` (.env) pour desactivation propre
  - Coupe-circuit : arret sync apres `CLICKHOUSE_MAX_SYNC_FAILURES` echecs (defaut 3)
  - `request_timeout` 30s ; lecture VL paginee keyset (memoire bornee)
- Confirme : aucune route `/api/analytics` consommee par le frontend
- **A faire cote serveur** (hors repo, avec equipe serveur) : rotation+plafond log
  ClickHouse (config.d) AVANT toute reactivation
- Commit: `b815153` (pousse, pas encore deploye)

## [2026-06-13] — DEPLOYE (AUDIT-C/D)
- **#42** Route ClickHouse `/api/classementquartile/:id` → stub 410 Gone (dead code, `clickhouse` jamais importe)
- **#43** Path traversal multer filename → `path.basename()` (`routes_vl.js:332`)
- **#48** SQL injection worker-recalculation.js : `fund_id` parametrise
- Commit: `e5dddb6` (deploye + pm2 restart api-monolith)

## [2026-06-12] — DEPLOYE (T35 BRVM BOC)
- **Module BRVM BOC complet** : scraper PDF, parseur multi-format, promotion VL, route /api/brvm/boc/status
- **4406 VL UEMOA promues** (111 fonds, gap comble depuis 2022)
- **cron_brvm_daily.sh** installe (lun-ven 19h30)
- Tables: brvm_boc_sources, brvm_boc_navs_raw, brvm_fund_aliases, brvm_import_logs, brvm_missing_navs
- Commit: `8a3a707`

## [2026-06-05] — DEPLOYE (T17, T19, T20)
- **T17** Fix routes_vl.js 10 lignes multiplication→division (updateValues + uploadsfilevl)
- **T20** Nigeria : 21 fichiers SEC 2026, 82 VL inserees, recalc EUR/USD + classements

## [2026-06-04] — DEPLOYE (T15)
- **UEMOA indRef 22% → 100%** (DEPLOYE): 111/111 fonds, 33830/33830 VL (local + EUR + USD)
- T15 (`f6d7cb2`): Ajout 'UEMOA' dans BRVM_UEMOA pays mapping + step 4 multiplication→division
- T15b (`ac1cf98`, `2990351`): DB fallback si Excel absent + case-insensitive id_indice matching
- Nouveau script: `scripts/diag/check_indref_coverage.js` (read-only diagnostic)
- Execution prod T15c: step 2 (33829 VL), step 4 (26253 VL), perfs EUR/USD (108 fonds), classements recalcules
- **T17** (A DEPLOYER): Fix routes_vl.js 10 lignes multiplication→division (updateValues + uploadsfilevl) — conversion local→EUR/USD en base

## [2026-06-03] — DEPLOYE EN PRODUCTION
- Classements: national local (MAX(date)/fond) + dedup EUR/USD — `src/services/ranking.service.js` (`6644682`). **Recalcul effectue, type1 OK.**
- routes_vl.js: 10 `.catch()` ajoutes (`5b70838`)
- routes_recalc_admin.js: auth JWT admin sur 8 routes (`5540d95`)
- apigestionfonds.js: valLiq/valLiqdev 404 au lieu de 500 (`bb03081`)
- 2 crons ajoutes au crontab VPS : cron_tunisie_daily.sh (19h L-V), cron_health_check.sh (22h)
- T13: Diagnostic liaison indices↔fonds + couverture indRef EUR/USD (`e06798b`) — rapport seul, aucun code modifie

## Anterieur
Voir `CORRECTIONS.md` (ce depot) et `../front_end_opcvm/CHANGELOG.md`.
