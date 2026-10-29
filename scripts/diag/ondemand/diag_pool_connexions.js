/**
 * Le pool de connexions MySQL est-il epuise ? L hypothese que j avais rendue
 * invisible.
 *
 * POURQUOI ELLE N A PAS ENCORE ETE TESTEE, et c est ma faute. Pour savoir ou
 * passaient les 120 s de `ratiosnew`, j ai interroge
 * `information_schema.PROCESSLIST` en filtrant `COMMAND <> 'Sleep'`, et conclu
 * « 0 requete active, donc la base est au repos ».
 *
 * Ce filtre ecarte precisement les connexions DETENUES MAIS INACTIVES. Or
 * « base au repos » et « pool epuise » rendent exactement le meme resultat sous
 * ce filtre — zero requete active dans les deux cas — et appellent des
 * corrections opposees. J ai donc rendu invisible l hypothese la plus plausible
 * en mesurant.
 *
 * ELLE EXPLIQUERAIT TOUT CE QUI EST MESURE :
 *   - 82,5 % `(idle)` au profil CPU : le processus attend une connexion, il ne
 *     calcule pas ;
 *   - 0 requete active : les connexions detenues sont en `Sleep`, pas en train
 *     d executer ;
 *   - tous les fonds touches, quel que soit leur volume : l attente ne depend
 *     pas des donnees ;
 *   - 504 a exactement 120 s : un delai, pas un calcul qui finit par aboutir ;
 *   - les autres routes repondent : elles prennent et relachent vite, tandis
 *     qu une route qui FUIT ses connexions les retient.
 *
 * CE QUE CE SCRIPT MESURE, et dans l ordre qui tranche :
 *   1. TOUTES les connexions, `Sleep` comprises, par utilisateur et par etat ;
 *   2. la configuration : `max_connections` du serveur, et la taille du pool
 *      declaree cote application ;
 *   3. les connexions dormant depuis longtemps — une connexion en `Sleep`
 *      depuis des heures est detenue par du code qui ne l a jamais relachee ;
 *   4. le compteur `Threads_connected` face a `max_connections`.
 *
 * Si le nombre de connexions de l application atteint la taille de son pool,
 * l hypothese est confirmee et la correction porte sur les connexions non
 * relachees — pas sur les 1 729 lignes de calcul.
 *
 * LECTURE SEULE : SELECT, SHOW et information_schema. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_pool_connexions.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};
const RACINE = path.resolve(__dirname, '../../../');

(async () => {
  console.log('=== LE POOL DE CONNEXIONS MYSQL EST-IL EPUISE ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE`);
  console.log('Cette mesure compte les connexions `Sleep`, que ma mesure precedente');
  console.log('ecartait — et c est tout l enjeu.\n');

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. TOUTES les connexions, Sleep comprises -------------------
    console.log('## 1. TOUTES LES CONNEXIONS, PAR UTILISATEUR ET PAR ETAT');
    const [tout] = await conn.query(`
      SELECT USER, COMMAND, COUNT(*) AS n, MAX(TIME) AS plus_vieille
        FROM information_schema.PROCESSLIST
       GROUP BY USER, COMMAND ORDER BY n DESC`);
    console.log(`  ${'utilisateur'.padEnd(18)}${'etat'.padEnd(12)}${'nombre'.padStart(7)}${'plus vieille'.padStart(14)}`);
    let totalApp = 0, total = 0;
    for (const r of tout) {
      total += Number(r.n);
      if (String(r.USER) === DB.user) totalApp += Number(r.n);
      console.log(`  ${String(r.USER).slice(0, 17).padEnd(18)}${String(r.COMMAND).padEnd(12)}`
        + `${String(r.n).padStart(7)}${(r.plus_vieille + ' s').padStart(14)}`);
    }
    console.log(`\n  total : ${total} connexion(s) | dont ${totalApp} pour \`${DB.user}\``);

    // ---- 2. La configuration : serveur et application ----------------
    console.log('\n## 2. LES LIMITES');
    const [[mx]] = await conn.query("SHOW VARIABLES LIKE 'max_connections'");
    const [[tc]] = await conn.query("SHOW STATUS LIKE 'Threads_connected'");
    const [[tr]] = await conn.query("SHOW STATUS LIKE 'Threads_running'");
    const [[mu]] = await conn.query("SHOW STATUS LIKE 'Max_used_connections'");
    console.log(`  max_connections (serveur)  : ${mx.Value}`);
    console.log(`  Threads_connected          : ${tc.Value}`);
    console.log(`  Threads_running            : ${tr.Value}`);
    console.log(`  Max_used_connections       : ${mu.Value}  (pic depuis le demarrage)`);

    // La taille du pool est declaree cote application : la lire plutot que la
    // supposer, car c est elle qui borne l attente, pas `max_connections`.
    let poolDeclare = null;
    try {
      const src = fs.readFileSync(path.join(RACINE, 'src/db/sequelize.js'), 'utf8');
      const m = src.match(/pool\s*:\s*\{[^}]*\}/s);
      if (m) {
        console.log('\n  pool declare dans `src/db/sequelize.js` :');
        for (const l of m[0].split('\n')) if (l.trim()) console.log(`    ${l.trim()}`);
        const mm = m[0].match(/max\s*:\s*(\d+)/);
        if (mm) poolDeclare = Number(mm[1]);
      } else {
        console.log('\n  AUCUN bloc `pool` declare dans `src/db/sequelize.js`.');
        console.log('  Sequelize applique alors son defaut : max 5 connexions, acquire 60 000 ms.');
        console.log('  → CINQ connexions pour toute l API, et une attente de 60 s quand elles');
        console.log('    sont prises. Deux routes lentes en parallele suffisent a bloquer la');
        console.log('    suivante — et 60 s d attente, redoublees, depassent les 120 s du');
        console.log('    delai de passerelle.');
        poolDeclare = 5;
      }
    } catch (e) { console.log(`\n  lecture de sequelize.js impossible : ${e.message.slice(0, 50)}`); }

    if (poolDeclare != null) {
      console.log(`\n  connexions de l application : ${totalApp} / pool max ${poolDeclare}`);
      const part = poolDeclare ? (totalApp / poolDeclare * 100) : 0;
      console.log(part >= 100
        ? '  → POOL SATURE. Toute nouvelle requete attend qu une connexion se libere.\n'
          + '    C est l explication la plus directe des 82,5 % d inactivite et du 504.'
        : part >= 60
          ? `  → pool a ${part.toFixed(0)} % AU REPOS. Sous charge il saturerait ; la marge est mince.`
          : `  → pool a ${part.toFixed(0)} % : il n est PAS sature a cet instant. L hypothese n est\n`
            + '    pas confirmee en l etat — mais elle reste a tester PENDANT une requete\n'
            + '    `ratiosnew`, car c est peut-etre elle qui le sature.');
    }

    // ---- 3. Les connexions qui dorment depuis longtemps --------------
    console.log('\n## 3. CONNEXIONS DORMANT DEPUIS LONGTEMPS');
    console.log('  Une connexion en `Sleep` depuis des heures est detenue par du code qui');
    console.log('  ne l a jamais relachee. C est la signature d une fuite.');
    const [vieilles] = await conn.query(`
      SELECT ID, USER, TIME, STATE, LEFT(COALESCE(INFO, ''), 60) AS q
        FROM information_schema.PROCESSLIST
       WHERE TIME > 300 ORDER BY TIME DESC LIMIT 12`);
    if (!vieilles.length) {
      console.log('  aucune connexion de plus de 5 minutes : pas de fuite visible a cet instant.');
    } else {
      console.log(`  ${'id'.padStart(8)}${'utilisateur'.padEnd(16)}${'age'.padStart(10)}  etat`);
      for (const r of vieilles) {
        console.log(`  ${String(r.ID).padStart(8)}${String(r.USER).slice(0, 15).padEnd(16)}`
          + `${(Math.round(Number(r.TIME) / 60) + ' min').padStart(10)}  ${r.STATE || 'Sleep'}`);
      }
    }

    console.log('\n## CE QUE CELA IMPLIQUE');
    console.log('  Si le pool est sature ou proche de l etre, la correction porte sur les');
    console.log('  connexions NON RELACHEES, et non sur les 1 729 lignes de calcul : le');
    console.log('  profil a montre que le temps ne s y passe pas a calculer.');
    console.log('  Si le pool est large a cet instant, il faut refaire CETTE mesure PENDANT');
    console.log('  une requete `ratiosnew` — un pool se sature pendant la requete, pas');
    console.log('  avant.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
