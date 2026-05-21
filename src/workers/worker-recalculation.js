#!/usr/bin/env node
/**
 * worker-recalculation.js
 *
 * PM2 dedicated process that consumes recalc_jobs from MySQL.
 * Polls for PENDING jobs, executes them, and propagates dependencies.
 *
 * PM2 config:
 *   pm2 start src/workers/worker-recalculation.js --name worker-recalculation
 *
 * Environment:
 *   Requires .env with DB credentials (same as API)
 *   WORKER_POLL_INTERVAL=10000  (ms between polls, default 10s)
 *   WORKER_LOCK_TIMEOUT=300000  (ms before stale lock is released, default 5min)
 *   WORKER_ID=worker-1          (unique worker identifier)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const { execFile } = require('child_process');
const path = require('path');

const API_DIR = path.resolve(__dirname, '../..');

const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL) || 10000;
const LOCK_TIMEOUT = parseInt(process.env.WORKER_LOCK_TIMEOUT) || 300000;
const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
};

let pool;
let running = true;

const JOB_HANDLERS = {
  VL_AJUSTE: executeVlAjuste,
  RENDEMENTS: executeRendements,
  PERF_LOCALE: executePerfLocale,
  PERF_EUR: executePerfDevise,
  PERF_USD: executePerfDevise,
  CLASSEMENT_LOCAL: executeClassement,
  CLASSEMENT_EUR: executeClassement,
  CLASSEMENT_USD: executeClassement,
  FX_CONVERSION: executeFxConversion,
  RATIOS: executeRatios,
  INDREF: executeIndRef,
  FULL_REBUILD: executeFullRebuild,
};

async function main() {
  pool = mysql.createPool(DB_CONFIG);
  console.log(`[${WORKER_ID}] Worker recalculation demarre — poll ${POLL_INTERVAL}ms`);

  await releaseStaleJobs();
  await markDeadLetterJobs();

  while (running) {
    try {
      const job = await claimNextJob();
      if (job) {
        await processJob(job);
      } else {
        await sleep(POLL_INTERVAL);
      }
    } catch (err) {
      console.error(`[${WORKER_ID}] Erreur boucle principale:`, err.message);
      await sleep(POLL_INTERVAL * 2);
    }
  }

  await pool.end();
  console.log(`[${WORKER_ID}] Worker arrete.`);
}

async function claimNextJob() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [jobs] = await conn.query(`
      SELECT * FROM recalc_jobs
      WHERE status = 'PENDING' AND attempts < max_attempts
      ORDER BY priority ASC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    if (jobs.length === 0) {
      await conn.rollback();
      return null;
    }

    const job = jobs[0];
    await conn.query(`
      UPDATE recalc_jobs
      SET status = 'RUNNING', locked_by = ?, locked_at = NOW(),
          started_at = NOW(), attempts = attempts + 1
      WHERE id = ?
    `, [WORKER_ID, job.id]);

    await conn.commit();
    return { ...job, status: 'RUNNING' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function markDeadLetterJobs() {
  const [result] = await pool.query(`
    UPDATE recalc_jobs
    SET status = 'FAILED', error_message = CONCAT(COALESCE(error_message,''), ' [DEAD_LETTER: max_attempts reached]')
    WHERE status = 'PENDING' AND attempts >= max_attempts
  `);
  if (result.affectedRows > 0) {
    console.log(`[${WORKER_ID}] ${result.affectedRows} jobs dead-letter (max attempts)`);
  }
}

async function processJob(job) {
  const startTime = Date.now();
  console.log(`[${WORKER_ID}] Job #${job.id} ${job.job_type} fond=${job.fond_id || 'global'} depuis=${job.date_from}`);

  try {
    const handler = JOB_HANDLERS[job.job_type];
    if (!handler) {
      throw new Error(`Handler inconnu pour job_type: ${job.job_type}`);
    }

    const result = await handler(job);
    const elapsed = Date.now() - startTime;

    await pool.query(`
      UPDATE recalc_jobs
      SET status = 'COMPLETED', completed_at = NOW(),
          rows_affected = ?, execution_time_ms = ?,
          locked_by = NULL, locked_at = NULL
      WHERE id = ?
    `, [result.rowsAffected || 0, elapsed, job.id]);

    await pool.query(`
      INSERT INTO recalc_audit (job_id, fond_id, action, detail, rows_affected)
      VALUES (?, ?, ?, ?, ?)
    `, [job.id, job.fond_id, `${job.job_type} COMPLETED`, result.detail || '', result.rowsAffected || 0]);

    console.log(`[${WORKER_ID}] Job #${job.id} OK — ${result.rowsAffected || 0} lignes, ${elapsed}ms`);

    await propagateDependencies(job);

  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`[${WORKER_ID}] Job #${job.id} ECHEC:`, err.message);

    await pool.query(`
      UPDATE recalc_jobs
      SET status = 'FAILED', error_message = ?, execution_time_ms = ?,
          locked_by = NULL, locked_at = NULL
      WHERE id = ?
    `, [err.message.substring(0, 2000), elapsed, job.id]);

    await pool.query(`
      INSERT INTO recalc_audit (job_id, fond_id, action, detail)
      VALUES (?, ?, ?, ?)
    `, [job.id, job.fond_id, `${job.job_type} FAILED`, err.message.substring(0, 2000)]);
  }
}

async function propagateDependencies(completedJob) {
  const [deps] = await pool.query(`
    SELECT target_job_type FROM recalc_dependencies
    WHERE source_job_type = ? AND active = 1
  `, [completedJob.job_type]);

  let created = 0;
  for (const dep of deps) {
    const [existing] = await pool.query(`
      SELECT id FROM recalc_jobs
      WHERE job_type = ? AND fond_id <=> ? AND date_from = ?
        AND status = 'PENDING'
      LIMIT 1
    `, [dep.target_job_type, completedJob.fond_id, completedJob.date_from]);

    if (existing.length > 0) {
      continue;
    }

    await pool.query(`
      INSERT INTO recalc_jobs (event_id, job_type, fond_id, categorie, date_from, date_to, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      completedJob.event_id,
      dep.target_job_type,
      completedJob.fond_id,
      completedJob.categorie,
      completedJob.date_from,
      completedJob.date_to,
      Math.min(completedJob.priority + 1, 9),
    ]);
    created++;
  }

  if (created > 0) {
    console.log(`[${WORKER_ID}] Propage ${created}/${deps.length} jobs dependants depuis #${completedJob.id}`);
  }
}

async function releaseStaleJobs() {
  const [result] = await pool.query(`
    UPDATE recalc_jobs
    SET status = 'PENDING', locked_by = NULL, locked_at = NULL
    WHERE status = 'RUNNING'
      AND locked_at < DATE_SUB(NOW(), INTERVAL ? SECOND)
  `, [Math.floor(LOCK_TIMEOUT / 1000)]);

  if (result.affectedRows > 0) {
    console.log(`[${WORKER_ID}] ${result.affectedRows} jobs stale liberes`);
  }
}

// --- Job handlers ---

async function executeVlAjuste(job) {
  const fondFilter = job.fond_id ? `AND fund_id = ${parseInt(job.fond_id)}` : '';
  const [result] = await pool.query(`
    UPDATE valorisations v
    JOIN (
      SELECT v2.id,
             v2.value + COALESCE(
               (SELECT SUM(v3.dividende) FROM valorisations v3
                WHERE v3.fund_id = v2.fund_id AND v3.date <= v2.date AND v3.dividende > 0),
             0) as new_vl_ajuste
      FROM valorisations v2
      WHERE v2.date >= ? ${fondFilter}
    ) calc ON v.id = calc.id
    SET v.vl_ajuste = calc.new_vl_ajuste
    WHERE v.vl_ajuste != calc.new_vl_ajuste OR v.vl_ajuste IS NULL
  `, [job.date_from]);
  return { rowsAffected: result.affectedRows, detail: `vl_ajuste depuis ${job.date_from}` };
}

async function executeRendements(job) {
  return { rowsAffected: 0, detail: 'Rendements calcules via perf locale — pas de script dedie' };
}

async function executePerfLocale(job) {
  const args = ['scripts/fix/fix_populate_performances.js', '--force'];
  if (job.fond_id) args.push('--fond', String(job.fond_id));
  return runScript(args, 120000);
}

async function executePerfDevise(job) {
  const devise = job.job_type === 'PERF_EUR' ? 'EUR' : 'USD';
  const args = ['scripts/fix/fix_populate_performances_eur_usd.js', '--devise', devise, '--force'];
  if (job.fond_id) args.push('--fond', String(job.fond_id));
  return runScript(args, 120000);
}

async function executeClassement(job) {
  const typeMap = {
    'CLASSEMENT_LOCAL': 'classementmysql',
    'CLASSEMENT_EUR': 'classementeur',
    'CLASSEMENT_USD': 'classementusd',
  };
  const route = typeMap[job.job_type];
  try {
    const http = require('http');
    const result = await new Promise((resolve, reject) => {
      http.get(`http://localhost:3005/api/${route}`, { timeout: 300000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    return { rowsAffected: 0, detail: `${route}: ${result.substring(0, 200)}` };
  } catch (err) {
    return { rowsAffected: 0, detail: `${route} error: ${err.message}` };
  }
}

async function executeFxConversion(job) {
  const args = ['scripts/recalc/recalc_eur_usd_daily_rate.js'];
  if (job.fond_id) args.push(String(job.fond_id));
  return runScript(args, 300000);
}

async function executeRatios(job) {
  return { rowsAffected: 0, detail: 'Ratios calcules par classement routes — propages automatiquement' };
}

async function executeIndRef(job) {
  return { rowsAffected: 0, detail: 'indRef mis a jour lors de l insertion VL — pas d action supplementaire' };
}

async function executeFullRebuild(job) {
  const steps = [
    () => executeVlAjuste(job),
    () => executeFxConversion(job),
    () => executePerfLocale(job),
    () => executePerfDevise({ ...job, job_type: 'PERF_EUR' }),
    () => executePerfDevise({ ...job, job_type: 'PERF_USD' }),
    () => executeClassement({ ...job, job_type: 'CLASSEMENT_LOCAL' }),
    () => executeClassement({ ...job, job_type: 'CLASSEMENT_EUR' }),
    () => executeClassement({ ...job, job_type: 'CLASSEMENT_USD' }),
  ];
  let totalRows = 0;
  const details = [];
  for (const step of steps) {
    const r = await step();
    totalRows += r.rowsAffected || 0;
    details.push(r.detail);
  }
  return { rowsAffected: totalRows, detail: details.join(' | ') };
}

function runScript(args, timeout) {
  return new Promise((resolve, reject) => {
    execFile('node', args, { cwd: API_DIR, timeout, env: process.env }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`${args[0]}: ${err.message}\n${stderr.substring(0, 500)}`));
        return;
      }
      const lines = stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1] || '';
      const rowMatch = lastLine.match(/(\d+)/);
      resolve({
        rowsAffected: rowMatch ? parseInt(rowMatch[1]) : 0,
        detail: lastLine.substring(0, 500),
      });
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

process.on('SIGTERM', () => {
  console.log(`[${WORKER_ID}] SIGTERM recu, arret en cours...`);
  running = false;
});

process.on('SIGINT', () => {
  console.log(`[${WORKER_ID}] SIGINT recu, arret en cours...`);
  running = false;
});

main().catch(err => {
  console.error('ERREUR FATALE:', err);
  process.exit(1);
});
