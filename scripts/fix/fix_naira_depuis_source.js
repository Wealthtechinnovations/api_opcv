/**
 * Ramene au NAIRA les VL Nigeria en rupture d echelle, en LISANT la source SEC.
 *
 * DECISION UTILISATEUR DU 2026-08-29 : tous les fonds Nigeria sont tenus en
 * naira. `value` reste en naira sur toute la serie ; la vue dollar vit dans
 * `value_USD`, ou elle est deja juste.
 *
 * CE QUE CE SCRIPT ECRIT — ET CE QU IL REFUSE D ECRIRE
 * ---------------------------------------------------
 * Il ne corrige QUE les lignes remplissant les trois conditions suivantes :
 *
 *   1. la ligne est en rupture d echelle (facteur >= 10 avec la VL precedente) ;
 *   2. le fichier SEC relu publie un prix NAIRA pour ce fonds a cette date —
 *      colonne `vl_price_ngn`, emise explicitement par l extracteur ;
 *   3. cette valeur RESOUT la rupture : elle retombe dans l ordre de grandeur du
 *      voisin SAIN le plus proche.
 *
 * La troisieme condition est la plus importante et la plus facile a oublier.
 * Une correction qui remplace une valeur aberrante par une autre valeur
 * aberrante n est pas une correction — elle deplace le probleme en donnant
 * l impression de l avoir traite.
 *
 * Le voisin de reference exclut toute date elle-meme en rupture. Ces ruptures
 * vont presque toujours par paires — l aller et le retour d un meme basculement
 * de devise — et comparer au voisin immediat revenait a juger la reparation
 * d une roue en s appuyant sur l autre roue crevee.
 *
 * AUCUNE CONVERSION, JAMAIS. La valeur ecrite est celle que la SEC a publiee.
 * Multiplier un dollar par un taux fabriquerait un chiffre que personne n a
 * jamais publie : la regle du projet l interdit, et c est precisement ce qui a
 * cree le desordre qu on repare ici.
 *
 * MESURE DU 2026-08-29, fenetre de rejeu 2022-2026 :
 *   226 ruptures Nigeria — 81 resolues (ecrites), 27 non resolues (refusees),
 *   39 deja conformes, 4 sans naira publie, 75 hors fenetre du rejeu.
 *
 * APRES EXECUTION, deux recalculs restent necessaires — le script les rappelle :
 *   1. node scripts/recalc/recalc_vl_ajuste.js
 *   2. node scripts/recalc/recalc_eur_usd_daily_rate.js
 * `vl_ajuste`, `value_EUR` et `value_USD` derivent de `value` : les laisser en
 * l etat recreerait une incoherence d un autre genre.
 *
 * SECURITE
 *   - dry-run par defaut : n ecrit rien sans --execute
 *   - snapshot JSON de la LIGNE ENTIERE avant modification
 *   - --rollback restitue les valeurs d origine
 *   - transaction unique : tout passe ou rien ne passe
 *   - idempotent : relance, il ne trouve plus rien
 *
 * USAGE
 *   node fix_naira_depuis_source.js                          # dry-run
 *   node fix_naira_depuis_source.js --execute                # applique
 *   node fix_naira_depuis_source.js --csv autre.csv
 *   node fix_naira_depuis_source.js --rollback data/naira_snapshots/<f>.json
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
const FACTEUR = 10;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    csv: path.resolve(__dirname, '../../sec_ng_replay.csv'),
    execute: false,
    rollback: null,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--csv' && args[i + 1]) opts.csv = args[++i];
    else if (args[i] === '--execute') opts.execute = true;
    else if (args[i] === '--rollback' && args[i + 1]) opts.rollback = args[++i];
  }
  return opts;
}

const n = (x, d = 4) => (x === null || x === undefined || Number.isNaN(Number(x)) ? '-' : Number(x).toFixed(d));
const j = x => {
  if (!x) return '?';
  if (x instanceof Date) {
    const p = k => String(k).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  return String(x).slice(0, 10);
};

async function rollback(conn, fichier) {
  const snap = JSON.parse(fs.readFileSync(fichier, 'utf8'));
  console.log(`\nROLLBACK depuis ${fichier}`);
  console.log(`  batch   : ${snap.batch}`);
  console.log(`  genere  : ${snap.generated_at}`);
  console.log(`  lignes  : ${snap.rows.length}\n`);

  await conn.beginTransaction();
  try {
    let n = 0;
    for (const r of snap.rows) {
      await conn.execute(
        `UPDATE valorisations
            SET value = ?, currency_code = ?, correction_batch = ?
          WHERE id = ?`,
        [r.value, r.currency_code, r.correction_batch, r.id]
      );
      n++;
    }
    await conn.commit();
    console.log(`OK — ${n} ligne(s) restauree(s) a leur valeur d origine.`);
    console.log('Penser a relancer recalc_vl_ajuste.js et recalc_eur_usd_daily_rate.js.');
  } catch (err) {
    await conn.rollback();
    console.error('ECHEC rollback, transaction annulee :', err.message);
    process.exitCode = 1;
  }
}

/** Les lignes corrigibles, avec la valeur naira lue et le verdict de resolution. */
async function trouverCorrections(conn, cheminCsv) {
  const { entetes, lignes } = lireCSV(cheminCsv);
  if (!entetes.includes('vl_price_ngn')) {
    throw new Error(
      'Le CSV ne porte pas la colonne `vl_price_ngn` : il vient d une version ' +
      'anterieure de l extracteur. Relancer le rejeu avant toute correction.'
    );
  }

  const [fonds] = await conn.query(
    `SELECT id, nom_fond FROM fond_investissements WHERE LOWER(pays) = 'nigeria'`
  );
  const parNom = new Map();
  for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);

  const naira = new Map();
  for (const l of lignes) {
    const f = parNom.get(normalizeNameForMatch(l.fund_name_clean || ''));
    if (!f) continue;
    const date = j(l.valuation_date);
    const prix = parseFloat(l.vl_price_ngn);
    if (date === '?' || !Number.isFinite(prix) || prix <= 0) continue;
    naira.set(`${f.id}|${date}`, { prix, source: l.vl_price_ngn_source || '' });
  }

  const [ruptures] = await conn.query(`
    WITH serie AS (
      SELECT v.id, v.fund_id, v.date, v.value, v.currency_code, v.correction_batch,
             LAG(v.value) OVER (PARTITION BY v.fund_id ORDER BY v.date) AS prec
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id AND f.active = 1
       WHERE v.value > 0 AND LOWER(f.pays) = 'nigeria'
    )
    SELECT s.id, s.fund_id, f.nom_fond,
           DATE_FORMAT(s.date, '%Y-%m-%d') AS date,
           s.value, s.prec, s.currency_code, s.correction_batch
      FROM serie s
      JOIN fond_investissements f ON f.id = s.fund_id
     WHERE s.prec > 0
       AND (s.value / s.prec >= ${FACTEUR} OR s.prec / s.value >= ${FACTEUR})
     ORDER BY f.nom_fond, s.date
  `);
  if (!ruptures.length) return { corrections: [], refusees: [], ruptures: 0 };

  const rompues = new Set(ruptures.map(r => `${r.fund_id}|${r.date}`));
  const ids = [...new Set(ruptures.map(r => r.fund_id))];
  const [brut] = await conn.query(
    `SELECT fund_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, value
       FROM valorisations WHERE fund_id IN (?) AND value > 0 ORDER BY fund_id, date`,
    [ids]
  );
  const series = new Map();
  for (const v of brut) {
    if (!series.has(v.fund_id)) series.set(v.fund_id, []);
    series.get(v.fund_id).push({ date: v.date, value: Number(v.value) });
  }

  // Le voisin SAIN le plus proche : toute date elle-meme en rupture est exclue.
  function voisinSain(fundId, date) {
    const serie = series.get(fundId) || [];
    const i = serie.findIndex(x => x.date === date);
    if (i < 0) return null;
    for (let d = 1; d < serie.length; d++) {
      for (const k of [i - d, i + d]) {
        if (k < 0 || k >= serie.length) continue;
        if (rompues.has(`${fundId}|${serie[k].date}`)) continue;
        return serie[k].value;
      }
    }
    return null;
  }

  const corrections = [];
  const refusees = [];
  for (const r of ruptures) {
    const s = naira.get(`${r.fund_id}|${r.date}`);
    if (!s) { refusees.push({ ...r, motif: 'aucun naira publie ou hors fenetre du rejeu' }); continue; }

    const stocke = Number(r.value);
    if (Math.max(s.prix / stocke, stocke / s.prix) - 1 < 0.01) {
      refusees.push({ ...r, naira: s.prix, motif: 'deja conforme a la source' });
      continue;
    }
    const ref = voisinSain(r.fund_id, r.date);
    if (ref === null) { refusees.push({ ...r, naira: s.prix, motif: 'aucun voisin sain pour juger' }); continue; }

    const ecart = Math.max(s.prix / ref, ref / s.prix);
    if (ecart >= FACTEUR) {
      refusees.push({ ...r, naira: s.prix, ecart, motif: 'la valeur source reste aberrante' });
      continue;
    }
    corrections.push({ ...r, naira: s.prix, source_prix: s.source, ref, ecart });
  }
  return { corrections, refusees, ruptures: ruptures.length };
}

