const {
  EUR_XAF,
  EUR_XOF,
  buildRateIndex,
  getRate,
  convertToEUR,
  convertToUSD,
  isFixedCFA,
} = require('../src/services/forex.service');

describe('buildRateIndex()', () => {
  test('builds index from rows', () => {
    const rows = [
      { paire: 'EUR/MAD', date: '2024-01-01', value: 10.85 },
      { paire: 'EUR/MAD', date: '2024-01-02', value: 10.86 },
      { paire: 'USD/MAD', date: '2024-01-01', value: 9.95 },
    ];
    const index = buildRateIndex(rows, 'EUR/MAD');
    expect(index.dates).toHaveLength(2);
    expect(index.map['2024-01-01']).toBe(10.85);
    expect(index.map['2024-01-02']).toBe(10.86);
  });

  test('ignores zero values', () => {
    const rows = [{ paire: 'EUR/MAD', date: '2024-01-01', value: 0 }];
    const index = buildRateIndex(rows, 'EUR/MAD');
    expect(index.dates).toHaveLength(0);
  });
});

describe('getRate()', () => {
  const rows = [
    { paire: 'EUR/MAD', date: '2024-01-01', value: 10.85 },
    { paire: 'EUR/MAD', date: '2024-01-03', value: 10.87 },
    { paire: 'EUR/MAD', date: '2024-01-05', value: 10.90 },
  ];
  const index = buildRateIndex(rows, 'EUR/MAD');

  test('finds exact date', () => {
    expect(getRate(index, '2024-01-03')).toBe(10.87);
  });

  test('finds closest prior date', () => {
    expect(getRate(index, '2024-01-04')).toBe(10.87);
  });

  test('returns first date for before all dates', () => {
    expect(getRate(index, '2023-12-31')).toBe(10.85);
  });

  test('returns null for empty index', () => {
    expect(getRate({ map: {}, dates: [] }, '2024-01-01')).toBeNull();
  });
});

describe('convertToEUR()', () => {
  test('converts MAD to EUR with division', () => {
    expect(convertToEUR(108.5, 'MAD', 10.85)).toBeCloseTo(10);
  });

  test('returns value as-is for EUR', () => {
    expect(convertToEUR(100, 'EUR', 10.85)).toBe(100);
  });

  test('returns null for zero rate', () => {
    expect(convertToEUR(100, 'MAD', 0)).toBeNull();
  });

  test('returns null for null value', () => {
    expect(convertToEUR(null, 'MAD', 10.85)).toBeNull();
  });
});

describe('convertToUSD()', () => {
  test('converts MAD to USD', () => {
    expect(convertToUSD(99.5, 'MAD', 9.95)).toBeCloseTo(10);
  });

  test('returns value as-is for USD', () => {
    expect(convertToUSD(100, 'USD', 9.95)).toBe(100);
  });
});

describe('isFixedCFA()', () => {
  test('XOF is fixed CFA', () => {
    expect(isFixedCFA('XOF')).toBe(true);
  });

  test('XAF is fixed CFA', () => {
    expect(isFixedCFA('XAF')).toBe(true);
  });

  test('MAD is not fixed CFA', () => {
    expect(isFixedCFA('MAD')).toBe(false);
  });
});

describe('fixed rates', () => {
  test('EUR/XAF parity', () => {
    expect(EUR_XAF).toBe(655.957);
  });

  test('EUR/XOF parity', () => {
    expect(EUR_XOF).toBe(655.957);
  });
});
