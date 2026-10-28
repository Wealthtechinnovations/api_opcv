/**
 * `Tunindex` contre `TUNINDEX`, et MONIA sans pays : la triple copie
 * d INDEX_CONFIG produit-elle des donnees fausses, ou seulement de la dette ?
 *
 * CE QUI A ETE LU DANS LE CODE, le 2026-10-28. `INDEX_CONFIG` existe en trois
 * exemplaires non synchronises — c est l item P2-06 du backlog, qui l annoncait
 * sans jamais le chiffrer :
 *
 *   scripts/scraper/propagate_indref_range.js   4 indices
 *   scripts/scraper/scrape_indices_daily.js     5 indices
 *   scripts/import/import_indices_excel.js      5 indices
 *
 * Deux divergences, et elles ne sont pas de meme nature :
 *
 *   (1) CASSE DE L IDENTIFIANT. Le scraper et le propagateur portent
 *       `id_indice: 'Tunindex'`. L import Excel porte `id_indice: 'TUNINDEX'`.
 *       Si cet identifiant sert de cle d ecriture ou de lecture, les deux
 *       chemins travaillent sous DEUX IDENTITES pour le meme indice. Selon la
 *       collation de la colonne, MySQL peut les confondre (collation `_ci`,
 *       insensible a la casse) ou les separer (`_bin` ou `_cs`). Ce script le
 *       demande a la base au lieu de le supposer : la collation decide si cette
 *       divergence est inoffensive ou si elle a cree deux series parallelles.
 *
 *   (2) MONIA EST ABSENT DU PROPAGATEUR. Il est scrape et importe, mais jamais
 *       propage vers les VL. Et dans les deux copies ou il figure, son `pays`
 *       est un tableau VIDE — alors que tous les autres indices listent leurs
 *       pays. Un indice sans pays ne peut s attacher a aucun fonds : la
 *       propagation n a aucune ligne a viser. MONIA est justement l un des cinq
 *       indices morts mesures cette nuit (167 jours sans valeur nouvelle).
 *       L hypothese a tester : MONIA n est pas mort faute de source, il est
 *       mort faute de DESTINATION.
 *
 * MA MESURE PRECEDENTE A ECHOUE, et c est pourquoi ce script existe. J avais
 * compare les trois copies par expression reguliere et conclu « 0 indice
 * divergent ». Mais toutes mes cellules affichaient `?/?` : l extraction
 * n avait rien capture, et mon « 0 divergent » etait un artefact d echec, pas
 * une mesure. Un comparateur qui ne lit rien trouve toujours tout identique.
 * Les blocs ont ensuite ete lus en entier, a l oeil, et les deux divergences
 * ci-dessus sont apparues immediatement.
 *
 * LECTURE SEULE : SELECT et information_schema. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_index_config_divergence.js
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
  console.log('=== INDEX_CONFIG EN TROIS COPIES : DETTE, OU DONNEE FAUSSE ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 0. Ou vivent les indices, et sous quelle collation ? --------
    const [tables] = await conn.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE '%indi%'`, [BASE]);
    console.log(`## 0. TABLES D INDICES : ${tables.map(t => t.TABLE_NAME).join(', ') || '(aucune)'}`);
    const table = tables.map(t => t.TABLE_NAME).includes('indice_references')
      ? 'indice_references' : (tables[0] && tables[0].TABLE_NAME);
    if (!table) { console.log('  aucune table d indices : rien a mesurer.'); return; }
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLLATION_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [BASE, table]);
    const colId = cols.find(c => /^(id_indice|indice|code_indice|nom_indice|libelle)$/i.test(c.COLUMN_NAME))
      || cols.find(c => /indice|libelle|nom/i.test(c.COLUMN_NAME));
    console.log(`  table retenue : \`${table}\` | colonne d identite : \`${colId && colId.COLUMN_NAME}\``);
    if (colId) {
      const coll = colId.COLLATION_NAME || '(non textuelle)';
      const insensible = /_ci$/.test(String(coll));
      console.log(`  collation : ${coll}`);
      console.log(insensible
        ? '  → collation INSENSIBLE a la casse : MySQL confond `Tunindex` et `TUNINDEX`.\n'
          + '    La divergence de casse n a donc PAS pu creer deux series separees.\n'
          + '    Elle reste une dette, mais elle n a pas produit de donnee fausse.'
        : '  → collation SENSIBLE a la casse : `Tunindex` et `TUNINDEX` sont DEUX\n'
          + '    identites distinctes. Les deux chemins d ecriture ont pu creer deux\n'
          + '    series parallelles pour le meme indice. A verifier ci-dessous.');
    }

    // ---- 1. Les deux casses coexistent-elles ? -----------------------
    console.log('\n## 1. `Tunindex` ET `TUNINDEX` COEXISTENT-ILS EN BASE ?');
    const c = colId.COLUMN_NAME;
    const [casses] = await conn.query(`
      SELECT CAST(\`${c}\` AS BINARY) AS exact, COUNT(*) AS n,
             DATE_FORMAT(MAX(date), '%Y-%m-%d') AS derniere
        FROM \`${table}\`
       WHERE LOWER(\`${c}\`) IN ('tunindex', 'masi', 'brvm', 'nse', 'monia',
                                 'brvm composite', 'nse all share')
       GROUP BY CAST(\`${c}\` AS BINARY) ORDER BY n DESC`);
    console.log(`  ${'valeur exacte (casse respectee)'.padEnd(36)}${'lignes'.padStart(8)}  derniere`);
    for (const r of casses) {
      console.log(`  ${String(r.exact).slice(0, 35).padEnd(36)}${String(r.n).padStart(8)}`
        + `  ${r.derniere || '—'}`);
    }
    const groupes = {};
    for (const r of casses) {
      const k = String(r.exact).toLowerCase();
      groupes[k] = (groupes[k] || 0) + 1;
    }
    const doubles = Object.entries(groupes).filter(([, n]) => n > 1);
    console.log(doubles.length
      ? `\n  → ${doubles.length} indice(s) existent sous PLUSIEURS casses : `
        + `${doubles.map(([k]) => k).join(', ')}.\n`
        + '    La divergence des trois copies a bien produit des series separees.'
      : '\n  → chaque indice n existe que sous une seule casse : la divergence des\n'
        + '    trois copies n a pas (encore) produit de serie parallele.');

    // ---- 2. MONIA : mort faute de source, ou faute de destination ? --
    console.log('\n## 2. MONIA — mort faute de SOURCE, ou faute de DESTINATION ?');
    const [[monia]] = await conn.query(`
      SELECT COUNT(*) AS n, DATE_FORMAT(MAX(date), '%Y-%m-%d') AS derniere,
             DATE_FORMAT(MIN(date), '%Y-%m-%d') AS premiere
        FROM \`${table}\` WHERE LOWER(\`${c}\`) = 'monia'`);
    const age = monia.derniere
      ? Math.round((Date.now() - Date.parse(monia.derniere)) / 86400000) : null;
    console.log(`  dans \`${table}\` : ${monia.n} valeur(s), de ${monia.premiere || '—'}`
      + ` a ${monia.derniere || '—'}${age === null ? '' : ` (age ${age} j)`}`);
    const [[attache]] = await conn.query(`
      SELECT COUNT(*) AS n FROM valorisations
       WHERE LOWER(COALESCE(indice, '')) LIKE '%monia%'`);
    console.log(`  VL portant MONIA comme indice : ${attache.n}`);
    if (Number(monia.n) > 0 && Number(attache.n) === 0) {
      console.log('  → HYPOTHESE CONFIRMEE. La SOURCE a produit des valeurs, mais AUCUNE VL');
      console.log('    ne porte MONIA. Le propagateur ne le connait pas, et son `pays` est');
      console.log('    un tableau vide dans les deux copies ou il figure : la propagation');
      console.log('    n a aucune ligne a viser. MONIA n est pas mort faute de source — il');
      console.log('    est mort faute de DESTINATION. Le remede n est pas de reparer un');
      console.log('    scraper qui marche, c est de lui donner un pays et de l ajouter au');
      console.log('    propagateur.');
    } else if (Number(attache.n) > 0) {
      console.log(`  → ${attache.n} VL portent MONIA : il EST propage malgre son absence du`);
      console.log('    propagateur. Un autre chemin l attache — a identifier.');
    } else {
      console.log('  → aucune valeur en source NI en VL : chantier a reprendre d un bout a l autre.');
    }

    // ---- 3. Les cinq indices morts sont-ils tous sans destination ? --
    console.log('\n## 3. LES CINQ INDICES MORTS ONT-ILS UNE DESTINATION ?');
    console.log('  Un indice frais mais rattache a zero VL est aussi inutile qu un indice mort.');
    const morts = ['monia', 'masi_all_shares', 'sovereign_bond_index',
      'indice_monetaire_maroc', 's&p tunisia'];
    console.log(`  ${'indice'.padEnd(32)}${'valeurs'.padStart(9)}${'derniere'.padStart(12)}${'VL rattachees'.padStart(15)}`);
    for (const m of morts) {
      const [[src]] = await conn.query(`
        SELECT COUNT(*) AS n, DATE_FORMAT(MAX(date), '%Y-%m-%d') AS d
          FROM \`${table}\` WHERE LOWER(\`${c}\`) LIKE ?`, [`%${m}%`]);
      const [[dst]] = await conn.query(`
        SELECT COUNT(*) AS n FROM valorisations
         WHERE LOWER(COALESCE(indice, '')) LIKE ?`, [`%${m}%`]);
      console.log(`  ${m.padEnd(32)}${String(src.n).padStart(9)}${String(src.d || '—').padStart(12)}`
        + `${String(dst.n).padStart(15)}`);
    }
    console.log('\n  Lire la derniere colonne avant de reparer une source : un indice a zero VL');
    console.log('  rattachee ne manque a personne tant qu il n a pas de destination.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
