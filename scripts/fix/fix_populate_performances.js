/**
 * Calcule et insere les performances pour la DATE LA PLUS RECENTE
 * de chaque fond actif. Calcul DIRECT en SQL+JS sans passer par l'API.
 *
 * L'ancienne version appelait /api/performanceswithdate qui crash
 * pour 96% des fonds. Cette version fait tout le calcul localement.
 *
 * Pour chaque fond:
 *   1. Recupere les VL triees par date ASC
 *   2. Calcule les perfs glissantes (veille, 4s, 3m, 6m, YTD, 1an..10an)
 *   3. INSERT/UPDATE dans la table performences
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

function perf(current, previous) {
  if (!previous || previous === 0 || current == null || previous == null) return null;
  if (current === previous) return 0;
  return ((current - previous) / previous) * 100;
}

function findValueAtDate(dates, values, targetDate) {
  const targetTs = targetDate.getTime();
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i].getTime();
    if (d <= targetTs) {
      const diff = targetTs - d;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
      break;
    }
  }
  if (bestIdx === -1 && dates.length > 0) {
    bestIdx = 0;
  }
  return bestIdx >= 0 ? values[bestIdx] : null;
}

function findValueAtYearsAgo(dates, values, lastDate, years) {
  const target = new Date(lastDate);
  target.setFullYear(target.getFullYear() - years);
  return findValueAtDate(dates, values, target);
}

function findValueAtMonthsAgo(dates, values, lastDate, months) {
  const target = new Date(lastDate);
  target.setMonth(target.getMonth() - months);
  return findValueAtDate(dates, values, target);
}

function findValueAtWeeksAgo(dates, values, lastDate, weeks) {
  const target = new Date(lastDate);
  target.setDate(target.getDate() - weeks * 7);
  return findValueAtDate(dates, values, target);
}

function findValueAtJanuary1(dates, values, lastDate) {
  const year = lastDate.getFullYear();
  const jan1 = new Date(year, 0, 1);
  return findValueAtDate(dates, values, jan1);
}

function findLastDateOfPreviousMonth(dates, values, lastDate) {
  const prevMonthEnd = new Date(lastDate.getFullYear(), lastDate.getMonth(), 0);
  return findValueAtDate(dates, values, prevMonthEnd);
}

function findValueAtJanuary1ForDate(dates, values, refDate) {
  const year = refDate.getFullYear();
  const jan1 = new Date(year, 0, 1);
  return findValueAtDate(dates, values, jan1);
}

function findValueAtWeeksAgoForDate(dates, values, refDate, weeks) {
  const target = new Date(refDate);
  target.setDate(target.getDate() - weeks * 7);
  return findValueAtDate(dates, values, target);
}

function findValueAtMonthsAgoForDate(dates, values, refDate, months) {
  const target = new Date(refDate);
  target.setMonth(target.getMonth() - months);
  return findValueAtDate(dates, values, target);
}

function findValueAtYearsAgoForDate(dates, values, refDate, years) {
  const target = new Date(refDate);
  target.setFullYear(target.getFullYear() - years);
  return findValueAtDate(dates, values, target);
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');
  console.log(`Options: pays=${opts.pays || 'TOUS'}, force=${opts.force}`);

  let fondQuery = `
    SELECT f.id, f.nom_fond, f.pays, f.code_ISIN, f.dev_libelle,
           f.categorie_globale, f.categorie_national, f.categorie_regional,
           f.categorie_fundafrica_regionale, f.categorie_fundafrica_globale
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

  let processed = 0, inserted = 0, updated = 0, skipped = 0, errors = 0;
  const byPays = {};

  for (let i = 0; i < fonds.length; i++) {
    const f = fonds[i];
    const pays = f.pays || 'INCONNU';

    try {
      const [vlRows] = await conn.execute(
        'SELECT date, value FROM valorisations WHERE fund_id = ? AND value > 0 ORDER BY date ASC',
        [f.id]
      );

      if (vlRows.length < 2) { skipped++; continue; }

      const dates = vlRows.map(r => new Date(r.date));
      const values = vlRows.map(r => parseFloat(r.value));
      const lastDate = dates[dates.length - 1];
      const latestDateStr = lastDate.toISOString().slice(0, 10);

      if (!opts.force) {
        const [existing] = await conn.execute(
          'SELECT id, date FROM performences WHERE fond_id = ? ORDER BY date DESC LIMIT 1',
          [f.id]
        );
        if (existing.length > 0 && String(existing[0].date).slice(0, 10) === latestDateStr) {
          skipped++;
          continue;
        }
      }

      const lastValue = values[values.length - 1];
      const prevValue = values[values.length - 2];

      // Performances glissantes a date
      const perfVeille = perf(lastValue, prevValue);
      const perf4s = perf(lastValue, findValueAtWeeksAgo(dates, values, lastDate, 4));
      const ytd = perf(lastValue, findValueAtJanuary1(dates, values, lastDate));
      const perf3m = perf(lastValue, findValueAtMonthsAgo(dates, values, lastDate, 3));
      const perf6m = perf(lastValue, findValueAtMonthsAgo(dates, values, lastDate, 6));
      const perf1an = perf(lastValue, findValueAtYearsAgo(dates, values, lastDate, 1));
      const perf3ans = perf(lastValue, findValueAtYearsAgo(dates, values, lastDate, 3));
      const perf5ans = perf(lastValue, findValueAtYearsAgo(dates, values, lastDate, 5));
      const perf8ans = perf(lastValue, findValueAtYearsAgo(dates, values, lastDate, 8));
      const perf10ans = perf(lastValue, findValueAtYearsAgo(dates, values, lastDate, 10));

      // Performances glissantes fin de mois precedent
      const prevMonthEnd = new Date(lastDate.getFullYear(), lastDate.getMonth(), 0);
      const prevMonthValue = findLastDateOfPreviousMonth(dates, values, lastDate);

      let perfveillem = null, perf4sm = null, ytdm = null, perf3mm = null, perf6mm = null;
      let perf1anm = null, perf3ansm = null, perf5ansm = null, perf8ansm = null, perf10ansm = null;

      if (prevMonthValue != null) {
        // Find the value just before prevMonthEnd for "veille"
        const prevMonthPrevDay = new Date(prevMonthEnd);
        prevMonthPrevDay.setDate(prevMonthPrevDay.getDate() - 1);
        const prevMonthPrevValue = findValueAtDate(dates, values, prevMonthPrevDay);
        perfveillem = perf(prevMonthValue, prevMonthPrevValue);
        perf4sm = perf(prevMonthValue, findValueAtWeeksAgoForDate(dates, values, prevMonthEnd, 4));
        ytdm = perf(prevMonthValue, findValueAtJanuary1ForDate(dates, values, prevMonthEnd));
        perf3mm = perf(prevMonthValue, findValueAtMonthsAgoForDate(dates, values, prevMonthEnd, 3));
        perf6mm = perf(prevMonthValue, findValueAtMonthsAgoForDate(dates, values, prevMonthEnd, 6));
        perf1anm = perf(prevMonthValue, findValueAtYearsAgoForDate(dates, values, prevMonthEnd, 1));
        perf3ansm = perf(prevMonthValue, findValueAtYearsAgoForDate(dates, values, prevMonthEnd, 3));
        perf5ansm = perf(prevMonthValue, findValueAtYearsAgoForDate(dates, values, prevMonthEnd, 5));
        perf8ansm = perf(prevMonthValue, findValueAtYearsAgoForDate(dates, values, prevMonthEnd, 8));
        perf10ansm = perf(prevMonthValue, findValueAtYearsAgoForDate(dates, values, prevMonthEnd, 10));
      }

      // Upsert
      const [existingPerf] = await conn.execute(
        'SELECT id FROM performences WHERE fond_id = ? AND date = ?',
        [f.id, latestDateStr]
      );

      const perfValues = {
        fond_id: f.id,
        code_ISIN: f.code_ISIN,
        categorie: f.categorie_globale,
        categorie_nationale: f.categorie_national,
        categorie_regionale: f.categorie_regional,
        categorie_fundafrica_regionale: f.categorie_fundafrica_regionale || null,
        categorie_fundafrica_globale: f.categorie_fundafrica_globale || null,
        devise: f.dev_libelle,
        date: latestDateStr,
        ytd, perfveille: perfVeille,
        perf1an, perf3ans, perf5ans, perf8ans, perf10ans,
        perf4s, perf3m, perf6m,
        ytdm, perfveillem,
        perf1anm, perf3ansm, perf5ansm, perf8ansm, perf10ansm,
        perf4sm, perf3mm, perf6mm,
      };

      if (existingPerf.length > 0) {
        const sets = Object.keys(perfValues).filter(k => k !== 'fond_id' && k !== 'date')
          .map(k => `\`${k}\` = ?`).join(', ');
        const vals = Object.keys(perfValues).filter(k => k !== 'fond_id' && k !== 'date')
          .map(k => perfValues[k]);
        await conn.execute(
          `UPDATE performences SET ${sets} WHERE fond_id = ? AND date = ?`,
          [...vals, f.id, latestDateStr]
        );
        updated++;
      } else {
        const cols = Object.keys(perfValues).map(k => `\`${k}\``).join(', ');
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
        console.log(`  [${i + 1}/${fonds.length}] ${f.nom_fond} (${pays}) date=${latestDateStr}`);
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
