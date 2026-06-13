#!/bin/bash
# ===========================================================================
# CRON QUOTIDIEN — Recalcul performances EUR/USD + classements
# ===========================================================================
# Schedule: 21h30 quotidien (apres le cron principal de 20h)
#   30 21 * * * cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && bash scripts/cron/cron_daily_eur_usd.sh >> /var/log/cron_eur_usd.log 2>&1
#
# S'execute APRES le cron quotidien principal qui importe les VL du jour.
# ===========================================================================

API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
API_URL="http://localhost:3005"
ERRORS=0

echo "============================================"
echo "CRON EUR/USD — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

cd "$API_DIR" || exit 1

# 1. Recalcul performances EUR + USD (seulement les fonds pas a jour)
echo "--- [1/3] Performances EUR + USD ---"
if node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH 2>&1 | tail -15; then
  echo "[1/3] OK"
else
  echo "[1/3] ERREUR"
  ERRORS=$((ERRORS + 1))
fi

# 2. Recalcul classements EUR + USD
echo ""
echo "--- [2/3] Classements EUR ---"
HTTP_EUR=$(curl -s -o /dev/stdout -w '\n%{http_code}' "$API_URL/api/classementeur" --max-time 300)
HTTP_EUR_CODE=$(echo "$HTTP_EUR" | tail -1)
echo "$HTTP_EUR" | head -c 100
echo ""
if [ "$HTTP_EUR_CODE" -ge 200 ] && [ "$HTTP_EUR_CODE" -lt 300 ] 2>/dev/null; then
  echo "[2a/3] OK (HTTP $HTTP_EUR_CODE)"
else
  echo "[2a/3] ERREUR (HTTP $HTTP_EUR_CODE)"
  ERRORS=$((ERRORS + 1))
fi

echo "--- Classements USD ---"
HTTP_USD=$(curl -s -o /dev/stdout -w '\n%{http_code}' "$API_URL/api/classementusd" --max-time 300)
HTTP_USD_CODE=$(echo "$HTTP_USD" | tail -1)
echo "$HTTP_USD" | head -c 100
echo ""
if [ "$HTTP_USD_CODE" -ge 200 ] && [ "$HTTP_USD_CODE" -lt 300 ] 2>/dev/null; then
  echo "[2b/3] OK (HTTP $HTTP_USD_CODE)"
else
  echo "[2b/3] ERREUR (HTTP $HTTP_USD_CODE)"
  ERRORS=$((ERRORS + 1))
fi

# 3. Verification
echo ""
echo "--- [3/3] Verification ---"
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:process.env.DB_HOST||'127.0.0.1',user:process.env.DB_USER||'fund_opcvm',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'fund_opcvm'});
  for (const t of ['performences_eurs','performences_usds','classementfonds_eurs','classementfonds_usds']) {
    const [r] = await c.query('SELECT COUNT(*) as cnt, COUNT(DISTINCT fond_id) as fonds FROM ??', [t]);
    console.log('  ' + t.padEnd(25) + r[0].cnt + ' lignes / ' + r[0].fonds + ' fonds');
  }
  await c.end();
})();
" 2>&1 || echo "[3/3] Verification ERREUR"

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "CRON EUR/USD TERMINE SANS ERREUR — $(date '+%Y-%m-%d %H:%M:%S')"
else
  echo "CRON EUR/USD TERMINE AVEC $ERRORS ERREUR(S) — $(date '+%Y-%m-%d %H:%M:%S')"
fi
