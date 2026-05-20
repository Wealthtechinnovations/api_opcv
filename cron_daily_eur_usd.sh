#!/bin/bash
# ===========================================================================
# CRON QUOTIDIEN — Recalcul performances EUR/USD + classements
# ===========================================================================
# Schedule: 21h30 quotidien (apres le cron principal de 20h)
#   30 21 * * * cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash cron_daily_eur_usd.sh >> /var/log/cron_eur_usd.log 2>&1
#
# S'execute APRES le cron quotidien principal qui importe les VL du jour.
# ===========================================================================

set -e

API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
API_URL="http://localhost:3005"

echo "============================================"
echo "CRON EUR/USD — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

cd "$API_DIR"

# 1. Recalcul performances EUR + USD (seulement les fonds pas a jour)
echo "--- Performances EUR + USD ---"
node fix_populate_performances_eur_usd.js --devise BOTH 2>&1 | tail -15

# 2. Recalcul classements EUR + USD
echo ""
echo "--- Classements EUR ---"
curl -s "$API_URL/api/classementeur" --max-time 300 | head -c 100
echo ""
echo "--- Classements USD ---"
curl -s "$API_URL/api/classementusd" --max-time 300 | head -c 100
echo ""

# 3. Verification
echo ""
echo "--- Verification ---"
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'127.0.0.1',user:'fund_opcvm',password:'66G41zes~',database:'fund_opcvm'});
  for (const t of ['performences_eurs','performences_usds','classementfonds_eurs','classementfonds_usds']) {
    const [r] = await c.query('SELECT COUNT(*) as cnt, COUNT(DISTINCT fond_id) as fonds FROM ??', [t]);
    console.log('  ' + t.padEnd(25) + r[0].cnt + ' lignes / ' + r[0].fonds + ' fonds');
  }
  await c.end();
})();
"

echo ""
echo "CRON EUR/USD TERMINE — $(date '+%Y-%m-%d %H:%M:%S')"
