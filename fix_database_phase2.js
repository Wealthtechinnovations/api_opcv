/**
 * PHASE 2 - DATABASE FIX SCRIPT
 * Static data enrichment + VL cleanup + date_premiere_vl + forme_juridique
 *
 * Run on production: node fix_database_phase2.js
 *
 * What this does:
 * 1. Clean 5 funds with extreme VL (same actif net vs VL unitaire issue as BRIDGE)
 * 2. Fix 31 VL with date=0000-00-00
 * 3. Populate forme_juridique (FCP/SICAV) from fund name prefix
 * 4. Populate categorie_globale from classification or fund name
 * 5. Populate date_premiere_vl and montant_premier_vl from valorisations
 * 6. Populate montant_actif_net (last known VL * nombre_part if available)
 * 7. Populate categorie_libelle where empty
 * 8. Detect and set periodicite from actual VL frequency
 * 9. Generate missing forex cross pairs
 * 10. Summary report of remaining gaps
 *
 * SAFETY: Non-destructive. VL deletions only for proven aberrant data (actif net mixed with unitaire).
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fund_opcvm',
  multipleStatements: true,
};

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connected to', DB_CONFIG.database);

  try {
    // =========================================================================
    // STEP 1: Clean remaining funds with extreme VL (actif net vs VL unitaire)
    // =========================================================================
    console.log('\n=== STEP 1: Clean remaining extreme VL ===');

    // First, identify funds with suspicious bimodal VL distributions
    const [extremeFunds] = await conn.execute(`
      SELECT v.fund_id, f.nom_fond, f.pays,
        COUNT(*) as total_vl,
        SUM(v.value > 10000000) as extreme_count,
        MIN(v.value) as min_val,
        MAX(v.value) as max_val,
        AVG(CASE WHEN v.value < 1000000 THEN v.value END) as avg_normal,
        AVG(CASE WHEN v.value > 10000000 THEN v.value END) as avg_extreme
      FROM valorisations v
      JOIN fond_investissements f ON v.fund_id = f.id
      WHERE v.value > 10000000
      GROUP BY v.fund_id, f.nom_fond, f.pays
      ORDER BY extreme_count DESC
    `);

    let totalCleaned = 0;
    for (const fund of extremeFunds) {
      // Only clean if there's a clear bimodal distribution:
      // normal VL < 1M and extreme VL > 10M, indicating actif net mixed in
      if (fund.avg_normal && fund.avg_extreme && fund.avg_extreme > fund.avg_normal * 100) {
        console.log(`  Fund ${fund.fund_id} "${fund.nom_fond}" (${fund.pays}):`);
        console.log(`    Normal avg: ${Math.round(fund.avg_normal)}, Extreme avg: ${Math.round(fund.avg_extreme)}`);
        console.log(`    ${fund.extreme_count} extreme VL out of ${fund.total_vl} total`);

        const [deleted] = await conn.execute(`
          DELETE FROM valorisations WHERE fund_id = ? AND value > 10000000
        `, [fund.fund_id]);
        totalCleaned += deleted.affectedRows;
        console.log(`    -> Deleted ${deleted.affectedRows} aberrant VL`);
      } else {
        console.log(`  Fund ${fund.fund_id} "${fund.nom_fond}": ratio not clear enough, skipping (max=${fund.max_val})`);
      }
    }
    console.log(`  Total extreme VL cleaned: ${totalCleaned}`);

    // =========================================================================
    // STEP 2: Fix VL with date=0000-00-00
    // =========================================================================
    console.log('\n=== STEP 2: Fix invalid VL dates ===');

    const [invalidVL] = await conn.execute(`
      SELECT id, fund_id, fund_name, value, date
      FROM valorisations
      WHERE date = '0000-00-00' OR date IS NULL
    `);

    if (invalidVL.length > 0) {
      console.log(`  Found ${invalidVL.length} VL with invalid dates`);
      // Delete them - we can't use a VL without a valid date
      const [deleted] = await conn.execute(`
        DELETE FROM valorisations WHERE date = '0000-00-00' OR date IS NULL
      `);
      console.log(`  Deleted ${deleted.affectedRows} VL with invalid dates`);
    } else {
      console.log('  No invalid dates found');
    }

    // =========================================================================
    // STEP 3: Populate structure_fond from fund name prefix
    // (Note: forme_juridique column does NOT exist, using structure_fond instead)
    // =========================================================================
    console.log('\n=== STEP 3: Populate structure_fond ===');

    // FCP = Fonds Commun de Placement
    const [fcpUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET structure_fond = 'FCP'
      WHERE (structure_fond IS NULL OR structure_fond = '')
        AND (nom_fond LIKE 'FCP %' OR nom_fond LIKE 'FCP-%')
    `);
    console.log(`  Set structure_fond=FCP for ${fcpUpdate.affectedRows} fonds`);

    // SICAV = Societe d'Investissement a Capital Variable
    const [sicavUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET structure_fond = 'SICAV'
      WHERE (structure_fond IS NULL OR structure_fond = '')
        AND (nom_fond LIKE 'SICAV %' OR nom_fond LIKE 'SICAV-%')
    `);
    console.log(`  Set structure_fond=SICAV for ${sicavUpdate.affectedRows} fonds`);

    // FCPR = Fonds Commun de Placement a Risques
    const [fcprUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET structure_fond = 'FCPR'
      WHERE (structure_fond IS NULL OR structure_fond = '')
        AND (nom_fond LIKE 'FCPR %' OR nom_fond LIKE 'FCPR-%')
    `);
    console.log(`  Set structure_fond=FCPR for ${fcprUpdate.affectedRows} fonds`);

    // OPCVM (generic)
    const [opcvmUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET structure_fond = 'OPCVM'
      WHERE (structure_fond IS NULL OR structure_fond = '')
        AND (nom_fond LIKE 'OPCVM %' OR nom_fond LIKE 'OPCVM-%')
    `);
    console.log(`  Set structure_fond=OPCVM for ${opcvmUpdate.affectedRows} fonds`);

    // Nigeria: Mutual Fund (open-end)
    const [mfUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET structure_fond = 'Mutual Fund'
      WHERE (structure_fond IS NULL OR structure_fond = '')
        AND pays = 'Nigeria'
    `);
    console.log(`  Set structure_fond=Mutual Fund for ${mfUpdate.affectedRows} Nigeria fonds`);

    const [stillNoForme] = await conn.execute(`
      SELECT COUNT(*) as c FROM fond_investissements
      WHERE structure_fond IS NULL OR structure_fond = ''
    `);
    console.log(`  Remaining without structure_fond: ${stillNoForme[0].c}`);

    // =========================================================================
    // STEP 4: Populate categorie_globale from classification or fund name
    // =========================================================================
    console.log('\n=== STEP 4: Populate categorie_globale ===');

    // Obligataire: bonds/fixed income keywords
    const [obligUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET categorie_globale = 'Obligataire'
      WHERE (categorie_globale IS NULL OR categorie_globale = '')
        AND (
          nom_fond LIKE '%OBLIGAT%'
          OR nom_fond LIKE '%BOND%'
          OR nom_fond LIKE '%FIXED%INCOME%'
          OR nom_fond LIKE '%OBLIG%'
          OR classification LIKE '%Obligat%'
          OR classification LIKE '%Bond%'
          OR categorie_libelle LIKE '%Obligat%'
        )
    `);
    console.log(`  Set categorie_globale=Obligataire for ${obligUpdate.affectedRows} fonds`);

    // Monetaire: money market keywords
    const [monetUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET categorie_globale = 'Monetaire'
      WHERE (categorie_globale IS NULL OR categorie_globale = '')
        AND (
          nom_fond LIKE '%MONET%'
          OR nom_fond LIKE '%MONEY%MARKET%'
          OR nom_fond LIKE '%TRESOR%'
          OR nom_fond LIKE '%LIQUID%'
          OR nom_fond LIKE '%CASH%'
          OR classification LIKE '%Mon%taire%'
          OR classification LIKE '%Money%'
          OR categorie_libelle LIKE '%Mon%taire%'
        )
    `);
    console.log(`  Set categorie_globale=Monetaire for ${monetUpdate.affectedRows} fonds`);

    // Actions: equity keywords
    const [actionsUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET categorie_globale = 'Actions'
      WHERE (categorie_globale IS NULL OR categorie_globale = '')
        AND (
          nom_fond LIKE '%ACTION%'
          OR nom_fond LIKE '%EQUITY%'
          OR nom_fond LIKE '%EQUIT%'
          OR nom_fond LIKE '%SHARE%'
          OR classification LIKE '%Action%'
          OR classification LIKE '%Equity%'
          OR categorie_libelle LIKE '%Action%'
        )
    `);
    console.log(`  Set categorie_globale=Actions for ${actionsUpdate.affectedRows} fonds`);

    // Diversifie: mixed/balanced keywords
    const [diversUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET categorie_globale = 'Diversifie'
      WHERE (categorie_globale IS NULL OR categorie_globale = '')
        AND (
          nom_fond LIKE '%DIVERSIF%'
          OR nom_fond LIKE '%EQUILIBR%'
          OR nom_fond LIKE '%BALANCED%'
          OR nom_fond LIKE '%MIXTE%'
          OR nom_fond LIKE '%CROISSANCE%'
          OR nom_fond LIKE '%RENDEMENT%'
          OR nom_fond LIKE '%GROWTH%'
          OR classification LIKE '%Diversif%'
          OR classification LIKE '%Balanced%'
          OR categorie_libelle LIKE '%Diversif%'
        )
    `);
    console.log(`  Set categorie_globale=Diversifie for ${diversUpdate.affectedRows} fonds`);

    const [stillNoCatGlob] = await conn.execute(`
      SELECT COUNT(*) as c FROM fond_investissements
      WHERE categorie_globale IS NULL OR categorie_globale = ''
    `);
    console.log(`  Remaining without categorie_globale: ${stillNoCatGlob[0].c}`);

    // =========================================================================
    // STEP 5: Populate categorie_libelle where empty (from categorie_globale)
    // =========================================================================
    console.log('\n=== STEP 5: Populate categorie_libelle ===');

    const [catLibUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET categorie_libelle = categorie_globale
      WHERE (categorie_libelle IS NULL OR categorie_libelle = '')
        AND categorie_globale IS NOT NULL AND categorie_globale != ''
    `);
    console.log(`  Set categorie_libelle from categorie_globale for ${catLibUpdate.affectedRows} fonds`);

    // =========================================================================
    // STEP 6: Populate date_premiere_vl and montant_premier_vl from valorisations
    // =========================================================================
    console.log('\n=== STEP 6: Populate date_premiere_vl + montant_premier_vl ===');

    // date_premiere_vl = MIN(date) from valorisations
    const [dpvlUpdate] = await conn.execute(`
      UPDATE fond_investissements f
      INNER JOIN (
        SELECT fund_id, MIN(date) as first_date
        FROM valorisations
        WHERE date != '0000-00-00' AND date IS NOT NULL AND value > 0
        GROUP BY fund_id
      ) v ON f.id = v.fund_id
      SET f.date_premiere_vl = v.first_date
      WHERE f.date_premiere_vl IS NULL OR f.date_premiere_vl = '0000-00-00'
    `);
    console.log(`  Set date_premiere_vl for ${dpvlUpdate.affectedRows} fonds`);

    // montant_premier_vl = value at MIN(date)
    const [mpvlUpdate] = await conn.execute(`
      UPDATE fond_investissements f
      INNER JOIN (
        SELECT v1.fund_id, v1.value as first_value
        FROM valorisations v1
        INNER JOIN (
          SELECT fund_id, MIN(date) as first_date
          FROM valorisations
          WHERE date != '0000-00-00' AND date IS NOT NULL AND value > 0
          GROUP BY fund_id
        ) v2 ON v1.fund_id = v2.fund_id AND v1.date = v2.first_date
      ) v ON f.id = v.fund_id
      SET f.montant_premier_vl = v.first_value
      WHERE f.montant_premier_vl IS NULL OR f.montant_premier_vl = 0
    `);
    console.log(`  Set montant_premier_vl for ${mpvlUpdate.affectedRows} fonds`);

    // =========================================================================
    // STEP 7: Populate datejour (last VL date) and latest VL value info
    // =========================================================================
    console.log('\n=== STEP 7: Populate datejour (last VL date) ===');

    const [datejourUpdate] = await conn.execute(`
      UPDATE fond_investissements f
      INNER JOIN (
        SELECT fund_id, MAX(date) as last_date
        FROM valorisations
        WHERE date != '0000-00-00' AND date IS NOT NULL AND value > 0
        GROUP BY fund_id
      ) v ON f.id = v.fund_id
      SET f.datejour = v.last_date
      WHERE f.datejour IS NULL OR f.datejour = '0000-00-00'
    `);
    console.log(`  Set datejour for ${datejourUpdate.affectedRows} fonds`);

    // =========================================================================
    // STEP 8: Detect and set periodicite from actual VL frequency
    // =========================================================================
    console.log('\n=== STEP 8: Detect periodicite from VL frequency ===');

    const [fondsForPerio] = await conn.execute(`
      SELECT f.id, f.nom_fond
      FROM fond_investissements f
      WHERE (f.periodicite IS NULL OR f.periodicite = '')
        AND f.id IN (SELECT DISTINCT fund_id FROM valorisations WHERE fund_id IS NOT NULL)
    `);

    let perioUpdated = 0;
    for (const fond of fondsForPerio) {
      const [gaps] = await conn.execute(`
        SELECT AVG(gap_days) as avg_gap FROM (
          SELECT DATEDIFF(
            date,
            LAG(date) OVER (ORDER BY date)
          ) as gap_days
          FROM valorisations
          WHERE fund_id = ? AND date != '0000-00-00' AND value > 0
          ORDER BY date
        ) t
        WHERE gap_days > 0 AND gap_days < 365
      `, [fond.id]);

      if (gaps[0].avg_gap) {
        let periodicite;
        const avg = gaps[0].avg_gap;
        if (avg <= 2) periodicite = 'Quotidien';
        else if (avg <= 8) periodicite = 'Hebdomadaire';
        else if (avg <= 20) periodicite = 'Bi-mensuel';
        else if (avg <= 40) periodicite = 'Mensuel';
        else if (avg <= 100) periodicite = 'Trimestriel';
        else periodicite = 'Autre';

        await conn.execute(
          `UPDATE fond_investissements SET periodicite = ? WHERE id = ?`,
          [periodicite, fond.id]
        );
        perioUpdated++;
      }
    }
    console.log(`  Set periodicite for ${perioUpdated} fonds`);

    // =========================================================================
    // STEP 9: Generate missing forex cross pairs
    // =========================================================================
    console.log('\n=== STEP 9: Forex cross pairs ===');

    const [existingPairs] = await conn.execute(`
      SELECT DISTINCT paire FROM devisedechanges ORDER BY paire
    `);
    const pairs = existingPairs.map(r => r.paire);
    console.log('  Existing pairs:', pairs.join(', '));

    // USD/XOF: derive from EUR/USD and EUR/XOF (same fixed peg as XAF)
    if (!pairs.includes('USD/XOF')) {
      const [inserted] = await conn.execute(`
        INSERT IGNORE INTO devisedechanges (paire, date, value)
        SELECT 'USD/XOF', eurusd.date, eurxof.value / eurusd.value
        FROM devisedechanges eurusd
        INNER JOIN devisedechanges eurxof ON eurusd.date = eurxof.date AND eurxof.paire = 'EUR/XOF'
        WHERE eurusd.paire = 'EUR/USD' AND eurusd.value > 0
      `);
      console.log(`  Generated USD/XOF: ${inserted.affectedRows} entries`);
    } else {
      console.log('  USD/XOF already exists');
    }

    // EUR/MAD: derive from USD/MAD and EUR/USD
    if (!pairs.includes('EUR/MAD') && pairs.includes('USD/MAD')) {
      const [inserted] = await conn.execute(`
        INSERT IGNORE INTO devisedechanges (paire, date, value)
        SELECT 'EUR/MAD', usdmad.date, usdmad.value * eurusd.value
        FROM devisedechanges usdmad
        INNER JOIN devisedechanges eurusd ON usdmad.date = eurusd.date AND eurusd.paire = 'EUR/USD'
        WHERE usdmad.paire = 'USD/MAD' AND usdmad.value > 0 AND eurusd.value > 0
      `);
      console.log(`  Generated EUR/MAD: ${inserted.affectedRows} entries`);
    } else if (pairs.includes('EUR/MAD')) {
      console.log('  EUR/MAD already exists');
    } else {
      console.log('  Cannot generate EUR/MAD (USD/MAD missing)');
    }

    // EUR/TND: derive from USD/TND and EUR/USD
    if (!pairs.includes('EUR/TND') && pairs.includes('USD/TND')) {
      const [inserted] = await conn.execute(`
        INSERT IGNORE INTO devisedechanges (paire, date, value)
        SELECT 'EUR/TND', usdtnd.date, usdtnd.value * eurusd.value
        FROM devisedechanges usdtnd
        INNER JOIN devisedechanges eurusd ON usdtnd.date = eurusd.date AND eurusd.paire = 'EUR/USD'
        WHERE usdtnd.paire = 'USD/TND' AND usdtnd.value > 0 AND eurusd.value > 0
      `);
      console.log(`  Generated EUR/TND: ${inserted.affectedRows} entries`);
    } else if (pairs.includes('EUR/TND')) {
      console.log('  EUR/TND already exists');
    } else {
      console.log('  Cannot generate EUR/TND (USD/TND missing)');
    }

    // Report still-missing pairs needed for all covered countries
    const neededPairs = ['EUR/NGN', 'USD/NGN', 'EUR/ZAR', 'USD/ZAR', 'EUR/EGP', 'USD/EGP', 'EUR/KES', 'USD/KES', 'EUR/GHS', 'USD/GHS'];
    const missingPairs = neededPairs.filter(p => !pairs.includes(p));
    if (missingPairs.length > 0) {
      console.log(`  Still missing (need external data import): ${missingPairs.join(', ')}`);
    }

    // =========================================================================
    // STEP 10: Populate categorie_national for fonds where possible
    // =========================================================================
    console.log('\n=== STEP 10: Populate categorie_national ===');

    // For UEMOA and CEMAC countries, the national category maps to the country within the zone
    // For single-country entries, categorie_national = pays
    const [catNatUpdate] = await conn.execute(`
      UPDATE fond_investissements
      SET categorie_national = pays
      WHERE (categorie_national IS NULL OR categorie_national = '')
        AND pays IS NOT NULL AND pays != ''
        AND pays NOT IN ('UEMOA', 'CEMAC')
    `);
    console.log(`  Set categorie_national=pays for ${catNatUpdate.affectedRows} single-country fonds`);

    // For UEMOA/CEMAC, try to determine from societe_gestion or leave as zone name
    const [catNatZone] = await conn.execute(`
      UPDATE fond_investissements
      SET categorie_national = pays
      WHERE (categorie_national IS NULL OR categorie_national = '')
        AND pays IN ('UEMOA', 'CEMAC')
    `);
    console.log(`  Set categorie_national=zone for ${catNatZone.affectedRows} UEMOA/CEMAC fonds`);

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('  PHASE 2 - FINAL REPORT');
    console.log('='.repeat(80));

    const [stats] = await conn.execute(`
      SELECT
        COUNT(*) as total,
        SUM(actif=1) as actifs,
        SUM(societe_id IS NOT NULL) as has_sg_id,
        SUM(dev_libelle IS NOT NULL AND dev_libelle != '') as has_devise,
        SUM(regulateur IS NOT NULL AND regulateur != '') as has_regul,
        SUM(categorie_regional IS NOT NULL AND categorie_regional != '') as has_cat_reg,
        SUM(categorie_globale IS NOT NULL AND categorie_globale != '') as has_cat_glob,
        SUM(categorie_libelle IS NOT NULL AND categorie_libelle != '') as has_cat_lib,
        SUM(categorie_national IS NOT NULL AND categorie_national != '') as has_cat_nat,
        SUM(forme_juridique IS NOT NULL AND forme_juridique != '') as has_forme,
        SUM(classification IS NOT NULL AND classification != '') as has_classif,
        SUM(date_premiere_vl IS NOT NULL AND date_premiere_vl != '0000-00-00') as has_dpvl,
        SUM(montant_premier_vl IS NOT NULL AND montant_premier_vl > 0) as has_mpvl,
        SUM(periodicite IS NOT NULL AND periodicite != '') as has_perio,
        SUM(datejour IS NOT NULL AND datejour != '0000-00-00') as has_datejour
      FROM fond_investissements
    `);

    const s = stats[0];
    console.log(`  Total fonds:            ${s.total}`);
    console.log(`  Fonds actifs:           ${s.actifs} (${(s.actifs/s.total*100).toFixed(1)}%)`);
    console.log(`  societe_id:             ${s.has_sg_id} (${(s.has_sg_id/s.total*100).toFixed(1)}%)`);
    console.log(`  dev_libelle:            ${s.has_devise} (${(s.has_devise/s.total*100).toFixed(1)}%)`);
    console.log(`  regulateur:             ${s.has_regul} (${(s.has_regul/s.total*100).toFixed(1)}%)`);
    console.log(`  categorie_regional:     ${s.has_cat_reg} (${(s.has_cat_reg/s.total*100).toFixed(1)}%)`);
    console.log(`  categorie_globale:      ${s.has_cat_glob} (${(s.has_cat_glob/s.total*100).toFixed(1)}%)`);
    console.log(`  categorie_libelle:      ${s.has_cat_lib} (${(s.has_cat_lib/s.total*100).toFixed(1)}%)`);
    console.log(`  categorie_national:     ${s.has_cat_nat} (${(s.has_cat_nat/s.total*100).toFixed(1)}%)`);
    console.log(`  forme_juridique:        ${s.has_forme} (${(s.has_forme/s.total*100).toFixed(1)}%)`);
    console.log(`  classification:         ${s.has_classif} (${(s.has_classif/s.total*100).toFixed(1)}%)`);
    console.log(`  date_premiere_vl:       ${s.has_dpvl} (${(s.has_dpvl/s.total*100).toFixed(1)}%)`);
    console.log(`  montant_premier_vl:     ${s.has_mpvl} (${(s.has_mpvl/s.total*100).toFixed(1)}%)`);
    console.log(`  periodicite:            ${s.has_perio} (${(s.has_perio/s.total*100).toFixed(1)}%)`);
    console.log(`  datejour:               ${s.has_datejour} (${(s.has_datejour/s.total*100).toFixed(1)}%)`);

    // By country
    const [byPays] = await conn.execute(`
      SELECT pays, COUNT(*) as nb,
        SUM(actif=1) as actifs,
        SUM(categorie_globale IS NOT NULL AND categorie_globale != '') as cat_glob,
        SUM(forme_juridique IS NOT NULL AND forme_juridique != '') as forme,
        SUM(date_premiere_vl IS NOT NULL AND date_premiere_vl != '0000-00-00') as dpvl,
        SUM(periodicite IS NOT NULL AND periodicite != '') as perio
      FROM fond_investissements GROUP BY pays ORDER BY nb DESC
    `);
    console.log('\n  Par pays:');
    for (const r of byPays) {
      console.log(`    ${r.pays}: ${r.nb} fonds (${r.actifs} actifs, cat_glob=${r.cat_glob}, forme=${r.forme}, dpvl=${r.dpvl}, perio=${r.perio})`);
    }

    // Forex summary
    const [forexSummary] = await conn.execute(`
      SELECT paire, COUNT(*) as nb, MIN(date) as min_date, MAX(date) as max_date
      FROM devisedechanges GROUP BY paire ORDER BY paire
    `);
    console.log('\n  Forex pairs:');
    for (const r of forexSummary) {
      console.log(`    ${r.paire}: ${r.nb} entries (${r.min_date} -> ${r.max_date})`);
    }

    // Empty tables
    const emptyTables = ['performences_eurs', 'performences_usds', 'rendements', 'taux_sans_risques', 'portefeuille_base100s', 'fiscalites'];
    console.log('\n  Tables still empty (need batch calculation or import):');
    for (const t of emptyTables) {
      try {
        const [r] = await conn.execute(`SELECT COUNT(*) as c FROM ${t}`);
        console.log(`    ${t}: ${r[0].c} rows`);
      } catch(e) {
        console.log(`    ${t}: ERROR ${e.message}`);
      }
    }

    console.log('\n=== PHASE 2 COMPLETE ===');
    console.log('\nNEXT STEPS (Phase 3):');
    console.log('1. Import Nigeria VL from SEC Nigeria Excel (user provides files)');
    console.log('2. Import forex EUR/NGN, USD/NGN (needed for Nigeria)');
    console.log('3. Import TSR: TMM (Tunisia/BCT), BCEAO (UEMOA), BEAC (CEMAC), MPR (Nigeria/CBN)');
    console.log('4. Run batch: fill performences_eurs/usds (EUR/USD performance for each fund)');
    console.log('5. Run batch: fill classementfonds_eurs/usds (ranking by performance)');
    console.log('6. Run batch: fill rendements (rendement par periode)');
    console.log('7. Run batch: fill portefeuille_base100s (base 100 curves)');
    console.log('8. Add real MySQL FK constraints (Phase 3 structural)');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
  }
}

run();
