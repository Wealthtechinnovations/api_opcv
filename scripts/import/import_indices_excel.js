/**
 * Import des indices de reference depuis un fichier Excel
 * et peuplement du champ indRef dans valorisations.
 *
 * POINT 1: Import indices -> table indice_references
 * POINT 2: Peuplement indRef dans valorisations (matching date fond <-> date indice)
 * POINT 4: Conversion indRef en EUR/USD via taux de change
 *
 * Mapping indices <-> pays:
 *   MASI_Maroc    -> Maroc
 *   Tunindex_Tunisie -> Tunisie
 *   BRVM_UEMOA   -> Cote d'Ivoire, Senegal, Burkina Faso, Mali, Togo, Benin, Niger, Guinee-Bissau (UEMOA)
 *   MONIA_Maroc   -> (secondaire, pas de mapping fond direct)
 *   NSE_Nigeria   -> Nigeria
 *
 * Modes:
 *   --report  (defaut) : affiche ce qui serait fait sans modifier
 *   --execute          : effectue les insertions/mises a jour
 *
 * Options:
 *   --step 1           : etape 1 seulement (import indices)
 *   --step 2           : etape 2 seulement (peuplement indRef)
 *   --step 4           : etape 4 seulement (conversion EUR/USD)
 *   --step all         : toutes les etapes (defaut)
 *   --pays Maroc       : un seul pays
 *   --fond 123         : un seul fond
 *
 * Usage:
 *   node import_indices_excel.js                           # rapport complet
 *   node import_indices_excel.js --execute                 # tout executer
 *   node import_indices_excel.js --execute --step 1        # import indices seulement
 *   node import_indices_excel.js --execute --step 2        # peuplement indRef seulement
 *   node import_indices_excel.js --execute --step 4        # conversion EUR/USD seulement
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const EXCEL_FILE = path.join(__dirname, 'Historique_Indices_Complet.xlsx');

const INDEX_CONFIG = [
  {
    excelColumn: 'MASI_Maroc',
    id_indice: 'MASI',
    nom_indice: 'MASI',
    type_indice_id: 1,
    pays: ['Maroc'],
    devise_locale: 'MAD',
  },
  {
    excelColumn: 'Tunindex_Tunisie',
    id_indice: 'TUNINDEX',
    nom_indice: 'Tunindex',
    type_indice_id: 1,
    pays: ['Tunisie'],
    devise_locale: 'TND',
  },
  {
    excelColumn: 'BRVM_UEMOA',
    id_indice: 'BRVM',
    nom_indice: 'BRVM Composite',
    type_indice_id: 1,
    pays: ['Côte d\'Ivoire', 'Cote d\'Ivoire', 'Senegal', 'Sénégal', 'Burkina Faso', 'Mali', 'Togo', 'Benin', 'Bénin', 'Niger', 'Guinee-Bissau', 'Guinée-Bissau', 'UEMOA'],
    devise_locale: 'XOF',
  },
  {
    excelColumn: 'NSE_Nigeria',
    id_indice: 'NSE',
    nom_indice: 'NSE All Share',
    type_indice_id: 1,
    pays: ['Nigeria', 'NIGERIA'],
    devise_locale: 'NGN',
  },
  {
    excelColumn: 'MONIA_Maroc',
    id_indice: 'MONIA',
    nom_indice: 'MONIA',
    type_indice_id: 1,
    pays: [],
    devise_locale: 'MAD',
  },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { mode: 'report', step: 'all', pays: null, fondId: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--report') opts.mode = 'report';
    else if (args[i] === '--execute') opts.mode = 'execute';
    else if (args[i] === '--step' && args[i + 1]) opts.step = args[++i];
    else if (args[i] === '--pays' && args[i + 1]) opts.pays = args[++i];
    else if (args[i] === '--fond' && args[i + 1]) opts.fondId = parseInt(args[++i]);
  }
  return opts;
}

function excelDateToJSDate(serial) {
  const epoch = new Date(1899, 11, 30);
  const d = new Date(epoch.getTime() + serial * 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readExcelData() {
  const wb = XLSX.readFile(EXCEL_FILE);
  const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('normal')) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(ws, { defval: null });

  console.log(`  Feuille: ${sheetName}`);
  console.log(`  Lignes brutes: ${rawData.length}`);

  const data = [];
  for (const row of rawData) {
    const dateRaw = row['Date'] || row['date'];
    if (!dateRaw) continue;

    let dateStr;
    if (typeof dateRaw === 'number') {
      dateStr = excelDateToJSDate(dateRaw);
    } else {
      dateStr = String(dateRaw).trim();
      if (/^\d{4}_\d{2}_\d{2}$/.test(dateStr)) {
        dateStr = dateStr.replace(/_/g, '-');
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

    const entry = { date: dateStr };
    for (const cfg of INDEX_CONFIG) {
      const val = row[cfg.excelColumn];
      entry[cfg.excelColumn] = (val !== null && val !== undefined && val !== '' && !isNaN(val)) ? parseFloat(val) : null;
    }
    data.push(entry);
  }

  console.log(`  Lignes valides: ${data.length}`);
  if (data.length > 0) {
    console.log(`  Periode: ${data[0].date} -> ${data[data.length - 1].date}`);
  }

  for (const cfg of INDEX_CONFIG) {
    const count = data.filter(d => d[cfg.excelColumn] !== null).length;
    console.log(`  ${cfg.excelColumn}: ${count} valeurs`);
  }

  return data;
}

/**
 * FALLBACK: reconstruit le meme format que readExcelData() a partir de la
 * table indice_references (deja peuplee par l'etape 1 lors d'un import precedent).
 * Permet a l'etape 2 (peuplement indRef) de fonctionner meme si le fichier Excel
 * n'est pas present sur le serveur de production.
 */
