const { CalculateRendJournalier, CalculateRendHebdo, CalculateRendMensuel, calculerRendements, grouperParJour, grouperParMois, grouperParAnnee, grouperTauxParSemaine } = require('../src/functions/utils');

describe('CalculateRendJournalier', () => {
  test('simple daily returns', () => {
    const result = CalculateRendJournalier([100, 110, 105]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(0.1, 10);
    expect(result[1]).toBeCloseTo(-0.04545, 4);
  });

  test('empty array returns empty', () => {
    expect(CalculateRendJournalier([])).toEqual([]);
  });

  test('single value returns empty', () => {
    expect(CalculateRendJournalier([100])).toEqual([]);
  });

  test('constant values return zeros', () => {
    const result = CalculateRendJournalier([100, 100, 100]);
    expect(result).toEqual([0, 0]);
  });
});

describe('CalculateRendHebdo', () => {
  test('weekly returns from grouped values', () => {
    const values = [[100], [110], [105], [120]];
    const result = CalculateRendHebdo(values);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo((100 - 110) / 110, 10);
    expect(result[1]).toBeCloseTo((110 - 105) / 105, 10);
  });
});

describe('CalculateRendMensuel', () => {
  test('monthly returns', () => {
    const values = [[100, 105, 110], [108, 112]];
    const result = CalculateRendMensuel(values);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo((110 - 100) / 100, 10);
    expect(result[1]).toBeCloseTo((108 - 100) / 100, 10);
  });
});

describe('calculerRendements', () => {
  test('calculates returns from date-value pairs', () => {
    const data = [
      { date: '2024-01-03', value: '110' },
      { date: '2024-01-02', value: '100' },
      { date: '2024-01-01', value: '95' },
    ];
    const result = calculerRendements(data);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(110 / 100 - 1, 10);
    expect(result[1]).toBeCloseTo(100 / 95 - 1, 10);
  });
});

describe('grouperParJour', () => {
  test('keeps last entry per day', () => {
    const data = [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-01', value: 105 },
      { date: '2024-01-02', value: 110 },
    ];
    const result = grouperParJour(data);
    expect(result).toHaveLength(2);
  });
});

describe('grouperParMois', () => {
  test('groups by month', () => {
    const data = [
      { date: '2024-01-15', value: 100 },
      { date: '2024-01-30', value: 105 },
      { date: '2024-02-15', value: 110 },
    ];
    const result = grouperParMois(data);
    expect(result).toHaveLength(2);
  });
});

describe('grouperParAnnee', () => {
  test('groups by year', () => {
    const data = [
      { date: '2023-06-15', value: 100 },
      { date: '2023-12-31', value: 105 },
      { date: '2024-03-15', value: 110 },
    ];
    const result = grouperParAnnee(data);
    expect(result).toHaveLength(2);
  });
});

describe('grouperTauxParSemaine', () => {
  test('converts week ID to date', () => {
    const result = grouperTauxParSemaine('2024-01');
    expect(result).toMatch(/^2024-01-0[1-7]$/);
  });

  test('excludes weekends', () => {
    const result = grouperTauxParSemaine('2024-10');
    const day = new Date(result).getDay();
    expect(day).not.toBe(0);
    expect(day).not.toBe(6);
  });
});
