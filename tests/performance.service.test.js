const {
  perf,
  findValueAtDate,
  findValueAtYearsAgo,
  findValueAtMonthsAgo,
  findValueAtWeeksAgo,
  findValueAtJanuary1,
  findLastDateOfPreviousMonth,
  calculateAllPerformances,
} = require('../src/services/performance.service');

describe('perf()', () => {
  test('calculates positive performance', () => {
    expect(perf(110, 100)).toBeCloseTo(10);
  });

  test('calculates negative performance', () => {
    expect(perf(90, 100)).toBeCloseTo(-10);
  });

  test('returns 0 for identical values', () => {
    expect(perf(100, 100)).toBe(0);
  });

  test('returns null for zero previous', () => {
    expect(perf(100, 0)).toBeNull();
  });

  test('returns null for null current', () => {
    expect(perf(null, 100)).toBeNull();
  });

  test('returns null for null previous', () => {
    expect(perf(100, null)).toBeNull();
  });
});

describe('findValueAtDate()', () => {
  const dates = [
    new Date('2024-01-01'),
    new Date('2024-02-01'),
    new Date('2024-03-01'),
    new Date('2024-04-01'),
  ];
  const values = [100, 105, 110, 108];

  test('finds exact date match', () => {
    expect(findValueAtDate(dates, values, new Date('2024-02-01'))).toBe(105);
  });

  test('finds closest prior date', () => {
    expect(findValueAtDate(dates, values, new Date('2024-02-15'))).toBe(105);
  });

  test('returns first value for date before all', () => {
    expect(findValueAtDate(dates, values, new Date('2023-01-01'))).toBe(100);
  });

  test('returns null for empty arrays', () => {
    expect(findValueAtDate([], [], new Date('2024-01-01'))).toBeNull();
  });
});

describe('findValueAtYearsAgo()', () => {
  const dates = [
    new Date('2023-01-01'),
    new Date('2023-06-01'),
    new Date('2024-01-01'),
    new Date('2024-06-01'),
  ];
  const values = [100, 105, 110, 115];

  test('finds value 1 year ago', () => {
    expect(findValueAtYearsAgo(dates, values, new Date('2024-06-01'), 1)).toBe(105);
  });
});

describe('findValueAtMonthsAgo()', () => {
  const dates = [
    new Date('2024-01-01'),
    new Date('2024-02-01'),
    new Date('2024-03-01'),
    new Date('2024-04-01'),
  ];
  const values = [100, 105, 110, 108];

  test('finds value 3 months ago', () => {
    expect(findValueAtMonthsAgo(dates, values, new Date('2024-04-01'), 3)).toBe(100);
  });
});

describe('findValueAtJanuary1()', () => {
  const dates = [
    new Date('2023-12-28'),
    new Date('2024-01-02'),
    new Date('2024-02-01'),
  ];
  const values = [100, 102, 105];

  test('finds closest value to Jan 1', () => {
    expect(findValueAtJanuary1(dates, values, new Date('2024-02-01'))).toBe(100);
  });
});

describe('calculateAllPerformances()', () => {
  test('calculates all periods for simple case', () => {
    const dates = [];
    const values = [];
    const start = new Date('2019-01-01');
    for (let i = 0; i < 2000; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
      values.push(100 + i * 0.1);
    }

    const lastDate = dates[dates.length - 1];
    const result = calculateAllPerformances(dates, values, lastDate);

    expect(result).not.toBeNull();
    expect(result.perf_veille).toBeCloseTo(0.033, 1);
    expect(result.perf_ytd).toBeDefined();
    expect(result.perf_1an).toBeDefined();
    expect(result.perf_depuis_creation).toBeDefined();
    expect(result.perf_depuis_creation).toBeGreaterThan(0);
  });

  test('returns null for empty/zero values', () => {
    expect(calculateAllPerformances([], [], new Date())).toBeNull();
  });
});
