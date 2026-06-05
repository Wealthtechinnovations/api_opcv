const { calculatePerformance, calculateAnnualizedPerformance, calculateAnnualizedPerformanceper100 } = require('../src/functions/performances');

describe('calculatePerformance', () => {
  test('positive performance', () => {
    expect(calculatePerformance(110, 100)).toBe(10);
  });

  test('negative performance', () => {
    expect(calculatePerformance(90, 100)).toBe(-10);
  });

  test('zero change returns 0', () => {
    expect(calculatePerformance(100, 100)).toBe(0);
  });

  test('returns null for zero previousValue', () => {
    expect(calculatePerformance(100, 0)).toBeNull();
  });

  test('returns null for null previousValue', () => {
    expect(calculatePerformance(100, null)).toBeNull();
  });

  test('handles large values', () => {
    expect(calculatePerformance(200, 100)).toBe(100);
  });

  test('handles decimal values', () => {
    const result = calculatePerformance(105.5, 100);
    expect(result).toBeCloseTo(5.5, 10);
  });
});

describe('calculateAnnualizedPerformance', () => {
  test('1 year annualization equals simple performance', () => {
    const result = calculateAnnualizedPerformance(110, 100, 1);
    expect(result).toBeCloseTo(0.10, 10);
  });

  test('3 year annualization', () => {
    const result = calculateAnnualizedPerformance(133.1, 100, 3);
    expect(result).toBeCloseTo(0.10, 2);
  });

  test('returns null for zero years', () => {
    expect(calculateAnnualizedPerformance(110, 100, 0)).toBeNull();
  });

  test('returns null for negative years', () => {
    expect(calculateAnnualizedPerformance(110, 100, -1)).toBeNull();
  });

  test('returns null when previousValue is 0', () => {
    expect(calculateAnnualizedPerformance(110, 0, 1)).toBeNull();
  });
});

describe('calculateAnnualizedPerformanceper100', () => {
  test('returns percentage', () => {
    const result = calculateAnnualizedPerformanceper100(110, 100, 1);
    expect(result).toBeCloseTo(10, 10);
  });

  test('3 year annualized percentage', () => {
    const result = calculateAnnualizedPerformanceper100(133.1, 100, 3);
    expect(result).toBeCloseTo(10, 1);
  });

  test('returns null for invalid inputs', () => {
    expect(calculateAnnualizedPerformanceper100(110, 0, 1)).toBeNull();
    expect(calculateAnnualizedPerformanceper100(110, 100, 0)).toBeNull();
  });
});
