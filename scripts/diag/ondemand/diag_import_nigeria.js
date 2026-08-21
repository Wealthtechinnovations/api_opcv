/**
 * Pourquoi l import Nigeria ne produit plus de VL depuis le 2026-08-10.
 *
 * Lecture seule : journaux du cron, artefacts d extraction, cache de
 * telechargement. Aucune ecriture, aucune requete SQL.
 *
 * USAGE  node scripts/diag/ondemand/diag_import_nigeria.js
 */
const fs = require('fs');
const path = require('path');

const API_DIR = path.resolve(__dirname, '../../..');

const ko = (s) => console.log(`  ABSENT  ${s}`);

function taille(p) {
  try {
    const st = fs.statSync(p);
    return `${st.size} o, modifie le ${st.mtime.toISOString().slice(0, 19).replace('T', ' ')}`;
  } catch { return null; }
}

console.log('\n=== IMPORT NIGERIA — POURQUOI PLUS AUCUNE VL DEPUIS LE 2026-08-10 ===\n');

console.log('[1] Journaux du cron hebdomadaire (/var/log/africafunds_nigeria_*.log)');
let logs = [];
try {
  logs = fs.readdirSync('/var/log')
    .filter(f => f.startsWith('africafunds_nigeria_'))
    .sort()
    .slice(-6);
} catch (e) {
  console.log(`  illisible : ${e.message}`);
}
if (!logs.length) console.log('  aucun journal trouve');
for (const f of logs) console.log(`  ${f}  (${taille(path.join('/var/log', f))})`);

if (logs.length) {
  const dernier = path.join('/var/log', logs[logs.length - 1]);
  console.log(`\n[2] Fin du dernier journal — ${dernier}`);
  try {
    const lignes = fs.readFileSync(dernier, 'utf8').split('\n');
    for (const l of lignes.slice(-45)) console.log(`  | ${l}`);
  } catch (e) {
    console.log(`  illisible : ${e.message}`);
  }
} else {
  console.log('\n[2] Fin du dernier journal — rien a lire');
}

console.log('\n[3] Artefacts d extraction attendus a la racine du depot');
for (const f of ['sec_ng_latest.csv', 'sec_ng_audit_latest.csv', 'sec_ng_coherence_latest.csv',
                 'sec_ng_coverage_latest.csv', 'sec_ng_fuzzy_latest.csv', 'sec_ng_nav_extractor_v6.py']) {
  const t = taille(path.join(API_DIR, f));
  if (t) {
    let n = '';
    if (f.endsWith('.csv')) {
      try { n = ` — ${fs.readFileSync(path.join(API_DIR, f), 'utf8').split('\n').filter(Boolean).length} lignes`; } catch {}
    }
    console.log(`  present ${f.padEnd(32)} ${t}${n}`);
  } else ko(f);
}

console.log('\n[4] Cache de telechargement sec_ng_downloads/');
const cache = path.join(API_DIR, 'sec_ng_downloads');
try {
  const fichiers = fs.readdirSync(cache);
  const recents = fichiers
    .map(f => ({ f, m: fs.statSync(path.join(cache, f)).mtime }))
    .sort((a, b) => b.m - a.m)
    .slice(0, 8);
  console.log(`  ${fichiers.length} fichiers. Les plus recents :`);
  for (const r of recents) console.log(`    ${r.m.toISOString().slice(0, 10)}  ${r.f}`);
} catch (e) {
  console.log(`  illisible : ${e.message}`);
}

console.log('\n[5] Le contrat d ecriture est-il cable dans l importeur ?');
const imp = path.join(API_DIR, 'scripts/import/import_vl_nigeria_sec.js');
try {
  const src = fs.readFileSync(imp, 'utf8');
  console.log(`  require(vl_contract) : ${src.includes("require('../../src/lib/vl_contract')") ? 'OUI' : 'NON'}`);
  console.log(`  ecrit currency_code  : ${/currency_code,\s*price_type/.test(src) ? 'OUI' : 'NON'}`);
} catch (e) {
  console.log(`  ${imp} illisible : ${e.message}`);
}

console.log('\n[6] Dependances Python de l extracteur');
const { execFileSync } = require('child_process');
for (const mod of ['requests', 'bs4', 'openpyxl', 'dateutil']) {
  try {
    execFileSync('python3', ['-c', `import ${mod}`], { stdio: 'pipe' });
    console.log(`  present ${mod}`);
  } catch {
    console.log(`  ABSENT  ${mod}  <- l extraction echoue sans lui`);
  }
}
try {
  console.log(`  python3 : ${execFileSync('python3', ['--version'], { encoding: 'utf8' }).trim()}`);
} catch (e) { console.log(`  python3 introuvable : ${e.message}`); }
try {
  execFileSync('which', ['libreoffice'], { stdio: 'pipe' });
  console.log('  present libreoffice (conversion .xls -> .xlsx)');
} catch { console.log('  ABSENT  libreoffice  <- les .xls anciens ne seront pas lus'); }


console.log('\n[7] Version des scripts cron reellement deployee sur le serveur');
// Le journal du 2026-08-17 montre « [5a/8] ERREUR (HTTP {json}500) » : le corps de
// la reponse et le code HTTP melanges, signature de l ancien run_curl a substitution
// de processus. Et « [4/8] OK » juste apres une erreur fatale, signature de l ancien
// run_step qui lisait le code de `tee`. Ce controle verifie que les versions corrigees
// au lot AD sont bien celles que cron executera lundi prochain.
const crons = ['cron_daily_update.sh', 'cron_nigeria_weekly.sh', 'cron_daily_eur_usd.sh', 'cron_health_check.sh'];
for (const c of crons) {
  const p = path.join(API_DIR, 'scripts/cron', c);
  try {
    const src = fs.readFileSync(p, 'utf8');
    const pipestatus = src.includes('PIPESTATUS[0]');
    const curlTemp = src.includes('body=$(mktemp)');
    const exitCode = /exit \$\(\(\s*ERRORS/.test(src);
    console.log(`  ${c.padEnd(26)} PIPESTATUS:${pipestatus ? 'oui' : 'NON'}  curl-temp:${curlTemp ? 'oui' : 'NON'}  exit-code:${exitCode ? 'oui' : 'NON'}`);
  } catch (e) {
    console.log(`  ${c.padEnd(26)} illisible : ${e.message}`);
  }
}

console.log('\n[8] Entrees crontab actives');
try {
  const out = execFileSync('crontab', ['-l'], { encoding: 'utf8' });
  for (const l of out.split('\n')) {
    if (l.trim() && !l.trim().startsWith('#')) console.log(`  ${l}`);
  }
} catch (e) {
  console.log(`  crontab illisible : ${e.message}`);
}

console.log('');
