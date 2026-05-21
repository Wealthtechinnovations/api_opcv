/**
 * Import VL Nigeria depuis CSV extrait par sec_ng_nav_extractor_v6.py
 *
 * Source: CSV produit par le script Python (colonnes: valuation_date, fund_name_clean,
 *         fund_manager_clean, fund_category_fr, nav_value, vl_price, currency_code, etc.)
 *
 * Usage:
 *   node import_vl_nigeria_sec.js <fichier.csv>                    # import complet
 *   node import_vl_nigeria_sec.js <fichier.csv> --dry-run          # simulation
 *   node import_vl_nigeria_sec.js <fichier.csv> --skip-existing    # ne pas creer de nouveaux fonds
 *
 * Comportement SANS REGRESSION:
 *   - Si un fonds existe deja: on garde ses donnees, on ne met a jour QUE les champs vides
 *   - Si une VL existe deja pour une date: on la GARDE (INSERT IGNORE)
 *   - Nouveaux fonds crees avec active=1, pays=Nigeria, dev_libelle=NGN
 *   - Conversion EUR/USD avec taux QUOTIDIEN (getRate binary search, meme algo que recalc_eur_usd_daily_rate.js)
 *   - datejour, date_premiere_vl, montant_premier_vl mis a jour apres insertion
 *   - Matching fonds par nom normalise (fuzzy si pas de match exact)
 *
 * Dependances: mysql2, csv-parse (npm install csv-parse)
 */

const mysql = require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const PAYS = 'Nigeria';
const DEVISE = 'NGN';
const REGULATEUR = 'SEC Nigeria';

const CLASSIFICATION_MAP = {
  'ACTIONS':        { classification: 'ACTIONS',      categorie_globale: 'ACTIONS',      categorie_national: 'ACTIONS Nigeria',      categorie_regional: 'ACTIONS Nigeria' },
  'MONETAIRE':      { classification: 'MONETAIRE',    categorie_globale: 'MONETAIRE',    categorie_national: 'MONETAIRE Nigeria',    categorie_regional: 'MONETAIRE Nigeria' },
  'OBLIGATAIRE':    { classification: 'OBLIGATIONS',  categorie_globale: 'OBLIGATIONS',  categorie_national: 'OBLIGATIONS Nigeria',  categorie_regional: 'OBLIGATIONS Nigeria' },
  'DIVERSIFIE':     { classification: 'DIVERSIFIE',   categorie_globale: 'DIVERSIFIE',   categorie_national: 'DIVERSIFIE Nigeria',   categorie_regional: 'DIVERSIFIE Nigeria' },
  'IMMOBILIER':     { classification: 'IMMOBILIER',   categorie_globale: 'IMMOBILIER',   categorie_national: 'IMMOBILIER Nigeria',   categorie_regional: 'IMMOBILIER Nigeria' },
  'DOLLAR':         { classification: 'DOLLAR',       categorie_globale: 'DOLLAR',       categorie_national: 'DOLLAR Nigeria',       categorie_regional: 'DOLLAR Nigeria' },
  'ETHIQUE':        { classification: 'ETHIQUE',      categorie_globale: 'ETHIQUE',      categorie_national: 'ETHIQUE Nigeria',      categorie_regional: 'ETHIQUE Nigeria' },
  'CHARIA':         { classification: 'CHARIA',       categorie_globale: 'CHARIA',       categorie_national: 'CHARIA Nigeria',       categorie_regional: 'CHARIA Nigeria' },
  'SPECIALISE':     { classification: 'SPECIALISE',   categorie_globale: 'SPECIALISE',   categorie_national: 'SPECIALISE Nigeria',   categorie_regional: 'SPECIALISE Nigeria' },
  'INFRASTRUCTURE': { classification: 'INFRASTRUCTURE', categorie_globale: 'INFRASTRUCTURE', categorie_national: 'INFRASTRUCTURE Nigeria', categorie_regional: 'INFRASTRUCTURE Nigeria' },
  'ETF':            { classification: 'ETF',          categorie_globale: 'ETF',          categorie_national: 'ETF Nigeria',          categorie_regional: 'ETF Nigeria' },
};

