/**
 * DIAGNOSTIC — origine du melange d'echelles sur les fonds Nigeria 1141 et 1196.
 *
 * LECTURE SEULE STRICTE. Uniquement des SELECT. Aucune ecriture, jamais.
 *
 * CONTEXTE
 * --------
 * Les fonds 1141 (AFRINVEST DOLLAR FUND) et 1196 (EMERGING AFRICA EUROBOND)
 * servent publiquement des YTD de 143 958 % et 9 339 %. Trois diagnostics
 * successifs ont etabli :
 *   1. les colonnes doctrinales existent (54 colonnes dans `valorisations`) ;
 *   2. `unit_price_usd` est vide a 100 %, y compris sur ces fonds ;
 *   3. le melange d'echelles est INTERNE au segment `NGN / BID / OK` :
 *      230 lignes de 92,19 a 185 518 pour 1141, sous une seule etiquette.
 *
 * Deux hypotheses ont deja ete refutees par les donnees : separation NGN/USD,
 * puis lecture a rebrancher sur `unit_price_usd`. Ce script ne suppose donc
 * plus rien : il remonte a la provenance ligne par ligne pour identifier quel
 * chargeur, quel document et quelle date produisent chaque changement d'echelle.
 *
 * QUESTIONS AUXQUELLES IL REPOND
 *   A. Chaque ordre de grandeur correspond-il a des documents SEC distincts ?
 *      -> si oui, le defaut vient de la source ou d'une version de parseur.
 *      -> si non (memes documents, deux echelles), le defaut est dans la
 *         lecture des colonnes (blocs larges 2026, >100 colonnes).
 *   B. Existe-t-il un decalage systematique entre `date` et `report_date` ?
 *      (defaut de decalage hebdomadaire suspecte par le prompt V2.2)
 *   C. Les lignes non qualifiees (les plus recentes) ont-elles une trace de
 *      source, ou sont-elles totalement orphelines ?
 *   D. Ou se situent exactement les basculements, ligne par ligne ?
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const FONDS = [1141, 1196];

function table(rows) {
  if (!rows.length) return '   (aucune ligne)';
  const cols = Object.keys(rows[0]);
  const w = {};
  for (const c of cols) {
    w[c] = Math.max(c.length, ...rows.map(r => String(r[c] ?? 'NULL').length));
    w[c] = Math.min(w[c], 34);
  }
  const fmt = r => '   ' + cols.map(c => String(r[c] ?? 'NULL').slice(0, 34).padEnd(w[c])).join('  ');
  const head = '   ' + cols.map(c => c.padEnd(w[c])).join('  ');
  return [head, '   ' + cols.map(c => '-'.repeat(w[c])).join('  '), ...rows.map(fmt)].join('\n');
}

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    console.log('\n============================================================');
    console.log(' DIAGNOSTIC ECHELLES — FONDS 1141 ET 1196 (LECTURE SEULE)');
    console.log(' Genere le', new Date().toISOString());
    console.log('============================================================');

    // --- A. Segments par ordre de grandeur, avec provenance ---
    console.log('\n## A. Segments par ordre de grandeur et provenance\n');
    const [seg] = await conn.execute(`
      SELECT v.fund_id,
             FLOOR(LOG10(v.value))              AS ordre,
             v.currency_code, v.price_type, v.data_quality,
             COUNT(*)                           AS n,
             MIN(v.date)                        AS d_min,
             MAX(v.date)                        AS d_max,
             ROUND(MIN(v.value), 2)             AS v_min,
             ROUND(MAX(v.value), 2)             AS v_max,
             COUNT(DISTINCT v.sec_document_id)  AS nb_docs,
             MIN(v.sec_document_id)             AS doc_min,
             MAX(v.sec_document_id)             AS doc_max,
             ROUND(AVG(DATEDIFF(v.date, v.report_date)), 1) AS ecart_j,
             SUM(v.source_url IS NOT NULL)      AS a_url
        FROM valorisations v
       WHERE v.fund_id IN (${FONDS.join(',')}) AND v.value > 0
       GROUP BY v.fund_id, ordre, v.currency_code, v.price_type, v.data_quality
       ORDER BY v.fund_id, ordre, v.currency_code`);
    console.log(table(seg));

    // --- B. Un meme document produit-il deux echelles ? Question decisive. ---
    console.log('\n## B. Documents SEC produisant PLUSIEURS ordres de grandeur\n');
    console.log('   (si cette liste est non vide, le defaut est dans la LECTURE des colonnes,');
    console.log('    pas dans la source : le meme document a donne deux unites)\n');
    const [multi] = await conn.execute(`
      SELECT fund_id, sec_document_id, COUNT(DISTINCT FLOOR(LOG10(value))) AS nb_ordres,
             COUNT(*) AS n, ROUND(MIN(value), 2) AS v_min, ROUND(MAX(value), 2) AS v_max,
             MIN(date) AS d_min, MAX(date) AS d_max
        FROM valorisations
       WHERE fund_id IN (${FONDS.join(',')}) AND value > 0 AND sec_document_id IS NOT NULL
       GROUP BY fund_id, sec_document_id
      HAVING nb_ordres > 1
       ORDER BY fund_id, d_min`);
    console.log(table(multi));

    // --- C. Basculements ligne a ligne : ou l'echelle change-t-elle ? ---
    console.log('\n## C. Detail des 30 dernieres observations par fonds\n');
    for (const id of FONDS) {
      const [rows] = await conn.execute(`
        SELECT date, ROUND(value, 4) AS value, currency_code, price_type, data_quality,
               sec_document_id, report_date,
               ROUND(unit_price_ngn, 4) AS up_ngn, ROUND(net_assets_ngn, 0) AS na_ngn,
               correction_batch
          FROM valorisations
         WHERE fund_id = ? AND value > 0
         ORDER BY date DESC
         LIMIT 30`, [id]);
      console.log(`### Fonds ${id}\n`);
      console.log(table(rows.reverse()));
      console.log('');
    }

    // --- D. Coherence : le prix unitaire NGN explique-t-il `value` ? ---
    console.log('\n## D. Lignes ou unit_price_ngn est renseigne : coincide-t-il avec value ?\n');
    const [coh] = await conn.execute(`
      SELECT fund_id, date, ROUND(value, 4) AS value, ROUND(unit_price_ngn, 4) AS up_ngn,
             ROUND(net_assets_ngn, 0) AS na_ngn, currency_code, price_type, data_quality,
             CASE WHEN unit_price_ngn = value THEN 1 ELSE 0 END AS identique
        FROM valorisations
       WHERE fund_id IN (${FONDS.join(',')}) AND unit_price_ngn IS NOT NULL
       ORDER BY fund_id, date
       LIMIT 40`);
    console.log(table(coh));

    // --- E. Rapport entre net_assets et value : teste l'hypothese d'unite ---
    console.log('\n## E. Rapport net_assets_ngn / value par ordre de grandeur\n');
    console.log('   (un rapport stable = nombre de parts coherent ; un rapport qui saute');
    console.log('    d un facteur ~1000 signale un changement d unite sur value)\n');
    const [ratio] = await conn.execute(`
      SELECT fund_id, FLOOR(LOG10(value)) AS ordre, COUNT(*) AS n,
             ROUND(MIN(net_assets_ngn / value), 0) AS ratio_min,
             ROUND(AVG(net_assets_ngn / value), 0) AS ratio_moy,
             ROUND(MAX(net_assets_ngn / value), 0) AS ratio_max,
             MIN(date) AS d_min, MAX(date) AS d_max
        FROM valorisations
       WHERE fund_id IN (${FONDS.join(',')}) AND value > 0 AND net_assets_ngn > 0
       GROUP BY fund_id, ordre
       ORDER BY fund_id, ordre`);
    console.log(table(ratio));

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
