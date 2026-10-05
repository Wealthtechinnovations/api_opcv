/**
 * W2 P1 Ghana/Kenya source-pilot technical reachability — READ ONLY.
 *
 * Performs public HTTP GETs only. No DB read/write, no file write, no auth,
 * no canonical import. Output is diagnostic evidence for source feasibility.
 */
'use strict';

const axios = require('axios');

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

function countMatches(body, token) {
  const text = String(body || '');
  const needle = String(token || '').toLowerCase();
  const hay = text.toLowerCase();
  let count = 0, at = 0;
  while (needle && (at = hay.indexOf(needle, at)) !== -1) {
    count++;
    at += needle.length;
  }
  return count;
}

async function fetchOne(src) {
  const started = Date.now();
  try {
    const res = await axios.get(src.url, {
      timeout: 20000,
      maxContentLength: 3 * 1024 * 1024,
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'AfricaFunds-W2-ReadOnly-Source-Probe/1.0',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    return {
      market: src.market,
      manager: src.manager,
      role: src.role,
      status: res.status,
      content_type: String(res.headers['content-type'] || '').split(';')[0],
      bytes_seen: Buffer.byteLength(body),
      elapsed_ms: Date.now() - started,
      marker_counts: Object.fromEntries(src.markers.map(m => [m, countMatches(body, m)])),
      final_url: res.request?.res?.responseUrl || src.url
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

(async () => {
  console.log('=== W2 P1 GHANA / KENYA SOURCE PILOTS — TECHNICAL REACHABILITY ===');
  console.log('Mesure le ' + new Date().toISOString() + ' — HTTP GET ONLY / NO WRITE');
  const rows = [];
  for (const src of SOURCES) rows.push(await fetchOne(src));
  for (const row of rows) {
    console.log(JSON.stringify(row));
  }
  const reachable = rows.filter(r => Number(r.status) >= 200 && Number(r.status) < 400).length;
  console.log('REACHABLE_SOURCES=' + reachable + '/' + rows.length);
  console.log('RULE=HTTP reachability and text markers prove only technical source feasibility, not NAV semantics, licence, identity mapping or permission to import.');
  console.log('VERDICT=W2_P1_SOURCE_PILOTS_MEASURED_READ_ONLY');
})().catch(err => {
  console.error('W2_P1_SOURCE_PILOTS_FATAL=' + String(err && err.message ? err.message : err));
  process.exit(2);
});
