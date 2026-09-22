'use strict';

const PortfolioAllocation = require('portfolio-allocation');
const { version: PORTFOLIO_ALLOCATION_VERSION } = require('portfolio-allocation/package.json');

const ENGINE_VERSION = '1.0.0';
const ENGINE_NAME = 'AFRICAFUNDS_NODE_ALLOCATION';

const SUPPORTED_STRATEGIES = Object.freeze([
  'EQUAL_WEIGHT',
  'INVERSE_VOLATILITY',
  'GLOBAL_MINIMUM_VARIANCE',
  'EQUAL_RISK_CONTRIBUTION',
  'RISK_BUDGETING',
  'MAXIMUM_DIVERSIFICATION',
  'MAXIMUM_SHARPE',
  'MEAN_VARIANCE',
  'MINIMUM_CORRELATION',
]);

const DEFERRED_STRATEGIES = Object.freeze({
  MINIMUM_TRACKING_ERROR: 'BENCHMARK_RETURNS_REQUIRED',
});

const WEIGHT_CONSTRAINED_LIBRARY_STRATEGIES = new Set([
  'GLOBAL_MINIMUM_VARIANCE',
  'EQUAL_RISK_CONTRIBUTION',
  'RISK_BUDGETING',
  'MAXIMUM_DIVERSIFICATION',
  'MAXIMUM_SHARPE',
  'MEAN_VARIANCE',
]);

class AllocationEngineError extends Error {
  constructor(code, message, statusCode = 422, details = null) {
    super(message);
    this.name = 'AllocationEngineError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function fail(code, message, details, statusCode = 422) {
  throw new AllocationEngineError(code, message, statusCode, details || null);
}

function finiteNumber(value, path) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    fail('NON_FINITE_NUMBER', `${path} doit etre un nombre fini.`, { path, value });
  }
  return number;
}

function validatePreparedData(prepared) {
  if (!prepared || typeof prepared !== 'object') {
    fail('PREPARED_DATA_REQUIRED', 'Les donnees preparees AF-TASK-014 sont requises.');
  }

  const fundIds = prepared.universe && prepared.universe.fund_ids;
  const stats = prepared.statistics || {};
  const mu = stats.expected_returns_annualized;
  const sigma = stats.covariance_matrix_annualized;
  const returns = stats.returns_matrix;

  if (!Array.isArray(fundIds) || fundIds.length < 2) {
    fail('INVALID_UNIVERSE', 'Au moins deux fund_ids sont requis dans les donnees preparees.');
  }

  const n = fundIds.length;
  if (!Array.isArray(mu) || mu.length !== n) {
    fail('EXPECTED_RETURNS_DIMENSION_MISMATCH', 'Le vecteur de rendements attendus ne correspond pas a l univers.', {
      assets: n,
      expected_returns: Array.isArray(mu) ? mu.length : null,
    });
  }

  if (!Array.isArray(sigma) || sigma.length !== n || sigma.some(row => !Array.isArray(row) || row.length !== n)) {
    fail('COVARIANCE_DIMENSION_MISMATCH', 'La matrice de covariance doit etre carree et alignée sur l univers.', {
      assets: n,
    });
  }

  const normalizedMu = mu.map((value, i) => finiteNumber(value, `statistics.expected_returns_annualized[${i}]`));
  const normalizedSigma = sigma.map((row, i) => row.map((value, j) => finiteNumber(
    value,
    `statistics.covariance_matrix_annualized[${i}][${j}]`
  )));

  const symmetryTolerance = 1e-10;
  for (let i = 0; i < n; i += 1) {
    if (normalizedSigma[i][i] < -symmetryTolerance) {
      fail('NEGATIVE_VARIANCE', 'Une variance negative a ete detectee.', {
        index: i,
        fund_id: fundIds[i],
        variance: normalizedSigma[i][i],
      });
    }
    for (let j = i + 1; j < n; j += 1) {
      if (Math.abs(normalizedSigma[i][j] - normalizedSigma[j][i]) > symmetryTolerance) {
        fail('COVARIANCE_NOT_SYMMETRIC', 'La matrice de covariance n est pas symetrique.', {
          i,
          j,
          left: normalizedSigma[i][j],
          right: normalizedSigma[j][i],
        });
      }
    }
  }

  assertCovariancePositiveSemidefinite(normalizedSigma);

  if (prepared.quality && prepared.quality.status && prepared.quality.status !== 'PASS') {
    fail('DATA_QUALITY_NOT_PASS', 'Le moteur refuse des donnees dont le quality gate n est pas PASS.', {
      status: prepared.quality.status,
    });
  }

  return {
    n,
    fund_ids: fundIds.map(Number),
    mu: normalizedMu,
    sigma: normalizedSigma,
    returns_matrix: Array.isArray(returns) ? returns : null,
    risk_free: stats.risk_free || {
      annual_rate: null,
      source: 'NOT_CONFIGURED',
      as_of: null,
    },
  };
}

