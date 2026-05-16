/**
 * Scrape & Import VL Maroc directement depuis l'API ASFIM
 *
 * Source: https://fundshare.asfim.ma/api/performances/export/?date=YYYY-MM-DD
 * L'API retourne un fichier XLSX pour chaque jour ouvrable.
 *
 * Ce script:
 *   1. Genere toutes les dates ouvrables entre DATE_DEBUT et aujourd'hui
 *   2. Telecharge le XLSX pour chaque date depuis l'API ASFIM
 *   3. Parse le fichier et insere VL + AN directement dans la base
 *   4. Non-destructif: INSERT IGNORE (ne duplique jamais)
 *
 * Usage:
 *   node scrape_asfim_import.js                    # depuis 2013-01-01
 *   node scrape_asfim_import.js 2024-10-01         # depuis une date specifique
 *   node scrape_asfim_import.js 2024-10-01 2026-03-12  # plage specifique
 *
 * Comportement NON-DESTRUCTIF:
 *   - Si un fonds existe deja: on le garde, on met a jour les champs vides seulement
 *   - Si une VL existe deja pour une date: INSERT IGNORE, on ne l'ecrase pas
 *   - Nouveaux fonds crees avec active=1, pays=MAROC, dev_libelle=MAD, regulateur=AMMC
 *   - Conversion MAD->EUR et MAD->USD avec taux du jour depuis devisedechanges
 */

const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const https = require('https');
const http = require('http');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const API_URL = 'https://fundshare.asfim.ma/api/performances/export/?date=';
const DELAY_MS = 500;
const PAYS = 'MAROC';
const DEVISE = 'MAD';
const REGULATEUR = 'AMMC';

const CLASSIFICATION_MAP = {
  'MONÉTAIRE': 'Monetaire',
  'MONETAIRE': 'Monetaire',
  'OMLT': 'Obligataire',
  'OCT': 'Obligataire',
  'OBLIGATIONS': 'Obligataire',
  'ACTIONS': 'Actions',
  'DIVERSIFIÉ': 'Diversifie',
  'DIVERSIFIE': 'Diversifie',
  'CONTRACTUEL': 'Diversifie',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadXlsx(dateStr) {
  return new Promise((resolve, reject) => {
    const url = API_URL + dateStr;
    const proto = url.startsWith('https') ? https : http;

    const req = proto.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://asfim.ma/publications/tableaux-des-performances/',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*',
      }
    }, (res) => {
      if (res.statusCode === 404 || res.statusCode === 204) {
        resolve(null);
        return;
      }
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 500) { resolve(null); return; }
        // Check PK magic bytes (ZIP/XLSX)
        if (buf[0] !== 0x50 || buf[1] !== 0x4B) { resolve(null); return; }
        resolve(buf);
      });
      res.on('error', () => resolve(null));
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function parseAsfimXlsx(buffer, dateStr) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (data.length <= 1) return [];

  const titleCol = Object.keys(data[0])[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const isin = String(row[titleCol] || '').trim();
    const nom = String(row['__EMPTY_1'] || '').trim();
    const societe = String(row['__EMPTY_2'] || '').trim();
    const nature = String(row['__EMPTY_3'] || '').trim();
    const classification = String(row['__EMPTY_4'] || '').trim();
    const periodicite = String(row['__EMPTY_7'] || '').trim();
    const depositaire = String(row['__EMPTY_13'] || '').trim();
    const an = parseFloat(row['__EMPTY_15']);
    const vl = parseFloat(row['__EMPTY_16']);

    if (!nom || isNaN(vl) || vl <= 0) continue;
    if (!isin.startsWith('MA')) continue;

    rows.push({
      isin, nom, societe, nature, classification, periodicite,
      depositaire, an: isNaN(an) ? 0 : an, vl, date: dateStr,
    });
  }

  return rows;
}

