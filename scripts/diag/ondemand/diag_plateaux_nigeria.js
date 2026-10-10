/**
 * Les SEGMENTS de VL libelles en dollars au milieu d une serie en naira.
 *
 * POURQUOI CE DIAGNOSTIC EXISTE
 * -----------------------------
 * Le correctif naira raisonne par RUPTURE : deux VL consecutives qui different
 * d un facteur 10. Cela suffit pour un point isole, et echoue des que
 * l aberration dure. Un plateau de trois releves ne produit qu UNE rupture a son
 * entree et une a sa sortie ; ses points interieurs ne different pas entre eux,
 * passent donc pour sains, et servent ensuite de reference a leurs voisins.
 *
 * Le fonds 1141 le montre en production, au 2026-09-01 :
 *
 *   2025-12-05  165 682,93   naira
 *   2025-12-12      114,47   dollars   <- rupture signalee
 *   2025-12-19      114,55             <- passe pour sain
 *   2025-12-24      114,68             <- passe pour sain
 *   2026-01-02  165 297,52   naira     <- rupture signalee, mais ligne SAINE
 *
 * La performance YTD part de 114,68 pour arriver a 165 207 : **+143 958 %**,
 * affiche sur la fiche du fonds. Et le garde-fou « serie bimodale » — ajoute
 * pour eviter d ecrire contre un faux repere — refuse desormais de corriger ce
 * plateau, parce que ses points interieurs polluent la fenetre de reference.
 * Le garde-fou fait son travail ; c est la METHODE de detection qui manque.
 *
 * CE QUE CE SCRIPT FAIT DIFFEREMMENT
 * ----------------------------------
 * Il ne regarde pas la forme de la serie. Il compare chaque VL au prix NAIRA
 * que la SEC publie pour ce fonds a cette date, et en tire le rapport :
 *
 *   rapport ~ 1        -> la base est en naira, conforme
 *   rapport >= 100     -> la base est en DOLLARS (le taux NGN/USD va de 400 en
 *                         2022 a 1 600 en 2026 ; aucun ecart de valeur legitime
 *                         n atteint ce niveau)
 *   entre les deux     -> ecart de valeur, autre chantier, non traite ici
 *
 * Le seuil de 100 est volontairement bas par rapport au taux reel et haut par
 * rapport aux ecarts connus (les ecarts base/source recenses sont tous < 10x) :
 * il n existe aucune valeur plausible dans cet intervalle.
 *
 * La source tranche donc chaque point INDEPENDAMMENT de ses voisins. Un plateau
 * de trois releves est vu comme trois points en dollars, sans que les uns
 * servent de reference aux autres. C est precisement ce qui manquait.
 *
 * LECTURE SEULE — uniquement des SELECT. Ce script ne corrige rien : il mesure
 * ce qu il faudrait corriger, et ce que la source permet de corriger.
 *
 * USAGE  node scripts/diag/ondemand/diag_plateaux_nigeria.js [chemin_csv]
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

// Au-dela de ce rapport, la base ne peut pas etre en naira : c est un taux de
// change, pas un ecart de valorisation.
const RAPPORT_DEVISE = 100;
// En deca, base et source disent la meme chose a l arrondi pres.
const TOLERANCE = 0.01;

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
    console.log(`\nCSV de rejeu introuvable : ${CSV}`);
    console.log('Lancer d abord le workflow « OPS — rejeu SEC etape 2 ».\n');
    return;
  }

  const conn = await mysql.createConnection(DB);
  try {
    console.log('\n=== SEGMENTS EN DOLLARS DANS DES SERIES EN NAIRA — NIGERIA ===');
    console.log(`Mesure le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — LECTURE SEULE\n`);

    const { entetes, lignes } = lireCSV(CSV);
    if (!entetes.includes('vl_price_ngn')) {
      console.log('Le CSV ne porte pas `vl_price_ngn` : version anterieure de l extracteur.');
      console.log('Relancer le rejeu avant de conclure.\n');
      return;
    }

    const [fonds] = await conn.query(
      `SELECT id, nom_fond, dev_libelle FROM fond_investissements
        WHERE LOWER(pays) = 'nigeria' AND active = 1`
    );
    const parNom = new Map();
    for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);
    const parId = new Map(fonds.map(f => [f.id, f]));

    const naira = new Map();
    for (const l of lignes) {
      const f = parNom.get(normalizeNameForMatch(l.fund_name_clean || ''));
      if (!f) continue;
      const d = j(l.valuation_date);
      const p = parseFloat(l.vl_price_ngn);
      if (d === '?' || !Number.isFinite(p) || p <= 0) continue;
      naira.set(`${f.id}|${d}`, p);
    }

    const [vls] = await conn.query(`
      SELECT v.id, v.fund_id, DATE_FORMAT(v.date, '%Y-%m-%d') AS date, v.value
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id AND f.active = 1
       WHERE LOWER(f.pays) = 'nigeria' AND v.value > 0
       ORDER BY v.fund_id, v.date
    `);

    // Chaque VL jugee contre la source, SANS regarder ses voisins.
    const series = new Map();
    for (const v of vls) {
      if (!series.has(v.fund_id)) series.set(v.fund_id, []);
      const src = naira.get(`${v.fund_id}|${v.date}`);
      let etat = 'hors_rejeu';
      if (src !== undefined) {
        const r = src / Number(v.value);
        if (Math.abs(r - 1) <= TOLERANCE) etat = 'conforme';
        else if (r >= RAPPORT_DEVISE) etat = 'dollars';
        else etat = 'ecart_valeur';
      }
      series.get(v.fund_id).push({ ...v, src, etat });
    }

    // Regroupement des points « dollars » CONTIGUS en segments.
    const segments = [];
    for (const [fundId, serie] of series.entries()) {
      let courant = null;
      for (const p of serie) {
        if (p.etat === 'dollars') {
          if (!courant) courant = { fundId, debut: p.date, fin: p.date, points: [p] };
          else { courant.fin = p.date; courant.points.push(p); }
        } else if (courant) { segments.push(courant); courant = null; }
      }
      if (courant) segments.push(courant);
    }

    const totalPoints = segments.reduce((s, g) => s + g.points.length, 0);
    const fondsTouches = new Set(segments.map(g => g.fundId));
    const isoles = segments.filter(g => g.points.length === 1).length;
    const plateaux = segments.filter(g => g.points.length > 1);

    console.log('## Ce que la source revele\n');
    console.log(`  ${String(segments.length).padStart(6)} segment(s) en dollars, sur ${fondsTouches.size} fonds`);
    console.log(`  ${String(totalPoints).padStart(6)} VL concernees au total`);
    console.log(`  ${String(isoles).padStart(6)} points isoles — deja traitables par la detection de rupture`);
    console.log(`  ${String(plateaux.length).padStart(6)} PLATEAUX de 2 releves ou plus — invisibles a cette detection`);
    console.log(`  ${String(plateaux.reduce((s, g) => s + g.points.length, 0)).padStart(6)} VL dans ces plateaux\n`);

    if (plateaux.length) {
      console.log('## Les plateaux, du plus long au plus court\n');
      console.log(`  ${'fonds'.padStart(5)} ${'n'.padStart(3)} ${'debut'.padEnd(10)} ${'fin'.padEnd(10)} ${'en base'.padStart(13)} ${'source naira'.padStart(14)}  nom`);
      console.log(`  ${'-'.repeat(5)} ${'-'.repeat(3)} ${'-'.repeat(10)} ${'-'.repeat(10)} ${'-'.repeat(13)} ${'-'.repeat(14)}  ---`);
      for (const g of plateaux.sort((a, b) => b.points.length - a.points.length).slice(0, 40)) {
        const f = parId.get(g.fundId);
        const p0 = g.points[0];
        console.log(
          `  ${String(g.fundId).padStart(5)} ${String(g.points.length).padStart(3)} ${g.debut.padEnd(10)} ${g.fin.padEnd(10)}` +
          ` ${Number(p0.value).toFixed(2).padStart(13)} ${Number(p0.src).toFixed(2).padStart(14)}  ${String(f ? f.nom_fond : '?').slice(0, 28)}`
        );
      }
      if (plateaux.length > 40) console.log(`  ... et ${plateaux.length - 40} autre(s)`);
      console.log('');
    }

    // Combien de fonds seraient integralement assainis ? C est ce qui decide si
    // une correction vaut la peine d etre tentee fonds par fonds.
    console.log('## Par fonds — ce qui resterait apres correction\n');
    const parFonds = [];
    for (const fid of fondsTouches) {
      const serie = series.get(fid) || [];
      const n = { dollars: 0, conforme: 0, ecart: 0, hors: 0 };
      for (const p of serie) {
        if (p.etat === 'dollars') n.dollars++;
        else if (p.etat === 'conforme') n.conforme++;
        else if (p.etat === 'ecart_valeur') n.ecart++;
        else n.hors++;
      }
      parFonds.push({ fid, total: serie.length, ...n });
    }
    parFonds.sort((a, b) => b.dollars - a.dollars);
    console.log(`  ${'fonds'.padStart(5)} ${'dev'.padEnd(4)} ${'VL'.padStart(5)} ${'dollars'.padStart(8)} ${'conformes'.padStart(10)} ${'ecarts'.padStart(7)} ${'hors'.padStart(6)}  nom`);
    console.log(`  ${'-'.repeat(5)} ${'-'.repeat(4)} ${'-'.repeat(5)} ${'-'.repeat(8)} ${'-'.repeat(10)} ${'-'.repeat(7)} ${'-'.repeat(6)}  ---`);
    for (const r of parFonds.slice(0, 30)) {
      const f = parId.get(r.fid);
      console.log(
        `  ${String(r.fid).padStart(5)} ${String(f && f.dev_libelle || '?').padEnd(4)} ${String(r.total).padStart(5)}` +
        ` ${String(r.dollars).padStart(8)} ${String(r.conforme).padStart(10)} ${String(r.ecart).padStart(7)} ${String(r.hors).padStart(6)}` +
        `  ${String(f ? f.nom_fond : '?').slice(0, 26)}`
      );
    }
    if (parFonds.length > 30) console.log(`  ... et ${parFonds.length - 30} autre(s) fonds`);

    console.log('\n## Ce que cette mesure autorise\n');
    console.log('  Chaque VL ci-dessus a un prix naira PUBLIE pour sa date exacte : la');
    console.log('  correction serait donc lue, jamais calculee, et ne dependrait d aucun');
    console.log('  voisinage — c est ce qui a fait echouer les deux tentatives precedentes.');
    console.log('  Les colonnes « ecarts » et « hors » restent en dehors de ce perimetre :');
    console.log('  ce sont des sujets distincts, a ne pas melanger a celui-ci.\n');
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
