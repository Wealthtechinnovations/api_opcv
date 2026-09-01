#!/bin/bash

# BRVM BOC OPCVM VL — import quotidien
# Cron recommande : 30 19 * * 1-5 (lun-ven 19h30 UTC, apres publication du BOC,
#                   avant le cron principal de 20h)
#   30 19 * * 1-5 /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/scripts/cron/cron_brvm_daily.sh >> /var/log/cron_brvm.log 2>&1
#
# Relance de securite optionnelle (si le PDF n'etait pas encore publie a 19h30) :
#   30 22 * * 1-5 .../cron_brvm_daily.sh >> /var/log/cron_brvm.log 2>&1
#   (idempotent : un BOC deja parse est ignore)
#
# Ce script :
# 1. Telecharge le dernier Bulletin Officiel de la Cote BRVM disponible
# 2. Extrait les VL OPCVM (sections quotidiennes/hebdomadaires/mensuelles)
# 3. Historise les lignes brutes (staging brvm_boc_navs_raw, tracabilite PDF)
# 4. Promeut les VL validees vers `valorisations` — JAMAIS d'overwrite
# 5. Les fonds non rapproches restent en attente de validation manuelle

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRAPER="$API_DIR/scripts/scraper/brvm_boc_daily.py"
LOG_DIR="$API_DIR/data/brvm_boc/logs"

source "$API_DIR/.env" 2>/dev/null || true

mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/cron_brvm_$(date +%Y%m%d_%H%M%S).log"

echo "$(date) — Starting BRVM BOC daily import" | tee -a "$LOG_FILE"

python3 "$SCRAPER" --latest --production 2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    echo "$(date) — BRVM BOC import completed successfully" | tee -a "$LOG_FILE"

    # Etape 2 — resynchroniser le cache d'affichage `datejour`.
    #
    # L'import ci-dessus ecrit dans `valorisations` mais pas dans
    # `fond_investissements.datejour`, colonne denormalisee qui alimente la
    # colonne "Date" des pages pays (/api/getfondbypays, /api/listeproduitpayssociete).
    # Sans cette etape, les fonds UEMOA affichaient une date perimee de plusieurs
    # mois alors que leurs VL etaient a jour (constate en prod le 2026-08-12 :
    # VL au 2026-08-11, page pays au 2025-10-15).
    #
    # Le script ne touche QUE `datejour`, est idempotent et prend un snapshot
    # avant ecriture. Son echec ne doit pas faire echouer l'import lui-meme :
    # les VL sont deja en base, seul l'affichage resterait a rattraper.
    echo "$(date) — Resynchronisation datejour UEMOA" | tee -a "$LOG_FILE"
    node "$API_DIR/scripts/fix/fix_datejour_sync.js" --pays UEMOA --execute 2>&1 | tee -a "$LOG_FILE"
    SYNC_CODE=${PIPESTATUS[0]}
    if [ $SYNC_CODE -ne 0 ]; then
        echo "$(date) — ATTENTION : resynchronisation datejour en echec (code $SYNC_CODE). VL importees, affichage pages pays potentiellement perime." | tee -a "$LOG_FILE"
    fi
else
    echo "$(date) — BRVM BOC import FAILED (exit code: $EXIT_CODE)" | tee -a "$LOG_FILE"
fi

exit $EXIT_CODE
