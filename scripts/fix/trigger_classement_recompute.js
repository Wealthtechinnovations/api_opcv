#!/usr/bin/env node
/**
 * trigger_classement_recompute.js — Declenche le recompute des classements
 * EUR/USD via l'API LOCALE (localhost:PORT), voie sanctionnee CLAUDE.md
 * ("Recalcul classement : toujours localhost:3005, jamais l'URL publique").
 *
 * Ces routes (apigestionsavequotidien.js) rebuild classementfonds_eurs/usds
 * de facon transactionnelle (DELETE+INSERT en transaction). Additif : refletent
 * les ratios deja peuples dans performences_eurs/usds. Necessaire pour que les
 * barres "Par rapport a la Cat" (ranksharpe...) s'affichent.
 *
 * Usage :
 *   node scripts/fix/trigger_classement_recompute.js          # EUR puis USD
 *   node scripts/fix/trigger_classement_recompute.js EUR      # EUR seul
 *   node scripts/fix/trigger_classement_recompute.js USD      # USD seul
 *
 * NB : le recompute peut durer plusieurs minutes. Le process node continue
 * cote serveur meme si l'appelant (bridge) coupe l'ecoute a 60s. Verifier
 * ensuite via SQL (ranksharpetotal d'une categorie).
 */
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const http = require('http');

const PORT = process.env.PORT || 3005;
const arg = (process.argv[2] || 'BOTH').toUpperCase();
const devises = arg === 'EUR' ? ['EUR'] : arg === 'USD' ? ['USD'] : ['EUR', 'USD'];
const ROUTE = { EUR: '/api/classementeur', USD: '/api/classementusd' };

function trigger(devise) {
  return new Promise((resolve) => {
    const path = ROUTE[devise];
    const t0 = Date.now();
    console.log(`\n[${devise}] GET http://localhost:${PORT}${path} ...`);
    const req = http.get({ host: 'localhost', port: PORT, path, timeout: 1800000 }, (resp) => {
      let body = '';
      resp.on('data', c => body += c);
      resp.on('end', () => {
        const ms = Date.now() - t0;
        console.log(`[${devise}] HTTP ${resp.statusCode} en ${(ms / 1000).toFixed(1)}s — reponse: ${body.slice(0, 120)}`);
        resolve();
      });
    });
    req.on('error', (e) => { console.log(`[${devise}] ERREUR: ${e.code || e.message}`); resolve(); });
    req.on('timeout', () => { req.destroy(); console.log(`[${devise}] TIMEOUT (30min)`); resolve(); });
  });
}

(async () => {
  console.log('=== RECOMPUTE CLASSEMENTS (localhost) ===');
  console.log('Devises:', devises.join(', '), '| PORT:', PORT);
  for (const d of devises) await trigger(d);
  console.log('\n=== Termine (verifier ranksharpetotal via SQL). ===');
  process.exit(0);
})();
