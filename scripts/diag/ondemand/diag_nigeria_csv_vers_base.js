/**
 * Pourquoi les VL nigerianes s arretent-elles au 2026-10-09 alors que le CSV est
 * regenere chaque lundi ?
 *
 * POURQUOI. `C4.NIGERIA` est en ECHEC le 2026-10-27 : derniere VL le 09/10, soit
 * 18 jours pour un budget de 14. C est la premiere des trois observations du
 * proprietaire. Or trois choses sont deja mesurees, et elles excluent les causes
 * les plus evidentes :
 *
 *   - le cron hebdomadaire TOURNE : journaux chaque lundi jusqu au 2026-10-26 ;
 *   - l extraction PRODUIT : sec_ng_latest.csv, 11,9 Mo, 9 085 lignes, regenere
 *     le 2026-10-26 a 10:00 ;
 *   - l indice NSE All Share est FRAIS : 2026-10-27, age 1 jour.
 *
 * Le defaut n est donc ni le cron, ni l extracteur, ni l import d indices. Il est
 * entre le CSV et la base.
 *
 * LES FILTRES REELS de `import_vl_nigeria_sec.js`, lus dans le code :
 *   date au format YYYY-MM-DD, `fund_name_clean` non vide,
 *   vl_price dans ]0,0001 ; 1 000 000], nav <= 5e12,
 *   puis INSERT IGNORE — une VL deja presente a cette date est CONSERVEE.
 *
 * QUATRE CAUSES POSSIBLES, et ce script les separe par des chiffres :
 *   (1) la source n a rien de plus recent — la SEC ne publie pas, et il n y a
 *       rien a importer. Le defaut serait alors chez la SEC, pas chez nous ;
 *   (2) la source a des dates recentes mais l importeur les REJETTE (bornes,
 *       champs manquants) — son propre bilan a l etape 2/8 le dit ;
 *   (3) les lignes recentes ne s apparient a aucun fonds nigerian connu, et
 *       l import cree des fonds au lieu de completer les series ;
 *   (4) les lignes sont ecrites mais ailleurs — autre fonds, autre date.
 *
 * LECTURE SEULE : SELECT, lecture du CSV et des journaux. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_nigeria_csv_vers_base.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const { normalizeNameForMatch, lireCSV } = require('../../../src/lib/sec_csv');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};
const CSV = path.resolve(__dirname, '../../../sec_ng_latest.csv');
const LOGDIR = '/var/log';

(async () => {
  console.log('=== NIGERIA : POURQUOI LE CSV N ARRIVE-T-IL PAS EN BASE ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  // ---- 1. Ce que dit la BASE ------------------------------------------
  const conn = await mysql.createConnection(DB);
  let maxBase = null;
  try {
    const [[m]] = await conn.query(`
      SELECT DATE_FORMAT(MAX(v.date), '%Y-%m-%d') AS d, COUNT(*) AS n
        FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
       WHERE LOWER(f.pays) = 'nigeria'`);
    maxBase = m.d;
    console.log(`## 1. LA BASE\n  ${m.n} VL nigerianes | derniere date : ${m.d}`);
    const [derns] = await conn.query(`
      SELECT DATE_FORMAT(v.date, '%Y-%m-%d') AS d, COUNT(*) AS n
        FROM valorisations v JOIN fond_investissements f ON f.id = v.fund_id
       WHERE LOWER(f.pays) = 'nigeria'
       GROUP BY v.date ORDER BY v.date DESC LIMIT 8`);
    console.log('  dernieres dates : ' + derns.map(r => `${r.d} (${r.n})`).join(', '));
    const [[act]] = await conn.query(`
      SELECT SUM(active = 1) AS actifs, SUM(active <> 1) AS inactifs
        FROM fond_investissements WHERE LOWER(pays) = 'nigeria'`);
    console.log(`  fonds nigerians : ${act.actifs} actifs, ${act.inactifs} inactifs`);

    // ---- 2. Ce que dit le CSV -----------------------------------------
    if (!fs.existsSync(CSV)) {
      console.log(`\n## 2. LE CSV\n  ECHEC : ${CSV} introuvable. L extraction n a rien depose.`);
      process.exitCode = 2;
      return;
    }
    const st = fs.statSync(CSV);
    const { entetes, lignes } = lireCSV(CSV);
    console.log(`\n## 2. LE CSV\n  ${CSV}`);
    console.log(`  ${(st.size / 1e6).toFixed(1)} Mo, modifie le ${st.mtime.toISOString().slice(0, 16).replace('T', ' ')}`);
    console.log(`  ${lignes.length} lignes | colonnes : ${entetes.slice(0, 10).join(', ')}${entetes.length > 10 ? ' …' : ''}`);
    const dates = [...new Set(lignes.map(l => String(l.valuation_date || '').slice(0, 10)).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
    console.log(`  ${dates.length} dates valides | de ${dates[0]} a ${dates[dates.length - 1]}`);
    console.log(`  8 plus recentes : ${dates.slice(-8).join(', ')}`);

    // ---- 3. CAUSE (1) : la source a-t-elle du neuf ? -------------------
    const neuves = lignes.filter(l => String(l.valuation_date || '').slice(0, 10) > maxBase
      && /^\d{4}-\d{2}-\d{2}$/.test(String(l.valuation_date || '').slice(0, 10)));
    console.log(`\n## 3. CAUSE (1) — la source a-t-elle des dates POSTERIEURES a ${maxBase} ?`);
    console.log(`  ${neuves.length} ligne(s) du CSV portent une date > ${maxBase}`);
    if (!neuves.length) {
      console.log('  → CAUSE (1) CONFIRMEE : il n y a RIEN de plus recent a importer.');
      console.log('    Le defaut est en amont, chez la SEC ou dans l extraction, pas dans');
      console.log('    l import. `C4.NIGERIA` mesure alors la fraicheur de la SOURCE, et le');
      console.log('    budget de 14 jours est peut-etre simplement inadapte a sa cadence.');
      const parMois = {};
      for (const d of dates) parMois[d.slice(0, 7)] = (parMois[d.slice(0, 7)] || 0) + 1;
      const derniers = Object.entries(parMois).sort().slice(-6);
      console.log('    cadence recente du CSV (dates par mois) : '
        + derniers.map(([m, n]) => `${m}:${n}`).join(', '));
      return;
    }
    console.log(`  dates concernees : ${[...new Set(neuves.map(l => String(l.valuation_date).slice(0, 10)))].sort().join(', ')}`);

    // ---- 4. CAUSE (2) : l importeur les rejetterait-il ? ---------------
    const VL_MIN = 0.0001, VL_MAX = 1000000, NAV_MAX = 5e12;
    let okBornes = 0, horsBornes = 0, champsManquants = 0;
    for (const r of neuves) {
      if (!r.fund_name_clean) { champsManquants++; continue; }
      const vl = parseFloat(r.vl_price);
      const nav = parseFloat(r.nav_value) || parseFloat(r.nav_ngn) || 0;
      if (!vl || vl <= VL_MIN || vl > VL_MAX || nav > NAV_MAX) { horsBornes++; continue; }
      okBornes++;
    }
    console.log(`\n## 4. CAUSE (2) — les filtres de l importeur`);
    console.log(`  ${okBornes} passeraient | ${horsBornes} hors bornes | ${champsManquants} sans nom`);

    // ---- 5. CAUSE (3) : s apparient-elles a un fonds connu ? ----------
    const [fonds] = await conn.query(
      "SELECT id, nom_fond, active FROM fond_investissements WHERE LOWER(pays) = 'nigeria'");
    const parNom = new Map();
    for (const f of fonds) parNom.set(normalizeNameForMatch(f.nom_fond), f);
    let apparies = 0; const orphelins = new Map();
    for (const r of neuves) {
      const f = parNom.get(r.fund_name_key || normalizeNameForMatch(r.fund_name_clean || ''));
      if (f) apparies++;
      else { const k = r.fund_name_clean || '(vide)'; orphelins.set(k, (orphelins.get(k) || 0) + 1); }
    }
    console.log(`\n## 5. CAUSE (3) — appariement par nom`);
    console.log(`  ${apparies}/${neuves.length} apparient un fonds nigerian existant`);
    if (orphelins.size) {
      console.log(`  ${orphelins.size} nom(s) inconnu(s) — l import CREERAIT un fonds :`);
      for (const [n, c] of [...orphelins].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
        console.log(`    ${String(n).slice(0, 48).padEnd(50)} ${c}`);
      }
    }

    // ---- 6. CAUSE (4) : sont-elles deja en base ailleurs ? ------------
    const paires = neuves.slice(0, 400).map(r => {
      const f = parNom.get(r.fund_name_key || normalizeNameForMatch(r.fund_name_clean || ''));
      return f ? [f.id, String(r.valuation_date).slice(0, 10)] : null;
    }).filter(Boolean);
    let dejaLa = 0;
    for (const [id, d] of paires) {
      const [[c]] = await conn.query(
        'SELECT COUNT(*) AS n FROM valorisations WHERE fund_id = ? AND date = ?', [id, d]);
      if (Number(c.n) > 0) dejaLa++;
    }
    console.log(`\n## 6. CAUSE (4) — ces (fonds, date) sont-ils deja en base ?`);
    console.log(`  ${dejaLa}/${paires.length} paires testees existent deja (INSERT IGNORE les garderait)`);
  } finally {
    await conn.end();
  }

  // ---- 7. Le bilan que l importeur a lui-meme imprime ---------------
  console.log('\n## 7. CE QUE L IMPORTEUR A DIT A SA DERNIERE EXECUTION');
  try {
    const logs = fs.readdirSync(LOGDIR).filter(f => /^africafunds_nigeria_\d{8}\.log$/.test(f)).sort();
    const dernier = logs[logs.length - 1];
    if (!dernier) { console.log('  aucun journal africafunds_nigeria_*.log'); }
    else {
      const txt = fs.readFileSync(path.join(LOGDIR, dernier), 'utf8').split(/\r?\n/);
      const i = txt.findIndex(l => /\[2\/8\]/.test(l));
      console.log(`  ${dernier}`);
      if (i < 0) console.log('  etape [2/8] absente du journal');
      else for (const l of txt.slice(i, i + 22)) if (l.trim()) console.log(`  | ${l}`);
    }
  } catch (e) { console.log(`  journaux illisibles : ${e.message}`); }

  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
