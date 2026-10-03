/**
 * fix_static_data.js — Populate missing static data in fond_investissements
 *
 * Successor to fix_database_phase2.js. More focused: only fills empty/null
 * fields, never overwrites existing correct data.
 *
 * Steps:
 *   1. structure_fond   (FCP/SICAV/OPCVM/Mutual Fund from nom_fond / pays)
 *   2. categorie_globale (ACTIONS/OBLIGATIONS/MONETAIRE/DIVERSIFIE/... from classification/categorie)
 *   3. date_premiere_vl + montant_premier_vl (from valorisations MIN date)
 *   4. periodicite       (Quotidien/Hebdomadaire/Mensuel from VL gap analysis)
 *   5. datejour           (date de derniere VL, always refresh if stale)
 *   6. montant_actif_net  (derniere actif_net connue from valorisations)
 *   7. Verification summary
 *
 * Usage:
 *   node fix_static_data.js            # apply changes
 *   node fix_static_data.js --dry-run  # preview only, no writes
 */

require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

const DRY_RUN = process.argv.includes('--dry-run');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'fund_opcvm',
  process.env.DB_USER || 'fund_opcvm',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function execUpdate(sql, replacements = {}) {
  if (DRY_RUN) {
    // For dry-run, convert UPDATE to SELECT COUNT(*) with same WHERE
    // We run the query as-is but wrapped in a transaction we roll back.
    const tx = await sequelize.transaction();
    try {
      const [, meta] = await sequelize.query(sql, { replacements, transaction: tx });
      const affected = meta ? (meta.affectedRows ?? meta) : 0;
      await tx.rollback();
      return typeof affected === 'number' ? affected : 0;
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  }
  const [, meta] = await sequelize.query(sql, { replacements });
  return meta ? (meta.affectedRows ?? meta) : 0;
}

async function selectAll(sql, replacements = {}) {
  return sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
}

function banner(step, title) {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`  STEP ${step}: ${title}`);
  console.log('='.repeat(72));
}

// ---------------------------------------------------------------------------
// STEP 1: structure_fond
// ---------------------------------------------------------------------------
async function step1_structureFond() {
  banner(1, 'structure_fond (FCP / SICAV / OPCVM / Mutual Fund)');

  const prefixes = [
    { label: 'FCP',   like: ["nom_fond LIKE 'FCP %'", "nom_fond LIKE 'FCP-%'"] },
    { label: 'SICAV', like: ["nom_fond LIKE 'SICAV %'", "nom_fond LIKE 'SICAV-%'"] },
    { label: 'FCPR',  like: ["nom_fond LIKE 'FCPR %'", "nom_fond LIKE 'FCPR-%'"] },
    { label: 'FCPE',  like: ["nom_fond LIKE 'FCPE %'", "nom_fond LIKE 'FCPE-%'"] },
    { label: 'ETF',   like: ["nom_fond LIKE 'ETF %'", "nom_fond LIKE 'ETF-%'", "nom_fond LIKE '%ETF'"] },
    { label: 'OPCVM', like: ["nom_fond LIKE 'OPCVM %'", "nom_fond LIKE 'OPCVM-%'"] },
  ];

  let totalUpdated = 0;

  for (const { label, like } of prefixes) {
    const whereClause = like.join(' OR ');
    const n = await execUpdate(`
      UPDATE fond_investissements
      SET structure_fond = '${label}'
      WHERE (structure_fond IS NULL OR structure_fond = '')
        AND (${whereClause})
    `);
    if (n > 0) console.log(`  ${label}: ${n} funds updated`);
    totalUpdated += n;
  }

  // For Nigeria / Ghana / Kenya / South Africa / Egypt: default to "Mutual Fund"
  const anglophoneCountries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt'];
  for (const pays of anglophoneCountries) {
    const n = await execUpdate(`
      UPDATE fond_investissements
      SET structure_fond = 'Mutual Fund'
      WHERE (structure_fond IS NULL OR structure_fond = '')
        AND pays = :pays
    `, { pays });
    if (n > 0) console.log(`  Mutual Fund (${pays}): ${n} funds updated`);
    totalUpdated += n;
  }

  // Report remaining
  const [remaining] = await selectAll(`
    SELECT COUNT(*) as c FROM fond_investissements
    WHERE structure_fond IS NULL OR structure_fond = ''
  `);
  console.log(`  Total updated this step: ${totalUpdated}`);
  console.log(`  Still missing structure_fond: ${remaining.c}`);
}

