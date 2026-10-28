/**
 * Les 21 698 VL « detachees » sont-elles des FONDS perdus, ou des INDICES ?
 *
 * LA FORME QUI NE COLLE PAS. Mesure du 2026-10-28 06:05 UTC : les 21 698 lignes
 * dont le `fund_id` ne correspond a aucun fonds se repartissent sur **17
 * identifiants**, et le profil est trop regulier pour etre accidentel :
 *
 *   fund_id 1419, 1421, 1422, 1423, 1424, 1425, 1429, 1430, 1438, 1439 …
 *   chacun : 1 548 VL, periode 2011-05-25 → 2018-02-20
 *
 * Des identifiants CONSECUTIFS, un comptage IDENTIQUE a l unite, et des bornes
 * de periode IDENTIQUES au jour. Dix-sept fonds supprimes a des moments
 * differents ne produiraient jamais cela. C est la signature d un SEUL import
 * de dix-sept series, jamais rattache.
 *
 * ET UNE DATE ARRETE LE REGARD. Ces series s arretent toutes au **2018-02-20**.
 * C est exactement la derniere VL de `Sovereign_bond_index`, qui compte 6 243
 * VL rattachees (mesure du lot CQ). La coincidence est trop precise.
 *
 * HYPOTHESE A TESTER : ce ne sont pas des fonds perdus, ce sont des INDICES.
 * Des historiques d indices ranges dans `valorisations` avec un identifiant
 * provenant d une table d indices — `indices`, `indice_references`,
 * `ref_indices_fundafrica` ou `type_indice` — et non de `fond_investissements`.
 * La contrainte n existant pas, rien ne s y est oppose.
 *
 * SI ELLE SE VERIFIE, le verdict du lot CQ change : ces 21 698 lignes ne sont
 * pas « archivables faute de trace » mais IDENTIFIABLES, avec un nom et un
 * sens. Et le diagnostic devient structurel : deux natures de donnees cohabitent
 * dans une meme table sans que rien ne les distingue.
 *
 * SI ELLE SE REVELE FAUSSE, le verdict « archivables » tient, et il faudra le
 * dire — une hypothese elegante refutee vaut mieux qu une hypothese elegante
 * repetee. J ai deja eu tort cinq fois aujourd hui en suivant une forme
 * seduisante sans la confronter.
 *
 * Le script cherche les 17 identifiants dans TOUTES les tables du schema
 * portant une colonne d identifiant plausible, et imprime les noms trouves.
 *
 * LECTURE SEULE : SELECT et information_schema. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_detachees_sont_des_indices.js
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
  console.log('=== LES VL DETACHEES SONT-ELLES DES INDICES, ET NON DES FONDS ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. Les 17 identifiants, et leur regularite -------------------
    const [ids] = await conn.query(`
      SELECT v.fund_id, COUNT(*) AS n,
             DATE_FORMAT(MIN(v.date), '%Y-%m-%d') AS d1,
             DATE_FORMAT(MAX(v.date), '%Y-%m-%d') AS d2
        FROM valorisations v
       WHERE v.fund_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM fond_investissements f WHERE f.id = v.fund_id)
       GROUP BY v.fund_id ORDER BY v.fund_id`);
    console.log(`## 1. LES ${ids.length} IDENTIFIANTS, ET LEUR REGULARITE`);
    console.log(`  ${'fund_id'.padStart(8)}${'VL'.padStart(8)}  periode`);
    for (const r of ids) {
      console.log(`  ${String(r.fund_id).padStart(8)}${String(r.n).padStart(8)}  ${r.d1} → ${r.d2}`);
    }
    const comptes = new Set(ids.map(r => Number(r.n)));
    const fins = new Set(ids.map(r => r.d2));
    console.log(`\n  comptages distincts : ${comptes.size} (${[...comptes].join(', ')})`);
    console.log(`  dates de fin distinctes : ${fins.size} (${[...fins].join(', ')})`);
    console.log(comptes.size <= 3 && fins.size <= 3
      ? '  → REGULARITE CONFIRMEE : un seul import, pas des suppressions eparses.'
      : '  → profil irregulier : l hypothese du lot unique s affaiblit.');

    // ---- 2. Ces identifiants existent-ils dans une table d indices ? --
    console.log('\n## 2. CES IDENTIFIANTS EXISTENT-ILS AILLEURS QUE DANS LES FONDS ?');
    const liste = ids.map(r => Number(r.fund_id));
    const [tables] = await conn.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`, [BASE]);
    let trouvee = null;
    for (const { TABLE_NAME: t } of tables) {
      if (t === 'valorisations') continue;
      const [cols] = await conn.query(`
        SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [BASE, t]);
      const cle = cols.find(c => c.COLUMN_NAME === 'id'
        && /int|bigint|smallint/i.test(c.DATA_TYPE));
      if (!cle) continue;
      try {
        const [[r]] = await conn.query(
          `SELECT COUNT(*) AS n FROM \`${t}\` WHERE id IN (?)`, [liste]);
        if (Number(r.n) === 0) continue;
        const nomCol = cols.find(c => /^(nom_indice|nom|libelle|nom_fond|titre|label)$/i.test(c.COLUMN_NAME))
          || cols.find(c => /nom|libel|titre/i.test(c.COLUMN_NAME));
        console.log(`  ${t.padEnd(28)} ${String(r.n).padStart(3)}/${liste.length} identifiant(s) presents`
          + `${nomCol ? ` | nom dans \`${nomCol.COLUMN_NAME}\`` : ''}`);
        if (Number(r.n) >= liste.length * 0.5 && !trouvee) trouvee = { t, nomCol };
        if (nomCol) {
          const [ex] = await conn.query(
            `SELECT id, \`${nomCol.COLUMN_NAME}\` AS nom FROM \`${t}\`
              WHERE id IN (?) ORDER BY id LIMIT 20`, [liste]);
          for (const e of ex) {
            console.log(`  ${' '.repeat(28)}  ${String(e.id).padStart(6)} → ${String(e.nom).slice(0, 46)}`);
          }
        }
      } catch { /* table non interrogeable sur `id`, ignoree */ }
    }

    console.log('\n## VERDICT');
    if (trouvee) {
      console.log(`  HYPOTHESE CONFIRMEE. Au moins la moitie des identifiants existent dans`);
      console.log(`  \`${trouvee.t}\`. Ces lignes ne sont donc PAS des fonds perdus : ce sont des`);
      console.log('  historiques dont l identifiant renvoie a une AUTRE table que');
      console.log('  `fond_investissements`, ranges dans `valorisations` sans que rien ne s y');
      console.log('  oppose — la contrainte n existe pas.');
      console.log('\n  Consequence sur le verdict du lot CQ : ces 21 698 lignes passent');
      console.log('  d « archivables faute de trace » a IDENTIFIABLES, avec un nom et un sens.');
      console.log('  Et le defaut devient structurel : deux natures de donnees cohabitent dans');
      console.log('  une meme table sans rien pour les distinguer. Une cle etrangere vers');
      console.log('  `fond_investissements` les aurait refusees a l ecriture.');
      console.log('\n  ATTENTION AVANT TOUTE SUPPRESSION : si ces lignes alimentent un calcul');
      console.log('  d indice de reference, les effacer retirerait un historique utilise.');
      console.log('  Verifier cet usage avant de decider quoi que ce soit.');
    } else {
      console.log('  HYPOTHESE REFUTEE. Aucune table ne reconnait la moitie de ces');
      console.log('  identifiants. Le verdict du lot CQ tient : (A) ARCHIVABLES.');
      console.log('  Une hypothese elegante refutee vaut mieux qu une hypothese elegante');
      console.log('  repetee — la regularite du profil reste inexpliquee, mais elle ne');
      console.log('  suffit pas a conclure.');
    }
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
