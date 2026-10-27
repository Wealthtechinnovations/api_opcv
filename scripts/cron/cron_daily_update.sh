#!/bin/bash
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
log "=== AFRICAFUNDS DAILY UPDATE ==="
log "=== $(date) ==="
log "========================================"

cd "$API_DIR" || exit 1

START_DATE=$(date -d "-5 days" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

run_step "1/9" "Scrape ASFIM VL Maroc ($START_DATE -> $TODAY)" \
  node scripts/import/scrape_asfim_import.js "$START_DATE" "$TODAY"

run_step "2/9" "Mise a jour Forex (derniers jours)" \
  node scripts/import/scrape_forex_import.js today

run_step "3/9" "Recalcul EUR/USD daily rates" \
  node scripts/recalc/recalc_eur_usd_daily_rate.js

run_step "4/9" "Recalcul VL Ajuste (tous fonds actifs)" \
  node scripts/recalc/recalc_vl_ajuste.js

# CALCUL DIRECT, et non plus la route HTTP. Les trois etapes precedentes —
# saveperfdatemysql sur 1-600, 601-1200 et 1201-3000 — appelaient une route qui
# n effectue AUCUN calcul : pour chaque fonds ET chaque date, elle emet une
# requete HTTP interne vers sa propre API, dans le processus qui sert deja la
# requete. D ou le « [5b/8] ERREUR (HTTP 000) » recurrent sur le lot 601-1200,
# la ou l etape EUR/USD ci-dessous traitait ses 586 fonds sans incident : elle,
# appelle node directement.
#
# Consequence mesuree le 2026-10-21 : 826 fonds portaient des performances plus
# anciennes que leur derniere VL — MAROC 625 avec des chiffres de juin pour des
# VL d octobre. Le site affichait des performances plausibles et fausses.
#
# Le pendant direct en devise locale existe depuis le 10 septembre et n avait
# jamais ete branche. Il est desormais valide : dry-run compare champ par champ
# a la route sur 90 colonnes, NIGERIA et UEMOA, DIVERGENT = 0 et PERDU = 0, avec
# l invariant de somme du juge verifie. Le rattrapage execute le 2026-10-21 via
# `ops-recalc-derives` a corrige les 826 fonds avec 0 erreur — mais c etait un
# one-shot : sans cette bascule, la derive revient des le lendemain.
#
# `--force` est ce que passe deja le canal gouverne : sans lui, un fonds dont la
# perf porte deja la date de sa derniere VL est ignore, ce qui est le cas voulu
# en rattrapage mais pas dans un cron quotidien qui doit aussi rafraichir les
# colonnes de ratios.
#
# Les etiquettes 6/9 et 7/9 disparaissent sans renumerotation deliberement :
# `diag_classements.js` cite litteralement « [9a/9] », et les journaux de
# plusieurs mois portent « 8/9 » et « 9a/9 ». Renumeroter casserait la lecture
# de l historique pour un gain cosmetique.
#
# `run_step` n a pas de plafond de temps, contrairement a `run_curl` et ses
# 300 s par defaut : la coupure qui produisait le HTTP 000 disparait avec la
# route.
run_step "5/9" "Recalcul performances locale (calcul direct, tous pays)" \
  node scripts/fix/fix_populate_performances.js --force

run_step "8/9" "Recalcul performances EUR/USD" \
  node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH

# Delai porte a 1800 s. Les trois classements sortaient en HTTP 000 chaque soir —
# curl abandonnait a 300 s. Le journal du 2026-08-28 le montre encore : l etape
# 8/9 se termine normalement (28 654 lignes de performances EUR sur 1 241 fonds)
# puis « [9a/9] Classement local... ERREUR (HTTP 000) ».
#
# HTTP 000 ne dit PAS que le serveur a echoue : il dit que le client a cesse
# d attendre. La route `classementmysql` vide la table puis la reconstruit fonds
# par fonds, en trois portees (nationale, regionale, globale) — plusieurs
# milliers d ecritures. Elle depasse simplement cinq minutes.
#
# Allonger le delai ne change rien a ce que fait le serveur ; cela change le fait
# qu on entende sa reponse. Sans cela, le cron rapporte trois erreurs chaque nuit
# sans qu on sache si le classement a ete recalcule ou non — et une alerte qui se
# declenche toujours cesse d etre lue.
run_curl "9a/9" "Classement local" \
  "http://localhost:3005/api/classementmysql" 1800

run_curl "9b/9" "Classement EUR" \
  "http://localhost:3005/api/classementeur" 1800

run_curl "9c/9" "Classement USD" \
  "http://localhost:3005/api/classementusd" 1800

log ""
if [ "$ERRORS" -eq 0 ]; then
  log "=== MISE A JOUR TERMINEE SANS ERREUR $(date) ==="
else
  log "=== MISE A JOUR TERMINEE AVEC $ERRORS ERREUR(S) $(date) ==="
fi
log "========================================"

# Propager le resultat : sans code de sortie non nul, aucun superviseur — cron
# MAILTO, monitoring, alerting — ne peut detecter un echec. Le script sortait
# systematiquement 0, quel que soit le nombre d erreurs comptees.
exit $(( ERRORS > 0 ? 1 : 0 ))

