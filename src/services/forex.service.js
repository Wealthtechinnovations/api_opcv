/**
 * Forex conversion service — pure functions for currency conversion.
 * Reference logic from recalc_eur_usd_daily_rate.js.
 */

const EUR_XAF = 655.957;
const EUR_XOF = 655.957;

const FIXED_RATES = {
  'EUR/XAF': EUR_XAF,
  'EUR/XOF': EUR_XOF,
};

function buildRateIndex(rows, paire) {
  const map = {};
  for (const r of rows) {
    if (r.paire !== paire) continue;
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
    if (r.value > 0) map[d] = r.value;
  }
  return { map, dates: Object.keys(map).sort() };
}

function getRate(index, date) {
  if (!index || index.dates.length === 0) return null;
  if (index.map[date]) return index.map[date];
  let lo = 0, hi = index.dates.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (index.dates[mid] <= date) lo = mid + 1;
    else hi = mid - 1;
  }
  if (hi >= 0) return index.map[index.dates[hi]];
  return index.map[index.dates[0]];
}

function convertToEUR(value, devise, eurRate) {
  if (!value || value === 0) return null;
  if (devise === 'EUR') return value;
  if (!eurRate || eurRate === 0) return null;
  return value / eurRate;
}

function convertToUSD(value, devise, usdRate) {
  if (!value || value === 0) return null;
  if (devise === 'USD') return value;
  if (!usdRate || usdRate === 0) return null;
  return value / usdRate;
}

function isFixedCFA(devise) {
  return devise === 'XOF' || devise === 'XAF';
}

module.exports = {
  EUR_XAF,
  EUR_XOF,
  FIXED_RATES,
  buildRateIndex,
  getRate,
  convertToEUR,
  convertToUSD,
  isFixedCFA,
};
