/**
 * Le dernier chiffre manquant : que vaut `vl_price_ngn` aux dates suspectes,
 * et le rapport du correctif y franchit-il 100 ?
 *
 * POURQUOI. Deux hypotheses sont tombees, dans cet ordre, et chacune a coute une
 * mesure :
 *   (a) « les dates de 1141 sont absentes de la source » — FAUX. 5/5 des dates
 *       suspectes ont un prix publie (mesure du 2026-10-27 19:51 UTC) ;
 *   (b) « l appariement par nom echoue » — FAUX aussi : 40 740/41 626 lignes du
 *       CSV apparient un fonds nigerian actif, et le nom normalise de 1141,
 *       "AFRINVEST DOLLAR FUND", est bien dans le jeu de cles.
 *
 * Reste exactement trois facons d echapper au correctif, et toutes trois sont
 * dans son perimetre declare, pas dans la source :
 *   (c) `active <> 1` — le correctif ne lit que les fonds actifs ;
 *   (d) `vl_price_ngn` VIDE ou non numerique a ces dates. Pour un fonds dollar,
 *       la SEC peut ne rien publier dans la colonne naira : `parseFloat('')`
 *       rend NaN, `naira.set` stocke NaN, et `NaN >= 100` est faux. La ligne
 *       est alors silencieusement ignoree — aucun message ne le dit ;
 *   (e) le rapport est reellement < 100.
 *
 * Ce script imprime, pour chaque date suspecte, les trois nombres qui tranchent :
 * la valeur en base, la cellule `vl_price_ngn` TELLE QUELLE, et le rapport que
 * le correctif calculerait. Plus d hypothese a formuler ensuite.
 *
 * ENJEU DE FOND, a ne pas perdre de vue : si ces fonds sont de VRAIS fonds
 * dollar, alors ce sont les valeurs a ~185 000 qui sont fausses, pas celles a
 * ~114 — et le correctif naira les pousserait dans le MAUVAIS sens. Le rapport
 * 1 441 entre les deux echelles est l ordre de grandeur du taux USD/NGN. Le
 * script imprime donc aussi la devise declaree et la repartition des echelles,
 * pour que la question du SENS de la correction soit posee avant l ecriture.
 *
 * LECTURE SEULE : SELECT et lecture du CSV. Aucune ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_1141_rapport_naira_calcul.js
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
const CSV = path.resolve(__dirname, '../../../sec_ng_replay.csv');
const SUSPECTS = [1141, 1196, 2743];
const RAPPORT_DEVISE = 100;   // le seuil du correctif, repris tel quel

const j = d => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

(async () => {
  console.log('=== LE RAPPORT DU CORRECTIF, CALCULE DATE PAR DATE ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  if (!fs.existsSync(CSV)) { console.log(`ECHEC : ${CSV} introuvable.`); process.exitCode = 2; return; }
  const { entetes, lignes } = lireCSV(CSV);
  const colNgn = entetes.includes('vl_price_ngn');
  console.log(`Source : ${lignes.length} lignes | colonne vl_price_ngn : ${colNgn ? 'presente' : 'ABSENTE'}`);
  if (!colNgn) { console.log('→ sans cette colonne le correctif refuse de tourner. Rien d autre a dire.'); return; }

  const conn = await mysql.createConnection(DB);
  try {
    for (const id of SUSPECTS) {
      const [[f]] = await conn.query(
        'SELECT id, nom_fond, active, dev_libelle, pays FROM fond_investissements WHERE id = ?', [id]);
      if (!f) { console.log(`\n## FONDS ${id} — INTROUVABLE`); continue; }
      const nom = normalizeNameForMatch(f.nom_fond);
      console.log(`\n## FONDS ${id} — ${f.nom_fond}`);
      console.log(`  active = ${f.active} | devise declaree = ${f.dev_libelle || '(vide)'} | pays = ${f.pays}`);
      if (Number(f.active) !== 1) {
        console.log('  → CAUSE (c) : le correctif ne lit que `active = 1`. Ce fonds est HORS de son');
        console.log('    perimetre, quelles que soient les valeurs. Rien a chercher du cote du CSV.');
      }

      // cellules brutes du CSV, par date
      const cellules = new Map();
      for (const l of lignes) {
        if (normalizeNameForMatch(l.fund_name_clean || '') !== nom) continue;
        cellules.set(j(l.valuation_date), { ngn: l.vl_price_ngn, px: l.vl_price, usd: l.vl_price_usd });
      }

      // repartition des echelles en base — la correction a-t-elle le bon sens ?
      const [[ech]] = await conn.query(`
        SELECT COUNT(*) AS n, MAX(value) AS mx, MIN(value) AS mn,
               SUM(value < MAX_V / 100) AS petites
          FROM valorisations,
               (SELECT MAX(value) AS MAX_V FROM valorisations WHERE fund_id = ? AND value > 0) t
         WHERE fund_id = ? AND value > 0`, [id, id]);
      console.log(`  en base : ${ech.n} VL | min ${Number(ech.mn)} | max ${Number(ech.mx)}`
        + ` | ${ech.petites} au moins 100x sous le max`);
      const part = ech.n ? (Number(ech.petites) / Number(ech.n) * 100) : 0;
      console.log(`  → l echelle MINORITAIRE represente ${part.toFixed(1)} % des VL`
        + `${part < 50 ? ' — ce sont elles que le correctif voudrait remonter' : ' — ATTENTION : la majorite'}`);

      // le calcul du correctif, date par date
      const [suspectes] = await conn.query(`
        SELECT v.id, DATE_FORMAT(v.date, '%Y-%m-%d') AS d, v.value, v.currency_code
          FROM valorisations v
         WHERE v.fund_id = ? AND v.value > 0
           AND v.value < (SELECT MAX(value) / 100 FROM valorisations WHERE fund_id = ? AND value > 0)
         ORDER BY v.date DESC LIMIT 12`, [id, id]);
      if (!suspectes.length) { console.log('  aucune VL suspecte : rien a corriger pour ce fonds.'); continue; }
      console.log(`\n  ${'date'.padEnd(11)}${'en base'.padStart(13)}${'vl_price_ngn'.padStart(16)}`
        + `${'rapport'.padStart(10)}  verdict du correctif`);
      console.log('  ' + '-'.repeat(76));
      let bloquees = { vide: 0, sousSeuil: 0, passe: 0, horsDate: 0 };
      for (const v of suspectes) {
        const c = cellules.get(v.d);
        if (!c) { bloquees.horsDate++; console.log(`  ${v.d.padEnd(11)}${Number(v.value).toFixed(4).padStart(13)}`
          + `${'(date absente)'.padStart(16)}${'—'.padStart(10)}  IGNOREE : pas de ligne source`); continue; }
        const brut = c.ngn === undefined || c.ngn === null || String(c.ngn).trim() === '' ? '' : String(c.ngn).trim();
        const p = parseFloat(brut);
        if (!Number.isFinite(p)) {
          bloquees.vide++;
          console.log(`  ${v.d.padEnd(11)}${Number(v.value).toFixed(4).padStart(13)}`
            + `${(brut === '' ? '(vide)' : brut.slice(0, 14)).padStart(16)}${'NaN'.padStart(10)}`
            + `  CAUSE (d) : NaN >= 100 est faux, ligne ignoree sans message`);
          continue;
        }
        const rapport = p / Number(v.value);
        const ok = rapport >= RAPPORT_DEVISE;
        if (ok) bloquees.passe++; else bloquees.sousSeuil++;
        console.log(`  ${v.d.padEnd(11)}${Number(v.value).toFixed(4).padStart(13)}${p.toFixed(4).padStart(16)}`
          + `${rapport.toFixed(1).padStart(10)}  ${ok ? 'CORRIGEE' : `CAUSE (e) : rapport < ${RAPPORT_DEVISE}`}`);
      }
      console.log(`\n  bilan : ${bloquees.passe} corrigees | ${bloquees.vide} bloquees par un vl_price_ngn vide`
        + ` | ${bloquees.sousSeuil} sous le seuil | ${bloquees.horsDate} sans ligne source`);
      if (bloquees.vide) {
        console.log('  → Pour un fonds dollar, la SEC ne remplit pas la colonne naira. Le correctif');
        console.log('    ne peut rien faire ici, et son silence est le vrai defaut a corriger :');
        console.log('    une ligne ignoree pour cause de prix non numerique doit etre COMPTEE.');
      }
      if (String(f.dev_libelle || '').toUpperCase() === 'USD' || /DOLLAR|EUROBOND/i.test(f.nom_fond)) {
        console.log('  → SENS DE LA CORRECTION A ARBITRER : nom ou devise de fonds en dollars.');
        console.log('    Si les VL a la petite echelle sont les JUSTES, remonter en naira les');
        console.log('    aggraverait. Ne rien ecrire avant que ce point soit tranche.');
      }
    }
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
