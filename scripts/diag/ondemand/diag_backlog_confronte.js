/**
 * Le backlog consolide a deux mois et demi. Que reste-t-il de vrai ?
 *
 * POURQUOI. `SUIVI.md > BACKLOG CONSOLIDE UNIQUE` a ete etabli le 2026-08-12 et
 * ses « preuves PROD » datent de ce jour-la. Il porte huit chantiers P1/P2 et un
 * plan en six lots. Il porte aussi, en section 4, cette phrase :
 *
 *   « Le vrai blocage de D2/D3/D5 n est pas une decision : c est l acces
 *     MCP/DB. Bridge teste le 2026-08-12 → Invalid or missing MCP session. »
 *
 * Cette premisse est PERIMEE : le canal a la demande lit la base de production
 * — ce script en est la preuve par son existence meme — et les workflows `ops-*`
 * ecrivent. L acces n est plus le blocage. C est le piege exact que CLAUDE.md
 * nomme « la mesure prime sur la prose », et qui a deja coute deux mois avec
 * CODE_REVIEW #34 sur l UEMOA : un document affirme un blocage disparu, et
 * chaque reprise repart du constat errone.
 *
 * Ce script ne discute aucun item : il les REMESURE, un par un, et rend pour
 * chacun un verdict chiffre — RESOLU, TOUJOURS VRAI, ou AGGRAVE. Ce qui est
 * resolu doit sortir du backlog ; ce qui tient doit etre priorise sur des
 * chiffres du jour, pas sur une preuve d aout.
 *
 * ITEMS CONFRONTES, tels que le backlog les enonce :
 *   P1-02  fonds 2825 (Zenith Balanced Strategy) : YTD affichee 239,20 %,
 *          historique troue 2022-10 → 2026-06
 *   P1-03  /api/listeopcvm cassee, colonnes DB manquantes
 *   P2-01  CEMAC : 34 fonds sans VL depuis 2024-12-12, 0 % de couverture indRef
 *   P2-03  aucun index UNIQUE sur valorisations(fund_id, date) : rien n empeche
 *          les doublons de VL
 *   P2-04  perfs orphelines : lignes `performences` dont la date n a plus de VL
 *
 * P1-04 (build frontend) et P2-02 (authenticate sur les routes POST) ne sont pas
 * mesurables en SQL : ils relevent du bundle servi et du code des routes. Ils
 * sont nommes ici pour memoire, et traites ailleurs.
 *
 * LECTURE SEULE : SELECT et `information_schema`. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_backlog_confronte.js
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

const verdict = (id, etat, detail) => {
  const marque = { RESOLU: '✔ RESOLU      ', VRAI: '✘ TOUJOURS VRAI', AGGRAVE: '!! AGGRAVE    ',
    PARTIEL: '~ PARTIEL     ', INDETERMINE: '? INDETERMINE ' }[etat] || etat;
  console.log(`\n  ${marque}  ${id}`);
  for (const l of detail) console.log(`     ${l}`);
};

(async () => {
  console.log('=== LE BACKLOG DU 2026-08-12, CONFRONTE A LA PRODUCTION ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE`);
  console.log('Verdict par les chiffres du jour, pas par la prose d aout.\n');

  const conn = await mysql.createConnection(DB);
  try {
    // ---- P1-02 : fonds 2825 -----------------------------------------
    console.log('## P1-02 — fonds 2825, YTD 239,20 % sur historique troue');
    const [[f2825]] = await conn.query(
      'SELECT id, nom_fond, active, pays FROM fond_investissements WHERE id = 2825');
    if (!f2825) verdict('P1-02', 'INDETERMINE', ['le fonds 2825 n existe plus en base.']);
    else {
      const [[vl]] = await conn.query(`
        SELECT COUNT(*) AS n, DATE_FORMAT(MIN(date), '%Y-%m-%d') AS mn,
               DATE_FORMAT(MAX(date), '%Y-%m-%d') AS mx
          FROM valorisations WHERE fund_id = 2825 AND value > 0`);
      // le trou annonce : 2022-10 -> 2026-06
      const [[trou]] = await conn.query(`
        SELECT COUNT(*) AS n FROM valorisations
         WHERE fund_id = 2825 AND value > 0 AND date BETWEEN '2022-11-01' AND '2026-05-31'`);
      const [[p]] = await conn.query(
        'SELECT ytd, datejour FROM performences WHERE fond_id = 2825 ORDER BY datejour DESC LIMIT 1');
      const ytd = p ? Number(p.ytd) : null;
      const det = [
        `${f2825.nom_fond} | active=${f2825.active} | ${vl.n} VL de ${vl.mn} a ${vl.mx}`,
        `VL dans la fenetre du trou annonce (2022-11 → 2026-05) : ${trou.n}`,
        `YTD stockee la plus recente : ${p ? `${p.ytd} au ${String(p.datejour).slice(0, 10)}` : '(aucune)'}`,
      ];
      if (ytd !== null && Math.abs(ytd) > 100) {
        det.push(`→ |YTD| = ${Math.abs(ytd).toFixed(2)} % reste aberrante.`);
        verdict('P1-02', 'VRAI', det);
      } else if (ytd === null) {
        det.push('→ plus aucune performance stockee : le symptome a disparu, la cause est a verifier.');
        verdict('P1-02', 'PARTIEL', det);
      } else {
        det.push(`→ YTD redevenue plausible (${ytd} %). Le trou d historique peut subsister.`);
        verdict('P1-02', trou.n > 0 ? 'RESOLU' : 'PARTIEL', det);
      }
    }

    // ---- P2-03 : index UNIQUE et doublons de VL ---------------------
    console.log('\n## P2-03 — index UNIQUE sur valorisations(fund_id, date)');
    const [idx] = await conn.query(`
      SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
        FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'valorisations'
       GROUP BY INDEX_NAME, NON_UNIQUE`, [BASE]);
    const unique = idx.find(i => Number(i.NON_UNIQUE) === 0
      && /^fund_id,date$|^date,fund_id$/.test(String(i.cols)));
    const [[dbl]] = await conn.query(`
      SELECT COUNT(*) AS paires, COALESCE(SUM(n - 1), 0) AS surnombre FROM (
        SELECT fund_id, date, COUNT(*) AS n FROM valorisations
         GROUP BY fund_id, date HAVING COUNT(*) > 1) t`);
    const det3 = [
      `index sur la table : ${idx.length} | UNIQUE (fund_id, date) : ${unique ? `OUI (${unique.INDEX_NAME})` : 'NON'}`,
      `doublons reels : ${dbl.paires} paire(s) (fonds, date) en double, ${dbl.surnombre} ligne(s) en surnombre`,
    ];
    if (unique) { det3.push('→ la contrainte existe : rien ne peut plus creer de doublon.'); verdict('P2-03', 'RESOLU', det3); }
    else if (Number(dbl.paires) === 0) {
      det3.push('→ pas de contrainte, mais ZERO doublon aujourd hui : la creation de');
      det3.push('  l index UNIQUE passerait sans nettoyage prealable. C est le moment.');
      verdict('P2-03', 'VRAI', det3);
    } else {
      det3.push(`→ pas de contrainte ET ${dbl.paires} doublon(s) : il faut trancher lequel garder`);
      det3.push('  AVANT de creer l index, sinon la migration echoue.');
      verdict('P2-03', 'VRAI', det3);
    }

    // ---- P2-04 : performances orphelines ----------------------------
    console.log('\n## P2-04 — performances orphelines (date sans VL correspondante)');
    const tables = [['performences', 'performences'], ['performences_eurs', 'EUR'], ['performences_usds', 'USD']];
    const det4 = [];
    let totalOrph = 0;
    for (const [t, lib] of tables) {
      try {
        const [[o]] = await conn.query(`
          SELECT COUNT(*) AS n FROM \`${t}\` p
           WHERE NOT EXISTS (
             SELECT 1 FROM valorisations v
              WHERE v.fund_id = p.fond_id AND v.date = p.datejour)`);
        totalOrph += Number(o.n);
        det4.push(`${lib.padEnd(14)} ${String(o.n).padStart(7)} ligne(s) orpheline(s)`);
      } catch (e) { det4.push(`${lib.padEnd(14)} illisible : ${e.message.slice(0, 60)}`); }
    }
    det4.push(totalOrph === 0
      ? '→ aucune orpheline : le piege annonce ne s est pas materialise.'
      : `→ ${totalOrph} ligne(s) de performance portent une date sans VL. Chacune peut`);
    if (totalOrph > 0) det4.push('  alimenter un classement avec une valeur qui ne repose sur rien.');
    verdict('P2-04', totalOrph === 0 ? 'RESOLU' : 'VRAI', det4);

    // ---- P2-01 : CEMAC ----------------------------------------------
    console.log('\n## P2-01 — CEMAC : 34 fonds sans VL depuis 2024-12-12, 0 % indRef');
    const [[cemac]] = await conn.query(`
      SELECT COUNT(*) AS fonds, SUM(f.active = 1) AS actifs
        FROM fond_investissements f WHERE UPPER(f.pays) = 'CEMAC'`);
    const [[vlc]] = await conn.query(`
      SELECT COUNT(*) AS n, DATE_FORMAT(MAX(v.date), '%Y-%m-%d') AS mx,
             SUM(v.indRef IS NOT NULL AND v.indRef <> 0 AND v.indRef <> '') AS avecIndRef
        FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
       WHERE UPPER(f.pays) = 'CEMAC'`);
    const age = vlc.mx ? Math.round((Date.now() - Date.parse(vlc.mx)) / 86400000) : null;
    const couv = Number(vlc.n) ? (Number(vlc.avecIndRef) / Number(vlc.n) * 100) : 0;
    const det1 = [
      `${cemac.fonds} fonds CEMAC (${cemac.actifs} actifs) | ${vlc.n} VL | derniere ${vlc.mx || '(aucune)'}`,
      `age de la derniere VL : ${age === null ? 'n/a' : `${age} jours`}`,
      `couverture indRef : ${couv.toFixed(1)} % (${vlc.avecIndRef}/${vlc.n})`,
    ];
    if (age !== null && age > 365) {
      det1.push(`→ TOUJOURS VRAI, et le retard s est creuse : ${age} j contre 243 j au 2026-08-12.`);
      verdict('P2-01', 'AGGRAVE', det1);
    } else if (age !== null && age < 30) {
      det1.push('→ les VL CEMAC arrivent de nouveau.');
      verdict('P2-01', couv > 50 ? 'RESOLU' : 'PARTIEL', det1);
    } else verdict('P2-01', 'VRAI', det1);

    // ---- P1-03 : colonnes de listeopcvm -----------------------------
    console.log('\n## P1-03 — /api/listeopcvm : colonnes DB manquantes');
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fond_investissements'`, [BASE]);
    const presentes = new Set(cols.map(c => c.COLUMN_NAME));
    console.log(`     fond_investissements porte ${presentes.size} colonnes.`);
    console.log('     Le backlog ne nomme pas les colonnes manquantes : la verification');
    console.log('     exige de lire la route et son modele Sequelize, pas seulement la base.');
    console.log('     → a trancher par un appel reel a la route, en lot dedie.');

    // ---- Ce que l acces prouve, contre la section 4 -----------------
    console.log('\n## LA PREMISSE DE LA SECTION 4 DU BACKLOG');
    const [[preuve]] = await conn.query('SELECT COUNT(*) AS n FROM valorisations');
    console.log(`     Le backlog affirme : « le vrai blocage de D2/D3/D5 est l acces MCP/DB ».`);
    console.log(`     Ce script vient de lire ${preuve.n} lignes de valorisations sur la base de`);
    console.log('     PRODUCTION. L acces en lecture existe, par le canal a la demande.');
    console.log('     → PREMISSE PERIMEE. D2 (CEMAC), D3 (fonds dormants) et D5 (build) ne');
    console.log('       sont plus bloques par l acces. Corriger cette ligne du backlog, et');
    console.log('       ne plus repartir de ce constat a chaque reprise.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
