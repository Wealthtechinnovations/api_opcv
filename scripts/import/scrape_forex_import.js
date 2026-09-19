/**
 * Scrape & Import paires de devises depuis Yahoo Finance + FRED
 *
 * Sources:
 *   - FRED (St. Louis Fed) pour EUR/USD: https://fred.stlouisfed.org
 *   - Yahoo Finance pour toutes les autres paires
 *
 * Paires couvertes (20 paires):
 *   EUR/MAD, USD/MAD, EUR/TND, USD/TND, EUR/NGN, USD/NGN,
 *   EUR/XOF, USD/XOF, EUR/XAF, USD/XAF, EUR/USD,
 *   EUR/GHS, USD/GHS, EUR/KES, USD/KES, EUR/ZAR, USD/ZAR,
 *   EUR/EGP, USD/EGP, EUR/NAD, USD/NAD
 *
 * Usage:
 *   node scrape_forex_import.js              # historique complet depuis 2000
 *   node scrape_forex_import.js 2024-01-01   # depuis une date
 *   node scrape_forex_import.js today        # derniers 5 jours seulement
 *
 * Comportement NON-DESTRUCTIF:
 *   - INSERT IGNORE (ne duplique jamais)
 *   - Ne modifie pas les entrees existantes
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

// XOF et XAF: parite fixe avec EUR (zone CFA)
const EUR_XAF = 655.957;
const EUR_XOF = 655.957;

// Paires a telecharger depuis Yahoo Finance
// Format: { ticker: 'EURMAD=X', paire: 'EUR/MAD' }
const YAHOO_PAIRS = [
  { ticker: 'EURUSD=X', paire: 'EUR/USD' },
  { ticker: 'EURMAD=X', paire: 'EUR/MAD' },
  { ticker: 'USDMAD=X', paire: 'USD/MAD' },
  { ticker: 'EURTND=X', paire: 'EUR/TND' },
  { ticker: 'USDTND=X', paire: 'USD/TND' },
  { ticker: 'EURNGN=X', paire: 'EUR/NGN' },
  { ticker: 'USDNGN=X', paire: 'USD/NGN' },
  { ticker: 'EURGHS=X', paire: 'EUR/GHS' },
  { ticker: 'USDGHS=X', paire: 'USD/GHS' },
  { ticker: 'EURKES=X', paire: 'EUR/KES' },
  { ticker: 'USDKES=X', paire: 'USD/KES' },
  { ticker: 'EURZAR=X', paire: 'EUR/ZAR' },
  { ticker: 'USDZAR=X', paire: 'USD/ZAR' },
  { ticker: 'EUREGP=X', paire: 'EUR/EGP' },
  { ticker: 'USDEGP=X', paire: 'USD/EGP' },
  { ticker: 'EURNAD=X', paire: 'EUR/NAD' },
  { ticker: 'USDNAD=X', paire: 'USD/NAD' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        httpGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchFredEurUsd(startTimestamp) {
  console.log('  Telechargement EUR/USD depuis FRED (St. Louis Fed)...');
  try {
    const url = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXUSEU';
    const resp = await httpGet(url);
    if (resp.status !== 200) {
      console.log(`    FRED: HTTP ${resp.status}`);
      return [];
    }

    const lines = resp.body.split('\n').filter(l => l.trim());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 2) continue;
      const dateStr = parts[0].trim();
      const valStr = parts[1].trim();
      if (valStr === '.' || valStr === '' || isNaN(parseFloat(valStr))) continue;

      const val = parseFloat(valStr);
      if (val <= 0) continue;
      if (dateStr < '2000-01-01') continue;

      const ts = new Date(dateStr).getTime() / 1000;
      if (ts < startTimestamp) continue;

      results.push({ date: dateStr, value: val });
    }

    console.log(`    FRED EUR/USD: ${results.length} entrees`);
    return results;
  } catch (e) {
    console.log(`    FRED erreur: ${e.message}`);
    return [];
  }
}

async function fetchYahooFinance(ticker, paire, startTimestamp) {
  const endTimestamp = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;

  try {
    const resp = await httpGet(url);
    if (resp.status !== 200) {
      // Try v7 API as fallback
      const url2 = `https://query2.finance.yahoo.com/v7/finance/chart/${encodeURIComponent(ticker)}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;
      const resp2 = await httpGet(url2);
      if (resp2.status !== 200) {
        console.log(`    ${paire}: HTTP ${resp.status}/${resp2.status}`);
        return [];
      }
      resp.body = resp2.body;
    }

    const json = JSON.parse(resp.body);
    const result = json?.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
      console.log(`    ${paire}: pas de donnees dans la reponse`);
      return [];
    }

    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    const results = [];

    for (let i = 0; i < timestamps.length; i++) {
      const val = closes[i];
      if (val === null || val === undefined || isNaN(val) || val <= 0) continue;

      const d = new Date(timestamps[i] * 1000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      results.push({ date: `${yyyy}-${mm}-${dd}`, value: val });
    }

    console.log(`    ${paire}: ${results.length} entrees`);
    return results;
  } catch (e) {
    console.log(`    ${paire}: erreur ${e.message}`);
    return [];
  }
}

async function fetchEcbRates(currency, startTimestamp) {
  const startDate = new Date(startTimestamp * 1000).toISOString().split('T')[0];
  const paire = `EUR/${currency}`;
  const url = `https://data-api.ecb.europa.eu/service/data/EXR/D.${currency}.EUR.SP00.A?startPeriod=${startDate}&format=csvdata`;

  try {
    console.log(`    ECB fallback ${paire}...`);
    const resp = await httpGet(url);
    if (resp.status !== 200) {
      console.log(`    ECB ${paire}: HTTP ${resp.status}`);
      return [];
    }

    const lines = resp.body.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const header = lines[0].split(',');
    const dateIdx = header.findIndex(h => h.includes('TIME_PERIOD') || h.includes('PERIOD'));
    const valIdx = header.findIndex(h => h.includes('OBS_VALUE') || h.includes('VALUE'));
    if (dateIdx < 0 || valIdx < 0) {
      console.log(`    ECB ${paire}: header format unknown`);
      return [];
    }

    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length <= Math.max(dateIdx, valIdx)) continue;
      const dateStr = parts[dateIdx].replace(/"/g, '').trim();
      const valStr = parts[valIdx].replace(/"/g, '').trim();
      if (!dateStr || !valStr || valStr === 'NaN') continue;
      const val = parseFloat(valStr);
      if (val <= 0 || isNaN(val)) continue;
      if (dateStr < '2000-01-01') continue;
      results.push({ date: dateStr, value: val });
    }

    console.log(`    ECB ${paire}: ${results.length} entrees`);
    return results;
  } catch (e) {
    console.log(`    ECB ${paire}: erreur ${e.message}`);
    return [];
  }
}

const ECB_CURRENCIES = ['TND', 'NGN', 'MAD', 'GHS', 'KES', 'ZAR', 'EGP', 'NAD'];

function generateCfaPairs(eurUsdData, startTimestamp) {
  const results = { 'EUR/XOF': [], 'USD/XOF': [], 'EUR/XAF': [], 'USD/XAF': [] };

  // EUR/XOF et EUR/XAF sont fixes
  // USD/XOF et USD/XAF dependent du taux EUR/USD du jour
  const eurUsdByDate = {};
  for (const d of eurUsdData) {
    eurUsdByDate[d.date] = d.value;
  }

  // Generer pour chaque jour ouvre depuis 2000
  const start = new Date(Math.max(startTimestamp * 1000, new Date('2000-01-01').getTime()));
  const end = new Date();
  const cur = new Date(start);

  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow >= 1 && dow <= 5) {
      const yyyy = cur.getUTCFullYear();
      const mm = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(cur.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      results['EUR/XOF'].push({ date: dateStr, value: EUR_XOF });
      results['EUR/XAF'].push({ date: dateStr, value: EUR_XAF });

      // Pour USD/XOF et USD/XAF, on calcule a partir de EUR/USD
      const eurUsd = eurUsdByDate[dateStr];
      if (eurUsd && eurUsd > 0) {
        results['USD/XOF'].push({ date: dateStr, value: EUR_XOF / eurUsd });
        results['USD/XAF'].push({ date: dateStr, value: EUR_XAF / eurUsd });
      }
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return results;
}

async function run() {
  let startDate = '2000-01-01';
  const arg = process.argv[2];
  if (arg === 'today') {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    startDate = d.toISOString().split('T')[0];
  } else if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) {
    startDate = arg;
  }

  const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
  console.log(`Scrape Forex - depuis ${startDate}\n`);

  // 1. Telecharger EUR/USD depuis FRED (source primaire)
  const eurUsdData = await fetchFredEurUsd(startTimestamp);

  // 2. Telecharger les paires depuis Yahoo Finance (EUR/USD inclus comme fallback)
  const allPairData = {};
  if (eurUsdData.length > 0) {
    allPairData['EUR/USD'] = eurUsdData;
  }

  for (const { ticker, paire } of YAHOO_PAIRS) {
    console.log(`  Telechargement ${paire} (${ticker})...`);
    const data = await fetchYahooFinance(ticker, paire, startTimestamp);
    if (data.length > 0) {
      if (paire === 'EUR/USD' && allPairData['EUR/USD']) {
        // Fusionner FRED + Yahoo: Yahoo complete les dates manquantes de FRED
        const fredDates = new Set(allPairData['EUR/USD'].map(d => d.date));
        const newEntries = data.filter(d => !fredDates.has(d.date));
        allPairData['EUR/USD'] = [...allPairData['EUR/USD'], ...newEntries].sort((a, b) => a.date.localeCompare(b.date));
        console.log(`    EUR/USD: fusionne FRED(${fredDates.size}) + Yahoo(${newEntries.length} nouvelles)`);
      } else {
        allPairData[paire] = data;
      }
    }
    await sleep(500);
  }

  // 2b. ECB fallback for EUR/* pairs where Yahoo returned insufficient data
  console.log('\n  ECB fallback pour paires EUR/* insuffisantes...');
  for (const currency of ECB_CURRENCIES) {
    const eurPaire = `EUR/${currency}`;
    const existing = allPairData[eurPaire] || [];
    if (existing.length < 100) {
      console.log(`  ${eurPaire}: seulement ${existing.length} Yahoo — essai ECB...`);
      const ecbData = await fetchEcbRates(currency, startTimestamp);
      if (ecbData.length > existing.length) {
        const existDates = new Set(existing.map(d => d.date));
        const newEntries = ecbData.filter(d => !existDates.has(d.date));
        allPairData[eurPaire] = [...existing, ...newEntries].sort((a, b) => a.date.localeCompare(b.date));
        console.log(`    ${eurPaire}: fusionne Yahoo(${existing.length}) + ECB(${newEntries.length} nouvelles) = ${allPairData[eurPaire].length}`);
      }
      await sleep(300);
    }
  }

  // 2c. Derive USD/* from EUR/* and EUR/USD for pairs with insufficient USD data
  const eurUsdForCross = allPairData['EUR/USD'] || [];
  const eurUsdByDate = {};
  for (const d of eurUsdForCross) eurUsdByDate[d.date] = d.value;

  console.log('\n  Cross-rate derivation USD/* depuis EUR/* et EUR/USD...');
  for (const currency of ECB_CURRENCIES) {
    const usdPaire = `USD/${currency}`;
    const eurPaire = `EUR/${currency}`;
    const usdExisting = allPairData[usdPaire] || [];
    const eurData = allPairData[eurPaire] || [];
    if (usdExisting.length < 100 && eurData.length > 100) {
      const usdDates = new Set(usdExisting.map(d => d.date));
      const derived = [];
      for (const d of eurData) {
        if (usdDates.has(d.date)) continue;
        const eurUsd = eurUsdByDate[d.date];
        if (eurUsd && eurUsd > 0) {
          derived.push({ date: d.date, value: d.value / eurUsd });
        }
      }
      if (derived.length > 0) {
        allPairData[usdPaire] = [...usdExisting, ...derived].sort((a, b) => a.date.localeCompare(b.date));
        console.log(`    ${usdPaire}: derive ${derived.length} entrees depuis ${eurPaire}/EUR-USD = ${allPairData[usdPaire].length} total`);
      }
    }
  }

  // 3. Generer les paires CFA (fixes pour EUR, calculees pour USD)
  const eurUsdAll = allPairData['EUR/USD'] || [];
  console.log(`\n  Generation paires CFA (parite fixe 655.957, EUR/USD: ${eurUsdAll.length} dates)...`);
  const cfaPairs = generateCfaPairs(eurUsdAll, startTimestamp);
  for (const [paire, data] of Object.entries(cfaPairs)) {
    if (data.length > 0 && !allPairData[paire]) {
      allPairData[paire] = data;
      console.log(`    ${paire}: ${data.length} entrees generees`);
    }
  }

  console.log(`\nTotal: ${Object.keys(allPairData).length} paires collectees\n`);

  // 4. Insertion en base
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');

  // Charger existants
  const [existingRows] = await conn.execute(
    `SELECT paire, date FROM devisedechanges WHERE value > 0`
  );
  const existingSet = new Set();
  for (const r of existingRows) {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
    existingSet.add(`${r.paire}|${d}`);
  }
  console.log(`${existingSet.size} entrees existantes\n`);

  const report = { totalInserted: 0, totalSkipped: 0, byPair: {} };

  for (const [paire, data] of Object.entries(allPairData)) {
    const batch = [];
    let skipped = 0;

    for (const d of data) {
      const key = `${paire}|${d.date}`;
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }
      batch.push([paire, d.date, d.value]);
      existingSet.add(key);
    }

    if (batch.length > 0) {
      const BATCH_SIZE = 500;
      let inserted = 0;
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const placeholders = chunk.map(() => '(?, ?, ?)').join(', ');
        try {
          const [result] = await conn.execute(
            `INSERT IGNORE INTO devisedechanges (paire, date, value) VALUES ${placeholders}`,
            chunk.flat()
          );
          inserted += result.affectedRows;
        } catch (e) {
          console.log(`  ERREUR ${paire}: ${e.message}`);
        }
      }
      report.byPair[paire] = { inserted, skipped };
      report.totalInserted += inserted;
    } else {
      report.byPair[paire] = { inserted: 0, skipped };
    }
    report.totalSkipped += skipped;

    const stats = report.byPair[paire];
    console.log(`  ${paire.padEnd(10)}: ${stats.inserted} inseres, ${stats.skipped} existants`);
  }

  // 4b. Fix value=0 entries: update existing zero-value rows with proper data
  console.log('\nCorrection des entrees value=0...');
  let totalFixed = 0;
  for (const [paire, data] of Object.entries(allPairData)) {
    const BATCH = 100;
    let fixed = 0;
    for (let i = 0; i < data.length; i += BATCH) {
      const chunk = data.slice(i, i + BATCH);
      for (const d of chunk) {
        try {
          const [result] = await conn.execute(
            `UPDATE devisedechanges SET value = ? WHERE paire = ? AND date = ? AND (value = 0 OR value IS NULL)`,
            [d.value, paire, d.date]
          );
          fixed += result.affectedRows;
        } catch (e) { /* ignore */ }
      }
    }
    if (fixed > 0) {
      console.log(`  ${paire.padEnd(10)}: ${fixed} entrees corrigees (0 -> valeur)`);
      totalFixed += fixed;
    }
  }
  if (totalFixed > 0) {
    console.log(`  Total corrige: ${totalFixed} entrees\n`);
  } else {
    console.log(`  Aucune correction necessaire\n`);
  }
  report.totalFixed = totalFixed;

  // Rapport
  console.log('\n==========================================');
  console.log('=== RAPPORT IMPORT FOREX ===');
  console.log('==========================================');
  console.log(`Total inseres:      ${report.totalInserted}`);
  console.log(`Total existants:    ${report.totalSkipped}`);
  console.log(`Total corriges:     ${report.totalFixed || 0}`);

  // Verification
  const [verif] = await conn.execute(`
    SELECT paire, COUNT(*) as cnt, MIN(date) as min_d, MAX(date) as max_d
    FROM devisedechanges WHERE value > 0
    GROUP BY paire ORDER BY paire
  `);
  console.log('\nEtat devisedechanges:');
  for (const r of verif) {
    console.log(`  ${r.paire.padEnd(10)}: ${String(r.cnt).padStart(6)} entrees (${r.min_d} -> ${r.max_d})`);
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
