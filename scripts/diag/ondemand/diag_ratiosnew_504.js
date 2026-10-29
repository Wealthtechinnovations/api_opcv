/**
 * `ratiosnew` rend 504 apres 120 s sur tous les fonds : ou passent ces 120 s ?
 *
 * CE QUI EST DEJA ETABLI (2026-10-29), et qu il ne faut pas re-instruire :
 *
 *   - trois fonds testes, dont un a tres peu de VL : 504 a 120 s CHACUN. Ce
 *     n est donc ni le volume de donnees, ni un fonds particulier ;
 *   - `valLiq`, `valLiqdev`, `classementquartilemysql` et `performancesdev`
 *     repondent en 0,5 a 3,2 s. Les lectures de `valorisations` sont saines,
 *     et l index `uq_valorisations_fund_date` pose le 29/10 n est PAS en cause ;
 *   - `ratiosnewithdate` rend 400 en 0,7 s : le fichier se charge, le routeur
 *     fonctionne ;
 *   - `apigestionratios.js` n a pas bouge depuis le 2026-06-20. Le defaut a
 *     donc au moins quatre mois, et il precede tout le travail de cette
 *     session.
 *
 * CONSEQUENCE, et elle est lourde : les ratios de risque — Sharpe, Sortino,
 * Calmar, VAR, tracking error, volatilite — ne s affichent sur AUCUNE fiche
 * fonds, et personne ne l avait mesure.
 *
 * FORME DE LA ROUTE : 1 729 lignes, 85 boucles, et des `await` de requete A
 * L INTERIEUR des boucles — `tsr.max('date', { where: { pays } })` et
 * `tsr.findOne(…)` repetes. N+1 classique.
 *
 * L HYPOTHESE QUE CE SCRIPT TESTE, et pourquoi elle est la plus probable.
 * `tsr.max('date', { where: { pays: paysFond } })` appelee en boucle : si la
 * table `tsr` n a pas d index sur `pays`, chaque appel est un balayage complet.
 * Quelques centaines d iterations suffisent alors a depasser 120 s, meme pour un
 * fonds a vingt VL — ce qui expliquerait precisement l observation qui a mis mon
 * hypothese du volume par terre.
 *
 * Et le comblement des trous l aggrave : la route etend les VL en jours
 * CALENDAIRES avant de boucler, donc quelques releves etales sur des mois
 * deviennent des centaines d iterations.
 *
 * CE SCRIPT NE CORRIGE RIEN. Une route de calcul financier de 1 729 lignes est
 * une tache sensible : diagnostic d abord, et sa refonte merite sa propre
 * decision. Il mesure, il chiffre, il propose — il ne touche pas.
 *
 * LECTURE SEULE : SELECT, EXPLAIN et information_schema. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_ratiosnew_504.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};
const BASE = process.env.DB_NAME || 'fund_opcvm';
// 1141 : ~1 467 VL. 2743 : une vingtaine. Les deux rendent 504 — c est ce
// contraste qui disqualifie l explication par le volume.
const FONDS = [1141, 2743];

/**
 * Resoudre le NOM REEL de la table, jamais le deduire du nom du modele.
 *
 * QUATRIEME SUPPOSITION DE SCHEMA DE CE CYCLE, et la plus instructive. Ce
 * script est mort sur `Table 'fund_opcvm.tsr' doesn't exist` parce que j avais
 * pris `tsr` pour un nom de table. Ce n en est pas un : dans
 * `src/db/sequelize.js`, `tsr` est un ALIAS (`const tsr = taux`) vers le modele
 * `src/models/tsr.js`, qui fait `sequelize.define('taux_sans_risques', …)`.
 *
 * Les trois precedentes etaient `datejour` (la colonne s appelle `date`),
 * `indice` (c est `indice_name`) et une comparaison sur cle primaire au lieu de
 * cle etrangere. A chaque fois le meme mecanisme : j ai lu le vocabulaire du
 * code applicatif et je l ai pris pour le vocabulaire de la base. Les deux ne
 * coincident pas, et rien n oblige qu ils coincident.
 *
 * Le nom retenu est IMPRIME a cote des chiffres : un resultat dont on ignore la
 * table source n est pas verifiable.
 */
const resoudreTable = async (conn, candidats, motif) => {
  const [tt] = await conn.query(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [BASE]);
  const noms = tt.map(r => r.TABLE_NAME);
  for (const c of candidats) if (noms.includes(c)) return c;
  return noms.find(n => motif.test(n)) || null;
};

const chrono = async (etiquette, fn) => {
  const t0 = process.hrtime.bigint();
  const r = await fn();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { etiquette, ms, r };
};

