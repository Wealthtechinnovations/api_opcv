/**
 * lot_diag_indref_eur_usd.js
 *
 * Diagnostic: verifie la couverture de indRef_EUR et indRef_USD
 * dans la table valorisations pour identifier les fonds ou
 * la courbe indice base 100 ne peut pas s'afficher en EUR/USD.
 *
 * Usage:
 *   node lot_diag_indref_eur_usd.js
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
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm\n');

  // 1. Couverture globale
  const [global] = await conn.execute(`
    SELECT
      COUNT(*) as total_vl,
      SUM(CASE WHEN indRef IS NOT NULL AND indRef > 0 THEN 1 ELSE 0 END) as has_indRef,
      SUM(CASE WHEN indRef_EUR IS NOT NULL AND indRef_EUR > 0 THEN 1 ELSE 0 END) as has_indRef_EUR,
      SUM(CASE WHEN indRef_USD IS NOT NULL AND indRef_USD > 0 THEN 1 ELSE 0 END) as has_indRef_USD
    FROM valorisations
  `);
  console.log('=== COUVERTURE GLOBALE ===');
  console.log(`Total VL:        ${global[0].total_vl}`);
  console.log(`Avec indRef:     ${global[0].has_indRef} (${(global[0].has_indRef/global[0].total_vl*100).toFixed(1)}%)`);
  console.log(`Avec indRef_EUR: ${global[0].has_indRef_EUR} (${(global[0].has_indRef_EUR/global[0].total_vl*100).toFixed(1)}%)`);
  console.log(`Avec indRef_USD: ${global[0].has_indRef_USD} (${(global[0].has_indRef_USD/global[0].total_vl*100).toFixed(1)}%)`);

  // 2. Fonds avec indRef local MAIS sans EUR/USD
  const [gap] = await conn.execute(`
    SELECT f.pays, COUNT(DISTINCT v.fund_id) as nb_fonds,
           SUM(CASE WHEN v.indRef > 0 AND (v.indRef_EUR IS NULL OR v.indRef_EUR = 0) THEN 1 ELSE 0 END) as vl_missing_eur,
           SUM(CASE WHEN v.indRef > 0 AND (v.indRef_USD IS NULL OR v.indRef_USD = 0) THEN 1 ELSE 0 END) as vl_missing_usd
    FROM valorisations v
    JOIN fond_investissements f ON f.id = v.fund_id
    WHERE f.active = 1 AND v.indRef IS NOT NULL AND v.indRef > 0
    GROUP BY f.pays ORDER BY vl_missing_eur DESC
  `);
  console.log('\n=== FONDS AVEC indRef MAIS SANS EUR/USD (par pays) ===');
  gap.forEach(r => console.log(`  ${(r.pays||'NULL').padEnd(15)} ${r.nb_fonds} fonds, ${r.vl_missing_eur} VL sans EUR, ${r.vl_missing_usd} VL sans USD`));

  // 3. Echantillon fonds problematiques
  const [problemFunds] = await conn.execute(`
    SELECT v.fund_id, f.nom_fond, f.pays,
           COUNT(*) as total_vl,
           SUM(CASE WHEN v.indRef > 0 THEN 1 ELSE 0 END) as has_local,
           SUM(CASE WHEN v.indRef_EUR > 0 THEN 1 ELSE 0 END) as has_eur,
           SUM(CASE WHEN v.indRef_USD > 0 THEN 1 ELSE 0 END) as has_usd
    FROM valorisations v
    JOIN fond_investissements f ON f.id = v.fund_id
    WHERE f.active = 1
    GROUP BY v.fund_id, f.nom_fond, f.pays
    HAVING has_local > 0 AND (has_eur = 0 OR has_usd = 0)
    ORDER BY has_local DESC
    LIMIT 20
  `);
  if (problemFunds.length > 0) {
    console.log('\n=== FONDS AVEC indRef LOCAL MAIS SANS EUR/USD (top 20) ===');
    problemFunds.forEach(r => {
      console.log(`  Fond ${r.fund_id} (${(r.nom_fond||'').substring(0, 35).padEnd(35)}) ${(r.pays||'').padEnd(10)} local=${r.has_local} EUR=${r.has_eur} USD=${r.has_usd}`);
    });
  } else {
    console.log('\n=== AUCUN FONDS avec indRef local sans EUR/USD — conversion OK ===');
  }

  // 4. Verification: les VL recentes ont-elles indRef_EUR/USD ?
  const [recent] = await conn.execute(`
    SELECT f.pays,
           SUM(CASE WHEN v.indRef > 0 THEN 1 ELSE 0 END) as has_local,
           SUM(CASE WHEN v.indRef_EUR > 0 THEN 1 ELSE 0 END) as has_eur,
           SUM(CASE WHEN v.indRef_USD > 0 THEN 1 ELSE 0 END) as has_usd
    FROM valorisations v
    JOIN fond_investissements f ON f.id = v.fund_id
    WHERE f.active = 1 AND v.date >= '2026-01-01'
    GROUP BY f.pays ORDER BY f.pays
  `);
  console.log('\n=== VL 2026 — couverture indRef par pays ===');
  recent.forEach(r => console.log(`  ${(r.pays||'NULL').padEnd(15)} local=${r.has_local} EUR=${r.has_eur} USD=${r.has_usd}`));

  // 5. Check actualites (news) table
  console.log('\n=== TABLE ACTUALITES (news) ===');
  const [news] = await conn.execute('SELECT id, date, LEFT(description, 80) as descr, username, type FROM actualites ORDER BY id');
  console.log(`${news.length} publications:`);
  news.forEach(r => {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date;
    console.log(`  ID=${r.id} date=${d} user=${r.username || 'NULL'} type=${r.type || 'NULL'} desc="${r.descr}"`);
  });

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => { console.error('ERREUR:', e); process.exit(1); });
