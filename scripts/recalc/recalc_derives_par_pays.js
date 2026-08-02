#!/usr/bin/env node
/**
 * recalc_derives_par_pays.js — Recalcul CIBLE, pays par pays, de tout ce qui
 * DERIVE des valorisations.
 *
 * POURQUOI CE SCRIPT
 * ------------------
 * Deux causes distinctes produisent le meme symptome visible (« les dates
 * affichees sont figees en 2024 ») :
 *
 *   1. NIGERIA — la correction SECNGFIX_* a modifie `value` sur 27 660 lignes
 *      et insere 23 731 lignes : les derives calcules AVANT sont perimes.
 *   2. UEMOA / CEMAC — les valorisations sont fraiches en base (85 fonds UEMOA
 *      sur 111 ont des VL jusqu'en 2026) mais les performances n'ont jamais
 *      ete recalculees. Mesure du 2026-08-02 sur l'API de production :
 *        UEMOA 102/109 fonds affichent une date <= 2024
 *        CEMAC  34/34  fonds, derniere perf 2024-12-12
 *        MAROC  491/500 et TUNISIE 126/131 sont a jour (crons sains)
 *
 * La colonne « Date » des pages pays vient de `performences.date`
 * (route /api/listeproduitpayssociete), PAS de la derniere VL. Un fonds peut
 * donc avoir une VL au 2026-07-24 et afficher 2024-11-01.
 *
 * Ce qui DERIVE des valorisations et doit etre reconstruit :
 *   1. vl_ajuste (= value + cumul dividendes)
 *   2. value_EUR / value_USD (= value / taux du jour) et leurs vl_ajuste
 *   3. performances locales (YTD, 1A, 3A...) affichees sur les fiches fonds
 *   4. performances EUR/USD
 *   5. classements / quartiles (etape OPT-IN, voir plus bas)
 *
 * Tant que 1->4 n'ont pas tourne, le site affiche des VL corrigees mais des
 * performances calculees sur les anciennes valeurs : incoherence visible.
 *
 * ORDRE IMPOSE : chaque etape consomme la sortie de la precedente. Le script
 * s'arrete au premier echec plutot que de propager un etat partiel.
 *
 * ETAPE 5 (CLASSEMENTS) : OPT-IN VOLONTAIRE
 * -----------------------------------------
 * Les classements sont calcules PAR CATEGORIE, toutes zones confondues. Un
 * recompute deplace donc mecaniquement le rang de fonds d'AUTRES pays qui
 * partagent une categorie avec des fonds nigerians. Ce n'est pas une
 * regression (c'est la consequence arithmetique normale d'une correction de
 * donnees), mais cela sort du perimetre "Nigeria seul" : l'etape n'est
 * executee que si --with-classements est explicitement demande.
 *
 * USAGE
 *   node scripts/recalc/recalc_derives_par_pays.js --pays UEMOA
 *       -> DRY-RUN : etat avant + plan detaille, AUCUNE ecriture
 *
 *   node scripts/recalc/recalc_derives_par_pays.js --pays UEMOA --execute --confirm
 *       -> execute les etapes 1 a 4 pour l'UEMOA
 *
 *   node scripts/recalc/recalc_derives_par_pays.js --pays UEMOA --execute --confirm --only-perf
 *       -> etapes 3 et 4 seulement. A UTILISER quand les VL n'ont PAS ete
 *          corrigees et que seules les performances sont en retard (cas
 *          UEMOA et CEMAC) : evite de rejouer inutilement le recalcul de
 *          vl_ajuste et des conversions sur tout l'historique.
 *
 *   node scripts/recalc/recalc_derives_par_pays.js --pays TOUS
 *       -> tous les fonds actifs, avec ventilation par pays dans le rapport.
 *          LONG : lancer sous `nohup ... &` ou dans un `screen`.
 *
 *   --with-classements  -> ajoute l'etape 5 (impact inter-pays, voir ci-dessus)
 *
 * Defaut : --pays NIGERIA (le cas d'origine).
 *
 * NON-DESTRUCTIF : ce script n'ecrit rien lui-meme. Il orchestre des scripts
 * deja valides en production, restreints au perimetre demande.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

function parseArgs() {
  const a = process.argv.slice(2);
  const paysIdx = a.indexOf('--pays');
  const pays = paysIdx !== -1 && a[paysIdx + 1] ? a[paysIdx + 1] : 'NIGERIA';
  return {
    pays,
    tous: ['TOUS', 'ALL', '*'].includes(pays.toUpperCase()),
    execute: a.includes('--execute'),
    confirm: a.includes('--confirm'),
    onlyPerf: a.includes('--only-perf'),
    withClassements: a.includes('--with-classements'),
  };
}

/**
 * Photo de l'etat derive : ce que le site affiche reellement.
 * `tous` = true supprime le filtre pays (perimetre : tous les fonds actifs).
 */
