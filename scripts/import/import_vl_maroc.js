/**
 * Import VL Maroc depuis fichiers CSV ASFIM
 *
 * Format CSV ASFIM:
 *   Separateur: ;
 *   Decimales: , (virgule francaise)
 *   Colonnes: Date;Societe de gestion;OPCVM;Classe OPCVM;VL;Actif net;Jour;Semaine;Mois;3 mois;Annee;2 annees;3 annees;5 annees
 *
 * Usage: node import_vl_maroc.js <chemin_dossier_csv>
 *   Exemple: node import_vl_maroc.js /home/user/excel_maroc/FICHIERS\ EXCELS/
 *
 * Le script:
 *   1. Lit tous les CSV du dossier, deduplique par (fonds + date)
 *   2. Pour chaque fonds: cree le fonds dans fond_investissements s'il n'existe pas
 *   3. Insere les VL (value, actif_net) sans ecraser les existantes
 *   4. Met a jour les donnees statiques (categorie, societe, datejour, etc.)
 *   5. Genere un rapport detaille
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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
const EUR_MAD = 10.85; // Taux approximatif EUR/MAD (sera affine par forex reel)
const USD_MAD = 9.95;  // Taux approximatif USD/MAD

function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ';' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current.trim());
  return parts;
}

function parseFrenchNumber(str) {
  if (!str || str.trim() === '') return null;
  return parseFloat(str.replace(',', '.'));
}

function readCSVFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Remove BOM if present
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.slice(1);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length < 6) continue;

    const date = parts[0]; // YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const societeGestion = parts[1].replace(/^"|"$/g, '');
    const nomFond = parts[2].replace(/^"|"$/g, '');
    const classeOPCVM = parts[3].replace(/^"|"$/g, '');
    const vl = parseFrenchNumber(parts[4]);
    const actifNet = parseFrenchNumber(parts[5]);

    if (vl === null || vl <= 0) continue;

    rows.push({
      date,
      societeGestion,
      nomFond,
      classeOPCVM,
      vl,
      actifNet: actifNet || 0,
    });
  }
  return rows;
}

async function run() {
  const csvDir = process.argv[2];
  if (!csvDir) {
    console.error('Usage: node import_vl_maroc.js <chemin_dossier_csv>');
    process.exit(1);
  }

  if (!fs.existsSync(csvDir)) {
    console.error(`Dossier introuvable: ${csvDir}`);
    process.exit(1);
  }

  const csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
  console.log(`Trouvé ${csvFiles.length} fichiers CSV dans ${csvDir}`);

  // 1. Lire tous les CSV et deduper
  const allRows = new Map(); // key: "nomFond|date"
  let totalRead = 0;
  let duplicates = 0;

  for (const file of csvFiles) {
    const rows = readCSVFile(path.join(csvDir, file));
    for (const row of rows) {
      const key = `${row.nomFond}|${row.date}`;
      if (!allRows.has(key)) {
        allRows.set(key, row);
      } else {
        duplicates++;
      }
    }
    totalRead += rows.length;
  }

  console.log(`Total lignes lues: ${totalRead}`);
  console.log(`Doublons ignores: ${duplicates}`);
  console.log(`VL uniques a traiter: ${allRows.size}`);

  // 2. Grouper par fonds
  const fondsByName = new Map();
  for (const [, row] of allRows) {
    if (!fondsByName.has(row.nomFond)) {
      fondsByName.set(row.nomFond, {
        nomFond: row.nomFond,
        societeGestion: row.societeGestion,
        classeOPCVM: row.classeOPCVM,
        vls: [],
      });
    }
    fondsByName.get(row.nomFond).vls.push(row);
  }

  console.log(`\nFonds distincts trouves: ${fondsByName.size}`);
  for (const [name, data] of fondsByName) {
    const dates = data.vls.map(v => v.date).sort();
    console.log(`  - ${name} (${data.societeGestion}): ${data.vls.length} VL, ${dates[0]} -> ${dates[dates.length-1]}`);
  }

  // 3. Connexion DB
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('\nConnected to database');

  const report = {
    fondsCreated: 0,
    fondsUpdated: 0,
    fondsAlreadyExist: 0,
    vlInserted: 0,
    vlSkippedExisting: 0,
    vlSkippedInvalid: 0,
    errors: [],
  };

  try {
    for (const [nomFond, fondData] of fondsByName) {
      console.log(`\n--- Processing: ${nomFond} ---`);

      // 3a. Chercher le fonds en base
      const [existingFonds] = await conn.execute(
        `SELECT id, nom_fond, societe_gestion, pays, categorie_globale, dev_libelle, datejour
         FROM fond_investissements WHERE nom_fond = ? AND LOWER(pays) = LOWER(?)`,
        [nomFond, PAYS]
      );

      let fondId;

      if (existingFonds.length > 0) {
        fondId = existingFonds[0].id;
        console.log(`  Fonds existant: id=${fondId}`);
        report.fondsAlreadyExist++;

        // Mettre a jour les metadonnees si manquantes
        const updates = [];
        const params = [];

        if (!existingFonds[0].pays || existingFonds[0].pays === '') {
          updates.push('pays = ?');
          params.push(PAYS);
        }
        if (!existingFonds[0].dev_libelle || existingFonds[0].dev_libelle === '') {
          updates.push('dev_libelle = ?');
          params.push(DEVISE);
        }
        if (!existingFonds[0].categorie_globale || existingFonds[0].categorie_globale === '') {
          const cat = mapClasseToCategorie(fondData.classeOPCVM);
          if (cat) {
            updates.push('categorie_globale = ?');
            params.push(cat);
          }
        }

        if (updates.length > 0) {
          params.push(fondId);
          await conn.execute(
            `UPDATE fond_investissements SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
          console.log(`  Metadonnees mises a jour: ${updates.map(u => u.split(' = ')[0]).join(', ')}`);
          report.fondsUpdated++;
        }
      } else {
        // Creer le fonds
        const cat = mapClasseToCategorie(fondData.classeOPCVM);
        const [result] = await conn.execute(
          `INSERT INTO fond_investissements
           (nom_fond, societe_gestion, pays, dev_libelle, categorie_globale, categorie_libelle,
            structure_fond, active, regulateur, classification)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            nomFond,
            fondData.societeGestion,
            PAYS,
            DEVISE,
            cat || '',
            fondData.classeOPCVM,
            nomFond.startsWith('FCP') ? 'FCP' : (nomFond.startsWith('SICAV') ? 'SICAV' : 'OPCVM'),
            REGULATEUR,
            fondData.classeOPCVM,
          ]
        );
        fondId = result.insertId;
        console.log(`  Nouveau fonds cree: id=${fondId}`);
        report.fondsCreated++;

        // Rattacher a la societe de gestion
        const [societes] = await conn.execute(
          `SELECT id FROM societes WHERE nom LIKE ?`,
          [`%${fondData.societeGestion}%`]
        );
        if (societes.length > 0) {
          await conn.execute(
            `UPDATE fond_investissements SET societe_id = ? WHERE id = ?`,
            [societes[0].id, fondId]
          );
          console.log(`  Rattache a societe id=${societes[0].id}`);
        }
      }

      // 3b. Recuperer les dates de VL existantes pour ce fonds
      const [existingVLs] = await conn.execute(
        `SELECT date FROM valorisations WHERE fund_id = ?`,
        [fondId]
      );
      const existingDates = new Set(existingVLs.map(v => {
        const d = v.date;
        if (d instanceof Date) return d.toISOString().slice(0, 10);
        return String(d).slice(0, 10);
      }));
      console.log(`  VL existantes en base: ${existingDates.size}`);

      // 3c. Inserer les VL manquantes
      const sortedVLs = fondData.vls.sort((a, b) => a.date.localeCompare(b.date));
      let inserted = 0;
      let skipped = 0;

      for (const vlRow of sortedVLs) {
        if (existingDates.has(vlRow.date)) {
          skipped++;
          continue;
        }

        const valueEUR = vlRow.vl / EUR_MAD;
        const valueUSD = vlRow.vl / USD_MAD;
        const actifNetEUR = vlRow.actifNet / EUR_MAD;
        const actifNetUSD = vlRow.actifNet / USD_MAD;

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
            [
              fondId, nomFond, vlRow.vl, valueEUR, valueUSD,
              vlRow.actifNet, actifNetEUR, actifNetUSD,
              vlRow.vl, valueEUR, valueUSD,
              nomFond, vlRow.date,
            ]
          );
          inserted++;
        } catch (err) {
          report.errors.push(`VL insert error: ${nomFond} ${vlRow.date}: ${err.message}`);
        }
      }

      console.log(`  VL inserees: ${inserted}, deja existantes: ${skipped}`);
      report.vlInserted += inserted;
      report.vlSkippedExisting += skipped;

      // 3d. Mettre a jour datejour et date_premiere_vl
      if (inserted > 0) {
        await conn.execute(`
          UPDATE fond_investissements SET
            datejour = (SELECT MAX(date) FROM valorisations WHERE fund_id = ?),
            date_premiere_vl = (SELECT MIN(date) FROM valorisations WHERE fund_id = ?),
            montant_premier_vl = (SELECT value FROM valorisations WHERE fund_id = ? ORDER BY date ASC LIMIT 1)
          WHERE id = ?
        `, [fondId, fondId, fondId, fondId]);
        console.log(`  datejour et date_premiere_vl mis a jour`);
      }
    }

    // 4. Rapport final
    console.log('\n\n========================================');
    console.log('=== RAPPORT D\'IMPORT VL MAROC ===');
    console.log('========================================');
    console.log(`Fonds crees:              ${report.fondsCreated}`);
    console.log(`Fonds deja existants:     ${report.fondsAlreadyExist}`);
    console.log(`Fonds metadonnees MAJ:    ${report.fondsUpdated}`);
    console.log(`VL inserees:              ${report.vlInserted}`);
    console.log(`VL deja existantes:       ${report.vlSkippedExisting}`);
    console.log(`Erreurs:                  ${report.errors.length}`);
    if (report.errors.length > 0) {
      console.log('\nErreurs:');
      report.errors.forEach(e => console.log(`  - ${e}`));
    }

  } catch (error) {
    console.error('\nERREUR FATALE:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
    console.log('\nConnexion fermee');
  }
}

function mapClasseToCategorie(classe) {
  const c = (classe || '').toLowerCase();
  if (c.includes('action')) return 'Actions';
  if (c.includes('obligat')) return 'Obligataire';
  if (c.includes('monet') || c.includes('monét')) return 'Monetaire';
  if (c.includes('diversif')) return 'Diversifie';
  if (c.includes('contractu')) return 'Contractuel';
  return null;
}

run().catch(err => {
  console.error('Erreur non capturee:', err);
  process.exit(1);
});
