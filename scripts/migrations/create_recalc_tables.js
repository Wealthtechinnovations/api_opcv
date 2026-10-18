#!/usr/bin/env node
/**
 * create_recalc_tables.js
 *
 * Cree les tables du moteur de recalcul historique :
 *   - recalc_events    (event log metier)
 *   - recalc_jobs      (file d'attente de recalcul)
 *   - recalc_dependencies (graphe de dependances)
 *   - recalc_audit     (audit complet)
 *
 * Ces tables sont ADDITIVES — aucune table existante n'est modifiee.
 *
 * Usage:
 *   node scripts/migrations/create_recalc_tables.js              # diagnostic
 *   node scripts/migrations/create_recalc_tables.js --execute    # creation
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const EXECUTE = process.argv.includes('--execute');

const TABLES = [
  {
    name: 'recalc_events',
    sql: `CREATE TABLE IF NOT EXISTS recalc_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL COMMENT 'VL_INSERT, VL_UPDATE, VL_DELETE, DIVIDEND_INSERT, DIVIDEND_UPDATE, FX_UPDATE, CATEGORY_CHANGE, INDEX_UPDATE, FUND_MERGE, BENCHMARK_CHANGE, FULL_REBUILD',
  fond_id INT NULL COMMENT 'NULL si evenement global (ex: FX_UPDATE pour toutes les devises)',
  impact_date DATE NOT NULL COMMENT 'Date a partir de laquelle recalculer',
  impact_end_date DATE NULL COMMENT 'Date de fin si intervalle (NULL = jusqu a aujourd hui)',
  description VARCHAR(500) NULL,
  triggered_by VARCHAR(100) NOT NULL COMMENT 'cron_daily, admin_manual, import_asfim, import_nigeria, script_fix, api_route',
  metadata JSON NULL COMMENT 'Donnees supplementaires (ancien/nouveau valeur, devise, pays, etc.)',
  status ENUM('NEW','PROPAGATED','COMPLETED','FAILED') DEFAULT 'NEW',
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_recalc_events_date (impact_date),
  INDEX idx_recalc_events_fund (fond_id),
  INDEX idx_recalc_events_status (status),
  INDEX idx_recalc_events_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Event log metier — trace chaque modification de donnee source'`,
  },
  {
    name: 'recalc_jobs',
    sql: `CREATE TABLE IF NOT EXISTS recalc_jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NULL COMMENT 'FK vers recalc_events (NULL si job manuel)',
  job_type VARCHAR(50) NOT NULL COMMENT 'VL_AJUSTE, RENDEMENTS, PERF_LOCALE, PERF_EUR, PERF_USD, CLASSEMENT_LOCAL, CLASSEMENT_EUR, CLASSEMENT_USD, RATIOS, FX_CONVERSION, INDREF, FULL_REBUILD',
  fond_id INT NULL COMMENT 'NULL si job global (ex: CLASSEMENT concerne tous les fonds d une categorie)',
  categorie VARCHAR(200) NULL COMMENT 'Categorie concernee (pour classements)',
  date_from DATE NOT NULL COMMENT 'Recalculer depuis cette date',
  date_to DATE NULL COMMENT 'Jusqu a cette date (NULL = aujourd hui)',
  status ENUM('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING',
  priority TINYINT DEFAULT 5 COMMENT '1=urgent, 5=normal, 9=low',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  error_message TEXT NULL,
  rows_affected INT DEFAULT 0,
  execution_time_ms INT NULL COMMENT 'Duree d execution en millisecondes',
  locked_by VARCHAR(100) NULL COMMENT 'Identifiant du worker qui traite ce job',
  locked_at DATETIME NULL,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_recalc_jobs_status (status, priority, created_at),
  INDEX idx_recalc_jobs_fund (fond_id),
  INDEX idx_recalc_jobs_event (event_id),
  INDEX idx_recalc_jobs_type (job_type),
  INDEX idx_recalc_jobs_locked (locked_by, locked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'File d attente de recalcul — chaque job = une etape de recalcul'`,
  },
  {
    name: 'recalc_dependencies',
    sql: `CREATE TABLE IF NOT EXISTS recalc_dependencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_job_type VARCHAR(50) NOT NULL COMMENT 'Le type de job qui declenche',
  target_job_type VARCHAR(50) NOT NULL COMMENT 'Le type de job qui doit etre cree apres',
  description VARCHAR(200) NULL,
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT NOW(),
  UNIQUE KEY uk_dep (source_job_type, target_job_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Graphe de dependances entre types de recalcul'`,
  },
  {
    name: 'recalc_audit',
    sql: `CREATE TABLE IF NOT EXISTS recalc_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT NOT NULL COMMENT 'FK vers recalc_jobs',
  fond_id INT NULL,
  action VARCHAR(100) NOT NULL COMMENT 'Description courte de l action',
  detail TEXT NULL COMMENT 'Detail long (SQL execute, parametres, etc.)',
  rows_affected INT DEFAULT 0,
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_recalc_audit_job (job_id),
  INDEX idx_recalc_audit_fund (fond_id),
  INDEX idx_recalc_audit_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Audit complet des recalculs — trace chaque operation'`,
  },
];

const SEED_DEPENDENCIES = [
  ['VL_INSERT', 'VL_AJUSTE', 'Nouvelle VL → recalcul VL ajustee'],
  ['VL_UPDATE', 'VL_AJUSTE', 'Correction VL → recalcul VL ajustee'],
  ['VL_DELETE', 'VL_AJUSTE', 'Suppression VL → recalcul VL ajustee'],
  ['VL_AJUSTE', 'FX_CONVERSION', 'VL ajustee → conversion EUR/USD'],
  ['VL_AJUSTE', 'RENDEMENTS', 'VL ajustee → rendements journaliers'],
  ['FX_CONVERSION', 'PERF_EUR', 'Conversion EUR → performances EUR'],
  ['FX_CONVERSION', 'PERF_USD', 'Conversion USD → performances USD'],
  ['RENDEMENTS', 'PERF_LOCALE', 'Rendements → performances locale'],
  ['PERF_LOCALE', 'CLASSEMENT_LOCAL', 'Perf locale → classements locaux'],
  ['PERF_LOCALE', 'RATIOS', 'Perf locale → ratios de risque'],
  ['PERF_EUR', 'CLASSEMENT_EUR', 'Perf EUR → classements EUR'],
  ['PERF_USD', 'CLASSEMENT_USD', 'Perf USD → classements USD'],
  ['DIVIDEND_INSERT', 'VL_AJUSTE', 'Nouveau dividende → recalcul VL ajustee'],
  ['DIVIDEND_UPDATE', 'VL_AJUSTE', 'Correction dividende → recalcul VL ajustee'],
  ['FX_UPDATE', 'FX_CONVERSION', 'MAJ taux de change → reconversion EUR/USD'],
  ['CATEGORY_CHANGE', 'CLASSEMENT_LOCAL', 'Changement categorie → reclassement'],
  ['CATEGORY_CHANGE', 'CLASSEMENT_EUR', 'Changement categorie → reclassement EUR'],
  ['CATEGORY_CHANGE', 'CLASSEMENT_USD', 'Changement categorie → reclassement USD'],
  ['INDEX_UPDATE', 'INDREF', 'MAJ indice → recalcul indRef dans valorisations'],
  ['BENCHMARK_CHANGE', 'INDREF', 'Changement benchmark → recalcul indRef'],
];

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm');
  console.log(EXECUTE ? 'MODE: EXECUTE\n' : 'MODE: DIAGNOSTIC\n');

  // Verifier existence des tables
  const [existing] = await conn.query(`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'fund_opcvm' AND TABLE_NAME LIKE 'recalc_%'
  `);
  const existingNames = existing.map(r => r.TABLE_NAME);
  console.log(`Tables recalc existantes: ${existingNames.length > 0 ? existingNames.join(', ') : 'aucune'}\n`);

  for (const table of TABLES) {
    if (existingNames.includes(table.name)) {
      console.log(`[SKIP] ${table.name} — existe deja`);
    } else if (EXECUTE) {
      await conn.query(table.sql);
      console.log(`[CREE] ${table.name}`);
    } else {
      console.log(`[A CREER] ${table.name}`);
    }
  }

  // Seed dependencies
  if (EXECUTE) {
    console.log('\nSeed des dependances...');
    let inserted = 0;
    for (const [src, tgt, desc] of SEED_DEPENDENCIES) {
      try {
        await conn.query(
          `INSERT IGNORE INTO recalc_dependencies (source_job_type, target_job_type, description) VALUES (?, ?, ?)`,
          [src, tgt, desc]
        );
        inserted++;
      } catch (e) {
        // IGNORE (doublon)
      }
    }
    console.log(`${inserted} dependances inserees (${SEED_DEPENDENCIES.length} total, doublons ignores)`);
  } else {
    console.log(`\n${SEED_DEPENDENCIES.length} dependances a inserer`);
  }

  // Resume
  if (!EXECUTE) {
    console.log('\n(Mode diagnostic — ajouter --execute pour creer les tables.)');
  }

  // Verification finale
  if (EXECUTE) {
    const [tables] = await conn.query(`
      SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'fund_opcvm' AND TABLE_NAME LIKE 'recalc_%'
    `);
    console.log('\nTables recalc apres creation:');
    for (const t of tables) {
      console.log(`  ${t.TABLE_NAME}: ~${t.TABLE_ROWS} lignes`);
    }
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => { console.error('ERREUR:', e); process.exit(1); });
