/**
 * BOUCLE DE CONTROLE — verifie en continu que la realite de la production
 * correspond toujours a ce que la documentation affirme.
 *
 * POURQUOI CE SCRIPT
 * ------------------
 * Le 2026-08-12, l'audit des 33 fichiers .md a montre que le vrai probleme du
 * projet n'est pas l'oubli, mais la DERIVE SILENCIEUSE : un document affirme
 * quelque chose de faux, rien ne proteste, et chaque reprise refait le meme
 * travail sur une base fausse.
 *
 * Exemples reels ayant motive chaque controle ci-dessous :
 *   - CODE_REVIEW #34 a affirme pendant 2 mois « UEMOA stale 233 jours, pas de
 *     scraper BRVM ». Les deux moities etaient fausses : les VL etaient a jour et
 *     le scraper tournait. La date perimee venait du cache `datejour` (C1).
 *   - Une perf orpheline (fonds 1224, YTD 15 655 %) a survecu a un rollback de VL
 *     et restait servie par l'API (C2, C3).
 *   - `PRODUCTION_STATE.json`, declare source de verite par CLAUDE.md, etait lu
 *     perime depuis un clone alors que le cron tournait (C5).
 *
 * Un .md ne peut pas echouer bruyamment. Ce script, si.
 *
 * PORTEE : LECTURE SEULE. Aucune ecriture, jamais.
 *
 * SORTIE : rapport lisible + code de sortie 1 si au moins un controle CRITIQUE
 * echoue (pour declencher une alerte cron). Les controles AVERTISSEMENT
 * n'echouent pas le script mais apparaissent dans le rapport.
 *
 * USAGE
 *   node check_doc_drift.js            # rapport complet
 *   node check_doc_drift.js --json     # sortie machine (pour un dashboard)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

/**
 * Budget de fraicheur par pays, en jours calendaires, et gravite associee.
 *
 * CALIBRE SUR LES CADENCES REELLEMENT OBSERVEES le 2026-08-13, pas sur un ideal.
 * Le premier passage du script avec des budgets theoriques (5 j partout, 10 j
 * Nigeria) a produit 2 faux positifs sur 3 echecs : une alerte quotidienne
 * injustifiee finit ignoree, ce qui recree exactement la cecite que ce script
 * doit supprimer. Un seuil doit donc tolerer le week-end et le rythme reel de
 * publication de la source.
 *
 *   MAROC   ASFIM quotidien lun-ven  -> observe 2 j  -> 6 j (week-end + jour ferie)
 *   UEMOA   BRVM BOC quotidien       -> observe 1 j  -> 6 j
 *   TUNISIE CMF quotidien lun-ven    -> observe 6 j  -> 9 j (publication irreguliere)
 *   NIGERIA SEC, publication espacee -> observe 20 j -> 45 j, et AVERTISSEMENT :
 *           un retard vient de la source, pas de la plateforme.
 *   CEMAC   import par fichier, aucun cron -> AVERTISSEMENT permanent tant que
 *           bvmac_boc_daily.py n'est pas en production.
 *
 * Revoir ces valeurs si la cadence d'une source change — pas l'inverse.
 */
const FRESHNESS = {
  MAROC:   { days: 6,   level: 'CRITIQUE' },
  UEMOA:   { days: 6,   level: 'CRITIQUE' },
  TUNISIE: { days: 9,   level: 'CRITIQUE' },
  NIGERIA: { days: 45,  level: 'AVERTISSEMENT' },
  CEMAC:   { days: 400, level: 'AVERTISSEMENT' },
};
const FRESHNESS_DEFAULT = { days: 30, level: 'AVERTISSEMENT' };

// Au-dela, une performance est physiquement invraisemblable pour un OPCVM et
// signale presque toujours un melange d'echelles ou un historique troue.
const YTD_ABSURD_THRESHOLD = 500;

const results = [];
function record(id, level, label, ok, detail) {
  results.push({ id, level, label, ok, detail });
}

