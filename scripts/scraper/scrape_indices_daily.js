#!/usr/bin/env node
/**
 * scrape_indices_daily.js — Daily index scraper for Africafunds
 * =============================================================
 *
 * Fetches today's closing values for the 5 major market indices tracked
 * by the platform, inserts them into `indice_references`, and propagates
 * the values to `valorisations.indRef` for all linked funds.
 *
 * Indices:
 *   1. BRVM Composite   (UEMOA)    — source: bfin.brvm.org
 *   2. MASI             (Maroc)    — source: casablanca-bourse.com (Bourse de Casablanca)
 *   3. Tunindex          (Tunisie)  — source: bvmt.com.tn
 *   4. NSE All Share     (Nigeria)  — source: ngxgroup.com
 *   5. MONIA             (Maroc)    — source: bkam.ma (Bank Al-Maghrib)
 *
 * Modes:
 *   --dry-run   (default)  Show what would be fetched/inserted without DB writes
 *   --execute              Actually insert into the database
 *
 * Options:
 *   --date YYYY-MM-DD      Fetch for a specific date (default: today)
 *   --skip-indref          Skip the indRef propagation step
 *   --verbose              Extra logging
 *
 * Usage:
 *   node scripts/scraper/scrape_indices_daily.js                     # dry-run
 *   node scripts/scraper/scrape_indices_daily.js --execute           # production
 *   node scripts/scraper/scrape_indices_daily.js --execute --date 2026-06-19
 *
 * NON-DESTRUCTIF: ne modifie jamais les donnees existantes (idempotent).
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const https = require('https');
const http = require('http');
const mysql = require('mysql2/promise');
const path = require('path');
const { execFile } = require('child_process');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 AfricafundsBot/1.0';
const HTTP_TIMEOUT = 30000;
const RETRY_MAX = 3;
const RETRY_BACKOFF = [2000, 4000, 8000]; // ms

/**
 * Index configuration — must match import_indices_excel.js exactly.
 * Each entry defines how to scrape a particular index.
 */
const INDEX_CONFIG = [
  {
    id_indice: 'BRVM',
    nom_indice: 'BRVM Composite',
    type_indice_id: 1,
    pays: ['Côte d\'Ivoire', 'Cote d\'Ivoire', 'Senegal', 'Sénégal', 'Burkina Faso',
           'Mali', 'Togo', 'Benin', 'Bénin', 'Niger', 'Guinee-Bissau', 'Guinée-Bissau', 'UEMOA'],
    devise_locale: 'XOF',
    scrape: scrapeBRVM,
  },
  {
    id_indice: 'MASI',
    nom_indice: 'MASI',
    type_indice_id: 1,
    pays: ['Maroc'],
    devise_locale: 'MAD',
    scrape: scrapeMASI,
  },
  {
    id_indice: 'Tunindex',
    nom_indice: 'Tunindex',
    type_indice_id: 1,
    pays: ['Tunisie'],
    devise_locale: 'TND',
    scrape: scrapeTunindex,
  },
  {
    id_indice: 'NSE',
    nom_indice: 'NSE All Share',
    type_indice_id: 1,
    pays: ['Nigeria', 'NIGERIA'],
    devise_locale: 'NGN',
    scrape: scrapeNSE,
  },
  {
    id_indice: 'MONIA',
    nom_indice: 'MONIA',
    type_indice_id: 1,
    pays: [],
    devise_locale: 'MAD',
    scrape: scrapeMONIA,
  },
];

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    mode: 'dry-run',
    date: todayISO(),
    skipIndref: false,
    verbose: false,
    backfillDays: 0,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--execute') opts.mode = 'execute';
    else if (args[i] === '--dry-run') opts.mode = 'dry-run';
    else if (args[i] === '--date' && args[i + 1]) opts.date = args[++i];
    else if (args[i] === '--skip-indref') opts.skipIndref = true;
    else if (args[i] === '--verbose') opts.verbose = true;
    else if (args[i] === '--backfill-days' && args[i + 1]) opts.backfillDays = Math.max(0, parseInt(args[++i], 10) || 0);
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node scrape_indices_daily.js [--execute|--dry-run] [--date YYYY-MM-DD] [--backfill-days N] [--skip-indref] [--verbose]');
      process.exit(0);
    }
  }
  return opts;
}

