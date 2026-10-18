/**
 * Les ruptures qui ne relevent PAS du defaut de devise SEC.
 *
 * POURQUOI. Sur les 233 ruptures relevees le 2026-08-28, la grande majorite a la
 * signature du taux NGN/USD (facteur 1 380 a 1 540) : elles seront corrigees par
 * le rejeu de l extraction. Quelques-unes n ont rien a voir et seraient
 * silencieusement laissees de cote — ou pire, embarquees dans une correction de
 * masse qui ne leur convient pas :
 *
 *   - **1169 NIGERIA ENERGY SECTOR** : 1 046 071 210 contre 552, facteur 1,9
 *     MILLION. Ce n est pas une devise, c est un ordre de grandeur d actif net
 *     charge a la place d un prix de part — meme defaut que 2592 (UEMOA).
 *   - **790 UPLINE BONDS (MAROC)** : facteur 24,5. Autre chaine d import (ASFIM),
 *     autre cause.
 *   - **TUNISIE et UEMOA** : 3 lignes chacune, chaines CMF et BRVM.
 *   - Les **25 lignes sans provenance** : meme signature que les 82 deja
 *     retirees, mais dispersees dans d autres lots.
 *
 * Ce script les regarde une par une, avec leur voisinage immediat : une valeur
 * ne se juge pas seule, elle se juge dans sa serie. Il affiche aussi `actif_net`
 * et `nbre_part`, qui distinguent un prix de part d un encours total — c est le
 * test qui a tranche le cas 1196 au lot Z.
 *
 * LECTURE SEULE — uniquement des SELECT. Il decrit, il ne corrige pas.
 *
 * USAGE  node scripts/diag/ondemand/diag_cas_isoles.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

// Les fonds dont la rupture n a PAS la signature du taux de change.
const HORS_DEVISE = [1169, 790, 2592];

const n = (x, d = 2) => (x === null || x === undefined ? '-' : Number(x).toFixed(d));
const j = x => (x ? String(x).slice(0, 10) : '?');

(async () => {
  const conn = await mysql.createConnection(DB);
  try {
    console.log('\n=== CAS ISOLES — ruptures hors defaut de devise SEC ===');
    console.log(`Mesure le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — LECTURE SEULE\n`);

    console.log('## A. Fonds dont la rupture n est pas un taux de change\n');
    for (const id of HORS_DEVISE) {
      const [[f]] = await conn.query(
        'SELECT id, nom_fond, pays, dev_libelle, active FROM fond_investissements WHERE id = ?',
        [id]
      );
      if (!f) { console.log(`  [${id}] fonds introuvable\n`); continue; }
      console.log(`  [${f.id}] ${f.nom_fond} — ${f.pays} / ${f.dev_libelle || '?'} — actif=${f.active}`);

      // Le voisinage de la rupture. `actif_net` et `nbre_part` sont affiches
      // parce qu ils tranchent : si actif_net / value donne un nombre de parts
      // plausible, la valeur EST un prix de part ; sinon c est un encours.
      const [lignes] = await conn.query(`
        SELECT date, value, actif_net, nbre_part, currency_code, correction_batch,
               DATE(created_at) AS insere_le,
               CASE WHEN source_url IS NULL THEN 'non' ELSE 'oui' END AS src
          FROM valorisations
         WHERE fund_id = ? AND value > 0
         ORDER BY ABS(DATEDIFF(date, (
           SELECT v2.date FROM valorisations v2
            WHERE v2.fund_id = ? AND v2.value > 0
            ORDER BY v2.value DESC LIMIT 1
         )))
         LIMIT 8
      `, [id, id]);

      if (!lignes.length) { console.log('    aucune VL\n'); continue; }
      lignes.sort((a, b) => String(a.date).localeCompare(String(b.date)));
      console.log(`    ${'date'.padEnd(10)} ${'value'.padStart(18)} ${'actif_net'.padStart(20)} ${'parts'.padStart(12)} ${'parts impl.'.padStart(13)} devise insere     src`);
      for (const l of lignes) {
        const an = l.actif_net !== null && l.actif_net !== undefined ? Number(String(l.actif_net).replace(/[^\d.-]/g, '')) : null;
        const implicite = an && Number(l.value) > 0 ? (an / Number(l.value)) : null;
        console.log(
          `    ${j(l.date).padEnd(10)} ${n(l.value, 4).padStart(18)} ${(an === null || Number.isNaN(an) ? '-' : an.toFixed(0)).padStart(20)}` +
          ` ${String(l.nbre_part ?? '-').padStart(12)} ${(implicite ? implicite.toFixed(0) : '-').padStart(13)}` +
          ` ${String(l.currency_code || '-').padEnd(6)} ${j(l.insere_le).padEnd(10)} ${l.src}`
        );
      }
      console.log('');
    }

    console.log('## B. Les 25 lignes sans provenance, en detail\n');
    // Meme signature que les 82 deja retirees — trois colonnes de provenance
    // nulles — mais dispersees dans d autres lots d insertion. Ce sont les
    // seules que l on pourrait retirer sans perdre d information recuperable.
    const [orphelines] = await conn.query(`
      WITH serie AS (
        SELECT v.id, v.fund_id, v.date, v.value, v.created_at,
               LAG(v.value) OVER (PARTITION BY v.fund_id ORDER BY v.date) AS prec
          FROM valorisations v
          JOIN fond_investissements f ON f.id = v.fund_id AND f.active = 1
         WHERE v.value > 0
           AND v.currency_code IS NULL
           AND v.source_url IS NULL
           AND v.correction_batch IS NULL
      )
      SELECT s.fund_id, f.nom_fond, f.pays, f.dev_libelle, s.date, s.value, s.prec,
             ROUND(GREATEST(s.value / s.prec, s.prec / s.value), 1) AS facteur,
             DATE(s.created_at) AS insere_le
        FROM serie s
        JOIN fond_investissements f ON f.id = s.fund_id
       WHERE s.prec > 0
         AND (s.value / s.prec >= 10 OR s.prec / s.value >= 10)
       ORDER BY f.pays, s.fund_id, s.date
    `);

    if (!orphelines.length) {
      console.log('  aucune — toutes les ruptures restantes portent une provenance.\n');
    } else {
      console.log(`  ${orphelines.length} ligne(s)\n`);
      console.log(`  ${'fonds'.padStart(5)} ${'pays'.padEnd(8)} ${'dev'.padEnd(4)} ${'date'.padEnd(10)} ${'valeur'.padStart(16)} ${'precedente'.padStart(16)} ${'fact.'.padStart(9)} ${'insere'.padEnd(10)} nom`);
      for (const o of orphelines) {
        console.log(
          `  ${String(o.fund_id).padStart(5)} ${String(o.pays || '?').padEnd(8)} ${String(o.dev_libelle || '?').padEnd(4)}` +
          ` ${j(o.date).padEnd(10)} ${n(o.value, 4).padStart(16)} ${n(o.prec, 4).padStart(16)}` +
          ` ${String(o.facteur).padStart(9)} ${j(o.insere_le).padEnd(10)} ${String(o.nom_fond).slice(0, 32)}`
        );
      }
    }

    console.log('\n## C. Ruptures hors Nigeria — quelles chaines d import ?\n');
    // Maroc, Tunisie et UEMOA ont leurs propres chargeurs, aucun n est cable au
    // contrat d ecriture. Une rupture chez eux ne se corrige pas par le rejeu SEC.
    const [horsNg] = await conn.query(`
      WITH serie AS (
        SELECT v.fund_id, v.date, v.value, v.created_at, v.currency_code, v.source_url,
               LAG(v.value) OVER (PARTITION BY v.fund_id ORDER BY v.date) AS prec
          FROM valorisations v
          JOIN fond_investissements f ON f.id = v.fund_id AND f.active = 1
         WHERE v.value > 0 AND LOWER(f.pays) <> 'nigeria'
      )
      SELECT s.fund_id, f.nom_fond, f.pays, f.dev_libelle, s.date, s.value, s.prec,
             ROUND(GREATEST(s.value / s.prec, s.prec / s.value), 1) AS facteur,
             DATE(s.created_at) AS insere_le,
             s.currency_code,
             CASE WHEN s.source_url IS NULL THEN 'non' ELSE 'oui' END AS src
        FROM serie s
        JOIN fond_investissements f ON f.id = s.fund_id
       WHERE s.prec > 0
         AND (s.value / s.prec >= 10 OR s.prec / s.value >= 10)
       ORDER BY f.pays, s.fund_id, s.date
    `);

    if (!horsNg.length) {
      console.log('  aucune.\n');
    } else {
      console.log(`  ${horsNg.length} ligne(s) sur ${new Set(horsNg.map(r => r.fund_id)).size} fonds\n`);
      for (const r of horsNg) {
        console.log(
          `  ${String(r.pays).padEnd(8)} [${String(r.fund_id).padStart(4)}] ${String(r.nom_fond).slice(0, 30).padEnd(30)}` +
          ` ${j(r.date)} : ${n(r.value, 4)} apres ${n(r.prec, 4)} (x${r.facteur})` +
          ` — insere ${j(r.insere_le)}, devise ${r.currency_code || '-'}, source ${r.src}`
        );
      }
    }

    console.log('');
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
