/**
 * Controle de couverture : l extraction a-t-elle pris tout ce que la SEC offre ?
 *
 * POURQUOI CE CONTROLE EXISTE. Le 2026-10-26, le cron hebdomadaire a tourne, a
 * lu 41 classeurs, a produit un CSV de 9 084 lignes et a rapporte `[1/8] OK`.
 * Pendant ce temps, la page d index de la SEC offrait 42 classeurs : le
 * document 1537, donnees du 16 octobre, mis en ligne le 25. Il n a jamais ete
 * vu. Le journal ne l a pas dit, parce que l etape 1/8 n imprime que les
 * fichiers qu elle a LUS et rien sur les liens qu elle a VUS. Un lien absent de
 * la page etait donc indistinguable d un lien absent de notre lecture.
 *
 * Resultat : trois semaines de VL nigerianes manquantes derriere un `OK`. Le
 * controle de fraicheur `C4.NIGERIA` a bien crie, mais trois semaines plus tard
 * et sans pouvoir dire pourquoi. Ce script ferme cet angle mort a la source :
 * il compare ce que la page OFFRE a ce que le CSV CONTIENT, et nomme l ecart.
 *
 * CE QU IL NE FAIT PAS. Il ne telecharge aucun classeur, ne touche pas a la
 * base, et ne relance pas l extraction. Il constate et il crie. La reparation
 * reste une decision.
 *
 * SORTIE NON NULLE = l extraction a rate quelque chose. Le cron incremente
 * alors son compteur d erreurs et le rapport final dit « TERMINEE AVEC N
 * ERREUR(S) » au lieu d un OK trompeur. Il ne bloque pas les etapes suivantes :
 * un recalcul sur les donnees presentes reste utile.
 *
 * POURQUOI LES MEMES FILTRES, MOT POUR MOT. La selection des liens reproduit
 * `fetch_year_links` de `sec_ng_nav_extractor_v6.py` : meme test d extension,
 * memes libelles, meme exclusion des URL contenant `weekly-nav-for-cis`, meme
 * dedoublonnage par URL. Une regle plus large signalerait comme manquants des
 * fichiers que l extracteur ecarte a juste titre, et ce controle deviendrait
 * une alarme qu on apprend a ignorer — le pire sort pour un controle.
 *
 * USAGE  node scripts/diag/check_sec_ng_coverage.js [--csv sec_ng_latest.csv]
 *                                                   [--annee 2026] [--strict]
 *        --strict      sortie non nulle aussi si un classeur ancien manque,
 *                      pas seulement si la page offre plus recent que le CSV.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://sec.gov.ng/for-operators/keep-track-of-capital-market-data'
  + '/net-asset-value-data/weekly-net-asset-value-for-cis/';
const ENTETES = { 'User-Agent': 'Mozilla/5.0 (compatible; FundAfrica-coverage/1.0)' };
const MOIS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december'];

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const annee = opt('--annee', String(new Date().getUTCFullYear()));
const csvChemin = path.resolve(process.cwd(), opt('--csv', 'sec_ng_latest.csv'));
const strict = args.includes('--strict');

const obtenir = url => new Promise((ok, ko) => {
  const r = https.get(url, { headers: ENTETES, timeout: 30000 }, res => {
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
      res.resume();
      return obtenir(new URL(res.headers.location, url).toString()).then(ok, ko);
    }
    let c = '';
    res.setEncoding('utf8');
    res.on('data', d => { c += d; });
    res.on('end', () => ok({ code: res.statusCode, corps: c }));
  });
  r.on('timeout', () => r.destroy(new Error('delai depasse')));
  r.on('error', ko);
});

// Date de valorisation deduite du nom de fichier, comme le fait l extracteur.
const dateDuNom = u => {
  const m = decodeURIComponent(u).match(/as_at_(\d{1,2})[a-z]{2}_([A-Za-z]+)_(\d{4})/i);
  if (!m) return null;
  const im = MOIS.indexOf(m[2].toLowerCase());
  if (im < 0) return null;
  return `${m[3]}-${String(im + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
};

(async () => {
  console.log(`[couverture] controle SEC Nigeria ${annee} — `
    + `${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);

  // ---- Ce que le CSV contient --------------------------------------
  if (!fs.existsSync(csvChemin)) {
    console.error(`[couverture] ECHEC : ${csvChemin} introuvable.`);
    console.error('[couverture] L extraction n a rien produit : rien a comparer.');
    process.exit(1);
  }
  const brut = fs.readFileSync(csvChemin, 'utf8');
  const datesCsv = new Set((brut.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/g) || [])
    .filter(d => d.startsWith(annee)));
  const maxCsv = [...datesCsv].sort().pop() || null;
  console.log(`[couverture] CSV   : ${datesCsv.size} date(s) ${annee}, la plus recente ${maxCsv || '(aucune)'}`);

  // ---- Ce que la page offre ----------------------------------------
  const page = `${BASE}${annee}-weekly-nav-for-cis/`;
  let rep;
  try { rep = await obtenir(page); }
  catch (e) {
    console.error(`[couverture] ECHEC : page injoignable (${e.message}).`);
    console.error('[couverture] Impossible de dire si l extraction a tout pris.');
    console.error('[couverture] Un controle qui ne peut pas mesurer doit le DIRE,');
    console.error('[couverture] pas conclure que tout va bien.');
    process.exit(1);
  }
  if (rep.code !== 200) {
    console.error(`[couverture] ECHEC : la page rend HTTP ${rep.code}.`);
    process.exit(1);
  }

  const offerts = new Map();   // date de valorisation -> url
  for (const [, href, interieur] of rep.corps.matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const titre = interieur.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const complet = new URL(href, page).toString();
    const blob = `${href} ${titre}`.toLowerCase();
    const estClasseur = blob.includes('.xlsx') || blob.includes('.xlsm') || blob.includes('.xls')
      || (blob.includes('/documents/') && blob.includes('asset value'))
      || (blob.includes('/documents/') && blob.includes('unit price'))
      || (blob.includes('/documents/') && blob.includes('nav'));
    if (!estClasseur) continue;
    if (complet.toLowerCase().includes('weekly-nav-for-cis')) continue;
    const d = dateDuNom(complet);
    if (d && d.startsWith(annee)) offerts.set(d, complet);
  }
  const maxOffert = [...offerts.keys()].sort().pop() || null;
  console.log(`[couverture] Page  : ${offerts.size} classeur(s) ${annee}, le plus recent ${maxOffert || '(aucun)'}`);

  if (!offerts.size) {
    console.error('[couverture] ECHEC : aucun classeur retenu sur la page.');
    console.error('[couverture] Soit la page a change de structure, soit nos filtres');
    console.error('[couverture] ne correspondent plus. A instruire avant la prochaine passe.');
    process.exit(1);
  }

  // ---- L ecart, nomme ----------------------------------------------
  const manquants = [...offerts].filter(([d]) => !datesCsv.has(d)).sort();

  // Le cas le plus grave, et celui que ma premiere version laissait passer en
  // sortant 0 : le CSV ne porte AUCUNE date de l annee alors que la page en
  // offre. `plusRecentNonPris` exigeait `maxCsv` non nul, donc un CSV vide
  // tombait dans la branche « manques anciens, simple avertissement ». Un
  // controle qui rend OK devant une extraction totalement vide est pire que
  // pas de controle : il certifie le silence. Trouve par le test du script
  // contre `--csv /dev/null`, avant toute mise en service.
  if (!maxCsv) {
    console.error(`[couverture] ECHEC : le CSV ne porte AUCUNE date ${annee}, alors que la`);
    console.error(`[couverture] page en offre ${offerts.size}. L extraction n a rien produit d exploitable.`);
    process.exit(1);
  }

  const plusRecentNonPris = maxOffert > maxCsv;

  if (!manquants.length) {
    console.log('[couverture] OK : tout ce que la page offre est dans le CSV.');
    return;
  }

  console.log(`[couverture] ${manquants.length} classeur(s) OFFERT(S) PAR LA PAGE ET ABSENT(S) DU CSV :`);
  for (const [d, u] of manquants.slice(0, 15)) console.log(`[couverture]   ${d}  ${u}`);
  if (manquants.length > 15) console.log(`[couverture]   ... et ${manquants.length - 15} autre(s)`);

  if (plusRecentNonPris) {
    console.error(`[couverture] ECHEC : la page offre ${maxOffert}, le CSV s arrete a ${maxCsv}.`);
    console.error('[couverture] L extraction a vu la page et n a pas pris le plus recent.');
    console.error('[couverture] C est une ERREUR, pas un OK : des VL manquent en base.');
    process.exit(1);
  }
  if (strict) {
    console.error('[couverture] ECHEC (--strict) : des classeurs anciens manquent au CSV.');
    process.exit(1);
  }
  console.log('[couverture] AVERTISSEMENT : les manques portent sur des dates anciennes,');
  console.log('[couverture] pas sur la plus recente. Relancer avec --strict pour en faire');
  console.log('[couverture] une erreur. Un classeur ancien peut legitimement etre ecarte');
  console.log('[couverture] par le controle qualite — ce qui ne doit pas rester implicite.');
})().catch(e => { console.error(`[couverture] ECHEC : ${e.message}`); process.exit(1); });
