/**
 * L extraction du 26 octobre a-t-elle rate des fichiers, ou n y avait-il rien ?
 *
 * POURQUOI. Mesure du 2026-10-27 20:09 UTC : `sec_ng_latest.csv`, regenere le
 * 26/10 a 10:00, porte 41 dates et s arrete au **2026-10-09** — exactement la
 * derniere date en base. **Zero ligne posterieure.** L importeur est donc
 * innocent : il n a rien laisse passer, il n a rien recu. Et la cadence est
 * hebdomadaire (4-5 dates par mois de mai a septembre, puis 2 en octobre), donc
 * les 16 et 23 octobre manquent a la SOURCE.
 *
 * Deux explications restent, et elles n appellent pas le meme correctif :
 *   (A) la SEC n a rien publie depuis le 09/10. Rien a reparer chez nous ; il
 *       faut alors recalibrer le budget de `C4.NIGERIA` sur la cadence reelle
 *       de la source, en le DOCUMENTANT — jamais en desactivant le controle ;
 *   (B) la SEC a publie, et l extraction ne l a pas pris : telechargement en
 *       echec, page d index non relue, fichier telecharge mais non parse, ou
 *       feuille au format inattendu. C est alors chez nous, et c est reparable.
 *
 * Le CSV porte lui-meme de quoi trancher : `downloaded_at_utc`, `source_url`,
 * `source_file`, `source_year_page`. Si l extraction du 26/10 a telecharge des
 * fichiers ce jour-la, elle a bien travaille et la source etait muette (A). Si
 * le dernier telechargement est ancien, elle n a rien tente (B).
 *
 * Le repertoire `sec_ng_downloads/` est confronte au CSV : un classeur present
 * sur le disque mais absent du CSV est un fichier telecharge et NON PARSE —
 * (B) sous sa forme la plus silencieuse, et la plus facile a manquer.
 *
 * LECTURE SEULE : lecture du CSV et du repertoire de telechargement. Aucune
 * requete SQL, aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_nigeria_extraction_amont.js
 */
const path = require('path');
const fs = require('fs');
const { lireCSV } = require('../../../src/lib/sec_csv');

const RACINE = path.resolve(__dirname, '../../../');
const CSV = path.join(RACINE, 'sec_ng_latest.csv');
const DOWNLOADS = path.join(RACINE, 'sec_ng_downloads');

const jour = s => String(s || '').slice(0, 10);

