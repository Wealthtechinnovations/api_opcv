/**
 * L0.c — Pourquoi les rangs stockes ne correspondent-ils pas aux performances
 * stockees ? Quatre hypotheses, departagees par des chiffres.
 *
 * POURQUOI. Mesure du 2026-10-06 : sur ACTIONS MAROC, 7 fonds sur 122 portent
 * le rang que leur performance stockee leur donnerait, correlation de rang
 * 0,474. Le comparateur a ete verifie sain : meme champ (`ytd` → `rank1erJanvier`),
 * meme tri, meme perimetre, cardinalites identiques. La divergence est donc
 * reelle — mais sa CAUSE est aujourd hui indecidable, parce que les trois tables
 * `classementfonds*` sont en `timestamps: false` et n ont aucune colonne de date :
 * on ne peut pas savoir QUAND les rangs ont ete calcules.
 *
 * Reconstruire les rangs avant d avoir identifie la cause serait reparer sans
 * diagnostic. Quatre hypotheses, et pour chacune une mesure qui la retient ou
 * l ecarte :
 *
 *   H1 TABLE PERIMEE   — les rangs ont ete calcules sur des performances
 *                        anterieures. Signature : les `*total` stockes ne
 *                        correspondent plus au cardinal actuel de la categorie,
 *                        et des `fond_id` classes ont quitte la categorie.
 *   H2 MAUVAIS CHAMP   — le rang stocke suit une AUTRE colonne que celle qu on
 *                        croit. Signature : la concordance est bien meilleure
 *                        contre `ytdm`, `perfveille`, `perf1an`… que contre
 *                        `ytd`. C est l hypothese la plus facile a ecarter a
 *                        tort, donc celle qu il faut tester la plus largement.
 *   H3 EX AEQUO        — le SQL de `ranking.service.js:87-100` n a pas d
 *                        `ORDER BY`, et `rankFundInList` trie en memoire : entre
 *                        deux valeurs egales l ordre n est pas deterministe.
 *                        Signature : beaucoup de valeurs dupliquees, et des
 *                        ecarts de rang bornes a la taille des paquets d ex aequo.
 *   H4 PERIMETRE       — le classement a ete calcule sur un ensemble de fonds
 *                        different (fonds inactifs inclus, ou categorie d une
 *                        autre colonne). Signature : les ensembles de `fond_id`
 *                        different.
 *
 * Un rang instable n est pas un rang valide : si H3 domine, le correctif est le
 * departage deterministe (L7), pas la reconstruction (L5).
 *
 * LECTURE SEULE : uniquement des SELECT. Aucun recalcul ecrit, aucune ligne
 * touchee.
 *
 * USAGE  node scripts/diag/ondemand/diag_classement_vs_perf.js
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

// Champs candidats testes contre `rank1erJanvier`. `ytd` est celui que
// `ranking.service.js` utilise ; les autres sont la pour qu une meilleure
// concordance ailleurs soit visible plutot que supposee.
const CANDIDATS = ['ytd', 'ytdm', 'perfveille', 'perfveillem', 'perf3m', 'perf6m', 'perf1an', 'perf3ans'];
const CATEGORIES_TESTEES = 5;

// `rankFundInList` : tri decroissant, exclusion de NULL et de '-'. Reproduit
// mot pour mot, sans require de la base, pour que le comparateur soit le meme
// code que la production et non une reecriture.
function rangsAttendus(lignes, champ) {
  const valides = lignes.filter(f => f[champ] != null && f[champ] != '-');
  valides.sort((a, b) => b[champ] - a[champ]);
  const m = new Map();
  valides.forEach((f, i) => m.set(f.fond_id, i + 1));
  return { rangs: m, total: valides.length };
}

// Spearman sur les rangs, sur les seuls fonds presents des deux cotes.
function rho(paires) {
  const n = paires.length;
  if (n < 3) return null;
  const sd2 = paires.reduce((s, [a, b]) => s + (a - b) ** 2, 0);
  return 1 - (6 * sd2) / (n * (n * n - 1));
}

(async () => {
  console.log('=== L0.c — RANGS STOCKES CONTRE PERFORMANCES STOCKEES : QUATRE HYPOTHESES ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    const [vol] = await conn.execute(`
      SELECT type_classement, COUNT(*) AS lignes, COUNT(DISTINCT fond_id) AS fonds
        FROM classementfonds GROUP BY type_classement ORDER BY type_classement`);
    console.log('## 0. Volumetrie de `classementfonds`');
    for (const r of vol) {
      const nom = { 1: 'national', 2: 'regional', 3: 'global' }[r.type_classement] || 'inconnu';
      console.log(`  type ${r.type_classement} (${nom}) : ${r.lignes} lignes, ${r.fonds} fonds`);
    }
    console.log('  (aucune colonne de date : l age de ces lignes est inconnaissable — c est'
      + ' precisement ce que la migration L2 corrige)\n');

    const [cats] = await conn.execute(`
      SELECT categorie_nationale AS cat, COUNT(*) AS n
        FROM classementfonds
       WHERE type_classement = 1 AND categorie_nationale IS NOT NULL AND categorie_nationale <> ''
       GROUP BY categorie_nationale ORDER BY n DESC LIMIT ${CATEGORIES_TESTEES}`);

    for (const c of cats) {
      console.log(`########## ${c.cat} — ${c.n} fonds classes`);

      // Ce que la production LIRAIT aujourd hui : la requete de
      // ranking.service.js:87-100, telle quelle.
      const [perfs] = await conn.execute(`
        SELECT p1.fond_id, ${CANDIDATS.map(x => `p1.${x}`).join(', ')}, p1.date
          FROM performences p1
          INNER JOIN (
            SELECT fond_id, MAX(date) AS max_date
              FROM performences
             WHERE categorie_nationale = ?
             GROUP BY fond_id
          ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
         WHERE p1.categorie_nationale = ?`, [c.cat, c.cat]);

      const [stockes] = await conn.execute(`
        SELECT fond_id, rank1erJanvier AS rang, rank1erJanviertotal AS total
          FROM classementfonds
         WHERE type_classement = 1 AND categorie_nationale = ?`, [c.cat]);

      // ---- H4 PERIMETRE --------------------------------------------------
      const idPerf = new Set(perfs.map(r => r.fond_id));
      const idClass = new Set(stockes.map(r => r.fond_id));
      const seulPerf = [...idPerf].filter(x => !idClass.has(x));
      const seulClass = [...idClass].filter(x => !idPerf.has(x));
      console.log(`  H4 perimetre : ${idPerf.size} fonds cote performances,`
        + ` ${idClass.size} cote classement`
        + ` | absents du classement : ${seulPerf.length}`
        + ` | classes mais hors performances : ${seulClass.length}`
        + `${seulClass.length ? ` (ex. ${seulClass.slice(0, 5).join(', ')})` : ''}`);

      // ---- H1 TABLE PERIMEE ----------------------------------------------
      // Le `*total` stocke est le cardinal de la categorie AU MOMENT du calcul.
      // S il differe du cardinal actuel, les rangs datent d un autre etat.
      const totaux = new Map();
      for (const r of stockes) {
        if (r.total == null) continue;
        totaux.set(r.total, (totaux.get(r.total) || 0) + 1);
      }
      const { total: totalAujourdhui } = rangsAttendus(perfs, 'ytd');
      const totauxTries = [...totaux.entries()].sort((a, b) => b[1] - a[1]);
      console.log(`  H1 fraicheur : total stocke le plus frequent = `
        + `${totauxTries.length ? `${totauxTries[0][0]} (sur ${totauxTries[0][1]} lignes)` : 'aucun'}`
        + ` | total recalcule aujourd hui = ${totalAujourdhui}`
        + ` | ${totauxTries.length && Number(totauxTries[0][0]) === totalAujourdhui
          ? 'CONCORDE → la table n est pas perimee sur ce point'
          : 'DIVERGE → les rangs ont ete calcules sur un autre ensemble'}`);
      if (totauxTries.length > 1) {
        console.log(`               ${totauxTries.length} valeurs de total distinctes dans la MEME`
          + ` categorie : ${totauxTries.slice(0, 6).map(([v, k]) => `${v}x${k}`).join(' ')}`
          + ' — plusieurs runs superposes, la purge n a donc pas tout efface');
      }
      const dates = [...new Set(perfs.map(r => String(r.date).slice(0, 10)))].sort();
      console.log(`               dates des performances lues : ${dates.length} distinctes,`
        + ` de ${dates[0]} a ${dates[dates.length - 1]}`);

      // ---- H2 MAUVAIS CHAMP ----------------------------------------------
      const rangStocke = new Map(stockes.filter(r => r.rang != null).map(r => [r.fond_id, r.rang]));
      console.log('  H2 champ :');
      let meilleur = null;
      for (const champ of CANDIDATS) {
        const { rangs } = rangsAttendus(perfs, champ);
        const paires = [];
        let exacts = 0;
        for (const [id, rs] of rangStocke) {
          const ra = rangs.get(id);
          if (ra == null) continue;
          paires.push([rs, ra]);
          if (rs === ra) exacts++;
        }
        if (!paires.length) { console.log(`    ${champ.padEnd(12)} aucune paire comparable`); continue; }
        const r = rho(paires);
        const pct = (100 * exacts / paires.length).toFixed(1);
        if (r != null && (!meilleur || r > meilleur.r)) meilleur = { champ, r, pct };
        console.log(`    ${champ.padEnd(12)} ${String(exacts).padStart(4)}/${String(paires.length).padEnd(4)}`
          + ` exacts (${pct.padStart(5)} %) | rho = ${r == null ? '?' : r.toFixed(3)}`);
      }
      if (meilleur) {
        console.log(`    → meilleur candidat : ${meilleur.champ} (rho ${meilleur.r.toFixed(3)},`
          + ` ${meilleur.pct} % exacts)`
          + `${meilleur.champ === 'ytd' ? ' — c est bien le champ attendu, H2 ecartee'
            : ' — DIFFERENT de `ytd` : H2 retenue, a instruire avant toute reconstruction'}`);
      }

      // ---- H3 EX AEQUO ---------------------------------------------------
      // Sans ORDER BY cote SQL ni departage cote JS, l ordre entre valeurs
      // egales depend de l ordre de lecture : il n est pas reproductible.
      const valides = perfs.filter(f => f.ytd != null && f.ytd != '-');
      const occurrences = new Map();
      for (const f of valides) {
        const k = String(Number(f.ytd));
        occurrences.set(k, (occurrences.get(k) || 0) + 1);
      }
      const paquets = [...occurrences.values()].filter(v => v > 1);
      const fondsExAequo = paquets.reduce((s, v) => s + v, 0);
      const plusGros = paquets.length ? Math.max(...paquets) : 0;
      console.log(`  H3 ex aequo sur ytd : ${fondsExAequo}/${valides.length} fonds dans`
        + ` ${paquets.length} paquet(s), plus gros paquet = ${plusGros} fonds`);
      // Un ecart de rang superieur au plus gros paquet d ex aequo ne peut PAS
      // s expliquer par l instabilite du tri : c est la mesure qui tranche.
      const { rangs: rYtd } = rangsAttendus(perfs, 'ytd');
      let inexpliques = 0, comparables = 0, ecartMax = 0;
      for (const [id, rs] of rangStocke) {
        const ra = rYtd.get(id);
        if (ra == null) continue;
        comparables++;
        const e = Math.abs(rs - ra);
        if (e > ecartMax) ecartMax = e;
        if (e > plusGros) inexpliques++;
      }
      console.log(`               ecart de rang max = ${ecartMax}`
        + ` | ${inexpliques}/${comparables} ecarts STRICTEMENT superieurs au plus gros paquet`
        + ` → ${inexpliques === 0
          ? 'H3 suffit a tout expliquer : le correctif est le departage deterministe (L7), pas la reconstruction'
          : 'H3 ne suffit pas : une autre cause agit (H1 ou H2)'}`);
      console.log('');
    }
  } finally {
    await conn.end();
  }
  console.log('=== FIN L0.c — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC L0.c :', e.message); process.exit(1); });
