const {
  calculerDelaiRecouvrement,
  calculerUpCaptureRatio,
  calculerDownCaptureRatio,
  calculateBeta,
  calculateBetaHaussier,
  calculateBetaBaissier,
} = require('../src/functions/delai_Beta_capture');

describe('calculerDelaiRecouvrement', () => {
  const historique = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 105 },
    { date: '2024-01-03', value: 103 },
    { date: '2024-01-04', value: 110 },
    { date: '2024-01-05', value: 108 },
  ];

  test('returns result with delaiRecouvrement and dateRecouvrement', () => {
    const result = calculerDelaiRecouvrement(historique, '2024-01-01', '2024-01-05');
    expect(result).toHaveProperty('delaiRecouvrement');
    expect(result).toHaveProperty('dateRecouvrement');
  });

  test('returns -1 for dates outside range', () => {
    const result = calculerDelaiRecouvrement(historique, '2025-01-01', '2025-12-31');
    expect(result.delaiRecouvrement).toBe(-1);
    expect(result.dateRecouvrement).toBeNull();
  });

  test('returns -1 when series is monotonically increasing', () => {
    const rising = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-02', value: 110 },
      { date: '2024-01-03', value: 120 },
      { date: '2024-01-04', value: 130 },
    ];
    const result = calculerDelaiRecouvrement(rising, '2024-01-01', '2024-01-04');
    expect(result.delaiRecouvrement).toBe(-1);
  });
});

describe('calculateBeta (delai_Beta_capture)', () => {
  test('beta of 1 for identical returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.02];
    expect(calculateBeta(returns, returns)).toBeCloseTo(1, 3);
  });

  test('beta of ~2 for doubled returns', () => {
    const benchmark = [0.01, -0.02, 0.03, -0.01, 0.02];
    const portfolio = benchmark.map(r => r * 2);
    expect(calculateBeta(portfolio, benchmark)).toBeCloseTo(2, 1);
  });

  test('negative beta for inverse returns', () => {
    const benchmark = [0.01, -0.02, 0.03, -0.01, 0.02];
    const portfolio = benchmark.map(r => -r);
    expect(calculateBeta(portfolio, benchmark)).toBeLessThan(0);
  });
});

describe('calculateBetaHaussier', () => {
  test('returns a number for mixed returns', () => {
    const fonds = [0.02, -0.01, 0.03, -0.02, 0.01];
    const indice = [0.01, -0.02, 0.02, -0.01, 0.015];
    const result = calculateBetaHaussier(fonds, indice);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });

  test('filters only periods where BOTH are positive', () => {
    const fonds = [0.02, -0.01, 0.03, -0.02, 0.04];
    const indice = [0.01, 0.02, 0.02, -0.01, 0.03];
    const result = calculateBetaHaussier(fonds, indice);
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateBetaBaissier', () => {
  test('returns a number for mixed returns', () => {
    const fonds = [0.02, -0.01, 0.03, -0.02, -0.015];
    const indice = [0.01, -0.02, 0.02, -0.01, -0.025];
    const result = calculateBetaBaissier(fonds, indice);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });

  test('filters only periods where BOTH are negative', () => {
    const fonds = [-0.01, -0.02, 0.03, -0.03, -0.01];
    const indice = [-0.02, -0.01, 0.02, -0.02, -0.015];
    const result = calculateBetaBaissier(fonds, indice);
    expect(result).toBeGreaterThan(0);
  });
});
