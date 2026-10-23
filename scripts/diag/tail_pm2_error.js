#!/usr/bin/env node
// DIAG lecture seule : affiche la FIN (16Ko) du log d'erreur PM2 api-monolith (fichier potentiellement enorme).
'use strict';
const fs = require('fs');
const candidates = ['/root/.pm2/logs/api-monolith-error.log','/root/.pm2/logs/api-monolith-error-0.log'];
const f = candidates.find(p => { try { return fs.existsSync(p); } catch(e){ return false; } });
if (!f) { console.log('Log introuvable:', candidates.join(', ')); process.exit(0); }
const st = fs.statSync(f);
console.log('=== Fichier:', f, '| taille:', (st.size/1048576).toFixed(1)+'Mo', '===');
const N = 16384;
const start = Math.max(0, st.size - N);
const fd = fs.openSync(f, 'r');
const buf = Buffer.alloc(Math.min(N, st.size));
fs.readSync(fd, buf, 0, buf.length, start);
fs.closeSync(fd);
console.log(buf.toString('utf8'));
