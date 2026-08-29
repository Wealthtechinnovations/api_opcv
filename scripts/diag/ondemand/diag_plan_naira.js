/**
 * Ce qu une correction VERS LE NAIRA ecrirait, rupture par rupture.
 *
 * DECISION UTILISATEUR DU 2026-08-29 : tous les fonds Nigeria sont tenus en
 * naira. `value` reste en naira sur toute la serie ; la vue dollar vit dans
 * `value_USD`, ou elle est deja juste.
 *
 * CE QUE CE DIAGNOSTIC ETABLIT, ET POURQUOI IL PRECEDE TOUTE ECRITURE. Pour
 * chacune des ruptures d echelle encore en base, il va chercher dans le fichier
 * SEC relu le prix NAIRA de cette semaine-la — desormais emis explicitement par
 * l extracteur (`vl_price_ngn`), a cote du prix retenu. Il repond a trois
 * questions, dans cet ordre :
 *
 *   1. la source publie-t-elle un naira pour cette date ? sinon, rien a ecrire ;
 *   2. quelle valeur exactement ? c est elle qui sera ecrite, telle quelle ;
 *   3. **cette valeur resout-elle la rupture ?** Une correction qui remplace une
 *      valeur aberrante par une autre valeur aberrante n est pas une correction.
 *      Le test compare la valeur naira au VOISINAGE de la serie : elle doit
 *      retomber dans le meme ordre de grandeur que les semaines encadrantes.
 *
 * La troisieme question est celle qu on oublie. Les deux premieres suffisent a
 * produire un chiffre rassurant ; seule la troisieme dit si la serie redevient
 * lisible.
 *
 * LECTURE SEULE — uniquement des SELECT. Il decrit, il n ecrit rien.
 *
 * USAGE  node scripts/diag/ondemand/diag_plan_naira.js [chemin_csv]
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

const CSV = process.argv[2] || path.resolve(__dirname, '../../../sec_ng_replay.csv');
const FACTEUR = 10;

const n = (x, d = 4) => (x === null || x === undefined || Number.isNaN(Number(x)) ? '-' : Number(x).toFixed(d));
const j = x => {
  if (!x) return '?';
  if (x instanceof Date) {
    const p = k => String(k).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  return String(x).slice(0, 10);
};

(async () => {
  if (!fs.existsSync(CSV)) {
    console.log(`\nCSV de rejeu introuvable : ${CSV}\n`);
    return;
  }

  const conn = await mysql.createConnection(DB);
  try {
    console.log('\n=== CORRECTION VERS LE NAIRA — CE QUI SERAIT ECRIT ===');
    console.log(`Mesure le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — LECTURE SEULE\n`);

    const { entetes, lignes } = lireCSV(CSV);

    // Sans cette colonne, le CSV vient d une version anterieure de l extracteur
    // et rien de ce qui suit n aurait de sens. On le dit au lieu de compter zero.
    if (!entetes.includes('vl_price_ngn')) {
      console.log('  *** Le CSV ne porte PAS la colonne `vl_price_ngn`.');
      console.log('      Il a ete produit par une version anterieure de l extracteur.');
      console.log('      Relancer le rejeu avant toute conclusion — ne rien deduire d ici.\n');
      return;
    }

    const [fonds] = await conn.query(`
      SELECT id, nom_fond, dev_libelle FROM fond_investissements
       WHERE LOWER(pays) = 'nigeria'
    `);
    const parNom = new Map();
    for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);

    // Le prix naira publie, par fonds et par date.
    const naira = new Map();
    let lignesAvecNaira = 0;
    for (const l of lignes) {
      const f = parNom.get(normalizeNameForMatch(l.fund_name_clean || ''));
      if (!f) continue;
      const date = j(l.valuation_date);
      const prix = parseFloat(l.vl_price_ngn);
      if (date === '?' || !Number.isFinite(prix) || prix <= 0) continue;
      naira.set(`${f.id}|${date}`, { prix, source: l.vl_price_ngn_source || '' });
      lignesAvecNaira++;
    }
    console.log(`Lignes CSV portant un prix naira explicite : ${lignesAvecNaira} sur ${lignes.length}\n`);

    // Les ruptures encore en base, avec leurs DEUX voisins : le precedent sert a
    // les detecter, le suivant a juger si la valeur de remplacement retombe dans
    // la serie. Une correction se verifie par son resultat, pas par son intention.
    const [ruptures] = await conn.query(`
      WITH serie AS (
        SELECT v.fund_id, v.date, v.value,
               LAG(v.value)  OVER (PARTITION BY v.fund_id ORDER BY v.date) AS prec,
               LEAD(v.value) OVER (PARTITION BY v.fund_id ORDER BY v.date) AS suiv
          FROM valorisations v
          JOIN fond_investissements f ON f.id = v.fund_id AND f.active = 1
         WHERE v.value > 0 AND LOWER(f.pays) = 'nigeria'
      )
      SELECT s.fund_id, f.nom_fond, f.dev_libelle,
             DATE_FORMAT(s.date, '%Y-%m-%d') AS date,
             s.value, s.prec, s.suiv,
             ROUND(GREATEST(s.value / s.prec, s.prec / s.value), 1) AS facteur
        FROM serie s
        JOIN fond_investissements f ON f.id = s.fund_id
       WHERE s.prec > 0
         AND (s.value / s.prec >= ${FACTEUR} OR s.prec / s.value >= ${FACTEUR})
       ORDER BY f.nom_fond, s.date
    `);

    console.log(`Ruptures d echelle Nigeria encore en base : ${ruptures.length}\n`);
    if (!ruptures.length) { console.log('Aucune. Rien a corriger.\n'); return; }

    let avecNaira = 0, sansNaira = 0, resolues = 0, nonResolues = 0, dejaJuste = 0;
    const detail = [];

    for (const r of ruptures) {
      const s = naira.get(`${r.fund_id}|${r.date}`);
      if (!s) { sansNaira++; detail.push({ ...r, statut: 'AUCUNE SOURCE NAIRA' }); continue; }
      avecNaira++;

      // Le voisinage : la reference contre laquelle juger. On prend le voisin
      // disponible — au bord de la serie, un seul existe.
      const voisins = [Number(r.prec), Number(r.suiv)].filter(x => Number.isFinite(x) && x > 0);
      const refs = voisins.length ? voisins : [Number(r.prec)];
      const ecarts = refs.map(v => Math.max(s.prix / v, v / s.prix));
      const pire = Math.max(...ecarts);

      let statut;
      if (Math.max(s.prix / Number(r.value), Number(r.value) / s.prix) - 1 < 0.01) {
        statut = 'DEJA CONFORME';           // la base porte deja la valeur source
        dejaJuste++;
      } else if (pire < FACTEUR) {
        statut = 'RESOUT';                  // retombe dans l ordre de grandeur voisin
        resolues++;
      } else {
        statut = 'NE RESOUT PAS';           // remplace une aberration par une autre
        nonResolues++;
      }
      detail.push({ ...r, naira: s.prix, source: s.source, pire, statut });
    }

    console.log('## A. Ce que la source permet\n');
    console.log(`  ${String(avecNaira).padStart(5)} rupture(s) avec un prix naira publie`);
    console.log(`  ${String(sansNaira).padStart(5)} rupture(s) SANS prix naira dans la source — rien a ecrire`);
    console.log('\n## B. Et ce que la correction produirait\n');
    console.log(`  ${String(resolues).padStart(5)} RESOLUE(S) — la valeur naira retombe dans la serie`);
    console.log(`  ${String(nonResolues).padStart(5)} NON RESOLUE(S) — la valeur naira reste aberrante, NE PAS ECRIRE`);
    console.log(`  ${String(dejaJuste).padStart(5)} deja conforme(s) — la base porte deja la valeur source`);

    console.log('\n## C. Detail (50 premieres)\n');
    console.log(`  ${'fonds'.padStart(5)} ${'date'.padEnd(10)} ${'en base'.padStart(15)} ${'naira source'.padStart(15)} ${'precedente'.padStart(15)} ${'statut'.padEnd(20)} nom`);
    console.log(`  ${'-'.repeat(5)} ${'-'.repeat(10)} ${'-'.repeat(15)} ${'-'.repeat(15)} ${'-'.repeat(15)} ${'-'.repeat(20)} ---`);
    for (const d of detail.slice(0, 50)) {
      console.log(
        `  ${String(d.fund_id).padStart(5)} ${d.date.padEnd(10)} ${n(d.value).padStart(15)}` +
        ` ${n(d.naira).padStart(15)} ${n(d.prec).padStart(15)} ${String(d.statut).padEnd(20)}` +
        ` ${String(d.nom_fond).slice(0, 28)}`
      );
    }
    if (detail.length > 50) console.log(`  ... et ${detail.length - 50} autre(s)`);

    // Les cas qui ne se resolvent pas meritent d etre nommes : ils relevent d une
    // autre cause et devront etre instruits un par un, pas noyes dans un total.
    const problemes = detail.filter(d => d.statut === 'NE RESOUT PAS');
    if (problemes.length) {
      console.log('\n## D. Ruptures que le naira source NE resout pas\n');
      for (const p of problemes.slice(0, 20)) {
        console.log(`  [${String(p.fund_id).padStart(4)}] ${p.date}  base ${n(p.value)} -> source ${n(p.naira)}` +
                    `  mais voisins a ${n(p.prec)} (ecart x${p.pire.toFixed(1)})  ${String(p.nom_fond).slice(0, 26)}`);
      }
      if (problemes.length > 20) console.log(`  ... et ${problemes.length - 20} autre(s)`);
      console.log('\n  Ces lignes relevent d une autre cause. A instruire separement.');
    }

    console.log('');
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
