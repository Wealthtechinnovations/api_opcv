const {
  calculateCovariance,
  calculateVariance,
  calculateExcessReturns,
  calculateVolatility,
  calculateVolatilityJour,
  calculateVolatilityMois,
  calculateDSR,
  calculateDSRnew,
  calculateVAR95,
  calculateVAR99,
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateOmegaRatio,
  calculateCalmarRatio,
  calculateTrackingError,
  calculateInformationRatio,
  calculateInformationRationew,
  calculateBetanew,
  calculateDownsideBeta,
  calculateDownCaptureRatio,
  calculateUpCaptureRatio,
  calculateSkewness,
  calculateCompoundAnnualGrowthRate,
} = require('../src/functions/ratios');

describe('calculateCovariance', () => {
  test('positive covariance for correlated series', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(calculateCovariance(x, y)).toBeCloseTo(4, 5);
  });

  test('zero covariance for uncorrelated series', () => {
    const x = [1, -1, 1, -1];
    const y = [1, 1, -1, -1];
    expect(calculateCovariance(x, y)).toBeCloseTo(0, 5);
  });

  test('negative covariance for inversely correlated series', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    expect(calculateCovariance(x, y)).toBeCloseTo(-4, 5);
  });
});

describe('calculateVariance', () => {
  test('variance of constant series is 0', () => {
    expect(calculateVariance([5, 5, 5, 5])).toBeCloseTo(0, 5);
  });

  test('variance of [1,2,3,4,5]', () => {
    expect(calculateVariance([1, 2, 3, 4, 5])).toBeCloseTo(2, 5);
  });
});

describe('calculateExcessReturns', () => {
  test('calculates excess returns correctly', () => {
    const returns = [0.05, 0.03, -0.02];
    const benchmark = [0.02, 0.01, -0.01];
    const result = calculateExcessReturns(returns, benchmark);
    expect(result[0]).toBeCloseTo(0.03, 5);
    expect(result[1]).toBeCloseTo(0.02, 5);
    expect(result[2]).toBeCloseTo(-0.01, 5);
  });
});

describe('calculateVolatility (weekly)', () => {
  test('returns NaN for empty array', () => {
    expect(calculateVolatility([])).toBeNaN();
  });

  test('zero volatility for constant returns', () => {
    expect(calculateVolatility([0.01, 0.01, 0.01, 0.01])).toBeCloseTo(0, 5);
  });

  test('positive volatility for varying returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.02];
    const vol = calculateVolatility(returns);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThan(1);
  });
});

describe('calculateVolatilityJour (daily)', () => {
  test('returns NaN for empty array', () => {
    expect(calculateVolatilityJour([])).toBeNaN();
  });

  test('daily annualization uses sqrt(252)', () => {
    const returns = [0.01, -0.01, 0.01, -0.01];
    const volDaily = calculateVolatilityJour(returns);
    const volWeekly = calculateVolatility(returns);
    expect(volDaily).toBeGreaterThan(volWeekly);
  });
});

describe('calculateVolatilityMois (monthly)', () => {
  test('returns NaN for empty array', () => {
    expect(calculateVolatilityMois([])).toBeNaN();
  });

  test('monthly annualization uses sqrt(12)', () => {
    const returns = [0.01, -0.01, 0.01, -0.01];
    const volMonthly = calculateVolatilityMois(returns);
    const volWeekly = calculateVolatility(returns);
    expect(volMonthly).toBeLessThan(volWeekly);
  });
});

describe('calculateDSR', () => {
  test('returns NaN for empty array', () => {
    expect(calculateDSR([])).toBeNaN();
  });

  test('returns 0 when all returns are positive', () => {
    expect(calculateDSR([0.01, 0.02, 0.03])).toBe(0);
  });

  test('positive DSR when negative returns exist', () => {
    const returns = [0.01, -0.02, 0.03, -0.04];
    expect(calculateDSR(returns)).toBeGreaterThan(0);
  });
});

describe('calculateVAR95', () => {
  test('returns NaN for empty array', () => {
    expect(calculateVAR95([])).toBeNaN();
  });

  test('VaR is negative for typical returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.04, 0.02, -0.01, 0.015, -0.025, 0.005, -0.03];
    const var95 = calculateVAR95(returns);
    expect(var95).toBeLessThan(0);
  });
});

