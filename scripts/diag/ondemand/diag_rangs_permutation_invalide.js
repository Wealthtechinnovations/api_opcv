/**
 * Combien de categories ont un classement qui n est PAS une permutation de
 * 1..N ? Et par quel mecanisme ?
 *
 * CE QUE LA MESURE A ETABLI. Le 2026-10-15 19:08 UTC, sur DIVERSIFIE MAROC :
 *
 *   141 lignes | 140 rangs distincts | rang max 141
 *   doublon : rang 81 porte par [594] WG DYNAMIC ET [828] FCP CAPITAL BALANCE
 *   trou    : rang 80 porte par personne
 *   aucun fonds ecarte pour ytd nul : le denominateur n est pas la cause
 *
 * Ce n est donc pas « un fonds mal classe ». C est une **numerotation
 * invalide** : le rang 80 est vacant et le rang 81 est double.
 *
 * ET VOICI CE QUE CELA DIT DU CALCUL. `rankFundInList` fait
 * `validPerformances.findIndex(f => f.fond_id === fundId) + 1` : dans UN appel,
 * deux fonds distincts occupent forcement deux indices distincts. Un doublon ne
 * peut donc pas naitre d un seul appel. Or la route appelle `calculateRankNational`
 * **une fois par fonds**, en rejouant sa requete SQL a chaque fois
 * (`ranking.service.js:87-100`). Les rangs ecrits ne proviennent pas d un
 * classement unique : ils proviennent de ~1 245 classements independants.
 *
 * DEUX MECANISMES PLAUSIBLES, ET IL NE FAUT PAS CHOISIR PAR PREFERENCE.
 *
 *   (i) COMPARATEUR QUI REND NaN. `ytd` est un `varchar(255)` (mesure L0.d) et
 *       le tri fait `b[period] - a[period]`. Une valeur non numerique qui n est
 *       ni `null`, ni `'-'`, ni vide — par exemple « 1,234 » avec une virgule,
 *       ou une chaine d espaces — donne NaN. Un comparateur qui rend NaN produit
 *       un ordre **non specifie** : deux appels successifs peuvent classer
 *       differemment, d ou un rang double et un rang vacant.
 *
 *  (ii) INSTANTANE INCOHERENT. Entre le premier et le dernier des 1 245 appels,
 *       la table `performences` peut etre ecrite — le cron recalcule les
 *       performances juste avant les classements. Chaque appel voit alors un
 *       jeu de donnees legerement different, et l union des rangs n est plus une
 *       permutation.
 *
 * L ENJEU. Si c est (i), le correctif est local : assainir le comparateur. Si
 * c est (ii), le correctif est structurel : calculer le classement d une
 * categorie en UNE passe au lieu d un appel par fonds. Les deux sont du gros
 * oeuvre sur une route de production : ce script ne fait que mesurer, pour que
 * la decision repose sur des chiffres et non sur une intuition.
 *
 * CE QU IL MESURE :
 *   1. l ampleur — combien de categories, sur les trois tables de classement,
 *      ont des doublons ou des trous, et combien de rangs sont concernes ;
 *   2. les valeurs `ytd` non numeriques, qui testent le mecanisme (i) ;
 *   3. pour la categorie temoin, si les deux fonds du rang double ont des `ytd`
 *      qui se comparent proprement.
 *
 * LECTURE SEULE : uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_rangs_permutation_invalide.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

// Les trois tables, et la colonne de rang qui correspond a `ytd`.
const TABLES = [
  { t: 'classementfonds', r: 'rank1erJanvier', p: 'performences' },
  { t: 'classementfonds_eurs', r: 'rank1erJanvier', p: 'performences_eurs' },
  { t: 'classementfonds_usds', r: 'rank1erJanvier', p: 'performences_usds' },
];

// Colonnes de categorie possibles, par ordre de preference. La requete
// d origine prenait `categorie_nationale` pour acquis sur les trois tables ;
// sur les tables devise elle rendait zero categorie, et le script concluait
// « toutes les numerotations sont propres ». Zero categorie JUGEE ne veut pas
// dire zero defaut : cela veut dire que le critere est VIDE. On decouvre donc
// la colonne reellement presente, et on le dit.
const CANDIDATS_CATEGORIE = [
  'categorie_nationale', 'categorie_national', 'categorie',
  'categorie_regionale', 'categorie_afrique', 'categorie_globale',
  'categorie_interne', 'categorie_fundafrica',
];

// Sortie non nulle si un perimetre se revele vide : un controle vide doit
// echouer bruyamment, pas rendre du vert. C est exactement le piege que ce
// depot a deja paye deux fois (perimetre de C10, seuils de C4).
let perimetresVides = 0;

async function colonnesDe(conn, table) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME AS c, DATA_TYPE AS t
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`, [table]);
  return rows.map(r => ({ c: String(r.c), t: String(r.t) }));
}

(async () => {
  console.log('=== LES CLASSEMENTS STOCKES SONT-ILS DES PERMUTATIONS DE 1..N ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. Ampleur, sur les trois tables -------------------------------
    for (const { t, r } of TABLES) {
      console.log(`## ${t}`);
      let categories = [];
      let colCat = null, totalLignes = 0;
      try {
        const cols = await colonnesDe(conn, t);
        if (!cols.length) {
          console.log(`  ECHEC : table absente ou illisible. CRITERE VIDE.\n`);
          perimetresVides++;
          continue;
        }
        const noms = new Set(cols.map(x => x.c));
        colCat = CANDIDATS_CATEGORIE.find(x => noms.has(x)) || null;
        const aTypeClassement = noms.has('type_classement');
        // `conn.query` rend [rows, fields] : un niveau d enveloppe de trop
        // donnait `NaN lignes` dans la sortie du 2026-10-21 19:37 UTC.
        const [cnt] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
        totalLignes = Number(cnt[0].n);

        if (!noms.has(r)) {
          console.log(`  ECHEC : colonne de rang \`${r}\` absente.`
            + ` Colonnes presentes : ${cols.map(x => x.c).join(', ')}`);
          console.log(`  CRITERE VIDE — rien n a ete juge sur ${totalLignes} lignes.\n`);
          perimetresVides++;
          continue;
        }
        if (!colCat) {
          console.log(`  ECHEC : aucune colonne de categorie connue.`
            + ` Colonnes presentes : ${cols.map(x => x.c).join(', ')}`);
          console.log(`  CRITERE VIDE — rien n a ete juge sur ${totalLignes} lignes.\n`);
          perimetresVides++;
          continue;
        }
        console.log(`  ${totalLignes} lignes | categorie lue dans \`${colCat}\``
          + ` | type_classement ${aTypeClassement ? 'present' : 'ABSENT (filtre omis)'}`);

        // Le filtre sur `type_classement` n est applique que si la colonne
        // existe : l imposer a une table qui ne l a pas vidait le perimetre.
        const clauseType = aTypeClassement ? 'type_classement = 1 AND' : '';
        const [c] = await conn.query(
          `SELECT \`${colCat}\` AS cat, COUNT(*) AS n,
                  COUNT(DISTINCT \`${r}\`) AS distincts,
                  MAX(CAST(\`${r}\` AS UNSIGNED)) AS maxrang
             FROM \`${t}\`
            WHERE ${clauseType} \`${colCat}\` IS NOT NULL
              AND \`${colCat}\` <> '' AND \`${r}\` IS NOT NULL
            GROUP BY \`${colCat}\`
           HAVING n >= 5
            ORDER BY n DESC`);
        categories = c;
      } catch (e) {
        console.log(`  ECHEC : table non interrogeable : ${e.message}`);
        console.log(`  CRITERE VIDE — rien n a ete juge.\n`);
        perimetresVides++;
        continue;
      }

      if (!categories.length) {
        // MESURE DU 2026-10-21 19:37 UTC : sur les tables devise, les colonnes
        // `categorie_nationale` ET `type_classement` sont bien PRESENTES. Ma
        // cause supposee — une colonne manquante — est donc FAUSSE. Le
        // perimetre se vide ailleurs, et seul un decompte clause par clause
        // peut dire ou. Pas de nouvelle hypothese : des chiffres.
        try {
          const colCatE = colCat, rE = r;
          const [d] = await conn.query(
            `SELECT COUNT(*) AS total,
                    SUM(type_classement = 1) AS type1,
                    SUM(\`${colCatE}\` IS NOT NULL AND \`${colCatE}\` <> '') AS avecCat,
                    SUM(\`${rE}\` IS NOT NULL) AS avecRang,
                    COUNT(DISTINCT type_classement) AS typesDistincts,
                    COUNT(DISTINCT \`${colCatE}\`) AS catsDistinctes
               FROM \`${t}\``);
          const x = d[0];
          console.log(`  Decompte clause par clause, pour savoir OU le perimetre se vide :`);
          console.log(`    lignes totales                         ${x.total}`);
          console.log(`    dont type_classement = 1               ${x.type1}`);
          console.log(`    dont categorie non vide                ${x.avecCat}`);
          console.log(`    dont \`${rE}\` non nul   ${x.avecRang}`);
          console.log(`    valeurs distinctes de type_classement  ${x.typesDistincts}`);
          console.log(`    categories distinctes                  ${x.catsDistinctes}`);
          const [vals] = await conn.query(
            `SELECT type_classement AS v, COUNT(*) AS n FROM \`${t}\`
              GROUP BY type_classement ORDER BY n DESC LIMIT 6`);
          console.log(`    repartition de type_classement : `
            + vals.map(v => `${JSON.stringify(v.v)}=${v.n}`).join(', '));
          const [cats] = await conn.query(
            `SELECT \`${colCatE}\` AS c, COUNT(*) AS n FROM \`${t}\`
              GROUP BY \`${colCatE}\` ORDER BY n DESC LIMIT 6`);
          console.log(`    categories les plus peuplees : `
            + cats.map(c => `${JSON.stringify(c.c)}=${c.n}`).join(', '));
        } catch (e) {
          console.log(`    (decompte impossible : ${e.message})`);
        }
        // LE POINT DE CE LOT. Zero categorie d au moins 5 fonds sur une table
        // qui porte des milliers de lignes n est pas un resultat vert, c est un
        // controle qui ne mesure rien. On le dit, et on sort non nul.
        console.log(`  ECHEC : 0 categorie d au moins 5 fonds retenue, alors que la`
          + ` table porte ${totalLignes} lignes.`);
        console.log(`  CRITERE VIDE — ce n est PAS « toutes propres ». Le perimetre`
          + ` est vide : filtre ou colonne de categorie a revoir.\n`);
        perimetresVides++;
        continue;
      }
      let invalides = 0, rangsEnTrop = 0;
      const exemples = [];
      for (const c of categories) {
        const n = Number(c.n), d = Number(c.distincts), mx = Number(c.maxrang);
        // Une permutation propre de 1..N : N lignes, N rangs distincts, max = N.
        const propre = n === d && mx === n;
        if (propre) continue;
        invalides++;
        rangsEnTrop += (n - d);
        if (exemples.length < 8) {
          exemples.push(`${String(c.cat).slice(0, 30)} : ${n} lignes, ${d} distincts, max ${mx}`
            + ` → ${n - d} doublon(s), ${mx - d} trou(s)`);
        }
      }
      console.log(`  ${categories.length} categories d au moins 5 fonds`
        + ` | ${invalides} dont la numerotation n est PAS une permutation de 1..N`
        + ` | ${rangsEnTrop} rang(s) double(s) au total`);
      for (const e of exemples) console.log(`    ${e}`);
      console.log(`  → ${invalides === 0
        ? `toutes les numerotations sont propres sur les ${categories.length} categories JUGEES.`
        : invalides > categories.length * 0.1
          ? 'ce n est pas un accident isole : le defaut est STRUCTUREL.'
          : 'defaut circonscrit a quelques categories.'}\n`);
    }

    // ---- 2. Le mecanisme (i) : des ytd non numeriques ? -----------------
    // `null`, `'-'` et `''` sont deja ecartes par `rankFundInList`. Ce qui
    // casserait le tri, c est une valeur qui PASSE ce filtre et donne NaN.
    console.log('## Mecanisme (i) — valeurs ytd qui passent le filtre et donnent NaN');
    for (const { p } of TABLES) {
      try {
        const [d] = await conn.query(
          `SELECT COUNT(*) AS suspectes
             FROM \`${p}\`
            WHERE ytd IS NOT NULL AND ytd <> '-' AND ytd <> ''
              AND ytd NOT REGEXP '^-?[0-9]+(\\\\.[0-9]+)?([eE][-+]?[0-9]+)?$'`);
        const [ech] = await conn.query(
          `SELECT DISTINCT ytd FROM \`${p}\`
            WHERE ytd IS NOT NULL AND ytd <> '-' AND ytd <> ''
              AND ytd NOT REGEXP '^-?[0-9]+(\\\\.[0-9]+)?([eE][-+]?[0-9]+)?$'
            LIMIT 5`);
        console.log(`  ${p.padEnd(20)} ${d[0].suspectes} valeur(s) non numerique(s)`
          + (ech.length ? ` | exemples : ${ech.map(x => JSON.stringify(x.ytd)).join(', ')}` : ''));
      } catch (e) {
        console.log(`  ${p.padEnd(20)} non interrogeable : ${e.message}`);
      }
    }
    console.log('  → si ce compte est nul partout, le mecanisme (i) est ecarte et il reste');
    console.log('    (ii) : un instantane incoherent entre les ~1 245 appels de la route.\n');

    // ---- 3. La categorie temoin -----------------------------------------
    const [temoin] = await conn.execute(`
      SELECT fond_id, ytd FROM performences
       WHERE fond_id IN (594, 828)
         AND date = (SELECT MAX(date) FROM performences p2 WHERE p2.fond_id = performences.fond_id)`);
    console.log('## Categorie temoin — les deux fonds du rang double');
    for (const r of temoin) {
      const n = Number(r.ytd);
      console.log(`  [${r.fond_id}] ytd = ${JSON.stringify(r.ytd)}`
        + ` | Number() = ${n} | numerique : ${Number.isFinite(n) ? 'OUI' : 'NON'}`);
    }
    console.log('  → deux ytd numeriques et differents ne peuvent pas donner le meme rang');
    console.log('    dans un seul appel : la cause est dans le fait qu il y a 1 245 appels.');
  } finally {
    await conn.end();
  }
  if (perimetresVides) {
    console.log(`\n=== ECHEC DU CONTROLE : ${perimetresVides} perimetre(s) VIDE(S) ===`);
    console.log('Un controle qui ne juge rien ne doit pas rendre du vert. Tant qu un');
    console.log('perimetre est vide, cette table n est PAS attestee : elle est');
    console.log('simplement non mesuree, et la difference est tout le sujet.');
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
  if (perimetresVides) process.exitCode = 2;
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
