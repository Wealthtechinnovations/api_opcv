'use strict';

/**
 * AfricaFunds Allocation Contract V2
 *
 * Pure contract/validation layer. This module does not fetch data, persist data
 * or run an optimiser. It exists so every future allocation engine consumes the
 * same explicit units, ownership semantics and constraint vocabulary.
 */

const CONTRACT_VERSION = '2.0.0';

const STRATEGIES = Object.freeze([
  'EQUAL_WEIGHT',
  'INVERSE_VOLATILITY',
  'GLOBAL_MINIMUM_VARIANCE',
  'EQUAL_RISK_CONTRIBUTION',
  'RISK_BUDGETING',
  'MAXIMUM_DIVERSIFICATION',
  'MAXIMUM_SHARPE',
  'MEAN_VARIANCE',
  'MINIMUM_CORRELATION',
  'MINIMUM_TRACKING_ERROR',
]);

const HORIZONS = Object.freeze(['1Y', '3Y', '5Y', 'MAX', 'CUSTOM']);
const FREQUENCIES = Object.freeze(['AUTO', 'DAILY', 'WEEKLY', 'MONTHLY']);
const RETURN_METHODS = Object.freeze(['TOTAL_RETURN', 'NAV']);

class AllocationContractError extends Error {
  constructor(errors, message = 'Allocation request validation failed') {
    super(message);
    this.name = 'AllocationContractError';
    this.code = 'ALLOCATION_CONTRACT_INVALID';
    this.statusCode = 400;
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}

function issue(path, code, message) {
  return { path, code, message };
}

function isBlank(value) {
  return value === undefined || value === null || value === '';
}

function toFinite(value, path, errors, options = {}) {
  if (isBlank(value)) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    errors.push(issue(path, 'NOT_FINITE_NUMBER', 'La valeur doit être un nombre fini.'));
    return null;
  }
  if (options.min !== undefined && number < options.min) {
    errors.push(issue(path, 'NUMBER_BELOW_MIN', `La valeur doit être >= ${options.min}.`));
  }
  if (options.max !== undefined && number > options.max) {
    errors.push(issue(path, 'NUMBER_ABOVE_MAX', `La valeur doit être <= ${options.max}.`));
  }
  return number;
}

function toInteger(value, path, errors, options = {}) {
  const number = toFinite(value, path, errors, options);
  if (number === null) return null;
  if (!Number.isInteger(number)) {
    errors.push(issue(path, 'NOT_INTEGER', 'La valeur doit être un entier.'));
    return null;
  }
  return number;
}

function toPercentDecimal(value, path, errors) {
  const number = toFinite(value, path, errors);
  return number === null ? null : number / 100;
}

function compactRange(min, max) {
  if (min === null && max === null) return undefined;
  const out = {};
  if (min !== null) out.min = min;
  if (max !== null) out.max = max;
  return out;
}

function normalizeRange(range, path, errors, options = {}) {
  if (!range) return null;
  const min = toFinite(range.min, `${path}.min`, errors, options);
  const max = toFinite(range.max, `${path}.max`, errors, options);
  if (min !== null && max !== null && min > max) {
    errors.push(issue(path, 'MIN_GREATER_THAN_MAX', 'La borne minimale ne peut pas dépasser la borne maximale.'));
  }
  return compactRange(min, max) || null;
}

function validateRange(range, path, errors, options = {}) {
  normalizeRange(range, path, errors, options);
}

function normalizeFundIds(values, errors, path = 'universe.fund_ids') {
  if (!Array.isArray(values)) {
    errors.push(issue(path, 'FUND_IDS_REQUIRED', 'fund_ids doit être un tableau.'));
    return [];
  }

  const ids = [];
  for (let i = 0; i < values.length; i += 1) {
    const raw = values[i];
    let candidate = raw;
    if (raw && typeof raw === 'object') {
      candidate = raw.fund_id ?? raw.idfond ?? raw.id ?? raw.value;
    }
    const id = toInteger(candidate, `${path}[${i}]`, errors, { min: 1 });
    if (id !== null) ids.push(id);
  }

  return [...new Set(ids)];
}

