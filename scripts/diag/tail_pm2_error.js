#!/usr/bin/env node
// DIAG lecture seule : affiche la fin du log d'erreur PM2 de api-monolith.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const candidates = [
  '/root/.pm2/logs/api-monolith-error.log',
  path.join(os.homedir(), '.pm2/logs/api-monolith-error.log'),
  '/root/.pm2/logs/api-monolith-error-0.log',
];
let f = candidates.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
if (!f) { console.log('Log introuvable. Candidats:', candidates.join(', ')); process.exit(0); }
console.log('=== Fichier:', f, '===');
const data = fs.readFileSync(f, 'utf8').trim().split('\n');
console.log(data.slice(-45).join('\n'));
