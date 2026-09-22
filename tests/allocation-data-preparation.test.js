const {
  AllocationDataError,
  resolveFrequency,
  periodKey,
  covarianceMatrix,
  normalizeRiskFree,
  prepareAllocationData,
} = require('../src/services/allocation/data/preparation');
const { createAllocationDataProvider } = require('../src/services/allocation/data/provider');

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function monthlyRows({
  start = '2022-01-31',
  count = 48,
  initial = 100,
  monthlyReturn = 0.01,
  dayOffset = 0,
  navReturn = null,
}) {
  const rows = [];
  const [year, month] = start.slice(0, 7).split('-').map(Number);
  let adjusted = initial;
  let nav = initial;

  for (let i = 0; i < count; i += 1) {
    const d = new Date(Date.UTC(year, month - 1 + i + 1, 0));
    d.setUTCDate(Math.max(1, d.getUTCDate() + dayOffset));

    if (i > 0) {
      adjusted *= 1 + monthlyReturn;
      nav *= 1 + (navReturn === null ? monthlyReturn : navReturn);
    }

    rows.push({
      date: isoDate(d),
      value: nav,
      value_EUR: nav * 0.9,
      value_USD: nav * 1.1,
      vl_ajuste: adjusted,
      vl_ajuste_EUR: adjusted * 0.9,
      vl_ajuste_USD: adjusted * 1.1,
    });
  }
  return rows;
}

function dailyRows({
  start = '2024-01-01',
  count = 700,
  initial = 100,
  dailyReturn = 0.0005,
}) {
  const rows = [];
  let value = initial;
  let date = new Date(`${start}T00:00:00.000Z`);
  for (let i = 0; i < count; i += 1) {
    if (i > 0) value *= 1 + dailyReturn;
    rows.push({
      date: isoDate(date),
      value,
      value_EUR: value,
      value_USD: value,
      vl_ajuste: value,
      vl_ajuste_EUR: value,
      vl_ajuste_USD: value,
    });
    date = addDays(date, 1);
  }
  return rows;
}

function request(overrides = {}) {
  return {
    universe: {
      fund_ids: [1, 2],
      base_currency: 'LOCAL',
      ...(overrides.universe || {}),
    },
    data: {
      horizon: '3Y',
      frequency: 'AUTO',
      return_method: 'TOTAL_RETURN',
      date_from: null,
      date_to: null,
      ...(overrides.data || {}),
    },
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => !['universe', 'data'].includes(key))
    ),
  };
}

describe('Allocation data preparation — frequence et calendrier', () => {
  test('AUTO choisit la frequence la plus lente de l univers', () => {
    expect(resolveFrequency('AUTO', [
      { id: 1, periodicite: 'Journalière' },
      { id: 2, periodicite: 'Hebdomadaire' },
      { id: 3, periodicite: 'Mensuelle' },
    ])).toBe('MONTHLY');
  });

  test('l alignement mensuel ne depend pas de dates exactes identiques', () => {
    const funds = [
      { id: 1, nom_fond: 'A', periodicite: 'Mensuelle', dev_libelle: 'XOF' },
      { id: 2, nom_fond: 'B', periodicite: 'Mensuelle', dev_libelle: 'XOF' },
    ];

    const a = monthlyRows({ count: 48, dayOffset: 0 });
    const b = monthlyRows({ count: 48, dayOffset: -2, monthlyReturn: 0.008 });

    const prepared = prepareAllocationData({
      request: request(),
      funds,
      valuations_by_fund: { 1: a, 2: b },
    });

    expect(prepared.data.frequency).toBe('MONTHLY');
    expect(prepared.provenance.exact_date_intersection_used).toBe(false);
    expect(prepared.provenance.period_level_alignment).toBe(true);
    expect(prepared.quality.return_observations).toBeGreaterThanOrEqual(35);
    expect(prepared.statistics.returns_matrix[0]).toHaveLength(
      prepared.statistics.returns_matrix[1].length
    );
  });

  test('les cles hebdomadaires utilisent une semaine ISO stable au changement d annee', () => {
    expect(periodKey('2026-01-01', 'WEEKLY')).toBe('2026-W01');
    expect(periodKey('2025-12-31', 'WEEKLY')).toBe('2026-W01');
  });
});

