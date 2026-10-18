/**
 * Création des sociétés de gestion Nigeria dans la table societes
 * et rattachement des fonds via societe_id.
 *
 * Problème: import_vl_nigeria_sec.js remplit fond_investissements.societe_gestion (texte)
 * mais ne crée pas les entrées dans la table societes ni ne met à jour societe_id.
 * Résultat: la page /fund-managers/ crash avec "Cannot read properties of null".
 *
 * Usage: node fix_nigeria_societes.js
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

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecté à la base fund_opcvm');

  // 1. Récupérer toutes les societes_gestion distinctes des fonds Nigeria
  const [fondsSG] = await conn.execute(`
    SELECT DISTINCT societe_gestion
    FROM fond_investissements
    WHERE LOWER(pays) = 'nigeria'
      AND societe_gestion IS NOT NULL
      AND societe_gestion != ''
    ORDER BY societe_gestion
  `);

  console.log(`\n${fondsSG.length} sociétés de gestion distinctes trouvées dans les fonds Nigeria\n`);

  let created = 0;
  let alreadyExist = 0;
  let fondsRattached = 0;

  for (const row of fondsSG) {
    const sgName = row.societe_gestion.trim();
    if (!sgName) continue;

    // Vérifier si la société existe déjà dans la table societes
    const [existing] = await conn.execute(
      `SELECT id, nom FROM societes WHERE nom = ? LIMIT 1`,
      [sgName]
    );

    let societeId;

    if (existing.length > 0) {
      societeId = existing[0].id;
      alreadyExist++;
      console.log(`  EXISTE DÉJÀ: "${sgName}" (id=${societeId})`);
    } else {
      // Créer la société
      const [result] = await conn.execute(
        `INSERT INTO societes (nom, pays, regulateur, devise, created_at, updated_at)
         VALUES (?, 'Nigeria', 'SEC Nigeria', 'NGN', NOW(), NOW())`,
        [sgName]
      );
      societeId = result.insertId;
      created++;
      console.log(`  CRÉÉE: "${sgName}" (id=${societeId})`);
    }

    // Rattacher tous les fonds Nigeria qui ont cette societe_gestion
    const [updateResult] = await conn.execute(
      `UPDATE fond_investissements
       SET societe_id = ?
       WHERE societe_gestion = ? AND LOWER(pays) = 'nigeria' AND (societe_id IS NULL OR societe_id = 0)`,
      [societeId, sgName]
    );

    if (updateResult.affectedRows > 0) {
      fondsRattached += updateResult.affectedRows;
      console.log(`    → ${updateResult.affectedRows} fonds rattachés à societe_id=${societeId}`);
    }
  }

  // 2. Vérification: fonds Nigeria sans societe_id
  const [orphans] = await conn.execute(`
    SELECT id, nom_fond, societe_gestion
    FROM fond_investissements
    WHERE LOWER(pays) = 'nigeria' AND (societe_id IS NULL OR societe_id = 0)
    ORDER BY nom_fond
  `);

  console.log('\n==========================================');
  console.log('=== RAPPORT CRÉATION SOCIÉTÉS NIGERIA ===');
  console.log('==========================================');
  console.log(`Sociétés créées:          ${created}`);
  console.log(`Sociétés déjà existantes: ${alreadyExist}`);
  console.log(`Fonds rattachés:          ${fondsRattached}`);
  console.log(`Fonds orphelins restants: ${orphans.length}`);

  if (orphans.length > 0) {
    console.log('\nFonds sans societe_id:');
    for (const o of orphans) {
      console.log(`  id=${o.id} | ${o.nom_fond} | sg="${o.societe_gestion || 'VIDE'}"`);
    }
  }

  await conn.end();
  console.log('\nConnexion fermée');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
