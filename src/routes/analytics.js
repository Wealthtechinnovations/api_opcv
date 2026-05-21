const express = require('express');
const router = express.Router();
const { clickhouse, isClickHouseAvailable } = require('../db/clickhouse');

/**
 * Middleware: check ClickHouse availability before processing analytics requests.
 */
function requireClickHouse(req, res, next) {
  if (!isClickHouseAvailable()) {
    return res.status(503).json({
      error: 'Analytics service not available',
      message: 'ClickHouse is not connected. Analytics features are temporarily disabled.',
    });
  }
  next();
}

/**
 * @swagger
 * /api/analytics/fund/{fundId}/performance:
 *   get:
 *     summary: Get performance time series for a fund
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: fundId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 365
 *         description: Max number of data points
 *     responses:
 *       200:
 *         description: Performance time series
 */
router.get('/api/analytics/fund/:fundId/performance', requireClickHouse, async (req, res) => {
  try {
    const fundId = parseInt(req.params.fundId, 10);
    if (isNaN(fundId)) {
      return res.status(400).json({ error: 'Invalid fund ID' });
    }

    const from = req.query.from || '1970-01-01';
    const to = req.query.to || '2099-12-31';
    const limit = Math.min(parseInt(req.query.limit, 10) || 365, 10000);

    const result = await clickhouse.query({
      query: `
        SELECT
          fund_id,
          fund_name,
          isin,
          date,
          nav,
          daily_return,
          cumulative_return,
          country,
          management_company,
          currency,
          actif_net
        FROM fund_performance
        WHERE fund_id = {fundId:UInt32}
          AND date >= {from:String}
          AND date <= {to:String}
        ORDER BY date ASC
        LIMIT {limit:UInt32}
      `,
      query_params: { fundId, from, to, limit },
      format: 'JSONEachRow',
    });

    const rows = await result.json();

    res.json({
      code: 200,
      data: {
        fund_id: fundId,
        total_points: rows.length,
        performance: rows,
      },
    });
  } catch (error) {
    console.error('[Analytics] Fund performance query error:', error.message);
    res.status(500).json({ error: 'Failed to fetch fund performance data' });
  }
});

/**
 * @swagger
 * /api/analytics/market/overview:
 *   get:
 *     summary: Market overview - total funds and AUM per country
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for the overview (defaults to latest available)
 *     responses:
 *       200:
 *         description: Market overview data
 */
router.get('/api/analytics/market/overview', requireClickHouse, async (req, res) => {
  try {
    let dateFilter = '';
    const queryParams = {};

    if (req.query.date) {
      dateFilter = 'WHERE date = {date:String}';
      queryParams.date = req.query.date;
    } else {
      dateFilter = 'WHERE date = (SELECT max(date) FROM market_analytics)';
    }

    const result = await clickhouse.query({
      query: `
        SELECT
          country,
          total_funds,
          total_aum,
          avg_performance,
          date
        FROM market_analytics
        ${dateFilter}
        ORDER BY total_aum DESC
      `,
      query_params: queryParams,
      format: 'JSONEachRow',
    });

    const rows = await result.json();

    // Calculate totals
    const totals = rows.reduce(
      (acc, row) => ({
        total_funds: acc.total_funds + (Number(row.total_funds) || 0),
        total_aum: acc.total_aum + (Number(row.total_aum) || 0),
      }),
      { total_funds: 0, total_aum: 0 }
    );

    res.json({
      code: 200,
      data: {
        totals,
        countries: rows,
      },
    });
  } catch (error) {
    console.error('[Analytics] Market overview query error:', error.message);
    res.status(500).json({ error: 'Failed to fetch market overview data' });
  }
});

/**
 * @swagger
 * /api/analytics/rankings/top:
 *   get:
 *     summary: Top performing funds by ranking
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [3M, 6M, 1Y, 3Y, 5Y, YTD]
 *           default: 1Y
 *         description: Ranking period
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of top funds to return
 *       - in: query
 *         name: ranking_type
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Ranking type (1 or 2)
 *     responses:
 *       200:
 *         description: Top ranked funds
 */
