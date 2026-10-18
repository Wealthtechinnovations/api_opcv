#!/usr/bin/env node
/**
 * restart_api_node18.js — Bascule api-monolith sur Node 18 (le node_modules exige
 * Node 15+ : helmet@8/Object.hasOwn, ethers/node:crypto, puppeteer-core '??='...).
 * Node 14.16 ne peut pas parser '??=' (SyntaxError) -> non polyfillable.
 * Node 18.20.8 est installe (nvm). On redemarre le process PM2 avec cet interpreteur.
 * Idempotent, non destructif (restart, pas delete).
 */
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');

function sh(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }); }
  catch (e) { return `${e.stdout || ''}${e.stderr || ''} [exit ${e.status}]`; }
}

const NODE18 = '/root/.nvm/versions/node/v18.20.8/bin/node';
console.log('=== Bascule api-monolith -> Node 18 ===');
console.log('node18 present:', fs.existsSync(NODE18));
console.log('node18 version:', sh(`${NODE18} -v`).trim());

// pm2 est installe sous node18
const PM2 = '/root/.nvm/versions/node/v18.20.8/bin/pm2';
const pm2bin = fs.existsSync(PM2) ? PM2 : 'pm2';
console.log('pm2 bin:', pm2bin);

console.log('\n--- restart --interpreter node18 ---');
console.log(sh(`${pm2bin} restart api-monolith --interpreter ${NODE18} --update-env`));

console.log('\n--- verif interpreteur ---');
console.log(sh(`${pm2bin} describe api-monolith | grep -iE "exec interpreter|interpreter|status|restarts" | head`));
