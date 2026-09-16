const { createClient } = require('@clickhouse/client');

// Interrupteur propre : permet de desactiver totalement ClickHouse via .env
// (ex: CLICKHOUSE_ENABLED=false) sans toucher au code — utile suite a l'incident
// de saturation disque. Defaut: active, pour preserver le comportement existant.
const CLICKHOUSE_ENABLED = !['false', '0', 'no', 'off'].includes(
  String(process.env.CLICKHOUSE_ENABLED ?? 'true').toLowerCase()
);

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'fund_analytics',
  // Evite les requetes suspendues indefiniment (defaut 30s, configurable)
  request_timeout: parseInt(process.env.CLICKHOUSE_REQUEST_TIMEOUT_MS, 10) || 30000,
});

let clickhouseAvailable = false;

async function createTables() {
  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS fund_performance (
        fund_id UInt32,
        fund_name String,
        isin String,
        date Date,
        nav Float64,
        daily_return Float64,
        cumulative_return Float64,
        country String,
        management_company String,
        currency String,
        actif_net Float64,
        inserted_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY (fund_id, date)
    `,
  });

  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS fund_rankings (
        fund_id UInt32,
        fund_name String,
        ranking_type UInt8,
        quartile UInt8,
        rank UInt32,
        total_funds UInt32,
        period String,
        calculated_at Date,
        inserted_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY (fund_id, calculated_at)
    `,
  });

  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS market_analytics (
        country String,
        total_funds UInt32,
        total_aum Float64,
        avg_performance Float64,
        date Date,
        inserted_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY (country, date)
    `,
  });

  console.log('ClickHouse analytics tables created/verified');
}

async function initClickHouse() {
  if (!CLICKHOUSE_ENABLED) {
    console.warn('ClickHouse desactive via CLICKHOUSE_ENABLED=false — fonctionnalites analytics desactivees');
    clickhouseAvailable = false;
    return false;
  }
  try {
    const result = await clickhouse.query({ query: 'SELECT 1', format: 'JSONEachRow' });
    await result.json();
    console.log('ClickHouse connected successfully');
    await createTables();
    clickhouseAvailable = true;
    return true;
  } catch (error) {
    console.warn('ClickHouse not available, analytics features disabled:', error.message);
    clickhouseAvailable = false;
    return false;
  }
}

function isClickHouseAvailable() {
  return clickhouseAvailable;
}

// Permet au coupe-circuit de la sync de marquer ClickHouse indisponible
// apres trop d'echecs consecutifs, pour cesser de le marteler.
function setClickHouseUnavailable() {
  clickhouseAvailable = false;
}

function isClickHouseEnabled() {
  return CLICKHOUSE_ENABLED;
}

module.exports = {
  clickhouse,
  initClickHouse,
  isClickHouseAvailable,
  setClickHouseUnavailable,
  isClickHouseEnabled,
};
