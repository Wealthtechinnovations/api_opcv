#!/usr/bin/env node
/**
 * worker-data-import.js
 *
 * PM2 process for running data import tasks (ASFIM, Nigeria, forex).
 * Triggered by worker-scheduler or manual admin API calls.
 * Uses the same recalc_jobs table with import-specific job types.
 *
 * PM2 config:
 *   pm2 start src/workers/worker-data-import.js --name worker-data-import
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { execFile } = require('child_process');
const path = require('path');

const API_DIR = path.resolve(__dirname, '../..');
const WORKER_ID = process.env.WORKER_ID || `import-${process.pid}`;
const POLL_INTERVAL = parseInt(process.env.IMPORT_POLL_INTERVAL) || 30000;
const API_URL = process.env.API_URL || 'http://localhost:3005';

let running = true;

const IMPORT_TASKS = {
  'asfim-daily': {
    description: 'Scrape ASFIM VL Maroc (5 derniers jours)',
    runner: 'node',
    script: 'scripts/import/scrape_asfim_import.js',
    args: () => {
      const start = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return [start, today];
    },
    timeout: 300000,
  },
  'forex-daily': {
    description: 'Mise a jour forex du jour',
    runner: 'node',
    script: 'scripts/import/scrape_forex_import.js',
    args: () => ['today'],
    timeout: 120000,
  },
  'nigeria-weekly': {
    description: 'Import SEC Nigeria (annee courante)',
    runner: 'bash',
    script: 'scripts/cron/cron_nigeria_weekly.sh',
    args: () => [],
    timeout: 3600000,
  },
};

function runImportTask(taskName) {
  const task = IMPORT_TASKS[taskName];
  if (!task) {
    return Promise.resolve({ success: false, detail: `Tache inconnue: ${taskName}` });
  }

  return new Promise((resolve) => {
    const scriptPath = path.join(API_DIR, task.script);
    const args = [scriptPath, ...task.args()];
    console.log(`[${WORKER_ID}] Lancement: ${taskName} (${task.runner} ${task.script})`);

    execFile(task.runner, args, {
      cwd: API_DIR,
      timeout: task.timeout,
      env: { ...process.env, API_URL },
    }, (error, stdout, stderr) => {
      const success = !error;
      const lines = stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1] || '';
      console.log(`[${WORKER_ID}] ${taskName}: ${success ? 'OK' : 'ECHEC'} — ${lastLine.substring(0, 200)}`);
      if (error) console.error(`[${WORKER_ID}] Erreur:`, error.message);
      resolve({ success, detail: lastLine.substring(0, 500), error: error ? error.message : null });
    });
  });
}

async function main() {
  console.log(`[${WORKER_ID}] Worker data-import demarre`);
  console.log(`[${WORKER_ID}] Taches disponibles: ${Object.keys(IMPORT_TASKS).join(', ')}`);
  console.log(`[${WORKER_ID}] En attente de commandes via recalc_jobs (type IMPORT_*) ou API`);

  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch (e) {
    console.error(`[${WORKER_ID}] mysql2 non disponible, mode standalone uniquement`);
    while (running) await sleep(60000);
    return;
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'fund_opcvm',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'fund_opcvm',
    charset: 'utf8mb4',
    connectionLimit: 2,
  });

  while (running) {
    try {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [jobs] = await conn.query(`
          SELECT * FROM recalc_jobs
          WHERE status = 'PENDING' AND job_type LIKE 'IMPORT_%'
            AND attempts < max_attempts
          ORDER BY priority ASC, created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `);

        if (jobs.length === 0) {
          await conn.rollback();
          conn.release();
          await sleep(POLL_INTERVAL);
          continue;
        }

        const job = jobs[0];
        await conn.query(`
          UPDATE recalc_jobs SET status = 'RUNNING', locked_by = ?, locked_at = NOW(),
                 started_at = NOW(), attempts = attempts + 1
          WHERE id = ?
        `, [WORKER_ID, job.id]);
        await conn.commit();
        conn.release();

        const taskMap = {
          'IMPORT_ASFIM': 'asfim-daily',
          'IMPORT_FOREX': 'forex-daily',
          'IMPORT_NIGERIA': 'nigeria-weekly',
        };

        const taskName = taskMap[job.job_type];
        const startTime = Date.now();
        let result;

        if (taskName) {
          result = await runImportTask(taskName);
        } else {
          result = { success: false, detail: `Type import inconnu: ${job.job_type}` };
        }

        const elapsed = Date.now() - startTime;
        if (result.success) {
          await pool.query(`
            UPDATE recalc_jobs SET status = 'COMPLETED', completed_at = NOW(),
                   execution_time_ms = ?, locked_by = NULL, locked_at = NULL
            WHERE id = ?
          `, [elapsed, job.id]);
        } else {
          await pool.query(`
            UPDATE recalc_jobs SET status = 'FAILED', error_message = ?,
                   execution_time_ms = ?, locked_by = NULL, locked_at = NULL
            WHERE id = ?
          `, [(result.error || result.detail).substring(0, 2000), elapsed, job.id]);
        }

        console.log(`[${WORKER_ID}] Job #${job.id} ${job.job_type}: ${result.success ? 'OK' : 'ECHEC'} (${elapsed}ms)`);

      } catch (err) {
        try { await conn.rollback(); } catch (_) {}
        conn.release();
        throw err;
      }
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) {
        await sleep(POLL_INTERVAL * 2);
        continue;
      }
      console.error(`[${WORKER_ID}] Erreur:`, err.message);
      await sleep(POLL_INTERVAL);
    }
  }

  await pool.end();
  console.log(`[${WORKER_ID}] Worker arrete.`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

process.on('SIGTERM', () => { running = false; });
process.on('SIGINT', () => { running = false; });

module.exports = { runImportTask, IMPORT_TASKS };

if (require.main === module) {
  main().catch(err => {
    console.error('ERREUR FATALE:', err);
    process.exit(1);
  });
}
