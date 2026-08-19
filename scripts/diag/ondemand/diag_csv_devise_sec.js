/**
 * MESURE — que porte reellement le CSV de l extracteur SEC pour les fonds
 * libelles en devise etrangere ?
 *
 * LECTURE SEULE STRICTE. Lit un fichier et interroge la base en SELECT.
 * N execute PAS l extracteur, n ecrit rien.
 *
 * POURQUOI CETTE MESURE
 * ---------------------
 * L arbitrage de l etape 0 de #73 a ete tranche en faveur de l option B
 * (reparer l extracteur avant le referentiel). Le premier pas de B n est pas
 * une ecriture mais une mesure : si l extracteur emet deja
 * `currency_code = USD` pour les fonds dollar, corriger `dev_libelle` ne gele
 * rien et l etape 0 devient gratuite ; s il emet NGN ou rien, il faut d abord
 * corriger `choose_vl_price` et `infer_currency`.
 *
 * Cinq hypotheses ont deja ete invalidees par les donnees sur ce dossier. On
 * mesure donc avant de coder.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const RACINE = path.resolve(__dirname, '../../..');
// Chemin du CSV a mesurer. Par defaut celui de production, mais un test de
// rejeu doit pouvoir mesurer sa propre sortie sans ecraser ni lire celle du
// cron : passer le chemin en argument ou via CSV_PATH.
const CSV = process.argv[2] || process.env.CSV_PATH || path.join(RACINE, 'sec_ng_latest.csv');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

// Decoupage CSV tolerant aux guillemets et aux virgules internes.
function decoupe(ligne) {
  const out = [];
  let cur = '', dans = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') { dans = !dans; continue; }
    if (c === ',' && !dans) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function tableau(lignes, max = 30) {
  if (!lignes.length) return '   (aucune ligne)';
  const cols = Object.keys(lignes[0]);
  const w = {};
  for (const c of cols) w[c] = Math.min(36, Math.max(c.length, ...lignes.map(l => String(l[c] ?? '').length)));
  const f = l => '   ' + cols.map(c => String(l[c] ?? '').slice(0, 36).padEnd(w[c])).join('  ');
  return ['   ' + cols.map(c => c.padEnd(w[c])).join('  '),
          '   ' + cols.map(c => '-'.repeat(w[c])).join('  '),
          ...lignes.slice(0, max).map(f),
          lignes.length > max ? `   ... et ${lignes.length - max} autres` : ''].filter(Boolean).join('\n');
}

async function main() {
  console.log('\n============================================================');
  console.log(' DEVISE EMISE PAR L EXTRACTEUR SEC — MESURE');
  console.log(' Genere le ' + new Date().toISOString() + ' — LECTURE SEULE');
  console.log('============================================================\n');

  // --- A. Le CSV est-il present et frais ? ---
  console.log('## A. Etat du CSV\n');
  if (!fs.existsSync(CSV)) {
    console.log(`   ${CSV} ABSENT — l extracteur n a jamais produit de sortie, ou elle a ete supprimee.`);
    console.log('   (le cron efface desormais ce fichier avant extraction : son absence peut donc');
    console.log('    simplement signifier que le dernier run a echoue avant de le regenerer)\n');
    process.exit(0);
  }
  const st = fs.statSync(CSV);
  const ageH = (Date.now() - st.mtime.getTime()) / 3600000;
  console.log(`   fichier   : ${CSV}`);
  console.log(`   taille    : ${(st.size / 1048576).toFixed(2)} Mo`);
  console.log(`   modifie   : ${st.mtime.toISOString()} (il y a ${ageH.toFixed(1)} h)`);

  const brut = fs.readFileSync(CSV, 'utf8').split('\n').filter(Boolean);
  const entetes = decoupe(brut[0]);
  console.log(`   lignes    : ${brut.length - 1}`);
  console.log(`   colonnes  : ${entetes.length}\n`);
  console.log('   En-tetes pertinents :');
  for (const c of ['fund_name_clean', 'currency_code', 'vl_price', 'vl_price_source',
                   'nav_value', 'nav_ngn', 'valuation_date', 'block_type']) {
    console.log(`      ${c.padEnd(20)} ${entetes.includes(c) ? 'present (col ' + entetes.indexOf(c) + ')' : 'ABSENT'}`);
  }

  const iNom = entetes.indexOf('fund_name_clean');
  const iDev = entetes.indexOf('currency_code');
  const iPrix = entetes.indexOf('vl_price');
  const iSrc = entetes.indexOf('vl_price_source');
  const iDate = entetes.indexOf('valuation_date');

  if (iNom < 0 || iDev < 0) {
    console.log('\n   Colonnes indispensables absentes — mesure impossible.\n');
    process.exit(0);
  }

  // --- B. Distribution des devises, fonds dollar contre les autres ---
  console.log('\n## B. Devise emise, fonds en devise etrangere contre les autres\n');
  const estDevise = n => /DOLLAR|EUROBOND|\bUSD\b/i.test(n);
  const compte = { devise: {}, autres: {} };
  const echantillon = [];

  for (let i = 1; i < brut.length; i++) {
    const c = decoupe(brut[i]);
    const nom = c[iNom] || '';
    if (!nom) continue;
    const dev = (c[iDev] || '(vide)').toUpperCase();
    const cible = estDevise(nom) ? 'devise' : 'autres';
    compte[cible][dev] = (compte[cible][dev] || 0) + 1;
    if (cible === 'devise' && echantillon.length < 25) {
      const iDevSrc = entetes.indexOf('vl_currency_source');
      echantillon.push({
        fonds: nom.slice(0, 30),
        devise: dev,
        prix: iPrix >= 0 ? c[iPrix] : '',
        source_prix: iSrc >= 0 ? c[iSrc] : '',
        // Renseigne par le correctif du lot AF : dit si la devise a ete LUE
        // dans l en-tete de colonne ou seulement deduite du contexte.
        source_devise: iDevSrc >= 0 ? c[iDevSrc] : '(absent)',
      });
    }
  }

  const fmt = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ') || '(aucun)';
  console.log(`   Fonds DOLLAR / EUROBOND / USD : ${fmt(compte.devise)}`);
  console.log(`   Tous les autres fonds         : ${fmt(compte.autres)}`);

  console.log('\n## C. Echantillon des lignes de fonds en devise etrangere\n');
  console.log(tableau(echantillon));

  // --- D. Confrontation au referentiel ---
  console.log('\n## D. Confrontation au referentiel (dev_libelle en base)\n');
  const conn = await mysql.createConnection(DB);
  try {
    const [ref] = await conn.execute(`
      SELECT f.id, LEFT(f.nom_fond, 32) AS nom, f.dev_libelle
        FROM fond_investissements f
       WHERE f.pays LIKE CONCAT(CHAR(78),CHAR(73),CHAR(71),CHAR(69),CHAR(82),CHAR(73),CHAR(65))
         AND f.active = 1
         AND (f.nom_fond LIKE CONCAT(CHAR(37),CHAR(68),CHAR(79),CHAR(76),CHAR(76),CHAR(65),CHAR(82),CHAR(37))
           OR f.nom_fond LIKE CONCAT(CHAR(37),CHAR(69),CHAR(85),CHAR(82),CHAR(79),CHAR(66),CHAR(79),CHAR(78),CHAR(68),CHAR(37)))
       ORDER BY f.nom_fond LIMIT 40`);
    const parDev = {};
    for (const r of ref) parDev[r.dev_libelle || '(null)'] = (parDev[r.dev_libelle || '(null)'] || 0) + 1;
    console.log(`   ${ref.length} fonds dollar/eurobond actifs en base : ${fmt(parDev)}`);
    console.log('');
    console.log(tableau(ref.map(r => ({ id: r.id, nom: r.nom, dev_libelle: r.dev_libelle || '(null)' })), 12));
  } finally {
    await conn.end();
  }

  // --- E. L etiquette de devise correspond-elle a l echelle de la valeur ? ---
  //
  // Correction du 2026-08-19 : la premiere version de ce script comptait les
  // etiquettes `currency_code` en les prenant pour des faits. C etait naif.
  // Une valeur de 160 284 etiquetee USD sur Afrinvest Dollar Fund est une
  // valeur en naira mal etiquetee — le prix USD reel de ce fonds est 117-119
  // (mesure en base au lot AA). L etiquette seule ne prouve donc rien : il
  // faut confronter l etiquette a l ORDRE DE GRANDEur de la valeur.
  console.log('\n## E. L etiquette de devise correspond-elle a l echelle ?\n');

  const parDevOrdre = {};
  const suspects = [];
  for (let i = 1; i < brut.length; i++) {
    const c = decoupe(brut[i]);
    const nom = c[iNom] || '';
    if (!nom || !estDevise(nom)) continue;
    const dev = (c[iDev] || '(vide)').toUpperCase();
    const v = parseFloat(c[iPrix]);
    if (!isFinite(v) || v <= 0) continue;
    const ordre = Math.floor(Math.log10(v));
    const cle = dev + ' / 10^' + ordre;
    parDevOrdre[cle] = (parDevOrdre[cle] || 0) + 1;
    // Un prix unitaire en dollars depasse rarement 10 000. Au-dela, sous une
    // etiquette USD, la valeur est presque surement en naira.
    if (dev === 'USD' && v > 10000 && suspects.length < 12) {
      suspects.push({ fonds: nom.slice(0, 32), devise: dev, prix: c[iPrix].slice(0, 16), date: iDate >= 0 ? c[iDate] : '' });
    }
  }

  console.log('   Repartition croisee etiquette x ordre de grandeur :');
  for (const [k, n] of Object.entries(parDevOrdre).sort()) console.log(`      ${k.padEnd(18)} ${n} lignes`);

  const usdOrdres = Object.keys(parDevOrdre).filter(k => k.startsWith('USD')).length;
  const ngnOrdres = Object.keys(parDevOrdre).filter(k => k.startsWith('NGN')).length;

  if (suspects.length) {
    console.log('\n   Lignes etiquetees USD avec un prix > 10 000 (incoherent pour un prix unitaire en dollars) :\n');
    console.log(tableau(suspects, 12));
  }

  console.log('\n## F. Ce que cela implique pour l etape 0\n');
  if (usdOrdres > 1 || ngnOrdres > 1) {
    console.log(`   L etiquette NE PREDIT PAS l echelle : USD couvre ${usdOrdres} ordres de grandeur,`);
    console.log(`   NGN en couvre ${ngnOrdres}. Une meme etiquette recouvre donc des unites differentes.`);
    console.log('');
    console.log('   -> Corriger dev_libelle en USD serait DANGEREUX : le contrat accepterait des');
    console.log('      valeurs en naira portant une etiquette USD, c est-a-dire de la donnee fausse');
    console.log('      avec un label rassurant. Pire que le blocage.');
    console.log('');
    console.log('   -> Le defaut est en amont, dans l extracteur : `choose_vl_price` retient');
    console.log('      `offer_price` en priorite sans savoir de quelle colonne devise il provient,');
    console.log('      tandis que `infer_currency` deduit la devise du contexte. Les deux peuvent');
    console.log('      donc se contredire. C est la reparation a mener AVANT toute etape 0,');
    console.log('      ce qui confirme l arbitrage B.');
  } else {
    console.log('   Chaque etiquette correspond a un seul ordre de grandeur : le marquage est');
    console.log('   coherent. Corriger dev_libelle alignerait le referentiel sans risque.');
  }

  console.log('\n============================================================');
  console.log(' FIN — aucune ecriture.');
  console.log('============================================================\n');
}

main().catch(e => { console.error('Erreur fatale :', e.message); process.exit(1); });
