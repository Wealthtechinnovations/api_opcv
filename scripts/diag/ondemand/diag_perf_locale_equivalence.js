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
// Perimetre reduit de 20 a 10 fonds par pays le 2026-10-07 : depuis cette
// date le script appelle aussi l endpoint de ratios, jusqu a trois fois par
// fonds. Vingt fonds sur deux pays feraient jusqu a 120 appels HTTP dans la
// SEULE session SSH du canal a la demande — et un script de dix minutes casse
// le tunnel (`client_loop: send disconnect: Broken pipe`, lecon du lot BS).
// Le plafond ci-dessous borne le pire cas a cinq minutes au total.
for (const pays of ['NIGERIA', 'UEMOA']) {
  console.log(`########## ${pays}`);
  const r = spawnSync('node', ['scripts/fix/fix_populate_performances.js',
    '--pays', pays, '--dry-run', '--limit', '10'],
    { cwd: RACINE, encoding: 'utf8', timeout: 150000, maxBuffer: 8 * 1024 * 1024 });
  const sortie = `${r.stdout || ''}${r.stderr || ''}`;
  const utiles = sortie.split(/\r?\n/).filter(l =>
    // LES LIGNES DE DETAIL sont retenues, c est-a-dire la seule chose qui
    // permette de trancher. Le filtre precedent les laissait tomber : la sortie
    // du 2026-10-15 annoncait « DIVERGENT : 1 ... perf10ans 1 fonds » sans
    // jamais donner les deux nombres, donc sans permettre de dire si l ecart
    // etait un arrondi ou un desaccord reel. Un filtre qui retient le verdict
    // et jette la preuve ne sert a rien.
    /DRY-RUN|Fonds sans aucun|Fonds avec desaccord|Fonds absents|ecart|CRITERE|DIVERGENT|PERDU|COMBLE|Options|fonds a traiter|ERROR|limite|Colonnes comparees|ratios|Ratios|calcule=|stocke=|^ {2}[a-z_0-9]+ +[0-9]+ fonds$/i.test(l));
  console.log(utiles.length ? utiles.join('\n') : '(aucune ligne retenue)');
  console.log(`-- code de sortie : ${r.status}${r.error ? ` | ${r.error.message}` : ''}\n`);
}

// TROISIEME PASSE — ciblee sur le fonds qui diverge.
//
// POURQUOI. La passe UEMOA du 2026-10-15 a sorti « DIVERGENT : 1 ... perf10ans
// 1 fonds » sur [1543] SOAGA EPARGNE ACTIVE, derniere VL au 2024-11-01. Un seul
// fonds, une seule colonne — mais le critere de bascule exige zero, donc il faut
// les deux nombres, pas le constat.
//
// On relance le MEME code sur ce seul fonds plutot que de reecrire le calcul
// ailleurs : une reimplementation ne prouverait rien sur celle qui tourne.
// `perf10ans` n est PAS lu par le classement (zero occurrence dans
// `ranking.pure.js`), mais il EST servi par `apigestionperformance.js`, donc il
// s affiche sur la fiche fonds. L ecart ne deplace aucun rang et change un
// chiffre affiche : a expliquer avant toute bascule, pas a laisser passer.
const FONDS_DIVERGENTS = ['1543'];
for (const fond of FONDS_DIVERGENTS) {
  console.log(`########## FONDS ${fond} — passe ciblee, detail complet`);
  const r = spawnSync('node', ['scripts/fix/fix_populate_performances.js',
    '--fond', fond, '--dry-run'],
    { cwd: RACINE, encoding: 'utf8', timeout: 90000, maxBuffer: 8 * 1024 * 1024 });
  const sortie = `${r.stdout || ''}${r.stderr || ''}`;
  // Ici on ne filtre presque rien : le perimetre est d un fonds, le volume est
  // borne, et c est le detail qu on vient chercher.
  const utiles = sortie.split(/\r?\n/).filter(l =>
    l.trim() && !/^\s*\[\d+\/\d+\]/.test(l));
  console.log(utiles.slice(0, 60).join('\n'));
  console.log(`-- code de sortie : ${r.status}${r.error ? ` | ${r.error.message}` : ''}\n`);
}

console.log('=== FIN — dry-run uniquement, aucune ecriture effectuee ===');
