#!/usr/bin/env node
/**
 * worker-scheduler.js
 *
 * PM2 dedicated process that replaces crontab Linux scheduling.
 * Manages scheduled tasks using a simple interval-based approach.
 *
 * PM2 config:
 *   pm2 start src/workers/worker-scheduler.js --name worker-scheduler
 *
 * This worker does NOT replace crontab immediately — it runs in parallel
 * and can be switched over gradually by disabling crontab entries.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const API_DIR = path.resolve(__dirname, '../..');
const LOG_DIR = process.env.SCHEDULER_LOG_DIR || '/var/log';
const API_URL = process.env.API_URL || 'http://localhost:3005';

const TASKS = [
  {
    name: 'daily-update',
    description: 'Scrape ASFIM + forex + recalc VL ajuste + perf + classements',
    script: 'scripts/cron/cron_daily_update.sh',
    schedule: { hour: 20, minute: 0, daysOfWeek: [1, 2, 3, 4, 5] },
    timeout: 1800000,
    enabled: false,
  },
  {
    name: 'daily-eur-usd',
    description: 'Recalcul performances EUR/USD + classements',
    script: 'scripts/cron/cron_daily_eur_usd.sh',
    schedule: { hour: 21, minute: 30 },
    timeout: 600000,
    enabled: false,
  },
  {
    name: 'nigeria-weekly',
    description: 'SEC Nigeria import + recalc',
    script: 'scripts/cron/cron_nigeria_weekly.sh',
    schedule: { hour: 10, minute: 0, daysOfWeek: [1] },
    timeout: 3600000,
    enabled: false,
  },
  {
    name: 'cron-health-check',
    description: 'Check cron health',
    script: 'scripts/monitoring/check_cron_health.js',
    schedule: { hour: 8, minute: 0 },
    timeout: 60000,
    enabled: true,
    runner: 'node',
  },
];

let running = true;
const lastRun = {};

function shouldRunNow(task) {
  if (!task.enabled) return false;

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay();

  if (hour !== task.schedule.hour || minute !== task.schedule.minute) return false;
  if (task.schedule.daysOfWeek && !task.schedule.daysOfWeek.includes(dayOfWeek)) return false;

  const today = now.toISOString().split('T')[0];
  const key = `${task.name}-${today}-${hour}-${minute}`;
  if (lastRun[key]) return false;

  lastRun[key] = true;
  return true;
}

function runTask(task) {
  const logFile = path.join(LOG_DIR, `scheduler_${task.name}_${new Date().toISOString().split('T')[0]}.log`);
  const scriptPath = path.join(API_DIR, task.script);

  if (!fs.existsSync(scriptPath)) {
    console.error(`[SCHEDULER] Script introuvable: ${scriptPath}`);
    return;
  }

  const runner = task.runner || 'bash';
  console.log(`[SCHEDULER] Lancement: ${task.name} (${runner} ${task.script})`);

  const child = execFile(runner, [scriptPath], {
    cwd: API_DIR,
    timeout: task.timeout,
    env: { ...process.env, API_URL },
  }, (error, stdout, stderr) => {
    const status = error ? 'ECHEC' : 'OK';
    console.log(`[SCHEDULER] ${task.name}: ${status} (${error ? error.message : 'success'})`);

    try {
      const logContent = `=== ${task.name} — ${new Date().toISOString()} — ${status} ===\n${stdout}\n${stderr}\n`;
      fs.appendFileSync(logFile, logContent);
    } catch (e) {
      console.error(`[SCHEDULER] Erreur ecriture log: ${e.message}`);
    }
  });
}

async function main() {
  console.log('[SCHEDULER] Worker scheduler demarre');
  console.log(`[SCHEDULER] ${TASKS.filter(t => t.enabled).length}/${TASKS.length} taches activees`);
  TASKS.forEach(t => {
    const days = t.schedule.daysOfWeek ? t.schedule.daysOfWeek.join(',') : '*';
    const status = t.enabled ? 'ON' : 'OFF';
    console.log(`  [${status}] ${t.name}: ${String(t.schedule.hour).padStart(2, '0')}:${String(t.schedule.minute).padStart(2, '0')} jours=${days}`);
  });

  while (running) {
    for (const task of TASKS) {
      if (shouldRunNow(task)) {
        runTask(task);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  console.log('[SCHEDULER] Worker arrete.');
}

process.on('SIGTERM', () => { running = false; });
process.on('SIGINT', () => { running = false; });

main().catch(err => {
  console.error('ERREUR FATALE:', err);
  process.exit(1);
});
