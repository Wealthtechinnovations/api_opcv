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

    console.log('\n## C. Le classement suit-il les performances actuelles ?\n');
    // Les trois tables de classement n ont AUCUNE colonne temporelle
    // (`timestamps: false` dans le modele). Leur fraicheur est donc
    // structurellement immesurable — c est precisement pourquoi
    // `check_cron_health.js` en etait reduit a un proxy, et pourquoi ce proxy
    // mentait. A defaut de date, on juge sur le CONTENU : le classement stocke
    // doit reproduire l ordre qu impliquent les performances actuellement en
    // base. S il ne le reproduit pas, il est perime — quelle qu en soit la date.
    const [categories] = await conn.query(`
      SELECT categorie, COUNT(*) AS n
        FROM classementfonds
       WHERE categorie IS NOT NULL AND categorie <> ''
       GROUP BY categorie
       ORDER BY n DESC
       LIMIT 4
    `);

    for (const cat of categories) {
      // Ordre implique par les performances actuelles : derniere ligne de
      // `performences` de chaque fonds de la categorie, triee par YTD decroissant.
      // Appariement verifie sur les modeles : la performance annuelle s appelle
      // `ytd` dans `performences` et son rang `rank1erJanvier` dans
      // `classementfonds`. Ecrire `perf1erJanvier` des deux cotes — le nom que
      // porte l API — aurait fait echouer la requete sans rien mesurer.
      const [attendu] = await conn.query(`
        SELECT p.fond_id, p.ytd
          FROM performences p
          JOIN (SELECT fond_id, MAX(date) AS d FROM performences GROUP BY fond_id) m
            ON m.fond_id = p.fond_id AND m.d = p.date
          JOIN classementfonds c ON c.fond_id = p.fond_id AND c.categorie = ?
         WHERE p.ytd IS NOT NULL
         GROUP BY p.fond_id, p.ytd
         ORDER BY p.ytd DESC
      `, [cat.categorie]);

      const [stocke] = await conn.query(`
        SELECT fond_id, CAST(rank1erJanvier AS UNSIGNED) AS rang, rank1erJanviertotal AS total
          FROM classementfonds
         WHERE categorie = ? AND rank1erJanvier IS NOT NULL
         ORDER BY rang ASC
      `, [cat.categorie]);

      if (!attendu.length || !stocke.length) {
        console.log(`  ${String(cat.categorie).slice(0, 34).padEnd(34)} donnees insuffisantes (${attendu.length} perf / ${stocke.length} rangs)`);
        continue;
      }

      const rangStocke = new Map(stocke.map(r => [r.fond_id, r.rang]));
      let concordent = 0;
      let compares = 0;
      attendu.forEach((r, i) => {
        const attenduRang = i + 1;
        const reel = rangStocke.get(r.fond_id);
        if (reel === undefined) return;
        compares++;
        if (reel === attenduRang) concordent++;
      });

      const pct = compares ? (concordent / compares) * 100 : 0;
      const verdict = pct >= 95 ? 'CONCORDE — recalcule'
                    : pct >= 40 ? 'PARTIEL — recalcul incomplet ou donnees bougees depuis'
                    : 'DIVERGE — classement PERIME';
      console.log(`  ${String(cat.categorie).slice(0, 34).padEnd(34)} ${String(concordent).padStart(4)}/${String(compares).padEnd(4)} rangs identiques (${pct.toFixed(1)} %)  ${verdict}`);
      const totalStocke = stocke[0] && stocke[0].total;
      if (totalStocke != null && Number(totalStocke) !== attendu.length) {
        console.log(`  ${''.padEnd(34)} effectif stocke ${totalStocke} vs ${attendu.length} fonds notes aujourd hui — l assiette a change`);
      }
    }

    console.log('');
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
