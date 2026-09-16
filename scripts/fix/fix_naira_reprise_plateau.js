/**
 * Restaure les 3 VL que le correctif naira du 2026-08-31 a ecrasees a tort.
 *
 * CE QUI S EST PASSE
 * ------------------
 * `fix_naira_depuis_source.js --execute` a ecrit 75 lignes. Trois d entre elles
 * ont remplace une BONNE valeur par une mauvaise :
 *
 *   fonds 1141 AFRINVEST DOLLAR FUND      2022-04-01 : 39 441,4650 -> 92,1946
 *   fonds 1168 NIGERIA DOLLAR INCOME FUND 2022-04-01 :    427,1666 ->  1,0259
 *   fonds 2779 HOUSING SOLUTION FUND      2025-04-11 :    111,0368 ->  1,1100
 *
 * POURQUOI. Le correctif comparait chaque ligne a UN voisin sain. Quand
 * l aberration dure deux releves consecutifs, les deux points bas ne different
 * pas entre eux d un facteur 10 : aucune rupture n est signalee entre eux, elle
 * ne l est que sur la ligne SAINE qui suit le plateau. Et de ce cote, le seul
 * voisin « sain » disponible est l autre moitie du plateau. Le plateau se
 * validait donc lui-meme, et la ligne saine passait pour la coupable.
 *
 * La cause est corrigee dans `fix_naira_depuis_source.js` : la reference est
 * desormais la MEDIANE des voisins non rompus (voir `referenceSaine`). Ce
 * script-ci repare les donnees deja ecrites — les deux sont necessaires,
 * corriger le code ne defait pas ce qui est en base.
 *
 * POURQUOI UN SCRIPT DEDIE plutot que `--rollback --ids` : la liste blanche du
 * pont MCP n autorise pas ces arguments, et c est une bonne chose — un rollback
 * arbitraire pilotable a distance serait une porte ouverte. Un script nomme,
 * relu, sans argument, qui ne peut toucher QUE ces trois lignes, est plus sur
 * qu un argument libre.
 *
 * SECURITE
 *   - les valeurs restaurees viennent du SNAPSHOT, pas de ce fichier : rien
 *     n est saisi a la main, donc rien n est invente ;
 *   - chaque ligne n est restauree que si elle porte encore la valeur fautive.
 *     Si elle a change entre-temps, le script s abstient et le dit ;
 *   - idempotent : relance, il ne trouve plus rien a faire ;
 *   - transaction unique ;
 *   - dry-run par defaut, `--execute` pour appliquer.
 *
 * USAGE
 *   node scripts/fix/fix_naira_reprise_plateau.js            # dry-run
 *   node scripts/fix/fix_naira_reprise_plateau.js --execute
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

const SNAPSHOT = path.resolve(__dirname, '../../data/naira_snapshots/NAIRA_SRC_20260831182550.json');

// Les lignes a reprendre, et la valeur fautive qu elles doivent encore porter.
// La valeur RESTAUREE n est pas listee ici : elle est lue dans le snapshot.
const REPRISES = [
  { id: 3719730, fund_id: 1141, date: '2022-04-01', fautive: 92.1946 },
  { id: 3720578, fund_id: 1168, date: '2022-04-01', fautive: 1.0259 },
  { id: 3721914, fund_id: 2779, date: '2025-04-11', fautive: 1.1100 },
];

const execute = process.argv.includes('--execute');
const proche = (a, b) => Math.abs(Number(a) - Number(b)) < 0.001;

(async () => {
  if (!fs.existsSync(SNAPSHOT)) {
    console.error(`\nSnapshot introuvable : ${SNAPSHOT}`);
    console.error('Sans lui, restaurer reviendrait a inventer les valeurs d origine.\n');
    process.exitCode = 1;
    return;
  }
  const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const parId = new Map(snap.rows.map(r => [Number(r.id), r]));

  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    console.log('\n=== REPRISE DES 3 VL ECRASEES PAR LE PLATEAU ABERRANT ===');
    console.log(`Snapshot : ${SNAPSHOT}`);
    console.log(`Mode     : ${execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}\n`);

    const aFaire = [];
    for (const r of REPRISES) {
      const origine = parId.get(r.id);
      if (!origine) {
        console.log(`  id ${r.id} — ABSENT du snapshot, ignore (aucune valeur d origine connue)`);
        continue;
      }
      const [[courant]] = await conn.query(
        `SELECT id, fund_id, DATE_FORMAT(date,'%Y-%m-%d') AS date, value, correction_batch
           FROM valorisations WHERE id = ?`, [r.id]
      );
      if (!courant) {
        console.log(`  id ${r.id} — INTROUVABLE en base, ignore`);
        continue;
      }
      if (!proche(courant.value, r.fautive)) {
        // La ligne a change depuis la mesure : ne rien ecrire par-dessus.
        console.log(`  id ${r.id} — valeur courante ${Number(courant.value).toFixed(4)},`
          + ` attendue ${r.fautive} : ABSTENTION (la ligne a change depuis)`);
        continue;
      }
      console.log(`  id ${r.id} — fonds ${courant.fund_id} au ${courant.date} :`
        + ` ${Number(courant.value).toFixed(4)} -> ${Number(origine.value).toFixed(4)}`);
      aFaire.push({ courant, origine });
    }

    if (!aFaire.length) {
      console.log('\nRien a reprendre — deja fait, ou les lignes ont change.\n');
      return;
    }
    if (!execute) {
      console.log(`\nDRY-RUN — ${aFaire.length} ligne(s) seraient restauree(s). Relancer avec --execute.\n`);
      return;
    }

    await conn.beginTransaction();
    try {
      for (const { origine } of aFaire) {
        await conn.execute(
          `UPDATE valorisations
              SET value = ?, currency_code = ?, correction_batch = ?
            WHERE id = ?`,
          [origine.value, origine.currency_code, origine.correction_batch, origine.id]
        );
      }
      await conn.commit();
      console.log(`\nOK — ${aFaire.length} ligne(s) restauree(s) a leur valeur d origine.`);
      console.log('`vl_ajuste` et les conversions EUR/USD de ces lignes sont a recalculer.\n');
    } catch (err) {
      await conn.rollback();
      console.error('ECHEC, transaction annulee :', err.message);
      process.exitCode = 1;
    }
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