// ---------------------------------------------------------------------------
// STEP 2: categorie_globale
// ---------------------------------------------------------------------------
async function step2_categorieGlobale() {
  banner(2, 'categorie_globale (ACTIONS / OBLIGATIONS / MONETAIRE / DIVERSIFIE / ...)');

  // Order matters: more specific first to avoid false positives.
  // E.g. "FIXED INCOME" before checking just "INCOME" (which could match "DIVERSIFIE" names).
  const mappings = [
    {
      value: 'ACTIONS',
      patterns: [
        "UPPER(COALESCE(classification,'')) LIKE '%ACTION%'",
        "UPPER(COALESCE(classification,'')) LIKE '%EQUITY%'",
        "UPPER(COALESCE(classification,'')) LIKE '%ACTIONS%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%ACTION%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%EQUITY%'",
        "UPPER(COALESCE(categorie_national,'')) LIKE '%ACTION%'",
        "UPPER(COALESCE(categorie_national,'')) LIKE '%EQUITY%'",
        "UPPER(nom_fond) LIKE '%ACTION%'",
        "UPPER(nom_fond) LIKE '%EQUITY%'",
        "UPPER(nom_fond) LIKE '%ACTIONS%'",
      ],
    },
    {
      value: 'OBLIGATIONS',
      patterns: [
        "UPPER(COALESCE(classification,'')) LIKE '%OBLIG%'",
        "UPPER(COALESCE(classification,'')) LIKE '%BOND%'",
        "UPPER(COALESCE(classification,'')) LIKE '%FIXED INCOME%'",
        "UPPER(COALESCE(classification,'')) LIKE '%INCOME%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%OBLIG%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%BOND%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%FIXED INCOME%'",
        "UPPER(COALESCE(categorie_national,'')) LIKE '%OBLIG%'",
        "UPPER(COALESCE(categorie_national,'')) LIKE '%BOND%'",
        "UPPER(nom_fond) LIKE '%OBLIG%'",
        "UPPER(nom_fond) LIKE '%BOND%'",
        "UPPER(nom_fond) LIKE '%FIXED INCOME%'",
      ],
    },
    {
      value: 'MONETAIRE',
      patterns: [
        "UPPER(COALESCE(classification,'')) LIKE '%MONET%'",
        "UPPER(COALESCE(classification,'')) LIKE '%MONEY MARKET%'",
        "UPPER(COALESCE(classification,'')) LIKE '%TRESOR%'",
        "UPPER(COALESCE(classification,'')) LIKE '%CASH%'",
        "UPPER(COALESCE(classification,'')) LIKE '%LIQUID%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%MONET%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%MONEY MARKET%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%CASH%'",
        "UPPER(COALESCE(categorie_national,'')) LIKE '%MONET%'",
        "UPPER(nom_fond) LIKE '%MONET%'",
        "UPPER(nom_fond) LIKE '%MONEY MARKET%'",
        "UPPER(nom_fond) LIKE '%TRESOR%'",
        "UPPER(nom_fond) LIKE '%CASH%'",
        "UPPER(nom_fond) LIKE '%LIQUID%'",
      ],
    },
    {
      value: 'DIVERSIFIE',
      patterns: [
        "UPPER(COALESCE(classification,'')) LIKE '%DIVERS%'",
        "UPPER(COALESCE(classification,'')) LIKE '%BALANCED%'",
        "UPPER(COALESCE(classification,'')) LIKE '%MIXED%'",
        "UPPER(COALESCE(classification,'')) LIKE '%MULTI%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%DIVERS%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%BALANCED%'",
        "UPPER(COALESCE(categorie_national,'')) LIKE '%DIVERS%'",
        "UPPER(COALESCE(categorie_national,'')) LIKE '%BALANCED%'",
        "UPPER(nom_fond) LIKE '%DIVERS%'",
        "UPPER(nom_fond) LIKE '%BALANCED%'",
        "UPPER(nom_fond) LIKE '%MIXED%'",
        "UPPER(nom_fond) LIKE '%MULTI%'",
      ],
    },
    {
      value: 'IMMOBILIER',
      patterns: [
        "UPPER(COALESCE(classification,'')) LIKE '%IMMOBIL%'",
        "UPPER(COALESCE(classification,'')) LIKE '%REAL ESTATE%'",
        "UPPER(COALESCE(classification,'')) LIKE '%REIT%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%IMMOBIL%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%REAL ESTATE%'",
        "UPPER(COALESCE(categorie_national,'')) LIKE '%IMMOBIL%'",
        "UPPER(nom_fond) LIKE '%IMMOBIL%'",
        "UPPER(nom_fond) LIKE '%REAL ESTATE%'",
        "UPPER(nom_fond) LIKE '%REIT%'",
      ],
    },
    {
      value: 'ETF/INDICIEL',
      patterns: [
        "UPPER(COALESCE(classification,'')) LIKE '%ETF%'",
        "UPPER(COALESCE(classification,'')) LIKE '%INDEX%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%ETF%'",
        "UPPER(COALESCE(categorie_libelle,'')) LIKE '%INDEX%'",
        "UPPER(nom_fond) LIKE '%ETF%'",
        "UPPER(nom_fond) LIKE '%INDEX%'",
      ],
    },
  ];

  let totalUpdated = 0;

  for (const { value, patterns } of mappings) {
    const whereMatch = patterns.join('\n          OR ');
    const n = await execUpdate(`
      UPDATE fond_investissements
      SET categorie_globale = '${value}'
      WHERE (categorie_globale IS NULL OR categorie_globale = '')
        AND (
          ${whereMatch}
        )
    `);
    if (n > 0) console.log(`  ${value}: ${n} funds updated`);
    totalUpdated += n;
  }

  const [remaining] = await selectAll(`
    SELECT COUNT(*) as c FROM fond_investissements
    WHERE categorie_globale IS NULL OR categorie_globale = ''
  `);
  console.log(`  Total updated this step: ${totalUpdated}`);
  console.log(`  Still missing categorie_globale: ${remaining.c}`);
}

