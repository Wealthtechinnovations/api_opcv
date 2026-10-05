/**
 * Le rattrapage de huit semaines de MASI tiendrait-il, et que couvrirait-il ?
 *
 * POURQUOI MAINTENANT. Le repli FT est livre et verifie, et le cron de 18h30
 * repeuplera MASI sur sa fenetre glissante de sept jours. Mais le trou va du
 * 06/08 au ~28/09 : huit semaines hors de cette fenetre. Le rattrapage attend
 * un accord, parce qu il ecrit des donnees financieres.
 *
 * Ce diagnostic ne le fait pas : il mesure ce qu il FERAIT, pour que la decision
 * se prenne sur des chiffres et que l execution, le jour venu, ne reserve aucune
 * surprise. Trois inconnues a lever avant de demander un feu vert :
 *
 *   1. COUVERTURE — combien de seances du trou la source FT rend-elle
 *      reellement ? Un rattrapage qui ne couvre que la moitie des dates laisse
 *      un benchmark en dents de scie, ce qui est pire qu une absence franche.
 *   2. BRIDAGE — soixante appels d affilee a FT passent-ils, ou la source
 *      coupe-t-elle en route ? Le cas echeant, il faudra etaler.
 *   3. COHERENCE — les valeurs rendues s enchainent-elles sans rupture
 *      d echelle avec les 17 843,70 du 31/07 deja en base ?
 *
 * Le scraper est lance en **dry-run**, son mode par defaut. `--execute` n est
 * pas passe et ne doit pas l etre par ce diagnostic.
 *
 * LECTURE SEULE : dry-run, aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_rattrapage_masi_dryrun.js
 */
const { spawnSync } = require('child_process');
const path = require('path');

const RACINE = path.resolve(__dirname, '../../..');
const SCRAPER = 'scripts/scraper/scrape_indices_daily.js';
// Du 31/07 (derniere valeur en base) a aujourd hui : la fenetre a instruire.
const JOURS = 67;

console.log('=== RATTRAPAGE MASI — CE QU IL FERAIT, SANS LE FAIRE ===');
console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — DRY-RUN, AUCUNE ECRITURE\n`);

const debut = Date.now();
const r = spawnSync('node', [SCRAPER, '--dry-run', '--backfill-days', String(JOURS), '--skip-indref', '--verbose'],
  { cwd: RACINE, encoding: 'utf8', timeout: 900000, maxBuffer: 24 * 1024 * 1024 });
const duree = ((Date.now() - debut) / 1000).toFixed(0);
const sortie = `${r.stdout || ''}${r.stderr || ''}`;

// `--skip-indref` est passe exprès : on mesure l alimentation de
// `indice_references`, pas la propagation aux VL, qui est l etape suivante et
// se juge separement avec propagate_indref_range.js.

const succes = [...sortie.matchAll(/\[MASI\] SUCCESS via ([^:]+): ([\d.]+)/g)].map(m => ({ via: m[1].trim(), val: Number(m[2]) }));
const insererait = [...sortie.matchAll(/\[MASI\] DRY-RUN: insererait ([\d.]+) pour (\d{4}-\d{2}-\d{2})/g)]
  .map(m => ({ val: Number(m[1]), date: m[2] }));
const dejaLa = (sortie.match(/\[MASI\][^\n]*deja existant/gi) || []).length;
const nonOuvres = (sortie.match(/\[MASI\][^\n]*jour non ouvre/gi) || []).length;
const erreurs = [...sortie.matchAll(/\[MASI\][^\n]*(ERROR|ECHEC)[^\n]*/g)].map(m => m[0].trim());

console.log(`## Volumetrie sur ${JOURS} jours (duree reelle ${duree} s)\n`);
console.log(`  seances obtenues de la source   : ${succes.length}`);
console.log(`  dates qui seraient inserees     : ${insererait.length}`);
console.log(`  dates deja en base              : ${dejaLa}`);
console.log(`  jours non ouvres, ecartes        : ${nonOuvres}`);
console.log(`  erreurs ou echecs MASI          : ${erreurs.length}`);

if (insererait.length) {
  const triees = [...insererait].sort((a, b) => a.date.localeCompare(b.date));
  console.log(`\n## Ce qui serait ecrit — ${triees[0].date} → ${triees[triees.length - 1].date}\n`);
  for (const x of triees.slice(0, 10)) console.log(`    ${x.date}  ${x.val}`);
  if (triees.length > 10) console.log(`    … et ${triees.length - 10} autre(s)`);

  // COHERENCE : une serie d indice ne saute pas de 10 % d un jour ouvre a
  // l autre. On mesure la plus grande variation entre deux dates consecutives
  // de ce qui serait ecrit, et on la compare au raccord avec la base.
  let pireEcart = 0, pireOu = '';
  for (let i = 1; i < triees.length; i++) {
    const e = Math.abs(100 * (triees[i].val - triees[i - 1].val) / triees[i - 1].val);
    if (e > pireEcart) { pireEcart = e; pireOu = `${triees[i - 1].date} → ${triees[i].date}`; }
  }
  const NOTRE_31_JUILLET = 17843.70;
  const raccord = 100 * (triees[0].val - NOTRE_31_JUILLET) / NOTRE_31_JUILLET;
  console.log(`\n## Coherence\n`);
  console.log(`  plus grande variation entre deux seances : ${pireEcart.toFixed(2)} % (${pireOu})`);
  console.log(`  raccord avec la base au 31/07 (17 843,70) : ${raccord.toFixed(2)} % pour ${triees[0].date}`);
  console.log(pireEcart < 5
    ? '  Aucune rupture d echelle : la serie s enchaine normalement.'
    : '  ATTENTION : variation anormale entre deux seances, ne pas ecrire en l etat.');
}

if (erreurs.length) {
  console.log('\n## Erreurs rencontrees (dix premieres)\n');
  for (const e of erreurs.slice(0, 10)) console.log(`    ${e}`);
  console.log('\n  Si elles apparaissent en fin de serie, c est un bridage de la source :');
  console.log('  le rattrapage devra etre etale, pas abandonne.');
}

console.log(`\n-- code de sortie du scraper : ${r.status}${r.error ? ` | ${r.error.message}` : ''}`);
console.log('\n=== FIN — dry-run uniquement, aucune ecriture effectuee ===');
