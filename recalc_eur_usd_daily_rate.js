/**
 * Recalcul value_EUR / value_USD avec le taux de change QUOTIDIEN
 *
 * Probleme corrige: les imports historiques utilisaient un taux UNIQUE
 * pour toutes les VL d'un fonds, ce qui annulait l'effet de change
 * dans les calculs de performance (perf_EUR = perf_MAD).
 *
 * Ce script:
 *   1. Charge TOUS les taux de change historiques depuis devisedechanges
 *   2. Pour chaque VL de chaque fonds, cherche le taux EUR/{devise} et
 *      USD/{devise} A LA DATE de cette VL (ou la date la plus proche)
 *   3. Recalcule value_EUR, value_USD, vl_ajuste_EUR, vl_ajuste_USD,
 *      actif_net_EUR, actif_net_USD
 *
 * Devises gerees:
 *   - MAD: EUR/MAD + USD/MAD depuis devisedechanges
 *   - XOF/XAF: EUR fixe 655.957 (parite CFA), USD via EUR/USD du jour
 *   - TND: EUR/TND + USD/TND depuis devisedechanges
 *   - NGN: EUR/NGN + USD/NGN depuis devisedechanges
 *   - USD: EUR/USD depuis devisedechanges
 *   - EUR: 1 pour EUR, EUR/USD pour USD
 *   - Autres: lookup dynamique EUR/{dev} + USD/{dev}
 *
 * Usage:
 *   node recalc_eur_usd_daily_rate.js              # tous les fonds actifs
 *   node recalc_eur_usd_daily_rate.js 42            # un seul fond
 *   node recalc_eur_usd_daily_rate.js 1 100         # fonds 1 a 100
 *   node recalc_eur_usd_daily_rate.js --dry-run     # simulation sans ecriture
 *
 * NON-DESTRUCTIF sur value/dividende (ne modifie que les colonnes _EUR/_USD)
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const EUR_XAF = 655.957;
const EUR_XOF = 655.957;

function buildRateIndex(rows, paire) {
  const map = {};
  for (const r of rows) {
    if (r.paire !== paire) continue;
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
    if (r.value > 0) map[d] = r.value;
  }
  return { map, dates: Object.keys(map).sort() };
}

function getRate(index, date) {
  if (!index || index.dates.length === 0) return null;
  if (index.map[date]) return index.map[date];
  let lo = 0, hi = index.dates.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (index.dates[mid] <= date) lo = mid + 1;
    else hi = mid - 1;
  }
  if (hi >= 0) return index.map[index.dates[hi]];
  return index.map[index.dates[0]];
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const numArgs = args.filter(a => !a.startsWith('--'));

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');
  if (dryRun) console.log('*** MODE DRY-RUN: aucune ecriture ***\n');

  // 1. Charger TOUS les taux de change historiques
  console.log('Chargement de tous les taux de change...');
  const [fxRows] = await conn.execute(
    `SELECT paire, date, value FROM devisedechanges WHERE value > 0 ORDER BY date`
  );
  console.log(`  ${fxRows.length} entrees forex chargees`);

  // Construire les index par paire
  const paires = [...new Set(fxRows.map(r => r.paire))];
  console.log(`  Paires disponibles: ${paires.join(', ')}`);

  const fxIndex = {};
  for (const p of paires) {
    fxIndex[p] = buildRateIndex(fxRows, p);
  }

  // EUR/USD est necessaire pour les devises CFA et les cross-rates
  const eurUsdIndex = fxIndex['EUR/USD'];
  if (!eurUsdIndex || eurUsdIndex.dates.length === 0) {
    console.error('ERREUR: Pas de EUR/USD dans devisedechanges!');
    await conn.end();
    process.exit(1);
  }
  console.log(`  EUR/USD: ${eurUsdIndex.dates.length} dates (${eurUsdIndex.dates[0]} -> ${eurUsdIndex.dates[eurUsdIndex.dates.length - 1]})`);

  // 2. Charger les fonds
  let whereClause = 'WHERE active = 1';
  if (numArgs.length === 2) {
    whereClause = `WHERE id BETWEEN ${parseInt(numArgs[0])} AND ${parseInt(numArgs[1])}`;
  } else if (numArgs.length === 1) {
    whereClause = `WHERE id = ${parseInt(numArgs[0])}`;
  }

  const [fonds] = await conn.execute(
    `SELECT id, nom_fond, dev_libelle FROM fond_investissements ${whereClause}`
  );
  console.log(`\n${fonds.length} fonds a traiter\n`);

  const report = {
    fondsTraites: 0,
    fondsSkipped: 0,
    vlUpdated: 0,
    vlTotal: 0,
    errors: [],
    devisesTraitees: {},
    sampleBefore: [],
    sampleAfter: [],
  };

  for (let fi = 0; fi < fonds.length; fi++) {
    const f = fonds[fi];
    const devise = (f.dev_libelle || '').toUpperCase().trim();

    if (!devise) {
      report.fondsSkipped++;
      continue;
    }

    // Determiner les index de taux pour cette devise
    let eurIndex, usdIndex;
    let isFixedEUR = false;

    switch (devise) {
      case 'EUR':
        // value est deja en EUR
        eurIndex = null; // rate = 1
        usdIndex = null; // will use 1/EUR_USD
        break;
      case 'USD':
        eurIndex = null; // will use EUR/USD
        usdIndex = null; // rate = 1
        break;
      case 'XOF':
      case 'XAF':
        isFixedEUR = true; // parite fixe CFA
        break;
      case 'MAD':
        eurIndex = fxIndex['EUR/MAD'];
        usdIndex = fxIndex['USD/MAD'];
        break;
      case 'TND':
        eurIndex = fxIndex['EUR/TND'];
        usdIndex = fxIndex['USD/TND'];
        break;
      case 'NGN':
        eurIndex = fxIndex['EUR/NGN'];
        usdIndex = fxIndex['USD/NGN'];
        break;
      default:
        eurIndex = fxIndex[`EUR/${devise}`];
        usdIndex = fxIndex[`USD/${devise}`];
        if (!eurIndex && !usdIndex) {
          if ((fi + 1) <= 5 || fi === fonds.length - 1) {
            console.log(`  SKIP ${f.nom_fond} (${devise}) - pas de taux EUR/${devise} ni USD/${devise}`);
          }
          report.fondsSkipped++;
          continue;
        }
        break;
    }

    if (!report.devisesTraitees[devise]) report.devisesTraitees[devise] = 0;

    // Charger toutes les VL du fonds
    const [vlRows] = await conn.execute(
      `SELECT id, date, value, vl_ajuste, actif_net, dividende,
              value_EUR, value_USD
       FROM valorisations
       WHERE fund_id = ? AND value IS NOT NULL AND value > 0
       ORDER BY date ASC`,
      [f.id]
    );

    if (vlRows.length === 0) {
      report.fondsSkipped++;
      continue;
    }

    report.vlTotal += vlRows.length;

    // Capturer un echantillon avant modification (pour le rapport)
    if (report.sampleBefore.length < 3 && devise === 'MAD') {
      const last = vlRows[vlRows.length - 1];
      const dateStr = last.date instanceof Date ? last.date.toISOString().split('T')[0] : String(last.date).split('T')[0];
      report.sampleBefore.push({
        fond: f.nom_fond, date: dateStr,
        value: last.value, value_EUR_before: last.value_EUR, value_USD_before: last.value_USD,
      });
    }

    // Calculer les nouvelles valeurs EUR/USD pour chaque VL
    const updates = [];

    for (const row of vlRows) {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];
      const value = parseFloat(row.value) || 0;
      const vlAjuste = parseFloat(row.vl_ajuste) || value;
      const actifNet = parseFloat(row.actif_net) || 0;
      const dividende = parseFloat(row.dividende) || 0;

      let eurRate, usdRate;

      if (devise === 'EUR') {
        eurRate = 1;
        const eurUsd = getRate(eurUsdIndex, dateStr) || 1.08;
        usdRate = 1 / eurUsd; // 1 EUR = eurUsd USD -> 1 USD = 1/eurUsd EUR
      } else if (devise === 'USD') {
        const eurUsd = getRate(eurUsdIndex, dateStr) || 1.08;
        eurRate = eurUsd; // 1 USD = eurUsd^-1 EUR, but value is in USD, so value_EUR = value / eurUsd... no
        // value is in USD. value_EUR = value_USD * (1/eurUsd) ... no
        // EUR/USD = 1.08 means 1 EUR = 1.08 USD
        // value_USD = X USD. value_EUR = X / eurUsd (car 1 USD = 1/1.08 EUR)
        // So eurRate = eurUsd (diviser value par eurRate donne EUR)
        // Wait: eurRate should be "how many USD per EUR" or "how many devise per EUR"?
        // Convention in the rest of the code: value_EUR = value / eurRate
        // For MAD: eurRate = EUR/MAD rate (e.g., 10.85). So 100 MAD / 10.85 = 9.22 EUR. Correct.
        // For USD: EUR/USD = 1.08. So 100 USD / 1.08 = 92.59 EUR. Correct!
        eurRate = eurUsd;
        usdRate = 1;
      } else if (isFixedEUR) {
        // XOF or XAF: fixed parity with EUR
        const fixedRate = devise === 'XOF' ? EUR_XOF : EUR_XAF;
        eurRate = fixedRate;
        const eurUsd = getRate(eurUsdIndex, dateStr) || 1.08;
        usdRate = fixedRate / eurUsd;
      } else {
        // Get daily rates
        eurRate = eurIndex ? getRate(eurIndex, dateStr) : null;
        usdRate = usdIndex ? getRate(usdIndex, dateStr) : null;

        if (!eurRate && !usdRate) {
          continue; // skip this VL
        }

        // Cross-rate if one is missing
        if (!eurRate && usdRate) {
          const eurUsd = getRate(eurUsdIndex, dateStr) || 1.08;
          eurRate = usdRate * eurUsd;
        }
        if (!usdRate && eurRate) {
          const eurUsd = getRate(eurUsdIndex, dateStr) || 1.08;
          usdRate = eurRate / eurUsd;
        }
      }

      const newValueEUR = value / eurRate;
      const newValueUSD = value / usdRate;
      const newVlAjusteEUR = vlAjuste / eurRate;
      const newVlAjusteUSD = vlAjuste / usdRate;
      const newActifNetEUR = actifNet > 0 ? actifNet / eurRate : 0;
      const newActifNetUSD = actifNet > 0 ? actifNet / usdRate : 0;
      const newDividendeEUR = dividende > 0 ? dividende / eurRate : 0;
      const newDividendeUSD = dividende > 0 ? dividende / usdRate : 0;

      updates.push({
        id: row.id,
        value_EUR: newValueEUR,
        value_USD: newValueUSD,
        vl_ajuste_EUR: newVlAjusteEUR,
        vl_ajuste_USD: newVlAjusteUSD,
        actif_net_EUR: newActifNetEUR,
        actif_net_USD: newActifNetUSD,
        dividende_EUR: newDividendeEUR,
        dividende_USD: newDividendeUSD,
      });
    }

    if (updates.length === 0) continue;

    // Batch UPDATE avec CASE
    if (!dryRun) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const chunk = updates.slice(i, i + BATCH_SIZE);
        const ids = chunk.map(u => u.id);

        const caseEUR = chunk.map(u => `WHEN ${u.id} THEN ${u.value_EUR}`).join(' ');
        const caseUSD = chunk.map(u => `WHEN ${u.id} THEN ${u.value_USD}`).join(' ');
        const caseAjEUR = chunk.map(u => `WHEN ${u.id} THEN ${u.vl_ajuste_EUR}`).join(' ');
        const caseAjUSD = chunk.map(u => `WHEN ${u.id} THEN ${u.vl_ajuste_USD}`).join(' ');
        const caseAnEUR = chunk.map(u => `WHEN ${u.id} THEN ${u.actif_net_EUR}`).join(' ');
        const caseAnUSD = chunk.map(u => `WHEN ${u.id} THEN ${u.actif_net_USD}`).join(' ');
        const caseDivEUR = chunk.map(u => `WHEN ${u.id} THEN ${u.dividende_EUR}`).join(' ');
        const caseDivUSD = chunk.map(u => `WHEN ${u.id} THEN ${u.dividende_USD}`).join(' ');

        try {
          await conn.execute(`
            UPDATE valorisations SET
              value_EUR = CASE id ${caseEUR} END,
              value_USD = CASE id ${caseUSD} END,
              vl_ajuste_EUR = CASE id ${caseAjEUR} END,
              vl_ajuste_USD = CASE id ${caseAjUSD} END,
              actif_net_EUR = CASE id ${caseAnEUR} END,
              actif_net_USD = CASE id ${caseAnUSD} END,
              dividende_EUR = CASE id ${caseDivEUR} END,
              dividende_USD = CASE id ${caseDivUSD} END
            WHERE id IN (${ids.join(',')})
          `);
        } catch (e) {
          report.errors.push(`Fund ${f.id} batch ${i}: ${e.message}`);
        }
      }
    }

    report.vlUpdated += updates.length;
    report.fondsTraites++;
    report.devisesTraitees[devise] += updates.length;

    // Capturer echantillon apres (meme fond que before)
    if (report.sampleBefore.length > 0 && report.sampleAfter.length < report.sampleBefore.length) {
      const match = report.sampleBefore.find(s => s.fond === f.nom_fond);
      if (match) {
        const lastUpdate = updates[updates.length - 1];
        report.sampleAfter.push({
          fond: f.nom_fond, date: match.date,
          value_EUR_after: lastUpdate.value_EUR,
          value_USD_after: lastUpdate.value_USD,
        });
      }
    }

    if ((fi + 1) % 50 === 0 || fi === fonds.length - 1) {
      console.log(`  [${fi + 1}/${fonds.length}] ${devise} ${f.nom_fond}: ${updates.length} VL`);
    }
  }

  // ============================================================
  // RAPPORT
  // ============================================================
  console.log('\n==========================================');
  console.log('=== RAPPORT RECALCUL EUR/USD QUOTIDIEN ===');
  console.log('==========================================');
  console.log(`Mode:                      ${dryRun ? 'DRY-RUN (pas d\'ecriture)' : 'REEL'}`);
  console.log(`Fonds traites:             ${report.fondsTraites}`);
  console.log(`Fonds skipped:             ${report.fondsSkipped}`);
  console.log(`VL recalculees:            ${report.vlUpdated} / ${report.vlTotal}`);
  console.log(`Erreurs:                   ${report.errors.length}`);

  console.log('\nVL par devise:');
  for (const [dev, cnt] of Object.entries(report.devisesTraitees).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${dev}: ${cnt} VL`);
  }

  if (report.sampleBefore.length > 0) {
    console.log('\nEchantillons avant/apres (MAD):');
    for (let i = 0; i < report.sampleBefore.length; i++) {
      const b = report.sampleBefore[i];
      const a = report.sampleAfter[i];
      if (b && a) {
        console.log(`  ${b.fond} (${b.date}):`);
        console.log(`    value=${b.value} MAD`);
        console.log(`    EUR: ${b.value_EUR_before?.toFixed(4)} -> ${a.value_EUR_after?.toFixed(4)}`);
        console.log(`    USD: ${b.value_USD_before?.toFixed(4)} -> ${a.value_USD_after?.toFixed(4)}`);
      }
    }
  }

  if (report.errors.length > 0) {
    console.log('\nPremieres erreurs (max 10):');
    report.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  }

  // Verification: comparer 2 VL du meme fonds MAD a 1 an d'ecart
  if (!dryRun) {
    console.log('\nVerification: variation taux de change reflétée dans les VL?');
    const [checkRows] = await conn.execute(`
      SELECT v.date, v.value, v.value_EUR, v.value_USD,
             d.value as eur_mad_rate
      FROM valorisations v
      LEFT JOIN devisedechanges d ON d.paire = 'EUR/MAD'
        AND d.date = v.date
      JOIN fond_investissements f ON f.id = v.fund_id
      WHERE f.dev_libelle = 'MAD' AND v.value > 0 AND v.value_EUR > 0
      ORDER BY v.date DESC LIMIT 5
    `);
    for (const r of checkRows) {
      const dateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
      const impliedRate = r.value / r.value_EUR;
      console.log(`  ${dateStr}: ${r.value} MAD / ${r.value_EUR?.toFixed(4)} EUR = taux implicite ${impliedRate.toFixed(4)} (reel: ${r.eur_mad_rate || 'N/A'})`);
    }
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