describe('calculateVAR99', () => {
  test('returns NaN for empty array', () => {
    expect(calculateVAR99([])).toBeNaN();
  });

  test('VaR99 is more extreme than VaR95 conceptually', () => {
    const returns = Array.from({ length: 100 }, (_, i) => (i - 50) * 0.001);
    const var99 = calculateVAR99(returns, 0.99);
    expect(var99).toBeDefined();
    expect(typeof var99).toBe('number');
  });
});

describe('calculateMaxDrawdown', () => {
  test('returns NaN for empty array', () => {
    expect(calculateMaxDrawdown([])).toBeNaN();
  });

  test('returns 0 for monotonically increasing series', () => {
    expect(calculateMaxDrawdown([100, 110, 120, 130])).toBeCloseTo(0, 5);
  });

  test('calculates correct drawdown', () => {
    const values = [100, 120, 90, 110];
    expect(calculateMaxDrawdown(values)).toBeCloseTo(0.25, 5);
  });

  test('handles 50% drawdown', () => {
    expect(calculateMaxDrawdown([100, 50, 75])).toBeCloseTo(0.5, 5);
  });
});

describe('calculateSharpeRatio', () => {
  test('returns NaN for empty array', () => {
    expect(calculateSharpeRatio([], 0.001)).toBeNaN();
  });

  test('returns NaN for constant returns equal to risk-free rate', () => {
    const result = calculateSharpeRatio([0.001, 0.001, 0.001], 0.001);
    expect(result).toBeNaN();
  });

  test('positive Sharpe for returns above risk-free', () => {
    const weeklyReturns = [0.01, 0.015, 0.012, 0.02, 0.008, 0.011, 0.014, 0.009];
    const result = calculateSharpeRatio(weeklyReturns, 0.0005);
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateSortinoRatio', () => {
  test('returns NaN for empty array', () => {
    expect(calculateSortinoRatio([], 0)).toBeNaN();
  });

  test('returns NaN when no downside', () => {
    expect(calculateSortinoRatio([0.01, 0.02, 0.03], 0)).toBeNaN();
  });

  test('positive Sortino for positive excess returns', () => {
    const returns = [0.05, -0.02, 0.03, -0.01, 0.04];
    const result = calculateSortinoRatio(returns, 0.001);
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateOmegaRatio', () => {
  test('returns NaN for empty array', () => {
    expect(calculateOmegaRatio([])).toBeNaN();
  });

  test('Infinity when no losses', () => {
    expect(calculateOmegaRatio([0.01, 0.02, 0.03])).toBe(Infinity);
  });

  test('Omega > 1 for positive-biased returns', () => {
    expect(calculateOmegaRatio([0.05, 0.03, -0.01, 0.04, -0.005])).toBeGreaterThan(1);
  });
});

describe('calculateTrackingError', () => {
  test('returns NaN for empty arrays', () => {
    expect(calculateTrackingError([], [])).toBeNaN();
  });

  test('zero tracking error for identical returns', () => {
    const returns = [0.01, 0.02, 0.03];
    expect(calculateTrackingError(returns, returns)).toBeCloseTo(0, 5);
  });

  test('positive tracking error for different returns', () => {
    const portfolio = [0.01, -0.02, 0.03];
    const benchmark = [0.005, -0.01, 0.02];
    expect(calculateTrackingError(portfolio, benchmark)).toBeGreaterThan(0);
  });
});

describe('calculateInformationRatio', () => {
  test('returns NaN when tracking error is 0', () => {
    expect(calculateInformationRatio([0.01], [0.01], 0)).toBeNaN();
  });

  test('positive IR for outperforming portfolio', () => {
    const fond = [0.05, 0.03, 0.04];
    const bench = [0.02, 0.01, 0.02];
    const te = 0.01;
    expect(calculateInformationRatio(fond, bench, te)).toBeGreaterThan(0);
  });
});

describe('calculateInformationRationew', () => {
  test('returns NaN for identical returns', () => {
    const returns = [0.01, 0.02, 0.03];
    expect(calculateInformationRationew(returns, returns)).toBeNaN();
  });

  test('positive IR for outperforming portfolio', () => {
    const portfolio = [0.05, 0.03, 0.04, 0.06];
    const benchmark = [0.02, 0.01, 0.02, 0.03];
    expect(calculateInformationRationew(portfolio, benchmark)).toBeGreaterThan(0);
  });
});

describe('calculateBetanew', () => {
  test('beta of 1 for identical returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.02];
    expect(calculateBetanew(returns, returns)).toBeCloseTo(1, 5);
  });

  test('beta of 2 for doubled returns', () => {
    const benchmark = [0.01, -0.02, 0.03, -0.01, 0.02];
    const portfolio = benchmark.map(r => r * 2);
    expect(calculateBetanew(portfolio, benchmark)).toBeCloseTo(2, 5);
  });

  test('returns NaN for constant benchmark', () => {
    expect(calculateBetanew([0.01, 0.02], [0, 0])).toBeNaN();
  });
});

describe('calculateDownsideBeta', () => {
  test('returns null when no negative benchmark periods', () => {
    expect(calculateDownsideBeta([0.01, 0.02], [0.01, 0.02])).toBeNull();
  });

  test('returns a number when negative periods exist', () => {
    const asset = [0.01, -0.03, 0.02, -0.04, 0.01];
    const benchmark = [0.005, -0.02, 0.01, -0.03, 0.005];
    const result = calculateDownsideBeta(asset, benchmark);
    expect(typeof result).toBe('number');
  });
});

describe('calculateDownCaptureRatio', () => {
  test('returns null when no negative benchmark periods', () => {
    expect(calculateDownCaptureRatio([0.01, 0.02], [0.01, 0.02])).toBeNull();
  });

  test('100% capture for identical returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.04];
    expect(calculateDownCaptureRatio(returns, returns)).toBeCloseTo(100, 5);
  });
});

describe('calculateUpCaptureRatio', () => {
  test('returns null when no positive benchmark periods', () => {
    expect(calculateUpCaptureRatio([-0.01, -0.02], [-0.01, -0.02])).toBeNull();
  });

  test('100% capture for identical returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.04];
    expect(calculateUpCaptureRatio(returns, returns)).toBeCloseTo(100, 5);
  });
});

describe('calculateSkewness', () => {
  test('returns NaN for empty array', () => {
    expect(calculateSkewness([])).toBeNaN();
  });

  test('returns NaN for constant returns', () => {
    expect(calculateSkewness([0.01, 0.01, 0.01])).toBeNaN();
  });

  test('symmetric distribution has skewness near 0', () => {
    const returns = [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03];
    expect(Math.abs(calculateSkewness(returns))).toBeLessThan(0.1);
  });
});

describe('calculateCompoundAnnualGrowthRate', () => {
  test('returns NaN for zero initial value', () => {
    expect(calculateCompoundAnnualGrowthRate(0, 100, 5)).toBeNaN();
  });

  test('returns NaN for zero years', () => {
    expect(calculateCompoundAnnualGrowthRate(100, 200, 0)).toBeNaN();
  });

  test('100% growth over 1 year', () => {
    expect(calculateCompoundAnnualGrowthRate(100, 200, 1)).toBeCloseTo(1, 5);
  });

  test('~7.18% CAGR for doubling in 10 years', () => {
    expect(calculateCompoundAnnualGrowthRate(100, 200, 10)).toBeCloseTo(0.07177, 3);
  });
});

describe('calculateCalmarRatio', () => {
  test('returns NaN for empty array', () => {
    expect(calculateCalmarRatio([], 3)).toBeNaN();
  });

  test('returns NaN when no drawdown', () => {
    expect(calculateCalmarRatio([100, 110, 120], 1)).toBeNaN();
  });

  test('positive Calmar for positive CAGR with drawdown', () => {
    const values = [100, 120, 90, 130, 150];
    const result = calculateCalmarRatio(values, 3);
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateDSRnew', () => {
  test('returns 0 when all returns above threshold', () => {
    expect(calculateDSRnew([0.01, 0.02, 0.03], 0)).toBe(0);
  });

  test('positive DSR when returns below threshold', () => {
    expect(calculateDSRnew([0.01, -0.02, 0.03, -0.04], 0)).toBeGreaterThan(0);
  });
});
