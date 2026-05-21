#!/usr/bin/env node
/**
 * check_cron_health.js
 *
 * Verifie que les crons ont tourne correctement aujourd'hui/cette semaine.
 * Lit les logs cron et verifie les indicateurs de sante.
 *
 * Usage:
 *   node scripts/monitoring/check_cron_health.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const API_DIR = '/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api';

async function run() {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const issues = [];
  const ok = [];

  console.log(`=== AFRICAFUNDS CRON HEALTH CHECK — ${today} ===\n`);

  const conn = await mysql.createConnection(DB_CONFIG);

  // 1. Verifier derniere VL par pays
  const [lastVlByCountry] = await conn.query(`
    SELECT f.pays, MAX(v.date) as last_vl, COUNT(DISTINCT v.fund_id) as fonds_actifs
    FROM valorisations v
    JOIN fond_investissements f ON v.fund_id = f.id AND f.active = 1
    GROUP BY f.pays
    ORDER BY last_vl DESC
  `);
  console.log('--- Derniere VL par pays ---');
  for (const row of lastVlByCountry) {
    const d = row.last_vl instanceof Date ? row.last_vl.toISOString().split('T')[0] : row.last_vl;
    const ageJours = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    const status = ageJours <= 7 ? 'OK' : ageJours <= 30 ? 'ATTENTION' : 'ALERTE';
    console.log(`  ${(row.pays || '?').padEnd(12)} derniere VL: ${d} (${ageJours}j) — ${row.fonds_actifs} fonds — ${status}`);
    if (status === 'ALERTE') issues.push(`${row.pays}: derniere VL il y a ${ageJours} jours`);
    else ok.push(`${row.pays}: VL a jour`);
  }

  // 2. Verifier dernier classement
  const [lastClassement] = await conn.query(`
    SELECT MAX(updatedAt) as last_update, COUNT(DISTINCT fond_id) as fonds
    FROM classementfonds
  `);
  console.log('\n--- Dernier classement ---');
  const lastCl = lastClassement[0];
  if (lastCl.last_update) {
    const ageH = Math.floor((Date.now() - new Date(lastCl.last_update).getTime()) / 3600000);
    console.log(`  Derniere MAJ: ${lastCl.last_update} (${ageH}h) — ${lastCl.fonds} fonds`);
    if (ageH > 48) issues.push(`Classement pas mis a jour depuis ${ageH}h`);
    else ok.push('Classement a jour');
  }

  // 3. Verifier forex recent
  const [lastForex] = await conn.query(`
    SELECT MAX(date) as last_date FROM devisedechanges
  `);
  console.log('\n--- Dernier forex ---');
  const fxDate = lastForex[0].last_date;
  if (fxDate) {
    const d = fxDate instanceof Date ? fxDate.toISOString().split('T')[0] : fxDate;
    const ageJ = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    console.log(`  Derniere paire: ${d} (${ageJ}j)`);
    if (ageJ > 7) issues.push(`Forex pas mis a jour depuis ${ageJ} jours`);
    else ok.push('Forex a jour');
  }

  // 4. Verifier performances recentes
  const [lastPerf] = await conn.query(`
    SELECT MAX(date) as last_date, COUNT(DISTINCT fond_id) as fonds
    FROM performences WHERE date > DATE_SUB(NOW(), INTERVAL 7 DAY)
  `);
  console.log('\n--- Performances recentes (7j) ---');
  console.log(`  ${lastPerf[0].fonds} fonds avec perf dans les 7 derniers jours`);
  if (parseInt(lastPerf[0].fonds) < 100) {
    issues.push(`Seulement ${lastPerf[0].fonds} fonds avec perf recente`);
  }

  // 5. Verifier les fichiers log cron
  console.log('\n--- Fichiers log cron ---');
  const logDir = '/var/log/';
  const logPatterns = [
    { name: 'daily', pattern: `africafunds_daily_${today.replace(/-/g, '')}.log` },
    { name: 'eur_usd', pattern: 'cron_eur_usd.log' },
    { name: 'nigeria', pattern: `africafunds_nigeria_${today.replace(/-/g, '')}.log` },
  ];
  for (const lp of logPatterns) {
    const logPath = path.join(logDir, lp.pattern);
    try {
      const stat = fs.statSync(logPath);
      const ageH = Math.floor((Date.now() - stat.mtime.getTime()) / 3600000);
      const sizeKb = Math.round(stat.size / 1024);
      console.log(`  ${lp.name.padEnd(12)} ${logPath} — ${sizeKb} Ko, modifie il y a ${ageH}h`);
    } catch {
      if (lp.name === 'nigeria' && dayOfWeek !== 1) {
        console.log(`  ${lp.name.padEnd(12)} pas attendu aujourd'hui (pas lundi)`);
      } else if (lp.name === 'daily' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        console.log(`  ${lp.name.padEnd(12)} pas attendu aujourd'hui (weekend)`);
      } else {
        console.log(`  ${lp.name.padEnd(12)} ABSENT — cron n'a peut-etre pas tourne`);
        issues.push(`Log ${lp.name} absent`);
      }
    }
  }

  await conn.end();

  // Resume
  console.log('\n=== RESUME ===');
  if (issues.length === 0) {
    console.log('STATUT: TOUT OK');
    ok.forEach(o => console.log(`  [OK] ${o}`));
  } else {
    console.log(`STATUT: ${issues.length} PROBLEME(S) DETECTE(S)`);
    issues.forEach(i => console.log(`  [!] ${i}`));
    ok.forEach(o => console.log(`  [OK] ${o}`));
  }
  console.log('');
}

run().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
