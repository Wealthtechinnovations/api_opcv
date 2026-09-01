/**
 * Verdict de la derniere execution de CHAQUE cron de production.
 *
 * POURQUOI. `crontab -l` compte 9 entrees. Savoir qu un cron est planifie ne dit
 * pas s il aboutit : le 2026-08-17, le cron Nigeria s est execute, a produit son
 * CSV, et a echoue a l ecriture parce que MariaDB etait tombee — sans que rien ne
 * le signale ailleurs que dans son propre journal. Ce script lit ces journaux.
 *
 * Il cherche les marqueurs de fin poses par les scripts eux-memes
 * (« TERMINE SANS ERREUR » / « TERMINE AVEC N ERREUR(S) ») et, a defaut, rapporte
 * la fraicheur du fichier et sa fin. Lecture seule : aucun SQL, aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_crons_journaux.js
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = '/var/log';

// Chaque cron, avec le motif de ses journaux. Le motif date (`_AAAAMMJJ`) prime :
// les scripts ecrivent leur detail dedans, le fichier sans date ne recevant que
// la redirection du crontab.
const CRONS = [
  { nom: 'cron_nigeria_weekly',  cadence: 'lundi 10:00',      motifs: [/^africafunds_nigeria_\d{8}\.log$/, /^africafunds_nigeria\.log$/] },
  { nom: 'cron_daily_update',    cadence: 'lun-ven 20:00',    motifs: [/^africafunds_daily_\d{8}\.log$/, /^africafunds_cron\.log$/] },
  { nom: 'cron_daily_eur_usd',   cadence: 'tous les j 21:30', motifs: [/^cron_eur_usd\.log$/] },
  { nom: 'cron_tunisie_daily',   cadence: 'lun-ven 19:00',    motifs: [/^cron_tunisie\.log$/] },
  { nom: 'cron_brvm_daily',      cadence: 'lun-ven 19:30',    motifs: [/^cron_brvm\.log$/] },
  { nom: 'cron_indices_daily',   cadence: 'lun-ven 18:30',    motifs: [/^cron_indices_daily\.log$/] },
  { nom: 'cron_health_check',    cadence: 'tous les j 22:00', motifs: [/^africafunds_health_\d{8}\.log$/, /^africafunds_health\.log$/] },
  { nom: 'sync_production',      cadence: 'toutes les heures',motifs: [/^sync_production\.log$/] },
];

// Les scripts de ce projet n ont pas tous la meme langue de sortie : les crons
// ecrits en bash francais posent « TERMINE AVEC N ERREUR(S) », ceux qui
// enveloppent un scraper Python posent « completed successfully ». La premiere
// version de ce controle ne connaissait que les marqueurs francais et rangeait
// Tunisie, BRVM et indices en « non verifiable » alors qu ils aboutissent tous
// les trois. Un controle qui ne connait qu une convention mesure la convention,
// pas le resultat.
const MARQUEURS = [
  { re: /TERMIN[EÉ]E?\s+AVEC\s+(\d+)\s+ERREUR/i,     verdict: m => `ECHEC — ${m[1]} erreur(s)` },
  { re: /(\d+)\s+PROBLEME\(S\)\s+DETECTE/i,          verdict: m => `ECHEC — ${m[1]} probleme(s)` },
  { re: /TERMIN[EÉ]E?\s+SANS\s+ERREUR/i,              verdict: () => 'OK' },
  { re: /TERMIN[EÉ]E?\s+AVEC\s+SUCC[EÈ]S/i,           verdict: () => 'OK' },
  { re: /completed\s+successfully/i,                   verdict: () => 'OK' },
];

// Un « completed successfully » peut couvrir un lot majoritairement rate : le
// scraper d indices du 2026-08-21 annonce « Echecs scraping: 23 » pour 3 lignes
// inserees, puis sort en succes. Ces motifs sont releves separement et affiches
// a cote du verdict, sans le contredire — le script ne decide pas a la place du
// cron, il montre ce que le cron a tu.
const RESERVES = [
  /Echecs?\s+scraping\s*:\s*([1-9]\d*)/i,
  /(\d+)\s+erreur\(s\)\s+de\s+scraping/i,
];

let fichiers = [];
try {
  fichiers = fs.readdirSync(LOG_DIR);
} catch (e) {
  console.log(`/var/log illisible : ${e.message}`);
  process.exit(0);
}

const age = ms => {
  const h = (Date.now() - ms) / 36e5;
  return h < 48 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} j`;
};

console.log('\n=== VERDICT DE LA DERNIERE EXECUTION DE CHAQUE CRON ===\n');
console.log(`  ${'cron'.padEnd(22)} ${'cadence'.padEnd(20)} ${'journal le plus recent'.padEnd(34)} ${'age'.padStart(8)}  verdict`);
console.log(`  ${'-'.repeat(22)} ${'-'.repeat(20)} ${'-'.repeat(34)} ${'-'.repeat(8)}  ${'-'.repeat(24)}`);

const details = [];
const compte = { ok: 0, echec: 0, inconnu: 0 };

for (const cron of CRONS) {
  let candidats = [];
  for (const motif of cron.motifs) {
    const trouves = fichiers.filter(f => motif.test(f));
    if (trouves.length) { candidats = trouves; break; }
  }
  if (!candidats.length) {
    console.log(`  ${cron.nom.padEnd(22)} ${cron.cadence.padEnd(20)} ${'AUCUN JOURNAL'.padEnd(34)} ${'-'.padStart(8)}  inconnu`);
    compte.inconnu++;
    continue;
  }

  const recent = candidats
    .map(f => ({ f, p: path.join(LOG_DIR, f) }))
    .map(o => { try { return { ...o, m: fs.statSync(o.p).mtimeMs, t: fs.statSync(o.p).size }; } catch { return null; } })
    .filter(Boolean)
    .sort((a, b) => b.m - a.m)[0];

  if (!recent) {
    console.log(`  ${cron.nom.padEnd(22)} ${cron.cadence.padEnd(20)} ${'ILLISIBLE'.padEnd(34)} ${'-'.padStart(8)}  inconnu`);
    compte.inconnu++;
    continue;
  }

  let lignes = [];
  try {
    lignes = fs.readFileSync(recent.p, 'utf8').split('\n');
  } catch (e) {
    console.log(`  ${cron.nom.padEnd(22)} ${cron.cadence.padEnd(20)} ${recent.f.padEnd(34)} ${age(recent.m).padStart(8)}  illisible`);
    compte.inconnu++;
    continue;
  }

  // On remonte depuis la fin : le dernier marqueur rencontre est celui de la
  // derniere execution, meme si le fichier accumule plusieurs passages.
  let verdict = 'aucun marqueur de fin';
  for (let i = lignes.length - 1; i >= 0 && i > lignes.length - 400; i--) {
    let trouve = false;
    for (const mk of MARQUEURS) {
      const m = mk.re.exec(lignes[i]);
      if (m) { verdict = mk.verdict(m); trouve = true; break; }
    }
    if (trouve) break;
  }

  let reserve = '';
  for (let i = lignes.length - 1; i >= 0 && i > lignes.length - 400; i--) {
    for (const re of RESERVES) {
      const m = re.exec(lignes[i]);
      if (m) { reserve = `  (reserve : ${m[0].trim()})`; break; }
    }
    if (reserve) break;
  }

  console.log(`  ${cron.nom.padEnd(22)} ${cron.cadence.padEnd(20)} ${recent.f.padEnd(34)} ${age(recent.m).padStart(8)}  ${verdict}${reserve}`);

  if (verdict === 'OK') compte.ok++;
  else if (verdict.startsWith('ECHEC')) compte.echec++;
  else compte.inconnu++;

  if (verdict.startsWith('ECHEC') || verdict === 'aucun marqueur de fin') {
    details.push({ cron: cron.nom, fichier: recent.p, verdict, fin: lignes.filter(l => l.trim()).slice(-14) });
  }
}

if (details.length) {
  console.log('\n\n=== FIN DES JOURNAUX EN ECHEC OU SANS VERDICT ===');
  for (const d of details) {
    console.log(`\n--- ${d.cron} (${d.verdict}) — ${d.fichier}`);
    for (const l of d.fin) console.log(`  | ${l.slice(0, 200)}`);
  }
}

// Un resume doit distinguer « verifie sain » de « pas verifiable ». La premiere
// version de ce script imprimait « aucun cron en echec » alors qu il n avait
// trouve AUCUN journal : le meme mensonge par omission que celui qu il traque.
console.log(`\n=== RESUME : ${compte.ok} OK · ${compte.echec} en echec · ${compte.inconnu} non verifiable(s) ===`);
if (compte.inconnu > 0) {
  console.log('  « non verifiable » ne veut pas dire « sain » : journal absent, illisible,');
  console.log('  ou sans marqueur de fin. A instruire avant de conclure quoi que ce soit.');
}
if (compte.echec === 0 && compte.inconnu === 0 && compte.ok > 0) {
  console.log('  Tous les crons portent un marqueur de fin sans erreur.');
}

console.log('');
