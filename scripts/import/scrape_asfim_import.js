/**
 * Scrape & Import VL Maroc directement depuis l'API ASFIM
 *
 * Source: https://fundshare.asfim.ma/api/performances/export/?date=YYYY-MM-DD
 * L'API retourne un fichier XLSX pour chaque jour ouvrable.
 *
 * Structure ASFIM (28 colonnes, identique 2013-2026):
 *   Ligne 0: titre "Tableau des performances quotidiennes/hebdomadaires au DD-MM-YYYY"
 *   Ligne 1: headers (CODE ISIN, Code Maroclear, OPCVM, ...)
 *   Ligne 2+: donnees (1 ligne = 1 fonds) ou lignes vides a ignorer
 *
 *   col[0]  CODE ISIN           -> fond.code_ISIN
 *   col[1]  Code Maroclear      -> (reference interne)
 *   col[2]  OPCVM               -> fond.nom_fond, vl.fund_name
 *   col[3]  Societe de Gestion  -> fond.societe_gestion
 *   col[4]  Nature juridique    -> fond.structure_fond (SICAV/FCP)
 *   col[5]  Classification      -> fond.classification (MONETAIRE/OMLT/OCT/ACTIONS/DIVERSIFIE)
 *   col[6]  Sensibilite         -> fond.sensibilite
 *   col[7]  Indice Benchmark    -> fond.indice_benchmark
 *   col[8]  Periodicite VL      -> fond.periodicite (QUOTIDIENNE/HEBDOMADAIRE)
 *   col[9]  Souscripteurs       -> fond.souscripteur
 *   col[10] Affectation         -> fond.affectation
 *   col[11] Commission souscr.  -> fond.frais_souscription
 *   col[12] Commission rachat   -> fond.frais_rachat
 *   col[13] Frais de gestion    -> fond.frais_gestion
 *   col[14] Depositaire         -> fond.depositaire
 *   col[15] Reseau placeur      -> fond.reseau_placeur
 *   col[16] AN                  -> vl.actif_net
 *   col[17] VL                  -> vl.value
 *   col[18-27] Performances     -> (non importees, calculees par l'app)
 *
 * Usage:
 *   node scrape_asfim_import.js                    # depuis 2013-01-01
 *   node scrape_asfim_import.js 2024-10-01         # depuis une date specifique
 *   node scrape_asfim_import.js 2024-10-01 2026-03-12  # plage specifique
 *
 * NON-DESTRUCTIF: INSERT IGNORE, ne modifie jamais les donnees existantes
 */

const mysql = require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('mysql2/promise');
const XLSX = require('xlsx');
const https = require('https');
const http = require('http');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
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

