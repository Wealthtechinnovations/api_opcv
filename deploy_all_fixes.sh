#!/bin/bash
# ===========================================================================
# DEPLOIEMENT COMPLET — Audit fixes + repopulation EUR/USD
# ===========================================================================
# A lancer sur le SERVEUR DE PRODUCTION.
# Copier-coller la commande suivante:
#   bash deploy_all_fixes.sh
#
# Ce qu'il fait:
#   1. Pull API + Frontend depuis git
#   2. Rebuild le frontend
#   3. Restart PM2 (API + Frontend)
#   4. Repeupler performences_eurs (1174 fonds)
#   5. Repeupler performences_usds (1174 fonds)
#   6. Recalculer classementfonds_eurs + classementfonds_usds
#   7. Verification finale
# ===========================================================================

set -e

BRANCH="claude/code-review-improvements-ikvuj"
API_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api"
FRONTEND_DIR="/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend"
API_URL="http://localhost:3005"

echo "============================================"
echo "DEPLOIEMENT COMPLET — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

# -----------------------------------------------
# ETAPE 1: Pull API
# -----------------------------------------------
echo ""
echo "--- ETAPE 1/7: Pull API ---"
cd "$API_DIR"
git stash 2>/dev/null || true
git pull origin "$BRANCH"
echo "  -> API mis a jour: $(git log --oneline -1)"

# -----------------------------------------------
# ETAPE 2: Pull Frontend
# -----------------------------------------------
echo ""
echo "--- ETAPE 2/7: Pull Frontend ---"
cd "$FRONTEND_DIR"
git stash 2>/dev/null || true
git pull origin "$BRANCH"
echo "  -> Frontend mis a jour: $(git log --oneline -1)"

# -----------------------------------------------
# ETAPE 3: Rebuild Frontend
# -----------------------------------------------
echo ""
echo "--- ETAPE 3/7: Build Frontend ---"
cd "$FRONTEND_DIR"
npm run build 2>&1 | tail -5
echo "  -> Build termine"

# -----------------------------------------------
# ETAPE 4: Restart PM2
# -----------------------------------------------
echo ""
echo "--- ETAPE 4/7: Restart PM2 ---"
pm2 restart all
sleep 5
pm2 status
echo "  -> PM2 redemarre"

# -----------------------------------------------
# ETAPE 5: Test routes critiques
# -----------------------------------------------
echo ""
echo "--- ETAPE 5/7: Test routes ---"
STATUS1=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/valLiq/866" --max-time 30)
STATUS2=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/valLiq/1141" --max-time 30)
STATUS3=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/getPaysall" --max-time 30)
echo "  valLiq/866:  $STATUS1"
echo "  valLiq/1141: $STATUS2"
echo "  getPaysall:  $STATUS3"

if [ "$STATUS1" != "200" ] || [ "$STATUS2" != "200" ] || [ "$STATUS3" != "200" ]; then
  echo ""
  echo "  *** ATTENTION: Des routes ne repondent pas 200 ***"
  echo "  Verifiez les logs: pm2 logs wealthtech-api --lines 20"
  echo "  Le script continue quand meme pour repeupler les tables..."
fi

# -----------------------------------------------
# ETAPE 5b: Index composite + fix_database_phase2
# -----------------------------------------------
echo ""
echo "--- ETAPE 5b: Index composite valorisations(fund_id, date) ---"
cd "$API_DIR"
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'127.0.0.1',user:'fund_opcvm',password:'66G41zes~',database:'fund_opcvm'});
  try {
    const [idx] = await c.query(\"SHOW INDEX FROM valorisations WHERE Key_name = 'idx_fund_date'\");
    if (idx.length === 0) {
      console.log('  Creation index composite idx_fund_date...');
      await c.query('CREATE INDEX idx_fund_date ON valorisations(fund_id, date)');
      console.log('  -> Index cree');
    } else {
      console.log('  -> Index idx_fund_date existe deja');
    }
  } catch(e) { console.error('  Erreur index:', e.message); }
  await c.end();
})();
"

echo ""
echo "--- ETAPE 5c: fix_database_phase2 (enrichissement donnees) ---"
node fix_database_phase2.js 2>&1 | tail -20

# -----------------------------------------------
# ETAPE 6: Recalculer performances monnaie locale
# -----------------------------------------------
echo ""
echo "--- ETAPE 6/9: Recalculer performances monnaie locale ---"
echo "  (Met a jour avec les corrections Sortino/Calmar/VAR...)"
cd "$API_DIR"
node fix_populate_performances.js --force 2>&1 | tail -15

# -----------------------------------------------
# ETAPE 7: Repeupler performances EUR + USD
# -----------------------------------------------
echo ""
echo "--- ETAPE 7/9: Repeupler performances EUR + USD ---"
echo "  (Cela prend 2-5 minutes pour 1174 fonds...)"
cd "$API_DIR"
node fix_populate_performances_eur_usd.js --force --devise BOTH 2>&1 | tail -30

# -----------------------------------------------
# ETAPE 8: Recalculer classements (local + EUR + USD)
# -----------------------------------------------
echo ""
echo "--- ETAPE 8/9: Recalculer classements ---"
echo "  Classement local..."
curl -s "$API_URL/api/classement" --max-time 300 | head -c 200
echo ""
echo "  Classement EUR..."
curl -s "$API_URL/api/classementeur" --max-time 300 | head -c 200
echo ""
echo "  Classement USD..."
curl -s "$API_URL/api/classementusd" --max-time 300 | head -c 200
echo ""

# -----------------------------------------------
# ETAPE 9: Sync production snapshot
# -----------------------------------------------
echo ""
echo "--- ETAPE 9/9: Sync production snapshot ---"
cd "$API_DIR"
bash sync_production.sh 2>&1 | tail -10

# -----------------------------------------------
# VERIFICATION FINALE
# -----------------------------------------------
echo ""
echo "============================================"
echo "VERIFICATION FINALE"
echo "============================================"
cd "$API_DIR"
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'127.0.0.1',user:'fund_opcvm',password:'66G41zes~',database:'fund_opcvm'});
  const tables = ['performences','performences_eurs','performences_usds','classementfonds','classementfonds_eurs','classementfonds_usds'];
  for (const t of tables) {
    const [r] = await c.query('SELECT COUNT(*) as cnt, COUNT(DISTINCT fond_id) as fonds FROM ??', [t]);
    console.log('  ' + t.padEnd(25) + r[0].cnt + ' lignes / ' + r[0].fonds + ' fonds');
  }
  await c.end();
})();
"

echo ""
echo "============================================"
echo "DEPLOIEMENT TERMINE — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""
echo "Commits deployes:"
echo "  API:      $(cd $API_DIR && git log --oneline -1)"
echo "  Frontend: $(cd $FRONTEND_DIR && git log --oneline -1)"
