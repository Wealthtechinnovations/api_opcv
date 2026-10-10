const {
  PORTFOLIO_ALLOCATION_VERSION,
  AllocationEngineError,
  portfolioMetrics,
  buildUniformWeightConstraints,
  runAllocationStrategy,
} = require('../src/services/allocation/engine/adapter');

function prepared({
  fundIds = [1, 2],
  mu = [0.06, 0.12],
  sigma = [[0.04, 0], [0, 0.01]],
  riskFree = { annual_rate: 0.02, source: 'TEST_FIXTURE', as_of: '2026-09-22' },
} = {}) {
  return {
    preparation_version: '1.0.0',
    universe: {
      fund_ids: fundIds,
      base_currency: 'EUR',
    },
    data: {
      date_to: '2026-09-22',
      frequency: 'MONTHLY',
      return_method: 'TOTAL_RETURN',
    },
    statistics: {
      expected_returns_annualized: mu,
      covariance_matrix_annualized: sigma,
      returns_matrix: fundIds.map(() => [0.01, 0.02, -0.01, 0.015]),
      covariance: {
        method: 'SAMPLE',
        shrinkage_lambda: null,
        assume_zero_mean: false,
      },
      risk_free: riskFree,
    },
    quality: {
      status: 'PASS',
    },
  };
}

function request(strategy, extra = {}) {
  return {
    universe: {
      fund_ids: [1, 2],
      base_currency: 'EUR',
    },
    data: {
      horizon: '3Y',
      frequency: 'MONTHLY',
      return_method: 'TOTAL_RETURN',
    },
    objective: { strategy },
    targets: {
      min_return: null,
      max_return: null,
      min_volatility: null,
      max_volatility: null,
      ...(extra.targets || {}),
    },
    constraints: {
      fund_count: null,
      fund_weight: null,
      categories: {},
      srri: null,
      currencies: {},
      ...(extra.constraints || {}),
    },
    output: {
      frontier_points: 25,
      ...(extra.output || {}),
    },
  };
}

