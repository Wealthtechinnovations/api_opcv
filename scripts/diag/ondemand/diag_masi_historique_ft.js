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

  // IDENTIFIER LA COLONNE DE CLOTURE, ET NE PAS LA DEVINER. Le tour precedent
  // a imprime « Fri, Oct 02, 2026 17,579.17 17,698.72 » et il aurait ete facile
  // d y lire une cloture. C en est une autre : la cloture du 02/10 vaut
  // 17 303,69, concordante entre African Markets et l entete de la page FT.
  // 17 579,17 est donc l ouverture, ou le plus haut. Prendre la premiere
  // colonne venue aurait fausse tout le benchmark marocain d environ +1,6 %,
  // sans qu aucun controle ne puisse le voir.
  //
  // On extrait donc toutes les cellules de chaque ligne, et on identifie la
  // colonne par un CAS CONNU : celle qui porte 17 303,69 au 2 octobre est la
  // cloture. Une mesure qui se verifie elle-meme vaut mieux qu une convention
  // supposee sur l ordre des colonnes.
  const CLOTURE_CONNUE = 17303.69;
  const DATE_CONNUE = 'Oct 02, 2026';

  const nombre = s => Number(String(s).replace(/,/g, ''));
  const lignes = [];
  const reLigne = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let mr;
  while ((mr = reLigne.exec(fragment)) !== null) {
    const cellules = (mr[1].match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [])
      .map(c => c.replace(/<[^>]+>/g, ' ').replace(/&nbsp;?/gi, ' ').replace(/\s+/g, ' ').trim())
      .filter(c => c.length);
    if (cellules.length >= 2) lignes.push(cellules);
  }

  console.log(`  lignes de tableau trouvees : ${lignes.length}`);
  if (!lignes.length) {
    console.log('  Aucune ligne reconnue. Echantillon du fragment recu :');
    console.log(`    ${fragment.replace(/\s+/g, ' ').slice(0, 300)}`);
    console.log('  Ne pas conclure que la serie est absente : c est l analyse du');
    console.log('  fragment qu il faudra corriger.');
    console.log('\n=== FIN — aucune ecriture effectuee ===');
    return;
  }

  console.log('\n  Quatre lignes brutes, toutes colonnes :');
  for (const l of lignes.slice(0, 4)) console.log(`    ${l.join('  |  ')}`);

  const ligneTemoin = lignes.find(l => l[0] && l[0].includes(DATE_CONNUE));
  let colCloture = -1;
  if (ligneTemoin) {
    console.log(`\n  Ligne temoin du ${DATE_CONNUE} : ${ligneTemoin.join('  |  ')}`);
    for (let i = 1; i < ligneTemoin.length; i++) {
      if (Math.abs(nombre(ligneTemoin[i]) - CLOTURE_CONNUE) < 0.01) { colCloture = i; break; }
    }
    console.log(`  colonne portant la cloture connue ${CLOTURE_CONNUE} : ${colCloture >= 0 ? `n°${colCloture}` : 'AUCUNE'}`);
  } else {
    console.log(`\n  Pas de ligne au ${DATE_CONNUE} dans la reponse : temoin indisponible.`);
  }

  console.log('\n## 3. Verdict');
  if (colCloture >= 0) {
    console.log(`  La serie est accessible ET la colonne de cloture est identifiee`);
    console.log(`  (n°${colCloture}) par concordance avec une valeur connue de deux`);
    console.log('  sources independantes. Le rattrapage du 06/08 au 02/10 peut donc');
    console.log('  etre fait avec des clotures PUBLIEES, sans deduire aucune valeur.');
    console.log('\n  Clotures disponibles sur la fenetre manquante :');
    let n = 0;
    for (const l of lignes) {
      const v = nombre(l[colCloture]);
      if (!Number.isFinite(v) || v < 1000) continue;
      if (n < 8) console.log(`    ${l[0].padEnd(22)} cloture ${l[colCloture]}`);
      n++;
    }
    console.log(`  total : ${n} cloture(s) datee(s)`);

    // LE TEST DECISIF — LA JONCTION. Si la cloture FT du 31 juillet egale les
    // 17 843,70 que notre table a stockes ce jour-la, alors FT publie LA MEME
    // serie que celle suivie jusqu a la panne : le rattrapage est une
    // continuation, non un raccord entre deux sources d echelles possiblement
    // differentes. Si elles divergent, il faut le savoir AVANT d ecrire.
    const NOTRE_31_JUILLET = 17843.70;
    const jonction = lignes.find(l => l[0] && l[0].includes('Jul 31, 2026'));
    console.log('\n## 4. Jonction avec notre propre serie');
    if (!jonction) {
      console.log('  Le 31 juillet n est pas dans la fenetre renvoyee : jonction non');
      console.log('  verifiable ici. Ne pas conclure a une divergence.');
    } else {
      const v = nombre(jonction[colCloture]);
      const ecart = v - NOTRE_31_JUILLET;
      console.log(`  cloture FT au 31/07/2026 : ${jonction[colCloture]}`);
      console.log(`  valeur stockee par nous  : ${NOTRE_31_JUILLET}`);
      console.log(`  ecart                    : ${ecart.toFixed(2)} (${(100 * ecart / NOTRE_31_JUILLET).toFixed(4)} %)`);
      if (Math.abs(ecart) < 0.01) {
        console.log('  IDENTIQUES. FT publie la meme serie que celle suivie jusqu a la');
        console.log('  panne : le rattrapage est une continuation, pas un raccord.');
      } else if (Math.abs(100 * ecart / NOTRE_31_JUILLET) < 0.5) {
        console.log('  Tres proches sans etre identiques : meme indice, arrondi ou heure');
        console.log('  de releve differente. Acceptable, mais a documenter.');
      } else {
        console.log('  DIVERGENTES. Ne rien ecrire : deux series differentes ne se');
        console.log('  raccordent pas sans decision explicite.');
      }
    }
  } else {
    console.log('  La serie repond, mais la colonne de cloture n est PAS identifiee.');
    console.log('  Ne rien ecrire en base dans cet etat : prendre la mauvaise colonne');
    console.log('  faussait le benchmark de ~1,6 % sans qu aucun controle le voie.');
  }

  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => {
  console.error(`Erreur fatale : ${e.message}`);
  process.exit(2);
});
