/**
 * fix_populate_rendements.js
 *
 * Peuple la table `rendements` avec les rendements journaliers, hebdomadaires
 * et mensuels pour tous les fonds actifs.
 *
 * Calcul direct SQL — pas d'appel API interne.
 *
 * Colonnes peuplees:
 *   - rendement_jour:    (VL(t) - VL(t-1)) / VL(t-1)
 *   - rendement_semaine: (VL fin semaine - VL fin semaine precedente) / VL precedente
 *   - rendement_mensuel: (VL fin mois - VL fin mois precedent) / VL precedent
 *
 * NON-DESTRUCTIF: INSERT IGNORE (ne duplique pas)
 *
 * Usage:
 *   node fix_populate_rendements.js              # tous les fonds actifs
 *   node fix_populate_rendements.js --fond 1131  # un seul fond
 *   node fix_populate_rendements.js --pays MAROC  # fonds d'un pays
 *   node fix_populate_rendements.js --truncate    # vider la table avant (attention!)
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
  const args = process.argv.slice(2);
  const fondId = args.includes('--fond') ? parseInt(args[args.indexOf('--fond') + 1]) : null;
  const pays = args.includes('--pays') ? args[args.indexOf('--pays') + 1] : null;
  const truncate = args.includes('--truncate');

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm\n');

  if (truncate) {
    console.log('TRUNCATE rendements...');
    await conn.execute('TRUNCATE TABLE rendements');
    console.log('  Table videe.\n');
  }

  let whereClause = 'active = 1';
  const params = [];
  if (fondId) {
    whereClause += ' AND id = ?';
    params.push(fondId);
  } else if (pays) {
    whereClause += ' AND UPPER(pays) = UPPER(?)';
    params.push(pays);
  }

  const [fonds] = await conn.execute(
    `SELECT id, nom_fond, pays FROM fond_investissements WHERE ${whereClause} ORDER BY id`,
    params
  );
  console.log(`${fonds.length} fonds a traiter\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let errors = 0;

  for (let i = 0; i < fonds.length; i++) {
    const f = fonds[i];
    try {
      const [vls] = await conn.execute(
        `SELECT date, value FROM valorisations
         WHERE fund_id = ? AND value IS NOT NULL AND value > 0
         ORDER BY date ASC`,
        [f.id]
      );

      if (vls.length < 2) {
        totalSkipped++;
        continue;
      }

      const batch = [];

      // --- Rendements journaliers ---
      for (let j = 1; j < vls.length; j++) {
        const prev = vls[j - 1];
        const curr = vls[j];
        if (prev.value > 0) {
          const rendJour = (curr.value - prev.value) / prev.value;
          const dateStr = curr.date instanceof Date
            ? curr.date.toISOString().split('T')[0]
            : String(curr.date);
          batch.push([dateStr, rendJour, null, null, f.id]);
        }
      }

      // --- Rendements hebdomadaires ---
      const byWeek = {};
      for (const v of vls) {
        const d = v.date instanceof Date ? v.date : new Date(v.date);
        const yr = d.getFullYear();
        const jan1 = new Date(yr, 0, 1);
        const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        const key = `${yr}-W${String(week).padStart(2, '0')}`;
        byWeek[key] = { date: v.date, value: v.value };
      }
      const weekKeys = Object.keys(byWeek).sort();
      for (let j = 1; j < weekKeys.length; j++) {
        const prev = byWeek[weekKeys[j - 1]];
        const curr = byWeek[weekKeys[j]];
        if (prev.value > 0) {
          const rendSem = (curr.value - prev.value) / prev.value;
          const dateStr = curr.date instanceof Date
            ? curr.date.toISOString().split('T')[0]
            : String(curr.date);
          batch.push([dateStr, null, rendSem, null, f.id]);
        }
      }

      // --- Rendements mensuels ---
      const byMonth = {};
      for (const v of vls) {
        const d = v.date instanceof Date ? v.date : new Date(v.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        byMonth[key] = { date: v.date, value: v.value };
      }
      const monthKeys = Object.keys(byMonth).sort();
      for (let j = 1; j < monthKeys.length; j++) {
        const prev = byMonth[monthKeys[j - 1]];
        const curr = byMonth[monthKeys[j]];
        if (prev.value > 0) {
          const rendMens = (curr.value - prev.value) / prev.value;
          const dateStr = curr.date instanceof Date
            ? curr.date.toISOString().split('T')[0]
            : String(curr.date);
          batch.push([dateStr, null, null, rendMens, f.id]);
        }
      }

      // Batch insert
      if (batch.length > 0) {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let b = 0; b < batch.length; b += BATCH_SIZE) {
          const chunk = batch.slice(b, b + BATCH_SIZE);
          const placeholders = chunk.map(() => '(?, ?, ?, ?, ?)').join(', ');
          try {
            const [result] = await conn.execute(
              `INSERT IGNORE INTO rendements (date, rendement_jour, rendement_semaine, rendement_mensuel, fond_id)
               VALUES ${placeholders}`,
              chunk.flat()
            );
            inserted += result.affectedRows;
          } catch (e) {
            console.error(`  ERREUR batch fond ${f.id}: ${e.message}`);
            errors++;
          }
        }
        totalInserted += inserted;
      }

      if ((i + 1) % 100 === 0 || i === fonds.length - 1) {
        console.log(`  [${i + 1}/${fonds.length}] ${f.nom_fond?.substring(0, 40)} — ${batch.length} rendements`);
      }
    } catch (e) {
      console.error(`  ERREUR fond ${f.id} (${f.nom_fond}): ${e.message}`);
      errors++;
    }
  }

  // Verification
  const [count] = await conn.execute('SELECT COUNT(*) as c FROM rendements');
  const [fondCount] = await conn.execute('SELECT COUNT(DISTINCT fond_id) as c FROM rendements');

  console.log('\n=== RESUME ===');
  console.log(`Fonds traites:      ${fonds.length}`);
  console.log(`Fonds ignores:      ${totalSkipped} (< 2 VL)`);
  console.log(`Rendements inseres: ${totalInserted}`);
  console.log(`Erreurs:            ${errors}`);
  console.log(`Total en base:      ${count[0].c} rendements / ${fondCount[0].c} fonds`);

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