async function main() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    if (opts.rollback) { await rollback(conn, opts.rollback); return; }

    if (!fs.existsSync(opts.csv)) {
      console.error(`CSV introuvable : ${opts.csv}`);
      console.error('Lancer d abord le workflow « OPS — rejeu SEC etape 2 ».');
      process.exitCode = 1;
      return;
    }

    const { corrections, refusees, ruptures } = await trouverCorrections(conn, opts.csv);

    console.log('\n=== RETOUR AU NAIRA DEPUIS LA SOURCE SEC ===');
    console.log(`CSV       : ${opts.csv}`);
    console.log(`Mode      : ${opts.execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}`);
    console.log(`Ruptures  : ${ruptures}`);
    console.log(`A corriger: ${corrections.length}`);
    console.log(`Refusees  : ${refusees.length}\n`);

    if (!corrections.length) { console.log('Rien a corriger.\n'); return; }

    console.log(`  ${'fonds'.padStart(5)} ${'date'.padEnd(10)} ${'en base'.padStart(15)} ${'-> naira source'.padStart(15)} ${'voisin sain'.padStart(14)}  nom`);
    console.log(`  ${'-'.repeat(5)} ${'-'.repeat(10)} ${'-'.repeat(15)} ${'-'.repeat(15)} ${'-'.repeat(14)}  ---`);
    for (const c of corrections.slice(0, 60)) {
      console.log(
        `  ${String(c.fund_id).padStart(5)} ${c.date.padEnd(10)} ${n(c.value).padStart(15)}` +
        ` ${n(c.naira).padStart(15)} ${n(c.ref).padStart(14)}  ${String(c.nom_fond).slice(0, 30)}`
      );
    }
    if (corrections.length > 60) console.log(`  ... et ${corrections.length - 60} autre(s)`);

    // Les refus comptent autant que les corrections : ils disent ce qui reste.
    const parMotif = new Map();
    for (const r of refusees) parMotif.set(r.motif, (parMotif.get(r.motif) || 0) + 1);
    if (parMotif.size) {
      console.log('\nRefusees, par motif :');
      for (const [m, k] of [...parMotif.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(k).padStart(5)}  ${m}`);
      }
    }

    if (!opts.execute) {
      console.log('\nDRY-RUN — aucune ecriture. Relancer avec --execute pour appliquer.\n');
      return;
    }

    const [avant] = await conn.query(
      'SELECT * FROM valorisations WHERE id IN (?)',
      [corrections.map(c => c.id)]
    );
    const batch = `NAIRA_SRC_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;
    if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const fichier = path.join(SNAPSHOT_DIR, `${batch}.json`);
    fs.writeFileSync(fichier, JSON.stringify({
      batch,
      generated_at: new Date().toISOString(),
      csv: opts.csv,
      rows: avant,
    }, null, 2));
    console.log(`\nSnapshot ecrit : ${fichier} (${avant.length} lignes completes)`);

    await conn.beginTransaction();
    try {
      let n = 0;
      for (const c of corrections) {
        // La devise est posee explicitement : une valeur naira doit porter son
        // etiquette, sinon le prochain controle ne saura pas la distinguer.
        await conn.execute(
          `UPDATE valorisations
              SET value = ?, currency_code = 'NGN', correction_batch = ?
            WHERE id = ?`,
          [c.naira, batch, c.id]
        );
        n++;
      }
      await conn.commit();
      console.log(`OK — ${n} ligne(s) ramenee(s) au naira publie.`);
    } catch (err) {
      await conn.rollback();
      console.error('ECHEC, transaction annulee :', err.message);
      process.exitCode = 1;
      return;
    }

    console.log('\nA FAIRE ENSUITE — `vl_ajuste`, `value_EUR` et `value_USD` derivent de `value` :');
    console.log('  1. node scripts/recalc/recalc_vl_ajuste.js');
    console.log('  2. node scripts/recalc/recalc_eur_usd_daily_rate.js');
    console.log('  3. recalcul des performances, puis des classements');
    console.log(`\nRollback : node scripts/fix/fix_naira_depuis_source.js --rollback ${fichier}`);
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