function assertCovariancePositiveSemidefinite(sigma) {
  const n = sigma.length;
  const lower = Array.from({ length: n }, () => Array(n).fill(0));
  let scale = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      scale = Math.max(scale, Math.abs(sigma[i][j]));
    }
  }
  const tolerance = Math.max(1e-14, scale * 1e-10);

  // Semidefinite Cholesky/LDL-style factorization. A zero diagonal pivot is
  // acceptable only when the corresponding residual off-diagonal terms are
  // also numerically zero.
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let residual = sigma[i][j];
      for (let k = 0; k < j; k += 1) {
        residual -= lower[i][k] * lower[j][k];
      }

      if (i === j) {
        if (residual < -tolerance) {
          fail('COVARIANCE_NOT_PSD', 'La matrice de covariance n est pas semi-definie positive.', {
            pivot: i,
            residual,
            tolerance,
          });
        }
        lower[i][j] = residual > tolerance ? Math.sqrt(residual) : 0;
      } else if (lower[j][j] > tolerance) {
        lower[i][j] = residual / lower[j][j];
      } else {
        if (Math.abs(residual) > tolerance) {
          fail('COVARIANCE_NOT_PSD', 'La matrice de covariance n est pas semi-definie positive.', {
            row: i,
            column: j,
            residual,
            tolerance,
          });
        }
        lower[i][j] = 0;
      }
    }
  }

  return true;
}

function normalizeWeights(weights, n) {
  if (!Array.isArray(weights) || weights.length !== n) {
    fail('WEIGHT_DIMENSION_MISMATCH', 'Le solveur a retourne un vecteur de poids de dimension invalide.', {
      expected: n,
      actual: Array.isArray(weights) ? weights.length : null,
    });
  }

  const tolerance = 1e-10;
  const normalized = weights.map((raw, index) => {
    const value = finiteNumber(raw, `weights[${index}]`);
    if (value < -tolerance) {
      fail('NEGATIVE_WEIGHT', 'Le solveur a retourne un poids negatif incompatible avec le mandat long-only.', {
        index,
        weight: value,
      });
    }
    return Math.abs(value) <= tolerance ? 0 : value;
  });

  const sum = normalized.reduce((total, value) => total + value, 0);
  if (!Number.isFinite(sum) || sum <= tolerance) {
    fail('INVALID_WEIGHT_SUM', 'La somme des poids retournes par le solveur est invalide.', { sum });
  }

  const scaled = normalized.map(value => value / sum);
  const scaledSum = scaled.reduce((total, value) => total + value, 0);
  if (Math.abs(scaledSum - 1) > 1e-9) {
    fail('NORMALIZED_WEIGHT_SUM_INVALID', 'La normalisation des poids n aboutit pas a une somme egale a 1.', {
      sum: scaledSum,
    });
  }
  return scaled;
}

function dot(left, right) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function matrixVector(matrix, vector) {
  return matrix.map(row => dot(row, vector));
}

function portfolioMetrics(weights, mu, sigma, riskFree) {
  const expectedReturn = dot(weights, mu);
  const sigmaW = matrixVector(sigma, weights);
  let variance = dot(weights, sigmaW);

  if (variance < 0 && Math.abs(variance) <= 1e-12) variance = 0;
  if (variance < 0) {
    fail('NEGATIVE_PORTFOLIO_VARIANCE', 'La variance portefeuille calculee est negative.', {
      variance,
    });
  }

  const volatility = Math.sqrt(variance);
  const rf = riskFree && riskFree.annual_rate !== null && riskFree.annual_rate !== undefined
    ? finiteNumber(riskFree.annual_rate, 'risk_free.annual_rate')
    : null;
  const sharpe = rf !== null && volatility > 1e-12
    ? (expectedReturn - rf) / volatility
    : null;

  return {
    expected_return_annualized: expectedReturn,
    volatility_annualized: volatility,
    variance_annualized: variance,
    sharpe_ratio: sharpe,
    risk_free_annual_rate: rf,
  };
}

