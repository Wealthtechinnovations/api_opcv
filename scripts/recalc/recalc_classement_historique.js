#!/usr/bin/env node
/**
 * recalc_classement_historique.js
 *
 * Calcule les classements date par date et les stocke dans ClickHouse.
 * Pour chaque date D ou au moins un fonds a une VL:
 *   - Identifie les fonds avec VL a D (±2 jours ouvres)
 *   - Pour chaque horizon (YTD, 1M, 3M, 6M, 1A, 3A, 5A):
 *     verifie que le fonds a une VL a D-horizon
 *   - Calcule perf = (VL(D) - VL(D-horizon)) / VL(D-horizon)
 *   - Classe les fonds eligibles par categorie (nationale, regionale, globale)
 *   - Stocke rang, total, quartile
 *
 * Usage:
 *   node scripts/recalc/recalc_classement_historique.js                    # derniers 30 jours
 *   node scripts/recalc/recalc_classement_historique.js --from 2024-01-01  # depuis une date
 *   node scripts/recalc/recalc_classement_historique.js --full             # tout l'historique (10 ans)
 *   node scripts/recalc/recalc_classement_historique.js --dry-run          # simulation
 *
 * Pre-requis: ClickHouse installe et tables creees via create_clickhouse_tables.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const { createClient } = require('@clickhouse/client');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'fund_analytics',
});

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { from: null, full: false, dryRun: false, devise: 'LOCAL' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) opts.from = args[++i];
    else if (args[i] === '--full') opts.full = true;
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--devise' && args[i + 1]) opts.devise = args[++i].toUpperCase();
  }
  return opts;
}

const HORIZONS = [
  { key: 'ytd', label: 'YTD', getStartDate: (d) => `${d.getFullYear()}-01-01` },
  { key: '1m', label: '1M', months: 1 },
  { key: '3m', label: '3M', months: 3 },
  { key: '6m', label: '6M', months: 6 },
  { key: '1an', label: '1A', months: 12 },
  { key: '3ans', label: '3A', months: 36 },
  { key: '5ans', label: '5A', months: 60 },
];

function subtractMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

function getQuartile(rank, total) {
  if (total === 0 || !rank) return 0;
  const pct = rank / total;
  if (pct <= 0.25) return 1;
  if (pct <= 0.50) return 2;
  if (pct <= 0.75) return 3;
  return 4;
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('MySQL: connecte');

  try {
    await clickhouse.query({ query: 'SELECT 1', format: 'JSONEachRow' });
    console.log('ClickHouse: connecte');
  } catch (err) {
    console.error('ClickHouse NON DISPONIBLE:', err.message);
    await conn.end();
    process.exit(1);
  }

  let fromDate;
  if (opts.full) {
    fromDate = new Date(Date.now() - 10 * 365 * 86400000).toISOString().split('T')[0];
  } else if (opts.from) {
    fromDate = opts.from;
  } else {
    fromDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  }

  console.log(`Devise: ${opts.devise}`);
  console.log(`Depuis: ${fromDate}`);
  if (opts.dryRun) console.log('*** MODE DRY-RUN ***\n');

  const valueCol = opts.devise === 'EUR' ? 'vl_ajuste_EUR' : opts.devise === 'USD' ? 'vl_ajuste_USD' : 'vl_ajuste';

  const [dates] = await conn.query(`
    SELECT DISTINCT date FROM valorisations
    WHERE date >= ? AND ${valueCol} IS NOT NULL AND ${valueCol} > 0
    ORDER BY date ASC
  `, [fromDate]);

  console.log(`${dates.length} dates a traiter\n`);

  const [fonds] = await conn.query(`
    SELECT id, nom_fond, pays, categorie_national, categorie_regional,
           categorie_fundafrica, dev_libelle
    FROM fond_investissements
    WHERE active = 1
  `);

  const fondMap = {};
  for (const f of fonds) fondMap[f.id] = f;

  let totalInserted = 0;

  for (let di = 0; di < dates.length; di++) {
    const dateStr = dates[di].date instanceof Date
      ? dates[di].date.toISOString().split('T')[0]
      : String(dates[di].date).split('T')[0];

    const dateObj = new Date(dateStr);

    const [vlRows] = await conn.query(`
      SELECT fund_id, ${valueCol} as vl
      FROM valorisations
      WHERE date = ? AND ${valueCol} IS NOT NULL AND ${valueCol} > 0
    `, [dateStr]);

    if (vlRows.length === 0) continue;

    const vlMap = {};
    for (const r of vlRows) vlMap[r.fund_id] = r.vl;

    const fundPerfs = {};
    for (const fundId of Object.keys(vlMap)) {
      fundPerfs[fundId] = {};
    }

    for (const horizon of HORIZONS) {
      let startDate;
      if (horizon.getStartDate) {
        startDate = horizon.getStartDate(dateObj);
      } else {
        startDate = subtractMonths(dateStr, horizon.months);
      }

      const [startVls] = await conn.query(`
        SELECT fund_id, ${valueCol} as vl
        FROM valorisations
        WHERE date BETWEEN DATE_SUB(?, INTERVAL 4 DAY) AND ?
          AND ${valueCol} IS NOT NULL AND ${valueCol} > 0
          AND fund_id IN (?)
        ORDER BY ABS(DATEDIFF(date, ?)) ASC
      `, [startDate, startDate, Object.keys(vlMap).map(Number), startDate]);

      const startMap = {};
      for (const r of startVls) {
        if (!startMap[r.fund_id]) startMap[r.fund_id] = r.vl;
      }

      for (const fundId of Object.keys(vlMap)) {
        const fid = parseInt(fundId);
        if (startMap[fid] && startMap[fid] > 0) {
          fundPerfs[fundId][horizon.key] = (vlMap[fid] - startMap[fid]) / startMap[fid] * 100;
        }
      }
    }

    const classTypes = [
      { type: 1, label: 'national', getCategorie: (f) => f.categorie_national },
      { type: 2, label: 'regional', getCategorie: (f) => f.categorie_regional },
      { type: 3, label: 'global', getCategorie: (f) => f.categorie_fundafrica },
    ];

    const batch = [];

    for (const ct of classTypes) {
      const groups = {};
      for (const fundId of Object.keys(vlMap)) {
        const f = fondMap[parseInt(fundId)];
        if (!f) continue;
        const cat = ct.getCategorie(f);
        if (!cat) continue;
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ fundId: parseInt(fundId), perfs: fundPerfs[fundId] });
      }

      for (const [categorie, fundList] of Object.entries(groups)) {
        for (const horizon of HORIZONS) {
          const eligible = fundList.filter(f => f.perfs[horizon.key] !== undefined);
          if (eligible.length < 2) continue;

          eligible.sort((a, b) => (b.perfs[horizon.key] || 0) - (a.perfs[horizon.key] || 0));
          eligible.forEach((f, idx) => {
            f[`rang_${horizon.key}`] = idx + 1;
            f[`total_${horizon.key}`] = eligible.length;
          });
        }

        for (const fund of fundList) {
          const row = {
            date_classement: dateStr,
            fond_id: fund.fundId,
            type_classement: ct.type,
            devise: opts.devise,
            categorie: categorie,
          };

          for (const h of HORIZONS) {
            row[`rang_${h.key}`] = fund[`rang_${h.key}`] || 0;
            row[`total_${h.key}`] = fund[`total_${h.key}`] || 0;
            row[`perf_${h.key}`] = fund.perfs[h.key] || 0;
          }
          row.quartile_ytd = getQuartile(row.rang_ytd, row.total_ytd);
          row.quartile_3m = getQuartile(row.rang_3m, row.total_3m);
          row.quartile_6m = getQuartile(row.rang_6m, row.total_6m);
          row.quartile_1an = getQuartile(row.rang_1an, row.total_1an);
          row.quartile_3ans = getQuartile(row.rang_3ans, row.total_3ans);

          batch.push(row);
        }
      }
    }

    if (batch.length > 0 && !opts.dryRun) {
      try {
        await clickhouse.insert({
          table: 'classement_historique',
          values: batch,
          format: 'JSONEachRow',
        });
        totalInserted += batch.length;
      } catch (err) {
        console.error(`Erreur insertion ClickHouse date=${dateStr}:`, err.message);
      }
    }

    if (di % 50 === 0 || di === dates.length - 1) {
      console.log(`[${di + 1}/${dates.length}] date=${dateStr} batch=${batch.length} total=${totalInserted}`);
    }
  }

  console.log(`\nTermine. ${totalInserted} lignes inserees dans classement_historique.`);
  await conn.end();
  await clickhouse.close();
}

run().catch(err => {
  console.error('ERREUR FATALE:', err);
  process.exit(1);
});
