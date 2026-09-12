#!/usr/bin/env node
/**
 * add_r2_alpha_columns.js
 *
 * Ajoute les colonnes R2 et Alpha Jensen aux tables performences,
 * performences_eurs et performences_usds.
 *
 * ADDITIF UNIQUEMENT — ALTER TABLE ADD COLUMN IF NOT EXISTS pattern.
 *
 * Usage:
 *   node scripts/migrations/add_r2_alpha_columns.js           # diagnostic
 *   node scripts/migrations/add_r2_alpha_columns.js --execute  # appliquer
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const EXECUTE = process.argv.includes('--execute');

const TABLES = ['performences', 'performences_eurs', 'performences_usds'];
const COLUMNS = [
  { name: 'r2_1an', type: 'DOUBLE DEFAULT NULL' },
  { name: 'r2_3an', type: 'DOUBLE DEFAULT NULL' },
  { name: 'r2_5an', type: 'DOUBLE DEFAULT NULL' },
  { name: 'alpha1an', type: 'DOUBLE DEFAULT NULL' },
  { name: 'alpha3an', type: 'DOUBLE DEFAULT NULL' },
  { name: 'alpha5an', type: 'DOUBLE DEFAULT NULL' },
];

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm');
  console.log(EXECUTE ? 'MODE: EXECUTE\n' : 'MODE: DIAGNOSTIC\n');

  for (const table of TABLES) {
    console.log(`=== ${table} ===`);
    const [cols] = await conn.execute(`SHOW COLUMNS FROM ${table}`);
    const existing = new Set(cols.map(c => c.Field));

    for (const col of COLUMNS) {
      if (existing.has(col.name)) {
        console.log(`  ${col.name}: deja presente`);
      } else {
        console.log(`  ${col.name}: A AJOUTER (${col.type})`);
        if (EXECUTE) {
          await conn.execute(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`);
          console.log(`  → ajoutee`);
        }
      }
    }
    console.log('');
  }

  if (EXECUTE) {
    console.log('=== VERIFICATION ===');
    for (const table of TABLES) {
      const [cols] = await conn.execute(`SHOW COLUMNS FROM ${table} WHERE Field IN ('r2_1an','r2_3an','r2_5an','alpha1an','alpha3an','alpha5an')`);
      console.log(`${table}: ${cols.length}/6 colonnes presentes`);
    }
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => { console.error('ERREUR:', e); process.exit(1); });
