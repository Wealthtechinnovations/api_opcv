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
const CSV = path.join(RACINE, 'sec_ng_latest.csv');

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
      echantillon.push({
        fonds: nom.slice(0, 34),
        devise: dev,
        prix: iPrix >= 0 ? c[iPrix] : '',
        source: iSrc >= 0 ? c[iSrc] : '',
        date: iDate >= 0 ? c[iDate] : '',
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

  // --- E. Verdict ---
  console.log('\n## E. Ce que cela implique pour l etape 0\n');
  const devUSD = compte.devise['USD'] || 0;
  const devNGN = compte.devise['NGN'] || 0;
  const devVide = compte.devise['(VIDE)'] || compte.devise['(vide)'] || 0;
  const total = Object.values(compte.devise).reduce((a, b) => a + b, 0);
  if (total === 0) {
    console.log('   Aucune ligne de fonds en devise etrangere dans ce CSV — mesure non concluante.');
    console.log('   (le CSV peut ne couvrir que l annee courante, ou la SEC n a rien publie)');
  } else if (devUSD > devNGN && devUSD > devVide) {
    console.log(`   L extracteur emet majoritairement USD (${devUSD}/${total}).`);
    console.log('   -> Corriger dev_libelle en USD ALIGNERAIT le referentiel sur la source :');
    console.log('      le contrat accepterait ces mesures, aucun gel. L etape 0 est gratuite.');
  } else {
    console.log(`   L extracteur n emet PAS USD (USD=${devUSD}, NGN=${devNGN}, vide=${devVide}, total=${total}).`);
    console.log('   -> Corriger dev_libelle en USD ferait REFUSER ces mesures par le contrat.');
    console.log('      Il faut d abord corriger `choose_vl_price` et `infer_currency` dans');
    console.log('      sec_ng_nav_extractor_v6.py pour selectionner la colonne USD des fonds dollar.');
    console.log('      C est exactement le chemin B retenu a l arbitrage.');
  }

  console.log('\n============================================================');
  console.log(' FIN — aucune ecriture.');
  console.log('============================================================\n');
}

main().catch(e => { console.error('Erreur fatale :', e.message); process.exit(1); });
