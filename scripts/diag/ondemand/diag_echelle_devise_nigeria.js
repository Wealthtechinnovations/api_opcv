/**
 * DIAG — quelles VL nigeriannes sont enregistrees dans la MAUVAISE DEVISE.
 *
 * LECTURE SEULE. Uniquement des SELECT. Aucune ecriture, aucune suppression.
 *
 * CE QUE LA MESURE DU 2026-10-30 A ETABLI, depuis l'API de production et sans
 * acces base. Le controle C7 signale 15 fonds dont la serie de VL melange deux
 * echelles sur 12 mois. En les classant un par un, 14 sont nigerians et leur
 * rapport max/min tombe entre 1 425 et 2 012 — et surtout, leurs valeurs basses
 * forment des BLOCS RECENTS : 2026-05-15, 2026-07-10, 2026-07-24, 2026-10-09.
 *
 * Test de coherence INTERNE, qui ne depend d'aucune donnee exterieure : a chaque
 * frontiere entre un point bas et un point haut voisins, le rapport des deux
 * valeurs est le taux implicite a cette date. Si ce rapport est un taux de
 * change, des fonds DIFFERENTS doivent donner la MEME valeur aux MEMES dates.
 *
 *   mois      fonds   mediane   dispersion
 *   2026-05     12     1 374,9      4,2 %
 *   2026-06     10     1 369,3      9,5 %
 *   2026-07      9     1 378,7      4,5 %
 *   2023-12      2       997,0      9,0 %
 *
 * Douze fonds de tailles et de VL differentes ne convergent pas a 4 % pres par
 * hasard. **C'est un taux de change**, et sa derive lente (1 375 -> 1 369 ->
 * 1 379) est celle du taux lui-meme. Conclusion : depuis ~mai 2026, des VL de
 * fonds en dollars sont enregistrees en USD dans une serie declaree en NGN.
 *
 * CONSEQUENCE DEJA VISIBLE EN PRODUCTION, et c'est pour cela que ce diagnostic
 * compte : le controle C3 sert un YTD de **143 958 %** sur le fonds 1141. Ce
 * n'est pas une erreur de formule — 165 207 / 114,47 = 1 443, soit exactement le
 * taux. La performance affichee aux investisseurs EST le taux de change.
 *
 * CE QUE CE SCRIPT APPORTE QUE L'API NE PEUT PAS DONNER :
 *   1. les lignes EXACTES de `valorisations` concernees, par fonds et par date,
 *      ce qu'il faut pour corriger sans toucher aux lignes saines ;
 *   2. la devise DECLAREE du fonds, pour savoir laquelle des deux echelles est
 *      la bonne — un fonds declare en NGN doit porter des NGN ;
 *   3. la confrontation au taux REELLEMENT stocke dans `devisedechanges`, seule
 *      facon de passer d'un taux « implicite » a un taux « publie ».
 *
 * CE QUE LA BASE A REPONDU LE 2026-10-30 14:49 UTC, et qui RENVERSE une partie
 * de l'analyse faite depuis l'API seule :
 *
 *   **DIX des quatorze fonds sont declares en USD**, quatre seulement en NGN
 *   (1141, 1239, 2768, 2856).
 *
 * Le sens de la correction est donc INVERSE selon le fonds :
 *   - fonds declare USD  -> les valeurs BASSES (~1 a 1 000) sont les BONNES,
 *                           les HAUTES (~150 000) sont du NGN contaminant ;
 *   - fonds declare NGN  -> l'inverse exactement.
 *
 * L'enonce « des VL en USD dans une serie declaree en NGN » ne valait donc que
 * pour 4 fonds sur 14. **C'est exactement le risque que l'avertissement ci-dessous
 * annonçait**, et la base l'a confirme avant qu'une seule ligne ne soit touchee.
 *
 * Volumetrie : **182 lignes** dans le groupe bas, du 2026-03-25 au 2026-10-09.
 *
 * CE SCRIPT NE CORRIGE RIEN, DELIBEREMENT. Rien ne doit etre converti avant que
 * la devise de reference de chaque fonds soit tranchee : diviser une ligne saine
 * par 1 375 fabriquerait le defaut symetrique, et plus discret car il
 * produirait des valeurs d'apparence plausible.
 *
 * Les noms de colonnes sont RESOLUS par `information_schema` et imprimes. Quatre
 * fois sur ce projet j'ai devine un nom de colonne et mesure du vide en croyant
 * mesurer la production.
 */
'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// Convention des scripts deja en service dans ce canal (cf.
// diag_benchmark_fraicheur.js) : mysql2 direct et dotenv, pas Sequelize. Ma
// premiere version requerait `src/models/sequelize`, qui n existe pas — le
// module est `src/db/sequelize.js`. Reprendre la convention du canal plutot que
// d en inventer une evite les deux erreurs a la fois.
const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const FONDS = [1239, 2809, 2773, 2766, 2774, 2771, 2768, 2775, 1141, 2772,
  2856, 2777, 2778, 2765];

