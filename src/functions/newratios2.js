const PortfolioAnalytics = require('portfolio-analytics');
const quants = require('quants')
const math = require('mathjs');
const { calculatePerformance, calculateAnnualizedPerformance } = require('./performances')


/**
 * Calculates the maximum drawdown of a portfolio based on cumulative returns.
 *
 * @param {number[]} cumulativeReturns - Array of cumulative returns over time.
 * @returns {number} - Maximum drawdown value.
 */
function calculateMaxDrawdown(cumulativeReturns) {
  let maxDrawdown = 0;
  let peak = cumulativeReturns[0];

  cumulativeReturns.forEach(value => {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (peak - value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  return maxDrawdown;
}


const calculateDSR = (valeursLiquidatives, targetReturn = 0, periodYears) => {
  const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }
  const downsideReturns = rendements.filter(r => r < targetReturn);
  return math.sqrt(math.mean(downsideReturns.map(r => math.pow(r - targetReturn, 2))));
};

const calculateSortinoRatio = (valeursLiquidatives, riskFreeRate, targetReturn, periodYears) => {
  const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }
  const dsr = calculateDSR(rendements, targetReturn, periodYears);
  const excessReturns = rendements.map(r => r - riskFreeRate);
  return math.mean(excessReturns) / dsr;
};

const calculateVAR95 = (valeursLiquidatives, confidenceLevel, periodYears) => {
  const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }
  const mean = math.mean(rendements);
  const standardDeviation = math.std(rendements);
  const zScore = math.inv(-confidenceLevel); 
  return mean + zScore * standardDeviation;
};

const calculateVAR99 = (valeursLiquidatives, confidenceLevel, periodYears) => {
  const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }
  const sortedReturns = rendements.sort((a, b) => a - b);
  const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));
  return sortedReturns[index];
};

const calculateSharpeRatio = (valeursLiquidatives, weeklyRiskFreeRate, periodYears) => {
  const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }

  const annualizedReturns = rendements.map(r => r * 52);
  const annualizedRiskFreeRate = weeklyRiskFreeRate * 52;
  const excessReturns = annualizedReturns.map(r => r - annualizedRiskFreeRate);
  const standardDeviation = math.std(excessReturns) * Math.sqrt(52);

  return math.mean(excessReturns) / standardDeviation;
};

function calculateCalmarRatio(valeursLiquidatives, numberOfYears, periodYears) {
  const filteredReturns = selectDataForPeriod(valeursLiquidatives, periodYears);
  if (filteredReturns.length === 0) {
    return NaN;
  }

  const finalValue = filteredReturns[filteredReturns.length - 1].vl;
  const initialValue = filteredReturns[0].vl;
  const cagr = calculateCompoundAnnualGrowthRate(initialValue, finalValue, numberOfYears);
  const maxDrawdown = calculateMaxDrawdown(filteredReturns);

  return cagr / maxDrawdown;
}

const calculateSkewness = (valeursLiquidatives, periodYears) => {
  const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  const meanReturn = math.mean(rendements);
  const cubedDifferences = rendements.map(r => Math.pow(r - meanReturn, 3));
  const meanCubedDifference = math.mean(cubedDifferences);
  const standardDeviation = math.std(rendements);

  return meanCubedDifference / Math.pow(standardDeviation, 3);
};

function calculateUpCaptureRatio(valeursLiquidatives, benchmarkReturns, periodYears) {
  const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  let sumPortfolioUpReturns = 0;
  let sumBenchmarkUpReturns = 0;

  filteredBenchmarkReturns.forEach((benchmarkReturn, idx) => {
    if (benchmarkReturn > 0) {
      sumPortfolioUpReturns += portfolioReturns[idx];
      sumBenchmarkUpReturns += benchmarkReturn;
    }
  });

  if (sumBenchmarkUpReturns === 0) {
    return null; // Pas de hausse de l'indice
  }

  return (sumPortfolioUpReturns / sumBenchmarkUpReturns) * 100;
}
function calculateDownCaptureRatio(valeursLiquidatives, benchmarkReturns, periodYears) {
  const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  let sumPortfolioDownReturns = 0;
  let sumBenchmarkDownReturns = 0;

  filteredBenchmarkReturns.forEach((benchmarkReturn, idx) => {
    if (benchmarkReturn < 0) {
      sumPortfolioDownReturns += portfolioReturns[idx];
      sumBenchmarkDownReturns += benchmarkReturn;
    }
  });

  if (sumBenchmarkDownReturns === 0) {
    return null; // Pas de baisse de l'indice
  }

  return (sumPortfolioDownReturns / sumBenchmarkDownReturns) * 100;
}