// Fenetre glissante de dates a traiter (de la plus ancienne a aujourd'hui).
// --backfill-days N => [today-N .. today] ; sinon => [--date] seul.
// Objectif : rattraper automatiquement les publications decalees (le marche
// cloture APRES le passage du cron a 18h30). INSERT idempotent => aucun doublon.
function datesToProcess(opts) {
  if (!opts.backfillDays || opts.backfillDays <= 0) return [opts.date];
  const dates = [];
  const end = new Date(opts.date + 'T00:00:00Z');
  for (let i = opts.backfillDays; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// HTTP Utilities (native https/http with retry + exponential backoff)
// ---------------------------------------------------------------------------

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const headers = {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      ...options.headers,
    };
    const req = proto.get(url, { timeout: HTTP_TIMEOUT, headers }, (res) => {
      // Follow redirects (301, 302, 307, 308)
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        httpGet(redirectUrl, options).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`HTTP timeout: ${url}`)); });
  });
}

async function httpGetWithRetry(url, options = {}) {
  let lastError = null;
  for (let attempt = 0; attempt < RETRY_MAX; attempt++) {
    try {
      const resp = await httpGet(url, options);
      if (resp.status === 200) return resp;
      if (resp.status === 404) return resp; // legitimate: no data available
      lastError = new Error(`HTTP ${resp.status} for ${url}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < RETRY_MAX - 1) {
      const delay = RETRY_BACKOFF[attempt] || 8000;
      await sleep(delay);
    }
  }
  throw lastError;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// HTML Parsing Helpers (lightweight, no external dependency)
// ---------------------------------------------------------------------------

/**
 * Extract text content from raw HTML, stripping tags.
 */
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#?\w+;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parse a French/European formatted number: "12 345,67" -> 12345.67
 */
function parseNumber(s) {
  if (!s || typeof s !== 'string') return null;
  s = s.trim().replace(/ /g, '').replace(/\s/g, '');
  // Handle French comma decimal: 12345,67
  s = s.replace(',', '.');
  // Remove thousands separators that are dots when there's already a decimal dot
  // e.g., "12.345.67" — but "12345.67" is fine
  // Strategy: if multiple dots, keep only the last one as decimal
  const dots = s.split('.');
  if (dots.length > 2) {
    s = dots.slice(0, -1).join('') + '.' + dots[dots.length - 1];
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Find all occurrences of a regex/substring in HTML and return surrounding context.
 */
function findInHtml(html, pattern) {
  const matches = [];
  let idx = 0;
  while (true) {
    const pos = html.indexOf(pattern, idx);
    if (pos === -1) break;
    const start = Math.max(0, pos - 500);
    const end = Math.min(html.length, pos + pattern.length + 500);
    matches.push(html.slice(start, end));
    idx = pos + pattern.length;
  }
  return matches;
}

// ---------------------------------------------------------------------------
// JSON / external-process helpers (additif — sources officielles 2026)
// ---------------------------------------------------------------------------

/**
 * Fetch JSON via native https (with retry). Throws on non-200 or invalid JSON.
 */
async function httpGetJson(url, extraHeaders = {}) {
  const resp = await httpGetWithRetry(url, {
    headers: { 'Accept': 'application/json, text/plain, */*', ...extraHeaders },
  });
  if (resp.status !== 200) throw new Error(`HTTP ${resp.status} for ${url}`);
  return JSON.parse(resp.body);
}

/**
 * Run an external command and resolve its stdout (string).
 * Used for `curl` (TLS-fingerprint WAF bypass) and `python3` (BOC PDF parsing).
 */
function execFileText(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 25 * 1024 * 1024, timeout: 60000, ...opts }, (err, stdout, stderr) => {
      if (err) {
        err.message = `${cmd} failed: ${err.message}${stderr ? ` | ${String(stderr).slice(0, 300)}` : ''}`;
        return reject(err);
      }
      resolve(stdout);
    });
  });
}

/**
 * Fetch text via `curl` — required for hosts that block Node's TLS fingerprint
 * (e.g. bkam.ma returns 403 to Node https/fetch but 200 to curl).
 */
function curlGetText(url, extraHeaders = []) {
  const args = [
    '-s', '-f', '-L', '--compressed', '--max-time', '30',
    '-H', `User-Agent: ${USER_AGENT}`,
    '-H', 'Accept-Language: fr-FR,fr;q=0.9,en;q=0.8',
    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    '-H', 'Sec-Fetch-Dest: document',
    '-H', 'Sec-Fetch-Mode: navigate',
    '-H', 'Sec-Fetch-Site: same-origin',
    ...extraHeaders,
    url,
  ];
  return execFileText('curl', args);
}

/** Epoch milliseconds (UTC midnight) -> 'YYYY-MM-DD'. */
function epochMsToISO(ms) {
  return new Date(Number(ms)).toISOString().slice(0, 10);
}

const FR_MONTHS = {
  'janv.': 1, 'janvier': 1, 'févr.': 2, 'fév.': 2, 'fevr.': 2, 'février': 2, 'fevrier': 2,
  'mars': 3, 'avr.': 4, 'avril': 4, 'mai': 5, 'juin': 6, 'juil.': 7, 'juillet': 7,
  'août': 8, 'aout': 8, 'sept.': 9, 'septembre': 9, 'oct.': 10, 'octobre': 10,
  'nov.': 11, 'novembre': 11, 'déc.': 12, 'dec.': 12, 'décembre': 12, 'decembre': 12,
};

/** French long date "16 mai 2026" / "24 juin 2026" -> "2026-05-16". */
function frLongDateToISO(s) {
  if (!s || typeof s !== 'string') return null;
  const parts = s.trim().toLowerCase().split(/\s+/);
  if (parts.length < 3) return null;
  const d = parseInt(parts[0], 10);
  const m = FR_MONTHS[parts[1]];
  const y = parseInt(parts[2], 10);
  if (!d || !m || !y) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Smallest medias24 `periode` window that still covers targetDate. */
function periodeForDate(targetDate) {
  const days = (Date.now() - new Date(targetDate).getTime()) / 86400000;
  if (days <= 25) return '1m';
  if (days <= 85) return '3m';
  if (days <= 180) return '6m';
  if (days <= 360) return '1y';
  return '10y';
}

// ---------------------------------------------------------------------------
// Index Scrapers
// ---------------------------------------------------------------------------

/**
 * BRVM Composite — depuis le Bulletin Officiel de la Cote (BOC) PDF du jour.
 *
 * Source officielle (CREPMF) : https://bfin.brvm.org/boc/BOC_JOUR/BOC_YYYYMMDD.pdf
 * La date est encodee dans le nom de fichier. L'extraction de la page 1 du PDF
 * est deleguee au helper Python `scrape_brvm_index.py` (reutilise pdfplumber,
 * deja installe pour le parseur de VL BRVM). 404 = jour non ouvre (week-end/ferie).
 */
async function scrapeBRVM(targetDate, verbose) {
  const helper = path.resolve(__dirname, 'scrape_brvm_index.py');
  const url = `https://bfin.brvm.org/boc/BOC_JOUR/BOC_${targetDate.replace(/-/g, '')}.pdf`;
  try {
    const out = await execFileText('python3', [helper, '--date', targetDate]);
    const json = JSON.parse(out.trim().split('\n').pop());
    if (json.status === 'ok' && json.brvm_composite != null) {
      const val = Number(json.brvm_composite);
      if (isFinite(val) && val > 50) {
        console.log(`    [BRVM] SUCCESS via BOC PDF (bfin): ${val}`);
        return { value: val, source: 'BRVM BOC PDF (bfin.brvm.org)', url: json.source || url };
      }
    } else if (json.status === 'no_session') {
      if (verbose) console.log(`    [BRVM] pas de seance le ${targetDate} (week-end/ferie)`);
    } else if (verbose) {
      console.log(`    [BRVM] ${json.status}${json.error ? ': ' + json.error : ''}`);
    }
  } catch (err) {
    if (verbose) console.log(`    [BRVM] ERROR ${err.message}`);
  }
  return null;
}

/**
 * MASI — via l'API content de medias24 (meme backend que l'app mobile de la
 * Bourse de Casablanca). Le site officiel casablanca-bourse.com est derriere un
 * WAF Imperva (503 cote serveur) et n'est pas exploitable.
 *
 * getMasiHistory renvoie { result: { labels:[ts UTC minuit], prices:[cloture] } }.
 * On selectionne la fenetre via `periode` puis on filtre par date.
 */
async function scrapeMASI(targetDate, verbose) {
  const periode = periodeForDate(targetDate);
  const url = `https://medias24.com/content/api?method=getMasiHistory&periode=${periode}&format=json`;
  try {
    const json = await httpGetJson(url, { 'User-Agent': USER_AGENT });
    const labels = json?.result?.labels || [];
    const prices = json?.result?.prices || [];
    for (let i = 0; i < labels.length; i++) {
      if (epochMsToISO(labels[i] * 1000) === targetDate) {
        const val = Number(prices[i]);
        if (isFinite(val) && val > 1000) {
          console.log(`    [MASI] SUCCESS via medias24 getMasiHistory (${periode}): ${val}`);
          return { value: val, source: 'medias24 getMasiHistory', url };
        }
      }
    }
    if (verbose) console.log(`    [MASI] pas de valeur pour ${targetDate} (jour non ouvre ?)`);
  } catch (err) {
    if (verbose) console.log(`    [MASI] ERROR ${err.message}`);
  }
  return null;
}

/**
 * Tunindex — via l'API REST officielle de la BVMT (le site est un SPA AngularJS
 * qui charge les valeurs via cette API cachee, d'ou l'echec du scraping HTML).
 *
 * /rest_api/rest/history/{ISIN} renvoie ~60 seances : [{ sEANCE, lAST }].
 * ISIN Tunindex = TN0009050014 (ticker PX1).
 */
async function scrapeTunindex(targetDate, verbose) {
  const TUNINDEX_ISIN = 'TN0009050014';
  const url = `https://www.bvmt.com.tn/rest_api/rest/history/${TUNINDEX_ISIN}`;
  try {
    const json = await httpGetJson(url, { 'User-Agent': USER_AGENT });
    const hist = json?.indexHistorys || json?.data?.indexHistorys || [];
    for (const row of hist) {
      const iso = frLongDateToISO(row.sEANCE || row.seance || row.SEANCE || '');
      if (iso === targetDate) {
        const val = Number(row.lAST != null ? row.lAST : row.last);
        if (isFinite(val) && val > 1000) {
          console.log(`    [Tunindex] SUCCESS via BVMT REST history: ${val}`);
          return { value: val, source: 'BVMT REST /history', url };
        }
      }
    }
    if (verbose) console.log(`    [Tunindex] pas de valeur pour ${targetDate} (hors fenetre ~60 seances ?)`);
  } catch (err) {
    if (verbose) console.log(`    [Tunindex] ERROR ${err.message}`);
  }
  return null;
}

/**
 * NSE All Share Index (NGX ASI) — via l'endpoint JSON officiel doclib de NGX
 * (le meme que la page indices de ngxgroup.com appelle). Un seul appel renvoie
 * tout l'historique quotidien : { currentPrice, currentDateTime, IndiciesData:[[ts_ms, val]] }.
 * Les anciens hosts (ngxgroup.com/exchange/trade/market-data = 404, nse.com.ng = mort)
 * sont remplaces par celui-ci.
 */
async function scrapeNSE(targetDate, verbose) {
  const url = 'https://doclib.ngxgroup.com/REST/api/chartdata/ASI';
  try {
    const json = await httpGetJson(url, { 'User-Agent': USER_AGENT });
    // Chemin rapide : valeur courante
    if (json?.currentDateTime && String(json.currentDateTime).slice(0, 10) === targetDate) {
      const val = Number(json.currentPrice);
      if (isFinite(val) && val > 1000) {
        console.log(`    [NSE] SUCCESS via NGX chartdata/ASI (current): ${val}`);
        return { value: val, source: 'NGX doclib chartdata/ASI', url };
      }
    }
    const data = json?.IndiciesData || [];
    for (const pair of data) {
      if (Array.isArray(pair) && pair.length >= 2 && epochMsToISO(pair[0]) === targetDate) {
        const val = Number(pair[1]);
        if (isFinite(val) && val > 1000) {
          console.log(`    [NSE] SUCCESS via NGX chartdata/ASI: ${val}`);
          return { value: val, source: 'NGX doclib chartdata/ASI', url };
        }
      }
    }
    if (verbose) console.log(`    [NSE] pas de valeur pour ${targetDate} (jour non ouvre ?)`);
  } catch (err) {
    if (verbose) console.log(`    [NSE] ERROR ${err.message}`);
  }
  return null;
}

/**
 * MONIA (Moroccan Overnight Index Average) — taux monetaire publie par Bank
 * Al-Maghrib. bkam.ma bloque le fingerprint TLS de Node (403) mais repond a
 * curl (200) : on passe donc par curl. La donnee est un CSV (export blockcsv)
 * contenant tout l'historique. Colonnes : "MONIA index";"Overnight volume";
 * "Reference date";"Date of publication". On stocke la DATE DE REFERENCE.
 * MONIA est un taux (%), non propage aux fonds (pays: [] dans INDEX_CONFIG).
 */
async function scrapeMONIA(targetDate, verbose) {
  const pages = [
    'https://www.bkam.ma/en/Markets/Key-indicators/Money-market/Monia-index-moroccan-overnight-index-average',
    'https://www.bkam.ma/Marche-monetaire/Taux-du-marche-interbancaire-MONIA',
  ];
  const csvFallback = 'https://www.bkam.ma/en/export/blockcsv/566622/30551c1667f5f2004fb0019220d41795/06f7b466ca91da0596a810776852ee51?block=06f7b466ca91da0596a810776852ee51';
  try {
    let csvUrl = csvFallback;
    for (const page of pages) {
      try {
        const html = await curlGetText(page, ['-H', `Referer: ${page}`]);
        const m = html.match(/\/(?:en\/)?export\/blockcsv\/[^"'?\s]+\?block=[a-f0-9]+/i);
        if (m) { csvUrl = new URL(m[0], 'https://www.bkam.ma').href; break; }
      } catch (_) { /* try next page or use fallback */ }
    }

    const csv = await curlGetText(csvUrl, ['-H', `Referer: ${pages[0]}`]);
    if (!csv.includes('MONIA') && !csv.includes('Reference date') && !csv.includes('Date de r')) {
      throw new Error(`BKAM CSV non valide (${csv.length} octets, probable bloc WAF)`);
    }
    const lines = csv.split(/\r?\n/).filter(l => /%/.test(l) && /\d{2}\/\d{2}\/\d{4}/.test(l));
    if (verbose) console.log(`    [MONIA] ${lines.length} lignes de donnees dans le CSV`);
    for (const line of lines) {
      const cells = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
      const rate = cells[0];
      const ref = cells[2]; // Reference date = date de marche
      if (!ref) continue;
      const dm = ref.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (!dm) continue;
      const iso = `${dm[3]}-${dm[2]}-${dm[1]}`;
      if (iso === targetDate) {
        const val = parseFloat(String(rate).replace('%', '').replace(',', '.').trim());
        if (isFinite(val) && val >= 0 && val < 100) {
          console.log(`    [MONIA] SUCCESS via BKAM blockcsv (curl): ${val}`);
          return { value: val, source: 'BKAM blockcsv MONIA', url: csvUrl };
        }
      }
    }
    if (verbose) console.log(`    [MONIA] pas de valeur pour ${targetDate} (jour non ouvre ?)`);
  } catch (err) {
    if (verbose) console.log(`    [MONIA] ERROR ${err.message}`);
  }
  return null;
}

/**
 * Try multiple sources for a given index, return the first successful value.
 */
async function tryMultipleSources(indexName, sources, verbose) {
  for (const source of sources) {
    try {
      if (verbose) console.log(`    [${indexName}] Trying: ${source.name} (${source.url})`);
      const resp = await httpGetWithRetry(source.url);
      if (resp.status !== 200) {
        if (verbose) console.log(`    [${indexName}] ${source.name}: HTTP ${resp.status}`);
        continue;
      }
      const value = source.parse(resp.body);
      if (value !== null) {
        console.log(`    [${indexName}] SUCCESS via ${source.name}: ${value}`);
        return { value, source: source.name, url: source.url };
      }
      if (verbose) console.log(`    [${indexName}] ${source.name}: value not found in page`);
    } catch (err) {
      if (verbose) console.log(`    [${indexName}] ${source.name}: ERROR ${err.message}`);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Database Operations
// ---------------------------------------------------------------------------

/**
 * Check if a value for a given index and date already exists in indice_references.
 */
async function checkExisting(conn, id_indice, date) {
  const [rows] = await conn.execute(
    'SELECT id, valeur FROM indice_references WHERE id_indice = ? AND date = ? LIMIT 1',
    [id_indice, date]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Insert a new index value into indice_references.
 */
async function insertIndexValue(conn, cfg, value, date) {
  await conn.execute(
    `INSERT INTO indice_references (type_indice_id, id_indice, nom_indice, valeur, date)
     VALUES (?, ?, ?, ?, ?)`,
    [cfg.type_indice_id, cfg.id_indice, cfg.nom_indice, value, date]
  );
}

/**
 * Propagate indRef values to the valorisations table for a specific date.
 * This replicates the "Step 2" logic from import_indices_excel.js,
 * but scoped to the single target date for efficiency.
 *
 * For each fund linked to a country served by the given index:
 *   - Find the fund's VL on targetDate (or within 7 days)
 *   - Set valorisations.indRef = index value
 *   - Also set indice_name and ID_indice
 */
async function propagateIndRef(conn, indexConfigs, targetDate, opts) {
  console.log('\n  --- Propagation indRef dans valorisations ---');

  // Build a map: date -> { id_indice: value }
  // Load all index values for +/- 7 days around target for matching
  const dateObj = new Date(targetDate);
  const startDate = new Date(dateObj);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(dateObj);
  endDate.setDate(endDate.getDate() + 1);
  const startISO = startDate.toISOString().slice(0, 10);
  const endISO = endDate.toISOString().slice(0, 10);

  const [refRows] = await conn.execute(
    `SELECT id_indice, date, valeur FROM indice_references
     WHERE date >= ? AND date <= ? AND valeur IS NOT NULL AND valeur > 0`,
    [startISO, endISO]
  );

  const indexDataByIndice = {};
  for (const r of refRows) {
    const d = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);
    if (!indexDataByIndice[r.id_indice]) indexDataByIndice[r.id_indice] = new Map();
    indexDataByIndice[r.id_indice].set(d, parseFloat(r.valeur));
  }

  // Only process configs with pays mappings (skip MONIA which has no fund mapping)
  const activeConfigs = indexConfigs.filter(cfg => cfg.pays.length > 0);

  // Get all funds
  const [funds] = await conn.execute(
    `SELECT fi.id, fi.nom_fond, fi.pays, fi.dev_libelle
     FROM fond_investissements fi
     WHERE fi.pays IS NOT NULL
     ORDER BY fi.pays, fi.id`
  );

  let totalUpdated = 0;
  let totalAlreadySet = 0;
  let totalNoMatch = 0;
  let fundsProcessed = 0;

  for (const fund of funds) {
    const matchingCfg = activeConfigs.find(cfg =>
      cfg.pays.some(p => p.toLowerCase() === (fund.pays || '').toLowerCase())
    );
    if (!matchingCfg) continue;

    const indexData = indexDataByIndice[matchingCfg.id_indice];
    if (!indexData || indexData.size === 0) continue;

    // Get VLs only around the target date
    const [vls] = await conn.execute(
      `SELECT id, date, indRef, indice_name, ID_indice FROM valorisations
       WHERE fund_id = ? AND date >= ? AND date <= ?
       ORDER BY date ASC`,
      [fund.id, startISO, endISO]
    );

    if (vls.length === 0) continue;

    for (const vl of vls) {
      const vlDate = vl.date instanceof Date
        ? vl.date.toISOString().slice(0, 10)
        : String(vl.date).slice(0, 10);

      // Exact date match first
      let indexVal = indexData.get(vlDate);

      // Nearest date within 7 days
      if (indexVal === undefined) {
        const vlDateObj = new Date(vlDate);
        let bestDate = null;
        let bestDiff = Infinity;
        for (const [d] of indexData) {
          const diff = Math.abs(new Date(d) - vlDateObj);
          if (diff < bestDiff && diff <= 7 * 86400000) {
            bestDiff = diff;
            bestDate = d;
          }
        }
        if (bestDate) indexVal = indexData.get(bestDate);
      }

      if (indexVal === undefined) {
        totalNoMatch++;
        continue;
      }

      // Already set with same value?
      if (vl.indRef !== null && Math.abs(vl.indRef - indexVal) < 0.01) {
        totalAlreadySet++;
        continue;
      }

      if (opts.mode === 'execute') {
        await conn.execute(
          'UPDATE valorisations SET indRef = ?, indice_name = ?, ID_indice = ? WHERE id = ?',
          [indexVal, matchingCfg.nom_indice, matchingCfg.id_indice, vl.id]
        );
      }
      totalUpdated++;
    }

    fundsProcessed++;
  }

  console.log(`  Fonds traites: ${fundsProcessed}`);
  console.log(`  VL indRef mises a jour: ${totalUpdated}`);
  console.log(`  VL indRef deja a jour: ${totalAlreadySet}`);
  console.log(`  VL sans date indice correspondante: ${totalNoMatch}`);

  return { totalUpdated, totalAlreadySet, totalNoMatch, fundsProcessed };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function runForDate(targetDate, opts) {
  console.log('============================================================');
  console.log('SCRAPE INDICES QUOTIDIENS — Africafunds');
  console.log(`Mode: ${opts.mode.toUpperCase()}`);
  console.log(`Date cible: ${targetDate}`);
  console.log(`Date execution: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  // Check if target date is a weekend (informational only — some indices update on weekends)
  const dayOfWeek = new Date(targetDate).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log('  ATTENTION: la date cible est un weekend — les marches sont generalement fermes.\n');
  }

  // Phase 1: Scrape all indices
  console.log('--- PHASE 1: Scraping des indices ---\n');
  const results = {};
  let fetchedCount = 0;
  let errorCount = 0;

  for (const cfg of INDEX_CONFIG) {
    console.log(`  [${cfg.id_indice}] ${cfg.nom_indice}...`);
    try {
      const result = await cfg.scrape(targetDate, opts.verbose);
      if (result) {
        results[cfg.id_indice] = {
          value: result.value,
          source: result.source,
          url: result.url,
          config: cfg,
        };
        fetchedCount++;
      } else {
        console.log(`    [${cfg.id_indice}] ECHEC: aucune source n'a retourne de valeur`);
        errorCount++;
      }
    } catch (err) {
      console.log(`    [${cfg.id_indice}] ERREUR: ${err.message}`);
      errorCount++;
    }
    console.log('');
  }

  console.log(`\n  Resume scraping: ${fetchedCount} indices recuperes, ${errorCount} echecs\n`);

  if (fetchedCount === 0) {
    console.log('  Aucun indice recupere pour cette date.');
    return { fetchedCount: 0, insertedCount: 0, skippedCount: 0, errorCount };
  }

  // Phase 2: Insert into database
  console.log('--- PHASE 2: Insertion dans indice_references ---\n');

  let conn = null;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('  Connexion MySQL OK\n');
  } catch (err) {
    console.error(`  ERREUR connexion MySQL: ${err.message}`);
    if (opts.mode === 'execute') {
      // Erreur fatale : on abandonne tout le run (y compris le reste de la fenetre backfill).
      throw new Error(`Connexion MySQL impossible: ${err.message}`);
    } else {
      console.log('  (dry-run: affichage des resultats sans base)\n');
      for (const [id, r] of Object.entries(results)) {
        console.log(`  ${id}: ${r.value} (source: ${r.source})`);
      }
      console.log('\n  MODE DRY-RUN: aucune modification effectuee.');
      return { fetchedCount, insertedCount: 0, skippedCount: 0, errorCount };
    }
  }

  let insertedCount = 0;
  let skippedCount = 0;

  try {
    for (const [id, r] of Object.entries(results)) {
      const existing = await checkExisting(conn, id, targetDate);
      if (existing) {
        if (Math.abs(existing.valeur - r.value) < 0.01) {
          console.log(`  [${id}] SKIP: valeur identique deja en base (${existing.valeur})`);
        } else {
          console.log(`  [${id}] SKIP: valeur differente deja en base (DB: ${existing.valeur}, scrape: ${r.value}) — pas d'overwrite`);
        }
        skippedCount++;
        continue;
      }

      if (opts.mode === 'execute') {
        await insertIndexValue(conn, r.config, r.value, targetDate);
        console.log(`  [${id}] INSERE: ${r.value} pour ${targetDate}`);
      } else {
        console.log(`  [${id}] DRY-RUN: insererait ${r.value} pour ${targetDate}`);
      }
      insertedCount++;
    }

    console.log(`\n  Resume insertion: ${insertedCount} inseres, ${skippedCount} ignores (deja existants)\n`);

    // Phase 3: Propagate indRef to valorisations
    if (!opts.skipIndref && insertedCount > 0) {
      console.log('--- PHASE 3: Propagation indRef dans valorisations ---\n');
      const indRefResult = await propagateIndRef(conn, INDEX_CONFIG, targetDate, opts);

      if (opts.mode !== 'execute') {
        console.log('\n  MODE DRY-RUN: aucune modification effectuee sur valorisations');
      }
    } else if (opts.skipIndref) {
      console.log('--- PHASE 3: Propagation indRef IGNOREE (--skip-indref) ---\n');
    } else if (insertedCount === 0) {
      console.log('--- PHASE 3: Propagation indRef non necessaire (aucun nouvel indice insere) ---\n');
    }

  } finally {
    if (conn) await conn.end();
  }

  // Resume de la date
  console.log('\n============================================================');
  console.log(`RESUME ${targetDate}`);
  console.log('============================================================');
  console.log(`  Indices scrapes avec succes: ${fetchedCount}/${INDEX_CONFIG.length}`);
  console.log(`  Indices inseres en base: ${insertedCount}`);
  console.log(`  Indices ignores (deja en base): ${skippedCount}`);
  console.log(`  Echecs de scraping: ${errorCount}`);

  for (const [id, r] of Object.entries(results)) {
    console.log(`  ${r.config.nom_indice}: ${r.value} (via ${r.source})`);
  }

  if (opts.mode !== 'execute') {
    console.log('\n  >>> MODE DRY-RUN: aucune modification effectuee <<<');
  } else {
    console.log('\n  >>> MODIFICATIONS APPLIQUEES <<<');
  }
  console.log('============================================================');

  return { fetchedCount, insertedCount, skippedCount, errorCount };
}

async function main() {
  const opts = parseArgs();
  const dates = datesToProcess(opts);
  if (dates.length > 1) {
    console.log(`### FENETRE BACKFILL: ${dates.length} dates (${dates[0]} -> ${dates[dates.length - 1]}) — INSERT idempotent ###\n`);
  }

  const totals = { fetchedCount: 0, insertedCount: 0, skippedCount: 0, errorCount: 0 };
  for (const d of dates) {
    const r = await runForDate(d, opts);
    totals.fetchedCount += r.fetchedCount;
    totals.insertedCount += r.insertedCount;
    totals.skippedCount += r.skippedCount;
    totals.errorCount += r.errorCount;
    if (dates.length > 1) console.log('');
  }

  if (dates.length > 1) {
    console.log('============================================================');
    console.log(`RESUME GLOBAL BACKFILL (${dates.length} dates)`);
    console.log(`  Inseres: ${totals.insertedCount} | Ignores: ${totals.skippedCount} | Echecs scraping: ${totals.errorCount}`);
    console.log('============================================================');
  }

  // Code de sortie : succes si au moins un indice a ete recupere sur la fenetre.
  process.exit(totals.fetchedCount === 0 && totals.errorCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('ERREUR FATALE:', err.message || err);
  process.exit(1);
});
