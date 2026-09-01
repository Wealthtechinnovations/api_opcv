const { calculerDelaiRecouvrement, calculateBeta, calculateBetaHaussier, calculateBetaBaissier } = require('../src/functions/delai_Beta');

describe('calculerDelaiRecouvrement', () => {
  const historique = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 105 },
    { date: '2024-01-03', value: 103 },
    { date: '2024-01-04', value: 110 },
    { date: '2024-01-05', value: 108 },
  ];

  test('finds recovery after drawdown', () => {
    const result = calculerDelaiRecouvrement(historique, '2024-01-01', '2024-01-05');
    expect(result).toHaveProperty('delaiRecouvrement');
    expect(result).toHaveProperty('dateRecouvrement');
  });

  test('returns -1 for invalid date range', () => {
    const result = calculerDelaiRecouvrement(historique, '2025-01-01', '2025-12-31');
    expect(result.delaiRecouvrement).toBe(-1);
    expect(result.dateRecouvrement).toBeNull();
  });
});

describe('calculateBeta', () => {
  test('beta of 1 for identical returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.02];
    const result = calculateBeta(returns, returns);
    expect(result).toBeCloseTo(1, 5);
  });

  test('beta of 2 for doubled returns', () => {
    const index = [0.01, -0.02, 0.03, -0.01, 0.02];
    const fund = index.map(r => r * 2);
    const result = calculateBeta(fund, index);
    expect(result).toBeCloseTo(2, 5);
  });

  test('negative beta for inverse returns', () => {
    const index = [0.01, -0.02, 0.03, -0.01, 0.02];
    const fund = index.map(r => -r);
    const result = calculateBeta(fund, index);
    expect(result).toBeCloseTo(-1, 5);
  });
});

describe('calculateBetaHaussier', () => {
  test('returns beta for positive periods only', () => {
    const fundReturns = [0.02, -0.01, 0.03, -0.02, 0.01];
    const indexReturns = [0.01, -0.03, 0.02, -0.01, 0.015];
    const result = calculateBetaHaussier(fundReturns, indexReturns);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });
});

describe('calculateBetaBaissier', () => {
  test('returns beta for negative periods only', () => {
    const fundReturns = [0.02, -0.01, 0.03, -0.02, 0.01];
    const indexReturns = [0.01, -0.03, 0.02, -0.01, 0.015];
    const result = calculateBetaBaissier(fundReturns, indexReturns);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });
});
