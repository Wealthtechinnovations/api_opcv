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

(async () => {
  console.log('=== LES CLASSEMENTS STOCKES SONT-ILS DES PERMUTATIONS DE 1..N ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. Ampleur, sur les trois tables -------------------------------
    for (const { t, r } of TABLES) {
      console.log(`## ${t}`);
      let categories = [];
      try {
        const [c] = await conn.query(
          `SELECT categorie_nationale AS cat, COUNT(*) AS n,
                  COUNT(DISTINCT \`${r}\`) AS distincts,
                  MAX(CAST(\`${r}\` AS UNSIGNED)) AS maxrang
             FROM \`${t}\`
            WHERE type_classement = 1 AND categorie_nationale IS NOT NULL
              AND categorie_nationale <> '' AND \`${r}\` IS NOT NULL
            GROUP BY categorie_nationale
           HAVING n >= 5
            ORDER BY n DESC`);
        categories = c;
      } catch (e) {
        console.log(`  table non interrogeable : ${e.message}\n`);
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
        ? 'toutes les numerotations sont propres sur cette table.'
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
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
