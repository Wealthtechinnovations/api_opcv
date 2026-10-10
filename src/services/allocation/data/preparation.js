'use strict';

const { buildRateIndex, getRate, FIXED_RATES } = require('../../forex.service');

const PREPARATION_VERSION = '1.0.0';

const PERIODS_PER_YEAR = Object.freeze({
  DAILY: 252,
  WEEKLY: 52,
  MONTHLY: 12,
});

const MIN_RETURN_OBSERVATIONS = Object.freeze({
  DAILY: 60,
  WEEKLY: 26,
  MONTHLY: 12,
});

const SUPPORTED_BASE_CURRENCIES = Object.freeze(['LOCAL', 'EUR', 'USD']);

const VALUE_FIELDS = Object.freeze({
  NAV: Object.freeze({
    LOCAL: 'value',
    EUR: 'value_EUR',
    USD: 'value_USD',
  }),
  TOTAL_RETURN: Object.freeze({
    LOCAL: 'vl_ajuste',
    EUR: 'vl_ajuste_EUR',
    USD: 'vl_ajuste_USD',
  }),
});

class AllocationDataError extends Error {
  constructor(errors, message = 'Allocation data preparation failed') {
    super(message);
    this.name = 'AllocationDataError';
    this.code = 'ALLOCATION_DATA_INVALID';
    this.statusCode = 422;
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}

function issue(path, code, message, meta) {
  return {
    path,
    code,
    message,
    ...(meta ? { meta } : {}),
  };
}

function asFinite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseDate(value, path = 'date') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AllocationDataError(issue(path, 'INVALID_DATE', 'Date attendue au format YYYY-MM-DD.'));
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AllocationDataError(issue(path, 'INVALID_DATE', 'Date calendrier invalide.'));
  }
  return date;
}

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

function subtractYears(dateValue, years) {
  const date = parseDate(dateValue);
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  // JS transforme 29/02 en mars certaines annees; revenir au dernier jour de fevrier.
  if (date.getUTCMonth() !== month) {
    date.setUTCDate(0);
  } else if (date.getUTCDate() !== day) {
    date.setUTCDate(0);
  }
  return dateString(date);
}

function resolveWindow(dataContract, availableCutoff) {
  const contract = dataContract || {};
  const horizon = String(contract.horizon || '3Y').toUpperCase();
  const available = parseDate(availableCutoff, 'available_cutoff');
  const requestedTo = contract.date_to ? parseDate(contract.date_to, 'data.date_to') : available;
  const effectiveTo = requestedTo.getTime() < available.getTime() ? requestedTo : available;
  const dateTo = dateString(effectiveTo);

  if (horizon === 'CUSTOM') {
    if (!contract.date_from) {
      throw new AllocationDataError(issue('data.date_from', 'CUSTOM_DATE_FROM_REQUIRED', 'date_from est requis pour horizon=CUSTOM.'));
    }
    const from = parseDate(contract.date_from, 'data.date_from');
    if (from.getTime() >= effectiveTo.getTime()) {
      throw new AllocationDataError(issue('data', 'INVALID_DATE_WINDOW', 'date_from doit etre strictement anterieure a date_to.'));
    }
    return {
      horizon,
      date_from: dateString(from),
      date_to: dateTo,
      available_cutoff: availableCutoff,
    };
  }

  if (horizon === 'MAX') {
    return {
      horizon,
      date_from: null,
      date_to: dateTo,
      available_cutoff: availableCutoff,
    };
  }

  const years = { '1Y': 1, '3Y': 3, '5Y': 5 }[horizon];
  if (!years) {
    throw new AllocationDataError(issue('data.horizon', 'UNSUPPORTED_HORIZON', 'Horizons supportes: 1Y, 3Y, 5Y, MAX, CUSTOM.'));
  }

  return {
    horizon,
    date_from: subtractYears(dateTo, years),
    date_to: dateTo,
    available_cutoff: availableCutoff,
  };
}

function normalizePeriodicity(value) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (['journaliere', 'journalier', 'daily', 'quotidienne', 'quotidien'].includes(text)) return 'DAILY';
  if (['hebdomadaire', 'weekly', 'semaine'].includes(text)) return 'WEEKLY';
  if (['mensuelle', 'mensuel', 'monthly', 'mois'].includes(text)) return 'MONTHLY';
  return null;
}