// ---------------------------------------------------------------------------
// STEP 3: date_premiere_vl + montant_premier_vl
// ---------------------------------------------------------------------------
async function step3_premiereVl() {
  banner(3, 'date_premiere_vl + montant_premier_vl');

  // 3a: date_premiere_vl
  const n1 = await execUpdate(`
    UPDATE fond_investissements f
    INNER JOIN (
      SELECT fund_id, MIN(date) AS first_date
      FROM valorisations
      WHERE date > '1900-01-01' AND date IS NOT NULL
      GROUP BY fund_id
    ) v ON f.id = v.fund_id
    SET f.date_premiere_vl = v.first_date
    WHERE f.date_premiere_vl IS NULL
       OR f.date_premiere_vl = ''
       OR f.date_premiere_vl = '0000-00-00'
  `);
  console.log(`  date_premiere_vl: ${n1} funds updated`);

  // 3b: montant_premier_vl
  const n2 = await execUpdate(`
    UPDATE fond_investissements f
    INNER JOIN (
      SELECT v1.fund_id, v1.value AS first_value
      FROM valorisations v1
      INNER JOIN (
        SELECT fund_id, MIN(date) AS first_date
        FROM valorisations
        WHERE date > '1900-01-01' AND date IS NOT NULL
        GROUP BY fund_id
      ) v2 ON v1.fund_id = v2.fund_id AND v1.date = v2.first_date
    ) v ON f.id = v.fund_id
    SET f.montant_premier_vl = v.first_value
    WHERE f.montant_premier_vl IS NULL OR f.montant_premier_vl = 0
  `);
  console.log(`  montant_premier_vl: ${n2} funds updated`);
}

