/**
 * DIAGNOSTIC — quelles versions de Node.js sont installees sur le serveur,
 * et laquelle est utilisee par quoi.
 *
 * LECTURE SEULE. Aucune ecriture, aucune modification de configuration.
 *
 * POURQUOI
 * --------
 * Le deploiement du frontend a echoue le 2026-08-16 :
 *
 *     > next build
 *     You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
 *
 * Le `git pull` avait reussi (docs uniquement) et PM2 n a PAS ete redemarre —
 * `set -e` a interrompu le script avant. Aucune regression, mais le frontend
 * reste fige : son bundle date d avant le 3 juillet.
 *
 * Or l API tourne en production avec des dependances modernes, et le lot C
 * mentionne un passage en Node 18. Une version recente existe donc sur cette
 * machine, mais pas dans le PATH du shell de deploiement.
 *
 * Ce script localise les runtimes disponibles pour que le build puisse etre
 * lance avec le bon, sans rien installer ni modifier.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function ligne(t) { console.log(t); }

function versionDe(bin) {
  try {
    return execFileSync(bin, ['--version'], { encoding: 'utf8', timeout: 5000 }).trim();
  } catch (e) {
    return `(illisible : ${e.code || e.message})`;
  }
}

function estExecutable(p) {
  try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; }
}

ligne('\n============================================================');
ligne(' RUNTIMES NODE.JS DISPONIBLES SUR LE SERVEUR');
ligne(' Genere le ' + new Date().toISOString() + ' — LECTURE SEULE');
ligne('============================================================\n');

ligne('## A. Runtime qui execute ce script\n');
ligne(`   process.version : ${process.version}`);
ligne(`   process.execPath: ${process.execPath}`);
ligne(`   PATH            : ${(process.env.PATH || '').split(':').slice(0, 12).join('  ')}`);

ligne('\n## B. Emplacements standards\n');
const candidats = [
  '/usr/bin/node', '/usr/local/bin/node', '/opt/node/bin/node',
  '/usr/local/n/versions/node', // n
];
for (const c of candidats) {
  if (fs.existsSync(c)) {
    const st = fs.statSync(c);
    if (st.isDirectory()) {
      const vs = fs.readdirSync(c).sort();
      ligne(`   ${c.padEnd(34)} repertoire : ${vs.join(', ')}`);
    } else {
      ligne(`   ${c.padEnd(34)} ${versionDe(c)}`);
    }
  } else {
    ligne(`   ${c.padEnd(34)} absent`);
  }
}

ligne('\n## C. Node livre par Plesk (le chemin /var/www/vhosts indique un Plesk)\n');
const plesk = '/opt/plesk/node';
if (fs.existsSync(plesk)) {
  for (const v of fs.readdirSync(plesk).sort()) {
    const bin = path.join(plesk, v, 'bin', 'node');
    ligne(`   ${bin.padEnd(46)} ${estExecutable(bin) ? versionDe(bin) : 'non executable'}`);
  }
} else {
  ligne('   /opt/plesk/node absent');
}

ligne('\n## D. nvm\n');
const nvmDirs = [
  path.join(process.env.HOME || '/root', '.nvm', 'versions', 'node'),
  '/usr/local/nvm/versions/node',
];
let nvmTrouve = false;
for (const d of nvmDirs) {
  if (fs.existsSync(d)) {
    nvmTrouve = true;
    for (const v of fs.readdirSync(d).sort()) {
      const bin = path.join(d, v, 'bin', 'node');
      ligne(`   ${bin.padEnd(58)} ${estExecutable(bin) ? versionDe(bin) : 'non executable'}`);
    }
  }
}
if (!nvmTrouve) ligne('   aucun repertoire nvm trouve');

ligne('\n## E. Avec quel interpreteur PM2 lance-t-il chaque process ?\n');
ligne('   (source : le fichier de configuration PM2 du depot, pas le process en cours)\n');
const racine = path.resolve(__dirname, '../../..');
for (const f of ['ecosystem.production.config.js', 'ecosystem.config.js']) {
  const p = path.join(racine, f);
  if (!fs.existsSync(p)) { ligne(`   ${f.padEnd(36)} absent`); continue; }
  const src = fs.readFileSync(p, 'utf8');
  const interp = [...src.matchAll(/interpreter\s*:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const noms = [...src.matchAll(/name\s*:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  ligne(`   ${f}`);
  ligne(`      process declares : ${noms.join(', ') || '(aucun)'}`);
  ligne(`      interpreter      : ${interp.length ? interp.join(', ') : '(non precise — PM2 utilise le node du PATH)'}`);
}

ligne('\n## F. Contrainte declaree par le frontend\n');
const pkg = '/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/package.json';
if (fs.existsSync(pkg)) {
  const j = JSON.parse(fs.readFileSync(pkg, 'utf8'));
  ligne(`   name           : ${j.name}@${j.version}`);
  ligne(`   engines        : ${JSON.stringify(j.engines || {}) }`);
  ligne(`   next           : ${(j.dependencies && j.dependencies.next) || '(absent)'}`);
  ligne(`   script build   : ${(j.scripts && j.scripts.build) || '(absent)'}`);
} else {
  ligne('   package.json du frontend illisible depuis ce script');
}

ligne('\n============================================================');
ligne(' FIN — aucune ecriture, aucune modification de configuration.');
ligne('============================================================\n');