function resolveFrequency(requestedFrequency, funds) {
  const requested = String(requestedFrequency || 'AUTO').toUpperCase();
  if (requested !== 'AUTO') {
    if (!PERIODS_PER_YEAR[requested]) {
      throw new AllocationDataError(issue('data.frequency', 'UNSUPPORTED_FREQUENCY', 'Frequences supportees: AUTO, DAILY, WEEKLY, MONTHLY.'));
    }
    return requested;
  }

  const resolved = (funds || []).map((fund, index) => {
    const value = normalizePeriodicity(fund && fund.periodicite);
    if (!value) {
      throw new AllocationDataError(issue(
        `funds[${index}].periodicite`,
        'UNKNOWN_FUND_FREQUENCY',
        'Periodicite fonds non reconnue; AUTO ne peut pas inventer une frequence.',
        { fund_id: fund && fund.id, periodicite: fund && fund.periodicite }
      ));
    }
    return value;
  });

  if (!resolved.length) {
    throw new AllocationDataError(issue('funds', 'FUNDS_REQUIRED', 'Au moins un fonds est requis pour resoudre la frequence.'));
  }

  // Univers mixtes: travailler a la frequence la plus lente pour eviter de
  // fabriquer artificiellement des observations sur les fonds moins frequents.
  if (resolved.includes('MONTHLY')) return 'MONTHLY';
  if (resolved.includes('WEEKLY')) return 'WEEKLY';
  return 'DAILY';
}

