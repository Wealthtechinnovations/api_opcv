const PortfolioAnalytics = require('portfolio-analytics');
const quants = require('quants')
const math = require('mathjs');
const { calculatePerformance, calculateAnnualizedPerformance } = require('../functions/performances')

// Fonction pour calculer le rendement excédentaire
const calculateExcessReturns = (returns, benchmarkReturns) => {
  //    excessreturn = performance annualisée du fond - celle du benchmark
  return returns.map((returnVal, index) => returnVal - benchmarkReturns[index]);
}
//New fonction
/*const calculateCovariance = (x, y) => {
  const xMean = x.reduce((acc, val) => acc + val, 0) / x.length;
  const yMean = y.reduce((acc, val) => acc + val, 0) / y.length;
  return x.reduce((acc, val, idx) => acc + (val - xMean) * (y[idx] - yMean), 0) / x.length;
};*/

function calculateCovariance(x, y) {
  const xMean = math.mean(x);
  const yMean = math.mean(y);
  return math.mean(x.map((xi, idx) => (xi - xMean) * (y[idx] - yMean)));
}

function calculateVariance(x) {
  const mean = math.mean(x);
  return math.mean(x.map(xi => Math.pow(xi - mean, 2)));
}

function calculateDownsideBeta(assetReturns, benchmarkReturns) {
  // Isoler les périodes où l'indice a des rendements négatifs
  const negativeBenchmarkPeriods = benchmarkReturns.map((ret, idx) => ret < 0 ? assetReturns[idx] : null).filter(x => x !== null);
  const negativeBenchmarkReturns = benchmarkReturns.filter(ret => ret < 0);

  if (negativeBenchmarkPeriods.length === 0) {
    return null; // Pas de période baissière, impossible de calculer
  }

  const covariance = calculateCovariance(negativeBenchmarkPeriods, negativeBenchmarkReturns);
  const variance = calculateVariance(negativeBenchmarkReturns);

  return covariance / variance;
}

function calculateInformationRationew(portfolioReturns, benchmarkReturns) {
  const differences = portfolioReturns.map((ret, idx) => ret - benchmarkReturns[idx]);
  const trackingError = math.std(differences) ;
  const activeReturn = math.mean(differences);
  return activeReturn / trackingError;
}
//const calculateBetanew = (covariance, variance) => covariance / variance;
function calculateBetanew(portfolioReturns, benchmarkReturns) {
  const covariance = calculateCovariance(portfolioReturns, benchmarkReturns);
  const variance =calculateVariance(benchmarkReturns);
  return covariance / variance;
}

const calculateDSRnew = (returns, threshold) => {
  const downsideReturns = returns.filter(r => r < threshold);
  const squaredDownsideDifferences = downsideReturns.map(r => Math.pow(r - threshold, 2));
  const meanSquaredDownsideDifference = squaredDownsideDifferences.reduce((acc, val) => acc + val, 0) / downsideReturns.length;
  return Math.sqrt(meanSquaredDownsideDifference);
};


/*
const calculateCalmarRatio = (annualCompoundedReturn, maxDrawdown) => {
  return annualCompoundedReturn / Math.abs(maxDrawdown);
};*/

const calculateSortinoRatio = (returns, riskFreeRate, targetReturn) => {
  if (returns.length === 0) {
    return NaN;
  }
  const dsr = calculateDSR(returns, targetReturn);
  const excessReturns = returns.map(r => r - riskFreeRate);
  return math.mean(excessReturns) / dsr;
};

const calculateOmegaRatio = (returns, targetReturn = 0) => {
  if (returns.length === 0) {
    return NaN;
  }
  const excessReturns = returns.map(r => r - targetReturn);
  const gain = math.sum(excessReturns.filter(r => r > 0));
  const loss = -math.sum(excessReturns.filter(r => r < 0));
  return gain / loss;
};

const calculateSkewness = (returns) => {
  const meanReturn = returns.reduce((acc, val) => acc + val, 0) / returns.length;
  const cubedDifferences = returns.map(r => Math.pow(r - meanReturn, 3));
  const meanCubedDifference = cubedDifferences.reduce((acc, val) => acc + val, 0) / returns.length;
  const standardDeviation = Math.sqrt(returns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / returns.length);
  return meanCubedDifference / Math.pow(standardDeviation, 3);
};

