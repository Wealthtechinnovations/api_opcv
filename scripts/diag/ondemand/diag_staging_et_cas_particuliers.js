/**
 * DIAGNOSTIC — existence reelle des couches de staging, disponibilite des
 * fichiers sources SEC, et instruction des cas hors taux de change.
 *
 * LECTURE SEULE STRICTE. SELECT + lecture de repertoire. Aucune ecriture.
 *
 * POURQUOI
 * --------
 * Le diagnostic precedent a echoue sur `Table fund_opcvm.sec_ng_observations
 * doesn't exist`. Le plan de correction de #73 reposait sur cette table :
 * re-promouvoir `bid_price_usd` depuis le staging, sans conversion. Ce plan
 * n est donc pas applicable en l etat.
 *
 * L existence de la table avait ete DEDUITE de la presence de son DDL dans
 * `sec_ng_xlsx_loader.py`, jamais verifiee. Ce script verifie, pour toutes les
 * couches de staging des cinq pays, ce qui existe reellement.
 *
 * QUESTIONS
 *   A. Quelles tables de staging / alias / audit existent vraiment, et avec
 *      quel volume ? (determine aussi l ampleur du chantier d integration)
 *   B. Les fichiers sources SEC sont-ils encore sur le serveur
 *      (`sec_ng_downloads/`) ? Si oui, rejouer le parsing est local et rapide ;
 *      sinon il faut retelecharger les publications officielles.
 *   C. Le cas 1196 : trois echelles, dont un rapport de 95x que le taux de
 *      change n explique pas. Non instruit jusqu ici.
 *   D. Les trois fonds hors taux de change : 2592 FCP BRIDGE EQUILIBRE (5067x,
 *      UEMOA), 2796 FSDH HALAL (101x), 1251 SIAML ETF 40 (45x).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

function table(rows, max = 70) {
  if (!rows.length) return '   (aucune ligne)';
  const cols = Object.keys(rows[0]);
  const w = {};
  for (const c of cols) w[c] = Math.min(40, Math.max(c.length, ...rows.map(r => String(r[c] ?? 'NULL').length)));
  const line = r => '   ' + cols.map(c => String(r[c] ?? 'NULL').slice(0, 40).padEnd(w[c])).join('  ');
  const out = [
    '   ' + cols.map(c => c.padEnd(w[c])).join('  '),
    '   ' + cols.map(c => '-'.repeat(w[c])).join('  '),
    ...rows.slice(0, max).map(line),
  ];
  if (rows.length > max) out.push(`   ... et ${rows.length - max} autres`);
  return out.join('\n');
}

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    console.log('\n============================================================');
    console.log(' STAGING REEL, SOURCES SEC ET CAS HORS TAUX DE CHANGE');
    console.log(' Genere le', new Date().toISOString(), '— LECTURE SEULE');
    console.log('============================================================');

    // --- A. Quelles couches de staging existent vraiment ? ---
    console.log('\n## A. Tables de staging / alias / audit reellement presentes\n');
    const [tabs] = await conn.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, ROUND(DATA_LENGTH/1024/1024, 1) AS mb, CREATE_TIME
        FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND (TABLE_NAME LIKE 'sec_ng%' OR TABLE_NAME LIKE 'brvm%' OR TABLE_NAME LIKE 'bvmac%'
              OR TABLE_NAME LIKE 'cmf%' OR TABLE_NAME LIKE '%alias%' OR TABLE_NAME LIKE '%audit%'
              OR TABLE_NAME LIKE '%staging%' OR TABLE_NAME LIKE '%observation%')
       ORDER BY TABLE_NAME`);
    console.log(table(tabs));

    console.log('\n   Attendu par les scripts, mais ABSENT de la base :\n');
    const attendues = [
      'sec_ng_observations', 'sec_ng_fund_aliases', 'sec_ng_load_logs', 'sec_ng_corrections_audit',
      'brvm_boc_navs_raw', 'brvm_boc_sources', 'brvm_fund_aliases', 'brvm_import_logs', 'brvm_missing_navs',
      'bvmac_boc_navs_raw', 'bvmac_boc_sources', 'bvmac_fund_aliases', 'bvmac_import_logs', 'bvmac_missing_navs',
      'cmf_import_audit', 'cmf_new_funds_queue', 'cmf_extreme_variations',
    ];
    const presentes = new Set(tabs.map(t => t.TABLE_NAME));
    const manquantes = attendues.filter(t => !presentes.has(t));
    if (manquantes.length === 0) console.log('     (aucune — toutes presentes)');
    else manquantes.forEach(t => console.log(`     ${t}`));

    // --- B. Les fichiers sources SEC sont-ils encore la ? ---
    console.log('\n## B. Fichiers sources SEC sur le serveur\n');
    const racine = path.resolve(__dirname, '../../..');
    for (const rel of ['sec_ng_downloads', 'data/sec_ng', 'data/brvm_boc', 'data/bvmac_boc']) {
      const dir = path.join(racine, rel);
      if (!fs.existsSync(dir)) { console.log(`   ${rel.padEnd(20)} ABSENT`); continue; }
      let files = [];
      const walk = d => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) walk(p);
          else files.push({ p, size: fs.statSync(p).size, mtime: fs.statSync(p).mtime });
        }
      };
      try { walk(dir); } catch (e) { console.log(`   ${rel.padEnd(20)} illisible : ${e.message}`); continue; }
      const total = files.reduce((s, f) => s + f.size, 0);
      const exts = {};
      for (const f of files) {
        const e = (path.extname(f.p) || '(sans)').toLowerCase();
        exts[e] = (exts[e] || 0) + 1;
      }
      const dates = files.map(f => f.mtime).sort((a, b) => a - b);
      console.log(`   ${rel.padEnd(20)} ${files.length} fichiers, ${(total / 1048576).toFixed(1)} Mo`);
      console.log(`   ${' '.repeat(20)} types : ${Object.entries(exts).map(([k, v]) => `${k}:${v}`).join(' ')}`);
      if (dates.length) {
        console.log(`   ${' '.repeat(20)} modifies du ${dates[0].toISOString().slice(0, 10)} au ${dates[dates.length - 1].toISOString().slice(0, 10)}`);
      }
    }

    // --- C. Cas 1196 : trois echelles ---
    console.log('\n## C. Fonds 1196 — les trois echelles, avec provenance\n');
    const [c1196] = await conn.execute(`
      SELECT FLOOR(LOG10(v.value)) AS ordre, v.currency_code, v.price_type, v.data_quality,
             COUNT(*) AS n, ROUND(MIN(v.value), 2) AS v_min, ROUND(MAX(v.value), 2) AS v_max,
             MIN(v.date) AS d_min, MAX(v.date) AS d_max,
             COUNT(DISTINCT v.sec_document_id) AS docs,
             ROUND(AVG(v.net_assets_ngn), 0) AS na_ngn_moy,
             ROUND(AVG(v.net_assets_ngn / v.value), 0) AS parts_implicites
        FROM valorisations v
       WHERE v.fund_id = 1196 AND v.value > 0
       GROUP BY ordre, v.currency_code, v.price_type, v.data_quality
       ORDER BY ordre`);
    console.log(table(c1196));
    console.log('\n   Lecture : si `parts_implicites` (actif net / valeur) est stable entre deux');
    console.log('   ordres de grandeur, la valeur est la meme mesure dans deux unites. S il varie');
    console.log('   d un facteur equivalent, ce sont deux mesures differentes.\n');

    // --- D. Les trois fonds hors taux de change ---
    console.log('\n## D. Fonds hors taux de change : 2592, 2796, 1251\n');
    const [hors] = await conn.execute(`
      SELECT v.fund_id, LEFT(f.nom_fond, 26) AS nom, f.pays, f.dev_libelle,
             FLOOR(LOG10(v.value)) AS ordre, COUNT(*) AS n,
             ROUND(MIN(v.value), 2) AS v_min, ROUND(MAX(v.value), 2) AS v_max,
             MIN(v.date) AS d_min, MAX(v.date) AS d_max,
             SUM(v.currency_code IS NOT NULL) AS a_devise
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
       WHERE v.fund_id IN (2592, 2796, 1251) AND v.value > 0
       GROUP BY v.fund_id, nom, f.pays, f.dev_libelle, ordre
       ORDER BY v.fund_id, ordre`);
    console.log(table(hors));

    // --- E. Casse du champ pays ---
    console.log('\n## E. Incoherence de casse sur le champ pays\n');
    const [casse] = await conn.execute(`
      SELECT pays, COUNT(*) AS nb_fonds
        FROM fond_investissements
       GROUP BY pays
       ORDER BY pays`);
    console.log(table(casse));

    console.log('\n============================================================');
    console.log(' FIN — aucune ecriture effectuee.');
    console.log('============================================================\n');
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('Erreur fatale :', err.message);
  process.exit(1);
});
