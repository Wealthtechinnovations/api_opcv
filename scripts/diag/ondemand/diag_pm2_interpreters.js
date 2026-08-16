/**
 * DIAGNOSTIC — avec quel interpreteur Node chaque process PM2 tourne-t-il
 * REELLEMENT (et non ce que declarent les fichiers ecosystem) ?
 *
 * LECTURE SEULE. Aucune ecriture, aucun redemarrage.
 *
 * POURQUOI — RISQUE A LEVER AVANT DE TOUCHER AU FRONTEND
 * -----------------------------------------------------
 * Le build frontend a echoue : `next build` exige Node >= 18.17, le PATH
 * fournit 14.16.0. Node 18 et 20 existent sur la machine
 * (/opt/plesk/node/{18,20,21}, /root/.nvm/...), il « suffirait » donc de
 * construire avec l un d eux.
 *
 * Mais Next.js 14 exige >= 18.17 **au runtime aussi**, pas seulement au build.
 * Or le frontend tourne et sert des HTTP 200 : il n utilise donc pas le node du
 * PATH. Les fichiers ecosystem ne declarent aucun `interpreter`, ce qui veut
 * dire que l information est ailleurs — dans l etat PM2 lui-meme.
 *
 * Si l on reconstruit avec Node 20 et que PM2 redemarre le process avec Node 14,
 * le site casse. Ce diagnostic leve cette inconnue AVANT toute action.
 *
 * Source de verite : le dump PM2 (`~/.pm2/dump.pm2`), qui contient la
 * definition reellement enregistree de chaque process, et `/proc/<pid>/exe`,
 * qui donne le binaire effectivement execute par le process vivant.
 */

const fs = require('fs');
const path = require('path');

const log = t => console.log(t);

log('\n============================================================');
log(' INTERPRETEURS REELS DES PROCESS PM2');
log(' Genere le ' + new Date().toISOString() + ' — LECTURE SEULE');
log('============================================================\n');

// --- A. Definition enregistree dans le dump PM2 ---
log('## A. Definition enregistree (dump PM2)\n');
const dumps = [
  path.join(process.env.HOME || '/root', '.pm2', 'dump.pm2'),
  '/root/.pm2/dump.pm2',
];
let dumpLu = false;
for (const d of dumps) {
  if (dumpLu || !fs.existsSync(d)) continue;
  try {
    const apps = JSON.parse(fs.readFileSync(d, 'utf8'));
    dumpLu = true;
    log(`   source : ${d}\n`);
    for (const a of apps) {
      const env = a.env || {};
      log(`   ${String(a.name).padEnd(24)}`);
      log(`      script           : ${a.script || a.pm_exec_path || '(?)'}`);
      log(`      cwd              : ${a.cwd || a.pm_cwd || '(?)'}`);
      log(`      interpreter      : ${a.interpreter || a.exec_interpreter || '(non precise)'}`);
      log(`      node_args        : ${JSON.stringify(a.node_args || [])}`);
      // Un PATH surcharge dans l env du process est le mecanisme le plus
      // courant pour imposer une autre version de Node.
      const p = env.PATH || env.path;
      if (p) {
        const pertinents = String(p).split(':').filter(x => /node|nvm|plesk/i.test(x));
        log(`      PATH (node)      : ${pertinents.length ? pertinents.join('  ') : '(aucun chemin node specifique)'}`);
      } else {
        log('      PATH             : (absent de l env enregistre)');
      }
      log('');
    }
  } catch (e) {
    log(`   ${d} illisible : ${e.message}`);
  }
}
if (!dumpLu) log('   aucun dump PM2 lisible');

// --- B. Binaire reellement execute par chaque process vivant ---
log('## B. Binaire reellement execute par les process vivants\n');
log('   (lecture de /proc/<pid>/exe — la verite du systeme, pas une declaration)\n');
let procs = [];
try {
  procs = fs.readdirSync('/proc').filter(x => /^\d+$/.test(x));
} catch (e) {
  log(`   /proc illisible : ${e.message}`);
}
let trouves = 0;
for (const pid of procs) {
  let cmd = '';
  try {
    cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim();
  } catch { continue; }
  if (!/africafunds|fundafrique|api-monolith|next|worker-/.test(cmd)) continue;
  let exe = '(illisible)';
  try { exe = fs.readlinkSync(`/proc/${pid}/exe`); } catch { /* droits */ }
  let version = '';
  const m = exe.match(/\/(?:v)?(\d+)\.(\d+)\.(\d+)\//);
  if (m) version = ` -> Node ${m[1]}.${m[2]}.${m[3]}`;
  else if (/plesk\/node\/(\d+)/.test(exe)) version = ` -> Plesk Node ${exe.match(/plesk\/node\/(\d+)/)[1]}`;
  trouves++;
  log(`   pid ${pid.padEnd(8)} exe : ${exe}${version}`);
  log(`   ${' '.repeat(12)} cmd : ${cmd.slice(0, 110)}`);
  log('');
}
if (!trouves) log('   aucun process correspondant visible (droits insuffisants ?)');

// --- C. Le frontend declare-t-il son propre ecosystem ? ---
log('## C. Configuration PM2 cote frontend\n');
const front = '/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend';
let vu = false;
for (const f of ['ecosystem.config.js', 'ecosystem.production.config.js', '.nvmrc', 'package.json']) {
  const p = path.join(front, f);
  if (!fs.existsSync(p)) { log(`   ${f.padEnd(32)} absent`); continue; }
  vu = true;
  if (f === '.nvmrc') {
    log(`   ${f.padEnd(32)} ${fs.readFileSync(p, 'utf8').trim()}`);
  } else if (f === 'package.json') {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    log(`   ${f.padEnd(32)} engines=${JSON.stringify(j.engines || {})}  start=${(j.scripts || {}).start || '(absent)'}`);
  } else {
    const src = fs.readFileSync(p, 'utf8');
    const interp = [...src.matchAll(/interpreter\s*:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
    log(`   ${f.padEnd(32)} interpreter=${interp.length ? interp.join(', ') : '(non precise)'}`);
  }
}
if (!vu) log('   (aucun fichier de configuration cote frontend)');

log('\n============================================================');
log(' FIN — aucune ecriture, aucun redemarrage.');
log('============================================================\n');
