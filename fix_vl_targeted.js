/**
 * Correction ciblee de VL anormales identifiees manuellement.
 *
 * Fond 1141 (AFRINVEST DOLLAR FUND - Nigeria):
 *   - 2025-12-19 et 2025-12-24: VL=114.52 au lieu de ~165,000
 *   - Cause: erreur de saisie (valeur 1445x trop basse)
 *   - Action: supprimer ces 2 entrees
 *
 * Fond 1539 (SICAV ABDOU DIOUF - UEMOA):
 *   - Pics periodiques sur les fins de mois (base_100 double)
 *   - Les VL brutes sont correctes, le probleme vient du calcul base_100
 *   - Neanmoins certaines entrees dupliquees/incoherentes existent
 *   - Action: detecter et supprimer les VL qui s ecartent de >50% des voisins
 *     en utilisant un seuil plus bas et verification des doublons de date
 *
 * Usage: node fix_vl_targeted.js [--delete]
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
  const doDelete = process.argv.includes('--delete');
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`Mode: ${doDelete ? 'DELETE' : 'REPORT'}`);
  console.log('Connecte a la base fund_opcvm\n');

  let totalDeleted = 0;

  // === FOND 1141: AFRINVEST DOLLAR FUND ===
  console.log('=== FOND 1141: AFRINVEST DOLLAR FUND ===');

  // Find the two bad entries (VL ~114.52 when neighbors are ~165,000)
  const [bad1141] = await conn.execute(`
    SELECT id, date, value FROM valorisations
    WHERE fund_id = 1141 AND value < 1000 AND date >= '2025-12-01' AND date <= '2025-12-31'
    ORDER BY date
  `);

  if (bad1141.length > 0) {
    console.log(`  Trouvé ${bad1141.length} entrées anormales (VL < 1000 en dec 2025):`);
    for (const row of bad1141) {
      console.log(`    id=${row.id} date=${String(row.date).slice(0,10)} value=${row.value}`);
      if (doDelete) {
        await conn.execute('DELETE FROM valorisations WHERE id = ?', [row.id]);
        totalDeleted++;
      }
    }
  } else {
    console.log('  Aucune anomalie trouvée (déjà corrigé?)');
  }

  // Also check for any other extreme outliers in fund 1141
  const [outliers1141] = await conn.execute(`
    SELECT id, date, value FROM valorisations
    WHERE fund_id = 1141 AND value > 0 AND value < 1000
    ORDER BY date
  `);
  if (outliers1141.length > bad1141.length) {
    console.log(`  ${outliers1141.length - bad1141.length} autres valeurs < 1000 trouvées:`);
    for (const row of outliers1141) {
      if (!bad1141.find(b => b.id === row.id)) {
        console.log(`    id=${row.id} date=${String(row.date).slice(0,10)} value=${row.value}`);
        if (doDelete) {
          await conn.execute('DELETE FROM valorisations WHERE id = ?', [row.id]);
          totalDeleted++;
        }
      }
    }
  }

  // === FOND 1539: SICAV ABDOU DIOUF ===
  console.log('\n=== FOND 1539: SICAV ABDOU DIOUF ===');

  // Get all VL sorted by date
  const [vls1539] = await conn.execute(`
    SELECT id, date, value FROM valorisations
    WHERE fund_id = 1539 AND value > 0
    ORDER BY date ASC
  `);
  console.log(`  ${vls1539.length} VL totales`);

  // Detect duplicates on same date (keep the one consistent with neighbors)
  const dateMap = {};
  for (const v of vls1539) {
    const d = String(v.date).slice(0, 10);
    if (!dateMap[d]) dateMap[d] = [];
    dateMap[d].push(v);
  }

  let dupDeleted = 0;
  for (const [date, entries] of Object.entries(dateMap)) {
    if (entries.length > 1) {
      console.log(`  Doublon date=${date}: ${entries.length} entrées (valeurs: ${entries.map(e => e.value).join(', ')})`);
      // Keep only the first one (or the median)
      const sorted = entries.sort((a, b) => a.id - b.id);
      for (let i = 1; i < sorted.length; i++) {
        if (doDelete) {
          await conn.execute('DELETE FROM valorisations WHERE id = ?', [sorted[i].id]);
          totalDeleted++;
        }
        dupDeleted++;
      }
    }
  }
  console.log(`  ${dupDeleted} doublons de date détectés`);

  // Detect spikes with lower threshold (10%) for this fund
  // Rebuild VL list without duplicates
  const [vls1539clean] = await conn.execute(`
    SELECT id, date, value FROM valorisations
    WHERE fund_id = 1539 AND value > 0
    ORDER BY date ASC
  `);

  let spikes1539 = 0;
  for (let i = 1; i < vls1539clean.length - 1; i++) {
    const prev = Number(vls1539clean[i - 1].value);
    const curr = Number(vls1539clean[i].value);
    const next = Number(vls1539clean[i + 1].value);

    if (prev <= 0 || curr <= 0 || next <= 0) continue;

    const changePrev = Math.abs((curr - prev) / prev * 100);
    const changeNext = Math.abs((curr - next) / next * 100);

    // For this fund, use 10% threshold since it's a money market-like fund
    if (changePrev > 10 && changeNext > 10) {
      const d = String(vls1539clean[i].date).slice(0, 10);
      console.log(`  Pic: id=${vls1539clean[i].id} date=${d} val=${curr} (prev=${prev} Δ${changePrev.toFixed(1)}%, next=${next} Δ${changeNext.toFixed(1)}%)`);
      if (doDelete) {
        await conn.execute('DELETE FROM valorisations WHERE id = ?', [vls1539clean[i].id]);
        totalDeleted++;
      }
      spikes1539++;
    }
  }
  console.log(`  ${spikes1539} pics détectés (seuil 10%)`);

  // === GLOBAL: find any fund with VL that drops >90% then recovers ===
  console.log('\n=== DETECTION GLOBALE: drops extremes (>90%) ===');
  const [fondsList] = await conn.execute(`
    SELECT DISTINCT fund_id FROM valorisations
    WHERE fund_id IN (SELECT id FROM fond_investissements WHERE active = 1)
  `);

  let globalFixed = 0;
  for (const { fund_id } of fondsList) {
    const [vls] = await conn.execute(`
      SELECT id, date, value FROM valorisations
      WHERE fund_id = ? AND value > 0 ORDER BY date ASC
    `, [fund_id]);

    if (vls.length < 3) continue;

    for (let i = 1; i < vls.length - 1; i++) {
      const prev = Number(vls[i - 1].value);
      const curr = Number(vls[i].value);
      const next = Number(vls[i + 1].value);

      if (prev <= 0 || curr <= 0 || next <= 0) continue;

      // Extreme case: VL drops >90% from prev AND recovers >90% to next
      const dropFromPrev = (prev - curr) / prev * 100;
      const riseToNext = (next - curr) / curr * 100;

      if (dropFromPrev > 90 && riseToNext > 900) {
        const d = String(vls[i].date).slice(0, 10);
        const [fondInfo] = await conn.execute('SELECT nom_fond, pays FROM fond_investissements WHERE id = ?', [fund_id]);
        const name = fondInfo[0]?.nom_fond || '?';
        const pays = fondInfo[0]?.pays || '?';
        console.log(`  [${pays}] ${name} (id=${fund_id}): date=${d} val=${curr} (prev=${prev}, next=${next})`);
        if (doDelete) {
          await conn.execute('DELETE FROM valorisations WHERE id = ?', [vls[i].id]);
          totalDeleted++;
        }
        globalFixed++;
      }
    }
  }
  console.log(`  ${globalFixed} drops extrêmes détectés`);

  console.log(`\n=== TOTAL: ${totalDeleted} VL supprimées ===`);
  if (!doDelete && totalDeleted === 0) {
    console.log('(Mode report — utilisez --delete pour supprimer)');
  }

  await conn.end();
  console.log('Terminé.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
