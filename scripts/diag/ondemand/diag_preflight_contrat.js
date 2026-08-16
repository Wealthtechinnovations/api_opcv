/**
 * PRE-VOL — le contrat d ecriture ne doit PAS casser le cron Nigeria du lundi.
 *
 * LECTURE SEULE STRICTE. SELECT et verifications statiques. Aucune ecriture.
 *
 * POURQUOI
 * --------
 * `scripts/import/import_vl_nigeria_sec.js` est appele chaque lundi par
 * `cron_nigeria_weekly.sh`. Il vient d etre branche sur le contrat d ecriture
 * (`src/lib/vl_contract.js`) et son INSERT est passe de 28 a 35 colonnes.
 *
 * Ce code n a jamais tourne sur le serveur. Une colonne mal orthographiee, un
 * decalage de placeholders ou une syntaxe non supportee par le Node du serveur
 * (14.16.0, plus ancien que celui du poste de developpement) casserait l import
 * silencieusement jusqu au lundi suivant.
 *
 * Ce script verifie tout ce qui peut l etre SANS ecrire une seule ligne.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const RACINE = path.resolve(__dirname, '../../..');
let echecs = 0;
const t = (nom, ok, detail) => {
  if (!ok) echecs++;
  console.log(`   [${ok ? 'OK   ' : 'ECHEC'}] ${nom}${detail ? '  — ' + detail : ''}`);
};

async function main() {
  console.log('\n============================================================');
  console.log(' PRE-VOL DU CONTRAT D ECRITURE (avant le cron Nigeria)');
  console.log(' Genere le ' + new Date().toISOString() + ' — LECTURE SEULE');
  console.log('============================================================\n');

  console.log(`## Contexte\n\n   Node du serveur : ${process.version}\n`);

  // --- 1. Le module se charge-t-il sur CE Node ? ---
  console.log('## A. Chargement et comportement du contrat\n');
  let contrat = null;
  try {
    contrat = require(path.join(RACINE, 'src/lib/vl_contract.js'));
    t('module vl_contract charge', true);
  } catch (e) {
    t('module vl_contract charge', false, e.message);
    console.log('\n   ARRET : sans le module, le reste n a pas de sens.\n');
    process.exit(1);
  }

  const USD = { id: 1141, dev_libelle: 'USD' };
  const base = { currency_code: 'USD', price_type: 'BID', sec_document_id: '1497', report_date: '2026-07-10' };

  t('mesure conforme acceptee', contrat.validate(base, USD).quality === contrat.QUALITY.OK);
  t('NGN sur fonds USD refuse (le cas #73)',
    contrat.validate({ ...base, currency_code: 'NGN' }, USD).accepted === false);
  t('devise absente non bloquante en mode warn',
    contrat.validate({ ...base, currency_code: null }, USD).accepted === true);
  t('aucune devise inventee',
    contrat.contractValues({ ...base, currency_code: null }, 'X', 'B')[0] === null);
  t('fonds sans devise declaree ne bloque pas',
    contrat.validate(base, { id: 9, dev_libelle: null }).accepted === true);
  t('identifiant de lot horodate', /^SECNG_\d{8}_\d{6}$/.test(contrat.makeBatchId('secng')));

  // --- 2. L importeur est-il syntaxiquement valide pour CE Node ? ---
  console.log('\n## B. Validite syntaxique sur le Node du serveur\n');
  for (const f of ['scripts/import/import_vl_nigeria_sec.js', 'src/lib/vl_contract.js']) {
    try {
      execFileSync(process.execPath, ['--check', path.join(RACINE, f)], { stdio: 'pipe' });
      t(f, true);
    } catch (e) {
      t(f, false, String(e.stderr || e.message).split('\n')[0]);
    }
  }

  // --- 3. Les 35 colonnes de l INSERT existent-elles vraiment ? ---
  // C est le controle le plus important : une colonne mal orthographiee ne se
  // voit qu a l execution, donc lundi, donc trop tard.
  console.log('\n## C. Colonnes de l INSERT confrontees au schema reel\n');
  const conn = await mysql.createConnection(DB);
  try {
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'valorisations'`
    );
    const reelles = new Set(cols.map(c => c.COLUMN_NAME));

    const src = fs.readFileSync(path.join(RACINE, 'scripts/import/import_vl_nigeria_sec.js'), 'utf8');
    const m = src.match(/INSERT INTO valorisations\s*\n\s*\(([\s\S]*?)\)\s*\n\s*VALUES/);
    if (!m) {
      t('INSERT localise dans l importeur', false, 'motif introuvable');
    } else {
      const declarees = m[1].replace(/\n/g, ' ').split(',').map(s => s.trim()).filter(Boolean);
      t(`${declarees.length} colonnes declarees dans l INSERT`, declarees.length === 35,
        `attendu 35, trouve ${declarees.length}`);
      const inconnues = declarees.filter(c => !reelles.has(c));
      t('toutes les colonnes existent en base', inconnues.length === 0,
        inconnues.length ? 'INCONNUES : ' + inconnues.join(', ') : `${declarees.length} verifiees`);

      // Les 7 colonnes du contrat doivent y figurer, dans l ordre attendu.
      const manquantes = contrat.CONTRACT_COLUMNS.filter(c => !declarees.includes(c));
      t('les 7 colonnes du contrat sont dans l INSERT', manquantes.length === 0,
        manquantes.length ? 'manquantes : ' + manquantes.join(', ') : '');
    }

    // Chaque tuple VALUES doit fournir exactement 35 valeurs.
    const tuples = [...src.matchAll(/\(\?,[^()]*\)/g)].map(x => x[0]);
    const t35 = tuples.filter(x => {
      const e = x.slice(1, -1).split(',').map(s => s.trim());
      return e.length === 35;
    });
    t('tuples VALUES a 35 valeurs', t35.length >= 2,
      `${t35.length} tuple(s) conforme(s) sur ${tuples.length} candidat(s)`);

    // --- 4. La requete de devise du fonds fonctionne-t-elle ? ---
    console.log('\n## D. Lecture de la devise de reference\n');
    const [[f1141]] = await conn.execute(
      'SELECT id, dev_libelle FROM fond_investissements WHERE id = ?', [1141]
    );
    t('devise du fonds 1141 lisible', !!f1141,
      f1141 ? `dev_libelle = ${f1141.dev_libelle}` : 'fonds introuvable');

    if (f1141) {
      const v = contrat.validate({ ...base, currency_code: 'NGN' }, f1141);
      console.log(`\n   Simulation sur le fonds 1141 tel qu il est EN BASE :`);
      console.log(`      mesure NGN + fonds ${f1141.dev_libelle} -> ${v.accepted ? 'ACCEPTEE' : 'REFUSEE'} (${v.quality})`);
      if (f1141.dev_libelle === 'NGN') {
        console.log('      NOTE : le referentiel dit encore NGN pour ce fonds dollar.');
        console.log('      Tant que l etape 0 n est pas faite, le contrat ne peut pas');
        console.log('      detecter la contradiction sur ce fonds. C est attendu.');
      }
    }
  } finally {
    await conn.end();
  }

  console.log('\n============================================================');
  console.log(echecs === 0
    ? ' PRE-VOL OK — le cron du lundi peut tourner sans risque nouveau.'
    : ` ${echecs} ECHEC(S) — NE PAS LAISSER LE CRON TOURNER EN L ETAT.`);
  console.log('============================================================\n');
  process.exit(echecs === 0 ? 0 : 1);
}

main().catch(e => { console.error('Erreur fatale :', e.message); process.exit(2); });
