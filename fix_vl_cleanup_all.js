/**
 * Nettoyage complet des VL anormales pour TOUS les fonds.
 *
 * 3 etapes de detection:
 *
 * ETAPE 1 - DOUBLONS DE DATE:
 *   Plusieurs VL pour la meme date sur un meme fond.
 *   On garde celle dont la valeur est la plus proche de la mediane
 *   des voisins (entree precedente + entree suivante par date).
 *
 * ETAPE 2 - PICS (seuil 15%):
 *   Une VL est un PIC si elle devie de +15% ou -15% par rapport
 *   a SES DEUX VOISINS DIRECTS (precedent ET suivant).
 *   Iteratif: on supprime les pics et on re-scanne jusqu a convergence.
 *
 * ETAPE 3 - ERREURS DE SAISIE (seuil 30%):
 *   Meme logique bidirectionnelle mais avec seuil 30%.
 *   Separe pour le rapport (les erreurs >30% sont les plus graves).
 *   Note: toute erreur >30% est deja detectee par l etape 2 (>15%).
 *   L etape 3 sert uniquement a categoriser dans le rapport final.
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

function pctChange(ref, val) {
  if (ref === 0) return Infinity;
  return ((val - ref) / Math.abs(ref)) * 100;
}

// =============================================
// ETAPE 1: Doublons de date
// =============================================
async function cleanDuplicates(conn, fondId, doDelete) {
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
  const allDates = Object.keys(dateMap).sort();

  for (let di = 0; di < allDates.length; di++) {
    const date = allDates[di];
    const entries = dateMap[date];
    if (entries.length <= 1) continue;

    const prevDate = di > 0 ? allDates[di - 1] : null;
    const nextDate = di < allDates.length - 1 ? allDates[di + 1] : null;
    const prevVal = prevDate ? Number(dateMap[prevDate][0].value) : null;
    const nextVal = nextDate ? Number(dateMap[nextDate][0].value) : null;

    let refVal = null;
    if (prevVal && nextVal) refVal = (prevVal + nextVal) / 2;
    else if (prevVal) refVal = prevVal;
    else if (nextVal) refVal = nextVal;

    if (refVal === null) {
      for (let i = 1; i < entries.length; i++) toDelete.push(entries[i]);
      continue;
    }

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
// ETAPE 2 & 3: Detection bidirectionnelle
// Un point est anormal si:
//   |variation vs voisin precedent| > seuil%
//   ET
//   |variation vs voisin suivant| > seuil%
// =============================================
function detectAnomalies(vls, seuil) {
  if (vls.length < 3) return [];
  const anomalies = [];

  // Points interieurs (ont un voisin avant ET apres)
  for (let i = 1; i < vls.length - 1; i++) {
    const prevVal = Number(vls[i - 1].value);
    const currVal = Number(vls[i].value);
    const nextVal = Number(vls[i + 1].value);

    if (prevVal <= 0 || currVal <= 0 || nextVal <= 0) continue;

    const ecartPrev = Math.abs(pctChange(prevVal, currVal));
    const ecartNext = Math.abs(pctChange(nextVal, currVal));

    // Le point devie de +/-seuil% vs les DEUX voisins directs
    if (ecartPrev > seuil && ecartNext > seuil) {
      const maxEcart = Math.max(ecartPrev, ecartNext);
      anomalies.push({
        vlId: vls[i].id,
        date: String(vls[i].date).slice(0, 10),
        value: currVal,
        prevValue: prevVal,
        nextValue: nextVal,
        ecartPrev,
        ecartNext,
        // Categorisation: >30% = ERREUR DE SAISIE, >15% = PIC
        type: maxEcart > 30 ? 'ERREUR_SAISIE' : 'PIC',
      });
    }
  }

  // Bord debut: premier point devie de >seuil% vs le 2eme,
  // ET le 2eme est proche du 3eme (= c est le 1er qui est faux)
  if (vls.length >= 3) {
    const fv = Number(vls[0].value);
    const sv = Number(vls[1].value);
    const tv = Number(vls[2].value);
    if (fv > 0 && sv > 0 && tv > 0) {
      const ecart1to2 = Math.abs(pctChange(sv, fv));
      const ecart2to3 = Math.abs(pctChange(sv, tv));
      if (ecart1to2 > seuil && ecart2to3 < seuil) {
        anomalies.push({
          vlId: vls[0].id,
          date: String(vls[0].date).slice(0, 10),
          value: fv,
          prevValue: null,
          nextValue: sv,
          ecartPrev: null,
          ecartNext: ecart1to2,
          type: ecart1to2 > 30 ? 'ERREUR_SAISIE' : 'PIC',
        });
      }
    }

    // Bord fin: dernier point devie de >seuil% vs l avant-dernier,
    // ET l avant-dernier est proche de l ante-penultieme
    const lv = Number(vls[vls.length - 1].value);
    const slv = Number(vls[vls.length - 2].value);
    const tlv = Number(vls[vls.length - 3].value);
    if (lv > 0 && slv > 0 && tlv > 0) {
      const ecartLastToSl = Math.abs(pctChange(slv, lv));
      const ecartSlToTl = Math.abs(pctChange(tlv, slv));
      if (ecartLastToSl > seuil && ecartSlToTl < seuil) {
        anomalies.push({
          vlId: vls[vls.length - 1].id,
          date: String(vls[vls.length - 1].date).slice(0, 10),
          value: lv,
          prevValue: slv,
          nextValue: null,
          ecartPrev: ecartLastToSl,
          ecartNext: null,
          type: ecartLastToSl > 30 ? 'ERREUR_SAISIE' : 'PIC',
        });
      }
    }
  }

  // Dedupliquer par vlId
  const seen = new Set();
  return anomalies.filter(a => {
    if (seen.has(a.vlId)) return false;
    seen.add(a.vlId);
    return true;
  });
}

// =============================================
// MAIN
// =============================================
async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');
  console.log(`Mode: ${opts.mode} | Seuil pics: ${opts.seuil}% | Seuil erreurs: 30% | Max passes: ${opts.maxpass}`);
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
    const count = await cleanDuplicates(conn, fond.id, doDelete);
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
  // ETAPE 2+3: PICS & ERREURS DE SAISIE (iteratif)
  // ==========================================
  console.log('\n========== ETAPE 2+3: PICS & ERREURS DE SAISIE ==========');
  console.log(`Regle: ecart > +/-${opts.seuil}% vs les 2 voisins directs = PIC`);
  console.log('Regle: ecart > +/-30% vs les 2 voisins directs = ERREUR DE SAISIE');

  let grandTotalAnomalies = 0;
  let totalPics = 0;
  let totalErreurs = 0;
  const allAnomalies = [];
  const anomaliesByPays = {};
  const fondsWithAnomalies = new Set();

  for (let pass = 1; pass <= opts.maxpass; pass++) {
    let passCount = 0;
    let passPics = 0;
    let passErreurs = 0;

    for (const fond of fonds) {
      const [vls] = await conn.execute(
        'SELECT id, date, value FROM valorisations WHERE fund_id = ? AND value > 0 ORDER BY date ASC',
        [fond.id]
      );
      if (vls.length < 3) continue;

      const anomalies = detectAnomalies(vls, opts.seuil);
      if (anomalies.length === 0) continue;

      passCount += anomalies.length;
      fondsWithAnomalies.add(fond.id);

      const pays = fond.pays || 'INCONNU';
      if (!anomaliesByPays[pays]) anomaliesByPays[pays] = { pics: 0, erreurs: 0, fonds: new Set() };
      anomaliesByPays[pays].fonds.add(fond.nom_fond);

      for (const a of anomalies) {
        if (a.type === 'ERREUR_SAISIE') {
          passErreurs++;
          anomaliesByPays[pays].erreurs++;
        } else {
          passPics++;
          anomaliesByPays[pays].pics++;
        }

        allAnomalies.push({ ...a, fundId: fond.id, fundName: fond.nom_fond, pays, pass });

        if (doDelete) {
          await conn.execute('DELETE FROM valorisations WHERE id = ?', [a.vlId]);
        }
      }

      if (anomalies.length > 0) {
        const pics = anomalies.filter(a => a.type === 'PIC').length;
        const errs = anomalies.filter(a => a.type === 'ERREUR_SAISIE').length;
        console.log(`  [Pass ${pass}] ${fond.nom_fond} (${pays}): ${pics} pics, ${errs} erreurs`);
      }
    }

    totalPics += passPics;
    totalErreurs += passErreurs;
    grandTotalAnomalies += passCount;
    console.log(`Pass ${pass}: ${passCount} anomalies (${passPics} pics + ${passErreurs} erreurs)`);

    if (passCount === 0) {
      console.log('Convergence atteinte — 0 nouvelle anomalie.');
      break;
    }
    if (!doDelete) {
      console.log('Mode report — arret apres pass 1 (utilisez --delete pour iterer)');
      break;
    }
  }

  // ==========================================
  // RAPPORT FINAL
  // ==========================================
  const totalToProcess = totalDuplicates + grandTotalAnomalies;

  console.log('\n==========================================');
  console.log('=== RAPPORT NETTOYAGE COMPLET VL ===');
  console.log('==========================================');
  console.log(`Fonds analyses:           ${fonds.length}`);
  console.log(`Fonds avec anomalies:     ${fondsWithAnomalies.size}`);
  console.log(`---`);
  console.log(`Doublons de date:         ${totalDuplicates}`);
  console.log(`Pics (>${opts.seuil}%):           ${totalPics}`);
  console.log(`Erreurs saisie (>30%):    ${totalErreurs}`);
  console.log(`---`);
  console.log(`TOTAL VL ${doDelete ? 'supprimees' : 'a supprimer'}:     ${totalToProcess}`);

  console.log('\n=== PAR PAYS ===');
  for (const [p, d] of Object.entries(anomaliesByPays).sort((a, b) => (b[1].pics + b[1].erreurs) - (a[1].pics + a[1].erreurs))) {
    console.log(`  ${p}: ${d.pics} pics + ${d.erreurs} erreurs dans ${d.fonds.size} fonds`);
  }
  if (Object.keys(dupsByPays).length > 0) {
    console.log('  Doublons:');
    for (const [p, d] of Object.entries(dupsByPays).sort((a, b) => b[1].count - a[1].count)) {
      console.log(`    ${p}: ${d.count} doublons dans ${d.fonds} fonds`);
    }
  }

  // Top 30 anomalies par ecart max
  if (allAnomalies.length > 0) {
    const sorted = allAnomalies.sort((a, b) => {
      const aMax = Math.max(a.ecartPrev || 0, a.ecartNext || 0);
      const bMax = Math.max(b.ecartPrev || 0, b.ecartNext || 0);
      return bMax - aMax;
    });
    console.log(`\n=== TOP 30 ANOMALIES (par ecart max) ===`);
    for (const s of sorted.slice(0, 30)) {
      const epStr = s.ecartPrev !== null ? `${s.ecartPrev.toFixed(1)}%` : '-';
      const enStr = s.ecartNext !== null ? `${s.ecartNext.toFixed(1)}%` : '-';
      console.log(`  [${s.type}][P${s.pass}][${s.pays}] ${s.fundName.substring(0, 30).padEnd(30)} | ${s.date} val=${Number(s.value).toFixed(2)} | prev:${epStr} next:${enStr}`);
    }
  }

  // Top 20 fonds les plus touches
  const fondCounts = {};
  for (const a of allAnomalies) {
    const key = `${a.fundId}|${a.fundName}|${a.pays}`;
    fondCounts[key] = (fondCounts[key] || 0) + 1;
  }
  const topFonds = Object.entries(fondCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  if (topFonds.length > 0) {
    console.log('\n=== TOP 20 FONDS LES PLUS TOUCHES ===');
    for (const [key, count] of topFonds) {
      const [id, name, pays] = key.split('|');
      console.log(`  ${name.substring(0, 40).padEnd(40)} [${pays}] id=${id}: ${count} anomalies`);
    }
  }

  if (doDelete && totalToProcess > 0) {
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
