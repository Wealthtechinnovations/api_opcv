#!/bin/bash
# =============================================================================
# Mise a jour hebdomadaire Nigeria - Africafunds
#
# Ce script est lance par cron chaque lundi a 10h (apres publication SEC Nigeria)
# La SEC Nigeria publie les NAV hebdomadaires chaque vendredi.
#
# Il fait 8 choses:
#   1. Telecharge et extrait les fichiers Excel SEC Nigeria (annee courante)
#   2. Importe les VL dans la base MySQL
#   3. Recalcule les taux EUR/USD quotidiens
#   4. Recalcule les VL Ajustees (Total Return NAV)
#   5. Recalcule les performances (fonds 1-600)
#   6. Recalcule les performances (fonds 601-1200)
#   7. Recalcule les performances EUR/USD
#   8. Resynchronise le cache d affichage `datejour` (colonne Date des pages pays)
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
  # Le statut doit etre celui de la COMMANDE, pas celui de `tee`.
  # `if "$@" | tee ...` renvoyait le code de `tee`, toujours 0 tant que le log
  # est ecrivable : toutes les etapes node etaient donc rapportees OK, meme
  # apres un process.exit(1). C est ce qui rendait CODE_REVIEW #49 inoperant
  # alors qu il etait coche comme fait. `PIPESTATUS` est l idiome deja utilise
  # par les crons BRVM, Tunisie et indices de ce meme projet.
  "$@" 2>&1 | tee -a "$LOG_FILE"
  local rc=${PIPESTATUS[0]}
  if [ "$rc" -eq 0 ]; then
    log "[$step_num] OK"
  else
    log "[$step_num] ERREUR (exit code $rc)"
    ERRORS=$((ERRORS + 1))
  fi
}

run_curl() {
  local step_num="$1"
  local step_desc="$2"
  local url="$3"
  local max_time="${4:-300}"

  log ""
  log "[$step_num] $step_desc..."
  # Le corps de la reponse va dans un fichier temporaire, jamais dans le flux
  # capture par $( ). La substitution de processus precedente
  # (`-o >(tee -a "$LOG_FILE")`) ecrivait le corps dans le MEME pipe que le code
  # HTTP : les deux se melangeaient dans un ordre non deterministe, le test
  # numerique echouait sur une valeur non numerique, et une reponse HTTP 200
  # pouvait etre comptee en ERREUR — ou l inverse, d un jour a l autre.
  local http_code body
  body=$(mktemp)
  http_code=$(curl -s -o "$body" -w '%{http_code}' "$url" --max-time "$max_time")
  cat "$body" >> "$LOG_FILE" 2>/dev/null
  rm -f "$body"
  if [ "$http_code" -ge 200 ] 2>/dev/null && [ "$http_code" -lt 300 ] 2>/dev/null; then
    log "[$step_num] OK (HTTP $http_code)"
  else
    log "[$step_num] ERREUR (HTTP ${http_code:-aucun})"
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
log "[1/8] Extraction SEC Nigeria ($YEAR)..."

# Supprimer le CSV de la semaine precedente AVANT l extraction.
# Sans cela, un extracteur qui echoue (site SEC indisponible, LibreOffice
# absent, quality gate bloquante) laissait le fichier de la semaine passee en
# place : le controle « le fichier existe et fait >= 2 lignes » passait, l etape
# 2 reimportait des donnees deja presentes, et le log affichait OK. Zero
# nouvelle VL, zero alerte. Le CSV doit prouver que l extraction a reussi.
rm -f sec_ng_latest.csv

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
  log "[1/8] ATTENTION : CSV non produit ou vide. Import saute, recalculs continuent."
  ERRORS=$((ERRORS + 1))
else
  log "[1/8] OK"

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

# Propager le resultat : sans code de sortie non nul, aucun superviseur — cron
# MAILTO, monitoring, alerting — ne peut detecter un echec. Le script sortait
# systematiquement 0, quel que soit le nombre d erreurs comptees.
exit $(( ERRORS > 0 ? 1 : 0 ))

