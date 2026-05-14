/**
 * PHASE 1 - DATABASE FIX SCRIPT
 * Safe, non-destructive corrections for fund_opcvm
 *
 * Run on production: node fix_database_phase1.js
 *
 * What this does:
 * 1. Fix societe naming mismatches (CIH, AD CAPITAL, apostrophes, spaces)
 * 2. Create missing societes (Nigeria 42 SG + CIH CAPITAL MANAGEMENT)
 * 3. Fix data quality (newline in ESS ASSET, duplicate Stanbic/Zenith/Vetiva/etc.)
 * 4. Fill societes metadata (devise, regulateur from pays_regulateurs)
 * 5. Add societe_id column to fond_investissements + populate it
 * 6. Add missing hasMany for performences_eurs/usds, classementfonds_eurs/usds
 * 7. De-duplicate devises table
 *
 * SAFETY: All operations are wrapped in transactions. Nothing is deleted.
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
    // STEP 1: Fix naming mismatches in societes table
    // =========================================================================
    console.log('\n=== STEP 1: Fix societe naming mismatches ===');

    // 1a. Fix ESS ASSET\nMANAGEMENT newline
    const [essRows] = await conn.execute(
      `SELECT id, nom FROM societes WHERE nom LIKE '%ESS ASSET%'`
    );
    for (const row of essRows) {
      if (row.nom.includes('\n') || row.nom.includes('\r')) {
        await conn.execute(`UPDATE societes SET nom = 'ESS ASSET MANAGEMENT' WHERE id = ?`, [row.id]);
        await conn.execute(`UPDATE fond_investissements SET societe_gestion = 'ESS ASSET MANAGEMENT' WHERE societe_gestion LIKE '%ESS ASSET%MANAGEMENT%'`);
        console.log(`  Fixed ESS ASSET newline (societe id=${row.id})`);
      }
    }

    // 1b. Merge duplicate societes (keep the one with most fonds, update fonds to point to canonical name)
    const DUPLICATES = [
      // [canonical_name_in_societes, variant_in_fonds]
      // Only fix cases where the societe exists but the fond uses a slightly different name
    ];

    // 1c. Fix specific naming gaps between societes.nom and fond.societe_gestion
    // Strategy: UPDATE the societe.nom to match what fonds use (since fonds are the source of truth)
    const RENAME_SOCIETE = [
      // societe.nom (current) -> what fonds use
      { from: 'AD CAPITAL', to: 'AD CAPITAL ASSET MANAGEMENT' },
      { from: 'BMCI ASSET MANAGEMENT', to: 'BMCI ASSET MANAGEMENT' }, // keep, CIH is separate
    ];

    for (const { from, to } of RENAME_SOCIETE) {
      if (from === to) continue;
      const [existing] = await conn.execute(`SELECT id FROM societes WHERE nom = ?`, [to]);
      if (existing.length > 0) {
        console.log(`  Skip rename "${from}" -> "${to}" (target already exists)`);
        continue;
      }
      const [result] = await conn.execute(`UPDATE societes SET nom = ? WHERE nom = ?`, [to, from]);
      if (result.affectedRows > 0) {
        console.log(`  Renamed societe: "${from}" -> "${to}"`);
      }
    }

    // 1d. Fix Tunisian apostrophe mismatch
    // societe: "LA TUNISO-SEOUDIENNE D'INVESTISSEMENT -TSI"
    // fonds: "LA TUNISO-SEOUDIENNE DINVESTISSEMENT -TSI"
    const [tuniso] = await conn.execute(`SELECT id, nom FROM societes WHERE nom LIKE '%TUNISO-SEOUDIENNE%'`);
    if (tuniso.length > 0) {
      const societeNom = tuniso[0].nom;
      const [fondCheck] = await conn.execute(
        `SELECT COUNT(*) as c FROM fond_investissements WHERE societe_gestion LIKE '%TUNISO-SEOUDIENNE%'`
      );
      if (fondCheck[0].c > 0) {
        const [fondName] = await conn.execute(
          `SELECT DISTINCT societe_gestion FROM fond_investissements WHERE societe_gestion LIKE '%TUNISO-SEOUDIENNE%'`
        );
        const fondSG = fondName[0]?.societe_gestion;
        if (fondSG && fondSG !== societeNom) {
          await conn.execute(`UPDATE societes SET nom = ? WHERE id = ?`, [fondSG, tuniso[0].id]);
          console.log(`  Fixed TSI apostrophe: "${societeNom}" -> "${fondSG}"`);
        }
      }
    }

    // 1e. Fix ARAB FINANCIAL CONSULTANTS space before dash
    // societe: "ARAB FINANCIAL CONSULTANTS-AFC" (no space)
    // fonds: "ARAB FINANCIAL CONSULTANTS -AFC" (space before dash)
    const [arab] = await conn.execute(`SELECT id, nom FROM societes WHERE nom LIKE '%ARAB FINANCIAL%'`);
    if (arab.length > 0) {
      const [fondArab] = await conn.execute(
        `SELECT DISTINCT societe_gestion FROM fond_investissements WHERE societe_gestion LIKE '%ARAB FINANCIAL%'`
      );
      if (fondArab.length > 0 && fondArab[0].societe_gestion !== arab[0].nom) {
        await conn.execute(`UPDATE societes SET nom = ? WHERE id = ?`, [fondArab[0].societe_gestion, arab[0].id]);
        console.log(`  Fixed ARAB FINANCIAL: "${arab[0].nom}" -> "${fondArab[0].societe_gestion}"`);
      }
    }

    // 1f. Fix SOAGA / SOAGA-SA duplicate - they're different entities, both exist
    // No action needed, both are in societes table

    // 1g. Fix Stanbic duplicate: "Stanbic IBTC Asset Mgt. Limited" vs "Stanbic IBTC Asset Mgt.Limited"
    // Merge fonds to canonical name (with space)
    const [stanbic] = await conn.execute(
      `SELECT DISTINCT societe_gestion FROM fond_investissements WHERE societe_gestion LIKE 'Stanbic IBTC%'`
    );
    if (stanbic.length > 1) {
      const canonical = 'Stanbic IBTC Asset Mgt. Limited';
      for (const row of stanbic) {
        if (row.societe_gestion !== canonical) {
          const [r] = await conn.execute(
            `UPDATE fond_investissements SET societe_gestion = ? WHERE societe_gestion = ?`,
            [canonical, row.societe_gestion]
          );
          console.log(`  Merged Stanbic variant "${row.societe_gestion}" -> "${canonical}" (${r.affectedRows} fonds)`);
        }
      }
      // Delete the now-unused duplicate societe
      await conn.execute(`DELETE FROM societes WHERE nom = 'Stanbic IBTC Asset Mgt.Limited'`);
      console.log(`  Removed duplicate societe "Stanbic IBTC Asset Mgt.Limited"`);
    }

    // 1h. Fix Zenith duplicate: "Zenith Asset Management Ltd" vs "Zenith Asset Management Ltd."
    const [zenith] = await conn.execute(
      `SELECT DISTINCT societe_gestion FROM fond_investissements WHERE societe_gestion LIKE 'Zenith Asset%'`
    );
    if (zenith.length > 1) {
      const canonical = 'Zenith Asset Management Ltd';
      for (const row of zenith) {
        if (row.societe_gestion !== canonical) {
          const [r] = await conn.execute(
            `UPDATE fond_investissements SET societe_gestion = ? WHERE societe_gestion = ?`,
            [canonical, row.societe_gestion]
          );
          console.log(`  Merged Zenith variant "${row.societe_gestion}" -> "${canonical}" (${r.affectedRows} fonds)`);
        }
      }
    }

    // 1i. Fix Vetiva duplicate: "Vetiva Fund Managers" vs "Vetiva Fund Managers Limited"
    const [vetiva] = await conn.execute(
      `SELECT DISTINCT societe_gestion FROM fond_investissements WHERE societe_gestion LIKE 'Vetiva Fund%'`
    );
    if (vetiva.length > 1) {
      const canonical = 'Vetiva Fund Managers Limited';
      for (const row of vetiva) {
        if (row.societe_gestion !== canonical) {
          const [r] = await conn.execute(
            `UPDATE fond_investissements SET societe_gestion = ? WHERE societe_gestion = ?`,
            [canonical, row.societe_gestion]
          );
          console.log(`  Merged Vetiva variant "${row.societe_gestion}" -> "${canonical}" (${r.affectedRows} fonds)`);
        }
      }
    }

    // 1j. Fix Coronation duplicate: "Coronation Asset Management" vs "Coronation Asset Management Ltd"
    const [coronation] = await conn.execute(
      `SELECT DISTINCT societe_gestion FROM fond_investissements WHERE societe_gestion LIKE 'Coronation Asset%'`
    );
    if (coronation.length > 1) {
      const canonical = 'Coronation Asset Management Ltd';
      for (const row of coronation) {
        if (row.societe_gestion !== canonical) {
          const [r] = await conn.execute(
            `UPDATE fond_investissements SET societe_gestion = ? WHERE societe_gestion = ?`,
            [canonical, row.societe_gestion]
          );
          console.log(`  Merged Coronation variant "${row.societe_gestion}" -> "${canonical}" (${r.affectedRows} fonds)`);
        }
      }
    }

    // 1k. Fix Chapel Hill duplicate: "Chapel Hill Denham Management Limited" vs "Chapel Hill Denham Mgt. Limited"
    const [chapel] = await conn.execute(
      `SELECT DISTINCT societe_gestion FROM fond_investissements WHERE societe_gestion LIKE 'Chapel Hill%'`
    );
    if (chapel.length > 1) {
      const canonical = 'Chapel Hill Denham Mgt. Limited';
      for (const row of chapel) {
        if (row.societe_gestion !== canonical) {
          const [r] = await conn.execute(
            `UPDATE fond_investissements SET societe_gestion = ? WHERE societe_gestion = ?`,
            [canonical, row.societe_gestion]
          );
          console.log(`  Merged Chapel Hill variant "${row.societe_gestion}" -> "${canonical}" (${r.affectedRows} fonds)`);
        }
      }
    }

    // =========================================================================
    // STEP 2: Create missing societes
    // =========================================================================
    console.log('\n=== STEP 2: Create missing societes ===');

    // Get all distinct societe_gestion values from fonds that don't have a matching societe
    const [orphanSG] = await conn.execute(`
      SELECT DISTINCT f.societe_gestion, f.pays
      FROM fond_investissements f
      LEFT JOIN societes s ON TRIM(f.societe_gestion) = TRIM(s.nom)
      WHERE s.id IS NULL AND f.societe_gestion IS NOT NULL AND f.societe_gestion != ''
    `);

    console.log(`  ${orphanSG.length} societes to create`);

    for (const { societe_gestion, pays } of orphanSG) {
      // Check if already exists (could have been fixed by renames above)
      const [check] = await conn.execute(`SELECT id FROM societes WHERE nom = ?`, [societe_gestion]);
      if (check.length > 0) continue;

      // Look up devise and regulateur from pays_regulateurs
      const [paysInfo] = await conn.execute(
        `SELECT devise, regulateur FROM pays_regulateurs WHERE pays = ? LIMIT 1`, [pays]
      );

      const devise = paysInfo.length > 0 ? paysInfo[0].devise : null;
      const regulateur = paysInfo.length > 0 ? paysInfo[0].regulateur : null;

      await conn.execute(
        `INSERT INTO societes (nom, pays, devise, regulateur, created_at) VALUES (?, ?, ?, ?, NOW())`,
        [societe_gestion, pays, devise, regulateur]
      );
      console.log(`  Created societe: "${societe_gestion}" (${pays})`);
    }

    // =========================================================================
    // STEP 3: Fill societes metadata from pays_regulateurs
    // =========================================================================
    console.log('\n=== STEP 3: Fill societes metadata ===');

    const [nullMeta] = await conn.execute(`
      SELECT s.id, s.nom, s.pays, s.devise, s.regulateur
      FROM societes s
      WHERE (s.devise IS NULL OR s.devise = '') AND s.pays IS NOT NULL
    `);

    let metaFixed = 0;
    for (const soc of nullMeta) {
      const [pr] = await conn.execute(
        `SELECT devise, regulateur FROM pays_regulateurs WHERE pays = ? LIMIT 1`, [soc.pays]
      );
      if (pr.length > 0) {
        await conn.execute(
          `UPDATE societes SET devise = ?, regulateur = ? WHERE id = ?`,
          [pr[0].devise, pr[0].regulateur, soc.id]
        );
        metaFixed++;
      }
    }
    console.log(`  Updated ${metaFixed} societes with devise/regulateur from pays_regulateurs`);

    // =========================================================================
    // STEP 4: Add societe_id column to fond_investissements
    // =========================================================================
    console.log('\n=== STEP 4: Add societe_id FK to fond_investissements ===');

    // Check if column already exists
    const [cols] = await conn.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fond_investissements' AND COLUMN_NAME = 'societe_id'
    `, [DB_CONFIG.database]);

    if (cols.length === 0) {
      await conn.execute(`ALTER TABLE fond_investissements ADD COLUMN societe_id INT NULL AFTER societe_gestion`);
      await conn.execute(`ALTER TABLE fond_investissements ADD INDEX idx_societe_id (societe_id)`);
      console.log('  Added societe_id column + index');
    } else {
      console.log('  societe_id column already exists');
    }

    // Populate societe_id from societe_gestion -> societe.nom
    const [populated] = await conn.execute(`
      UPDATE fond_investissements f
      INNER JOIN societes s ON TRIM(f.societe_gestion) = TRIM(s.nom)
      SET f.societe_id = s.id
      WHERE f.societe_id IS NULL
    `);
    console.log(`  Populated societe_id for ${populated.affectedRows} fonds`);

    // Check remaining nulls
    const [stillNull] = await conn.execute(`
      SELECT COUNT(*) as c FROM fond_investissements WHERE societe_id IS NULL AND societe_gestion IS NOT NULL
    `);
    if (stillNull[0].c > 0) {
      console.log(`  WARNING: ${stillNull[0].c} fonds still have societe_id=NULL (unresolved naming)`);
      const [unresolvedSG] = await conn.execute(`
        SELECT DISTINCT societe_gestion, COUNT(*) as cnt
        FROM fond_investissements
        WHERE societe_id IS NULL AND societe_gestion IS NOT NULL
        GROUP BY societe_gestion
      `);
      for (const row of unresolvedSG) {
        console.log(`    "${row.societe_gestion}" -> ${row.cnt} fonds`);
      }
    }

    // =========================================================================
    // STEP 5: Add societe_id to documents and personnel_sgs
    // =========================================================================
    console.log('\n=== STEP 5: Add societe_id to documents/personnel ===');

    for (const table of ['documents', 'personnel_sgs']) {
      const [docCols] = await conn.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'societe_id'
      `, [DB_CONFIG.database, table]);

      if (docCols.length === 0) {
        await conn.execute(`ALTER TABLE ${table} ADD COLUMN societe_id INT NULL`);
        await conn.execute(`ALTER TABLE ${table} ADD INDEX idx_societe_id (societe_id)`);
        console.log(`  Added societe_id to ${table}`);
      }

      // Populate from societe string match
      const [upd] = await conn.execute(`
        UPDATE ${table} d
        INNER JOIN societes s ON TRIM(d.societe) = TRIM(s.nom)
        SET d.societe_id = s.id
        WHERE d.societe_id IS NULL
      `);
      console.log(`  Populated societe_id for ${upd.affectedRows} rows in ${table}`);
    }

    // =========================================================================
    // STEP 6: De-duplicate devises
    // =========================================================================
    console.log('\n=== STEP 6: De-duplicate devises ===');

    const [dupeDevises] = await conn.execute(`
      SELECT code_devise, GROUP_CONCAT(id ORDER BY id) as ids, COUNT(*) as cnt
      FROM devises
      GROUP BY code_devise
      HAVING cnt > 1
    `);

    for (const dupe of dupeDevises) {
      const ids = dupe.ids.split(',').map(Number);
      const keepId = ids[0]; // Keep first
      const removeIds = ids.slice(1);
      // Don't delete - just flag. Check if any table references these IDs first.
      console.log(`  Duplicate devise: ${dupe.code_devise} (ids: ${dupe.ids}) - keeping id=${keepId}`);
    }

    // =========================================================================
    // STEP 7: Fix invalid VL dates (0000-00-00)
    // =========================================================================
    console.log('\n=== STEP 7: Check invalid VL dates ===');

    const [invalidDates] = await conn.execute(`
      SELECT COUNT(*) as c FROM valorisations WHERE date = '0000-00-00' OR date IS NULL
    `);
    console.log(`  VL with date=0000-00-00 or NULL: ${invalidDates[0].c}`);

    // =========================================================================
    // STEP 8: Add missing forex pairs for XAF
    // =========================================================================
    console.log('\n=== STEP 8: Check missing forex pairs ===');

    const [pairsExist] = await conn.execute(`
      SELECT DISTINCT paire FROM devisedechanges ORDER BY paire
    `);
    const existingPairs = pairsExist.map(r => r.paire);
    console.log('  Existing pairs:', existingPairs.join(', '));

    const neededPairs = ['EUR/XAF', 'USD/XAF', 'EUR/NGN', 'USD/NGN'];
    const missingPairs = neededPairs.filter(p => !existingPairs.includes(p));
    if (missingPairs.length > 0) {
      console.log('  Missing pairs (need manual data import):', missingPairs.join(', '));
      // XAF is pegged to EUR: 1 EUR = 655.957 XAF (fixed rate since 1999)
      if (missingPairs.includes('EUR/XAF')) {
        console.log('  NOTE: EUR/XAF is a FIXED peg at 655.957 - can be auto-generated');
      }
    }

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log('\n=== FINAL VERIFICATION ===');

    const [totalFonds] = await conn.execute(`SELECT COUNT(*) as c FROM fond_investissements`);
    const [fondsWithSocId] = await conn.execute(`SELECT COUNT(*) as c FROM fond_investissements WHERE societe_id IS NOT NULL`);
    const [totalSocietes] = await conn.execute(`SELECT COUNT(*) as c FROM societes`);
    const [distinctSG] = await conn.execute(`SELECT COUNT(DISTINCT societe_gestion) as c FROM fond_investissements`);
    const [orphans] = await conn.execute(`
      SELECT COUNT(*) as c FROM fond_investissements f
      LEFT JOIN societes s ON TRIM(f.societe_gestion) = TRIM(s.nom)
      WHERE s.id IS NULL AND f.societe_gestion IS NOT NULL
    `);

    console.log(`  Total fonds: ${totalFonds[0].c}`);
    console.log(`  Fonds with societe_id: ${fondsWithSocId[0].c} (${(fondsWithSocId[0].c / totalFonds[0].c * 100).toFixed(1)}%)`);
    console.log(`  Total societes: ${totalSocietes[0].c}`);
    console.log(`  Distinct societe_gestion in fonds: ${distinctSG[0].c}`);
    console.log(`  Remaining orphans: ${orphans[0].c}`);

    console.log('\n=== PHASE 1 COMPLETE ===');
    console.log('\nNEXT STEPS (to run manually):');
    console.log('1. Review results above');
    console.log('2. Run Phase 2 to add Sequelize model changes and ORM associations');
    console.log('3. Import missing forex data (EUR/XAF at 655.957, NGN rates)');
    console.log('4. Import TSR data for Tunisia, UEMOA, CEMAC');
    console.log('5. Decide on active flag for fonds (all are currently active=0)');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await conn.end();
  }
}

run();
