/**
 * Normalise le pays 'Nigeria' -> 'NIGERIA' dans fond_investissements et societes
 * pour cohérence avec la table pays_regulateurs.
 *
 * Corrige aussi le fonds parasite id=2820 (nom_fond="1").
 *
 * Usage: node fix_nigeria_pays_casing.js
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecté à la base fund_opcvm');

  // 1. Vérifier le casing dans pays_regulateurs
  const [prRows] = await conn.execute(`SELECT id, pays FROM pays_regulateurs WHERE LOWER(pays) = 'nigeria'`);
  console.log('\npays_regulateurs entries for Nigeria:');
  for (const r of prRows) console.log(`  id=${r.id}: "${r.pays}"`);

  // Déterminer le bon casing (celui de pays_regulateurs)
  const correctPays = prRows.length > 0 ? prRows[0].pays : 'NIGERIA';
  console.log(`\nCasing cible: "${correctPays}"`);

  // 2. Normaliser fond_investissements.pays
  const [fondsResult] = await conn.execute(
    `UPDATE fond_investissements SET pays = ? WHERE LOWER(pays) = 'nigeria' AND pays != ?`,
    [correctPays, correctPays]
  );
  console.log(`\nfond_investissements: ${fondsResult.affectedRows} fonds mis à jour vers "${correctPays}"`);

  // 3. Normaliser societes.pays
  const [socResult] = await conn.execute(
    `UPDATE societes SET pays = ? WHERE LOWER(pays) = 'nigeria' AND pays != ?`,
    [correctPays, correctPays]
  );
  console.log(`societes: ${socResult.affectedRows} sociétés mises à jour vers "${correctPays}"`);

  // 4. Supprimer le fonds parasite nom_fond="1"
  const [parasites] = await conn.execute(
    `SELECT id, nom_fond, pays FROM fond_investissements WHERE nom_fond = '1' AND LOWER(pays) IN ('nigeria', 'NIGERIA')`
  );
  if (parasites.length > 0) {
    for (const p of parasites) {
      // Supprimer ses VL d'abord
      const [vlDel] = await conn.execute(`DELETE FROM valorisations WHERE fund_id = ?`, [p.id]);
      console.log(`\nFonds parasite id=${p.id} (nom="1"): ${vlDel.affectedRows} VL supprimées`);

      // Supprimer ses performances
      await conn.execute(`DELETE FROM performences WHERE fond_id = ?`, [p.id]);
      await conn.execute(`DELETE FROM performences_eurs WHERE fond_id = ?`, [p.id]);
      await conn.execute(`DELETE FROM performences_usds WHERE fond_id = ?`, [p.id]);

      // Supprimer le fonds
      await conn.execute(`DELETE FROM fond_investissements WHERE id = ?`, [p.id]);
      console.log(`  Fonds parasite id=${p.id} supprimé`);
    }
  } else {
    console.log('\nAucun fonds parasite nom_fond="1" trouvé');
  }

  // 5. Vérification
  const [check] = await conn.execute(
    `SELECT pays, COUNT(*) as nb FROM fond_investissements WHERE LOWER(pays) = 'nigeria' GROUP BY pays`
  );
  console.log('\n=== VÉRIFICATION ===');
  for (const r of check) console.log(`  fond_investissements: pays="${r.pays}" -> ${r.nb} fonds`);

  const [checkSoc] = await conn.execute(
    `SELECT pays, COUNT(*) as nb FROM societes WHERE LOWER(pays) = 'nigeria' GROUP BY pays`
  );
  for (const r of checkSoc) console.log(`  societes: pays="${r.pays}" -> ${r.nb} sociétés`);

  await conn.end();
  console.log('\nConnexion fermée');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
