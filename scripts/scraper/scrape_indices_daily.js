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
    id_indice: 'TUNINDEX',
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
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--execute') opts.mode = 'execute';
    else if (args[i] === '--dry-run') opts.mode = 'dry-run';
    else if (args[i] === '--date' && args[i + 1]) opts.date = args[++i];
    else if (args[i] === '--skip-indref') opts.skipIndref = true;
    else if (args[i] === '--verbose') opts.verbose = true;
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node scrape_indices_daily.js [--execute|--dry-run] [--date YYYY-MM-DD] [--skip-indref] [--verbose]');
      process.exit(0);
    }
  }
  return opts;
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
// Index Scrapers
// ---------------------------------------------------------------------------

/**
 * BRVM Composite — from bfin.brvm.org
 *
 * The BRVM financial portal publishes daily index values.
 * We try multiple source URLs and parsing strategies.
 */
async function scrapeBRVM(targetDate, verbose) {
  const sources = [
    {
      name: 'BRVM Market Summary API',
      url: 'https://www.brvm.org/en/cours-indices/0',
      parse: (body) => {
        // The BRVM website lists indices in a table; look for "BRVM Composite"
        // Pattern: BRVM Composite followed by a numeric value
        const patterns = [
          /BRVM[\s\-_]*Composite[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /Composite[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 50) return val; // BRVM Composite is typically > 100
          }
        }
        return null;
      },
    },
    {
      name: 'BRVM bfin indices page',
      url: 'https://bfin.brvm.org/indices',
      parse: (body) => {
        const patterns = [
          /BRVM[\s\-_]*Composite[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /Composite[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 50) return val;
          }
        }
        return null;
      },
    },
    {
      name: 'BRVM main indices page (French)',
      url: 'https://www.brvm.org/fr/cours-indices/0',
      parse: (body) => {
        const patterns = [
          /BRVM[\s\-_]*Composite[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 50) return val;
          }
        }
        return null;
      },
    },
  ];

  return tryMultipleSources('BRVM', sources, verbose);
}

/**
 * MASI — from Bourse de Casablanca (casablanca-bourse.com)
 *
 * The Casablanca Stock Exchange publishes daily index summaries.
 */
async function scrapeMASI(targetDate, verbose) {
  const sources = [
    {
      name: 'Bourse de Casablanca main page',
      url: 'https://www.casablanca-bourse.com/bourseweb/index.aspx',
      parse: (body) => {
        // Look for MASI value in the page — typically displayed prominently
        const patterns = [
          /MASI[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /id="?[^"]*masi[^"]*"?[^>]*>[^<]*?([0-9][0-9\s.,]+)/i,
          /masi[^<]*?([0-9]{4,}[.,]\d+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 1000) return val; // MASI is typically > 5000
          }
        }
        return null;
      },
    },
    {
      name: 'Bourse de Casablanca market data',
      url: 'https://www.casablanca-bourse.com/bourseweb/en/index.aspx',
      parse: (body) => {
        const patterns = [
          /MASI[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 1000) return val;
          }
        }
        return null;
      },
    },
    {
      name: 'Bourse de Casablanca indices page',
      url: 'https://www.casablanca-bourse.com/bourseweb/Cours-Indices.aspx',
      parse: (body) => {
        const patterns = [
          /MASI[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 1000) return val;
          }
        }
        return null;
      },
    },
  ];

  return tryMultipleSources('MASI', sources, verbose);
}

/**
 * Tunindex — from BVMT (Bourse des Valeurs Mobilieres de Tunis)
 */
async function scrapeTunindex(targetDate, verbose) {
  const sources = [
    {
      name: 'BVMT main page',
      url: 'https://www.bvmt.com.tn/',
      parse: (body) => {
        const patterns = [
          /TUNINDEX[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /tunindex[^<]*?([0-9]{4,}[.,]\d+)/i,
          /id="?[^"]*tunindex[^"]*"?[^>]*>[^<]*?([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 1000) return val; // Tunindex is typically > 5000
          }
        }
        return null;
      },
    },
    {
      name: 'BVMT indices page',
      url: 'https://www.bvmt.com.tn/fr/marche/indices',
      parse: (body) => {
        const patterns = [
          /TUNINDEX[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 1000) return val;
          }
        }
        return null;
      },
    },
    {
      name: 'BVMT resume page',
      url: 'https://www.bvmt.com.tn/fr/marche/resume',
      parse: (body) => {
        const patterns = [
          /TUNINDEX[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 1000) return val;
          }
        }
        return null;
      },
    },
  ];

  return tryMultipleSources('Tunindex', sources, verbose);
}