async function loadIndexDataFromDB(conn) {
  console.log('  Source: table indice_references (fichier Excel absent)');
  // Map id_indice -> excelColumn
  const idToColumn = {};
  for (const cfg of INDEX_CONFIG) idToColumn[cfg.id_indice] = cfg.excelColumn;

  const [refRows] = await conn.execute(
    `SELECT id_indice, date, valeur FROM indice_references
     WHERE valeur IS NOT NULL AND valeur > 0
     ORDER BY date ASC`
  );

  const byDate = new Map();
  for (const r of refRows) {
    const col = idToColumn[r.id_indice];
    if (!col) continue;
    const d = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);
    if (!byDate.has(d)) {
      const entry = { date: d };
      for (const cfg of INDEX_CONFIG) entry[cfg.excelColumn] = null;
      byDate.set(d, entry);
    }
    byDate.get(d)[col] = parseFloat(r.valeur);
  }

  const data = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  Lignes reconstruites depuis DB: ${data.length}`);
  if (data.length > 0) {
    console.log(`  Periode: ${data[0].date} -> ${data[data.length - 1].date}`);
  }
  for (const cfg of INDEX_CONFIG) {
    const count = data.filter(d => d[cfg.excelColumn] !== null).length;
    console.log(`  ${cfg.excelColumn}: ${count} valeurs`);
  }
  return data;
}

// ===================================================
// ETAPE 1: Import indices -> indice_references
// ===================================================
async function importIndicesToDB(conn, excelData, opts) {
  console.log('\n========================================');
  console.log('ETAPE 1: Import indices dans indice_references');
  console.log('========================================\n');

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const cfg of INDEX_CONFIG) {
    const values = excelData.filter(d => d[cfg.excelColumn] !== null);
    console.log(`\n--- ${cfg.nom_indice} (${cfg.id_indice}): ${values.length} valeurs ---`);

    if (values.length === 0) continue;

    const [existing] = await conn.execute(
      'SELECT date, valeur FROM indice_references WHERE id_indice = ?',
      [cfg.id_indice]
    );
    const existingMap = new Map();
    for (const row of existing) {
      const d = row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date);
      existingMap.set(d, row.valeur);
    }
    console.log(`  Existant en base: ${existing.length} entrees`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const batchInsert = [];

    for (const entry of values) {
      const existVal = existingMap.get(entry.date);

      if (existVal !== undefined) {
        if (Math.abs(existVal - entry[cfg.excelColumn]) > 0.001) {
          if (opts.mode === 'execute') {
            await conn.execute(
              'UPDATE indice_references SET valeur = ? WHERE id_indice = ? AND date = ?',
              [entry[cfg.excelColumn], cfg.id_indice, entry.date]
            );
          }
          updated++;
        } else {
          skipped++;
        }
      } else {
        batchInsert.push([cfg.type_indice_id, cfg.id_indice, cfg.nom_indice, entry[cfg.excelColumn], entry.date]);
        inserted++;
      }
    }

    if (opts.mode === 'execute' && batchInsert.length > 0) {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < batchInsert.length; i += BATCH_SIZE) {
        const batch = batchInsert.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const flatValues = batch.flat();
        await conn.execute(
          `INSERT INTO indice_references (type_indice_id, id_indice, nom_indice, valeur, date) VALUES ${placeholders}`,
          flatValues
        );
      }
    }

    console.log(`  -> Inseres: ${inserted}, Mis a jour: ${updated}, Identiques: ${skipped}`);
    totalInserted += inserted;
    totalUpdated += updated;
    totalSkipped += skipped;
  }

  console.log(`\n--- TOTAL ETAPE 1 ---`);
  console.log(`  Inseres: ${totalInserted}, Mis a jour: ${totalUpdated}, Identiques: ${totalSkipped}`);
  return { totalInserted, totalUpdated, totalSkipped };
}

// ===================================================
// ETAPE 2: Peuplement indRef dans valorisations
// ===================================================
async function populateIndRef(conn, excelData, opts) {
  console.log('\n========================================');
  console.log('ETAPE 2: Peuplement indRef dans valorisations');
  console.log('========================================\n');

  const indexConfigs = INDEX_CONFIG.filter(cfg => cfg.pays.length > 0);

  let paysFilter = '';
  const paysParams = [];
  if (opts.pays) {
    paysFilter = ' AND fi.pays = ?';
    paysParams.push(opts.pays);
  }

  let fondFilter = '';
  const fondParams = [];
  if (opts.fondId) {
    fondFilter = ' AND fi.id = ?';
    fondParams.push(opts.fondId);
  }

  const [funds] = await conn.execute(
    `SELECT fi.id, fi.nom_fond, fi.pays, fi.dev_libelle, fi.indice_benchmark, fi.indice
     FROM fond_investissements fi
     WHERE fi.pays IS NOT NULL ${paysFilter} ${fondFilter}
     ORDER BY fi.pays, fi.id`,
    [...paysParams, ...fondParams]
  );

  console.log(`Fonds trouves: ${funds.length}`);

  let totalUpdated = 0;
  let totalAlreadySet = 0;
  let totalNoMatch = 0;
  let fundsProcessed = 0;
  let fundsSkipped = 0;
  let fundsLinked = 0;

  for (const fund of funds) {
    const matchingCfg = indexConfigs.find(cfg =>
      cfg.pays.some(p => p.toLowerCase() === (fund.pays || '').toLowerCase())
    );

    if (!matchingCfg) {
      fundsSkipped++;
      continue;
    }

    const indexData = new Map();
    for (const entry of excelData) {
      if (entry[matchingCfg.excelColumn] !== null) {
        indexData.set(entry.date, entry[matchingCfg.excelColumn]);
      }
    }

    const [vls] = await conn.execute(
      'SELECT id, date, indRef, indice_name, ID_indice FROM valorisations WHERE fund_id = ? ORDER BY date ASC',
      [fund.id]
    );

    if (vls.length === 0) {
      fundsSkipped++;
      continue;
    }

    let updated = 0;
    let alreadySet = 0;
    let noMatch = 0;
    let needsLinkUpdate = false;

    if (!fund.indice_benchmark || fund.indice_benchmark.trim() === '' ||
        !fund.indice || fund.indice.trim() === '') {
      needsLinkUpdate = true;
    }

    for (const vl of vls) {
      const vlDate = vl.date instanceof Date
        ? vl.date.toISOString().slice(0, 10)
        : String(vl.date);

      let indexVal = indexData.get(vlDate);

      if (indexVal === undefined) {
        const vlDateObj = new Date(vlDate);
        let bestDate = null;
        let bestDiff = Infinity;
        for (const [d, v] of indexData) {
          const diff = Math.abs(new Date(d) - vlDateObj);
          if (diff < bestDiff && diff <= 7 * 86400000) {
            bestDiff = diff;
            bestDate = d;
          }
        }
        if (bestDate) {
          indexVal = indexData.get(bestDate);
        }
      }

      if (indexVal === undefined) {
        noMatch++;
        continue;
      }

      if (vl.indRef !== null && Math.abs(vl.indRef - indexVal) < 0.01) {
        alreadySet++;
        continue;
      }

      if (opts.mode === 'execute') {
        await conn.execute(
          'UPDATE valorisations SET indRef = ?, indice_name = ?, ID_indice = ? WHERE id = ?',
          [indexVal, matchingCfg.nom_indice, matchingCfg.id_indice, vl.id]
        );
      }
      updated++;
    }

    if (needsLinkUpdate && opts.mode === 'execute') {
      await conn.execute(
        'UPDATE fond_investissements SET indice_benchmark = ?, indice = ? WHERE id = ?',
        [matchingCfg.nom_indice, matchingCfg.id_indice, fund.id]
      );
      fundsLinked++;
    }

    if (updated > 0 || noMatch > 0) {
      console.log(`  [${fund.pays}] ${fund.nom_fond} (id:${fund.id}): ${updated} maj, ${alreadySet} ok, ${noMatch} sans match${needsLinkUpdate ? ' [LIEN INDICE MIS A JOUR]' : ''}`);
    }

    totalUpdated += updated;
    totalAlreadySet += alreadySet;
    totalNoMatch += noMatch;
    fundsProcessed++;
  }

  console.log(`\n--- TOTAL ETAPE 2 ---`);
  console.log(`  Fonds traites: ${fundsProcessed}, Ignores (pas d'indice): ${fundsSkipped}`);
  console.log(`  VL mises a jour: ${totalUpdated}`);
  console.log(`  VL deja a jour: ${totalAlreadySet}`);
  console.log(`  VL sans date indice: ${totalNoMatch}`);
  console.log(`  Liens fond->indice crees: ${fundsLinked}`);
  return { totalUpdated, totalAlreadySet, totalNoMatch, fundsProcessed, fundsLinked };
}

