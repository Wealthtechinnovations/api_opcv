#!/bin/bash
# =============================================================================
# Mise a jour hebdomadaire Nigeria - Africafunds
#
# Ce script est lance par cron chaque lundi a 10h (apres publication SEC Nigeria)
# La SEC Nigeria publie les NAV hebdomadaires chaque vendredi.
#
# Il fait 7 choses:
#   1. Telecharge et extrait les fichiers Excel SEC Nigeria (annee courante)
#   2. Importe les VL dans la base MySQL
#   3. Recalcule les taux EUR/USD quotidiens
#   4. Recalcule les VL Ajustees (Total Return NAV)
#   5. Recalcule les performances (fonds 1-600)
#   6. Recalcule les performances (fonds 601-1200)
#   7. Recalcule les performances EUR/USD
#
# Pre-requis:
#   - Python 3 avec: requests beautifulsoup4 openpyxl python-dateutil
#   - LibreOffice (pour conversion .xls -> .xlsx des anciens fichiers)
#   - Node.js avec mysql2
#
# Installation cron (une seule fois):
#   crontab -e
#   Ajouter la ligne:
#   0 10 * * 1 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/cron_nigeria_weekly.sh >> /var/log/africafunds_nigeria.log 2>&1
#
# =============================================================================

API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
LOG_FILE="/var/log/africafunds_nigeria_$(date +%Y%m%d).log"
YEAR=$(date +%Y)

echo "========================================" | tee -a "$LOG_FILE"
echo "=== AFRICAFUNDS NIGERIA WEEKLY UPDATE ===" | tee -a "$LOG_FILE"
echo "=== $(date) ===" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

cd "$API_DIR" || exit 1

# 1. Extraction SEC Nigeria (annee courante uniquement)
echo "" | tee -a "$LOG_FILE"
echo "[1/7] Extraction SEC Nigeria ($YEAR)..." | tee -a "$LOG_FILE"
python3 sec_ng_nav_extractor_v6.py \
  --years "$YEAR" \
  --cache-dir sec_ng_downloads \
  --out sec_ng_latest.csv \
  --audit sec_ng_audit_latest.csv \
  --coherence sec_ng_coherence_latest.csv \
  --coverage sec_ng_coverage_latest.csv \
  --fuzzy-report sec_ng_fuzzy_latest.csv \
  --strict-quality \
  2>&1 | tee -a "$LOG_FILE"

# Verifier que le CSV a ete produit
if [ ! -f sec_ng_latest.csv ] || [ $(wc -l < sec_ng_latest.csv) -lt 2 ]; then
  echo "[ERREUR] CSV non produit ou vide. Arret." | tee -a "$LOG_FILE"
  exit 1
fi

# 2. Import dans MySQL
echo "" | tee -a "$LOG_FILE"
echo "[2/7] Import VL Nigeria dans MySQL..." | tee -a "$LOG_FILE"
node import_vl_nigeria_sec.js sec_ng_latest.csv 2>&1 | tee -a "$LOG_FILE"

# 3. Recalcul taux EUR/USD quotidiens
echo "" | tee -a "$LOG_FILE"
echo "[3/7] Recalcul EUR/USD taux quotidiens..." | tee -a "$LOG_FILE"
node recalc_eur_usd_daily_rate.js 2>&1 | tee -a "$LOG_FILE"

# 4. Recalcul VL Ajuste
echo "" | tee -a "$LOG_FILE"
echo "[4/7] Recalcul VL Ajuste (tous fonds actifs)..." | tee -a "$LOG_FILE"
node recalc_vl_ajuste.js 2>&1 | tee -a "$LOG_FILE"

# 5. Recalcul performances (locale)
echo "" | tee -a "$LOG_FILE"
echo "[5/7] Recalcul performances locale (fonds 1-600)..." | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdatemysql/1/600 2>&1 | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "[5b/7] Recalcul performances locale (fonds 601-1200)..." | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdatemysql/601/1200 2>&1 | tee -a "$LOG_FILE"

# 6. Recalcul performances EUR
echo "" | tee -a "$LOG_FILE"
echo "[6/7] Recalcul performances EUR..." | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdateeur/1/600 2>&1 | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdateeur/601/1200 2>&1 | tee -a "$LOG_FILE"

# 7. Recalcul performances USD
echo "" | tee -a "$LOG_FILE"
echo "[7/7] Recalcul performances USD..." | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdateusd/1/600 2>&1 | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
curl -s http://localhost:3005/api/saveperfdateusd/601/1200 2>&1 | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "=== NIGERIA WEEKLY UPDATE TERMINE $(date) ===" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
