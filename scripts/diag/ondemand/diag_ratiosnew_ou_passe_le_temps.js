/**
 * Les 120 s de `ratiosnew` : SQL ou JavaScript ? Mesure, sans toucher a la route.
 *
 * POURQUOI CETTE METHODE. J ai avance QUATRE explications au 504, et la mesure
 * les a toutes renversees : le volume (un fonds a 20 VL pend autant qu un fonds
 * a 311), l index pose le 29/10 (quatre routes lisant `valorisations` repondent
 * en 0,5 a 3,2 s), le N+1 sur les requetes `tsr` (2,2 ms l appel, il faudrait
 * ~53 800 iterations, et ces requetes sont gardees par `if (year === "1")` donc
 * ne s executent meme pas), et une boucle infinie dans le comblement des trous
 * (la date y avance bien).
 *
 * Quatre hypotheses, quatre refutations. Continuer a lire 1 729 lignes pour en
 * formuler une cinquieme serait repeter la meme faute. Ce script ne suppose donc
 * RIEN sur la cause : il observe.
 *
 * LE PRINCIPE, et il tranche en une seule mesure. On lance la requete HTTP vers
 * l API LOCALE, sans attendre sa reponse, puis on interroge en boucle
 * `information_schema.PROCESSLIST` pendant quelques secondes :
 *
 *   - une requete SQL y apparait, avec un `TIME` qui grimpe → le temps est
 *     passe en BASE, et on connait alors la requete exacte, mot pour mot ;
 *   - la connexion de l API est la mais ne fait rien (`Sleep`), ou aucune
 *     requete longue n apparait → le temps est passe en JAVASCRIPT, dans le
 *     processus Node, et c est le profilage de la route qu il faudra, pas une
 *     optimisation SQL.
 *
 * Ces deux reponses menent a des corrections totalement differentes. C est
 * exactement pourquoi il faut la mesurer avant de corriger quoi que ce soit.
 *
 * CE SCRIPT NE MODIFIE PAS LA ROUTE. Instrumenter `apigestionratios.js`
 * demanderait de toucher 1 729 lignes de calcul financier et de redeployer :
 * tache sensible. L observation externe coute une requete HTTP en lecture et
 * quelques SELECT sur `information_schema`.
 *
 * LECTURE SEULE : un GET sur l API locale, et des SELECT sur
 * `information_schema`. Aucune ecriture, aucune modification de code.
 *
 * USAGE  node scripts/diag/ondemand/diag_ratiosnew_ou_passe_le_temps.js
 */
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};
const PORT = process.env.PORT || 3005;
const CIBLE = '/api/ratiosnew/2026/1141';
// Observation bornee : au-dela, on sait deja que la route pend (504 a 120 s
// mesure cinq fois). Vingt secondes suffisent a voir OU elle pend, et le
// script ne doit pas monopoliser le canal a la demande.
const SECONDES = 20;

