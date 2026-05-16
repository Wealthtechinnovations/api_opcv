/**
 * Import VL Maroc quotidiennes depuis ZIP de fichiers ASFIM (2024-2026)
 *
 * Source: Tableau_de_performance_du_20242026.zip
 *   342 fichiers XLSX, un par jour ouvre (oct 2024 -> mars 2026)
 *   ~250-300 fonds par fichier, format ASFIM standard
 *
 * Colonnes: CODE ISIN, Code Maroclear, OPCVM, Societe, Nature juridique,
 *           Classification, AN, VL, performances YTD/1j/1s/1m/3m/6m/1a/2a/3a/5a
 *
 * Usage: node import_vl_maroc_2024_2026.js <chemin_zip_ou_dossier>
 *
 * Comportement NON-DESTRUCTIF:
 *   - Si un fonds existe deja (match par code_ISIN ou nom): on le garde, on met a jour les champs vides
 *   - Si une VL existe deja pour une date: on la GARDE, on n'insere rien
 *   - Nouveaux fonds crees avec active=1, pays=MAROC, dev_libelle=MAD, regulateur=AMMC
 *   - Conversion MAD->EUR et MAD->USD avec taux du jour depuis devisedechanges
 */

const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const PAYS = 'MAROC';
const DEVISE = 'MAD';
const REGULATEUR = 'AMMC';

// Classification ASFIM -> categorie_globale
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

function parseDateFromFilename(filename) {
  const m = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return null;
}

