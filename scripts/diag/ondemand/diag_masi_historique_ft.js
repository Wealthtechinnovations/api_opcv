/**
 * Peut-on obtenir une SERIE HISTORIQUE MASI depuis S2 ?
 *
 * POURQUOI. Etat mesure au 2026-10-04 : la source d origine (medias24) est
 * fermee par Cloudflare, la bourse de Casablanca et l AMMC ne repondent pas du
 * tout depuis ce serveur, bkam.ma rend 403, Yahoo 429, Stooq ne connait pas le
 * symbole. Deux sources repondent et donnent le MEME niveau au centime :
 *
 *   African Markets  — « MASI INDEX | As of 02-Oct-2026 »  17 303,69  -1,57 %
 *   FT markets       — « MASI:CAS ALL SHARES INDEX, Price (MAD) » 17 303,69  -1,57 %
 *
 * Cette concordance de deux sources independantes est la meilleure validation
 * disponible, et l echelle colle a notre serie : 17 843,70 stockes au 31/07,
 * soit -3,03 % en deux mois quand les pages affichent -5,44 % sur 3 mois.
 *
 * Mais aucune des deux ne donne de SERIE dans sa page : le rattrapage du 06/08
 * au 02/10 reste donc impossible. Or la page FT charge son tableau historique
 * par requete XHR, et cette requete est atteignable si l on extrait l
 * identifiant interne (`xid`) que la page porte dans ses attributs
 * `data-mod-config`. Ce script mesure les deux etapes :
 *
 *   1. l `xid` est-il extractible de la page tearsheet ?
 *   2. le point d acces historique repond-il, et rend-il des couples
 *      date + valeur sur la periode qui nous manque ?
 *
 * Si oui, le rattrapage devient possible SANS rien inventer : chaque date
 * manquante recevrait la cloture publiee pour cette date. Si non, il faudra le
 * dire et chercher ailleurs — jamais deduire une valeur d un pourcentage.
 *
 * LECTURE SEULE. Aucune ecriture, ni en base ni sur disque.
 *
 * USAGE  node scripts/diag/ondemand/diag_masi_historique_ft.js
 */
const { spawnSync } = require('child_process');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TEARSHEET = 'https://markets.ft.com/data/indices/tearsheet/historical?s=MASI:CAS';
// La fenetre qui nous manque, bornee a la derniere valeur stockee.
const DEBUT = '2026/07/25';
const FIN = '2026/10/05';

function get(url, entetes = []) {
  const args = ['-sS', '--max-time', '30', '-L',
    '-w', '\nZZMETAZZ%{http_code}|%{size_download}',
    '-H', `User-Agent: ${UA}`, ...entetes, url];
  const r = spawnSync('curl', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const s = r.stdout || '';
  const i = s.lastIndexOf('ZZMETAZZ');
  if (i < 0) return { code: r.status, erreur: (r.stderr || '').trim().slice(0, 200), corps: '' };
  const [statut, taille] = s.slice(i + 8).split('|');
  return { statut: Number(statut), taille: Number(taille), corps: s.slice(0, i) };
}

(async () => {
  console.log('=== SERIE HISTORIQUE MASI — ACCES DEPUIS S2 ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  console.log('## 1. Page tearsheet et extraction de l identifiant interne');
  const page = get(TEARSHEET);
  console.log(`  ${TEARSHEET}`);
  console.log(`  statut ${page.statut ?? 'aucune reponse'} | ${page.taille ?? 0} o`);
  if (!page.corps) {
    console.log('  Page vide : conclusion impossible.');
    console.log('\n=== FIN — aucune ecriture effectuee ===');
    return;
  }

  // L xid apparait dans les configurations de modules de la page, sous des
  // formes equivalentes selon l encodage des guillemets.
  const motifs = [
    /&quot;symbol&quot;\s*:\s*&quot;(\d{6,})&quot;/,
    /"symbol"\s*:\s*"(\d{6,})"/,
    /data-mod-config="[^"]*?(\d{8,})/,
  ];
  let xid = null;
  for (const re of motifs) {
    const m = page.corps.match(re);
    if (m) { xid = m[1]; break; }
  }
  console.log(`  identifiant interne : ${xid || 'INTROUVABLE'}`);

  if (!xid) {
    console.log('\n  Sans identifiant, le point d acces historique est inaccessible.');
    console.log('  Ne pas en deduire que la serie n existe pas : c est l extraction');
    console.log('  qui echoue, et il faudra regarder la structure reelle de la page.');
    // On montre ce que la page contient, pour la prochaine tentative.
    const ech = page.corps.match(/data-mod-config="[^"]{0,160}/g);
    if (ech) { console.log('  echantillon de configurations trouvees :'); for (const e of ech.slice(0, 3)) console.log(`    ${e}`); }
    console.log('\n=== FIN — aucune ecriture effectuee ===');
    return;
  }

  console.log('\n## 2. Point d acces historique');
  const url = `https://markets.ft.com/data/equities/ajax/get-historical-prices`
    + `?startDate=${encodeURIComponent(DEBUT)}&endDate=${encodeURIComponent(FIN)}&symbol=${xid}`;
  const hist = get(url, ['-H', `Referer: ${TEARSHEET}`, '-H', 'X-Requested-With: XMLHttpRequest']);
  console.log(`  statut ${hist.statut ?? 'aucune reponse'} | ${hist.taille ?? 0} o`);

  if (!hist.corps) { console.log('  Reponse vide.'); console.log('\n=== FIN — aucune ecriture effectuee ==='); return; }

  // La reponse est un JSON portant un fragment de tableau HTML.
  let fragment = hist.corps;
  try {
    const j = JSON.parse(hist.corps);
    if (typeof j.html === 'string') fragment = j.html;
  } catch { /* pas du JSON : on analyse le corps tel quel */ }

  const texte = fragment.replace(/<[^>]+>/g, '|').replace(/&nbsp;?/gi, ' ').replace(/\|+/g, '|');
  // Les dates FT se presentent « Fri, Oct 02, 2026 ».
  const lignes = texte.match(/[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{2}, \d{4}\|[^|]*\|[\d,\.]+/g) || [];
  console.log(`  couples date + valeur reperes : ${lignes.length}`);
  if (lignes.length) {
    console.log('\n  Les six premieres lignes, telles que publiees :');
    for (const l of lignes.slice(0, 6)) console.log(`    ${l.replace(/\|/g, '  ')}`);
    console.log('\n  VERDICT : une serie datee est accessible depuis S2 sur la periode');
    console.log('  manquante. Le rattrapage du 06/08 au 02/10 pourrait donc etre fait');
    console.log('  avec des clotures PUBLIEES, sans deduire aucune valeur.');
  } else {
    console.log('\n  Aucun couple date+valeur reconnu. Echantillon du corps recu :');
    console.log(`    ${texte.slice(0, 300).replace(/\s+/g, ' ')}`);
    console.log('  Ne pas conclure que la serie est absente : le format a peut-etre');
    console.log('  change. C est l analyse du fragment qu il faudra corriger.');
  }

  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => {
  console.error(`Erreur fatale : ${e.message}`);
  process.exit(2);
});
