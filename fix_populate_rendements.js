/**
 * fix_populate_rendements.js
 *
 * Peuple la table `rendements` avec les rendements journaliers, hebdomadaires
 * et mensuels pour tous les fonds actifs, en 3 devises :
 *   - Devise locale (value)
 *   - EUR (value_EUR)
 *   - USD (value_USD)
 *
 * Calcul direct SQL — pas d'appel API interne.
 *
 * Colonnes peuplees (9 colonnes de rendement):
 *   - rendement_jour / rendement_jour_eur / rendement_jour_usd
 *   - rendement_semaine / rendement_semaine_eur / rendement_semaine_usd
 *   - rendement_mensuel / rendement_mensuel_eur / rendement_mensuel_usd
 *
 * Auto-migration: detecte et ajoute les colonnes manquantes (ensureSchema).
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

const INSERT_COLS = [
  'date', 'fond_id',
  'rendement_jour', 'rendement_jour_eur', 'rendement_jour_usd',
  'rendement_semaine', 'rendement_semaine_eur', 'rendement_semaine_usd',
  'rendement_mensuel', 'rendement_mensuel_eur', 'rendement_mensuel_usd',
];
const PLACEHOLDER = `(${INSERT_COLS.map(() => '?').join(', ')})`;

async function ensureSchema(conn) {
  const [cols] = await conn.execute('SHOW COLUMNS FROM rendements');
  const existing = new Set(cols.map(c => c.Field));
  console.log('Colonnes actuelles:', [...existing].join(', '));

  const required = [
    { name: 'fond_id',               type: 'INT DEFAULT NULL' },
    { name: 'rendement_jour',        type: 'DOUBLE DEFAULT NULL' },
    { name: 'rendement_jour_eur',    type: 'DOUBLE DEFAULT NULL' },
    { name: 'rendement_jour_usd',    type: 'DOUBLE DEFAULT NULL' },
    { name: 'rendement_semaine',     type: 'DOUBLE DEFAULT NULL' },
    { name: 'rendement_semaine_eur', type: 'DOUBLE DEFAULT NULL' },
    { name: 'rendement_semaine_usd', type: 'DOUBLE DEFAULT NULL' },
    { name: 'rendement_mensuel',     type: 'DOUBLE DEFAULT NULL' },
    { name: 'rendement_mensuel_eur', type: 'DOUBLE DEFAULT NULL' },
    { name: 'rendement_mensuel_usd', type: 'DOUBLE DEFAULT NULL' },
    { name: 'lastvl',                type: 'DOUBLE DEFAULT NULL' },
  ];

  let added = 0;
  for (const col of required) {
    if (!existing.has(col.name)) {
      console.log(`  + ALTER TABLE: ajout colonne ${col.name} (${col.type})`);
      await conn.execute(`ALTER TABLE rendements ADD COLUMN \`${col.name}\` ${col.type}`);
      added++;
    }
  }

  if (added > 0) {
    const [colsAfter] = await conn.execute('SHOW COLUMNS FROM rendements');
    console.log('Colonnes apres migration:', colsAfter.map(c => c.Field).join(', '));
  } else {
    console.log('Schema OK — aucune colonne manquante.');
  }
  console.log('');
}

function safeRend(curr, prev) {
  if (prev > 0 && curr != null && curr > 0) return (curr - prev) / prev;
  return null;
}

function toDateStr(d) {
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d);
}

async function run() {
  const args = process.argv.slice(2);
  const fondId = args.includes('--fond') ? parseInt(args[args.indexOf('--fond') + 1]) : null;
  const pays = args.includes('--pays') ? args[args.indexOf('--pays') + 1] : null;
  const truncate = args.includes('--truncate');

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm\n');

  await ensureSchema(conn);

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
        `SELECT date, value, value_EUR, value_USD FROM valorisations
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
        const rLocal = safeRend(curr.value, prev.value);
        const rEur   = safeRend(curr.value_EUR, prev.value_EUR);
        const rUsd   = safeRend(curr.value_USD, prev.value_USD);
        if (rLocal !== null || rEur !== null || rUsd !== null) {
          batch.push([
            toDateStr(curr.date), f.id,
            rLocal, rEur, rUsd,
            null, null, null,
            null, null, null,
          ]);
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
        byWeek[key] = v;
      }
      const weekKeys = Object.keys(byWeek).sort();
      for (let j = 1; j < weekKeys.length; j++) {
        const prev = byWeek[weekKeys[j - 1]];
        const curr = byWeek[weekKeys[j]];
        const rLocal = safeRend(curr.value, prev.value);
        const rEur   = safeRend(curr.value_EUR, prev.value_EUR);
        const rUsd   = safeRend(curr.value_USD, prev.value_USD);
        if (rLocal !== null || rEur !== null || rUsd !== null) {
          batch.push([
            toDateStr(curr.date), f.id,
            null, null, null,
            rLocal, rEur, rUsd,
            null, null, null,
          ]);
        }
      }

      // --- Rendements mensuels ---
      const byMonth = {};
      for (const v of vls) {
        const d = v.date instanceof Date ? v.date : new Date(v.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        byMonth[key] = v;
      }
      const monthKeys = Object.keys(byMonth).sort();
      for (let j = 1; j < monthKeys.length; j++) {
        const prev = byMonth[monthKeys[j - 1]];
        const curr = byMonth[monthKeys[j]];
        const rLocal = safeRend(curr.value, prev.value);
        const rEur   = safeRend(curr.value_EUR, prev.value_EUR);
        const rUsd   = safeRend(curr.value_USD, prev.value_USD);
        if (rLocal !== null || rEur !== null || rUsd !== null) {
          batch.push([
            toDateStr(curr.date), f.id,
            null, null, null,
            null, null, null,
            rLocal, rEur, rUsd,
          ]);
        }
      }

      // Batch insert
      if (batch.length > 0) {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let b = 0; b < batch.length; b += BATCH_SIZE) {
          const chunk = batch.slice(b, b + BATCH_SIZE);
          const placeholders = chunk.map(() => PLACEHOLDER).join(', ');
          try {
            const [result] = await conn.execute(
              `INSERT IGNORE INTO rendements (${INSERT_COLS.join(', ')})
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
  const [jourCount] = await conn.execute('SELECT COUNT(*) as c FROM rendements WHERE rendement_jour IS NOT NULL');
  const [eurCount] = await conn.execute('SELECT COUNT(*) as c FROM rendements WHERE rendement_jour_eur IS NOT NULL');
  const [usdCount] = await conn.execute('SELECT COUNT(*) as c FROM rendements WHERE rendement_jour_usd IS NOT NULL');

  console.log('\n=== RESUME ===');
  console.log(`Fonds traites:      ${fonds.length}`);
  console.log(`Fonds ignores:      ${totalSkipped} (< 2 VL)`);
  console.log(`Rendements inseres: ${totalInserted}`);
  console.log(`Erreurs:            ${errors}`);
  console.log(`Total en base:      ${count[0].c} rendements / ${fondCount[0].c} fonds`);
  console.log(`  dont jour local:  ${jourCount[0].c}`);
  console.log(`  dont jour EUR:    ${eurCount[0].c}`);
  console.log(`  dont jour USD:    ${usdCount[0].c}`);

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