router.get('/api/analytics/rankings/top', requireClickHouse, async (req, res) => {
  try {
    const period = req.query.period || '1Y';
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const rankingType = parseInt(req.query.ranking_type, 10) || 1;

    const validPeriods = ['3M', '6M', '1Y', '3Y', '5Y', 'YTD'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: 'Invalid period',
        valid_periods: validPeriods,
      });
    }

    const result = await clickhouse.query({
      query: `
        SELECT
          fund_id,
          fund_name,
          ranking_type,
          quartile,
          rank,
          total_funds,
          period,
          calculated_at
        FROM fund_rankings
        WHERE period = {period:String}
          AND ranking_type = {rankingType:UInt8}
        ORDER BY rank ASC
        LIMIT {limit:UInt32}
      `,
      query_params: { period, rankingType, limit },
      format: 'JSONEachRow',
    });

    const rows = await result.json();

    res.json({
      code: 200,
      data: {
        period,
        ranking_type: rankingType,
        total_results: rows.length,
        rankings: rows,
      },
    });
  } catch (error) {
    console.error('[Analytics] Rankings query error:', error.message);
    res.status(500).json({ error: 'Failed to fetch ranking data' });
  }
});

/**
 * @swagger
 * /api/analytics/fund/{fundId}/risk:
 *   get:
 *     summary: Risk metrics for a fund (volatility, Sharpe, max drawdown, etc.)
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: fundId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: period_days
 *         schema:
 *           type: integer
 *           default: 252
 *         description: Number of trading days for calculation (default 252 = ~1 year)
 *     responses:
 *       200:
 *         description: Risk metrics
 */
router.get('/api/analytics/fund/:fundId/risk', requireClickHouse, async (req, res) => {
  try {
    const fundId = parseInt(req.params.fundId, 10);
    if (isNaN(fundId)) {
      return res.status(400).json({ error: 'Invalid fund ID' });
    }

    const periodDays = Math.min(parseInt(req.query.period_days, 10) || 252, 5000);

    // Fetch daily returns from ClickHouse
    const result = await clickhouse.query({
      query: `
        SELECT
          date,
          nav,
          daily_return
        FROM fund_performance
        WHERE fund_id = {fundId:UInt32}
        ORDER BY date DESC
        LIMIT {periodDays:UInt32}
      `,
      query_params: { fundId, periodDays },
      format: 'JSONEachRow',
    });

    const rows = await result.json();

    if (rows.length < 2) {
      return res.status(404).json({
        error: 'Insufficient data',
        message: 'Not enough data points to calculate risk metrics for this fund',
      });
    }

    // Reverse to chronological order
    rows.reverse();

    const returns = rows.map((r) => Number(r.daily_return)).filter((r) => !isNaN(r));

    // Calculate risk metrics
    const n = returns.length;
    const meanReturn = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (n - 1);
    const volatility = Math.sqrt(variance);
    const annualizedVolatility = volatility * Math.sqrt(252);

    // Sharpe ratio (assuming risk-free rate ~0 for simplicity)
    const annualizedReturn = meanReturn * 252;
    const sharpeRatio = annualizedVolatility !== 0 ? annualizedReturn / annualizedVolatility : 0;

    // Max drawdown
    let peak = -Infinity;
    let maxDrawdown = 0;
    const navs = rows.map((r) => Number(r.nav));
    for (const nav of navs) {
      if (nav > peak) peak = nav;
      const drawdown = (peak - nav) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Sortino ratio (downside deviation)
    const negativeReturns = returns.filter((r) => r < 0);
    const downsideVariance =
      negativeReturns.length > 0
        ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
        : 0;
    const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);
    const sortinoRatio = downsideDeviation !== 0 ? annualizedReturn / downsideDeviation : 0;

    // VaR (95% - historical method)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(n * 0.05);
    const var95 = sortedReturns[var95Index] || 0;

    // Skewness and Kurtosis
    const stdDev = volatility;
    const skewness =
      stdDev !== 0
        ? returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / stdDev, 3), 0) / n
        : 0;
    const kurtosis =
      stdDev !== 0
        ? returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / stdDev, 4), 0) / n - 3
        : 0;

    res.json({
      code: 200,
      data: {
        fund_id: fundId,
        period_days: n,
        date_range: {
          from: rows[0].date,
          to: rows[rows.length - 1].date,
        },
        metrics: {
          annualized_return: parseFloat(annualizedReturn.toFixed(6)),
          annualized_volatility: parseFloat(annualizedVolatility.toFixed(6)),
          sharpe_ratio: parseFloat(sharpeRatio.toFixed(4)),
          sortino_ratio: parseFloat(sortinoRatio.toFixed(4)),
          max_drawdown: parseFloat(maxDrawdown.toFixed(6)),
          var_95: parseFloat(var95.toFixed(6)),
          skewness: parseFloat(skewness.toFixed(4)),
          kurtosis: parseFloat(kurtosis.toFixed(4)),
          daily_mean_return: parseFloat(meanReturn.toFixed(8)),
          daily_volatility: parseFloat(volatility.toFixed(8)),
        },
      },
    });
  } catch (error) {
    console.error('[Analytics] Risk metrics query error:', error.message);
    res.status(500).json({ error: 'Failed to calculate risk metrics' });
  }
});

