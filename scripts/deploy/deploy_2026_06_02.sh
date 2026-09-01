#!/bin/bash
set -e

# =============================================================
# DEPLOYMENT SCRIPT — 2026-06-02
# =============================================================
# Deploys:
# 1. Security fixes (eval RCE, SQL injection, rate limiting, multer)
# 2. CMF Tunisie automated daily scraper
# 3. Health check cron
# 4. NaN className frontend fixes
#
# Run on PRODUCTION SERVER as root:
#   bash /path/to/deploy_2026_06_02.sh
# =============================================================

BRANCH="claude/code-review-improvements-ikvuj"
API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
FE_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend"

echo "=== Africafunds Deployment 2026-06-02 ==="
echo "Date: $(date)"
echo ""

# ---- STEP 1: Backup current state ----
echo "--- STEP 1: Backup current state ---"
cd "$API_DIR"
API_COMMIT_BEFORE=$(git rev-parse HEAD)
echo "API current commit: $API_COMMIT_BEFORE"

cd "$FE_DIR"
FE_COMMIT_BEFORE=$(git rev-parse HEAD)
echo "Frontend current commit: $FE_COMMIT_BEFORE"
echo ""

# ---- STEP 2: Deploy API ----
echo "--- STEP 2: Deploy API ---"
cd "$API_DIR"
git stash 2>/dev/null || true
git pull --rebase origin "$BRANCH"
git stash pop 2>/dev/null || true
echo "API deployed. New commit: $(git rev-parse --short HEAD)"
echo ""

# ---- STEP 3: Deploy Frontend ----
echo "--- STEP 3: Deploy Frontend ---"
cd "$FE_DIR"
git stash 2>/dev/null || true
git pull --rebase origin "$BRANCH"
git stash pop 2>/dev/null || true
echo "Building frontend..."
npm run build
echo "Frontend built. New commit: $(git rev-parse --short HEAD)"
echo ""

# ---- STEP 4: Install Python dependencies for CMF scraper ----
echo "--- STEP 4: Install Python dependencies ---"
pip3 install -r "$API_DIR/scripts/scraper/requirements_cmf.txt" 2>&1 || echo "WARNING: pip install failed, check manually"
echo ""

# ---- STEP 5: Restart PM2 processes ----
echo "--- STEP 5: Restart PM2 ---"
pm2 restart api-monolith
pm2 restart fundafrique-frontend
pm2 save
echo ""

# ---- STEP 6: Verify services ----
echo "--- STEP 6: Verify services ---"
sleep 3
pm2 list

echo ""
echo "Testing API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/api/ref/pays)
echo "API /api/ref/pays: HTTP $API_STATUS"

FUND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/api/valLiq/866)
echo "API /api/valLiq/866: HTTP $FUND_STATUS"

echo ""
echo "Testing Frontend..."
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "Frontend /: HTTP $FE_STATUS"
echo ""

# ---- STEP 7: Test CMF Tunisie scraper (dry-run) ----
echo "--- STEP 7: Test CMF Tunisie scraper (dry-run) ---"
cd "$API_DIR"
python3 scripts/scraper/cmf_tunisie_daily.py --dry-run --lookback-days 30 2>&1 | tail -20
echo ""

# ---- STEP 8: Execute CMF Tunisie import ----
echo "--- STEP 8: Execute CMF Tunisie import (production) ---"
echo "IMPORTANT: Review the dry-run output above before proceeding."
echo "To import missing Tunisie VL, run:"
echo "  cd $API_DIR && python3 scripts/scraper/cmf_tunisie_daily.py --production --lookback-days 30"
echo ""

# ---- STEP 9: Add crons ----
echo "--- STEP 9: Crons to add ---"
echo "Add these to crontab (crontab -e):"
echo "  0 19 * * 1-5  cd $API_DIR && bash scripts/cron/cron_tunisie_daily.sh >> /dev/null 2>&1"
echo "  0 22 * * *    cd $API_DIR && bash scripts/cron/cron_health_check.sh >> /dev/null 2>&1"
echo ""

echo "=== Deployment complete ==="
echo "API: $API_COMMIT_BEFORE -> $(cd $API_DIR && git rev-parse --short HEAD)"
echo "Frontend: $FE_COMMIT_BEFORE -> $(cd $FE_DIR && git rev-parse --short HEAD)"
echo ""
echo "NEXT STEPS:"
echo "1. Verify the dry-run output above"
echo "2. Run: cd $API_DIR && python3 scripts/scraper/cmf_tunisie_daily.py --production --lookback-days 30"
echo "3. After import, trigger recalculations:"
echo "   node scripts/recalc/recalc_vl_ajuste.js TUNISIE"
echo "   node scripts/recalc/recalc_eur_usd_daily_rate.js"
echo "4. Add the cron entries listed in STEP 9"
