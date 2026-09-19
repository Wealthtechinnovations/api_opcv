#!/usr/bin/env node
/**
 * fix_fundafrica_categories.js — Corrige les categories FundAfrica manquantes (#62)
 *
 * Probleme : les fonds recents (ex 2863-2881) ont categorie_fundafrica_regionale
 * et/ou categorie_fundafrica_globale NULL dans fond_investissements. Le recompute
 * des classements appelait calculateRankRegionalDev(null, ...) qui classait ces
 * fonds parmi le groupe "IS NULL" (classement absurde type "6/18 Afrique du Nord").
 *
 * Principe (JAMAIS inventer une categorie) : pour chaque fond dont la categorie
 * FundAfrica regionale/globale est NULL ou vide, on derive la valeur canonique par
 * VOTE MAJORITAIRE parmi les fonds PAIRS actifs — meme pays + meme categorie_national.
 * Si aucun pair n'a de valeur, ou en cas d'egalite entre deux valeurs distinctes
 * (apres normalisation casse), le fond est IGNORE et liste dans le rapport.
 *
 * Tables mises a jour (fond corrige uniquement) :
 *   - fond_investissements (source de verite)
 *   - performences, performences_eurs, performences_usds (copies par ligne,
 *     lues par le service de classement)
 * Les tables classementfonds* ne sont PAS touchees : elles seront reconstruites
 * par le recompute (routes /api/classementmysql, /api/classementeur, /api/classementusd).
 *
 * Usage :
 *   node scripts/fix/fix_fundafrica_categories.js                  # DRY-RUN (defaut)
 *   node scripts/fix/fix_fundafrica_categories.js --execute
 *   node scripts/fix/fix_fundafrica_categories.js --pays=MAROC --execute
 */
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

function parseArgs() {
  // Accepte '--flag valeur' ET '--flag=valeur' (compat bridge scoped-write MCP)
  const args = [];
  for (const tok of process.argv.slice(2)) {
    const m = /^(--[a-zA-Z]+)=(.*)$/.exec(tok);
    if (m) { args.push(m[1], m[2]); } else { args.push(tok); }
  }
  const o = { execute: false, pays: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--execute') o.execute = true;
    else if (args[i] === '--pays') o.pays = args[++i] || null;
  }
  return o;
}

// Vote majoritaire sur les valeurs non vides des pairs. Les variantes de casse
// sont regroupees ; on retient la graphie la plus frequente du groupe gagnant
// (les canoniques etant en MAJUSCULES, c'est elle qui domine).
function majority(values) {
  const groups = new Map(); // cle upper -> Map(graphie -> count)
  for (const v of values) {
    if (!v || !String(v).trim()) continue;
    const raw = String(v).trim();
    const key = raw.toUpperCase();
    if (!groups.has(key)) groups.set(key, new Map());
    const g = groups.get(key);
    g.set(raw, (g.get(raw) || 0) + 1);
  }
  if (groups.size === 0) return { value: null, reason: 'aucun pair avec valeur' };
  const totals = [...groups.entries()]
    .map(([key, g]) => ({ key, g, total: [...g.values()].reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total);
  if (totals.length > 1 && totals[0].total === totals[1].total) {
    return { value: null, reason: `egalite entre "${totals[0].key}" et "${totals[1].key}"` };
  }
  const winner = totals[0];
  const spelling = [...winner.g.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { value: spelling, votes: winner.total };
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`=== FIX CATEGORIES FUNDAFRICA (#62) — mode: ${opts.execute ? 'EXECUTE' : 'DRY-RUN'} ===`);

  // 1) Fonds actifs avec categorie FundAfrica regionale ou globale manquante
  let sql = `
    SELECT id, nom_fond, pays, categorie_national, categorie_regional,
           categorie_fundafrica_regionale, categorie_fundafrica_globale
    FROM fond_investissements
    WHERE active = 1
      AND (categorie_fundafrica_regionale IS NULL OR categorie_fundafrica_regionale = ''
        OR categorie_fundafrica_globale  IS NULL OR categorie_fundafrica_globale  = '')`;
  const params = [];
  if (opts.pays) { sql += ' AND LOWER(pays) = LOWER(?)'; params.push(opts.pays); }
  const [broken] = await conn.execute(sql + ' ORDER BY id', params);
  console.log(`Fonds actifs avec categorie FundAfrica manquante: ${broken.length}`);
  if (broken.length === 0) { await conn.end(); return; }

  let fixed = 0, skipped = 0;
  const report = [];
  for (const f of broken) {
    // 2) Pairs : meme pays + meme categorie_national, categorie FundAfrica renseignee
    const [peers] = await conn.execute(
      `SELECT categorie_fundafrica_regionale, categorie_fundafrica_globale
       FROM fond_investissements
       WHERE active = 1 AND id <> ? AND LOWER(pays) = LOWER(?)
         AND categorie_national IS NOT NULL AND LOWER(categorie_national) = LOWER(?)`,
      [f.id, f.pays || '', f.categorie_national || '']
    );

    const updates = {};
    const notes = [];
    if (!f.categorie_fundafrica_regionale || !String(f.categorie_fundafrica_regionale).trim()) {
      const m = majority(peers.map(p => p.categorie_fundafrica_regionale));
      if (m.value) { updates.categorie_fundafrica_regionale = m.value; notes.push(`regionale="${m.value}" (${m.votes} pairs)`); }
      else notes.push(`regionale NON derivable (${m.reason})`);
    }
    if (!f.categorie_fundafrica_globale || !String(f.categorie_fundafrica_globale).trim()) {
      const m = majority(peers.map(p => p.categorie_fundafrica_globale));
      if (m.value) { updates.categorie_fundafrica_globale = m.value; notes.push(`globale="${m.value}" (${m.votes} pairs)`); }
      else notes.push(`globale NON derivable (${m.reason})`);
    }

    const line = `[${f.id}] ${f.nom_fond} (${f.pays} / ${f.categorie_national}) -> ${notes.join(' ; ')}`;
    report.push(line);
    console.log(line);

    if (Object.keys(updates).length === 0) { skipped++; continue; }

    if (opts.execute) {
      const setClause = Object.keys(updates).map(c => `${c} = ?`).join(', ');
      const vals = Object.values(updates);
      // Transaction par fond : la source (fond_investissements) et ses copies
      // (performences/_eurs/_usds) doivent rester coherentes. Un crash a mi-chemin
      // ne doit pas laisser la source corrigee et les copies inchangees.
      await conn.beginTransaction();
      try {
        await conn.execute(`UPDATE fond_investissements SET ${setClause} WHERE id = ?`, [...vals, f.id]);
        for (const table of ['performences', 'performences_eurs', 'performences_usds']) {
          await conn.execute(`UPDATE ${table} SET ${setClause} WHERE fond_id = ?`, [...vals, f.id]);
        }
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      }
    }
    fixed++;
  }

  console.log(`\n--- RAPPORT ---`);
  console.log(`Corriges${opts.execute ? '' : ' (simules)'}: ${fixed}`);
  console.log(`Ignores (non derivables): ${skipped}`);
  if (opts.execute && fixed > 0) {
    console.log(`\nIMPORTANT: relancer ensuite le recompute des classements`);
    console.log(`  node scripts/fix/trigger_classement_recompute.js   # EUR + USD (localhost)`);
    console.log(`  + GET http://localhost:${process.env.PORT || 3005}/api/classementmysql (local)`);
  }
  await conn.end();
}

run().catch((e) => { console.error('ERREUR FATALE:', e.message); process.exit(1); });