async function run() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node import_vl_maroc_2024_2026.js <chemin_zip_ou_dossier>');
    process.exit(1);
  }

  let workDir;
  const isZip = inputPath.endsWith('.zip');

  if (isZip) {
    workDir = '/tmp/maroc_vl_import_' + Date.now();
    fs.mkdirSync(workDir, { recursive: true });
    console.log(`Extraction du ZIP dans ${workDir}...`);
    execSync(`unzip -o -j "${inputPath}" -d "${workDir}"`, { stdio: 'pipe' });
  } else {
    workDir = inputPath;
  }

  const files = fs.readdirSync(workDir)
    .filter(f => f.endsWith('.xlsx') && f.includes('Tableau_de_performance'))
    .sort();

  console.log(`${files.length} fichiers ASFIM trouves`);

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm\n');

  // Charger taux de change EUR/MAD et USD/MAD par date
  const [fxRows] = await conn.execute(
    `SELECT paire, date, value FROM devisedechanges
     WHERE paire IN ('EUR/MAD', 'USD/MAD') AND value > 0
     ORDER BY date`
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
  console.log(`Forex charge: EUR/MAD ${fxEurDates.length} dates, USD/MAD ${fxUsdDates.length} dates`);

  function getRate(fxMap, fxDates, date) {
    if (fxMap[date]) return fxMap[date];
    // Closest date <= target
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

  // Charger les fonds existants par ISIN et par nom
  const [existingFonds] = await conn.execute(
    `SELECT id, nom_fond, code_ISIN, societe_gestion FROM fond_investissements WHERE pays = 'MAROC'`
  );
  const fondByIsin = {};
  const fondByName = {};
  for (const f of existingFonds) {
    if (f.code_ISIN) fondByIsin[f.code_ISIN.trim()] = f;
    if (f.nom_fond) fondByName[f.nom_fond.trim().toUpperCase()] = f;
  }
  console.log(`${existingFonds.length} fonds MAROC existants (${Object.keys(fondByIsin).length} avec ISIN)\n`);

  // Charger les VL existantes (fund_id + date) pour eviter les doublons
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
  console.log(`${existingVlSet.size} VL existantes en base\n`);

  const report = {
    filesProcessed: 0,
    filesEmpty: 0,
    vlInserted: 0,
    vlSkipped: 0,
    fondsCreated: 0,
    fondsUpdated: 0,
    errors: [],
  };

  // Charger societe_id mapping
  const [societes] = await conn.execute(
    `SELECT id, nom_societe FROM societes`
  );
  const societeByName = {};
  for (const s of societes) {
    if (s.nom_societe) societeByName[s.nom_societe.trim().toUpperCase()] = s.id;
  }

  // Process each file
  for (let fi = 0; fi < files.length; fi++) {
    const file = files[fi];
    const dateStr = parseDateFromFilename(file);
    if (!dateStr) {
      report.errors.push(`Pas de date dans: ${file}`);
      continue;
    }

    const wb = XLSX.readFile(path.join(workDir, file));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Row 0 is header (redefines column names), row 1+ is data
    if (data.length <= 1) {
      report.filesEmpty++;
      continue;
    }

    const eurMadRate = getRate(fxEurMad, fxEurDates, dateStr) || 10.85;
    const usdMadRate = getRate(fxUsdMad, fxUsdDates, dateStr) || 9.95;

    const titleCol = Object.keys(data[0])[0];
    let fileInserted = 0;
    let fileSkipped = 0;

    const vlBatch = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const isin = String(row[titleCol] || '').trim();
      const nom = String(row['__EMPTY_1'] || '').trim();
      const societe = String(row['__EMPTY_2'] || '').trim();
      const nature = String(row['__EMPTY_3'] || '').trim();
      const classification = String(row['__EMPTY_4'] || '').trim();
      const an = parseFloat(row['__EMPTY_15']);
      const vl = parseFloat(row['__EMPTY_16']);

      if (!nom || isNaN(vl) || vl <= 0) continue;

      // Find or create fund
      let fund = fondByIsin[isin] || fondByName[nom.toUpperCase()];

      if (!fund) {
        // Create new fund
        const catGlob = CLASSIFICATION_MAP[classification.toUpperCase()] || 'Diversifie';
        const socId = societeByName[societe.toUpperCase()] || null;

        try {
          const [result] = await conn.execute(
            `INSERT INTO fond_investissements
             (nom_fond, code_ISIN, pays, dev_libelle, regulateur, active,
              societe_gestion, societe_id, structure_fond, classification,
              categorie_globale, categorie_libelle, categorie_regional, categorie_national)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nom, isin.startsWith('MA') ? isin : null, PAYS, DEVISE, REGULATEUR,
             societe, socId, nature || null, classification || null,
             catGlob, catGlob, 'Afrique du Nord', catGlob + ' ' + PAYS]
          );
          fund = { id: result.insertId, nom_fond: nom, code_ISIN: isin };
          fondByIsin[isin] = fund;
          fondByName[nom.toUpperCase()] = fund;
          report.fondsCreated++;
        } catch (e) {
          if (!e.message.includes('Duplicate')) {
            report.errors.push(`Create fund "${nom}": ${e.message}`);
          }
          continue;
        }
      } else {
        // Update ISIN if missing
        if (!fund.code_ISIN && isin.startsWith('MA')) {
          await conn.execute(
            `UPDATE fond_investissements SET code_ISIN = ? WHERE id = ? AND (code_ISIN IS NULL OR code_ISIN = '')`,
            [isin, fund.id]
          ).catch(() => {});
          fund.code_ISIN = isin;
          fondByIsin[isin] = fund;
          report.fondsUpdated++;
        }
      }

      // Check if VL already exists
      const vlKey = `${fund.id}|${dateStr}`;
      if (existingVlSet.has(vlKey)) {
        fileSkipped++;
        continue;
      }

      const valueEur = vl / eurMadRate;
      const valueUsd = vl / usdMadRate;
      const actifNet = (!isNaN(an) && an > 0) ? an : 0;
      const actifNetEur = actifNet > 0 ? actifNet / eurMadRate : 0;
      const actifNetUsd = actifNet > 0 ? actifNet / usdMadRate : 0;

      vlBatch.push([fund.id, dateStr, vl, actifNet, valueEur, valueUsd, valueEur, valueUsd, actifNetEur, actifNetUsd]);
      existingVlSet.add(vlKey);
    }

    // Batch insert VL
    if (vlBatch.length > 0) {
      const BATCH_SIZE = 200;
      for (let b = 0; b < vlBatch.length; b += BATCH_SIZE) {
        const chunk = vlBatch.slice(b, b + BATCH_SIZE);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const values = chunk.flat();
        try {
          const [result] = await conn.execute(
            `INSERT IGNORE INTO valorisations
             (fund_id, date, value, actif_net, value_EUR, value_USD, vl_ajuste_EUR, vl_ajuste_USD, actif_net_EUR, actif_net_USD)
             VALUES ${placeholders}`,
            values
          );
          fileInserted += result.affectedRows;
        } catch (e) {
          // Fallback: insert one by one
          for (const row of chunk) {
            try {
              await conn.execute(
                `INSERT IGNORE INTO valorisations
                 (fund_id, date, value, actif_net, value_EUR, value_USD, vl_ajuste_EUR, vl_ajuste_USD, actif_net_EUR, actif_net_USD)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                row
              );
              fileInserted++;
            } catch (e2) {
              report.errors.push(`VL fund ${row[0]} ${row[1]}: ${e2.message}`);
            }
          }
        }
      }
    }

    report.vlInserted += fileInserted;
    report.vlSkipped += fileSkipped;
    report.filesProcessed++;

    if ((fi + 1) % 50 === 0 || fi === files.length - 1) {
      console.log(`  [${fi + 1}/${files.length}] ${dateStr} - ${fileInserted} inseres, ${fileSkipped} existants`);
    }
  }

  // Update datejour, date_premiere_vl for affected funds
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
  console.log('=== RAPPORT IMPORT VL MAROC 2024-2026 ===');
  console.log('==========================================');
  console.log(`Fichiers traites:   ${report.filesProcessed}`);
  console.log(`Fichiers vides:     ${report.filesEmpty}`);
  console.log(`VL inserees:        ${report.vlInserted}`);
  console.log(`VL deja existantes: ${report.vlSkipped}`);
  console.log(`Fonds crees:        ${report.fondsCreated}`);
  console.log(`Fonds mis a jour:   ${report.fondsUpdated}`);
  console.log(`Erreurs:            ${report.errors.length}`);
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
  console.log(`  Total VL:     ${v.total_vl}`);
  console.log(`  Fonds:        ${v.nb_fonds}`);
  console.log(`  Periode:      ${v.min_date} -> ${v.max_date}`);

  // Cleanup temp dir
  if (isZip && workDir.startsWith('/tmp/maroc_vl_import_')) {
    execSync(`rm -rf "${workDir}"`);
    console.log(`\nDossier temp nettoye: ${workDir}`);
  }

  await conn.end();
  console.log('Connexion fermee. Import termine.');
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
