/**
 * Quelle source MASI est reellement joignable depuis S2 — et pourquoi pas ?
 *
 * POURQUOI. `diag_source_masi.js` a tranche le 2026-10-04 : l API medias24 que
 * `scrapeMASI` interroge rend 403 Cloudflare a Node ET a curl depuis le
 * serveur. Changer de client HTTP ne corrigera rien ; il faut une autre source,
 * et la regle du projet interdit d inventer une valeur d indice.
 *
 * CORRECTION D INSTRUMENT. La premiere version de ce script enveloppait curl
 * dans `execFileSync`, qui LEVE des que curl sort en code non nul. Quatre
 * candidats sur six ont donc rendu « Command failed » en avalant le code de
 * sortie et stderr — c est a dire en avalant la cause. Un instrument qui perd
 * la raison de l echec ne mesure rien. On passe par `spawnSync`, qui ne leve
 * pas, et on imprime le code curl et stderr.
 *
 * DEUXIEME CORRECTION D INSTRUMENT. Le marqueur de cette sonde s appelait
 * « @@META@@ ». curl traite un `-w` qui commence par `@` comme un NOM DE
 * FICHIER a lire : l option sortait en erreur 26, stdout restait vide, et la
 * sonde affichait « ECHEC curl code 0 » pour les deux hotes qui repondaient
 * reellement. Reproduit en local avant correction, et le marqueur verifie sur
 * un cas CONNU — l API de production, HTTP 200 — avant d etre cru sur un cas
 * inconnu. Deux pannes d instrument de suite sur la meme sonde : c est la
 * lecon a retenir, un outil neuf se verifie sur du connu d abord.
 *
 * HYPOTHESE TESTEE EN PLUS. Les quatre muets (casablanca-bourse.com, ammc.ma)
 * publient des enregistrements AAAA ; bkam.ma et medias24, qui ont repondu,
 * sont joignables en IPv4. Une sortie IPv6 cassee sur S2 produirait exactement
 * ce partage. Chaque URL est donc tentee deux fois : telle quelle, puis forcee
 * en IPv4 (`-4`). Si `-4` passe la ou le defaut echoue, la panne n est pas
 * marocaine mais reseau, et elle touche potentiellement d autres scrapers.
 *
 * LECTURE SEULE. Aucune ecriture. Requetes GET vers des sites publics.
 *
 * USAGE  node scripts/diag/ondemand/diag_sources_masi_alternatives.js
 */
const { spawnSync } = require('child_process');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CANDIDATES = [
  ['bourse de Casablanca — accueil',   'https://www.casablanca-bourse.com/'],
  ['bourse de Casablanca — indices',   'https://www.casablanca-bourse.com/fr/live-market/marche-actions/indices'],
  ['AMMC',                             'https://www.ammc.ma/'],
  ['Bank Al-Maghrib',                  'https://www.bkam.ma/'],
  ['medias24 (temoin, 403 attendu)',   'https://medias24.com/content/api?method=getMasiHistory&periode=1m&format=json'],
];

// Les codes de sortie de curl disent la nature de la panne, la ou « Command
// failed » ne dit rien du tout.
const SENS_CURL = {
  5: 'proxy introuvable', 6: 'hote non resolu', 7: 'connexion impossible',
  28: 'delai depasse', 35: 'echec de la poignee de main TLS',
  56: 'reception interrompue', 60: 'certificat non verifiable',
};

function appel(url, forcerIPv4) {
  const args = ['-sS', '--max-time', '25', '-L',
    '-w', '\nZZMETAZZ%{http_code}|%{content_type}|%{size_download}|%{remote_ip}',
    '-H', `User-Agent: ${UA}`];
  if (forcerIPv4) args.push('-4');
  args.push(url);
  const r = spawnSync('curl', args, { encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });
  const sortie = r.stdout || '';
  const i = sortie.lastIndexOf('ZZMETAZZ');
  if (i < 0) {
    return { code: r.status, erreur: (r.stderr || '').trim().slice(0, 200), corps: '' };
  }
  const [statut, ctype, taille, ip] = sortie.slice(i + 8).split('|');
  return {
    code: r.status, statut: Number(statut), ctype: (ctype || '').split(';')[0],
    taille: Number(taille), ip, corps: sortie.slice(0, i),
    erreur: (r.stderr || '').trim().slice(0, 200),
  };
}

const cloudflare = c => /just a moment|cf-browser-verification|challenge-platform/i.test(c);

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
  while ((m = re.exec(corps)) !== null && s.size < 10) s.add(m[1]);
  return [...s];
}

function rendre(etiquette, r) {
  if (r.statut === undefined) {
    const sens = SENS_CURL[r.code] ? ` — ${SENS_CURL[r.code]}` : '';
    console.log(`  ${etiquette} : ECHEC curl code ${r.code}${sens}`);
    if (r.erreur) console.log(`      stderr : ${r.erreur}`);
    return;
  }
  console.log(`  ${etiquette} : HTTP ${r.statut} | ${r.ctype || '-'} | ${r.taille} o | ip ${r.ip || '-'}`);
  if (!r.corps) return;
  if (cloudflare(r.corps)) { console.log('      → interstitielle Cloudflare : inutilisable par script'); return; }
  const c = candidatsMASI(r.corps);
  console.log(`      → candidats « MASI + nombre > 1000 » : ${c.length ? c.join(' | ') : 'aucun'}`);
  const a = cheminsApi(r.corps);
  if (a.length) console.log(`      → chemins /api/ : ${a.join(' ')}`);
}

(async () => {
  console.log('=== SOURCES MASI ALTERNATIVES — CE QUI REPOND DEPUIS S2 ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  for (const [nom, url] of CANDIDATES) {
    console.log(`## ${nom}`);
    console.log(`  ${url}`);
    rendre('defaut ', appel(url, false));
    rendre('en IPv4', appel(url, true));
    console.log('');
  }

  console.log('Rappel : la source retenue devra etre autoritative et fournir une');
  console.log('SERIE datee, pas un cours instantane — `propagateIndRef` apparie une');
  console.log('date de VL a une date d indice a +/- 7 jours.');
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => {
  console.error(`Erreur fatale : ${e.message}`);
  process.exit(2);
});
