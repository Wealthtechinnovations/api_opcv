/**
 * La devise DECLAREE des fonds Nigeria correspond-elle a ce que contient
 * reellement la colonne `value` ?
 *
 * POURQUOI CETTE MESURE
 * ---------------------
 * `value_EUR` et `value_USD` ne sont pas saisis : ils sont calcules a partir de
 * `value` et de la devise declaree du fonds (`fond_investissements.dev_libelle`).
 * Si l etiquette ment, la conversion ment — silencieusement, sans erreur, sans
 * ligne de log.
 *
 * Constat du 2026-08-31, apres le retour au naira de 75 VL : 27 fonds Nigeria
 * portent `dev_libelle = 'USD'`. Pour eux, le recalcul laisse `value_USD` egal a
 * `value` (rien a convertir, dit-il, c est deja des dollars). GUARANTY TRUST
 * DOLLAR FUND affiche donc 137 494 DOLLARS la ou la SEC a publie 137 494 NAIRAS
 * — un facteur 1 400 sur une fiche fonds, et dans tous les classements USD.
 *
 * L ordre de grandeur suffit pour la plupart : une VL de 163 262 n est pas un
 * prix en dollars. Il ne suffit PAS pour les fonds recents a VL proche de 1
 * (Radix Money Market a 1,00 ; Parthian Equity a 1,02) — 1 dollar et 1 naira se
 * ressemblent trop pour qu on tranche a l oeil. Conclure sur ceux-la par
 * analogie serait exactement l erreur que ce chantier paie depuis des mois.
 *
 * Alors on demande a la SOURCE. Le CSV de rejeu porte desormais les deux prix
 * cote a cote — `vl_price_ngn` et `vl_price_usd`. Pour chaque fonds, on compare
 * la serie en base a chacune des deux colonnes et on compte les correspondances
 * a 1 % pres. La colonne qui colle designe la devise reellement stockee.
 *
 * Un fonds dont aucune colonne ne colle, ou dont la serie n est pas couverte par
 * le rejeu, est declare INDETERMINE. C est un resultat, pas un echec : mieux
 * vaut nommer ce qu on ignore que le combler par ressemblance.
 *
 * LECTURE SEULE — uniquement des SELECT, aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_devise_declaree_nigeria.js [chemin_csv]
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { normalizeNameForMatch, lireCSV } = require('../../../src/lib/sec_csv');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const CSV = process.argv[2] || path.resolve(__dirname, '../../../sec_ng_replay.csv');

// 1 % : un arrondi d affichage passe, un facteur de change ne passe pas.
const TOLERANCE = 0.01;

const j = x => {
  if (!x) return '?';
  if (x instanceof Date) {
    const p = k => String(k).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  return String(x).slice(0, 10);
};

const proche = (a, b) => {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return false;
  return Math.max(a / b, b / a) - 1 <= TOLERANCE;
};

(async () => {
  if (!fs.existsSync(CSV)) {
    console.log(`\nCSV de rejeu introuvable : ${CSV}`);
    console.log('Lancer d abord le workflow « OPS — rejeu SEC etape 2 ».\n');
    return;
  }

  const conn = await mysql.createConnection(DB);
  try {
    console.log('\n=== DEVISE DECLAREE vs CONTENU REEL DE `value` — NIGERIA ===');
    console.log(`Mesure le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — LECTURE SEULE\n`);

    const { entetes, lignes } = lireCSV(CSV);
    for (const col of ['vl_price_ngn', 'vl_price_usd']) {
      if (!entetes.includes(col)) {
        console.log(`Le CSV ne porte pas la colonne \`${col}\` : il vient d une version`);
        console.log('anterieure de l extracteur. Relancer le rejeu avant de conclure.\n');
        return;
      }
    }

    const [fonds] = await conn.query(`
      SELECT id, nom_fond, dev_libelle, active
        FROM fond_investissements
       WHERE LOWER(pays) = 'nigeria'
    `);
    const parNom = new Map();
    for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);

    // La source, indexee par (fonds, date), avec ses deux prix.
    const source = new Map();
    for (const l of lignes) {
      const f = parNom.get(normalizeNameForMatch(l.fund_name_clean || ''));
      if (!f) continue;
      const date = j(l.valuation_date);
      if (date === '?') continue;
      source.set(`${f.id}|${date}`, {
        ngn: parseFloat(l.vl_price_ngn),
        usd: parseFloat(l.vl_price_usd),
      });
    }

    const [vls] = await conn.query(`
      SELECT v.fund_id, DATE_FORMAT(v.date, '%Y-%m-%d') AS date, v.value
        FROM valorisations v
        JOIN fond_investissements f ON f.id = v.fund_id
       WHERE LOWER(f.pays) = 'nigeria' AND v.value > 0
    `);

    // Par fonds : combien de VL collent au prix naira, au prix dollar, a aucun
    // des deux. `couvert` compte les VL que le rejeu atteint — une VL hors
    // fenetre ne prouve rien et ne doit peser dans aucun pourcentage.
    const parFonds = new Map();
    for (const v of vls) {
      if (!parFonds.has(v.fund_id)) parFonds.set(v.fund_id, { ngn: 0, usd: 0, ni: 0, couvert: 0, total: 0 });
      const b = parFonds.get(v.fund_id);
      b.total++;
      const s = source.get(`${v.fund_id}|${v.date}`);
      if (!s) continue;
      const val = Number(v.value);
      const cNgn = proche(val, s.ngn);
      const cUsd = proche(val, s.usd);
      if (!cNgn && !cUsd) { b.ni++; b.couvert++; continue; }
      if (cNgn) b.ngn++;
      if (cUsd) b.usd++;
      b.couvert++;
    }

    const verdicts = [];
    for (const f of fonds) {
      const b = parFonds.get(f.id);
      if (!b || !b.couvert) {
        verdicts.push({ ...f, verdict: 'INDETERMINE', motif: 'aucune VL couverte par le rejeu',
                        ngn: 0, usd: 0, couvert: 0, total: b ? b.total : 0 });
        continue;
      }
      // Seul le naira colle, seul le dollar colle, ou les deux (VL trop proches
      // de 1 pour que la comparaison discrimine — cas honnete a signaler).
      let verdict, motif;
      const pNgn = b.ngn / b.couvert;
      const pUsd = b.usd / b.couvert;
      if (pNgn >= 0.8 && pUsd < 0.8) { verdict = 'NGN'; motif = `${(pNgn * 100).toFixed(0)} % des VL collent au prix naira`; }
      else if (pUsd >= 0.8 && pNgn < 0.8) { verdict = 'USD'; motif = `${(pUsd * 100).toFixed(0)} % des VL collent au prix dollar`; }
      else if (pNgn >= 0.8 && pUsd >= 0.8) { verdict = 'INDETERMINE'; motif = 'les deux colonnes collent — VL trop proches pour trancher'; }
      else { verdict = 'INDETERMINE'; motif = `aucune colonne ne colle (naira ${(pNgn * 100).toFixed(0)} %, dollar ${(pUsd * 100).toFixed(0)} %)`; }
      verdicts.push({ ...f, verdict, motif, ngn: b.ngn, usd: b.usd, couvert: b.couvert, total: b.total });
    }

    // Ce qui compte : les DESACCORDS entre etiquette et contenu.
    const desaccords = verdicts.filter(v => v.verdict !== 'INDETERMINE' && v.verdict !== (v.dev_libelle || ''));
    const accords = verdicts.filter(v => v.verdict === (v.dev_libelle || ''));
    const indetermines = verdicts.filter(v => v.verdict === 'INDETERMINE');

    console.log(`Fonds Nigeria examines : ${verdicts.length}`);
    console.log(`  etiquette CONFORME au contenu : ${accords.length}`);
    console.log(`  etiquette EN DESACCORD        : ${desaccords.length}`);
    console.log(`  indetermines                  : ${indetermines.length}\n`);

    if (desaccords.length) {
      console.log('## Etiquette en desaccord avec le contenu de `value`\n');
      console.log(`  ${'fonds'.padStart(5)} ${'declare'.padEnd(8)} ${'reel'.padEnd(6)} ${'VL'.padStart(6)} ${'couv'.padStart(6)}  ${'act'.padEnd(4)} nom / motif`);
      console.log(`  ${'-'.repeat(5)} ${'-'.repeat(8)} ${'-'.repeat(6)} ${'-'.repeat(6)} ${'-'.repeat(6)}  ${'-'.repeat(4)} ---`);
      for (const v of desaccords.sort((a, b) => b.couvert - a.couvert)) {
        console.log(
          `  ${String(v.id).padStart(5)} ${String(v.dev_libelle || '(null)').padEnd(8)} ${v.verdict.padEnd(6)}` +
          ` ${String(v.total).padStart(6)} ${String(v.couvert).padStart(6)}  ${(v.active ? 'oui' : 'non').padEnd(4)} ${String(v.nom_fond).slice(0, 32)}`
        );
        console.log(`  ${' '.repeat(38)} ${v.motif}`);
      }
      console.log('');
    }

    if (indetermines.length) {
      // Les indetermines ne sont pas du bruit : ce sont precisement les fonds
      // qu il ne faut PAS basculer automatiquement.
      const avecVL = indetermines.filter(v => v.total > 0);
      console.log(`## Indetermines — a NE PAS basculer automatiquement (${avecVL.length} avec VL)\n`);
      console.log(`  ${'fonds'.padStart(5)} ${'declare'.padEnd(8)} ${'VL'.padStart(6)} ${'couv'.padStart(6)}  nom / motif`);
      console.log(`  ${'-'.repeat(5)} ${'-'.repeat(8)} ${'-'.repeat(6)} ${'-'.repeat(6)}  ---`);
      for (const v of avecVL.sort((a, b) => b.total - a.total).slice(0, 40)) {
        console.log(
          `  ${String(v.id).padStart(5)} ${String(v.dev_libelle || '(null)').padEnd(8)} ${String(v.total).padStart(6)} ${String(v.couvert).padStart(6)}  ${String(v.nom_fond).slice(0, 32)}`
        );
        console.log(`  ${' '.repeat(30)} ${v.motif}`);
      }
      if (avecVL.length > 40) console.log(`  ... et ${avecVL.length - 40} autre(s)`);
      console.log('');
    }

    // L enjeu chiffre : combien de VL sont aujourd hui converties a l envers.
    const aBasculer = desaccords.filter(v => v.dev_libelle === 'USD' && v.verdict === 'NGN');
    if (aBasculer.length) {
      const vlTouchees = aBasculer.reduce((s, v) => s + v.total, 0);
      console.log('## Consequence mesuree\n');
      console.log(`  ${aBasculer.length} fonds declares USD contiennent en fait du naira.`);
      console.log(`  ${vlTouchees} VL en tirent aujourd hui un \`value_USD\` faux d un facteur ~1 400,`);
      console.log('  ainsi que les performances et classements USD qui en decoulent.\n');
    }
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
