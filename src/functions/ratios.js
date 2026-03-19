const math = require('mathjs');

// =============================================
// Helper Functions
// =============================================

/**
 * Calcul de la covariance entre deux séries.
 */
function calculateCovariance(x, y) {
  const xMean = math.mean(x);
  const yMean = math.mean(y);
  return math.mean(x.map((xi, idx) => (xi - xMean) * (y[idx] - yMean)));
}

/**
 * Calcul de la variance d'une série.
 */
function calculateVariance(x) {
  const mean = math.mean(x);
  return math.mean(x.map(xi => Math.pow(xi - mean, 2)));
}

/**
 * Calcul des rendements excédentaires.
 */
const calculateExcessReturns = (returns, benchmarkReturns) => {
  return returns.map((returnVal, index) => returnVal - benchmarkReturns[index]);
};

// =============================================
// Volatility
// =============================================

/**
 * Volatilité annualisée à partir de rendements hebdomadaires.
 * Annualisation: sqrt(52)
 */
const calculateVolatility = (values) => {
  const n = values.length;
  if (n === 0) return NaN;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  return Math.sqrt(variance) * Math.sqrt(52);
};

/**
 * Volatilité annualisée à partir de rendements journaliers.
 * Annualisation: sqrt(252)
 */
const calculateVolatilityJour = (values) => {
  const n = values.length;
  if (n === 0) return NaN;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  return Math.sqrt(variance) * Math.sqrt(252);
};

/**
 * Volatilité annualisée à partir de rendements mensuels.
 * Annualisation: sqrt(12)
 */
const calculateVolatilityMois = (values) => {
  const n = values.length;
  if (n === 0) return NaN;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  return Math.sqrt(variance) * Math.sqrt(12);
};

// =============================================
// Risk Measures
// =============================================

/**
 * Downside Standard Deviation (DSR).
 */
const calculateDSR = (returns, targetReturn = 0) => {
  if (returns.length === 0) return NaN;
  const downsideReturns = returns.filter(r => r < targetReturn);
  if (downsideReturns.length === 0) return 0;
  return math.sqrt(math.mean(downsideReturns.map(r => math.pow(r - targetReturn, 2))));
};

/**
 * Value at Risk (VaR) 95% - méthode paramétrique.
 */
function calculateVAR95(returns) {
  if (returns.length === 0) return NaN;
  const mean = math.mean(returns);
  const standardDeviation = math.std(returns);
  const zScore = -1.645; // Z-score pour 95% de confiance
  return mean + zScore * standardDeviation;
}

/**
 * Value at Risk (VaR) 99% - méthode historique.
 */
const calculateVAR99 = (values, confidenceLevel = 0.99) => {
  if (values.length === 0) return NaN;
  const sortedReturns = [...values].sort((a, b) => a - b);
  const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));
  return sortedReturns[index];
};

/**
 * Maximum Drawdown.
 */
