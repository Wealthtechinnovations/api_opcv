#!/usr/bin/env node
/**
 * indref_admin.js — Sauvegarde / etat / rollback des colonnes indRef
 * ==================================================================
 *
 * Outil d'administration SANS mot de passe en ligne de commande : lit les
 * identifiants DB depuis .env (comme tous les autres scripts node du projet).
 * Evite la commande `mysql` brute qui reclame un password interactif.
 *
 * Sous-commandes :
 *   backup            Cree une table de sauvegarde datee des colonnes indRef
 *                     (valorisations_indref_bak_AAAAMMJJ) — pour rollback.
 *   state             Affiche l'etat : derniere date/valeur par indice + tables
 *                     de sauvegarde existantes.
 *   rollback <table>  Restaure indRef/indRef_EUR/indRef_USD depuis une table de
 *                     sauvegarde (a utiliser UNIQUEMENT en cas de regression).
 *
 * Usage :
 *   node scripts/scraper/indref_admin.js backup
 *   node scripts/scraper/indref_admin.js state
 *   node scripts/scraper/indref_admin.js rollback valorisations_indref_bak_20260626
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

function todayTag() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

async function main() {
  const cmd = (process.argv[2] || '').toLowerCase();
  if (!['backup', 'state', 'rollback'].includes(cmd)) {
    console.error('Usage: node scripts/scraper/indref_admin.js <backup|state|rollback [table]>');
    process.exit(1);
  }

  let conn;
  try { conn = await mysql.createConnection(DB_CONFIG); }
  catch (e) { console.error('ERREUR connexion MySQL: ' + e.message); process.exit(1); }

  try {
    if (cmd === 'backup') {
      const table = `valorisations_indref_bak_${todayTag()}`;
      // CREATE TABLE ... AS SELECT : idempotent via IF NOT EXISTS
      await conn.query(
        `CREATE TABLE IF NOT EXISTS \`${table}\` AS
         SELECT id, fund_id, date, indRef, indRef_EUR, indRef_USD FROM valorisations`
      );
      const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
      console.log(`Sauvegarde OK : table ${table} (${n} lignes).`);
      console.log(`Pour rollback eventuel : node scripts/scraper/indref_admin.js rollback ${table}`);
    }

    else if (cmd === 'state') {
      const [idx] = await conn.query(
        `SELECT id_indice, MAX(date) AS derniere, COUNT(*) AS points
         FROM indice_references
         WHERE id_indice IN ('NSE','Tunindex','MASI','BRVM','MONIA')
         GROUP BY id_indice ORDER BY id_indice`
      );
      console.log('\n=== Etat indice_references ===');
      for (const r of idx) {
        const d = r.derniere instanceof Date ? r.derniere.toISOString().slice(0, 10) : String(r.derniere).slice(0, 10);
        console.log(`  ${r.id_indice.padEnd(10)} derniere=${d}  points=${r.points}`);
      }
      const [vls] = await conn.query(
        `SELECT MAX(date) AS derniere, COUNT(*) AS total,
                SUM(indRef IS NOT NULL) AS avec_indref
         FROM valorisations`
      );
      const v = vls[0];
      const vd = v.derniere instanceof Date ? v.derniere.toISOString().slice(0, 10) : String(v.derniere).slice(0, 10);
      console.log(`\n=== valorisations === derniere=${vd}  total=${v.total}  avec_indRef=${v.avec_indref}`);
      const [baks] = await conn.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = ? AND table_name LIKE 'valorisations_indref_bak_%'
         ORDER BY table_name`,
        [DB_CONFIG.database]
      );
      console.log('\n=== Sauvegardes disponibles ===');
      if (!baks.length) console.log('  (aucune)');
      for (const b of baks) console.log(`  ${b.table_name || b.TABLE_NAME}`);
    }

    else if (cmd === 'rollback') {
      const table = process.argv[3];
      if (!table || !/^valorisations_indref_bak_\d{8}$/.test(table)) {
        console.error('ERREUR: precisez une table valide, ex: valorisations_indref_bak_20260626');
        process.exit(1);
      }
      const [exists] = await conn.query(
        `SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
        [DB_CONFIG.database, table]
      );
      if (!exists[0].n) { console.error(`ERREUR: table ${table} introuvable.`); process.exit(1); }
      const [res] = await conn.query(
        `UPDATE valorisations v JOIN \`${table}\` b ON v.id = b.id
         SET v.indRef = b.indRef, v.indRef_EUR = b.indRef_EUR, v.indRef_USD = b.indRef_USD`
      );
      console.log(`Rollback OK depuis ${table} : ${res.affectedRows} lignes restaurees.`);
    }
  } finally {
    await conn.end();
  }
}

main().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