router.get('/api/analytics/classement-historique/:fondId', requireClickHouse, async (req, res) => {
  try {
    const fondId = parseInt(req.params.fondId, 10);
    if (isNaN(fondId)) return res.status(400).json({ error: 'Invalid fond ID' });

    const devise = (req.query.devise || 'LOCAL').toUpperCase();
    const date = req.query.date || null;

    let dateFilter = '';
    if (date) {
      dateFilter = `AND date_classement = '${date}'`;
    } else {
      dateFilter = `AND date_classement = (SELECT max(date_classement) FROM classement_historique WHERE fond_id = ${fondId} AND devise = '${devise}')`;
    }

    const result = await clickhouse.query({
      query: `
        SELECT date_classement, type_classement, devise, categorie,
               rang_ytd, total_ytd, rang_3m, total_3m, rang_6m, total_6m,
               rang_1an, total_1an, rang_3ans, total_3ans, rang_5ans, total_5ans,
               quartile_ytd, quartile_3m, quartile_6m, quartile_1an, quartile_3ans,
               perf_ytd, perf_3m, perf_6m, perf_1an, perf_3ans
        FROM classement_historique
        WHERE fond_id = ${fondId} AND devise = '${devise}' ${dateFilter}
        ORDER BY type_classement ASC
      `,
      format: 'JSONEachRow',
    });

    const rows = await result.json();
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('[Analytics] Classement historique error:', error.message);
    res.status(500).json({ error: 'Failed to get historical ranking' });
  }
});

router.get('/api/analytics/classement-historique/:fondId/evolution', requireClickHouse, async (req, res) => {
  try {
    const fondId = parseInt(req.params.fondId, 10);
    if (isNaN(fondId)) return res.status(400).json({ error: 'Invalid fond ID' });

    const devise = (req.query.devise || 'LOCAL').toUpperCase();
    const typeClassement = parseInt(req.query.type || '1', 10);
    const horizon = req.query.horizon || '1an';
    const limit = Math.min(parseInt(req.query.limit || '365', 10), 3650);

    const validHorizons = ['ytd', '1m', '3m', '6m', '1an', '3ans', '5ans'];
    if (!validHorizons.includes(horizon)) {
      return res.status(400).json({ error: `Invalid horizon. Valid: ${validHorizons.join(', ')}` });
    }

    const result = await clickhouse.query({
      query: `
        SELECT date_classement,
               rang_${horizon} as rang, total_${horizon} as total,
               perf_${horizon} as perf
        FROM classement_historique
        WHERE fond_id = ${fondId} AND devise = '${devise}' AND type_classement = ${typeClassement}
          AND rang_${horizon} > 0
        ORDER BY date_classement DESC
        LIMIT ${limit}
      `,
      format: 'JSONEachRow',
    });

    const rows = await result.json();
    res.json({ code: 200, data: rows.reverse() });
  } catch (error) {
    console.error('[Analytics] Classement evolution error:', error.message);
    res.status(500).json({ error: 'Failed to get ranking evolution' });
  }
});

module.exports = router;
