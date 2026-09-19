#!/usr/bin/env node
/**
 * diag_classement_ratios.js — DIAGNOSTIC LECTURE SEULE (aucune ecriture)
 * =====================================================================
 * Quantifie 2 sujets identifies (CODE_REVIEW #62 et #63) :
 *
 *   #62 Classement regional/continental incoherent (casse) :
 *       le classement Type2/Type3 groupe par la chaine EXACTE de
 *       categorie_fundafrica_regionale / categorie_fundafrica_globale.
 *       Si un lot de fonds a ces libelles dans une CASSE differente
 *       (ex: "OBLIGATIONS Afrique du Nord" vs "OBLIGATIONS AFRIQUE DU NORD"),
 *       ils forment un groupe isole -> rang /18 illogique.
 *       -> On liste les valeurs distinctes + on detecte les COLLISIONS de casse
 *          (meme UPPER(TRIM(valeur)) mais orthographes/casses differentes).
 *
 *   #63 Barres de ratio absentes en EUR/USD :
 *       performences_eurs / performences_usds n'ont pas les colonnes de ratios
 *       peuplees (bug upsertPerformanceDevise). -> On compte les fonds distincts
 *       ayant un ratiosharpe3an non NULL, en local vs EUR vs USD.
 *
 * Usage : node scripts/diag/diag_classement_ratios.js
 * N'ECRIT RIEN. Que des SELECT.
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

// Tables ou vivent les colonnes de categorie FundAfrica
const CAT_SOURCES = [
  { table: 'fond_investissements', idExpr: 'COUNT(*)', label: 'fonds' },
  { table: 'performences',       idExpr: 'COUNT(DISTINCT fond_id)', label: 'fonds (distincts)' },
  { table: 'performences_eurs',  idExpr: 'COUNT(DISTINCT fond_id)', label: 'fonds (distincts)' },
  { table: 'performences_usds',  idExpr: 'COUNT(DISTINCT fond_id)', label: 'fonds (distincts)' },
];
const CAT_COLS = ['categorie_fundafrica_regionale', 'categorie_fundafrica_globale'];
const RATIO_TABLES = [
  { table: 'performences', devise: 'LOCAL' },
  { table: 'performences_eurs', devise: 'EUR' },
  { table: 'performences_usds', devise: 'USD' },
];
const RATIO_COLS = ['ratiosharpe3an', 'volatility3an', 'sortino3an', 'pertemax3an', 'dsr3an', 'info3an'];

async function tryQuery(conn, sql, params) {
  try { const [rows] = await conn.execute(sql, params || []); return rows; }
  catch (e) { return { __error: e.message }; }
}

function detectCaseCollisions(rows) {
  // rows: [{v, n}] -> regroupe par UPPER(TRIM(v)) et signale les groupes multi-casse
  const byUpper = new Map();
  for (const r of rows) {
    const key = String(r.v).trim().toUpperCase().replace(/\s+/g, ' ');
    if (!byUpper.has(key)) byUpper.set(key, []);
    byUpper.get(key).push(r);
  }
  const collisions = [];
  for (const [key, variants] of byUpper) {
    if (variants.length > 1) collisions.push({ key, variants });
  }
  return collisions;
}

async function main() {
  console.log('############################################################');
  console.log('DIAGNOSTIC classements/ratios (LECTURE SEULE) — #62 & #63');
  console.log('############################################################');
  let conn;
  try { conn = await mysql.createConnection(DB_CONFIG); }
  catch (e) { console.error('ERREUR connexion MySQL: ' + e.message); process.exit(1); }

  try {
    // ---------- #62 : casse des categories FundAfrica ----------
    console.log('\n==================== #62 CATEGORIES (casse) ====================');
    for (const src of CAT_SOURCES) {
      for (const col of CAT_COLS) {
        const rows = await tryQuery(conn,
          `SELECT ${col} AS v, ${src.idExpr} AS n
           FROM ${src.table}
           WHERE ${col} IS NOT NULL AND ${col} <> ''
           GROUP BY ${col} ORDER BY n DESC`);
        if (rows.__error) { console.log(`\n[${src.table}.${col}] (indisponible: ${rows.__error})`); continue; }
        if (!rows.length) { console.log(`\n[${src.table}.${col}] : aucune valeur renseignee`); continue; }
        console.log(`\n[${src.table}.${col}] ${rows.length} valeur(s) distincte(s) — ${src.label} :`);
        for (const r of rows.slice(0, 40)) console.log(`   ${String(r.n).padStart(5)}  ${r.v}`);
        if (rows.length > 40) console.log(`   ... (${rows.length - 40} autres)`);
        const collisions = detectCaseCollisions(rows);
        if (collisions.length) {
          console.log(`   >>> COLLISIONS DE CASSE detectees (${collisions.length}) — MEME categorie ecrite differemment :`);
          for (const c of collisions) {
            console.log(`       [${c.key}]`);
            for (const v of c.variants) console.log(`          ${String(v.n).padStart(5)}  "${v.v}"`);
          }
        } else {
          console.log('   (aucune collision de casse)');
        }
      }
    }

    // ---------- #63 : couverture des ratios EUR/USD ----------
    console.log('\n\n==================== #63 COUVERTURE RATIOS ====================');
    for (const rt of RATIO_TABLES) {
      const total = await tryQuery(conn, `SELECT COUNT(DISTINCT fond_id) AS n FROM ${rt.table}`);
      if (total.__error) { console.log(`\n[${rt.table}] indisponible: ${total.__error}`); continue; }
      console.log(`\n[${rt.devise}] table ${rt.table} — fonds distincts total: ${total[0].n}`);
      for (const col of RATIO_COLS) {
        const r = await tryQuery(conn,
          `SELECT COUNT(DISTINCT fond_id) AS n FROM ${rt.table} WHERE ${col} IS NOT NULL`);
        if (r.__error) { console.log(`   ${col.padEnd(16)} : (colonne absente: ${r.__error})`); continue; }
        console.log(`   ${col.padEnd(16)} : ${r[0].n} fonds avec valeur non NULL`);
      }
    }

    // ---------- #63 focus : ratios par categorie nationale en USD ----------
    console.log('\n-- Focus USD : fonds avec ratiosharpe3an non NULL, par categorie_nationale (top 15) --');
    const focus = await tryQuery(conn,
      `SELECT categorie_nationale AS cat,
              COUNT(DISTINCT fond_id) AS fonds,
              COUNT(DISTINCT CASE WHEN ratiosharpe3an IS NOT NULL THEN fond_id END) AS avec_sharpe
       FROM performences_usds
       WHERE categorie_nationale IS NOT NULL AND categorie_nationale <> ''
       GROUP BY categorie_nationale ORDER BY fonds DESC LIMIT 15`);
    if (focus.__error) console.log('   indisponible: ' + focus.__error);
    else for (const r of focus) console.log(`   ${String(r.avec_sharpe).padStart(4)}/${String(r.fonds).padStart(4)}  ${r.cat}`);

    console.log('\n############################################################');
    console.log('FIN DIAGNOSTIC (aucune ecriture effectuee).');
    console.log('############################################################');
  } finally {
    await conn.end();
  }
}

main().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
