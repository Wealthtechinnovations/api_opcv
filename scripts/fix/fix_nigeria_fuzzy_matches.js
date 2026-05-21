/**
 * Nettoyage des mauvais fuzzy matches de l'import Nigeria SEC
 *
 * Probleme: le seuil fuzzy a 85% a matche des fonds DIFFERENTS
 * qui ont des noms similaires (ex: "DLM Money Market Fund" -> "ARM Money Market Fund")
 *
 * Ce script:
 *   1. Identifie les fonds mal matches (liste manuelle verifiee)
 *   2. Supprime les VL inserees dans le mauvais fund_id
 *   3. Cree les fonds corrects en tant que nouveaux fonds
 *   4. Re-insere les VL dans le bon fund_id
 *
 * NON-DESTRUCTIF sur les fonds existants: ne supprime QUE les VL
 * qui ont ete inserees par erreur (identifiees par fund_name dans valorisations)
 *
 * Usage: node fix_nigeria_fuzzy_matches.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

// Liste des mauvais fuzzy matches (verifie manuellement)
// Format: { csvName: nom dans le CSV, wrongDbName: nom du fonds DB auquel il a ete matche }
const BAD_FUZZY_MATCHES = [
  { csvName: 'DLM Money Market Fund', wrongDbName: 'ARM Money Market Fund' },
  { csvName: 'FSL Money Market Fund', wrongDbName: 'GDL Money Market Fund' },
  { csvName: 'GTI Money Market Fund', wrongDbName: 'ARM Money Market Fund' },
  { csvName: 'Page Money Market Fund', wrongDbName: 'Fundvine Money Market Fund' },
  { csvName: 'RMBN Money Market Fund', wrongDbName: 'FBN Money Market Fund' },
  { csvName: 'SCM Capital Money Market Fund', wrongDbName: 'United Capital Money Market Fund' },
  { csvName: 'STL Money Market Fund', wrongDbName: 'GDL Money Market Fund' },
  { csvName: 'FAAM Money Market Fund', wrongDbName: 'ARM Money Market Fund' },
  { csvName: 'Lead Dollar Fixed Income Fund', wrongDbName: 'Nova Dollar Fixed Income Fund' },
  { csvName: 'RMBN Dollar Fixed Income Fund', wrongDbName: 'Nova Dollar Fixed Income Fund' },
  { csvName: 'ARM Specialized Dollar Fund', wrongDbName: 'FBN Specialized Dollar Fund' },
  { csvName: 'Coronation Premium Fixed Income Fund', wrongDbName: 'Coronation Fixed Income Fund' },
  { csvName: 'United Capital Stable Income Fund', wrongDbName: 'United Capital Fixed Income Fund' },
  { csvName: 'ARM Short-Term Eurobond Fund', wrongDbName: 'ARM Short Term Bond Fund' },
  { csvName: 'UBA Nom-Cowry Fixed Income Fund', wrongDbName: 'Cowry Fixed Income Fund' },
];

// Matches corrects (meme fonds, nom legerement different) - NE PAS TOUCHER
// "Guaranty Trust Equity Income Fund" -> "Guaranty Trust Equity Income Fund (GTEIF)" = CORRECT
// "Guaranty Trust Money Market Fund" -> "Guaranty Trust Money Market Fund (GTMMF)" = CORRECT
// "Nigeria Real Estate Investment Trust" -> "Nigerian Real Estate Investment Trust" = CORRECT
// "GDL Canary Growth Fund" -> "GDL CanaryGrowth Fund" = CORRECT
// "Guaranty Trust Balanced Fund" -> "Guaranty Trust Balanced Fund (GTBF)" = CORRECT
// "Vantage Dollar Fund (VDF)" -> "Vantage Dollar Fund" = CORRECT
// "FBN Bond Fund (FBN Fixed Income Fund)" -> "FBN Bond Fund (Fixed Income)" = CORRECT
// "United Capital Nigerian Eurobond Fund" -> "United Capital Eurobond Fund" = CORRECT
// "Nigeria Bond Fund" -> "Nigerian Bond Fund" = CORRECT
// "Emerging Africa Balanced-Diversity Fund (Gender/Diversity)" -> "Emerging Africa Balanced-Diversity Fund" = CORRECT
// "Vantage Guaranteed Income Fund (VGIF)" -> "Vantage Guaranteed Income Fund" = CORRECT
// "FBN Nigeria Eurobond USD Fund (Retail)" -> "FBN Eurobond (Nigeria Eurobond USD) Fund (Retail)" = CORRECT
// "FBN Nigeria Eurobond USD Fund (Institutional)" -> "FBN Eurobond (Nigeria Eurobond USD) Fund (Institutional)" = CORRECT
// "Guaranty Dollar Fund" -> "Guaranty Trust Dollar Fund" = PROBABLEMENT CORRECT
// "FBN Dollar Fund (FBN Eurobond) - Retail" -> "FBN Dollar Fund (Retail)" = CORRECT

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');

  const report = {
    vlDeleted: 0,
    fondsCreated: 0,
    vlReinserted: 0,
    errors: [],
  };

  try {
    for (const match of BAD_FUZZY_MATCHES) {
      console.log(`\n--- Correction: "${match.csvName}" (mal matche a "${match.wrongDbName}") ---`);

      // 1. Trouver le fund_id du mauvais match
      const [wrongFunds] = await conn.execute(
        `SELECT id FROM fond_investissements WHERE nom_fond = ? LIMIT 1`,
        [match.wrongDbName]
      );

      if (wrongFunds.length === 0) {
        console.log(`  Fonds DB "${match.wrongDbName}" introuvable, skip`);
        continue;
      }

      const wrongFundId = wrongFunds[0].id;

      // 2. Compter et sauvegarder les VL mal inserees
      // Identifiees par: fund_id du mauvais fonds + fund_name/libelle_fond = nom CSV
      const [badVLs] = await conn.execute(
        `SELECT id, date, value, value_EUR, value_USD, actif_net, actif_net_EUR, actif_net_USD,
                vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD
         FROM valorisations
         WHERE fund_id = ? AND (fund_name = ? OR libelle_fond = ?)`,
        [wrongFundId, match.csvName, match.csvName]
      );

      console.log(`  ${badVLs.length} VL trouvees dans le mauvais fonds (fund_id=${wrongFundId})`);

      if (badVLs.length === 0) {
        // Les VL n'ont peut-etre pas ete inserees (dates deja existantes)
        console.log(`  Aucune VL a deplacer, creation du fonds quand meme`);
      }

      // 3. Creer le nouveau fonds correct
      const [existingCorrect] = await conn.execute(
        `SELECT id FROM fond_investissements WHERE nom_fond = ? LIMIT 1`,
        [match.csvName]
      );

      let newFundId;
      if (existingCorrect.length > 0) {
        newFundId = existingCorrect[0].id;
        console.log(`  Fonds "${match.csvName}" existe deja (id=${newFundId})`);
      } else {
        const [result] = await conn.execute(
          `INSERT INTO fond_investissements
           (nom_fond, pays, dev_libelle, region, active, regulateur,
            categorie_globale, categorie_national, categorie_regional)
           VALUES (?, 'Nigeria', 'NGN', 'West Africa', 1, 'SEC Nigeria',
                   'AUTRE', 'AUTRE Nigeria', 'AUTRE Nigeria')`,
          [match.csvName]
        );
        newFundId = result.insertId;
        report.fondsCreated++;
        console.log(`  Fonds "${match.csvName}" cree (id=${newFundId})`);
      }

      if (badVLs.length > 0) {
        // 4. Deplacer les VL: UPDATE fund_id + fund_name + libelle_fond
        const [updateResult] = await conn.execute(
          `UPDATE valorisations
           SET fund_id = ?, fund_name = ?, libelle_fond = ?
           WHERE fund_id = ? AND (fund_name = ? OR libelle_fond = ?)`,
          [newFundId, match.csvName, match.csvName, wrongFundId, match.csvName, match.csvName]
        );

        report.vlReinserted += updateResult.affectedRows;
        console.log(`  ${updateResult.affectedRows} VL deplacees vers fund_id=${newFundId}`);

        // 5. Mettre a jour datejour, date_premiere_vl pour le nouveau fonds
        await conn.execute(`
          UPDATE fond_investissements SET
            datejour = (SELECT MAX(date) FROM valorisations WHERE fund_id = ?),
            date_premiere_vl = (SELECT MIN(date) FROM valorisations WHERE fund_id = ?),
            montant_premier_vl = (SELECT value FROM valorisations WHERE fund_id = ? ORDER BY date ASC LIMIT 1)
          WHERE id = ?
        `, [newFundId, newFundId, newFundId, newFundId]);

        // 6. Recalculer aussi pour le fonds dont on a retire les VL
        await conn.execute(`
          UPDATE fond_investissements SET
            datejour = COALESCE((SELECT MAX(date) FROM valorisations WHERE fund_id = ?), datejour),
            date_premiere_vl = COALESCE((SELECT MIN(date) FROM valorisations WHERE fund_id = ?), date_premiere_vl)
          WHERE id = ?
        `, [wrongFundId, wrongFundId, wrongFundId]);
      }
    }

    // Rattacher les societes de gestion si possible (depuis le CSV)
    console.log('\nTentative de rattachement societes de gestion...');
    // On relit le CSV pour retrouver les fund_manager
    const csvPath = 'sec_ng_nav_all.csv';
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split('\n');
      const headers = lines[0].replace(/^﻿/, '').split(',');
      const nameIdx = headers.indexOf('fund_name_clean');
      const managerIdx = headers.indexOf('fund_manager_clean');
      const catIdx = headers.indexOf('fund_category_fr');

      if (nameIdx >= 0 && managerIdx >= 0) {
        const managerMap = {};
        const catMap = {};
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',');
          const name = (vals[nameIdx] || '').replace(/"/g, '').trim();
          const manager = (vals[managerIdx] || '').replace(/"/g, '').trim();
          const cat = (vals[catIdx] || '').replace(/"/g, '').trim();
          if (name && manager) managerMap[name] = manager;
          if (name && cat) catMap[name] = cat;
        }

        for (const match of BAD_FUZZY_MATCHES) {
          const manager = managerMap[match.csvName];
          const cat = catMap[match.csvName];
          if (manager || cat) {
            const updates = [];
            const params = [];
            if (manager) {
              updates.push('societe_gestion = ?');
              params.push(manager);
            }
            if (cat) {
              const CLASSIF = {
                'ACTIONS': 'ACTIONS', 'MONETAIRE': 'MONETAIRE', 'OBLIGATAIRE': 'OBLIGATIONS',
                'DIVERSIFIE': 'DIVERSIFIE', 'DOLLAR': 'DOLLAR', 'ETF': 'ETF',
                'IMMOBILIER': 'IMMOBILIER', 'ETHIQUE': 'ETHIQUE', 'CHARIA': 'CHARIA',
              };
              const mapped = CLASSIF[cat] || cat;
              updates.push('classification = ?', 'categorie_globale = ?');
              params.push(mapped, mapped);
            }
            if (updates.length > 0) {
              params.push(match.csvName);
              await conn.execute(
                `UPDATE fond_investissements SET ${updates.join(', ')} WHERE nom_fond = ? AND (societe_gestion IS NULL OR societe_gestion = '')`,
                params
              );
            }
          }
        }
      }
    }

    // Rapport
    console.log('\n==========================================');
    console.log('=== RAPPORT CORRECTION FUZZY MATCHES ===');
    console.log('==========================================');
    console.log(`Mauvais matches corriges:      ${BAD_FUZZY_MATCHES.length}`);
    console.log(`Fonds crees (nouveaux):        ${report.fondsCreated}`);
    console.log(`VL deplacees:                  ${report.vlReinserted}`);
    console.log(`Erreurs:                       ${report.errors.length}`);
    if (report.errors.length > 0) {
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

run().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
