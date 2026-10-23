const {
  CONTRACT_VERSION,
  AllocationContractError,
  normalizeOptimizationRequest,
  getAuthenticatedUserId,
  buildCapabilities,
} = require('../src/services/allocation/contract');
const { authenticate } = require('../src/middleware/auth');
const { signJwt } = require('../src/lib/jwt-rotation');

describe('AfricaFunds Allocation Contract V2', () => {
  test('normalise un payload canonique sans melanger rendement, risque et poids', () => {
    const result = normalizeOptimizationRequest({
      schema_version: CONTRACT_VERSION,
      universe: {
        fund_ids: [101, 102, 102, 103],
        base_currency: 'eur',
      },
      data: {
        horizon: '3Y',
        frequency: 'WEEKLY',
        return_method: 'TOTAL_RETURN',
      },
      objective: {
        strategy: 'MEAN_VARIANCE',
      },
      targets: {
        min_return: 0.04,
        max_return: 0.12,
        min_volatility: 0.03,
        max_volatility: 0.18,
      },
      constraints: {
        fund_count: { min: 2, max: 3 },
        fund_weight: { min: '0.05', max: '0.60' },
        categories: {
          Actions: { min: '0.10', max: '0.50' },
        },
        srri: { min: 2, max: 6 },
        currencies: {
          USD: { min: '0.00', max: '0.30' },
        },
      },
      output: {
        frontier_points: 250,
      },
    });

    expect(result.source_format).toBe('CANONICAL_V2');
    expect(result.request.schema_version).toBe(CONTRACT_VERSION);
    expect(result.request.universe.fund_ids).toEqual([101, 102, 103]);
    expect(result.request.universe.base_currency).toBe('EUR');

    expect(result.request.targets).toEqual({
      min_return: 0.04,
      max_return: 0.12,
      min_volatility: 0.03,
      max_volatility: 0.18,
    });

    expect(result.request.constraints.fund_weight).toEqual({
      min: 0.05,
      max: 0.60,
    });
    expect(result.request.constraints.categories.Actions).toEqual({
      min: 0.10,
      max: 0.50,
    });
    expect(result.request.constraints.currencies.USD).toEqual({
      min: 0,
      max: 0.30,
    });

    expect(result.request.units).toEqual({
      return: 'DECIMAL',
      volatility: 'DECIMAL',
      weight: 'DECIMAL',
    });
  });

  test('convertit le payload frontend legacy en V2 avec pourcentages explicites', () => {
    const result = normalizeOptimizationRequest({
      fund_data: [
        { fund_id: 201 },
        { idfond: 202 },
        { id: 203 },
      ],
      param_data: {
        min_return: '4',
        max_return: '12',
        min_risk: '3',
        max_risk: '18',
        num_portfolio: '150',
      },
      constraint_data: {
        Min_funds: '2',
        Max_funds: '3',
        Min_weight_per_fund: '5',
        Max_weight_per_fund: '60',
        Min_weight_actions: '10',
        Max_weight_actions: '50',
        Min_SRRI: '2',
        Max_SRRI: '6',
      },
    });

    expect(result.source_format).toBe('LEGACY_FRONTEND');
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'LEGACY_FRONTEND_PAYLOAD' }),
    ]));

    expect(result.request.universe.fund_ids).toEqual([201, 202, 203]);
    expect(result.request.targets.min_return).toBeCloseTo(0.04);
    expect(result.request.targets.max_return).toBeCloseTo(0.12);
    expect(result.request.targets.min_volatility).toBeCloseTo(0.03);
    expect(result.request.targets.max_volatility).toBeCloseTo(0.18);
    expect(result.request.constraints.fund_weight).toEqual({
      min: 0.05,
      max: 0.60,
    });
    expect(result.request.constraints.categories.Actions).toEqual({
      min: 0.10,
      max: 0.50,
    });
    expect(result.request.output.frontier_points).toBe(150);
  });

  test('refuse le payload legacy actuellement envoye avec fund_data vide', () => {
    expect(() => normalizeOptimizationRequest({
      fund_data: [],
      param_data: {
        min_return: '4',
        max_return: '12',
      },
      constraint_data: {},
    })).toThrow(AllocationContractError);

    try {
      normalizeOptimizationRequest({
        fund_data: [],
        param_data: {},
        constraint_data: {},
      });
    } catch (error) {
      expect(error.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'UNIVERSE_TOO_SMALL' }),
      ]));
    }
  });

  test('refuse une ancienne contrainte devise sans code devise explicite', () => {
    expect(() => normalizeOptimizationRequest({
      fund_data: [{ fund_id: 1 }, { fund_id: 2 }],
      param_data: {},
      constraint_data: {
        Min_currency_allocation: '10',
        Max_currency_allocation: '40',
      },
    })).toThrow(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({
          code: 'AMBIGUOUS_LEGACY_CURRENCY_CONSTRAINT',
        }),
      ]),
    }));
  });

  test('refuse les bornes incoherentes avant tout solveur', () => {
    expect(() => normalizeOptimizationRequest({
      universe: {
        fund_ids: [1, 2, 3],
      },
      targets: {
        min_return: 0.15,
        max_return: 0.05,
      },
      constraints: {
        fund_weight: {
          min: 0.70,
          max: 0.20,
        },
      },
    })).toThrow(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'MIN_GREATER_THAN_MAX' }),
      ]),
    }));
  });

  test('refuse tout owner injecte par le client', () => {
    expect(() => normalizeOptimizationRequest({
      owner_user_id: 999,
      universe: {
        fund_ids: [1, 2],
      },
    })).toThrow(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'CLIENT_OWNERSHIP_FIELD_FORBIDDEN' }),
      ]),
    }));
  });

  test('derive le proprietaire uniquement du JWT deja authentifie', () => {
    expect(getAuthenticatedUserId({ user: { id: 42 } })).toBe(42);
    expect(() => getAuthenticatedUserId({ user: {} })).toThrow(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'AUTHENTICATED_OWNER_REQUIRED' }),
      ]),
    }));
  });

  test('refuse une devise de base invalide', () => {
    expect(() => normalizeOptimizationRequest({
      universe: {
        fund_ids: [1, 2],
        base_currency: 'EURO',
      },
    })).toThrow(expect.objectContaining({
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'INVALID_CURRENCY' }),
      ]),
    }));
  });



  test('derive le meme owner apres authentification JWT reelle', () => {
    process.env.JWT_SECRET = 'allocation-contract-' + 'x'.repeat(64);
    delete process.env.JWT_SECRET_PREVIOUS;

    const token = signJwt({
      id: 77,
      email: 'investor@example.test',
      role: 'investisseur',
      typeusers_id: 1,
    }, { expiresIn: '5m' });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    };
    const response = {
      statusCode: null,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };

    let nextCalled = false;
    authenticate(req, response, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(response.statusCode).toBeNull();
    expect(req.user.id).toBe(77);
    expect(getAuthenticatedUserId(req)).toBe(77);

    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_PREVIOUS;
  });

  test('refuse une requete allocation sans Bearer JWT', () => {
    const req = { headers: {} };
    const response = {
      statusCode: null,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };

    let nextCalled = false;
    authenticate(req, response, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(response.statusCode).toBe(401);
    expect(response.payload).toEqual(expect.objectContaining({
      error: expect.stringMatching(/Token/),
    }));
  });

  test('annonce explicitement que le contrat existe sans moteur runtime active', () => {
    const caps = buildCapabilities();
    expect(caps.schema_version).toBe(CONTRACT_VERSION);
    expect(caps.optimization_enabled).toBe(false);
    expect(caps.status).toBe('CONTRACT_ONLY');
    expect(caps.ownership).toBe('JWT_USER_ID_ONLY');
    expect(caps.strategies).toEqual(expect.arrayContaining([
      'EQUAL_WEIGHT',
      'GLOBAL_MINIMUM_VARIANCE',
      'EQUAL_RISK_CONTRIBUTION',
      'MEAN_VARIANCE',
      'MAXIMUM_SHARPE',
    ]));
  });
});