function normalizeCurrency(value, path, errors) {
  if (isBlank(value)) return 'LOCAL';
  const currency = String(value).trim().toUpperCase();
  if (currency !== 'LOCAL' && !/^[A-Z]{3}$/.test(currency)) {
    errors.push(issue(path, 'INVALID_CURRENCY', 'La devise doit être LOCAL ou un code ISO 4217 sur 3 lettres.'));
  }
  return currency;
}

function normalizeCanonical(input) {
  const errors = [];
  const warnings = [];

  for (const forbidden of ['user_id', 'userid', 'owner_user_id']) {
    if (!isBlank(input[forbidden])) {
      errors.push(issue(forbidden, 'CLIENT_OWNERSHIP_FIELD_FORBIDDEN', 'Le propriétaire est dérivé du JWT et ne peut pas être fourni par le client.'));
    }
  }

  if (!isBlank(input.schema_version) && input.schema_version !== CONTRACT_VERSION) {
    errors.push(issue('schema_version', 'UNSUPPORTED_SCHEMA_VERSION', `Version supportée: ${CONTRACT_VERSION}.`));
  }

  const universe = input.universe || {};
  const fundIds = normalizeFundIds(universe.fund_ids, errors);
  if (fundIds.length < 2) {
    errors.push(issue('universe.fund_ids', 'UNIVERSE_TOO_SMALL', 'Au moins deux fonds distincts sont requis pour une optimisation.'));
  }

  const data = input.data || {};
  const horizon = String(data.horizon || '3Y').toUpperCase();
  if (!HORIZONS.includes(horizon)) {
    errors.push(issue('data.horizon', 'INVALID_HORIZON', `Valeurs autorisées: ${HORIZONS.join(', ')}.`));
  }

  const frequency = String(data.frequency || 'AUTO').toUpperCase();
  if (!FREQUENCIES.includes(frequency)) {
    errors.push(issue('data.frequency', 'INVALID_FREQUENCY', `Valeurs autorisées: ${FREQUENCIES.join(', ')}.`));
  }

  const returnMethod = String(data.return_method || 'TOTAL_RETURN').toUpperCase();
  if (!RETURN_METHODS.includes(returnMethod)) {
    errors.push(issue('data.return_method', 'INVALID_RETURN_METHOD', `Valeurs autorisées: ${RETURN_METHODS.join(', ')}.`));
  }

  if (horizon === 'CUSTOM' && (isBlank(data.date_from) || isBlank(data.date_to))) {
    errors.push(issue('data', 'CUSTOM_DATES_REQUIRED', 'date_from et date_to sont requis pour horizon=CUSTOM.'));
  }

  const objective = input.objective || {};
  const strategy = String(objective.strategy || 'MEAN_VARIANCE').toUpperCase();
  if (!STRATEGIES.includes(strategy)) {
    errors.push(issue('objective.strategy', 'INVALID_STRATEGY', `Valeurs autorisées: ${STRATEGIES.join(', ')}.`));
  }

  const targets = input.targets || {};
  validateRange(
    compactRange(
      toFinite(targets.min_return, 'targets.min_return', errors, { min: -10, max: 10 }),
      toFinite(targets.max_return, 'targets.max_return', errors, { min: -10, max: 10 })
    ),
    'targets.return',
    errors,
    { min: -10, max: 10 }
  );
  validateRange(
    compactRange(
      toFinite(targets.min_volatility, 'targets.min_volatility', errors, { min: 0, max: 10 }),
      toFinite(targets.max_volatility, 'targets.max_volatility', errors, { min: 0, max: 10 })
    ),
    'targets.volatility',
    errors,
    { min: 0, max: 10 }
  );

  const constraints = input.constraints || {};
  const fundCount = constraints.fund_count;
  if (fundCount) {
    const min = toInteger(fundCount.min, 'constraints.fund_count.min', errors, { min: 1 });
    const max = toInteger(fundCount.max, 'constraints.fund_count.max', errors, { min: 1 });
    if (min !== null && max !== null && min > max) {
      errors.push(issue('constraints.fund_count', 'MIN_GREATER_THAN_MAX', 'Le nombre minimum de fonds ne peut pas dépasser le maximum.'));
    }
    if (max !== null && max > fundIds.length) {
      errors.push(issue('constraints.fund_count.max', 'FUND_COUNT_EXCEEDS_UNIVERSE', 'Le maximum de fonds ne peut pas dépasser la taille de l’univers.'));
    }
  }

  validateRange(constraints.fund_weight, 'constraints.fund_weight', errors, { min: 0, max: 1 });
  validateRange(constraints.srri, 'constraints.srri', errors, { min: 1, max: 7 });

  const categories = {};
  if (constraints.categories !== undefined) {
    if (!constraints.categories || typeof constraints.categories !== 'object' || Array.isArray(constraints.categories)) {
      errors.push(issue('constraints.categories', 'INVALID_CATEGORIES', 'categories doit être un objet indexé par catégorie.'));
    } else {
      for (const [name, range] of Object.entries(constraints.categories)) {
        const normalizedRange = normalizeRange(range, `constraints.categories.${name}`, errors, { min: 0, max: 1 });
        if (normalizedRange) categories[name] = normalizedRange;
      }
    }
  }

  const currencies = {};
  if (constraints.currencies !== undefined) {
    if (!constraints.currencies || typeof constraints.currencies !== 'object' || Array.isArray(constraints.currencies)) {
      errors.push(issue('constraints.currencies', 'INVALID_CURRENCIES', 'currencies doit être un objet indexé par code devise.'));
    } else {
      for (const [code, range] of Object.entries(constraints.currencies)) {
        const normalizedCode = normalizeCurrency(code, `constraints.currencies.${code}`, errors);
        if (normalizedCode === 'LOCAL') {
          errors.push(issue(`constraints.currencies.${code}`, 'LOCAL_NOT_ALLOWED_AS_EXPOSURE_BUCKET', 'Utiliser un code devise explicite pour une contrainte d’exposition.'));
        }
        const normalizedRange = normalizeRange(range, `constraints.currencies.${code}`, errors, { min: 0, max: 1 });
        if (normalizedRange) currencies[normalizedCode] = normalizedRange;
      }
    }
  }

  const output = input.output || {};
  const frontierPoints = toInteger(output.frontier_points ?? 100, 'output.frontier_points', errors, { min: 2, max: 5000 });
  const baseCurrency = normalizeCurrency(universe.base_currency, 'universe.base_currency', errors);
  const simulationId = isBlank(input.simulation_id)
    ? null
    : toInteger(input.simulation_id, 'simulation_id', errors, { min: 1 });

  if (errors.length) throw new AllocationContractError(errors);

  return {
    source_format: 'CANONICAL_V2',
    warnings,
    request: {
      schema_version: CONTRACT_VERSION,
      units: {
        return: 'DECIMAL',
        volatility: 'DECIMAL',
        weight: 'DECIMAL',
      },
      universe: {
        fund_ids: fundIds,
        base_currency: baseCurrency,
      },
      data: {
        horizon,
        frequency,
        return_method: returnMethod,
        date_from: data.date_from || null,
        date_to: data.date_to || null,
      },
      objective: { strategy },
      targets: {
        min_return: isBlank(targets.min_return) ? null : Number(targets.min_return),
        max_return: isBlank(targets.max_return) ? null : Number(targets.max_return),
        min_volatility: isBlank(targets.min_volatility) ? null : Number(targets.min_volatility),
        max_volatility: isBlank(targets.max_volatility) ? null : Number(targets.max_volatility),
      },
      constraints: {
        fund_count: fundCount ? {
          min: isBlank(fundCount.min) ? null : Number(fundCount.min),
          max: isBlank(fundCount.max) ? null : Number(fundCount.max),
        } : null,
        fund_weight: constraints.fund_weight ? {
          min: isBlank(constraints.fund_weight.min) ? null : Number(constraints.fund_weight.min),
          max: isBlank(constraints.fund_weight.max) ? null : Number(constraints.fund_weight.max),
        } : null,
        categories,
        srri: constraints.srri ? {
          min: isBlank(constraints.srri.min) ? null : Number(constraints.srri.min),
          max: isBlank(constraints.srri.max) ? null : Number(constraints.srri.max),
        } : null,
        currencies,
      },
      output: {
        frontier_points: frontierPoints === null ? 100 : frontierPoints,
      },
      simulation_id: simulationId,
    },
  };
}

