const { createClient } = require('@clickhouse/client');

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'fund_analytics',
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

module.exports = { clickhouse, initClickHouse, isClickHouseAvailable };
