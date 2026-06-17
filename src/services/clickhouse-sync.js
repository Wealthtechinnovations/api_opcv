const { clickhouse, isClickHouseAvailable, setClickHouseUnavailable } = require('../db/clickhouse');
const {
  vl,
  fond,
  societe,
  pays_regulateurs,
  classementfonds,
  performences,
} = require('../db/sequelize');
const { Sequelize } = require('sequelize');

const BATCH_SIZE = 5000;

// Coupe-circuit : apres trop d'echecs consecutifs (ClickHouse mort / masque /
// disque plein), on arrete la sync periodique pour cesser de marteler le serveur
// et d'alimenter le bruit d'erreurs. Un restart de l'API relance proprement.
const MAX_CONSECUTIVE_FAILURES = parseInt(process.env.CLICKHOUSE_MAX_SYNC_FAILURES, 10) || 3;
let consecutiveFailures = 0;
let intervalHandle = null;

function safeFloat(val) {
  if (val == null) return 0;
  const n = parseFloat(val);
  return isFinite(n) ? n : 0;
}

/**
 * Sync VL (valeur liquidative) data from MySQL to ClickHouse fund_performance table.
 * Reads MySQL in bounded keyset-paginated pages (id > lastId) so that a full
 * resync (e.g. after ClickHouse was reset) never loads ~1M rows into memory at once.
 */
async function syncFundPerformance() {
  console.log('[ClickHouse Sync] Syncing fund performance data...');

  // Find the latest date already in ClickHouse to do incremental sync
  let lastSyncDate = '1970-01-01';
  try {
    const result = await clickhouse.query({
      query: 'SELECT max(date) AS last_date FROM fund_performance',
      format: 'JSONEachRow',
    });
    const rows = await result.json();
    if (rows.length > 0 && rows[0].last_date && rows[0].last_date !== '1970-01-01') {
      lastSyncDate = rows[0].last_date;
    }
  } catch (err) {
    console.warn('[ClickHouse Sync] Could not get last sync date, doing full sync:', err.message);
  }

  let lastId = 0;
  let totalSynced = 0;

  // Bounded keyset pagination: stable even when many rows share the same date.
  for (;;) {
    const vlRecords = await vl.findAll({
      where: {
        date: { [Sequelize.Op.gt]: lastSyncDate },
        id: { [Sequelize.Op.gt]: lastId },
      },
      include: [
        {
          model: fond,
          attributes: ['id', 'nom_fond', 'code_ISIN', 'pays', 'societe_gestion', 'dev_libelle'],
        },
      ],
      order: [['id', 'ASC']],
      limit: BATCH_SIZE,
      raw: true,
      nest: true,
    });

    if (vlRecords.length === 0) break;

    const rows = vlRecords.map((record) => ({
      fund_id: record.fund_id || 0,
      fund_name: record.fund_name || record.fond_investissement?.nom_fond || '',
      isin: record.fond_investissement?.code_ISIN || '',
      date: record.date,
      nav: safeFloat(record.value),
      daily_return: safeFloat(record.tsr),
      cumulative_return: safeFloat(record.base_100),
      country: record.fond_investissement?.pays || '',
      management_company: record.fond_investissement?.societe_gestion || '',
      currency: record.fond_investissement?.dev_libelle || '',
      actif_net: safeFloat(record.actif_net),
    }));

    await clickhouse.insert({
      table: 'fund_performance',
      values: rows,
      format: 'JSONEachRow',
    });

    totalSynced += vlRecords.length;
    lastId = vlRecords[vlRecords.length - 1].id;

    if (vlRecords.length < BATCH_SIZE) break;
  }

  if (totalSynced === 0) {
    console.log('[ClickHouse Sync] No new fund performance data to sync');
    return;
  }

  console.log(`[ClickHouse Sync] Synced ${totalSynced} fund performance records`);
}

/**
 * Sync ranking/quartile data from MySQL classementfonds to ClickHouse fund_rankings.
 */
async function syncFundRankings() {
  console.log('[ClickHouse Sync] Syncing fund rankings data...');

  // Truncate and reload rankings since they are recalculated entirely
  try {
    await clickhouse.command({ query: 'TRUNCATE TABLE IF EXISTS fund_rankings' });
  } catch (err) {
    console.warn('[ClickHouse Sync] Could not truncate fund_rankings:', err.message);
  }

  const rankings = await classementfonds.findAll({
    raw: true,
  });

  if (rankings.length === 0) {
    console.log('[ClickHouse Sync] No ranking data to sync');
    return;
  }

  console.log(`[ClickHouse Sync] Found ${rankings.length} ranking records to sync`);

  // Map ranking periods to ClickHouse rows - each period gets a separate row
  const periods = [
    { field: 'rank3Mois', totalField: 'rank3Moistotal', period: '3M' },
    { field: 'rank6Mois', totalField: 'rank6Moistotal', period: '6M' },
    { field: 'rank1An', totalField: 'rank1Antotal', period: '1Y' },
    { field: 'rank3Ans', totalField: 'rank3Anstotal', period: '3Y' },
    { field: 'rank5Ans', totalField: 'rank5Anstotal', period: '5Y' },
    { field: 'rank1erJanvier', totalField: 'rank1erJanviertotal', period: 'YTD' },
  ];

  const rows = [];
  for (const ranking of rankings) {
    for (const p of periods) {
      const rank = ranking[p.field];
      const total = ranking[p.totalField];
      if (rank != null && total != null && total > 0) {
        const quartile = Math.ceil((rank / total) * 4);
        rows.push({
          fund_id: ranking.fond_id || 0,
          fund_name: ranking.fond || '',
          ranking_type: ranking.type_classement || 0,
          quartile: Math.min(quartile, 4),
          rank: rank,
          total_funds: total,
          period: p.period,
          calculated_at: new Date().toISOString().slice(0, 10),
        });
      }
    }
  }

  if (rows.length === 0) {
    console.log('[ClickHouse Sync] No ranking rows generated');
    return;
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await clickhouse.insert({
      table: 'fund_rankings',
      values: batch,
      format: 'JSONEachRow',
    });
  }

  console.log(`[ClickHouse Sync] Synced ${rows.length} fund ranking records`);
}

