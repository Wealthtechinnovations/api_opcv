/**
 * Nettoyage iteratif des pics VL incoherents pour TOUS les pays.
 *
 * Algorithme: pour chaque fond, trier les VL par date ASC, puis pour
 * chaque entree verifier l ecart avec le predecesseur ET le successeur.
 * Si l ecart depasse +/-SEUIL% avec les DEUX voisins, c est un pic
 * (spike) et la VL est supprimee. Le processus est repete jusqu a
 * convergence (0 nouveau pic detecte dans un pass).
 *
 * Tables modifiees: valorisations (DELETE des pics)
 *
 * Modes:
 *   --report  (defaut) : affiche les pics sans rien modifier
 *   --delete           : supprime les pics
 *
 * Options:
 *   --pays NIGERIA     : un seul pays
 *   --seuil 15         : seuil en % (defaut 15)
 *   --maxpass 10       : nombre max de passes (defaut 10)
 *   --fond 1141        : un seul fond (par ID)
 *
 * Usage:
 *   node fix_vl_spikes.js                          # rapport
 *   node fix_vl_spikes.js --delete                 # supprimer
 *   node fix_vl_spikes.js --delete --pays NIGERIA  # un pays
 *   node fix_vl_spikes.js --delete --seuil 10      # seuil 10%
 */

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
  const args = process.argv.slice(2);
  const opts = { mode: 'report', pays: null, seuil: 15, maxpass: 10, fondId: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--report') opts.mode = 'report';
    else if (args[i] === '--delete') opts.mode = 'delete';
    else if (args[i] === '--pays' && args[i + 1]) opts.pays = args[++i];
    else if (args[i] === '--seuil' && args[i + 1]) opts.seuil = parseFloat(args[++i]);
    else if (args[i] === '--maxpass' && args[i + 1]) opts.maxpass = parseInt(args[++i]);
    else if (args[i] === '--fond' && args[i + 1]) opts.fondId = parseInt(args[++i]);
  }
  return opts;
}

function pctChange(a, b) {
  if (a === 0) return Infinity;
  return ((b - a) / Math.abs(a)) * 100;
}

