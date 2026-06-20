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

  const totalNames = {
    perf3mm: '3Moistotalm', perf6mm: '6Moistotalm', perf1anm: '1Antotalm',
    perf3ansm: '3Anstotalm', perf5ansm: '5Anstotalm', ytdm: '1erJanviertotalm',
  };

  for (const period of periods) {
    const [rank, total] = rankFundInList(fundsWithPerformance, fundId, period);
    const name = names[period] || period;
    data[`rank${name}`] = rank;
    data[`rank${totalNames[period] || (name + 'total')}`] = total;
  }
  return data;
}

// Les tables performences_eurs/usds contiennent plusieurs dates par fond.
// On ne garde que la derniere date par fond pour eviter de gonfler les totaux
// de classement (doublons) et fausser les rangs.
function keepLatestPerFund(rows) {
  const byFund = new Map();
  for (const r of rows) {
    const prev = byFund.get(r.fond_id);
    if (!prev || new Date(r.date) > new Date(prev.date)) {
      byFund.set(r.fond_id, r);
    }
  }
  return Array.from(byFund.values());
}

async function calculateRankNational(category, fundId, date) {
  // Chaque fond est compare a sa derniere performance disponible (MAX(date) par fond),
  // comme pour le classement regional/global. L'ancien filtre `date = :date` fixe
  // excluait la quasi-totalite des pairs (dernieres VL a des dates differentes),
  // laissant le classement national vide. Le parametre `date` est conserve pour
  // compatibilite de signature mais n'est plus utilise.
  const fundsWithPerformance = await sequelize.query(`
    SELECT p1.fond_id, ${PERF_PERIODS_FULL.map(p => `p1.${p}`).join(', ')}
    FROM performences p1
    INNER JOIN (
      SELECT fond_id, MAX(date) as max_date
      FROM performences
      WHERE categorie_nationale = :category
      GROUP BY fond_id
    ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
    WHERE p1.categorie_nationale = :category
  `, {
    replacements: { category },
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
  const rows = await model.findAll({
    where: { categorie_nationale: category },
    attributes: ['fond_id', 'date', ...PERF_PERIODS_FULL],
    limit: 10000,
  });
  const fundsWithPerformance = keepLatestPerFund(rows);

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS_FULL) };
}

async function calculateRankRegionalDev(category, fundId, devise) {
  const model = devise === 'EUR' ? performences_eurs : performences_usds;
  const rows = await model.findAll({
    where: { categorie_fundafrica_regionale: category },
    attributes: ['fond_id', 'date', ...PERF_PERIODS],
    limit: 10000,
  });
  const fundsWithPerformance = keepLatestPerFund(rows);

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

async function calculateRankGlobalDev(category, fundId, devise) {
  if (!category) return { error: 'Pas de categorie globale FundAfrica.' };

  const model = devise === 'EUR' ? performences_eurs : performences_usds;
  const rows = await model.findAll({
    where: { categorie_fundafrica_globale: category },
    attributes: ['fond_id', 'date', ...PERF_PERIODS],
    limit: 10000,
  });
  const fundsWithPerformance = keepLatestPerFund(rows);

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
