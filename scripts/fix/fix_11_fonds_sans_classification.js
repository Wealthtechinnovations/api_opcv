#!/usr/bin/env node
/**
 * fix_11_fonds_sans_classification.js
 *
 * Diagnostic et correction des 11 fonds avec classification NULL
 * dans fond_investissements.
 *
 * Usage:
 *   node scripts/fix/fix_11_fonds_sans_classification.js              # diagnostic
 *   node scripts/fix/fix_11_fonds_sans_classification.js --execute    # correction
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

const CLASSIFICATION_FROM_CATEGORY = {
  'ACTIONS': 'ACTIONS',
  'OBLIGATIONS': 'OBLIGATIONS',
  'MONETAIRE': 'MONETAIRE',
  'DIVERSIFIE': 'DIVERSIFIE',
  'DIVERSIFIES': 'DIVERSIFIE',
  'OBLIGATAIRE': 'OBLIGATIONS',
};

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm');
  console.log(EXECUTE ? 'MODE: EXECUTE\n' : 'MODE: DIAGNOSTIC\n');

  const [fonds] = await conn.query(`
    SELECT id, nom_fond, pays, classification, categorie_globale, categorie_national,
           categorie_regionale, categorie_fundafrica_nationale, indice_fundafrica,
           societe_gestion, active
    FROM fond_investissements
    WHERE classification IS NULL OR classification = ''
    ORDER BY pays, nom_fond
  `);

  console.log(`${fonds.length} fonds sans classification:\n`);

  let fixed = 0;
  for (const f of fonds) {
    console.log(`  ID=${f.id} pays=${f.pays} actif=${f.active}`);
    console.log(`    nom: ${f.nom_fond}`);
    console.log(`    cat_globale: ${f.categorie_globale || 'NULL'}`);
    console.log(`    cat_national: ${f.categorie_national || 'NULL'}`);
    console.log(`    societe: ${f.societe_gestion || 'NULL'}`);

    let newClassif = null;

    if (f.categorie_globale && CLASSIFICATION_FROM_CATEGORY[f.categorie_globale.toUpperCase()]) {
      newClassif = CLASSIFICATION_FROM_CATEGORY[f.categorie_globale.toUpperCase()];
    } else if (f.nom_fond) {
      const nom = f.nom_fond.toUpperCase();
      if (nom.includes('ACTION') || nom.includes('EQUITY') || nom.includes('ETF')) {
        newClassif = 'ACTIONS';
      } else if (nom.includes('OBLIG') || nom.includes('BOND') || nom.includes('FIXED')) {
        newClassif = 'OBLIGATIONS';
      } else if (nom.includes('MONET') || nom.includes('CASH') || nom.includes('MONEY') || nom.includes('TRESO') || nom.includes('LIQUI')) {
        newClassif = 'MONETAIRE';
      } else if (nom.includes('DIVERS') || nom.includes('BALANCED') || nom.includes('MIXED')) {
        newClassif = 'DIVERSIFIE';
      }
    }

    if (newClassif) {
      console.log(`    → Classification proposee: ${newClassif}`);
      if (EXECUTE) {
        await conn.query(
          `UPDATE fond_investissements SET classification = ? WHERE id = ?`,
          [newClassif, f.id]
        );
        fixed++;
        console.log(`    ✓ Mis a jour`);
      }
    } else {
      console.log(`    → Impossible a determiner automatiquement`);
    }
    console.log('');
  }

  if (EXECUTE) {
    console.log(`\n${fixed}/${fonds.length} fonds corriges.`);
  } else {
    console.log(`\n(Mode diagnostic — ajouter --execute pour corriger.)`);
  }

  // Verifier indice_fundafrica pour les fonds corriges
  if (EXECUTE && fixed > 0) {
    console.log('\nVerification indice_fundafrica pour les fonds corriges...');
    const [needIndice] = await conn.query(`
      SELECT f.id, f.nom_fond, f.pays, f.classification,
             r.indice_fundafrica as ref_indice, r.statut_indice
      FROM fond_investissements f
      LEFT JOIN ref_indices_fundafrica r ON r.pays = f.pays AND r.asset_class = f.classification
      WHERE f.id IN (${fonds.map(f => f.id).join(',')})
        AND (f.indice_fundafrica IS NULL OR f.indice_fundafrica = '')
    `);
    for (const f of needIndice) {
      if (f.ref_indice) {
        await conn.query(
          `UPDATE fond_investissements SET indice_fundafrica = ?, statut_indice_fundafrica = ? WHERE id = ?`,
          [f.ref_indice, f.statut_indice || 'VALIDATED_OR_TO_VERIFY', f.id]
        );
        console.log(`  ID=${f.id}: indice_fundafrica = ${f.ref_indice}`);
      }
    }
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => { console.error('ERREUR:', e); process.exit(1); });
