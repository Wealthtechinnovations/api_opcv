/**
 * Pourquoi `MASI` n est plus alimente depuis le 2026-07-31.
 *
 * POURQUOI CE DIAGNOSTIC. Mesure du 2026-10-04 : `indice_references` n a plus
 * aucune valeur MASI depuis le 31 juillet (66 j), et les VL marocaines perdent
 * leur benchmark le 6 aout — exactement la fin de la fenetre de +/- 7 jours que
 * `propagateIndRef` applique autour d une date scrapee. Le chainage est donc
 * etabli : pas de MASI dans la table source → plus rien a propager → `indRef`
 * NULL sur toutes les VL marocaines suivantes. Tunindex, BRVM et NSE restent
 * frais : la panne est propre a MASI.
 *
 * Reste UNE question, et elle decide du correctif. `scrapeMASI` appelle
 * `medias24.com/content/api?method=getMasiHistory` via `httpGetJson`, c est a
 * dire le client HTTPS de Node. Depuis le conteneur de session, cette URL rend
 * **HTTP 403 avec une page « Just a moment... »** — une interstitielle
 * Cloudflare. Mais un 403 vu depuis un proxy d agent ne prouve rien de ce que
 * voit S2 : l adresse source n est pas la meme, et Cloudflare filtre par
 * reputation d IP autant que par empreinte TLS.
 *
 * Ce script tranche DEPUIS LE SERVEUR, et il teste les deux clients, parce que
 * le depot contient deja le precedent exact : `curlGetText` existe dans ce
 * meme fichier avec le commentaire « required for hosts that block Node s TLS
 * fingerprint (e.g. bkam.ma returns 403 to Node https/fetch but 200 to curl) ».
 * Si curl passe la ou Node echoue, le correctif est connu, borne et deja
 * eprouve ici : router MASI par `curlGetText` comme MONIA l est deja.
 *
 * LECTURE SEULE. Aucune ecriture, ni en base ni sur disque. Deux requetes GET
 * sortantes vers une API publique de donnees de marche que le scraper de ce
 * meme serveur interroge de toute facon chaque jour ouvre.
 *
 * USAGE  node scripts/diag/ondemand/diag_source_masi.js
 */
const https = require('https');
const { execFileSync } = require('child_process');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const URL_MASI = 'https://medias24.com/content/api?method=getMasiHistory&periode=1m&format=json';
const DELAI = 25000;

function viaNode(url) {
  return new Promise(resolve => {
    const req = https.get(url, { timeout: DELAI, headers: { 'User-Agent': UA } }, res => {
      let corps = '';
      res.on('data', c => { if (corps.length < 4096) corps += c; });
      res.on('end', () => resolve({ statut: res.statusCode, corps }));
    });
    req.on('error', e => resolve({ statut: null, erreur: e.message, corps: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ statut: null, erreur: `timeout ${DELAI} ms`, corps: '' }); });
  });
}

function viaCurl(url) {
  try {
    const out = execFileSync('curl', [
      '-s', '--max-time', '25', '-w', '\\n@@STATUT@@%{http_code}',
      '-H', `User-Agent: ${UA}`, url,
    ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    const i = out.lastIndexOf('@@STATUT@@');
    return { statut: Number(out.slice(i + 10).trim()), corps: out.slice(0, i) };
  } catch (e) {
    return { statut: null, erreur: e.message, corps: '' };
  }
}

// Ce que le scraper attend reellement : result.labels (epoch s) + result.prices.
function jugerCharge(corps) {
  try {
    const json = JSON.parse(corps);
    const labels = json?.result?.labels || [];
    const prices = json?.result?.prices || [];
    if (!labels.length) return 'JSON valide mais result.labels vide — le format a change';
    const iso = e => new Date(e * 1000).toISOString().slice(0, 10);
    const derniere = iso(labels[labels.length - 1]);
    const val = Number(prices[prices.length - 1]);
    return `JSON exploitable — ${labels.length} points, dernier ${derniere} = ${val}`;
  } catch {
    const t = corps.slice(0, 120).replace(/\s+/g, ' ');
    if (/just a moment|cf-browser-verification|challenge-platform/i.test(corps)) {
      return `interstitielle Cloudflare — « ${t} »`;
    }
    return `charge non JSON — « ${t} »`;
  }
}

(async () => {
  console.log('=== SOURCE MASI — POURQUOI LE SCRAPING ECHOUE ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE`);
  console.log(`URL : ${URL_MASI}\n`);

  const n = await viaNode(URL_MASI);
  console.log('## A. Client HTTPS de Node — celui que `scrapeMASI` utilise aujourd hui');
  console.log(`  statut : ${n.statut ?? 'aucune reponse'}${n.erreur ? ` (${n.erreur})` : ''}`);
  if (n.corps) console.log(`  charge : ${jugerCharge(n.corps)}`);

  const c = viaCurl(URL_MASI);
  console.log('\n## B. curl — le contournement deja employe dans ce fichier pour bkam.ma');
  console.log(`  statut : ${c.statut ?? 'aucune reponse'}${c.erreur ? ` (${c.erreur})` : ''}`);
  if (c.corps) console.log(`  charge : ${jugerCharge(c.corps)}`);

  const okNode = n.statut === 200 && /JSON exploitable/.test(n.corps ? jugerCharge(n.corps) : '');
  const okCurl = c.statut === 200 && /JSON exploitable/.test(c.corps ? jugerCharge(c.corps) : '');

  console.log('\n## C. Verdict');
  if (okNode) {
    console.log('  La source repond correctement a Node DEPUIS CE SERVEUR. L echec du');
    console.log('  scraping a donc une autre cause que l acces reseau : lire');
    console.log('  /var/log/cron_indices_daily.log et la logique de date de scrapeMASI.');
  } else if (okCurl) {
    console.log('  Node echoue, curl passe. C est le cas bkam.ma a l identique :');
    console.log('  empreinte TLS ou reputation d IP. Correctif borne et deja eprouve');
    console.log('  dans ce fichier — router MASI par curlGetText. Aucune donnee');
    console.log('  inventee, aucune autre chaine touchee.');
  } else {
    console.log('  Ni Node ni curl n obtiennent la charge attendue depuis ce serveur.');
    console.log('  Changer de client ne suffira pas : il faut une autre source MASI');
    console.log('  ou une negociation d acces. Ne pas fabriquer de valeur d indice.');
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => {
  console.error(`Erreur fatale : ${e.message}`);
  process.exit(2);
});
