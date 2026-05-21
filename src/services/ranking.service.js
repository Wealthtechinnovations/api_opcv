const { sequelize, performences_eurs, performences_usds } = require('../db/sequelize');

const LOWER_IS_BETTER = new Set([
  'pertemax3an', 'betabaissier3an', 'volatility3an', 'dsr3an',
]);

const PERF_PERIODS = ['perf3m', 'perf6m', 'perf1an', 'perf3ans', 'perf5ans', 'ytd'];

const PERF_PERIODS_FULL = [
  ...PERF_PERIODS,
  'perfveille', 'perfveillem',
  'perf3mm', 'perf6mm', 'perf1anm', 'perf3ansm', 'perf5ansm', 'ytdm',
  'volatility3an', 'ratiosharpe3an', 'pertemax3an', 'sortino3an',
  'info3an', 'calamar3an', 'var953an', 'betabaissier3an', 'omega3an', 'dsr3an',
];

function rankFundInList(fundsWithPerformance, fundId, period) {
  const validPerformances = fundsWithPerformance.filter(
    (f) => f[period] != null && f[period] != '-'
  );
  if (validPerformances.length === 0) return [null, 0];

  if (LOWER_IS_BETTER.has(period)) {
    validPerformances.sort((a, b) => a[period] - b[period]);
  } else {
    validPerformances.sort((a, b) => b[period] - a[period]);
  }

  const rank = validPerformances.findIndex((f) => f.fond_id === fundId) + 1;
  return [rank, validPerformances.length];
}

function buildRankResult(fundsWithPerformance, fundId, category, periods) {
  const data = { ranktotal: fundsWithPerformance.length, category };
  const names = {
    perf3m: '3Mois', perf6m: '6Mois', perf1an: '1An',
    perf3ans: '3Ans', perf5ans: '5Ans', ytd: '1erJanvier',
    perfveille: 'veille', perfveillem: 'veillem',
    perf3mm: '3Moism', perf6mm: '6Moism', perf1anm: '1Anm',
    perf3ansm: '3Ansm', perf5ansm: '5Ansm', ytdm: '1erJanvierm',
    volatility3an: 'volatilite', ratiosharpe3an: 'sharpe', pertemax3an: 'pertemax',
    sortino3an: 'sortino', info3an: 'info', calamar3an: 'calamar',
    var953an: 'var95', betabaissier3an: 'betabaissier', omega3an: 'omega', dsr3an: 'dsr',
  };

  for (const period of periods) {
    const [rank, total] = rankFundInList(fundsWithPerformance, fundId, period);
    const name = names[period] || period;
    data[`rank${name}`] = rank;
    data[`rank${name}total`] = total;
  }
  return data;
}

async function calculateRankNational(category, fundId, date) {
  const fundsWithPerformance = await sequelize.query(`
    SELECT fond_id, ${PERF_PERIODS_FULL.join(', ')}
    FROM performences
    WHERE date = :date AND categorie_nationale = :category
    GROUP BY fond_id
  `, {
    replacements: { category, date },
    type: sequelize.QueryTypes.SELECT,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS_FULL) };
}

async function calculateRankRegional(category, fundId) {
  const fundsWithPerformance = await sequelize.query(`
    SELECT p1.fond_id, ${PERF_PERIODS.map(p => `p1.${p}`).join(', ')}
    FROM performences p1
    INNER JOIN (
      SELECT fond_id, MAX(date) as max_date
      FROM performences
      WHERE categorie_fundafrica_regionale = :category
      GROUP BY fond_id
    ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
    WHERE p1.categorie_fundafrica_regionale = :category
  `, {
    replacements: { category },
    type: sequelize.QueryTypes.SELECT,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

async function calculateRankGlobal(category, fundId) {
  if (!category) return { error: 'Pas de categorie globale FundAfrica.' };

  const fundsWithPerformance = await sequelize.query(`
    SELECT p1.fond_id, ${PERF_PERIODS.map(p => `p1.${p}`).join(', ')}
    FROM performences p1
    INNER JOIN (
      SELECT fond_id, MAX(date) as max_date
      FROM performences
      WHERE categorie_fundafrica_globale = :category
      GROUP BY fond_id
    ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
    WHERE p1.categorie_fundafrica_globale = :category
  `, {
    replacements: { category },
    type: sequelize.QueryTypes.SELECT,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { code: 404, error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

async function calculateRankNationalDev(category, fundId, devise) {
  const model = devise === 'EUR' ? performences_eurs : performences_usds;
  const fundsWithPerformance = await model.findAll({
    where: { categorie_nationale: category },
    attributes: ['fond_id', ...PERF_PERIODS],
    order: [['fond_id', 'DESC']],
    limit: 10000,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

async function calculateRankRegionalDev(category, fundId, devise) {
  const model = devise === 'EUR' ? performences_eurs : performences_usds;
  const fundsWithPerformance = await model.findAll({
    where: { categorie_fundafrica_regionale: category },
    attributes: ['fond_id', ...PERF_PERIODS],
    order: [['fond_id', 'DESC']],
    limit: 10000,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

async function calculateRankGlobalDev(category, fundId, devise) {
  if (!category) return { error: 'Pas de categorie globale FundAfrica.' };

  const model = devise === 'EUR' ? performences_eurs : performences_usds;
  const fundsWithPerformance = await model.findAll({
    where: { categorie_fundafrica_globale: category },
    attributes: ['fond_id', ...PERF_PERIODS],
    order: [['fond_id', 'DESC']],
    limit: 10000,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

module.exports = {
  rankFundInList,
  buildRankResult,
  calculateRankNational,
  calculateRankRegional,
  calculateRankGlobal,
  calculateRankNationalDev,
  calculateRankRegionalDev,
  calculateRankGlobalDev,
  PERF_PERIODS,
  PERF_PERIODS_FULL,
  LOWER_IS_BETTER,
};
