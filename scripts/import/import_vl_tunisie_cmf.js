#!/usr/bin/env node
/**
 * import_vl_tunisie_cmf.js
 *
 * Import VL Tunisie depuis les fichiers CMF V1.8.3 (CSV export final).
 *
 * Source: CMF_TUNISIE_V183_VL_MASTER_PERIODICITE_COMPLETEE.csv
 *         CMF_TUNISIE_V183_DIVIDENDES.csv
 *         CMF_TUNISIE_V183_REFERENTIEL_FONDS_PERIODICITE_COMPLETEE.csv
 *
 * Usage:
 *   node import_vl_tunisie_cmf.js --dry-run              # simulation
 *   node import_vl_tunisie_cmf.js --execute              # import réel
 *   node import_vl_tunisie_cmf.js --execute --force      # écrase les VL existantes (UPSERT)
 *
 * Comportement:
 *   - Matching fonds CMF → prod par nom normalisé (exact puis fuzzy)
 *   - Si fonds inexistant en prod et actif (dernière VL >= 2025): crée le fonds
 *   - VL: INSERT IGNORE par défaut (ne remplace pas existantes)
 *   - VL: UPSERT avec --force (remplace les VL existantes par les nouvelles)
 *   - Dividendes intégrés dans les lignes VL correspondantes
 *   - Conversion EUR/USD avec taux quotidien depuis devisedechanges
 *   - Mise à jour datejour, date_premiere_vl, montant_premier_vl après import
 *
 * Dépendances: mysql2, dotenv (déjà dans le projet)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const PAYS = 'Tunisie';
const DEVISE = 'TND';
const REGULATEUR = 'Conseil du Marché Financier (CMF)';
const REGION = 'Afrique du Nord';

const DATA_DIR = '/home/user/data_tunisie/TUNISIE VL/final_v183';

const CLASSIFICATION_MAP = {
  'ACTIONS':     { classification: 'ACTIONS',     categorie_globale: 'ACTIONS',     categorie_national: 'ACTIONS Tunisie',     categorie_regional: 'ACTIONS Afrique du Nord' },
  'OBLIGATIONS': { classification: 'OBLIGATIONS', categorie_globale: 'OBLIGATIONS', categorie_national: 'OBLIGATIONS Tunisie', categorie_regional: 'OBLIGATIONS Afrique du Nord' },
  'DIVERSIFIE':  { classification: 'DIVERSIFIE',  categorie_globale: 'DIVERSIFIE',  categorie_national: 'DIVERSIFIE Tunisie',  categorie_regional: 'DIVERSIFIE Afrique du Nord' },
};

const DEFAULT_CLASSIFICATION = {
  classification: 'OBLIGATIONS',
  categorie_globale: 'OBLIGATIONS',
  categorie_national: 'OBLIGATIONS Tunisie',
  categorie_regional: 'OBLIGATIONS Afrique du Nord',
};

function getClassification(categoryFr) {
  if (!categoryFr) return DEFAULT_CLASSIFICATION;
  const key = categoryFr.trim().toUpperCase();
  return CLASSIFICATION_MAP[key] || DEFAULT_CLASSIFICATION;
}

function normalizeNameForMatch(name) {
  return (name || '')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[''`’]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function detectStructure(name) {
  const upper = (name || '').toUpperCase();
  if (upper.includes('SICAV')) return 'SICAV';
  if (upper.includes('FCP')) return 'FCP';
  return null;
}

// ============================================================
// TAUX DE CHANGE
// ============================================================
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

// ============================================================
// CSV PARSER (semicolon-separated, UTF-8-SIG)
// ============================================================
function parseCSVLineSemicolon(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ';') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function readCSVSemicolon(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rawLines = content.split('\n');
  const lines = rawLines.filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.slice(1);
  const headers = parseCSVLineSemicolon(headerLine);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLineSemicolon(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (values[j] || '').trim();
    }
    rows.push(row);
  }
  return rows;
}

// ============================================================
// SIMILARITY (Dice coefficient)
// ============================================================
function bigrams(str) {
  const s = str.toUpperCase();
  const result = new Set();
  for (let i = 0; i < s.length - 1; i++) {
    result.add(s.slice(i, i + 2));
  }
  return result;
}

function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const biA = bigrams(a);
  const biB = bigrams(b);
  let intersection = 0;
  for (const bg of biA) {
    if (biB.has(bg)) intersection++;
  }
  return (2 * intersection) / (biA.size + biB.size);
}

// ============================================================
// MAIN
// ============================================================
async function run() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const force = args.includes('--force');

  console.log(`=== Import VL Tunisie CMF V1.8.3 ===`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN (simulation)' : 'EXECUTE' + (force ? ' + FORCE (upsert)' : '')}`);
  console.log(`Répertoire données: ${DATA_DIR}\n`);

  // Verify files exist
  const vlFile = path.join(DATA_DIR, 'CMF_TUNISIE_V183_VL_MASTER_PERIODICITE_COMPLETEE.csv');
  const divFile = path.join(DATA_DIR, 'CMF_TUNISIE_V183_DIVIDENDES.csv');
  const refFile = path.join(DATA_DIR, 'CMF_TUNISIE_V183_REFERENTIEL_FONDS_PERIODICITE_COMPLETEE.csv');

  for (const f of [vlFile, divFile, refFile]) {
    if (!fs.existsSync(f)) {
      console.error(`ERREUR: Fichier introuvable: ${f}`);
      process.exit(1);
    }
  }

  // ========== 1. READ REFERENTIEL ==========
  console.log('1. Lecture du référentiel fonds CMF...');
  const refRows = readCSVSemicolon(refFile);
  console.log(`   ${refRows.length} fonds dans le référentiel CMF`);

  // ========== 2. READ DIVIDENDS ==========
  console.log('2. Lecture des dividendes...');
  const divRows = readCSVSemicolon(divFile);
  // Build a map: fund_key + date_dividende → montant
  const dividendeMap = new Map();
  let validDivCount = 0;
  for (const d of divRows) {
    const dateDiv = d['DATE_DIVIDENDE_SOURCE'];
    if (!dateDiv || dateDiv < '2000-01-01' || dateDiv > '2027-01-01') continue;
    const key = `${d['NOM_CANONIQUE_KEY_V17C']}|||${dateDiv}`;
    const montant = parseFloat(d['MONTANT_DIVIDENDE_SOURCE']) || 0;
    if (montant > 0) {
      if (!dividendeMap.has(key)) {
        dividendeMap.set(key, montant);
      } else {
        dividendeMap.set(key, dividendeMap.get(key) + montant);
      }
      validDivCount++;
    }
  }
  console.log(`   ${validDivCount} dividendes valides chargés (${dividendeMap.size} entrées uniques)\n`);

  // Also build: fund_key → set of dividend dates (for enriching VL rows)
  const fundDividendDates = new Map();
  for (const d of divRows) {
    const dateDiv = d['DATE_DIVIDENDE_SOURCE'];
    const dateCot = d['DATE_COTATION'];
    if (!dateDiv || dateDiv < '2000-01-01' || dateDiv > '2027-01-01') continue;
    const fundKey = d['NOM_CANONIQUE_KEY_V17C'];
    const montant = parseFloat(d['MONTANT_DIVIDENDE_SOURCE']) || 0;
    if (montant > 0 && dateCot) {
      // Store: for this fund on dateCot, there was a dividend
      const vlKey = `${fundKey}|||${dateCot}`;
      if (!fundDividendDates.has(vlKey)) {
        fundDividendDates.set(vlKey, montant);
      } else {
        fundDividendDates.set(vlKey, fundDividendDates.get(vlKey) + montant);
      }
    }
  }

  // ========== 3. READ VL MASTER ==========
  console.log('3. Lecture des VL (fichier principal, ~347k lignes)...');
  const vlRows = readCSVSemicolon(vlFile);
  console.log(`   ${vlRows.length} VL lues`);

  // Group by fund
  const fondsVL = new Map();
  let rejected = 0;
  for (const row of vlRows) {
    const fundKey = row['NOM_CANONIQUE_KEY_V17C'];
    const date = row['DATE_COTATION'];
    const vl = parseFloat(row['VL']);
    if (!fundKey || !date || !vl || vl <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      rejected++;
      continue;
    }
    if (!fondsVL.has(fundKey)) {
      fondsVL.set(fundKey, {
        key: fundKey,
        name: row['NOM_CANONIQUE_V17C'] || fundKey,
        sgp: row['SOCIETE_GESTION_FINALE'] || '',
        cat: row['CATEGORIE_FINALE'] || '',
        periodicite: row['PERIODICITE_FINALE'] || '',
        affectation: row['AFFECTATION_FINALE'] || '',
        structure: row['FORME_JURIDIQUE_FINALE'] || '',
        isin: row['CODE_ISIN_FINAL'] || '',
        dateOuverture: row['DATE_OUVERTURE_FINALE'] || null,
        vls: new Map(),
      });
    }
    const fond = fondsVL.get(fundKey);
    // Keep only one VL per date (latest read wins)
    fond.vls.set(date, {
      date,
      vl,
      vlAnt: parseFloat(row['VL_ANTERIEURE']) || null,
    });
  }
  console.log(`   ${fondsVL.size} fonds distincts, ${rejected} lignes rejetées\n`);

  // ========== 4. CONNECT TO DB ==========
  console.log('4. Connexion à la base de données...');
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('   Connecté à fund_opcvm\n');

  // ========== 5. LOAD EXCHANGE RATES ==========
  console.log('5. Chargement des taux de change EUR/TND et USD/TND...');
  const [ratesRows] = await conn.execute(
    `SELECT paire, date, value FROM devisedechanges WHERE paire IN ('EUR/TND', 'USD/TND') ORDER BY date`
  );
  const eurTndIndex = buildRateIndex(ratesRows, 'EUR/TND');
  const usdTndIndex = buildRateIndex(ratesRows, 'USD/TND');
  console.log(`   EUR/TND: ${eurTndIndex.dates.length} jours`);
  console.log(`   USD/TND: ${usdTndIndex.dates.length} jours\n`);

  // ========== 6. LOAD EXISTING TUNISIA FUNDS ==========
  console.log('6. Chargement des fonds Tunisie existants...');
  const [existingFunds] = await conn.execute(
    `SELECT id, nom_fond, code_ISIN, societe_gestion, classification, categorie_globale,
            categorie_national, categorie_regional, periodicite, affectation, structure_fond,
            date_premiere_vl, datejour
     FROM fond_investissements WHERE pays = ?`, [PAYS]
  );
  console.log(`   ${existingFunds.length} fonds Tunisie en base\n`);

  // Build matching index
  const prodByNorm = new Map();
  const prodById = new Map();
  for (const f of existingFunds) {
    const norm = normalizeNameForMatch(f.nom_fond);
    prodByNorm.set(norm, f);
    prodById.set(f.id, f);
  }

  // ========== 7. MATCH CMF FUNDS → PRODUCTION ==========
  console.log('7. Matching fonds CMF → production...');
  const matching = new Map(); // cmfKey → { prodId, prodName, method }
  const toCreate = []; // funds to create

  for (const [cmfKey, cmfFond] of fondsVL) {
    const cmfNorm = normalizeNameForMatch(cmfFond.name);

    // Exact match
    if (prodByNorm.has(cmfNorm)) {
      const prod = prodByNorm.get(cmfNorm);
      matching.set(cmfKey, { prodId: prod.id, prodName: prod.nom_fond, method: 'EXACT' });
      continue;
    }

    // Partial match (one contains the other)
    let found = false;
    for (const [pNorm, pFond] of prodByNorm) {
      if (cmfNorm.includes(pNorm) || pNorm.includes(cmfNorm)) {
        matching.set(cmfKey, { prodId: pFond.id, prodName: pFond.nom_fond, method: 'PARTIAL' });
        found = true;
        break;
      }
    }
    if (found) continue;

    // Fuzzy match (similarity >= 0.85)
    let bestScore = 0;
    let bestProd = null;
    for (const [pNorm, pFond] of prodByNorm) {
      const score = similarity(cmfNorm, pNorm);
      if (score > bestScore) {
        bestScore = score;
        bestProd = pFond;
      }
    }
    if (bestScore >= 0.85) {
      matching.set(cmfKey, { prodId: bestProd.id, prodName: bestProd.nom_fond, method: `FUZZY(${(bestScore*100).toFixed(0)}%)` });
      continue;
    }

    // No match → check if active fund to create
    const lastDate = Math.max(...[...cmfFond.vls.keys()].map(d => new Date(d).getTime()));
    const lastDateStr = new Date(lastDate).toISOString().split('T')[0];
    if (lastDateStr >= '2025-01-01') {
      toCreate.push(cmfFond);
    } else {
      // Inactive fund, skip
      matching.set(cmfKey, null);
    }
  }

  const matchedCount = [...matching.values()].filter(v => v !== null).length;
  const skippedCount = [...matching.values()].filter(v => v === null).length;
  console.log(`   Matchés: ${matchedCount}`);
  console.log(`   À créer (actifs non matchés): ${toCreate.length}`);
  console.log(`   Ignorés (inactifs non matchés): ${skippedCount}\n`);

  // Print matching details
  console.log('   --- Détail matching ---');
  const methods = {};
  for (const [k, v] of matching) {
    if (!v) continue;
    const m = v.method.startsWith('FUZZY') ? 'FUZZY' : v.method;
    methods[m] = (methods[m] || 0) + 1;
  }
  for (const [m, c] of Object.entries(methods)) {
    console.log(`   ${m}: ${c}`);
  }

  // Print funds to create
  if (toCreate.length > 0) {
    console.log(`\n   --- Fonds à créer ---`);
    for (const f of toCreate) {
      console.log(`   + ${f.name} | ${f.cat} | SGP: ${f.sgp} | VLs: ${f.vls.size}`);
    }
  }
  console.log('');

  if (dryRun) {
    // Print sample VLs
    console.log('=== MODE DRY-RUN: aucune modification en base ===\n');
    console.log('Exemples de VL à importer:');
    let count = 0;
    for (const [cmfKey, cmfFond] of fondsVL) {
      const m = matching.get(cmfKey);
      if (!m) continue;
      const vlsArr = [...cmfFond.vls.values()].sort((a, b) => a.date.localeCompare(b.date));
      if (count < 3) {
        console.log(`  ${cmfFond.name} (→ id:${m.prodId}) : ${vlsArr.length} VLs [${vlsArr[0].date} → ${vlsArr[vlsArr.length-1].date}]`);
      }
      count++;
    }
    console.log(`\nTotal: ${[...fondsVL.values()].reduce((s, f) => s + f.vls.size, 0)} VLs à importer pour ${matchedCount + toCreate.length} fonds`);
    await conn.end();
    return;
  }

  // ========== 8. CREATE NEW FUNDS ==========
  if (toCreate.length > 0) {
    console.log('8. Création des nouveaux fonds...');
    for (const cmfFond of toCreate) {
      const classInfo = getClassification(cmfFond.cat);
      const structure = detectStructure(cmfFond.name) || cmfFond.structure || null;
      const vlsArr = [...cmfFond.vls.values()].sort((a, b) => a.date.localeCompare(b.date));
      const firstVL = vlsArr[0];
      const lastVL = vlsArr[vlsArr.length - 1];

      const [result] = await conn.execute(
        `INSERT INTO fond_investissements
         (nom_fond, pays, region, dev_libelle, societe_gestion, classification,
          categorie_globale, categorie_national, categorie_regional, categorie_libelle,
          periodicite, affectation, structure_fond, code_ISIN, regulateur,
          date_premiere_vl, montant_premier_vl, datejour, active, date_creation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          cmfFond.name,
          PAYS,
          REGION,
          DEVISE,
          cmfFond.sgp || null,
          classInfo.classification,
          classInfo.categorie_globale,
          classInfo.categorie_national,
          classInfo.categorie_regional,
          classInfo.classification,
          cmfFond.periodicite || 'QUOTIDIENNE',
          cmfFond.affectation || null,
          structure,
          cmfFond.isin || null,
          REGULATEUR,
          firstVL.date,
          firstVL.vl,
          lastVL.date,
          cmfFond.dateOuverture || firstVL.date,
        ]
      );
      const newId = result.insertId;
      matching.set(cmfFond.key, { prodId: newId, prodName: cmfFond.name, method: 'CREATED' });
      console.log(`   + Créé id:${newId} | ${cmfFond.name}`);
    }
    console.log('');
  }

  // ========== 9. IMPORT VLs ==========
  console.log(`${toCreate.length > 0 ? '9' : '8'}. Import des VL...`);

  let insertedVL = 0;
  let updatedVL = 0;
  let skippedVL = 0;
  let noRateVL = 0;
  const BATCH_SIZE = 200;

  // Load indice_benchmark for Tunisia funds to use as ID_indice
  const [benchRows] = await conn.execute(
    `SELECT id, indice_benchmark FROM fond_investissements WHERE pays = ?`, [PAYS]
  );
  const benchMap = new Map();
  for (const r of benchRows) benchMap.set(r.id, r.indice_benchmark || 'Tunindex');

  // Pre-load existing VL dates for all Tunisia funds
  console.log('   Chargement des VL existantes pour éviter les doublons...');
  const allTunisiaFundIds = [...matching.values()].filter(v => v !== null).map(v => v.prodId);
  const existingDatesMap = new Set();
  if (allTunisiaFundIds.length > 0) {
    const placeholders = allTunisiaFundIds.map(() => '?').join(',');
    const [existingVLs] = await conn.execute(
      `SELECT fund_id, date FROM valorisations WHERE fund_id IN (${placeholders})`,
      allTunisiaFundIds
    );
    for (const row of existingVLs) {
      const d = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];
      existingDatesMap.add(`${row.fund_id}|||${d}`);
    }
    console.log(`   ${existingDatesMap.size} VL existantes en base\n`);
  }

  for (const [cmfKey, cmfFond] of fondsVL) {
    const m = matching.get(cmfKey);
    if (!m) continue;

    const fundId = m.prodId;
    const fundName = cmfFond.name;
    const indiceName = benchMap.get(fundId) || 'Tunindex';
    const vlsArr = [...cmfFond.vls.values()].sort((a, b) => a.date.localeCompare(b.date));

    // Batch insert
    let batch = [];
    for (const vlEntry of vlsArr) {
      const eurRate = getRate(eurTndIndex, vlEntry.date);
      const usdRate = getRate(usdTndIndex, vlEntry.date);

      if (!eurRate || !usdRate) {
        noRateVL++;
        continue;
      }

      const valueEUR = vlEntry.vl / eurRate;
      const valueUSD = vlEntry.vl / usdRate;

      // Check if dividend on this date
      const divKey = `${cmfKey}|||${vlEntry.date}`;
      const dividende = fundDividendDates.get(divKey) || 0;
      const dividendeEUR = dividende > 0 ? dividende / eurRate : 0;
      const dividendeUSD = dividende > 0 ? dividende / usdRate : 0;

      batch.push([
        fundId,
        fundName,
        vlEntry.vl,
        valueUSD,
        valueEUR,
        dividende,
        dividendeEUR,
        dividendeUSD,
        vlEntry.vl, // vl_ajuste (recalculé ensuite par le script dédié)
        valueEUR,   // vl_ajuste_EUR
        valueUSD,   // vl_ajuste_USD
        indiceName,
        0,          // base_100
        0,          // base_100_InRef
        0,          // tsr
        0,          // tra
        0,          // indRef
        0,          // indRef_EUR
        0,          // indRef_USD
        0,          // indice_comparaison
        0,          // actif_net
        0,          // actif_net_USD
        0,          // actif_net_EUR
        fundName,   // libelle_fond
        0,          // souscription
        indiceName, // ID_indice
        0,          // rachat
        vlEntry.date,
      ]);

      if (batch.length >= BATCH_SIZE) {
        const result = await insertBatch(conn, batch, force, existingDatesMap);
        insertedVL += result.inserted;
        updatedVL += result.updated;
        skippedVL += result.skipped;
        batch = [];
      }
    }

    // Flush remaining
    if (batch.length > 0) {
      const result = await insertBatch(conn, batch, force, existingDatesMap);
      insertedVL += result.inserted;
      updatedVL += result.updated;
      skippedVL += result.skipped;
    }
  }

  console.log(`   VL insérées: ${insertedVL}`);
  console.log(`   VL mises à jour: ${updatedVL}`);
  console.log(`   VL déjà existantes (ignorées): ${skippedVL}`);
  console.log(`   VL sans taux de change: ${noRateVL}\n`);

  // ========== 10. UPDATE FUND METADATA ==========
  console.log('10. Mise à jour des métadonnées fonds (datejour, date_premiere_vl)...');
  let updatedMeta = 0;
  for (const [cmfKey, m] of matching) {
    if (!m) continue;
    const [rows] = await conn.execute(
      `SELECT MIN(date) as min_date, MAX(date) as max_date,
              (SELECT value FROM valorisations WHERE fund_id = ? ORDER BY date ASC LIMIT 1) as first_vl
       FROM valorisations WHERE fund_id = ?`,
      [m.prodId, m.prodId]
    );
    if (rows[0] && rows[0].min_date) {
      await conn.execute(
        `UPDATE fond_investissements SET datejour = ?, date_premiere_vl = ?, montant_premier_vl = ?
         WHERE id = ? AND (datejour IS NULL OR datejour < ? OR date_premiere_vl IS NULL OR date_premiere_vl > ?)`,
        [rows[0].max_date, rows[0].min_date, rows[0].first_vl, m.prodId, rows[0].max_date, rows[0].min_date]
      );
      updatedMeta++;
    }
  }
  console.log(`   ${updatedMeta} fonds mis à jour\n`);

  // ========== SUMMARY ==========
  console.log('=== RÉSUMÉ ===');
  console.log(`Fonds matchés: ${matchedCount}`);
  console.log(`Fonds créés: ${toCreate.length}`);
  console.log(`VL insérées: ${insertedVL}`);
  console.log(`VL mises à jour: ${updatedVL}`);
  console.log(`VL ignorées (doublons): ${skippedVL}`);
  console.log(`VL sans taux: ${noRateVL}`);
  console.log(`Métadonnées mises à jour: ${updatedMeta}`);

  await conn.end();
  console.log('\nTerminé.');
}

async function insertBatch(conn, batch, force, existingDatesMap) {
  let inserted = 0, updated = 0, skipped = 0;

  for (const row of batch) {
    const fundId = row[0];
    const date = row[27]; // last element is date
    const existingKey = `${fundId}|||${date}`;

    if (existingDatesMap.has(existingKey)) {
      if (force) {
        // Update existing row
        await conn.execute(
          `UPDATE valorisations SET value = ?, value_USD = ?, value_EUR = ?,
           dividende = ?, dividende_EUR = ?, dividende_USD = ?
           WHERE fund_id = ? AND date = ? LIMIT 1`,
          [row[2], row[3], row[4], row[5], row[6], row[7], fundId, date]
        );
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Insert new
      await conn.execute(
        `INSERT INTO valorisations
          (fund_id, fund_name, value, value_USD, value_EUR, dividende, dividende_EUR, dividende_USD,
           vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD, indice_name, base_100, base_100_InRef, tsr, tra,
           indRef, indRef_EUR, indRef_USD, indice_comparaison, actif_net, actif_net_USD, actif_net_EUR,
           libelle_fond, souscription, ID_indice, rachat, date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        row
      );
      existingDatesMap.add(existingKey);
      inserted++;
    }
  }

  return { inserted, updated, skipped };
}

run().catch(e => { console.error('ERREUR:', e); process.exit(1); });
