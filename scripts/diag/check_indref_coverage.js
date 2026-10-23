/**
 * DIAGNOSTIC READ-ONLY — Couverture indRef (local + EUR + USD) par pays
 *
 * Remplace les requetes SQL collees a la main (qui finissaient dans bash).
 * Se connecte a la base de production et imprime un rapport clair.
 *
 * AUCUNE ECRITURE. 100% SELECT. Sans danger pour la production.
 *
 * Usage:
 *   node scripts/diag/check_indref_coverage.js
 *   node scripts/diag/check_indref_coverage.js --pays UEMOA
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

function pct(num, den) {
  if (!den || den === 0) return '0.0%';
  return ((num / den) * 100).toFixed(1) + '%';
}

async function run() {
  const args = process.argv.slice(2);
  const paysIdx = args.indexOf('--pays');
  const paysFilter = paysIdx >= 0 ? args[paysIdx + 1] : null;

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm (lecture seule)\n');

  // ============================================================
  // 1. COUVERTURE indRef PAR PAYS (fonds + VL, local/EUR/USD)
  // ============================================================
  console.log('============================================================');
  console.log('1. COUVERTURE indRef PAR PAYS');
  console.log('============================================================');

  let where = '';
  const params = [];
  if (paysFilter) { where = 'WHERE fi.pays = ?'; params.push(paysFilter); }

  const [rows] = await conn.execute(
    `SELECT fi.pays, fi.dev_libelle,
       COUNT(DISTINCT v.fund_id) AS funds,
       COUNT(DISTINCT CASE WHEN v.indRef > 0 THEN v.fund_id END) AS funds_local,
       COUNT(DISTINCT CASE WHEN v.indRef_EUR > 0 THEN v.fund_id END) AS funds_eur,
       COUNT(DISTINCT CASE WHEN v.indRef_USD > 0 THEN v.fund_id END) AS funds_usd,
       COUNT(*) AS vl,
       SUM(CASE WHEN v.indRef > 0 THEN 1 ELSE 0 END) AS vl_local,
       SUM(CASE WHEN v.indRef_EUR > 0 THEN 1 ELSE 0 END) AS vl_eur,
       SUM(CASE WHEN v.indRef_USD > 0 THEN 1 ELSE 0 END) AS vl_usd
     FROM valorisations v
     JOIN fond_investissements fi ON fi.id = v.fund_id
     ${where}
     GROUP BY fi.pays, fi.dev_libelle
     ORDER BY vl DESC`,
    params
  );

  for (const r of rows) {
    console.log(`\n--- ${r.pays} (${r.dev_libelle || 'N/A'}) ---`);
    console.log(`  Fonds: ${r.funds} | indRef local: ${r.funds_local} (${pct(r.funds_local, r.funds)}) | EUR: ${r.funds_eur} (${pct(r.funds_eur, r.funds)}) | USD: ${r.funds_usd} (${pct(r.funds_usd, r.funds)})`);
    console.log(`  VL:    ${r.vl} | indRef local: ${r.vl_local} (${pct(r.vl_local, r.vl)}) | EUR: ${r.vl_eur} (${pct(r.vl_eur, r.vl)}) | USD: ${r.vl_usd} (${pct(r.vl_usd, r.vl)})`);
  }

  // ============================================================
  // 2. INDICES DISPONIBLES (indice_references)
  // ============================================================
  console.log('\n============================================================');
  console.log('2. INDICES DISPONIBLES (indice_references)');
  console.log('============================================================');
  const [indices] = await conn.execute(
    `SELECT id_indice, nom_indice, COUNT(*) AS entries,
            MIN(date) AS first_date, MAX(date) AS last_date
     FROM indice_references
     GROUP BY id_indice, nom_indice
     ORDER BY entries DESC`
  );
  if (indices.length === 0) {
    console.log('  AUCUN indice dans indice_references !');
  }
  for (const i of indices) {
    const fd = i.first_date instanceof Date ? i.first_date.toISOString().slice(0, 10) : i.first_date;
    const ld = i.last_date instanceof Date ? i.last_date.toISOString().slice(0, 10) : i.last_date;
    console.log(`  ${i.id_indice} (${i.nom_indice}): ${i.entries} entrees, ${fd} -> ${ld}`);
  }

  // ============================================================
  // 3. SANITY CHECK multiplication vs division (EUR)
  // ============================================================
  console.log('\n============================================================');
  console.log('3. SANITY CHECK conversion (mult vs div) — devises non EUR/USD');
  console.log('============================================================');
  console.log('  Regle: indRef_EUR = indRef_local / taux. Pour TND/XOF/XAF/NGN/MAD,');
  console.log('  le taux > 1 donc indRef_EUR DOIT etre < indRef_local (DIVISION OK).');
  const [sanity] = await conn.execute(
    `SELECT fi.pays, fi.dev_libelle,
       AVG(v.indRef) AS avg_local,
       AVG(v.indRef_EUR) AS avg_eur,
       CASE WHEN AVG(v.indRef_EUR) > AVG(v.indRef) THEN 'MULTIPLICATION (BUG)' ELSE 'DIVISION (OK)' END AS diagnostic
     FROM valorisations v
     JOIN fond_investissements fi ON fi.id = v.fund_id
     WHERE v.indRef > 0 AND v.indRef_EUR > 0
       AND fi.dev_libelle NOT IN ('EUR', 'USD')
       ${paysFilter ? 'AND fi.pays = ?' : ''}
     GROUP BY fi.pays, fi.dev_libelle`,
    paysFilter ? [paysFilter] : []
  );
  for (const s of sanity) {
    const local = s.avg_local != null ? Number(s.avg_local).toFixed(2) : 'N/A';
    const eur = s.avg_eur != null ? Number(s.avg_eur).toFixed(2) : 'N/A';
    console.log(`  ${s.pays} (${s.dev_libelle}): local=${local} eur=${eur} -> ${s.diagnostic}`);
  }

  // ============================================================
  // 4. FONDS UEMOA/TUNISIE sans indRef local (top manquants)
  // ============================================================
  console.log('\n============================================================');
  console.log('4. FONDS SANS indRef LOCAL (UEMOA + TUNISIE, max 20)');
  console.log('============================================================');
  const [missing] = await conn.execute(
    `SELECT fi.id, fi.nom_fond, fi.pays, fi.active, fi.indice_benchmark,
       (SELECT COUNT(*) FROM valorisations WHERE fund_id = fi.id) AS total_vl,
       (SELECT COUNT(*) FROM valorisations WHERE fund_id = fi.id AND indRef > 0) AS vl_with_indref
     FROM fond_investissements fi
     WHERE fi.pays IN ('UEMOA', 'TUNISIE')
       AND (SELECT COUNT(*) FROM valorisations WHERE fund_id = fi.id AND indRef > 0) = 0
       AND (SELECT COUNT(*) FROM valorisations WHERE fund_id = fi.id) > 0
     ORDER BY fi.pays, total_vl DESC
     LIMIT 20`
  );
  if (missing.length === 0) {
    console.log('  Aucun fonds UEMOA/TUNISIE sans indRef local (couverture complete).');
  }
  for (const m of missing) {
    console.log(`  [${m.pays}] id:${m.id} ${m.nom_fond} | active:${m.active} | bench:${m.indice_benchmark || 'NULL'} | VL:${m.total_vl} | indRef:0`);
  }

  await conn.end();
  console.log('\nDiagnostic termine (aucune ecriture effectuee).');
}

run().catch(err => {
  console.error('Erreur fatale:', err.message);
  process.exit(1);
});