function allWeekdays(startStr, endStr) {
  const dates = [];
  const start = new Date(startStr + 'T00:00:00Z');
  const end = new Date(endStr + 'T00:00:00Z');
  const cur = new Date(start);

  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow >= 1 && dow <= 5) {
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const d = String(cur.getUTCDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

async function run() {
  const startDate = process.argv[2] || '2013-01-01';
  const endDate = process.argv[3] || new Date().toISOString().split('T')[0];

  console.log(`ASFIM Scrape & Import`);
  console.log(`Periode: ${startDate} -> ${endDate}`);
  console.log(`API: ${API_URL}YYYY-MM-DD\n`);

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');

  // Charger taux de change
  const [fxRows] = await conn.execute(
    `SELECT paire, date, value FROM devisedechanges
     WHERE paire IN ('EUR/MAD', 'USD/MAD') AND value > 0 ORDER BY date`
  );
  const fxEurMad = {};
  const fxUsdMad = {};
  for (const r of fxRows) {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
    if (r.paire === 'EUR/MAD') fxEurMad[d] = r.value;
    if (r.paire === 'USD/MAD') fxUsdMad[d] = r.value;
  }
  const fxEurDates = Object.keys(fxEurMad).sort();
  const fxUsdDates = Object.keys(fxUsdMad).sort();
  console.log(`Forex: EUR/MAD ${fxEurDates.length} dates, USD/MAD ${fxUsdDates.length} dates`);

  function getRate(fxMap, fxDates, date) {
    if (fxMap[date]) return fxMap[date];
    let lo = 0, hi = fxDates.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (fxDates[mid] <= date) lo = mid + 1;
      else hi = mid - 1;
    }
    if (hi >= 0) return fxMap[fxDates[hi]];
    if (fxDates.length > 0) return fxMap[fxDates[0]];
    return null;
  }

  // Charger fonds existants
  const [existingFonds] = await conn.execute(
    `SELECT id, nom_fond, code_ISIN, societe_gestion FROM fond_investissements WHERE pays = 'MAROC'`
  );
  const fondByIsin = {};
  const fondByName = {};
  for (const f of existingFonds) {
    if (f.code_ISIN) fondByIsin[f.code_ISIN.trim()] = f;
    if (f.nom_fond) fondByName[f.nom_fond.trim().toUpperCase()] = f;
  }
  console.log(`${existingFonds.length} fonds MAROC existants`);

  // Charger societes
  const [societes] = await conn.execute(`SELECT id, nom FROM societes`);
  const societeByName = {};
  for (const s of societes) {
    if (s.nom) societeByName[s.nom.trim().toUpperCase()] = s.id;
  }

  // Charger VL existantes
  console.log('Chargement des VL existantes...');
  const [existingVl] = await conn.execute(
    `SELECT fund_id, date FROM valorisations
     WHERE fund_id IN (SELECT id FROM fond_investissements WHERE pays = 'MAROC')
       AND value > 0`
  );
  const existingVlSet = new Set();
  for (const r of existingVl) {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
    existingVlSet.add(`${r.fund_id}|${d}`);
  }
  console.log(`${existingVlSet.size} VL existantes\n`);

  const weekdays = allWeekdays(startDate, endDate);
  console.log(`${weekdays.length} jours ouvrables a traiter\n`);

  const report = {
    datesScraped: 0,
    datesWithData: 0,
    datesEmpty: 0,
    datesError: 0,
    vlInserted: 0,
    vlSkipped: 0,
    fondsCreated: 0,
    errors: [],
  };

  for (let i = 0; i < weekdays.length; i++) {
    const dateStr = weekdays[i];

    // Download
    let buffer;
    let retries = 0;
    while (retries < 3) {
      buffer = await downloadXlsx(dateStr);
      if (buffer !== undefined) break;
      retries++;
      await sleep(2000 * retries);
    }

    report.datesScraped++;

    if (!buffer) {
      report.datesEmpty++;
      if ((i + 1) % 100 === 0) {
        console.log(`  [${i + 1}/${weekdays.length}] ${dateStr} - ${report.datesWithData} dates avec data, ${report.vlInserted} VL inserees`);
      }
      await sleep(DELAY_MS);
      continue;
    }

    // Parse
    let rows;
    try {
      rows = parseAsfimXlsx(buffer, dateStr);
    } catch (e) {
      report.datesError++;
      report.errors.push(`Parse ${dateStr}: ${e.message}`);
      await sleep(DELAY_MS);
      continue;
    }

    if (rows.length === 0) {
      report.datesEmpty++;
      await sleep(DELAY_MS);
      continue;
    }

    report.datesWithData++;

    const eurMadRate = getRate(fxEurMad, fxEurDates, dateStr) || 10.85;
    const usdMadRate = getRate(fxUsdMad, fxUsdDates, dateStr) || 9.95;

    const vlBatch = [];
    let dateSkipped = 0;

    for (const row of rows) {
      // Find or create fund
      let fund = fondByIsin[row.isin] || fondByName[row.nom.toUpperCase()];

      if (!fund) {
        const catGlob = CLASSIFICATION_MAP[row.classification.toUpperCase()] || 'Diversifie';
        const socId = societeByName[row.societe.toUpperCase()] || null;

        try {
          const [result] = await conn.execute(
            `INSERT INTO fond_investissements
             (nom_fond, code_ISIN, pays, dev_libelle, regulateur, active,
              societe_gestion, societe_id, structure_fond, classification,
              categorie_globale, categorie_libelle, categorie_regional, categorie_national, periodicite)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.nom, row.isin, PAYS, DEVISE, REGULATEUR,
             row.societe, socId, row.nature || null, row.classification || null,
             catGlob, catGlob, 'Afrique du Nord', catGlob + ' ' + PAYS,
             row.periodicite || null]
          );
          fund = { id: result.insertId, nom_fond: row.nom, code_ISIN: row.isin };
          fondByIsin[row.isin] = fund;
          fondByName[row.nom.toUpperCase()] = fund;
          report.fondsCreated++;
        } catch (e) {
          if (!e.message.includes('Duplicate')) {
            report.errors.push(`Create "${row.nom}": ${e.message}`);
          }
          continue;
        }
      }

      const vlKey = `${fund.id}|${dateStr}`;
      if (existingVlSet.has(vlKey)) {
        dateSkipped++;
        continue;
      }

      const valueEur = row.vl / eurMadRate;
      const valueUsd = row.vl / usdMadRate;
      const actifNetEur = row.an > 0 ? row.an / eurMadRate : 0;
      const actifNetUsd = row.an > 0 ? row.an / usdMadRate : 0;

      vlBatch.push([fund.id, dateStr, row.vl, row.an, valueEur, valueUsd, valueEur, valueUsd, actifNetEur, actifNetUsd]);
      existingVlSet.add(vlKey);
    }

    report.vlSkipped += dateSkipped;

    // Batch insert
    if (vlBatch.length > 0) {
      const BATCH_SIZE = 200;
      for (let b = 0; b < vlBatch.length; b += BATCH_SIZE) {
        const chunk = vlBatch.slice(b, b + BATCH_SIZE);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        try {
          const [result] = await conn.execute(
            `INSERT IGNORE INTO valorisations
             (fund_id, date, value, actif_net, value_EUR, value_USD, vl_ajuste_EUR, vl_ajuste_USD, actif_net_EUR, actif_net_USD)
             VALUES ${placeholders}`,
            chunk.flat()
          );
          report.vlInserted += result.affectedRows;
        } catch (e) {
          for (const r of chunk) {
            try {
              await conn.execute(
                `INSERT IGNORE INTO valorisations
                 (fund_id, date, value, actif_net, value_EUR, value_USD, vl_ajuste_EUR, vl_ajuste_USD, actif_net_EUR, actif_net_USD)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, r
              );
              report.vlInserted++;
            } catch (e2) {
              report.errors.push(`VL ${r[0]} ${r[1]}: ${e2.message}`);
            }
          }
        }
      }
    }

    if ((i + 1) % 50 === 0 || i === weekdays.length - 1) {
      console.log(`  [${i + 1}/${weekdays.length}] ${dateStr} - ${rows.length} fonds, ${vlBatch.length} inseres, ${dateSkipped} existants`);
    }

    await sleep(DELAY_MS);
  }

  // Mise a jour datejour + date_premiere_vl
  console.log('\nMise a jour datejour + date_premiere_vl...');
  await conn.execute(`
    UPDATE fond_investissements f SET
      datejour = (SELECT MAX(date) FROM valorisations WHERE fund_id = f.id AND value > 0),
      date_premiere_vl = (SELECT MIN(date) FROM valorisations WHERE fund_id = f.id AND value > 0),
      montant_premier_vl = (SELECT value FROM valorisations WHERE fund_id = f.id AND value > 0 ORDER BY date LIMIT 1)
    WHERE pays = 'MAROC' AND active = 1
  `);

  // ============================================================
  // RAPPORT
  // ============================================================
  console.log('\n==========================================');
  console.log('=== RAPPORT SCRAPE & IMPORT ASFIM ===');
  console.log('==========================================');
  console.log(`Dates scrapees:       ${report.datesScraped}`);
  console.log(`Dates avec donnees:   ${report.datesWithData}`);
  console.log(`Dates vides/feries:   ${report.datesEmpty}`);
  console.log(`Dates en erreur:      ${report.datesError}`);
  console.log(`VL inserees:          ${report.vlInserted}`);
  console.log(`VL deja existantes:   ${report.vlSkipped}`);
  console.log(`Fonds crees:          ${report.fondsCreated}`);
  console.log(`Erreurs:              ${report.errors.length}`);
  if (report.errors.length > 0) {
    console.log('\nPremieres erreurs (max 10):');
    report.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  }

  // Verification
  const [verif] = await conn.execute(`
    SELECT COUNT(*) as total_vl,
           COUNT(DISTINCT fund_id) as nb_fonds,
           MIN(date) as min_date,
           MAX(date) as max_date
    FROM valorisations v
    JOIN fond_investissements f ON v.fund_id = f.id
    WHERE f.pays = 'MAROC' AND v.value > 0
  `);
  const v = verif[0];
  console.log(`\nVerification finale MAROC:`);
  console.log(`  Total VL:  ${v.total_vl}`);
  console.log(`  Fonds:     ${v.nb_fonds}`);
  console.log(`  Periode:   ${v.min_date} -> ${v.max_date}`);

  await conn.end();
  console.log('\nTermine.');
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
