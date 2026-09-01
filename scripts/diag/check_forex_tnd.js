#!/usr/bin/env node
/**
 * Diagnostic: check EUR/TND and USD/TND entries in devisedechanges
 * READ-ONLY — no modifications
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'fund_opcvm',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'fund_opcvm',
  });

  console.log('=== Diagnostic EUR/TND + USD/TND ===\n');

  // 1. Count by paire
  const [counts] = await conn.execute(`
    SELECT paire, COUNT(*) as total,
           SUM(CASE WHEN value > 0 THEN 1 ELSE 0 END) as with_value,
           SUM(CASE WHEN value = 0 OR value IS NULL THEN 1 ELSE 0 END) as zero_or_null,
           MIN(CASE WHEN value > 0 THEN value END) as min_val,
           MAX(CASE WHEN value > 0 THEN value END) as max_val,
           MIN(CASE WHEN value > 0 THEN date END) as min_date,
           MAX(CASE WHEN value > 0 THEN date END) as max_date
    FROM devisedechanges
    WHERE paire IN ('EUR/TND', 'USD/TND', 'EUR/MAD', 'USD/MAD', 'EUR/NGN', 'USD/NGN')
    GROUP BY paire ORDER BY paire
  `);

  console.log('Paire        | Total | value>0 | zero/null | min_val   | max_val   | min_date   | max_date');
  console.log('-------------|-------|---------|-----------|-----------|-----------|------------|----------');
  for (const r of counts) {
    console.log(
      `${String(r.paire).padEnd(13)}| ${String(r.total).padStart(5)} | ${String(r.with_value).padStart(7)} | ${String(r.zero_or_null).padStart(9)} | ${String(r.min_val||'N/A').padStart(9)} | ${String(r.max_val||'N/A').padStart(9)} | ${r.min_date||'N/A'} | ${r.max_date||'N/A'}`
    );
  }

  // 2. Sample recent EUR/TND entries
  console.log('\n=== Dernieres 10 entrees EUR/TND ===');
  const [recent] = await conn.execute(`
    SELECT date, value FROM devisedechanges
    WHERE paire = 'EUR/TND'
    ORDER BY date DESC LIMIT 10
  `);
  for (const r of recent) {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date;
    console.log(`  ${d}: ${r.value}`);
  }

  // 3. Sample EUR/TND with value > 0
  console.log('\n=== Dernieres 10 entrees EUR/TND avec value > 0 ===');
  const [validRecent] = await conn.execute(`
    SELECT date, value FROM devisedechanges
    WHERE paire = 'EUR/TND' AND value > 0
    ORDER BY date DESC LIMIT 10
  `);
  for (const r of validRecent) {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date;
    console.log(`  ${d}: ${r.value}`);
  }

  // 4. Check for duplicate paire+date
  console.log('\n=== Doublons paire+date pour TND ===');
  const [dupes] = await conn.execute(`
    SELECT paire, date, COUNT(*) as cnt
    FROM devisedechanges
    WHERE paire IN ('EUR/TND', 'USD/TND')
    GROUP BY paire, date
    HAVING cnt > 1
    LIMIT 10
  `);
  console.log(`  ${dupes.length} doublons trouves`);
  for (const r of dupes) {
    console.log(`  ${r.paire} ${r.date}: ${r.cnt} entries`);
  }

  await conn.end();
  console.log('\n=== Fin diagnostic ===');
}

run().catch(e => { console.error(e); process.exit(1); });
