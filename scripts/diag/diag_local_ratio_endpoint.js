#!/usr/bin/env node
/**
 * diag_local_ratio_endpoint.js — DIAGNOSTIC LECTURE SEULE
 * Verifie pourquoi fix_populate_performances_eur_usd stocke des ratios null :
 * appelle l'endpoint ratios EUR/USD EXACTEMENT comme le script (localhost:PORT)
 * et affiche PORT, statut HTTP, temps, et un extrait de la reponse.
 * Aucune ecriture. Usage : node scripts/diag/diag_local_ratio_endpoint.js
 */
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const http = require('http');

const PORT = process.env.PORT || 3005;
const FOND = 2415, DEV = 'EUR', DATE = '2026-06-26';
const path = `/api/ratiosnewdevwithdate/3/${FOND}/${DEV}/${DATE}`;

console.log('=== DIAG endpoint ratios local ===');
console.log('process.env.PORT =', JSON.stringify(process.env.PORT), '-> utilise PORT =', PORT);
console.log('Appel: http://localhost:' + PORT + path);

const t0 = Date.now();
const req = http.get({ host: 'localhost', port: PORT, path, timeout: 30000 }, (resp) => {
  let body = '';
  resp.on('data', c => body += c);
  resp.on('end', () => {
    const ms = Date.now() - t0;
    console.log('Statut HTTP:', resp.statusCode, '| temps:', ms + 'ms', '| taille:', body.length);
    let ratioSharpe = 'N/A';
    try { const j = JSON.parse(body); ratioSharpe = j && j.data ? j.data.ratioSharpe : '(pas de data)'; } catch (e) { ratioSharpe = 'JSON invalide: ' + e.message; }
    console.log('data.ratioSharpe =', ratioSharpe);
    console.log('Extrait (300):', body.slice(0, 300));
    process.exit(0);
  });
});
req.on('error', (e) => { console.log('ERREUR requete local:', e.code || e.message, '(=> le script stocke null, fail-safe)'); process.exit(0); });
req.on('timeout', () => { req.destroy(); console.log('TIMEOUT 30s (=> le script stocke null, fail-safe)'); process.exit(0); });