/**
 * Calculate and sync market analytics per country into ClickHouse.
 */
async function syncMarketAnalytics() {
  console.log('[ClickHouse Sync] Syncing market analytics data...');

  // Get fund counts and AUM per country from MySQL
  const funds = await fond.findAll({
    where: { active: 1 },
    attributes: ['id', 'pays', 'montant_actif_net'],
    raw: true,
  });

  // Get latest performance data per fund
  const perfData = await performences.findAll({
    attributes: ['fond_id', 'ytd'],
    raw: true,
  });

  const perfMap = {};
  for (const p of perfData) {
    if (p.fond_id != null) {
      perfMap[p.fond_id] = p.ytd || 0;
    }
  }

  // Aggregate by country
  const countryStats = {};
  for (const f of funds) {
    const country = f.pays || 'Unknown';
    if (!countryStats[country]) {
      countryStats[country] = { totalFunds: 0, totalAum: 0, totalPerf: 0, perfCount: 0 };
    }
    countryStats[country].totalFunds += 1;
    countryStats[country].totalAum += f.montant_actif_net || 0;
    if (perfMap[f.id] !== undefined) {
      countryStats[country].totalPerf += perfMap[f.id];
      countryStats[country].perfCount += 1;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const rows = Object.entries(countryStats).map(([country, stats]) => ({
    country,
    total_funds: stats.totalFunds,
    total_aum: stats.totalAum,
    avg_performance: stats.perfCount > 0 ? stats.totalPerf / stats.perfCount : 0,
    date: today,
  }));

  if (rows.length === 0) {
    console.log('[ClickHouse Sync] No market analytics data to sync');
    return;
  }

  // Delete today's entries to avoid duplicates, then insert fresh
  try {
    await clickhouse.command({
      query: `ALTER TABLE market_analytics DELETE WHERE date = '${today}'`,
    });
  } catch (err) {
    console.warn('[ClickHouse Sync] Could not clean old market_analytics:', err.message);
  }

  await clickhouse.insert({
    table: 'market_analytics',
    values: rows,
    format: 'JSONEachRow',
  });

  console.log(`[ClickHouse Sync] Synced market analytics for ${rows.length} countries`);
}

/**
 * Run full sync from MySQL to ClickHouse.
 */
async function syncToClickHouse() {
  if (!isClickHouseAvailable()) {
    console.log('[ClickHouse Sync] ClickHouse not available, skipping sync');
    return;
  }

  try {
    console.log('[ClickHouse Sync] Starting full sync...');
    await syncFundPerformance();
    await syncFundRankings();
    await syncMarketAnalytics();
    console.log('[ClickHouse Sync] Full sync completed successfully');
    consecutiveFailures = 0;
  } catch (error) {
    consecutiveFailures += 1;
    console.error(
      `[ClickHouse Sync] Sync failed (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}):`,
      error.message
    );
    // Coupe-circuit : on cesse de marteler ClickHouse pour proteger le serveur.
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(
        '[ClickHouse Sync] Trop d\'echecs consecutifs — arret de la sync periodique pour proteger le serveur. Redemarrer l\'API une fois ClickHouse sain.'
      );
      setClickHouseUnavailable();
      if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
      }
    }
  }
}

/**
 * Start periodic sync on a configurable interval.
 * @param {number} intervalMinutes - Sync interval in minutes (default: 60)
 * @returns {NodeJS.Timeout} The interval handle for cleanup
 */
function startPeriodicSync(intervalMinutes = 60) {
  console.log(`[ClickHouse Sync] Starting periodic sync every ${intervalMinutes} minutes`);

  // Run initial sync after a short delay to let the app finish starting
  setTimeout(() => {
    syncToClickHouse();
  }, 5000);

  // Schedule periodic syncs
  intervalHandle = setInterval(() => {
    syncToClickHouse();
  }, intervalMinutes * 60 * 1000);

  return intervalHandle;
}

module.exports = { syncToClickHouse, startPeriodicSync };
