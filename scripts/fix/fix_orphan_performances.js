/**
 * Supprime les lignes de performances ORPHELINES : celles dont la date n'a plus
 * de VL correspondante dans `valorisations` pour le meme fonds.
 *
 * POURQUOI CE SCRIPT
 * ------------------
 * Piege identifie en production le 2026-08-06 (lot T). Les scripts
 * `fix_populate_performances*` calculent la performance a la DERNIERE date VL
 * d'un fonds, mais ne SUPPRIMENT jamais les lignes `performences` dont la date
 * est devenue orpheline apres un retrait ou un rollback de VL.
 *
 * Cas reel : apres le rollback des 20 VL du fonds 1224 (Vantage), une perf
 * orpheline au 2024-06-28 portant un YTD de 15 655 % a survecu. Etant la plus
 * recente, elle restait servie par l'API et s'affichait sur le site alors que
 * la VL correspondante n'existait plus.
 *
 * Une perf orpheline est TOUJOURS fausse : elle decrit une date pour laquelle
 * le fonds n'a aucune valeur liquidative.
 *
 * PORTEE : les 3 tables de performances (locale, EUR, USD).
 * Les VL, ratios et classements ne sont pas touches.
 *
 * AVERTISSEMENT MAJEUR — LIRE AVANT TOUT --execute GLOBAL
 * ------------------------------------------------------
 * Mesure du 2026-08-13 en production : **50 150 lignes** de `performences`
 * portent une date sans VL correspondante, soit 74 % de la table. Ce ne sont
 * PAS 50 150 anomalies. Toutes les performances ne sont pas produites a une
 * date de VL : `fix_populate_performances` ecrit a la derniere VL du fonds,
 * mais les routes batch `saveperfdatemysql` historisent a d'autres dates.
 *
 * Un `--execute` sans perimetre detruirait donc massivement des donnees
 * legitimes. N'utiliser ce script que **cible** (`--fond <id>`), apres avoir
 * instruit le cas, et prioritairement quand l'orpheline est la ligne LA PLUS
 * RECENTE du fonds — c'est ce cas-la que l'API sert et qui a produit le bug
 * Vantage (YTD 15 655 %). Le controle C2 de `scripts/diag/check_doc_drift.js`
 * ne signale plus que ce sous-ensemble.
 *
 * SECURITE
 * --------
 *   - dry-run par defaut : n'ecrit rien sans --execute
 *   - snapshot JSON des lignes supprimees avant suppression (--rollback)
 *   - ne supprime jamais une ligne dont la date a une VL
 *   - ne touche pas les fonds sans aucune VL (cas a instruire manuellement,
 *     signale separement dans le rapport)
 *
 * USAGE
 *   node fix_orphan_performances.js                          # dry-run global
 *   node fix_orphan_performances.js --fond 1224              # dry-run 1 fonds
 *   node fix_orphan_performances.js --fond 1224 --execute    # applique
 *   node fix_orphan_performances.js --pays UEMOA --execute
 *   node fix_orphan_performances.js --rollback data/perf_orphan_snapshots/<f>.json
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

// Les 3 tables de performances et leur colonne de rattachement au fonds.
const PERF_TABLES = [
  { table: 'performences', fk: 'fond_id', label: 'locale' },
  { table: 'performences_eurs', fk: 'fond_id', label: 'EUR' },
  { table: 'performences_usds', fk: 'fond_id', label: 'USD' },
];

const SNAPSHOT_DIR = path.resolve(__dirname, '../../data/perf_orphan_snapshots');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { fondId: null, pays: null, execute: false, rollback: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--fond' && args[i + 1]) opts.fondId = parseInt(args[++i], 10);
    else if (args[i] === '--pays' && args[i + 1]) opts.pays = args[++i];
    else if (args[i] === '--execute') opts.execute = true;
    else if (args[i] === '--rollback' && args[i + 1]) opts.rollback = args[++i];
  }
  return opts;
}

/**
 * Lignes de perf dont la date n'existe pas dans les VL du meme fonds.
 *
 * Le NOT EXISTS est volontairement restreint au meme fond_id : une date peut
 * exister pour un autre fonds sans rien dire de celui-ci.
 *
 * `HAVING vl_count > 0` (via le EXISTS de garde) evite de vider les perfs d'un
 * fonds qui n'a plus AUCUNE VL — situation anormale qui doit etre instruite a
 * la main plutot que traitee par une suppression de masse.
 */
async function findOrphans(conn, { table, fk }, opts) {
  const params = [];
  let sql = `
    SELECT p.*
      FROM ${table} p
      JOIN fond_investissements f ON f.id = p.${fk}
     WHERE NOT EXISTS (
             SELECT 1 FROM valorisations v
              WHERE v.fund_id = p.${fk} AND DATE(v.date) = DATE(p.date)
           )
       AND EXISTS (
             SELECT 1 FROM valorisations v2 WHERE v2.fund_id = p.${fk}
           )
  `;
  if (opts.fondId) { sql += ` AND p.${fk} = ?`; params.push(opts.fondId); }
  if (opts.pays)   { sql += ` AND LOWER(f.pays) = LOWER(?)`; params.push(opts.pays); }
  sql += ` ORDER BY p.${fk}, p.date`;

  const [rows] = await conn.execute(sql, params);
  return rows;
}

