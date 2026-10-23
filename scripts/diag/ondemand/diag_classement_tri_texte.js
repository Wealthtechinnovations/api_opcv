/**
 * L0.d — « Les rangs ne suivent pas les performances » : et si c etait le
 * comparateur, et non la production ?
 *
 * POURQUOI CE SCRIPT EXISTE. Deux mesures du 2026-10-07 15:21 UTC, sur la MEME
 * categorie, le MEME champ, la MEME assiette, se contredisaient de bout en bout :
 *
 *   diag_classements.js          ACTIONS MAROC  7/122 au bon rang, rho 0,474 — DIVERGE
 *   diag_classement_vs_perf.js   ACTIONS MAROC  ecart de rang max = 0, rho 1,000
 *   C12 (check_doc_drift.js)     ACTIONS MAROC  122/122 — 100,0 %
 *
 * Les trois ne peuvent pas avoir raison. Et la difference n est pas dans ce
 * qu ils comparent, elle est dans la maniere dont ils construisent l ordre
 * attendu :
 *
 *   diag_classements.js   ORDER BY p.ytd DESC              ← tri par SQL
 *   C12                   rankFundInList(...)              ← tri numerique JS,
 *                         le code de la PRODUCTION
 *
 * Si la colonne `ytd` est de type TEXTE en base, le premier tri est
 * LEXICOGRAPHIQUE : « 9.5 » passe devant « 10.2 », et « -1.3 » se retrouve
 * ailleurs encore. L ordre attendu serait alors faux, le verdict « DIVERGE »
 * un artefact du controle, et la production innocente sur ce point.
 * L hypothese n est pas gratuite : L0.a a mesure que `volatility3an`,
 * `ratiosharpe3an` et `perfannu3an` sont des `varchar(255)` alors que
 * `src/models/performence.js` les declare en DOUBLE. Le modele et la base ne
 * disent pas la meme chose, et c est la base qui fait foi.
 *
 * L ENJEU EST CELUI QUE CLAUDE.md DECRIT. « CODE_REVIEW #34 a affirme pendant
 * deux mois UEMOA stale 233 jours — faux sur les deux points. » J ai repris le
 * 7/122 dans les lots BX et BY et dans le plan de remediation comme un fait
 * etabli. Il venait du comparateur, et une reconstruction de classement inutile
 * etait sur le point d etre recommandee au proprietaire.
 *
 * TROIS ORDRES ATTENDUS, LE MEME JUGE. Le script construit l ordre attendu de
 * trois facons et mesure la concordance de chacune avec les rangs stockes :
 *   A. ORDER BY ytd DESC                        — ce que faisait diag_classements.js
 *   B. ORDER BY CAST(ytd AS DECIMAL(30,10)) DESC — le meme tri, force numerique
 *   C. rankFundInList importe de `ranking.pure.js` — LE CODE DE LA PRODUCTION
 * Si A diverge et que B et C concordent, le defaut est demontre dans le
 * comparateur, par les donnees et non par un schema. Si les trois divergent, le
 * defaut est dans la production et la reconstruction se justifie.
 *
 * Mesure aussi l egalite STRICTE a cote de l egalite numerique : si la colonne
 * de rang est du texte, `"5" === 5` est faux alors que `"5" - 5` vaut zero, et
 * c est exactement ce qui a casse le compteur de `diag_classement_vs_perf.js`.
 *
 * LECTURE SEULE : uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_classement_tri_texte.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const { rankFundInList } = require('../../../src/services/ranking.pure');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const CATEGORIES_TESTEES = 5;

function rho(paires) {
  const n = paires.length;
  if (n < 3) return null;
  const sd2 = paires.reduce((s, [a, b]) => s + (a - b) ** 2, 0);
  return 1 - (6 * sd2) / (n * (n * n - 1));
}

// Concordance entre un ordre attendu (Map fond_id -> rang) et les rangs
// stockes. Comparaison NUMERIQUE : c est l erreur a ne pas refaire. L egalite
// stricte est comptee a part, pour exposer l artefact plutot que le subir.
function juger(rangsAttendus, rangStocke) {
  const paires = [];
  let exacts = 0, stricts = 0, ecartMax = 0;
  for (const [id, brut] of rangStocke) {
    const attendu = rangsAttendus.get(id);
    if (attendu == null) continue;
    const reel = Number(brut);
    if (!Number.isFinite(reel)) continue;
    paires.push([attendu, reel]);
    if (attendu === reel) exacts++;
    if (attendu === brut) stricts++;
    const e = Math.abs(attendu - reel);
    if (e > ecartMax) ecartMax = e;
  }
  return { paires, exacts, stricts, ecartMax, r: rho(paires) };
}

const ligne = (nom, j) => `    ${nom.padEnd(44)} ${String(j.exacts).padStart(4)}/${String(j.paires.length).padEnd(4)}`
  + ` exacts (${(100 * j.exacts / Math.max(j.paires.length, 1)).toFixed(1).padStart(5)} %)`
  + ` | rho ${j.r == null ? '  n/a' : j.r.toFixed(3).padStart(6)}`
  + ` | ecart max ${String(j.ecartMax).padStart(4)}`;

(async () => {
  console.log('=== L0.d — LE TRI DU COMPARATEUR EST-IL LA CAUSE DU « DIVERGE » ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 0. Le type REEL des deux colonnes en cause ----------------------
    const [types] = await conn.execute(`
      SELECT table_name AS t, column_name AS c, column_type AS ct
        FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND (   (table_name = 'performences'    AND column_name IN ('ytd', 'perf3m', 'perf6m'))
              OR (table_name = 'classementfonds' AND column_name IN ('rank1erJanvier', 'rank1erJanviertotal')))
       ORDER BY table_name, column_name`);
    console.log('## 0. Type REEL des colonnes en cause (la base fait foi, pas le modele)');
    let ytdTexte = null;
    for (const r of types) {
      const t = String(r.t || r.TABLE_NAME), c = String(r.c || r.COLUMN_NAME);
      const ct = String(r.ct || r.COLUMN_TYPE);
      console.log(`  ${t}.${c.padEnd(22)} ${ct}`);
      if (t === 'performences' && c === 'ytd') ytdTexte = /char|text|enum/i.test(ct);
    }
    console.log(`  → performences.ytd est ${ytdTexte === null ? 'INTROUVABLE'
      : ytdTexte ? 'du TEXTE : un ORDER BY dessus trie par ordre alphabetique, pas par valeur'
        : 'numerique : un ORDER BY dessus trie bien par valeur, et l hypothese du tri texte tombe'}\n`);

    // Demonstration directe, independante du type declare : les cinq plus
    // grandes valeurs selon chacun des deux tris SQL. Si elles different, le
    // tri texte est demontre par les DONNEES, pas deduit d un schema.
    const [brutTri] = await conn.query(
      'SELECT ytd FROM performences WHERE ytd IS NOT NULL ORDER BY ytd DESC LIMIT 5');
    const [numTri] = await conn.query(
      'SELECT ytd FROM performences WHERE ytd IS NOT NULL ORDER BY CAST(ytd AS DECIMAL(30,10)) DESC LIMIT 5');
    console.log('## 0bis. Les cinq plus grands ytd selon chacun des deux tris SQL');
    console.log(`  ORDER BY ytd DESC                  : ${brutTri.map(r => r.ytd).join(' | ')}`);
    console.log(`  ORDER BY CAST(ytd AS DECIMAL) DESC : ${numTri.map(r => r.ytd).join(' | ')}`);
    const memeTri = JSON.stringify(brutTri.map(r => String(r.ytd)))
      === JSON.stringify(numTri.map(r => String(r.ytd)));
    console.log(`  → les deux tris ${memeTri ? 'CONCORDENT' : 'DIFFERENT'}`
      + `${memeTri ? '' : ' : le tri par SQL sur cette colonne n est pas un tri par valeur'}\n`);

    const [cats] = await conn.execute(`
      SELECT categorie_nationale AS cat, COUNT(*) AS n
        FROM classementfonds
       WHERE type_classement = 1 AND categorie_nationale IS NOT NULL
         AND categorie_nationale <> ''
       GROUP BY categorie_nationale ORDER BY n DESC LIMIT ${CATEGORIES_TESTEES}`);

    for (const c of cats) {
      console.log(`########## ${c.cat} — ${c.n} fonds classes`);

      // A. L ordre attendu tel que diag_classements.js le construisait.
      const [ordreA] = await conn.query(`
        SELECT c.fond_id, p.ytd
          FROM classementfonds c
          JOIN performences p ON p.fond_id = c.fond_id
          JOIN (SELECT fond_id, MAX(date) AS d FROM performences GROUP BY fond_id) m
            ON m.fond_id = p.fond_id AND m.d = p.date
         WHERE c.type_classement = 1 AND c.categorie_nationale = ? AND p.ytd IS NOT NULL
         GROUP BY c.fond_id, p.ytd
         ORDER BY p.ytd DESC`, [c.cat]);

      // B. Le meme, tri force numerique.
      const [ordreB] = await conn.query(`
        SELECT c.fond_id, p.ytd
          FROM classementfonds c
          JOIN performences p ON p.fond_id = c.fond_id
          JOIN (SELECT fond_id, MAX(date) AS d FROM performences GROUP BY fond_id) m
            ON m.fond_id = p.fond_id AND m.d = p.date
         WHERE c.type_classement = 1 AND c.categorie_nationale = ? AND p.ytd IS NOT NULL
         GROUP BY c.fond_id, p.ytd
         ORDER BY CAST(p.ytd AS DECIMAL(30,10)) DESC`, [c.cat]);

      // C. Le code de la PRODUCTION, sur la requete de la production
      //    (ranking.service.js:87-100).
      const [perfs] = await conn.execute(`
        SELECT p1.fond_id, p1.ytd
          FROM performences p1
          INNER JOIN (
            SELECT fond_id, MAX(date) AS max_date FROM performences
             WHERE categorie_nationale = ? GROUP BY fond_id
          ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
         WHERE p1.categorie_nationale = ?`, [c.cat, c.cat]);

      const [stockes] = await conn.execute(`
        SELECT fond_id, rank1erJanvier AS rang
          FROM classementfonds
         WHERE type_classement = 1 AND categorie_nationale = ? AND rank1erJanvier IS NOT NULL`,
        [c.cat]);
      const rangStocke = new Map(stockes.map(r => [r.fond_id, r.rang]));
      const typeRang = stockes.length ? typeof stockes[0].rang : 'aucun';

      const mapDeListe = l => new Map(l.map((r, i) => [r.fond_id, i + 1]));
      const mapProduction = new Map();
      for (const p of perfs) {
        const [rang] = rankFundInList(perfs, p.fond_id, 'ytd');
        if (rang) mapProduction.set(p.fond_id, rang);
      }

      const jA = juger(mapDeListe(ordreA), rangStocke);
      const jB = juger(mapDeListe(ordreB), rangStocke);
      const jC = juger(mapProduction, rangStocke);

      console.log(`  type JS du rang stocke : ${typeRang}`
        + ` | egalite STRICTE (===) : A ${jA.stricts}, B ${jB.stricts}, C ${jC.stricts}`
        + `${typeRang === 'string' ? ' ← le rang est une chaine : tout === contre un nombre est faux' : ''}`);
      console.log(ligne('A. ORDER BY ytd DESC (ancien comparateur)', jA));
      console.log(ligne('B. ORDER BY CAST(ytd AS DECIMAL) DESC', jB));
      console.log(ligne('C. rankFundInList — code de la production', jC));

      const bonC = jC.ecartMax === 0;
      const mauvaisA = jA.ecartMax > 0;
      console.log(`  → ${bonC && mauvaisA
        ? 'VERDICT : les rangs stockes correspondent EXACTEMENT a l ordre que la'
          + ' production calcule. Le « DIVERGE » venait du TRI du comparateur, pas de la base.'
        : bonC
          ? 'les trois ordres concordent : rien a corriger ici.'
          : 'l ordre de la production ne correspond PAS aux rangs stockes : la divergence'
            + ' est reelle, et la reconstruction des classements se justifie.'}\n`);
    }
  } finally {
    await conn.end();
  }
  console.log('=== FIN L0.d — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC L0.d :', e.message); process.exit(1); });
