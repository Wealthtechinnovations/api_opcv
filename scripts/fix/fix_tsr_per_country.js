#!/usr/bin/env node
/**
 * fix_tsr_per_country.js
 *
 * 1. Normalise pays "Nigeria" -> "NIGERIA" dans fond_investissements et societes
 * 2. Peuple la table tsrhistos avec les taux sans risque historiques par pays
 *    - MAROC: BAM taux directeur + MONIA (deja present normalement)
 *    - NIGERIA: CBN MPR (Monetary Policy Rate)
 *    - TUNISIE: BCT TMM (Taux du Marche Monetaire)
 *    - UEMOA: BCEAO taux directeur
 *    - CEMAC: BEAC taux directeur (TIAO)
 *
 * Usage: node fix_tsr_per_country.js [--dry-run]
 */

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'fund_opcvm',
  process.env.DB_USER || 'fund_opcvm',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
  }
);

const dryRun = process.argv.includes('--dry-run');

const TSR_HISTORY = {
  NIGERIA: {
    indice: 'MPR',
    rates: [
      { start: '2015-01-01', end: '2015-11-30', value: 13.0 },
      { start: '2015-12-01', end: '2016-07-31', value: 12.0 },
      { start: '2016-08-01', end: '2018-03-31', value: 14.0 },
      { start: '2018-04-01', end: '2019-03-31', value: 14.0 },
      { start: '2019-04-01', end: '2020-05-31', value: 13.5 },
      { start: '2020-06-01', end: '2020-09-30', value: 12.5 },
      { start: '2020-10-01', end: '2022-05-31', value: 11.5 },
      { start: '2022-06-01', end: '2022-07-31', value: 13.0 },
      { start: '2022-08-01', end: '2022-09-30', value: 14.0 },
      { start: '2022-10-01', end: '2023-01-31', value: 15.5 },
      { start: '2023-02-01', end: '2023-03-31', value: 17.5 },
      { start: '2023-04-01', end: '2023-07-31', value: 18.5 },
      { start: '2023-08-01', end: '2024-02-29', value: 18.75 },
      { start: '2024-03-01', end: '2024-05-31', value: 24.75 },
      { start: '2024-06-01', end: '2024-07-31', value: 26.25 },
      { start: '2024-08-01', end: '2024-11-30', value: 27.25 },
      { start: '2024-12-01', end: '2026-12-31', value: 27.50 },
    ],
  },
  TUNISIE: {
    indice: 'TMM',
    rates: [
      { start: '2015-01-01', end: '2016-12-31', value: 4.75 },
      { start: '2017-01-01', end: '2017-05-31', value: 4.75 },
      { start: '2017-06-01', end: '2018-02-28', value: 5.0 },
      { start: '2018-03-01', end: '2018-06-30', value: 5.75 },
      { start: '2018-07-01', end: '2019-02-28', value: 6.75 },
      { start: '2019-03-01', end: '2020-03-31', value: 7.75 },
      { start: '2020-04-01', end: '2020-10-31', value: 6.75 },
      { start: '2020-11-01', end: '2022-05-31', value: 6.25 },
      { start: '2022-06-01', end: '2022-12-31', value: 7.0 },
      { start: '2023-01-01', end: '2023-12-31', value: 8.0 },
      { start: '2024-01-01', end: '2026-12-31', value: 8.0 },
    ],
  },
  UEMOA: {
    indice: 'BCEAO',
    rates: [
      { start: '2015-01-01', end: '2016-06-30', value: 3.5 },
      { start: '2016-07-01', end: '2016-12-31', value: 2.5 },
      { start: '2017-01-01', end: '2022-06-30', value: 2.5 },
      { start: '2022-07-01', end: '2022-09-30', value: 2.5 },
      { start: '2022-10-01', end: '2023-03-31', value: 2.75 },
      { start: '2023-04-01', end: '2023-06-30', value: 3.0 },
      { start: '2023-07-01', end: '2023-12-31', value: 3.25 },
      { start: '2024-01-01', end: '2024-12-31', value: 3.5 },
      { start: '2025-01-01', end: '2026-12-31', value: 3.5 },
    ],
  },
  CEMAC: {
    indice: 'BEAC',
    rates: [
      { start: '2015-01-01', end: '2016-06-30', value: 3.25 },
      { start: '2016-07-01', end: '2017-12-31', value: 2.95 },
      { start: '2018-01-01', end: '2018-10-31', value: 3.5 },
      { start: '2018-11-01', end: '2020-06-30', value: 3.5 },
      { start: '2020-07-01', end: '2022-03-31', value: 3.25 },
      { start: '2022-04-01', end: '2022-10-31', value: 4.0 },
      { start: '2022-11-01', end: '2023-03-31', value: 5.0 },
      { start: '2023-04-01', end: '2026-12-31', value: 5.0 },
    ],
  },
};

function getRateForDate(rates, dateStr) {
  const d = new Date(dateStr);
  for (const r of rates) {
    if (d >= new Date(r.start) && d <= new Date(r.end)) {
      return r.value;
    }
  }
  return rates[rates.length - 1].value;
}

