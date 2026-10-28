/**
 * Supprimer les VL en doublon qui portent zero, et rendre l index UNIQUE creable.
 *
 * CE QUE LA MESURE DIT, et pourquoi ce script est etroit.
 *
 * `P2-03` du backlog affirmait « rien n empeche les doublons de VL » sans
 * jamais les compter. Mon premier comptage a rendu « 1 909 paires, 16 144
 * lignes, arbitrage financier necessaire » — FAUX : mon `GROUP BY fund_id, date`
 * regroupait toutes les lignes a `fund_id = NULL` tombant a la meme date.
 * Mesure du 2026-10-28 05:26 UTC, le NULL exclu :
 *
 *   19 paires (fonds, date) dupliquees, 19 lignes en trop.
 *   Et les 19 presentent la MEME forme : une ligne a `0` en regard d une
 *   valeur reelle. Exemples : fonds 1552 le 2024-10-01 → 3175143:0 contre
 *   3243394:827269.72 ; fonds 2597 le 2022-07-14 → 3183723:0 contre
 *   3196676:1791.27.
 *
 * Une VL de zero n est pas une valorisation. Il n y a donc AUCUN arbitrage
 * financier a rendre : on garde la valeur, on supprime le zero. C est ce qui
 * fait passer ce chantier de « 1 909 cas a trancher » a « 19 suppressions
 * mecaniques ».
 *
 * AUCUNE DE CES PAIRES N EST RECENTE : zero sur les 400 derniers jours. Les
 * doublons sont un heritage inerte, pas une fuite active — l index UNIQUE
 * empechera les futurs, il ne repare pas un robinet ouvert.
 *
 * CE QUE CE SCRIPT REFUSE DE FAIRE. Il ne touche QUE les paires dont
 * exactement une ligne porte une valeur > 0 et toutes les autres portent 0 ou
 * NULL. Toute autre forme — deux valeurs non nulles differentes, ou plusieurs
 * valeurs non nulles — est IMPRIMEE et LAISSEE EN PLACE : la trancher serait
 * decider quelle VL est juste, et cela ne se fait pas dans un script de
 * nettoyage. Si une telle paire apparait, le script sort en echec meme en
 * execution : mieux vaut un nettoyage interrompu qu une valeur financiere
 * choisie au hasard.
 *
 * Il ne touche pas non plus aux 18 087 lignes a `fund_id = NULL` ni aux 21 698
 * pointant vers un fonds inexistant. Celles-la sont un autre chantier, et MySQL
 * autorisant plusieurs NULL dans un index UNIQUE, elles ne bloquent pas la
 * migration.
 *
 * ROLLBACK. Chaque ligne est photographiee en entier avant suppression, dans
 * `data/doublons_snapshots/<horodatage>.json`. Le retour arriere les reinsere
 * telles quelles, id compris :
 *
 *   node scripts/fix/fix_doublons_vl.js --rollback data/doublons_snapshots/<f>.json
 *
 * USAGE
 *   node scripts/fix/fix_doublons_vl.js                 # dry-run, rien n est ecrit
 *   node scripts/fix/fix_doublons_vl.js --execute       # supprime, apres instantane
 *   node scripts/fix/fix_doublons_vl.js --rollback <f>  # reinsere l instantane
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};
const BASE = process.env.DB_NAME || 'fund_opcvm';
const DOSSIER = path.resolve(__dirname, '../../data/doublons_snapshots');

const args = process.argv.slice(2);
const opts = {
  execute: args.includes('--execute'),
  rollback: args.includes('--rollback') ? args[args.indexOf('--rollback') + 1] : null,
};

async function rollback(conn, fichier) {
  if (!fs.existsSync(fichier)) { console.error(`Instantane introuvable : ${fichier}`); process.exit(1); }
  const lignes = JSON.parse(fs.readFileSync(fichier, 'utf8'));
  console.log(`=== ROLLBACK depuis ${fichier} — ${lignes.length} ligne(s) ===`);
  let remis = 0, deja = 0;
  for (const l of lignes) {
    const [[p]] = await conn.query('SELECT COUNT(*) AS n FROM valorisations WHERE id = ?', [l.id]);
    if (Number(p.n) > 0) { deja++; continue; }
    const cols = Object.keys(l);
    await conn.query(
      `INSERT INTO valorisations (${cols.map(c => `\`${c}\``).join(', ')})
       VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map(c => l[c]));
    remis++;
  }
  console.log(`  ${remis} ligne(s) reinseree(s) | ${deja} deja presente(s)`);
}

(async () => {
  const conn = await mysql.createConnection(DB);
  try {
    if (opts.rollback) return await rollback(conn, opts.rollback);

    console.log('=== DOUBLONS DE VL PORTANT ZERO ===');
    console.log(`Mode : ${opts.execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}`);
    console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC\n`);

    // Les paires dupliquees, NULL exclu — le NULL regroupe des lignes sans
    // aucun rapport et n est pas un doublon.
    const [paires] = await conn.query(`
      SELECT fund_id, DATE_FORMAT(date, '%Y-%m-%d') AS d, COUNT(*) AS n
        FROM valorisations WHERE fund_id IS NOT NULL
       GROUP BY fund_id, date HAVING COUNT(*) > 1
       ORDER BY fund_id, date`);
    console.log(`${paires.length} paire(s) dupliquee(s), fonds reels uniquement.`);
    if (!paires.length) { console.log('Rien a faire.\n'); return; }

    const aSupprimer = [];
    const aArbitrer = [];
    for (const p of paires) {
      const [lignes] = await conn.query(
        'SELECT * FROM valorisations WHERE fund_id = ? AND date = ? ORDER BY id',
        [p.fund_id, p.d]);
      const nonNulles = lignes.filter(l => l.value !== null && Number(l.value) !== 0);
      const nulles = lignes.filter(l => l.value === null || Number(l.value) === 0);
      if (nonNulles.length === 1 && nulles.length === lignes.length - 1) {
        aSupprimer.push(...nulles.map(l => ({ ...l, _garde: nonNulles[0].id, _valeur: nonNulles[0].value })));
      } else {
        aArbitrer.push({ p, lignes });
      }
    }

    console.log(`\n--- A SUPPRIMER : ${aSupprimer.length} ligne(s) a zero ---`);
    console.log(`  ${'id'.padStart(9)} ${'fonds'.padStart(6)} ${'date'.padEnd(12)}`
      + `${'garde l id'.padStart(11)}${'valeur gardee'.padStart(16)}`);
    for (const l of aSupprimer.slice(0, 30)) {
      console.log(`  ${String(l.id).padStart(9)} ${String(l.fund_id).padStart(6)} `
        + `${String(l.date).slice(0, 10).padEnd(12)}${String(l._garde).padStart(11)}`
        + `${String(l._valeur).padStart(16)}`);
    }
    if (aSupprimer.length > 30) console.log(`  ... et ${aSupprimer.length - 30} autre(s)`);

    if (aArbitrer.length) {
      console.log(`\n--- A ARBITRER, LAISSEES EN PLACE : ${aArbitrer.length} paire(s) ---`);
      console.log('  Plusieurs valeurs non nulles pour un meme fonds a une meme date.');
      console.log('  Trancher serait decider quelle VL est juste : cela ne se fait pas');
      console.log('  dans un script de nettoyage.');
      for (const a of aArbitrer.slice(0, 10)) {
        console.log(`  fonds ${a.p.fund_id} le ${a.p.d} : `
          + a.lignes.map(l => `${l.id}:${l.value}`).join('  '));
      }
    }

    // L index UNIQUE serait-il creable apres ce nettoyage ?
    console.log('\n--- APRES CE NETTOYAGE, L INDEX UNIQUE SERAIT-IL CREABLE ? ---');
    const [idx] = await conn.query(`
      SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'valorisations'
       GROUP BY INDEX_NAME, NON_UNIQUE`, [BASE]);
    const deja = idx.find(i => Number(i.NON_UNIQUE) === 0 && String(i.cols) === 'fund_id,date');
    console.log(deja
      ? `  l index UNIQUE existe deja (${deja.INDEX_NAME}) : rien a creer.`
      : aArbitrer.length
        ? `  NON : ${aArbitrer.length} paire(s) resteraient en double. La creation\n`
          + '  echouerait. Les arbitrer d abord.'
        : '  OUI : plus aucune paire en double entre fonds reels.\n'
          + '  MySQL autorisant plusieurs NULL dans un index UNIQUE, les 18 087 lignes\n'
          + '  a `fund_id = NULL` ne le bloquent pas.\n'
          + '  Migration : ALTER TABLE valorisations\n'
          + '    ADD UNIQUE INDEX uq_valorisations_fund_date (fund_id, date);\n'
          + '  Retour arriere : DROP INDEX uq_valorisations_fund_date ON valorisations;');

    if (!opts.execute) {
      console.log('\nDRY-RUN — aucune ecriture. Relancer avec --execute pour appliquer.\n');
      return;
    }
    if (aArbitrer.length) {
      console.error('\nREFUS D EXECUTER : des paires exigent un arbitrage (voir ci-dessus).');
      console.error('Mieux vaut un nettoyage interrompu qu une valeur financiere choisie');
      console.error('au hasard. Les arbitrer, puis relancer.');
      process.exit(1);
    }
    if (!aSupprimer.length) { console.log('\nRien a supprimer.\n'); return; }

    fs.mkdirSync(DOSSIER, { recursive: true });
    const horo = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fichier = path.join(DOSSIER, `${horo}.json`);
    const photo = aSupprimer.map(({ _garde, _valeur, ...l }) => l);
    fs.writeFileSync(fichier, JSON.stringify(photo, null, 2));
    console.log(`\nInstantane ecrit : ${fichier} (${photo.length} ligne(s))`);

    const ids = aSupprimer.map(l => l.id);
    const [r] = await conn.query('DELETE FROM valorisations WHERE id IN (?)', [ids]);
    console.log(`${r.affectedRows} ligne(s) supprimee(s).`);
    console.log(`Retour arriere : node scripts/fix/fix_doublons_vl.js --rollback ${fichier}`);
  } finally {
    await conn.end();
  }
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
