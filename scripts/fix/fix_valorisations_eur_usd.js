/**
 * Peuplement des colonnes EUR/USD dans les valorisations existantes
 *
 * Ce script calcule et remplit value_EUR, value_USD, vl_ajuste_EUR, vl_ajuste_USD
 * pour toutes les VL qui ont value mais PAS value_EUR/value_USD.
 *
 * Usage: node fix_valorisations_eur_usd.js
 *
 * NON-DESTRUCTIF:
 *   - Ne touche PAS aux VL qui ont deja value_EUR rempli (> 0)
 *   - Utilise le taux de change du jour le plus proche dans devisedechanges
 *   - Si pas de taux disponible, utilise un taux par defaut
 *
 * Devises traitees:
 *   - MAD: EUR/MAD depuis devisedechanges ou defaut 10.85
 *   - XOF/XAF: fixe 655.957 (parite CFA)
 *   - TND: EUR/TND depuis devisedechanges ou defaut 3.35
 *   - NGN: pas de taux dispo, skip (affiche un warning)
 *   - USD: calcule depuis EUR/USD
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

const EUR_XAF = 655.957;
const EUR_XOF = 655.957;

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');

  // Charger les taux de change disponibles (le plus recent pour chaque paire)
  const rates = {};
  try {
    const [rows] = await conn.execute(
      `SELECT paire, value FROM devisedechanges
       WHERE value > 0
       ORDER BY date DESC`
    );
    for (const r of rows) {
      if (!rates[r.paire]) rates[r.paire] = r.value;
    }
  } catch (e) {
    console.log('Erreur chargement forex:', e.message);
  }

  const eurMad = rates['EUR/MAD'] || 10.85;
  const usdMad = rates['USD/MAD'] || 9.95;
  const eurTnd = rates['EUR/TND'] || 3.35;
  const usdTnd = rates['USD/TND'] || 3.07;
  const eurUsd = rates['EUR/USD'] || 1.08;

  console.log(`Taux disponibles: ${Object.keys(rates).length} paires`);
  console.log(`Taux: EUR/MAD=${eurMad}, USD/MAD=${usdMad}, EUR/TND=${eurTnd}, EUR/USD=${eurUsd}`);
  console.log(`Taux fixes: EUR/XOF=${EUR_XOF}, EUR/XAF=${EUR_XAF}`);

  // Trouver tous les fonds avec leur devise
  const [fonds] = await conn.execute(
    `SELECT id, nom_fond, dev_libelle, pays FROM fond_investissements WHERE active = 1`
  );
  console.log(`\n${fonds.length} fonds actifs trouves`);

  const report = {
    fondsTraites: 0,
    fondsSkipped: 0,
    vlUpdated: 0,
    vlAlreadyOk: 0,
    errors: [],
  };

  // Grouper par devise
  const deviseMap = {};
  for (const f of fonds) {
    const dev = (f.dev_libelle || '').toUpperCase().trim();
    if (!deviseMap[dev]) deviseMap[dev] = [];
    deviseMap[dev].push(f);
  }

  console.log('\nDevises trouvees:', Object.keys(deviseMap).map(d => `${d}(${deviseMap[d].length})`).join(', '));

  for (const [devise, fondsList] of Object.entries(deviseMap)) {
    let eurRate, usdRate;

    switch (devise) {
      case 'MAD':
        eurRate = eurMad;
        usdRate = usdMad;
        break;
      case 'XOF':
        eurRate = EUR_XOF;
        usdRate = EUR_XOF / eurUsd;
        break;
      case 'XAF':
        eurRate = EUR_XAF;
        usdRate = EUR_XAF / eurUsd;
        break;
      case 'TND':
        eurRate = eurTnd;
        usdRate = usdTnd;
        break;
      case 'USD':
        eurRate = eurUsd;
        usdRate = 1;
        break;
      case 'EUR':
        eurRate = 1;
        usdRate = 1 / eurUsd;
        break;
      default:
        if (!devise || devise === '') {
          console.log(`\n  SKIP devise vide (${fondsList.length} fonds)`);
          report.fondsSkipped += fondsList.length;
          continue;
        }
        // Chercher dynamiquement dans devisedechanges
        eurRate = rates[`EUR/${devise}`];
        usdRate = rates[`USD/${devise}`];
        if (!eurRate && !usdRate) {
          console.log(`\n  SKIP ${devise} (${fondsList.length} fonds) - pas de taux EUR/${devise} ni USD/${devise}`);
          report.fondsSkipped += fondsList.length;
          continue;
        }
        if (!eurRate) eurRate = usdRate / eurUsd;
        if (!usdRate) usdRate = eurRate / eurUsd;
        break;
    }

    console.log(`\n  Traitement ${devise}: ${fondsList.length} fonds (1 ${devise} = ${(1/eurRate).toFixed(6)} EUR = ${(1/usdRate).toFixed(6)} USD)`);

    let batchUpdated = 0;

    for (const f of fondsList) {
      // Compter les VL qui ont value mais PAS value_EUR (ou value_EUR = 0)
      const [countRows] = await conn.execute(
        `SELECT COUNT(*) as cnt FROM valorisations
         WHERE fund_id = ? AND value IS NOT NULL AND value > 0
           AND (value_EUR IS NULL OR value_EUR = 0)`,
        [f.id]
      );

      const toFix = countRows[0].cnt;
      if (toFix === 0) {
        report.vlAlreadyOk++;
        continue;
      }

      // Mettre a jour en batch (UPDATE direct, pas de SELECT+INSERT)
      try {
        const [result] = await conn.execute(
          `UPDATE valorisations SET
             value_EUR = value / ?,
             value_USD = value / ?,
             vl_ajuste_EUR = IFNULL(vl_ajuste, value) / ?,
             vl_ajuste_USD = IFNULL(vl_ajuste, value) / ?,
             actif_net_EUR = CASE WHEN actif_net > 0 THEN actif_net / ? ELSE 0 END,
             actif_net_USD = CASE WHEN actif_net > 0 THEN actif_net / ? ELSE 0 END
           WHERE fund_id = ? AND value IS NOT NULL AND value > 0
             AND (value_EUR IS NULL OR value_EUR = 0)`,
          [eurRate, usdRate, eurRate, usdRate, eurRate, usdRate, f.id]
        );
        batchUpdated += result.affectedRows;
        report.vlUpdated += result.affectedRows;
      } catch (e) {
        report.errors.push(`Fund ${f.id} (${f.nom_fond}): ${e.message}`);
      }

      report.fondsTraites++;
    }

    console.log(`    -> ${batchUpdated} VL mises a jour`);
  }

  // ============================================================
  // RAPPORT
  // ============================================================
  console.log('\n\n==========================================');
  console.log('=== RAPPORT FIX VALORISATIONS EUR/USD ===');
  console.log('==========================================');
  console.log(`Fonds traites (avec MAJ):  ${report.fondsTraites}`);
  console.log(`Fonds deja OK:             ${report.vlAlreadyOk}`);
  console.log(`Fonds skipped (pas de fx): ${report.fondsSkipped}`);
  console.log(`VL mises a jour:           ${report.vlUpdated}`);
  console.log(`Erreurs:                   ${report.errors.length}`);
  if (report.errors.length > 0) {
    console.log('\nPremieres erreurs (max 10):');
    report.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  }

  // Verification finale
  const [verification] = await conn.execute(`
    SELECT
      COUNT(*) as total_vl,
      SUM(value_EUR IS NOT NULL AND value_EUR > 0) as has_eur,
      SUM(value_USD IS NOT NULL AND value_USD > 0) as has_usd,
      SUM(value_EUR IS NULL OR value_EUR = 0) as missing_eur
    FROM valorisations WHERE value > 0
  `);
  const v = verification[0];
  console.log(`\nVerification finale:`);
  console.log(`  Total VL (value > 0):    ${v.total_vl}`);
  console.log(`  Avec value_EUR:          ${v.has_eur} (${(v.has_eur/v.total_vl*100).toFixed(1)}%)`);
  console.log(`  Avec value_USD:          ${v.has_usd} (${(v.has_usd/v.total_vl*100).toFixed(1)}%)`);
  console.log(`  Encore sans EUR:         ${v.missing_eur}`);

  await conn.end();
  console.log('\nConnexion fermee');
}

run().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