async function snapshot(conn, pays, tous) {
  // Un seul point de verite pour le filtre, afin que toutes les requetes du
  // rapport portent rigoureusement sur le meme perimetre.
  const filtre = tous ? '1 = 1' : 'LOWER(%A%.pays) = LOWER(?)';
  const w = (alias) => filtre.replace('%A%', alias);
  const p = tous ? [] : [pays];

  const [[fonds]] = await conn.execute(
    `SELECT COUNT(*) AS n FROM fond_investissements f
     WHERE f.active = 1 AND ${w('f')}`, p);

  const [[vl]] = await conn.execute(
    `SELECT COUNT(*) AS n, MAX(v.date) AS derniere_date,
            SUM(v.vl_ajuste IS NULL) AS vl_ajuste_null,
            SUM(v.value_EUR IS NULL) AS eur_null,
            SUM(v.value_USD IS NULL) AS usd_null
     FROM valorisations v
     JOIN fond_investissements f ON f.id = v.fund_id
     WHERE f.active = 1 AND ${w('f')}`, p);

  const [[perf]] = await conn.execute(
    `SELECT COUNT(*) AS n, MAX(p.date) AS derniere_date,
            SUM(p.ytd IS NOT NULL) AS ytd_non_null,
            SUM(p.perf1an IS NOT NULL) AS perf1an_non_null
     FROM performences p
     JOIN fond_investissements f ON f.id = p.fond_id
     WHERE f.active = 1 AND ${w('f')}`, p);

  // Ecart de fraicheur : la perf est-elle calculee sur la derniere VL connue ?
  // C'est LA mesure qui correspond au symptome visible par l'utilisateur.
  const [decales] = await conn.execute(
    `SELECT f.id, f.nom_fond, f.pays,
            MAX(v.date) AS derniere_vl,
            (SELECT MAX(p.date) FROM performences p WHERE p.fond_id = f.id) AS derniere_perf
     FROM fond_investissements f
     JOIN valorisations v ON v.fund_id = f.id
     WHERE f.active = 1 AND ${w('f')}
     GROUP BY f.id, f.nom_fond, f.pays
     HAVING derniere_perf IS NULL OR derniere_perf < derniere_vl
     ORDER BY derniere_vl DESC
     LIMIT 5`, p);

  const [[decalesN]] = await conn.execute(
    `SELECT COUNT(*) AS n FROM (
       SELECT f.id, MAX(v.date) AS dvl,
              (SELECT MAX(p.date) FROM performences p WHERE p.fond_id = f.id) AS dperf
       FROM fond_investissements f
       JOIN valorisations v ON v.fund_id = f.id
       WHERE f.active = 1 AND ${w('f')}
       GROUP BY f.id
       HAVING dperf IS NULL OR dperf < dvl
     ) t`, p);

  // Ventilation par pays : indispensable en mode TOUS pour voir quel pays
  // reste en retard, et utile en mode mono-pays pour verifier le perimetre.
  const [parPays] = await conn.execute(
    `SELECT COALESCE(f.pays, '(NULL)') AS pays, COUNT(DISTINCT f.id) AS fonds,
            MAX(v.date) AS derniere_vl,
            MAX((SELECT MAX(p.date) FROM performences p WHERE p.fond_id = f.id)) AS derniere_perf
     FROM fond_investissements f
     LEFT JOIN valorisations v ON v.fund_id = f.id
     WHERE f.active = 1 AND ${w('f')}
     GROUP BY COALESCE(f.pays, '(NULL)')
     ORDER BY fonds DESC`, p);

  return { fonds: fonds.n, vl, perf, decalesN: decalesN.n, decales, parPays };
}

