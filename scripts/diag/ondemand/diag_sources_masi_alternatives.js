/**
 * Quelle source MASI est reellement joignable depuis S2 ?
 *
 * POURQUOI. `diag_source_masi.js` a tranche le 2026-10-04 : l API medias24 que
 * `scrapeMASI` interroge rend **403 Cloudflare a Node ET a curl depuis le
 * serveur**. Changer de client HTTP ne corrigera rien ; il faut une autre
 * source. Sans MASI, aucune VL marocaine ne peut porter de benchmark, et la
 * regle du projet est explicite : ne jamais inventer une valeur d indice.
 *
 * Ce script ne choisit pas la source : il mesure lesquelles repondent depuis
 * S2, avec quel type de contenu, et si un niveau MASI plausible y figure. Le
 * choix viendra apres, sur ces chiffres, et la source retenue devra etre
 * autoritative — bourse de Casablanca ou regulateur — pas un agregateur.
 *
 * Il imprime aussi les chemins `/api/` trouves dans le HTML officiel : le site
 * de la bourse est une application a rendu client, son API interne est donc
 * l endroit ou chercher une serie historique plutot qu une page a parser.
 *
 * MASI cote autour de 20 000 points en 2026 ; `scrapeMASI` ne retient d ailleurs
 * que les valeurs > 1000. Un nombre a quatre chiffres trouve dans une page est
 * plus probablement un MASI20 future ou un volume : ce script signale les
 * candidats, il ne conclut pas a leur place.
 *
 * LECTURE SEULE. Aucune ecriture. Requetes GET sortantes vers des sites
 * publics de donnees de marche.
 *
 * USAGE  node scripts/diag/ondemand/diag_sources_masi_alternatives.js
 */
const { execFileSync } = require('child_process');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CANDIDATES = [
  ['bourse de Casablanca — accueil FR', 'https://www.casablanca-bourse.com/fr'],
  ['bourse de Casablanca — indices',    'https://www.casablanca-bourse.com/fr/live-market/marche-actions/indices'],
  ['bourse de Casablanca — api proxy',  'https://www.casablanca-bourse.com/api/proxy/fr/api/bourse/dashboard/index_dashboard'],
  ['AMMC',                              'https://www.ammc.ma/'],
  ['Bank Al-Maghrib',                   'https://www.bkam.ma/'],
  ['medias24 (temoin, 403 attendu)',    'https://medias24.com/content/api?method=getMasiHistory&periode=1m&format=json'],
];

function fetchCurl(url) {
  try {
    const out = execFileSync('curl', [
      '-sL', '--max-time', '25',
      '-w', '\\n@@META@@%{http_code}|%{content_type}|%{size_download}',
      '-H', `User-Agent: ${UA}`, url,
    ], { encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });
    const i = out.lastIndexOf('@@META@@');
    const [statut, ctype, taille] = out.slice(i + 8).split('|');
    return { statut: Number(statut), ctype: (ctype || '').split(';')[0], taille: Number(taille), corps: out.slice(0, i) };
  } catch (e) {
    return { statut: null, erreur: e.message, corps: '', ctype: '', taille: 0 };
  }
}

const cloudflare = c => /just a moment|cf-browser-verification|challenge-platform/i.test(c);

// Nombres au format marocain (20 456,78 / 20456.78) proches du mot MASI.
function candidatsMASI(corps) {
  const trouves = [];
  const re = /MASI[^0-9]{0,80}([0-9]{1,3}(?:[  .,][0-9]{3})*(?:[.,][0-9]{1,2})?)/gi;
  let m;
  while ((m = re.exec(corps)) !== null && trouves.length < 5) {
    const brut = m[1];
    const norm = Number(brut.replace(/[  .](?=[0-9]{3}\b)/g, '').replace(',', '.'));
    if (Number.isFinite(norm) && norm > 1000) trouves.push(`${brut} (→ ${norm})`);
  }
  return trouves;
}

function cheminsApi(corps) {
  const s = new Set();
  const re = /["'`](\/[a-z0-9_\-/]*api[a-z0-9_\-/]*)["'`]/gi;
  let m;
  while ((m = re.exec(corps)) !== null && s.size < 12) s.add(m[1]);
  return [...s];
}

(async () => {
  console.log('=== SOURCES MASI ALTERNATIVES — CE QUI REPOND DEPUIS S2 ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  for (const [nom, url] of CANDIDATES) {
    const r = fetchCurl(url);
    console.log(`## ${nom}`);
    console.log(`  ${url}`);
    console.log(`  statut ${r.statut ?? 'aucune reponse'}${r.erreur ? ` (${r.erreur})` : ''} | ${r.ctype || '-'} | ${r.taille} o`);
    if (r.corps) {
      if (cloudflare(r.corps)) {
        console.log('  → interstitielle Cloudflare : source inutilisable par script');
      } else {
        const c = candidatsMASI(r.corps);
        console.log(`  → candidats « MASI + nombre > 1000 » : ${c.length ? c.join(' | ') : 'aucun'}`);
        const a = cheminsApi(r.corps);
        if (a.length) console.log(`  → chemins /api/ dans la page : ${a.join(' ')}`);
      }
    }
    console.log('');
  }
  console.log('Rappel : la source retenue devra etre autoritative et fournir une');
  console.log('SERIE datee, pas un seul cours instantane — `propagateIndRef` apparie');
  console.log('une date de VL a une date d indice a +/- 7 jours.');
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => {
  console.error(`Erreur fatale : ${e.message}`);
  process.exit(2);
});
