/**
 * seed_referentiel_fundafrica.js
 *
 * Cree les 5 tables referentielles FundAfrica et les peuple depuis
 * referentiel_fundafrica.json (extrait du fichier Excel).
 *
 * ADDITIF UNIQUEMENT:
 *   - CREATE TABLE IF NOT EXISTS (ne detruit rien)
 *   - INSERT IGNORE (ne duplique pas)
 *   - Ne touche PAS aux tables existantes (fond_investissements, indice_references, etc.)
 *
 * Tables creees:
 *   1. ref_asset_classes (4 lignes)
 *   2. ref_geo_zones (29 pays)
 *   3. ref_categories_fundafrica (140 categories)
 *   4. ref_indices_fundafrica (137 indices)
 *   5. ref_index_sources (10 sources)
 *
 * Usage:
 *   node seed_referentiel_fundafrica.js           # diagnostic (dry run)
 *   node seed_referentiel_fundafrica.js --execute  # appliquer
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const EXECUTE = process.argv.includes('--execute');

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm');
  console.log(EXECUTE ? 'MODE: EXECUTE\n' : 'MODE: DIAGNOSTIC (dry run, --execute pour appliquer)\n');

  const dataPath = path.join(__dirname, 'referentiel_fundafrica.json');
  if (!fs.existsSync(dataPath)) {
    console.error('ERREUR: referentiel_fundafrica.json introuvable. Generer avec le script Excel.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // --- 1. ref_asset_classes ---
  console.log('=== 1. ref_asset_classes ===');
  if (EXECUTE) {
    await conn.execute(`CREATE TABLE IF NOT EXISTS ref_asset_classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      libelle_fr VARCHAR(100) NOT NULL,
      code_technique VARCHAR(50),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }
  const assetClasses = data['02_REF_ASSET_CLASSES'];
  let inserted1 = 0;
  for (const row of assetClasses) {
    if (EXECUTE) {
      const [r] = await conn.execute(
        `INSERT IGNORE INTO ref_asset_classes (code, libelle_fr, code_technique, description) VALUES (?, ?, ?, ?)`,
        [row.ASSET_CLASS_CODE, row.LIBELLE_FR, row.CODE_TECHNIQUE, row.DESCRIPTION]
      );
      inserted1 += r.affectedRows;
    }
  }
  console.log(`  ${assetClasses.length} classes d'actifs. ${EXECUTE ? inserted1 + ' inserees.' : 'A inserer.'}`);

  // --- 2. ref_geo_zones ---
  console.log('\n=== 2. ref_geo_zones ===');
  if (EXECUTE) {
    await conn.execute(`CREATE TABLE IF NOT EXISTS ref_geo_zones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pays_id VARCHAR(100) NOT NULL UNIQUE,
      pays VARCHAR(100) NOT NULL,
      nom_devise VARCHAR(100),
      code_devise VARCHAR(10),
      region VARCHAR(100),
      zone_globale VARCHAR(100),
      univers VARCHAR(100),
      est_zone_regionale VARCHAR(10),
      zone_monetaire VARCHAR(100),
      commentaire TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }
  const geoZones = data['01_REF_PAYS_ZONES'];
  let inserted2 = 0;
  for (const row of geoZones) {
    if (EXECUTE) {
      const [r] = await conn.execute(
        `INSERT IGNORE INTO ref_geo_zones (pays_id, pays, nom_devise, code_devise, region, zone_globale, univers, est_zone_regionale, zone_monetaire, commentaire)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.PAYS_ID, row.PAYS, row.NOM_DEVISE, row.CODE_DEVISE, row.REGION, row.ZONE_GLOBALE, row.UNIVERS, row.EST_ZONE_REGIONALE, row.ZONE_MONETAIRE || null, row.COMMENTAIRE || null]
      );
      inserted2 += r.affectedRows;
    }
  }
  console.log(`  ${geoZones.length} pays/zones. ${EXECUTE ? inserted2 + ' inserees.' : 'A inserer.'}`);

  // --- 3. ref_categories_fundafrica ---
  console.log('\n=== 3. ref_categories_fundafrica ===');
  if (EXECUTE) {
    await conn.execute(`CREATE TABLE IF NOT EXISTS ref_categories_fundafrica (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id VARCHAR(100) NOT NULL UNIQUE,
      niveau_categorie VARCHAR(50) NOT NULL,
      classification_regulateur VARCHAR(50) NOT NULL,
      pays VARCHAR(100),
      region VARCHAR(100),
      code_devise_locale VARCHAR(10),
      categorie_locale_fundafrica VARCHAR(200),
      categorie_regionale_fundafrica VARCHAR(200),
      categorie_globale_fundafrica VARCHAR(200),
      page_locale VARCHAR(10),
      page_eur VARCHAR(10),
      page_usd VARCHAR(10),
      devise_classement_locale VARCHAR(10),
      devise_classement_regionale VARCHAR(20),
      devise_classement_globale VARCHAR(20),
      logique_metier TEXT,
      statut VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }
  const categories = data['03_REF_CATEGORIES_LONG'];
  let inserted3 = 0;
  for (const row of categories) {
    if (EXECUTE) {
      const [r] = await conn.execute(
        `INSERT IGNORE INTO ref_categories_fundafrica
         (category_id, niveau_categorie, classification_regulateur, pays, region, code_devise_locale,
          categorie_locale_fundafrica, categorie_regionale_fundafrica, categorie_globale_fundafrica,
          page_locale, page_eur, page_usd, devise_classement_locale, devise_classement_regionale,
          devise_classement_globale, logique_metier, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.CATEGORY_ID, row.NIVEAU_CATEGORIE, row.CLASSIFICATION_REGULATEUR,
          row.PAYS || null, row.REGION || null, row.CODE_DEVISE_LOCALE || null,
          row.CATEGORIE_LOCALE_FUNDAFRICA || null, row.CATEGORIE_REGIONALE_FUNDAFRICA || null,
          row.CATEGORIE_GLOBALE_FUNDAFRICA || null,
          row.PAGE_LOCALE || null, row.PAGE_EUR || null, row.PAGE_USD || null,
          row.DEVISE_CLASSEMENT_LOCALE || null, row.DEVISE_CLASSEMENT_REGIONALE || null,
          row.DEVISE_CLASSEMENT_GLOBALE || null, row.LOGIQUE_METIER || null,
          row.STATUT || 'ACTIVE'
        ]
      );
      inserted3 += r.affectedRows;
    }
  }
  console.log(`  ${categories.length} categories. ${EXECUTE ? inserted3 + ' inserees.' : 'A inserer.'}`);

  // --- 4. ref_indices_fundafrica ---
  console.log('\n=== 4. ref_indices_fundafrica ===');
  if (EXECUTE) {
    await conn.execute(`CREATE TABLE IF NOT EXISTS ref_indices_fundafrica (
      id INT AUTO_INCREMENT PRIMARY KEY,
      indice_id VARCHAR(150) NOT NULL UNIQUE,
      categorie_fundafrica VARCHAR(200),
      niveau_categorie VARCHAR(50),
      classification_regulateur VARCHAR(50),
      nom_indice_usd VARCHAR(200),
      nom_indice_eur VARCHAR(200),
      indice_supplementaire_usd VARCHAR(200),
      indice_supplementaire_eur VARCHAR(200),
      devise_base_indice VARCHAR(50),
      utilisation_page_locale VARCHAR(10),
      utilisation_page_eur VARCHAR(10),
      utilisation_page_usd VARCHAR(10),
      source_primaire TEXT,
      source_secondaire TEXT,
      statut_indice VARCHAR(50) NOT NULL DEFAULT 'MISSING_BENCHMARK',
      regle_conversion TEXT,
      commentaire_controle TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }
  const indices = data['04_REF_INDICES_FUNDAFRICA'];
  let inserted4 = 0;
  for (const row of indices) {
    if (EXECUTE) {
      const [r] = await conn.execute(
        `INSERT IGNORE INTO ref_indices_fundafrica
         (indice_id, categorie_fundafrica, niveau_categorie, classification_regulateur,
          nom_indice_usd, nom_indice_eur, indice_supplementaire_usd, indice_supplementaire_eur,
          devise_base_indice, utilisation_page_locale, utilisation_page_eur, utilisation_page_usd,
          source_primaire, source_secondaire, statut_indice, regle_conversion, commentaire_controle)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.INDICE_ID, row.CATEGORIE_FUNDAFRICA || null, row.NIVEAU_CATEGORIE || null,
          row.CLASSIFICATION_REGULATEUR || null,
          row.NOM_INDICE_USD_OU_BASE || null, row.NOM_INDICE_EUR || null,
          row.INDICE_SUPPLEMENTAIRE_USD || null, row.INDICE_SUPPLEMENTAIRE_EUR || null,
          row.DEVISE_BASE_INDICE || null,
          row.UTILISATION_PAGE_LOCALE || null, row.UTILISATION_PAGE_EUR || null,
          row.UTILISATION_PAGE_USD || null,
          row.SOURCE_PRIMAIRE || null, row.SOURCE_SECONDAIRE || null,
          row.STATUT_INDICE || 'MISSING_BENCHMARK',
          row.REGLE_CONVERSION || null, row.COMMENTAIRE_CONTROLE || null
        ]
      );
      inserted4 += r.affectedRows;
    }
  }
  console.log(`  ${indices.length} indices. ${EXECUTE ? inserted4 + ' inserees.' : 'A inserer.'}`);

  // --- 5. ref_index_sources ---
  console.log('\n=== 5. ref_index_sources ===');
  if (EXECUTE) {
    await conn.execute(`CREATE TABLE IF NOT EXISTS ref_index_sources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      source_id VARCHAR(100) NOT NULL UNIQUE,
      source_name VARCHAR(200) NOT NULL,
      source_url TEXT,
      usage_description TEXT,
      commentaire TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }
  const sources = data['05_REF_SOURCES_INDICES'];
  let inserted5 = 0;
  for (const row of sources) {
    if (EXECUTE) {
      const [r] = await conn.execute(
        `INSERT IGNORE INTO ref_index_sources (source_id, source_name, source_url, usage_description, commentaire)
         VALUES (?, ?, ?, ?, ?)`,
        [row.SOURCE_ID, row.SOURCE_NAME, row.SOURCE_URL || null, row.USAGE || null, row.COMMENTAIRE || null]
      );
      inserted5 += r.affectedRows;
    }
  }
  console.log(`  ${sources.length} sources. ${EXECUTE ? inserted5 + ' inserees.' : 'A inserer.'}`);

  // --- Verification ---
  if (EXECUTE) {
    console.log('\n=== VERIFICATION ===');
    const tables = ['ref_asset_classes', 'ref_geo_zones', 'ref_categories_fundafrica', 'ref_indices_fundafrica', 'ref_index_sources'];
    for (const t of tables) {
      const [rows] = await conn.execute(`SELECT COUNT(*) as c FROM ${t}`);
      console.log(`  ${t}: ${rows[0].c} lignes`);
    }

    const [validated] = await conn.execute(`SELECT COUNT(*) as c FROM ref_indices_fundafrica WHERE statut_indice = 'VALIDATED_OR_TO_VERIFY'`);
    const [missing] = await conn.execute(`SELECT COUNT(*) as c FROM ref_indices_fundafrica WHERE statut_indice = 'MISSING_BENCHMARK'`);
    const [composite] = await conn.execute(`SELECT COUNT(*) as c FROM ref_indices_fundafrica WHERE statut_indice = 'COMPOSITE_TO_BUILD'`);
    const [rate] = await conn.execute(`SELECT COUNT(*) as c FROM ref_indices_fundafrica WHERE statut_indice = 'RATE_TO_DEFINE'`);
    console.log(`\n  Indices par statut:`);
    console.log(`    VALIDATED_OR_TO_VERIFY: ${validated[0].c}`);
    console.log(`    MISSING_BENCHMARK:      ${missing[0].c}`);
    console.log(`    COMPOSITE_TO_BUILD:     ${composite[0].c}`);
    console.log(`    RATE_TO_DEFINE:         ${rate[0].c}`);
  }

  console.log('\n=== RESUME ===');
  console.log(`ref_asset_classes:         ${assetClasses.length} lignes`);
  console.log(`ref_geo_zones:             ${geoZones.length} lignes`);
  console.log(`ref_categories_fundafrica: ${categories.length} lignes`);
  console.log(`ref_indices_fundafrica:    ${indices.length} lignes`);
  console.log(`ref_index_sources:         ${sources.length} lignes`);
  console.log(`\nTables existantes NON modifiees: fond_investissements, indice_references, valorisations, pays_regulateurs`);

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
