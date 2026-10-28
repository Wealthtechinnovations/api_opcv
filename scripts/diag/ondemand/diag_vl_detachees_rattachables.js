/**
 * Les 39 785 VL detachees sont-elles RECUPERABLES, ou perdues ?
 *
 * CE QUI EST DEJA MESURE (2026-10-28 05:26 UTC). `valorisations` porte 39 785
 * lignes rattachees a aucun fonds, soit 3,78 % de la table, sous deux formes
 * qui ne se reparent pas de la meme facon :
 *
 *   18 087  `fund_id IS NULL`                      — n ont jamais eu de fonds
 *   21 698  `fund_id` vers un fonds inexistant     — en ont perdu un
 *
 * Elles portent des VALEURS REELLES (1,038 a 10 981), aucune n est vide. Elles
 * s etalent sur onze ans, 2012 a 2024, environ 2 000 par an depuis 2017 : ce
 * n est pas un incident, c est un chemin d ecriture qui a laisse passer des
 * lignes sans fonds pendant des annees. Impact affichage NUL (toute jointure
 * sur `fond_investissements` les exclut), impact volumetrie REEL.
 *
 * CE QUI N A PAS ENCORE ETE INSTRUIT, et c est la seule question qui decide de
 * leur sort : peut-on retrouver a quel fonds elles appartenaient ?
 *
 * Pour les 18 087 a NULL, une seule piste existait et elle est morte : la
 * colonne `code_ISIN` est remplie sur 18 015 d entre elles, mais ne contient
 * que 14 valeurs distinctes, et ce sont des DATES EXCEL ABIMEES — « févr-03 »,
 * « mai-14 », « juil-14 ». C est la signature d un import tableur aux colonnes
 * DESALIGNEES : la date s est ecrite dans la colonne ISIN, et le fonds s est
 * probablement perdu dans le meme decalage. Ce script verifie si une autre
 * colonne porte une trace exploitable.
 *
 * Pour les 21 698 orphelines, la piste est bien meilleure et personne ne l a
 * suivie : elles PORTENT un `fund_id`. Si ces identifiants apparaissent encore
 * dans `performences`, `classementfonds` ou ailleurs avec un nom de fonds, le
 * rattachement est RECONSTITUABLE — le fonds a ete supprime, pas sa trace.
 *
 * TROIS SORTS POSSIBLES, et ce script dit lequel s applique a quelle part :
 *   (R) RATTACHABLES : un nom ou un identifiant exploitable subsiste ;
 *   (A) ARCHIVABLES : donnees reelles, origine irrecuperable. A sortir de la
 *       table de travail sans les detruire, pour que les comptes de volumetrie
 *       cessent de les inclure en silence ;
 *   (S) SUPPRIMABLES : ni valeur, ni trace. Aucune n entre ici d apres la
 *       mesure du 05:26 — toutes portent une valeur.
 *
 * Ce script ne decide rien. Le sort de onze ans de donnees financieres revient
 * au proprietaire.
 *
 * LECTURE SEULE : SELECT et information_schema. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_vl_detachees_rattachables.js
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

/** Resoudre une colonne dans le schema, jamais la supposer. Lecon de `datejour` et d `indice`. */
const colonne = async (conn, table, candidats, motif) => {
  const [cols] = await conn.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [BASE, table]);
  const noms = cols.map(c => c.COLUMN_NAME);
  for (const c of candidats) if (noms.includes(c)) return c;
  return noms.find(n => motif.test(n)) || null;
};

