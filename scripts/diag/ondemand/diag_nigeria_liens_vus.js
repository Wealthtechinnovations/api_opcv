/**
 * La page d index livre-t-elle le document 1537 a NOTRE code, depuis le serveur ?
 *
 * CE QUI EST ETABLI, ET CE QUI NE L EST PAS.
 *
 * Etabli : le journal du cron du 26/10 liste les 41 classeurs lus par ordre
 * alphabetique et passe de `16th_January_2026` directement a
 * `17th_April_2026`. `16th_October_2026` n y figure NULLE PART. L extracteur ne
 * l a pas ecarte, ni mal lu : il ne l a pas VU. Et la page, lue le 2026-10-28,
 * le porte bien — document 1537, mis en ligne le 25 octobre.
 *
 * MA CONCLUSION PRECEDENTE ETAIT FAUSSE, et c est ce script-ci qui l a montree.
 * J avais annonce « cadence hebdomadaire = 14 a 24 jours, budget de 14 jours
 * inatteignable ». Le calcul fait proprement rend 10 jours, pire cas 10 jours,
 * DANS le budget : donnees du 16/10 en ligne le 25, premier lundi le 26. Je
 * raisonnais sur l ecart entre la valorisation et aujourd hui en l imputant a
 * la frequence, sans calculer ce que la frequence produit. La cadence n est
 * donc PAS le defaut.
 *
 * CE QUI RESTE A SEPARER, et ce script le fait depuis le serveur :
 *   (B2a) la page ne listait pas encore le 1537 le 26/10 a 10:00 — la mention
 *         « 25 octobre » serait une date de document, pas de mise en ligne.
 *         Rien a reparer dans le code, et le filet quotidien suffit ;
 *   (B2b) la page le listait et notre `fetch_year_links` ne le rend pas —
 *         requete en erreur silencieuse, pagination, rendu client, ou filtre
 *         trop etroit. C est un defaut de code, et il se reproduira.
 *
 * Le script reproduit EXACTEMENT les filtres de `fetch_year_links`
 * (sec_ng_nav_extractor_v6.py, lignes 682-721) : meme condition sur l extension
 * et le libelle, meme exclusion des URL contenant `weekly-nav-for-cis`, meme
 * dedoublonnage par URL. Une regle differente repondrait a une autre question
 * que celle posee.
 *
 * Il repond par des nombres : combien de liens la page rend, combien nos
 * filtres retiennent, et si le 1537 est parmi eux.
 *
 * LECTURE SEULE. Une seule requete HTTP GET sur une page publique de la SEC,
 * celle que le cron interroge chaque lundi. Aucune ecriture, aucun
 * telechargement de classeur, aucune requete SQL.
 *
 * USAGE  node scripts/diag/ondemand/diag_nigeria_liens_vus.js
 */
const https = require('https');

const PAGE = 'https://sec.gov.ng/for-operators/keep-track-of-capital-market-data'
  + '/net-asset-value-data/weekly-net-asset-value-for-cis/2026-weekly-nav-for-cis/';
const ENTETES = { 'User-Agent': 'Mozilla/5.0 (compatible; FundAfrica-diag/1.0)' };

const obtenir = url => new Promise((ok, ko) => {
  const r = https.get(url, { headers: ENTETES, timeout: 30000 }, res => {
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
      res.resume();
      return obtenir(new URL(res.headers.location, url).toString()).then(ok, ko);
    }
    let c = '';
    res.setEncoding('utf8');
    res.on('data', d => { c += d; });
    res.on('end', () => ok({ code: res.statusCode, corps: c }));
  });
  r.on('timeout', () => { r.destroy(new Error('delai depasse')); });
  r.on('error', ko);
});