const DEFAULT_CLASSIFICATION = {
  classification: 'AUTRE',
  categorie_globale: 'AUTRE',
  categorie_national: 'AUTRE Nigeria',
  categorie_regional: 'AUTRE Nigeria',
};

function getClassification(categoryFr) {
  if (!categoryFr) return DEFAULT_CLASSIFICATION;
  const key = categoryFr.trim().toUpperCase();
  return CLASSIFICATION_MAP[key] || DEFAULT_CLASSIFICATION;
}

function normalizeNameForMatch(name) {
  return (name || '')
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[''`]/g, '')
    .replace(/\bLIMITED\b/g, 'LTD')
    .replace(/\bPUBLIC LIMITED COMPANY\b/g, 'PLC')
    .replace(/\bP L C\b/g, 'PLC')
    .replace(/\bL T D\b/g, 'LTD')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function detectStructure(name) {
  const upper = (name || '').toUpperCase();
  if (upper.includes('MUTUAL FUND') || upper.includes('MF')) return 'Mutual Fund';
  if (upper.includes('ETF') || upper.includes('EXCHANGE TRADED')) return 'ETF';
  if (upper.includes('FUND')) return 'Fund';
  return 'Fund';
}

// ============================================================
// TAUX DE CHANGE (binary search, meme algo que recalc_eur_usd_daily_rate.js)
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
// CSV PARSER (sans dependance externe)
// ============================================================
function parseCSVLine(line) {
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
      } else if (ch === ',') {
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

function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rawLines = content.split('\n');
  const lines = rawLines.filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.slice(1);
  const headers = parseCSVLine(headerLine);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (values[j] || '').trim();
    }
    rows.push(row);
  }
  return rows;
}

// ============================================================
// SIMILARITY (Dice coefficient pour fuzzy matching)
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
  const dryRun = args.includes('--dry-run');
  const skipExisting = args.includes('--skip-existing');
  const csvPath = args.find(a => !a.startsWith('--'));

  if (!csvPath) {
    console.error('Usage: node import_vl_nigeria_sec.js <fichier.csv> [--dry-run] [--skip-existing]');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`Fichier introuvable: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Lecture de ${csvPath}...`);
  const allRows = readCSV(csvPath);
  console.log(`${allRows.length} lignes lues depuis le CSV`);

  // Filtrer: uniquement les lignes avec date + prix VL valide + bornes raisonnables
  const VL_MIN = 0.0001;
  const VL_MAX = 1000000;    // prix unitaire max 1M NGN (raisonnable)
  const NAV_MAX = 5e12;      // NAV total max 5 000 milliards NGN
  let rejectedBounds = 0;
  let rejectedMissing = 0;

  const validRows = allRows.filter(r => {
    if (!r.valuation_date || !/^\d{4}-\d{2}-\d{2}$/.test(r.valuation_date) || !r.fund_name_clean) {
      rejectedMissing++;
      return false;
    }
    const vl = parseFloat(r.vl_price);
    if (!vl || vl <= VL_MIN || vl > VL_MAX) {
      rejectedBounds++;
      return false;
    }
    const nav = parseFloat(r.nav_value) || parseFloat(r.nav_ngn) || 0;
    if (nav > NAV_MAX) {
      rejectedBounds++;
      return false;
    }
    return true;
  });
  console.log(`${validRows.length} lignes valides (avec date + prix + nom)`);
  if (rejectedMissing > 0) console.log(`  ${rejectedMissing} lignes rejetees (champs manquants)`);
  if (rejectedBounds > 0) console.log(`  ${rejectedBounds} lignes rejetees (VL hors bornes [${VL_MIN}-${VL_MAX}] ou NAV > ${NAV_MAX})`);

  // Grouper par fonds (fund_name_key + fund_manager_key)
  // Preference: CURRENT block > PREVIOUS block (fichiers 2018-2021 ont 2 blocs)
  const fondsMap = new Map();
  for (const row of validRows) {
    const fundKey = row.fund_name_key || normalizeNameForMatch(row.fund_name_clean);
    const managerKey = row.fund_manager_key || normalizeNameForMatch(row.fund_manager_clean || '');
    const compositeKey = `${fundKey}|||${managerKey}`;

    if (!fondsMap.has(compositeKey)) {
      fondsMap.set(compositeKey, {
        fund_name_clean: row.fund_name_clean,
        fund_name_key: fundKey,
        fund_manager_clean: row.fund_manager_clean || '',
        fund_manager_key: managerKey,
        category_fr: row.fund_category_fr || '',
        currency_code: row.currency_code || 'NGN',
        vls: new Map(),
      });
    }

    const fond = fondsMap.get(compositeKey);
    const date = row.valuation_date;
    const vlPrice = parseFloat(row.vl_price);
    const navValue = parseFloat(row.nav_value) || parseFloat(row.nav_ngn) || 0;
    const blockType = (row.block_type || row.previous_or_current_hint || '').toUpperCase();
    const isCurrent = blockType.includes('CURRENT');

    // Garder l'entree CURRENT si on a deja un PREVIOUS pour la meme date
    const existing = fond.vls.get(date);
    if (!existing || isCurrent || (!existing.isCurrent && vlPrice > 0)) {
      fond.vls.set(date, {
        date,
        vl: vlPrice,
        nav: navValue,
        currency: row.currency_code || 'NGN',
        isCurrent,
      });
    }
  }

  console.log(`${fondsMap.size} fonds distincts identifies`);
  if (dryRun) console.log('*** MODE DRY-RUN: aucune ecriture en base ***\n');

  // ============================================================
  // CONNEXION DB
  // ============================================================
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');

  // Charger tous les taux de change
  console.log('Chargement des taux de change...');
  const [fxRows] = await conn.execute(
    `SELECT paire, date, value FROM devisedechanges WHERE value > 0 ORDER BY date`
  );
  console.log(`  ${fxRows.length} entrees forex chargees`);

  const fxIndex = {};
  const paires = [...new Set(fxRows.map(r => r.paire))];
  for (const p of paires) {
    fxIndex[p] = buildRateIndex(fxRows, p);
  }

  const eurUsdIndex = fxIndex['EUR/USD'];
  const eurNgnIndex = fxIndex['EUR/NGN'];
  const usdNgnIndex = fxIndex['USD/NGN'];

  if (!eurNgnIndex || eurNgnIndex.dates.length === 0) {
    console.warn('ATTENTION: Pas de taux EUR/NGN en base ! Les valeurs EUR seront approximatives.');
  }
  if (!usdNgnIndex || usdNgnIndex.dates.length === 0) {
    console.warn('ATTENTION: Pas de taux USD/NGN en base ! Les valeurs USD seront approximatives.');
  }

  function convertToEUR(valueNGN, date, currency) {
    if (currency === 'EUR') return valueNGN;
    if (currency === 'USD') {
      const eurUsd = getRate(eurUsdIndex, date);
      return eurUsd ? valueNGN / eurUsd : null;
    }
    const eurNgn = getRate(eurNgnIndex, date);
    if (eurNgn && eurNgn > 0) return valueNGN / eurNgn;
    const usdNgn = getRate(usdNgnIndex, date);
    const eurUsd = getRate(eurUsdIndex, date);
    if (usdNgn && eurUsd && usdNgn > 0) return (valueNGN / usdNgn) / eurUsd;
    return null;
  }

  function convertToUSD(valueNGN, date, currency) {
    if (currency === 'USD') return valueNGN;
    if (currency === 'EUR') {
      const eurUsd = getRate(eurUsdIndex, date);
      return eurUsd ? valueNGN * eurUsd : null;
    }
    const usdNgn = getRate(usdNgnIndex, date);
    if (usdNgn && usdNgn > 0) return valueNGN / usdNgn;
    const eurNgn = getRate(eurNgnIndex, date);
    const eurUsd = getRate(eurUsdIndex, date);
    if (eurNgn && eurUsd && eurNgn > 0) return (valueNGN / eurNgn) * eurUsd;
    return null;
  }

  // Charger tous les fonds Nigeria existants en base
  const [existingFunds] = await conn.execute(
    `SELECT id, nom_fond, societe_gestion, pays, dev_libelle, classification,
            categorie_globale, categorie_national, categorie_regional,
            structure_fond, societe_id, regulateur
     FROM fond_investissements WHERE LOWER(pays) = 'nigeria'`
  );

  // Normaliser le pays pour les fonds existants mal casses
  if (existingFunds.some(f => f.pays !== PAYS)) {
    const toFix = existingFunds.filter(f => f.pays !== PAYS);
    if (toFix.length > 0 && !dryRun) {
      await conn.execute(`UPDATE fond_investissements SET pays = ? WHERE LOWER(pays) = 'nigeria' AND pays != ?`, [PAYS, PAYS]);
      console.log(`  ${toFix.length} fonds normalises: pays -> '${PAYS}'`);
    }
  }
  console.log(`${existingFunds.length} fonds Nigeria existants en base`);

  // Index de matching (par nom normalise)
  const existingByKey = new Map();
  for (const f of existingFunds) {
    const key = normalizeNameForMatch(f.nom_fond);
    existingByKey.set(key, f);
  }

  const report = {
    fondsMatched: 0,
    fondsFuzzyMatched: 0,
    fondsCreated: 0,
    fondsSkipped: 0,
    fondsMetaUpdated: 0,
    vlInserted: 0,
    vlAlreadyExist: 0,
    vlNoForex: 0,
    errors: [],
    fuzzyMatches: [],
  };

  const BATCH_SIZE = 100;
  let fondIndex = 0;
  const totalFonds = fondsMap.size;

  try {
    for (const [compositeKey, fondData] of fondsMap) {
      fondIndex++;
      if (fondIndex % 20 === 0) {
        console.log(`  Progression: ${fondIndex}/${totalFonds} fonds (${report.vlInserted} VL inserees)...`);
      }

      const classif = getClassification(fondData.category_fr);
      const fundNameKey = normalizeNameForMatch(fondData.fund_name_clean);
      const currency = fondData.currency_code || 'NGN';

      // --------------------------------------------------------
      // MATCHING: chercher le fonds en base
      // --------------------------------------------------------
      let matchedFund = existingByKey.get(fundNameKey) || null;
      let matchMethod = 'exact_key';

      // Fuzzy match si pas de match exact
      if (!matchedFund) {
        let bestSim = 0;
        let bestFund = null;
        for (const [key, fund] of existingByKey) {
          const sim = similarity(fundNameKey, key);
          if (sim > bestSim && sim >= 0.95) {
            bestSim = sim;
            bestFund = fund;
          }
        }
        if (bestFund) {
          matchedFund = bestFund;
          matchMethod = `fuzzy_${bestSim.toFixed(3)}`;
          report.fondsFuzzyMatched++;
          report.fuzzyMatches.push({
            csv: fondData.fund_name_clean,
            db: bestFund.nom_fond,
            sim: bestSim.toFixed(3),
          });
        }
      }

      let fondId;

      if (matchedFund) {
        fondId = matchedFund.id;
        report.fondsMatched++;

        if (!dryRun) {
          // Mettre a jour UNIQUEMENT les champs vides
          const updates = [];
          const params = [];
          const isEmpty = (v) => !v || v === '' || v === 'Non renseigné' || v === 'Non classé' || v === 'AUTRE';

          if (!matchedFund.societe_gestion && fondData.fund_manager_clean) {
            updates.push('societe_gestion = ?');
            params.push(fondData.fund_manager_clean);
          }
          if (!matchedFund.regulateur) {
            updates.push('regulateur = ?');
            params.push(REGULATEUR);
          }
          if (isEmpty(matchedFund.classification) && classif.classification !== 'AUTRE') {
            updates.push('classification = ?');
            params.push(classif.classification);
          }
          if (isEmpty(matchedFund.categorie_globale) && classif.categorie_globale !== 'AUTRE') {
            updates.push('categorie_globale = ?');
            params.push(classif.categorie_globale);
          }
          if (isEmpty(matchedFund.categorie_national) && classif.categorie_national !== 'AUTRE Nigeria') {
            updates.push('categorie_national = ?');
            params.push(classif.categorie_national);
          }
          if (isEmpty(matchedFund.categorie_regional) && classif.categorie_regional !== 'AUTRE Nigeria') {
            updates.push('categorie_regional = ?');
            params.push(classif.categorie_regional);
          }
          if (!matchedFund.structure_fond) {
            updates.push('structure_fond = ?');
            params.push(detectStructure(fondData.fund_name_clean));
          }

          if (updates.length > 0) {
            params.push(fondId);
            await conn.execute(`UPDATE fond_investissements SET ${updates.join(', ')} WHERE id = ?`, params);
            report.fondsMetaUpdated++;
          }
        }
      } else {
        // Creer le fonds
        if (skipExisting) {
          report.fondsSkipped++;
          continue;
        }

        if (dryRun) {
          fondId = -1;
          report.fondsCreated++;
        } else {
          const structure = detectStructure(fondData.fund_name_clean);

          const [result] = await conn.execute(
            `INSERT INTO fond_investissements
             (nom_fond, societe_gestion, pays, dev_libelle, region,
              structure_fond, active, regulateur,
              classification, categorie_globale, categorie_national, categorie_regional)
             VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            [
              fondData.fund_name_clean,
              fondData.fund_manager_clean || '',
              PAYS, currency === 'USD' ? 'USD' : currency === 'EUR' ? 'EUR' : DEVISE, 'West Africa',
              structure, REGULATEUR,
              classif.classification,
              classif.categorie_globale,
              classif.categorie_national,
              classif.categorie_regional,
            ]
          );
          fondId = result.insertId;
          report.fondsCreated++;

          // Rattacher ou creer societe de gestion
          if (fondData.fund_manager_clean) {
            try {
              const [socs] = await conn.execute(
                `SELECT id FROM societes WHERE nom = ? LIMIT 1`,
                [fondData.fund_manager_clean]
              );
              let socId;
              if (socs.length > 0) {
                socId = socs[0].id;
              } else {
                const [newSoc] = await conn.execute(
                  `INSERT INTO societes (nom, pays, regulateur, devise, created_at, updated_at)
                   VALUES (?, ?, ?, ?, NOW(), NOW())`,
                  [fondData.fund_manager_clean, PAYS, REGULATEUR, DEVISE]
                );
                socId = newSoc.insertId;
                console.log(`  Societe creee: "${fondData.fund_manager_clean}" (id=${socId})`);
              }
              await conn.execute(`UPDATE fond_investissements SET societe_id = ? WHERE id = ?`, [socId, fondId]);
            } catch (e) { console.warn('  Warning societe:', e.message); }
          }

          // Ajouter au cache de matching pour eviter les doublons dans le meme run
          existingByKey.set(fundNameKey, { id: fondId, nom_fond: fondData.fund_name_clean });
        }
      }

      if (dryRun) continue;

      // --------------------------------------------------------
      // Recuperer les dates VL existantes pour ce fonds
      // --------------------------------------------------------
      const [existingVLs] = await conn.execute(
        `SELECT date FROM valorisations WHERE fund_id = ?`,
        [fondId]
      );
      const existingDates = new Set(existingVLs.map(v => {
        const d = v.date;
        if (d instanceof Date) return d.toISOString().slice(0, 10);
        return String(d).slice(0, 10);
      }));

      // Preparer les VL a inserer
      // IMPORTANT: value = prix unitaire (offer/unit price), actif_net = NAV total du fonds
      // Le NAV total est normalement >> prix unitaire (NAV = prix * nb_parts)
      const toInsert = [];
      let vlSuspectCount = 0;
      for (const [dateStr, vlData] of fondData.vls) {
        if (existingDates.has(dateStr)) {
          report.vlAlreadyExist++;
          continue;
        }

        // Controle: si le NAV total est < prix unitaire, c'est suspect
        // (sauf si NAV = 0 = non renseigne)
        if (vlData.nav > 0 && vlData.nav < vlData.vl) {
          vlSuspectCount++;
          if (vlSuspectCount <= 3) {
            report.errors.push(`SUSPECT ${fondData.fund_name_clean} ${dateStr}: NAV(${vlData.nav}) < VL(${vlData.vl}) - verifie le mapping`);
          }
        }

        const valueEUR = convertToEUR(vlData.vl, dateStr, vlData.currency);
        const valueUSD = convertToUSD(vlData.vl, dateStr, vlData.currency);

        if (valueEUR === null || valueUSD === null) {
          report.vlNoForex++;
        }

        toInsert.push({
          date: dateStr,
          vl: vlData.vl,
          nav: vlData.nav || 0,
          currency: vlData.currency,
          valueEUR: valueEUR || 0,
          valueUSD: valueUSD || 0,
          navEUR: vlData.nav > 0 ? (convertToEUR(vlData.nav, dateStr, vlData.currency) || 0) : 0,
          navUSD: vlData.nav > 0 ? (convertToUSD(vlData.nav, dateStr, vlData.currency) || 0) : 0,
        });
      }
      if (vlSuspectCount > 0) {
        report.errors.push(`${fondData.fund_name_clean}: ${vlSuspectCount} VL suspectes (NAV < prix unitaire)`);
      }

      // --------------------------------------------------------
      // Insertion par batch
      // --------------------------------------------------------
      for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() =>
          '(?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, \'\', 0, 0, 0, 0, 0, 0, 0, 0, ?, 0, \'\', 0, ?)'
        ).join(',\n');
        const values = [];

        for (const item of batch) {
          values.push(
            fondId, fondData.fund_name_clean, item.vl, item.valueEUR, item.valueUSD,
            item.nav, item.navEUR, item.navUSD,
            item.vl, item.valueEUR, item.valueUSD,
            fondData.fund_name_clean, item.date
          );
        }

        try {
          const [insertResult] = await conn.execute(
            `INSERT INTO valorisations
             (fund_id, fund_name, value, value_EUR, value_USD,
              actif_net, actif_net_EUR, actif_net_USD,
              dividende, dividende_EUR, dividende_USD,
              vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD,
              indice_name, base_100, base_100_InRef, tsr, tra,
              indRef, indRef_EUR, indRef_USD,
              indice_comparaison, libelle_fond, souscription, ID_indice, rachat, date)
             VALUES ${placeholders}`,
            values
          );
          report.vlInserted += batch.length;
        } catch (err) {
          report.errors.push(`Batch insert ${fondData.fund_name_clean}: ${err.message}`);
          for (const item of batch) {
            try {
              await conn.execute(
                `INSERT INTO valorisations
                 (fund_id, fund_name, value, value_EUR, value_USD,
                  actif_net, actif_net_EUR, actif_net_USD,
                  dividende, dividende_EUR, dividende_USD,
                  vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD,
                  indice_name, base_100, base_100_InRef, tsr, tra,
                  indRef, indRef_EUR, indRef_USD,
                  indice_comparaison, libelle_fond, souscription, ID_indice, rachat, date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, '', 0, 0, 0, 0, 0, 0, 0, 0, ?, 0, '', 0, ?)`,
                [fondId, fondData.fund_name_clean, item.vl, item.valueEUR, item.valueUSD,
                 item.nav, item.navEUR, item.navUSD,
                 item.vl, item.valueEUR, item.valueUSD,
                 fondData.fund_name_clean, item.date]
              );
              report.vlInserted++;
            } catch (e2) {
              report.errors.push(`VL ${fondData.fund_name_clean} ${item.date}: ${e2.message}`);
            }
          }
        }
      }

      // Detecter les variations extremes entre VL consecutives (>50%)
      if (toInsert.length >= 2) {
        const sorted = [...toInsert].sort((a, b) => a.date.localeCompare(b.date));
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1].vl;
          const curr = sorted[i].vl;
          if (prev > 0) {
            const variation = Math.abs((curr - prev) / prev);
            if (variation > 0.5) {
              report.errors.push(
                `VARIATION EXTREME ${fondData.fund_name_clean}: ${sorted[i-1].date}(${prev}) -> ${sorted[i].date}(${curr}) = ${(variation*100).toFixed(1)}%`
              );
            }
          }
        }
      }

      // Mettre a jour datejour, date_premiere_vl, montant_premier_vl + activer le fonds
      if (toInsert.length > 0) {
        await conn.execute(`
          UPDATE fond_investissements SET
            active = 1,
            datejour = (SELECT MAX(date) FROM valorisations WHERE fund_id = ?),
            date_premiere_vl = (SELECT MIN(date) FROM valorisations WHERE fund_id = ?),
            montant_premier_vl = (SELECT value FROM valorisations WHERE fund_id = ? ORDER BY date ASC LIMIT 1)
          WHERE id = ?
        `, [fondId, fondId, fondId, fondId]);
      }
    }

    // ============================================================
    // RAPPORT FINAL
    // ============================================================
    console.log('\n\n==========================================');
    console.log('=== RAPPORT IMPORT VL NIGERIA (SEC) ===');
    console.log('==========================================');
    console.log(`Fichier CSV:                   ${csvPath}`);
    console.log(`Lignes CSV totales:            ${allRows.length}`);
    console.log(`Lignes valides:                ${validRows.length}`);
    console.log(`Fonds dans le CSV:             ${fondsMap.size}`);
    console.log(`Fonds matches (existants):     ${report.fondsMatched}`);
    console.log(`  dont fuzzy match:            ${report.fondsFuzzyMatched}`);
    console.log(`Fonds crees (nouveaux):        ${report.fondsCreated}`);
    console.log(`Fonds ignores (--skip-existing): ${report.fondsSkipped}`);
    console.log(`Fonds metadata MAJ:            ${report.fondsMetaUpdated}`);
    console.log(`VL inserees:                   ${report.vlInserted}`);
    console.log(`VL deja existantes (gardees):  ${report.vlAlreadyExist}`);
    console.log(`VL sans taux forex:            ${report.vlNoForex}`);
    console.log(`Erreurs:                       ${report.errors.length}`);

    if (report.fuzzyMatches.length > 0) {
      console.log('\nMatches fuzzy (a verifier):');
      for (const fm of report.fuzzyMatches.slice(0, 30)) {
        console.log(`  CSV: "${fm.csv}" <-> DB: "${fm.db}" (sim=${fm.sim})`);
      }
      if (report.fuzzyMatches.length > 30) {
        console.log(`  ... et ${report.fuzzyMatches.length - 30} de plus`);
      }
    }

    if (report.errors.length > 0) {
      console.log('\nPremieres erreurs (max 20):');
      report.errors.slice(0, 20).forEach(e => console.log(`  - ${e}`));
    }

    // Stats par categorie
    console.log('\nCategories extraites:');
    const catStats = {};
    for (const [, fd] of fondsMap) {
      const c = fd.category_fr || 'NON CLASSE';
      catStats[c] = (catStats[c] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(catStats).sort((a, b) => b[1] - a[1])) {
      const mapped = getClassification(cat);
      console.log(`  ${cat} (${count} fonds) => ${mapped.classification} / ${mapped.categorie_globale}`);
    }

    // Stats par annee
    console.log('\nVL par annee:');
    const yearStats = {};
    for (const [, fd] of fondsMap) {
      for (const [date] of fd.vls) {
        const year = date.slice(0, 4);
        yearStats[year] = (yearStats[year] || 0) + 1;
      }
    }
    for (const [year, count] of Object.entries(yearStats).sort()) {
      console.log(`  ${year}: ${count} VL`);
    }

    if (dryRun) {
      console.log('\n*** MODE DRY-RUN: aucune modification en base ***');
    }

  } catch (error) {
    console.error('\nERREUR FATALE:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
    console.log('\nConnexion fermee');
  }
}

run().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
