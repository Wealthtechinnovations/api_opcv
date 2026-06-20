#!/bin/bash

# =============================================================================
# Daily Index Scraper — Africafunds
#
# Scrapes closing values for the 5 major market indices tracked by the platform
# (BRVM Composite, MASI, Tunindex, NSE All Share, MONIA) and inserts them
# into indice_references + propagates to valorisations.indRef.
#
# Cron recommande : 30 18 * * 1-5 (lun-ven 18h30 UTC, apres cloture des marches
#                   africains et avant le cron principal de 20h)
#
# Installation cron (une seule fois):
#   crontab -e
#   Ajouter la ligne:
#   30 18 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_indices_daily.sh >> /var/log/cron_indices_daily.log 2>&1
#
# Ce script :
# 1. Scrape les valeurs de cloture des 5 indices majeurs
# 2. Insere les nouvelles valeurs dans indice_references (idempotent)
# 3. Propage indRef dans valorisations pour les fonds lies
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRAPER="$API_DIR/scripts/scraper/scrape_indices_daily.js"
LOG_FILE="/var/log/cron_indices_daily.log"

# Source .env for any environment variables
source "$API_DIR/.env" 2>/dev/null || true

echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "$(date) — Starting daily index scraper" | tee -a "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

node "$SCRAPER" --execute 2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    echo "$(date) — Daily index scraper completed successfully" | tee -a "$LOG_FILE"
else
    echo "$(date) — Daily index scraper FAILED (exit code: $EXIT_CODE)" | tee -a "$LOG_FILE"
fi

echo "========================================" >> "$LOG_FILE"

exit $EXIT_CODE
