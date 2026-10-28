/**
 * 16 125 valorisations rattachees a AUCUN fonds : que sont-elles, et nuisent-elles ?
 *
 * D OU VIENT CETTE QUESTION. Elle est nee de la refutation de mon propre
 * chiffre. J avais porte au backlog « 1 909 paires (fonds, date) dupliquees,
 * 16 144 lignes en surnombre ». Faux : mon `GROUP BY fund_id, date` regroupait
 * toutes les lignes a `fund_id = NULL` tombant a la meme date et les comptait
 * comme des doublons. Mesure du 2026-10-28 05:15 UTC :
 *
 *   1 890 paires sur 1 909 et 16 125 lignes sur 16 144 portent fund_id = NULL.
 *   Les VRAIS doublons entre fonds reels sont 19 paires.
 *
 * Deux consequences, et la seconde est plus interessante que la premiere.
 *
 * (1) P2-03 doit etre requalifie : MySQL autorise plusieurs NULL dans un index
 *     UNIQUE, donc ces 16 125 lignes NE BLOQUERAIENT PAS la migration. Seules
 *     les 19 paires reelles la bloqueraient. Le chantier passe de « 1 909 cas a
 *     arbitrer » a « 19 cas », ce qui le rend faisable.
 *
 * (2) Un defaut que personne n avait nomme apparait : 16 125 valorisations
 *     rattachees a aucun fonds, de 2016-12-26 a 2024-07-12. Invisibles a toute
 *     requete par fonds — donc absentes des fiches, des performances et des
 *     classements — mais comptees dans le total de 1 053 006. Elles n ont jamais
 *     figure dans aucun document du projet.
 *
 * CE QUE CE SCRIPT ETABLIT, et pourquoi chaque question compte :
 *   - leur volume exact et leur etendue dans le temps : un incident date se
 *     traite autrement qu une fuite continue sur huit ans ;
 *   - si elles portent des valeurs plausibles ou vides : des lignes vides sont
 *     un residu d insertion ; des valeurs reelles sont des DONNEES PERDUES,
 *     peut-etre rattachables ;
 *   - ce qu elles portent d autre (devise, indRef, libelle) qui permettrait de
 *     deviner a quel fonds elles appartenaient ;
 *   - si une colonne quelconque garde la trace du rattachement d origine ;
 *   - leur poids reel : 16 125 sur 1 053 006 fait 1,5 % — il faut dire si cela
 *     fausse un total affiche quelque part, ou seulement un COUNT(*).
 *
 * ET LES 19 VRAIS DOUBLONS, correctement mesures cette fois : memes valeurs ou
 * valeurs divergentes. Ma requete d exemples precedente ne rendait RIEN, et
 * c etait un piege SQL a noter : la jointure `t.fund_id = v.fund_id` n est
 * JAMAIS vraie quand fund_id est NULL, puisque NULL = NULL est inconnu. Les
 * exemples portaient donc tous sur des paires NULL et disparaissaient
 * silencieusement. Ici le NULL est exclu explicitement.
 *
 * LECTURE SEULE : SELECT uniquement. Aucune suppression, aucun rattachement.
 * Ce script dit ce que sont ces lignes ; il ne decide pas de leur sort.
 *
 * USAGE  node scripts/diag/ondemand/diag_vl_sans_fonds.js
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

(async () => {
  console.log('=== VALORISATIONS RATTACHEES A AUCUN FONDS ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. Volume, et les deux formes d orphelinage -----------------
    console.log('## 1. COMBIEN, ET DE QUELLE FORME ?');
    const [[tot]] = await conn.query('SELECT COUNT(*) AS n FROM valorisations');
    const [[nulles]] = await conn.query(
      'SELECT COUNT(*) AS n FROM valorisations WHERE fund_id IS NULL');
    // fund_id renseigne mais pointant vers un fonds inexistant : autre defaut,
    // souvent confondu avec le precedent.
    const [[fantomes]] = await conn.query(`
      SELECT COUNT(*) AS n FROM valorisations v
       WHERE v.fund_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM fond_investissements f WHERE f.id = v.fund_id)`);
    console.log(`  total valorisations          : ${tot.n}`);
    console.log(`  fund_id IS NULL              : ${nulles.n}`
      + ` (${(Number(nulles.n) / Number(tot.n) * 100).toFixed(2)} %)`);
    console.log(`  fund_id vers un fonds absent : ${fantomes.n}`);
    console.log('  Les deux formes sont distinctes : la premiere n a jamais eu de fonds,');
    console.log('  la seconde en a perdu un. Elles ne se reparent pas de la meme facon.');
    if (Number(nulles.n) === 0 && Number(fantomes.n) === 0) {
      console.log('\n  → aucune ligne orpheline : le constat precedent est perime.');
      return;
    }

    // ---- 2. Etendue dans le temps ------------------------------------
    console.log('\n## 2. INCIDENT DATE, OU FUITE CONTINUE ?');
    const [[bornes]] = await conn.query(`
      SELECT DATE_FORMAT(MIN(date), '%Y-%m-%d') AS d1, DATE_FORMAT(MAX(date), '%Y-%m-%d') AS d2,
             COUNT(DISTINCT date) AS dates
        FROM valorisations WHERE fund_id IS NULL`);
    console.log(`  de ${bornes.d1} a ${bornes.d2} | ${bornes.dates} date(s) distincte(s)`);
    const [parAn] = await conn.query(`
      SELECT YEAR(date) AS an, COUNT(*) AS n FROM valorisations
       WHERE fund_id IS NULL GROUP BY YEAR(date) ORDER BY an`);
    console.log(`  ${'annee'.padEnd(8)}lignes`);
    for (const r of parAn) console.log(`  ${String(r.an).padEnd(8)}${String(r.n).padStart(7)}`);
    const annees = parAn.length;
    console.log(annees > 3
      ? `  → etalees sur ${annees} annees : ce n est pas un incident, c est un chemin\n`
        + '    d ecriture qui a laisse passer des lignes sans fonds pendant des annees.'
      : '  → concentrees sur peu d annees : chercher un import date.');

    // ---- 3. Portent-elles des donnees, ou sont-elles vides ? ---------
    console.log('\n## 3. DONNEES PERDUES, OU RESIDU VIDE ?');
    const [[contenu]] = await conn.query(`
      SELECT SUM(value IS NOT NULL AND value <> 0) AS avecValeur,
             SUM(value IS NULL OR value = 0)       AS sansValeur,
             MIN(value) AS mn, MAX(value) AS mx,
             SUM(indRef IS NOT NULL AND indRef <> 0) AS avecIndRef
        FROM valorisations WHERE fund_id IS NULL`);
    console.log(`  avec une valeur non nulle : ${contenu.avecValeur}`);
    console.log(`  sans valeur               : ${contenu.sansValeur}`);
    console.log(`  plage des valeurs         : ${contenu.mn} → ${contenu.mx}`);
    console.log(`  portant un indRef         : ${contenu.avecIndRef}`);
    console.log(Number(contenu.avecValeur) > 0
      ? '  → DONNEES REELLES. Ce ne sont pas des lignes vides : des VL existent,\n'
        + '    detachees de tout fonds. Peut-etre rattachables, peut-etre perdues.'
      : '  → residu sans valeur : suppression sans perte d information.');

    // ---- 4. Reste-t-il une trace du rattachement ? -------------------
    console.log('\n## 4. UNE COLONNE GARDE-T-ELLE LA TRACE DU FONDS D ORIGINE ?');
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'valorisations'
       ORDER BY ORDINAL_POSITION`, [BASE]);
    const candidates = cols.filter(c =>
      /fond|fund|nom|libel|code|isin|societe|source|batch/i.test(c.COLUMN_NAME)
      && c.COLUMN_NAME !== 'fund_id');
    if (!candidates.length) {
      console.log('  aucune colonne susceptible de porter une identite de fonds.');
      console.log('  → le rattachement est IRRECUPERABLE depuis cette table seule.');
    } else {
      for (const c of candidates) {
        const n = c.COLUMN_NAME;
        try {
          const [[r]] = await conn.query(`
            SELECT SUM(\`${n}\` IS NOT NULL AND TRIM(\`${n}\`) <> '') AS remplies,
                   COUNT(DISTINCT \`${n}\`) AS distinctes
              FROM valorisations WHERE fund_id IS NULL`);
          console.log(`  ${n.padEnd(22)} ${String(r.remplies).padStart(7)} remplie(s),`
            + ` ${r.distinctes} valeur(s) distincte(s)`);
          if (Number(r.remplies) > 0) {
            const [ex] = await conn.query(`
              SELECT DISTINCT \`${n}\` AS v FROM valorisations
               WHERE fund_id IS NULL AND \`${n}\` IS NOT NULL AND TRIM(\`${n}\`) <> ''
               LIMIT 5`);
            console.log(`  ${' '.repeat(22)} exemples : `
              + ex.map(e => String(e.v).slice(0, 28)).join(' | '));
          }
        } catch (e) { console.log(`  ${n.padEnd(22)} illisible (${e.message.slice(0, 40)})`); }
      }
    }

    // ---- 5. Faussent-elles un total affiche ? ------------------------
    console.log('\n## 5. FAUSSENT-ELLES UN CHIFFRE AFFICHE ?');
    console.log('  Toute requete joignant `fond_investissements` les exclut d office :');
    console.log('  elles sont donc absentes des fiches, performances et classements.');
    console.log(`  Elles ne pesent que sur un COUNT(*) brut : ${nulles.n}/${tot.n}`
      + ` = ${(Number(nulles.n) / Number(tot.n) * 100).toFixed(2)} %.`);
    console.log('  → impact affichage NUL, impact sur les comptes de pilotage REEL.');
    console.log('  Gravite : faible pour l utilisateur, mais tout chiffre de volumetrie');
    console.log('  cite dans un document les inclut sans le dire.');

    // ---- 6. Les 19 vrais doublons, cette fois sans le piege NULL -----
    console.log('\n## 6. LES VRAIS DOUBLONS — fonds reels uniquement');
    console.log('  Ma requete d exemples precedente ne rendait RIEN, et c etait un piege');
    console.log('  SQL : `t.fund_id = v.fund_id` n est jamais vrai quand fund_id est NULL,');
    console.log('  car NULL = NULL est inconnu. Les exemples portaient tous sur des paires');
    console.log('  NULL et disparaissaient en silence. Ici le NULL est exclu.');
    const [[vrais]] = await conn.query(`
      SELECT COUNT(*) AS paires, COALESCE(SUM(n - 1), 0) AS surnombre,
             SUM(vd = 1) AS identiques, SUM(vd > 1) AS divergentes
        FROM (SELECT fund_id, date, COUNT(*) AS n,
                     COUNT(DISTINCT CAST(value AS CHAR)) AS vd
                FROM valorisations WHERE fund_id IS NOT NULL
               GROUP BY fund_id, date HAVING COUNT(*) > 1) t`);
    console.log(`\n  ${vrais.paires} paire(s) | ${vrais.surnombre} ligne(s) en trop`);
    console.log(`  memes valeurs : ${vrais.identiques} | valeurs divergentes : ${vrais.divergentes}`);
    const [detail] = await conn.query(`
      SELECT v.fund_id, f.nom_fond, f.pays, DATE_FORMAT(v.date, '%Y-%m-%d') AS d,
             GROUP_CONCAT(CONCAT(v.id, ':', v.value) ORDER BY v.id SEPARATOR '  ') AS ex
        FROM valorisations v
        LEFT JOIN fond_investissements f ON f.id = v.fund_id
        JOIN (SELECT fund_id, date FROM valorisations
               WHERE fund_id IS NOT NULL
               GROUP BY fund_id, date HAVING COUNT(*) > 1) t
          ON t.fund_id = v.fund_id AND t.date = v.date
       GROUP BY v.fund_id, f.nom_fond, f.pays, v.date
       ORDER BY v.fund_id, v.date LIMIT 25`);
    console.log(`\n  ${'fonds'.padStart(6)} ${'pays'.padEnd(8)}${'date'.padEnd(12)}id:valeur`);
    for (const r of detail) {
      console.log(`  ${String(r.fund_id).padStart(6)} ${String(r.pays || '?').slice(0, 7).padEnd(8)}`
        + `${r.d.padEnd(12)}${String(r.ex).slice(0, 86)}`);
    }
    console.log(Number(vrais.divergentes) === 0
      ? '\n  → DEDUPLICATION MECANIQUE : tous identiques. Garder le plus petit id,\n'
        + '    supprimer le reste, puis creer l index UNIQUE. Aucun arbitrage.'
      : `\n  → ${vrais.divergentes} paire(s) a arbitrer, sur ${vrais.paires}. C est un volume\n`
        + '    TRAITABLE a la main, et c est la difference avec mon chiffre errone de\n'
        + '    1 909 : le chantier P2-03 redevient faisable.');
    console.log('\n  Rappel : MySQL autorise plusieurs NULL dans un index UNIQUE. Les lignes');
    console.log('  sans fonds ne bloqueraient donc PAS la creation de l index.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
