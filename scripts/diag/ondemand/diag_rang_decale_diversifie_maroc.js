/**
 * Quel fonds est decale, et pourquoi ? — le residu de DIVERSIFIE MAROC.
 *
 * POURQUOI. Mesure du 2026-10-15 : sur les cinq plus grosses categories
 * nationales, les rangs stockes correspondent a l ordre que la production
 * calcule pour **719 fonds sur 720**. Une seule exception, DIVERSIFIE MAROC :
 * 140 sur 141, ecart de rang maximal **1**. Le tri force numerique
 * (`ORDER BY CAST(ytd AS DECIMAL)`) donne le meme 140/141, donc ce n est pas un
 * artefact de comparateur comme l etait le « 7/122 » d ACTIONS MAROC.
 *
 * Un fonds decale d exactement un rang ressemble a un departage d ex aequo : le
 * SQL de `ranking.service.js:87-100` n a pas d `ORDER BY`, et `rankFundInList`
 * trie en memoire par `b[period] - a[period]`. Entre deux valeurs EGALES,
 * l ordre depend de l ordre de lecture renvoye par MySQL, qui n est pas garanti
 * d un run a l autre. Un rang instable n est pas un rang valide.
 *
 * Mais « ressemble a » n est pas « est ». Ce script nomme le fonds, montre son
 * `ytd` et celui de ses voisins de rang, et tranche entre trois causes :
 *
 *   EX AEQUO   son `ytd` est exactement egal a celui du fonds avec lequel il
 *              est permute → le correctif est un departage deterministe par
 *              `fond_id`, six lignes dans `ranking.pure.js`.
 *   ARRONDI    les deux `ytd` different d un epsilon invisible a l affichage
 *              → c est un probleme de precision, pas d ordre.
 *   AUTRE      les deux `ytd` sont franchement differents → la cause est
 *              ailleurs et il faut continuer a chercher.
 *
 * Le perimetre est UNE categorie et quelques lignes : ce script doit rester
 * court, le canal a la demande passant par une session SSH unique.
 *
 * LECTURE SEULE : uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_rang_decale_diversifie_maroc.js [categorie]
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

const CATEGORIE = process.argv[2] || 'DIVERSIFIE MAROC';

(async () => {
  console.log('=== QUEL FONDS EST DECALE, ET POURQUOI ? ===');
  console.log(`Categorie : ${CATEGORIE}`);
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // La requete de la production, mot pour mot (ranking.service.js:87-100).
    const [perfs] = await conn.execute(`
      SELECT p1.fond_id, p1.ytd
        FROM performences p1
        INNER JOIN (
          SELECT fond_id, MAX(date) AS max_date FROM performences
           WHERE categorie_nationale = ? GROUP BY fond_id
        ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
       WHERE p1.categorie_nationale = ?`, [CATEGORIE, CATEGORIE]);

    const [stockes] = await conn.execute(`
      SELECT c.fond_id, c.rank1erJanvier AS rang, f.nom_fond
        FROM classementfonds c
        LEFT JOIN fond_investissements f ON f.id = c.fond_id
       WHERE c.type_classement = 1 AND c.categorie_nationale = ?
         AND c.rank1erJanvier IS NOT NULL`, [CATEGORIE]);

    const nom = new Map(stockes.map(r => [r.fond_id, r.nom_fond || '(sans nom)']));
    const ytd = new Map(perfs.map(r => [r.fond_id, r.ytd]));

    // L ordre que la production calcule, avec le code de la production.
    const attendu = new Map();
    for (const p of perfs) {
      const [rang] = rankFundInList(perfs, p.fond_id, 'ytd');
      if (rang) attendu.set(p.fond_id, rang);
    }

    const decales = [];
    for (const r of stockes) {
      const a = attendu.get(r.fond_id);
      const reel = Number(r.rang);
      if (a == null || !Number.isFinite(reel) || a === reel) continue;
      decales.push({ fond_id: r.fond_id, attendu: a, stocke: reel, ecart: reel - a });
    }

    console.log(`## Fonds compares : ${attendu.size} | decales : ${decales.length}`);
    if (!decales.length) {
      console.log('  Aucun decalage : les rangs stockes correspondent exactement a'
        + ' l ordre de la production sur cette categorie.');
      return;
    }

    // Qui occupe, dans l ordre attendu, le rang que le fonds decale porte en
    // base ? C est avec celui-la qu il est permute.
    const parRangAttendu = new Map([...attendu.entries()].map(([id, r]) => [r, id]));

    for (const d of decales) {
      const voisin = parRangAttendu.get(d.stocke);
      const yA = ytd.get(d.fond_id), yB = voisin == null ? null : ytd.get(voisin);
      console.log(`\n  [${d.fond_id}] ${String(nom.get(d.fond_id)).slice(0, 44)}`);
      console.log(`      rang attendu ${d.attendu} | rang stocke ${d.stocke} | ecart ${d.ecart > 0 ? '+' : ''}${d.ecart}`);
      console.log(`      son ytd                      : ${yA}`);
      if (voisin == null) {
        console.log('      personne n occupe ce rang dans l ordre attendu — perimetre a instruire');
        continue;
      }
      console.log(`      [${voisin}] ${String(nom.get(voisin) || '(hors classement)').slice(0, 40)}`);
      console.log(`      ytd du fonds de ce rang      : ${yB}`);

      // Comparaison en CHAINE et en NOMBRE : les deux comptent. Deux chaines
      // differentes peuvent donner le meme nombre, et c est precisement le cas
      // qui produit un ex aequo invisible a la lecture.
      const memeChaine = String(yA) === String(yB);
      const nA = Number(yA), nB = Number(yB);
      const memeNombre = Number.isFinite(nA) && Number.isFinite(nB) && nA === nB;
      const ecartNum = Number.isFinite(nA) && Number.isFinite(nB) ? Math.abs(nA - nB) : null;

      console.log(`      egalite : chaine ${memeChaine ? 'OUI' : 'non'} | nombre ${memeNombre ? 'OUI' : 'non'}`
        + (ecartNum == null ? '' : ` | ecart numerique ${ecartNum}`));
      console.log(`      → ${memeNombre
        ? 'EX AEQUO : les deux ytd sont numeriquement egaux. L ordre entre eux n est'
          + ' pas deterministe (pas d ORDER BY cote SQL, tri en memoire cote JS).'
          + ' Correctif : departage par fond_id dans rankFundInList.'
        : ecartNum != null && ecartNum < 1e-6
          ? 'ARRONDI : les deux ytd different d un epsilon. C est un probleme de'
            + ' precision, pas d ordre.'
          : 'AUTRE : les deux ytd sont franchement differents. La cause n est ni un'
            + ' ex aequo ni un arrondi — a continuer d instruire.'}`);
    }
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