// ---------------------------------------------------------------------------
// STEP 4: periodicite
// ---------------------------------------------------------------------------
async function step4_periodicite() {
  banner(4, 'periodicite (Quotidien / Hebdomadaire / Mensuel / Autre)');

  // Get funds that need periodicite and have VL data
  const funds = await selectAll(`
    SELECT f.id, f.nom_fond
    FROM fond_investissements f
    WHERE (f.periodicite IS NULL OR f.periodicite = '')
      AND f.id IN (SELECT DISTINCT fund_id FROM valorisations)
  `);

  console.log(`  Funds to analyse: ${funds.length}`);

  let counts = { Quotidien: 0, Hebdomadaire: 0, Mensuel: 0, Autre: 0 };
  let updated = 0;

  for (const fund of funds) {
    // Calculate average gap between consecutive VL dates
    const gaps = await selectAll(`
      SELECT AVG(gap_days) AS avg_gap, COUNT(*) AS cnt FROM (
        SELECT DATEDIFF(
          date,
          LAG(date) OVER (ORDER BY date)
        ) AS gap_days
        FROM valorisations
        WHERE fund_id = :fundId
          AND date > '1900-01-01'
          AND date IS NOT NULL
        ORDER BY date
      ) t
      WHERE gap_days > 0 AND gap_days < 365
    `, { fundId: fund.id });

    if (!gaps[0] || gaps[0].avg_gap === null || gaps[0].cnt < 2) continue;

    const avgGap = parseFloat(gaps[0].avg_gap);
    let periodicite;
    if (avgGap <= 3)       periodicite = 'Quotidien';
    else if (avgGap <= 10) periodicite = 'Hebdomadaire';
    else if (avgGap <= 45) periodicite = 'Mensuel';
    else                   periodicite = 'Autre';

    await execUpdate(`
      UPDATE fond_investissements SET periodicite = :periodicite WHERE id = :id
    `, { periodicite, id: fund.id });

    counts[periodicite]++;
    updated++;
  }

  for (const [k, v] of Object.entries(counts)) {
    if (v > 0) console.log(`  ${k}: ${v} funds`);
  }
  console.log(`  Total updated this step: ${updated}`);
}

// ---------------------------------------------------------------------------
// STEP 5: datejour (date de derniere VL)
// ---------------------------------------------------------------------------
async function step5_datejour() {
  banner(5, 'datejour (date de derniere VL)');

  // Update funds where datejour is missing OR stale (older than actual latest VL)
  const n = await execUpdate(`
    UPDATE fond_investissements f
    INNER JOIN (
      SELECT fund_id, MAX(date) AS last_date
      FROM valorisations
      WHERE date IS NOT NULL AND date > '1900-01-01'
      GROUP BY fund_id
    ) v ON f.id = v.fund_id
    SET f.datejour = v.last_date
    WHERE f.datejour IS NULL
       OR f.datejour = ''
       OR f.datejour = '0000-00-00'
       OR f.datejour < v.last_date
  `);
  console.log(`  datejour: ${n} funds updated`);
}

// ---------------------------------------------------------------------------
// STEP 6: montant_actif_net (derniere actif_net connue)
// ---------------------------------------------------------------------------
async function step6_actifNet() {
  banner(6, 'montant_actif_net (derniere actif_net connue)');

  // Get the actif_net from the most recent valorisation row for each fund
  const n = await execUpdate(`
    UPDATE fond_investissements f
    INNER JOIN (
      SELECT v1.fund_id, v1.actif_net
      FROM valorisations v1
      INNER JOIN (
        SELECT fund_id, MAX(date) AS last_date
        FROM valorisations
        WHERE date IS NOT NULL AND date > '1900-01-01'
          AND actif_net IS NOT NULL AND actif_net > 0
        GROUP BY fund_id
      ) v2 ON v1.fund_id = v2.fund_id AND v1.date = v2.last_date
      WHERE v1.actif_net IS NOT NULL AND v1.actif_net > 0
    ) v ON f.id = v.fund_id
    SET f.montant_actif_net = v.actif_net
    WHERE f.montant_actif_net IS NULL OR f.montant_actif_net = 0
  `);
  console.log(`  montant_actif_net: ${n} funds updated`);
}

