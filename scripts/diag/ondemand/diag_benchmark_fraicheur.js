/**
 * Le niveau de benchmark affiche est-il celui du jour, ou une recopie ?
 * Et la source nigeriane publie-t-elle encore du neuf ?
 *
 * POURQUOI. Deux angles morts, signales le 2026-10-04 par le proprietaire du
 * projet, que AUCUN controle existant ne couvre :
 *
 *   1. C6 et C9 ne verifient qu une chose : `indRef` n est pas NULL. Ils ne
 *      disent rien de sa FRAICHEUR. Un benchmark recopie de la veille, ou fige
 *      depuis des semaines, passe pour bon dans les deux controles. Un fonds
 *      compare a un indice immobile affiche une surperformance qui n existe
 *      pas : c est un faux plus dangereux qu une case vide, parce qu il a
 *      l apparence d une donnee.
 *
 *   2. C4.NIGERIA mesure l age de la derniere VL (23 j au 2026-10-04) sans
 *      jamais demander si la SOURCE a publie quelque chose de plus recent. Les
 *      deux causes possibles n appellent pas le meme correctif, et on ne peut
 *      pas les distinguer sans regarder le fichier d extraction :
 *        - la SEC ne publie plus : rien a corriger chez nous, le budget de
 *          fraicheur est mal calibre pour la cadence reelle de la source ;
 *        - la SEC publie et l import n insere pas : c est notre chaine.
 *      Le journal du cron montre une extraction qui REUSSIT le 28/09
 *      (`sec_ng_latest.csv`, 8170 lignes) alors que la derniere VL en base est
 *      du 11/09. Cet ecart est la mesure a faire.
 *
 * Ce que ce script NE fait pas : il ne corrige rien, ne recalcule rien,
 * n insere rien. Il repond par des chiffres et s arrete.
 *
 * LECTURE SEULE — uniquement des SELECT et une lecture de fichier.
 *
 * USAGE  node scripts/diag/ondemand/diag_benchmark_fraicheur.js [chemin_csv]
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { normalizeNameForMatch, lireCSV } = require('../../../src/lib/sec_csv');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const CSV = process.argv[2] || path.resolve(__dirname, '../../../sec_ng_latest.csv');

// Un fonds dont `indRef` ne prend qu UNE valeur sur au moins ce nombre de dates
// distinctes n est pas compare a un indice : il est compare a une constante.
const DATES_MIN_POUR_CONCLURE = 5;

const p = k => String(k).padStart(2, '0');
// mysql2 rend des objets Date, le CSV des chaines. `String(new Date(...))`
// donnerait « Fri Aug 29 2026 », dont les dix premiers caracteres ne peuvent
// correspondre a aucune cle ISO — l erreur a deja fait conclure a 100 % de
// dates absentes dans un diagnostic voisin.
const j = x => {
  if (!x) return '?';
  if (x instanceof Date) return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  return String(x).slice(0, 10);
};

(async () => {
  const conn = await mysql.createConnection(DB);
  try {
    console.log('=== FRAICHEUR DU BENCHMARK ET VITALITE DE LA SOURCE NIGERIANE ===');
    console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

    // ------------------------------------------------------------------
    // A. Jusqu a quelle date le benchmark est-il renseigne, par pays ?
    //    Un ecart entre « derniere VL » et « derniere VL AVEC benchmark »
    //    est exactement ce que C6 et C9 ne peuvent pas voir.
    // ------------------------------------------------------------------
    console.log('## A. Derniere VL vs derniere VL portant un benchmark\n');
    const [a] = await conn.query(`
      SELECT f.pays,
             MAX(v.date)                                        AS vl_max,
             MAX(CASE WHEN v.indRef IS NOT NULL THEN v.date END) AS indref_max
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
       WHERE v.value > 0
       GROUP BY f.pays
       ORDER BY f.pays`);
    console.log('  pays       derniere VL   dernier benchmark   retard du benchmark');
    console.log('  ---------- ------------  -----------------   -------------------');
    for (const r of a) {
      const vl = j(r.vl_max), ir = j(r.indref_max);
      let retard = '?';
      if (vl !== '?' && ir !== '?') {
        retard = Math.round((new Date(vl) - new Date(ir)) / 86400000) + ' j';
      } else if (ir === '?') {
        retard = 'JAMAIS AUCUN';
      }
      console.log(`  ${String(r.pays).padEnd(10)} ${vl.padEnd(13)} ${ir.padEnd(19)} ${retard}`);
    }

    // ------------------------------------------------------------------
    // B. Le benchmark bouge-t-il, ou est-il recopie ?
    //    Mesure : sur 90 jours, par fonds, nombre de dates distinctes et
    //    nombre de valeurs `indRef` distinctes. Egalite a 1 valeur pour
    //    plusieurs dates = constante, pas indice.
    // ------------------------------------------------------------------
    console.log('\n## B. Le niveau du benchmark varie-t-il ? (90 derniers jours)\n');
    const [b] = await conn.query(`
      SELECT f.pays,
             COUNT(*)                                                       AS fonds,
             SUM(CASE WHEN x.vals_dist = 1 AND x.dates_dist >= ? THEN 1 ELSE 0 END) AS fonds_figes,
             SUM(CASE WHEN x.vals_dist > 1 THEN 1 ELSE 0 END)               AS fonds_vivants
        FROM (
          SELECT v2.fund_id,
                 COUNT(DISTINCT v2.date)   AS dates_dist,
                 COUNT(DISTINCT v2.indRef) AS vals_dist
            FROM valorisations v2
           WHERE v2.date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
             AND v2.indRef IS NOT NULL
           GROUP BY v2.fund_id
        ) x
        JOIN fond_investissements f ON f.id = x.fund_id
       GROUP BY f.pays
       ORDER BY f.pays`, [DATES_MIN_POUR_CONCLURE]);
    if (!b.length) {
      console.log('  Aucun fonds avec benchmark sur 90 jours — rien a mesurer.');
    } else {
      console.log('  pays       fonds avec benchmark   dont indice FIGE   dont indice qui varie');
      console.log('  ---------- --------------------   ----------------   ---------------------');
      for (const r of b) {
        console.log(`  ${String(r.pays).padEnd(10)} ${String(r.fonds).padEnd(20)} ${String(r.fonds_figes).padEnd(18)} ${r.fonds_vivants}`);
      }
      console.log('\n  Un indice FIGE signifie : une seule valeur d indRef sur au moins');
      console.log(`  ${DATES_MIN_POUR_CONCLURE} dates distinctes. Le fonds est alors compare a une constante,`);
      console.log('  et sa surperformance affichee est un artefact. C6 et C9 le notent [OK].');
    }

    // ------------------------------------------------------------------
    // C. La table source des indices est-elle alimentee ?
    //    `cron_indices_daily.sh` tourne a 18h30 du lundi au vendredi.
    // ------------------------------------------------------------------
    console.log('\n## C. Table source `indice_references` — l import des indices vit-il ?\n');
    // Combien de VL se rattachent effectivement a chaque indice ? C est la
    // question qui dit si un indice est un BENCHMARK ou une simple statistique.
    // Le depot documente deja le cas : « MONIA exclu (pays: []) : c est un taux,
    // non propage aux fonds » (propagate_indref_range.js). Un controle de
    // fraicheur applique a un indice que rien ne consomme crie sans enjeu ; un
    // critere pris dans les DONNEES vaut mieux qu une troisieme copie du
    // mapping pays → indice, qui existe deja en deux exemplaires dans le code.
    const [rattachement] = await conn.query(`
      SELECT COALESCE(NULLIF(TRIM(v.indice_name), ''), NULLIF(TRIM(v.ID_indice), ''), '(aucun)') AS indice,
             COUNT(*) AS vl,
             MAX(v.date) AS derniere_vl
        FROM valorisations v
       GROUP BY 1
       ORDER BY vl DESC
       LIMIT 15`);
    console.log('  Rattachement reel des VL a un indice :');
    console.log('    libelle porte par la VL              VL        derniere VL');
    console.log('    -----------------------------------  --------  -----------');
    for (const r of rattachement) {
      console.log(`    ${String(r.indice).slice(0, 35).padEnd(35)}  ${String(r.vl).padEnd(8)}  ${j(r.derniere_vl)}`);
    }
    console.log('');

    const [c] = await conn.query(`
      SELECT x.indice, x.derniere, x.total, x.sur_30j,
             (SELECT i2.valeur FROM indice_references i2
               WHERE COALESCE(i2.nom_indice, i2.id_indice) = x.indice
                 AND i2.date = x.derniere
               LIMIT 1) AS valeur
        FROM (
          SELECT COALESCE(i.nom_indice, i.id_indice) AS indice,
                 MAX(i.date)                         AS derniere,
                 COUNT(*)                            AS total,
                 SUM(CASE WHEN i.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS sur_30j
            FROM indice_references i
           GROUP BY COALESCE(i.nom_indice, i.id_indice)
        ) x
       ORDER BY x.derniere DESC`);
    if (!c.length) {
      console.log('  Table vide.');
    } else {
      // La VALEUR de la derniere observation est indispensable : une source de
      // remplacement doit etre coherente avec la serie deja stockee, sinon on
      // raccorde deux echelles differentes et le benchmark devient faux.
      console.log('  indice                          derniere date     valeur          age     lignes/30j   total');
      console.log('  ------------------------------  --------------    ------------    -----   ----------   -----');
      for (const r of c) {
        const d = j(r.derniere);
        const age = d === '?' ? '?' : Math.round((Date.now() - new Date(d)) / 86400000) + ' j';
        const v = r.valeur === null || r.valeur === undefined ? '-' : Number(r.valeur).toFixed(2);
        console.log(`  ${String(r.indice).slice(0, 30).padEnd(30)}  ${d.padEnd(14)}    ${v.padEnd(12)}    ${String(age).padEnd(5)}   ${String(r.sur_30j).padEnd(10)}   ${r.total}`);
      }
    }

    // ------------------------------------------------------------------
    // D. Maroc : datation de la rupture. C9.MAROC mesure 0,0 % sur 30 jours
    //    sans dire QUAND l ecriture d indRef a cesse.
    // ------------------------------------------------------------------
    console.log('\n## D. Maroc — a quelle semaine l ecriture du benchmark a-t-elle cesse ?\n');
    const [d] = await conn.query(`
      SELECT YEARWEEK(v.date, 3) AS sem,
             MIN(v.date)         AS debut,
             COUNT(*)            AS vl,
             SUM(CASE WHEN v.indRef IS NOT NULL THEN 1 ELSE 0 END) AS avec
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
       WHERE LOWER(f.pays) = 'maroc'
         AND v.date >= DATE_SUB(CURDATE(), INTERVAL 18 WEEK)
       GROUP BY YEARWEEK(v.date, 3)
       ORDER BY sem`);
    console.log('  semaine du    VL      avec benchmark   couverture');
    console.log('  ----------    -----   --------------   ----------');
    for (const r of d) {
      const pct = Number(r.vl) ? (100 * Number(r.avec) / Number(r.vl)).toFixed(1) + ' %' : '-';
      console.log(`  ${j(r.debut).padEnd(13)} ${String(r.vl).padEnd(7)} ${String(r.avec).padEnd(16)} ${pct}`);
    }

    // ------------------------------------------------------------------
    // E. Nigeria : la source publie-t-elle plus recent que la base ?
    // ------------------------------------------------------------------
    console.log('\n## E. Nigeria — la SEC publie-t-elle plus recent que notre base ?\n');
    const [[ngMax]] = await conn.query(`
      SELECT MAX(v.date) AS vl_max
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
       WHERE LOWER(f.pays) = 'nigeria' AND v.value > 0`);
    const baseMax = j(ngMax && ngMax.vl_max);
    console.log(`  Derniere VL Nigeria en base : ${baseMax}`);

    if (!fs.existsSync(CSV)) {
      console.log(`  Fichier d extraction ABSENT : ${CSV}`);
      console.log('  Conclusion impossible — ne pas conclure que la source est muette.');
    } else {
      const st = fs.statSync(CSV);
      console.log(`  Fichier lu : ${CSV}`);
      console.log(`  ${st.size} o, modifie le ${j(st.mtime)} ${p(st.mtime.getHours())}:${p(st.mtime.getMinutes())}\n`);

      const { lignes } = lireCSV(CSV);
      const parDate = new Map();
      let illisibles = 0;
      for (const l of lignes) {
        const date = j(l.valuation_date);
        const prix = parseFloat(l.vl_price);
        if (date === '?' || !Number.isFinite(prix) || prix <= 0) { illisibles++; continue; }
        parDate.set(date, (parDate.get(date) || 0) + 1);
      }
      const dates = [...parDate.keys()].sort();
      console.log(`  Lignes CSV exploitables : ${lignes.length - illisibles} (${illisibles} illisibles ou prix <= 0)`);
      console.log(`  Plage de dates publiee  : ${dates[0] || '-'} → ${dates[dates.length - 1] || '-'}\n`);

      const plusRecentes = dates.filter(x => baseMax !== '?' && x > baseMax);
      console.log('  Les 12 dates les plus recentes du fichier :');
      console.log('    date         lignes   posterieure a la base ?');
      console.log('    ----------   ------   -----------------------');
      for (const x of dates.slice(-12)) {
        console.log(`    ${x}   ${String(parDate.get(x)).padEnd(6)}   ${baseMax !== '?' && x > baseMax ? 'OUI' : 'non'}`);
      }

      const lignesNeuves = plusRecentes.reduce((s, x) => s + parDate.get(x), 0);
      console.log('');
      if (!plusRecentes.length) {
        console.log('  VERDICT : le fichier ne contient AUCUNE date posterieure a la base.');
        console.log('  La chaine d import n a rien a inserer. Le retard vient de la SOURCE,');
        console.log('  pas de nous — et le budget de 14 j de C4.NIGERIA est alors mal');
        console.log('  calibre pour la cadence reelle de publication de la SEC.');
      } else {
        console.log(`  VERDICT : ${lignesNeuves} ligne(s) sur ${plusRecentes.length} date(s) posterieures a la base.`);
        console.log('  La source publie et nous n inserons pas : la chaine d import est en');
        console.log('  cause, pas la SEC. A instruire sur l importeur, pas sur le budget.');
      }
    }

    console.log('\n=== FIN — aucune ecriture effectuee ===');
  } finally {
    await conn.end();
  }
})().catch(e => {
  console.error(`Erreur fatale : ${e.message}`);
  process.exit(2);
});