const dors = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== ratiosnew : LES 120 SECONDES SONT-ELLES EN SQL OU EN JAVASCRIPT ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 0. Etat avant : ne pas confondre notre requete avec le bruit --
    const [avant] = await conn.query(`
      SELECT ID, TIME, LEFT(COALESCE(INFO, ''), 80) AS q, COMMAND, STATE
        FROM information_schema.PROCESSLIST
       WHERE COMMAND <> 'Sleep' AND ID <> CONNECTION_ID()`);
    console.log(`## 0. AVANT LA REQUETE — ${avant.length} requete(s) active(s)`);
    for (const r of avant) {
      console.log(`  id=${r.ID} time=${r.TIME}s cmd=${r.COMMAND} state=${r.STATE || ''}`);
      if (r.q) console.log(`     ${r.q}`);
    }
    if (!avant.length) console.log('  (aucune — le bruit de fond est nul, la mesure sera lisible)');

    // ---- 1. Lancer la requete SANS attendre sa reponse ---------------
    console.log(`\n## 1. LANCEMENT DE ${CIBLE} sur 127.0.0.1:${PORT}`);
    let fini = null;
    const t0 = Date.now();
    const req = http.get({ host: '127.0.0.1', port: PORT, path: CIBLE, timeout: 150000 }, res => {
      res.resume();
      res.on('end', () => { fini = { code: res.statusCode, s: (Date.now() - t0) / 1000 }; });
    });
    req.on('error', e => { fini = { code: `ERREUR ${e.message}`, s: (Date.now() - t0) / 1000 }; });
    req.on('timeout', () => { req.destroy(new Error('delai local depasse')); });
    console.log('  requete emise, sans attendre la reponse.');

    // ---- 2. Observer la base pendant que la route travaille ----------
    console.log(`\n## 2. CE QUE FAIT MYSQL PENDANT ${SECONDES} SECONDES`);
    console.log(`  ${'t'.padStart(4)}  ${'actives'.padStart(7)}  ${'plus longue'.padStart(11)}  requete`);
    let vuesLongues = 0, maxTime = 0, totalActives = 0, echantillons = 0;
    const requetesVues = new Map();
    for (let t = 1; t <= SECONDES; t++) {
      await dors(1000);
      const [p] = await conn.query(`
        SELECT ID, TIME, LEFT(COALESCE(INFO, ''), 110) AS q, COMMAND, STATE
          FROM information_schema.PROCESSLIST
         WHERE COMMAND <> 'Sleep' AND ID <> CONNECTION_ID()
         ORDER BY TIME DESC`);
      echantillons++; totalActives += p.length;
      const pire = p[0];
      if (pire) {
        maxTime = Math.max(maxTime, Number(pire.TIME));
        if (Number(pire.TIME) >= 2) vuesLongues++;
        const k = (pire.q || '(sans texte)').slice(0, 90);
        requetesVues.set(k, (requetesVues.get(k) || 0) + 1);
      }
      console.log(`  ${String(t).padStart(3)}s  ${String(p.length).padStart(7)}  `
        + `${String(pire ? pire.TIME + 's' : '—').padStart(11)}  ${pire ? (pire.q || '').slice(0, 76) : ''}`);
      if (fini) { console.log(`  (la requete HTTP a repondu : ${fini.code} en ${fini.s}s)`); break; }
    }

    // ---- 3. Le verdict, et il n a que deux formes --------------------
    console.log('\n## 3. VERDICT');
    const moyenne = echantillons ? totalActives / echantillons : 0;
    console.log(`  ${echantillons} echantillon(s) | ${moyenne.toFixed(1)} requete(s) active(s) en moyenne`);
    console.log(`  requete la plus longue observee : ${maxTime}s`);
    console.log(`  echantillons avec une requete de 2 s ou plus : ${vuesLongues}/${echantillons}`);
    if (requetesVues.size) {
      console.log('\n  requetes vues en tete (nombre d echantillons) :');
      for (const [q, n] of [...requetesVues].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
        console.log(`    ${String(n).padStart(3)}x  ${q}`);
      }
    }
    if (vuesLongues >= echantillons / 2 && maxTime >= 5) {
      console.log('\n  → LE TEMPS EST EN BASE. Une requete tient plusieurs secondes pendant');
      console.log('    que la route pend, et son texte est imprime ci-dessus. La correction');
      console.log('    porte sur CETTE requete — index, reecriture, ou sortie de boucle —');
      console.log('    et non sur un profilage du code JavaScript.');
    } else if (moyenne < 0.5) {
      console.log('\n  → LE TEMPS EST EN JAVASCRIPT. MySQL est au repos pendant que la route');
      console.log('    pend : aucune requete longue, presque aucune requete active. Les 120 s');
      console.log('    se passent donc dans le processus Node, et c est un PROFILAGE de la');
      console.log('    route qu il faut — pas une optimisation SQL. Aucune des quatre');
      console.log('    hypotheses SQL que j avais avancees ne pouvait donc tenir.');
    } else {
      console.log('\n  → PROFIL MIXTE : beaucoup de requetes courtes plutot qu une longue.');
      console.log('    C est la signature d un N+1 : le cout n est pas dans une requete mais');
      console.log('    dans leur NOMBRE. Compter les requetes par requete HTTP devient alors');
      console.log('    la mesure suivante.');
    }
    if (fini) console.log(`\n  reponse HTTP : ${fini.code} apres ${fini.s}s`);
    else console.log(`\n  la requete pendait toujours apres ${SECONDES}s d observation.`);
    req.destroy();
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
