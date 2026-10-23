const { findNearestDateAnnualized, findNearestDateMonthlized, findLastDateOfPreviousMonth, groupDatesByYear, groupDatesByMonth, findNearestDate, findNearestDateWeek, findNearestDateJanuary, findLastDatesForEachPreviousYear } = require('../src/functions/dates');

const sampleDates = ['2023-01-15', '2023-06-30', '2023-12-31', '2024-03-15', '2024-06-28'];

describe('findNearestDateAnnualized', () => {
  test('finds date 1 year before reference', () => {
    // target = 2023-06-28, nearest before that is 2023-01-15
    const result = findNearestDateAnnualized(sampleDates, 1, '2024-06-28');
    expect(result).toBe('2023-01-15');
  });

  test('finds date 1 year before end-of-year', () => {
    // target = 2022-12-31, nearest before is null → fallback to findLastDateOfPreviousMonth
    const result = findNearestDateAnnualized(sampleDates, 1, '2023-12-31');
    expect(result).toBeDefined();
  });
});

describe('findNearestDateMonthlized', () => {
  test('finds date 3 months before reference', () => {
    // target = 2024-03-28, nearest before is 2024-03-15
    const result = findNearestDateMonthlized(sampleDates, 3, '2024-06-28');
    expect(result).toBe('2024-03-15');
  });

  test('finds date 6 months before reference', () => {
    // target = 2023-12-28, nearest before is 2023-06-30
    const result = findNearestDateMonthlized(sampleDates, 6, '2024-06-28');
    expect(result).toBe('2023-06-30');
  });
});

describe('findLastDateOfPreviousMonth', () => {
  test('finds last date of month before the last date in array', () => {
    const result = findLastDateOfPreviousMonth(['2024-05-15', '2024-05-31', '2024-06-15', '2024-06-28']);
    expect(result).toBe('2024-05-31');
  });
});

describe('findNearestDate', () => {
  test('finds date N years before last date in array', () => {
    // last date = 2024-06-28, target = 2023-06-28, nearest before = 2023-01-15
    const result = findNearestDate(sampleDates, 1);
    expect(result).toBe('2023-01-15');
  });
});

describe('findNearestDateWeek', () => {
  test('finds date 4 weeks before last date', () => {
    // last = 2024-06-28, target = 2024-05-31, nearest before = 2024-03-15
    const result = findNearestDateWeek(sampleDates);
    expect(result).toBe('2024-03-15');
  });
});

describe('findNearestDateJanuary', () => {
  test('finds nearest date to Jan 1 of last year in array', () => {
    // last = 2024-06-28, Jan 1 2024, nearest before = 2023-12-31
    const result = findNearestDateJanuary(sampleDates);
    expect(result).toBe('2023-12-31');
  });
});

describe('findLastDatesForEachPreviousYear', () => {
  test('returns last dates for previous years', () => {
    const result = findLastDatesForEachPreviousYear(sampleDates);
    expect(result).toContain('2023-12-31');
  });
});

describe('groupDatesByYear', () => {
  test('groups dates by year', () => {
    const result = groupDatesByYear(sampleDates);
    expect(result.length).toBe(2);
  });

  test('first group contains 2023 dates', () => {
    const result = groupDatesByYear(sampleDates);
    expect(result[0].length).toBe(3);
  });
});

describe('groupDatesByMonth', () => {
  test('groups dates by month', () => {
    const result = groupDatesByMonth(sampleDates);
    expect(result.length).toBe(5);
  });
});
