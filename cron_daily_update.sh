#!/bin/bash
# =============================================================================
# Mise a jour quotidienne automatique - Africafunds
#
# Ce script est lance par cron chaque jour ouvre a 20h (apres cloture marches)
# Il fait 3 choses:
#   1. Scrape les VL ASFIM (Maroc) des 5 derniers jours
#   2. Met a jour les paires de devises (derniers 5 jours)
#   3. Recalcule les performances
#
# Installation cron (une seule fois):
#   crontab -e
#   Ajouter la ligne:
#   0 20 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/cron_daily_update.sh >> /var/log/africafunds_cron.log 2>&1
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
echo "[1/3] Scrape ASFIM VL Maroc ($START_DATE -> $TODAY)..." | tee -a "$LOG_FILE"
node scrape_asfim_import.js "$START_DATE" "$TODAY" 2>&1 | tee -a "$LOG_FILE"

# 2. Mise a jour Forex
echo "" | tee -a "$LOG_FILE"
echo "[2/3] Mise a jour Forex (derniers jours)..." | tee -a "$LOG_FILE"
node scrape_forex_import.js today 2>&1 | tee -a "$LOG_FILE"

# 3. Recalcul performances (optionnel - decommenter si necessaire)
# echo "" | tee -a "$LOG_FILE"
# echo "[3/3] Recalcul performances..." | tee -a "$LOG_FILE"
# curl -s http://localhost:3005/api/saveperfdatemysql/1/600 | tee -a "$LOG_FILE"
# curl -s http://localhost:3005/api/saveperfdatemysql/601/1200 | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "=== MISE A JOUR TERMINEE $(date) ===" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
