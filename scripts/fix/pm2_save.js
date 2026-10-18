#!/usr/bin/env node
// Persiste la liste PM2 (dump) pour que l'interpreteur Node 18 d'api-monolith
// survive a un reboot serveur. Sans ca, resurrect rechargerait Node 14 -> crash.
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const PM2 = fs.existsSync('/root/.nvm/versions/node/v18.20.8/bin/pm2') ? '/root/.nvm/versions/node/v18.20.8/bin/pm2' : 'pm2';
try { console.log(execSync(`${PM2} save`, { encoding: 'utf8' })); }
catch (e) { console.log('pm2 save:', (e.stdout||'')+(e.stderr||'')); }
