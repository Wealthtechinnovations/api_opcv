#!/usr/bin/env node
/**
 * fix_index_tail.js — Correction de la QUEUE GELEE/FAUSSE des indices boursiers
 * ===========================================================================
 *
 * Contexte : l'ancien scraper HTML a cesse de fonctionner et a fige (ou mal
 * parse) la queue des series NSE / Tunindex / MASI dans `indice_references`.
 * Le diagnostic `diagnose_index_history.js` identifie la DATE DE GEL exacte.
 * Ce script remplace ce segment errone par les VRAIES valeurs autoritatives
 * (NGX doclib / BVMT REST / medias24) et comble les seances manquantes.
 *
 * SECURITES (zero regression) :
 *   - DRY-RUN par defaut. Rien n'est ecrit sans --execute.
 *   - --since OBLIGATOIRE en mode --execute (issu du diagnostic).
 *   - On ne touche QUE les dates >= --since (l'historique valide est intact).
 *   - On ne corrige une valeur existante que si l'ecart depasse --seuil (%).
 *   - Les seances manquantes sont INSEREES (jamais de doublon : verif prealable).
 *   - Idempotent : relançable sans effet de bord.
 *   - Propagation indRef OPTIONNELLE (--propagate) et separee : par defaut on
 *     ne corrige que `indice_references`. La propagation se relance ensuite
 *     via le scraper officiel, dont c'est la logique validee.
 *
 * Usage :
 *   # 1) toujours en dry-run d'abord (montre les corrections)
 *   node scripts/scraper/fix_index_tail.js --indice NSE --since 2025-01-15
 *   # 2) appliquer
 *   node scripts/scraper/fix_index_tail.js --indice NSE --since 2025-01-15 --execute
 *   # tous les indices concernes :
 *   node scripts/scraper/fix_index_tail.js --since 2025-01-15 --execute
 *
 *   # MASI via la source de repli FT markets (medias24 etant ferme par
 *   # Cloudflare). medias24 reste le DEFAUT : il faut demander --source ft.
 *   node scripts/scraper/fix_index_tail.js --indice MASI --since 2026-08-06 --source ft
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
  const o = { since: null, until: todayISO(), seuil: 3, indice: null, execute: false, propagate: false, source: 'medias24' };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--since' && a[i + 1]) o.since = a[++i];
    else if (a[i] === '--until' && a[i + 1]) o.until = a[++i];
    else if (a[i] === '--seuil' && a[i + 1]) o.seuil = parseFloat(a[++i]);
    else if (a[i] === '--indice' && a[i + 1]) o.indice = a[++i].toUpperCase();
    else if (a[i] === '--execute') o.execute = true;
    else if (a[i] === '--propagate') o.propagate = true;
    else if (a[i] === '--source' && a[i + 1]) o.source = a[++i].toLowerCase();
  }
  return o;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

// --------------------------------------------------------------------------
// HTTP + helpers (identiques aux sources du scraper officiel)
// --------------------------------------------------------------------------
function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000, headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json, text/plain, */*' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpGetJson(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout ' + url)); });
  });
}
function epochMsToISO(ms) { return new Date(Number(ms)).toISOString().slice(0, 10); }
const FR_MONTHS = { 'janv.': 1, 'janvier': 1, 'févr.': 2, 'fév.': 2, 'fevr.': 2, 'février': 2, 'fevrier': 2, 'mars': 3, 'avr.': 4, 'avril': 4, 'mai': 5, 'juin': 6, 'juil.': 7, 'juillet': 7, 'août': 8, 'aout': 8, 'sept.': 9, 'septembre': 9, 'oct.': 10, 'octobre': 10, 'nov.': 11, 'novembre': 11, 'déc.': 12, 'dec.': 12, 'décembre': 12, 'decembre': 12 };
function frLongDateToISO(s) {
  if (!s || typeof s !== 'string') return null;
  const p = s.trim().toLowerCase().split(/\s+/);
  if (p.length < 3) return null;
  const d = parseInt(p[0], 10), m = FR_MONTHS[p[1]], y = parseInt(p[2], 10);
  if (!d || !m || !y) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

async function authNSE() {
  const json = await httpGetJson('https://doclib.ngxgroup.com/REST/api/chartdata/ASI');
  const map = new Map();
  for (const pr of (json.IndiciesData || [])) if (Array.isArray(pr) && pr.length >= 2) map.set(epochMsToISO(pr[0]), Number(pr[1]));
  if (json.currentDateTime && json.currentPrice) map.set(String(json.currentDateTime).slice(0, 10), Number(json.currentPrice));
  return map;
}
async function authTunindex() {
  const json = await httpGetJson('https://www.bvmt.com.tn/rest_api/rest/history/TN0009050014');
  const map = new Map();
  for (const row of (json.indexHistorys || [])) { const iso = frLongDateToISO(row.sEANCE || ''); if (iso) map.set(iso, Number(row.lAST)); }
  return map;
}
async function authMASI() {
  const json = await httpGetJson('https://medias24.com/content/api?method=getMasiHistory&periode=10y&format=json');
  const map = new Map();
  const L = json?.result?.labels || [], P = json?.result?.prices || [];
  for (let i = 0; i < L.length; i++) map.set(epochMsToISO(L[i] * 1000), Number(P[i]));
  return map;
}

/**
 * MASI via FT markets — source de REPLI, ajoutee A COTE de l existante.
 *
 * POURQUOI. medias24 est ferme par Cloudflare : 403 a Node ET a curl depuis S2,
 * verifie. `authMASI` ci-dessus echoue donc, `fixOne` rend « ECHEC source
 * autoritative » et ignore l indice — et les seances marocaines manquantes ne
 * sont jamais comblees. Mesure du 2026-10-07 : `C9.MAROC` a 48,2 %, soit
 * 4 161 VL sans benchmark sur 8 031 entrees en 30 jours.
 *
 * medias24 RESTE LE DEFAUT. Rien ne change pour un appel existant : il faut
 * `--source ft` pour emprunter ce chemin. C est la regle d evolution additive
 * du depot — on ajoute une voie, on n en retire aucune.
 *
 * La logique de validation des colonnes vit dans `scripts/scraper/masi_ft.js`
 * et n est pas recopiee ici : le tableau FT donne
 * Date | Ouverture | Haut | Bas | Cloture | Volume, et prendre la premiere
 * colonne venue fausserait le benchmark d environ +1,6 % — un ecart credible,
 * donc invisible pour tous les controles. `serieMASIviaFT` rend une serie VIDE
 * si les colonnes ne sont pas confirmees, jamais une serie a demi fiable, et
 * `fixOne` traite une source vide comme une absence de donnees.
 *
 * ANCRE DE NON-REGRESSION. La cloture FT du 31/07/2026 vaut 17 843,70, soit
 * exactement la valeur deja presente dans `indice_references` ce jour-la
 * (ecart 0,00). Avant tout `--execute` sur une plage englobant cette date,
 * verifier en dry-run que cette seance n est PAS signalee comme a corriger :
 * si elle l etait, les deux series ne seraient pas la meme et il faudrait
 * s arreter.
 */
async function authMASIviaFT(opts) {
  const { serieMASIviaFT } = require('./masi_ft');
  // Une marge de dix jours avant `--since` : `fixOne` ne corrige que les dates
  // de la fenetre, mais la validation des colonnes a besoin de plusieurs
  // seances consecutives pour juger l enchainement.
  const depuis = new Date(new Date(`${opts.since}T00:00:00Z`).getTime() - 10 * 86400000);
  return serieMASIviaFT(depuis.toISOString().slice(0, 10), opts.until, true);
}

const INDICES = {
  NSE: { nom: 'NSE All Share', type_indice_id: 1, min: 1000, auth: authNSE, dbId: 'NSE' },
  TUNINDEX: { nom: 'Tunindex', type_indice_id: 1, min: 1000, auth: authTunindex, dbId: 'Tunindex' },
  MASI: { nom: 'MASI', type_indice_id: 1, min: 1000, auth: authMASI, dbId: 'MASI' },
};

// --------------------------------------------------------------------------
// Correction d'un indice
// --------------------------------------------------------------------------
async function fixOne(conn, key, opts) {
  const cfg = INDICES[key];
  console.log('\n============================================================');
  console.log(`CORRECTION : ${key} — ${cfg.nom}`);
  console.log('============================================================');

  let authMap;
  // `--source ft` ne concerne que MASI : les autres indices ont des sources
  // qui repondent. Un `--source ft` sur NSE ou TUNINDEX est donc ignore, et
  // dit, plutot que silencieusement interprete.
  const useFT = opts.source === 'ft' && key === 'MASI';
  if (opts.source === 'ft' && key !== 'MASI') {
    console.log(`  --source ft ne s applique qu a MASI : ${key} garde sa source habituelle.`);
  }
  try { authMap = useFT ? await authMASIviaFT(opts) : await cfg.auth(); }
  catch (e) { console.log(`  ECHEC source autoritative: ${e.message} — indice ignore.`); return { updated: 0, inserted: 0 }; }
  console.log(`  Source autoritative${useFT ? ' (FT markets MASI:CAS)' : ''}: ${authMap.size} points.`);

  // Liste des dates autoritatives dans la fenetre [since, until]
  const inWindow = [...authMap.entries()]
    .filter(([d]) => d >= opts.since && d <= opts.until)
    .sort((a, b) => a[0] < b[0] ? -1 : 1);
  if (!inWindow.length) { console.log('  Aucune seance autoritative dans la fenetre.'); return { updated: 0, inserted: 0 }; }
  console.log(`  Seances autoritatives dans [${opts.since} -> ${opts.until}]: ${inWindow.length}`);

  const dbId = cfg.dbId || key;
  // Etat BDD existant sur la fenetre
  const [rows] = await conn.execute(
    `SELECT id, date, valeur FROM indice_references WHERE id_indice = ? AND date >= ? AND date <= ?`,
    [dbId, opts.since, opts.until]
  );
  const dbByDate = new Map();
  for (const r of rows) {
    const d = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);
    dbByDate.set(d, { id: r.id, valeur: parseFloat(r.valeur) });
  }

  let updated = 0, inserted = 0, ok = 0;
  for (const [date, authVal] of inWindow) {
    if (!isFinite(authVal) || authVal < cfg.min) continue;
    const existing = dbByDate.get(date);
    if (existing) {
      const devPct = Math.abs((existing.valeur / authVal - 1) * 100);
      if (devPct <= opts.seuil) { ok++; continue; }
      console.log(`  [UPDATE] ${date}: ${existing.valeur.toFixed(2)} -> ${authVal.toFixed(2)} (ecart ${devPct.toFixed(1)}%)`);
      if (opts.execute) {
        await conn.execute('UPDATE indice_references SET valeur = ? WHERE id = ?', [authVal, existing.id]);
      }
      updated++;
    } else {
      console.log(`  [INSERT] ${date}: ${authVal.toFixed(2)} (seance manquante)`);
      if (opts.execute) {
        await conn.execute(
          `INSERT INTO indice_references (type_indice_id, id_indice, nom_indice, valeur, date) VALUES (?, ?, ?, ?, ?)`,
          [cfg.type_indice_id, dbId, cfg.nom, authVal, date]
        );
      }
      inserted++;
    }
  }
  console.log(`  --- ${key}: ${updated} corrigees, ${inserted} inserees, ${ok} deja correctes ---`);
  return { updated, inserted };
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main() {
  const opts = parseArgs();
  console.log('############################################################');
  console.log('FIX QUEUE GELEE INDICES — Africafunds');
  console.log(`Mode: ${opts.execute ? 'EXECUTE' : 'DRY-RUN'} | Fenetre: ${opts.since} -> ${opts.until} | Seuil: ${opts.seuil}%`);
  console.log('############################################################');

  if (!opts.since) {
    console.error('\nERREUR: --since AAAA-MM-JJ est obligatoire (date de gel issue du diagnostic).');
    console.error('Lancez d\'abord: node scripts/scraper/diagnose_index_history.js');
    process.exit(1);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.since)) { console.error('ERREUR: --since format AAAA-MM-JJ.'); process.exit(1); }

  let conn;
  try { conn = await mysql.createConnection(DB_CONFIG); }
  catch (e) { console.error('ERREUR connexion MySQL: ' + e.message); process.exit(1); }

  let totU = 0, totI = 0;
  try {
    const keys = opts.indice ? [opts.indice].filter(k => INDICES[k]) : Object.keys(INDICES);
    if (!keys.length) { console.log('Indice inconnu. Choix: ' + Object.keys(INDICES).join(', ')); }
    for (const k of keys) { const r = await fixOne(conn, k, opts); totU += r.updated; totI += r.inserted; }

    console.log('\n############################################################');
    console.log(`TOTAL: ${totU} valeurs corrigees, ${totI} seances inserees.`);
    if (!opts.execute) {
      console.log('>>> DRY-RUN: aucune modification. Relancez avec --execute pour appliquer. <<<');
    } else {
      console.log('>>> MODIFICATIONS APPLIQUEES a indice_references. <<<');
      console.log('Etape suivante (propagation indRef vers valorisations) : relancer le scraper');
      console.log('officiel sur la plage corrigee, ou un backfill jour par jour.');
    }
    console.log('############################################################');
  } finally {
    await conn.end();
  }
}

main().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