(async () => {
  console.log('=== LA PAGE D INDEX LIVRE-T-ELLE LE 1537 A NOTRE CODE ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE`);
  console.log('Une requete GET sur la page publique que le cron interroge chaque lundi.\n');

  let rep;
  try { rep = await obtenir(PAGE); }
  catch (e) {
    console.log(`## ECHEC DE LA REQUETE : ${e.message}`);
    console.log('  → piste (B2b) la plus brutale : depuis le serveur, la page est');
    console.log('    INJOIGNABLE. Et `fetch_year_links` appelle `raise_for_status()`,');
    console.log('    donc l extracteur leverait — a verifier dans la trace du cron.');
    process.exitCode = 2;
    return;
  }

  console.log(`## 1. REPONSE : HTTP ${rep.code}, ${rep.corps.length} octets`);
  if (rep.code !== 200) {
    console.log('  → piste (B2b) : la page ne repond pas 200 depuis le serveur.');
    process.exitCode = 2;
    return;
  }

  // Memes filtres que fetch_year_links, sans dependance a BeautifulSoup.
  const ancres = [...rep.corps.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const retenus = new Map();
  for (const [, href, interieur] of ancres) {
    const titre = interieur.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const complet = new URL(href, PAGE).toString();
    const blob = `${href} ${titre}`.toLowerCase();
    const estClasseur = blob.includes('.xlsx') || blob.includes('.xlsm') || blob.includes('.xls')
      || (blob.includes('/documents/') && blob.includes('asset value'))
      || (blob.includes('/documents/') && blob.includes('unit price'))
      || (blob.includes('/documents/') && blob.includes('nav'));
    if (!estClasseur) continue;
    if (complet.toLowerCase().includes('weekly-nav-for-cis')) continue;
    retenus.set(complet, titre);
  }
  console.log(`\n## 2. CE QUE NOS FILTRES RETIENNENT`);
  console.log(`  ${ancres.length} ancre(s) dans la page | ${retenus.size} classeur(s) retenu(s)`);
  console.log(`  Le cron du 26/10 en avait lu 41.`);

  // ---- 3. Le 1537, nommement ---------------------------------------
  const cible = [...retenus].filter(([u, t]) =>
    /1537/.test(u) || /16th[_ ]october[_ ]2026/i.test(u) || /16th october 2026/i.test(t));
  console.log('\n## 3. LE DOCUMENT 1537 (donnees du 16 octobre)');
  if (cible.length) {
    for (const [u, t] of cible) console.log(`  TROUVE : ${u}\n           « ${t.slice(0, 110)} »`);
    console.log('\n  → PISTE (B2b) CONFIRMEE. La page le livre a nos propres filtres,');
    console.log('    depuis ce serveur, maintenant. Deux lectures possibles, et seule');
    console.log('    l instrumentation de l etape 1/8 les separera a la prochaine');
    console.log('    execution : soit la page a ete mise a jour APRES le 26/10 10:00,');
    console.log('    soit la requete du 26/10 a echoue ou rendu une page partielle.');
    console.log('    Dans les deux cas le defaut est le MEME : rien ne compte les liens');
    console.log('    vus, donc un lien manquant a la page est indistinguable d un lien');
    console.log('    manquant a notre lecture. C est ce qui a rendu ce trou invisible');
    console.log('    pendant trois semaines.');
  } else {
    console.log('  ABSENT de ce que nos filtres retiennent.');
    console.log('  → nos filtres ou le rendu de la page sont en cause. Lister les URL');
    console.log('    retenues les plus recentes pour voir ce qui passe et ce qui tombe.');
  }

  // ---- 4. Les plus recents, pour situer -----------------------------
  const mois = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'];
  const dates = [...retenus].map(([u]) => {
    const m = decodeURIComponent(u).match(/as_at_(\d{1,2})[a-z]{2}_([A-Za-z]+)_(\d{4})/i);
    if (!m) return null;
    const im = mois.indexOf(m[2].toLowerCase());
    if (im < 0) return null;
    return { u, d: `${m[3]}-${String(im + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}` };
  }).filter(Boolean).sort((a, b) => a.d.localeCompare(b.d));
  console.log('\n## 4. LES SIX VALORISATIONS LES PLUS RECENTES QUE LA PAGE OFFRE');
  for (const r of dates.slice(-6)) console.log(`  ${r.d}  ${r.u.slice(-62)}`);
  if (dates.length) {
    const max = dates[dates.length - 1].d;
    console.log(`\n  derniere valorisation offerte : ${max}`);
    console.log(`  derniere valorisation en base  : 2026-10-09 (mesure du 2026-10-28)`);
    console.log(max > '2026-10-09'
      ? '  → ECART CONFIRME : la source offre plus recent que ce que nous avons.'
      : '  → pas d ecart : la source n offre rien de plus recent.');
  }

  console.log('\n## CORRECTIF RECOMMANDE, par ordre d utilite');
  console.log('  1. INSTRUMENTER l etape 1/8 : imprimer le nombre de liens VUS sur la');
  console.log('     page, TELECHARGES, et DEJA EN CACHE. Sans cela le prochain raté');
  console.log('     sera aussi muet que celui-ci. C est le correctif de fond.');
  console.log('  2. Faire ECHOUER l etape quand la derniere valorisation offerte par la');
  console.log('     page est plus recente que la derniere importee : le cron a alors vu');
  console.log('     un fichier et ne l a pas pris, ce qui doit etre une erreur, pas un OK.');
  console.log('  3. Cadence quotidienne : filet utile — un rate se rattrape le lendemain');
  console.log('     au lieu de la semaine suivante — mais PAS le correctif. La cadence');
  console.log('     hebdomadaire rend 10 jours, dans le budget de 14.');
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
