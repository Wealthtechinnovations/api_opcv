#!/usr/bin/env node
/**
 * data_freshness_audit.js — Audit COMPLET, LECTURE SEULE, de la fraicheur des
 * donnees de production (VL, indices, paires de devises, ratios, classements).
 *
 * Objectif (chef de projet) : cartographier precisement ce qui est a jour et ce
 * qui est fige/manquant, PAR SOURCE, avant toute recuperation. Aucun ecrit.
 *
 * Sortie : rapport texte structure (sections 1..9). Option --json pour un dump
 * machine (agrege) en fin de sortie.
 *
 * Usage :
 *   node scripts/diag/data_freshness_audit.js
 *   node scripts/diag/data_freshness_audit.js --json
 *   node scripts/diag/data_freshness_audit.js --stale=45   # seuil "perime" (jours, defaut 30)
 */
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

function parseArgs() {
  const o = { json: false, stale: 30 };
  for (const tok of process.argv.slice(2)) {
    if (tok === '--json') o.json = true;
    else { const m = /^--stale=(\d+)$/.exec(tok); if (m) o.stale = parseInt(m[1], 10); }
  }
  return o;
}

function pad(s, n) { s = String(s == null ? '' : s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }
function padl(s, n) { s = String(s == null ? '' : s); return s.length >= n ? s : ' '.repeat(n - s.length) + s; }

async function q(conn, sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  const out = { generated: null, sections: {} };

  const [{ today }] = await q(conn, 'SELECT CURDATE() AS today');
  out.generated = String(today);
  console.log('==================================================================');
  console.log(`  AUDIT FRAICHEUR DONNEES — ${today} — seuil perime: ${opts.stale}j`);
  console.log('==================================================================');

  // ---------- 1) GLOBAL ----------
  const g = (await q(conn, `
    SELECT
      (SELECT COUNT(*) FROM fond_investissements WHERE active=1) AS fonds_actifs,
      (SELECT COUNT(*) FROM valorisations) AS vl_total,
      (SELECT MAX(date) FROM valorisations) AS vl_derniere,
      (SELECT COUNT(DISTINCT fund_id) FROM valorisations
        WHERE date > DATE_SUB(CURDATE(), INTERVAL ${opts.stale} DAY)) AS fonds_vl_recente
  `))[0];
  out.sections.global = g;
  console.log('\n### 1) GLOBAL');
  console.log(`  Fonds actifs        : ${g.fonds_actifs}`);
  console.log(`  VL total            : ${g.vl_total}`);
  console.log(`  Derniere VL globale : ${g.vl_derniere}`);
  console.log(`  Fonds VL <= ${opts.stale}j     : ${g.fonds_vl_recente} / ${g.fonds_actifs}`);

  // ---------- 2) PAR PAYS ----------
  const pays = await q(conn, `
    SELECT f.pays,
      COUNT(*) AS fonds_actifs,
      SUM(CASE WHEN lv.last_vl IS NOT NULL THEN 1 ELSE 0 END) AS fonds_avec_vl,
      MAX(lv.last_vl) AS vl_pays_max,
      SUM(CASE WHEN lv.last_vl > DATE_SUB(CURDATE(), INTERVAL ${opts.stale} DAY) THEN 1 ELSE 0 END) AS fonds_frais,
      SUM(CASE WHEN lv.last_vl IS NULL THEN 1 ELSE 0 END) AS fonds_sans_vl
    FROM fond_investissements f
    LEFT JOIN (SELECT fund_id, MAX(date) AS last_vl FROM valorisations GROUP BY fund_id) lv
      ON lv.fund_id = f.id
    WHERE f.active = 1
    GROUP BY f.pays
    ORDER BY vl_pays_max IS NULL, vl_pays_max ASC
  `);
  out.sections.pays = pays;
  console.log('\n### 2) PAR PAYS (tri: plus fige en haut)');
  console.log(`  ${pad('PAYS', 26)}${padl('actifs', 7)}${padl('avecVL', 7)}${padl('frais', 7)}${padl('sansVL', 7)}  derniere VL`);
  for (const p of pays) {
    const flag = (p.vl_pays_max == null || p.vl_pays_max < new Date(Date.parse(today) - opts.stale * 864e5).toISOString().slice(0, 10)) ? ' <== FIGE/PERIME' : '';
    console.log(`  ${pad(p.pays, 26)}${padl(p.fonds_actifs, 7)}${padl(p.fonds_avec_vl, 7)}${padl(p.fonds_frais, 7)}${padl(p.fonds_sans_vl, 7)}  ${pad(p.vl_pays_max, 12)}${flag}`);
  }

  // ---------- 3) FONDS ACTIFS SANS AUCUNE VL ----------
  const sansVl = await q(conn, `
    SELECT f.id, f.nom_fond, f.pays
    FROM fond_investissements f
    LEFT JOIN valorisations v ON v.fund_id = f.id
    WHERE f.active = 1 AND v.id IS NULL
    ORDER BY f.pays, f.id
  `);
  out.sections.fonds_sans_vl = sansVl.map(r => ({ id: r.id, pays: r.pays, nom: r.nom_fond }));
  console.log(`\n### 3) FONDS ACTIFS SANS AUCUNE VL : ${sansVl.length}`);
  for (const r of sansVl.slice(0, 40)) console.log(`  [${r.id}] ${pad(r.pays, 12)} ${r.nom_fond}`);
  if (sansVl.length > 40) console.log(`  ... (+${sansVl.length - 40})`);

  // ---------- 4) FONDS PERIMES (derniere VL > seuil) ----------
  const stale = await q(conn, `
    SELECT f.id, f.nom_fond, f.pays, lv.last_vl, DATEDIFF(CURDATE(), lv.last_vl) AS age_j
    FROM fond_investissements f
    JOIN (SELECT fund_id, MAX(date) AS last_vl FROM valorisations GROUP BY fund_id) lv ON lv.fund_id = f.id
    WHERE f.active = 1 AND lv.last_vl <= DATE_SUB(CURDATE(), INTERVAL ${opts.stale} DAY)
    ORDER BY lv.last_vl ASC
  `);
  out.sections.fonds_perimes_count = stale.length;
  console.log(`\n### 4) FONDS ACTIFS PERIMES (derniere VL > ${opts.stale}j) : ${stale.length}`);
  for (const r of stale.slice(0, 40)) console.log(`  [${r.id}] ${pad(r.pays, 12)} ${pad(r.last_vl, 12)} (${r.age_j}j)  ${r.nom_fond}`);
  if (stale.length > 40) console.log(`  ... (+${stale.length - 40})`);

  // ---------- 5) INDICES ----------
  const indices = await q(conn, `
    SELECT nom_indice,
      COUNT(*) AS points,
      MAX(date) AS derniere,
      DATEDIFF(CURDATE(), MAX(date)) AS age_j,
      MIN(date) AS premiere
    FROM indice_references
    GROUP BY nom_indice
    ORDER BY derniere ASC
  `);
  out.sections.indices = indices;
  console.log(`\n### 5) INDICES (indice_references) — ${indices.length} indices`);
  console.log(`  ${pad('INDICE', 30)}${padl('points', 8)}  ${pad('derniere', 12)}${padl('age(j)', 8)}  premiere`);
  for (const i of indices) {
    const flag = i.age_j > opts.stale ? ' <== FIGE' : '';
    console.log(`  ${pad(i.nom_indice, 30)}${padl(i.points, 8)}  ${pad(i.derniere, 12)}${padl(i.age_j, 8)}  ${pad(i.premiere, 12)}${flag}`);
  }

  // ---------- 6) DEVISES ----------
  const devises = await q(conn, `
    SELECT paire,
      COUNT(*) AS points,
      MAX(date) AS derniere,
      DATEDIFF(CURDATE(), MAX(date)) AS age_j,
      MIN(date) AS premiere
    FROM devisedechanges
    GROUP BY paire
    ORDER BY derniere ASC
  `);
  out.sections.devises = devises;
  console.log(`\n### 6) PAIRES DE DEVISES (devisedechanges) — ${devises.length} paires`);
  console.log(`  ${pad('PAIRE', 20)}${padl('points', 8)}  ${pad('derniere', 12)}${padl('age(j)', 8)}  premiere`);
  for (const d of devises) {
    const flag = d.age_j > opts.stale ? ' <== FIGE' : '';
    console.log(`  ${pad(d.paire, 20)}${padl(d.points, 8)}  ${pad(d.derniere, 12)}${padl(d.age_j, 8)}  ${pad(d.premiere, 12)}${flag}`);
  }

  // ---------- 7) COUVERTURE VL DEVISE (value_EUR / value_USD recents) ----------
  const devCov = (await q(conn, `
    SELECT
      (SELECT COUNT(DISTINCT fund_id) FROM valorisations
        WHERE value_EUR IS NOT NULL AND date > DATE_SUB(CURDATE(), INTERVAL ${opts.stale} DAY)) AS fonds_eur_recent,
      (SELECT COUNT(DISTINCT fund_id) FROM valorisations
        WHERE value_USD IS NOT NULL AND date > DATE_SUB(CURDATE(), INTERVAL ${opts.stale} DAY)) AS fonds_usd_recent
  `))[0];
  out.sections.vl_devise = devCov;
  console.log('\n### 7) COUVERTURE VL DEVISE (fonds avec value recent)');
  console.log(`  EUR : ${devCov.fonds_eur_recent} / ${g.fonds_vl_recente} fonds frais`);
  console.log(`  USD : ${devCov.fonds_usd_recent} / ${g.fonds_vl_recente} fonds frais`);

  // ---------- 8) COUVERTURE BENCHMARK indRef (VL recentes sans benchmark) ----------
  const bench = (await q(conn, `
    SELECT
      SUM(CASE WHEN indRef IS NOT NULL AND indRef > 0 THEN 1 ELSE 0 END) AS avec,
      SUM(CASE WHEN indRef IS NULL OR indRef <= 0 THEN 1 ELSE 0 END) AS sans,
      COUNT(*) AS total
    FROM valorisations
    WHERE date > DATE_SUB(CURDATE(), INTERVAL 365 DAY)
  `))[0];
  out.sections.benchmark_1an = bench;
  console.log('\n### 8) BENCHMARK indRef sur VL des 365 derniers jours');
  console.log(`  avec indRef>0 : ${bench.avec} / ${bench.total}`);
  console.log(`  sans indRef   : ${bench.sans} (${(100 * bench.sans / (bench.total || 1)).toFixed(1)}%)`);

  // ---------- 9) COUVERTURE RATIOS + CLASSEMENTS ----------
  const cov = (await q(conn, `
    SELECT
      (SELECT COUNT(DISTINCT fond_id) FROM performences      WHERE ratiosharpe3an IS NOT NULL) AS ratios_local,
      (SELECT COUNT(DISTINCT fond_id) FROM performences_eurs WHERE ratiosharpe3an IS NOT NULL) AS ratios_eur,
      (SELECT COUNT(DISTINCT fond_id) FROM performences_usds WHERE ratiosharpe3an IS NOT NULL) AS ratios_usd,
      (SELECT COUNT(DISTINCT fond_id) FROM classementfonds)      AS clas_local,
      (SELECT COUNT(DISTINCT fond_id) FROM classementfonds_eurs) AS clas_eur,
      (SELECT COUNT(DISTINCT fond_id) FROM classementfonds_usds) AS clas_usd
  `))[0];
  out.sections.couverture = cov;
  console.log('\n### 9) COUVERTURE RATIOS (fonds avec ratiosharpe3an) + CLASSEMENTS (fonds distincts)');
  console.log(`  Ratios     local=${cov.ratios_local}  EUR=${cov.ratios_eur}  USD=${cov.ratios_usd}`);
  console.log(`  Classement local=${cov.clas_local}  EUR=${cov.clas_eur}  USD=${cov.clas_usd}`);

  console.log('\n=== FIN AUDIT (lecture seule, aucune ecriture) ===');
  if (opts.json) console.log('\n@@JSON@@' + JSON.stringify(out));
  await conn.end();
}

run().catch((e) => { console.error('ERREUR FATALE:', e.message); process.exit(1); });
