/**
 * Import VL UEMOA/BRVM depuis fichier XLSX nettoye
 *
 * Source: BRVM_VL_Nettoye.xlsx (feuilles Fonds_resume + VL_nettoyees)
 * 147 fonds, 87K+ VL, devise XOF
 *
 * Usage: node import_vl_uemoa.js <chemin_fichier.xlsx>
 *
 * Comportement SANS REGRESSION:
 *   - Si un fonds existe deja: on garde ses donnees, on ne met a jour QUE les champs vides
 *   - Si une VL existe deja pour une date: on la GARDE, on n'insere rien pour cette date
 *   - Nouveaux fonds crees avec active=1, pays=UEMOA, dev_libelle=XOF, region=UEMOA
 *   - Classification automatique depuis la categorie reglementaire (A, D, OMLT, OCT, OATC, O, M)
 *   - datejour, date_premiere_vl, montant_premier_vl mis a jour apres insertion
 *   - EUR/XOF = 655.957 (parite fixe CFA)
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

const PAYS = 'UEMOA';
const REGION = 'UEMOA';
const DEVISE = 'XOF';
const REGULATEUR = 'CREPMF';
const EUR_XOF = 655.957; // parite fixe CFA

// ============================================================
// CLASSIFICATION MAPPING (centralisee, non-destructive)
// ============================================================
const CLASSIFICATION_MAP = {
  'A': {
    classification: 'Actions',
    categorie_globale: 'Actions',
    categorie_national: 'Actions UEMOA',
    categorie_regional: 'Actions UEMOA',
  },
  'D': {
    classification: 'Diversifiés',
    categorie_globale: 'Diversifiés',
    categorie_national: 'Diversifiés UEMOA',
    categorie_regional: 'Diversifiés UEMOA',
  },
  'OMLT': {
    classification: 'Obligations moyen et long terme',
    categorie_globale: 'Obligations',
    categorie_national: 'Obligations UEMOA',
    categorie_regional: 'Obligations UEMOA',
  },
  'OCT': {
    classification: 'Obligations court terme',
    categorie_globale: 'Obligations',
    categorie_national: 'Obligations UEMOA',
    categorie_regional: 'Obligations UEMOA',
  },
  'OATC': {
    classification: 'Obligations et autres titres de créance',
    categorie_globale: 'Obligations',
    categorie_national: 'Obligations UEMOA',
    categorie_regional: 'Obligations UEMOA',
  },
  'O': {
    classification: 'Obligations',
    categorie_globale: 'Obligations',
    categorie_national: 'Obligations UEMOA',
    categorie_regional: 'Obligations UEMOA',
  },
  'M': {
    classification: 'Monétaire',
    categorie_globale: 'Monétaire',
    categorie_national: 'Monétaire UEMOA',
    categorie_regional: 'Monétaire UEMOA',
  },
};

const DEFAULT_CLASSIFICATION = {
  classification: 'Non classé',
  categorie_globale: 'Non renseigné',
  categorie_national: 'Non classé UEMOA',
  categorie_regional: 'Non classé UEMOA',
};

function getClassification(categoryCode) {
  if (!categoryCode) return DEFAULT_CLASSIFICATION;
  const code = String(categoryCode).trim().toUpperCase();
  return CLASSIFICATION_MAP[code] || DEFAULT_CLASSIFICATION;
}

function excelDateToISO(serial) {
  if (typeof serial === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(serial)) return serial;
    return null;
  }
  if (typeof serial !== 'number' || serial < 1) return null;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const d = new Date(excelEpoch.getTime() + serial * 86400000);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  if (year < 2000 || year > 2030) return null;
  return `${year}-${month}-${day}`;
}

function detectStructure(name) {
  const upper = (name || '').toUpperCase();
  if (upper.startsWith('FCP ') || upper.startsWith('FCP-') || upper.startsWith('FCPE ') || upper.startsWith('FCPCR ')) return 'FCP';
  if (upper.startsWith('SICAV ')) return 'SICAV';
  return 'OPCVM';
}

// ============================================================
// FUSION DES DOUBLONS (noms longs = societe + fonds concatenes)
// Les VL de la variante longue sont rattachees au nom canonique court
// ============================================================
const MERGE_MAP = {
  'EDC Investment Corporation FCP ECOBANK UEMOA DIVERSIFIE': 'FCP ECOBANK UEMOA DIVERSIFIE',
  'BOA CAPITAL SECURITIES FCP Emergence': 'FCP Emergence',
  'SGI AFRICAINE DE BOURSE ATTIJARI OBLIG': 'ATTIJARI OBLIG',
  'Phoenix Capital Management FCP PAM DIVERSIFIE EQUILIBRE': 'FCP PAM DIVERSIFIE EQUILIBRE',
  'ENKO CAPITAL WEST AFRICA SOCIETE GENERALE COTE FCP ENKO CAPITAL GARANTI': 'FCP ENKO CAPITAL GARANTI',
  'ENKO CAPITAL WEST AFRICA EDC Investment Corporation FCP ENKO CAPITAL GARANTI': 'FCP ENKO CAPITAL GARANTI',
  'BOA CAPITAL SECURITIES FCP Boa Sécurité': 'FCP Boa Sécurité',
  'ENKO CAPITAL WEST AFRICA EDC Investment Corporation FCP ENKO CAPITAL LIQUIDITE': 'FCP ENKO CAPITAL LIQUIDITE',
};

// ============================================================
// NETTOYAGE DES SOCIETES FRAGMENTEES
// Certaines cellules Excel contiennent des fragments de texte ("D'IVOIRE", "SECURITIES")
// On les remplace par la vraie societe de gestion deduite du contexte
// ============================================================
const SOCIETE_FIXES = {
  'FCP SOAGA EPARGNE ACTIONS': 'SOAGA-SA',
  'FCP SOAGA EPARGNE OBLIGATIONS': 'SOAGA-SA',
  'FCP BOAD CAPITAL RETRAITE': 'CGF BOURSE',
  'FCP PATRIMOINE': 'ENKO CAPITAL WEST AFRICA',
  'FCP ENKO CAPITAL OBLIGATIONS': 'ENKO CAPITAL WEST AFRICA',
  'FCP CONFORT PLUS': 'AFRICAINE DE GESTION D\'ACTIFS',
};

function isFragmentSociete(s) {
  if (!s || s.length < 4) return true;
  if (s === 'SECURITIES' || s === "D'IVOIRE" || s === "D'ACTIFS") return true;
  return false;
}

function cleanSociete(fondName, rawSociete) {
  if (SOCIETE_FIXES[fondName]) return SOCIETE_FIXES[fondName];
  if (isFragmentSociete(rawSociete)) return null;
  return rawSociete;
}

function canonicalName(name) {
  return MERGE_MAP[name] || name;
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node import_vl_uemoa.js <fichier.xlsx>');
    process.exit(1);
  }

  console.log(`Lecture de ${filePath}...`);
  const wb = XLSX.readFile(filePath);

  // ============================================================
  // 1. Lire Fonds_resume (metadonnees des fonds)
  // ============================================================
  const frSheet = wb.Sheets['Fonds_resume'];
  if (!frSheet) {
    console.error('Feuille Fonds_resume introuvable');
    process.exit(1);
  }
  const fondsResume = XLSX.utils.sheet_to_json(frSheet);
  console.log(`Fonds_resume: ${fondsResume.length} fonds`);

  const fondsMeta = new Map();
  let mergedCount = 0;
  for (const row of fondsResume) {
    let nom = String(row['Fonds'] || '').trim();
    if (!nom) continue;

    // Appliquer le merge: stocker les metadata sous le nom canonique
    const canonical = canonicalName(nom);
    if (canonical !== nom) {
      mergedCount++;
      nom = canonical;
    }

    const rawSociete = String(row['Société'] || '').trim() || null;
    const societe = cleanSociete(nom, rawSociete);

    // Si le nom canonique existe deja, enrichir (pas ecraser)
    if (fondsMeta.has(nom)) {
      const existing = fondsMeta.get(nom);
      if (!existing.societe && societe) existing.societe = societe;
      if (!existing.depositaire && row['Dépositaire']) existing.depositaire = String(row['Dépositaire']).trim();
      continue;
    }

    fondsMeta.set(nom, {
      societe: societe,
      depositaire: String(row['Dépositaire'] || '').trim() || null,
      categorie: String(row['Catégorie'] || '').trim(),
      valeurOrigine: parseFloat(row['Valeur Origine']) || null,
      dateOrigine: excelDateToISO(row['Date Origine']),
    });
  }
  console.log(`  -> ${fondsMeta.size} fonds canoniques (${mergedCount} variantes fusionnees)`);

  // ============================================================
  // 2. Lire VL_nettoyees
  // ============================================================
  const vlSheet = wb.Sheets['VL_nettoyees'];
  if (!vlSheet) {
    console.error('Feuille VL_nettoyees introuvable');
    process.exit(1);
  }
  const vlRows = XLSX.utils.sheet_to_json(vlSheet);
  console.log(`VL_nettoyees: ${vlRows.length} lignes`);

  // Grouper par fonds
  const fondsByName = new Map();
  let skippedRows = 0;

  let mergedVL = 0;
  for (const row of vlRows) {
    let nomFond = String(row['Fonds'] || '').trim();
    const dateSerial = row['Date VL'];
    const vlValue = parseFloat(row['VL retenue']);
    const categorie = String(row['Catégorie'] || '').trim();

    if (!nomFond || isNaN(vlValue) || vlValue <= 0) {
      skippedRows++;
      continue;
    }

    // Appliquer la fusion des doublons
    const canonical = canonicalName(nomFond);
    if (canonical !== nomFond) {
      mergedVL++;
      nomFond = canonical;
    }

    const dateStr = excelDateToISO(dateSerial);
    if (!dateStr) {
      skippedRows++;
      continue;
    }

    if (!fondsByName.has(nomFond)) {
      const meta = fondsMeta.get(nomFond) || {};
      fondsByName.set(nomFond, {
        societe: meta.societe,
        depositaire: meta.depositaire,
        categorie: meta.categorie || categorie,
        valeurOrigine: meta.valeurOrigine,
        dateOrigine: meta.dateOrigine,
        vls: new Map(),
      });
    }

    const fondEntry = fondsByName.get(nomFond);
    if (!fondEntry.categorie && categorie) fondEntry.categorie = categorie;
    fondEntry.vls.set(dateStr, vlValue);
  }

  console.log(`Fonds distincts: ${fondsByName.size} (apres fusion doublons)`);
  console.log(`Lignes ignorees: ${skippedRows}`);
  console.log(`VL fusionnees (variantes -> canonique): ${mergedVL}`);

  // ============================================================
  // 3. Connexion DB et import
  // ============================================================
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base');

  // Taux de change
  let eurXof = EUR_XOF;
  let usdXof;
  try {
    const [eurRows] = await conn.execute(
      `SELECT value FROM devisedechanges WHERE paire = 'EUR/XOF' ORDER BY date DESC LIMIT 1`
    );
    if (eurRows.length > 0 && eurRows[0].value > 0) eurXof = eurRows[0].value;

    const [usdRows] = await conn.execute(
      `SELECT value FROM devisedechanges WHERE paire = 'USD/XOF' ORDER BY date DESC LIMIT 1`
    );
    if (usdRows.length > 0 && usdRows[0].value > 0) {
      usdXof = usdRows[0].value;
    }
  } catch (e) {
    console.log('  Pas de forex en base, utilisation des taux par defaut');
  }
  if (!usdXof) {
    const [usdEur] = await conn.execute(
      `SELECT value FROM devisedechanges WHERE paire = 'EUR/USD' ORDER BY date DESC LIMIT 1`
    ).catch(() => [[]]);
    if (usdEur && usdEur.length > 0 && usdEur[0].value > 0) {
      usdXof = eurXof / usdEur[0].value;
    } else {
      usdXof = eurXof / 1.08;
    }
  }
  console.log(`Taux: EUR/XOF=${eurXof}, USD/XOF=${usdXof.toFixed(2)}`);

  const report = {
    fondsCreated: 0,
    fondsExisting: 0,
    fondsMetaUpdated: 0,
    fondsClassificationUpdated: 0,
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
      if (fondIndex % 20 === 0) {
        console.log(`  Progression: ${fondIndex}/${totalFonds} fonds (${report.vlInserted} VL inserees)...`);
      }

      const classif = getClassification(fondData.categorie);

      // --------------------------------------------------------
      // Chercher le fonds en base (par nom exact)
      // --------------------------------------------------------
      let [existingFonds] = await conn.execute(
        `SELECT id, nom_fond, societe_gestion, depositaire, pays, dev_libelle, region,
                classification, categorie_globale, categorie_national, categorie_regional,
                structure_fond, date_creation, montant_premier_vl, societe_id
         FROM fond_investissements WHERE nom_fond = ? AND LOWER(pays) = LOWER(?) LIMIT 1`,
        [nomFond, PAYS]
      );

      let fondId;

      if (existingFonds.length > 0) {
        fondId = existingFonds[0].id;
        report.fondsExisting++;

        const existing = existingFonds[0];
        const updates = [];
        const params = [];

        // Mettre a jour UNIQUEMENT les champs vides (non-destructif)
        if (!existing.pays || existing.pays === '') {
          updates.push('pays = ?');
          params.push(PAYS);
        }
        if (!existing.dev_libelle || existing.dev_libelle === '') {
          updates.push('dev_libelle = ?');
          params.push(DEVISE);
        }
        if (!existing.region || existing.region === '') {
          updates.push('region = ?');
          params.push(REGION);
        }
        if (!existing.societe_gestion || existing.societe_gestion === '') {
          if (fondData.societe) {
            updates.push('societe_gestion = ?');
            params.push(fondData.societe);
          }
        }
        if (!existing.depositaire || existing.depositaire === '') {
          if (fondData.depositaire) {
            updates.push('depositaire = ?');
            params.push(fondData.depositaire);
          }
        }
        if (!existing.structure_fond || existing.structure_fond === '') {
          updates.push('structure_fond = ?');
          params.push(detectStructure(nomFond));
        }

        // Classification: mettre a jour UNIQUEMENT si vide ou "Non renseigné"/"Non classé"
        const isEmpty = (v) => !v || v === '' || v === 'Non renseigné' || v === 'Non classé' || v === 'Non classé UEMOA';

        let classifUpdated = false;
        if (isEmpty(existing.classification) && classif.classification !== 'Non classé') {
          updates.push('classification = ?');
          params.push(classif.classification);
          classifUpdated = true;
        }
        if (isEmpty(existing.categorie_globale) && classif.categorie_globale !== 'Non renseigné') {
          updates.push('categorie_globale = ?');
          params.push(classif.categorie_globale);
          classifUpdated = true;
        }
        if (isEmpty(existing.categorie_national) && classif.categorie_national !== 'Non classé UEMOA') {
          updates.push('categorie_national = ?');
          params.push(classif.categorie_national);
          classifUpdated = true;
        }
        if (isEmpty(existing.categorie_regional) && classif.categorie_regional !== 'Non classé UEMOA') {
          updates.push('categorie_regional = ?');
          params.push(classif.categorie_regional);
          classifUpdated = true;
        }

        if (classifUpdated) report.fondsClassificationUpdated++;

        if (!existing.date_creation && fondData.dateOrigine) {
          updates.push('date_creation = ?');
          params.push(fondData.dateOrigine);
        }
        if ((!existing.montant_premier_vl || existing.montant_premier_vl === 0) && fondData.valeurOrigine) {
          updates.push('montant_premier_vl = ?');
          params.push(fondData.valeurOrigine);
        }

        if (updates.length > 0) {
          params.push(fondId);
          await conn.execute(`UPDATE fond_investissements SET ${updates.join(', ')} WHERE id = ?`, params);
          report.fondsMetaUpdated++;
        }
      } else {
        // --------------------------------------------------------
        // Creer le fonds
        // --------------------------------------------------------
        const structure = detectStructure(nomFond);

        const [result] = await conn.execute(
          `INSERT INTO fond_investissements
           (nom_fond, societe_gestion, depositaire, pays, dev_libelle, region,
            structure_fond, active, regulateur,
            classification, categorie_globale, categorie_national, categorie_regional,
            date_creation, montant_premier_vl)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nomFond,
            fondData.societe || '',
            fondData.depositaire || '',
            PAYS, DEVISE, REGION,
            structure, REGULATEUR,
            classif.classification,
            classif.categorie_globale,
            classif.categorie_national,
            classif.categorie_regional,
            fondData.dateOrigine || null,
            fondData.valeurOrigine || null,
          ]
        );
        fondId = result.insertId;
        report.fondsCreated++;

        // Rattacher a societe si possible
        if (fondData.societe) {
          try {
            const [socs] = await conn.execute(
              `SELECT id FROM societes WHERE nom LIKE ? LIMIT 1`,
              [`%${fondData.societe}%`]
            );
            if (socs.length > 0) {
              await conn.execute(`UPDATE fond_investissements SET societe_id = ? WHERE id = ?`, [socs[0].id, fondId]);
            }
          } catch (e) { /* societes table might not exist */ }
        }
      }

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

      // Preparer les VL a inserer (sans ecraser les existantes)
      const toInsert = [];
      for (const [dateStr, vlValue] of fondData.vls) {
        if (existingDates.has(dateStr)) {
          report.vlAlreadyExist++;
          continue;
        }
        toInsert.push({ date: dateStr, vl: vlValue });
      }

      // --------------------------------------------------------
      // Insertion par batch
      // --------------------------------------------------------
      for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() =>
          '(?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, ?, ?, \'\', 0, 0, 0, 0, 0, 0, 0, 0, ?, 0, \'\', 0, ?)'
        ).join(',\n');
        const values = [];

        for (const item of batch) {
          const valueEUR = item.vl / eurXof;
          const valueUSD = item.vl / usdXof;

          values.push(
            fondId, nomFond, item.vl, valueEUR, valueUSD,
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
          for (const item of batch) {
            try {
              const valueEUR = item.vl / eurXof;
              const valueUSD = item.vl / usdXof;
              await conn.execute(
                `INSERT INTO valorisations
                 (fund_id, fund_name, value, value_EUR, value_USD,
                  actif_net, actif_net_EUR, actif_net_USD,
                  dividende, dividende_EUR, dividende_USD,
                  vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD,
                  indice_name, base_100, base_100_InRef, tsr, tra,
                  indRef, indRef_EUR, indRef_USD,
                  indice_comparaison, libelle_fond, souscription, ID_indice, rachat, date)
                 VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, ?, ?, '', 0, 0, 0, 0, 0, 0, 0, 0, ?, 0, '', 0, ?)`,
                [fondId, nomFond, item.vl, valueEUR, valueUSD,
                 item.vl, valueEUR, valueUSD, nomFond, item.date]
              );
              report.vlInserted++;
            } catch (e2) {
              report.errors.push(`VL ${nomFond} ${item.date}: ${e2.message}`);
            }
          }
        }
      }

      // Mettre a jour datejour, date_premiere_vl, montant_premier_vl
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

    // ============================================================
    // RAPPORT FINAL
    // ============================================================
    console.log('\n\n==========================================');
    console.log('=== RAPPORT IMPORT VL UEMOA/BRVM ===');
    console.log('==========================================');
    console.log(`Fichier:                       ${filePath}`);
    console.log(`Fonds dans le fichier:         ${fondsByName.size}`);
    console.log(`Fonds deja en base:            ${report.fondsExisting}`);
    console.log(`Fonds crees (nouveaux):        ${report.fondsCreated}`);
    console.log(`Fonds metadata MAJ:            ${report.fondsMetaUpdated}`);
    console.log(`Fonds classification MAJ:      ${report.fondsClassificationUpdated}`);
    console.log(`VL inserees:                   ${report.vlInserted}`);
    console.log(`VL deja existantes (gardees):  ${report.vlAlreadyExist}`);
    console.log(`Erreurs:                       ${report.errors.length}`);
    if (report.errors.length > 0) {
      console.log('\nPremieres erreurs (max 20):');
      report.errors.slice(0, 20).forEach(e => console.log(`  - ${e}`));
    }
    console.log(`\nTaux utilises: EUR/XOF=${eurXof}, USD/XOF=${usdXof.toFixed(2)}`);
    console.log('\nCategories traitees:');
    const catStats = {};
    for (const [, fd] of fondsByName) {
      const c = fd.categorie || 'INCONNU';
      catStats[c] = (catStats[c] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(catStats).sort((a, b) => b[1] - a[1])) {
      const mapped = getClassification(cat);
      console.log(`  ${cat} (${count} fonds) => ${mapped.classification} / ${mapped.categorie_globale}`);
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
