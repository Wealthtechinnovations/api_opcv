/**
 * Retire les VL d'un lot d'insertion qui ont introduit une RUPTURE D'ECHELLE
 * dans une serie par ailleurs coherente.
 *
 * POURQUOI CE SCRIPT (mesure du 2026-08-21, en production)
 * -------------------------------------------------------
 * CODE_REVIEW #73 etait decrit comme « 44 fonds dont la serie entiere melange
 * deux echelles ». La mesure ligne a ligne dit autre chose :
 *
 *   - l'historique de ces fonds est en NAIRA, correctement qualifie
 *     (`currency_code = 'NGN'`, `source_url` SEC, batch SECNGFIX_20260802) ;
 *   - une SEULE insertion, celle du 2026-08-10 10:00 (cron Nigeria du lundi),
 *     a ecrit 2 lignes par fonds — dates 2026-07-17 et 2026-07-24 — portant le
 *     prix en DOLLARS dans la colonne `value`, sans aucune qualification
 *     (`currency_code`, `source_url`, `correction_batch` tous NULL).
 *
 * Soit 82 lignes sur 41 fonds Nigeria. Le facteur mesure entre l'ancienne et la
 * nouvelle echelle est de 1 380 a 1 680 : c'est le taux NGN/USD, pas une
 * derive de marche. Exemple, AFRINVEST DOLLAR FUND (1141) :
 *
 *   2026-07-10  165 207,29  currency_code=NGN  source=documents/1497
 *   2026-07-17     119,7484 currency_code=NULL source=NULL   <- rupture
 *   2026-07-24     119,9184 currency_code=NULL source=NULL   <- rupture
 *
 * C'est cette rupture qui produit les YTD absurdes du controle C3 (fonds 1141 a
 * 143 958 %) et les 44 fonds du controle C7.
 *
 * CAUSE : l'extracteur `sec_ng_nav_extractor_v6.py` d'alors deduisait la devise
 * du NOM du fonds et retenait la colonne dollar pour tout fonds nomme DOLLAR ou
 * EUROBOND. Le correctif du 2026-08-19 (lot AI) lit desormais l'en-tete de
 * chaque colonne et retient celle qui correspond a la devise du fonds. Les
 * futures extractions sont saines ; ce script traite les lignes deja ecrites.
 *
 * POURQUOI SUPPRIMER PLUTOT QUE CONVERTIR
 * ---------------------------------------
 * Convertir 119,9184 en naira demanderait de MULTIPLIER par un taux — donc de
 * fabriquer une valeur qui n'a jamais ete publiee. La regle du projet l'interdit.
 * La valeur naira de ces deux semaines existe dans les fichiers source, presents
 * sur le serveur (`sec_ng_downloads/`, 553 fichiers). La supprimer ici et la
 * laisser revenir par le cron hebdomadaire — qui reextrait l'annee courante avec
 * l'extracteur corrige et passe par le contrat d'ecriture — restitue la donnee
 * LUE au lieu d'une donnee CALCULEE.
 *
 * PORTEE : uniquement des lignes non qualifiees, d'un lot d'insertion nomme, dont
 * l'echelle s'ecarte d'un facteur >= 10 du maximum anterieur du meme fonds. Une
 * ligne portant `currency_code`, `source_url` ou `correction_batch` n'est JAMAIS
 * touchee : elle a une provenance, donc elle se corrige a la source.
 *
 * APRES EXECUTION, deux etapes restent necessaires (le script les rappelle) :
 *   1. node scripts/fix/fix_datejour_sync.js --pays NIGERIA --execute
 *      (la derniere VL recule du 2026-07-24 au 2026-07-10)
 *   2. recalcul des performances des fonds touches
 *
 * SECURITE
 *   - dry-run par defaut : n'ecrit rien sans --execute
 *   - snapshot JSON de la LIGNE ENTIERE avant suppression (--rollback la restitue)
 *   - transaction unique : tout passe ou rien ne passe
 *   - idempotent : relancable, ne trouve plus rien apres coup
 *
 * USAGE
 *   node fix_scale_break_sec.js                              # dry-run
 *   node fix_scale_break_sec.js --execute                    # applique
 *   node fix_scale_break_sec.js --pays NIGERIA --insert-date 2026-08-10
 *   node fix_scale_break_sec.js --rollback data/scale_break_snapshots/<f>.json
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

const SNAPSHOT_DIR = path.resolve(__dirname, '../../data/scale_break_snapshots');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    pays: 'NIGERIA',
    insertDate: '2026-08-10',
    facteur: 10,
    execute: false,
    rollback: null,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pays' && args[i + 1]) opts.pays = args[++i];
    else if (args[i] === '--insert-date' && args[i + 1]) opts.insertDate = args[++i];
    else if (args[i] === '--facteur' && args[i + 1]) opts.facteur = parseFloat(args[++i]);
    else if (args[i] === '--execute') opts.execute = true;
    else if (args[i] === '--rollback' && args[i + 1]) opts.rollback = args[++i];
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.insertDate)) {
    throw new Error(`--insert-date invalide : ${opts.insertDate} (attendu AAAA-MM-JJ)`);
  }
  if (!(opts.facteur >= 2)) {
    throw new Error(`--facteur doit valoir au moins 2 (recu : ${opts.facteur})`);
  }
  return opts;
}

const jour = d => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

/**
 * Les lignes candidates.
 *
 * Le maximum de reference est calcule sur les lignes inserees STRICTEMENT AVANT
 * le lot suspect : comparer une ligne du lot a un maximum qui l'inclurait
 * rendrait le test tautologique pour le fonds dont le lot contient le maximum.
 *
 * Les trois conditions NULL sont l'element decisif : elles isolent l'ecriture
 * non gouvernee. Toute ligne ayant une provenance est hors perimetre.
 */