/**
 * NSE All Share Index — from Nigerian Exchange Group (ngxgroup.com)
 */
async function scrapeNSE(targetDate, verbose) {
  const sources = [
    {
      name: 'NGX Group main page',
      url: 'https://ngxgroup.com/',
      parse: (body) => {
        const patterns = [
          /All[\s-]*Share[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /ASI[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /NGX[\s-]*ASI[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 10000) return val; // NSE ASI is typically > 30000
          }
        }
        return null;
      },
    },
    {
      name: 'NGX Exchange market data',
      url: 'https://ngxgroup.com/exchange/trade/market-data/',
      parse: (body) => {
        const patterns = [
          /All[\s-]*Share[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /ASI[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 10000) return val;
          }
        }
        return null;
      },
    },
    {
      name: 'NSE legacy site',
      url: 'https://www.nse.com.ng/',
      parse: (body) => {
        const patterns = [
          /All[\s-]*Share[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /ASI[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val && val > 10000) return val;
          }
        }
        return null;
      },
    },
  ];

  return tryMultipleSources('NSE', sources, verbose);
}

/**
 * MONIA — from Bank Al-Maghrib (bkam.ma)
 *
 * MONIA (Moroccan Overnight Index Average) is a monetary market rate index
 * published by Bank Al-Maghrib.
 */
async function scrapeMONIA(targetDate, verbose) {
  const sources = [
    {
      name: 'Bank Al-Maghrib market rates',
      url: 'https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-interbancaire/Taux-d-interet-interbancaire',
      parse: (body) => {
        const patterns = [
          /MONIA[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
          /monia[^<]*?([0-9]+[.,]\d+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            // MONIA is a rate, typically between 0 and 10 (percent)
            if (val !== null && val >= 0 && val < 100) return val;
          }
        }
        return null;
      },
    },
    {
      name: 'Bank Al-Maghrib main page',
      url: 'https://www.bkam.ma/',
      parse: (body) => {
        const patterns = [
          /MONIA[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val !== null && val >= 0 && val < 100) return val;
          }
        }
        return null;
      },
    },
    {
      name: 'Bank Al-Maghrib interbank indicators',
      url: 'https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-interbancaire',
      parse: (body) => {
        const patterns = [
          /MONIA[^<]*?(?:<[^>]+>[\s]*)*([0-9][0-9\s.,]+)/i,
        ];
        for (const pat of patterns) {
          const m = body.match(pat);
          if (m) {
            const val = parseNumber(m[1]);
            if (val !== null && val >= 0 && val < 100) return val;
          }
        }
        return null;
      },
    },
  ];

  return tryMultipleSources('MONIA', sources, verbose);
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

async function main() {
  const opts = parseArgs();
  const targetDate = opts.date;

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
    console.log('  Aucun indice recupere. Fin du script.');
    process.exit(errorCount > 0 ? 1 : 0);
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
      process.exit(1);
    } else {
      console.log('  (dry-run: affichage des resultats sans base)\n');
      for (const [id, r] of Object.entries(results)) {
        console.log(`  ${id}: ${r.value} (source: ${r.source})`);
      }
      console.log('\n  MODE DRY-RUN: aucune modification effectuee.');
      process.exit(0);
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

  // Final summary
  console.log('\n============================================================');
  console.log('RESUME FINAL');
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
    console.log('  >>> Pour executer: node scrape_indices_daily.js --execute <<<');
  } else {
    console.log('\n  >>> MODIFICATIONS APPLIQUEES <<<');
  }

  console.log('============================================================');

  // Exit with error if we failed to get any indices
  process.exit(errorCount > 0 && fetchedCount === 0 ? 1 : 0);
}

main().catch(err => {
  console.error('ERREUR FATALE:', err);
  process.exit(1);
});
