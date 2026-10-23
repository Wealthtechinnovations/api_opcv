/**
 * `perf10ans` : un zero artefact en base, ou un ancrage trop court dans le
 * calcul direct ? — les deux explications sont plausibles, une seule est vraie.
 *
 * CE QUE LA MESURE A DONNE. Le critere de bascule a quatre classes a tourne sur
 * la production le 2026-10-15. NIGERIA : DIVERGENT 0, PERDU 0 — atteint. UEMOA :
 * **DIVERGENT 1**, sur une seule colonne d un seul fonds :
 *
 *   [1543] SOAGA EPARGNE ACTIVE, derniere VL 2024-11-01
 *   perf10ans  calcule = 20.457400   stocke = 0.000000
 *
 * DEUX EXPLICATIONS, ET IL NE FAUT PAS CHOISIR PAR PREFERENCE.
 *
 *   (A) LE ZERO EST UN ARTEFACT. `getRatioDataFields`
 *       (apigestionsavequotidien.js) ecrit la chaine `'-'` quand la donnee
 *       manque. Le `sql_mode` de production n est PAS strict (mesure L0.a :
 *       `IGNORE_SPACE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION`).
 *       Dans une colonne numerique, `'-'` devient donc **0**. Une performance
 *       dix ans a zero exact n a pas de sens financier. Si c est cela, le script
 *       a raison et la table porte un faux chiffre — et mon predicat `vide()`
 *       du dry-run, qui ecarte `null`, `undefined`, `'-'` et `''` mais PAS le
 *       zero issu d une coercition, classe a tort cet ecart en DIVERGENT.
 *
 *   (B) L ANCRAGE DU CALCUL EST TROP COURT. `findValueAtDate` cherche la valeur
 *       a une date cible ; si la serie ne remonte pas jusqu a dix ans avant la
 *       derniere VL, elle peut rendre la plus ancienne valeur disponible au lieu
 *       de rien. Le calcul direct produirait alors une « performance dix ans »
 *       mesuree sur une fenetre plus courte — un chiffre faux, et c est le
 *       script qui aurait tort.
 *
 * L ENJEU N EST PAS COSMETIQUE. (A) veut dire que la bascule corrige un faux
 * zero. (B) veut dire qu elle introduirait un faux chiffre sur toutes les
 * colonnes longues des fonds a historique court. Le critere de bascule reste
 * NON ATTEINT jusqu a ce que ce soit tranche.
 *
 * CE QUE CE SCRIPT MESURE, sans rien supposer :
 *   1. le type REEL de `perf10ans` et des colonnes longues voisines ;
 *   2. la distribution des zeros exacts dans ces colonnes sur toute la table —
 *      une masse de zeros exacts trahit une coercition, pas des donnees ;
 *   3. pour le fonds 1543 : premiere et derniere VL, profondeur d historique en
 *      annees, et s il existe une VL a dix ans ou avant — ce qui decide si un
 *      `perf10ans` a un sens pour lui ;
 *   4. combien de fonds sont dans ce cas : historique < 10 ans ET `perf10ans`
 *      non vide en base.
 *
 * LECTURE SEULE : uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_perf10ans_zero_ou_ancrage.js [fond_id]
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

const FOND = Number(process.argv[2] || 1543);
const COLONNES_LONGUES = ['perf5ans', 'perf8ans', 'perf10ans', 'perf10ansm'];

const j = x => {
  if (!x) return '?';
  if (x instanceof Date) {
    const p = k => String(k).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  return String(x).slice(0, 10);
};

(async () => {
  console.log('=== perf10ans : ZERO ARTEFACT EN BASE, OU ANCRAGE TROP COURT ? ===');
  console.log(`Fonds instruit : ${FOND}`);
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. Le type REEL des colonnes longues ---------------------------
    const [types] = await conn.execute(`
      SELECT column_name AS c, column_type AS ct
        FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'performences'
         AND column_name IN (${COLONNES_LONGUES.map(() => '?').join(', ')})
       ORDER BY column_name`, COLONNES_LONGUES);
    console.log('## 1. Type REEL des colonnes longues (la base fait foi)');
    for (const t of types) {
      console.log(`  ${String(t.c || t.COLUMN_NAME).padEnd(14)} ${t.ct || t.COLUMN_TYPE}`);
    }
    console.log('');

    // ---- 2. Les zeros exacts : donnees ou coercition ? ------------------
    // Une performance a zero EXACT est financierement quasi impossible. Une
    // masse de zeros exacts dans une colonne trahit une valeur d absence
    // convertie, pas une mesure.
    console.log('## 2. Distribution des zeros exacts sur toute la table');
    for (const c of COLONNES_LONGUES) {
      const [d] = await conn.query(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN \`${c}\` IS NULL THEN 1 ELSE 0 END)  AS nuls,
                SUM(CASE WHEN \`${c}\` = '-' THEN 1 ELSE 0 END)     AS tirets,
                SUM(CASE WHEN \`${c}\` = 0 THEN 1 ELSE 0 END)       AS zeros,
                SUM(CASE WHEN \`${c}\` <> 0 AND \`${c}\` IS NOT NULL THEN 1 ELSE 0 END) AS nonnuls
           FROM performences`);
      const r = d[0];
      const pct = (100 * Number(r.zeros) / Math.max(Number(r.total), 1)).toFixed(1);
      console.log(`  ${c.padEnd(12)} ${r.total} lignes | NULL ${String(r.nuls).padStart(6)}`
        + ` | '-' ${String(r.tirets).padStart(6)} | zero exact ${String(r.zeros).padStart(6)} (${pct} %)`
        + ` | autre ${String(r.nonnuls).padStart(6)}`);
    }
    console.log('  → une part elevee de zeros exacts, surtout si les tirets sont a 0,');
    console.log("    indique une coercition de la chaine '-' vers 0 (sql_mode non strict).\n");

    // ---- 3. Le fonds instruit : son historique peut-il porter un 10 ans ?
    const [vl] = await conn.execute(`
      SELECT MIN(date) AS premiere, MAX(date) AS derniere, COUNT(*) AS n
        FROM valorisations WHERE fund_id = ? AND value > 0`, [FOND]);
    const v = vl[0];
    const annees = v.premiere && v.derniere
      ? (new Date(v.derniere) - new Date(v.premiere)) / (365.25 * 86400000) : null;
    console.log(`## 3. Fonds ${FOND} — son historique porte-t-il un « dix ans » ?`);
    console.log(`  ${v.n} VL | premiere ${j(v.premiere)} | derniere ${j(v.derniere)}`
      + ` | profondeur ${annees == null ? '?' : annees.toFixed(2)} ans`);

    // Existe-t-il une VL a dix ans avant la derniere, ou avant ?
    const [ancrage] = await conn.execute(`
      SELECT date, value FROM valorisations
       WHERE fund_id = ? AND value > 0
         AND date <= DATE_SUB((SELECT MAX(date) FROM valorisations WHERE fund_id = ?), INTERVAL 10 YEAR)
       ORDER BY date DESC LIMIT 1`, [FOND, FOND]);
    if (ancrage.length) {
      console.log(`  VL la plus proche a dix ans ou avant : ${j(ancrage[0].date)} = ${ancrage[0].value}`);
      console.log('  → un perf10ans a un SENS pour ce fonds : l ancrage existe.');
    } else {
      console.log('  AUCUNE VL a dix ans ou avant la derniere.');
      console.log('  → un perf10ans n a PAS de sens pour ce fonds. Si le calcul direct en');
      console.log('    produit un, il mesure une fenetre plus courte : explication (B), et');
      console.log('    c est le SCRIPT qui a tort.');
    }
    const [stocke] = await conn.execute(`
      SELECT date, perf5ans, perf8ans, perf10ans, perf10ansm
        FROM performences WHERE fond_id = ? ORDER BY date DESC LIMIT 1`, [FOND]);
    if (stocke.length) {
      const s = stocke[0];
      console.log(`  ligne MAX(date) en base (${j(s.date)}) : perf5ans=${s.perf5ans}`
        + ` perf8ans=${s.perf8ans} perf10ans=${s.perf10ans} perf10ansm=${s.perf10ansm}`);
    }
    console.log('');

    // ---- 4. Combien de fonds sont dans ce cas ? -------------------------
    // Le perimetre decide si c est un cas isole ou une classe de defaut.
    const [classe] = await conn.execute(`
      SELECT COUNT(*) AS n
        FROM (SELECT fund_id, MIN(date) AS p, MAX(date) AS d
                FROM valorisations WHERE value > 0 GROUP BY fund_id) h
        JOIN (SELECT fond_id, MAX(date) AS dp FROM performences GROUP BY fond_id) m
          ON m.fond_id = h.fund_id
        JOIN performences p ON p.fond_id = h.fund_id AND p.date = m.dp
       WHERE DATEDIFF(h.d, h.p) < 3652
         AND p.perf10ans IS NOT NULL AND p.perf10ans <> '-'`);
    console.log('## 4. Perimetre : fonds a historique < 10 ans portant malgre tout un perf10ans');
    console.log(`  ${classe[0].n} fonds. → ${Number(classe[0].n) > 1
      ? 'ce n est pas un cas isole mais une CLASSE de defaut, a traiter comme telle.'
      : 'cas isole ou quasi isole.'}`);
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
