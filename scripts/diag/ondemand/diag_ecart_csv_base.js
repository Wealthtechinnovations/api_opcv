/**
 * Ce que le rejeu de l extraction CORRIGERAIT reellement, ligne par ligne.
 *
 * POURQUOI. La phase seche du 2026-08-28 a montre que rejouer l extraction ne
 * suffit pas : l importeur annonce **« VL inserees : 0 »**. Il n ajoute que des
 * dates nouvelles et ne touche jamais une valeur deja presente — or les 233
 * lignes en rupture sont a des dates deja en base. Le plan « rejouer puis
 * reimporter » ne pouvait donc pas fonctionner, et la phase seche est
 * exactement ce qui devait le reveler avant qu on l execute.
 *
 * Ce diagnostic repond a la question suivante : pour chaque date deja en base,
 * la valeur relue dans le fichier SEC est-elle la meme que la valeur stockee ?
 * Autrement dit — combien de lignes une correction ligne a ligne redresserait,
 * et vers quelles valeurs.
 *
 * Il lit le CSV du rejeu (`sec_ng_replay.csv`) et le compare a `valorisations`.
 * Il n ecrit rien. La correction, si elle a lieu, viendra apres et sur ce
 * qu il aura montre.
 *
 * APPARIEMENT DES NOMS : via `src/lib/sec_csv.js`, le meme module que
 * l importeur. Une regle d appariement differente ferait passer pour absents
 * des fonds que l import reconnait, et le comptage n aurait aucun sens.
 *
 * LECTURE SEULE — uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_ecart_csv_base.js [chemin_csv]
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

// Un ecart de quelques centiemes vient des arrondis d un chargement a l autre.
// Au-dela de 1 %, la valeur stockee et la valeur publiee ne decrivent plus la
// meme chose.
const ECART_SIGNIFICATIF = 0.01;
// Au-dela de x10, c est un changement d echelle, pas une correction de detail.
const ECART_ECHELLE = 10;

const n = (x, d = 4) => (x === null || x === undefined || Number.isNaN(x) ? '-' : Number(x).toFixed(d));
const j = x => (x ? String(x).slice(0, 10) : '?');

(async () => {
  if (!fs.existsSync(CSV)) {
    console.log(`\nCSV de rejeu introuvable : ${CSV}`);
    console.log('Lancer d abord le workflow « OPS — rejeu SEC etape 2 (phase seche) ».\n');
    return;
  }

  const conn = await mysql.createConnection(DB);
  try {
    console.log('\n=== ECART ENTRE LE FICHIER SEC RELU ET LA BASE ===');
    console.log(`Mesure le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — LECTURE SEULE`);
    console.log(`CSV : ${CSV}\n`);

    const { lignes } = lireCSV(CSV);
    console.log(`Lignes CSV : ${lignes.length}`);

    // Index des fonds Nigeria par nom normalise.
    const [fonds] = await conn.query(`
      SELECT id, nom_fond, dev_libelle FROM fond_investissements
       WHERE LOWER(pays) = 'nigeria'
    `);
    const parNom = new Map();
    for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);
    console.log(`Fonds Nigeria en base : ${fonds.length}`);

    // Valeurs stockees, indexees par fonds+date.
    const [vls] = await conn.query(`
      SELECT v.fund_id, v.date, v.value, v.currency_code, v.correction_batch,
             CASE WHEN v.source_url IS NULL THEN 'non' ELSE 'oui' END AS src
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
       WHERE LOWER(f.pays) = 'nigeria' AND v.value > 0
    `);
    const enBase = new Map();
    for (const v of vls) enBase.set(`${v.fund_id}|${j(v.date)}`, v);
    console.log(`VL Nigeria en base : ${vls.length}\n`);

    let apparies = 0;
    let nonApparies = 0;
    let dateAbsente = 0;
    let identiques = 0;
    const ecarts = [];

    for (const l of lignes) {
      const nom = l.fund_name_clean;
      const date = j(l.valuation_date);
      const prix = parseFloat(l.vl_price);
      if (!nom || !date || date === '?' || !Number.isFinite(prix) || prix <= 0) continue;

      const f = parNom.get(normalizeNameForMatch(nom));
      if (!f) { nonApparies++; continue; }
      apparies++;

      const v = enBase.get(`${f.id}|${date}`);
      if (!v) { dateAbsente++; continue; }

      const stocke = Number(v.value);
      const rapport = Math.max(prix / stocke, stocke / prix);
      if (rapport - 1 < ECART_SIGNIFICATIF) { identiques++; continue; }

      ecarts.push({
        id: f.id, nom: f.nom_fond, dev: f.dev_libelle, date,
        stocke, relu: prix,
        devise_relue: l.vl_currency_code || '-',
        source_devise: l.vl_currency_source || '-',
        rapport,
        devise_base: v.currency_code || '-',
        src: v.src,
      });
    }

    console.log('## A. Appariement\n');
    console.log(`  ${String(apparies).padStart(7)} ligne(s) CSV appariees a un fonds en base`);
    console.log(`  ${String(nonApparies).padStart(7)} ligne(s) sans fonds correspondant (nom inconnu)`);
    console.log(`  ${String(dateAbsente).padStart(7)} ligne(s) dont la date n est pas en base — un import les AJOUTERAIT`);
    console.log(`  ${String(identiques).padStart(7)} ligne(s) identiques a moins de 1 %`);
    console.log(`  ${String(ecarts.length).padStart(7)} ligne(s) EN ECART`);

    if (!ecarts.length) {
      console.log('\nAucun ecart : le fichier relu confirme la base. Rien a corriger par cette voie.\n');
      return;
    }

    const echelle = ecarts.filter(e => e.rapport >= ECART_ECHELLE);
    const mineurs = ecarts.filter(e => e.rapport < ECART_ECHELLE);

    console.log('\n## B. Nature des ecarts\n');
    console.log(`  ${String(echelle.length).padStart(7)} changement(s) d ECHELLE (facteur >= ${ECART_ECHELLE}) — les ruptures visees`);
    console.log(`  ${String(mineurs.length).padStart(7)} ecart(s) mineur(s) (1 % a ${ECART_ECHELLE}x) — a instruire separement, ne pas corriger en masse`);

    console.log('\n## C. Changements d echelle — ce qu une correction ecrirait\n');
    console.log(`  ${'fonds'.padStart(5)} ${'dev'.padEnd(4)} ${'date'.padEnd(10)} ${'en base'.padStart(16)} ${'relu dans SEC'.padStart(16)} ${'fact.'.padStart(9)} ${'dev.relue'.padEnd(9)} nom`);
    console.log(`  ${'-'.repeat(5)} ${'-'.repeat(4)} ${'-'.repeat(10)} ${'-'.repeat(16)} ${'-'.repeat(16)} ${'-'.repeat(9)} ${'-'.repeat(9)} ---`);
    for (const e of echelle.slice(0, 60)) {
      console.log(
        `  ${String(e.id).padStart(5)} ${String(e.dev || '?').padEnd(4)} ${e.date.padEnd(10)}` +
        ` ${n(e.stocke).padStart(16)} ${n(e.relu).padStart(16)} ${e.rapport.toFixed(1).padStart(9)}` +
        ` ${String(e.devise_relue).padEnd(9)} ${String(e.nom).slice(0, 30)}`
      );
    }
    if (echelle.length > 60) console.log(`  ... et ${echelle.length - 60} autre(s)`);

    // Le sens de la correction compte : le rejeu doit RAMENER les valeurs
    // aberrantes vers l echelle de la serie, pas en creer de nouvelles.
    const versLePetit = echelle.filter(e => e.relu < e.stocke).length;
    console.log(`\n  Sens : ${versLePetit} correction(s) vers une valeur PLUS PETITE, ${echelle.length - versLePetit} vers une PLUS GRANDE`);

    console.log('\n## D. Devise que l extracteur corrige attribue a ces mesures\n');
    const parDevise = new Map();
    for (const e of echelle) {
      const cle = `${e.devise_relue} (source : ${e.source_devise})`;
      parDevise.set(cle, (parDevise.get(cle) || 0) + 1);
    }
    for (const [cle, k] of [...parDevise.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(k).padStart(6)} ligne(s)   ${cle}`);
    }

    console.log('');
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
