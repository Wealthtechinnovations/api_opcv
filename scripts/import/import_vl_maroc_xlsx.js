/**
 * Import VL Maroc depuis fichier XLSX consolide ASFIM
 *
 * Format XLSX (feuille ALL_DATA):
 *   CODE ISIN | Code Maroclear | OPCVM | Societe de Gestion | AN | VL | DATE_VALORISATION
 *
 * Usage: node import_vl_maroc_xlsx.js <chemin_fichier.xlsx>
 *
 * Comportement SANS REGRESSION:
 *   - Si un fonds existe deja: on garde ses donnees, on ne met a jour QUE les champs vides
 *   - Si une VL existe deja pour une date: on la GARDE, on n'insere rien pour cette date
 *   - Les nouveaux fonds sont crees avec active=1, pays=MAROC, devise=MAD
 *   - datejour, date_premiere_vl, montant_premier_vl sont mis a jour apres insertion
 *   - code_ISIN est mis a jour s'il etait vide
 *
 * Rapport detaille genere en fin d'execution.
 */

const mysql = require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
require('mysql2/promise');
const XLSX = require('xlsx');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const PAYS = 'MAROC';
const DEVISE = 'MAD';
const REGULATEUR = 'AMMC';

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node import_vl_maroc_xlsx.js <fichier.xlsx>');
    process.exit(1);
  }

  console.log(`Lecture de ${filePath}...`);
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['ALL_DATA'];
  if (!ws) {
    console.error('Feuille ALL_DATA introuvable');
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' });
  const rows = data.slice(1);
  console.log(`${rows.length} lignes lues`);

  // Grouper par fonds
  const fondsByName = new Map();
  let skippedRows = 0;

  for (const row of rows) {
    const isin = String(row[0] || '').trim();
    const nomFond = String(row[2] || '').trim();
    const societe = String(row[3] || '').trim();
    const actifNet = parseFloat(row[4]) || 0;
    const vlValue = parseFloat(row[5]);
    const dateStr = String(row[6] || '').trim();

    if (!nomFond || isNaN(vlValue) || vlValue <= 0 || !dateStr) {
      skippedRows++;
      continue;
    }

    // Normaliser date (deja au format YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      skippedRows++;
      continue;
    }

    if (!fondsByName.has(nomFond)) {
      fondsByName.set(nomFond, {
        isin,
        societe,
        vls: new Map(),
      });
    }

    const fondEntry = fondsByName.get(nomFond);
    // Dedup par date: garder la derniere valeur
    fondEntry.vls.set(dateStr, { vl: vlValue, an: actifNet });
    if (isin && !fondEntry.isin) fondEntry.isin = isin;
  }

  console.log(`Fonds distincts: ${fondsByName.size}`);
  console.log(`Lignes ignorees: ${skippedRows}`);

  // Connexion DB
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base');

  // Charger le taux EUR/MAD et USD/MAD depuis la table devisedechanges
  let eurMad = 10.85;
  let usdMad = 9.95;
  try {
    const [eurRows] = await conn.execute(
      `SELECT value FROM devisedechanges WHERE paire = 'EUR/MAD' ORDER BY date DESC LIMIT 1`
    );
    if (eurRows.length > 0 && eurRows[0].value > 0) eurMad = eurRows[0].value;

    const [usdRows] = await conn.execute(
      `SELECT value FROM devisedechanges WHERE paire = 'USD/MAD' ORDER BY date DESC LIMIT 1`
    );
    if (usdRows.length > 0 && usdRows[0].value > 0) usdMad = usdRows[0].value;
  } catch (e) {
    console.log('  Pas de forex en base, utilisation des taux par defaut');
  }
  console.log(`Taux: EUR/MAD=${eurMad}, USD/MAD=${usdMad}`);

  const report = {
    fondsCreated: 0,
    fondsExisting: 0,
    fondsMetaUpdated: 0,
    vlInserted: 0,
    vlAlreadyExist: 0,
    errors: [],
  };

  const BATCH_SIZE = 100;

  try {
    let fondIndex = 0;
    const totalFonds = fondsByName.size;

    for (const [nomFond, fondData] of fondsByName) {
      fondIndex++;
      if (fondIndex % 50 === 0) {
        console.log(`\nProgression: ${fondIndex}/${totalFonds} fonds...`);
      }

      // Chercher le fonds en base (par nom ou ISIN)
      let [existingFonds] = await conn.execute(
        `SELECT id, nom_fond, code_ISIN, societe_gestion, pays, dev_libelle, societe_id
         FROM fond_investissements WHERE nom_fond = ? LIMIT 1`,
        [nomFond]
      );

      // Essayer aussi par ISIN si pas trouve par nom
      if (existingFonds.length === 0 && fondData.isin) {
        [existingFonds] = await conn.execute(
          `SELECT id, nom_fond, code_ISIN, societe_gestion, pays, dev_libelle, societe_id
           FROM fond_investissements WHERE code_ISIN = ? LIMIT 1`,
          [fondData.isin]
        );
      }

      let fondId;

      if (existingFonds.length > 0) {
        fondId = existingFonds[0].id;
        report.fondsExisting++;

        // Mettre a jour UNIQUEMENT les champs vides
        const updates = [];
        const params = [];

        if (!existingFonds[0].code_ISIN && fondData.isin) {
          updates.push('code_ISIN = ?');
          params.push(fondData.isin);
        }
        if (!existingFonds[0].pays || existingFonds[0].pays === '') {
          updates.push('pays = ?');
          params.push(PAYS);
        }
        if (!existingFonds[0].dev_libelle || existingFonds[0].dev_libelle === '') {
          updates.push('dev_libelle = ?');
          params.push(DEVISE);
        }
        if (!existingFonds[0].societe_gestion || existingFonds[0].societe_gestion === '') {
          updates.push('societe_gestion = ?');
          params.push(fondData.societe);
        }

        // Rattacher a societe_id si manquant
        if (!existingFonds[0].societe_id) {
          const [socs] = await conn.execute(
            `SELECT id FROM societes WHERE nom LIKE ? LIMIT 1`,
            [`%${fondData.societe}%`]
          );
          if (socs.length > 0) {
            updates.push('societe_id = ?');
            params.push(socs[0].id);
          }
        }

        if (updates.length > 0) {
          params.push(fondId);
          await conn.execute(`UPDATE fond_investissements SET ${updates.join(', ')} WHERE id = ?`, params);
          report.fondsMetaUpdated++;
        }
      } else {
        // Creer le fonds
        const structure = nomFond.startsWith('FCP ') ? 'FCP' :
                         (nomFond.startsWith('SICAV ') ? 'SICAV' : 'OPCVM');

        const [result] = await conn.execute(
          `INSERT INTO fond_investissements
           (nom_fond, code_ISIN, societe_gestion, pays, dev_libelle,
            structure_fond, active, regulateur)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
          [nomFond, fondData.isin || '', fondData.societe, PAYS, DEVISE, structure, REGULATEUR]
        );
        fondId = result.insertId;
        report.fondsCreated++;

        // Rattacher a societe
        const [socs] = await conn.execute(
          `SELECT id FROM societes WHERE nom LIKE ? LIMIT 1`,
          [`%${fondData.societe}%`]
        );
        if (socs.length > 0) {
          await conn.execute(`UPDATE fond_investissements SET societe_id = ? WHERE id = ?`, [socs[0].id, fondId]);
        }
      }

      // Recuperer les dates VL existantes
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
      const toInsert = [];
      for (const [dateStr, vlData] of fondData.vls) {
        if (existingDates.has(dateStr)) {
          report.vlAlreadyExist++;
          continue;
        }
        toInsert.push({ date: dateStr, vl: vlData.vl, an: vlData.an });
      }

      // Insertion par batch
      for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, \'\', 0, 0, 0, 0, 0, 0, 0, 0, ?, 0, \'\', 0, ?)').join(',\n');
        const values = [];

        for (const item of batch) {
          const valueEUR = item.vl / eurMad;
          const valueUSD = item.vl / usdMad;
          const anEUR = item.an / eurMad;
          const anUSD = item.an / usdMad;

          values.push(
            fondId, nomFond, item.vl, valueEUR, valueUSD,
            item.an, anEUR, anUSD,
            item.vl, valueEUR, valueUSD,
            nomFond, item.date
          );
        }

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
             VALUES ${placeholders}`,
            values
          );
          report.vlInserted += batch.length;
        } catch (err) {
          report.errors.push(`Batch insert ${nomFond}: ${err.message}`);
          // Fallback: insert one by one
          for (const item of batch) {
            try {
              const valueEUR = item.vl / eurMad;
              const valueUSD = item.vl / usdMad;
              const anEUR = item.an / eurMad;
              const anUSD = item.an / usdMad;
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
                [fondId, nomFond, item.vl, valueEUR, valueUSD, item.an, anEUR, anUSD,
                 item.vl, valueEUR, valueUSD, nomFond, item.date]
              );
              report.vlInserted++;
            } catch (e2) {
              report.errors.push(`VL ${nomFond} ${item.date}: ${e2.message}`);
            }
          }
        }
      }

      // Mettre a jour datejour et date_premiere_vl
      if (toInsert.length > 0) {
        await conn.execute(`
          UPDATE fond_investissements SET
            datejour = (SELECT MAX(date) FROM valorisations WHERE fund_id = ?),
            date_premiere_vl = (SELECT MIN(date) FROM valorisations WHERE fund_id = ?),
            montant_premier_vl = (SELECT value FROM valorisations WHERE fund_id = ? ORDER BY date ASC LIMIT 1)
          WHERE id = ?
        `, [fondId, fondId, fondId, fondId]);
      }
    }

    // RAPPORT FINAL
    console.log('\n\n==========================================');
    console.log('=== RAPPORT IMPORT VL MAROC (XLSX) ===');
    console.log('==========================================');
    console.log(`Fichier:                    ${filePath}`);
    console.log(`Fonds dans le fichier:      ${fondsByName.size}`);
    console.log(`Fonds deja en base:         ${report.fondsExisting}`);
    console.log(`Fonds crees (nouveaux):     ${report.fondsCreated}`);
    console.log(`Fonds metadata MAJ:         ${report.fondsMetaUpdated}`);
    console.log(`VL inserees:                ${report.vlInserted}`);
    console.log(`VL deja existantes:         ${report.vlAlreadyExist}`);
    console.log(`Erreurs:                    ${report.errors.length}`);
    if (report.errors.length > 0) {
      console.log('\nPremieres erreurs (max 20):');
      report.errors.slice(0, 20).forEach(e => console.log(`  - ${e}`));
    }
    console.log('\nTaux utilises: EUR/MAD=' + eurMad + ', USD/MAD=' + usdMad);

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
