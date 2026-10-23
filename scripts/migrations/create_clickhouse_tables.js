#!/usr/bin/env node
/**
 * create_clickhouse_tables.js
 *
 * Creates ClickHouse tables for historical rankings and performance.
 * Requires ClickHouse to be installed and running.
 *
 * Usage:
 *   node scripts/migrations/create_clickhouse_tables.js              # diagnostic
 *   node scripts/migrations/create_clickhouse_tables.js --execute    # creation
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@clickhouse/client');

const EXECUTE = process.argv.includes('--execute');

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'fund_analytics',
});

const TABLES = [
  {
    name: 'classement_historique',
    sql: `CREATE TABLE IF NOT EXISTS classement_historique (
  date_classement Date,
  fond_id UInt32,
  type_classement UInt8 COMMENT '1=national, 2=regional, 3=global',
  devise String COMMENT 'LOCAL, EUR, USD',
  categorie String COMMENT 'Categorie du fonds pour ce classement',
  rang_ytd UInt16 DEFAULT 0,
  total_ytd UInt16 DEFAULT 0,
  rang_1m UInt16 DEFAULT 0,
  total_1m UInt16 DEFAULT 0,
  rang_3m UInt16 DEFAULT 0,
  total_3m UInt16 DEFAULT 0,
  rang_6m UInt16 DEFAULT 0,
  total_6m UInt16 DEFAULT 0,
  rang_1an UInt16 DEFAULT 0,
  total_1an UInt16 DEFAULT 0,
  rang_3ans UInt16 DEFAULT 0,
  total_3ans UInt16 DEFAULT 0,
  rang_5ans UInt16 DEFAULT 0,
  total_5ans UInt16 DEFAULT 0,
  quartile_ytd UInt8 DEFAULT 0,
  quartile_3m UInt8 DEFAULT 0,
  quartile_6m UInt8 DEFAULT 0,
  quartile_1an UInt8 DEFAULT 0,
  quartile_3ans UInt8 DEFAULT 0,
  perf_ytd Float64 DEFAULT 0,
  perf_3m Float64 DEFAULT 0,
  perf_6m Float64 DEFAULT 0,
  perf_1an Float64 DEFAULT 0,
  perf_3ans Float64 DEFAULT 0,
  inserted_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(inserted_at)
ORDER BY (date_classement, fond_id, type_classement, devise)
PARTITION BY toYYYYMM(date_classement)`,
  },
  {
    name: 'performance_historique',
    sql: `CREATE TABLE IF NOT EXISTS performance_historique (
  date_perf Date,
  fond_id UInt32,
  devise String COMMENT 'LOCAL, EUR, USD',
  perf_veille Float64 DEFAULT 0,
  perf_4s Float64 DEFAULT 0,
  perf_ytd Float64 DEFAULT 0,
  perf_1m Float64 DEFAULT 0,
  perf_3m Float64 DEFAULT 0,
  perf_6m Float64 DEFAULT 0,
  perf_1an Float64 DEFAULT 0,
  perf_3ans Float64 DEFAULT 0,
  perf_5ans Float64 DEFAULT 0,
  perf_10ans Float64 DEFAULT 0,
  perf_depuis_creation Float64 DEFAULT 0,
  actif_net Float64 DEFAULT 0,
  inserted_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(inserted_at)
ORDER BY (date_perf, fond_id, devise)
PARTITION BY toYYYYMM(date_perf)`,
  },
];

async function run() {
  console.log('=== ClickHouse Tables — Classement + Performance historiques ===\n');

  try {
    const result = await clickhouse.query({ query: 'SELECT 1', format: 'JSONEachRow' });
    await result.json();
    console.log('ClickHouse: connecte\n');
  } catch (err) {
    console.error('ClickHouse NON DISPONIBLE:', err.message);
    console.log('\nPour installer ClickHouse:');
    console.log('  curl https://clickhouse.com/ | sh');
    console.log('  sudo clickhouse install && sudo clickhouse start');
    process.exit(1);
  }

  try {
    await clickhouse.command({ query: 'CREATE DATABASE IF NOT EXISTS fund_analytics' });
    console.log('Database fund_analytics: OK\n');
  } catch (err) {
    console.log('Database fund_analytics: existe deja\n');
  }

  for (const table of TABLES) {
    console.log(`Table ${table.name}:`);
    if (EXECUTE) {
      try {
        await clickhouse.command({ query: table.sql });
        console.log('  -> CREE\n');
      } catch (err) {
        console.error(`  -> ERREUR: ${err.message}\n`);
      }
    } else {
      console.log('  -> MODE DIAGNOSTIC (ajouter --execute pour creer)\n');
      console.log(table.sql.split('\n').map(l => '    ' + l).join('\n'));
      console.log();
    }
  }

  await clickhouse.close();
  console.log('Termine.');
}

run().catch(err => {
  console.error('ERREUR FATALE:', err);
  process.exit(1);
});
