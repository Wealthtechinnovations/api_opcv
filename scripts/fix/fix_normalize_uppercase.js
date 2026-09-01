/**
 * Normalise TOUTES les donnees textuelles en MAJUSCULES, sans accents ni apostrophes.
 * Remplit categorie_national et categorie_regional pour TOUS les pays.
 *
 * Tables modifiees:
 *   - fond_investissements: nom_fond, societe_gestion, pays, categorie_globale,
 *     categorie_national, categorie_regional, classification, categorie_libelle
 *   - societes: nom, pays
 *   - pays_regulateurs: pays
 *
 * Usage: node fix_normalize_uppercase.js
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

function removeAccents(str) {
  if (!str) return str;
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[''`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(str) {
  if (!str) return str;
  return removeAccents(str).toUpperCase();
}

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

function getCategorieNationale(catGlobale, pays) {
  if (!catGlobale || !pays) return null;
  return `${normalize(catGlobale)} ${normalize(pays)}`;
}

function getCategorieRegionale(catGlobale, pays) {
  if (!catGlobale || !pays) return null;
  const region = PAYS_REGION_MAP[normalize(pays)];
  if (!region) return null;
  return `${normalize(catGlobale)} ${region}`;
}

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');

  // 1. Normaliser pays_regulateurs
  console.log('\n=== 1. NORMALISATION pays_regulateurs ===');
  const [prRows] = await conn.execute('SELECT id, pays FROM pays_regulateurs');
  let prUpdated = 0;
  for (const r of prRows) {
    const norm = normalize(r.pays);
    if (norm !== r.pays) {
      await conn.execute('UPDATE pays_regulateurs SET pays = ? WHERE id = ?', [norm, r.id]);
      console.log(`  pays_regulateurs id=${r.id}: "${r.pays}" -> "${norm}"`);
      prUpdated++;
    }
  }
  console.log(`  ${prUpdated} pays_regulateurs mis a jour`);

  // 2. Normaliser societes
  console.log('\n=== 2. NORMALISATION societes ===');
  const [socRows] = await conn.execute('SELECT id, nom, pays FROM societes');
  let socUpdated = 0;
  for (const s of socRows) {
    const normNom = normalize(s.nom);
    const normPays = normalize(s.pays);
    if (normNom !== s.nom || normPays !== s.pays) {
      await conn.execute('UPDATE societes SET nom = ?, pays = ? WHERE id = ?', [normNom, normPays, s.id]);
      socUpdated++;
    }
  }
  console.log(`  ${socUpdated} societes mises a jour`);

  // 3. Normaliser fond_investissements
  console.log('\n=== 3. NORMALISATION fond_investissements ===');
  const [fonds] = await conn.execute(`
    SELECT id, nom_fond, societe_gestion, pays, categorie_globale,
           categorie_national, categorie_regional, classification, categorie_libelle
    FROM fond_investissements
  `);
  let fondUpdated = 0;
  let catNatFilled = 0;
  let catRegFilled = 0;

  for (const f of fonds) {
    const normNom = normalize(f.nom_fond);
    const normSG = normalize(f.societe_gestion);
    const normPays = normalize(f.pays);
    const normCatGlobale = normalize(f.categorie_globale);
    const normClassif = normalize(f.classification);
    const normCatLibelle = normalize(f.categorie_libelle);

    let normCatNat = normalize(f.categorie_national);
    let normCatReg = normalize(f.categorie_regional);

    if (!normCatNat && normCatGlobale && normPays) {
      normCatNat = getCategorieNationale(normCatGlobale, normPays);
      if (normCatNat) catNatFilled++;
    }
    if (!normCatReg && normCatGlobale && normPays) {
      normCatReg = getCategorieRegionale(normCatGlobale, normPays);
      if (normCatReg) catRegFilled++;
    }

    const changed = normNom !== f.nom_fond || normSG !== f.societe_gestion ||
      normPays !== f.pays || normCatGlobale !== f.categorie_globale ||
      normCatNat !== normalize(f.categorie_national) || normCatReg !== normalize(f.categorie_regional) ||
      normClassif !== f.classification || normCatLibelle !== f.categorie_libelle;

    if (changed) {
      await conn.execute(`
        UPDATE fond_investissements SET
          nom_fond = ?, societe_gestion = ?, pays = ?,
          categorie_globale = ?, categorie_national = ?, categorie_regional = ?,
          classification = ?, categorie_libelle = ?
        WHERE id = ?
      `, [normNom, normSG, normPays, normCatGlobale, normCatNat, normCatReg, normClassif, normCatLibelle, f.id]);
      fondUpdated++;
    }
  }

  console.log(`  ${fondUpdated} fonds mis a jour`);
  console.log(`  ${catNatFilled} categories nationales generees`);
  console.log(`  ${catRegFilled} categories regionales generees`);

  // 4. Verification
  console.log('\n=== VERIFICATION ===');
  const [catStats] = await conn.execute(`
    SELECT pays, COUNT(*) as total,
      SUM(CASE WHEN categorie_globale IS NOT NULL AND categorie_globale != '' THEN 1 ELSE 0 END) as has_globale,
      SUM(CASE WHEN categorie_national IS NOT NULL AND categorie_national != '' THEN 1 ELSE 0 END) as has_nationale,
      SUM(CASE WHEN categorie_regional IS NOT NULL AND categorie_regional != '' THEN 1 ELSE 0 END) as has_regionale
    FROM fond_investissements WHERE active = 1
    GROUP BY pays ORDER BY total DESC
  `);
  console.log('Pays                  | Total | Globale | Nationale | Regionale');
  console.log('----------------------|-------|---------|-----------|----------');
  for (const r of catStats) {
    console.log(`${(r.pays || 'NULL').padEnd(22)}| ${String(r.total).padStart(5)} | ${String(r.has_globale).padStart(7)} | ${String(r.has_nationale).padStart(9)} | ${String(r.has_regionale).padStart(9)}`);
  }

  // Check accents/apostrophes remaining
  const [accentCheck] = await conn.execute(`
    SELECT COUNT(*) as cnt FROM fond_investissements
    WHERE nom_fond REGEXP '[àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ]'
    OR nom_fond LIKE '%''%' OR nom_fond LIKE '%\`%'
  `);
  console.log(`\nFonds avec accents/apostrophes restants: ${accentCheck[0].cnt}`);

  const [socAccentCheck] = await conn.execute(`
    SELECT COUNT(*) as cnt FROM societes
    WHERE nom REGEXP '[àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ]'
    OR nom LIKE '%''%' OR nom LIKE '%\`%'
  `);
  console.log(`Societes avec accents/apostrophes restants: ${socAccentCheck[0].cnt}`);

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