async function findBreaks(conn, opts) {
  const sql = `
    SELECT v.id,
           v.fund_id,
           f.nom_fond,
           f.pays,
           f.dev_libelle,
           v.date,
           v.value,
           m.vmax_avant,
           ROUND(m.vmax_avant / v.value, 1) AS facteur
      FROM valorisations v
      JOIN fond_investissements f
        ON f.id = v.fund_id
      JOIN (SELECT fund_id, MAX(value) AS vmax_avant
              FROM valorisations
             WHERE created_at < ?
             GROUP BY fund_id) m
        ON m.fund_id = v.fund_id
     WHERE DATE(v.created_at) = ?
       AND LOWER(f.pays) = LOWER(?)
       AND v.value > 0
       AND m.vmax_avant > 0
       AND m.vmax_avant / v.value >= ?
       AND v.currency_code   IS NULL
       AND v.source_url      IS NULL
       AND v.correction_batch IS NULL
     ORDER BY v.fund_id, v.date
  `;
  const [rows] = await conn.execute(sql, [opts.insertDate, opts.insertDate, opts.pays, opts.facteur]);
  return rows;
}

async function snapshotRows(conn, ids) {
  const [rows] = await conn.query(
    'SELECT * FROM valorisations WHERE id IN (?)',
    [ids]
  );
  return rows;
}

/**
 * Restitution. Les lignes sont reinserees telles quelles, `id` compris, pour que
 * toute reference externe reste valable. Une ligne deja reintroduite par un
 * import est laissee en place et signalee : on ne recree pas de doublon.
 */
