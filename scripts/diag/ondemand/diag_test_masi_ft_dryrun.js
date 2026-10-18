/**
 * Le repli MASI par FT fonctionne-t-il reellement, lance depuis la production ?
 *
 * POURQUOI. `scrapeMASI` a recu un repli : medias24 d abord — ferme par
 * Cloudflare depuis fin juillet — puis la fiche FT markets MASI:CAS, dont la
 * cloture du 31/07 egale au centime les 17 843,70 stockes dans
 * `indice_references` ce jour-la. Le raccord est donc une continuation de la
 * meme serie, et non un melange de deux echelles.
 *
 * Reste a verifier que le code ecrit tient debout une fois execute sur le
 * serveur, et pas seulement dans ma lecture. On lance donc le scraper en
 * **dry-run**, qui est son mode par defaut : il lit la source, affiche ce qu il
 * insererait, et n ecrit rien. `--execute` n est PAS passe, et ne doit pas
 * l etre par ce diagnostic.
 *
 * Trois dates sont demandees : deux seances ouvrees recentes, dont une dont la
 * cloture est connue de deux sources independantes (02/10 → 17 303,69), et un
 * dimanche, qui doit etre refuse proprement et non recevoir la valeur du
 * vendredi.
 *
 * LECTURE SEULE : dry-run, aucune ecriture en base.
 *
 * USAGE  node scripts/diag/ondemand/diag_test_masi_ft_dryrun.js
 */
const { spawnSync } = require('child_process');
const path = require('path');

const RACINE = path.resolve(__dirname, '../../..');
const SCRAPER = 'scripts/scraper/scrape_indices_daily.js';

const CAS = [
  ['2026-10-02', 'seance ouvree — cloture connue : 17 303,69'],
  ['2026-09-30', 'seance ouvree — cloture attendue : 17 733,06'],
  ['2026-10-04', 'dimanche — doit etre refuse, pas rempli par la veille'],
];

for (const [date, attendu] of CAS) {
  console.log(`\n########## ${date} — ${attendu}`);
  const r = spawnSync('node', [SCRAPER, '--dry-run', '--date', date, '--verbose'],
    { cwd: RACINE, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
  const sortie = `${r.stdout || ''}${r.stderr || ''}`;
  // On ne garde que ce qui concerne MASI et le verdict d insertion : le script
  // traite cinq indices et son journal complet noierait la mesure.
  const utiles = sortie.split(/\r?\n/).filter(l =>
    /MASI|DRY|dry-run|inserer|insert|Resume|RESUME|Total|erreur|ERROR/i.test(l));
  console.log(utiles.length ? utiles.join('\n') : '(aucune ligne retenue)');
  console.log(`-- code de sortie : ${r.status}${r.error ? ` | ${r.error.message}` : ''}`);
}

console.log('\n=== FIN — dry-run uniquement, aucune ecriture effectuee ===');
