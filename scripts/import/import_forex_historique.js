/**
 * Import historique des paires de devises depuis fichiers XLSX
 *
 * Source: 5 fichiers XLSX couvrant 2000-2026
 *   1. Historique_XOF_UEMOA_2000_2026.xlsx -> EUR/XOF, USD/XOF
 *   2. Historique_MAD_Maroc_2000_2026.xlsx -> EUR/MAD, USD/MAD
 *   3. Historique_NGN_Nigeria_2000_2026.xlsx -> EUR/NGN, USD/NGN
 *   4. historique_EURUSD_quotidien_2000_2026.xlsx -> EUR/USD
 *   5. Historique_TND_Tunisie_2000_2026.xlsx -> EUR/TND, USD/TND
 *
 * Usage: node import_forex_historique.js <dossier_xlsx>
 *   Exemple: node import_forex_historique.js /root/.claude/uploads/03851f17-aeb7-474e-bf49-66f48c234592/
 *
 * Comportement NON-DESTRUCTIF:
 *   - INSERT IGNORE: si une paire+date existe deja, on ne l'ecrase pas
 *   - Valeurs vides ou 0 sont ignorees
 *   - Rapport detaille en fin d'execution
 */

const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const FILES_CONFIG = [
  {
    pattern: 'XOF_UEMOA',
    pairs: [
      { col: 'EURXOF', paire: 'EUR/XOF' },
      { col: 'USDXOF', paire: 'USD/XOF' },
    ],
  },
  {
    pattern: 'MAD_Maroc',
    pairs: [
      { col: 'EURMAD', paire: 'EUR/MAD' },
      { col: 'USDMAD', paire: 'USD/MAD' },
    ],
  },
  {
    pattern: 'NGN_Nigeria',
    pairs: [
      { col: 'EURNGN', paire: 'EUR/NGN' },
      { col: 'USDNGN', paire: 'USD/NGN' },
    ],
  },
  {
    pattern: 'EURUSD',
    pairs: [
      { col: 'EUR_USD', paire: 'EUR/USD' },
    ],
  },
  {
    pattern: 'TND_Tunisie',
    pairs: [
      { col: 'EURTND', paire: 'EUR/TND' },
      { col: 'USDTND', paire: 'USD/TND' },
    ],
  },
];

function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Format DD/MM/YYYY
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // Excel serial number
  if (/^\d+$/.test(s)) {
    const serial = parseInt(s, 10);
    if (serial > 30000 && serial < 60000) {
      const d = new Date((serial - 25569) * 86400 * 1000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return null;
}

function parseValue(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const v = parseFloat(raw);
  if (isNaN(v) || v <= 0) return null;
  return v;
}

async function run() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node import_forex_historique.js <dossier_xlsx>');
    process.exit(1);
  }

  if (!fs.existsSync(dir)) {
    console.error(`Dossier introuvable: ${dir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  console.log(`Dossier: ${dir}`);
  console.log(`Fichiers XLSX trouves: ${files.length}`);

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm\n');

  // Verifier si la table a un index unique sur (paire, date)
  const [indexes] = await conn.execute(`SHOW INDEX FROM devisedechanges`);
  const hasUniqueIndex = indexes.some(idx =>
    idx.Non_unique === 0 && (idx.Column_name === 'paire' || idx.Column_name === 'date')
  );

  // Charger les dates existantes par paire pour eviter les doublons
  console.log('Chargement des donnees existantes...');
  const [existingRows] = await conn.execute(
    `SELECT paire, date FROM devisedechanges WHERE value > 0`
  );
  const existingSet = new Set();
  for (const r of existingRows) {
    const dateStr = r.date instanceof Date
      ? r.date.toISOString().split('T')[0]
      : String(r.date);
    existingSet.add(`${r.paire}|${dateStr}`);
  }
  console.log(`  ${existingSet.size} entrees existantes en base\n`);

  const report = {
    totalInserted: 0,
    totalSkipped: 0,
    totalInvalid: 0,
    byPair: {},
  };

  for (const config of FILES_CONFIG) {
    const file = files.find(f => f.includes(config.pattern));
    if (!file) {
      console.log(`  SKIP: aucun fichier match "${config.pattern}"`);
      continue;
    }

    console.log(`\n=== ${file} ===`);
    const wb = XLSX.readFile(path.join(dir, file));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    console.log(`  ${data.length} lignes lues`);

    for (const pairConfig of config.pairs) {
      const { col, paire } = pairConfig;
      report.byPair[paire] = { inserted: 0, skipped: 0, invalid: 0 };

      const batch = [];

      for (const row of data) {
        const date = parseDate(row['Date'] || row['date']);
        if (!date) {
          report.byPair[paire].invalid++;
          continue;
        }

        const value = parseValue(row[col]);
        if (value === null) {
          report.byPair[paire].invalid++;
          continue;
        }

        const key = `${paire}|${date}`;
        if (existingSet.has(key)) {
          report.byPair[paire].skipped++;
          continue;
        }

        batch.push([paire, date, value]);
        existingSet.add(key);
      }

      if (batch.length === 0) {
        console.log(`    ${paire}: rien a inserer (${report.byPair[paire].skipped} deja en base, ${report.byPair[paire].invalid} invalides)`);
        continue;
      }

      // Insertion par lots de 500
      const BATCH_SIZE = 500;
      let inserted = 0;

      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const placeholders = chunk.map(() => '(?, ?, ?)').join(', ');
        const values = chunk.flat();

        try {
          const [result] = await conn.execute(
            `INSERT IGNORE INTO devisedechanges (paire, date, value) VALUES ${placeholders}`,
            values
          );
          inserted += result.affectedRows;
        } catch (e) {
          console.error(`    ERREUR insertion ${paire}: ${e.message}`);
        }
      }

      report.byPair[paire].inserted = inserted;
      report.totalInserted += inserted;
      report.totalSkipped += report.byPair[paire].skipped;
      report.totalInvalid += report.byPair[paire].invalid;

      console.log(`    ${paire}: ${inserted} inseres, ${report.byPair[paire].skipped} deja existants, ${report.byPair[paire].invalid} invalides`);
    }
  }

  // ============================================================
  // RAPPORT FINAL
  // ============================================================
  console.log('\n\n==========================================');
  console.log('=== RAPPORT IMPORT FOREX HISTORIQUE ===');
  console.log('==========================================');
  console.log(`Total inseres:     ${report.totalInserted}`);
  console.log(`Total deja en base: ${report.totalSkipped}`);
  console.log(`Total invalides:   ${report.totalInvalid}`);
  console.log('\nDetail par paire:');
  for (const [paire, stats] of Object.entries(report.byPair)) {
    console.log(`  ${paire.padEnd(10)} : ${stats.inserted} inseres, ${stats.skipped} existants, ${stats.invalid} invalides`);
  }

  // Verification finale
  const [verification] = await conn.execute(`
    SELECT paire, COUNT(*) as cnt, MIN(date) as min_date, MAX(date) as max_date
    FROM devisedechanges WHERE value > 0
    GROUP BY paire ORDER BY paire
  `);
  console.log('\nEtat final devisedechanges:');
  for (const row of verification) {
    console.log(`  ${row.paire.padEnd(10)} : ${row.cnt} entrees (${row.min_date} -> ${row.max_date})`);
  }

  await conn.end();
  console.log('\nConnexion fermee. Import termine.');
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
