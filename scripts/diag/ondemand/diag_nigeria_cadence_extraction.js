/**
 * L extraction du 26 octobre a-t-elle VU le fichier du 16 octobre ?
 *
 * ETAT MESURE, et il disqualifie mes trois premieres pistes.
 *
 * Source primaire lue le 2026-10-28 sur la page d index de la SEC :
 *   « Net Asset Value and Unit Price as at 16th October 2026 », document 1537,
 *   publie le 25 octobre 2026.
 * Notre cron hebdomadaire a tourne le lundi 26 octobre a 10:00 et n a
 * telecharge AUCUN fichier ; le dernier classeur pris est le 1536 (9 octobre),
 * descendu le 19/10. Le 1537 etait en ligne.
 *
 * Ce qui est DEJA ecarte, et qu il ne faut pas rouvrir :
 *   - l importeur : le CSV du 26/10 s arrete au 09/10, zero ligne posterieure.
 *     Ses bornes, son appariement et son INSERT IGNORE sont hors sujet ;
 *   - l enumeration de la page : `fetch_year_links` parcourt TOUS les liens
 *     .xlsx, sans limite ni arret anticipe. Elle aurait trouve le 1537 ;
 *   - « 523 classeurs telecharges mais absents du CSV = parsing en echec » :
 *     c etait MON erreur de perimetre. `sec_ng_latest.csv` ne couvre que
 *     l annee courante (--years $YEAR), tandis que `sec_ng_downloads/` porte
 *     les millesimes depuis 2022. Ce script compare desormais a perimetre egal.
 *
 * DEUX CAUSES RESTENT, et la trace de l etape [1/8] les separe :
 *   (B1) la page ne listait pas encore le 1537 le 26/10 a 10:00 — la date
 *        « 25 octobre » affichee serait une date de document, pas de mise en
 *        ligne. Rien a reparer dans le code ;
 *   (B2) la page le listait et l extraction a echoue sans le dire — requete en
 *        erreur, telechargement refuse, ou quality gate qui l a ecarte.
 *
 * CE QUE CE SCRIPT A MESURE, ET QUI REFUTE MA PROPRE CONCLUSION — ajoute le
 * 2026-10-28 00:30 UTC, apres sa premiere execution.
 *
 * J avais ecrit ci-dessous que la cadence hebdomadaire donnait 14 a 24 jours et
 * que le budget de 14 jours etait « inatteignable par construction ». Le
 * calcul, fait par la section 2 de ce script, rend **10 jours, pire cas 10
 * jours — DANS le budget** : donnees du 16/10 mises en ligne le 25, premier
 * lundi le 26. La cadence n est donc PAS le defaut. Je raisonnais sur l ecart
 * entre la date de valorisation et aujourd hui en l imputant a la frequence,
 * sans jamais calculer ce que la frequence produit.
 *
 * Le defaut mesure est ailleurs, et la section 6 le montre a la ligne pres : le
 * journal du 26/10 liste les 41 classeurs par ordre alphabetique et passe de
 * `16th_January_2026` directement a `17th_April_2026`. `16th_October_2026` n y
 * figure nulle part. L extracteur ne l a pas ecarte, ni mal lu : IL NE L A PAS
 * VU. Suite de l instruction dans `diag_nigeria_liens_vus.js`.
 *
 * Le raisonnement ci-dessous est conserve tel quel, faux, parce qu un document
 * qui efface ses erreurs ne previent plus personne de les refaire.
 *
 * RAISONNEMENT INITIAL — FAUX, conserve pour memoire. Delais de
 * publication lus sur la page : donnees du 25/09 publiees le 02/10, du 02/10
 * publiees le 09/10, du 09/10 publiees le 16/10, du 16/10 publiees le 25/10 —
 * soit NEUF A DIX JOURS, a des jours variables de la semaine. Un cron
 * hebdomadaire du lundi contre cette source donne une fraicheur de 14 a 24
 * jours selon ou tombe la publication. Le budget de 14 jours de C4.NIGERIA est
 * donc inatteignable — non parce qu il est mal choisi, mais parce que la
 * FREQUENCE D EXTRACTION l est. Le fichier du 16/10 n arrivera qu au cron du
 * 2 novembre : 24 jours apres sa date de valorisation.
 *
 * Ce script etablit les deux nombres qui fondent la decision de cadence :
 * le delai reel publication - valorisation, et le retard qu une extraction
 * quotidienne aurait evite.
 *
 * LECTURE SEULE : lecture des journaux et du repertoire de cache. Aucune
 * requete SQL, aucune ecriture, aucun appel reseau.
 *
 * USAGE  node scripts/diag/ondemand/diag_nigeria_cadence_extraction.js
 */