function buildUniformWeightConstraints(request, n) {
  const range = request && request.constraints && request.constraints.fund_weight;
  if (!range) {
    return {
      requested: false,
      min: 0,
      max: 1,
      min_weights: Array(n).fill(0),
      max_weights: Array(n).fill(1),
    };
  }

  const min = range.min === null || range.min === undefined ? 0 : finiteNumber(range.min, 'constraints.fund_weight.min');
  const max = range.max === null || range.max === undefined ? 1 : finiteNumber(range.max, 'constraints.fund_weight.max');

  if (min < 0 || max > 1 || min > max) {
    fail('INVALID_WEIGHT_BOUNDS', 'Les bornes de poids doivent verifier 0 <= min <= max <= 1.', { min, max });
  }

  if (n * min > 1 + 1e-12 || n * max < 1 - 1e-12) {
    fail('INFEASIBLE_WEIGHT_BOUNDS', 'Les bornes uniformes de poids sont incompatibles avec un portefeuille pleinement investi.', {
      assets: n,
      min,
      max,
      min_total: n * min,
      max_total: n * max,
    });
  }

  return {
    requested: min > 0 || max < 1,
    min,
    max,
    min_weights: Array(n).fill(min),
    max_weights: Array(n).fill(max),
  };
}

function assertBounds(weights, bounds, fundIds) {
  const tolerance = 1e-8;
  for (let i = 0; i < weights.length; i += 1) {
    if (weights[i] < bounds.min - tolerance || weights[i] > bounds.max + tolerance) {
      fail('SOLVER_WEIGHT_BOUND_VIOLATION', 'Le portefeuille retourne ne respecte pas les bornes de poids.', {
        index: i,
        fund_id: fundIds[i],
        weight: weights[i],
        min: bounds.min,
        max: bounds.max,
      });
    }
  }
}

function solverOptions(bounds) {
  return {
    optimizationMethod: 'automatic',
    constraints: {
      minWeights: bounds.min_weights,
      maxWeights: bounds.max_weights,
    },
  };
}

function targetBand(request) {
  const targets = (request && request.targets) || {};
  return {
    min_return: targets.min_return === null || targets.min_return === undefined ? null : finiteNumber(targets.min_return, 'targets.min_return'),
    max_return: targets.max_return === null || targets.max_return === undefined ? null : finiteNumber(targets.max_return, 'targets.max_return'),
    min_volatility: targets.min_volatility === null || targets.min_volatility === undefined ? null : finiteNumber(targets.min_volatility, 'targets.min_volatility'),
    max_volatility: targets.max_volatility === null || targets.max_volatility === undefined ? null : finiteNumber(targets.max_volatility, 'targets.max_volatility'),
  };
}

function satisfiesTargetBand(metrics, band) {
  const eps = 1e-10;
  if (band.min_return !== null && metrics.expected_return_annualized < band.min_return - eps) return false;
  if (band.max_return !== null && metrics.expected_return_annualized > band.max_return + eps) return false;
  if (band.min_volatility !== null && metrics.volatility_annualized < band.min_volatility - eps) return false;
  if (band.max_volatility !== null && metrics.volatility_annualized > band.max_volatility + eps) return false;
  return true;
}

function publicWeights(fundIds, weights) {
  return fundIds.map((fundId, index) => ({
    fund_id: fundId,
    weight: weights[index],
  }));
}

function wrapLibraryCall(strategy, fn) {
  try {
    return fn();
  } catch (error) {
    fail(
      'SOLVER_ERROR',
      `Le solveur portfolio-allocation a echoue pour ${strategy}.`,
      {
        strategy,
        library: 'portfolio-allocation',
        library_version: PORTFOLIO_ALLOCATION_VERSION,
        solver_message: error && error.message ? String(error.message).slice(0, 500) : 'unknown error',
      }
    );
  }
}

function buildResult({
  strategy,
  weights,
  validated,
  prepared,
  bounds,
  constraintsApplied,
  warnings = [],
  details = null,
}) {
  const normalized = normalizeWeights(weights, validated.n);
  assertBounds(normalized, bounds, validated.fund_ids);
  const metrics = portfolioMetrics(
    normalized,
    validated.mu,
    validated.sigma,
    validated.risk_free
  );

  return {
    engine: {
      name: ENGINE_NAME,
      version: ENGINE_VERSION,
      runtime: 'NODE_JAVASCRIPT',
      solver: 'portfolio-allocation',
      solver_version: PORTFOLIO_ALLOCATION_VERSION,
      python_runtime_used: false,
    },
    strategy,
    universe: {
      fund_ids: validated.fund_ids,
      base_currency: prepared.universe.base_currency,
    },
    weights: publicWeights(validated.fund_ids, normalized),
    metrics,
    constraints_applied: constraintsApplied,
    warnings,
    details,
    provenance: {
      preparation_version: prepared.preparation_version || null,
      data_cutoff: prepared.data && prepared.data.date_to || null,
      frequency: prepared.data && prepared.data.frequency || null,
      return_method: prepared.data && prepared.data.return_method || null,
      covariance_method: prepared.statistics && prepared.statistics.covariance && prepared.statistics.covariance.method || null,
    },
  };
}