function legacyFundIds(input) {
  if (Array.isArray(input.fund_data)) return input.fund_data;
  if (Array.isArray(input.fund_ids)) return input.fund_ids;
  if (typeof input.ids === 'string') return input.ids.split(',').filter(Boolean);
  return [];
}

function normalizeLegacy(input) {
  const errors = [];
  const warnings = [{
    code: 'LEGACY_FRONTEND_PAYLOAD',
    message: 'Payload historique converti vers le contrat V2. Migrer le client vers le format canonique.',
  }];

  for (const forbidden of ['user_id', 'userid', 'owner_user_id']) {
    if (!isBlank(input[forbidden])) {
      errors.push(issue(forbidden, 'CLIENT_OWNERSHIP_FIELD_FORBIDDEN', 'Le propriétaire est dérivé du JWT et ne peut pas être fourni par le client.'));
    }
  }

  const fundIds = normalizeFundIds(legacyFundIds(input), errors, 'fund_data');
  if (fundIds.length < 2) {
    errors.push(issue('fund_data', 'UNIVERSE_TOO_SMALL', 'Le payload legacy doit contenir au moins deux fonds identifiables.'));
  }

  const params = input.param_data || {};
  const constraints = input.constraint_data || {};

  const minReturn = toPercentDecimal(params.min_return, 'param_data.min_return', errors);
  const maxReturn = toPercentDecimal(params.max_return, 'param_data.max_return', errors);
  const minRisk = toPercentDecimal(params.min_risk, 'param_data.min_risk', errors);
  const maxRisk = toPercentDecimal(params.max_risk, 'param_data.max_risk', errors);

  if (minReturn !== null && maxReturn !== null && minReturn > maxReturn) {
    errors.push(issue('param_data.return', 'MIN_GREATER_THAN_MAX', 'Le rendement minimum ne peut pas dépasser le rendement maximum.'));
  }
  if (minRisk !== null && maxRisk !== null && minRisk > maxRisk) {
    errors.push(issue('param_data.risk', 'MIN_GREATER_THAN_MAX', 'Le risque minimum ne peut pas dépasser le risque maximum.'));
  }

  const fundCountMin = toInteger(constraints.Min_funds, 'constraint_data.Min_funds', errors, { min: 1 });
  const fundCountMax = toInteger(constraints.Max_funds, 'constraint_data.Max_funds', errors, { min: 1 });
  if (fundCountMin !== null && fundCountMax !== null && fundCountMin > fundCountMax) {
    errors.push(issue('constraint_data.fund_count', 'MIN_GREATER_THAN_MAX', 'Le nombre minimum de fonds ne peut pas dépasser le maximum.'));
  }
  if (fundCountMax !== null && fundCountMax > fundIds.length) {
    errors.push(issue('constraint_data.Max_funds', 'FUND_COUNT_EXCEEDS_UNIVERSE', 'Le maximum de fonds ne peut pas dépasser la taille de l’univers.'));
  }

  const fundWeightMin = toPercentDecimal(constraints.Min_weight_per_fund, 'constraint_data.Min_weight_per_fund', errors);
  const fundWeightMax = toPercentDecimal(constraints.Max_weight_per_fund, 'constraint_data.Max_weight_per_fund', errors);

  const categories = {};
  const legacyCategories = [
    ['Actions', 'Min_weight_actions', 'Max_weight_actions'],
    ['Obligations', 'Min_weight_obligations', 'Max_weight_obligations'],
    ['Monétaire', 'Min_weight_monetary', 'Max_weight_monetary'],
    ['Diversifié', 'Min_weight_diversified', 'Max_weight_diversified'],
  ];
  for (const [name, minKey, maxKey] of legacyCategories) {
    const min = toPercentDecimal(constraints[minKey], `constraint_data.${minKey}`, errors);
    const max = toPercentDecimal(constraints[maxKey], `constraint_data.${maxKey}`, errors);
    const range = compactRange(min, max);
    if (range) {
      validateRange(range, `constraints.categories.${name}`, errors, { min: 0, max: 1 });
      categories[name] = range;
    }
  }

  const srriMin = toFinite(constraints.Min_SRRI, 'constraint_data.Min_SRRI', errors, { min: 1, max: 7 });
  const srriMax = toFinite(constraints.Max_SRRI, 'constraint_data.Max_SRRI', errors, { min: 1, max: 7 });
  if (srriMin !== null && srriMax !== null && srriMin > srriMax) {
    errors.push(issue('constraint_data.SRRI', 'MIN_GREATER_THAN_MAX', 'Le SRRI minimum ne peut pas dépasser le maximum.'));
  }

  if (!isBlank(constraints.Min_currency_allocation) || !isBlank(constraints.Max_currency_allocation)) {
    errors.push(issue(
      'constraint_data.currency_allocation',
      'AMBIGUOUS_LEGACY_CURRENCY_CONSTRAINT',
      'Le payload legacy ne précise pas la devise concernée. Utiliser constraints.currencies avec un code devise explicite.'
    ));
  }

  if (fundWeightMin !== null && fundWeightMax !== null && fundWeightMin > fundWeightMax) {
    errors.push(issue('constraint_data.fund_weight', 'MIN_GREATER_THAN_MAX', 'Le poids minimum par fonds ne peut pas dépasser le maximum.'));
  }

  const frontierPoints = toInteger(params.num_portfolio, 'param_data.num_portfolio', errors, { min: 2, max: 5000 });
  const simulationId = isBlank(input.simulation_id)
    ? null
    : toInteger(input.simulation_id, 'simulation_id', errors, { min: 1 });

  if (errors.length) throw new AllocationContractError(errors);

  return {
    source_format: 'LEGACY_FRONTEND',
    warnings,
    request: {
      schema_version: CONTRACT_VERSION,
      units: {
        return: 'DECIMAL',
        volatility: 'DECIMAL',
        weight: 'DECIMAL',
      },
      universe: {
        fund_ids: fundIds,
        base_currency: 'LOCAL',
      },
      data: {
        horizon: '3Y',
        frequency: 'AUTO',
        return_method: 'TOTAL_RETURN',
        date_from: null,
        date_to: null,
      },
      objective: { strategy: 'MEAN_VARIANCE' },
      targets: {
        min_return: minReturn,
        max_return: maxReturn,
        min_volatility: minRisk,
        max_volatility: maxRisk,
      },
      constraints: {
        fund_count: compactRange(fundCountMin, fundCountMax) || null,
        fund_weight: compactRange(fundWeightMin, fundWeightMax) || null,
        categories,
        srri: compactRange(srriMin, srriMax) || null,
        currencies: {},
      },
      output: {
        frontier_points: frontierPoints === null ? 100 : frontierPoints,
      },
      simulation_id: simulationId,
    },
  };
}

