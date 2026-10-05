/**
 * W1 canonical foundations — PRODUCTION READ-ONLY diagnostic.
 *
 * Contract:
 * - SELECT / SHOW-equivalent metadata reads only.
 * - no INSERT/UPDATE/DELETE/DDL, no files written, no secrets printed.
 * - output is intended for docs/DIAG_ONDEMAND.md via doc-drift.yml.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
};

const TABLES = [
  'fond_investissements',
  'societes',
  'documents',
  'personnel_sgs',
  'valorisations',
  'indice_references',
  'devisedechanges',
  'ref_asset_classes',
  'ref_geo_zones',
  'ref_categories_fundafrica',
  'ref_indices_fundafrica',
  'ref_index_sources',
  'sec_ng_observations',
  'sec_ng_fund_aliases',
  'sec_ng_corrections_audit',
];

const VALUATION_ADD_COLUMNS = [
  'net_assets_ngn','net_assets_usd',
  'unit_price_ngn','unit_price_usd',
  'bid_price_ngn','bid_price_usd',
  'offer_price_ngn','offer_price_usd',
  'price_type','currency_code',
  'sec_document_id','source_url','report_date','data_quality','correction_batch',
];

function table(rows) {
  if (!rows.length) return '  (aucune ligne)';
  const keys = Object.keys(rows[0]);
  const widths = Object.fromEntries(keys.map(k => [k, Math.max(k.length, ...rows.map(r => String(r[k] ?? '').length))]));
  const head = '  ' + keys.map(k => k.padEnd(widths[k])).join('  ');
  const sep = '  ' + keys.map(k => '-'.repeat(widths[k])).join('  ');
  const body = rows.map(r => '  ' + keys.map(k => String(r[k] ?? '').padEnd(widths[k])).join('  '));
  return [head, sep, ...body].join('\n');
}

async function main() {
  const conn = await mysql.createConnection(DB);
  try {
    console.log('=== W1 FOUNDATIONS — LIVE SCHEMA / RELATIONSHIPS / PROVENANCE ===');
    console.log('Mesure le ' + new Date().toISOString() + ' — LECTURE SEULE');
    console.log('');

    const [tableRows] = await conn.query(
      `SELECT TABLE_NAME, TABLE_ROWS
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (?)
        ORDER BY TABLE_NAME`,
      [TABLES]
    );
    const existing = new Set(tableRows.map(r => r.TABLE_NAME));
    console.log('## A. Tables canoniques / referentielles presentes');
    console.log(table(TABLES.map(name => ({
      table: name,
      present: existing.has(name) ? 'YES' : 'NO',
      approx_rows: existing.has(name)
        ? String((tableRows.find(r => r.TABLE_NAME === name) || {}).TABLE_ROWS ?? '?')
        : '-',
    }))));
    console.log('');

    const keyTables = TABLES.filter(t => existing.has(t));
    const [cols] = keyTables.length ? await conn.query(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (?)
        ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [keyTables]
    ) : [[]];

    const byTable = new Map();
    for (const c of cols) {
      if (!byTable.has(c.TABLE_NAME)) byTable.set(c.TABLE_NAME, []);
      byTable.get(c.TABLE_NAME).push(c);
    }

    console.log('## B. valorisations — parite schema additive / provenance');
    const valCols = new Set((byTable.get('valorisations') || []).map(c => c.COLUMN_NAME));
    console.log(table(VALUATION_ADD_COLUMNS.map(column => ({
      column,
      present: valCols.has(column) ? 'YES' : 'NO',
    }))));
    console.log('');

    console.log('## C. Relations societe_id et contraintes FK reelles');
    const relationTables = ['fond_investissements','documents','personnel_sgs'].filter(t => existing.has(t));
    const [fkRows] = relationTables.length ? await conn.query(
      `SELECT k.TABLE_NAME, k.COLUMN_NAME, k.CONSTRAINT_NAME,
              k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME
         FROM information_schema.KEY_COLUMN_USAGE k
        WHERE k.TABLE_SCHEMA = DATABASE()
          AND k.TABLE_NAME IN (?)
          AND k.COLUMN_NAME = 'societe_id'
        ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME`,
      [relationTables]
    ) : [[]];
    const fkByTable = new Map();
    for (const r of fkRows) {
      if (!fkByTable.has(r.TABLE_NAME)) fkByTable.set(r.TABLE_NAME, []);
      fkByTable.get(r.TABLE_NAME).push(r);
    }
    const relSummary = relationTables.map(t => {
      const cset = new Set((byTable.get(t) || []).map(c => c.COLUMN_NAME));
      const fks = (fkByTable.get(t) || []).filter(r => r.REFERENCED_TABLE_NAME);
      return {
        table: t,
        societe_id_column: cset.has('societe_id') ? 'YES' : 'NO',
        real_fk_to_societes: fks.some(r => r.REFERENCED_TABLE_NAME === 'societes' && r.REFERENCED_COLUMN_NAME === 'id') ? 'YES' : 'NO',
        fk_names: fks.map(r => r.CONSTRAINT_NAME).join(',') || '-',
      };
    });
    console.log(table(relSummary));
    console.log('');

    console.log('## D. Couverture societe_id — agrégats uniquement');
    const relationCoverage = [];
    for (const t of relationTables) {
      const cset = new Set((byTable.get(t) || []).map(c => c.COLUMN_NAME));
      if (!cset.has('societe_id')) continue;
      const [r] = await conn.query(
        `SELECT COUNT(*) total,
                SUM(CASE WHEN societe_id IS NULL THEN 1 ELSE 0 END) missing_societe_id
           FROM \`${t}\``
      );
      relationCoverage.push({
        table: t,
        total: Number(r[0].total || 0),
        missing_societe_id: Number(r[0].missing_societe_id || 0),
      });
    }
    console.log(table(relationCoverage));
    console.log('');

    console.log('## E. Identite fonds — agrégats de collision, sans données sensibles');
    if (existing.has('fond_investissements')) {
      const [fundStats] = await conn.query(
        `SELECT COUNT(*) total,
                SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) active,
                SUM(CASE WHEN code_ISIN IS NULL OR TRIM(code_ISIN) = '' THEN 1 ELSE 0 END) missing_isin,
                SUM(CASE WHEN societe_id IS NULL THEN 1 ELSE 0 END) missing_societe_id
           FROM fond_investissements`
      );
      const [dupIsin] = await conn.query(
        `SELECT COUNT(*) duplicate_isin_keys
           FROM (
             SELECT code_ISIN
               FROM fond_investissements
              WHERE code_ISIN IS NOT NULL AND TRIM(code_ISIN) <> ''
              GROUP BY code_ISIN
             HAVING COUNT(*) > 1
           ) d`
      );
      const [dupNames] = await conn.query(
        `SELECT COUNT(*) duplicate_name_country_keys
           FROM (
             SELECT UPPER(TRIM(nom_fond)) nom, UPPER(TRIM(COALESCE(pays,''))) pays
               FROM fond_investissements
              WHERE nom_fond IS NOT NULL AND TRIM(nom_fond) <> ''
              GROUP BY UPPER(TRIM(nom_fond)), UPPER(TRIM(COALESCE(pays,'')))
             HAVING COUNT(*) > 1
           ) d`
      );
      console.log(table([{
        total: Number(fundStats[0].total || 0),
        active: Number(fundStats[0].active || 0),
        missing_isin: Number(fundStats[0].missing_isin || 0),
        missing_societe_id: Number(fundStats[0].missing_societe_id || 0),
        duplicate_isin_keys: Number(dupIsin[0].duplicate_isin_keys || 0),
        duplicate_name_country_keys: Number(dupNames[0].duplicate_name_country_keys || 0),
      }]));
    } else {
      console.log('  fond_investissements absent');
    }
    console.log('');

    console.log('## F. Provenance valorisations — couverture globale et par pays');
    const provenanceCols = ['currency_code','price_type','source_url','sec_document_id','report_date','data_quality','correction_batch'];
    const provenanceReady = existing.has('valorisations') && provenanceCols.every(c => valCols.has(c));
    if (provenanceReady && existing.has('fond_investissements')) {
      const [global] = await conn.query(
        `SELECT COUNT(*) total,
                SUM(currency_code IS NOT NULL) with_currency,
                SUM(price_type IS NOT NULL) with_price_type,
                SUM(source_url IS NOT NULL OR sec_document_id IS NOT NULL) with_source,
                SUM(report_date IS NOT NULL) with_report_date,
                SUM(data_quality IS NOT NULL) with_quality,
                SUM(correction_batch IS NOT NULL) with_batch
           FROM valorisations`
      );
      console.log('Global:');
      console.log(table([global[0]]));
      const [byCountry] = await conn.query(
        `SELECT COALESCE(NULLIF(TRIM(f.pays),''),'(UNKNOWN)') pays,
                COUNT(*) total,
                SUM(v.currency_code IS NOT NULL) with_currency,
                SUM(v.price_type IS NOT NULL) with_price_type,
                SUM(v.source_url IS NOT NULL OR v.sec_document_id IS NOT NULL) with_source,
                SUM(v.data_quality IS NOT NULL) with_quality
           FROM valorisations v
           JOIN fond_investissements f ON f.id = v.fund_id
          GROUP BY COALESCE(NULLIF(TRIM(f.pays),''),'(UNKNOWN)')
          ORDER BY total DESC`
      );
      console.log('Par pays:');
      console.log(table(byCountry.map(r => ({
        pays: r.pays,
        total: Number(r.total || 0),
        with_currency: Number(r.with_currency || 0),
        with_price_type: Number(r.with_price_type || 0),
        with_source: Number(r.with_source || 0),
        with_quality: Number(r.with_quality || 0),
      }))));
    } else {
      console.log('  NON_MESURABLE: colonnes de provenance incompletes ou tables absentes');
    }
    console.log('');

    console.log('## G. Referentiels FundAfrica — comptes exacts');
    const refCounts = [];
    for (const t of ['ref_asset_classes','ref_geo_zones','ref_categories_fundafrica','ref_indices_fundafrica','ref_index_sources']) {
      if (!existing.has(t)) {
        refCounts.push({table:t,count:'ABSENT'});
        continue;
      }
      const [r] = await conn.query(`SELECT COUNT(*) c FROM \`${t}\``);
      refCounts.push({table:t,count:Number(r[0].c || 0)});
    }
    console.log(table(refCounts));
    console.log('');

    console.log('## H. Indices / FX — bornes temporelles');
    const series = [];
    if (existing.has('indice_references')) {
      const [r] = await conn.query(
        `SELECT COUNT(*) rows_count, COUNT(DISTINCT id_indice) series_count,
                MIN(date) min_date, MAX(date) max_date
           FROM indice_references`
      );
      series.push({authority:'indice_references',...r[0]});
    }
    if (existing.has('devisedechanges')) {
      const [r] = await conn.query(
        `SELECT COUNT(*) rows_count, COUNT(DISTINCT paire) series_count,
                MIN(date) min_date, MAX(date) max_date
           FROM devisedechanges`
      );
      series.push({authority:'devisedechanges',...r[0]});
    }
    console.log(table(series));
    console.log('');

    console.log('## I. Colonnes documents — capacité de provenance documentaire');
    if (existing.has('documents')) {
      const docCols = (byTable.get('documents') || []).map(c => c.COLUMN_NAME);
      console.log('  ' + docCols.join(', '));
    } else {
      console.log('  documents absent');
    }
    console.log('');

    console.log('VERDICT=W1_FOUNDATION_SCHEMA_OBSERVED_READ_ONLY');
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('W1_DIAG_FATAL:', err && err.message ? err.message : String(err));
  process.exit(2);
});
