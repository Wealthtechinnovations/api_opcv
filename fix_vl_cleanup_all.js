/**
 * Nettoyage complet des VL anormales pour TOUS les fonds.
 *
 * Combine 3 types de detection:
 *
 * 1. DOUBLONS DE DATE: plusieurs VL pour la meme date sur un meme fond.
 *    On garde celle dont la valeur est la plus proche de la mediane des
 *    voisins (entree precedente + entree suivante par date).
 *
 * 2. PICS BIDIRECTIONNELS (iteratif): une VL est un pic si elle devie
 *    de plus de SEUIL% par rapport a SES DEUX VOISINS (precedent ET
 *    suivant). Supprime les pics et re-scanne jusqu'a convergence.
 *    C'est la meme logique que l'endpoint /api/getallfondsvlanomalie
 *    mais etendue a TOUTES les VL (pas seulement les 60 dernieres)
 *    et avec verification bidirectionnelle (pas juste predecesseur).
 *
 * 3. ERREURS DE SAISIE: VL qui chute de >90% puis remonte >900%
 *    (ex: AFRINVEST DOLLAR FUND avec VL=114.52 au lieu de 165,000).
 *
 * Modes:
 *   --report  (defaut) : affiche les anomalies sans modifier
 *   --delete           : supprime les VL anormales
 *
 * Options:
 *   --pays NIGERIA     : un seul pays
 *   --fond 1141        : un seul fond (par ID)
 *   --seuil 15         : seuil pics en % (defaut 15)
 *   --maxpass 10       : nombre max de passes (defaut 10)
 *
 * Usage:
 *   node fix_vl_cleanup_all.js                          # rapport complet
 *   node fix_vl_cleanup_all.js --delete                 # supprimer tout
 *   node fix_vl_cleanup_all.js --delete --pays NIGERIA  # un pays
 *   node fix_vl_cleanup_all.js --delete --seuil 10      # seuil 10%
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
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

// =============================================
// ETAPE 1: Doublons de date
// =============================================
async function cleanDuplicates(conn, fondId, fondName, pays, doDelete) {
  const [vls] = await conn.execute(
    'SELECT id, date, value FROM valorisations WHERE fund_id = ? AND value > 0 ORDER BY date ASC, id ASC',
    [fondId]
  );

  const dateMap = {};
  for (const v of vls) {
    const d = String(v.date).slice(0, 10);
    if (!dateMap[d]) dateMap[d] = [];
    dateMap[d].push(v);
  }

  const toDelete = [];
  for (const [date, entries] of Object.entries(dateMap)) {
    if (entries.length <= 1) continue;

    // Find neighbors (VL from prev and next dates)
    const allDates = Object.keys(dateMap).sort();
    const idx = allDates.indexOf(date);
    const prevDate = idx > 0 ? allDates[idx - 1] : null;
    const nextDate = idx < allDates.length - 1 ? allDates[idx + 1] : null;
    const prevVal = prevDate ? Number(dateMap[prevDate][0].value) : null;
    const nextVal = nextDate ? Number(dateMap[nextDate][0].value) : null;

    // Reference value = average of neighbors
    let refVal = null;
    if (prevVal && nextVal) refVal = (prevVal + nextVal) / 2;
    else if (prevVal) refVal = prevVal;
    else if (nextVal) refVal = nextVal;

    if (refVal === null) {
      // No neighbors, keep the first entry
      for (let i = 1; i < entries.length; i++) toDelete.push(entries[i]);
      continue;
    }

    // Keep the entry closest to reference
    let bestIdx = 0;
    let bestDiff = Math.abs(Number(entries[0].value) - refVal);
    for (let i = 1; i < entries.length; i++) {
      const diff = Math.abs(Number(entries[i].value) - refVal);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }

    for (let i = 0; i < entries.length; i++) {
      if (i !== bestIdx) toDelete.push(entries[i]);
    }
  }

  if (toDelete.length > 0 && doDelete) {
    for (const entry of toDelete) {
      await conn.execute('DELETE FROM valorisations WHERE id = ?', [entry.id]);
    }
  }

  return toDelete.length;
}

// =============================================
// ETAPE 2: Pics bidirectionnels (iteratif)
// =============================================
function detectSpikes(vls, seuil) {
  if (vls.length < 3) return [];
  const spikes = [];

  for (let i = 1; i < vls.length - 1; i++) {
    const prevVal = Number(vls[i - 1].value);
    const currVal = Number(vls[i].value);
    const nextVal = Number(vls[i + 1].value);

    if (prevVal <= 0 || currVal <= 0 || nextVal <= 0) continue;

    const changeToPrev = Math.abs(pctChange(prevVal, currVal));
    const changeToNext = Math.abs(pctChange(nextVal, currVal));

    if (changeToPrev > seuil && changeToNext > seuil) {
      spikes.push({
        vlId: vls[i].id,
        date: String(vls[i].date).slice(0, 10),
        value: currVal,
        prevValue: prevVal,
        nextValue: nextVal,
        changeToPrev,
        changeToNext,
      });
    }
  }

  // Edge: first entry deviates >seuil from next, but next-to-third is calm
  if (vls.length >= 3) {
    const fv = Number(vls[0].value);
    const sv = Number(vls[1].value);
    const tv = Number(vls[2].value);
    if (fv > 0 && sv > 0 && tv > 0) {
      const changeToSecond = Math.abs(pctChange(sv, fv));
      const secondToThird = Math.abs(pctChange(sv, tv));
      if (changeToSecond > seuil && secondToThird < seuil) {
        spikes.push({
          vlId: vls[0].id,
          date: String(vls[0].date).slice(0, 10),
          value: fv,
          prevValue: null,
          nextValue: sv,
          changeToPrev: null,
          changeToNext: changeToSecond,
        });
      }
    }

    const lv = Number(vls[vls.length - 1].value);
    const slv = Number(vls[vls.length - 2].value);
    const tlv = Number(vls[vls.length - 3].value);
    if (lv > 0 && slv > 0 && tlv > 0) {
      const changeToSecondLast = Math.abs(pctChange(slv, lv));
      const thirdToSecondLast = Math.abs(pctChange(tlv, slv));
      if (changeToSecondLast > seuil && thirdToSecondLast < seuil) {
        spikes.push({
          vlId: vls[vls.length - 1].id,
          date: String(vls[vls.length - 1].date).slice(0, 10),
          value: lv,
          prevValue: slv,
          nextValue: null,
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

// =============================================
// ETAPE 3: Erreurs de saisie (drop >90%)
// =============================================
function detectDataEntryErrors(vls) {
  const errors = [];
  if (vls.length < 3) return errors;

  for (let i = 1; i < vls.length - 1; i++) {
    const prev = Number(vls[i - 1].value);
    const curr = Number(vls[i].value);
    const next = Number(vls[i + 1].value);

    if (prev <= 0 || curr <= 0 || next <= 0) continue;

    // Pattern: value drops >90% from prev AND next is close to prev (recovery)
    const dropFromPrev = (prev - curr) / prev * 100;
    const dropFromNext = (next - curr) / next * 100;

    if (dropFromPrev > 90 && dropFromNext > 90) {
      errors.push({
        vlId: vls[i].id,
        date: String(vls[i].date).slice(0, 10),
        value: curr,
        prevValue: prev,
        nextValue: next,
        type: 'DATA_ENTRY_ERROR',
      });
    }

    // Pattern: value spikes >1000% vs both neighbors
    const riseFromPrev = (curr - prev) / prev * 100;
    const riseFromNext = (curr - next) / next * 100;

    if (riseFromPrev > 1000 && riseFromNext > 1000) {
      errors.push({
        vlId: vls[i].id,
        date: String(vls[i].date).slice(0, 10),
        value: curr,
        prevValue: prev,
        nextValue: next,
        type: 'DATA_ENTRY_SPIKE',
      });
    }
  }

  return errors;
}

// =============================================
// MAIN
// =============================================
async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');
  console.log(`Mode: ${opts.mode} | Seuil: ${opts.seuil}% | Max passes: ${opts.maxpass}`);
  if (opts.pays) console.log(`Pays: ${opts.pays}`);
  if (opts.fondId) console.log(`Fond ID: ${opts.fondId}`);
  const doDelete = opts.mode === 'delete';

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

  // ==========================================
  // ETAPE 1: DOUBLONS DE DATE
  // ==========================================
  console.log('========== ETAPE 1: DOUBLONS DE DATE ==========');
  let totalDuplicates = 0;
  const dupsByPays = {};

  for (const fond of fonds) {
    const count = await cleanDuplicates(conn, fond.id, fond.nom_fond, fond.pays, doDelete);
    if (count > 0) {
      totalDuplicates += count;
      const p = fond.pays || 'INCONNU';
      if (!dupsByPays[p]) dupsByPays[p] = { count: 0, fonds: 0 };
      dupsByPays[p].count += count;
      dupsByPays[p].fonds++;
      if (count >= 5) {
        console.log(`  ${fond.nom_fond} (${p}): ${count} doublons`);
      }
    }
  }
  console.log(`Total doublons: ${totalDuplicates} VL`);
  for (const [p, d] of Object.entries(dupsByPays).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${p}: ${d.count} doublons dans ${d.fonds} fonds`);
  }

  // ==========================================
  // ETAPE 2: PICS BIDIRECTIONNELS (iteratif)
  // ==========================================
  console.log('\n========== ETAPE 2: PICS BIDIRECTIONNELS ==========');
  let grandTotalSpikes = 0;
  const allSpikes = [];
  const spikesByPays = {};
  const fondsSpiked = new Set();

  for (let pass = 1; pass <= opts.maxpass; pass++) {
    let passSpikes = 0;

    for (const fond of fonds) {
      const [vls] = await conn.execute(
        'SELECT id, date, value FROM valorisations WHERE fund_id = ? AND value > 0 ORDER BY date ASC',
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
        allSpikes.push({ ...spike, fundId: fond.id, fundName: fond.nom_fond, pays, pass });
        if (doDelete) {
          await conn.execute('DELETE FROM valorisations WHERE id = ?', [spike.vlId]);
        }
      }

      if (spikes.length > 3) {
        console.log(`  [Pass ${pass}] ${fond.nom_fond} (${pays}): ${spikes.length} pics`);
      }
    }

    console.log(`Pass ${pass}: ${passSpikes} pics detectes`);
    grandTotalSpikes += passSpikes;

    if (passSpikes === 0) {
      console.log('Convergence atteinte.');
      break;
    }
    if (!doDelete) {
      console.log('Mode report — arret apres pass 1');
      break;
    }
  }

  console.log(`Total pics: ${grandTotalSpikes} VL dans ${fondsSpiked.size} fonds`);
  for (const [p, d] of Object.entries(spikesByPays).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${p}: ${d.count} pics dans ${d.fonds.size} fonds`);
  }

  // ==========================================
  // ETAPE 3: ERREURS DE SAISIE
  // ==========================================
  console.log('\n========== ETAPE 3: ERREURS DE SAISIE ==========');
  let totalDataErrors = 0;
  const dataErrors = [];

  for (const fond of fonds) {
    const [vls] = await conn.execute(
      'SELECT id, date, value FROM valorisations WHERE fund_id = ? AND value > 0 ORDER BY date ASC',
      [fond.id]
    );
    if (vls.length < 3) continue;

    const errors = detectDataEntryErrors(vls);
    if (errors.length === 0) continue;

    totalDataErrors += errors.length;
    for (const err of errors) {
      dataErrors.push({ ...err, fundId: fond.id, fundName: fond.nom_fond, pays: fond.pays });
      console.log(`  [${err.type}] ${fond.nom_fond} (${fond.pays}): date=${err.date} val=${err.value} (prev=${err.prevValue}, next=${err.nextValue})`);
      if (doDelete) {
        await conn.execute('DELETE FROM valorisations WHERE id = ?', [err.vlId]);
      }
    }
  }
  console.log(`Total erreurs de saisie: ${totalDataErrors} VL`);

  // ==========================================
  // RAPPORT FINAL
  // ==========================================
  const totalDeleted = doDelete ? (totalDuplicates + grandTotalSpikes + totalDataErrors) : 0;

  console.log('\n==========================================');
  console.log('=== RAPPORT NETTOYAGE COMPLET VL ===');
  console.log('==========================================');
  console.log(`Fonds analyses:           ${fonds.length}`);
  console.log(`Doublons de date:         ${totalDuplicates}`);
  console.log(`Pics bidirectionnels:     ${grandTotalSpikes} (seuil ${opts.seuil}%)`);
  console.log(`Erreurs de saisie:        ${totalDataErrors}`);
  console.log(`TOTAL VL a ${doDelete ? 'supprimees' : 'supprimer'}:     ${totalDuplicates + grandTotalSpikes + totalDataErrors}`);

  // Top 30 pics
  if (allSpikes.length > 0) {
    const sorted = allSpikes.sort((a, b) => {
      const aMax = Math.max(a.changeToPrev || 0, a.changeToNext || 0);
      const bMax = Math.max(b.changeToPrev || 0, b.changeToNext || 0);
      return bMax - aMax;
    });
    console.log(`\n=== TOP 30 PICS ===`);
    for (const s of sorted.slice(0, 30)) {
      const cpStr = s.changeToPrev !== null ? `${s.changeToPrev.toFixed(1)}%` : '-';
      const cnStr = s.changeToNext !== null ? `${s.changeToNext.toFixed(1)}%` : '-';
      console.log(`  [P${s.pass}][${s.pays}] ${s.fundName.substring(0, 35).padEnd(35)} | ${s.date} val=${Number(s.value).toFixed(2)} | prev:${cpStr} next:${cnStr}`);
    }
  }

  if (doDelete && totalDeleted > 0) {
    console.log(`\n=== ACTIONS POST-NETTOYAGE REQUISES ===`);
    console.log('1. Recalculer VL ajustees:   node recalc_vl_ajuste.js');
    console.log('2. Recalculer performances:  node fix_populate_performances.js --force');
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
