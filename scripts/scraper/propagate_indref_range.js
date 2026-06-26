#!/usr/bin/env node
/**
 * propagate_indref_range.js — Propagation indRef sur une PLAGE de dates
 * =====================================================================
 *
 * Contexte : `fix_index_tail.js` corrige la table `indice_references` (valeurs
 * brutes des indices). Mais les pages fonds lisent `valorisations.indRef`
 * (et indRef_EUR / indRef_USD), une copie par-fond alimentee separement.
 * La propagation native (`propagateIndRef` du scraper) ne couvre que +/- 7
 * jours autour d'UNE date scrapee. Si l'indice est reste fige plusieurs mois
 * dans `indice_references`, les `valorisations.indRef` correspondants sont
 * faux sur toute cette periode.
 *
 * Ce script reprend EXACTEMENT la logique validee de `propagateIndRef`
 * (mapping pays -> indice, matching date exact ou plus proche a +/- 7 jours)
 * mais l'applique sur une FENETRE [since, until] complete, en lisant la
 * SOURCE DE VERITE = table `indice_references` (deja corrigee).
 *
 * SECURITES (zero regression) :
 *   - DRY-RUN par defaut. Rien n'est ecrit sans --execute.
 *   - --since OBLIGATOIRE (borne basse de la fenetre a propager).
 *   - On ne touche QUE valorisations.indRef / indice_name / ID_indice.
 *     Les colonnes EUR/USD sont recalculees ENSUITE par
 *     recalc_eur_usd_daily_rate.js (logique validee, DIVISION par taux).
 *   - On ne met a jour une VL que si indRef differe (> 0.01) : idempotent.
 *   - Aucune insertion de VL : on ne fait que renseigner l'indRef de VL
 *     existantes (pas de creation de donnee fonds).
 *
 * Usage :
 *   # dry-run (montre, n'ecrit rien)
 *   node scripts/scraper/propagate_indref_range.js --since 2025-01-01
 *   # appliquer
 *   node scripts/scraper/propagate_indref_range.js --since 2025-01-01 --execute
 *   # un seul indice / un seul pays / un seul fond
 *   node scripts/scraper/propagate_indref_range.js --since 2025-01-01 --indice NSE --execute
 *   node scripts/scraper/propagate_indref_range.js --since 2025-01-01 --pays Nigeria --execute
 *   node scripts/scraper/propagate_indref_range.js --since 2025-01-01 --fond 866 --execute
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

// Mapping pays -> indice : COPIE EXACTE de INDEX_CONFIG (scrape_indices_daily.js).
// MONIA exclu (pays: []) : c'est un taux, non propage aux fonds.
const INDEX_CONFIG = [
  {
    id_indice: 'BRVM',
    nom_indice: 'BRVM Composite',
    pays: ['Côte d\'Ivoire', 'Cote d\'Ivoire', 'Senegal', 'Sénégal', 'Burkina Faso',
           'Mali', 'Togo', 'Benin', 'Bénin', 'Niger', 'Guinee-Bissau', 'Guinée-Bissau', 'UEMOA'],
  },
  { id_indice: 'MASI', nom_indice: 'MASI', pays: ['Maroc'] },
  { id_indice: 'Tunindex', nom_indice: 'Tunindex', pays: ['Tunisie'] },
  { id_indice: 'NSE', nom_indice: 'NSE All Share', pays: ['Nigeria', 'NIGERIA'] },
];

const SEVEN_DAYS_MS = 7 * 86400000;

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { since: null, until: todayISO(), execute: false, indice: null, pays: null, fondId: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--since' && a[i + 1]) o.since = a[++i];
    else if (a[i] === '--until' && a[i + 1]) o.until = a[++i];
    else if (a[i] === '--execute') o.execute = true;
    else if (a[i] === '--indice' && a[i + 1]) o.indice = a[++i];
    else if (a[i] === '--pays' && a[i + 1]) o.pays = a[++i];
    else if (a[i] === '--fond' && a[i + 1]) o.fondId = a[++i];
  }
  return o;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function toISO(d) { return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10); }

async function main() {
  const opts = parseArgs();
  console.log('############################################################');
  console.log('PROPAGATION indRef (indice_references -> valorisations.indRef)');
  console.log(`Mode: ${opts.execute ? 'EXECUTE' : 'DRY-RUN'} | Fenetre: ${opts.since} -> ${opts.until}`);
  if (opts.indice) console.log(`Indice filtre: ${opts.indice}`);
  if (opts.pays) console.log(`Pays filtre: ${opts.pays}`);
  if (opts.fondId) console.log(`Fond filtre: ${opts.fondId}`);
  console.log('############################################################');

  if (!opts.since) {
    console.error('\nERREUR: --since AAAA-MM-JJ est obligatoire (borne basse de la propagation).');
    process.exit(1);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.since) || !/^\d{4}-\d{2}-\d{2}$/.test(opts.until)) {
    console.error('ERREUR: --since / --until au format AAAA-MM-JJ.');
    process.exit(1);
  }

  // Indices actifs (filtre optionnel)
  let activeConfigs = INDEX_CONFIG;
  if (opts.indice) {
    activeConfigs = INDEX_CONFIG.filter(c => c.id_indice.toLowerCase() === opts.indice.toLowerCase());
    if (!activeConfigs.length) {
      console.error(`ERREUR: indice inconnu "${opts.indice}". Choix: ${INDEX_CONFIG.map(c => c.id_indice).join(', ')}`);
      process.exit(1);
    }
  }

  let conn;
  try { conn = await mysql.createConnection(DB_CONFIG); }
  catch (e) { console.error('ERREUR connexion MySQL: ' + e.message); process.exit(1); }

  let grandUpdated = 0, grandAlready = 0, grandNoMatch = 0, grandFunds = 0;
  try {
    // Charge indice_references sur [since-7j, until] pour permettre le nearest +/- 7j en bord de fenetre
    const loadStart = new Date(opts.since); loadStart.setDate(loadStart.getDate() - 7);
    const loadStartISO = toISO(loadStart);
    const ids = activeConfigs.map(c => c.id_indice);
    const placeholders = ids.map(() => '?').join(',');
    const [refRows] = await conn.execute(
      `SELECT id_indice, date, valeur FROM indice_references
       WHERE id_indice IN (${placeholders}) AND date >= ? AND date <= ?
         AND valeur IS NOT NULL AND valeur > 0`,
      [...ids, loadStartISO, opts.until]
    );
    const indexDataByIndice = {};
    for (const r of refRows) {
      const d = toISO(r.date);
      if (!indexDataByIndice[r.id_indice]) indexDataByIndice[r.id_indice] = new Map();
      indexDataByIndice[r.id_indice].set(d, parseFloat(r.valeur));
    }
    for (const cfg of activeConfigs) {
      const n = indexDataByIndice[cfg.id_indice] ? indexDataByIndice[cfg.id_indice].size : 0;
      console.log(`  Reference ${cfg.id_indice}: ${n} points dans la fenetre.`);
    }

    // Liste des fonds (filtre pays / fond optionnel)
    const paysFilter = opts.pays ? ' AND fi.pays = ?' : '';
    const fondFilter = opts.fondId ? ' AND fi.id = ?' : '';
    const params = [];
    if (opts.pays) params.push(opts.pays);
    if (opts.fondId) params.push(opts.fondId);
    const [funds] = await conn.execute(
      `SELECT fi.id, fi.nom_fond, fi.pays FROM fond_investissements fi
       WHERE fi.pays IS NOT NULL ${paysFilter} ${fondFilter}
       ORDER BY fi.pays, fi.id`,
      params
    );

    for (const fund of funds) {
      const matchingCfg = activeConfigs.find(cfg =>
        cfg.pays.some(p => p.toLowerCase() === (fund.pays || '').toLowerCase())
      );
      if (!matchingCfg) continue;
      const indexData = indexDataByIndice[matchingCfg.id_indice];
      if (!indexData || indexData.size === 0) continue;

      const [vls] = await conn.execute(
        `SELECT id, date, indRef FROM valorisations
         WHERE fund_id = ? AND date >= ? AND date <= ? ORDER BY date ASC`,
        [fund.id, opts.since, opts.until]
      );
      if (vls.length === 0) continue;

      let updated = 0, already = 0, noMatch = 0;
      for (const vl of vls) {
        const vlDate = toISO(vl.date);
        let indexVal = indexData.get(vlDate);
        if (indexVal === undefined) {
          const vlObj = new Date(vlDate);
          let bestDate = null, bestDiff = Infinity;
          for (const [d] of indexData) {
            const diff = Math.abs(new Date(d) - vlObj);
            if (diff < bestDiff && diff <= SEVEN_DAYS_MS) { bestDiff = diff; bestDate = d; }
          }
          if (bestDate) indexVal = indexData.get(bestDate);
        }
        if (indexVal === undefined) { noMatch++; continue; }
        if (vl.indRef !== null && Math.abs(parseFloat(vl.indRef) - indexVal) < 0.01) { already++; continue; }
        if (opts.execute) {
          await conn.execute(
            'UPDATE valorisations SET indRef = ?, indice_name = ?, ID_indice = ? WHERE id = ?',
            [indexVal, matchingCfg.nom_indice, matchingCfg.id_indice, vl.id]
          );
        }
        updated++;
      }
      if (updated > 0 || noMatch > 0) {
        console.log(`  [${fund.pays}] ${fund.nom_fond} (id:${fund.id}): ${updated} maj, ${already} ok, ${noMatch} sans match`);
      }
      grandUpdated += updated; grandAlready += already; grandNoMatch += noMatch; grandFunds++;
    }

    console.log('\n############################################################');
    console.log(`TOTAL: ${grandFunds} fonds traites | ${grandUpdated} indRef maj | ${grandAlready} deja ok | ${grandNoMatch} sans match`);
    if (!opts.execute) {
      console.log('>>> DRY-RUN: aucune modification. Relancez avec --execute pour appliquer. <<<');
    } else {
      console.log('>>> indRef (devise locale) propage. <<<');
      console.log('Etape suivante OBLIGATOIRE (EUR/USD) : node scripts/recalc/recalc_eur_usd_daily_rate.js');
    }
    console.log('############################################################');
  } finally {
    await conn.end();
  }
}

main().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