(async () => {
  console.log('=== LES VL DETACHEES SONT-ELLES RECUPERABLES ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // =================================================================
    // A. LES 21 698 QUI PORTENT UN fund_id — la meilleure piste
    // =================================================================
    console.log('## A. CELLES QUI PORTENT UN `fund_id` VERS UN FONDS DISPARU');
    const [[cnt]] = await conn.query(`
      SELECT COUNT(*) AS n, COUNT(DISTINCT v.fund_id) AS fonds
        FROM valorisations v
       WHERE v.fund_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM fond_investissements f WHERE f.id = v.fund_id)`);
    console.log(`  ${cnt.n} ligne(s), reparties sur ${cnt.fonds} identifiant(s) de fonds disparus.`);
    if (Number(cnt.n) === 0) {
      console.log('  → plus aucune : constat perime.');
    } else {
      const [top] = await conn.query(`
        SELECT v.fund_id, COUNT(*) AS n,
               DATE_FORMAT(MIN(v.date), '%Y-%m-%d') AS d1,
               DATE_FORMAT(MAX(v.date), '%Y-%m-%d') AS d2
          FROM valorisations v
         WHERE v.fund_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM fond_investissements f WHERE f.id = v.fund_id)
         GROUP BY v.fund_id ORDER BY n DESC LIMIT 10`);
      console.log(`\n  Les 10 identifiants les plus charges :`);
      console.log(`  ${'fund_id'.padStart(8)}${'VL'.padStart(8)}  periode`);
      for (const r of top) {
        console.log(`  ${String(r.fund_id).padStart(8)}${String(r.n).padStart(8)}  ${r.d1} → ${r.d2}`);
      }

      // Leur trace subsiste-t-elle ailleurs, avec un NOM ?
      console.log('\n  CES IDENTIFIANTS LAISSENT-ILS UNE TRACE NOMMEE AILLEURS ?');
      const ailleurs = [
        ['performences', ['fond_id', 'fund_id'], ['fond', 'nom_fond', 'libelle']],
        ['classementfonds', ['fond_id', 'fund_id'], ['fond', 'nom_fond', 'libelle']],
        ['performences_eurs', ['fond_id', 'fund_id'], ['fond', 'nom_fond', 'libelle']],
      ];
      let rattachables = 0;
      for (const [t, cles, noms] of ailleurs) {
        const cle = await colonne(conn, t, cles, /fond_?id|fund_?id/i);
        const nom = await colonne(conn, t, noms, /nom|fond|libel/i);
        if (!cle) { console.log(`  ${t.padEnd(20)} pas de colonne d identifiant : non exploitable`); continue; }
        try {
          const [[r]] = await conn.query(`
            SELECT COUNT(DISTINCT t.\`${cle}\`) AS ids
              FROM \`${t}\` t
             WHERE t.\`${cle}\` IN (
                     SELECT DISTINCT v.fund_id FROM valorisations v
                      WHERE v.fund_id IS NOT NULL
                        AND NOT EXISTS (SELECT 1 FROM fond_investissements f WHERE f.id = v.fund_id))`);
          console.log(`  ${t.padEnd(20)} ${String(r.ids).padStart(5)} identifiant(s) retrouve(s)`
            + `${nom ? ` | nom disponible dans \`${nom}\`` : ' | AUCUNE colonne de nom'}`);
          rattachables = Math.max(rattachables, Number(r.ids));
          if (nom && Number(r.ids) > 0) {
            const [ex] = await conn.query(`
              SELECT DISTINCT t.\`${cle}\` AS id, t.\`${nom}\` AS nom FROM \`${t}\` t
               WHERE t.\`${cle}\` IN (
                       SELECT DISTINCT v.fund_id FROM valorisations v
                        WHERE v.fund_id IS NOT NULL
                          AND NOT EXISTS (SELECT 1 FROM fond_investissements f WHERE f.id = v.fund_id))
                 AND t.\`${nom}\` IS NOT NULL AND TRIM(t.\`${nom}\`) <> ''
               LIMIT 6`);
            for (const e of ex) console.log(`  ${' '.repeat(20)}   ${String(e.id).padStart(6)} → ${String(e.nom).slice(0, 44)}`);
          }
        } catch (e) { console.log(`  ${t.padEnd(20)} illisible : ${e.message.slice(0, 50)}`); }
      }
      console.log(rattachables > 0
        ? `\n  → (R) RATTACHABLES. ${rattachables} identifiant(s) sur ${cnt.fonds} laissent une\n`
          + '    trace nommee dans une autre table. Le fonds a ete supprime, PAS sa trace :\n'
          + '    le rattachement est reconstituable, par recreation du fonds ou par\n'
          + '    reaffectation vers un fonds existant portant le meme nom.'
        : '\n  → aucune trace nommee ailleurs : ces identifiants ne renvoient a rien.\n'
          + '    (A) ARCHIVABLES au mieux.');
    }

    // =================================================================
    // B. LES 18 087 A NULL — la piste ISIN est morte, en reste-t-il une ?
    // =================================================================
    console.log('\n\n## B. CELLES A `fund_id IS NULL`');
    const [[nul]] = await conn.query(
      'SELECT COUNT(*) AS n FROM valorisations WHERE fund_id IS NULL');
    console.log(`  ${nul.n} ligne(s).`);
    if (Number(nul.n) > 0) {
      console.log('\n  Ce que porte CHAQUE colonne texte de ces lignes :');
      const [cols] = await conn.query(`
        SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'valorisations'
           AND DATA_TYPE IN ('varchar','char','text','tinytext','mediumtext')
         ORDER BY ORDINAL_POSITION`, [BASE]);
      let piste = null;
      for (const c of cols) {
        const n = c.COLUMN_NAME;
        try {
          const [[r]] = await conn.query(`
            SELECT SUM(\`${n}\` IS NOT NULL AND TRIM(\`${n}\`) <> '') AS remplies,
                   COUNT(DISTINCT \`${n}\`) AS distinctes
              FROM valorisations WHERE fund_id IS NULL`);
          const remplies = Number(r.remplies || 0);
          const dist = Number(r.distinctes || 0);
          let verdict = '';
          if (remplies === 0) verdict = 'vide';
          else if (dist <= 20) verdict = `${dist} valeur(s) distincte(s) — trop peu pour identifier un fonds`;
          else { verdict = `${dist} valeur(s) distinctes — PISTE EXPLOITABLE`; piste = piste || n; }
          console.log(`  ${n.padEnd(22)} ${String(remplies).padStart(7)} remplie(s)  ${verdict}`);
        } catch { /* colonne illisible, ignoree */ }
      }
      console.log(piste
        ? `\n  → (R) PISTE : la colonne \`${piste}\` porte assez de valeurs distinctes pour\n`
          + '    tenter un appariement. A instruire avant toute decision.'
        : '\n  → (A) ARCHIVABLES. Aucune colonne ne porte assez d information pour\n'
          + '    identifier un fonds. La piste `code_ISIN` est morte : 14 valeurs\n'
          + '    distinctes, et ce sont des dates Excel abimees — « févr-03 », « mai-14 ».\n'
          + '    Signature d un import tableur aux colonnes DESALIGNEES : la date s est\n'
          + '    ecrite dans la colonne ISIN, et le fonds s est perdu dans le meme\n'
          + '    decalage. Ces VL sont des donnees reelles d origine irrecuperable.');
    }

    // ---- Ce que cela coute de ne rien faire -------------------------
    console.log('\n## CE QUE COUTE L INACTION');
    const [[t]] = await conn.query('SELECT COUNT(*) AS n FROM valorisations');
    console.log(`  Aucun chiffre affiche a l utilisateur n est faux : toute requete joignant`);
    console.log(`  \`fond_investissements\` exclut ces lignes.`);
    console.log(`  Mais tout COUNT(*) brut les inclut. La table annonce ${t.n} VL ;`);
    console.log(`  ${Number(cnt.n) + Number(nul.n)} ne se rattachent a rien, soit`
      + ` ${((Number(cnt.n) + Number(nul.n)) / Number(t.n) * 100).toFixed(2)} %.`);
    console.log('  Tout document du projet citant une volumetrie les compte sans le dire —');
    console.log('  y compris `PRODUCTION_STATE.json` et `ROADMAP.md`.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
