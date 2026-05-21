/**
 * Harmonisation des categories dans fond_investissements
 *
 * Normalise les champs categorie_globale, categorie_libelle, classification
 * pour eliminer les doublons de casse (ACTIONS vs Actions, DIVERSIFIE vs Diversifié)
 *
 * Regle: tout en MAJUSCULES, sans accents
 * - "Actions" / "ACTIONS" / "actions" -> "ACTIONS"
 * - "Diversifié" / "DIVERSIFIE" / "Diversifie" -> "DIVERSIFIE"
 * - "Monétaire" / "MONETAIRE" / "Monetaire" -> "MONETAIRE"
 * - "Obligations" / "OBLIGATIONS" / "Obligataire" -> "OBLIGATIONS"
 * - "Autres" / "AUTRES" -> "AUTRES"
 *
 * NON-DESTRUCTIF: ne modifie que la casse/accents, pas le sens
 *
 * Usage: node fix_harmonize_categories.js
 */

const mysql = require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const CATEGORY_MAP = {
  'actions': 'ACTIONS',
  'action': 'ACTIONS',
  'equity': 'ACTIONS',
  'equities': 'ACTIONS',

  'diversifie': 'DIVERSIFIE',
  'diversifié': 'DIVERSIFIE',
  'diversifies': 'DIVERSIFIE',
  'diversifiés': 'DIVERSIFIE',
  'diversified': 'DIVERSIFIE',
  'mixte': 'DIVERSIFIE',
  'balanced': 'DIVERSIFIE',

  'monetaire': 'MONETAIRE',
  'monétaire': 'MONETAIRE',
  'money market': 'MONETAIRE',

  'obligations': 'OBLIGATIONS',
  'obligataire': 'OBLIGATIONS',
  'obligation': 'OBLIGATIONS',
  'bonds': 'OBLIGATIONS',
  'bond': 'OBLIGATIONS',
  'fixed income': 'OBLIGATIONS',
  'obligations moyen et long terme': 'OBLIGATIONS',
  'obligations court terme': 'OBLIGATIONS',
  'obligations et autres titres de creance': 'OBLIGATIONS',

  'autres': 'AUTRES',
  'other': 'AUTRES',
  'others': 'AUTRES',
};

function normalizeCategory(value) {
  if (!value || value.trim() === '') return null;
  const lower = value.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  return value.trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm\n');

  const fields = ['categorie_globale', 'categorie_libelle', 'classification'];
  const report = { updated: 0, skipped: 0, errors: [] };

  for (const field of fields) {
    console.log(`=== Champ: ${field} ===`);

    const [distinct] = await conn.execute(
      `SELECT DISTINCT ${field} as val, COUNT(*) as cnt FROM fond_investissements WHERE ${field} IS NOT NULL AND ${field} != '' GROUP BY ${field} ORDER BY cnt DESC`
    );

    console.log(`  Valeurs distinctes: ${distinct.length}`);
    for (const row of distinct) {
      const normalized = normalizeCategory(row.val);
      if (normalized && normalized !== row.val) {
        console.log(`  "${row.val}" (${row.cnt} fonds) -> "${normalized}"`);
        try {
          const [result] = await conn.execute(
            `UPDATE fond_investissements SET ${field} = ? WHERE ${field} = ?`,
            [normalized, row.val]
          );
          report.updated += result.affectedRows;
        } catch (e) {
          report.errors.push(`${field} "${row.val}": ${e.message}`);
        }
      } else {
        console.log(`  "${row.val}" (${row.cnt} fonds) -> OK`);
        report.skipped += row.cnt;
      }
    }
    console.log('');
  }

  // Also normalize categorie_national and categorie_regional (just uppercase)
  for (const field of ['categorie_national', 'categorie_regional']) {
    console.log(`=== Champ: ${field} (mise en majuscules) ===`);

    const [distinct] = await conn.execute(
      `SELECT DISTINCT ${field} as val, COUNT(*) as cnt FROM fond_investissements WHERE ${field} IS NOT NULL AND ${field} != '' GROUP BY ${field} ORDER BY cnt DESC`
    );

    console.log(`  Valeurs distinctes: ${distinct.length}`);
    for (const row of distinct) {
      const upper = row.val.trim().toUpperCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (upper !== row.val) {
        console.log(`  "${row.val}" (${row.cnt} fonds) -> "${upper}"`);
        try {
          const [result] = await conn.execute(
            `UPDATE fond_investissements SET ${field} = ? WHERE ${field} = ?`,
            [upper, row.val]
          );
          report.updated += result.affectedRows;
        } catch (e) {
          report.errors.push(`${field} "${row.val}": ${e.message}`);
        }
      } else {
        report.skipped += row.cnt;
      }
    }
    console.log('');
  }

  console.log('==========================================');
  console.log('=== RAPPORT HARMONISATION CATEGORIES ===');
  console.log('==========================================');
  console.log(`Fonds mis a jour:  ${report.updated}`);
  console.log(`Fonds deja OK:     ${report.skipped}`);
  console.log(`Erreurs:           ${report.errors.length}`);
  if (report.errors.length > 0) {
    report.errors.forEach(e => console.log(`  - ${e}`));
  }

  // Verification finale
  const [verif] = await conn.execute(`
    SELECT categorie_globale as cat, COUNT(*) as cnt
    FROM fond_investissements
    WHERE categorie_globale IS NOT NULL AND categorie_globale != ''
    GROUP BY categorie_globale ORDER BY cnt DESC
  `);
  console.log('\nVerification categorie_globale apres harmonisation:');
  verif.forEach(r => console.log(`  ${r.cat}: ${r.cnt} fonds`));

  await conn.end();
  console.log('\nTermine.');
}

run().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
