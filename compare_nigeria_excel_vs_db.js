/**
 * Compare les fonds du fichier Excel SEC Nigeria avec la base de données.
 * Identifie les fonds manquants et vérifie les valeurs VL/actif_net.
 *
 * Usage: node compare_nigeria_excel_vs_db.js <fichier.xlsx>
 */

const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node compare_nigeria_excel_vs_db.js <fichier.xlsx>');
    process.exit(1);
  }

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // Parse Excel: find header row, extract CURRENT week data
  let headerRow = -1;
  let colFund = -1, colManager = -1, colNAV = -1, colOffer = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;
    for (let j = 0; j < row.length; j++) {
      if (row[j] && String(row[j]).trim() === 'FUND') {
        headerRow = i;
        colFund = j;
        break;
      }
    }
    if (headerRow >= 0) break;
  }

  if (headerRow < 0) {
    console.error('Header row not found');
    process.exit(1);
  }

  const header = rows[headerRow];
  colManager = header.indexOf('FUND MANAGER');

  // Find CURRENT week NAV and Offer Price (second occurrence = current week)
  let navCount = 0, offerCount = 0;
  for (let j = 0; j < header.length; j++) {
    const h = String(header[j] || '').trim();
    if (h === 'NAV (N)') {
      navCount++;
      if (navCount === 2) colNAV = j;
    }
    if (h === 'Offer Price (N)') {
      offerCount++;
      if (offerCount === 2) colOffer = j;
    }
  }

  // Fallback: if only one set of columns, use first
  if (colNAV < 0) {
    for (let j = 0; j < header.length; j++) {
      if (String(header[j] || '').trim() === 'NAV (N)') { colNAV = j; break; }
    }
  }
  if (colOffer < 0) {
    for (let j = 0; j < header.length; j++) {
      if (String(header[j] || '').trim() === 'Offer Price (N)') { colOffer = j; break; }
    }
  }

  console.log(`Header row: ${headerRow}, Fund col: ${colFund}, Manager col: ${colManager}, NAV col: ${colNAV}, Offer col: ${colOffer}`);

  // Extract funds
  const excelFunds = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const sn = row[0];
    const fundName = row[colFund];
    const nav = row[colNAV];

    if (fundName && nav && typeof sn === 'number') {
      excelFunds.push({
        name: String(fundName).trim(),
        manager: row[colManager] ? String(row[colManager]).trim() : '',
        nav: Number(nav) || 0,
        offer: Number(row[colOffer]) || 0,
      });
    }
  }

  console.log(`\nFonds dans Excel: ${excelFunds.length}`);

  // DB
  const conn = await mysql.createConnection(DB_CONFIG);

  const [dbFunds] = await conn.execute(`
    SELECT f.id, f.nom_fond, f.societe_gestion, f.societe_id,
           MAX(v.date) as derniere_vl
    FROM fond_investissements f
    LEFT JOIN valorisations v ON v.fund_id = f.id
    WHERE LOWER(f.pays) = 'nigeria'
    GROUP BY f.id
  `);

  console.log(`Fonds Nigeria en base: ${dbFunds.length}`);

  const dbByName = new Map();
  const dbByLower = new Map();
  for (const f of dbFunds) {
    dbByName.set(f.nom_fond, f);
    dbByLower.set(f.nom_fond.toLowerCase().trim(), f);
  }

  // Compare
  const missing = [];
  const found = [];
  const no2026 = [];

  for (const ef of excelFunds) {
    const match = dbByName.get(ef.name) || dbByLower.get(ef.name.toLowerCase().trim());
    if (!match) {
      missing.push(ef);
    } else {
      found.push({ excel: ef, db: match });
      if (!match.derniere_vl || String(match.derniere_vl) < '2026-01-01') {
        no2026.push({ excel: ef, db: match });
      }
    }
  }

  console.log(`\n=== FONDS EXCEL TROUVÉS EN BASE: ${found.length}/${excelFunds.length} ===`);
  console.log(`\n=== FONDS EXCEL MANQUANTS EN BASE: ${missing.length} ===`);
  for (const m of missing) {
    console.log(`  MANQUANT: "${m.name}" (manager: ${m.manager}, NAV: ${m.nav.toLocaleString()}, Offer: ${m.offer})`);
  }

  if (no2026.length > 0) {
    console.log(`\n=== FONDS TROUVÉS MAIS SANS VL 2026: ${no2026.length} ===`);
    for (const n of no2026) {
      console.log(`  "${n.excel.name}" (id=${n.db.id}, dernière VL: ${n.db.derniere_vl || 'AUCUNE'})`);
    }
  }

  // Check last VL vs Excel values for a sample
  console.log(`\n=== VÉRIFICATION VL/AN SUR 15 FONDS (Excel vs DB) ===`);
  let checked = 0;
  for (const { excel, db } of found) {
    if (checked >= 15) break;
    if (!db.derniere_vl) continue;

    const [vls] = await conn.execute(
      `SELECT value, actif_net FROM valorisations WHERE fund_id = ? ORDER BY date DESC LIMIT 1`,
      [db.id]
    );
    if (vls.length === 0) continue;

    const dbVL = Number(vls[0].value) || 0;
    const dbAN = Number(vls[0].actif_net) || 0;
    const excelVL = excel.offer;
    const excelAN = excel.nav;

    const vlMatch = Math.abs(dbVL - excelVL) < 1 ? 'OK' : 'DIFF';
    const anMatch = Math.abs(dbAN - excelAN) / Math.max(excelAN, 1) < 0.05 ? 'OK' : 'DIFF';

    console.log(`  ${excel.name.substring(0, 40).padEnd(40)} | DB_VL=${dbVL.toFixed(4).padStart(12)} vs XL_VL=${excelVL.toFixed(4).padStart(12)} [${vlMatch}] | DB_AN=${dbAN.toFixed(0).padStart(15)} vs XL_AN=${excelAN.toFixed(0).padStart(15)} [${anMatch}]`);
    checked++;
  }

  await conn.end();
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