// ===================================================
// ETAPE 4: Conversion indRef -> indRef_EUR / indRef_USD
// ===================================================
async function convertIndRefCurrency(conn, opts) {
  console.log('\n========================================');
  console.log('ETAPE 4: Conversion indRef en EUR/USD');
  console.log('========================================\n');

  let paysFilter = '';
  const paysParams = [];
  if (opts.pays) {
    paysFilter = ' AND fi.pays = ?';
    paysParams.push(opts.pays);
  }

  let fondFilter = '';
  const fondParams = [];
  if (opts.fondId) {
    fondFilter = ' AND fi.id = ?';
    fondParams.push(opts.fondId);
  }

  const [funds] = await conn.execute(
    `SELECT fi.id, fi.nom_fond, fi.pays, fi.dev_libelle
     FROM fond_investissements fi
     WHERE fi.pays IS NOT NULL ${paysFilter} ${fondFilter}
     ORDER BY fi.pays, fi.id`,
    [...paysParams, ...fondParams]
  );

  console.log(`Fonds trouves: ${funds.length}`);

  let totalConverted = 0;
  let totalNoRate = 0;
  let totalSkipped = 0;

  for (const fund of funds) {
    const devise = fund.dev_libelle;
    if (!devise) {
      continue;
    }

    const paireEUR = `EUR/${devise}`;
    const paireUSD = `USD/${devise}`;

    const [vls] = await conn.execute(
      `SELECT id, date, indRef, indRef_EUR, indRef_USD
       FROM valorisations
       WHERE fund_id = ? AND indRef IS NOT NULL AND indRef > 0
       ORDER BY date ASC`,
      [fund.id]
    );

    if (vls.length === 0) continue;

    let converted = 0;
    let noRate = 0;
    let skipped = 0;

    for (const vl of vls) {
      if (vl.indRef_EUR !== null && vl.indRef_EUR > 0 &&
          vl.indRef_USD !== null && vl.indRef_USD > 0) {
        skipped++;
        continue;
      }

      const vlDate = vl.date instanceof Date
        ? vl.date.toISOString().slice(0, 10)
        : String(vl.date);

      const [rateEUR] = await conn.execute(
        `SELECT value FROM devisedechanges WHERE paire = ? AND date <= ? ORDER BY date DESC LIMIT 1`,
        [paireEUR, vlDate]
      );

      const [rateUSD] = await conn.execute(
        `SELECT value FROM devisedechanges WHERE paire = ? AND date <= ? ORDER BY date DESC LIMIT 1`,
        [paireUSD, vlDate]
      );

      if (rateEUR.length === 0 || rateUSD.length === 0) {
        noRate++;
        continue;
      }

      const indRefEUR = vl.indRef / rateEUR[0].value;
      const indRefUSD = vl.indRef / rateUSD[0].value;

      if (opts.mode === 'execute') {
        await conn.execute(
          'UPDATE valorisations SET indRef_EUR = ?, indRef_USD = ? WHERE id = ?',
          [indRefEUR, indRefUSD, vl.id]
        );
      }
      converted++;
    }

    if (converted > 0 || noRate > 0) {
      console.log(`  [${fund.pays}] ${fund.nom_fond} (id:${fund.id}): ${converted} converties, ${skipped} deja ok, ${noRate} sans taux`);
    }

    totalConverted += converted;
    totalNoRate += noRate;
    totalSkipped += skipped;
  }

  console.log(`\n--- TOTAL ETAPE 4 ---`);
  console.log(`  indRef converties EUR/USD: ${totalConverted}`);
  console.log(`  Deja converties: ${totalSkipped}`);
  console.log(`  Sans taux de change: ${totalNoRate}`);
  return { totalConverted, totalNoRate, totalSkipped };
}

