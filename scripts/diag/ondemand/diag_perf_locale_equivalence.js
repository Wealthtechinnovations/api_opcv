/**
 * Le calcul direct des performances locales donne-t-il les MEMES chiffres que
 * la route de l API ?
 *
 * POURQUOI. Mesure du 2026-10-05, deja presente dans ce rapport : les
 * performances LOCALES sont a jour pour 3,1 % des fonds marocains, avec 122
 * jours de retard moyen, tandis que les performances EUR et USD datent du
 * 02/10. L asymetrie n est pas un hasard, elle est dans le cron :
 *
 *   etape 8/9  EUR/USD  → node scripts/fix/fix_populate_performances_eur_usd.js
 *   etapes 5-7 locale   → curl http://localhost:3005/api/saveperfdatemysql/:a/:b
 *
 * Et cette route n effectue aucun calcul : pour chaque fonds ET chaque date,
 * elle emet une requete HTTP interne vers sa propre API, dans le processus qui
 * sert deja la requete. Le journal du cron le confirme — « [5b/8] ERREUR
 * (HTTP 000) » sur le lot 601-1200, la ou EUR et USD traitent 586/586 fonds.
 *
 * `fix_populate_performances.js`, pendant direct pour la devise locale, existe
 * depuis le 10 septembre et n a jamais ete branche. Le brancher est la
 * correction evidente — mais substituer un calcul a un autre sans verifier
 * qu ils donnent les memes chiffres serait precisement ce que ce depot
 * interdit.
 *
 * CE SCRIPT EST CETTE VERIFICATION. Il lance le calcul direct en `--dry-run`
 * sur un pays dont les performances stockees SONT fraiches — le Nigeria, 93,1 %
 * a jour, 7,5 jours de retard moyen — et compare champ par champ ce qu il
 * calculerait a ce que la route a reellement ecrit. Si tout concorde a moins
 * d un centieme de point, les deux calculs sont equivalents et la substitution
 * est neutre. Sinon, les ecarts doivent etre expliques avant toute bascule.
 *
 * Le perimetre est borne a vingt fonds : le canal a la demande passe par une
 * session SSH unique et un script de dix minutes casse le tunnel — lecon du
 * lot BS.
 *
 * LECTURE SEULE : `--dry-run`, aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_perf_locale_equivalence.js
 */
const { spawnSync } = require('child_process');
const path = require('path');

const RACINE = path.resolve(__dirname, '../../..');

console.log('=== PERFORMANCES LOCALES — EQUIVALENCE CALCUL DIRECT / ROUTE API ===');
console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — DRY-RUN, AUCUNE ECRITURE\n`);

// Nigeria d abord : c est le seul pays dont les performances stockees sont
// fraiches, donc le seul ou la comparaison a un sens. Comparer sur le Maroc
// opposerait le calcul du jour a des chiffres de juin : tout divergerait, et
// cela ne dirait rien des formules.
for (const pays of ['NIGERIA', 'UEMOA']) {
  console.log(`########## ${pays}`);
  const r = spawnSync('node', ['scripts/fix/fix_populate_performances.js',
    '--pays', pays, '--dry-run', '--limit', '20'],
    { cwd: RACINE, encoding: 'utf8', timeout: 240000, maxBuffer: 8 * 1024 * 1024 });
  const sortie = `${r.stdout || ''}${r.stderr || ''}`;
  const utiles = sortie.split(/\r?\n/).filter(l =>
    /DRY-RUN|Identiques|Divergents|Absents|ecart|memes chiffres|ECARTS|Options|fonds a traiter|ERROR|limite/i.test(l));
  console.log(utiles.length ? utiles.join('\n') : '(aucune ligne retenue)');
  console.log(`-- code de sortie : ${r.status}${r.error ? ` | ${r.error.message}` : ''}\n`);
}

console.log('=== FIN — dry-run uniquement, aucune ecriture effectuee ===');
