/**
 * Pourquoi le fonds 1141 — celui qui affiche +143 958 % — echappe-t-il au
 * correctif des segments naira ?
 *
 * POURQUOI. Le dry-run du 2026-10-22 a retenu 157 VL sur 30 fonds, et [1141]
 * AFRINVEST DOLLAR FUND n en fait PAS partie, alors que l en-tete de
 * `ops-fix-segments-naira.yml` l annonce comme sa consequence visible la plus
 * frappante. Un correctif dont la promesse ne couvre pas son propre exemple ne
 * doit pas etre execute avant qu on sache pourquoi.
 *
 * `C7` du 2026-10-27 confirme que le defaut est reel :
 *   [1141] AFRINVEST DOLLAR FUND (NIGERIA/NGN) 1467x [114,47 .. 167 885]
 *
 * Le correctif ne juge PAS la forme de la serie — deux tentatives anterieures
 * s y sont trompees et ont ecrase trois bonnes VL. Il compare chaque VL au prix
 * naira publie par la SEC pour la DATE EXACTE, et ne retient que si
 * prix_publie / valeur_en_base >= 100. L appariement passe par le nom :
 *
 *   naira.set(`${fond.id}|${valuation_date}`, vl_price_ngn)   // via fund_name_clean
 *
 * Deux causes possibles, et une seule est vraie :
 *   (a) DATES — le CSV ne couvre pas les dates fautives de 1141 ;
 *   (b) NOMS  — `normalizeNameForMatch` n apparie pas « AFRINVEST DOLLAR FUND »,
 *       et alors AUCUNE de ses dates ne matcherait jamais.
 *
 * L indice local penche pour (a) : le rapport du dry-run ne couvre que 17 dates
 * (2022-05-06, 2022-05-27, 2024-06-14, puis hebdomadaire 2026-05-15 au
 * 2026-08-14), alors que les cinq VL suspectes de 1141 sont au 2022-03-25,
 * 2023-12-15, 2025-12-12, 2025-12-19 et 2025-12-24. Mais le CSV vit sur le
 * serveur et n est pas dans le depot : l indice n est pas une mesure.
 *
 * CE QUE CE SCRIPT TRANCHE, en chiffres : si (a), la correction de 1141 demande
 * d ETENDRE LA SOURCE a ces cinq dates, pas de toucher au code du correctif —
 * et l execution sur les 157 autres lignes est alors saine. Si (b), c est
 * l appariement qu il faut corriger, et d autres fonds sont peut-etre muets de
 * la meme facon.
 *
 * LECTURE SEULE : uniquement des SELECT et la lecture du CSV.
 *
 * USAGE  node scripts/diag/ondemand/diag_1141_hors_perimetre_naira.js
 */
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { normalizeNameForMatch, lireCSV } = require('../../../src/lib/sec_csv');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};
const CSV = path.resolve(__dirname, '../../../sec_ng_replay.csv');
const SUSPECTS = [1141, 1196, 2743];   // les fonds nigerians signales par C3
const j = x => (x instanceof Date
  ? `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  : String(x || '').slice(0, 10));

(async () => {
  console.log('=== POURQUOI 1141 ECHAPPE-T-IL AU CORRECTIF NAIRA ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  if (!fs.existsSync(CSV)) {
    console.log(`ECHEC : CSV introuvable a ${CSV}`);
    console.log('Le correctif lui-meme echouerait de la meme facon. Rien a conclure.');
    process.exitCode = 2;
    return;
  }
  const { entetes, lignes } = lireCSV(CSV);
  console.log(`## LA SOURCE\n  ${CSV}`);
  console.log(`  ${lignes.length} lignes | colonne vl_price_ngn : ${entetes.includes('vl_price_ngn') ? 'presente' : 'ABSENTE'}`);
  const dates = [...new Set(lignes.map(l => j(l.valuation_date)))].sort();
  console.log(`  ${dates.length} dates distinctes : ${dates.join(', ')}`);

  const conn = await mysql.createConnection(DB);
  try {
    const [fonds] = await conn.query(
      "SELECT id, nom_fond FROM fond_investissements WHERE LOWER(pays) = 'nigeria' AND active = 1");
    const parNom = new Map();
    for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);

    // (b) L appariement par nom tient-il ?
    let apparies = 0;
    const orphelins = new Map();
    const cles = new Set();
    for (const l of lignes) {
      const f = parNom.get(normalizeNameForMatch(l.fund_name_clean || ''));
      if (!f) { orphelins.set(l.fund_name_clean || '(vide)', (orphelins.get(l.fund_name_clean || '(vide)') || 0) + 1); continue; }
      apparies++;
      cles.add(`${f.id}|${j(l.valuation_date)}`);
    }
    console.log(`\n## (b) APPARIEMENT PAR NOM`);
    console.log(`  ${apparies}/${lignes.length} lignes du CSV apparient un fonds nigerian actif`);
    if (orphelins.size) {
      console.log(`  ${orphelins.size} nom(s) du CSV sans correspondance en base :`);
      for (const [n, c] of [...orphelins].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
        console.log(`    ${String(n).slice(0, 44).padEnd(46)} ${c} ligne(s)`);
      }
    }

    // Chaque suspect est-il present dans le CSV, et a quelles dates ?
    for (const id of SUSPECTS) {
      const f = fonds.find(x => x.id === id);
      console.log(`\n## FONDS ${id} — ${f ? f.nom_fond : 'ABSENT de la base ou inactif'}`);
      if (!f) continue;
      const norm = normalizeNameForMatch(f.nom_fond);
      const sien = lignes.filter(l => normalizeNameForMatch(l.fund_name_clean || '') === norm);
      console.log(`  nom normalise      : "${norm}"`);
      console.log(`  lignes dans le CSV : ${sien.length}`
        + (sien.length ? ` aux dates ${[...new Set(sien.map(l => j(l.valuation_date)))].sort().join(', ')}` : '  ← LE NOM N APPARIE RIEN'));

      // Les VL suspectes : petites valeurs dans une serie a grande echelle.
      const [vls] = await conn.query(
        `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS d, value FROM valorisations
          WHERE fund_id = ? AND value > 0 ORDER BY date`, [id]);
      const mx = Math.max(...vls.map(v => Number(v.value)));
      const petites = vls.filter(v => Number(v.value) * 100 < mx);
      console.log(`  ${vls.length} VL, max ${mx} | ${petites.length} VL au moins 100x plus petites que le max :`);
      for (const v of petites.slice(0, 12)) {
        const dansCsv = cles.has(`${id}|${v.d}`);
        console.log(`    ${v.d}  ${String(v.value).padStart(14)}   source SEC a cette date : ${dansCsv ? 'OUI' : 'NON'}`);
      }
      const couvertes = petites.filter(v => cles.has(`${id}|${v.d}`)).length;
      console.log(`  → ${couvertes}/${petites.length} des VL suspectes ont un prix publie a leur date exacte`);
      console.log(`  → ${couvertes === 0 ? 'CAUSE (a) : trou de DATES dans la source. Etendre la source, ne pas toucher au correctif.'
        : 'des dates sont couvertes : le rapport < 100 ou un autre filtre explique l absence. A instruire.'}`);
    }
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
