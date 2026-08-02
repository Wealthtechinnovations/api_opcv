#!/usr/bin/env node
/**
 * fix_gdl_merge_1219.js — Repare la fusion GDL Canary Growth Fund.
 *
 * DIAGNOSTIC ETABLI EN PRODUCTION (2026-08-02, requetes SQL)
 * ---------------------------------------------------------
 *   fund_id | lignes | debut      | fin        | issues du batch SECNGFIX
 *   --------|--------|------------|------------|-------------------------
 *   1219    |  274   | 2020-11-27 | 2026-04-24 | AUCUNE (NULL)
 *   2867    |  267   | 2021-06-04 | 2026-07-10 | 265
 *
 *   1219 = « GDL CANARYGROWTH FUND », active = 1  (visible sur le site)
 *   2867 = « GDL Canary Growth Fund », active = 0 (archive par la fusion)
 *
 * La resolution d'identite a rattache les observations SEC recentes a 2867,
 * puis la phase de fusion a archive 2867 SANS transferer ses valorisations
 * vers 1219. Consequence visible : le fonds affiche est fige au 2026-04-24
 * tandis que le fonds a jour est invisible.
 *
 * DECISION UTILISATEUR A RESPECTER : « fusion vers 1219 avec alias conserve ».
 * 1219 reste donc le survivant. Ce script transfere vers 1219 les
 * valorisations de 2867 dont la date est ABSENTE de 1219.
 *
 * CE QU'IL NE FAIT PAS
 * --------------------
 *   * Il ne supprime JAMAIS une ligne.
 *   * Il ne touche JAMAIS une date deja presente sur 1219 (collision) : la
 *     ligne reste sur 2867, elle est listee dans le rapport et laissee a
 *     l'arbitrage humain. On ne choisit pas silencieusement entre deux
 *     valeurs concurrentes pour une meme date.
 *   * Il ne reactive ni ne desactive aucun fonds.
 *
 * REVERSIBLE : chaque transfert est journalise dans sec_ng_corrections_audit
 * (action MERGE_FUND, old_value = 2867, new_value = 1219). `--rollback <batch>`
 * remet les lignes sur leur fonds d'origine.
 *
 * USAGE
 *   node scripts/fix/fix_gdl_merge_1219.js                     # dry-run
 *   node scripts/fix/fix_gdl_merge_1219.js --execute --confirm # applique
 *   node scripts/fix/fix_gdl_merge_1219.js --rollback GDLFIX_20260802_150000
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const SURVIVANT = 1219;
const ARCHIVE = 2867;

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

function fmtDate(x) {
  if (!x) return 'aucune';
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

async function etat(conn) {
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
    `SELECT valorisation_id, old_value FROM sec_ng_corrections_audit
     WHERE batch = ? AND action = 'MERGE_FUND' AND reverted = 0`, [batch]);
  if (lignes.length === 0) {
    console.error(`Aucune ligne a annuler pour le batch « ${batch} ».`);
    return 1;
  }
  console.log(`${lignes.length} lignes a remettre sur leur fonds d'origine...`);
  await conn.beginTransaction();
  try {
    for (const l of lignes) {
      await conn.execute('UPDATE valorisations SET fund_id = ? WHERE id = ?',
        [parseInt(l.old_value, 10), l.valorisation_id]);
    }
    await conn.execute(
      `UPDATE sec_ng_corrections_audit SET reverted = 1
       WHERE batch = ? AND action = 'MERGE_FUND'`, [batch]);
    await conn.commit();
    console.log('Rollback termine.');
    return 0;
  } catch (e) {
    await conn.rollback();
    console.error('Rollback ANNULE (transaction annulee) :', e.message);
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
  console.log('  REPARATION DE LA FUSION GDL CANARY GROWTH FUND');
  console.log(`  Survivant : ${SURVIVANT}   Archive : ${ARCHIVE}`);
  console.log(`  Mode : ${execute ? 'EXECUTION' : 'DRY-RUN (aucune ecriture)'}`);
  console.log('==========================================================');

  const avant = await etat(conn);
  afficherEtat('AVANT', avant);

  // Garde-fou : ne rien faire si la situation diagnostiquee n'est plus celle-ci.
  const fSurv = avant.fonds.find((f) => f.id === SURVIVANT);
  const fArch = avant.fonds.find((f) => f.id === ARCHIVE);
  if (!fSurv || !fArch) {
    console.error(`\nARRET : les fonds ${SURVIVANT} et ${ARCHIVE} doivent exister tous les deux.`);
    await conn.end(); process.exit(2);
  }
  if (fSurv.active !== 1 || fArch.active !== 0) {
    console.error(`\nARRET : etat inattendu (attendu ${SURVIVANT} actif et ${ARCHIVE} archive).`);
    console.error('        La situation a change depuis le diagnostic : re-diagnostiquer.');
    await conn.end(); process.exit(2);
  }

  // Lignes de l'archive dont la date est ABSENTE du survivant -> transferables.
  const [transferables] = await conn.execute(
    `SELECT va.id, va.date, va.value
     FROM valorisations va
     LEFT JOIN valorisations vs ON vs.fund_id = ? AND vs.date = va.date
     WHERE va.fund_id = ? AND vs.id IS NULL
     ORDER BY va.date`, [SURVIVANT, ARCHIVE]);

  // Collisions : meme date des deux cotes -> jamais touchees, listees.
  const [collisions] = await conn.execute(
    `SELECT va.date, va.value AS valeur_archive, vs.value AS valeur_survivant
     FROM valorisations va
     JOIN valorisations vs ON vs.fund_id = ? AND vs.date = va.date
     WHERE va.fund_id = ?
     ORDER BY va.date DESC`, [SURVIVANT, ARCHIVE]);

  console.log('\n--- ANALYSE ---');
  console.log(`  Transferables (date absente de ${SURVIVANT}) : ${transferables.length}`);
  if (transferables.length) {
    console.log(`    plage : ${fmtDate(transferables[0].date)} -> ${fmtDate(transferables[transferables.length - 1].date)}`);
  }
  console.log(`  Collisions (date presente des deux cotes)   : ${collisions.length}  [NON TOUCHEES]`);
  const divergentes = collisions.filter(
    (c) => Number(c.valeur_archive) !== Number(c.valeur_survivant));
  console.log(`    dont valeurs divergentes                  : ${divergentes.length}`);
  for (const c of divergentes.slice(0, 5)) {
    console.log(`      ${fmtDate(c.date)} : archive=${c.valeur_archive} / survivant=${c.valeur_survivant}`);
  }

  if (transferables.length === 0) {
    console.log('\nRien a transferer. Aucune action.');
    await conn.end(); process.exit(0);
  }

  if (!execute) {
    console.log('\nDRY-RUN : rien n\'a ete ecrit.');
    console.log('Pour appliquer :  --execute --confirm');
    await conn.end(); process.exit(0);
  }

  const batch = `GDLFIX_${horodatage()}`;
  console.log(`\nBatch : ${batch}`);
  console.log('Transfert en cours (transaction unique)...');

  await conn.beginTransaction();
  try {
    for (const l of transferables) {
      await conn.execute('UPDATE valorisations SET fund_id = ? WHERE id = ?',
        [SURVIVANT, l.id]);
      await conn.execute(
        `INSERT INTO sec_ng_corrections_audit
           (batch, valorisation_id, fund_id, valuation_date, action,
            field_name, old_value, new_value, reason)
         VALUES (?, ?, ?, ?, 'MERGE_FUND', 'fund_id', ?, ?, ?)`,
        [batch, l.id, SURVIVANT, fmtDate(l.date), String(ARCHIVE), String(SURVIVANT),
         `fusion GDL : ligne rattachee a tort au fonds archive ${ARCHIVE}, `
         + `transferee vers le survivant actif ${SURVIVANT} (date absente de ${SURVIVANT})`]);
    }
    await conn.commit();
    console.log(`${transferables.length} lignes transferees.`);
  } catch (e) {
    await conn.rollback();
    console.error('ECHEC — transaction annulee, base inchangee :', e.message);
    await conn.end(); process.exit(1);
  }

  afficherEtat('APRES', await etat(conn));
  console.log(`\nROLLBACK : node scripts/fix/fix_gdl_merge_1219.js --rollback ${batch}`);
  console.log('\nETAPE SUIVANTE OBLIGATOIRE : recalculer les derives du fonds 1219');
  console.log('  node scripts/recalc/recalc_vl_ajuste.js 1219');
  console.log('  node scripts/recalc/recalc_eur_usd_daily_rate.js 1219');
  console.log('  node scripts/fix/fix_populate_performances.js --fond 1219 --force');
  console.log('  node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --fond 1219 --force');

  await conn.end();
  process.exit(0);
}

main().catch((e) => { console.error('ERREUR FATALE :', e.message); process.exit(1); });
