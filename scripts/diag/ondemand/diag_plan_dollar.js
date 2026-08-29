/**
 * Ce que l OPTION DOLLAR coute reellement, fonds par fonds.
 *
 * DECISION PRISE (utilisateur, 2026-08-29) : les fonds Nigeria libelles en
 * dollars passent en USD, serie entiere reecrite depuis la colonne dollar de la
 * source SEC — lue, jamais convertie.
 *
 * CE QUE LA MESURE PRECEDENTE OBLIGE A VERIFIER AVANT D ECRIRE. Le rejeu du
 * 2026-08-28 a compare 40 826 lignes : 27 077 etaient IDENTIQUES a la base. Pour
 * ces semaines-la, l extracteur a donc lu du NAIRA — la SEC ne publiait pas de
 * colonne dollar ce jour-la (le fichier du 10 avril, par exemple, en compte 28
 * au lieu de 111). Seules 306 lignes portent une valeur USD divergente.
 *
 * Une serie dollar coherente ne peut pas garder ces semaines en naira : ce
 * serait exactement le melange d echelles que l on cherche a supprimer. Elles
 * devront donc etre RETIREES — un trou vaut mieux qu une valeur fausse, et
 * mieux qu une valeur convertie que personne n a publiee.
 *
 * Ce diagnostic chiffre ce cout AVANT toute ecriture : par fonds, combien de
 * semaines seraient reecrites en dollars, combien n ont aucune source dollar et
 * deviendraient des trous, et ce qu il resterait de la serie.
 *
 * LECTURE SEULE — uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_plan_dollar.js [chemin_csv]
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { normalizeNameForMatch, lireCSV } = require('../../../src/lib/sec_csv');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const CSV = process.argv[2] || path.resolve(__dirname, '../../../sec_ng_replay.csv');

const j = x => {
  if (!x) return '?';
  if (x instanceof Date) {
    const p = k => String(k).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  return String(x).slice(0, 10);
};

(async () => {
  if (!fs.existsSync(CSV)) {
    console.log(`\nCSV de rejeu introuvable : ${CSV}\n`);
    return;
  }

  const conn = await mysql.createConnection(DB);
  try {
    console.log('\n=== OPTION DOLLAR — COUT MESURE AVANT ECRITURE ===');
    console.log(`Mesure le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — LECTURE SEULE\n`);

    const { lignes } = lireCSV(CSV);

    const [fonds] = await conn.query(`
      SELECT id, nom_fond, dev_libelle FROM fond_investissements
       WHERE LOWER(pays) = 'nigeria' AND active = 1
    `);
    const parNom = new Map();
    for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);

    // Le CSV, regroupe par fonds puis par date, avec la devise que l extracteur
    // a retenue pour chaque semaine.
    const csvParFonds = new Map();
    for (const l of lignes) {
      const f = parNom.get(normalizeNameForMatch(l.fund_name_clean || ''));
      if (!f) continue;
      const date = j(l.valuation_date);
      const prix = parseFloat(l.vl_price);
      if (date === '?' || !Number.isFinite(prix) || prix <= 0) continue;
      if (!csvParFonds.has(f.id)) csvParFonds.set(f.id, new Map());
      csvParFonds.get(f.id).set(date, { prix, devise: (l.vl_currency_code || '').toUpperCase() });
    }

    // Les fonds concernes : ceux pour lesquels la source publie AU MOINS une
    // mesure en dollars. C est le critere factuel, pas le nom du fonds.
    const concernes = [];
    for (const [id, dates] of csvParFonds.entries()) {
      const usd = [...dates.values()].filter(d => d.devise === 'USD').length;
      if (usd > 0) concernes.push({ id, usdDansCsv: usd });
    }
    console.log(`Fonds pour lesquels la SEC publie au moins une mesure en dollars : ${concernes.length}\n`);

    // Les VL en base pour ces fonds, sur la periode couverte par le CSV.
    const ids = concernes.map(c => c.id);
    if (!ids.length) { console.log('Aucun fonds concerne.\n'); return; }

    const [vls] = await conn.query(`
      SELECT v.fund_id, DATE_FORMAT(v.date, '%Y-%m-%d') AS date, v.value
        FROM valorisations v
       WHERE v.fund_id IN (?) AND v.value > 0
    `, [ids]);

    const bornes = [...csvParFonds.values()]
      .flatMap(m => [...m.keys()]);
    const dmin = bornes.reduce((a, b) => (a < b ? a : b));
    const dmax = bornes.reduce((a, b) => (a > b ? a : b));
    console.log(`Periode couverte par le rejeu : ${dmin} -> ${dmax}`);
    console.log('Les VL hors de cette periode ne sont pas jugees ici — le rejeu ne les couvre pas.\n');

    const parFonds = new Map();
    for (const v of vls) {
      if (v.date < dmin || v.date > dmax) continue;
      if (!parFonds.has(v.fund_id)) parFonds.set(v.fund_id, []);
      parFonds.get(v.fund_id).push(v);
    }

    let totalReecrites = 0;
    let totalTrous = 0;
    let totalHorsCsv = 0;
    let totalVL = 0;
    const detail = [];

    for (const c of concernes) {
      const f = fonds.find(x => x.id === c.id);
      const enBase = parFonds.get(c.id) || [];
      const csv = csvParFonds.get(c.id);

      let reecrites = 0;   // la source donne un dollar -> on ecrit
      let trous = 0;       // la source donne du naira -> a retirer
      let horsCsv = 0;     // la date n est pas dans le rejeu du tout

      for (const v of enBase) {
        const s = csv.get(v.date);
        if (!s) { horsCsv++; continue; }
        if (s.devise === 'USD') reecrites++;
        else trous++;
      }

      totalReecrites += reecrites;
      totalTrous += trous;
      totalHorsCsv += horsCsv;
      totalVL += enBase.length;

      detail.push({ id: c.id, nom: f ? f.nom_fond : '?', dev: f ? f.dev_libelle : '?',
                    total: enBase.length, reecrites, trous, horsCsv });
    }

    detail.sort((a, b) => b.trous - a.trous);

    console.log('## Cout par fonds (les 30 plus exposes)\n');
    console.log(`  ${'fonds'.padStart(5)} ${'dev'.padEnd(4)} ${'VL'.padStart(6)} ${'->USD'.padStart(6)} ${'trous'.padStart(6)} ${'hors'.padStart(5)} ${'reste'.padStart(6)}  nom`);
    console.log(`  ${'-'.repeat(5)} ${'-'.repeat(4)} ${'-'.repeat(6)} ${'-'.repeat(6)} ${'-'.repeat(6)} ${'-'.repeat(5)} ${'-'.repeat(6)}  ---`);
    for (const d of detail.slice(0, 30)) {
      const reste = d.total - d.trous;
      console.log(
        `  ${String(d.id).padStart(5)} ${String(d.dev || '?').padEnd(4)} ${String(d.total).padStart(6)}` +
        ` ${String(d.reecrites).padStart(6)} ${String(d.trous).padStart(6)} ${String(d.horsCsv).padStart(5)}` +
        ` ${String(reste).padStart(6)}  ${String(d.nom).slice(0, 34)}`
      );
    }
    if (detail.length > 30) console.log(`  ... et ${detail.length - 30} autre(s) fonds`);

    console.log('\n## Total\n');
    console.log(`  ${String(totalVL).padStart(7)} VL en base sur la periode du rejeu`);
    console.log(`  ${String(totalReecrites).padStart(7)} seraient REECRITES en dollars (valeur lue dans la source)`);
    console.log(`  ${String(totalTrous).padStart(7)} n ont AUCUNE source dollar — a retirer, sinon melange d echelles`);
    console.log(`  ${String(totalHorsCsv).padStart(7)} absentes du rejeu (hors periode ou fichier manquant) — inchangees`);

    const pctTrous = totalVL ? (totalTrous / totalVL) * 100 : 0;
    console.log(`\n  Part de la serie perdue : ${pctTrous.toFixed(1)} %`);

    // Un verdict chiffre, pour que la decision se prenne sur le cout et non sur
    // l intention.
    if (pctTrous > 50) {
      console.log('\n  *** ATTENTION : l option dollar retirerait plus de la moitie de la serie.');
      console.log('      La SEC ne publie de colonne dollar que pour une minorite de semaines.');
      console.log('      A rearbitrer avant toute ecriture.');
    } else if (pctTrous > 20) {
      console.log('\n  Cout notable : plus d une VL sur cinq disparaitrait. A confirmer explicitement.');
    } else {
      console.log('\n  Cout limite : la serie dollar reste dense.');
    }

    console.log('');
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
