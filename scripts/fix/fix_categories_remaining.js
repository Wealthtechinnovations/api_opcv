/**
 * fix_categories_remaining.js
 *
 * Comble les lacunes restantes dans les categories des fonds:
 *   1. Derive categorie_globale depuis classification ou nom_fond
 *   2. Remplit categorie_libelle = categorie_globale si vide
 *   3. Remplit categorie_national = "CATEGORIE_GLOBALE PAYS" si vide
 *   4. Remplit categorie_regional = "CATEGORIE_GLOBALE REGION" si vide
 *
 * NON-DESTRUCTIF: ne modifie que les champs vides/null
 *
 * Usage:
 *   node fix_categories_remaining.js           # diagnostic seul (dry run)
 *   node fix_categories_remaining.js --execute  # applique les modifications
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

const EXECUTE = process.argv.includes('--execute');

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

function deriveCategGlobale(classification, nomFond, catLibelle) {
  const all = [classification, nomFond, catLibelle].filter(Boolean).join(' ').toUpperCase();

  if (/OBLIG|BOND|FIXED.?INCOME|OMLT|OCT|OATC|SUKUK/.test(all)) return 'OBLIGATIONS';
  if (/MONET|MONEY.?MARKET|TRESOR|LIQUIDIT|CASH|SHORT.?TERM/.test(all)) return 'MONETAIRE';
  if (/ACTION|EQUIT|STOCK|ETF|INDEX/.test(all)) return 'ACTIONS';
  if (/DIVERSIF|MIXED|BALANCED|MULTI.?ASSET|FLEXIBLE/.test(all)) return 'DIVERSIFIE';
  if (/IMMOBIL|REAL.?ESTATE|REIT/.test(all)) return 'IMMOBILIER';
  if (/DOLLAR|USD/.test(all)) return 'DIVERSIFIE';
  if (/ETHIQUE|ETHICAL|CHARIA|SHARIAH|ISLAMIC/.test(all)) return 'DIVERSIFIE';
  if (/INFRASTRUCTURE/.test(all)) return 'DIVERSIFIE';

  return null;
}

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`Connecte a fund_opcvm (mode: ${EXECUTE ? 'EXECUTE' : 'DIAGNOSTIC'})\n`);

  // --- DIAGNOSTIC ---
  console.log('=== DIAGNOSTIC CATEGORIES ===\n');

  const [fonds] = await conn.execute(`
    SELECT id, nom_fond, pays, classification, categorie_globale,
           categorie_libelle, categorie_national, categorie_regional, active
    FROM fond_investissements
  `);

  const gaps = {
    noCategGlobale: [],
    noCategLibelle: [],
    noCategNationale: [],
    noCategRegionale: [],
  };

  for (const f of fonds) {
    if (!f.categorie_globale || f.categorie_globale.trim() === '') gaps.noCategGlobale.push(f);
    if (!f.categorie_libelle || f.categorie_libelle.trim() === '') gaps.noCategLibelle.push(f);
    if (!f.categorie_national || f.categorie_national.trim() === '') gaps.noCategNationale.push(f);
    if (!f.categorie_regional || f.categorie_regional.trim() === '') gaps.noCategRegionale.push(f);
  }

  console.log(`Total fonds: ${fonds.length}`);
  console.log(`Sans categorie_globale:   ${gaps.noCategGlobale.length}`);
  console.log(`Sans categorie_libelle:   ${gaps.noCategLibelle.length}`);
  console.log(`Sans categorie_national:  ${gaps.noCategNationale.length}`);
  console.log(`Sans categorie_regional:  ${gaps.noCategRegionale.length}`);

  // Coverage par pays (actifs seulement)
  const byPays = {};
  for (const f of fonds) {
    if (f.active !== 1) continue;
    const p = f.pays || 'NULL';
    if (!byPays[p]) byPays[p] = { total: 0, glob: 0, lib: 0, nat: 0, reg: 0 };
    byPays[p].total++;
    if (f.categorie_globale && f.categorie_globale.trim()) byPays[p].glob++;
    if (f.categorie_libelle && f.categorie_libelle.trim()) byPays[p].lib++;
    if (f.categorie_national && f.categorie_national.trim()) byPays[p].nat++;
    if (f.categorie_regional && f.categorie_regional.trim()) byPays[p].reg++;
  }

  console.log('\n--- Couverture par pays (fonds actifs) ---');
  console.log('Pays                 | Total | Globale | Libelle | Nationale | Regionale');
  console.log('---------------------|-------|---------|---------|-----------|----------');
  for (const [pays, s] of Object.entries(byPays).sort((a, b) => b[1].total - a[1].total)) {
    console.log(
      `${pays.padEnd(21)}| ${String(s.total).padStart(5)} | ${String(s.glob).padStart(7)} | ${String(s.lib).padStart(7)} | ${String(s.nat).padStart(9)} | ${String(s.reg).padStart(9)}`
    );
  }

  if (gaps.noCategGlobale.length > 0) {
    console.log(`\n--- Fonds sans categorie_globale (${gaps.noCategGlobale.length}) ---`);
    for (const f of gaps.noCategGlobale.slice(0, 20)) {
      const derived = deriveCategGlobale(f.classification, f.nom_fond, f.categorie_libelle);
      console.log(`  id=${f.id} ${(f.nom_fond || '').substring(0, 50).padEnd(52)} classif=${(f.classification || '-').padEnd(25)} -> ${derived || '???'}`);
    }
    if (gaps.noCategGlobale.length > 20) console.log(`  ... et ${gaps.noCategGlobale.length - 20} autres`);
  }

  if (!EXECUTE) {
    console.log('\n(Mode DIAGNOSTIC — aucune modification. Relancer avec --execute pour appliquer)');
    await conn.end();
    return;
  }

  // --- EXECUTE ---
  console.log('\n=== APPLICATION DES CORRECTIONS ===\n');

  let updCategGlobale = 0;
  let updCategLibelle = 0;
  let updCategNationale = 0;
  let updCategRegionale = 0;

  // Step 1: Derive categorie_globale
  console.log('Step 1: Derive categorie_globale...');
  for (const f of gaps.noCategGlobale) {
    const derived = deriveCategGlobale(f.classification, f.nom_fond, f.categorie_libelle);
    if (derived) {
      await conn.execute(
        'UPDATE fond_investissements SET categorie_globale = ? WHERE id = ? AND (categorie_globale IS NULL OR categorie_globale = "")',
        [derived, f.id]
      );
      f.categorie_globale = derived;
      updCategGlobale++;
    }
  }
  console.log(`  ${updCategGlobale} categorie_globale derivees`);

  // Refresh: reload fonds with gaps after step 1
  const [fondsRefresh] = await conn.execute(`
    SELECT id, pays, categorie_globale, categorie_libelle, categorie_national, categorie_regional
    FROM fond_investissements
  `);

  // Step 2: Fill categorie_libelle = categorie_globale
  console.log('Step 2: Fill categorie_libelle...');
  for (const f of fondsRefresh) {
    if ((!f.categorie_libelle || f.categorie_libelle.trim() === '') && f.categorie_globale && f.categorie_globale.trim()) {
      await conn.execute(
        'UPDATE fond_investissements SET categorie_libelle = ? WHERE id = ? AND (categorie_libelle IS NULL OR categorie_libelle = "")',
        [f.categorie_globale.trim(), f.id]
      );
      updCategLibelle++;
    }
  }
  console.log(`  ${updCategLibelle} categorie_libelle remplies`);

  // Step 3: Fill categorie_national = "CATEG_GLOBALE PAYS"
  console.log('Step 3: Fill categorie_national...');
  for (const f of fondsRefresh) {
    if ((!f.categorie_national || f.categorie_national.trim() === '') && f.categorie_globale && f.pays) {
      const catNat = `${f.categorie_globale.trim()} ${f.pays.trim()}`.toUpperCase();
      await conn.execute(
        'UPDATE fond_investissements SET categorie_national = ? WHERE id = ? AND (categorie_national IS NULL OR categorie_national = "")',
        [catNat, f.id]
      );
      updCategNationale++;
    }
  }
  console.log(`  ${updCategNationale} categorie_national remplies`);

  // Step 4: Fill categorie_regional = "CATEG_GLOBALE REGION"
  console.log('Step 4: Fill categorie_regional...');
  for (const f of fondsRefresh) {
    if ((!f.categorie_regional || f.categorie_regional.trim() === '') && f.categorie_globale && f.pays) {
      const region = PAYS_REGION_MAP[f.pays.trim().toUpperCase()];
      if (region) {
        const catReg = `${f.categorie_globale.trim()} ${region}`.toUpperCase();
        await conn.execute(
          'UPDATE fond_investissements SET categorie_regional = ? WHERE id = ? AND (categorie_regional IS NULL OR categorie_regional = "")',
          [catReg, f.id]
        );
        updCategRegionale++;
      }
    }
  }
  console.log(`  ${updCategRegionale} categorie_regional remplies`);

  // --- VERIFICATION FINALE ---
  console.log('\n=== VERIFICATION FINALE ===\n');
  const [finalStats] = await conn.execute(`
    SELECT pays, COUNT(*) as total,
      SUM(CASE WHEN categorie_globale IS NOT NULL AND categorie_globale != '' THEN 1 ELSE 0 END) as glob,
      SUM(CASE WHEN categorie_libelle IS NOT NULL AND categorie_libelle != '' THEN 1 ELSE 0 END) as lib,
      SUM(CASE WHEN categorie_national IS NOT NULL AND categorie_national != '' THEN 1 ELSE 0 END) as nat,
      SUM(CASE WHEN categorie_regional IS NOT NULL AND categorie_regional != '' THEN 1 ELSE 0 END) as reg
    FROM fond_investissements WHERE active = 1
    GROUP BY pays ORDER BY total DESC
  `);

  console.log('Pays                 | Total | Globale | Libelle | Nationale | Regionale');
  console.log('---------------------|-------|---------|---------|-----------|----------');
  for (const r of finalStats) {
    console.log(
      `${(r.pays || 'NULL').padEnd(21)}| ${String(r.total).padStart(5)} | ${String(r.glob).padStart(7)} | ${String(r.lib).padStart(7)} | ${String(r.nat).padStart(9)} | ${String(r.reg).padStart(9)}`
    );
  }

  const [remaining] = await conn.execute(`
    SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1
    AND (categorie_globale IS NULL OR categorie_globale = ''
      OR categorie_national IS NULL OR categorie_national = ''
      OR categorie_regional IS NULL OR categorie_regional = '')
  `);
  console.log(`\nFonds actifs avec lacunes restantes: ${remaining[0].c}`);

  console.log('\n=== RESUME ===');
  console.log(`categorie_globale derivees:    ${updCategGlobale}`);
  console.log(`categorie_libelle remplies:    ${updCategLibelle}`);
  console.log(`categorie_national remplies:   ${updCategNationale}`);
  console.log(`categorie_regional remplies:   ${updCategRegionale}`);

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
