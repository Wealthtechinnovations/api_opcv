/**
 * W2 P1 Ghana/Kenya source-pilot technical reachability — READ ONLY.
 *
 * Core Node HTTP(S) only: no application dependency required.
 * Public GETs only; no DB/file/canonical write.
 */
'use strict';

const http = require('http');
const https = require('https');

const SOURCES = [
  {
    market: 'GHANA',
    manager: 'CAL Asset Management',
    role: 'DAILY_PRICE_HISTORY_CANDIDATE',
    url: 'https://calassetmanagement.net/about-us/reports-2/performance-update',
    markers: ['PRICE', 'GHS', 'Performance']
  },
  {
    market: 'GHANA',
    manager: 'EDC / Ecobank',
    role: 'DATED_FUND_VALUES_CANDIDATE',
    url: 'https://www.ecobank.com/gh/corporate-investment-banking/wsa-management/collective-investment-schemes',
    markers: ['fund', 'GHS', 'GHC']
  },
  {
    market: 'KENYA',
    manager: 'NCBA',
    role: 'DIRECT_DAILY_PRICE_CANDIDATE',
    url: 'https://ncbagroup.com/investment-banking/equity-fund/',
    markers: ['Buy Price', 'Sell Price', 'daily price', 'KES']
  }
];

const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 20000;
const MAX_REDIRECTS = 5;

function countMatches(body, token) {
  const needle = String(token || '').toLowerCase();
  const hay = String(body || '').toLowerCase();
  let count = 0, at = 0;
  while (needle && (at = hay.indexOf(needle, at)) !== -1) {
    count += 1;
    at += needle.length;
  }
  return count;
}

function getText(url, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.get(u, {
      headers: {
        'User-Agent': 'AfricaFunds-W2-ReadOnly-Source-Probe/1.0',
        'Accept': 'text/html,application/xhtml+xml'
      }
    }, res => {
      const status = Number(res.statusCode || 0);
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error('too many redirects'));
        return resolve(getText(new URL(location, u).toString(), redirectsLeft - 1));
      }

      const chunks = [];
      let size = 0;
      res.on('data', chunk => {
        size += chunk.length;
        if (size <= MAX_BYTES) chunks.push(chunk);
        if (size > MAX_BYTES) {
          req.destroy(new Error('response exceeds max bytes'));
        }
      });
      res.on('end', () => resolve({
        status,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8'),
        final_url: u.toString()
      }));
    });

    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function fetchOne(src) {
  const started = Date.now();
  try {
    const res = await getText(src.url);
    return {
      market: src.market,
      manager: src.manager,
      role: src.role,
      status: res.status,
      content_type: String(res.headers['content-type'] || '').split(';')[0],
      bytes_seen: Buffer.byteLength(res.body),
      elapsed_ms: Date.now() - started,
      marker_counts: Object.fromEntries(src.markers.map(m => [m, countMatches(res.body, m)])),
      final_url: res.final_url
    };
  } catch (err) {
    return {
      market: src.market,
      manager: src.manager,
      role: src.role,
      status: 'ERROR',
      content_type: '-',
      bytes_seen: 0,
      elapsed_ms: Date.now() - started,
      marker_counts: Object.fromEntries(src.markers.map(m => [m, 0])),
      error: String(err && err.message ? err.message : err)
    };
  }
}

async function main() {
  console.log('=== W2 P1 GHANA / KENYA SOURCE PILOTS — TECHNICAL REACHABILITY ===');
  console.log('Mesure le ' + new Date().toISOString() + ' — HTTP GET ONLY / NO WRITE');
  console.log('IMPLEMENTATION=NODE_CORE_HTTP_ONLY');

  const rows = [];
  for (const src of SOURCES) rows.push(await fetchOne(src));
  for (const row of rows) console.log(JSON.stringify(row));

  const reachable = rows.filter(r => Number(r.status) >= 200 && Number(r.status) < 400).length;
  console.log('REACHABLE_SOURCES=' + reachable + '/' + rows.length);
  console.log('RULE=HTTP reachability and markers prove only technical source feasibility, not NAV semantics, licence, identity mapping or permission to import.');
  console.log('VERDICT=W2_P1_SOURCE_PILOTS_MEASURED_READ_ONLY');
}

main().catch(err => {
  console.error('W2_P1_SOURCE_PILOTS_FATAL=' + String(err && err.message ? err.message : err));
  process.exit(2);
});
