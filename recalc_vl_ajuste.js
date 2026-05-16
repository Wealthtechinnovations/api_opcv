/**
 * Recalcul VL Ajusté (Total Return NAV) pour tous les fonds
 *
 * Formule:
 *   - Jour 1 (premiere VL): vl_ajuste = value
 *   - Jour t: vl_ajuste(t) = vl_ajuste(t-1) * (value(t) + dividende(t)) / value(t-1)
 *
 * Ensuite conversion:
 *   - vl_ajuste_EUR = vl_ajuste / taux_EUR_du_jour
 *   - vl_ajuste_USD = vl_ajuste / taux_USD_du_jour
 *
 * Usage:
 *   node recalc_vl_ajuste.js              # tous les fonds actifs
 *   node recalc_vl_ajuste.js 42           # un seul fond (id=42)
 *   node recalc_vl_ajuste.js 1 100        # fonds id 1 a 100
 *
 * NON-DESTRUCTIF sur value/dividende (ne modifie que vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD)
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

async function loadForexRates(conn) {
  const [rows] = await conn.execute(
    `SELECT paire, date, value FROM devisedechanges WHERE value > 0 ORDER BY date ASC`
  );

  const ratesByPair = {};
  for (const r of rows) {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
    if (!ratesByPair[r.paire]) ratesByPair[r.paire] = [];
    ratesByPair[r.paire].push({ date: d, value: r.value });
  }

  return ratesByPair;
}

function findRate(ratesArray, targetDate) {
  if (!ratesArray || ratesArray.length === 0) return null;

  let best = null;
  for (const r of ratesArray) {
    if (r.date <= targetDate) {
      best = r.value;
    } else {
      break;
    }
  }
  return best;
}

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');

  // Determiner quels fonds traiter
  let whereClause = 'WHERE active = 1';
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];

  if (arg1 && arg2) {
    whereClause = `WHERE id BETWEEN ${parseInt(arg1)} AND ${parseInt(arg2)}`;
  } else if (arg1 && !isNaN(parseInt(arg1))) {
    whereClause = `WHERE id = ${parseInt(arg1)}`;
  }

  const [fonds] = await conn.execute(
    `SELECT id, nom_fond, dev_libelle, pays FROM fond_investissements ${whereClause}`
  );
  console.log(`${fonds.length} fonds a traiter\n`);

  // Charger les taux de change
  console.log('Chargement des taux de change...');
  const forexRates = await loadForexRates(conn);
  const pairesDisponibles = Object.keys(forexRates);
  console.log(`${pairesDisponibles.length} paires chargees: ${pairesDisponibles.join(', ')}\n`);

  const report = {
    fondsTraites: 0,
    fondsAvecDividendes: 0,
    vlRecalcules: 0,
    vlAvecEUR: 0,
    vlAvecUSD: 0,
    errors: [],
  };

  for (let fi = 0; fi < fonds.length; fi++) {
    const f = fonds[fi];
    const devise = (f.dev_libelle || '').toUpperCase().trim();
    const paireEUR = `EUR/${devise}`;
    const paireUSD = `USD/${devise}`;

    // Charger toutes les VL du fonds ordonnees par date
    const [vlRows] = await conn.execute(
      `SELECT id, date, value, dividende FROM valorisations
       WHERE fund_id = ? AND value IS NOT NULL AND value > 0
       ORDER BY date ASC`,
      [f.id]
    );

    if (vlRows.length === 0) continue;

    // Calculer vl_ajuste en chainant les rendements totaux
    const updates = [];
    let prevValue = null;
    let prevVlAjuste = null;
    let hasDividendes = false;

    for (let i = 0; i < vlRows.length; i++) {
      const row = vlRows[i];
      const value = parseFloat(row.value);
      const dividende = parseFloat(row.dividende) || 0;
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);

      let vlAjuste;

      if (i === 0 || prevValue === null || prevValue === 0) {
        vlAjuste = value;
      } else {
        vlAjuste = prevVlAjuste * (value + dividende) / prevValue;
      }

      if (dividende > 0) hasDividendes = true;

      // Conversion EUR/USD
      let vlAjusteEUR = 0;
      let vlAjusteUSD = 0;

      if (devise === 'EUR') {
        vlAjusteEUR = vlAjuste;
        const eurUsdRate = findRate(forexRates['EUR/USD'], dateStr);
        vlAjusteUSD = eurUsdRate ? vlAjuste * eurUsdRate : 0;
      } else if (devise === 'USD') {
        vlAjusteUSD = vlAjuste;
        const eurUsdRate = findRate(forexRates['EUR/USD'], dateStr);
        vlAjusteEUR = eurUsdRate ? vlAjuste / eurUsdRate : 0;
      } else if (devise === 'XOF') {
        vlAjusteEUR = vlAjuste / EUR_XOF;
        const eurUsdRate = findRate(forexRates['EUR/USD'], dateStr);
        vlAjusteUSD = eurUsdRate ? vlAjusteEUR * eurUsdRate : 0;
      } else if (devise === 'XAF') {
        vlAjusteEUR = vlAjuste / EUR_XAF;
        const eurUsdRate = findRate(forexRates['EUR/USD'], dateStr);
        vlAjusteUSD = eurUsdRate ? vlAjusteEUR * eurUsdRate : 0;
      } else {
        const eurRate = findRate(forexRates[paireEUR], dateStr);
        const usdRate = findRate(forexRates[paireUSD], dateStr);
        if (eurRate && eurRate > 0) vlAjusteEUR = vlAjuste / eurRate;
        if (usdRate && usdRate > 0) vlAjusteUSD = vlAjuste / usdRate;
      }

      updates.push({
        id: row.id,
        vl_ajuste: vlAjuste,
        vl_ajuste_EUR: vlAjusteEUR,
        vl_ajuste_USD: vlAjusteUSD,
      });

      prevValue = value;
      prevVlAjuste = vlAjuste;
    }

    // Mise a jour en batch (par blocs de 200)
    const BATCH_SIZE = 200;
    let updated = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const chunk = updates.slice(i, i + BATCH_SIZE);

      const cases_ajuste = [];
      const cases_eur = [];
      const cases_usd = [];
      const ids = [];

      for (const u of chunk) {
        cases_ajuste.push(`WHEN ${u.id} THEN ${u.vl_ajuste}`);
        cases_eur.push(`WHEN ${u.id} THEN ${u.vl_ajuste_EUR}`);
        cases_usd.push(`WHEN ${u.id} THEN ${u.vl_ajuste_USD}`);
        ids.push(u.id);
      }

      try {
        await conn.execute(`
          UPDATE valorisations SET
            vl_ajuste = CASE id ${cases_ajuste.join(' ')} END,
            vl_ajuste_EUR = CASE id ${cases_eur.join(' ')} END,
            vl_ajuste_USD = CASE id ${cases_usd.join(' ')} END
          WHERE id IN (${ids.join(',')})
        `);
        updated += chunk.length;
      } catch (e) {
        report.errors.push(`Fund ${f.id} batch ${i}: ${e.message}`);
      }
    }

    report.fondsTraites++;
    report.vlRecalcules += updated;
    if (hasDividendes) report.fondsAvecDividendes++;
    if (updates.some(u => u.vl_ajuste_EUR > 0)) report.vlAvecEUR += updates.filter(u => u.vl_ajuste_EUR > 0).length;
    if (updates.some(u => u.vl_ajuste_USD > 0)) report.vlAvecUSD += updates.filter(u => u.vl_ajuste_USD > 0).length;

    // Progress
    if ((fi + 1) % 50 === 0 || fi === fonds.length - 1) {
      console.log(`  [${fi + 1}/${fonds.length}] ${f.nom_fond} (${devise}): ${updated} VL recalculees${hasDividendes ? ' [DIVIDENDES]' : ''}`);
    }
  }

  // Rapport final
  console.log('\n==========================================');
  console.log('=== RAPPORT RECALCUL VL AJUSTE ===');
  console.log('==========================================');
  console.log(`Fonds traites:           ${report.fondsTraites}`);
  console.log(`Fonds avec dividendes:   ${report.fondsAvecDividendes}`);
  console.log(`VL recalculees:          ${report.vlRecalcules}`);
  console.log(`VL avec vl_ajuste_EUR:   ${report.vlAvecEUR}`);
  console.log(`VL avec vl_ajuste_USD:   ${report.vlAvecUSD}`);
  console.log(`Erreurs:                 ${report.errors.length}`);
  if (report.errors.length > 0) {
    console.log('\nPremieres erreurs (max 10):');
    report.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  }

  // Verification
  const [verif] = await conn.execute(`
    SELECT
      COUNT(*) as total_vl,
      SUM(vl_ajuste IS NOT NULL AND vl_ajuste > 0) as has_ajuste,
      SUM(vl_ajuste_EUR IS NOT NULL AND vl_ajuste_EUR > 0) as has_eur,
      SUM(vl_ajuste_USD IS NOT NULL AND vl_ajuste_USD > 0) as has_usd,
      SUM(dividende IS NOT NULL AND dividende > 0) as has_div
    FROM valorisations WHERE value > 0
  `);
  const v = verif[0];
  console.log(`\nVerification globale:`);
  console.log(`  Total VL (value > 0):     ${v.total_vl}`);
  console.log(`  Avec vl_ajuste:           ${v.has_ajuste}`);
  console.log(`  Avec vl_ajuste_EUR:       ${v.has_eur}`);
  console.log(`  Avec vl_ajuste_USD:       ${v.has_usd}`);
  console.log(`  Avec dividende > 0:       ${v.has_div}`);

  await conn.end();
  console.log('\nTermine.');
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
