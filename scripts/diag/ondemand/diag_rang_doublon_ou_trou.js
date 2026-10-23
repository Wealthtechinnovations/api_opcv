/**
 * Un doublon ou un trou dans les rangs stockes ? — suite du fonds [594].
 *
 * CE QUE LA MESURE PRECEDENTE A REFUTE. Le 2026-10-15 18:56 UTC,
 * `diag_rang_decale_diversifie_maroc.js` a nomme le fonds decale de
 * DIVERSIFIE MAROC : **[594] WG DYNAMIC**, rang attendu 80, rang stocke 81,
 * ecart +1. Mon hypothese etait un ex aequo non departage. Elle est fausse :
 *
 *   son ytd                  : -2.6527921191061066
 *   ytd du fonds du rang 81  : -2.7201245276142414   ([828] FCP CAPITAL BALANCE)
 *   ecart numerique          : 0.067  → ni ex aequo, ni arrondi
 *
 * ET CE QUE CELA LAISSE COMME SEULE EXPLICATION PLAUSIBLE. Un seul fonds sur
 * 141 est decale, et d exactement un rang. Ce n est donc pas une permutation :
 * une permutation decalerait DEUX fonds. Ce n est pas non plus un decalage
 * global, qui toucherait les soixante fonds situes sous le rang 80.
 *
 * Il reste la numerotation elle-meme : si deux fonds portent le MEME rang
 * stocke au-dessus de 80, ou si un rang est saute, alors la suite des rangs
 * stockes n est pas une permutation de 1..N et un fonds isole peut se retrouver
 * decale sans que son voisin bouge.
 *
 * CE SCRIPT LE VERIFIE, par trois mesures et aucune supposition :
 *   1. la suite des rangs stockes est-elle exactement 1..N, une fois chacun ?
 *      Doublons et trous, listes.
 *   2. qui porte le rang 80 en base, et qui le porte dans l ordre attendu ?
 *   3. combien de fonds de la categorie ont un `ytd` nul ou `'-'` — donc exclus
 *      par `rankFundInList` du denominateur alors qu ils comptent peut-etre dans
 *      le `*total` stocke.
 *
 * LECTURE SEULE : uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_rang_doublon_ou_trou.js [categorie]
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
const AUTOUR_DE = 80;   // le rang en cause

(async () => {
  console.log('=== DOUBLON OU TROU DANS LES RANGS STOCKES ? ===');
  console.log(`Categorie : ${CATEGORIE}`);
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    const [stockes] = await conn.execute(`
      SELECT c.fond_id, c.rank1erJanvier AS rang, c.rank1erJanviertotal AS total,
             f.nom_fond
        FROM classementfonds c
        LEFT JOIN fond_investissements f ON f.id = c.fond_id
       WHERE c.type_classement = 1 AND c.categorie_nationale = ?
         AND c.rank1erJanvier IS NOT NULL`, [CATEGORIE]);

    // ---- 1. La suite des rangs est-elle 1..N, une fois chacun ? ----------
    const occurrences = new Map();
    for (const r of stockes) {
      const n = Number(r.rang);
      if (!Number.isFinite(n)) continue;
      if (!occurrences.has(n)) occurrences.set(n, []);
      occurrences.get(n).push(r);
    }
    const doublons = [...occurrences.entries()].filter(([, v]) => v.length > 1).sort((a, b) => a[0] - b[0]);
    const rangs = [...occurrences.keys()].sort((a, b) => a - b);
    const maxRang = rangs.length ? rangs[rangs.length - 1] : 0;
    const trous = [];
    for (let i = 1; i <= maxRang; i++) if (!occurrences.has(i)) trous.push(i);

    console.log('## 1. La suite des rangs stockes');
    console.log(`  ${stockes.length} lignes | ${rangs.length} rangs distincts | rang max ${maxRang}`);
    console.log(`  doublons : ${doublons.length}${doublons.length ? '' : ' — aucun'}`);
    for (const [n, v] of doublons.slice(0, 10)) {
      console.log(`    rang ${n} porte par ${v.length} fonds : `
        + v.map(r => `[${r.fond_id}] ${String(r.nom_fond || '?').slice(0, 24)}`).join(' / '));
    }
    console.log(`  trous    : ${trous.length}${trous.length ? ` → ${trous.slice(0, 20).join(', ')}` : ' — aucun'}`);
    console.log(`  → ${doublons.length || trous.length
      ? 'la suite n est PAS une permutation de 1..N : voila comment un fonds isole'
        + ' peut etre decale sans que son voisin bouge.'
      : 'la suite est une permutation propre de 1..N : l explication est ailleurs.'}\n`);

    // ---- 2. Qui porte le rang en cause, des deux cotes ? ----------------
    const [perfs] = await conn.execute(`
      SELECT p1.fond_id, p1.ytd
        FROM performences p1
        INNER JOIN (
          SELECT fond_id, MAX(date) AS max_date FROM performences
           WHERE categorie_nationale = ? GROUP BY fond_id
        ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
       WHERE p1.categorie_nationale = ?`, [CATEGORIE, CATEGORIE]);
    const nom = new Map(stockes.map(r => [r.fond_id, r.nom_fond || '?']));
    const attendu = new Map();
    for (const p of perfs) {
      const [r] = rankFundInList(perfs, p.fond_id, 'ytd');
      if (r) attendu.set(p.fond_id, r);
    }
    const parRangAttendu = new Map([...attendu.entries()].map(([id, r]) => [r, id]));

    console.log(`## 2. Autour du rang ${AUTOUR_DE}`);
    for (let n = AUTOUR_DE - 2; n <= AUTOUR_DE + 2; n++) {
      const enBase = (occurrences.get(n) || []).map(r => `[${r.fond_id}] ${String(r.nom_fond || '?').slice(0, 22)}`).join(' / ') || '(personne)';
      const att = parRangAttendu.get(n);
      console.log(`  rang ${String(n).padStart(3)} | en base : ${enBase.padEnd(40)} | attendu : ${att ? `[${att}] ${String(nom.get(att) || '?').slice(0, 22)}` : '(personne)'}`);
    }
    console.log('');

    // ---- 3. Les fonds exclus du classement par valeur manquante ---------
    // `rankFundInList` ecarte `null` et la chaine `'-'`. Un fonds ecarte ne
    // compte pas dans le denominateur de l ordre attendu, mais il a peut-etre
    // compte dans le `*total` stocke. C est la piste du decalage d un cran.
    let vides = 0;
    for (const p of perfs) if (p.ytd == null || p.ytd === '-' || p.ytd === '') vides++;
    const totaux = new Map();
    for (const r of stockes) if (r.total != null) totaux.set(String(r.total), (totaux.get(String(r.total)) || 0) + 1);
    console.log('## 3. Denominateurs');
    console.log(`  fonds de la categorie cote performances : ${perfs.length}`);
    console.log(`  dont ytd nul ou '-' (ecartes par rankFundInList) : ${vides}`);
    console.log(`  fonds classables selon la production : ${attendu.size}`);
    console.log(`  totaux stockes : ${[...totaux.entries()].map(([v, k]) => `${v} (x${k})`).join(' | ') || 'aucun'}`);
    console.log(`  → ${vides > 0
      ? `${vides} fonds ecarte(s) : si le classement stocke les comptait, tout rang`
        + ' situe sous eux serait decale — a confronter au nombre de fonds decales.'
      : 'aucun fonds ecarte : le denominateur n est pas la cause.'}`);
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