function detectSpikes(vls, seuil) {
  if (vls.length < 3) return [];
  const spikes = [];
  for (let i = 1; i < vls.length - 1; i++) {
    const prev = vls[i - 1];
    const curr = vls[i];
    const next = vls[i + 1];

    const prevVal = Number(prev.value);
    const currVal = Number(curr.value);
    const nextVal = Number(next.value);

    if (prevVal <= 0 || currVal <= 0 || nextVal <= 0) continue;

    const changeToPrev = Math.abs(pctChange(prevVal, currVal));
    const changeToNext = Math.abs(pctChange(nextVal, currVal));

    if (changeToPrev > seuil && changeToNext > seuil) {
      spikes.push({
        vlId: curr.id,
        date: String(curr.date).slice(0, 10),
        value: currVal,
        prevValue: prevVal,
        nextValue: nextVal,
        prevDate: String(prev.date).slice(0, 10),
        nextDate: String(next.date).slice(0, 10),
        changeToPrev,
        changeToNext,
      });
    }
  }

  // Edge cases: first and last entries
  // First: if it deviates >seuil from the next AND the value after next is close to next
  if (vls.length >= 3) {
    const first = vls[0];
    const second = vls[1];
    const third = vls[2];
    const fv = Number(first.value);
    const sv = Number(second.value);
    const tv = Number(third.value);
    if (fv > 0 && sv > 0 && tv > 0) {
      const changeToSecond = Math.abs(pctChange(sv, fv));
      const secondToThird = Math.abs(pctChange(sv, tv));
      if (changeToSecond > seuil && secondToThird < seuil) {
        spikes.push({
          vlId: first.id,
          date: String(first.date).slice(0, 10),
          value: fv,
          prevValue: null,
          nextValue: sv,
          prevDate: null,
          nextDate: String(second.date).slice(0, 10),
          changeToPrev: null,
          changeToNext: changeToSecond,
        });
      }
    }

    const last = vls[vls.length - 1];
    const secondLast = vls[vls.length - 2];
    const thirdLast = vls[vls.length - 3];
    const lv = Number(last.value);
    const slv = Number(secondLast.value);
    const tlv = Number(thirdLast.value);
    if (lv > 0 && slv > 0 && tlv > 0) {
      const changeToSecondLast = Math.abs(pctChange(slv, lv));
      const thirdToSecondLast = Math.abs(pctChange(tlv, slv));
      if (changeToSecondLast > seuil && thirdToSecondLast < seuil) {
        spikes.push({
          vlId: last.id,
          date: String(last.date).slice(0, 10),
          value: lv,
          prevValue: slv,
          nextValue: null,
          prevDate: String(secondLast.date).slice(0, 10),
          nextDate: null,
          changeToPrev: changeToSecondLast,
          changeToNext: null,
        });
      }
    }
  }

  // Deduplicate by vlId
  const seen = new Set();
  return spikes.filter(s => {
    if (seen.has(s.vlId)) return false;
    seen.add(s.vlId);
    return true;
  });
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');
  console.log(`Mode: ${opts.mode} | Seuil: ${opts.seuil}% | Max passes: ${opts.maxpass}`);
  if (opts.pays) console.log(`Pays: ${opts.pays}`);
  if (opts.fondId) console.log(`Fond ID: ${opts.fondId}`);

  let fondQuery = 'SELECT id, nom_fond, pays, dev_libelle FROM fond_investissements WHERE active = 1';
  const fondParams = [];
  if (opts.fondId) {
    fondQuery += ' AND id = ?';
    fondParams.push(opts.fondId);
  } else if (opts.pays) {
    fondQuery += ' AND LOWER(pays) = LOWER(?)';
    fondParams.push(opts.pays);
  }
  fondQuery += ' ORDER BY pays, nom_fond';

  const [fonds] = await conn.execute(fondQuery, fondParams);
  console.log(`${fonds.length} fonds actifs a analyser\n`);

  let grandTotalDeleted = 0;
  const allSpikesDetail = [];
  const spikesByPays = {};
  const fondsSpiked = new Set();

  for (let pass = 1; pass <= opts.maxpass; pass++) {
    console.log(`\n========== PASS ${pass} ==========`);
    let passSpikes = 0;
    let passDeleted = 0;

    for (const fond of fonds) {
      const [vls] = await conn.execute(
        'SELECT id, date, value, actif_net FROM valorisations WHERE fund_id = ? AND value > 0 ORDER BY date ASC',
        [fond.id]
      );

      if (vls.length < 3) continue;

      const spikes = detectSpikes(vls, opts.seuil);

      if (spikes.length === 0) continue;

      passSpikes += spikes.length;
      fondsSpiked.add(fond.id);

      const pays = fond.pays || 'INCONNU';
      if (!spikesByPays[pays]) spikesByPays[pays] = { count: 0, fonds: new Set() };
      spikesByPays[pays].count += spikes.length;
      spikesByPays[pays].fonds.add(fond.nom_fond);

      for (const spike of spikes) {
        allSpikesDetail.push({
          ...spike,
          fundId: fond.id,
          fundName: fond.nom_fond,
          pays,
          pass,
        });

        if (opts.mode === 'delete') {
          await conn.execute('DELETE FROM valorisations WHERE id = ?', [spike.vlId]);
          passDeleted++;
        }
      }

      if (spikes.length > 3) {
        console.log(`  [Pass ${pass}] ${fond.nom_fond} (${pays}): ${spikes.length} pics detectes`);
      }
    }

    console.log(`Pass ${pass}: ${passSpikes} pics detectes, ${passDeleted} supprimes`);
    grandTotalDeleted += passDeleted;

    if (passSpikes === 0) {
      console.log('Convergence atteinte — aucun nouveau pic.');
      break;
    }

    if (opts.mode !== 'delete') {
      console.log('Mode report — arret apres pass 1 (utilisez --delete pour iterer)');
      break;
    }
  }

  // Rapport final
  console.log('\n==========================================');
  console.log('=== RAPPORT NETTOYAGE PICS VL ===');
  console.log('==========================================');
  console.log(`Fonds analyses:           ${fonds.length}`);
  console.log(`Fonds avec pics:          ${fondsSpiked.size}`);
  console.log(`Total pics detectes:      ${allSpikesDetail.length}`);
  console.log(`Total VL supprimees:      ${grandTotalDeleted}`);
  console.log(`Seuil applique:           ${opts.seuil}%`);

  console.log('\n=== PAR PAYS ===');
  for (const [pays, data] of Object.entries(spikesByPays).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${pays}: ${data.count} pics dans ${data.fonds.size} fonds`);
  }

  // Top 50 anomalies
  const sorted = allSpikesDetail.sort((a, b) => {
    const aMax = Math.max(a.changeToPrev || 0, a.changeToNext || 0);
    const bMax = Math.max(b.changeToPrev || 0, b.changeToNext || 0);
    return bMax - aMax;
  });
  console.log(`\n=== TOP 50 PICS (par ecart max) ===`);
  for (const s of sorted.slice(0, 50)) {
    const prevStr = s.prevValue !== null ? s.prevValue.toFixed(4) : 'debut';
    const nextStr = s.nextValue !== null ? s.nextValue.toFixed(4) : 'fin';
    const cpStr = s.changeToPrev !== null ? `${s.changeToPrev.toFixed(1)}%` : '-';
    const cnStr = s.changeToNext !== null ? `${s.changeToNext.toFixed(1)}%` : '-';
    console.log(`  [P${s.pass}][${s.pays}] ${s.fundName.substring(0, 40).padEnd(40)} | ${s.date} val=${s.value.toFixed(4)} | prev=${prevStr} (${cpStr}) next=${nextStr} (${cnStr})`);
  }

  // Exemples de fonds les plus touches
  const fondCounts = {};
  for (const s of allSpikesDetail) {
    const key = `${s.fundId}|${s.fundName}|${s.pays}`;
    fondCounts[key] = (fondCounts[key] || 0) + 1;
  }
  const topFonds = Object.entries(fondCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log('\n=== TOP 20 FONDS LES PLUS TOUCHES ===');
  for (const [key, count] of topFonds) {
    const [id, name, pays] = key.split('|');
    console.log(`  ${name.substring(0, 45).padEnd(45)} [${pays}] id=${id}: ${count} pics`);
  }

  if (opts.mode === 'delete' && grandTotalDeleted > 0) {
    console.log(`\n=== ACTIONS POST-NETTOYAGE REQUISES ===`);
    console.log('1. Recalculer VL ajustees:  node recalc_vl_ajuste.js');
    console.log('2. Recalculer performances: curl "http://localhost:3005/api/saveperfdatemysql/1/3000"');
    console.log('3. Recalculer perf EUR:     curl "http://localhost:3005/api/saveperfdateeur/1/3000"');
    console.log('4. Recalculer perf USD:     curl "http://localhost:3005/api/saveperfdateusd/1/3000"');
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
