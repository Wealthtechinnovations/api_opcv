/**
 * Performance calculation service — pure functions for fund performance.
 * Extracted from fix_populate_performances.js and apigestionsavequotidien.js.
 */

function perf(current, previous) {
  if (!previous || previous === 0 || current == null || previous == null) return null;
  if (current === previous) return 0;
  return ((current - previous) / previous) * 100;
}

function findValueAtDate(dates, values, targetDate) {
  const targetTs = targetDate.getTime();
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i].getTime();
    if (d <= targetTs) {
      const diff = targetTs - d;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
      break;
    }
  }
  if (bestIdx === -1 && dates.length > 0) bestIdx = 0;
  return bestIdx >= 0 ? values[bestIdx] : null;
}

function findValueAtYearsAgo(dates, values, refDate, years) {
  const target = new Date(refDate);
  target.setFullYear(target.getFullYear() - years);
  return findValueAtDate(dates, values, target);
}

function findValueAtMonthsAgo(dates, values, refDate, months) {
  const target = new Date(refDate);
  target.setMonth(target.getMonth() - months);
  return findValueAtDate(dates, values, target);
}

function findValueAtWeeksAgo(dates, values, refDate, weeks) {
  const target = new Date(refDate);
  target.setDate(target.getDate() - weeks * 7);
  return findValueAtDate(dates, values, target);
}

function findValueAtJanuary1(dates, values, refDate) {
  const year = refDate.getFullYear();
  const jan1 = new Date(year, 0, 1);
  return findValueAtDate(dates, values, jan1);
}

function findLastDateOfPreviousMonth(dates, values, refDate) {
  const prevMonthEnd = new Date(refDate.getFullYear(), refDate.getMonth(), 0);
  return findValueAtDate(dates, values, prevMonthEnd);
}

function calculateAllPerformances(dates, values, refDate) {
  const currentValue = values[values.length - 1];
  if (!currentValue || currentValue <= 0) return null;

  const prevValue = values.length >= 2 ? values[values.length - 2] : null;
  const prevMonthValue = findLastDateOfPreviousMonth(dates, values, refDate);
  const ytdValue = findValueAtJanuary1(dates, values, refDate);
  const w4Value = findValueAtWeeksAgo(dates, values, refDate, 4);
  const m3Value = findValueAtMonthsAgo(dates, values, refDate, 3);
  const m6Value = findValueAtMonthsAgo(dates, values, refDate, 6);
  const y1Value = findValueAtYearsAgo(dates, values, refDate, 1);
  const y3Value = findValueAtYearsAgo(dates, values, refDate, 3);
  const y5Value = findValueAtYearsAgo(dates, values, refDate, 5);
  const y10Value = findValueAtYearsAgo(dates, values, refDate, 10);
  const firstValue = values[0];

  return {
    perf_veille: perf(currentValue, prevValue),
    perf_mois: perf(currentValue, prevMonthValue),
    perf_ytd: perf(currentValue, ytdValue),
    perf_4semaines: perf(currentValue, w4Value),
    perf_3mois: perf(currentValue, m3Value),
    perf_6mois: perf(currentValue, m6Value),
    perf_1an: perf(currentValue, y1Value),
    perf_3ans: perf(currentValue, y3Value),
    perf_5ans: perf(currentValue, y5Value),
    perf_10ans: perf(currentValue, y10Value),
    perf_depuis_creation: perf(currentValue, firstValue),
  };
}

module.exports = {
  perf,
  findValueAtDate,
  findValueAtYearsAgo,
  findValueAtMonthsAgo,
  findValueAtWeeksAgo,
  findValueAtJanuary1,
  findLastDateOfPreviousMonth,
  calculateAllPerformances,
};