function weights(result) {
  return result.weights.map(item => item.weight);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

describe('Canonical Node allocation engine', () => {
  test('uses the existing portfolio-allocation package as an internal solver', () => {
    expect(PORTFOLIO_ALLOCATION_VERSION).toBe('0.0.11');
  });

  test('EQUAL_WEIGHT produces exact 1/N weights and common metrics', () => {
    const result = runAllocationStrategy({
      request: request('EQUAL_WEIGHT'),
      prepared: prepared(),
    });

    expect(weights(result)).toEqual([0.5, 0.5]);
    expect(result.engine.runtime).toBe('NODE_JAVASCRIPT');
    expect(result.engine.python_runtime_used).toBe(false);
    expect(result.metrics.expected_return_annualized).toBeCloseTo(0.09, 12);
    expect(result.metrics.volatility_annualized).toBeCloseTo(Math.sqrt(0.0125), 12);
    expect(result.metrics.sharpe_ratio).toBeCloseTo(
      (0.09 - 0.02) / Math.sqrt(0.0125),
      12
    );
  });

  test('INVERSE_VOLATILITY passes covariance variances, not volatilities', () => {
    const result = runAllocationStrategy({
      request: request('INVERSE_VOLATILITY'),
      prepared: prepared(),
    });

    expect(weights(result)[0]).toBeCloseTo(1 / 3, 10);
    expect(weights(result)[1]).toBeCloseTo(2 / 3, 10);
    expect(sum(weights(result))).toBeCloseTo(1, 12);
  });

  test('GLOBAL_MINIMUM_VARIANCE matches the diagonal analytical solution', () => {
    const result = runAllocationStrategy({
      request: request('GLOBAL_MINIMUM_VARIANCE'),
      prepared: prepared(),
    });

    expect(weights(result)[0]).toBeCloseTo(0.2, 5);
    expect(weights(result)[1]).toBeCloseTo(0.8, 5);
    expect(sum(weights(result))).toBeCloseTo(1, 12);
  });

  test('EQUAL_RISK_CONTRIBUTION matches diagonal inverse-vol risk parity', () => {
    const result = runAllocationStrategy({
      request: request('EQUAL_RISK_CONTRIBUTION'),
      prepared: prepared(),
    });

    expect(weights(result)[0]).toBeCloseTo(1 / 3, 5);
    expect(weights(result)[1]).toBeCloseTo(2 / 3, 5);
  });

  test('RISK_BUDGETING requires explicit budgets and normalizes them', () => {
    expect(() => runAllocationStrategy({
      request: request('RISK_BUDGETING'),
      prepared: prepared(),
    })).toThrow(expect.objectContaining({
      code: 'RISK_BUDGETS_REQUIRED',
    }));

    const result = runAllocationStrategy({
      request: request('RISK_BUDGETING'),
      prepared: prepared(),
      risk_budgets: [1, 1],
    });

    expect(result.details.risk_budgets).toEqual([0.5, 0.5]);
    expect(sum(weights(result))).toBeCloseTo(1, 10);
  });

  test('MAXIMUM_DIVERSIFICATION returns a finite fully-invested portfolio', () => {
    const result = runAllocationStrategy({
      request: request('MAXIMUM_DIVERSIFICATION'),
      prepared: prepared(),
    });

    expect(weights(result).every(Number.isFinite)).toBe(true);
    expect(sum(weights(result))).toBeCloseTo(1, 10);
  });

  test('MAXIMUM_SHARPE requires a sourced risk-free rate', () => {
    expect(() => runAllocationStrategy({
      request: request('MAXIMUM_SHARPE'),
      prepared: prepared({
        riskFree: { annual_rate: null, source: 'NOT_CONFIGURED', as_of: null },
      }),
    })).toThrow(expect.objectContaining({
      code: 'RISK_FREE_RATE_REQUIRED',
    }));

    const result = runAllocationStrategy({
      request: request('MAXIMUM_SHARPE'),
      prepared: prepared(),
    });

    expect(weights(result).every(Number.isFinite)).toBe(true);
    expect(sum(weights(result))).toBeCloseTo(1, 10);
    expect(result.metrics.sharpe_ratio).not.toBeNull();
  });

  test('MINIMUM_CORRELATION is exposed without pretending it supports weight bounds', () => {
    const result = runAllocationStrategy({
      request: request('MINIMUM_CORRELATION'),
      prepared: prepared(),
    });

    expect(sum(weights(result))).toBeCloseTo(1, 10);

    expect(() => runAllocationStrategy({
      request: request('MINIMUM_CORRELATION', {
        constraints: {
          fund_weight: { min: 0.1, max: 0.6 },
        },
      }),
      prepared: prepared(),
    })).toThrow(expect.objectContaining({
      code: 'STRATEGY_WEIGHT_CONSTRAINT_UNSUPPORTED',
    }));
  });

  test('uniform fund bounds are feasibility-checked before the solver', () => {
    expect(() => buildUniformWeightConstraints(
      request('GLOBAL_MINIMUM_VARIANCE', {
        constraints: {
          fund_weight: { min: 0.6, max: 0.8 },
        },
      }),
      2
    )).toThrow(expect.objectContaining({
      code: 'INFEASIBLE_WEIGHT_BOUNDS',
    }));
  });

  test('GLOBAL_MINIMUM_VARIANCE respects supported min/max fund bounds', () => {
    const result = runAllocationStrategy({
      request: request('GLOBAL_MINIMUM_VARIANCE', {
        constraints: {
          fund_weight: { min: 0.1, max: 0.6 },
        },
      }),
      prepared: prepared(),
    });

    expect(weights(result)[0]).toBeGreaterThanOrEqual(0.1 - 1e-8);
    expect(weights(result)[0]).toBeLessThanOrEqual(0.6 + 1e-8);
    expect(weights(result)[1]).toBeGreaterThanOrEqual(0.1 - 1e-8);
    expect(weights(result)[1]).toBeLessThanOrEqual(0.6 + 1e-8);
  });

  test('MEAN_VARIANCE exposes normalized frontier points and selects inside target band', () => {
    const result = runAllocationStrategy({
      request: request('MEAN_VARIANCE', {
        targets: {
          min_return: 0.065,
          max_return: 0.115,
          min_volatility: null,
          max_volatility: 0.18,
        },
        output: {
          frontier_points: 31,
        },
      }),
      prepared: prepared(),
    });

    expect(result.details.frontier.length).toBeGreaterThan(1);
    expect(result.details.frontier.length).toBeLessThanOrEqual(31);
    expect(result.details.selection_rule).toBe('MIN_VOLATILITY_WITHIN_TARGET_BAND');
    expect(result.metrics.expected_return_annualized).toBeGreaterThanOrEqual(0.065 - 1e-8);
    expect(result.metrics.expected_return_annualized).toBeLessThanOrEqual(0.115 + 1e-8);
    expect(result.metrics.volatility_annualized).toBeLessThanOrEqual(0.18 + 1e-8);
    for (const point of result.details.frontier) {
      expect(sum(point.weights.map(item => item.weight))).toBeCloseTo(1, 10);
      expect(Number.isFinite(point.metrics.expected_return_annualized)).toBe(true);
      expect(Number.isFinite(point.metrics.volatility_annualized)).toBe(true);
    }
  });

  test('MEAN_VARIANCE fails explicitly when target band has no feasible frontier point', () => {
    expect(() => runAllocationStrategy({
      request: request('MEAN_VARIANCE', {
        targets: {
          min_return: 0.5,
          max_return: 0.6,
        },
      }),
      prepared: prepared(),
    })).toThrow(expect.objectContaining({
      code: 'NO_PORTFOLIO_IN_TARGET_BAND',
    }));
  });

  test('MINIMUM_TRACKING_ERROR is deferred until benchmark returns are part of the contract', () => {
    expect(() => runAllocationStrategy({
      request: request('MINIMUM_TRACKING_ERROR'),
      prepared: prepared(),
    })).toThrow(expect.objectContaining({
      code: 'STRATEGY_PREREQUISITE_MISSING',
      details: expect.objectContaining({
        prerequisite: 'BENCHMARK_RETURNS_REQUIRED',
      }),
    }));
  });

  test('rejects covariance dimension drift before any solver call', () => {
    expect(() => runAllocationStrategy({
      request: request('GLOBAL_MINIMUM_VARIANCE'),
      prepared: prepared({
        sigma: [[0.04, 0.01]],
      }),
    })).toThrow(expect.objectContaining({
      code: 'COVARIANCE_DIMENSION_MISMATCH',
    }));
  });

  test('portfolioMetrics independently recomputes return and variance', () => {
    const metrics = portfolioMetrics(
      [0.25, 0.75],
      [0.04, 0.10],
      [[0.04, 0.01], [0.01, 0.09]],
      { annual_rate: 0.02 }
    );

    expect(metrics.expected_return_annualized).toBeCloseTo(0.085, 12);
    const variance =
      0.25 * 0.25 * 0.04 +
      2 * 0.25 * 0.75 * 0.01 +
      0.75 * 0.75 * 0.09;
    expect(metrics.variance_annualized).toBeCloseTo(variance, 12);
    expect(metrics.volatility_annualized).toBeCloseTo(Math.sqrt(variance), 12);
  });

  test('rejects a truly non-PSD covariance before calling the solver', () => {
    expect(() => runAllocationStrategy({
      request: request('GLOBAL_MINIMUM_VARIANCE'),
      prepared: prepared({
        sigma: [[0.04, 0.03], [0.03, 0.01]],
      }),
    })).toThrow(expect.objectContaining({
      code: 'COVARIANCE_NOT_PSD',
    }));
  });

  test('accepts a zero covariance matrix as PSD instead of fabricating an error', () => {
    const result = runAllocationStrategy({
      request: request('EQUAL_WEIGHT'),
      prepared: prepared({
        sigma: [[0, 0], [0, 0]],
      }),
    });
    expect(weights(result)).toEqual([0.5, 0.5]);
    expect(result.metrics.volatility_annualized).toBe(0);
  });
});
