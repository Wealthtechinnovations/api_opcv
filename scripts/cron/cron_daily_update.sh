#!/bin/bash
set -e
# =============================================================================
# Mise a jour quotidienne automatique - Africafunds
#
# Ce script est lance par cron chaque jour ouvre a 20h (apres cloture marches)
# Il fait 9 choses:
#   1. Scrape les VL ASFIM (Maroc) des 5 derniers jours
#   2. Met a jour les paires de devises (derniers 5 jours)
#   3. Recalcul EUR/USD daily rates
#   4. Recalcule les VL Ajustees (Total Return NAV avec dividendes)
#   5. Recalcule les performances locale (fonds 1-600)
#   6. Recalcule les performances locale (fonds 601-1200)
#   7. Recalcule les performances locale (fonds 1201-3000)
#   8. Recalcul performances EUR/USD
#   9. Classements local + EUR + USD
#
# Installation cron (une seule fois):
#   crontab -e
#   Ajouter la ligne:
#   0 20 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_daily_update.sh >> /var/log/africafunds_cron.log 2>&1
#
# =============================================================================

API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
LOG_FILE="/var/log/africafunds_daily_$(date +%Y%m%d).log"

echo "========================================" | tee -a "$LOG_FILE"
echo "=== AFRICAFUNDS DAILY UPDATE ===" | tee -a "$LOG_FILE"
echo "=== $(date) ===" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

cd "$API_DIR" || exit 1

# Date de debut = il y a 5 jours (couvre le weekend + jours feries)
START_DATE=$(date -d "-5 days" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

# 1. Scrape VL ASFIM (Maroc)
echo "" | tee -a "$LOG_FILE"
echo "[1/9] Scrape ASFIM VL Maroc ($START_DATE -> $TODAY)..." | tee -a "$LOG_FILE"
node scripts/import/scrape_asfim_import.js "$START_DATE" "$TODAY" 2>&1 | tee -a "$LOG_FILE"

# 2. Mise a jour Forex
echo "" | tee -a "$LOG_FILE"
echo "[2/9] Mise a jour Forex (derniers jours)..." | tee -a "$LOG_FILE"
node scripts/import/scrape_forex_import.js today 2>&1 | tee -a "$LOG_FILE"

# 3. Recalcul EUR/USD daily rates
echo "" | tee -a "$LOG_FILE"
echo "[3/9] Recalcul EUR/USD daily rates..." | tee -a "$LOG_FILE"
node scripts/recalc/recalc_eur_usd_daily_rate.js 2>&1 | tee -a "$LOG_FILE"

# 4. Recalcul VL Ajuste (Total Return NAV)
echo "" | tee -a "$LOG_FILE"
echo "[4/9] Recalcul VL Ajuste (tous fonds actifs)..." | tee -a "$LOG_FILE"
node scripts/recalc/recalc_vl_ajuste.js 2>&1 | tee -a "$LOG_FILE"

# 5. Recalcul performances locale (fonds 1-600)
echo "" | tee -a "$LOG_FILE"
echo "[5/9] Recalcul performances locale (fonds 1-600)..." | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdatemysql/1/600 2>&1 | tee -a "$LOG_FILE"

# 6. Recalcul performances locale (fonds 601-1200)
echo "" | tee -a "$LOG_FILE"
echo "[6/9] Recalcul performances locale (fonds 601-1200)..." | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdatemysql/601/1200 2>&1 | tee -a "$LOG_FILE"

# 7. Recalcul performances locale (fonds 1201-3000)
echo "" | tee -a "$LOG_FILE"
echo "[7/9] Recalcul performances locale (fonds 1201-3000)..." | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdatemysql/1201/3000 2>&1 | tee -a "$LOG_FILE"

# 8. Recalcul performances EUR/USD
echo "" | tee -a "$LOG_FILE"
echo "[8/9] Recalcul performances EUR/USD..." | tee -a "$LOG_FILE"
node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH 2>&1 | tee -a "$LOG_FILE"

# 9. Classements local + EUR + USD
echo "" | tee -a "$LOG_FILE"
echo "[9/9] Classements local + EUR + USD..." | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/classementmysql --max-time 300 2>&1 | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/classementeur --max-time 300 2>&1 | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/classementusd --max-time 300 2>&1 | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "=== MISE A JOUR TERMINEE $(date) ===" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