async function colonne(conn, table, candidates) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [table]);
  const presentes = new Set(rows.map(r => r.COLUMN_NAME));
  for (const c of candidates) if (presentes.has(c)) return c;
  return null;
}

// Declare HORS de la fonction : sinon le `catch` final ne la voit pas, et
// tout echec reel serait masque par un `ReferenceError: conn is not defined`
// — l erreur de diagnostic la plus trompeuse qui soit.
let conn;

(async () => {
  conn = await mysql.createConnection(DB);
  console.log('=== ECHELLE DE DEVISE DES VL NIGERIANNES — LECTURE SEULE ===');
  console.log(`horodatage : ${new Date().toISOString()}`);
  console.log('Aucune ecriture. SELECT uniquement.\n');

  const colDate = await colonne(conn, 'valorisations', ['date', 'datejour', 'date_vl']);
  const colVal = await colonne(conn, 'valorisations', ['value', 'vl', 'valeur']);
  const colDev = await colonne(conn, 'fond_investissements',
    ['dev_libelle', 'devise', 'devise_locale']);
  console.log(`colonnes retenues : valorisations.${colDate}, `
    + `valorisations.${colVal}, fond_investissements.${colDev}`);
  if (!colDate || !colVal || !colDev) {
    console.log('ECHEC : une colonne attendue est absente. Rien n est conclu.');
    await conn.end();
    return;
  }

  const ids = FONDS.join(',');

  // 1. Les deux echelles, par fonds. Le seuil est le MILIEU GEOMETRIQUE de la
  //    serie : il separe deux ordres de grandeur sans supposer leur valeur.
  console.log('\n--- 1. Les deux groupes de valeurs, par fonds ---');
  const [groupes] = await conn.query(`
    SELECT v.fund_id, f.nom_fond, f.${colDev} AS devise_declaree,
           SUM(CASE WHEN v.${colVal} < s.seuil THEN 1 ELSE 0 END) AS n_bas,
           SUM(CASE WHEN v.${colVal} >= s.seuil THEN 1 ELSE 0 END) AS n_haut,
           ROUND(MIN(CASE WHEN v.${colVal} >= s.seuil THEN v.${colVal} END)
               / MAX(CASE WHEN v.${colVal} < s.seuil THEN v.${colVal} END), 1)
             AS ratio_frontiere,
           MIN(CASE WHEN v.${colVal} < s.seuil THEN v.${colDate} END) AS bas_debut,
           MAX(CASE WHEN v.${colVal} < s.seuil THEN v.${colDate} END) AS bas_fin
      FROM valorisations v
      JOIN fond_investissements f ON f.id = v.fund_id
      JOIN (SELECT fund_id, SQRT(MIN(${colVal}) * MAX(${colVal})) AS seuil
              FROM valorisations
             WHERE ${colVal} > 0 AND fund_id IN (${ids})
             GROUP BY fund_id) s ON s.fund_id = v.fund_id
     WHERE v.${colVal} > 0 AND v.fund_id IN (${ids})
     GROUP BY v.fund_id, f.nom_fond, f.${colDev}
     ORDER BY v.fund_id`);
  for (const r of groupes) {
    console.log(`  [${r.fund_id}] ${String(r.nom_fond).slice(0, 30).padEnd(30)} `
      + `declare=${String(r.devise_declaree).padEnd(5)} `
      + `bas=${String(r.n_bas).padStart(4)} haut=${String(r.n_haut).padStart(4)} `
      + `ratio=${r.ratio_frontiere}  bloc bas ${String(r.bas_debut).slice(0, 10)}`
      + ` -> ${String(r.bas_fin).slice(0, 10)}`);
  }

  // 2. Volumetrie a corriger. Le chiffre qui dimensionne l operation.
  console.log('\n--- 2. Nombre de lignes du groupe BAS (candidates) ---');
  const [vol] = await conn.query(`
    SELECT COUNT(*) AS n, MIN(v.${colDate}) AS d1, MAX(v.${colDate}) AS d2
      FROM valorisations v
      JOIN (SELECT fund_id, SQRT(MIN(${colVal}) * MAX(${colVal})) AS seuil
              FROM valorisations
             WHERE ${colVal} > 0 AND fund_id IN (${ids})
             GROUP BY fund_id) s ON s.fund_id = v.fund_id
     WHERE v.${colVal} > 0 AND v.fund_id IN (${ids})
       AND v.${colVal} < s.seuil`);
  console.log(`  ${vol[0].n} ligne(s), du ${String(vol[0].d1).slice(0, 10)} `
    + `au ${String(vol[0].d2).slice(0, 10)}`);

  // 3. VL a ZERO. Defaut DISTINCT, invisible a C7 qui filtre `value > 0`, mais
  //    servi au graphique par l API — un point a 0 sur une courbe de VL.
  // Defaut DISTINCT, invisible a C7 qui filtre `value > 0`, mais servi au
  // graphique par l API — un point a zero sur une courbe de valeur liquidative.
  //
  // COMPTE SANS PLAFOND. Ma premiere version s arretait a 25 lignes et les 25
  // etaient remplies : un plafond atteint ne dit RIEN de l ampleur reelle, et
  // j aurais pu lire « 25 » comme un total. Les zeros touchent d ailleurs bien
  // plus de fonds que les quatorze de C7 — STANBIC IBTC ABSOLUTE en portait
  // cinq a lui seul.
  console.log('\n--- 3. VL a ZERO (defaut distinct, hors perimetre de C7) ---');
  const [ztot] = await conn.query(`
    SELECT COUNT(*) AS n, COUNT(DISTINCT v.fund_id) AS nf,
           MIN(v.${colDate}) AS d1, MAX(v.${colDate}) AS d2
      FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
     WHERE v.${colVal} <= 0`);
  console.log(`  TOUS PAYS : ${ztot[0].n} ligne(s) sur ${ztot[0].nf} fonds, `
    + `du ${String(ztot[0].d1).slice(0, 10)} au ${String(ztot[0].d2).slice(0, 10)}`);
  const [zpays] = await conn.query(`
    SELECT f.pays, COUNT(*) AS n, COUNT(DISTINCT v.fund_id) AS nf
      FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
     WHERE v.${colVal} <= 0 GROUP BY f.pays ORDER BY n DESC`);
  for (const r of zpays) {
    console.log(`    ${String(r.pays).padEnd(10)} ${String(r.n).padStart(6)} ligne(s) `
      + `sur ${r.nf} fonds`);
  }
  const [zrecent] = await conn.query(`
    SELECT COUNT(*) AS n FROM valorisations v
     WHERE v.${colVal} <= 0 AND v.${colDate} >= DATE_SUB(CURDATE(), INTERVAL 400 DAY)`);
  console.log(`  dont ${zrecent[0].n} sur les 400 derniers jours`);

  // 4. Le taux PUBLIE, pour passer de « implicite » a « publie ».
  console.log('\n--- 4. Taux USD/NGN stocke dans devisedechanges ---');
  try {
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devisedechanges'`);
    console.log(`  colonnes : ${cols.map(c => c.COLUMN_NAME).join(', ')}`);
    // Schema releve le 2026-10-30 : id, paire, date, value, test.
    // LA QUESTION QUI COMPTE : la paire USD/NGN existe-t-elle ? Sans elle, la
    // plateforme n a AUCUN taux stocke pour arbitrer les deux echelles, et le
    // seul taux disponible serait celui que j ai deduit des series — un taux
    // implicite, non publie, qui ne doit pas servir a ecrire en base.
    const [ngn] = await conn.query(`
      SELECT paire, COUNT(*) AS n, MIN(date) AS d1, MAX(date) AS d2,
             MIN(value) AS vmin, MAX(value) AS vmax
        FROM devisedechanges
       WHERE paire LIKE '%NGN%'
       GROUP BY paire ORDER BY n DESC`);
    if (ngn.length === 0) {
      console.log('  AUCUNE paire contenant NGN. La plateforme ne stocke donc pas');
      console.log('  de taux naira : aucun arbitrage par taux publie n est possible');
      console.log('  en l etat, et le taux implicite deduit des series NE DOIT PAS');
      console.log('  servir a ecrire en base.');
    } else {
      for (const r of ngn) {
        console.log(`  ${String(r.paire).padEnd(9)} ${String(r.n).padStart(6)} pts  `
          + `${String(r.d1).slice(0, 10)} -> ${String(r.d2).slice(0, 10)}  `
          + `[${Number(r.vmin).toFixed(2)} .. ${Number(r.vmax).toFixed(2)}]`);
      }
    }
  } catch (e) {
    console.log(`  table illisible ou absente : ${e.message.slice(0, 90)}`);
  }

  console.log('\nLECTURE SEULE : aucune ecriture effectuee.');
  console.log('NE RIEN CONVERTIR avant d avoir tranche la devise de reference de');
  console.log('chaque fonds : diviser une ligne saine par ~1 375 fabriquerait le');
  console.log('defaut symetrique, et plus discret car d apparence plausible.');
  await conn.end();
})().catch(async (e) => {
  console.log(`ECHEC DU DIAGNOSTIC : ${e.message}`);
  try { await conn.end(); } catch (_) { /* rien */ }
});