(async () => {
  console.log('=== NIGERIA : L EXTRACTION A-T-ELLE RATE QUELQUE CHOSE EN AMONT ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  if (!fs.existsSync(CSV)) { console.log(`ECHEC : ${CSV} introuvable.`); process.exitCode = 2; return; }
  const { entetes, lignes } = lireCSV(CSV);
  // La premiere colonne du CSV porte un BOM : retrouver les noms par suffixe.
  const col = n => entetes.find(e => e.replace(/^﻿/, '') === n) || n;
  const cFichier = col('source_file'), cUrl = col('source_url');
  const cDl = col('downloaded_at_utc'), cAnnee = col('source_year_page');
  console.log(`CSV : ${lignes.length} lignes, modifie le `
    + `${fs.statSync(CSV).mtime.toISOString().slice(0, 16).replace('T', ' ')}`);

  // ---- 1. Quand les fichiers sources ont-ils ete telecharges ? ------
  const parJour = new Map();
  for (const l of lignes) {
    const d = jour(l[cDl]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    parJour.set(d, (parJour.get(d) || 0) + 1);
  }
  console.log('\n## 1. DATES DE TELECHARGEMENT declarees dans le CSV');
  if (!parJour.size) {
    console.log('  AUCUNE date de telechargement lisible — la colonne est vide ou absente.');
    console.log('  → l extraction ne trace pas ses telechargements : angle mort a corriger.');
  } else {
    for (const [d, n] of [...parJour].sort().slice(-8)) console.log(`  ${d}  ${n} ligne(s)`);
    const dernier = [...parJour.keys()].sort().pop();
    const ageDl = Math.round((Date.now() - Date.parse(dernier + 'T00:00:00Z')) / 86400000);
    console.log(`  dernier telechargement : ${dernier} (il y a ${ageDl} j)`);
    console.log(ageDl <= 2
      ? '  → l extraction a bien TELECHARGE recemment. Si rien de neuf n en sort,\n'
        + '    c est que la source etait muette : piste (A).'
      : `  → le dernier telechargement a ${ageDl} j : l extraction n a RIEN TENTE\n`
        + '    de recent. Piste (B) : c est chez nous.');
  }

  // ---- 2. Quels classeurs le CSV dit-il avoir lus ? -----------------
  const fichiers = new Map();
  for (const l of lignes) {
    const f = l[cFichier] || '(vide)';
    if (!fichiers.has(f)) fichiers.set(f, { n: 0, dates: new Set(), url: l[cUrl], annee: l[cAnnee] });
    const e = fichiers.get(f);
    e.n++;
    const d = jour(l.valuation_date);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) e.dates.add(d);
  }
  console.log(`\n## 2. CLASSEURS LUS par l extraction : ${fichiers.size}`);
  const tri = [...fichiers].map(([f, e]) => ({
    f, n: e.n, url: e.url, annee: e.annee,
    max: [...e.dates].sort().pop() || '—',
  })).sort((a, b) => String(a.max).localeCompare(String(b.max)));
  for (const r of tri.slice(-10)) {
    console.log(`  ${String(r.max).padEnd(12)}${String(r.n).padStart(6)} lignes  ${String(r.f).slice(0, 62)}`);
  }
  const plusRecent = tri[tri.length - 1];
  if (plusRecent) {
    console.log(`\n  classeur le plus recent : ${plusRecent.f}`);
    console.log(`  derniere date qu il porte : ${plusRecent.max}`);
    if (plusRecent.url) console.log(`  url : ${String(plusRecent.url).slice(0, 150)}`);
    if (plusRecent.annee) console.log(`  page d index : ${String(plusRecent.annee).slice(0, 150)}`);
    console.log('  → c est cette URL qu il faut ouvrir pour savoir si la SEC a publie depuis.');
  }

  // ---- 3. Le disque porte-t-il des classeurs que le CSV ignore ? ----
  console.log('\n## 3. FICHIERS TELECHARGES SUR LE DISQUE vs CLASSEURS LUS');
  if (!fs.existsSync(DOWNLOADS)) {
    console.log(`  ${DOWNLOADS} absent — l extraction ne conserve pas ses telechargements,`);
    console.log('  ou les depose ailleurs. Rien a confronter ici.');
  } else {
    const sur = [];
    const parcourir = (d, p = 0) => {
      if (p > 2) return;
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const abs = path.join(d, e.name);
        if (e.isDirectory()) parcourir(abs, p + 1);
        else if (/\.(xlsx?|csv)$/i.test(e.name)) {
          const st = fs.statSync(abs);
          sur.push({ nom: e.name, mtime: st.mtime, taille: st.size });
        }
      }
    };
    parcourir(DOWNLOADS);
    console.log(`  ${sur.length} classeur(s) sur le disque`);
    const lus = new Set([...fichiers.keys()].map(f => path.basename(String(f))));
    const recents = sur.sort((a, b) => b.mtime - a.mtime).slice(0, 12);
    console.log(`  ${'telecharge le'.padEnd(18)}${'Mo'.padStart(7)}  lu ?   nom`);
    for (const s of recents) {
      const lu = lus.has(s.nom);
      console.log(`  ${s.mtime.toISOString().slice(0, 16).replace('T', ' ').padEnd(18)}`
        + `${(s.taille / 1e6).toFixed(1).padStart(7)}  ${lu ? 'oui ' : 'NON '}  ${s.nom.slice(0, 54)}`);
    }
    const orphelins = sur.filter(s => !lus.has(s.nom));
    if (orphelins.length) {
      console.log(`\n  ${orphelins.length} classeur(s) TELECHARGE(S) MAIS ABSENT(S) DU CSV.`);
      console.log('  → piste (B) sous sa forme la plus silencieuse : le fichier est la, son');
      console.log('    contenu n est pas dans le CSV. Parsing en echec, feuille au nom');
      console.log('    inattendu, ou format change. Reparable chez nous.');
    } else if (sur.length) {
      console.log('\n  Aucun orphelin : tout ce qui est telecharge est lu.');
      console.log('  → l extraction ne perd rien. Le defaut est AVANT le telechargement :');
      console.log('    soit la SEC n a rien publie, soit la page d index n est pas relue.');
    }
  }

  console.log('\n## CE QUE CELA IMPLIQUE');
  console.log('  Si (A) — source muette : recalibrer le budget de C4.NIGERIA sur la cadence');
  console.log('  hebdomadaire reelle, en documentant POURQUOI dans le script de controle.');
  console.log('  Ne jamais desactiver le controle : un budget justifie reste un controle,');
  console.log('  un controle eteint ne mesure plus rien.');
  console.log('  Si (B) — extraction en defaut : reparer le telechargement ou le parsing, et');
  console.log('  faire en sorte que l etape 1/8 du cron COMPTE ce qu elle n a pas pu lire.');
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
