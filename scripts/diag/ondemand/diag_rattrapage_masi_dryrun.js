/**
 * Que couvrirait exactement le rattrapage MASI, et que manque-t-il en base ?
 *
 * POURQUOI CETTE VERSION EST LA DEUXIEME. La premiere lancait le scraper en
 * dry-run sur soixante-sept dates. Resultat consigne dans le rapport :
 * `client_loop: send disconnect: Broken pipe` — le tunnel SSH du canal a la
 * demande a lache avant la fin, et la mesure a ete perdue. Deux lecons :
 *
 *   1. un script `ondemand` doit rester court ; le canal passe par une session
 *      SSH unique et n est pas fait pour dix minutes de travail ;
 *   2. ma methode etait de toute facon mauvaise. Le point d acces historique de
 *      FT rend une PLAGE ENTIERE en une seule requete — c est ainsi que
 *      `diag_masi_historique_ft.js` a obtenu 43 seances d un coup. Lancer le
 *      scraper date par date, c etait soixante-sept requetes pour ce qu une
 *      seule donne.
 *
 * Cette version interroge donc la plage complete en une fois et croise avec la
 * base : combien de seances la source publie, lesquelles manquent dans
 * `indice_references`, et la serie s enchaine-t-elle sans rupture d echelle.
 *
 * Elle ne lance pas le scraper et n ecrit rien : c est une mesure de ce que le
 * rattrapage FERAIT, pour que la decision se prenne sur des chiffres.
 *
 * LECTURE SEULE : un GET et des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_rattrapage_masi_dryrun.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const { spawnSync } = require('child_process');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TEARSHEET = 'https://markets.ft.com/data/indices/tearsheet/historical?s=MASI:CAS';
const DEBUT = '2026/07/31';   // derniere valeur presente en base
const FIN = '2026/10/06';
const MOIS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

function get(url, entetes = []) {
  const r = spawnSync('curl', ['-sS', '--max-time', '40', '-L', '-H', `User-Agent: ${UA}`, ...entetes, url],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return r.stdout || '';
}
const nombre = s => Number(String(s).replace(/,/g, ''));

(async () => {
  console.log('=== RATTRAPAGE MASI — CE QU IL COUVRIRAIT, SANS RIEN ECRIRE ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const page = get(TEARSHEET);
  let xid = null;
  for (const re of [/&quot;symbol&quot;\s*:\s*&quot;(\d{6,})&quot;/, /"symbol"\s*:\s*"(\d{6,})"/]) {
    const m = page.match(re); if (m) { xid = m[1]; break; }
  }
  if (!xid) { console.log('  Identifiant FT introuvable : mesure impossible.'); return; }

  const brut = get('https://markets.ft.com/data/equities/ajax/get-historical-prices'
    + `?startDate=${encodeURIComponent(DEBUT)}&endDate=${encodeURIComponent(FIN)}&symbol=${xid}`,
    ['-H', `Referer: ${TEARSHEET}`, '-H', 'X-Requested-With: XMLHttpRequest']);
  let fragment = brut;
  try { const j = JSON.parse(brut); if (typeof j.html === 'string') fragment = j.html; } catch { /* brut */ }

  const seances = [];
  const reLigne = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let mr;
  while ((mr = reLigne.exec(fragment)) !== null) {
    const c = (mr[1].match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [])
      .map(x => x.replace(/<[^>]+>/g, ' ').replace(/&nbsp;?/gi, ' ').replace(/\s+/g, ' ').trim()).filter(x => x.length);
    if (c.length < 5) continue;
    const d = c[0].match(/([A-Z][a-z]{2}) (\d{2}), (\d{4})/);
    if (!d) continue;
    seances.push({ date: `${d[3]}-${MOIS[d[1]]}-${d[2]}`, cloture: nombre(c[4]), ouverture: nombre(c[1]) });
  }
  seances.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`## A. Ce que la source publie, en UNE requete\n`);
  console.log(`  ${seances.length} seances, du ${seances[0]?.date} au ${seances[seances.length - 1]?.date}`);

  // Structure confirmee a l execution, comme dans le scraper.
  let paires = 0, ok = 0;
  for (let i = 1; i < seances.length; i++) {
    if (!isFinite(seances[i].ouverture) || !isFinite(seances[i - 1].cloture)) continue;
    paires++; if (Math.abs(seances[i].ouverture - seances[i - 1].cloture) < 0.01) ok++;
  }
  console.log(`  colonnes confirmees : ${ok}/${paires} paires « ouverture J = cloture J-1 »`);

  const conn = await mysql.createConnection(DB);
  try {
    const [enBase] = await conn.query(`
      SELECT DATE_FORMAT(i.date, '%Y-%m-%d') AS d, i.valeur
        FROM indice_references i
       WHERE COALESCE(i.nom_indice, i.id_indice) = 'MASI'
         AND i.date >= '2026-07-31'`);
    const dejaLa = new Map(enBase.map(r => [r.d, Number(r.valeur)]));
    console.log(`\n## B. Croisement avec indice_references\n`);
    console.log(`  deja en base sur la periode : ${dejaLa.size}`);

    const manquantes = seances.filter(s => !dejaLa.has(s.date));
    console.log(`  seances a inserer           : ${manquantes.length}`);

    // Coherence : une serie d indice ne saute pas d un jour ouvre a l autre.
    let pire = 0, ou = '';
    for (let i = 1; i < seances.length; i++) {
      const e = Math.abs(100 * (seances[i].cloture - seances[i - 1].cloture) / seances[i - 1].cloture);
      if (e > pire) { pire = e; ou = `${seances[i - 1].date} → ${seances[i].date}`; }
    }
    console.log(`\n## C. Coherence de la serie\n`);
    for (const [d, v] of [...dejaLa].sort()) {
      const s = seances.find(x => x.date === d);
      if (s) console.log(`  jonction ${d} : base ${v} / FT ${s.cloture} → ecart ${(s.cloture - v).toFixed(2)}`);
    }
    console.log(`  plus grande variation entre deux seances : ${pire.toFixed(2)} % (${ou})`);
    console.log(pire < 5 ? '  Aucune rupture d echelle.' : '  ATTENTION : variation anormale, ne pas ecrire en l etat.');

    if (manquantes.length) {
      console.log(`\n## D. Les dix premieres dates qui seraient ecrites\n`);
      for (const s of manquantes.slice(0, 10)) console.log(`    ${s.date}  ${s.cloture}`);
      if (manquantes.length > 10) console.log(`    … et ${manquantes.length - 10} autre(s)`);
      console.log(`\n  Commande correspondante, A NE LANCER QU APRES ACCORD :`);
      console.log(`    node scripts/scraper/scrape_indices_daily.js --execute --backfill-days 67 --skip-indref`);
      console.log(`  puis, separement et en dry-run d abord :`);
      console.log(`    node scripts/scraper/propagate_indref_range.js --since 2026-08-06 --indice MASI`);
    }
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error(`Erreur fatale : ${e.message}`); process.exit(2); });