function buildFrontier({
  request,
  validated,
  prepared,
  bounds,
}) {
  const count = Math.max(
    2,
    Math.min(
      1000,
      Number(request && request.output && request.output.frontier_points) || 100
    )
  );
  const options = solverOptions(bounds);
  options.nbPortfolios = count;
  options.discretizationType = 'return';

  const raw = wrapLibraryCall('MEAN_VARIANCE', () =>
    PortfolioAllocation.meanVarianceEfficientFrontierPortfolios(
      validated.mu,
      validated.sigma,
      options
    )
  );

  const frontier = raw.map((entry, index) => {
    if (!Array.isArray(entry) || entry.length < 3) {
      fail('INVALID_FRONTIER_ENTRY', 'Le solveur a retourne un point de frontiere invalide.', { index });
    }
    const weights = normalizeWeights(entry[0], validated.n);
    assertBounds(weights, bounds, validated.fund_ids);
    const metrics = portfolioMetrics(weights, validated.mu, validated.sigma, validated.risk_free);
    return {
      index,
      weights: publicWeights(validated.fund_ids, weights),
      metrics,
      solver_return: finiteNumber(entry[1], `frontier[${index}].return`),
      solver_volatility: finiteNumber(entry[2], `frontier[${index}].volatility`),
    };
  });

  if (!frontier.length) {
    fail('EMPTY_EFFICIENT_FRONTIER', 'Le solveur n a retourne aucun point de frontiere efficiente.');
  }

  return frontier;
}

function chooseMeanVariance(frontier, request) {
  const band = targetBand(request);
  const feasible = frontier.filter(point => satisfiesTargetBand(point.metrics, band));
  if (!feasible.length) {
    fail('NO_PORTFOLIO_IN_TARGET_BAND', 'Aucun portefeuille de la frontiere ne respecte la bande rendement/risque demandee.', {
      targets: band,
      frontier_points: frontier.length,
    });
  }

  const selected = [...feasible].sort((a, b) => {
    const volDiff = a.metrics.volatility_annualized - b.metrics.volatility_annualized;
    if (Math.abs(volDiff) > 1e-12) return volDiff;
    return b.metrics.expected_return_annualized - a.metrics.expected_return_annualized;
  })[0];

  return {
    selected,
    band,
    feasible_count: feasible.length,
    selection_rule: 'MIN_VOLATILITY_WITHIN_TARGET_BAND',
  };
}