async function rollback(conn, file) {
  const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\nROLLBACK depuis ${file}`);
  console.log(`  batch   : ${snap.batch}`);
  console.log(`  genere  : ${snap.generated_at}`);
  console.log(`  lignes  : ${snap.rows.length}\n`);

  await conn.beginTransaction();
  try {
    let restaurees = 0;
    let ignorees = 0;
    for (const row of snap.rows) {
      const [[exist]] = await conn.query(
        'SELECT COUNT(*) AS n FROM valorisations WHERE fund_id = ? AND date = ?',
        [row.fund_id, row.date]
      );
      if (exist.n > 0) {
        console.log(`  ignoree : fonds ${row.fund_id} au ${jour(row.date)} — une ligne existe deja`);
        ignorees++;
        continue;
      }
      const cols = Object.keys(row);
      await conn.query(
        `INSERT INTO valorisations (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (?)`,
        [cols.map(c => row[c])]
      );
      restaurees++;
    }
    await conn.commit();
    console.log(`\nOK — ${restaurees} ligne(s) restauree(s), ${ignorees} ignoree(s).`);
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

    const breaks = await findBreaks(conn, opts);

    console.log('\n=== RUPTURES D ECHELLE — LIGNES NON QUALIFIEES ===');
    console.log(`Pays          : ${opts.pays}`);
    console.log(`Lot insere le : ${opts.insertDate}`);
    console.log(`Facteur mini  : x${opts.facteur} par rapport au maximum anterieur du fonds`);
    console.log(`Mode          : ${opts.execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}`);
    console.log(`Trouve        : ${breaks.length} ligne(s) sur ${new Set(breaks.map(b => b.fund_id)).size} fonds\n`);

    if (breaks.length === 0) {
      console.log('Aucune rupture. Rien a faire.');
      return;
    }

    console.log('  fonds  devise  date        valeur ecrite     max anterieur   facteur  nom');
    console.log('  -----  ------  ----------  ----------------  --------------  -------  ---');
    for (const b of breaks) {
      console.log(
        `  ${String(b.fund_id).padStart(5)}  ${String(b.dev_libelle || '?').padEnd(6)}  ${jour(b.date)}  ` +
        `${Number(b.value).toFixed(4).padStart(16)}  ${Number(b.vmax_avant).toFixed(2).padStart(14)}  ` +
        `${String(b.facteur).padStart(7)}  ${String(b.nom_fond).slice(0, 34)}`
      );
    }

    const parFonds = new Map();
    for (const b of breaks) parFonds.set(b.fund_id, (parFonds.get(b.fund_id) || 0) + 1);
    const suspects = [...parFonds.entries()].filter(([, n]) => n > 6);
    if (suspects.length) {
      console.log(`\nATTENTION — ${suspects.length} fonds ont plus de 6 lignes touchees :`);
      console.log(`  ${suspects.map(([id, n]) => `${id} (${n})`).join(', ')}`);
      console.log('  Une serie entiere ne se corrige pas par suppression. Verifier avant --execute.');
    }

    if (!opts.execute) {
      console.log('\nDRY-RUN — aucune ecriture. Relancer avec --execute pour appliquer.');
      return;
    }

    const rows = await snapshotRows(conn, breaks.map(b => b.id));
    const batch = `SCALEBREAK_${opts.insertDate.replace(/-/g, '')}_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;
    if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const file = path.join(SNAPSHOT_DIR, `${batch}.json`);
    fs.writeFileSync(file, JSON.stringify({
      batch,
      generated_at: new Date().toISOString(),
      pays: opts.pays,
      insert_date: opts.insertDate,
      facteur: opts.facteur,
      rows,
    }, null, 2));
    console.log(`\nSnapshot ecrit : ${file} (${rows.length} lignes completes)`);

    await conn.beginTransaction();
    try {
      const [res] = await conn.query('DELETE FROM valorisations WHERE id IN (?)', [breaks.map(b => b.id)]);
      await conn.commit();
      console.log(`OK — ${res.affectedRows} ligne(s) supprimee(s).`);
    } catch (err) {
      await conn.rollback();
      console.error('ECHEC suppression, transaction annulee :', err.message);
      process.exitCode = 1;
      return;
    }

    console.log('\nA FAIRE ENSUITE — la suppression fait reculer la derniere VL de ces fonds :');
    console.log('  1. node scripts/fix/fix_datejour_sync.js --pays ' + opts.pays + ' --execute');
    console.log('  2. recalcul des performances des fonds concernes');
    console.log('  3. laisser le cron hebdomadaire reimporter les dates manquantes depuis la source SEC');
    console.log(`\nRollback : node scripts/fix/fix_scale_break_sec.js --rollback ${file}`);
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
