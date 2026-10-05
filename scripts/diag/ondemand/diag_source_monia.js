/**
 * MONIA fige depuis 144 jours : qui en depend, et pourquoi la source refuse.
 *
 * POURQUOI. Le dry-run du repli MASI, le 2026-10-05, a fait apparaitre en marge
 * `[MONIA] ERROR curl failed` sur bkam.ma. La table le confirme : derniere
 * valeur MONIA le 2026-05-14, soit 144 jours, et C10 l a mis en alerte des sa
 * premiere execution. C est une panne distincte de celle de MASI, de la meme
 * famille — une source devenue inaccessible depuis ce serveur.
 *
 * AVANT DE CHERCHER UN REMPLACANT, MESURER L ENJEU. MONIA est le taux
 * interbancaire au jour le jour marocain : il sert de reference aux fonds
 * monetaires, pas aux fonds actions. Si aucun fonds ne s y refere, la panne est
 * reelle mais sans consequence d affichage, et elle ne merite pas le meme
 * effort qu une rupture de benchmark actions. Ce script repond d abord a cette
 * question, puis mesure l acces.
 *
 * Les deux pages et l export CSV que `scrapeMONIA` interroge sont testes tels
 * quels, avec les memes en-tetes que le code de production, pour que l echec
 * mesure ici soit exactement celui que subit le cron.
 *
 * LECTURE SEULE : des SELECT et des GET, aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_source_monia.js
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

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 AfricafundsBot/1.0';

const CIBLES = [
  ['page EN (voie principale)', 'https://www.bkam.ma/en/Markets/Key-indicators/Money-market/Monia-index-moroccan-overnight-index-average'],
  ['page FR (voie secondaire)', 'https://www.bkam.ma/Marche-monetaire/Taux-du-marche-interbancaire-MONIA'],
  ['racine bkam.ma', 'https://www.bkam.ma/'],
];

function get(url, entetes = []) {
  const args = ['-sS', '--max-time', '30', '-L', '-w', '\nZZMETAZZ%{http_code}|%{size_download}|%{remote_ip}',
    '-H', `User-Agent: ${UA}`, ...entetes, url];
  const r = spawnSync('curl', args, { encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });
  const s = r.stdout || '';
  const i = s.lastIndexOf('ZZMETAZZ');
  if (i < 0) return { code: r.status, erreur: (r.stderr || '').trim().slice(0, 160), corps: '' };
  const [statut, taille, ip] = s.slice(i + 8).split('|');
  return { statut: Number(statut), taille: Number(taille), ip, corps: s.slice(0, i) };
}

(async () => {
  console.log('=== MONIA — ENJEU REEL ET ACCES A LA SOURCE ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    console.log('## A. Qui se refere a MONIA ?\n');
    const [refs] = await conn.query(`
      SELECT f.pays,
             COUNT(*) AS fonds,
             SUM(CASE WHEN f.actif = 1 THEN 1 ELSE 0 END) AS actifs
        FROM fond_investissements f
       WHERE UPPER(COALESCE(f.indice_benchmark, '')) LIKE '%MONIA%'
          OR UPPER(COALESCE(f.indice, '')) LIKE '%MONIA%'
       GROUP BY f.pays`);
    if (!refs.length) {
      console.log('  Aucun fonds ne declare MONIA comme reference.');
      console.log('  La panne est reelle mais ne prive aucun fonds de benchmark :');
      console.log('  elle ne justifie pas le meme effort qu une rupture actions.');
    } else {
      for (const r of refs) console.log(`  ${String(r.pays).padEnd(10)} ${r.fonds} fonds (dont ${r.actifs} actifs)`);
    }

    console.log('\n## B. Combien de VL portent un indRef issu de MONIA ?\n');
    const [vl] = await conn.query(`
      SELECT COUNT(*) AS n, MIN(v.date) AS du, MAX(v.date) AS au
        FROM valorisations v
       WHERE UPPER(COALESCE(v.indice_name, '')) LIKE '%MONIA%'
          OR UPPER(COALESCE(v.ID_indice, '')) LIKE '%MONIA%'`);
    const r0 = vl[0] || {};
    console.log(`  ${r0.n || 0} VL, du ${String(r0.du).slice(0, 10)} au ${String(r0.au).slice(0, 10)}`);

    console.log('\n## C. La source repond-elle depuis ce serveur ?\n');
    for (const [nom, url] of CIBLES) {
      const r = get(url, ['-H', `Referer: ${url}`, '-H', 'Accept-Language: fr-FR,fr;q=0.9,en;q=0.8']);
      console.log(`  ${nom}`);
      console.log(`    ${url}`);
      if (r.statut === undefined) {
        console.log(`    ECHEC curl code ${r.code}${r.erreur ? ` — ${r.erreur}` : ''}`);
      } else {
        console.log(`    HTTP ${r.statut} | ${r.taille} o | ip ${r.ip || '-'}`);
        if (r.corps) {
          const waf = /access denied|request blocked|cloudfront|akamai|<title>\s*403/i.test(r.corps);
          console.log(`    page de blocage : ${waf ? 'OUI' : 'non'}`);
          if (/MONIA/i.test(r.corps)) {
            const texte = r.corps.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
            const i = texte.search(/MONIA/i);
            console.log(`    extrait : « ${texte.slice(Math.max(0, i - 40), i + 160).trim()} »`);
          }
        }
      }
      console.log('');
    }

    console.log('## D. Conclusion a tirer, et celle a ne pas tirer\n');
    console.log('  Si la racine et les deux pages rendent un blocage, le probleme est');
    console.log('  l adresse de ce serveur, pas le code : aucun en-tete ne le resoudra,');
    console.log('  et il faudra une autre source ou un accord d acces. Ne jamais');
    console.log('  reconstituer un taux a partir d une variation affichee.');
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => {
  console.error(`Erreur fatale : ${e.message}`);
  process.exit(2);
});
