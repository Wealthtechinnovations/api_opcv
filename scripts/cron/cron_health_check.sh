#!/bin/bash
# =============================================================================
# Verification quotidienne de sante — Africafunds
#
# Ce script est lance par cron chaque jour a 22h (apres tous les autres crons)
# Il verifie que les imports et recalculs se sont bien executes.
#
# Installation cron:
#   0 22 * * * /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_health_check.sh >> /var/log/africafunds_health.log 2>&1
#
# =============================================================================

API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
LOG_FILE="/var/log/africafunds_health_$(date +%Y%m%d).log"

echo "========================================" | tee -a "$LOG_FILE"
echo "=== AFRICAFUNDS HEALTH CHECK ===" | tee -a "$LOG_FILE"
echo "=== $(date) ===" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

cd "$API_DIR" || exit 1

# Le statut doit etre celui du controle, pas celui de `tee`.
node scripts/monitoring/check_cron_health.js 2>&1 | tee -a "$LOG_FILE"
RC_HEALTH=${PIPESTATUS[0]}

echo "" | tee -a "$LOG_FILE"
echo "=== HEALTH CHECK TERMINE $(date) ===" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Sortir non nul si des problemes ont ete detectes : c est ce qui permet enfin
# a un superviseur (MAILTO cron, monitoring) de reagir sans lecture manuelle.
exit "${RC_HEALTH:-0}"
