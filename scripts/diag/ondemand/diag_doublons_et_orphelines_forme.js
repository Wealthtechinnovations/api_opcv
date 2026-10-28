/**
 * 16 144 doublons et 63 153 orphelines : defauts reels, ou artefacts de mes
 * propres definitions ?
 *
 * POURQUOI CE SCRIPT EXISTE AVANT TOUTE ALERTE. La confrontation du backlog
 * (2026-10-28 00:54 UTC) a rendu deux nombres bien plus gros que ce que le
 * document d aout affirmait :
 *
 *   P2-03  1 909 paires (fonds, date) en double, 16 144 lignes en surnombre
 *   P2-04  63 153 lignes de performances dont la date n a pas de VL
 *          (62 477 local, 258 EUR, 418 USD)
 *
 * Les annoncer tels quels serait imprudent, pour une raison de METHODE :
 *
 *   - 62 477 orphelines sur ~90 500 lignes font 69 %. Un taux pareil ressemble
 *     moins a une corruption qu a un desaccord de DEFINITION. Si
 *     `performences.date` est une date de CALCUL et non une date de VL, alors
 *     « orpheline » est structurellement normal pour tout pays dont les VL sont
 *     hebdomadaires — le Nigeria en premier. Le test qui tranche : le taux
 *     d orphelines suit-il la FREQUENCE des VL par pays ? Si le Maroc (VL
 *     quotidiennes) est proche de 0 % et le Nigeria proche de 100 %, mon
 *     controle mesure un calendrier, pas un defaut ;
 *   - 16 144 lignes en surnombre pour 1 909 paires font 8,5 par paire. Des
 *     accidents disperses donneraient 1 ou 2. Ce profil evoque une duplication
 *     SYSTEMATIQUE, concentree. Et la suite depend entierement de la reponse a
 *     une question que personne n a posee : les lignes dupliquees portent-elles
 *     la MEME valeur, ou des valeurs DIFFERENTES ? Identiques, la deduplication
 *     est mecanique et sans risque. Divergentes, il faut trancher laquelle est
 *     juste — et c est un arbitrage sur donnee financiere, pas un nettoyage.
 *
 * C est la regle du projet : « un invariant non confronte aux donnees reelles
 * n est qu une affirmation de plus ». Elle a deja coute deux faux signalements
 * dans cette session — mes 233 rangs doubles en EUR/USD, et mes 523 classeurs
 * « non parses ». Les deux etaient des artefacts de mon perimetre.
 *
 * LECTURE SEULE : SELECT uniquement. Aucune ecriture, aucune suppression.
 * Rien ici ne doit servir a dedupliquer : ce script dit SI et COMMENT il
 * faudrait le faire, pas davantage.
 *
 * USAGE  node scripts/diag/ondemand/diag_doublons_et_orphelines_forme.js
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

(async () => {
  console.log('=== DOUBLONS ET ORPHELINES : DEFAUTS OU ARTEFACTS ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // =================================================================
    // A. LES DOUBLONS DE VL — concentres ou disperses, egaux ou divergents ?
    // =================================================================
    console.log('## A. DOUBLONS DE VL — ou sont-ils, et portent-ils la meme valeur ?');

    const [[glob]] = await conn.query(`
      SELECT COUNT(*) AS paires, COALESCE(SUM(n - 1), 0) AS surnombre, MAX(n) AS pire
        FROM (SELECT fund_id, date, COUNT(*) AS n FROM valorisations
               GROUP BY fund_id, date HAVING COUNT(*) > 1) t`);
    console.log(`  ${glob.paires} paire(s) dupliquee(s) | ${glob.surnombre} ligne(s) en surnombre`
      + ` | pire paire : ${glob.pire} exemplaires`);
    console.log(`  ratio : ${(Number(glob.surnombre) / Number(glob.paires)).toFixed(1)} ligne(s) en trop par paire`);
    console.log('  Des accidents disperses donneraient ~1. Au-dela, la duplication est systematique.');

    const [concentration] = await conn.query(`
      SELECT t.fund_id, f.nom_fond, f.pays, COUNT(*) AS paires, SUM(t.n - 1) AS surnombre,
             DATE_FORMAT(MIN(t.date), '%Y-%m-%d') AS d1, DATE_FORMAT(MAX(t.date), '%Y-%m-%d') AS d2
        FROM (SELECT fund_id, date, COUNT(*) AS n FROM valorisations
               GROUP BY fund_id, date HAVING COUNT(*) > 1) t
        LEFT JOIN fond_investissements f ON f.id = t.fund_id
       GROUP BY t.fund_id, f.nom_fond, f.pays
       ORDER BY surnombre DESC LIMIT 12`);
    console.log(`\n  Les 12 fonds les plus touches :`);
    console.log(`  ${'fonds'.padStart(6)} ${'pays'.padEnd(9)}${'paires'.padStart(7)}${'en trop'.padStart(9)}`
      + `  ${'periode'.padEnd(24)}nom`);
    let cumul = 0;
    for (const r of concentration) {
      cumul += Number(r.surnombre);
      console.log(`  ${String(r.fund_id).padStart(6)} ${String(r.pays || '?').slice(0, 8).padEnd(9)}`
        + `${String(r.paires).padStart(7)}${String(r.surnombre).padStart(9)}`
        + `  ${`${r.d1} → ${r.d2}`.padEnd(24)}${String(r.nom_fond || '?').slice(0, 30)}`);
    }
    const part = Number(glob.surnombre) ? (cumul / Number(glob.surnombre) * 100) : 0;
    console.log(`\n  ces 12 fonds portent ${cumul}/${glob.surnombre} lignes en trop = ${part.toFixed(1)} %`);
    console.log(part > 60
      ? '  → DUPLICATION CONCENTREE. Une poignee de fonds explique l essentiel :\n'
        + '    chercher une cause commune (un import rejoue, une fusion de fonds)\n'
        + '    plutot que de nettoyer 1 909 cas un par un.'
      : '  → duplication DISPERSEE sur de nombreux fonds : cause systemique a\n'
        + '    chercher dans le chemin d ecriture, pas dans un incident isole.');

    // --- La question qui decide de la marche a suivre -----------------
    const [[egalite]] = await conn.query(`
      SELECT
        SUM(valeurs_distinctes = 1) AS identiques,
        SUM(valeurs_distinctes > 1) AS divergentes
        FROM (SELECT fund_id, date, COUNT(DISTINCT CAST(value AS CHAR)) AS valeurs_distinctes
                FROM valorisations GROUP BY fund_id, date HAVING COUNT(*) > 1) t`);
    console.log(`\n  LA QUESTION QUI DECIDE DE TOUT :`);
    console.log(`  paires dont les exemplaires portent la MEME valeur      : ${egalite.identiques}`);
    console.log(`  paires dont les exemplaires portent des valeurs DIFFERENTES : ${egalite.divergentes}`);
    if (Number(egalite.divergentes) === 0) {
      console.log('  → DEDUPLICATION MECANIQUE ET SANS RISQUE : tous les exemplaires sont');
      console.log('    identiques. Garder le plus petit id, supprimer le reste, puis creer');
      console.log('    l index UNIQUE. Aucun arbitrage financier.');
    } else {
      console.log(`  → ${egalite.divergentes} paire(s) exigent un ARBITRAGE : deux valeurs differentes`);
      console.log('    pour un meme fonds a une meme date, et rien ne dit laquelle est juste.');
      console.log('    Ce n est pas un nettoyage, c est une decision sur donnee financiere.');
      const [exemples] = await conn.query(`
        SELECT v.fund_id, DATE_FORMAT(v.date, '%Y-%m-%d') AS d,
               GROUP_CONCAT(CONCAT(v.id, ':', v.value) ORDER BY v.id SEPARATOR '  ') AS ex
          FROM valorisations v
          JOIN (SELECT fund_id, date FROM valorisations
                 GROUP BY fund_id, date
                HAVING COUNT(*) > 1 AND COUNT(DISTINCT CAST(value AS CHAR)) > 1 LIMIT 6) t
            ON t.fund_id = v.fund_id AND t.date = v.date
         GROUP BY v.fund_id, v.date LIMIT 6`);
      console.log('    exemples (id:valeur) :');
      for (const e of exemples) console.log(`      fonds ${e.fund_id} le ${e.d} : ${String(e.ex).slice(0, 110)}`);
    }

    // --- Ces doublons faussent-ils ce qui est AFFICHE ? ---------------
    const [[recents]] = await conn.query(`
      SELECT COUNT(*) AS n FROM (
        SELECT fund_id, date FROM valorisations
         WHERE date >= DATE_SUB(CURDATE(), INTERVAL 400 DAY)
         GROUP BY fund_id, date HAVING COUNT(*) > 1) t`);
    console.log(`\n  paires dupliquees sur les 400 derniers jours : ${recents.n}/${glob.paires}`);
    console.log(Number(recents.n) === 0
      ? '  → AUCUNE recente : les doublons sont un heritage, pas une fuite active.\n'
        + '    L index UNIQUE empecherait les futurs ; l urgence est faible.'
      : '  → des doublons RECENTS existent : le chemin d ecriture en produit encore.\n'
        + '    L index UNIQUE est alors un correctif, pas seulement une hygiene.');

    // =================================================================
    // B. LES ORPHELINES — defaut, ou desaccord de calendrier ?
    // =================================================================
    console.log('\n\n## B. PERFORMANCES ORPHELINES — defaut, ou desaccord de calendrier ?');
    console.log('  Test : le taux d orphelines suit-il la FREQUENCE des VL par pays ?');
    console.log('  Si oui, mon controle mesure un calendrier et non une corruption.\n');

    const [parPays] = await conn.query(`
      SELECT f.pays,
             COUNT(*) AS lignes,
             SUM(NOT EXISTS (SELECT 1 FROM valorisations v
                   WHERE v.fund_id = p.fond_id AND v.date = p.date)) AS orphelines
        FROM performences p JOIN fond_investissements f ON f.id = p.fond_id
       GROUP BY f.pays ORDER BY orphelines DESC`);
    // frequence mediane des VL par pays, sur un an
    const [freq] = await conn.query(`
      SELECT f.pays, COUNT(DISTINCT v.date) AS dates_vl
        FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
       WHERE v.date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
       GROUP BY f.pays`);
    const dparPays = new Map(freq.map(r => [r.pays, Number(r.dates_vl)]));
    console.log(`  ${'pays'.padEnd(10)}${'lignes perf'.padStart(12)}${'orphelines'.padStart(12)}`
      + `${'taux'.padStart(8)}${'dates VL/an'.padStart(13)}  rythme`);
    for (const r of parPays) {
      const taux = Number(r.lignes) ? Number(r.orphelines) / Number(r.lignes) * 100 : 0;
      const d = dparPays.get(r.pays);
      const rythme = d == null ? '?' : d >= 200 ? 'quotidien' : d >= 40 ? 'hebdomadaire' : 'rare';
      console.log(`  ${String(r.pays || '?').slice(0, 9).padEnd(10)}${String(r.lignes).padStart(12)}`
        + `${String(r.orphelines).padStart(12)}${`${taux.toFixed(1)} %`.padStart(8)}`
        + `${String(d == null ? '?' : d).padStart(13)}  ${rythme}`);
    }
    const quot = parPays.filter(r => (dparPays.get(r.pays) || 0) >= 200);
    const hebdo = parPays.filter(r => { const d = dparPays.get(r.pays) || 0; return d >= 40 && d < 200; });
    const tx = l => { const a = l.reduce((s, r) => s + Number(r.lignes), 0);
      const o = l.reduce((s, r) => s + Number(r.orphelines), 0); return a ? o / a * 100 : 0; };
    if (quot.length && hebdo.length) {
      const tq = tx(quot), th = tx(hebdo);
      console.log(`\n  taux moyen, pays a VL quotidiennes   : ${tq.toFixed(1)} %`);
      console.log(`  taux moyen, pays a VL hebdomadaires  : ${th.toFixed(1)} %`);
      console.log(th - tq > 25
        ? '  → ARTEFACT DE CALENDRIER CONFIRME. Le taux suit la frequence des VL :\n'
          + '    mon controle compte comme « orphelines » des performances calculees a\n'
          + '    des dates ou aucune VL n est publiee. Ce n est PAS 63 153 lignes\n'
          + '    corrompues. Le controle doit comparer a la DERNIERE VL <= date, pas a\n'
          + '    une egalite stricte — et P2-04 doit etre requalifie dans le backlog.'
        : '  → pas d artefact de calendrier : les taux ne suivent pas la frequence.\n'
          + '    Les orphelines sont alors un defaut reel, a instruire.');
    } else {
      console.log('\n  perimetre insuffisant pour separer les deux rythmes : ne rien conclure.');
    }

    // Le test strict : une performance orpheline a-t-elle une VL ANTERIEURE ?
    const [[anterieure]] = await conn.query(`
      SELECT COUNT(*) AS sans_aucune FROM performences p
       WHERE NOT EXISTS (SELECT 1 FROM valorisations v
               WHERE v.fund_id = p.fond_id AND v.date = p.date)
         AND NOT EXISTS (SELECT 1 FROM valorisations v
               WHERE v.fund_id = p.fond_id AND v.date <= p.date AND v.value > 0)`);
    console.log(`\n  TEST STRICT — performances sans AUCUNE VL a leur date ni avant : ${anterieure.sans_aucune}`);
    console.log(Number(anterieure.sans_aucune) === 0
      ? '  → zero. Toute performance repose sur au moins une VL anterieure : aucune\n'
        + '    valeur ne sort de nulle part. Le vrai compte de P2-04 est ZERO, et mon\n'
        + '    63 153 etait une definition trop stricte, pas un defaut.'
      : `  → ${anterieure.sans_aucune} ligne(s) ne reposent sur AUCUNE VL. Celles-la sont le\n`
        + '    vrai P2-04 : une performance calculee sur rien. C est ce nombre qu il\n'
        + '    faut porter au backlog, pas le total.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
