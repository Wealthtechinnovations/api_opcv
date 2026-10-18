#!/usr/bin/env node
/**
 * fix_gdl_merge_1219.js — Fusion GDL Canary Growth Fund, OPTION A (validee).
 *
 * DECISION UTILISATEUR (2026-08-02) : « Adopter la serie SEC ».
 * Le fonds 1219 conserve son identite et son alias, mais adopte la serie
 * QUALIFIEE du fonds archive 2867.
 *
 * DIAGNOSTIC SQL AYANT MOTIVE CE CHOIX
 * ------------------------------------
 *   fund_id | price_type | n   | plage
 *   --------|------------|-----|--------------------------
 *   1219    | NULL       | 273 | 2020-11-27 -> 2026-04-24   (origine INCONNUE)
 *   1219    | UNIT_PRICE |   1 | 2021-05-28
 *   2867    | BID        | 240 | 2021-12-03 -> 2026-07-10   (officiel SEC)
 *   2867    | UNIT_PRICE |  26 | 2021-06-04 -> 2021-11-26   (officiel SEC)
 *   2867    | OFFER      |   1 | 2025-10-31                 (officiel SEC)
 *
 * Le survivant actif (1219) portait des valeurs non tracees ; le fonds archive
 * (2867) porte les mesures officielles sourcees. Le mauvais fonds avait ete
 * retenu comme survivant. Ce script repare cela SANS changer l'id public.
 *
 * OPERATION
 * ---------
 *   1. COLLISIONS (247 dates presentes des deux cotes) : la ligne de 1219 adopte
 *      les colonnes de mesure de la ligne 2867 correspondante (value, mesures
 *      explicites, provenance). L'ancienne valeur de 1219 est journalisee
 *      integralement (snapshot JSON) avant ecrasement.
 *   2. TRANSFERABLES (20 dates presentes uniquement sur 2867) : la ligne 2867
 *      est rattachee a 1219 (fund_id 2867 -> 1219).
 *   3. HISTORIQUE PROPRE A 1219 (dates absentes de 2867, dont 2020-11 -> 2021-05) :
 *      INTACT. Aucune mesure qualifiee concurrente n'existe pour ces dates.
 *
 * CE QU'IL NE FAIT JAMAIS
 *   * aucune suppression de ligne ;
 *   * aucune modification des colonnes derivees devise (value_EUR/USD, vl_ajuste*)
 *     n'est consideree comme definitive : le recalcul cible du fonds 1219 est
 *     OBLIGATOIRE juste apres (commandes imprimees en fin d'execution) ;
 *   * aucun changement du flag active des deux fonds.
 *
 * REVERSIBLE INTEGRALEMENT : chaque ligne modifiee est journalisee dans
 * sec_ng_corrections_audit avec un snapshot JSON avant/apres.
 *   node scripts/fix/fix_gdl_merge_1219.js --rollback <batch>
 *
 * USAGE
 *   node scripts/fix/fix_gdl_merge_1219.js                      # dry-run
 *   node scripts/fix/fix_gdl_merge_1219.js --execute --confirm  # applique
 *   node scripts/fix/fix_gdl_merge_1219.js --rollback GDLADOPT_20260802_160000
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const SURVIVANT = 1219; // reste actif, id/alias conserves
const ARCHIVE = 2867;   // porte les mesures officielles SEC

// Colonnes de MESURE a adopter depuis 2867. Intersectees a l'execution avec le
// schema reel (robustesse). On ne copie NI l'id, NI fund_id, NI date, NI les
// colonnes de benchmark/indice, NI dividende (GDL n'en verse pas).
//
// IMPORTANT — on NE copie PAS les colonnes derivees devise (value_EUR/USD,
// vl_ajuste*, actif_net*) : elles sont NOT NULL dans le schema, et 2867 (fonds
// archive, jamais recalcule) peut les avoir a NULL — la copie echouerait. Elles
// sont de toute facon RECALCULEES juste apres (etape obligatoire). On copie donc
// `value` (NOT NULL des deux cotes : copie toujours valide) et les colonnes de
// qualification ajoutees par la migration, toutes NULLABLE (copie de NULL sure).
// La serie AFFICHEE (graphique VL local) s'appuie sur `value` : elle est donc
// corrigee immediatement ; le reste suit au recalcul.
const COPY_WHITELIST = [
  'value',
  'price_type', 'currency_code',
  'net_assets_ngn', 'net_assets_usd',
  'unit_price_ngn', 'unit_price_usd',
  'bid_price_ngn', 'bid_price_usd',
  'offer_price_ngn', 'offer_price_usd',
  'sec_document_id', 'source_url', 'report_date', 'data_quality',
];

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

function fmtDate(x) {
  if (!x) return null;
  if (x instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  return String(x).slice(0, 10);
}

function horodatage() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_`
       + `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// Serialise une valeur SQL pour le snapshot JSON : les dates deviennent
// AAAA-MM-JJ (pas d'ISO/UTC qui reculerait d'un jour), le reste tel quel.
function serialiser(v) {
  return v instanceof Date ? fmtDate(v) : v;
}

async function colonnesReelles(conn) {
  const [rows] = await conn.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'valorisations'`);
  const set = new Set(rows.map((r) => r.COLUMN_NAME));
  return COPY_WHITELIST.filter((c) => set.has(c));
}

async function etatFonds(conn) {
  const [rows] = await conn.execute(
    `SELECT v.fund_id, COUNT(*) AS n, MIN(v.date) AS debut, MAX(v.date) AS fin
     FROM valorisations v WHERE v.fund_id IN (?, ?) GROUP BY v.fund_id`,
    [SURVIVANT, ARCHIVE]);
  const [fonds] = await conn.execute(
    `SELECT id, nom_fond, active FROM fond_investissements WHERE id IN (?, ?)`,
    [SURVIVANT, ARCHIVE]);
  return { rows, fonds };
}

function afficherEtat(label, { rows, fonds }) {
  console.log(`\n--- ETAT ${label} ---`);
  for (const f of fonds) {
    const r = rows.find((x) => x.fund_id === f.id);
    console.log(`  [${f.id}] active=${f.active} « ${f.nom_fond} »`);
    console.log(`         ${r ? `${r.n} lignes, ${fmtDate(r.debut)} -> ${fmtDate(r.fin)}` : 'aucune valorisation'}`);
  }
}

async function rollback(conn, batch) {
  const [lignes] = await conn.execute(
    `SELECT id, valorisation_id, action, old_value FROM sec_ng_corrections_audit
     WHERE batch = ? AND reverted = 0 ORDER BY id DESC`, [batch]);
  if (lignes.length === 0) {
    console.error(`Aucune ligne active a annuler pour le batch « ${batch} ».`);
    return 1;
  }
  console.log(`${lignes.length} lignes a restaurer...`);
  await conn.beginTransaction();
  try {
    for (const l of lignes) {
      const snap = JSON.parse(l.old_value);
      if (l.action === 'MERGE_FUND') {
        await conn.execute('UPDATE valorisations SET fund_id = ? WHERE id = ?',
          [parseInt(snap.fund_id, 10), l.valorisation_id]);
      } else { // UPDATE_VALUE : restaurer chaque colonne du snapshot
        const cols = Object.keys(snap);
        const sets = cols.map((c) => `\`${c}\` = ?`).join(', ');
        const vals = cols.map((c) => snap[c]);
        await conn.execute(
          `UPDATE valorisations SET ${sets} WHERE id = ?`, [...vals, l.valorisation_id]);
      }
    }
    await conn.execute(
      'UPDATE sec_ng_corrections_audit SET reverted = 1 WHERE batch = ?', [batch]);
    await conn.commit();
    console.log('Rollback termine. Penser a relancer le recalcul cible du fonds 1219.');
    return 0;
  } catch (e) {
    await conn.rollback();
    console.error('Rollback ANNULE (transaction annulee, base inchangee) :', e.message);
    return 1;
  }
}

async function main() {
  const a = process.argv.slice(2);
  const rbIdx = a.indexOf('--rollback');
  const execute = a.includes('--execute') && a.includes('--confirm');

  const conn = await mysql.createConnection(DB_CONFIG);

  if (rbIdx !== -1) {
    const code = await rollback(conn, a[rbIdx + 1]);
    await conn.end();
    process.exit(code);
  }

  console.log('==========================================================');
  console.log('  FUSION GDL — OPTION A : 1219 adopte la serie SEC de 2867');
  console.log(`  Mode : ${execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}`);
  console.log('==========================================================');

  const avant = await etatFonds(conn);
  afficherEtat('AVANT', avant);

  const fSurv = avant.fonds.find((f) => f.id === SURVIVANT);
  const fArch = avant.fonds.find((f) => f.id === ARCHIVE);
  if (!fSurv || !fArch) {
    console.error(`\nARRET : les fonds ${SURVIVANT} et ${ARCHIVE} doivent exister.`);
    await conn.end(); process.exit(2);
  }
  if (fSurv.active !== 1 || fArch.active !== 0) {
    console.error(`\nARRET : etat inattendu (attendu ${SURVIVANT} actif, ${ARCHIVE} archive).`);
    console.error('        La situation a change depuis le diagnostic : re-diagnostiquer.');
    await conn.end(); process.exit(2);
  }

  const cols = await colonnesReelles(conn);
  console.log(`\nColonnes de mesure adoptees (${cols.length}) : ${cols.join(', ')}`);

  // Collisions : ligne survivant + ligne archive, avec toutes les colonnes.
  const selCols = cols.map((c) => `vs.\`${c}\` AS \`surv_${c}\`, va.\`${c}\` AS \`arch_${c}\``).join(', ');
  const [collisions] = await conn.execute(
    `SELECT vs.id AS surv_id, va.id AS arch_id, va.date AS d,
            vs.value AS surv_value, va.value AS arch_value, ${selCols}
     FROM valorisations va
     JOIN valorisations vs ON vs.fund_id = ? AND vs.date = va.date
     WHERE va.fund_id = ?
     ORDER BY va.date DESC`, [SURVIVANT, ARCHIVE]);

  // Transferables : lignes de l'archive sans equivalent de date sur le survivant.
  const [transferables] = await conn.execute(
    `SELECT va.id AS arch_id, va.date AS d
     FROM valorisations va
     LEFT JOIN valorisations vs ON vs.fund_id = ? AND vs.date = va.date
     WHERE va.fund_id = ? AND vs.id IS NULL
     ORDER BY va.date`, [SURVIVANT, ARCHIVE]);

  const divergentes = collisions.filter(
    (c) => Number(c.surv_value) !== Number(c.arch_value));

  console.log('\n--- ANALYSE ---');
  console.log(`  Collisions (dates communes)       : ${collisions.length}`);
  console.log(`    dont valeurs divergentes        : ${divergentes.length} (value SEC adoptee)`);
  console.log(`  Transferables (dates 2867 seules) : ${transferables.length}`);
  console.log(`  Historique propre a 1219 conserve : ${(avant.rows.find((r) => r.fund_id === SURVIVANT)?.n || 0) - collisions.length}`);
  console.log('\n  Apercu des remplacements (value inconnue -> value SEC) :');
  for (const c of divergentes.slice(0, 5)) {
    console.log(`    ${fmtDate(c.d)} : ${c.surv_value} -> ${c.arch_value} [${c.arch_price_type || '?'}]`);
  }

  if (!execute) {
    console.log('\nDRY-RUN : rien n\'a ete ecrit.');
    console.log('Pour appliquer :  --execute --confirm');
    await conn.end(); process.exit(0);
  }

  const batch = `GDLADOPT_${horodatage()}`;
  console.log(`\nBatch : ${batch}\nApplication (transaction unique)...`);

  await conn.beginTransaction();
  try {
    // 1. Collisions : 1219 adopte les colonnes de mesure de 2867.
    for (const c of collisions) {
      const oldSnap = {}; const newSnap = {};
      for (const col of cols) {
        oldSnap[col] = serialiser(c[`surv_${col}`]);
        newSnap[col] = serialiser(c[`arch_${col}`]);
      }
      oldSnap.correction_batch = null; // trace de la valeur de batch precedente
      const sets = cols.map((col) => `\`${col}\` = ?`).join(', ');
      const vals = cols.map((col) => c[`arch_${col}`]);
      await conn.execute(
        `UPDATE valorisations SET ${sets}, correction_batch = ? WHERE id = ?`,
        [...vals, batch, c.surv_id]);
      await conn.execute(
        `INSERT INTO sec_ng_corrections_audit
           (batch, valorisation_id, fund_id, valuation_date, action,
            field_name, old_value, new_value, reason)
         VALUES (?, ?, ?, ?, 'UPDATE_VALUE', 'mesure_row',
                 ?, ?, 'fusion GDL option A : 1219 adopte la mesure SEC officielle de 2867')`,
        [batch, c.surv_id, SURVIVANT, fmtDate(c.d),
         JSON.stringify(oldSnap), JSON.stringify(newSnap)]);
    }

    // 2. Transferables : rattachement de la ligne 2867 au fonds 1219.
    for (const t of transferables) {
      await conn.execute(
        'UPDATE valorisations SET fund_id = ?, correction_batch = ? WHERE id = ?',
        [SURVIVANT, batch, t.arch_id]);
      await conn.execute(
        `INSERT INTO sec_ng_corrections_audit
           (batch, valorisation_id, fund_id, valuation_date, action,
            field_name, old_value, new_value, reason)
         VALUES (?, ?, ?, ?, 'MERGE_FUND', 'fund_id', ?, ?,
                 'fusion GDL option A : date presente uniquement sur 2867, rattachee a 1219')`,
        [batch, t.arch_id, SURVIVANT, fmtDate(t.d),
         JSON.stringify({ fund_id: ARCHIVE }), JSON.stringify({ fund_id: SURVIVANT })]);
    }

    await conn.commit();
    console.log(`OK : ${collisions.length} mesures adoptees + ${transferables.length} lignes rattachees.`);
  } catch (e) {
    await conn.rollback();
    console.error('ECHEC — transaction annulee, base inchangee :', e.message);
    await conn.end(); process.exit(1);
  }

  afficherEtat('APRES', await etatFonds(conn));

  console.log(`\nROLLBACK : node scripts/fix/fix_gdl_merge_1219.js --rollback ${batch}`);
  console.log('\nETAPE SUIVANTE OBLIGATOIRE — recalcul cible du fonds 1219 :');
  console.log('  node scripts/recalc/recalc_vl_ajuste.js 1219');
  console.log('  node scripts/recalc/recalc_eur_usd_daily_rate.js 1219');
  console.log('  node scripts/fix/fix_populate_performances.js --fond 1219 --force');
  console.log('  node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --fond 1219 --force');
  console.log('\nSans ce recalcul, value_EUR/USD et les performances de 1219 restent');
  console.log('provisoires (issues de l\'archive, non recalculees au taux du jour).');

  await conn.end();
  process.exit(0);
}

main().catch((e) => { console.error('ERREUR FATALE :', e.message); process.exit(1); });
