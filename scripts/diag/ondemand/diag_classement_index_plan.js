/**
 * L0.b — Le classement local est-il lent par defaut d index, et a quelle
 * duree le cron coupe-t-il reellement ?
 *
 * POURQUOI. Deux questions dont depend le correctif, et auxquelles aucun
 * document du depot ne repond par un chiffre.
 *
 *   1. La route de classement local emet, pour chaque fonds et chaque
 *      categorie, la sous-requete de `src/services/ranking.service.js:87-100` :
 *        SELECT fond_id, MAX(date) FROM performences
 *         WHERE categorie_nationale = ? GROUP BY fond_id
 *      soit ≈ 3 750 executions par run sur ≈ 82 000 lignes, sans `LIMIT`. Si
 *      aucun index ne couvre `(categorie_nationale, fond_id, date)`, chaque
 *      execution est un balayage complet. L0.b le mesure AVANT de proposer
 *      l index : un index pose sans plan mesure est une supposition de plus.
 *      Un index ne change jamais un resultat, seulement un plan — c est la
 *      seule modification du plan dont on puisse l affirmer.
 *
 *   2. Le cron juge les etapes 5-7 par `curl … --max-time`. J ai conclu le
 *      2026-10-06 d un `HTTP 000` que « le classement n est pas recalcule »,
 *      alors que le depot avertit par ecrit qu un `HTTP 000` signifie que le
 *      CLIENT a cesse d attendre, pas que le serveur a echoue. Un `--max-time`
 *      a 300 s et un `--max-time` a 1 800 s n appellent pas le meme correctif.
 *      Ce script lit le fichier REELLEMENT DEPLOYE sur le serveur, pas la copie
 *      du depot de session.
 *
 * Mesure aussi le nombre de fonds a categorie nulle : la garde manquante de
 * `calculateRankNational:81` ne concerne que ceux-la, et si leur nombre est nul
 * la garde n a aucun effet observable — a dire, pas a sous-entendre.
 *
 * LECTURE SEULE : `SHOW INDEX`, `EXPLAIN`, `SELECT`, et la lecture d un fichier
 * de cron. Aucune ecriture, aucun `ALTER`.
 *
 * USAGE  node scripts/diag/ondemand/diag_classement_index_plan.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const RACINE = path.resolve(__dirname, '../../..');

// La sous-requete reelle de ranking.service.js:87-100, mot pour mot.
const SOUS_REQUETE = `
  SELECT fond_id, MAX(date) as max_date
    FROM performences
   WHERE categorie_nationale = ?
   GROUP BY fond_id`;

(async () => {
  console.log('=== L0.b — PLAN D EXECUTION DU CLASSEMENT LOCAL, ET CONTENU REEL DU CRON ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. Index existants sur `performences` -----------------------------
    const [idx] = await conn.query('SHOW INDEX FROM performences');
    console.log('## 1. Index existants sur `performences`');
    const parIndex = new Map();
    for (const r of idx) {
      const n = r.Key_name;
      if (!parIndex.has(n)) parIndex.set(n, { unique: r.Non_unique === 0, cols: [], card: r.Cardinality });
      parIndex.get(n).cols[r.Seq_in_index - 1] = r.Column_name;
    }
    for (const [n, v] of parIndex) {
      console.log(`  ${n.padEnd(34)} (${v.cols.join(', ')})`
        + `${v.unique ? ' [UNIQUE]' : ''} cardinalite ≈ ${v.card}`);
    }
    const couvrant = [...parIndex.values()].some(v =>
      v.cols[0] === 'categorie_nationale' && v.cols.includes('fond_id') && v.cols.includes('date'));
    console.log(`  → index couvrant (categorie_nationale, fond_id, date) : ${couvrant ? 'OUI' : 'NON'}`);
    console.log(`  → L6 n a de sens que si cette reponse est NON.\n`);

    // ---- 2. Taille de la table ---------------------------------------------
    const [tbl] = await conn.execute(`
      SELECT table_rows, data_length, index_length
        FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = 'performences'`);
    const t = tbl[0] || {};
    const dl = Number(t.data_length || t.DATA_LENGTH || 0);
    const il = Number(t.index_length || t.INDEX_LENGTH || 0);
    console.log('## 2. Taille de `performences`');
    console.log(`  ≈ ${t.table_rows || t.TABLE_ROWS} lignes | donnees ${(dl / 1048576).toFixed(1)} Mo`
      + ` | index ${(il / 1048576).toFixed(1)} Mo`
      + ` | ratio index/donnees ${dl ? (il / dl).toFixed(2) : '?'}\n`);

    // ---- 3. Les cinq plus grosses categories nationales --------------------
    const [cats] = await conn.execute(`
      SELECT categorie_nationale AS cat, COUNT(*) AS lignes, COUNT(DISTINCT fond_id) AS fonds
        FROM performences
       WHERE categorie_nationale IS NOT NULL AND categorie_nationale <> ''
       GROUP BY categorie_nationale
       ORDER BY lignes DESC
       LIMIT 5`);
    console.log('## 3. Cinq plus grosses categories nationales (selectivite)');
    for (const c of cats) {
      console.log(`  ${String(c.cat).slice(0, 40).padEnd(42)} ${String(c.lignes).padStart(6)} lignes`
        + ` | ${String(c.fonds).padStart(4)} fonds`
        + ` | ${(100 * Number(c.lignes) / Math.max(Number(t.table_rows || t.TABLE_ROWS || 1), 1)).toFixed(1)} % de la table`);
    }
    console.log('');

    // ---- 4. EXPLAIN + chronometrage ----------------------------------------
    console.log('## 4. Plan et duree de la sous-requete reelle (ranking.service.js:87-100)');
    let sommeMs = 0;
    for (const c of cats) {
      const [plan] = await conn.execute(`EXPLAIN ${SOUS_REQUETE}`, [c.cat]);
      const l = plan[0] || {};
      let cout = '?';
      try {
        const [pj] = await conn.execute(`EXPLAIN FORMAT=JSON ${SOUS_REQUETE}`, [c.cat]);
        const brut = pj[0] && (pj[0].EXPLAIN || pj[0].explain || Object.values(pj[0])[0]);
        const o = typeof brut === 'string' ? JSON.parse(brut) : brut;
        cout = (o && o.query_block && o.query_block.cost_info && o.query_block.cost_info.query_cost) || '?';
      } catch (_) { /* MariaDB ne rend pas toujours cost_info : non bloquant */ }

      const t0 = Date.now();
      const [lignes] = await conn.execute(SOUS_REQUETE, [c.cat]);
      const ms = Date.now() - t0;
      sommeMs += ms;
      console.log(`  ${String(c.cat).slice(0, 32).padEnd(34)} type=${String(l.type).padEnd(6)}`
        + ` key=${String(l.key || 'AUCUNE').padEnd(22)} rows=${String(l.rows).padStart(7)}`
        + ` extra="${String(l.Extra || '').slice(0, 34)}"`);
      console.log(`  ${''.padEnd(34)} cout=${cout} | ${ms} ms | ${lignes.length} lignes rendues`);
    }
    const moy = cats.length ? sommeMs / cats.length : 0;
    console.log(`  moyenne : ${moy.toFixed(0)} ms par sous-requete`);
    // La route appelle les trois niveaux (national, regional, global) pour
    // chaque fonds : l ordre de grandeur du run complet s en deduit.
    console.log(`  → projection : 1 245 fonds x 3 niveaux x ${moy.toFixed(0)} ms`
      + ` ≈ ${((1245 * 3 * moy) / 60000).toFixed(1)} min de SQL seul`
      + ` — a comparer au --max-time du cron ci-dessous.\n`);

    // ---- 5. Fonds a categorie nulle ----------------------------------------
    // Perimetre exact de la garde manquante de L7. Si c est zero, la garde ne
    // supprime que des analyses inutiles, sans effet numerique.
    const [nulles] = await conn.execute(`
      SELECT
        SUM(CASE WHEN categorie_national IS NULL OR categorie_national = '' THEN 1 ELSE 0 END) AS nat_nulle,
        SUM(CASE WHEN categorie_fundafrica_regionale IS NULL OR categorie_fundafrica_regionale = '' THEN 1 ELSE 0 END) AS reg_nulle,
        SUM(CASE WHEN categorie_fundafrica_globale IS NULL OR categorie_fundafrica_globale = '' THEN 1 ELSE 0 END) AS glo_nulle,
        COUNT(*) AS total
        FROM fond_investissements WHERE active = 1`);
    const n = nulles[0];
    console.log('## 5. Fonds actifs sans categorie (perimetre de la garde L7)');
    console.log(`  sur ${n.total} fonds actifs : categorie_national nulle ${n.nat_nulle}`
      + ` | fundafrica_regionale nulle ${n.reg_nulle} | fundafrica_globale nulle ${n.glo_nulle}`);
    console.log('  → la garde `if (!category) return` n evite que des analyses completes'
      + ' inutiles : `categorie_nationale = NULL` n est jamais vrai en SQL, le jeu de'
      + ' resultats est vide et la route n ecrit rien.\n');
  } finally {
    await conn.end();
  }

  // ---- 6. Contenu REELLEMENT deploye du cron -------------------------------
  // `__dirname` est ici le checkout de production : ce qui est lu est ce qui
  // tourne, pas la copie du depot de session.
  console.log('## 6. Cron reellement deploye sur ce serveur');
  console.log(`  racine lue : ${RACINE}`);
  const chemin = path.join(RACINE, 'scripts/cron/cron_daily_update.sh');
  try {
    const src = fs.readFileSync(chemin, 'utf8');
    const lignes = src.split(/\r?\n/);
    console.log(`  ${chemin} — ${lignes.length} lignes,`
      + ` modifie le ${fs.statSync(chemin).mtime.toISOString().slice(0, 19)}`);
    lignes.forEach((l, i) => {
      if (/max-time|run_curl|run_step|saveperfdatemysql|classement|MAX_TIME|timeout/i.test(l)) {
        console.log(`  ${String(i + 1).padStart(4)}: ${l.trim().slice(0, 150)}`);
      }
    });
  } catch (e) {
    console.log(`  ILLISIBLE : ${e.message}`);
  }

  // Le crontab reel : la planification peut differer de ce que documente le
  // depot. Non bloquant si `crontab` est absent du PATH de la session SSH.
  try {
    const ct = execFileSync('crontab', ['-l'], { encoding: 'utf8', timeout: 10000 });
    const utiles = ct.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));
    console.log(`\n  crontab -l : ${utiles.length} entree(s) active(s)`);
    utiles.forEach(l => console.log(`    ${l.trim().slice(0, 150)}`));
  } catch (e) {
    console.log(`\n  crontab -l indisponible (${(e.message || '').slice(0, 80)}) — non bloquant`);
  }

  console.log('\n=== FIN L0.b — aucune ecriture, aucun ALTER ===');
})().catch(e => { console.error('ECHEC L0.b :', e.message); process.exit(1); });