// ---------------------------------------------------------------------------
// STEP 7: Verification summary
// ---------------------------------------------------------------------------
async function step7_summary() {
  banner(7, 'Verification Summary');

  const fields = [
    { col: 'structure_fond',    emptyCheck: "structure_fond IS NULL OR structure_fond = ''" },
    { col: 'categorie_globale', emptyCheck: "categorie_globale IS NULL OR categorie_globale = ''" },
    { col: 'date_premiere_vl',  emptyCheck: "date_premiere_vl IS NULL OR date_premiere_vl = '' OR date_premiere_vl = '0000-00-00'" },
    { col: 'montant_premier_vl', emptyCheck: "montant_premier_vl IS NULL OR montant_premier_vl = 0" },
    { col: 'periodicite',       emptyCheck: "periodicite IS NULL OR periodicite = ''" },
    { col: 'datejour',          emptyCheck: "datejour IS NULL OR datejour = '' OR datejour = '0000-00-00'" },
    { col: 'montant_actif_net', emptyCheck: "montant_actif_net IS NULL OR montant_actif_net = 0" },
  ];

  // Get total
  const [totalRow] = await selectAll('SELECT COUNT(*) AS total FROM fond_investissements');
  const total = totalRow.total;

  console.log(`\n  ${'Field'.padEnd(24)} ${'Filled'.padStart(8)} ${'Empty'.padStart(8)} ${'%Filled'.padStart(8)}`);
  console.log(`  ${'-'.repeat(24)} ${'-'.repeat(8)} ${'-'.repeat(8)} ${'-'.repeat(8)}`);

  for (const { col, emptyCheck } of fields) {
    const [row] = await selectAll(`
      SELECT
        SUM(CASE WHEN ${emptyCheck} THEN 0 ELSE 1 END) AS filled,
        SUM(CASE WHEN ${emptyCheck} THEN 1 ELSE 0 END) AS empty
      FROM fond_investissements
    `);
    const filled = parseInt(row.filled) || 0;
    const empty = parseInt(row.empty) || 0;
    const pct = total > 0 ? ((filled / total) * 100).toFixed(1) : '0.0';
    console.log(`  ${col.padEnd(24)} ${String(filled).padStart(8)} ${String(empty).padStart(8)} ${(pct + '%').padStart(8)}`);
  }

  // Breakdown by country
  console.log(`\n  Coverage by country:`);
  const byPays = await selectAll(`
    SELECT
      pays,
      COUNT(*) AS nb,
      SUM(CASE WHEN structure_fond IS NOT NULL AND structure_fond != '' THEN 1 ELSE 0 END) AS struct,
      SUM(CASE WHEN categorie_globale IS NOT NULL AND categorie_globale != '' THEN 1 ELSE 0 END) AS cat,
      SUM(CASE WHEN periodicite IS NOT NULL AND periodicite != '' THEN 1 ELSE 0 END) AS perio,
      SUM(CASE WHEN datejour IS NOT NULL AND datejour != '' AND datejour != '0000-00-00' THEN 1 ELSE 0 END) AS dj
    FROM fond_investissements
    GROUP BY pays
    ORDER BY nb DESC
  `);

  console.log(`  ${'Country'.padEnd(20)} ${'Total'.padStart(6)} ${'Struct'.padStart(8)} ${'CategGl'.padStart(8)} ${'Perio'.padStart(8)} ${'DateJ'.padStart(8)}`);
  console.log(`  ${'-'.repeat(20)} ${'-'.repeat(6)} ${'-'.repeat(8)} ${'-'.repeat(8)} ${'-'.repeat(8)} ${'-'.repeat(8)}`);
  for (const r of byPays) {
    console.log(
      `  ${(r.pays || '(null)').padEnd(20)} ${String(r.nb).padStart(6)} ${String(r.struct).padStart(8)} ${String(r.cat).padStart(8)} ${String(r.perio).padStart(8)} ${String(r.dj).padStart(8)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('='.repeat(72));
  console.log('  fix_static_data.js — Populate missing static data');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no changes will be persisted)' : 'LIVE (changes will be applied)'}`);
  console.log('='.repeat(72));

  try {
    await sequelize.authenticate();
    console.log(`  Connected to ${sequelize.config.database}@${sequelize.config.host}`);
  } catch (err) {
    console.error('Cannot connect to database:', err.message);
    process.exit(1);
  }

  try {
    await step1_structureFond();
    await step2_categorieGlobale();
    await step3_premiereVl();
    await step4_periodicite();
    await step5_datejour();
    await step6_actifNet();
    await step7_summary();

    console.log(`\n${'='.repeat(72)}`);
    console.log(`  DONE${DRY_RUN ? ' (dry run — nothing was changed)' : ''}`);
    console.log('='.repeat(72));
  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