/*const calculateOmegaRatio = (returns, targetReturn) => {
  const excessReturns = returns.map(r => r - targetReturn);
  const positiveExcess = excessReturns.filter(r => r > 0).reduce((acc, val) => acc + val, 0);
  const negativeExcess = Math.abs(excessReturns.filter(r => r < 0).reduce((acc, val) => acc + val, 0));
  return positiveExcess / negativeExcess;
};*/
function calculateDownCaptureRatio(portfolioReturns, benchmarkReturns) {
  let sumPortfolioDownReturns = 0;
  let sumBenchmarkDownReturns = 0;

  benchmarkReturns.forEach((benchmarkReturn, idx) => {
    if (benchmarkReturn < 0) {
      sumPortfolioDownReturns += portfolioReturns[idx];
      sumBenchmarkDownReturns += benchmarkReturn;
    }
  });

  if (sumBenchmarkDownReturns === 0) {
    return null; // Pas de baisse de l'indice, impossible de calculer
  }

  return (sumPortfolioDownReturns / sumBenchmarkDownReturns) * 100;
}
function calculateUpCaptureRatio(portfolioReturns, benchmarkReturns) {
  let sumPortfolioUpReturns = 0;
  let sumBenchmarkUpReturns = 0;

  benchmarkReturns.forEach((benchmarkReturn, idx) => {
    if (benchmarkReturn > 0) {
      sumPortfolioUpReturns += portfolioReturns[idx];
      sumBenchmarkUpReturns += benchmarkReturn;
    }
  });

  if (sumBenchmarkUpReturns === 0) {
    return null; // Pas de hausse de l'indice, impossible de calculer
  }

  return (sumPortfolioUpReturns / sumBenchmarkUpReturns) * 100;
}

///
// Fonction pour calculer la volatilité
const calculateVolatility = (values) => {
  // n = nombreDeRendementCalcules sur la période
  const nbrRdt_calcules = values.length;
  // console.log(nbrRdt_calcules)
  const mean = values.reduce((sum, value) => sum + value, 0) / nbrRdt_calcules;
  const squaredDeviations = values.map((value) => Math.pow(value - mean, 2));
  const variance = squaredDeviations.reduce((sum, value) => sum + value, 0) / nbrRdt_calcules;
  return Math.sqrt(variance) * Math.sqrt(52);
}


const calculateVolatilityJour = (values) => {

  const n = values.length;

  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const squaredDeviations = values.map((value) => Math.pow(value - mean, 2));
  const variance = squaredDeviations.reduce((sum, value) => sum + value, 0) / n;
  return Math.sqrt(variance) * Math.sqrt(252);
}

const calculateVolatilityMois = (values) => {
  const n = values.length;
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const squaredDeviations = values.map((value) => Math.pow(value - mean, 2));
  const variance = squaredDeviations.reduce((sum, value) => sum + value, 0) / n;
  return Math.sqrt(variance) * Math.sqrt(36);
}


// Fonction pour calculer le DSR (Drawdown to Standard Deviation Ratio)
const calculateDSR = (returns, targetReturn = 0) => {
  if (returns.length === 0) {
    return NaN;
  }
  const downsideReturns = returns.filter(r => r < targetReturn);
  return math.sqrt(math.mean(downsideReturns.map(r => math.pow(r - targetReturn, 2))));
};

//Fonction pour calculer le ratio de sharpe
//(rendement du fond annualisé - le taux sans risque) /  math.std(rendement du fond)
// pas de valeur de l'indice
/*const calculateSharpeRatio = (valuesJour, year, riskFreeRate, stdFond) => {

  //depending on the year exposant 1/year
  const rendementsurYearAns = (valuesJour[valuesJour.length - 1] - valuesJour[0]) / valuesJour[0]
  const rendementAnnuel = Math.pow(rendementsurYearAns, 1 / year) - 1
  const diff = rendementAnnuel - riskFreeRate
  return diff / stdFond
}*/