function printSnapshot(label, s, pays) {
  const d = (x) => (x ? String(x).slice(0, 10) : 'aucune');
  console.log(`\n--- ETAT ${label} (${pays}) ---`);
  console.log(`  Fonds actifs           : ${s.fonds}`);
  console.log(`  Valorisations          : ${s.vl.n} (derniere : ${d(s.vl.derniere_date)})`);
  console.log(`    vl_ajuste NULL       : ${s.vl.vl_ajuste_null}`);
  console.log(`    value_EUR NULL       : ${s.vl.eur_null}`);
  console.log(`    value_USD NULL       : ${s.vl.usd_null}`);
  console.log(`  Lignes performences    : ${s.perf.n} (derniere : ${d(s.perf.derniere_date)})`);
  console.log(`    ytd renseigne        : ${s.perf.ytd_non_null}`);
  console.log(`    perf1an renseigne    : ${s.perf.perf1an_non_null}`);
  console.log(`  Fonds dont la perf est PLUS ANCIENNE que la derniere VL : ${s.decalesN}`);
  for (const r of s.decales) {
    console.log(`    - [${r.id}] ${r.nom_fond} : VL ${d(r.derniere_vl)} / perf ${d(r.derniere_perf)}`);
  }
  if (s.parPays && s.parPays.length > 1) {
    console.log('  Ventilation par pays :');
    console.log(`    ${'pays'.padEnd(22)} ${'fonds'.padStart(6)}  ${'derniere VL'.padEnd(12)} derniere perf`);
    for (const r of s.parPays) {
      console.log(`    ${String(r.pays).padEnd(22)} ${String(r.fonds).padStart(6)}  ${d(r.derniere_vl).padEnd(12)} ${d(r.derniere_perf)}`);
    }
  }
}

/** Lance un script enfant en heritant stdout/stderr. Retourne true si succes. */
function runStep(n, total, titre, script, args) {
  const rel = path.relative(ROOT, script);
  console.log(`\n${'='.repeat(70)}`);
  console.log(`ETAPE ${n}/${total} — ${titre}`);
  console.log(`  node ${rel} ${args.join(' ')}`);
  console.log('='.repeat(70));
  const t0 = Date.now();
  const res = spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT, stdio: 'inherit', env: process.env,
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (res.error) {
    console.error(`\n[ETAPE ${n}] ECHEC (lancement) : ${res.error.message}`);
    return false;
  }
  if (res.status !== 0) {
    console.error(`\n[ETAPE ${n}] ECHEC (code ${res.status}) apres ${secs}s`);
    return false;
  }
  console.log(`\n[ETAPE ${n}] OK en ${secs}s`);
  return true;
}