describe('Allocation data preparation — Total Return et horizon', () => {
  test('TOTAL_RETURN utilise vl_ajuste et non la VL brute', () => {
    const funds = [
      { id: 1, nom_fond: 'A', periodicite: 'Mensuelle', dev_libelle: 'XOF' },
      { id: 2, nom_fond: 'B', periodicite: 'Mensuelle', dev_libelle: 'XOF' },
    ];

    const rowsA = monthlyRows({
      count: 48,
      monthlyReturn: 0.01,
      navReturn: 0,
    });
    const rowsB = monthlyRows({
      count: 48,
      monthlyReturn: 0.005,
      navReturn: 0,
    });

    const prepared = prepareAllocationData({
      request: request({
        data: { return_method: 'TOTAL_RETURN' },
      }),
      funds,
      valuations_by_fund: { 1: rowsA, 2: rowsB },
    });

    expect(prepared.data.value_field).toBe('vl_ajuste');
    expect(prepared.statistics.expected_returns_annualized[0]).toBeCloseTo(0.12, 8);
    expect(prepared.statistics.expected_returns_annualized[1]).toBeCloseTo(0.06, 8);
  });

  test('NAV peut etre demande explicitement sans repli silencieux vers Total Return', () => {
    const funds = [
      { id: 1, nom_fond: 'A', periodicite: 'Mensuelle', dev_libelle: 'XOF' },
      { id: 2, nom_fond: 'B', periodicite: 'Mensuelle', dev_libelle: 'XOF' },
    ];

    const rows = monthlyRows({
      count: 48,
      monthlyReturn: 0.01,
      navReturn: 0,
    });

    const prepared = prepareAllocationData({
      request: request({
        data: { return_method: 'NAV' },
      }),
      funds,
      valuations_by_fund: { 1: rows, 2: rows },
    });

    expect(prepared.data.value_field).toBe('value');
    expect(prepared.statistics.expected_returns_annualized[0]).toBeCloseTo(0, 12);
  });

  test('MAX conserve plus de 500 observations et prouve la suppression de limit=500', () => {
    const funds = [
      { id: 1, nom_fond: 'A', periodicite: 'Journalière', dev_libelle: 'XOF' },
      { id: 2, nom_fond: 'B', periodicite: 'Journalière', dev_libelle: 'XOF' },
    ];
    const rowsA = dailyRows({ count: 700, dailyReturn: 0.0005 });
    const rowsB = dailyRows({ count: 700, dailyReturn: 0.0004 });

    const prepared = prepareAllocationData({
      request: request({
        data: {
          horizon: 'MAX',
          frequency: 'DAILY',
        },
      }),
      funds,
      valuations_by_fund: { 1: rowsA, 2: rowsB },
    });

    expect(prepared.quality.aligned_value_observations).toBe(700);
    expect(prepared.quality.return_observations).toBe(699);
    expect(prepared.provenance.no_limit_500).toBe(true);
  });
});

describe('Allocation data preparation — covariance', () => {
  test('la covariance sample est centree sur la moyenne et annualisee', () => {
    const returns = [
      [0.01, 0.02, 0.03, 0.04],
      [0.02, 0.01, 0.04, 0.03],
    ];

    const result = covarianceMatrix(returns, 12, { method: 'SAMPLE' });

    expect(result.assume_zero_mean).toBe(false);
    expect(result.method).toBe('SAMPLE');
    expect(result.matrix[0][1]).toBeCloseTo(result.matrix[1][0], 14);
    expect(result.matrix[0][0]).toBeGreaterThan(0);
  });

  test('DIAGONAL_SHRINKAGE reduit les covariances hors diagonale', () => {
    const returns = [
      [0.01, 0.02, 0.03, 0.04],
      [0.02, 0.01, 0.04, 0.03],
    ];

    const sample = covarianceMatrix(returns, 12, { method: 'SAMPLE' });
    const shrink = covarianceMatrix(returns, 12, {
      method: 'DIAGONAL_SHRINKAGE',
      shrinkage_lambda: 0.50,
    });

    expect(shrink.matrix[0][0]).toBeCloseTo(sample.matrix[0][0], 14);
    expect(shrink.matrix[0][1]).toBeCloseTo(sample.matrix[0][1] * 0.5, 14);
  });
});

