/**
 * Pression theorique des prepared statements des recalculs massifs.
 *
 * Lecture seule. Reproduit uniquement la geometrie des batchs depuis la DB :
 * - recalc_eur_usd_daily_rate.js : UPDATE dynamiques par blocs de 500
 * - recalc_vl_ajuste.js          : UPDATE dynamiques par blocs de 200
 *
 * Ne lance aucun recalcul et ne modifie aucune ligne.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

async function scalar(conn, sql) {
  const [rows] = await conn.query(sql);
  return rows[0] || {};
}

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    console.log('\n=== PREPARED STATEMENT PRESSURE — READ ONLY ===');
    console.log('Mesure: ' + new Date().toISOString());

    const step3 = await scalar(conn, `
      SELECT
        COUNT(*) AS funds,
        COALESCE(SUM(cnt),0) AS vl_rows,
        COALESCE(SUM(CEIL(cnt / 500)),0) AS dynamic_update_statements
      FROM (
        SELECT v.fund_id, COUNT(*) AS cnt
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
        WHERE f.active = 1
          AND v.value IS NOT NULL
          AND v.value > 0
        GROUP BY v.fund_id
      ) x
    `);

    const step4 = await scalar(conn, `
      SELECT
        COUNT(*) AS funds,
        COALESCE(SUM(cnt),0) AS vl_rows,
        COALESCE(SUM(CEIL(cnt / 200)),0) AS dynamic_update_statements
      FROM (
        SELECT v.fund_id, COUNT(*) AS cnt
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
        WHERE f.active = 1
        GROUP BY v.fund_id
      ) x
    `);

    const [status] = await conn.query(`
      SHOW GLOBAL STATUS WHERE Variable_name IN (
        'Prepared_stmt_count','Com_stmt_prepare','Com_stmt_execute','Com_stmt_close',
        'Memory_used','Threads_connected','Threads_running','Uptime'
      )
    `);
    const [vars] = await conn.query(`
      SHOW GLOBAL VARIABLES WHERE Variable_name IN (
        'max_prepared_stmt_count','performance_schema'
      )
    `);

    const statusMap = Object.fromEntries(status.map(r => [r.Variable_name, r.Value]));
    const varMap = Object.fromEntries(vars.map(r => [r.Variable_name, r.Value]));
    const s3 = Number(step3.dynamic_update_statements || 0);
    const s4 = Number(step4.dynamic_update_statements || 0);
    const theoretical = s3 + s4;

    console.log('STEP3_RECALC_EUR_USD funds=' + step3.funds +
      ' vl_rows=' + step3.vl_rows +
      ' dynamic_update_statements=' + step3.dynamic_update_statements +
      ' batch_size=500');
    console.log('STEP4_RECALC_VL_AJUSTE funds=' + step4.funds +
      ' vl_rows=' + step4.vl_rows +
      ' dynamic_update_statements=' + step4.dynamic_update_statements +
      ' batch_size=200');
    console.log('COMBINED_DYNAMIC_UPDATE_STATEMENTS=' + theoretical);
    console.log('MYSQL_MAX_PREPARED_STMT_COUNT=' + (varMap.max_prepared_stmt_count || 'NA'));
    console.log('MYSQL_PERFORMANCE_SCHEMA=' + (varMap.performance_schema || 'NA'));
    console.log('MYSQL_PREPARED_STMT_COUNT_NOW=' + (statusMap.Prepared_stmt_count || 'NA'));
    console.log('MYSQL_COM_STMT_PREPARE_SINCE_RESTART=' + (statusMap.Com_stmt_prepare || 'NA'));
    console.log('MYSQL_COM_STMT_EXECUTE_SINCE_RESTART=' + (statusMap.Com_stmt_execute || 'NA'));
    console.log('MYSQL_COM_STMT_CLOSE_SINCE_RESTART=' + (statusMap.Com_stmt_close || 'NA'));
    console.log('MYSQL_MEMORY_USED_NOW=' + (statusMap.Memory_used || 'NA'));
    console.log('MYSQL_UPTIME=' + (statusMap.Uptime || 'NA'));

    const prepares = Number(statusMap.Com_stmt_prepare || 0);
    console.log('PREPARE_MINUS_THEORETICAL_DYNAMIC=' + (prepares - theoretical));
    console.log('NOTE=Step3 count is an upper geometry bound before currency/rate skips; current daily log reported 1249 funds and 994766 VL actually processed. Step4 geometry is exact for active-fund row batches. Com_stmt_prepare is server-global and cumulative, so numerical proximity is evidence for correlation, not causal identity.');
    console.log('MUTATION=NONE');
  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('READ_ONLY_DIAG_ERROR=' + err.message);
  process.exit(2);
});
