/**
 * La phase seche de `fix_doublons_vl.js`, executee sur la production.
 *
 * POURQUOI PASSER PAR ICI. Le correctif vit dans `scripts/fix/`, qui n est pas
 * execute par le canal a la demande — et c est voulu : un script capable
 * d ecrire ne doit pas tourner automatiquement a chaque poussee. Mais sa phase
 * seche, elle, doit etre lue AVANT toute validation. Ce fichier appelle donc le
 * correctif en mode dry-run, sans `--execute`, pour que son rapport arrive dans
 * `docs/DIAG_ONDEMAND.md` et puisse etre arbitre sur des chiffres.
 *
 * Ce qu il faut verifier dans la sortie, et dans cet ordre :
 *   1. le nombre de paires — attendu 19, mesure du 2026-10-28 05:26 UTC ;
 *   2. « A ARBITRER » doit afficher ZERO. S il affiche autre chose, une paire
 *      porte deux valeurs non nulles differentes, et il faudra decider laquelle
 *      est juste avant tout nettoyage ;
 *   3. le verdict sur l index UNIQUE : creable ou non.
 *
 * Si ces trois points sont conformes, la suppression est mecanique : 19 lignes
 * a zero, chacune en regard d une valeur reelle a la meme date, avec instantane
 * de retour arriere. Elle reste neanmoins une ecriture en base, donc une
 * decision du proprietaire.
 *
 * LECTURE SEULE : le correctif est invoque SANS `--execute`. Sa phase seche ne
 * fait que des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_doublons_vl_dryrun.js
 */
const path = require('path');
const { execFileSync } = require('child_process');

const RACINE = path.resolve(__dirname, '../../../');
const CORRECTIF = path.join(RACINE, 'scripts/fix/fix_doublons_vl.js');

console.log('=== PHASE SECHE DE fix_doublons_vl.js ===');
console.log(`Appel le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);
console.log('Invoque SANS --execute : aucune ecriture possible.\n');

try {
  const sortie = execFileSync('node', [CORRECTIF], {
    cwd: RACINE, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024,
  });
  console.log(sortie);
} catch (e) {
  console.log(e.stdout || '');
  console.error(`ECHEC de la phase seche : ${e.message}`);
  if (e.stderr) console.error(e.stderr);
  process.exitCode = 2;
}
console.log('=== FIN — aucune ecriture effectuee ===');
