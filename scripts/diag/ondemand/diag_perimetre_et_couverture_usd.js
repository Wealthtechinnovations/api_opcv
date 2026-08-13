/**
 * DIAGNOSTIC — perimetre reel de #73 et faisabilite de la correction par re-promotion.
 *
 * LECTURE SEULE STRICTE. SELECT uniquement. Aucune ecriture, jamais.
 *
 * DECISION ACTEE PAR L UTILISATEUR (2026-08-13) :
 *   « la devise du fonds fait foi ».
 * La serie canonique d un fonds doit donc etre exprimee dans sa devise de
 * libelle. Pour un fonds dollar, cela signifie la colonne USD publiee par la
 * SEC — jamais une conversion calculee, que la doctrine interdit.
 *
 * CE QUE CE SCRIPT MESURE, ET POURQUOI
 *   A. Le perimetre REEL. Le controle C7 est plafonne a 15 lignes : le nombre
 *      de fonds touches est inconnu. Sans ce chiffre, impossible de dimensionner
 *      la correction.
 *   B. La coherence du referentiel. C7 montre que `dev_libelle` est incoherent
 *      (Meristem Dollar = USD, Afrinvest Dollar = NGN). Or c est ce champ qui
 *      designe desormais la devise canonique : s il est faux, toute regle
 *      automatique batie dessus l est aussi.
 *   C. La FAISABILITE de la re-promotion. `sec_ng_observations` conserve
 *      `bid_price_usd` a cote de `bid_price_ngn`. Si la couverture USD est
 *      elevee, la correction est mecanique ; si elle est faible, il faut
 *      rejouer les fichiers SEC et le chantier change d ampleur.
 *   D. La preuve par l exemple sur le fonds 1141 : les deux devises cote a cote.
 *   E. Le cas particulier 1196, qui porte trois echelles dont un rapport de 95x
 *      que le taux de change n explique pas. A instruire avant toute correction
 *      de masse.
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

function table(rows, max = 60) {
  if (!rows.length) return '   (aucune ligne)';
  const cols = Object.keys(rows[0]);
  const w = {};
  for (const c of cols) w[c] = Math.min(34, Math.max(c.length, ...rows.map(r => String(r[c] ?? 'NULL').length)));
  const line = r => '   ' + cols.map(c => String(r[c] ?? 'NULL').slice(0, 34).padEnd(w[c])).join('  ');
  const out = [
    '   ' + cols.map(c => c.padEnd(w[c])).join('  '),
    '   ' + cols.map(c => '-'.repeat(w[c])).join('  '),
    ...rows.slice(0, max).map(line),
  ];
  if (rows.length > max) out.push(`   ... et ${rows.length - max} autres lignes`);
  return out.join('\n');
}

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    console.log('\n============================================================');
    console.log(' PERIMETRE #73 ET FAISABILITE DE LA RE-PROMOTION USD');
    console.log(' Regle actee : la devise du fonds fait foi.');
    console.log(' Genere le', new Date().toISOString(), '— LECTURE SEULE');
    console.log('============================================================');

    // --- A. Perimetre reel, SANS limite ---
    console.log('\n## A. Tous les fonds a echelle melangee (ratio > 20x sur 400 jours)\n');
    const [all] = await conn.execute(`
      SELECT v.fund_id, LEFT(f.nom_fond, 38) AS nom, f.pays, f.dev_libelle,
             COUNT(*) AS n_vl,
             ROUND(MIN(v.value), 2) AS v_min, ROUND(MAX(v.value), 2) AS v_max,
             ROUND(MAX(v.value) / MIN(v.value), 0) AS ratio
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
       WHERE v.value > 0 AND v.date >= DATE_SUB(CURDATE(), INTERVAL 400 DAY)
       GROUP BY v.fund_id, nom, f.pays, f.dev_libelle
      HAVING ratio > 20
       ORDER BY ratio DESC`);
    console.log(`   TOTAL : ${all.length} fonds touches\n`);
    console.log(table(all));

    console.log('\n   Repartition par pays et devise declaree :\n');
    const rep = {};
    for (const r of all) {
      const k = `${r.pays} / ${r.dev_libelle ?? 'NULL'}`;
      rep[k] = (rep[k] || 0) + 1;
    }
    for (const [k, n] of Object.entries(rep).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${k.padEnd(22)} ${n} fonds`);
    }

    // --- B. Coherence du referentiel : nom vs devise declaree ---
    console.log('\n## B. Fonds dont le NOM indique une devise etrangere mais dev_libelle dit autre chose\n');
    console.log('   (dev_libelle designe desormais la devise canonique : ces lignes doivent etre');
    console.log('    tranchees sur preuve prospectus ou SEC avant toute correction automatique)\n');
    const [ref] = await conn.execute(`
      SELECT id, LEFT(nom_fond, 44) AS nom, pays, dev_libelle, active
        FROM fond_investissements
       WHERE pays = 'NIGERIA'
         AND (nom_fond LIKE '%DOLLAR%' OR nom_fond LIKE '%EUROBOND%' OR nom_fond LIKE '%USD%')
         AND (dev_libelle IS NULL OR dev_libelle <> 'USD')
       ORDER BY nom_fond`);
    console.log(`   ${ref.length} fonds a arbitrer\n`);
    console.log(table(ref));

    // --- C. Faisabilite : couverture de bid_price_usd dans le staging ---
    console.log('\n## C. Couverture USD dans sec_ng_observations pour les fonds touches\n');
    const [cov] = await conn.execute(`
      SELECT o.matched_fund_id AS fund_id, LEFT(f.nom_fond, 32) AS nom, f.dev_libelle,
             COUNT(*) AS obs,
             SUM(o.bid_price_usd IS NOT NULL)   AS bid_usd,
             SUM(o.bid_price_ngn IS NOT NULL)   AS bid_ngn,
             SUM(o.offer_price_usd IS NOT NULL) AS offer_usd,
             SUM(o.unit_price_ngn IS NOT NULL)  AS unit_ngn,
             SUM(o.net_assets_usd IS NOT NULL)  AS na_usd,
             ROUND(100 * SUM(o.bid_price_usd IS NOT NULL) / COUNT(*), 1) AS pct_usd,
             MIN(o.valuation_date) AS d_min, MAX(o.valuation_date) AS d_max
        FROM sec_ng_observations o
        JOIN fond_investissements f ON f.id = o.matched_fund_id
       WHERE o.matched_fund_id IN (
               SELECT fund_id FROM (
                 SELECT v.fund_id
                   FROM valorisations v
                  WHERE v.value > 0 AND v.date >= DATE_SUB(CURDATE(), INTERVAL 400 DAY)
                  GROUP BY v.fund_id
                 HAVING MAX(v.value) / MIN(v.value) > 20
               ) AS t
             )
       GROUP BY o.matched_fund_id, nom, f.dev_libelle
       ORDER BY pct_usd DESC`);
    console.log(table(cov));

    console.log('\n   Synthese de faisabilite :\n');
    const [[synth]] = await conn.execute(`
      SELECT COUNT(*) AS obs_total,
             SUM(bid_price_usd IS NOT NULL) AS avec_bid_usd,
             ROUND(100 * SUM(bid_price_usd IS NOT NULL) / COUNT(*), 1) AS pct
        FROM sec_ng_observations`);
    console.log(`     sec_ng_observations : ${synth.obs_total} observations, ` +
                `${synth.avec_bid_usd} avec bid_price_usd (${synth.pct} %)`);

    // --- D. Preuve par l exemple : les deux devises cote a cote ---
    console.log('\n## D. Fonds 1141 — staging (2 devises) confronte a valorisations\n');
    const [side] = await conn.execute(`
      SELECT o.valuation_date AS date_obs,
             ROUND(o.bid_price_ngn, 4) AS stg_bid_ngn,
             ROUND(o.bid_price_usd, 4) AS stg_bid_usd,
             ROUND(v.value, 4)         AS prod_value,
             v.currency_code           AS prod_devise,
             o.quality_status, o.sec_document_id
        FROM sec_ng_observations o
        LEFT JOIN valorisations v
               ON v.fund_id = o.matched_fund_id AND DATE(v.date) = o.valuation_date
       WHERE o.matched_fund_id = 1141
       ORDER BY o.valuation_date DESC
       LIMIT 20`);
    console.log(table(side.reverse()));

    // --- E. Cas particulier 1196 : trois echelles ---
    console.log('\n## E. Fonds 1196 — les trois echelles confrontees au staging\n');
    const [c1196] = await conn.execute(`
      SELECT FLOOR(LOG10(v.value)) AS ordre, COUNT(*) AS n,
             ROUND(MIN(v.value), 2) AS v_min, ROUND(MAX(v.value), 2) AS v_max,
             MIN(v.date) AS d_min, MAX(v.date) AS d_max,
             SUM(o.bid_price_usd IS NOT NULL) AS stg_usd_dispo,
             ROUND(AVG(o.bid_price_usd), 4)   AS stg_usd_moy,
             ROUND(AVG(o.bid_price_ngn), 2)   AS stg_ngn_moy
        FROM valorisations v
        LEFT JOIN sec_ng_observations o
               ON o.matched_fund_id = v.fund_id AND o.valuation_date = DATE(v.date)
       WHERE v.fund_id = 1196 AND v.value > 0
       GROUP BY ordre
       ORDER BY ordre`);
    console.log(table(c1196));

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