// Indices de colonnes fixes dans les fichiers ASFIM (stables 2013-2026)
const COL = {
  ISIN: 0,
  MAROCLEAR: 1,
  OPCVM: 2,
  SOCIETE: 3,
  NATURE: 4,
  CLASSIFICATION: 5,
  SENSIBILITE: 6,
  BENCHMARK: 7,
  PERIODICITE: 8,
  SOUSCRIPTEURS: 9,
  AFFECTATION: 10,
  COMM_SOUSCRIPTION: 11,
  COMM_RACHAT: 12,
  FRAIS_GESTION: 13,
  DEPOSITAIRE: 14,
  RESEAU_PLACEUR: 15,
  AN: 16,
  VL: 17,
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadXlsx(dateStr) {
  return new Promise((resolve) => {
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
      if (res.statusCode !== 200) { resolve(null); return; }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        // Minimum 500 octets + magic PK (ZIP/XLSX)
        if (buf.length < 500 || buf[0] !== 0x50 || buf[1] !== 0x4B) { resolve(null); return; }
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
  // Lecture brute en tableau de tableaux (indices stables)
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (raw.length < 3) return [];

  // Trouver la ligne d'en-tete (contient "CODE ISIN" en col 0)
  let headerRow = -1;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    if (String(raw[i][0]).trim().toUpperCase() === 'CODE ISIN') {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) return [];

  const rows = [];

  for (let i = headerRow + 1; i < raw.length; i++) {
    const r = raw[i];
    const isin = String(r[COL.ISIN] || '').trim();
    // Filtrer: ISIN doit commencer par MA + 10 chiffres
    if (!isin.match(/^MA\d{10}/)) continue;

    const nom = String(r[COL.OPCVM] || '').trim();
    if (!nom) continue;

    const vl = parseFloat(r[COL.VL]);
    if (isNaN(vl) || vl <= 0) continue;

    const an = parseFloat(r[COL.AN]);
    const commSouscr = parseFloat(r[COL.COMM_SOUSCRIPTION]);
    const commRachat = parseFloat(r[COL.COMM_RACHAT]);
    const fraisGestion = parseFloat(r[COL.FRAIS_GESTION]);

    rows.push({
      isin,
      maroclear: String(r[COL.MAROCLEAR] || '').trim(),
      nom,
      societe: String(r[COL.SOCIETE] || '').trim(),
      nature: String(r[COL.NATURE] || '').trim(),
      classification: String(r[COL.CLASSIFICATION] || '').trim(),
      sensibilite: String(r[COL.SENSIBILITE] || '').trim(),
      benchmark: String(r[COL.BENCHMARK] || '').trim(),
      periodicite: String(r[COL.PERIODICITE] || '').trim(),
      souscripteurs: String(r[COL.SOUSCRIPTEURS] || '').trim(),
      affectation: String(r[COL.AFFECTATION] || '').trim(),
      frais_souscription: isNaN(commSouscr) ? null : commSouscr,
      frais_rachat: isNaN(commRachat) ? null : commRachat,
      frais_gestion: isNaN(fraisGestion) ? null : fraisGestion,
      depositaire: String(r[COL.DEPOSITAIRE] || '').trim(),
      reseau_placeur: String(r[COL.RESEAU_PLACEUR] || '').trim(),
      an: isNaN(an) ? 0 : an,
      vl,
      date: dateStr,
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

  // Charger fonds existants — index multi-criteres pour matching robuste
  const [existingFonds] = await conn.execute(
    `SELECT id, nom_fond, code_ISIN, code, societe_gestion FROM fond_investissements WHERE pays = 'MAROC'`
  );
  const fondByIsin = {};       // Priorite 1: CODE ISIN exact (MA0000030132)
  const fondByCode = {};       // Priorite 2: Code Maroclear (3013)
  const fondByName = {};       // Priorite 3: nom exact uppercase
  const fondByNormName = {};   // Priorite 4: nom normalise (sans accents/espaces)
  const fondByNameSoc = {};    // Priorite 5: nom + societe (desambiguation)

  function normalize(s) {
    return s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Z0-9]/g, '');
  }

  for (const f of existingFonds) {
    if (f.code_ISIN) fondByIsin[f.code_ISIN.trim()] = f;
    if (f.code) fondByCode[String(f.code).trim()] = f;
    if (f.nom_fond) {
      fondByName[f.nom_fond.trim().toUpperCase()] = f;
      fondByNormName[normalize(f.nom_fond)] = f;
      if (f.societe_gestion) {
        fondByNameSoc[f.nom_fond.trim().toUpperCase() + '|' + f.societe_gestion.trim().toUpperCase()] = f;
      }
    }
  }
  console.log(`${existingFonds.length} fonds MAROC existants (${Object.keys(fondByIsin).length} avec ISIN, ${Object.keys(fondByCode).length} avec code)`);

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
    fondsUpdated: 0,
    errors: [],
  };

  for (let i = 0; i < weekdays.length; i++) {
    const dateStr = weekdays[i];

    // Download avec retry
    let buffer = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      buffer = await downloadXlsx(dateStr);
      if (buffer !== null) break;
      if (attempt < 2) await sleep(2000 * (attempt + 1));
    }

    report.datesScraped++;

    if (!buffer) {
      report.datesEmpty++;
      if ((i + 1) % 100 === 0) {
        console.log(`  [${i + 1}/${weekdays.length}] ${dateStr} - ${report.datesWithData} dates OK, ${report.vlInserted} VL inserees`);
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
      // Matching multi-criteres (5 niveaux de priorite)
      let fund = fondByIsin[row.isin]                                          // 1. CODE ISIN exact
             || fondByCode[row.maroclear]                                      // 2. Code Maroclear
             || fondByName[row.nom.toUpperCase()]                              // 3. Nom exact
             || fondByNormName[normalize(row.nom)]                             // 4. Nom normalise (sans accents)
             || fondByNameSoc[row.nom.toUpperCase() + '|' + row.societe.toUpperCase()]; // 5. Nom + societe

      if (!fund) {
        const catGlob = CLASSIFICATION_MAP[row.classification.toUpperCase()] || 'Diversifie';
        const socId = societeByName[row.societe.toUpperCase()] || null;

        try {
          const [result] = await conn.execute(
            `INSERT INTO fond_investissements
             (nom_fond, code_ISIN, code, pays, dev_libelle, regulateur, active,
              societe_gestion, societe_id, structure_fond, classification,
              categorie_globale, categorie_libelle, categorie_regional, categorie_national,
              periodicite, sensibilite, indice_benchmark, souscripteur, affectation,
              frais_souscription, frais_rachat, frais_gestion, depositaire, reseau_placeur)
             VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.nom, row.isin, row.maroclear || null, PAYS, DEVISE, REGULATEUR,
             row.societe, socId, row.nature || null, row.classification || null,
             catGlob, catGlob, 'Afrique du Nord', catGlob + ' ' + PAYS,
             row.periodicite || null, row.sensibilite || null,
             row.benchmark || null, row.souscripteurs || null,
             row.affectation || null, row.frais_souscription,
             row.frais_rachat, row.frais_gestion,
             row.depositaire || null, row.reseau_placeur || null]
          );
          fund = { id: result.insertId, nom_fond: row.nom, code_ISIN: row.isin };
          fondByIsin[row.isin] = fund;
          if (row.maroclear) fondByCode[row.maroclear] = fund;
          fondByName[row.nom.toUpperCase()] = fund;
          fondByNormName[normalize(row.nom)] = fund;
          fondByNameSoc[row.nom.toUpperCase() + '|' + row.societe.toUpperCase()] = fund;
          report.fondsCreated++;
        } catch (e) {
          if (!e.message.includes('Duplicate')) {
            report.errors.push(`Create "${row.nom}": ${e.message}`);
          }
          continue;
        }
      } else {
        // Mettre a jour les champs vides du fonds existant (non-destructif)
        if (!fund._updated && row.isin) {
          await conn.execute(
            `UPDATE fond_investissements SET
               code_ISIN = COALESCE(NULLIF(code_ISIN, ''), ?),
               depositaire = COALESCE(NULLIF(depositaire, ''), ?),
               reseau_placeur = COALESCE(NULLIF(reseau_placeur, ''), ?),
               sensibilite = COALESCE(NULLIF(sensibilite, ''), ?),
               indice_benchmark = COALESCE(NULLIF(indice_benchmark, ''), ?),
               souscripteur = COALESCE(NULLIF(souscripteur, ''), ?),
               affectation = COALESCE(NULLIF(affectation, ''), ?),
               frais_souscription = COALESCE(frais_souscription, ?),
               frais_rachat = COALESCE(frais_rachat, ?),
               frais_gestion = COALESCE(frais_gestion, ?)
             WHERE id = ?`,
            [row.isin, row.depositaire || null, row.reseau_placeur || null,
             row.sensibilite || null, row.benchmark || null,
             row.souscripteurs || null, row.affectation || null,
             row.frais_souscription, row.frais_rachat, row.frais_gestion,
             fund.id]
          ).catch(() => {});
          fund._updated = true;
          report.fondsUpdated++;
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

      // fund_id, fund_name, date, value, actif_net, value_EUR, value_USD,
      // vl_ajuste_EUR, vl_ajuste_USD, actif_net_EUR, actif_net_USD
      vlBatch.push([fund.id, row.nom, dateStr, row.vl, row.an,
                     valueEur, valueUsd, valueEur, valueUsd, actifNetEur, actifNetUsd]);
      existingVlSet.add(vlKey);
    }

    report.vlSkipped += dateSkipped;

    // Batch insert
    if (vlBatch.length > 0) {
      const BATCH_SIZE = 200;
      for (let b = 0; b < vlBatch.length; b += BATCH_SIZE) {
        const chunk = vlBatch.slice(b, b + BATCH_SIZE);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        try {
          const [result] = await conn.execute(
            `INSERT IGNORE INTO valorisations
             (fund_id, fund_name, date, value, actif_net, value_EUR, value_USD,
              vl_ajuste_EUR, vl_ajuste_USD, actif_net_EUR, actif_net_USD)
             VALUES ${placeholders}`,
            chunk.flat()
          );
          report.vlInserted += result.affectedRows;
        } catch (e) {
          for (const r of chunk) {
            try {
              await conn.execute(
                `INSERT IGNORE INTO valorisations
                 (fund_id, fund_name, date, value, actif_net, value_EUR, value_USD,
                  vl_ajuste_EUR, vl_ajuste_USD, actif_net_EUR, actif_net_USD)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, r
              );
              report.vlInserted++;
            } catch (e2) {
              report.errors.push(`VL ${r[0]} ${r[2]}: ${e2.message}`);
            }
          }
        }
      }
    }

    if ((i + 1) % 50 === 0 || i === weekdays.length - 1) {
      console.log(`  [${i + 1}/${weekdays.length}] ${dateStr} - ${rows.length} fonds, +${vlBatch.length} VL, ${dateSkipped} existants (total: ${report.vlInserted})`);
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
  console.log(`Fonds mis a jour:     ${report.fondsUpdated}`);
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
