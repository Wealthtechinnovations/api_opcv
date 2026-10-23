/**
 * Corrige la categorie_regional pour TOUS les fonds,
 * en utilisant le pays du fond et la categorie_globale.
 *
 * Corrige notamment les fonds Nigeria qui avaient
 * "AFRIQUE DU NORD" au lieu de "AFRIQUE DE L OUEST".
 *
 * Usage: node fix_categorie_regional.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const PAYS_REGION_MAP = {
  'MAROC': 'AFRIQUE DU NORD',
  'TUNISIE': 'AFRIQUE DU NORD',
  'ALGERIE': 'AFRIQUE DU NORD',
  'EGYPTE': 'AFRIQUE DU NORD',
  'UEMOA': 'AFRIQUE DE L OUEST',
  'NIGERIA': 'AFRIQUE DE L OUEST',
  'GHANA': 'AFRIQUE DE L OUEST',
  'CEMAC': 'AFRIQUE CENTRALE',
  'CAMEROUN': 'AFRIQUE CENTRALE',
  'GABON': 'AFRIQUE CENTRALE',
  'AFRIQUE DU SUD': 'AFRIQUE AUSTRALE',
  'KENYA': 'AFRIQUE DE L EST',
  'TANZANIE': 'AFRIQUE DE L EST',
  'OUGANDA': 'AFRIQUE DE L EST',
  'RWANDA': 'AFRIQUE DE L EST',
};

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');

  const [fonds] = await conn.execute(
    'SELECT id, nom_fond, pays, categorie_globale, categorie_national, categorie_regional FROM fond_investissements WHERE active = 1'
  );
  console.log(`${fonds.length} fonds actifs a verifier\n`);

  let updated = 0;
  const fixesByPays = {};

  for (const f of fonds) {
    const pays = (f.pays || '').toUpperCase().trim();
    const catGlobale = (f.categorie_globale || '').toUpperCase().trim();

    if (!pays || !catGlobale) continue;

    const region = PAYS_REGION_MAP[pays];
    if (!region) continue;

    const expectedNationale = `${catGlobale} ${pays}`;
    const expectedRegionale = `${catGlobale} ${region}`;

    const needsNationale = f.categorie_national !== expectedNationale;
    const needsRegionale = f.categorie_regional !== expectedRegionale;

    if (needsNationale || needsRegionale) {
      await conn.execute(
        'UPDATE fond_investissements SET categorie_national = ?, categorie_regional = ? WHERE id = ?',
        [expectedNationale, expectedRegionale, f.id]
      );
      updated++;
      if (!fixesByPays[pays]) fixesByPays[pays] = { national: 0, regional: 0 };
      if (needsNationale) fixesByPays[pays].national++;
      if (needsRegionale) fixesByPays[pays].regional++;

      if (needsRegionale) {
        console.log(`  [${pays}] ${f.nom_fond}: "${f.categorie_regional}" -> "${expectedRegionale}"`);
      }
    }
  }

  console.log(`\n=== RESUME ===`);
  console.log(`${updated} fonds mis a jour`);
  for (const [pays, counts] of Object.entries(fixesByPays).sort((a, b) => (b[1].national + b[1].regional) - (a[1].national + a[1].regional))) {
    console.log(`  ${pays}: ${counts.national} nationales + ${counts.regional} regionales corrigees`);
  }

  // Verification
  const [verify] = await conn.execute(`
    SELECT pays, COUNT(*) as total,
      SUM(CASE WHEN categorie_regional IS NOT NULL AND categorie_regional != '' THEN 1 ELSE 0 END) as has_reg
    FROM fond_investissements WHERE active = 1
    GROUP BY pays ORDER BY total DESC
  `);
  console.log('\n=== VERIFICATION ===');
  for (const r of verify) {
    console.log(`  ${(r.pays || 'NULL').padEnd(15)} | ${r.total} fonds | ${r.has_reg} avec regionale`);
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
