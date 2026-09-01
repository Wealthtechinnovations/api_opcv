#!/bin/bash
# ===========================================================================
# SYNC PRODUCTION <-> DEV (repos locaux Claude Code)
# ===========================================================================
# Ce script tourne sur le SERVEUR DE PRODUCTION.
# Il fait un git push depuis la production vers les repos distants,
# permettant a Claude Code de toujours avoir le code identique a la prod.
#
# Usage:
#   Sur le serveur de production, lancer:
#     bash sync_production.sh
#
# Ce qu'il fait:
#   1. Pull les derniers changements depuis le repo distant
#   2. Dump un snapshot de l'etat de la base de donnees (structure + stats)
#   3. Push le snapshot vers le repo distant
#   4. Teste les routes API critiques et sauvegarde les resultats
#
# Le fichier PRODUCTION_STATE.json genere contient:
#   - Etat des tables (nombre de lignes, colonnes)
#   - Dernieres VL par pays
#   - Etat des indices
#   - Etat des performances
#   - Etat des taux de change
#   - Version du code deploye (git log)
#   - Tests des routes critiques
# ===========================================================================

set -e

BRANCH="claude/code-review-improvements-ikvuj"
API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
FRONTEND_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend"
API_URL="http://localhost:3005"
source "$API_DIR/.env" 2>/dev/null || true
DB_USER="${DB_USER:-fund_opcvm}"
DB_PASS="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-fund_opcvm}"
DB_HOST="${DB_HOST:-127.0.0.1}"

echo "============================================"
echo "SYNC PRODUCTION — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

# 1. Generer PRODUCTION_STATE.json avec etat complet de la base
echo ""
echo "--- Generation du snapshot base de donnees ---"

cd "$API_DIR"

node -e "
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '$DB_HOST', user: '$DB_USER', password: '$DB_PASS', database: '$DB_NAME'
  });

  const state = {
    generated_at: new Date().toISOString(),
    git_api: '',
    git_frontend: '',
    pm2_status: '',
    tables: {},
    derniere_vl_par_pays: [],
    indices_references_stats: [],
    performances_stats: [],
    devisedechanges_stats: [],
    valorisations_indref_coverage: [],
    routes_test: {}
  };

  // Stats tables principales
  const tables = [
    'fond_investissements', 'valorisations', 'indice_references',
    'devisedechanges', 'performences', 'performences_eurs', 'performences_usds',
    'classementfonds', 'classementfonds_eurs', 'classementfonds_usds',
    'societes', 'pays_regulateurs', 'users'
  ];
  for (const t of tables) {
    try {
      const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM ??', [t]);
      state.tables[t] = rows[0].cnt;
    } catch(e) { state.tables[t] = 'ERROR: ' + e.message; }
  }

  // Derniere VL par pays
  const [vlPays] = await conn.query(\`
    SELECT f.pays, COUNT(DISTINCT v.fund_id) as nb_fonds, COUNT(*) as nb_vl,
           MAX(v.date) as derniere_date, MIN(v.date) as premiere_date
    FROM valorisations v
    JOIN fond_investissements f ON f.id = v.fund_id
    WHERE f.active = 1
    GROUP BY f.pays ORDER BY f.pays
  \`);
  state.derniere_vl_par_pays = vlPays;

  // Couverture indRef
  const [indrefCov] = await conn.query(\`
    SELECT f.pays,
           COUNT(*) as total_vl,
           SUM(CASE WHEN v.indRef IS NOT NULL THEN 1 ELSE 0 END) as avec_indref,
           SUM(CASE WHEN v.indRef_EUR IS NOT NULL THEN 1 ELSE 0 END) as avec_indref_eur,
           SUM(CASE WHEN v.indRef_USD IS NOT NULL THEN 1 ELSE 0 END) as avec_indref_usd
    FROM valorisations v
    JOIN fond_investissements f ON f.id = v.fund_id
    WHERE f.active = 1
    GROUP BY f.pays ORDER BY f.pays
  \`);
  state.valorisations_indref_coverage = indrefCov;

  // Stats indices
  const [indStats] = await conn.query(\`
    SELECT id_indice, nom_indice, COUNT(*) as nb_entrees,
           MIN(date) as date_min, MAX(date) as date_max
    FROM indice_references
    GROUP BY id_indice, nom_indice
  \`);
  state.indices_references_stats = indStats;

  // Stats performances
  const [perfStats] = await conn.query(\`
    SELECT 'performences' as tbl, COUNT(*) as cnt, COUNT(DISTINCT fond_id) as nb_fonds FROM performences
    UNION ALL
    SELECT 'performences_eurs', COUNT(*), COUNT(DISTINCT fond_id) FROM performences_eurs
    UNION ALL
    SELECT 'performences_usds', COUNT(*), COUNT(DISTINCT fond_id) FROM performences_usds
  \`);
  state.performances_stats = perfStats;

  // Stats devises
  const [devStats] = await conn.query(\`
    SELECT paire, COUNT(*) as nb_entrees, MIN(date) as date_min, MAX(date) as date_max
    FROM devisedechanges GROUP BY paire ORDER BY paire
  \`);
  state.devisedechanges_stats = devStats;

  // Fonds actifs par pays
  const [fondsPays] = await conn.query(\`
    SELECT pays, COUNT(*) as nb_fonds, SUM(CASE WHEN active=1 THEN 1 ELSE 0 END) as actifs
    FROM fond_investissements GROUP BY pays ORDER BY pays
  \`);
  state.fonds_par_pays = fondsPays;

  await conn.end();

  // Git info
  const { execSync } = require('child_process');
  try {
    state.git_api = execSync('git -C $API_DIR log --oneline -5 2>/dev/null').toString().trim();
  } catch(e) {}
  try {
    state.git_frontend = execSync('git -C $FRONTEND_DIR log --oneline -5 2>/dev/null').toString().trim();
  } catch(e) {}
  try {
    state.pm2_status = execSync('pm2 jlist 2>/dev/null').toString().trim();
  } catch(e) {}

  // Test routes critiques
  const http = require('http');
  const testUrl = (url) => new Promise((resolve) => {
    const req = http.get(url, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, size: body.length }));
    });
    req.on('error', e => resolve({ status: 'ERROR', error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT' }); });
  });

  state.routes_test = {
    valLiq_866: await testUrl('$API_URL/api/valLiq/866'),
    valLiq_1141: await testUrl('$API_URL/api/valLiq/1141'),
    actualites: await testUrl('$API_URL/api/getactualite'),
    pays: await testUrl('$API_URL/api/getPaysall'),
  };

  process.stdout.write(JSON.stringify(state, null, 2));
})();
" > PRODUCTION_STATE.json

echo "  -> PRODUCTION_STATE.json genere ($(wc -c < PRODUCTION_STATE.json) octets)"

# 2. Commit et push le snapshot
git add PRODUCTION_STATE.json
git diff --cached --quiet && echo "  Aucun changement" || {
  git commit -m "chore: snapshot production state $(date '+%Y-%m-%d %H:%M')"
  git push origin "$BRANCH" && echo "  -> Push OK" || echo "  -> Push ECHEC"
}

echo ""
echo "============================================"
echo "SYNC TERMINE — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""
echo "Claude Code peut maintenant lire PRODUCTION_STATE.json"
echo "pour connaitre l'etat exact de la production."