const calculateOmegaRatio = (valeursLiquidatives, targetReturn = 0, periodYears) => {
  const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }

  const excessReturns = rendements.map(r => r - targetReturn);
  const gain = math.sum(excessReturns.filter(r => r > 0));
  const loss = -math.sum(excessReturns.filter(r => r < 0));

  return gain / loss;
};

function calculateDownsideBeta(valeursLiquidatives, benchmarkReturns, periodYears) {
  const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  const negativeBenchmarkPeriods = filteredBenchmarkReturns.map((ret, idx) => ret < 0 ? portfolioReturns[idx] : null).filter(x => x !== null);
  const negativeBenchmarkReturns = filteredBenchmarkReturns.filter(ret => ret < 0);

  if (negativeBenchmarkPeriods.length === 0) {
    return null;
  }

  const covariance = calculateCovariance(negativeBenchmarkPeriods, negativeBenchmarkReturns);
  const variance = calculateVariance(negativeBenchmarkReturns);

  return covariance / variance;
}

function calculateBetanew(valeursLiquidatives, benchmarkReturns, periodYears) {
  const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  const covariance = calculateCovariance(portfolioReturns, filteredBenchmarkReturns);
  const varianceBenchmark = calculateVariance(filteredBenchmarkReturns);

  return covariance / varianceBenchmark;
}

function calculateInformationRatio(valeursLiquidatives, benchmarkReturns, periodYears) {
  const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  const differences = portfolioReturns.map((ret, idx) => ret - filteredBenchmarkReturns[idx]);
  const trackingError = math.std(differences);
  const activeReturn = math.mean(differences);

  return activeReturn / trackingError;
}

function calculateTrackingError(valeursLiquidatives, benchmarkReturns, periodYears) {
  const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  const differences = portfolioReturns.map((ret, idx) => ret - filteredBenchmarkReturns[idx]);

  return math.std(differences);
}


const calculateCovariance = (x, y) => {
  const meanX = math.mean(x);
  const meanY = math.mean(y);
  return math.mean(x.map((val, idx) => (val - meanX) * (y[idx] - meanY)));
};


const calculateVariance = (values) => {
  const mean = math.mean(values);
  return math.mean(values.map(val => math.pow(val - mean, 2)));
};




function calculateCompoundAnnualGrowthRate(initialValue, finalValue, numberOfYears) {
  return Math.pow(finalValue / initialValue, 1 / numberOfYears) - 1;
}

const selectDataForPeriod = (returns, periodYears) => {
  // Implémentez la logique pour sélectionner les données en fonction de la période
  // Par exemple, sélectionner les dernières données de 52 semaines * nombre d'années
  const numberOfWeeks = 52 * periodYears;
  return returns.slice(-numberOfWeeks);
};

const calculateRendementsForPeriod = (valeursLiquidatives, periodYears) => {
  const selectedValeursLiquidatives = selectDataForPeriod(valeursLiquidatives, periodYears);
  return calculerRendements(selectedValeursLiquidatives);
};

const calculerRendements = (valeursLiquidatives) => {
  let rendements = [];
  for (let i = 0; i < valeursLiquidatives.length - 1; i++) {
    let rendement = (valeursLiquidatives[i].vl - valeursLiquidatives[i + 1].vl) / valeursLiquidatives[i + 1].vl;
    rendements.push(rendement);
  }
  return rendements;
};


module.exports = {
//  calculateVolatility,
  calculateMaxDrawdown,
  calculateDSR,
  calculateCovariance,
//  calculateBetanew,
  calculateVariance,
 /* calculateInformationRationew,
  calculateDSRnew,*/
  calculateBetanew,
  calculateUpCaptureRatio,
  calculateDownCaptureRatio,
  calculateCalmarRatio,
  calculateDownsideBeta,
  //calculateSortinoRationew,
  calculateSkewness,
  calculateOmegaRatio,
  // calculateNegativeVolatility,
  calculateSharpeRatio,
  calculateVAR95,
  calculateTrackingError,
 /* calculateVolatilityJour,
  calculateVolatilityMois,*/
  calculateVAR99,
  calculateInformationRatio,
  calculateSortinoRatio
}