function runAllocationStrategy({
  request,
  prepared,
  risk_budgets = null,
}) {
  if (!request || !request.objective || !request.objective.strategy) {
    fail('STRATEGY_REQUIRED', 'objective.strategy est requis pour lancer le moteur.');
  }

  const strategy = String(request.objective.strategy).toUpperCase();
  if (DEFERRED_STRATEGIES[strategy]) {
    fail(
      'STRATEGY_PREREQUISITE_MISSING',
      `${strategy} n est pas executable sans ses donnees prerequises.`,
      { strategy, prerequisite: DEFERRED_STRATEGIES[strategy] }
    );
  }
  if (!SUPPORTED_STRATEGIES.includes(strategy)) {
    fail('UNSUPPORTED_STRATEGY', 'Strategie non supportee par le moteur canonique Node.', { strategy });
  }

  const validated = validatePreparedData(prepared);
  const bounds = buildUniformWeightConstraints(request, validated.n);

  if (bounds.requested && !WEIGHT_CONSTRAINED_LIBRARY_STRATEGIES.has(strategy)) {
    fail(
      'STRATEGY_WEIGHT_CONSTRAINT_UNSUPPORTED',
      'Cette strategie ne peut pas appliquer les bornes de poids sans changer sa definition mathematique.',
      { strategy, min: bounds.min, max: bounds.max }
    );
  }

  let weights;
  let constraintsApplied = {
    fund_weight: bounds.requested,
    category_country_currency_srri: false,
    note: 'Les contraintes agregées sont reservees a AF-TASK-017.',
  };
  let details = null;
  const warnings = [];

  if (strategy === 'EQUAL_WEIGHT') {
    weights = wrapLibraryCall(strategy, () => PortfolioAllocation.equalWeights(validated.n));
  } else if (strategy === 'INVERSE_VOLATILITY') {
    const variances = validated.sigma.map((row, index) => row[index]);
    if (variances.some(value => value <= 0)) {
      fail('NON_POSITIVE_VARIANCE', 'Inverse Volatility exige des variances strictement positives.', {
        variances,
      });
    }
    weights = wrapLibraryCall(strategy, () => PortfolioAllocation.inverseVolatilityWeights(variances));
  } else if (strategy === 'GLOBAL_MINIMUM_VARIANCE') {
    weights = wrapLibraryCall(strategy, () =>
      PortfolioAllocation.globalMinimumVarianceWeights(validated.sigma, solverOptions(bounds))
    );
  } else if (strategy === 'EQUAL_RISK_CONTRIBUTION') {
    weights = wrapLibraryCall(strategy, () =>
      PortfolioAllocation.equalRiskContributionWeights(validated.sigma, solverOptions(bounds))
    );
  } else if (strategy === 'RISK_BUDGETING') {
    if (!Array.isArray(risk_budgets) || risk_budgets.length !== validated.n) {
      fail('RISK_BUDGETS_REQUIRED', 'RISK_BUDGETING exige un budget de risque par fonds.', {
        expected: validated.n,
        actual: Array.isArray(risk_budgets) ? risk_budgets.length : null,
      });
    }
    const budgets = risk_budgets.map((value, index) => {
      const number = finiteNumber(value, `risk_budgets[${index}]`);
      if (number <= 0) {
        fail('INVALID_RISK_BUDGET', 'Chaque budget de risque doit etre strictement positif.', {
          index,
          value: number,
        });
      }
      return number;
    });
    const budgetSum = budgets.reduce((sum, value) => sum + value, 0);
    const normalizedBudgets = budgets.map(value => value / budgetSum);
    weights = wrapLibraryCall(strategy, () =>
      PortfolioAllocation.riskBudgetingWeights(
        validated.sigma,
        normalizedBudgets,
        solverOptions(bounds)
      )
    );
    details = { risk_budgets: normalizedBudgets };
  } else if (strategy === 'MAXIMUM_DIVERSIFICATION') {
    weights = wrapLibraryCall(strategy, () =>
      PortfolioAllocation.mostDiversifiedWeights(validated.sigma, solverOptions(bounds))
    );
  } else if (strategy === 'MAXIMUM_SHARPE') {
    const rf = validated.risk_free && validated.risk_free.annual_rate;
    if (rf === null || rf === undefined) {
      fail('RISK_FREE_RATE_REQUIRED', 'MAXIMUM_SHARPE exige un taux sans risque annuel source.', {
        risk_free: validated.risk_free,
      });
    }
    weights = wrapLibraryCall(strategy, () =>
      PortfolioAllocation.maximumSharpeRatioWeights(
        validated.mu,
        validated.sigma,
        finiteNumber(rf, 'risk_free.annual_rate'),
        solverOptions(bounds)
      )
    );
  } else if (strategy === 'MINIMUM_CORRELATION') {
    weights = wrapLibraryCall(strategy, () =>
      PortfolioAllocation.minimumCorrelationWeights(validated.sigma)
    );
  } else if (strategy === 'MEAN_VARIANCE') {
    const frontier = buildFrontier({
      request,
      validated,
      prepared,
      bounds,
    });
    const chosen = chooseMeanVariance(frontier, request);
    weights = chosen.selected.weights.map(item => item.weight);
    details = {
      frontier,
      target_band: chosen.band,
      feasible_frontier_points: chosen.feasible_count,
      selection_rule: chosen.selection_rule,
    };
  }

  return buildResult({
    strategy,
    weights,
    validated,
    prepared,
    bounds,
    constraintsApplied,
    warnings,
    details,
  });
}

module.exports = {
  ENGINE_VERSION,
  ENGINE_NAME,
  PORTFOLIO_ALLOCATION_VERSION,
  SUPPORTED_STRATEGIES,
  DEFERRED_STRATEGIES,
  AllocationEngineError,
  validatePreparedData,
  assertCovariancePositiveSemidefinite,
  normalizeWeights,
  portfolioMetrics,
  buildUniformWeightConstraints,
  buildFrontier,
  runAllocationStrategy,
};
