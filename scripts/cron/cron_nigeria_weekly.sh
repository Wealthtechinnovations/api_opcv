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
#   0 10 * * 1 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_nigeria_weekly.sh >> /var/log/africafunds_nigeria.log 2>&1
#
# =============================================================================

API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
LOG_FILE="/var/log/africafunds_nigeria_$(date +%Y%m%d).log"
YEAR=$(date +%Y)
ERRORS=0

log() {
  echo "$1" | tee -a "$LOG_FILE"
}

run_step() {
  local step_num="$1"
  local step_desc="$2"
  shift 2

  log ""
  log "[$step_num] $step_desc..."
  if "$@" 2>&1 | tee -a "$LOG_FILE"; then
    log "[$step_num] OK"
  else
    log "[$step_num] ERREUR (exit code $?)"
    ERRORS=$((ERRORS + 1))
  fi
}

run_curl() {
  local step_num="$1"
  local step_desc="$2"
  local url="$3"

  log ""
  log "[$step_num] $step_desc..."
  local http_code
  http_code=$(curl -s -o >(tee -a "$LOG_FILE") -w '%{http_code}' "$url" --max-time 300 2>&1)
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ] 2>/dev/null; then
    log ""
    log "[$step_num] OK (HTTP $http_code)"
  else
    log ""
    log "[$step_num] ERREUR (HTTP $http_code)"
    ERRORS=$((ERRORS + 1))
  fi
}

log "========================================"
log "=== AFRICAFUNDS NIGERIA WEEKLY UPDATE ==="
log "=== $(date) ==="
log "========================================"

cd "$API_DIR" || exit 1

# 1. Extraction SEC Nigeria (annee courante uniquement)
log ""
log "[1/7] Extraction SEC Nigeria ($YEAR)..."
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

# Verifier que le CSV a ete produit — si absent, continuer avec recalculs seuls
if [ ! -f sec_ng_latest.csv ] || [ "$(wc -l < sec_ng_latest.csv)" -lt 2 ]; then
  log "[1/7] ATTENTION : CSV non produit ou vide. Import saute, recalculs continuent."
  ERRORS=$((ERRORS + 1))
else
  log "[1/7] OK"

  run_step "2/8" "Import VL Nigeria dans MySQL" \
    node scripts/import/import_vl_nigeria_sec.js sec_ng_latest.csv
fi

run_step "3/8" "Recalcul EUR/USD taux quotidiens" \
  node scripts/recalc/recalc_eur_usd_daily_rate.js

run_step "4/8" "Recalcul VL Ajuste (tous fonds actifs)" \
  node scripts/recalc/recalc_vl_ajuste.js

run_curl "5a/8" "Recalcul performances locale (fonds 1-600)" \
  "http://localhost:3005/api/saveperfdatemysql/1/600"

run_curl "5b/8" "Recalcul performances locale (fonds 601-1200)" \
  "http://localhost:3005/api/saveperfdatemysql/601/1200"

run_curl "6a/8" "Recalcul performances EUR (fonds 1-600)" \
  "http://localhost:3005/api/saveperfdateeur/1/600"

run_curl "6b/8" "Recalcul performances EUR (fonds 601-1200)" \
  "http://localhost:3005/api/saveperfdateeur/601/1200"

run_curl "7a/8" "Recalcul performances USD (fonds 1-600)" \
  "http://localhost:3005/api/saveperfdateusd/1/600"

run_curl "7b/8" "Recalcul performances USD (fonds 601-1200)" \
  "http://localhost:3005/api/saveperfdateusd/601/1200"

# Etape 8 — resynchroniser le cache d'affichage `datejour`.
#
# `fond_investissements.datejour` alimente la colonne "Date" des pages pays
# (/api/getfondbypays, /api/listeproduitpayssociete). L'import SEC ecrit dans
# `valorisations` sans la rafraichir : au 2026-08-12, 218 des 325 fonds Nigeria
# portaient un `datejour` desynchronise de leur derniere VL reelle.
#
# Le script ne touche QUE cette colonne, est idempotent et prend un snapshot
# avant ecriture. Un echec ici n'invalide pas l'import : les VL sont en base,
# seul l'affichage resterait a rattraper (run_step compte l'erreur sans abandonner).
run_step "8/8" "Resynchronisation datejour (Nigeria)" \
  node scripts/fix/fix_datejour_sync.js --pays NIGERIA --execute

log ""
if [ "$ERRORS" -eq 0 ]; then
  log "=== NIGERIA WEEKLY UPDATE TERMINE SANS ERREUR $(date) ==="
else
  log "=== NIGERIA WEEKLY UPDATE TERMINE AVEC $ERRORS ERREUR(S) $(date) ==="
fi
log "========================================"