async function main() {
  const json = process.argv.includes('--json');
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // C1 — `datejour` desynchronise du dernier VL reel.
    // Le bug P1-01 : 315 fonds affichaient une date perimee sur des VL a jour.
    const [drift] = await conn.execute(`
      SELECT f.pays, COUNT(*) AS n
        FROM fond_investissements f
        JOIN (SELECT fund_id, MAX(date) AS d FROM valorisations GROUP BY fund_id) v
          ON v.fund_id = f.id
       WHERE f.datejour IS NULL OR DATE(f.datejour) <> DATE(v.d)
       GROUP BY f.pays`);
    const driftTotal = drift.reduce((s, r) => s + Number(r.n), 0);
    record('C1', 'CRITIQUE', 'Cache datejour synchronise avec la derniere VL',
      driftTotal === 0,
      driftTotal === 0 ? 'aucun ecart'
        : `${driftTotal} fonds desynchronises (${drift.map(r => `${r.pays}:${r.n}`).join(', ')}) — les pages pays affichent des dates fausses. Correctif : scripts/fix/fix_datejour_sync.js`);

    // C2 — performance orpheline EN TETE de serie (date sans VL correspondante,
    // et plus recente ligne du fonds).
    //
    // Le premier passage reel (2026-08-13) a compte 50 150 orphelines sur ~67 600
    // lignes, soit 74 % de la table : l'invariant initial etait trop large. Toutes
    // les perfs ne sont pas produites a une date de VL — `fix_populate_performances`
    // ecrit bien a la derniere VL du fonds, mais les routes batch
    // `saveperfdatemysql` historisent a d'autres dates. Ces lignes sont donc
    // normales, et les supprimer aurait ete une perte massive de donnees.
    //
    // Le sous-ensemble reellement nuisible est celui qui a cause le bug Vantage :
    // une orpheline qui est la LIGNE LA PLUS RECENTE du fonds, donc celle que
    // l'API sert. C'est ce que ce controle mesure desormais.
    const orphanHead = [];
    for (const t of ['performences', 'performences_eurs', 'performences_usds']) {
      const [[row]] = await conn.execute(`
        SELECT COUNT(*) AS n FROM ${t} p
         WHERE p.date = (SELECT MAX(date) FROM ${t} WHERE fond_id = p.fond_id)
           AND NOT EXISTS (SELECT 1 FROM valorisations v
                            WHERE v.fund_id = p.fond_id AND DATE(v.date) = DATE(p.date))
           AND EXISTS (SELECT 1 FROM valorisations v2 WHERE v2.fund_id = p.fond_id)`);
      if (Number(row.n) > 0) orphanHead.push(`${t}:${row.n}`);
    }
    record('C2', 'CRITIQUE', 'Aucune performance orpheline en tete de serie',
      orphanHead.length === 0,
      orphanHead.length === 0 ? 'aucune'
        : `${orphanHead.join(', ')} fonds dont la perf la plus recente porte une date sans VL — c'est elle que l'API sert. Instruire fonds par fonds AVANT toute suppression.`);

    // C3 — performances physiquement invraisemblables.
    // Aurait attrape Vantage 1224 (15 655 %) et attrape encore Zenith 2825 (239 %).
    const [absurd] = await conn.execute(`
      SELECT p.fond_id, f.nom_fond, f.pays, p.date, p.ytd
        FROM performences p JOIN fond_investissements f ON f.id = p.fond_id
       WHERE ABS(p.ytd) > ${YTD_ABSURD_THRESHOLD}
         AND p.date = (SELECT MAX(date) FROM performences WHERE fond_id = p.fond_id)
       ORDER BY ABS(p.ytd) DESC LIMIT 10`);
    record('C3', 'CRITIQUE', `Aucune performance recente au-dela de ${YTD_ABSURD_THRESHOLD} %`,
      absurd.length === 0,
      absurd.length === 0 ? 'aucune'
        : absurd.map(r => `[${r.fond_id}] ${String(r.nom_fond).slice(0, 32)} (${r.pays}) YTD ${Number(r.ytd).toFixed(0)} % au ${String(r.date).slice(0, 10)}`).join(' | '));

    // C4 — fraicheur des VL par pays, contre un budget explicite.
    const [fresh] = await conn.execute(`
      SELECT f.pays, MAX(v.date) AS derniere, DATEDIFF(CURDATE(), MAX(v.date)) AS age
        FROM fond_investissements f JOIN valorisations v ON v.fund_id = f.id
       GROUP BY f.pays`);
    for (const r of fresh) {
      const { days, level } = FRESHNESS[r.pays] ?? FRESHNESS_DEFAULT;
      record(`C4.${r.pays}`, level,
        `Fraicheur VL ${r.pays} (budget ${days} j)`,
        Number(r.age) <= days,
        `derniere VL ${String(r.derniere).slice(0, 10)}, soit ${r.age} j`);
    }

    // C5 — le snapshot que CLAUDE.md declare source de verite est-il reellement frais ?
    const snap = path.resolve(__dirname, '../../PRODUCTION_STATE.json');
    let snapOk = false, snapDetail = 'fichier absent';
    if (fs.existsSync(snap)) {
      const gen = JSON.parse(fs.readFileSync(snap, 'utf8')).generated_at;
      const ageH = (Date.now() - new Date(gen).getTime()) / 3600000;
      snapOk = ageH <= 6;
      snapDetail = `genere le ${String(gen).slice(0, 16)}, soit ${ageH.toFixed(1)} h`;
      if (!snapOk) snapDetail += ' — CLAUDE.md en fait la source de verite : ne pas s\'y fier en l\'etat';
    }
    record('C5', 'AVERTISSEMENT', 'Snapshot PRODUCTION_STATE.json frais (< 6 h)', snapOk, snapDetail);

    // C7 — series de VL contaminees par deux echelles de devise.
    //
    // Classe de defaut identifiee le 2026-08-13, recurrente et non ponctuelle :
    //   fonds 1141 AFRINVEST DOLLAR FUND — 13 ruptures d'echelle depuis 2022-03,
    //     300 points en NGN (10^4-10^5) et 13 points isolés en USD (10^1-10^2).
    //     Base YTD tombee sur un point contamine (114,68) contre 165 207 en NGN
    //     -> YTD servi de 143 958 %.
    //   fonds 1196 EMERGING AFRICA EUROBOND — trois echelles (115 / 1 655 / 159 000).
    //   fonds 1224 Vantage (lot T) — meme signature, ~90x.
    //
    // Un OPCVM ne varie pas d'un facteur 20 en douze mois. Un tel rapport signale
    // un melange d'unites (prix unitaire vs encours total, ou devise locale vs
    // devise du fonds), jamais une performance reelle.
    //
    // Volontairement sans fonction de fenetrage (LAG) : MAX/MIN sur 400 jours
    // glissants suffit et reste portable sur MySQL comme sur MariaDB.
    const [scale] = await conn.execute(`
      SELECT v.fund_id, f.nom_fond, f.pays, f.dev_libelle,
             MIN(v.value) AS vmin, MAX(v.value) AS vmax,
             MAX(v.value) / MIN(v.value) AS ratio
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
       WHERE v.value > 0
         AND v.date >= DATE_SUB(CURDATE(), INTERVAL 400 DAY)
       GROUP BY v.fund_id, f.nom_fond, f.pays, f.dev_libelle
      HAVING ratio > 20
       ORDER BY ratio DESC
       LIMIT 15`);
    record('C7', 'CRITIQUE', 'Aucune serie de VL melangeant deux echelles (12 mois)',
      scale.length === 0,
      scale.length === 0 ? 'aucune'
        : scale.map(r => `[${r.fund_id}] ${String(r.nom_fond).slice(0, 30)} (${r.pays}/${r.dev_libelle}) ${Number(r.ratio).toFixed(0)}x [${Number(r.vmin).toFixed(2)} .. ${Number(r.vmax).toFixed(0)}]`).join(' | '));

    // C6 — couverture benchmark : un fonds sans indRef n'est comparable a rien.
    const [cov] = await conn.execute(`
      SELECT f.pays, COUNT(*) AS total, SUM(CASE WHEN v.indRef IS NULL THEN 1 ELSE 0 END) AS sans
        FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
       GROUP BY f.pays`);
    for (const r of cov) {
      const pct = Number(r.total) ? (100 * (Number(r.total) - Number(r.sans)) / Number(r.total)) : 0;
      record(`C6.${r.pays}`, 'AVERTISSEMENT', `Couverture indRef ${r.pays}`,
        pct >= 95, `${pct.toFixed(1)} % (${r.sans} VL sans benchmark sur ${r.total})`);
    }

    // Rendu
    if (json) {
      console.log(JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2));
    } else {
      console.log('\n=== BOUCLE DE CONTROLE — DERIVE DOCUMENTATION / PRODUCTION ===\n');
      for (const r of results) {
        const mark = r.ok ? 'OK   ' : (r.level === 'CRITIQUE' ? 'ECHEC' : 'ALERTE');
        console.log(`[${mark}] ${r.id.padEnd(12)} ${r.label}`);
        if (!r.ok || process.argv.includes('--verbose')) console.log(`             ${r.detail}`);
      }
      const failed = results.filter(r => !r.ok && r.level === 'CRITIQUE');
      const warned = results.filter(r => !r.ok && r.level === 'AVERTISSEMENT');
      console.log(`\n${results.filter(r => r.ok).length}/${results.length} controles OK` +
                  ` — ${failed.length} echec(s) critique(s), ${warned.length} alerte(s).`);
      if (failed.length) {
        console.log('\nUn echec critique signifie que la production contredit ce que la');
        console.log('documentation affirme. Corriger la production OU corriger le document,');
        console.log('puis consigner dans SUIVI.md > POINT DE REPRISE COURANT.');
      }
    }

    if (results.some(r => !r.ok && r.level === 'CRITIQUE')) process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('Erreur fatale :', err.message);
  process.exit(2);
});