async function main() {
  const opts = parseArgs();
  const P = opts.pays;

  console.log('==========================================================');
  console.log('  RECALCUL CIBLE DES DONNEES DERIVEES DES VALORISATIONS');
  console.log(`  Perimetre : ${opts.tous ? 'TOUS LES FONDS ACTIFS' : `pays = ${P}`}`);
  console.log(`  Mode : ${opts.execute && opts.confirm ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}`);
  console.log(`  Etapes : ${opts.onlyPerf ? '3 et 4 seulement (--only-perf)' : '1 a 4'}`);
  console.log(`  Classements : ${opts.withClassements ? 'INCLUS (impact inter-pays)' : 'EXCLUS'}`);
  console.log('==========================================================');

  const conn = await mysql.createConnection(DB_CONFIG);
  const avant = await snapshot(conn, P, opts.tous);

  if (avant.fonds === 0) {
    console.error(`\nARRET : aucun fonds actif pour pays='${P}'. Verifier l'orthographe`);
    console.error("        (la comparaison est insensible a la casse mais pas aux accents).");
    console.error('        Valeurs connues : MAROC, TUNISIE, NIGERIA, UEMOA, CEMAC.');
    await conn.end();
    process.exit(2);
  }
  printSnapshot('AVANT', avant, opts.tous ? 'TOUS PAYS' : P);

  const scripts = {
    vlAjuste: path.join(ROOT, 'scripts/recalc/recalc_vl_ajuste.js'),
    eurUsd: path.join(ROOT, 'scripts/recalc/recalc_eur_usd_daily_rate.js'),
    perf: path.join(ROOT, 'scripts/fix/fix_populate_performances.js'),
    perfDev: path.join(ROOT, 'scripts/fix/fix_populate_performances_eur_usd.js'),
    classement: path.join(ROOT, 'scripts/fix/trigger_classement_recompute.js'),
  };

  // En mode TOUS, on ne passe AUCUN filtre pays aux scripts enfants : leur
  // comportement par defaut est deja « tous les fonds actifs ».
  const F = opts.tous ? [] : ['--pays', P];

  const plan = [];
  if (!opts.onlyPerf) {
    plan.push(['vl_ajuste = value + cumul dividendes', scripts.vlAjuste, [...F]]);
    plan.push(['value_EUR / value_USD au taux du jour', scripts.eurUsd, [...F]]);
  }
  plan.push(['performances locales (YTD, 1A, 3A...)', scripts.perf, [...F, '--force']]);
  plan.push(['performances EUR + USD', scripts.perfDev, ['--devise', 'BOTH', ...F, '--force']]);

  if (opts.withClassements) {
    plan.push(['classements EUR + USD (INTER-PAYS)', scripts.classement, []]);
  }

  if (!opts.execute || !opts.confirm) {
    console.log(`\n--- PLAN (${plan.length} etapes, dans cet ordre) ---`);
    plan.forEach(([titre, s, a], i) => {
      console.log(`  ${i + 1}. ${titre}`);
      console.log(`     node ${path.relative(ROOT, s)} ${a.join(' ')}`);
    });
    console.log('\nDRY-RUN : rien n\'a ete ecrit.');
    console.log('Pour executer reellement, relancer avec :  --execute --confirm');
    if (!opts.withClassements) {
      console.log('Ajouter --with-classements SEULEMENT si le deplacement des rangs');
      console.log('des autres pays (meme categorie) est accepte.');
    }
    await conn.end();
    process.exit(0);
  }

  // --- Execution ---
  const t0 = Date.now();
  for (let i = 0; i < plan.length; i++) {
    const [titre, script, args] = plan[i];
    if (!runStep(i + 1, plan.length, titre, script, args)) {
      console.error('\nCHAINE INTERROMPUE : les etapes suivantes ne sont pas lancees');
      console.error('pour ne pas propager un etat partiel. Corriger puis relancer.');
      const partiel = await snapshot(conn, P, opts.tous);
      printSnapshot('APRES (PARTIEL)', partiel, opts.tous ? 'TOUS PAYS' : P);
      await conn.end();
      process.exit(1);
    }
  }

  const apres = await snapshot(conn, P, opts.tous);
  const label = opts.tous ? 'TOUS PAYS' : P;
  printSnapshot('APRES', apres, label);

  console.log(`\n--- DELTA (${label}) ---`);
  console.log(`  vl_ajuste NULL       : ${avant.vl.vl_ajuste_null} -> ${apres.vl.vl_ajuste_null}`);
  console.log(`  value_EUR NULL       : ${avant.vl.eur_null} -> ${apres.vl.eur_null}`);
  console.log(`  value_USD NULL       : ${avant.vl.usd_null} -> ${apres.vl.usd_null}`);
  console.log(`  Lignes performences  : ${avant.perf.n} -> ${apres.perf.n}`);
  console.log(`  ytd renseigne        : ${avant.perf.ytd_non_null} -> ${apres.perf.ytd_non_null}`);
  console.log(`  perf1an renseigne    : ${avant.perf.perf1an_non_null} -> ${apres.perf.perf1an_non_null}`);
  console.log(`  Perf en retard / VL  : ${avant.decalesN} -> ${apres.decalesN}`);
  console.log(`\nTermine en ${((Date.now() - t0) / 60000).toFixed(1)} min.`);

  if (apres.decalesN > 0) {
    console.log('\nATTENTION : il reste des fonds dont la perf est plus ancienne que');
    console.log('la derniere VL. Causes normales possibles : historique trop court');
    console.log('pour calculer une perf, ou fonds sans VL exploitable. A verifier');
    console.log('avec scripts/diag/check_dormant_funds_coverage.js.');
  }
  if (!opts.withClassements) {
    console.log('\nRAPPEL : les classements/quartiles n\'ont PAS ete recalcules.');
    console.log('Les rangs affiches restent ceux d\'avant la correction.');
  }

  await conn.end();
  process.exit(0);
}

main().catch((e) => {
  console.error('ERREUR FATALE :', e.message);
  process.exit(1);
});
