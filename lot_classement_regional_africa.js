/**
 * lot_classement_regional_africa.js
 *
 * LOT A — Schema + Data pour classements regionaux et Afrique
 *
 * 1. Ajoute categorie_fundafrica_regionale + categorie_fundafrica_globale
 *    aux 6 tables: performences, performences_eurs, performences_usds,
 *    classementfonds, classementfonds_eurs, classementfonds_usds
 * 2. Backfill ces colonnes depuis fond_investissements
 *
 * Usage:
 *   node lot_classement_regional_africa.js              # diagnostic
 *   node lot_classement_regional_africa.js --execute     # execution
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const EXECUTE = process.argv.includes('--execute');

const TABLES_PERF = ['performences', 'performences_eurs', 'performences_usds'];
const TABLES_CLASS = ['classementfonds', 'classementfonds_eurs', 'classementfonds_usds'];
const ALL_TABLES = [...TABLES_PERF, ...TABLES_CLASS];

const COLUMNS_TO_ADD = [
  { name: 'categorie_fundafrica_regionale', type: 'VARCHAR(200) DEFAULT NULL' },
  { name: 'categorie_fundafrica_globale', type: 'VARCHAR(200) DEFAULT NULL' },
];

async function ensureColumn(conn, table, colName, colType) {
  // MariaDB does not support prepared statements for SHOW COLUMNS — use query()
  const [cols] = await conn.query(
    `SHOW COLUMNS FROM \`${table}\` LIKE ?`, [colName]
  );
  if (cols.length > 0) {
    console.log(`  ${table}.${colName} — existe deja`);
    return false;
  }
  if (EXECUTE) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${colName}\` ${colType}`);
    console.log(`  ALTER TABLE ${table} ADD COLUMN ${colName} — OK`);
  } else {
    console.log(`  [DRY] ALTER TABLE ${table} ADD COLUMN ${colName} ${colType}`);
  }
  return true;
}

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm');
  console.log(EXECUTE ? 'MODE: EXECUTE\n' : 'MODE: DIAGNOSTIC\n');

  // STEP 1: Add columns to all 6 tables
  console.log('=== ETAPE 1: AJOUT COLONNES ===');
  let colsAdded = 0;
  for (const table of ALL_TABLES) {
    for (const col of COLUMNS_TO_ADD) {
      const added = await ensureColumn(conn, table, col.name, col.type);
      if (added) colsAdded++;
    }
  }
  console.log(`${colsAdded} colonnes a ajouter (sur ${ALL_TABLES.length * COLUMNS_TO_ADD.length} total)\n`);

  // STEP 2: Check fond_investissements coverage
  console.log('=== ETAPE 2: COUVERTURE fond_investissements ===');
  const [coverage] = await conn.query(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN categorie_fundafrica_regionale IS NOT NULL AND categorie_fundafrica_regionale != '' THEN 1 ELSE 0 END) as has_regional,
      SUM(CASE WHEN categorie_fundafrica_globale IS NOT NULL AND categorie_fundafrica_globale != '' THEN 1 ELSE 0 END) as has_global
    FROM fond_investissements WHERE active = 1
  `);
  console.log(`Fonds actifs: ${coverage[0].total}`);
  console.log(`Avec categorie_fundafrica_regionale: ${coverage[0].has_regional} (${(coverage[0].has_regional/coverage[0].total*100).toFixed(1)}%)`);
  console.log(`Avec categorie_fundafrica_globale: ${coverage[0].has_global} (${(coverage[0].has_global/coverage[0].total*100).toFixed(1)}%)`);

  // Show distribution
  const [distRegional] = await conn.query(`
    SELECT categorie_fundafrica_regionale as cat, COUNT(*) as nb
    FROM fond_investissements WHERE active = 1
      AND categorie_fundafrica_regionale IS NOT NULL AND categorie_fundafrica_regionale != ''
    GROUP BY categorie_fundafrica_regionale ORDER BY nb DESC
  `);
  console.log(`\n${distRegional.length} categories regionales FundAfrica distinctes:`);
  distRegional.forEach(r => console.log(`  ${(r.cat || '').padEnd(40)} ${r.nb} fonds`));

  const [distGlobal] = await conn.query(`
    SELECT categorie_fundafrica_globale as cat, COUNT(*) as nb
    FROM fond_investissements WHERE active = 1
      AND categorie_fundafrica_globale IS NOT NULL AND categorie_fundafrica_globale != ''
    GROUP BY categorie_fundafrica_globale ORDER BY nb DESC
  `);
  console.log(`\n${distGlobal.length} categories globales FundAfrica distinctes:`);
  distGlobal.forEach(r => console.log(`  ${(r.cat || '').padEnd(40)} ${r.nb} fonds`));

  // STEP 3: Backfill performences tables
  console.log('\n=== ETAPE 3: BACKFILL TABLES PERFORMANCES ===');
  for (const table of TABLES_PERF) {
    const [before] = await conn.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN categorie_fundafrica_regionale IS NOT NULL AND categorie_fundafrica_regionale != '' THEN 1 ELSE 0 END) as filled_reg,
        SUM(CASE WHEN categorie_fundafrica_globale IS NOT NULL AND categorie_fundafrica_globale != '' THEN 1 ELSE 0 END) as filled_glob
      FROM \`${table}\`
    `);
    console.log(`\n${table}: ${before[0].total} lignes, ${before[0].filled_reg} avec regionale, ${before[0].filled_glob} avec globale`);

    if (EXECUTE && before[0].total > 0) {
      const [result] = await conn.query(`
        UPDATE \`${table}\` p
        JOIN fond_investissements f ON f.id = p.fond_id
        SET p.categorie_fundafrica_regionale = f.categorie_fundafrica_regionale,
            p.categorie_fundafrica_globale = f.categorie_fundafrica_globale
        WHERE f.categorie_fundafrica_regionale IS NOT NULL
      `);
      console.log(`  -> ${result.affectedRows} lignes mises a jour`);
    } else if (!EXECUTE && before[0].total > 0) {
      const [preview] = await conn.query(`
        SELECT COUNT(*) as c FROM \`${table}\` p
        JOIN fond_investissements f ON f.id = p.fond_id
        WHERE f.categorie_fundafrica_regionale IS NOT NULL
      `);
      console.log(`  [DRY] ${preview[0].c} lignes a mettre a jour`);
    }
  }

  // STEP 4: Verification
  console.log('\n=== ETAPE 4: VERIFICATION ===');
  if (EXECUTE) {
    for (const table of TABLES_PERF) {
      const [after] = await conn.query(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN categorie_fundafrica_regionale IS NOT NULL AND categorie_fundafrica_regionale != '' THEN 1 ELSE 0 END) as filled_reg,
          SUM(CASE WHEN categorie_fundafrica_globale IS NOT NULL AND categorie_fundafrica_globale != '' THEN 1 ELSE 0 END) as filled_glob
        FROM \`${table}\`
      `);
      const pctReg = after[0].total > 0 ? (after[0].filled_reg / after[0].total * 100).toFixed(1) : 0;
      const pctGlob = after[0].total > 0 ? (after[0].filled_glob / after[0].total * 100).toFixed(1) : 0;
      console.log(`${table}: ${after[0].filled_reg}/${after[0].total} regionale (${pctReg}%), ${after[0].filled_glob}/${after[0].total} globale (${pctGlob}%)`);
    }
  } else {
    console.log('(Verification apres --execute)');
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => { console.error('ERREUR:', e); process.exit(1); });
