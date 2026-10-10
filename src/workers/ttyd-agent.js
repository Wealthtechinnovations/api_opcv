#!/usr/bin/env node
/**
 * ttyd-agent.js
 *
 * Menu-driven shell agent for ttyd web terminal.
 * Replaces free shell access with a controlled set of commands.
 *
 * Security:
 *   - No free shell — only whitelisted commands
 *   - All actions logged to /var/log/ttyd-agent.log
 *   - Dangerous patterns blocked (rm -rf, DROP, TRUNCATE, etc.)
 *
 * Deployment:
 *   ttyd -p 7682 -c admin:STRONG_PASSWORD node src/workers/ttyd-agent.js
 *
 * Nginx config (restrict IP):
 *   location /terminal/ {
 *     allow YOUR_IP;
 *     deny all;
 *     auth_basic "Terminal";
 *     auth_basic_user_file /etc/nginx/ttyd_htpasswd;
 *     proxy_pass http://127.0.0.1:7682;
 *   }
 */

const { execSync, spawnSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const API_DIR = '/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api';
const LOG_FILE = process.env.TTYD_LOG || '/var/log/ttyd-agent.log';

const BLOCKED_PATTERNS = [
  /rm\s+(-rf?|--recursive)/i,
  /DROP\s+(TABLE|DATABASE)/i,
  /TRUNCATE/i,
  /DELETE\s+FROM/i,
  /git\s+push/i,
  /vim\s+.*\.env/i,
  /nano\s+.*\.env/i,
  /cat\s+.*\.env/i,
  /\.env/,
  /password/i,
  /secret/i,
  /credential/i,
];

const COMMANDS = {
  '1': { label: 'PM2 status', cmd: 'pm2 status' },
  '2': { label: 'PM2 logs (derniers 50)', cmd: 'pm2 logs --nostream --lines 50' },
  '3': { label: 'PM2 restart api-monolith', cmd: 'pm2 restart api-monolith', confirm: true },
  '4': { label: 'Health check API', cmd: 'curl -s http://localhost:3005/health | python3 -m json.tool' },
  '5': { label: 'Health check detaille', cmd: 'curl -s http://localhost:3005/health/detailed | python3 -m json.tool' },
  '6': { label: 'Derniers logs cron', cmd: `ls -lt /var/log/africafunds_*.log 2>/dev/null | head -5 && echo '---' && tail -30 /var/log/africafunds_cron.log 2>/dev/null || echo 'Pas de log cron'` },
  '7': { label: 'Git status API', cmd: `cd ${API_DIR} && git status --short && git log --oneline -5` },
  '8': { label: 'Git status Frontend', cmd: `cd ${API_DIR}/../frontend && git status --short && git log --oneline -5` },
  '9': { label: 'Disk usage', cmd: 'df -h / && echo "---" && du -sh /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/*' },
  '10': { label: 'MySQL connections', cmd: `mysql -u fund_opcvm -p"$DB_PASSWORD" fund_opcvm -e "SHOW PROCESSLIST" 2>/dev/null || echo "Pas de connexion MySQL directe"` },
  '11': { label: 'Diagnostics cron health', cmd: `cd ${API_DIR} && node scripts/monitoring/check_cron_health.js 2>&1 | tail -40` },
  '12': { label: 'Recalc dashboard', cmd: 'curl -s http://localhost:3005/api/admin/recalc/dashboard | python3 -m json.tool 2>/dev/null || echo "Endpoint indisponible"' },
  '13': { label: 'Nginx status', cmd: 'systemctl status nginx --no-pager -l 2>/dev/null | head -15 || service nginx status 2>/dev/null' },
  '14': { label: 'Memory / CPU', cmd: 'free -h && echo "---" && uptime && echo "---" && top -bn1 | head -15' },
  '15': { label: 'Tail API error log', cmd: `pm2 logs api-monolith --err --nostream --lines 30` },
};

function log(action, detail) {
  const entry = `${new Date().toISOString()} | ${action} | ${detail}\n`;
  try {
    fs.appendFileSync(LOG_FILE, entry);
  } catch (e) {
    // Log directory may not be writable in dev
  }
}

function isSafe(input) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) return false;
  }
  return true;
}

function executeCommand(cmd) {
  try {
    const result = spawnSync('bash', ['-c', cmd], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
      encoding: 'utf-8',
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    return result.status === 0;
  } catch (err) {
    console.error(`Erreur: ${err.message}`);
    return false;
  }
}

function printMenu() {
  console.log('\n========================================');
  console.log('  AFRICAFUNDS — Terminal de controle');
  console.log('========================================\n');
  for (const [key, cmd] of Object.entries(COMMANDS)) {
    const warn = cmd.confirm ? ' [!]' : '';
    console.log(`  ${key.padStart(2)}. ${cmd.label}${warn}`);
  }
  console.log('\n   q. Quitter\n');
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  log('SESSION_START', `pid=${process.pid}`);
  printMenu();

  const ask = () => {
    rl.question('> ', async (answer) => {
      const input = answer.trim();

      if (input === 'q' || input === 'quit' || input === 'exit') {
        log('SESSION_END', 'quit');
        console.log('Session terminee.');
        rl.close();
        process.exit(0);
      }

      if (input === 'help' || input === 'menu' || input === '?') {
        printMenu();
        ask();
        return;
      }

      const cmd = COMMANDS[input];
      if (!cmd) {
        console.log('Commande inconnue. Tapez "menu" pour voir les options.');
        ask();
        return;
      }

      if (!isSafe(cmd.cmd)) {
        console.log('BLOQUE: commande potentiellement dangereuse.');
        log('BLOCKED', cmd.label);
        ask();
        return;
      }

      if (cmd.confirm) {
        rl.question(`Confirmer "${cmd.label}" ? (o/n) `, (resp) => {
          if (resp.trim().toLowerCase() === 'o' || resp.trim().toLowerCase() === 'y') {
            log('EXECUTE', cmd.label);
            console.log(`\n--- ${cmd.label} ---\n`);
            executeCommand(cmd.cmd);
            console.log('\n--- Fin ---');
          } else {
            console.log('Annule.');
          }
          ask();
        });
        return;
      }

      log('EXECUTE', cmd.label);
      console.log(`\n--- ${cmd.label} ---\n`);
      executeCommand(cmd.cmd);
      console.log('\n--- Fin ---');
      ask();
    });
  };

  ask();
}

main();