const path = require('path');
const fs = require('fs');

const RACINE = path.resolve(__dirname, '../../../');
const DOWNLOADS = path.join(RACINE, 'sec_ng_downloads');
const LOGDIR = '/var/log';

// Dates de mise en ligne lues sur la page d index de la SEC le 2026-10-28.
// Elles ne sont pas deduites : elles sont recopiees de la source.
const PUBLICATIONS = [
  ['2026-09-18', '2026-09-25'], ['2026-09-25', '2026-10-02'],
  ['2026-10-02', '2026-10-09'], ['2026-10-09', '2026-10-16'],
  ['2026-10-16', '2026-10-25'],
];

(async () => {
  console.log('=== NIGERIA : LA CADENCE D EXTRACTION TIENT-ELLE LE BUDGET ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  // ---- 1. Le delai reel de la source -------------------------------
  console.log('## 1. DELAI PUBLICATION - VALORISATION (releve sur la page d index)');
  console.log(`  ${'valorisation'.padEnd(14)}${'mise en ligne'.padEnd(15)}delai`);
  let somme = 0;
  for (const [v, p] of PUBLICATIONS) {
    const d = Math.round((Date.parse(p) - Date.parse(v)) / 86400000);
    somme += d;
    console.log(`  ${v.padEnd(14)}${p.padEnd(15)}${String(d).padStart(3)} j`);
  }
  const moyen = somme / PUBLICATIONS.length;
  console.log(`  delai moyen : ${moyen.toFixed(1)} j — et les jours de mise en ligne varient.`);

  // ---- 2. Ce qu une extraction hebdomadaire du lundi en fait --------
  console.log('\n## 2. CE QU UN CRON HEBDOMADAIRE DU LUNDI EN FAIT');
  console.log(`  ${'valorisation'.padEnd(14)}${'en ligne'.padEnd(12)}${'1er lundi apres'.padEnd(17)}age a l arrivee`);
  let pire = 0, cumul = 0;
  for (const [v, p] of PUBLICATIONS) {
    const d = new Date(p + 'T10:00:00Z');
    // premier lundi strictement apres la mise en ligne (0 = dimanche)
    const avance = ((8 - d.getUTCDay()) % 7) || 7;
    const lundi = new Date(d.getTime() + avance * 86400000);
    const age = Math.round((lundi - Date.parse(v)) / 86400000);
    pire = Math.max(pire, age); cumul += age;
    console.log(`  ${v.padEnd(14)}${p.padEnd(12)}${lundi.toISOString().slice(0, 10).padEnd(17)}`
      + `${String(age).padStart(3)} j`);
  }
  console.log(`  age moyen a l arrivee : ${(cumul / PUBLICATIONS.length).toFixed(1)} j | PIRE CAS : ${pire} j`);
  console.log(`  budget de C4.NIGERIA : 14 j`);
  console.log(pire > 14
    ? `  → INATTEIGNABLE par construction : le pire cas (${pire} j) depasse le budget.\n`
      + '    Ce n est pas le budget qui est mal choisi, c est la FREQUENCE.'
    : '  → le budget tient avec cette cadence.');

  console.log('\n## 3. CE QU UNE EXTRACTION QUOTIDIENNE CHANGERAIT');
  const quot = PUBLICATIONS.map(([v, p]) =>
    Math.round((Date.parse(p) + 86400000 - Date.parse(v)) / 86400000));
  console.log(`  age a l arrivee : ${quot.join(' j, ')} j`);
  console.log(`  pire cas : ${Math.max(...quot)} j — ${Math.max(...quot) <= 14
    ? 'DANS le budget de 14 j' : 'encore hors budget'}`);
  console.log('  Cout : l extracteur ne retelecharge pas ce qu il a en cache');
  console.log('  (`download_file` sort des que le fichier existe et depasse 1 Ko), et');
  console.log('  l import est en INSERT IGNORE. Une execution a vide est donc quasi');
  console.log('  gratuite. C est une decision de cadence, pas de code.');

  // ---- 4. Le 1537 est-il arrive depuis ? ---------------------------
  console.log('\n## 4. LE CLASSEUR DU 16 OCTOBRE (document 1537) EST-IL EN CACHE ?');
  if (!fs.existsSync(DOWNLOADS)) {
    console.log('  repertoire de cache absent — rien a verifier.');
  } else {
    const trouves = [];
    const parcourir = (d, p = 0) => {
      if (p > 2) return;
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const abs = path.join(d, e.name);
        if (e.isDirectory()) parcourir(abs, p + 1);
        else if (/16th_October_2026/i.test(e.name)) {
          trouves.push({ nom: e.name, st: fs.statSync(abs) });
        }
      }
    };
    parcourir(DOWNLOADS);
    if (!trouves.length) {
      console.log('  ABSENT. Confirme : l extraction du 26/10 ne l a pas pris.');
      console.log('  Il n arrivera qu au prochain cron hebdomadaire (lundi 2 novembre),');
      console.log('  soit 24 jours apres sa date de valorisation.');
    } else {
      for (const t of trouves) {
        console.log(`  PRESENT : ${t.nom} (${(t.st.size / 1e3).toFixed(1)} Ko,`
          + ` ${t.st.mtime.toISOString().slice(0, 16).replace('T', ' ')})`);
      }
      console.log('  → telecharge depuis ma mesure : verifier qu il est bien PARSE et IMPORTE.');
    }
  }

  // ---- 5. Orphelins, a perimetre egal cette fois -------------------
  console.log('\n## 5. CLASSEURS 2026 EN CACHE — a perimetre egal (correction de ma mesure)');
  console.log('  Ma mesure precedente annoncait « 523 orphelins = parsing en echec ». Elle');
  console.log('  comparait un CSV limite a l annee courante a un cache couvrant 2022-2026.');
  if (fs.existsSync(DOWNLOADS)) {
    const de2026 = [];
    const parcourir = (d, p = 0) => {
      if (p > 2) return;
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const abs = path.join(d, e.name);
        if (e.isDirectory()) parcourir(abs, p + 1);
        else if (/\.(xlsx?|XLSX?)$/.test(e.name) && /_2026\./i.test(e.name)) de2026.push(e.name);
      }
    };
    parcourir(DOWNLOADS);
    console.log(`  ${de2026.length} classeur(s) 2026 en cache`);
    console.log('  Le CSV du 26/10 en declare 41 lus. Un ecart ici — et SEULEMENT ici —');
    console.log('  signalerait un parsing en echec.');
  }

  // ---- 6. Ce que l etape 1/8 a dit ---------------------------------
  console.log('\n## 6. TRACE DE L ETAPE [1/8] AU DERNIER CRON HEBDOMADAIRE');
  try {
    const logs = fs.readdirSync(LOGDIR)
      .filter(f => /^africafunds_nigeria_\d{8}\.log$/.test(f)).sort();
    const dernier = logs[logs.length - 1];
    if (!dernier) console.log('  aucun journal africafunds_nigeria_*.log');
    else {
      const txt = fs.readFileSync(path.join(LOGDIR, dernier), 'utf8').split(/\r?\n/);
      const i = txt.findIndex(l => /\[1\/8\]/.test(l));
      console.log(`  ${dernier}`);
      const interessant = /lien|link|telecharg|download|fichier|file|xlsx|erreur|error|quality|HTTP|\[1\/8\]|\[2\/8\]/i;
      let imprimes = 0;
      for (const l of txt.slice(Math.max(i, 0))) {
        if (imprimes >= 28) break;
        if (l.trim() && interessant.test(l)) { console.log(`  | ${l.slice(0, 170)}`); imprimes++; }
      }
      if (!imprimes) console.log('  etape [1/8] sans trace exploitable — angle mort a instrumenter.');
    }
  } catch (e) { console.log(`  journaux illisibles : ${e.message}`); }

  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