/*const calculateSortinoRatio = (valuesJour, year, riskFreeRate, dsr) => {

  //depending on the year exposant 1/year
  const rendementsurYearAns = (valuesJour[valuesJour.length - 1] - valuesJour[0]) / valuesJour[0]
  const rendementAnnuel = Math.pow(rendementsurYearAns, 1 / year) - 1
  const diff = rendementAnnuel - riskFreeRate
  return diff / dsr
}*/
/*
const calculateVAR95 = (values, confidenceLevel) => {

  const sortedReturns = values.sort((a, b) => a - b);
  const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));

  return sortedReturns[index];
}*/

function calculateVAR95(returns, confidenceLevel) {
  if (returns.length === 0) {
    return NaN;
  }
  const mean = math.mean(returns);
  const standardDeviation = math.std(returns);
  const zScore = math.inv(-confidenceLevel); // Utilisez une bibliothèque pour obtenir le Z-score approprié
  return mean + zScore * standardDeviation;
}

const calculateVAR99 = (values, confidenceLevel) => {
  if (values.length === 0) {
    return NaN;
  }
  const sortedReturns = values.sort((a, b) => a - b);
  const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));

  return sortedReturns[index];
}


function calculateCompoundAnnualGrowthRate(initialValue, finalValue, numberOfYears) {
  return Math.pow(finalValue / initialValue, 1 / numberOfYears) - 1;
}

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

function calculateCalmarRatio(cumulativeReturns, numberOfYears) {
  if (cumulativeReturns.length === 0) {
    return NaN;
  }
  const finalValue = cumulativeReturns[cumulativeReturns.length - 1];
  const initialValue = cumulativeReturns[0];
  const cagr = calculateCompoundAnnualGrowthRate(initialValue, finalValue, numberOfYears);
  const maxDrawdown = calculateMaxDrawdown(cumulativeReturns);

  return cagr / maxDrawdown;
}

//rendement tjrs en journalier quelque soit la periode
// excessreturn = performance annualisée du fond - celle du benchmark
//resultat = math.std(performance journalière - celle du benchmark)
//tacking error annualisée
/*const calculateTrackingError = (rendementFond, rendementBench) => {

  const exces = calculateExcessReturns(rendementFond, rendementBench)
  // // const moyExces = exces.reduce((sum, value) => sum + value, 0) / rendementJour.length
  // // const remEx = exces.map((el)=>el-moyExces)
  // // const v = math.variance(remEx)
  // return Math.sqrt(v)*Math.sqrt(252)

  return math.std(exces) * Math.sqrt(52)
}*/
const calculateSharpeRatio = (weeklyReturns, weeklyRiskFreeRate) => {
  if (weeklyReturns.length === 0) {
    return NaN;
  }

  // Annualiser les rendements et le taux sans risque
  const annualizedReturns = weeklyReturns.map(r => r * 52);
  const annualizedRiskFreeRate = weeklyRiskFreeRate * 52;

  // Calculer les rendements excédentaires annualisés
  const excessReturns = annualizedReturns.map(r => r - annualizedRiskFreeRate);

  // Annualiser l'écart-type des rendements excédentaires
  const standardDeviation = math.std(excessReturns) * Math.sqrt(52);

  // Calculer le ratio de Sharpe
  return math.mean(excessReturns) / standardDeviation;
};
function calculateTrackingError(portfolioReturns, benchmarkReturns) {
  if (portfolioReturns.length === 0) {
    return NaN;
  }
  const differences = portfolioReturns.map((ret, idx) => ret - benchmarkReturns[idx]);
  return math.std(differences);
}

const calculateInformationRatio = (rendementFond, rendementBench, trackingError) => {
  const exces = calculateExcessReturns(rendementFond, rendementBench)
  return math.std(exces) / trackingError
}





module.exports = {
  calculateVolatility,
  calculateMaxDrawdown,
  calculateDSR,
  calculateCovariance,
  calculateBetanew,
  calculateVariance,
  calculateInformationRationew,
  calculateDSRnew,
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
  calculateVolatilityJour,
  calculateVolatilityMois,
  calculateVAR99,
  calculateInformationRatio,
  calculateSortinoRatio
}