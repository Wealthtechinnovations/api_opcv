/**
 * Ramene au naira les SEGMENTS de VL libelles en dollars, en lisant la source.
 *
 * POURQUOI UN TROISIEME CORRECTIF, ET EN QUOI IL DIFFERE
 * -----------------------------------------------------
 * Les deux precedents raisonnaient sur la FORME de la serie : une rupture entre
 * deux VL consecutives, puis un voisinage de reference. Les deux se sont
 * trompes, et pour la meme raison — la serie ne peut pas s auditer elle-meme
 * quand une partie d elle-meme est fausse :
 *
 *   - un voisin unique bordant une rupture etait pris pour la coupable ;
 *   - un plateau de deux releves se validait lui-meme ;
 *   - un plateau de 14 releves constants a 100,00 (GUARANTY TRUST, 2026-05-15
 *     au 2026-08-14) etait invisible : chaque point y confirmait le suivant.
 *
 * Ce correctif ne regarde plus la forme. Il compare chaque VL au prix NAIRA que
 * la SEC publie pour ce fonds A CETTE DATE, et n ecrit que si le rapport ne
 * laisse aucune place au doute :
 *
 *     rapport = prix_naira_publie / valeur_en_base >= 100
 *
 * Le taux NGN/USD va de 400 (2022) a 1 600 (2026) ; les ecarts de valeur connus
 * entre base et source sont tous inferieurs a 10x. Aucune valeur plausible
 * n habite l intervalle entre 10 et 100 : un rapport superieur a 100 ne peut
 * etre qu un changement d unite monetaire.
 *
 * Chaque ligne est donc jugee SEULE, contre une valeur publiee pour sa date
 * exacte. Aucun voisin n intervient — donc aucun plateau ne peut se valider
 * lui-meme, quelle que soit sa longueur. C est le seul point qui distingue ce
 * correctif des deux qui ont echoue.
 *
 * MESURE DU 2026-09-01 (diag_plateaux_nigeria.js) : 41 segments sur 30 fonds,
 * 157 VL, dont 145 dans 29 plateaux de 2 releves ou plus.
 *
 * CE QU IL NE CORRIGE PAS, ET C EST VOULU
 *   - les ecarts de valeur (rapport entre 1,01 et 100) : autre chantier ;
 *   - les dates hors fenetre du rejeu : aucune source, donc aucune ecriture ;
 *   - les dates ou la source publie elle-meme une valeur douteuse — par exemple
 *     GUARANTY TRUST en aout 2026, ou le fichier SEC porte 100,00 en colonne
 *     naira. La ligne reste alors « conforme a la source » et n est pas touchee.
 *     Ces cas se corrigent a la source, pas en base.
 *
 * APRES EXECUTION : recalculer vl_ajuste, puis les conversions EUR/USD, puis les
 * performances. Sans quoi le site affichera des VL justes et des performances
 * calculees sur les anciennes.
 *
 * SECURITE : dry-run par defaut, snapshot complet, transaction unique,
 * idempotent, rollback par --rollback (et --ids pour un sous-ensemble).
 *
 * USAGE
 *   node scripts/fix/fix_segments_dollars_nigeria.js            # dry-run
 *   node scripts/fix/fix_segments_dollars_nigeria.js --execute
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { normalizeNameForMatch, lireCSV } = require('../../src/lib/sec_csv');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const SNAPSHOT_DIR = path.resolve(__dirname, '../../data/naira_snapshots');
// En deca, ce n est pas un changement d unite monetaire. Voir l en-tete.
const RAPPORT_DEVISE = 100;

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { csv: path.resolve(__dirname, '../../sec_ng_replay.csv'), execute: false, rollback: null, ids: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--csv' && a[i + 1]) o.csv = a[++i];
    else if (a[i] === '--execute') o.execute = true;
    else if (a[i] === '--rollback' && a[i + 1]) o.rollback = a[++i];
    else if (a[i] === '--ids' && a[i + 1]) o.ids = a[++i].split(',').map(s => s.trim()).filter(Boolean);
  }
  return o;
}

const j = x => {
  if (!x) return '?';
  if (x instanceof Date) {
    const p = k => String(k).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  return String(x).slice(0, 10);
};

async function rollback(conn, fichier, seulement) {
  const snap = JSON.parse(fs.readFileSync(fichier, 'utf8'));
  let rows = snap.rows;
  if (seulement && seulement.length) {
    const garder = new Set(seulement.map(Number));
    rows = rows.filter(r => garder.has(Number(r.id)));
    const absents = seulement.filter(id => !rows.some(r => Number(r.id) === Number(id)));
    if (absents.length) {
      console.error(`\nABANDON : id absents du snapshot : ${absents.join(', ')}`);
      process.exitCode = 1;
      return;
    }
  }
  console.log(`\nROLLBACK depuis ${fichier} — ${rows.length} ligne(s)\n`);
  await conn.beginTransaction();
  try {
    for (const r of rows) {
      await conn.execute(
        `UPDATE valorisations SET value = ?, currency_code = ?, correction_batch = ? WHERE id = ?`,
        [r.value, r.currency_code, r.correction_batch, r.id]
      );
    }
    await conn.commit();
    console.log(`OK — ${rows.length} ligne(s) restauree(s).`);
  } catch (err) {
    await conn.rollback();
    console.error('ECHEC rollback :', err.message);
    process.exitCode = 1;
  }
}

async function main() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    if (opts.rollback) { await rollback(conn, opts.rollback, opts.ids); return; }

    if (!fs.existsSync(opts.csv)) {
      console.error(`CSV introuvable : ${opts.csv}`);
      process.exitCode = 1;
      return;
    }
    const { entetes, lignes } = lireCSV(opts.csv);
    if (!entetes.includes('vl_price_ngn')) {
      console.error('Le CSV ne porte pas `vl_price_ngn` : relancer le rejeu.');
      process.exitCode = 1;
      return;
    }

    const [fonds] = await conn.query(
      `SELECT id, nom_fond FROM fond_investissements WHERE LOWER(pays) = 'nigeria' AND active = 1`
    );
    const parNom = new Map();
    for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);
    const parId = new Map(fonds.map(f => [f.id, f]));

    const naira = new Map();
    for (const l of lignes) {
      const f = parNom.get(normalizeNameForMatch(l.fund_name_clean || ''));
      if (!f) continue;
      const d = j(l.valuation_date);
      const p = parseFloat(l.vl_price_ngn);
      if (d === '?' || !Number.isFinite(p) || p <= 0) continue;
      naira.set(`${f.id}|${d}`, p);
    }

    const [vls] = await conn.query(`
      SELECT v.id, v.fund_id, DATE_FORMAT(v.date, '%Y-%m-%d') AS date, v.value
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id AND f.active = 1
       WHERE LOWER(f.pays) = 'nigeria' AND v.value > 0
       ORDER BY v.fund_id, v.date
    `);

    const corrections = [];
    for (const v of vls) {
      const src = naira.get(`${v.fund_id}|${v.date}`);
      if (src === undefined) continue;
      const rapport = src / Number(v.value);
      if (rapport >= RAPPORT_DEVISE) {
        corrections.push({ ...v, naira: src, rapport });
      }
    }

    console.log('\n=== SEGMENTS EN DOLLARS -> NAIRA PUBLIE ===');
    console.log(`CSV       : ${opts.csv}`);
    console.log(`Mode      : ${opts.execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}`);
    console.log(`Critere   : prix_naira_publie / valeur_en_base >= ${RAPPORT_DEVISE}`);
    console.log(`A corriger: ${corrections.length} VL sur ${new Set(corrections.map(c => c.fund_id)).size} fonds\n`);

    if (!corrections.length) { console.log('Rien a corriger.\n'); return; }

    console.log(`  ${'fonds'.padStart(5)} ${'date'.padEnd(10)} ${'en base'.padStart(13)} ${'-> naira'.padStart(14)} ${'rapport'.padStart(8)}  nom`);
    console.log(`  ${'-'.repeat(5)} ${'-'.repeat(10)} ${'-'.repeat(13)} ${'-'.repeat(14)} ${'-'.repeat(8)}  ---`);
    for (const c of corrections.slice(0, 50)) {
      const f = parId.get(c.fund_id);
      console.log(
        `  ${String(c.fund_id).padStart(5)} ${c.date.padEnd(10)} ${Number(c.value).toFixed(2).padStart(13)}` +
        ` ${Number(c.naira).toFixed(2).padStart(14)} ${c.rapport.toFixed(0).padStart(8)}  ${String(f ? f.nom_fond : '?').slice(0, 26)}`
      );
    }
    if (corrections.length > 50) console.log(`  ... et ${corrections.length - 50} autre(s)`);

    if (!opts.execute) {
      console.log('\nDRY-RUN — aucune ecriture. Relancer avec --execute pour appliquer.\n');
      return;
    }

    const [avant] = await conn.query('SELECT * FROM valorisations WHERE id IN (?)', [corrections.map(c => c.id)]);
    const batch = `NGNSEG_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;
    if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const fichier = path.join(SNAPSHOT_DIR, `${batch}.json`);
    fs.writeFileSync(fichier, JSON.stringify({ batch, generated_at: new Date().toISOString(), csv: opts.csv, rows: avant }, null, 2));
    console.log(`\nSnapshot ecrit : ${fichier} (${avant.length} lignes completes)`);

    await conn.beginTransaction();
    try {
      for (const c of corrections) {
        await conn.execute(
          `UPDATE valorisations SET value = ?, currency_code = 'NGN', correction_batch = ? WHERE id = ?`,
          [c.naira, batch, c.id]
        );
      }
      await conn.commit();
      console.log(`OK — ${corrections.length} VL ramenee(s) au naira publie.`);
    } catch (err) {
      await conn.rollback();
      console.error('ECHEC, transaction annulee :', err.message);
      process.exitCode = 1;
      return;
    }

    console.log('\nA FAIRE ENSUITE :');
    console.log('  1. node scripts/recalc/recalc_vl_ajuste.js');
    console.log('  2. node scripts/recalc/recalc_eur_usd_daily_rate.js');
    console.log('  3. performances, puis classements');
    console.log(`\nRollback : --rollback ${fichier}`);
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
