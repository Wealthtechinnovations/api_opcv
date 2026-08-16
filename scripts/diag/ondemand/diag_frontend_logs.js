/**
 * INCIDENT — pourquoi fundafrique-frontend est-il en boucle de crash ?
 *
 * LECTURE SEULE. Aucun redemarrage, aucune ecriture.
 *
 * Contexte : le 2026-08-16, apres un build reussi (Compiled successfully,
 * Node 18.20.8) et un `pm2 restart`, le process passe en `errored`, PID 0,
 * compteur de redemarrages en hausse continue. Le site renvoie 503.
 * Aucun outil MCP ne lit les logs de ce projet : on lit donc directement les
 * fichiers de log de PM2.
 */

const fs = require('fs');
const path = require('path');

const log = t => console.log(t);
const LOGS = path.join(process.env.HOME || '/root', '.pm2', 'logs');

function queue(fichier, n) {
  try {
    const txt = fs.readFileSync(fichier, 'utf8');
    const lignes = txt.split('\n').filter(Boolean);
    return lignes.slice(-n);
  } catch (e) {
    return [`(illisible : ${e.message})`];
  }
}

log('\n============================================================');
log(' INCIDENT FRONTEND — LOGS PM2');
log(' Genere le ' + new Date().toISOString() + ' — LECTURE SEULE');
log('============================================================\n');

if (!fs.existsSync(LOGS)) {
  log(`   Repertoire ${LOGS} introuvable`);
} else {
  const fichiers = fs.readdirSync(LOGS).filter(f => /fundafrique/i.test(f));
  if (!fichiers.length) log(`   Aucun fichier de log fundafrique dans ${LOGS}`);
  for (const f of fichiers) {
    const p = path.join(LOGS, f);
    let taille = 0, mtime = '';
    try { const st = fs.statSync(p); taille = st.size; mtime = st.mtime.toISOString(); } catch {}
    log(`\n## ${f}  (${(taille / 1024).toFixed(1)} Ko, modifie ${mtime})\n`);
    for (const l of queue(p, 45)) log('   ' + l.slice(0, 240));
  }
}

// Le repertoire de build est-il complet ? Un .next tronque par un build
// interrompu est la cause la plus probable d un `next start` qui echoue.
log('\n## Etat du repertoire de build .next\n');
const front = '/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend';
const next = path.join(front, '.next');
if (!fs.existsSync(next)) {
  log('   .next ABSENT — le build n a pas produit de sortie');
} else {
  const attendus = ['BUILD_ID', 'build-manifest.json', 'prerender-manifest.json',
                    'routes-manifest.json', 'server', 'static'];
  for (const a of attendus) {
    const p = path.join(next, a);
    if (fs.existsSync(p)) {
      const st = fs.statSync(p);
      log(`   ${a.padEnd(26)} present  ${st.isDirectory() ? '(repertoire)' : st.size + ' octets'}  ${st.mtime.toISOString()}`);
    } else {
      log(`   ${a.padEnd(26)} ABSENT`);
    }
  }
  try {
    log(`\n   BUILD_ID : ${fs.readFileSync(path.join(next, 'BUILD_ID'), 'utf8').trim()}`);
  } catch { /* deja signale */ }
}

log('\n============================================================');
log(' FIN — aucune ecriture.');
log('============================================================\n');
