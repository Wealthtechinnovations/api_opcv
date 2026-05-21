/**
 * Recalcul VL Ajusté pour tous les fonds
 *
 * Formule IDENTIQUE au code d'origine (apigestionsavequotidien.js + routes_vl.js):
 *   vl_ajuste(t) = value(t) + SOMME(dividendes de jour 1 a jour t)
 *   vl_ajuste_EUR(t) = value_EUR(t) + SOMME(dividendes_EUR de jour 1 a jour t)
 *   vl_ajuste_USD(t) = value_USD(t) + SOMME(dividendes_USD de jour 1 a jour t)
 *
 * Si dividende = 0 pour tout l'historique:
 *   vl_ajuste = value (pas de changement)
 *   vl_ajuste_EUR = value_EUR (pas de changement)
 *   vl_ajuste_USD = value_USD (pas de changement)
 *
 * Usage:
 *   node recalc_vl_ajuste.js              # tous les fonds actifs
 *   node recalc_vl_ajuste.js 42           # un seul fond (id=42)
 *   node recalc_vl_ajuste.js 1 100        # fonds id 1 a 100
 *
 * NON-DESTRUCTIF sur value/dividende (ne modifie que vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD)
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
    `SELECT id, nom_fond, dev_libelle FROM fond_investissements ${whereClause}`
  );
  console.log(`${fonds.length} fonds a traiter\n`);

  const report = {
    fondsTraites: 0,
    fondsAvecDividendes: 0,
    fondsSansDividendes: 0,
    vlRecalcules: 0,
    errors: [],
  };

  for (let fi = 0; fi < fonds.length; fi++) {
    const f = fonds[fi];

    // Charger toutes les VL du fonds ordonnees par date ASC
    // Meme logique que le code d'origine: on lit value, dividende, value_EUR, dividende_EUR, value_USD, dividende_USD
    const [vlRows] = await conn.execute(
      `SELECT id, date, value, dividende, value_EUR, dividende_EUR, value_USD, dividende_USD
       FROM valorisations
       WHERE fund_id = ?
       ORDER BY date ASC`,
      [f.id]
    );

    if (vlRows.length === 0) continue;

    // Meme formule que le code d'origine:
    // totalDividende += dividende (cumul)
    // vl_ajuste = value + totalDividende
    let totalDividende = 0;
    let totalDividende_EUR = 0;
    let totalDividende_USD = 0;
    let hasDividendes = false;

    const updates = [];

    for (const row of vlRows) {
      const valeur = parseFloat(row.value) || 0;
      const dividende = parseFloat(row.dividende) || 0;
      const valeurEUR = parseFloat(row.value_EUR) || 0;
      const dividendeEUR = parseFloat(row.dividende_EUR) || 0;
      const valeurUSD = parseFloat(row.value_USD) || 0;
      const dividendeUSD = parseFloat(row.dividende_USD) || 0;

      if (dividende > 0) {
        totalDividende += dividende;
        hasDividendes = true;
      }
      if (dividendeEUR > 0) {
        totalDividende_EUR += dividendeEUR;
      }
      if (dividendeUSD > 0) {
        totalDividende_USD += dividendeUSD;
      }

      const newValue = valeur + totalDividende;
      const newValueEUR = valeurEUR + totalDividende_EUR;
      const newValueUSD = valeurUSD + totalDividende_USD;

      updates.push({
        id: row.id,
        vl_ajuste: newValue,
        vl_ajuste_EUR: newValueEUR,
        vl_ajuste_USD: newValueUSD,
      });
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
    if (hasDividendes) {
      report.fondsAvecDividendes++;
    } else {
      report.fondsSansDividendes++;
    }

    // Progress
    if ((fi + 1) % 50 === 0 || fi === fonds.length - 1) {
      console.log(`  [${fi + 1}/${fonds.length}] ${f.nom_fond}: ${updated} VL${hasDividendes ? ' [DIVIDENDES DETECTES]' : ''}`);
    }
  }

  // Rapport final
  console.log('\n==========================================');
  console.log('=== RAPPORT RECALCUL VL AJUSTE ===');
  console.log('==========================================');
  console.log(`Fonds traites:             ${report.fondsTraites}`);
  console.log(`Fonds AVEC dividendes:     ${report.fondsAvecDividendes}`);
  console.log(`Fonds SANS dividendes:     ${report.fondsSansDividendes}`);
  console.log(`VL recalculees:            ${report.vlRecalcules}`);
  console.log(`Erreurs:                   ${report.errors.length}`);
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
  console.log(`  Avec vl_ajuste > 0:       ${v.has_ajuste}`);
  console.log(`  Avec vl_ajuste_EUR > 0:   ${v.has_eur}`);
  console.log(`  Avec vl_ajuste_USD > 0:   ${v.has_usd}`);
  console.log(`  Avec dividende > 0:       ${v.has_div}`);

  await conn.end();
  console.log('\nTermine.');
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
