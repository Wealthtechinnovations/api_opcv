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
    // (`timestamps: false` dans les modeles) et `performences.updated_at` est
    // entierement NULL : la fraicheur d un classement est structurellement
    // immesurable. C est precisement pourquoi `check_cron_health.js` en etait
    // reduit a un proxy, et pourquoi ce proxy mentait. A defaut de date, on juge
    // sur le CONTENU : le rang stocke doit reproduire l ordre qu impliquent les
    // performances actuellement en base.
    //
    // PERIMETRE — la premiere version de ce controle a rendu un verdict FAUX
    // (« 0/473 rangs identiques, classement perime ») en groupant par
    // `categorie`. `/api/classementmysql` ecrit en realite TROIS lignes par
    // fonds, distinguees par `type_classement` : 1 = rang dans la categorie
    // NATIONALE, 2 = regionale, 3 = globale. Comparer un ordre global a des
    // rangs nationaux ne pouvait que diverger. On ne compare donc que le
    // type 1, au sein de `categorie_nationale`, qui est l assiette que la route
    // utilise reellement pour ce rang.
    const [assiettes] = await conn.query(`
      SELECT categorie_nationale AS cat, COUNT(*) AS n
        FROM classementfonds
       WHERE type_classement = 1
         AND categorie_nationale IS NOT NULL AND categorie_nationale <> ''
       GROUP BY categorie_nationale
      HAVING n >= 10
       ORDER BY n DESC
       LIMIT 5
    `);

    if (!assiettes.length) {
      console.log('  aucune assiette nationale d au moins 10 fonds — rien de comparable');
    }

    for (const a of assiettes) {
      // Ordre implique par les performances actuelles, dans la MEME assiette.
      // Appariement verifie sur les modeles : la performance annuelle s appelle
      // `ytd` dans `performences`, son rang `rank1erJanvier` dans
      // `classementfonds`. Ecrire `perf1erJanvier` des deux cotes — le nom que
      // porte l API — aurait fait echouer la requete sans rien mesurer.
      const [attendu] = await conn.query(`
        SELECT c.fond_id, p.ytd
          FROM classementfonds c
          JOIN performences p ON p.fond_id = c.fond_id
          JOIN (SELECT fond_id, MAX(date) AS d FROM performences GROUP BY fond_id) m
            ON m.fond_id = p.fond_id AND m.d = p.date
         WHERE c.type_classement = 1
           AND c.categorie_nationale = ?
           AND p.ytd IS NOT NULL
         GROUP BY c.fond_id, p.ytd
         ORDER BY p.ytd DESC
      `, [a.cat]);

      const [stocke] = await conn.query(`
        SELECT fond_id, CAST(rank1erJanvier AS UNSIGNED) AS rang,
               CAST(rank1erJanviertotal AS UNSIGNED) AS total
          FROM classementfonds
         WHERE type_classement = 1
           AND categorie_nationale = ?
           AND rank1erJanvier IS NOT NULL
      `, [a.cat]);

      const nom = String(a.cat).slice(0, 32).padEnd(32);
      if (attendu.length < 5 || stocke.length < 5) {
        console.log(`  ${nom} donnees insuffisantes (${attendu.length} perf / ${stocke.length} rangs)`);
        continue;
      }

      const rangStocke = new Map(stocke.map(r => [r.fond_id, r.rang]));

      // L egalite STRICTE de rang est un juge trop severe : deux fonds au meme
      // `ytd` peuvent etre departages differemment sans que rien ne soit perime.
      // On mesure donc trois choses, et on ne conclut que si elles concordent :
      //   - l egalite stricte, indicative ;
      //   - la correlation de rangs (Spearman), insensible aux permutations
      //     locales entre ex aequo mais pas a un reclassement de fond ;
      //   - le recouvrement du top 10, qui est ce que l utilisateur regarde.
      const paires = [];
      attendu.forEach((r, idx) => {
        const reel = rangStocke.get(r.fond_id);
        if (reel !== undefined) paires.push({ attendu: idx + 1, reel, fond: r.fond_id });
      });
      const compares = paires.length;
      const concordent = paires.filter(x => x.attendu === x.reel).length;

      const exaequo = attendu.length - new Set(attendu.map(r => Number(r.ytd))).size;

      let rho = null;
      if (compares > 2) {
        const sd2 = paires.reduce((acc, x) => acc + (x.attendu - x.reel) ** 2, 0);
        rho = 1 - (6 * sd2) / (compares * (compares ** 2 - 1));
      }

      const top10attendu = new Set(attendu.slice(0, 10).map(r => r.fond_id));
      const top10stocke = new Set(
        stocke.filter(r => r.rang >= 1 && r.rang <= 10).map(r => r.fond_id)
      );
      let recouvrement = 0;
      for (const f of top10attendu) if (top10stocke.has(f)) recouvrement++;

      const pct = compares ? (concordent / compares) * 100 : 0;
      // Le verdict exige que Spearman ET le top 10 concordent. Une premiere
      // calibration accordait « PROCHE » sur le seul rho >= 0,80 : OBLIGATIONS
      // NIGERIA passait ainsi pour proche avec rho 0,827 alors que 6 de ses 10
      // premiers fonds etaient faux. Une correlation d ensemble honorable peut
      // masquer une tete de classement entierement fausse — et la tete est
      // precisement ce que l utilisateur regarde.
      const verdict = (rho !== null && rho >= 0.97 && recouvrement >= 9) ? 'CONCORDE — recalcule'
                    : (rho !== null && rho >= 0.80 && recouvrement >= 7) ? 'PROCHE — permutations locales, a instruire'
                    : 'DIVERGE — le classement ne reflete pas les performances en base';
      console.log(
        `  ${nom} strict ${String(concordent).padStart(4)}/${String(compares).padEnd(4)} (${pct.toFixed(1)} %)` +
        ` · rho ${rho === null ? '  n/a' : rho.toFixed(3).padStart(6)}` +
        ` · top10 ${recouvrement}/10 · ex aequo ${exaequo}`
      );
      console.log(`  ${''.padEnd(32)} ${verdict}`);

      // L effectif est propre a chaque ligne ; on prend le plus frequent plutot
      // qu une ligne au hasard, qui ne prouverait rien.
      const freq = new Map();
      for (const r of stocke) if (r.total != null) freq.set(r.total, (freq.get(r.total) || 0) + 1);
      const totalDominant = [...freq.entries()].sort((x, y) => y[1] - x[1])[0];
      if (totalDominant && Number(totalDominant[0]) !== attendu.length) {
        console.log(`  ${''.padEnd(32)} effectif stocke ${totalDominant[0]} (sur ${totalDominant[1]} lignes) vs ${attendu.length} fonds notes aujourd hui`);
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