// ===================================================
// MAIN
// ===================================================
async function main() {
  const opts = parseArgs();
  console.log('============================================================');
  console.log('IMPORT INDICES DE REFERENCE DEPUIS EXCEL');
  console.log(`Mode: ${opts.mode.toUpperCase()}`);
  console.log(`Etape: ${opts.step}`);
  if (opts.pays) console.log(`Pays filtre: ${opts.pays}`);
  if (opts.fondId) console.log(`Fond filtre: ${opts.fondId}`);
  console.log('============================================================\n');

  // L'etape 4 (conversion EUR/USD) n'a PAS besoin du fichier Excel (lit la DB).
  // Les etapes 1 et 2 ont besoin des valeurs d'indice : Excel en priorite,
  // sinon fallback sur la table indice_references.
  const needsIndexData = (opts.step === 'all' || opts.step === '1' || opts.step === '2');
  let excelData = null;
  if (needsIndexData) {
    console.log('--- Lecture du fichier Excel ---');
    try {
      excelData = readExcelData();
    } catch (err) {
      console.warn('Fichier Excel absent ou illisible:', err.message);
      console.warn('-> Tentative de fallback sur la table indice_references.');
      excelData = null; // sera charge depuis la DB apres connexion
    }
  }

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('\nConnexion MySQL OK');

  try {
    const results = {};

    // Si Excel absent, reconstruire les donnees depuis la DB pour les etapes 1/2
    if (needsIndexData && !excelData) {
      excelData = await loadIndexDataFromDB(conn);
    }

    if (opts.step === 'all' || opts.step === '1') {
      if (!excelData || excelData.length === 0) {
        console.warn('Etape 1 ignoree: pas de source de donnees indice (Excel absent et indice_references vide).');
      } else {
        results.step1 = await importIndicesToDB(conn, excelData, opts);
      }
    }

    if (opts.step === 'all' || opts.step === '2') {
      if (!excelData || excelData.length === 0) {
        console.warn('Etape 2 ignoree: pas de source de donnees indice (Excel absent et indice_references vide).');
      } else {
        results.step2 = await populateIndRef(conn, excelData, opts);
      }
    }

    if (opts.step === 'all' || opts.step === '4') {
      results.step4 = await convertIndRefCurrency(conn, opts);
    }

    console.log('\n============================================================');
    console.log('RESUME FINAL');
    console.log('============================================================');
    if (results.step1) {
      console.log(`Etape 1 - Import indices: ${results.step1.totalInserted} inseres, ${results.step1.totalUpdated} mis a jour`);
    }
    if (results.step2) {
      console.log(`Etape 2 - Peuplement indRef: ${results.step2.totalUpdated} VL maj, ${results.step2.fundsLinked} liens fond->indice crees`);
    }
    if (results.step4) {
      console.log(`Etape 4 - Conversion EUR/USD: ${results.step4.totalConverted} converties`);
    }
    if (opts.mode === 'report') {
      console.log('\n>>> MODE RAPPORT: aucune modification effectuee <<<');
      console.log('>>> Pour executer: node import_indices_excel.js --execute <<<');
    } else {
      console.log('\n>>> MODIFICATIONS APPLIQUEES <<<');
    }

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('ERREUR FATALE:', err);
  process.exit(1);
});
