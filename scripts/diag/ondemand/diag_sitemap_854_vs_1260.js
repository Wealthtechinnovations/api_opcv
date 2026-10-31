/**
 * DIAG — pourquoi le sitemap de production n'offre-t-il que 854 fonds sur 1 260 ?
 *
 * LECTURE SEULE. Uniquement des requetes GET. Aucune ecriture, aucune mutation.
 *
 * L ECART MESURE. Le sitemap servi par `africafunds.chainsolutions.fr` compte
 * 976 URL, dont 854 de fonds et 85 de societes de gestion. La MEME version du
 * code, lancee dans un conteneur de session contre la MEME API publique, en
 * genere 1 454 : 1 260 fonds et 157 societes. Soit 406 fonds (32 %) non soumis
 * a l indexation.
 *
 * CE QUI EST DEJA ECARTE, et il ne faut pas y revenir :
 *   - un CACHE HTTP : la reponse porte `cache-control: public, max-age=0,
 *     must-revalidate`, et le module declare `export const dynamic =
 *     'force-dynamic'` ;
 *   - un SEUIL d identifiant : les identifiants absents (min 1141, mediane
 *     2735) CHEVAUCHENT les presents (min 569, mediane 1011) ;
 *   - des SLUGS manquants ou en doublon : `/api/searchFunds` rend 1 260 fonds,
 *     tous avec un slug, zero doublon ;
 *   - un FIGEMENT A LA CONSTRUCTION. C etait mon hypothese au lot DL de
 *     `SUIVI.md`, et elle est REFUTEE : le build deploye sert deja les
 *     metadonnees corrigees des fiches fonds (commit b4252ae), et
 *     `force-dynamic` a ete ajoute au sitemap AVANT ce commit (de23827). Le
 *     build en service calcule donc le sitemap a chaque requete. Un build
 *     recent ne peut pas avoir fige 854 fonds a sa construction.
 *
 * CE QUE CE SCRIPT SEPARE, et que rien d exterieur ne peut separer : il
 * interroge depuis S2 lui-meme.
 *
 *   A. Combien de fonds l API rend-elle AU SERVEUR ? Si S2 obtient 854 la ou
 *      l exterieur obtient 1 260, la cause est en amont du sitemap — reponse
 *      tronquee, limite, ou upstream different.
 *   B. Que calcule l application AVANT Nginx ? En interrogeant directement le
 *      port de l application, on separe « l application calcule 854 » de
 *      « Nginx sert une reponse mise en cache ».
 *
 * Les deux reponses ensemble designent un seul coupable. Aucune des deux seule
 * ne suffit, et c est pour cela qu elles sont dans le meme script.
 */
'use strict';

const { execFileSync } = require('child_process');

function obtenir(url, timeout = 90) {
  try {
    return execFileSync('curl', ['-s', '--max-time', String(timeout),
      '-H', 'User-Agent: diag-sitemap-s2', url],
      { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  } catch (e) {
    return `__ECHEC__ ${e.message.slice(0, 120)}`;
  }
}

function compterFonds(json) {
  try {
    const d = JSON.parse(json);
    const f = (d && d.data && d.data.funds) || [];
    const slugs = f.filter(x => x && x.slug).length;
    return { total: f.length, avecSlug: slugs };
  } catch (e) {
    return { erreur: `JSON illisible (${json.length} octets) : ${e.message.slice(0, 70)}` };
  }
}

function compterSitemap(xml) {
  if (xml.startsWith('__ECHEC__')) return { erreur: xml };
  const locs = xml.match(/<loc>[^<]*<\/loc>/g) || [];
  const fonds = locs.filter(l => /\/funds\/[^/<]+<\/loc>$/.test(l)).length;
  const soc = locs.filter(l => l.includes('/fund-managers/')).length;
  return { total: locs.length, fonds, societes: soc, octets: xml.length };
}

(async () => {
  console.log('=== SITEMAP : 854 FONDS SERVIS CONTRE 1 260 ATTENDUS — LECTURE SEULE ===');
  console.log(`horodatage : ${new Date().toISOString()}`);
  console.log('Requetes GET uniquement. Aucune mutation.\n');

  // ---- A. ce que l API rend AU SERVEUR lui-meme ----
  console.log('--- A. /api/searchFunds vu depuis S2 ---');
  for (const [etiquette, url] of [
    ['via le nom public', 'https://africafunds.chainsolutions.fr/api/searchFunds'],
    ['via localhost:3005', 'http://127.0.0.1:3005/api/searchFunds'],
  ]) {
    const r = compterFonds(obtenir(url));
    if (r.erreur) console.log(`  ${etiquette.padEnd(20)} ${r.erreur}`);
    else console.log(`  ${etiquette.padEnd(20)} ${r.total} fonds, dont `
      + `${r.avecSlug} avec slug`);
  }

  // ---- B. ce que l APPLICATION calcule, avant Nginx ----
  console.log('\n--- B. /sitemap.xml : application directe contre nom public ---');
  for (const [etiquette, url] of [
    ['application :3000', 'http://127.0.0.1:3000/sitemap.xml'],
    ['via le nom public', 'https://africafunds.chainsolutions.fr/sitemap.xml'],
  ]) {
    const r = compterSitemap(obtenir(url));
    if (r.erreur) console.log(`  ${etiquette.padEnd(20)} ${r.erreur.slice(0, 90)}`);
    else console.log(`  ${etiquette.padEnd(20)} ${r.total} URL `
      + `(${r.fonds} fonds, ${r.societes} societes) — ${r.octets} octets`);
  }

  console.log('\n--- LECTURE DU RESULTAT ---');
  console.log('  A donne 854 et B donne 854 partout  -> l API tronque pour S2.');
  console.log('  A donne 1260 et B:3000 donne 1260    -> Nginx sert du cache.');
  console.log('  A donne 1260 et B:3000 donne 854     -> l application tronque :');
  console.log('      cache de donnees Next persistant malgre force-dynamic.');
  console.log('  :3000 injoignable                    -> le port differe ; relever');
  console.log('      le port reel dans la config PM2 avant de conclure.');
  console.log('\nLECTURE SEULE : aucune ecriture effectuee.');
})();