function generateMonthlyDates(startYear, endYear, endMonth) {
  const dates = [];
  for (let y = startYear; y <= endYear; y++) {
    const maxM = (y === endYear) ? endMonth : 12;
    for (let m = 1; m <= maxM; m++) {
      const mm = String(m).padStart(2, '0');
      dates.push(`${y}-${mm}-01`);
    }
  }
  return dates;
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // === STEP 1: Fix Nigeria casing ===
    console.log('\n=== STEP 1: Fix Nigeria casing ===');

    const [fondsNigeria] = await sequelize.query(
      `SELECT COUNT(*) as cnt FROM fond_investissements WHERE LOWER(pays) = 'nigeria' AND pays != 'NIGERIA'`
    );
    console.log(`Fonds with pays="Nigeria" (lowercase): ${fondsNigeria[0].cnt}`);

    if (!dryRun && fondsNigeria[0].cnt > 0) {
      const [r1] = await sequelize.query(
        `UPDATE fond_investissements SET pays = 'NIGERIA' WHERE LOWER(pays) = 'nigeria' AND pays != 'NIGERIA'`
      );
      console.log(`  -> ${r1.affectedRows} fonds updated to NIGERIA`);

      const [r2] = await sequelize.query(
        `UPDATE societes SET pays = 'NIGERIA' WHERE LOWER(pays) = 'nigeria' AND pays != 'NIGERIA'`
      );
      console.log(`  -> ${r2.affectedRows} societes updated to NIGERIA`);
    } else if (dryRun) {
      console.log('  [DRY RUN] Would update fond_investissements and societes');
    } else {
      console.log('  Already all NIGERIA — nothing to fix');
    }

    // === STEP 2: Check existing tsrhisto data ===
    console.log('\n=== STEP 2: Existing tsrhisto data ===');
    const [existing] = await sequelize.query(
      `SELECT pays, indice, COUNT(*) as cnt, MIN(date) as min_date, MAX(date) as max_date,
       ROUND(AVG(value), 2) as avg_value
       FROM tsrhistos GROUP BY pays, indice ORDER BY pays, indice`
    );
    if (existing.length) {
      for (const row of existing) {
        console.log(`  ${row.pays || '(no pays)'} / ${row.indice}: ${row.cnt} entries [${row.min_date} -> ${row.max_date}], avg=${row.avg_value}%`);
      }
    } else {
      console.log('  Table tsrhistos is empty (except maybe MONIA for Maroc)');
    }

    // === STEP 3: Populate tsrhisto for each country ===
    console.log('\n=== STEP 3: Populate tsrhisto per country ===');

    const monthlyDates = generateMonthlyDates(2015, 2026, 5);
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const [pays, config] of Object.entries(TSR_HISTORY)) {
      console.log(`\n  Processing ${pays} (indice: ${config.indice})...`);

      const [existingForPays] = await sequelize.query(
        `SELECT date FROM tsrhistos WHERE pays = ? ORDER BY date`,
        { replacements: [pays] }
      );
      const existingDates = new Set(existingForPays.map(r => r.date));

      let inserted = 0;
      let skipped = 0;
      const batchValues = [];

      for (const dateStr of monthlyDates) {
        if (existingDates.has(dateStr)) {
          skipped++;
          continue;
        }
        const rate = getRateForDate(config.rates, dateStr);
        batchValues.push(`(${rate}, '${dateStr}', '${pays}', '${config.indice}', 1)`);
      }

      if (batchValues.length > 0 && !dryRun) {
        for (let i = 0; i < batchValues.length; i += 100) {
          const batch = batchValues.slice(i, i + 100);
          await sequelize.query(
            `INSERT INTO tsrhistos (value, date, pays, indice, annee) VALUES ${batch.join(',')}`
          );
        }
        inserted = batchValues.length;
      } else if (dryRun) {
        inserted = batchValues.length;
      }

      skipped += (monthlyDates.length - batchValues.length - skipped);
      totalInserted += inserted;
      totalSkipped += skipped;

      console.log(`    ${inserted} entries inserted, ${existingDates.size} already existed`);
    }

    // === STEP 4: Update existing MONIA data pays field if empty ===
    console.log('\n=== STEP 4: Tag existing MONIA data with pays=MAROC ===');
    if (!dryRun) {
      const [monia] = await sequelize.query(
        `UPDATE tsrhistos SET pays = 'MAROC' WHERE indice = 'MONIA' AND (pays IS NULL OR pays = '' OR pays = '0')`
      );
      console.log(`  ${monia.affectedRows} MONIA entries tagged with pays=MAROC`);
    }

    // === STEP 5: Verification ===
    console.log('\n=== STEP 5: Verification ===');
    const [final] = await sequelize.query(
      `SELECT pays, indice, COUNT(*) as cnt, MIN(date) as min_date, MAX(date) as max_date,
       ROUND(MIN(value), 2) as min_val, ROUND(MAX(value), 2) as max_val, ROUND(AVG(value), 2) as avg_val
       FROM tsrhistos GROUP BY pays, indice ORDER BY pays, indice`
    );
    for (const row of final) {
      console.log(`  ${row.pays} / ${row.indice}: ${row.cnt} entries [${row.min_date} -> ${row.max_date}], range=[${row.min_val}% - ${row.max_val}%], avg=${row.avg_val}%`);
    }

    console.log(`\n=== DONE === Total: ${totalInserted} inserted, ${totalSkipped} skipped${dryRun ? ' [DRY RUN]' : ''}`);

  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