/** Fonds ayant des perfs mais plus aucune VL : signales, jamais purges d'office. */
async function findFundsWithoutVl(conn, { table, fk }, opts) {
  const params = [];
  let sql = `
    SELECT DISTINCT p.${fk} AS fond_id, f.nom_fond, f.pays, COUNT(*) AS nb_perf
      FROM ${table} p
      JOIN fond_investissements f ON f.id = p.${fk}
     WHERE NOT EXISTS (SELECT 1 FROM valorisations v WHERE v.fund_id = p.${fk})
  `;
  if (opts.fondId) { sql += ` AND p.${fk} = ?`; params.push(opts.fondId); }
  if (opts.pays)   { sql += ` AND LOWER(f.pays) = LOWER(?)`; params.push(opts.pays); }
  sql += ` GROUP BY p.${fk}, f.nom_fond, f.pays`;

  const [rows] = await conn.execute(sql, params);
  return rows;
}

async function rollback(conn, file) {
  const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\nROLLBACK depuis ${file}`);
  console.log(`  batch : ${snap.batch}  (${snap.generated_at})`);

  await conn.beginTransaction();
  try {
    let total = 0;
    for (const [table, rows] of Object.entries(snap.deleted)) {
      for (const row of rows) {
        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(', ');
        await conn.execute(
          `INSERT INTO ${table} (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`,
          cols.map(c => row[c])
        );
        total++;
      }
      console.log(`  ${table} : ${rows.length} lignes reinserees`);
    }
    await conn.commit();
    console.log(`OK — ${total} lignes restaurees.`);
  } catch (err) {
    await conn.rollback();
    console.error('ECHEC rollback, transaction annulee :', err.message);
    process.exitCode = 1;
  }
}

async function main() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    if (opts.rollback) {
      await rollback(conn, opts.rollback);
      return;
    }

    console.log('\n=== PERFORMANCES ORPHELINES (date sans VL correspondante) ===');
    console.log(`Perimetre : ${opts.fondId ? `fonds ${opts.fondId}` : (opts.pays || 'TOUS')}`);
    console.log(`Mode      : ${opts.execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}\n`);

    const found = {};
    let grandTotal = 0;

    for (const spec of PERF_TABLES) {
      const orphans = await findOrphans(conn, spec, opts);
      found[spec.table] = orphans;
      grandTotal += orphans.length;

      console.log(`${spec.table} (${spec.label}) : ${orphans.length} orphelines`);
      for (const r of orphans.slice(0, 10)) {
        // Colonne DB `ytd` (l'API l'expose sous le nom perf1erJanvier).
        const ytd = r.ytd != null ? Number(r.ytd).toFixed(2) + ' %' : 'n/a';
        console.log(`   fonds ${String(r[spec.fk]).padStart(5)}  date ${String(r.date).slice(0, 10)}  YTD ${ytd}`);
      }
      if (orphans.length > 10) console.log(`   ... et ${orphans.length - 10} autres`);

      const noVl = await findFundsWithoutVl(conn, spec, opts);
      if (noVl.length) {
        console.log(`   ATTENTION — ${noVl.length} fonds ont des perfs mais AUCUNE VL (non traites, a instruire) :`);
        for (const f of noVl.slice(0, 5)) {
          console.log(`      [${f.fond_id}] ${String(f.nom_fond).slice(0, 40)} (${f.pays}) — ${f.nb_perf} perfs`);
        }
      }
    }

    if (grandTotal === 0) {
      console.log('\nAucune performance orpheline. Rien a faire.');
      return;
    }

    if (!opts.execute) {
      console.log(`\nDRY-RUN : ${grandTotal} lignes seraient supprimees. Aucune ecriture effectuee.`);
      console.log('Pour appliquer : relancer la meme commande avec --execute');
      return;
    }

    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const batch = `PERFORPH_${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;
    const snapFile = path.join(SNAPSHOT_DIR, `${batch}.json`);
    fs.writeFileSync(snapFile, JSON.stringify({
      batch,
      generated_at: new Date().toISOString(),
      perimetre: { fond: opts.fondId, pays: opts.pays },
      deleted: found,
    }, null, 2));
    console.log(`\nSnapshot ecrit : ${snapFile}`);

    await conn.beginTransaction();
    try {
      let total = 0;
      for (const spec of PERF_TABLES) {
        for (const r of found[spec.table]) {
          await conn.execute(
            `DELETE FROM ${spec.table} WHERE ${spec.fk} = ? AND DATE(date) = DATE(?)`,
            [r[spec.fk], r.date]
          );
          total++;
        }
      }
      await conn.commit();
      console.log(`OK — ${total} performances orphelines supprimees (transaction unique).`);
      console.log(`Rollback : node ${path.relative(process.cwd(), __filename)} --rollback ${snapFile}`);
      console.log('\nRAPPEL : relancer ensuite le recalcul des performances pour le perimetre traite.');
    } catch (err) {
      await conn.rollback();
      console.error('ECHEC, transaction annulee :', err.message);
      process.exitCode = 1;
    }
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('Erreur fatale :', err.message);
  process.exit(1);
});
