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
const { budgetPour } = require('../../src/lib/freshness_budgets');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
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
    // Seuils partages avec check_doc_drift.js — voir src/lib/freshness_budgets.js.
    // Un 7 j / 30 j uniforme ignorait la cadence propre a chaque chaine : le
    // Nigeria, hebdomadaire, arrete depuis 29 jours, tombait en « ATTENTION ».
    const budget = budgetPour(row.pays);
    const status = ageJours <= budget.days ? 'OK' : 'ALERTE';
    console.log(`  ${(row.pays || '?').padEnd(12)} derniere VL: ${d} (${ageJours}j / budget ${budget.days}j) — ${row.fonds_actifs} fonds — ${status}`);
    // Le `else` precedent rangeait « ATTENTION » avec les OK : un pays a 29 jours
    // de retard etait publie « VL a jour ». Un statut intermediaire range du
    // cote rassurant ne sert a rien — il ne reste que sain ou en retard.
    if (status === 'ALERTE') issues.push(`${row.pays}: derniere VL il y a ${ageJours} jours (budget ${budget.days}j)`);
    else ok.push(`${row.pays}: VL a jour`);
  }

  // 2. Verifier les classements (local)
  // La table classementfonds n'a aucune colonne temporelle (timestamps: false).
  // On controle donc son peuplement, et on derive la fraicheur via performences.date
  // (le batch quotidien recalcule les performances PUIS les classements).
  const [classementCount] = await conn.query(`
    SELECT COUNT(*) as lignes, COUNT(DISTINCT fond_id) as fonds
    FROM classementfonds
  `);
  const [lastPerfDate] = await conn.query(`
    SELECT MAX(date) as last_date FROM performences
  `);
  console.log('\n--- Classements (local) ---');
  const cl = classementCount[0];
  console.log(`  ${cl.lignes} lignes / ${cl.fonds} fonds classes`);
  if (parseInt(cl.fonds) < 100) issues.push(`Classement local sous-peuple: ${cl.fonds} fonds`);
  else ok.push('Classement local peuple');
  const perfDate = lastPerfDate[0].last_date;
  if (perfDate) {
    const d = perfDate instanceof Date ? perfDate.toISOString().split('T')[0] : perfDate;
    const ageJ = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    console.log(`  Derniere date performances (MAX brut, tous fonds confondus): ${d} (${ageJ}j)`);
    // Ce MAX ne dit rien de l etat du catalogue : UN seul fonds recalcule suffit
    // a le rendre frais. Le 2026-08-21 il valait moins de 7 jours et publiait
    // « Performances/classements recents » — dans le meme rapport ou le controle
    // du dessous relevait « seulement 4 fonds avec perf recente », et ou le
    // controle C8 mesurait 86 jours de retard moyen au Maroc et en Tunisie.
    // La seule mesure honnete est la PROPORTION de fonds dont la performance
    // suit sa derniere VL.
    if (ageJ > 7) issues.push(`Aucune performance ecrite depuis ${ageJ}j`);
  }

  // Proportion de fonds actifs dont la performance la plus recente atteint leur
  // derniere VL. C est ce que voit l utilisateur : une VL fraiche accompagnee
  // d une performance perimee donne un chiffre plausible et faux.
  const [suivi] = await conn.query(`
    SELECT COUNT(*) AS fonds,
           SUM(p.derniere_perf >= v.derniere_vl) AS a_jour,
           ROUND(AVG(DATEDIFF(v.derniere_vl, p.derniere_perf)), 1) AS retard_moyen
      FROM fond_investissements f
      JOIN (SELECT fund_id, MAX(date) AS derniere_vl
              FROM valorisations GROUP BY fund_id) v ON v.fund_id = f.id
      JOIN (SELECT fond_id, MAX(date) AS derniere_perf
              FROM performences GROUP BY fond_id) p ON p.fond_id = f.id
     WHERE f.active = 1
  `);
  {
    const t = suivi[0];
    const total = parseInt(t.fonds, 10) || 0;
    const aJour = parseInt(t.a_jour, 10) || 0;
    const pct = total ? (aJour / total) * 100 : 0;
    console.log(`  Performances qui suivent la VL: ${aJour}/${total} (${pct.toFixed(1)} %), retard moyen ${t.retard_moyen} j`);
    // 80 % est une premiere calibration : un fonds suspendu ou sans VL recente
    // peut legitimement trainer. En dessous, c est la chaine de recalcul qui est
    // en cause, pas les fonds. A confronter aux valeurs reelles sur quelques nuits.
    if (pct < 80) issues.push(`Performances en retard sur les VL: ${aJour}/${total} a jour (${pct.toFixed(1)} %), retard moyen ${t.retard_moyen} j`);
    else ok.push(`Performances a jour sur ${pct.toFixed(1)} % des fonds`);
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

  // Propager le resultat par le code de sortie.
  //
  // Ce controle etait le filet de securite cense rattraper les echecs
  // silencieux de tous les autres crons — et il etait lui-meme silencieux :
  // il imprimait « N PROBLEME(S) DETECTE(S) » puis sortait 0. Aucun mail,
  // aucun webhook, aucun monitoring ne pouvait s en apercevoir. La detection
  // n existait donc que si un humain lisait le fichier de log a la main.
  process.exitCode = issues.length > 0 ? 1 : 0;
}

run().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
