#!/usr/bin/env node
/**
 * diagnose_index_history.js — Diagnostic READ-ONLY de la continuite des indices
 * =============================================================================
 *
 * Compare la serie stockee dans `indice_references` (BDD production) avec la
 * serie AUTORITATIVE recuperee en direct depuis les sources officielles, pour
 * repondre a UNE question precise, sans rien modifier :
 *
 *   « La serie historique en base est-elle correcte (et seule la QUEUE est
 *     gelee/fausse), ou bien toute la serie est-elle sur une mauvaise echelle ? »
 *
 * Pour chaque indice (NSE, Tunindex, MASI), le script :
 *   1. recupere la serie autoritative (NGX doclib / BVMT REST / medias24) ;
 *   2. lit la serie BDD depuis une date de debut (--since, defaut 2023-01-01) ;
 *   3. apparie chaque point BDD a la valeur autoritative la plus proche (+/-4 j) ;
 *   4. detecte : les paliers GELES (valeurs consecutives identiques) et la
 *      PREMIERE date ou |BDD/autoritatif - 1| depasse le seuil (defaut 3 %) ;
 *   5. imprime un rapport compact + un verdict.
 *
 * AUCUNE ECRITURE EN BASE. Que des SELECT. Idempotent, sans effet de bord.
 *
 * Usage :
 *   node scripts/scraper/diagnose_index_history.js
 *   node scripts/scraper/diagnose_index_history.js --since 2024-01-01 --seuil 5
 *   node scripts/scraper/diagnose_index_history.js --indice NSE --verbose
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const https = require('https');
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// --------------------------------------------------------------------------
// CLI
// --------------------------------------------------------------------------
function parseArgs() {
  const a = process.argv.slice(2);
  const o = { since: '2023-01-01', seuil: 3, indice: null, verbose: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--since' && a[i + 1]) o.since = a[++i];
    else if (a[i] === '--seuil' && a[i + 1]) o.seuil = parseFloat(a[++i]);
    else if (a[i] === '--indice' && a[i + 1]) o.indice = a[++i].toUpperCase();
    else if (a[i] === '--verbose') o.verbose = true;
  }
  return o;
}

// --------------------------------------------------------------------------
// HTTP (native https, JSON)
// --------------------------------------------------------------------------
function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json, text/plain, */*' },
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpGetJson(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(new Error(`JSON parse ${url}: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout ' + url)); });
  });
}

function epochMsToISO(ms) { return new Date(Number(ms)).toISOString().slice(0, 10); }

const FR_MONTHS = {
  'janv.': 1, 'janvier': 1, 'févr.': 2, 'fév.': 2, 'fevr.': 2, 'février': 2, 'fevrier': 2,
  'mars': 3, 'avr.': 4, 'avril': 4, 'mai': 5, 'juin': 6, 'juil.': 7, 'juillet': 7,
  'août': 8, 'aout': 8, 'sept.': 9, 'septembre': 9, 'oct.': 10, 'octobre': 10,
  'nov.': 11, 'novembre': 11, 'déc.': 12, 'dec.': 12, 'décembre': 12, 'decembre': 12,
};
function frLongDateToISO(s) {
  if (!s || typeof s !== 'string') return null;
  const p = s.trim().toLowerCase().split(/\s+/);
  if (p.length < 3) return null;
  const d = parseInt(p[0], 10), m = FR_MONTHS[p[1]], y = parseInt(p[2], 10);
  if (!d || !m || !y) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// --------------------------------------------------------------------------
// Sources autoritatives -> Map(ISO date -> value)
// --------------------------------------------------------------------------
async function authNSE() {
  const json = await httpGetJson('https://doclib.ngxgroup.com/REST/api/chartdata/ASI');
  const map = new Map();
  for (const pair of (json.IndiciesData || [])) {
    if (Array.isArray(pair) && pair.length >= 2) map.set(epochMsToISO(pair[0]), Number(pair[1]));
  }
  if (json.currentDateTime && json.currentPrice) {
    map.set(String(json.currentDateTime).slice(0, 10), Number(json.currentPrice));
  }
  return map;
}
async function authTunindex() {
  const json = await httpGetJson('https://www.bvmt.com.tn/rest_api/rest/history/TN0009050014');
  const map = new Map();
  for (const row of (json.indexHistorys || [])) {
    const iso = frLongDateToISO(row.sEANCE || row.seance || '');
    if (iso) map.set(iso, Number(row.lAST != null ? row.lAST : row.last));
  }
  return map;
}
async function authMASI() {
  // 10 ans pour couvrir l'historique de comparaison
  const json = await httpGetJson('https://medias24.com/content/api?method=getMasiHistory&periode=10y&format=json');
  const map = new Map();
  const labels = json?.result?.labels || [], prices = json?.result?.prices || [];
  for (let i = 0; i < labels.length; i++) map.set(epochMsToISO(labels[i] * 1000), Number(prices[i]));
  return map;
}

const INDICES = {
  NSE: { label: 'NSE All Share (Nigeria)', auth: authNSE, fullHistory: true },
  TUNINDEX: { label: 'Tunindex (Tunisie)', auth: authTunindex, fullHistory: false }, // BVMT ~3 mois
  MASI: { label: 'MASI (Maroc)', auth: authMASI, fullHistory: true },
};

// nearest authoritative value within +/- maxDays
function nearest(authMap, iso, maxDays = 4) {
  if (authMap.has(iso)) return authMap.get(iso);
  const t = new Date(iso).getTime();
  let best = null, bestDiff = Infinity;
  for (const [d, v] of authMap) {
    const diff = Math.abs(new Date(d).getTime() - t);
    if (diff < bestDiff && diff <= maxDays * 86400000) { bestDiff = diff; best = v; }
  }
  return best;
}

// --------------------------------------------------------------------------
// Diagnostic d'un indice
// --------------------------------------------------------------------------
async function diagnoseOne(conn, key, opts) {
  const cfg = INDICES[key];
  console.log('\n============================================================');
  console.log(`INDICE : ${key} — ${cfg.label}`);
  console.log('============================================================');

  let authMap;
  try { authMap = await cfg.auth(); }
  catch (e) { console.log(`  ECHEC source autoritative: ${e.message}`); return; }
  const authDates = [...authMap.keys()].sort();
  console.log(`  Source autoritative: ${authMap.size} points (${authDates[0]} -> ${authDates[authDates.length - 1]})`);

  const [rows] = await conn.execute(
    `SELECT date, valeur FROM indice_references
     WHERE id_indice = ? AND date >= ? AND valeur IS NOT NULL
     ORDER BY date ASC`,
    [key, opts.since]
  );
  if (!rows.length) { console.log(`  Aucune ligne BDD depuis ${opts.since}.`); return; }

  const series = rows.map(r => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
    val: parseFloat(r.valeur),
  }));
  console.log(`  Serie BDD: ${series.length} points (${series[0].date} -> ${series[series.length - 1].date})`);

  // 1) Paliers geles : plus longue suite de valeurs consecutives identiques
  let frozenStart = null, frozenLen = 1, maxFrozen = { len: 1, start: series[0].date, end: series[0].date, val: series[0].val };
  for (let i = 1; i < series.length; i++) {
    if (Math.abs(series[i].val - series[i - 1].val) < 0.005) {
      if (frozenStart === null) { frozenStart = series[i - 1].date; frozenLen = 2; }
      else frozenLen++;
      if (frozenLen > maxFrozen.len) maxFrozen = { len: frozenLen, start: frozenStart, end: series[i].date, val: series[i].val };
    } else { frozenStart = null; frozenLen = 1; }
  }
  if (maxFrozen.len >= 3) {
    console.log(`  PALIER GELE le plus long: ${maxFrozen.len} jours identiques @ ${maxFrozen.val} (${maxFrozen.start} -> ${maxFrozen.end})`);
  } else {
    console.log(`  Pas de palier gele significatif (max ${maxFrozen.len} valeurs identiques).`);
  }

  // 2) Comparaison BDD vs autoritatif + premiere divergence
  let firstDiverge = null, matched = 0, lastGood = null;
  const samples = [];
  for (const pt of series) {
    const a = nearest(authMap, pt.date, 4);
    if (a == null || a === 0) continue;
    matched++;
    const ratio = pt.val / a;
    const devPct = (ratio - 1) * 100;
    if (Math.abs(devPct) <= opts.seuil) lastGood = pt.date;
    else if (!firstDiverge) firstDiverge = { date: pt.date, db: pt.val, auth: a, devPct };
    if (opts.verbose) samples.push({ date: pt.date, db: pt.val, auth: a, devPct });
  }

  console.log(`  Points BDD apparies a l'autoritatif (+/-4j): ${matched}/${series.length}`);
  if (matched === 0) {
    console.log('  (Fenetre autoritative ne couvre pas la periode BDD — diagnostic partiel.)');
  }
  if (opts.verbose) {
    console.log('  Echantillon (date | BDD | autoritatif | ecart%):');
    const step = Math.max(1, Math.floor(samples.length / 25));
    for (let i = 0; i < samples.length; i += step) {
      const s = samples[i];
      console.log(`    ${s.date} | ${s.db.toFixed(2)} | ${s.auth.toFixed(2)} | ${s.devPct >= 0 ? '+' : ''}${s.devPct.toFixed(2)}%`);
    }
  }

  // 3) Verdict
  console.log('  --- VERDICT ---');
  if (matched === 0) {
    console.log('  INDETERMINE: pas de recouvrement de dates entre BDD et source.');
  } else if (!firstDiverge) {
    console.log(`  COHERENT: la serie BDD correspond a l'autoritatif (<= ${opts.seuil}%) sur toute la periode appariee.`);
    console.log('  => La queue recente est probablement juste MANQUANTE (a backfiller), pas fausse.');
  } else {
    console.log(`  DERNIER POINT COHERENT (<= ${opts.seuil}%): ${lastGood || 'aucun'}`);
    console.log(`  PREMIERE DIVERGENCE: ${firstDiverge.date} | BDD=${firstDiverge.db.toFixed(2)} vs autoritatif=${firstDiverge.auth.toFixed(2)} (${firstDiverge.devPct >= 0 ? '+' : ''}${firstDiverge.devPct.toFixed(2)}%)`);
    if (lastGood && new Date(firstDiverge.date) > new Date(lastGood)) {
      console.log('  => SCENARIO "QUEUE GELEE/FAUSSE": serie historique CORRECTE jusqu\'a ' + lastGood + ', puis fausse.');
      console.log('     CORRECTION SURE = corriger/remplacer le segment [' + firstDiverge.date + ' -> fin] avec les vraies valeurs.');
    } else {
      console.log('  => Divergence des le debut de la fenetre: verifier une eventuelle difference d\'echelle/source.');
    }
  }
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main() {
  const opts = parseArgs();
  console.log('############################################################');
  console.log('DIAGNOSTIC CONTINUITE INDICES (READ-ONLY) — Africafunds');
  console.log(`Depuis: ${opts.since} | Seuil divergence: ${opts.seuil}% | ${new Date().toISOString()}`);
  console.log('############################################################');

  let conn;
  try { conn = await mysql.createConnection(DB_CONFIG); }
  catch (e) { console.error('ERREUR connexion MySQL: ' + e.message); process.exit(1); }

  try {
    const keys = opts.indice ? [opts.indice].filter(k => INDICES[k]) : Object.keys(INDICES);
    if (!keys.length) { console.log('Indice inconnu. Choix: ' + Object.keys(INDICES).join(', ')); }
    for (const k of keys) await diagnoseOne(conn, k, opts);
    console.log('\n############################################################');
    console.log('FIN DIAGNOSTIC — aucune ecriture effectuee (READ-ONLY).');
    console.log('############################################################');
  } finally {
    await conn.end();
  }
}

main().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