describe('Allocation data preparation — quality gates', () => {
  test('une base non native exige sa paire FX historique explicite', () => {
    const funds = [
      { id: 1, periodicite: 'Mensuelle' },
      { id: 2, periodicite: 'Mensuelle' },
    ];
    const rows = monthlyRows({ count: 48 });

    expect(() => prepareAllocationData({
      request: request({
        universe: { base_currency: 'GBP' },
      }),
      funds,
      valuations_by_fund: { 1: rows, 2: rows },
      fx_rows: [],
    })).toThrow(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({
          code: 'FX_PAIR_REQUIRED',
          meta: { pair: 'EUR/GBP' },
        }),
      ]),
    }));
  });

  test('convertit une base MAD via la paire EUR/MAD existante', () => {
    const funds = [
      { id: 1, periodicite: 'Mensuelle' },
      { id: 2, periodicite: 'Mensuelle' },
    ];
    const rowsA = monthlyRows({ count: 48, monthlyReturn: 0.01 });
    const rowsB = monthlyRows({ count: 48, monthlyReturn: 0.005 });

    const fxRows = [];
    for (const row of rowsA) {
      fxRows.push({
        paire: 'EUR/MAD',
        date: row.date,
        value: 10 + fxRows.length * 0.001,
      });
    }

    const prepared = prepareAllocationData({
      request: request({
        universe: { base_currency: 'MAD' },
      }),
      funds,
      valuations_by_fund: { 1: rowsA, 2: rowsB },
      fx_rows: fxRows,
    });

    expect(prepared.universe.base_currency).toBe('MAD');
    expect(prepared.provenance.conversion_mode).toBe('EUR_CROSS');
    expect(prepared.provenance.fx).toEqual({
      pair: 'EUR/MAD',
      type: 'HISTORICAL_DEVISedechanges',
    });
    expect(prepared.statistics.returns_matrix[0]).toHaveLength(
      prepared.quality.return_observations
    );
  });

  test('un historique trop court est bloque avant optimisation', () => {
    const funds = [
      { id: 1, periodicite: 'Mensuelle' },
      { id: 2, periodicite: 'Mensuelle' },
    ];
    const rows = monthlyRows({ count: 8 });

    expect(() => prepareAllocationData({
      request: request({
        data: { horizon: 'MAX', frequency: 'MONTHLY' },
      }),
      funds,
      valuations_by_fund: { 1: rows, 2: rows },
    })).toThrow(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'INSUFFICIENT_HISTORY' }),
      ]),
    }));
  });

  test('le taux sans risque n est jamais invente', () => {
    expect(normalizeRiskFree()).toEqual({
      annual_rate: null,
      source: 'NOT_CONFIGURED',
      as_of: null,
    });

    expect(() => normalizeRiskFree({
      annual_rate: 0.04,
    })).toThrow(AllocationDataError);

    expect(normalizeRiskFree({
      annual_rate: 0.04,
      source: 'USER_PROVIDED',
      as_of: '2026-09-22',
    })).toEqual({
      annual_rate: 0.04,
      source: 'USER_PROVIDED',
      as_of: '2026-09-22',
    });
  });
});

