/**
 * Fraicheur des classements et des performances, par pays.
 *
 * POURQUOI. Le journal de `cron_daily_update` du 2026-08-21 se termine par :
 *
 *   [9a/9] Classement local... [9a/9] ERREUR (HTTP 000)
 *   [9b/9] Classement EUR...   [9b/9] ERREUR (HTTP 000)
 *   [9c/9] Classement USD...   [9c/9] ERREUR (HTTP 000)
 *
 * HTTP 000 signifie que curl n a pas obtenu de reponse — `--max-time 300`
 * depasse, presque surement. Reste a savoir ce que cela produit REELLEMENT :
 * un classement non recalcule, ou un classement recalcule quand meme parce que
 * le serveur a poursuivi apres l abandon du client. Les deux sont possibles et
 * n appellent pas le meme correctif. Ce script tranche par la mesure.
 *
 * Il mesure aussi le retard des performances, dont le controle C8 dit qu il
 * atteint 86 jours en moyenne au Maroc et en Tunisie.
 *
 * LECTURE SEULE — uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_classements.js
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

const TABLES_CLASSEMENT = ['classementfonds', 'classementfonds_eurs', 'classementfonds_usds'];
const TABLES_PERF = ['performences', 'performences_eurs', 'performences_usds'];

async function colonnes(conn, table) {
  const [r] = await conn.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DB.database, table]
  );
  return r.map(x => x.COLUMN_NAME);
}

// La colonne portant la date varie d une table a l autre selon l epoque de
// creation. On prend la premiere disponible plutot que d en supposer une.
function colonneDate(cols) {
  for (const c of ['updated_at', 'updatedAt', 'created_at', 'created', 'date']) {
    if (cols.includes(c)) return c;
  }
  return null;
}

(async () => {
  const conn = await mysql.createConnection(DB);
  try {
    console.log('\n=== FRAICHEUR DES CLASSEMENTS ET DES PERFORMANCES ===');
    console.log(`Mesure le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — LECTURE SEULE\n`);

    console.log('## A. Tables de classement\n');
    for (const t of [...TABLES_CLASSEMENT, ...TABLES_PERF]) {
      const cols = await colonnes(conn, t);
      if (!cols.length) { console.log(`  ${t.padEnd(22)} TABLE ABSENTE`); continue; }
      const cd = colonneDate(cols);
      const [[n]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
      if (!cd) {
        console.log(`  ${t.padEnd(22)} ${String(n.n).padStart(9)} lignes — aucune colonne de date`);
        continue;
      }
      const [[d]] = await conn.query(
        `SELECT MAX(\`${cd}\`) AS derniere, MIN(\`${cd}\`) AS premiere FROM \`${t}\``
      );
      const der = d.derniere ? String(d.derniere).slice(0, 19).replace('T', ' ') : 'aucune';
      let retard = '?';
      if (d.derniere) {
        retard = ((Date.now() - new Date(d.derniere).getTime()) / 864e5).toFixed(1) + ' j';
      }
      console.log(`  ${t.padEnd(22)} ${String(n.n).padStart(9)} lignes — ${cd} max = ${der} (${retard})`);
    }

    console.log('\n## B. Retard des performances par pays\n');
    // On compare la date de la performance la plus recente de chaque fonds a
    // celle de sa VL la plus recente : c est l ecart que voit l utilisateur.
    const [perf] = await conn.query(`
      SELECT f.pays,
             COUNT(*)                                   AS fonds,
             SUM(p.derniere_perf >= v.derniere_vl)      AS a_jour,
             ROUND(AVG(DATEDIFF(v.derniere_vl, p.derniere_perf)), 1) AS retard_moyen_j,
             MAX(DATEDIFF(v.derniere_vl, p.derniere_perf))           AS retard_max_j
        FROM fond_investissements f
        JOIN (SELECT fund_id, MAX(date) AS derniere_vl
                FROM valorisations GROUP BY fund_id) v ON v.fund_id = f.id
        JOIN (SELECT fond_id, MAX(date) AS derniere_perf
                FROM performences GROUP BY fond_id) p ON p.fond_id = f.id
       WHERE f.active = 1
       GROUP BY f.pays
       ORDER BY retard_moyen_j DESC
    `);
    console.log(`  ${'pays'.padEnd(10)} ${'fonds'.padStart(6)} ${'a jour'.padStart(7)} ${'%'.padStart(6)} ${'retard moy.'.padStart(12)} ${'retard max'.padStart(11)}`);
    console.log(`  ${'-'.repeat(10)} ${'-'.repeat(6)} ${'-'.repeat(7)} ${'-'.repeat(6)} ${'-'.repeat(12)} ${'-'.repeat(11)}`);
    for (const r of perf) {
      const pct = r.fonds ? ((r.a_jour / r.fonds) * 100).toFixed(1) : '0';
      console.log(`  ${String(r.pays).padEnd(10)} ${String(r.fonds).padStart(6)} ${String(r.a_jour).padStart(7)} ${(pct + ' %').padStart(6)} ${(r.retard_moyen_j + ' j').padStart(12)} ${(r.retard_max_j + ' j').padStart(11)}`);
    }

    console.log('\n## C. Le classement a-t-il ete recalcule malgre le HTTP 000 ?\n');
    // Si le serveur a poursuivi apres l abandon de curl, les lignes de
    // classement portent une date posterieure au 2026-08-21 20:00. Sinon elles
    // s arretent avant, et les trois etapes 9a/9b/9c n ont rien produit.
    for (const t of TABLES_CLASSEMENT) {
      const cols = await colonnes(conn, t);
      const cd = colonneDate(cols);
      if (!cd) { console.log(`  ${t.padEnd(22)} pas de colonne de date — indecidable`); continue; }
      const [[r]] = await conn.query(
        `SELECT COUNT(*) AS n FROM \`${t}\` WHERE \`${cd}\` >= '2026-08-21 20:00:00'`
      );
      const verdict = r.n > 0
        ? `${r.n} ligne(s) ecrite(s) apres 20:00 — le serveur a POURSUIVI malgre l abandon de curl`
        : 'AUCUNE ligne apres 20:00 — le recalcul n a rien produit';
      console.log(`  ${t.padEnd(22)} ${verdict}`);
    }

    console.log('');
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
