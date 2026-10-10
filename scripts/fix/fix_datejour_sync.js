/**
 * Resynchronise `fond_investissements.datejour` avec la vraie derniere VL
 * de chaque fond (MAX(valorisations.date)).
 *
 * POURQUOI CE SCRIPT
 * ------------------
 * `datejour` est une colonne DENORMALISEE (un cache d'affichage) portee par
 * `fond_investissements`. Elle alimente la colonne "Date" des pages pays via
 * `/api/getfondbypays/:id` (routes_vl_admin.js:344) et
 * `/api/listeproduitpayssociete/:id`.
 *
 * Les imports MAROC (ASFIM) et TUNISIE mettent cette colonne a jour. L'import
 * BRVM BOC (UEMOA) inserait les VL dans `valorisations` SANS rafraichir
 * `datejour`. Consequence constatee en production le 2026-08-12 :
 *   - /api/valLiq/2617        -> VL jusqu'au 2026-08-11 (donnee saine)
 *   - /api/getfondbypays/UEMOA -> datejour = 2025-10-15 (10 mois de retard)
 * Les 111 fonds UEMOA actifs apparaissaient donc perimes sur la page pays
 * alors que la base et les fiches fonds etaient correctes.
 *
 * PORTEE : affichage uniquement. Aucune valeur financiere (VL, performance,
 * ratio, classement) n'est touchee. Le script ne lit et n'ecrit QUE `datejour`.
 *
 * SECURITE
 * --------
 *   - dry-run par defaut : n'ecrit rien sans --execute
 *   - snapshot JSON des anciennes valeurs avant toute ecriture (--rollback)
 *   - ne touche jamais un fonds sans VL (datejour laisse tel quel)
 *   - idempotent : relancable sans effet de bord
 *
 * USAGE
 *   node fix_datejour_sync.js                        # dry-run, tous pays
 *   node fix_datejour_sync.js --pays UEMOA           # dry-run, un pays
 *   node fix_datejour_sync.js --pays UEMOA --execute # applique
 *   node fix_datejour_sync.js --rollback data/datejour_snapshots/<fichier>.json
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

const SNAPSHOT_DIR = path.resolve(__dirname, '../../data/datejour_snapshots');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { pays: null, execute: false, rollback: null, limit: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pays' && args[i + 1]) opts.pays = args[++i];
    else if (args[i] === '--execute') opts.execute = true;
    else if (args[i] === '--rollback' && args[i + 1]) opts.rollback = args[++i];
    else if (args[i] === '--limit' && args[i + 1]) opts.limit = parseInt(args[++i], 10);
  }
  return opts;
}

const fmt = d => (d instanceof Date ? d.toISOString().slice(0, 10) : (d ? String(d).slice(0, 10) : null));

/**
 * Ecarts entre `datejour` et la vraie derniere VL.
 * INNER JOIN : un fonds sans aucune VL est volontairement exclu (on ne
 * fabrique pas une date, et on n'efface pas une date existante).
 */
async function findDrift(conn, pays, limit) {
  const params = [];
  let sql = `
    SELECT f.id,
           f.nom_fond,
           f.pays,
           f.active,
           f.datejour       AS datejour_actuel,
           MAX(v.date)      AS derniere_vl,
           COUNT(v.id)      AS nb_vl
      FROM fond_investissements f
      INNER JOIN valorisations v ON v.fund_id = f.id
  `;
  if (pays) {
    sql += ` WHERE LOWER(f.pays) = LOWER(?)`;
    params.push(pays);
  }
  sql += `
     GROUP BY f.id, f.nom_fond, f.pays, f.active, f.datejour
    HAVING f.datejour IS NULL OR DATE(f.datejour) <> DATE(MAX(v.date))
     ORDER BY f.pays, f.id
  `;
  if (limit) sql += ` LIMIT ${parseInt(limit, 10)}`;

  const [rows] = await conn.execute(sql, params);
  return rows;
}

async function rollback(conn, file) {
  const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\nROLLBACK depuis ${file}`);
  console.log(`  batch   : ${snap.batch}`);
  console.log(`  genere  : ${snap.generated_at}`);
  console.log(`  entrees : ${snap.entries.length}\n`);

  await conn.beginTransaction();
  try {
    let n = 0;
    for (const e of snap.entries) {
      await conn.execute('UPDATE fond_investissements SET datejour = ? WHERE id = ?', [e.datejour_avant, e.id]);
      n++;
    }
    await conn.commit();
    console.log(`OK — ${n} fonds restaures a leur datejour d'origine.`);
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

    const drift = await findDrift(conn, opts.pays, opts.limit);

    console.log('\n=== SYNCHRONISATION datejour <- MAX(valorisations.date) ===');
    console.log(`Perimetre : ${opts.pays || 'TOUS PAYS'}`);
    console.log(`Mode      : ${opts.execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}`);
    console.log(`Ecarts    : ${drift.length} fonds\n`);

    if (drift.length === 0) {
      console.log('Aucun ecart. Rien a faire.');
      return;
    }

    // Repartition par pays : lecture rapide de l'ampleur reelle.
    const parPays = {};
    for (const r of drift) {
      const p = r.pays || '(sans pays)';
      parPays[p] = (parPays[p] || 0) + 1;
    }
    console.log('Repartition par pays :');
    for (const [p, n] of Object.entries(parPays).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${p.padEnd(12)} ${n} fonds`);
    }

    console.log('\nEchantillon (20 premiers) :');
    for (const r of drift.slice(0, 20)) {
      const av = fmt(r.datejour_actuel) || 'NULL';
      console.log(
        `  [${String(r.id).padStart(5)}] ${String(r.nom_fond).slice(0, 40).padEnd(40)} ` +
        `${av} -> ${fmt(r.derniere_vl)}  (${r.nb_vl} VL, actif=${r.active})`
      );
    }
    if (drift.length > 20) console.log(`  ... et ${drift.length - 20} autres`);

    if (!opts.execute) {
      console.log('\nDRY-RUN : aucune ecriture effectuee.');
      console.log('Pour appliquer : relancer la meme commande avec --execute');
      return;
    }

    // Snapshot AVANT ecriture — condition de reversibilite.
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const batch = `DATEJOUR_${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;
    const snapFile = path.join(SNAPSHOT_DIR, `${batch}.json`);
    fs.writeFileSync(snapFile, JSON.stringify({
      batch,
      generated_at: new Date().toISOString(),
      pays: opts.pays || 'ALL',
      entries: drift.map(r => ({
        id: r.id,
        nom_fond: r.nom_fond,
        datejour_avant: fmt(r.datejour_actuel),
        datejour_apres: fmt(r.derniere_vl),
      })),
    }, null, 2));
    console.log(`\nSnapshot ecrit : ${snapFile}`);

    await conn.beginTransaction();
    try {
      let n = 0;
      for (const r of drift) {
        await conn.execute('UPDATE fond_investissements SET datejour = ? WHERE id = ?', [fmt(r.derniere_vl), r.id]);
        n++;
      }
      await conn.commit();
      console.log(`OK — ${n} fonds resynchronises (transaction unique).`);
      console.log(`Rollback : node ${path.relative(process.cwd(), __filename)} --rollback ${snapFile}`);
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