(async () => {
  console.log('=== ratiosnew : OU PASSENT LES 120 SECONDES ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. La table du taux sans risque, suspecte principale --------
    const TSR = await resoudreTable(conn,
      ['taux_sans_risques', 'taux_sans_risque', 'tsr'], /taux.*risqu|^tsr$/i);
    console.log(`## 1. LA TABLE DU TAUX SANS RISQUE — \`${TSR || 'INTROUVABLE'}\``);
    console.log('  (nom lu dans `information_schema`, pas deduit du nom du modele :');
    console.log('   `tsr` est un alias de code vers `taux_sans_risques`.)');
    if (!TSR) {
      console.log('  → table introuvable. La question n est PAS mesurable ici : ne rien');
      console.log('    conclure, et verifier d abord a quoi le modele `tsr` est rattache.');
      process.exitCode = 2;
      return;
    }
    const [[t]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${TSR}\``);
    const [idx] = await conn.query(`
      SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       GROUP BY INDEX_NAME, NON_UNIQUE`, [BASE, TSR]);
    console.log(`  ${t.n} ligne(s) | ${idx.length} index :`);
    for (const i of idx) {
      console.log(`    ${String(i.INDEX_NAME).padEnd(26)} (${i.cols})`
        + `${Number(i.NON_UNIQUE) === 0 ? '  UNIQUE' : ''}`);
    }
    const surPays = idx.some(i => String(i.cols).split(',')[0] === 'pays');
    console.log(surPays
      ? '  → un index commence par `pays` : la requete en boucle peut s y appuyer.'
      : '  → AUCUN index ne commence par `pays`. Chaque `tsr.max(date, {where:{pays}})`\n'
        + '    est donc un BALAYAGE COMPLET de la table. Repete en boucle, c est le\n'
        + '    candidat le plus serieux pour les 120 s.');

    // ---- 1bis. LES RATIOS REPOSENT-ILS SUR UN TAUX REEL ? ------------
    // Question plus grave que la lenteur, et decouverte en l instruisant.
    // `taux_sans_risques` est VIDE. La route interroge d abord `tsrhistos`,
    // puis retombe sur `TSR_DEFAULTS` — des taux ECRITS EN DUR dans le code :
    // MAROC 2,75 %, NIGERIA 27,5 %, TUNISIE 8 %, UEMOA 3,5 %, CEMAC 5 %,
    // utilises SEPT fois comme repli. Si `tsrhistos` est vide aussi, alors tout
    // Sharpe, Sortino et Calmar affiche repose sur une CONSTANTE, et non sur un
    // taux observe — ce que la regle du projet interdit explicitement :
    // « ne jamais inventer un taux ». Un repli documente est defendable ; un
    // repli SILENCIEUX ne l est pas.
    console.log('\n## 1bis. LES RATIOS REPOSENT-ILS SUR UN TAUX REEL ?');
    const HIST = await resoudreTable(conn, ['tsrhistos', 'tsrhisto'], /tsrhist/i);
    console.log(`  table historique : \`${HIST || 'INTROUVABLE'}\``);
    if (!HIST) {
      console.log('  → introuvable : le repli en dur est alors la SEULE source possible.');
    } else {
      const [[h]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${HIST}\``);
      console.log(`  ${h.n} ligne(s)`);
      if (Number(h.n) === 0) {
        console.log('  → VIDE ELLE AUSSI. Les deux sources de taux sans risque sont vides :');
        console.log('    tout Sharpe, Sortino et Calmar affiche repose donc sur les');
        console.log('    constantes de `TSR_DEFAULTS`, pas sur un taux observe.');
      } else {
        try {
          const [parPays] = await conn.query(`
            SELECT pays, COUNT(*) AS n, DATE_FORMAT(MAX(date), '%Y-%m-%d') AS derniere,
                   DATEDIFF(CURDATE(), MAX(date)) AS age
              FROM \`${HIST}\` GROUP BY pays ORDER BY n DESC`);
          console.log(`  ${'pays'.padEnd(12)}${'lignes'.padStart(8)}${'derniere'.padStart(12)}${'age'.padStart(8)}`);
          for (const r of parPays) {
            console.log(`  ${String(r.pays || '(vide)').slice(0, 11).padEnd(12)}${String(r.n).padStart(8)}`
              + `${String(r.derniere || '—').padStart(12)}${String(r.age == null ? '—' : r.age + ' j').padStart(8)}`);
          }
          const perimes = parPays.filter(r => Number(r.age) > 400);
          console.log(perimes.length
            ? `  → ${perimes.length} pays dont le taux a plus de 400 jours : pour ceux-la le\n`
              + '    repli en dur s applique en pratique, meme si la table n est pas vide.'
            : '  → les taux sont alimentes : le repli en dur ne devrait pas s appliquer.');
        } catch (e) { console.log(`  decoupage par pays impossible : ${e.message.slice(0, 60)}`); }
      }
    }

    // ---- 2. Le cout reel d UN appel, puis extrapolation --------------
    console.log('\n## 2. LE COUT D UN SEUL APPEL, MESURE');
    const [[pays1]] = await conn.query(
      'SELECT pays FROM fond_investissements WHERE id = ? ', [FONDS[0]]);
    const p = pays1 ? pays1.pays : 'NIGERIA';
    const m1 = await chrono('tsr.max(date) par pays', () =>
      conn.query(`SELECT MAX(date) AS d FROM \`${TSR}\` WHERE pays = ?`, [p]));
    const m2 = await chrono('tsr.findOne par pays+date', () =>
      conn.query(`SELECT * FROM \`${TSR}\` WHERE pays = ? ORDER BY date DESC LIMIT 1`, [p]));
    console.log(`  pays du fonds ${FONDS[0]} : ${p}`);
    console.log(`  ${m1.etiquette.padEnd(28)} ${m1.ms.toFixed(1).padStart(8)} ms`);
    console.log(`  ${m2.etiquette.padEnd(28)} ${m2.ms.toFixed(1).padStart(8)} ms`);
    const parIter = m1.ms + m2.ms;
    console.log(`  cout cumule par iteration : ~${parIter.toFixed(1)} ms`);
    if (parIter > 0) {
      const pour120s = Math.round(120000 / parIter);
      console.log(`  → il suffit de ~${pour120s} iteration(s) pour depasser 120 s.`);
    }

    // ---- 3. Combien d iterations la route produit-elle vraiment ? ----
    console.log('\n## 3. COMBIEN D ITERATIONS, APRES COMBLEMENT DES TROUS ?');
    console.log('  La route etend les VL en jours CALENDAIRES avant de boucler :');
    console.log('  c est ce comblement qui transforme quelques releves en centaines');
    console.log('  d iterations, et qui explique qu un fonds a vingt VL pende autant.');
    console.log(`\n  ${'fonds'.padStart(6)}${'VL'.padStart(7)}${'premiere'.padStart(12)}`
      + `${'derniere'.padStart(12)}${'jours couverts'.padStart(16)}`);
    for (const f of FONDS) {
      const [[v]] = await conn.query(`
        SELECT COUNT(*) AS n, DATE_FORMAT(MIN(date), '%Y-%m-%d') AS d1,
               DATE_FORMAT(MAX(date), '%Y-%m-%d') AS d2,
               DATEDIFF(MAX(date), MIN(date)) AS jours
          FROM valorisations WHERE fund_id = ? AND value > 0`, [f]);
      console.log(`  ${String(f).padStart(6)}${String(v.n).padStart(7)}`
        + `${String(v.d1 || '—').padStart(12)}${String(v.d2 || '—').padStart(12)}`
        + `${String(v.jours == null ? '—' : v.jours).padStart(16)}`);
    }
    console.log('\n  Les « jours couverts » sont l ordre de grandeur du nombre d iterations');
    console.log('  apres comblement. Multiplier par le cout par iteration de la section 2 :');
    console.log('  si le produit depasse 120 000 ms, le 504 est entierement explique.');

    // ---- 4. Le plan d execution, pour ne rien supposer ---------------
    console.log('\n## 4. PLAN D EXECUTION DE LA REQUETE EN BOUCLE');
    try {
      const [plan] = await conn.query(
        `EXPLAIN SELECT MAX(date) AS d FROM \`${TSR}\` WHERE pays = ?`, [p]);
      for (const r of plan) {
        console.log(`  type=${r.type} | cle=${r.key || '(AUCUNE)'}`
          + ` | lignes=${r.rows} | extra=${r.Extra || ''}`);
      }
      const sansCle = plan.some(r => !r.key);
      console.log(sansCle
        ? '  → AUCUNE cle utilisee : balayage complet confirme par le planificateur,\n'
          + '    pas deduit de la liste des index.'
        : '  → une cle est utilisee : la requete seule est donc peu couteuse, et le\n'
          + '    temps vient du NOMBRE d appels, non de leur cout unitaire.');
    } catch (e) { console.log(`  EXPLAIN indisponible : ${e.message.slice(0, 60)}`); }

    // ---- 5. Ce que cela implique, par ordre de risque ----------------
    console.log('\n## CE QUE CELA IMPLIQUE, par ordre de risque croissant');
    console.log('  1. SORTIR LES REQUETES `tsr` DES BOUCLES. Les valeurs ne dependent pas');
    console.log('     de l iteration : `tsr.max(date, {where:{pays}})` rend le meme');
    console.log('     resultat a chaque tour pour un pays donne. Un seul appel avant la');
    console.log('     boucle suffirait. Changement local, aucun effet sur les FORMULES,');
    console.log('     donc aucun risque sur les valeurs financieres affichees.');
    if (!surPays) {
      console.log(`  2. INDEX sur \`${TSR}(pays, date)\`. Additif, reversible par DROP INDEX, et`);
      console.log('     il profiterait a toute requete filtrant par pays — pas seulement a');
      console.log('     cette route.');
    }
    console.log('  3. Refonte des 1 729 lignes : a ne decider qu une fois les deux');
    console.log('     premiers mesures. Une route de calcul financier ne se reecrit pas');
    console.log('     pour gagner du temps si un appel deplace suffit.');
    console.log('\n  A VERIFIER AVANT TOUTE CORRECTION : que la route rende les MEMES');
    console.log('  chiffres apres. Un ratio juste et lent vaut mieux qu un ratio rapide et');
    console.log('  faux — et aujourd hui la page n affiche rien, donc il n y a pas');
    console.log('  d urgence qui justifierait de sauter cette verification.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
