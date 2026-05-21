/**
 * Correction des 15 fonds orphelins Nigeria (societe_gestion vide)
 * et nettoyage des doublons dans la table societes.
 *
 * Problème 1: fix_nigeria_fuzzy_matches.js a créé 15 fonds sans societe_gestion
 * Problème 2: Societe "1" est une valeur parasite
 * Problème 3: Doublons de sociétés (variations de noms: "Ltd" vs "Limited", etc.)
 *
 * Usage: node fix_nigeria_orphans_and_dupes.js
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

const ORPHAN_FUND_MANAGERS = {
  'DLM Money Market Fund': 'DLM Asset Management Limited',
  'FSL Money Market Fund': 'FSL Asset Management Limited',
  'GTI Money Market Fund': 'GTI Asset Management & Trust Limited',
  'Page Money Market Fund': 'Page Asset Management Limited',
  'RMBN Money Market Fund': 'RMB Nigeria Asset Management Ltd.',
  'SCM Capital Money Market Fund': 'SCM Capital Limited',
  'STL Money Market Fund': 'STL Asset Management Limited',
  'FAAM Money Market Fund': 'FAAM Money Market Fund Manager',
  'Lead Dollar Fixed Income Fund': 'Lead Asset Management Limited',
  'RMBN Dollar Fixed Income Fund': 'RMB Nigeria Asset Management Ltd.',
  'ARM Specialized Dollar Fund': 'ARM Investment Managers Limited',
  'Coronation Premium Fixed Income Fund': 'Coronation Asset Management Limited',
  'United Capital Stable Income Fund': 'United Capital Asset Mgt. Ltd',
  'ARM Short-Term Eurobond Fund': 'ARM Investment Managers Limited',
  'UBA Nom-Cowry Fixed Income Fund': 'Cowry Treasurers Limited',
};

const SOCIETE_DUPLICATES = [
  { keep: 'Coronation Asset Management Limited', merge: 'Coronation Asset Management Ltd' },
  { keep: 'Stanbic IBTC Asset Mgt. Limited', merge: 'Stanbic IBTC Asset Mgt.Limited' },
  { keep: 'Vetiva Fund Managers Limited', merge: 'Vetiva Fund Managers' },
  { keep: 'Zenith Asset Management Ltd', merge: 'Zenith Asset Management Ltd.' },
  { keep: 'Chapel Hill Denham Mgt. Limited', merge: 'Chapel Hill Denham Management Limited' },
  { keep: 'Alternative Capital Partners Limited', merge: 'Alternative Cap. Partners Ltd' },
  { keep: 'FBN Capital Asset Mgt. Limited', merge: 'FBN Capital Asset Mgt Limited' },
  { keep: 'First City Asset Management Limited', merge: 'First City Asset Management Plc' },
  { keep: 'ARM Investment Managers Limited', merge: 'Asset & Resources Mgt. Co. Ltd' },
  { keep: 'Coronation Asset Management Limited', merge: 'Coronation Asset Management' },
];

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecté à la base fund_opcvm');

  let orphansFixed = 0;
  let dupesFixed = 0;

  // ============================================================
  // PARTIE 1: Corriger les 15 fonds orphelins
  // ============================================================
  console.log('\n=== PARTIE 1: CORRECTION FONDS ORPHELINS ===\n');

  for (const [fondName, managerName] of Object.entries(ORPHAN_FUND_MANAGERS)) {
    const [funds] = await conn.execute(
      `SELECT id, societe_gestion, societe_id FROM fond_investissements WHERE nom_fond = ? AND LOWER(pays) = 'nigeria'`,
      [fondName]
    );

    if (funds.length === 0) {
      console.log(`  SKIP: "${fondName}" non trouvé en base`);
      continue;
    }

    const fund = funds[0];

    // Trouver ou créer la société
    let [socs] = await conn.execute(`SELECT id FROM societes WHERE nom = ? LIMIT 1`, [managerName]);
    let socId;

    if (socs.length > 0) {
      socId = socs[0].id;
    } else {
      const [result] = await conn.execute(
        `INSERT INTO societes (nom, pays, regulateur, devise, created_at, updated_at)
         VALUES (?, 'Nigeria', 'SEC Nigeria', 'NGN', NOW(), NOW())`,
        [managerName]
      );
      socId = result.insertId;
      console.log(`  Société créée: "${managerName}" (id=${socId})`);
    }

    await conn.execute(
      `UPDATE fond_investissements SET societe_gestion = ?, societe_id = ? WHERE id = ?`,
      [managerName, socId, fund.id]
    );
    orphansFixed++;
    console.log(`  CORRIGÉ: "${fondName}" → société "${managerName}" (societe_id=${socId})`);
  }

  // ============================================================
  // PARTIE 2: Supprimer la société parasite "1"
  // ============================================================
  console.log('\n=== PARTIE 2: SUPPRESSION SOCIÉTÉ PARASITE ===\n');

  const [parasites] = await conn.execute(`SELECT id FROM societes WHERE nom = '1'`);
  if (parasites.length > 0) {
    for (const p of parasites) {
      await conn.execute(`UPDATE fond_investissements SET societe_id = NULL WHERE societe_id = ?`, [p.id]);
      await conn.execute(`DELETE FROM societes WHERE id = ?`, [p.id]);
      console.log(`  Supprimé: société "1" (id=${p.id})`);
    }
    // Le fonds avec societe_gestion="1" doit aussi être nettoyé
    await conn.execute(
      `UPDATE fond_investissements SET societe_gestion = NULL WHERE societe_gestion = '1' AND LOWER(pays) = 'nigeria'`
    );
  } else {
    console.log('  Aucune société parasite "1" trouvée');
  }

  // ============================================================
  // PARTIE 3: Fusionner les doublons de sociétés
  // ============================================================
  console.log('\n=== PARTIE 3: FUSION DOUBLONS SOCIÉTÉS ===\n');

  for (const { keep, merge } of SOCIETE_DUPLICATES) {
    const [keepSocs] = await conn.execute(`SELECT id FROM societes WHERE nom = ?`, [keep]);
    const [mergeSocs] = await conn.execute(`SELECT id FROM societes WHERE nom = ?`, [merge]);

    if (keepSocs.length === 0 || mergeSocs.length === 0) {
      console.log(`  SKIP: "${keep}" ou "${merge}" non trouvé`);
      continue;
    }

    const keepId = keepSocs[0].id;
    const mergeId = mergeSocs[0].id;

    // Rattacher les fonds du doublon vers la société à garder
    const [updateResult] = await conn.execute(
      `UPDATE fond_investissements SET societe_id = ?, societe_gestion = ? WHERE societe_id = ?`,
      [keepId, keep, mergeId]
    );

    // Supprimer la société doublon
    await conn.execute(`DELETE FROM societes WHERE id = ?`, [mergeId]);
    dupesFixed++;
    console.log(`  FUSIONNÉ: "${merge}" (id=${mergeId}) → "${keep}" (id=${keepId}), ${updateResult.affectedRows} fonds déplacés`);
  }

  // ============================================================
  // RAPPORT FINAL
  // ============================================================
  const [finalOrphans] = await conn.execute(
    `SELECT COUNT(*) as c FROM fond_investissements WHERE LOWER(pays) = 'nigeria' AND (societe_id IS NULL OR societe_id = 0)`
  );
  const [finalSocs] = await conn.execute(
    `SELECT COUNT(*) as c FROM societes WHERE LOWER(pays) = 'nigeria'`
  );

  console.log('\n==========================================');
  console.log('=== RAPPORT FINAL ===');
  console.log('==========================================');
  console.log(`Orphelins corrigés:     ${orphansFixed}`);
  console.log(`Doublons fusionnés:     ${dupesFixed}`);
  console.log(`Orphelins restants:     ${finalOrphans[0].c}`);
  console.log(`Sociétés Nigeria:       ${finalSocs[0].c}`);

  await conn.end();
  console.log('\nConnexion fermée');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
