/**
 * Audit des anomalies VL pour TOUS les pays
 *
 * Detecte les VL avec variation > SEUIL% entre 2 VL consecutives
 * separees de maximum 7 jours.
 *
 * Regle: entre 2 VL ayant au maximum 7 jours d'intervalle,
 * la variation ne peut exceder +/-15%.
 *
 * Modes:
 *   --report  (defaut) : affiche les anomalies sans rien modifier
 *   --flag             : marque les VL anomales (champ anomalie=1)
 *   --delete           : supprime les VL anomales
 *
 * Usage:
 *   node audit_vl_anomalies.js                    # rapport seulement
 *   node audit_vl_anomalies.js --report           # rapport seulement
 *   node audit_vl_anomalies.js --flag             # marquer les anomalies
 *   node audit_vl_anomalies.js --delete            # supprimer les anomalies
 *   node audit_vl_anomalies.js --pays Nigeria      # un seul pays
 *   node audit_vl_anomalies.js --seuil 10          # seuil 10% au lieu de 15%
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const MAX_DAYS_BETWEEN = 7;
const DEFAULT_SEUIL = 15;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { mode: 'report', pays: null, seuil: DEFAULT_SEUIL };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--report') opts.mode = 'report';
    else if (args[i] === '--flag') opts.mode = 'flag';
    else if (args[i] === '--delete') opts.mode = 'delete';
    else if (args[i] === '--pays' && args[i + 1]) { opts.pays = args[++i]; }
    else if (args[i] === '--seuil' && args[i + 1]) { opts.seuil = parseFloat(args[++i]); }
  }
  return opts;
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`Connecté à la base fund_opcvm`);
  console.log(`Mode: ${opts.mode} | Seuil: ${opts.seuil}% | Max jours entre VL: ${MAX_DAYS_BETWEEN}`);
  if (opts.pays) console.log(`Pays: ${opts.pays}`);

  // Récupérer les fonds à analyser
  let fondQuery = `SELECT id, nom_fond, pays, dev_libelle FROM fond_investissements WHERE active = 1`;
  const fondParams = [];
  if (opts.pays) {
    fondQuery += ` AND LOWER(pays) = LOWER(?)`;
    fondParams.push(opts.pays);
  }
  fondQuery += ` ORDER BY pays, nom_fond`;

  const [fonds] = await conn.execute(fondQuery, fondParams);
  console.log(`\n${fonds.length} fonds actifs à analyser\n`);

  const anomaliesByPays = {};
  const anomaliesDetail = [];
  let totalVL = 0;
  let totalAnomalies = 0;
  let totalFondsWithAnomalies = 0;

  for (let fi = 0; fi < fonds.length; fi++) {
    const fond = fonds[fi];

    // Récupérer toutes les VL triées par date
    const [vls] = await conn.execute(
      `SELECT id, date, value, actif_net FROM valorisations WHERE fund_id = ? AND value > 0 ORDER BY date ASC`,
      [fond.id]
    );

    if (vls.length < 2) continue;
    totalVL += vls.length;

    let fondAnomalies = 0;

    for (let i = 1; i < vls.length; i++) {
      const prev = vls[i - 1];
      const curr = vls[i];

      const prevDate = new Date(prev.date);
      const currDate = new Date(curr.date);
      const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      // Ne vérifier que les VL séparées de max MAX_DAYS_BETWEEN jours
      if (daysDiff > MAX_DAYS_BETWEEN || daysDiff <= 0) continue;

      const prevVal = Number(prev.value);
      const currVal = Number(curr.value);

      if (prevVal === 0) continue;

      const variation = ((currVal - prevVal) / prevVal) * 100;

      if (Math.abs(variation) > opts.seuil) {
        fondAnomalies++;
        totalAnomalies++;

        const pays = fond.pays || 'INCONNU';
        if (!anomaliesByPays[pays]) anomaliesByPays[pays] = { count: 0, fonds: new Set() };
        anomaliesByPays[pays].count++;
        anomaliesByPays[pays].fonds.add(fond.nom_fond);

        anomaliesDetail.push({
          vlId: curr.id,
          fundId: fond.id,
          fundName: fond.nom_fond,
          pays: pays,
          prevDate: String(prev.date).slice(0, 10),
          currDate: String(curr.date).slice(0, 10),
          prevValue: prevVal,
          currValue: currVal,
          variation: variation,
          daysDiff: daysDiff,
        });
      }
    }

    if (fondAnomalies > 0) totalFondsWithAnomalies++;

    if ((fi + 1) % 200 === 0) {
      console.log(`  [${fi + 1}/${fonds.length}] ${fond.nom_fond}: ${fondAnomalies} anomalies`);
    }
  }

  // Rapport
  console.log('\n==========================================');
  console.log('=== RAPPORT AUDIT ANOMALIES VL ===');
  console.log('==========================================');
  console.log(`Fonds analysés:          ${fonds.length}`);
  console.log(`VL analysées:            ${totalVL}`);
  console.log(`Anomalies détectées:     ${totalAnomalies}`);
  console.log(`Fonds avec anomalies:    ${totalFondsWithAnomalies}`);
  console.log(`Seuil appliqué:          ${opts.seuil}%`);
  console.log(`Intervalle max:          ${MAX_DAYS_BETWEEN} jours`);

  console.log('\n=== PAR PAYS ===');
  for (const [pays, data] of Object.entries(anomaliesByPays).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${pays}: ${data.count} anomalies dans ${data.fonds.size} fonds`);
  }

  // Top anomalies
  const sorted = anomaliesDetail.sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation));
  console.log(`\n=== TOP 50 ANOMALIES (par variation) ===`);
  for (const a of sorted.slice(0, 50)) {
    console.log(`  [${a.pays}] ${a.fundName.substring(0, 45).padEnd(45)} | ${a.prevDate}->${a.currDate} (${a.daysDiff}j) | ${a.prevValue.toFixed(4)} -> ${a.currValue.toFixed(4)} | var=${a.variation > 0 ? '+' : ''}${a.variation.toFixed(2)}%`);
  }

  // Actions selon le mode
  if (opts.mode === 'flag' && totalAnomalies > 0) {
    console.log(`\n=== MARQUAGE DES ${totalAnomalies} VL ANOMALES ===`);
    let flagged = 0;
    for (const a of anomaliesDetail) {
      await conn.execute(
        `UPDATE valorisations SET anomalie = 1 WHERE id = ?`,
        [a.vlId]
      );
      flagged++;
    }
    console.log(`${flagged} VL marquées avec anomalie=1`);
  }

  if (opts.mode === 'delete' && totalAnomalies > 0) {
    console.log(`\n=== SUPPRESSION DES ${totalAnomalies} VL ANOMALES ===`);
    let deleted = 0;
    for (const a of anomaliesDetail) {
      await conn.execute(`DELETE FROM valorisations WHERE id = ?`, [a.vlId]);
      deleted++;
    }
    console.log(`${deleted} VL supprimées`);
  }

  // Export CSV
  if (anomaliesDetail.length > 0) {
    const csvPath = 'audit_vl_anomalies_report.csv';
    const csvHeader = 'pays,fund_id,fund_name,prev_date,curr_date,days_diff,prev_value,curr_value,variation_pct,vl_id';
    const csvLines = anomaliesDetail.map(a =>
      `"${a.pays}",${a.fundId},"${a.fundName}","${a.prevDate}","${a.currDate}",${a.daysDiff},${a.prevValue},${a.currValue},${a.variation.toFixed(4)},${a.vlId}`
    );
    require('fs').writeFileSync(csvPath, csvHeader + '\n' + csvLines.join('\n'));
    console.log(`\nRapport CSV exporté: ${csvPath}`);
  }

  await conn.end();
  console.log('\nConnexion fermée');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
