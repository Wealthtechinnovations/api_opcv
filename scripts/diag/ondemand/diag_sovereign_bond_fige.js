/**
 * 6 243 VL comparees a un indice fige depuis novembre 2023 : qui en souffre ?
 *
 * POURQUOI CELUI-LA ET PAS LES AUTRES. J avais signale « cinq indices morts »
 * comme un chantier. En mesurant les VL RATTACHEES (lot CQ), il n en reste
 * qu un qui nuise a une donnee affichee :
 *
 *   indice                    valeurs   derniere      VL rattachees
 *   Sovereign_bond_index         2 609   2023-11-17          6 243
 *   MONIA                        1 000   2026-05-14              0
 *   indice_monetaire_maroc         971   2023-11-17              0
 *   masi_all_shares                  0   —                       0
 *   S&P Tunisia                      0   —                       0
 *
 * Les quatre autres sont des culs-de-sac : reparer leur source ne servirait
 * personne. Celui-ci a une destination, et elle est alimentee avec une valeur
 * qui ne bouge plus depuis pres de deux ans.
 *
 * CE QUE CELA PRODUIT, SI C EST CONFIRME. Un fonds compare a une constante
 * affiche une surperformance qui n est pas une surperformance : c est sa propre
 * performance, moins zero. Le projet nomme deja ce defaut — les controles C6 et
 * C9 cherchent les « indices figes » — mais ils le cherchent sur 90 jours, et un
 * indice arrete depuis 2023 peut passer sous leur radar si plus aucune VL
 * recente ne le porte. C est precisement ce qu il faut verifier ici.
 *
 * LES QUESTIONS, DANS L ORDRE OU ELLES DECIDENT DE LA SUITE :
 *   1. ces 6 243 VL sont-elles ANCIENNES ou RECENTES ? Un indice fige sur des
 *      VL de 2018 ne trompe personne aujourd hui ; sur des VL de ce mois-ci,
 *      il fausse une page en ligne ;
 *   2. quels fonds, quels pays, quelles categories ;
 *   3. la valeur d indRef portee par ces VL est-elle CONSTANTE ? Si elle varie,
 *      l indice n est pas fige pour elles et le probleme est ailleurs ;
 *   4. ces fonds ont-ils un classement ou une surperformance affichee qui en
 *      dependent ;
 *   5. existe-t-il un indice de remplacement vivant pour le meme pays et la
 *      meme categorie ?
 *
 * Ne jamais inventer un benchmark : s il n existe pas de remplacement vivant,
 * la reponse honnete est de retirer la comparaison, pas d en fabriquer une.
 *
 * LECTURE SEULE : SELECT et information_schema. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_sovereign_bond_fige.js
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
const CIBLE = 'sovereign_bond_index';

(async () => {
  console.log('=== Sovereign_bond_index : 6 243 VL, UN INDICE FIGE DEPUIS 2023 ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. Anciennes ou recentes ? ----------------------------------
    console.log('## 1. CES VL SONT-ELLES ANCIENNES OU RECENTES ?');
    const [[b]] = await conn.query(`
      SELECT COUNT(*) AS n, DATE_FORMAT(MIN(date), '%Y-%m-%d') AS d1,
             DATE_FORMAT(MAX(date), '%Y-%m-%d') AS d2
        FROM valorisations WHERE LOWER(COALESCE(indice_name, '')) LIKE ?`, [`%${CIBLE}%`]);
    if (!Number(b.n)) { console.log('  aucune VL ne porte cet indice : constat perime.'); return; }
    const age = Math.round((Date.now() - Date.parse(b.d2)) / 86400000);
    console.log(`  ${b.n} VL | de ${b.d1} a ${b.d2} | la plus recente a ${age} jours`);
    const [parAn] = await conn.query(`
      SELECT YEAR(date) AS an, COUNT(*) AS n FROM valorisations
       WHERE LOWER(COALESCE(indice_name, '')) LIKE ? GROUP BY YEAR(date) ORDER BY an`, [`%${CIBLE}%`]);
    console.log('  ' + parAn.map(r => `${r.an}:${r.n}`).join('  '));
    console.log(age > 365
      ? `  → les VL concernees ont elles-memes ${age} jours. Un indice fige sur des\n`
        + '    donnees anciennes ne trompe personne AUJOURD HUI : la gravite est\n'
        + '    historique, pas courante. A traiter, mais pas en urgence.'
      : '  → des VL RECENTES portent cet indice : une page en ligne compare donc un\n'
        + '    fonds a une constante. Gravite COURANTE.');

    // ---- 2. Quels fonds ----------------------------------------------
    console.log('\n## 2. QUELS FONDS, QUELS PAYS');
    const [fonds] = await conn.query(`
      SELECT f.id, f.nom_fond, f.pays, f.categorie_national, f.active, COUNT(*) AS n,
             DATE_FORMAT(MAX(v.date), '%Y-%m-%d') AS derniere
        FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
       WHERE LOWER(COALESCE(v.indice_name, '')) LIKE ?
       GROUP BY f.id, f.nom_fond, f.pays, f.categorie_national, f.active
       ORDER BY n DESC LIMIT 12`, [`%${CIBLE}%`]);
    console.log(`  ${'fonds'.padStart(6)} ${'pays'.padEnd(9)}${'VL'.padStart(6)} ${'act'.padEnd(4)}`
      + `${'derniere'.padEnd(12)}nom`);
    for (const r of fonds) {
      console.log(`  ${String(r.id).padStart(6)} ${String(r.pays || '?').slice(0, 8).padEnd(9)}`
        + `${String(r.n).padStart(6)} ${String(r.active).padEnd(4)}${String(r.derniere).padEnd(12)}`
        + `${String(r.nom_fond || '?').slice(0, 34)}`);
    }
    const [[tot]] = await conn.query(`
      SELECT COUNT(DISTINCT v.fund_id) AS fonds, SUM(f.active = 1) AS lignesActives
        FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
       WHERE LOWER(COALESCE(v.indice_name, '')) LIKE ?`, [`%${CIBLE}%`]);
    console.log(`\n  ${tot.fonds} fonds concernes | ${tot.lignesActives} des VL portent sur un fonds ACTIF`);

    // ---- 3. L indRef porte est-il vraiment constant ? ----------------
    console.log('\n## 3. LA VALEUR D INDICE PORTEE EST-ELLE VRAIMENT CONSTANTE ?');
    console.log('  Un indice « fige » en source peut tout de meme avoir ete propage avec');
    console.log('  des valeurs variables. Sans ce test, le constat n est qu une deduction.');
    const [[v]] = await conn.query(`
      SELECT COUNT(DISTINCT CAST(indRef AS CHAR)) AS distinctes,
             MIN(indRef) AS mn, MAX(indRef) AS mx,
             SUM(indRef IS NULL OR indRef = 0) AS vides
        FROM valorisations WHERE LOWER(COALESCE(indice_name, '')) LIKE ?`, [`%${CIBLE}%`]);
    console.log(`  ${v.distinctes} valeur(s) distincte(s) d indRef | de ${v.mn} a ${v.mx}`
      + ` | ${v.vides} vide(s) ou nulle(s)`);
    console.log(Number(v.distinctes) <= 2
      ? '  → CONSTANTE CONFIRMEE : ces fonds sont compares a un nombre fixe.\n'
        + '    Toute surperformance affichee est leur propre performance, moins zero.'
      : `  → l indRef VARIE (${v.distinctes} valeurs) : l indice n est pas fige pour ces\n`
        + '    VL. Mon constat « fige » portait sur la table source, pas sur ce qui a ete\n'
        + '    propage. Le probleme est donc ailleurs, et il faut le redefinir.');

    // ---- 4. Un remplacement vivant existe-t-il ? ---------------------
    console.log('\n## 4. EXISTE-T-IL UN INDICE VIVANT POUR LES MEMES PAYS ?');
    const pays = [...new Set(fonds.map(f => f.pays).filter(Boolean))];
    console.log(`  pays concernes : ${pays.join(', ') || '(aucun)'}`);
    const [vivants] = await conn.query(`
      SELECT nom_indice, COUNT(*) AS n, DATE_FORMAT(MAX(date), '%Y-%m-%d') AS derniere
        FROM indice_references
       GROUP BY nom_indice HAVING MAX(date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       ORDER BY derniere DESC`);
    console.log(`  indices vivants (moins de 30 jours) : ${vivants.length}`);
    for (const r of vivants) {
      console.log(`    ${String(r.nom_indice).slice(0, 34).padEnd(36)}${String(r.n).padStart(7)} valeurs`
        + `  ${r.derniere}`);
    }
    console.log('\n  NE JAMAIS INVENTER UN BENCHMARK. Si aucun indice vivant ne correspond au');
    console.log('  pays ET a la categorie de ces fonds, la reponse honnete est de RETIRER la');
    console.log('  comparaison, pas d en fabriquer une. Un fonds sans benchmark declare est');
    console.log('  une information exacte ; un fonds compare a une constante est une erreur.');

    // ---- 5. Pourquoi les controles C6/C9 ne l ont pas attrape --------
    console.log('\n## 5. POURQUOI LES CONTROLES EXISTANTS NE L ONT PAS SIGNALE');
    const [[recent]] = await conn.query(`
      SELECT COUNT(*) AS n FROM valorisations
       WHERE LOWER(COALESCE(indice_name, '')) LIKE ?
         AND date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)`, [`%${CIBLE}%`]);
    console.log(`  VL portant cet indice sur les 90 derniers jours : ${recent.n}`);
    console.log(Number(recent.n) === 0
      ? '  → ZERO. Les controles C6 et C9 cherchent les indices figes sur une fenetre\n'
        + '    de 90 jours : aucune VL recente ne portant cet indice, il sort de leur\n'
        + '    perimetre et ils le declarent [OK] en toute bonne foi. Ce n est pas un\n'
        + '    defaut de controle mais une LIMITE DE PERIMETRE, qu il faut ecrire dans\n'
        + '    le script plutot que de laisser croire a une couverture complete.'
      : `  → ${recent.n} VL recentes : les controles DEVRAIENT le voir. S ils le declarent\n`
        + '    [OK], leur critere est mal calibre et doit etre corrige — jamais desactive.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
