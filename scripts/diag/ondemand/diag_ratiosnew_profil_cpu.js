/**
 * Les 120 s de `ratiosnew` sont en JavaScript : QUELLE fonction les consomme ?
 *
 * POURQUOI ON EN EST LA. Mesure du 2026-10-29 22:43 UTC : pendant que la route
 * pend, `information_schema.PROCESSLIST` montre **0 requete active** sur vingt
 * echantillons d une seconde. MySQL est au repos. Le temps est donc
 * integralement passe dans le processus Node — ce qui rendait mes quatre
 * hypotheses SQL (volume, index, N+1 sur `tsr`, requete lente) structurellement
 * incapables d etre justes.
 *
 * Reste a savoir OU, dans 1 729 lignes. Et la lecture ne suffira pas : j ai
 * verifie a la main la boucle de comblement (sa date avance bien) et le
 * parcours arriere des `indRef` (au pire ~677 000 iterations, soit une fraction
 * de seconde). Le point chaud est ailleurs, et le trouver a l oeil demanderait
 * de simuler mentalement 85 boucles imbriquees.
 *
 * LA METHODE, et elle ne touche NI la route NI la production. On monte le VRAI
 * routeur `apigestionratios` dans une application Express jetable, dans un
 * processus Node separe lance avec `--cpu-prof`, on emet une seule requete, on
 * laisse tourner quelques secondes, puis on lit le profil produit par V8 et on
 * imprime les fonctions par temps PROPRE decroissant — avec leur fichier et
 * leur ligne.
 *
 * Aucune modification de `apigestionratios.js`, aucun redemarrage de
 * `api-monolith`, aucune ecriture. Le processus profile est un enfant jetable
 * qui vit quinze secondes et meurt.
 *
 * POURQUOI QUINZE SECONDES SUFFISENT. Si une fonction consomme 120 s de CPU,
 * elle en consomme deja l essentiel en quinze : le profileur echantillonne la
 * pile des milliers de fois, et la fonction dominante le reste quelle que soit
 * la duree d observation. Et cette borne est necessaire : le canal a la demande
 * execute pres de cinquante diagnostics a la suite dans UNE session SSH, qu un
 * script de deux minutes couperait — c est la lecon du lot BS.
 *
 * CE QUE CE SCRIPT NE FAIT PAS. Il ne corrige rien et ne propose pas de
 * correction : il nomme la fonction coupable, son fichier et sa ligne. La
 * correction d une route de calcul financier se decide ensuite, sur ce nom.
 *
 * LECTURE SEULE : un processus enfant jetable, et la lecture du profil qu il
 * ecrit dans un repertoire temporaire. Aucune ecriture en base, aucun
 * changement de code deploye.
 *
 * USAGE  node scripts/diag/ondemand/diag_ratiosnew_profil_cpu.js
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const RACINE = path.resolve(__dirname, '../../../');
const SECONDES = 15;

(async () => {
  console.log('=== ratiosnew : QUELLE FONCTION CONSOMME LES 120 SECONDES ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE`);
  console.log('Profilage CPU dans un processus jetable. La route et la production');
  console.log('ne sont pas modifiees.\n');

  // LA SONDE DOIT VIVRE DANS LE PROJET, et c est la correction du 2026-10-29.
  // Ma premiere version l ecrivait dans /tmp : Node resout alors `require` par
  // rapport a /tmp, n y trouve aucun `node_modules`, et la sonde est morte sur
  // `Cannot find module 'dotenv'` sans jamais atteindre la route. Mettre la
  // sonde dans le projet rend la resolution naturelle, au lieu de devoir donner
  // un chemin absolu a chaque dependance — et d en oublier une.
  const tmp = fs.mkdtempSync(path.join(RACINE, '.diag-profil-'));
  const sonde = path.join(tmp, 'sonde.js');

  // La sonde monte le VRAI routeur et emet une requete contre lui.
  fs.writeFileSync(sonde, `
    require('dotenv').config({ path: ${JSON.stringify(path.join(RACINE, '.env'))} });
    console.error('SONDE_DEMARREE');
    process.chdir(${JSON.stringify(RACINE)});
    const express = require('express');
    const app = express();
    app.use(express.json());
    try {
      const r = require(${JSON.stringify(path.join(RACINE, 'src/routes/apigestionratios'))});
      console.error('ROUTEUR_MONTE');
      // Le module exporte soit un routeur, soit une fonction (app) => {…}.
      if (typeof r === 'function' && r.length >= 1 && !r.stack) { r(app); } else { app.use(r); }
    } catch (e) {
      console.error('MONTAGE IMPOSSIBLE : ' + e.message);
      process.exit(7);
    }
    const srv = app.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      console.error('sonde ecoute sur ' + port);
      require('http').get(
        { host: '127.0.0.1', port, path: '/api/ratiosnew/2026/1141' },
        res => { res.resume(); res.on('end', () => console.error('repondu ' + res.statusCode)); }
      ).on('error', e => console.error('requete en erreur : ' + e.message));
      // On laisse le CPU chauffer, puis on meurt proprement pour que V8 ecrive
      // le profil : un process.exit() brutal le perdrait.
      setTimeout(() => { try { srv.close(); } catch {} process.exit(0); }, ${SECONDES * 1000});
    });
  `);

  console.log(`## 1. PROFILAGE DE ${SECONDES} SECONDES`);
  const r = spawnSync(process.execPath,
    ['--cpu-prof', '--cpu-prof-dir', tmp, '--cpu-prof-name', 'ratios.cpuprofile', sonde],
    { cwd: RACINE, encoding: 'utf8', timeout: (SECONDES + 25) * 1000 });
  for (const l of String(r.stderr || '').split('\n').slice(0, 8)) if (l.trim()) console.log(`  | ${l}`);
  if (r.status === 7) {
    console.log('  → le routeur n a pas pu etre monte hors de l application. Le profilage');
    console.log('    exige alors une autre voie, et il ne faut PAS en conclure sur la cause.');
    process.exitCode = 2;
    return;
  }

  const profil = path.join(tmp, 'ratios.cpuprofile');
  if (!fs.existsSync(profil)) {
    const autres = fs.readdirSync(tmp).filter(f => f.endsWith('.cpuprofile'));
    if (!autres.length) {
      console.log('  → aucun profil ecrit. Ne rien conclure : la mesure a echoue, elle n a');
      console.log('    pas rendu un resultat negatif.');
      process.exitCode = 2;
      return;
    }
    fs.renameSync(path.join(tmp, autres[0]), profil);
  }

  // ---- 1bis. LA MESURE A-T-ELLE REELLEMENT EU LIEU ? ---------------
  // GARDE-FOU AJOUTE APRES UN ECHEC DE CE SCRIPT LUI-MEME. Sa premiere version
  // a rendu un VERDICT — « aucun temps propre dans apigestionratios.js » —
  // alors que la sonde etait morte avant d atteindre la route : un profil avait
  // bien ete ecrit, mais il ne contenait que 37 echantillons du chargement des
  // modules de Node, sur 0,0 s. Mes controles verifiaient l existence du profil
  // et mon propre code de sortie ; ni l un ni l autre ne verifiait que la ROUTE
  // avait tourne.
  //
  // Un profil vide et un profil montrant « aucun cout dans la route » se
  // ressemblent exactement, et menent a des conclusions opposees. On exige donc
  // trois preuves : la sonde a monte le routeur, elle a ecoute, et le profil
  // couvre une duree plausible.
  const trace = String(r.stderr || '');
  const monte = trace.includes('ROUTEUR_MONTE');
  const ecoute = trace.includes('SONDE_ECOUTE');
  console.log(`\n## 1bis. LA MESURE A-T-ELLE EU LIEU ?`);
  console.log(`  routeur monte : ${monte ? 'OUI' : 'NON'} | sonde en ecoute : ${ecoute ? 'OUI' : 'NON'}`);
  if (!monte || !ecoute) {
    console.log('  → LA MESURE A ECHOUE. La sonde n a pas atteint la route : le profil ne');
    console.log('    contient que le demarrage de Node. NE RIEN CONCLURE — un profil vide');
    console.log('    et un profil « aucun cout dans la route » se ressemblent exactement,');
    console.log('    et menent a des conclusions opposees. Voir la trace ci-dessus.');
    process.exitCode = 2;
    return;
  }

  // ---- 2. Depouillement : temps PROPRE par fonction -----------------
  const p = JSON.parse(fs.readFileSync(profil, 'utf8'));
  const parId = new Map(p.nodes.map(n => [n.id, n]));
  const propre = new Map();
  // `samples` donne l id du noeud au sommet de la pile a chaque echantillon :
  // compter ces sommets rend le temps PROPRE, celui passe DANS la fonction et
  // non dans ses appelees. C est lui qui designe le coupable.
  for (const id of p.samples || []) propre.set(id, (propre.get(id) || 0) + 1);
  const total = (p.samples || []).length;
  const duree = (p.endTime - p.startTime) / 1e6;
  console.log(`\n## 2. ${total} echantillon(s) sur ${duree.toFixed(1)} s de profil`);
  if (duree < 5) {
    console.log(`  → profil de ${duree.toFixed(1)} s seulement alors que ${SECONDES} s etaient`);
    console.log('    demandees : la sonde est morte prematurement. NE RIEN CONCLURE.');
    process.exitCode = 2;
    return;
  }
  if (!total) {
    console.log('  aucun echantillon : rien a depouiller.');
    process.exitCode = 2;
    return;
  }

  const lignes = [...propre].map(([id, n]) => {
    const nd = parId.get(id);
    const cf = nd ? nd.callFrame : null;
    const url = cf && cf.url ? String(cf.url).replace(/^file:\/\//, '').replace(RACINE + '/', '') : '(inconnu)';
    return {
      n, pct: n / total * 100,
      nom: (cf && cf.functionName) || '(anonyme)',
      ou: `${url}:${cf ? cf.lineNumber + 1 : '?'}`,
    };
  }).sort((a, b) => b.n - a.n);

  console.log(`\n  ${'part'.padStart(7)}  ${'fonction'.padEnd(30)}fichier:ligne`);
  for (const l of lignes.slice(0, 14)) {
    console.log(`  ${(l.pct.toFixed(1) + ' %').padStart(7)}  ${l.nom.slice(0, 29).padEnd(30)}${l.ou}`);
  }

  // ---- 3. Verdict ---------------------------------------------------
  console.log('\n## 3. VERDICT');
  const chaudes = lignes.filter(l => l.ou.includes('apigestionratios'));
  const t1 = lignes[0];
  console.log(`  fonction la plus chaude : ${t1.nom} (${t1.pct.toFixed(1)} %) — ${t1.ou}`);
  if (chaudes.length) {
    const part = chaudes.reduce((s, l) => s + l.pct, 0);
    console.log(`  ${part.toFixed(1)} % du temps propre est dans \`apigestionratios.js\` :`);
    for (const l of chaudes.slice(0, 6)) {
      console.log(`    ${(l.pct.toFixed(1) + ' %').padStart(6)}  ligne ${l.ou.split(':').pop()}  ${l.nom}`);
    }
    console.log('\n  → ces lignes sont le point chaud. La correction porte sur ELLES, et sur');
    console.log('    rien d autre : ni le SQL, ni l index, ni le volume de donnees.');
  } else {
    console.log('  Aucun temps propre dans `apigestionratios.js` lui-meme : le cout est dans');
    console.log('  une dependance appelee depuis la route — voir le tableau ci-dessus. Une');
    console.log('  bibliotheque de dates appelee des centaines de milliers de fois produit');
    console.log('  exactement ce profil.');
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