function calculateMaxDrawdown(cumulativeReturns) {
  if (!cumulativeReturns || cumulativeReturns.length === 0) return NaN;
  let maxDrawdown = 0;
  let peak = cumulativeReturns[0];

  cumulativeReturns.forEach(value => {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  return maxDrawdown;
}

// =============================================
// Ratios
// =============================================

/**
 * Ratio de Sharpe (à partir de rendements hebdomadaires).
 */
const calculateSharpeRatio = (weeklyReturns, weeklyRiskFreeRate) => {
  if (weeklyReturns.length === 0) return NaN;

  const annualizedReturns = weeklyReturns.map(r => r * 52);
  const annualizedRiskFreeRate = weeklyRiskFreeRate * 52;
  const excessReturns = annualizedReturns.map(r => r - annualizedRiskFreeRate);
  const standardDeviation = math.std(excessReturns) * Math.sqrt(52);

  if (standardDeviation === 0) return NaN;
  return math.mean(excessReturns) / standardDeviation;
};

/**
 * Ratio de Sortino.
 */
const calculateSortinoRatio = (returns, riskFreeRate, targetReturn = 0) => {
  if (returns.length === 0) return NaN;
  const dsr = calculateDSR(returns, targetReturn);
  if (dsr === 0) return NaN;
  const excessReturns = returns.map(r => r - riskFreeRate);
  return math.mean(excessReturns) / dsr;
};

/**
 * Ratio Omega.
 */
const calculateOmegaRatio = (returns, targetReturn = 0) => {
  if (returns.length === 0) return NaN;
  const excessReturns = returns.map(r => r - targetReturn);
  const gain = math.sum(excessReturns.filter(r => r > 0));
  const loss = -math.sum(excessReturns.filter(r => r < 0));
  if (loss === 0) return Infinity;
  return gain / loss;
};

/**
 * Tracking Error.
 */
function calculateTrackingError(portfolioReturns, benchmarkReturns) {
  if (portfolioReturns.length === 0) return NaN;
  const differences = portfolioReturns.map((ret, idx) => ret - benchmarkReturns[idx]);
  return math.std(differences);
}

/**
 * Information Ratio.
 */
const calculateInformationRatio = (rendementFond, rendementBench, trackingError) => {
  if (trackingError === 0) return NaN;
  const exces = calculateExcessReturns(rendementFond, rendementBench);
  return math.mean(exces) / trackingError;
};

/**
 * Information Ratio (version alternative).
 */
function calculateInformationRationew(portfolioReturns, benchmarkReturns) {
  const differences = portfolioReturns.map((ret, idx) => ret - benchmarkReturns[idx]);
  const trackingError = math.std(differences);
  if (trackingError === 0) return NaN;
  const activeReturn = math.mean(differences);
  return activeReturn / trackingError;
}

/**
 * Beta.
 */
function calculateBetanew(portfolioReturns, benchmarkReturns) {
  const covariance = calculateCovariance(portfolioReturns, benchmarkReturns);
  const variance = calculateVariance(benchmarkReturns);
  if (variance === 0) return NaN;
  return covariance / variance;
}

/**
 * Beta baissier (Downside Beta).
 */
function calculateDownsideBeta(assetReturns, benchmarkReturns) {
  const negativeBenchmarkPeriods = benchmarkReturns
    .map((ret, idx) => ret < 0 ? assetReturns[idx] : null)
    .filter(x => x !== null);
  const negativeBenchmarkReturns = benchmarkReturns.filter(ret => ret < 0);

  if (negativeBenchmarkPeriods.length === 0) return null;

  const covariance = calculateCovariance(negativeBenchmarkPeriods, negativeBenchmarkReturns);
  const variance = calculateVariance(negativeBenchmarkReturns);
  if (variance === 0) return null;
  return covariance / variance;
}

// =============================================
// Capture Ratios
// =============================================

/**
 * Down Capture Ratio.
 */
function calculateDownCaptureRatio(portfolioReturns, benchmarkReturns) {
  let sumPortfolio = 0;
  let sumBenchmark = 0;

  benchmarkReturns.forEach((benchmarkReturn, idx) => {
    if (benchmarkReturn < 0) {
      sumPortfolio += portfolioReturns[idx];
      sumBenchmark += benchmarkReturn;
    }
  });

  if (sumBenchmark === 0) return null;
  return (sumPortfolio / sumBenchmark) * 100;
}

/**
 * Up Capture Ratio.
 */
function calculateUpCaptureRatio(portfolioReturns, benchmarkReturns) {
  let sumPortfolio = 0;
  let sumBenchmark = 0;

  benchmarkReturns.forEach((benchmarkReturn, idx) => {
    if (benchmarkReturn > 0) {
      sumPortfolio += portfolioReturns[idx];
      sumBenchmark += benchmarkReturn;
    }
  });

  if (sumBenchmark === 0) return null;
  return (sumPortfolio / sumBenchmark) * 100;
}

// =============================================
// Other Metrics
// =============================================

/**
 * Skewness (asymétrie).
 */
const calculateSkewness = (returns) => {
  if (returns.length === 0) return NaN;
  const mean = math.mean(returns);
  const n = returns.length;
  const stdDev = math.std(returns);
  if (stdDev === 0) return NaN;
  const cubedDiffs = returns.map(r => Math.pow((r - mean) / stdDev, 3));
  return cubedDiffs.reduce((a, b) => a + b, 0) / n;
};

/**
 * DSR alternatif.
 */
const calculateDSRnew = (returns, threshold) => {
  const downsideReturns = returns.filter(r => r < threshold);
  if (downsideReturns.length === 0) return 0;
  const squaredDownsideDifferences = downsideReturns.map(r => Math.pow(r - threshold, 2));
  const meanSquaredDownsideDifference = squaredDownsideDifferences.reduce((acc, val) => acc + val, 0) / downsideReturns.length;
  return Math.sqrt(meanSquaredDownsideDifference);
};

/**
 * CAGR (Compound Annual Growth Rate).
 */
function calculateCompoundAnnualGrowthRate(initialValue, finalValue, numberOfYears) {
  if (initialValue <= 0 || numberOfYears <= 0) return NaN;
  return Math.pow(finalValue / initialValue, 1 / numberOfYears) - 1;
}

/**
 * Ratio de Calmar.
 */
function calculateCalmarRatio(cumulativeReturns, numberOfYears) {
  if (cumulativeReturns.length === 0) return NaN;
  const finalValue = cumulativeReturns[cumulativeReturns.length - 1];
  const initialValue = cumulativeReturns[0];
  const cagr = calculateCompoundAnnualGrowthRate(initialValue, finalValue, numberOfYears);
  const maxDrawdown = calculateMaxDrawdown(cumulativeReturns);
  if (maxDrawdown === 0) return NaN;
  return cagr / maxDrawdown;
}

module.exports = {
  // Helpers
  calculateCovariance,
  calculateVariance,
  calculateExcessReturns,
  // Volatility
  calculateVolatility,
  calculateVolatilityJour,
  calculateVolatilityMois,
  // Risk
  calculateDSR,
  calculateDSRnew,
  calculateVAR95,
  calculateVAR99,
  calculateMaxDrawdown,
  // Ratios
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateOmegaRatio,
  calculateCalmarRatio,
  calculateTrackingError,
  calculateInformationRatio,
  calculateInformationRationew,
  calculateBetanew,
  calculateDownsideBeta,
  // Capture
  calculateDownCaptureRatio,
  calculateUpCaptureRatio,
  // Other
  calculateSkewness,
  calculateCompoundAnnualGrowthRate,
};