function isLegacyPayload(input) {
  return Boolean(
    input &&
    typeof input === 'object' &&
    (
      Object.prototype.hasOwnProperty.call(input, 'fund_data') ||
      Object.prototype.hasOwnProperty.call(input, 'param_data') ||
      Object.prototype.hasOwnProperty.call(input, 'constraint_data')
    )
  );
}

function normalizeOptimizationRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AllocationContractError(issue('$', 'BODY_OBJECT_REQUIRED', 'Le body doit être un objet JSON.'));
  }
  return isLegacyPayload(input) ? normalizeLegacy(input) : normalizeCanonical(input);
}

function getAuthenticatedUserId(req) {
  const errors = [];
  const id = toInteger(req && req.user && req.user.id, 'auth.user.id', errors, { min: 1 });
  if (id === null || errors.length) {
    throw new AllocationContractError(
      issue('auth.user.id', 'AUTHENTICATED_OWNER_REQUIRED', 'Un utilisateur JWT authentifié avec un id valide est requis.'),
      'Authenticated allocation owner required'
    );
  }
  return id;
}

function buildCapabilities() {
  return {
    schema_version: CONTRACT_VERSION,
    optimization_enabled: false,
    status: 'CONTRACT_ONLY',
    units: {
      return: 'DECIMAL',
      volatility: 'DECIMAL',
      weight: 'DECIMAL',
    },
    strategies: STRATEGIES,
    horizons: HORIZONS,
    frequencies: FREQUENCIES,
    return_methods: RETURN_METHODS,
    ownership: 'JWT_USER_ID_ONLY',
    legacy_payload_adapter: true,
  };
}

module.exports = {
  CONTRACT_VERSION,
  STRATEGIES,
  HORIZONS,
  FREQUENCIES,
  RETURN_METHODS,
  AllocationContractError,
  normalizeOptimizationRequest,
  getAuthenticatedUserId,
  buildCapabilities,
};
