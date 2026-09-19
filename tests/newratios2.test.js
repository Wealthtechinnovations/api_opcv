const { calculateMaxDrawdown, calculateCovariance, calculateVariance } = require('../src/functions/newratios2');

describe('calculateMaxDrawdown', () => {
  test('no drawdown in ascending series', () => {
    expect(calculateMaxDrawdown([100, 110, 120, 130])).toBe(0);
  });

  test('simple drawdown', () => {
    const result = calculateMaxDrawdown([100, 80, 90, 100]);
    expect(result).toBeCloseTo(0.2, 10);
  });

  test('multiple drawdowns picks largest', () => {
    const result = calculateMaxDrawdown([100, 90, 95, 70, 80]);
    expect(result).toBeCloseTo(0.3, 10);
  });

  test('single value returns 0', () => {
    expect(calculateMaxDrawdown([100])).toBe(0);
  });

  test('complete loss', () => {
    expect(calculateMaxDrawdown([100, 0])).toBe(1);
  });
});

describe('calculateCovariance', () => {
  test('perfect positive covariance', () => {
    const result = calculateCovariance([1, 2, 3], [2, 4, 6]);
    expect(result).toBeCloseTo(2 / 3 * 2, 5);
  });

  test('perfect negative covariance', () => {
    const result = calculateCovariance([1, 2, 3], [6, 4, 2]);
    expect(result).toBeLessThan(0);
  });

  test('zero covariance for constant series', () => {
    const result = calculateCovariance([1, 2, 3], [5, 5, 5]);
    expect(result).toBeCloseTo(0, 10);
  });
});

describe('calculateVariance', () => {
  test('zero variance for constant', () => {
    expect(calculateVariance([5, 5, 5, 5])).toBeCloseTo(0, 10);
  });

  test('known variance', () => {
    const result = calculateVariance([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeGreaterThan(0);
  });

  test('symmetric data', () => {
    const result = calculateVariance([1, 3]);
    expect(result).toBeCloseTo(1, 10);
  });
});

describe('calculateMaxDrawdown edge cases', () => {
  test('monotonically decreasing', () => {
    const result = calculateMaxDrawdown([100, 90, 80, 70]);
    expect(result).toBeCloseTo(0.3, 10);
  });

  test('recovery after drawdown', () => {
    const result = calculateMaxDrawdown([100, 50, 100]);
    expect(result).toBeCloseTo(0.5, 10);
  });
});
