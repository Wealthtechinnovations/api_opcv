#!/bin/bash
# ===========================================================================
# SNAPSHOT PRODUCTION RUNTIME — LECTURE / MESURE, SANS ECRITURE GIT
# ===========================================================================
# Ce script tourne sur le SERVEUR DE PRODUCTION.
# Il mesure l'etat reel de FundAfrica sans faire de la production une autorite
# Git concurrente. Le snapshot runtime est ecrit hors du working tree Git.
#
# Usage:
#   bash scripts/deploy/sync_production.sh
#
# Ce qu'il fait:
#   1. Mesure l'etat de la base de donnees et des routes critiques
#   2. Ecrit atomiquement le snapshot runtime hors du depot Git
#   3. N'effectue AUCUN git add, commit, push, pull, reset ou checkout
#
# Le fichier historique PRODUCTION_STATE.json du depot reste disponible comme
# fallback documentaire, mais n'est plus rafraichi ni commite depuis S2.
# ===========================================================================

set -e

API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
FRONTEND_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend"
API_URL="http://localhost:3005"
STATE_DIR="${FUNDAFRICA_RUNTIME_STATE_DIR:-/var/lib/fundafrica/runtime}"
STATE_FILE="$STATE_DIR/PRODUCTION_STATE.json"

source "$API_DIR/.env" 2>/dev/null || true
DB_USER="${DB_USER:-fund_opcvm}"
DB_PASS="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-fund_opcvm}"
DB_HOST="${DB_HOST:-127.0.0.1}"

echo "============================================"
echo "SNAPSHOT PRODUCTION — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

echo ""
echo "--- Generation du snapshot base de donnees ---"

cd "$API_DIR"
mkdir -p "$STATE_DIR"
chmod 755 "$STATE_DIR"
TMP_STATE="$(mktemp "$STATE_DIR/.PRODUCTION_STATE.json.XXXXXX")"
trap 'rm -f "$TMP_STATE"' EXIT

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

  const [vlPays] = await conn.query(\`
    SELECT f.pays, COUNT(DISTINCT v.fund_id) as nb_fonds, COUNT(*) as nb_vl,
           MAX(v.date) as derniere_date, MIN(v.date) as premiere_date
    FROM valorisations v
    JOIN fond_investissements f ON f.id = v.fund_id
    WHERE f.active = 1
    GROUP BY f.pays ORDER BY f.pays
  \`);
  state.derniere_vl_par_pays = vlPays;

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

  const [indStats] = await conn.query(\`
    SELECT id_indice, nom_indice, COUNT(*) as nb_entrees,
           MIN(date) as date_min, MAX(date) as date_max
    FROM indice_references
    GROUP BY id_indice, nom_indice
  \`);
  state.indices_references_stats = indStats;

  const [perfStats] = await conn.query(\`
    SELECT 'performences' as tbl, COUNT(*) as cnt, COUNT(DISTINCT fond_id) as nb_fonds FROM performences
    UNION ALL
    SELECT 'performences_eurs', COUNT(*), COUNT(DISTINCT fond_id) FROM performences_eurs
    UNION ALL
    SELECT 'performences_usds', COUNT(*), COUNT(DISTINCT fond_id) FROM performences_usds
  \`);
  state.performances_stats = perfStats;

  const [devStats] = await conn.query(\`
    SELECT paire, COUNT(*) as nb_entrees, MIN(date) as date_min, MAX(date) as date_max
    FROM devisedechanges GROUP BY paire ORDER BY paire
  \`);
  state.devisedechanges_stats = devStats;

  const [fondsPays] = await conn.query(\`
    SELECT pays, COUNT(*) as nb_fonds, SUM(CASE WHEN active=1 THEN 1 ELSE 0 END) as actifs
    FROM fond_investissements GROUP BY pays ORDER BY pays
  \`);
  state.fonds_par_pays = fondsPays;

  await conn.end();

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
" > "$TMP_STATE"

chmod 644 "$TMP_STATE"
mv -f "$TMP_STATE" "$STATE_FILE"
trap - EXIT

echo "  -> Snapshot runtime genere: $STATE_FILE ($(wc -c < "$STATE_FILE") octets)"
echo "  -> Git non modifie: aucun add/commit/push"

echo ""
echo "============================================"
echo "SNAPSHOT TERMINE — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""
echo "Etat production runtime: $STATE_FILE"
echo "Le depot Git reste une source de code canonique, pas une sortie de cron."