describe('Allocation data provider — Fund Master et fenetre SQL', () => {
  const Op = {
    in: Symbol('in'),
    gte: Symbol('gte'),
    lte: Symbol('lte'),
  };

  test('charge Fund Master actif et valorisations sans limit=500', async () => {
    const calls = { funds: null, valuations: null };

    const fundModel = {
      findAll: jest.fn(async options => {
        calls.funds = options;
        return [
          { id: 1, nom_fond: 'Fund 1', active: 1, periodicite: 'Mensuelle', dev_libelle: 'XOF' },
          { id: 2, nom_fond: 'Fund 2', active: 1, periodicite: 'Mensuelle', dev_libelle: 'XOF' },
        ];
      }),
    };

    const valuationModel = {
      findAll: jest.fn(async options => {
        calls.valuations = options;
        return [
          { fund_id: 1, date: '2025-01-31', value: 100, vl_ajuste: 100 },
          { fund_id: 2, date: '2025-01-31', value: 200, vl_ajuste: 200 },
        ];
      }),
    };

    const provider = createAllocationDataProvider({
      fundModel,
      valuationModel,
      Op,
    });

    const result = await provider.load({
      fundIds: [2, 1, 2],
      dateFrom: '2024-01-01',
      dateTo: '2025-12-31',
    });

    expect(calls.funds.where.active).toBe(1);
    expect(calls.funds.where.id[Op.in]).toEqual([2, 1]);
    expect(calls.funds.limit).toBeUndefined();

    expect(calls.valuations.where.fund_id[Op.in]).toEqual([2, 1]);
    expect(calls.valuations.where.date[Op.gte]).toBe('2024-01-01');
    expect(calls.valuations.where.date[Op.lte]).toBe('2025-12-31');
    expect(calls.valuations.limit).toBeUndefined();
    expect(calls.valuations.order).toEqual([
      ['fund_id', 'ASC'],
      ['date', 'ASC'],
    ]);

    expect(result.funds.map(fund => fund.id)).toEqual([2, 1]);
    expect(result.valuations_by_fund['1']).toHaveLength(1);
    expect(result.valuations_by_fund['2']).toHaveLength(1);
    expect(result.query_contract.no_limit_500).toBe(true);
    expect(result.query_contract.limit).toBeNull();
  });

  test('charge les paires FX dans la meme fenetre sans limite arbitraire', async () => {
    const calls = { fx: null };

    const provider = createAllocationDataProvider({
      fundModel: {
        findAll: jest.fn(async () => [
          { id: 1, active: 1 },
          { id: 2, active: 1 },
        ]),
      },
      valuationModel: {
        findAll: jest.fn(async () => []),
      },
      fxModel: {
        findAll: jest.fn(async options => {
          calls.fx = options;
          return [
            { paire: 'EUR/MAD', date: '2025-01-02', value: 10.8 },
            { paire: 'EUR/MAD', date: '2025-01-03', value: 0 },
          ];
        }),
      },
      Op,
    });

    const result = await provider.load({
      fundIds: [1, 2],
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      fxPairs: ['eur/mad', 'EUR/MAD'],
    });

    expect(calls.fx.where.paire[Op.in]).toEqual(['EUR/MAD']);
    expect(calls.fx.where.date[Op.gte]).toBe('2025-01-01');
    expect(calls.fx.where.date[Op.lte]).toBe('2025-12-31');
    expect(calls.fx.limit).toBeUndefined();
    expect(result.fx_rows).toEqual([
      { paire: 'EUR/MAD', date: '2025-01-02', value: 10.8 },
    ]);
    expect(result.query_contract.forex_table).toBe('devisedechanges');
    expect(result.query_contract.fx_pairs).toEqual(['EUR/MAD']);
  });

  test('refuse un fonds absent ou inactif du Fund Master', async () => {
    const provider = createAllocationDataProvider({
      fundModel: {
        findAll: jest.fn(async () => [
          { id: 1, active: 1 },
        ]),
      },
      valuationModel: {
        findAll: jest.fn(async () => []),
      },
      Op,
    });

    await expect(provider.loadFundMaster([1, 2])).rejects.toEqual(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({
          code: 'FUND_NOT_ACTIVE_OR_MISSING',
          meta: { fund_ids: [2] },
        }),
      ]),
    }));
  });
});

