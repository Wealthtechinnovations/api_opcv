#!/usr/bin/env node
/**
 * check_dormant_funds_coverage.js — Diagnostic LECTURE SEULE des fonds actifs
 * sans VL recente (#dormants). Objectif : distinguer, PAR PAYS, si l'absence
 * de VL recente s'explique par (a) l'absence de pipeline continu pour ce pays
 * (Maroc/Tunisie/CEMAC = imports periodiques par fichier, pas de cron continu),
 * ou (b) un pipeline continu existe (UEMOA/Nigeria) et le fonds reste absent
 * malgre tout -> tres probablement dissous/liquide, candidat a desactivation.
 *
 * Ne modifie AUCUNE donnee. Sert de base a la decision utilisateur "diagnostic
 * + mise a jour" (#3) : les fonds en categorie (a) attendent un nouvel export
 * (ASFIM/CMF/COSUMAF) ; ceux en categorie (b) sont candidats a `active=0` sous
 * validation explicite (jamais desactive automatiquement par ce script).
 *
 * Usage : node scripts/diag/check_dormant_funds_coverage.js [--stale=30]
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

// Pipeline continu (cron automatique) vs import periodique par fichier (pas de cron).
// Cf scripts/cron/*.sh + scripts/import/*.js : seuls UEMOA (cron_brvm_daily.sh) et
// NIGERIA (cron_nigeria_weekly.sh) ont un cron. MAROC/TUNISIE attendent un fichier
// (ASFIM / CMF) depose manuellement. CEMAC n'a aucun pipeline (cf CODE_REVIEW #70).
const PIPELINE_CONTINU = { UEMOA: true, NIGERIA: true, MAROC: false, TUNISIE: false, CEMAC: false };

function parseArgs() {
  const o = { stale: 30 };
  for (const tok of process.argv.slice(2)) {
    const m = /^--stale=(\d+)$/.exec(tok);
    if (m) o.stale = parseInt(m[1], 10);
  }
  return o;
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`=== DIAGNOSTIC FONDS DORMANTS (lecture seule, seuil ${opts.stale}j) ===\n`);

  const [rows] = await conn.execute(`
    SELECT f.id, f.nom_fond, f.pays, DATE_FORMAT(lv.last_vl, '%Y-%m-%d') AS last_vl,
           DATEDIFF(CURDATE(), lv.last_vl) AS age_j
    FROM fond_investissements f
    JOIN (SELECT fund_id, MAX(date) AS last_vl FROM valorisations GROUP BY fund_id) lv ON lv.fund_id = f.id
    WHERE f.active = 1 AND lv.last_vl <= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ORDER BY f.pays, lv.last_vl ASC
  `, [opts.stale]);

  const byPays = {};
  for (const r of rows) { (byPays[r.pays] = byPays[r.pays] || []).push(r); }

  let candidatsDesactivation = 0, attentePipeline = 0;

  for (const [pays, funds] of Object.entries(byPays)) {
    const continu = PIPELINE_CONTINU[pays];
    console.log(`--- ${pays} : ${funds.length} fonds dormants (pipeline continu: ${continu === undefined ? 'INCONNU' : continu ? 'OUI' : 'NON'}) ---`);
    if (continu === true) {
      console.log(`  => Pipeline actif mais ces fonds restent absents des flux recents : candidats DISSOLUTION/LIQUIDATION probable.`);
      console.log(`     Action recommandee : verifier aupres du regulateur/societe de gestion avant desactivation (jamais automatique).`);
      candidatsDesactivation += funds.length;
    } else if (continu === false) {
      console.log(`  => Pas de cron continu pour ce pays (import periodique par fichier). Ces fonds RESTERONT dormants tant qu'un nouvel export n'est pas fourni.`);
      console.log(`     Action recommandee : fournir un export recent (ASFIM Maroc / CMF Tunisie / COSUMAF-BVMAC CEMAC) couvrant ces fonds.`);
      attentePipeline += funds.length;
    } else {
      console.log(`  => Pays hors mapping pipeline connu — a investiguer manuellement.`);
    }
    for (const f of funds.slice(0, 8)) {
      console.log(`     [${f.id}] ${f.nom_fond} — derniere VL ${f.last_vl} (${f.age_j}j)`);
    }
    if (funds.length > 8) console.log(`     ... (+${funds.length - 8})`);
    console.log('');
  }

  console.log('=== RESUME ===');
  console.log(`Total fonds dormants       : ${rows.length}`);
  console.log(`Candidats desactivation (pipeline actif, fonds absent) : ${candidatsDesactivation}`);
  console.log(`En attente d'un nouvel export fichier (pas de cron)   : ${attentePipeline}`);
  console.log('\nAucune modification effectuee. Decision finale (desactivation ou fourniture de fichier) = utilisateur.');

  await conn.end();
}

run().catch((e) => { console.error('ERREUR FATALE:', e.message); process.exit(1); });
