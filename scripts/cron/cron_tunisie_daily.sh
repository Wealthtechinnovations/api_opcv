#!/bin/bash
set -e

# CMF Tunisie Daily VL Scraper
# Cron: 0 19 * * 1-5  (Mon-Fri at 19h, before the main cron_daily_update at 20h)
#
# This script:
# 1. Scrapes CMF Tunisie website for new OPCVM VL Excel files
# 2. Parses and imports into the production database
# 3. Extreme variations (>20%) are quarantined, not imported
# 4. New unknown funds are queued for manual validation

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRAPER="$API_DIR/scripts/scraper/cmf_tunisie_daily.py"
LOG_DIR="$API_DIR/data/tunisie_cmf/logs"

source "$API_DIR/.env" 2>/dev/null || true

mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/cron_tunisie_$(date +%Y%m%d_%H%M%S).log"

echo "$(date) — Starting CMF Tunisie daily scraper" | tee -a "$LOG_FILE"

python3 "$SCRAPER" --production --lookback-days 45 2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    echo "$(date) — CMF Tunisie import completed successfully" | tee -a "$LOG_FILE"
else
    echo "$(date) — CMF Tunisie import FAILED (exit code: $EXIT_CODE)" | tee -a "$LOG_FILE"
fi

exit $EXIT_CODE
