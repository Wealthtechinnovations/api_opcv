/**
 * Calcule et insere les performances pour la DATE LA PLUS RECENTE
 * de chaque fond actif. Beaucoup plus rapide que saveperfdatemysql
 * qui essaie de traiter chaque date historique.
 *
 * Pour chaque fond:
 *   1. Recupere la derniere date VL
 *   2. Appelle /api/performanceswithdate/fond/{id}/{date}
 *   3. Appelle /api/ratiosnewithdate/{years}/{id}/{date} si applicable
 *   4. INSERT/UPDATE dans la table performences
 *
 * Usage: node fix_populate_performances.js
 * Options:
 *   --pays NIGERIA     : un seul pays
 *   --fond 1141        : un seul fond
 *   --force            : recalculer meme si une perf recente existe deja
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const API_BASE = 'http://localhost:3005';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { pays: null, fondId: null, force: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pays' && args[i + 1]) opts.pays = args[++i];
    else if (args[i] === '--fond' && args[i + 1]) opts.fondId = parseInt(args[++i]);
    else if (args[i] === '--force') opts.force = true;
  }
  return opts;
}

async function fetchJSON(url) {
  const resp = await fetch(url);
  if (resp.status !== 200) return null;
  return resp.json();
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');
  console.log(`Options: pays=${opts.pays || 'TOUS'}, force=${opts.force}`);

  // Get all active funds
  let fondQuery = `
    SELECT f.id, f.nom_fond, f.pays, f.code_ISIN, f.dev_libelle,
           f.categorie_globale, f.categorie_national, f.categorie_regional
    FROM fond_investissements f
    WHERE f.active = 1 AND f.id IN (SELECT DISTINCT fund_id FROM valorisations)
  `;
  const fondParams = [];
  if (opts.fondId) {
    fondQuery += ' AND f.id = ?';
    fondParams.push(opts.fondId);
  } else if (opts.pays) {
    fondQuery += ' AND LOWER(f.pays) = LOWER(?)';
    fondParams.push(opts.pays);
  }
  fondQuery += ' ORDER BY f.pays, f.id';

  const [fonds] = await conn.execute(fondQuery, fondParams);
  console.log(`${fonds.length} fonds a traiter\n`);

  // Get latest VL date and years for each fund
  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const byPays = {};

  for (let i = 0; i < fonds.length; i++) {
    const f = fonds[i];
    const pays = f.pays || 'INCONNU';

    try {
      // Get latest VL date
      const [vlRows] = await conn.execute(
        'SELECT MAX(date) as maxdate, MIN(date) as mindate FROM valorisations WHERE fund_id = ? AND value > 0',
        [f.id]
      );
      if (!vlRows[0].maxdate) { skipped++; continue; }

      const latestDate = String(vlRows[0].maxdate).slice(0, 10);
      const minDate = String(vlRows[0].mindate).slice(0, 10);
      const yearsDiff = (new Date(latestDate) - new Date(minDate)) / (365.25 * 24 * 60 * 60 * 1000);

      // Check if we already have a recent performance record
      if (!opts.force) {
        const [existing] = await conn.execute(
          'SELECT id, date FROM performences WHERE fond_id = ? ORDER BY date DESC LIMIT 1',
          [f.id]
        );
        if (existing.length > 0 && String(existing[0].date).slice(0, 10) === latestDate) {
          skipped++;
          continue;
        }
      }

      // Fetch performance from API
      const perfData = await fetchJSON(`${API_BASE}/api/performanceswithdate/fond/${f.id}/${latestDate}`);
      if (!perfData || !perfData.data) {
        errors++;
        console.error(`  [ERROR] ${f.nom_fond} (${f.id}): API returned no data`);
        continue;
      }
      const pd = perfData.data;

      // Fetch ratios if enough years
      let ratioData = {};
      if (yearsDiff > 1) {
        const r1 = await fetchJSON(`${API_BASE}/api/ratiosnewithdate/1/${f.id}/${latestDate}`);
        if (r1) ratioData.data1an = r1;
      }
      if (yearsDiff > 3) {
        const r3 = await fetchJSON(`${API_BASE}/api/ratiosnewithdate/3/${f.id}/${latestDate}`);
        if (r3) ratioData.data3an = r3;
      }
      if (yearsDiff > 5) {
        const r5 = await fetchJSON(`${API_BASE}/api/ratiosnewithdate/5/${f.id}/${latestDate}`);
        if (r5) ratioData.data5an = r5;
      }

      // Build ratio fields
      const ratioFields = {};
      const ratioFieldNames = ['perfannu', 'volatility', 'ratiosharpe', 'pertemax', 'sortino', 'info', 'calamar', 'var99', 'var95', 'trackingerror', 'betahaussier', 'betabaissier', 'beta', 'omega', 'dsr', 'downcapture', 'upcapture', 'skewness', 'kurtosis'];
      for (const period of ['1an', '3an', '5an']) {
        for (const field of ratioFieldNames) {
          const key = `${field}${period}`;
          ratioFields[key] = ratioData[`data${period}`]?.data?.[field] ?? null;
        }
      }

      // Upsert into performences table
      const [existingPerf] = await conn.execute(
        'SELECT id FROM performences WHERE fond_id = ? AND date = ?',
        [f.id, latestDate]
      );

      const perfValues = {
        fond_id: f.id,
        code_ISIN: f.code_ISIN,
        categorie: pd.category || f.categorie_globale,
        categorie_nationale: f.categorie_national,
        categorie_regionale: f.categorie_regional,
        devise: f.dev_libelle,
        date: latestDate,
        ytd: pd.perf1erJanvier,
        perfveille: pd.perfVeille,
        perf1an: pd.perf1An,
        perf3ans: pd.perf3Ans,
        perf5ans: pd.perf5Ans,
        perf8ans: pd.perf8Ans,
        perf10ans: pd.perf10Ans,
        perf4s: pd.perf4Semaines,
        perf3m: pd.perf3Mois,
        perf6m: pd.perf6Mois,
        ytdm: pd.perf1erJanvierm,
        perfveillem: pd.perfVeillem,
        perf1anm: pd.perf1Anm,
        perf3ansm: pd.perf3Ansm,
        perf5ansm: pd.perf5Ansm,
        perf8ansm: pd.perf8Ansm,
        perf10ansm: pd.perf10Ansm,
        perf4sm: pd.perf4Semainesm,
        perf3mm: pd.perf3Moism,
        perf6mm: pd.perf6Moism,
        ...ratioFields,
      };

      if (existingPerf.length > 0) {
        const sets = Object.keys(perfValues).filter(k => k !== 'fond_id' && k !== 'date')
          .map(k => `${k} = ?`).join(', ');
        const vals = Object.keys(perfValues).filter(k => k !== 'fond_id' && k !== 'date')
          .map(k => perfValues[k]);
        await conn.execute(
          `UPDATE performences SET ${sets} WHERE fond_id = ? AND date = ?`,
          [...vals, f.id, latestDate]
        );
        updated++;
      } else {
        const cols = Object.keys(perfValues).join(', ');
        const placeholders = Object.keys(perfValues).map(() => '?').join(', ');
        const vals = Object.values(perfValues);
        await conn.execute(
          `INSERT INTO performences (${cols}) VALUES (${placeholders})`,
          vals
        );
        inserted++;
      }

      processed++;
      if (!byPays[pays]) byPays[pays] = 0;
      byPays[pays]++;

      if ((i + 1) % 50 === 0 || i === fonds.length - 1) {
        console.log(`  [${i + 1}/${fonds.length}] ${f.nom_fond} (${pays}) date=${latestDate} years=${yearsDiff.toFixed(1)}`);
      }
    } catch (err) {
      errors++;
      console.error(`  [ERROR] ${f.nom_fond} (${f.id}): ${err.message}`);
    }
  }

  console.log('\n==========================================');
  console.log('=== RAPPORT PEUPLAGE PERFORMANCES ===');
  console.log('==========================================');
  console.log(`Fonds traites:    ${processed}`);
  console.log(`Inseres:          ${inserted}`);
  console.log(`Mis a jour:       ${updated}`);
  console.log(`Ignores:          ${skipped}`);
  console.log(`Erreurs:          ${errors}`);
  console.log('\n=== PAR PAYS ===');
  for (const [pays, count] of Object.entries(byPays).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${pays}: ${count} fonds`);
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