function isoWeekKey(dateValue) {
  const date = parseDate(dateValue);
  const copy = new Date(date.getTime());
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const isoYear = copy.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil((((copy - yearStart) / 86400000) + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function periodKey(dateValue, frequency) {
  parseDate(dateValue);
  if (frequency === 'DAILY') return dateValue;
  if (frequency === 'MONTHLY') return dateValue.slice(0, 7);
  if (frequency === 'WEEKLY') return isoWeekKey(dateValue);
  throw new AllocationDataError(issue('frequency', 'UNSUPPORTED_FREQUENCY', `Frequence non supportee: ${frequency}`));
}

function resolveValueField(returnMethod, baseCurrency) {
  const method = String(returnMethod || 'TOTAL_RETURN').toUpperCase();
  const currency = String(baseCurrency || 'LOCAL').toUpperCase();

  if (!VALUE_FIELDS[method]) {
    throw new AllocationDataError(issue('data.return_method', 'UNSUPPORTED_RETURN_METHOD', 'Methodes supportees: TOTAL_RETURN, NAV.'));
  }

  if (SUPPORTED_BASE_CURRENCIES.includes(currency)) {
    return {
      return_method: method,
      base_currency: currency,
      value_field: VALUE_FIELDS[method][currency],
      conversion_mode: 'DIRECT',
      fx_pair: null,
    };
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new AllocationDataError(issue(
      'universe.base_currency',
      'INVALID_BASE_CURRENCY',
      'La devise de base doit etre LOCAL ou un code ISO 4217 sur 3 lettres.',
      { base_currency: currency }
    ));
  }

  // AfricaFunds stocke deja une serie EUR par VL. Pour une autre devise cible,
  // on repart de cette serie et on applique la paire EUR/<TARGET> historique.
  return {
    return_method: method,
    base_currency: currency,
    value_field: VALUE_FIELDS[method].EUR,
    conversion_mode: 'EUR_CROSS',
    fx_pair: `EUR/${currency}`,
  };
}

function buildValueResolver(valueSpec, fxRows = []) {
  if (valueSpec.conversion_mode === 'DIRECT') {
    return {
      resolve(row) {
        return asFinite(row[valueSpec.value_field]);
      },
      fx_source: null,
    };
  }

  const pair = valueSpec.fx_pair;
  const fixedRate = FIXED_RATES[pair] || null;
  const index = fixedRate ? null : buildRateIndex(fxRows || [], pair);

  if (!fixedRate && (!index || index.dates.length === 0)) {
    throw new AllocationDataError(issue(
      'fx_rows',
      'FX_PAIR_REQUIRED',
      `Aucune serie FX disponible pour ${pair}.`,
      { pair }
    ));
  }

  return {
    resolve(row) {
      const eurValue = asFinite(row[valueSpec.value_field]);
      if (eurValue === null || eurValue <= 0) return null;
      const rate = fixedRate || getRate(index, row.date);
      if (!rate || !Number.isFinite(Number(rate)) || Number(rate) <= 0) return null;
      return eurValue * Number(rate);
    },
    fx_source: fixedRate
      ? { pair, type: 'FIXED_RATE', value: fixedRate }
      : { pair, type: 'HISTORICAL_DEVISedechanges' },
  };
}

function latestAvailableCutoff(funds, valuationsByFund) {
  const lastDates = [];
  for (const fund of funds) {
    const rows = valuationsByFund[String(fund.id)] || valuationsByFund[fund.id] || [];
    const validDates = rows
      .map(row => row && row.date)
      .filter(date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort();
    if (!validDates.length) {
      throw new AllocationDataError(issue(
        `valuations.${fund.id}`,
        'NO_VALUATIONS',
        'Aucune valorisation disponible pour le fonds.',
        { fund_id: fund.id }
      ));
    }
    lastDates.push(validDates[validDates.length - 1]);
  }
  return lastDates.sort()[0];
}

function normalizeFundSeries({
  fund,
  rows,
  frequency,
  valueField,
  valueResolver,
  window,
}) {
  const warnings = [];
  const perPeriod = new Map();
  let rejectedRows = 0;

  const ordered = [...(rows || [])]
    .filter(row => row && typeof row.date === 'string')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  for (const row of ordered) {
    let rowDate;
    try {
      rowDate = parseDate(row.date, `valuations.${fund.id}.date`);
    } catch (error) {
      rejectedRows += 1;
      continue;
    }

    if (window.date_from && row.date < window.date_from) continue;
    if (row.date > window.date_to) continue;

    const value = valueResolver(row);
    if (value === null || value <= 0) {
      rejectedRows += 1;
      continue;
    }

    const key = periodKey(row.date, frequency);
    const current = perPeriod.get(key);
    if (!current || rowDate.getTime() >= parseDate(current.date).getTime()) {
      perPeriod.set(key, {
        period: key,
        date: row.date,
        value,
      });
    }
  }

  const observations = [...perPeriod.values()].sort((a, b) => a.period.localeCompare(b.period));

  if (rejectedRows > 0) {
    warnings.push({
      code: 'ROWS_REJECTED_INVALID_VALUE_OR_DATE',
      fund_id: fund.id,
      count: rejectedRows,
      value_field: valueField,
    });
  }

  return {
    fund_id: Number(fund.id),
    fund_name: fund.nom_fond || null,
    currency: fund.dev_libelle || null,
    periodicity: fund.periodicite || null,
    observations,
    warnings,
  };
}

function intersectPeriods(seriesList) {
  if (!seriesList.length) return [];
  let common = new Set(seriesList[0].observations.map(item => item.period));
  for (const series of seriesList.slice(1)) {
    const current = new Set(series.observations.map(item => item.period));
    common = new Set([...common].filter(period => current.has(period)));
  }
  return [...common].sort();
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleCovariance(left, right) {
  if (left.length !== right.length || left.length < 2) {
    throw new AllocationDataError(issue('returns_matrix', 'INSUFFICIENT_COVARIANCE_OBSERVATIONS', 'Au moins deux observations alignees sont requises.'));
  }
  const meanLeft = mean(left);
  const meanRight = mean(right);
  let sum = 0;
  for (let i = 0; i < left.length; i += 1) {
    sum += (left[i] - meanLeft) * (right[i] - meanRight);
  }
  return sum / (left.length - 1);
}

function covarianceMatrix(returnsMatrix, periodsPerYear, options = {}) {
  const method = String(options.method || 'SAMPLE').toUpperCase();
  const lambda = options.shrinkage_lambda === undefined
    ? 0.10
    : asFinite(options.shrinkage_lambda);

  if (!['SAMPLE', 'DIAGONAL_SHRINKAGE'].includes(method)) {
    throw new AllocationDataError(issue('covariance.method', 'UNSUPPORTED_COVARIANCE_METHOD', 'Methodes supportees: SAMPLE, DIAGONAL_SHRINKAGE.'));
  }
  if (method === 'DIAGONAL_SHRINKAGE' && (lambda === null || lambda < 0 || lambda > 1)) {
    throw new AllocationDataError(issue('covariance.shrinkage_lambda', 'INVALID_SHRINKAGE_LAMBDA', 'shrinkage_lambda doit etre compris entre 0 et 1.'));
  }

  const n = returnsMatrix.length;
  const sample = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = i; j < n; j += 1) {
      const annualized = sampleCovariance(returnsMatrix[i], returnsMatrix[j]) * periodsPerYear;
      sample[i][j] = annualized;
      sample[j][i] = annualized;
    }
  }

  if (method === 'SAMPLE') {
    return {
      method,
      shrinkage_lambda: null,
      assume_zero_mean: false,
      matrix: sample,
    };
  }

  const shrunk = sample.map((row, i) => row.map((value, j) => (
    i === j ? value : value * (1 - lambda)
  )));

  return {
    method,
    shrinkage_lambda: lambda,
    assume_zero_mean: false,
    matrix: shrunk,
  };
}

function normalizeRiskFree(input) {
  if (!input || input.annual_rate === undefined || input.annual_rate === null || input.annual_rate === '') {
    return {
      annual_rate: null,
      source: 'NOT_CONFIGURED',
      as_of: null,
    };
  }
  const annualRate = asFinite(input.annual_rate);
  if (annualRate === null || annualRate <= -1 || annualRate > 10) {
    throw new AllocationDataError(issue('risk_free.annual_rate', 'INVALID_RISK_FREE_RATE', 'Le taux sans risque annuel doit etre un decimal fini > -1 et <= 10.'));
  }
  if (!input.source) {
    throw new AllocationDataError(issue('risk_free.source', 'RISK_FREE_SOURCE_REQUIRED', 'La source du taux sans risque est obligatoire.'));
  }
  if (input.as_of) parseDate(input.as_of, 'risk_free.as_of');

  return {
    annual_rate: annualRate,
    source: String(input.source),
    as_of: input.as_of || null,
  };
}

function prepareAllocationData({
  request,
  funds,
  valuations_by_fund,
  fx_rows,
  covariance,
  risk_free,
}) {
  if (!request || !request.universe || !Array.isArray(request.universe.fund_ids)) {
    throw new AllocationDataError(issue('request', 'CANONICAL_REQUEST_REQUIRED', 'Le contrat canonique V2 normalise est requis.'));
  }

  const requestedIds = request.universe.fund_ids.map(Number);
  const fundMap = new Map((funds || []).map(fund => [Number(fund.id), fund]));
  const orderedFunds = requestedIds.map(id => fundMap.get(id));

  const missing = requestedIds.filter((id, index) => !orderedFunds[index]);
  if (missing.length) {
    throw new AllocationDataError(issue('funds', 'FUND_MASTER_MISSING', 'Certains fonds demandes sont absents du Fund Master fourni.', { fund_ids: missing }));
  }

  const frequency = resolveFrequency(request.data && request.data.frequency, orderedFunds);
  const periodsPerYear = PERIODS_PER_YEAR[frequency];
  const valueSpec = resolveValueField(
    request.data && request.data.return_method,
    request.universe.base_currency
  );
  const valueResolver = buildValueResolver(valueSpec, fx_rows || []);

  const availableCutoff = latestAvailableCutoff(orderedFunds, valuations_by_fund || {});
  const window = resolveWindow(request.data || {}, availableCutoff);

  const series = orderedFunds.map(fund => normalizeFundSeries({
    fund,
    rows: (valuations_by_fund || {})[String(fund.id)] || (valuations_by_fund || {})[fund.id] || [],
    frequency,
    valueField: valueSpec.value_field,
    valueResolver: valueResolver.resolve,
    window,
  }));

  const commonPeriods = intersectPeriods(series);
  const minimumReturns = MIN_RETURN_OBSERVATIONS[frequency];
  if (commonPeriods.length - 1 < minimumReturns) {
    throw new AllocationDataError(issue(
      'aligned_periods',
      'INSUFFICIENT_HISTORY',
      'Historique aligne insuffisant pour l optimisation.',
      {
        frequency,
        aligned_values: commonPeriods.length,
        return_observations: Math.max(0, commonPeriods.length - 1),
        minimum_return_observations: minimumReturns,
        horizon: window.horizon,
      }
    ));
  }

  const valuesMatrix = [];
  const returnsMatrix = [];
  const coverageByFund = [];

  for (const fundSeries of series) {
    const lookup = new Map(fundSeries.observations.map(item => [item.period, item]));
    const values = commonPeriods.map(period => lookup.get(period).value);
    const returns = [];
    for (let i = 1; i < values.length; i += 1) {
      const value = values[i] / values[i - 1] - 1;
      if (!Number.isFinite(value)) {
        throw new AllocationDataError(issue(
          `returns.${fundSeries.fund_id}[${i - 1}]`,
          'NON_FINITE_RETURN',
          'Rendement non fini detecte.',
          { fund_id: fundSeries.fund_id }
        ));
      }
      returns.push(value);
    }
    valuesMatrix.push(values);
    returnsMatrix.push(returns);
    coverageByFund.push({
      fund_id: fundSeries.fund_id,
      raw_periods: fundSeries.observations.length,
      aligned_periods: commonPeriods.length,
      coverage_ratio: fundSeries.observations.length
        ? commonPeriods.length / fundSeries.observations.length
        : 0,
      warnings: fundSeries.warnings,
    });
  }

  const expectedReturns = returnsMatrix.map(values => mean(values) * periodsPerYear);
  const covarianceResult = covarianceMatrix(returnsMatrix, periodsPerYear, covariance || {});
  const riskFree = normalizeRiskFree(risk_free);

  return {
    preparation_version: PREPARATION_VERSION,
    units: {
      return: 'ANNUAL_DECIMAL',
      volatility: 'ANNUAL_DECIMAL',
      covariance: 'ANNUAL_DECIMAL_SQUARED',
      weight: 'DECIMAL',
    },
    universe: {
      fund_ids: requestedIds,
      base_currency: valueSpec.base_currency,
    },
    data: {
      horizon: window.horizon,
      date_from: window.date_from,
      date_to: window.date_to,
      available_cutoff: window.available_cutoff,
      frequency,
      periods_per_year: periodsPerYear,
      return_method: valueSpec.return_method,
      value_field: valueSpec.value_field,
      aligned_periods: commonPeriods,
      return_periods: commonPeriods.slice(1),
    },
    statistics: {
      returns_matrix: returnsMatrix,
      expected_returns_annualized: expectedReturns,
      covariance_matrix_annualized: covarianceResult.matrix,
      covariance: {
        method: covarianceResult.method,
        shrinkage_lambda: covarianceResult.shrinkage_lambda,
        assume_zero_mean: covarianceResult.assume_zero_mean,
      },
      risk_free: riskFree,
    },
    quality: {
      status: 'PASS',
      minimum_return_observations: minimumReturns,
      aligned_value_observations: commonPeriods.length,
      return_observations: commonPeriods.length - 1,
      coverage_by_fund: coverageByFund,
    },
    provenance: {
      fund_master_reused: true,
      valuation_table_reused: true,
      value_field: valueSpec.value_field,
      base_currency: valueSpec.base_currency,
      return_method: valueSpec.return_method,
      conversion_mode: valueSpec.conversion_mode,
      fx: valueResolver.fx_source,
      no_limit_500: true,
      exact_date_intersection_used: false,
      period_level_alignment: true,
    },
  };
}

module.exports = {
  PREPARATION_VERSION,
  PERIODS_PER_YEAR,
  MIN_RETURN_OBSERVATIONS,
  SUPPORTED_BASE_CURRENCIES,
  VALUE_FIELDS,
  AllocationDataError,
  normalizePeriodicity,
  resolveFrequency,
  resolveWindow,
  periodKey,
  resolveValueField,
  buildValueResolver,
  covarianceMatrix,
  normalizeRiskFree,
  prepareAllocationData,
};
