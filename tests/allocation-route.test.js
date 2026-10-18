const router = require('../src/routes/apigestionallocation');
const { signJwt } = require('../src/lib/jwt-rotation');

function findRoute(path, method) {
  const layer = router.stack.find(
    item => item.route && item.route.path === path && item.route.methods[method]
  );
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  return layer.route.stack.map(item => item.handle);
}

function makeResponse() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function runHandlers(handlers, req, res) {
  let index = 0;
  const next = () => {
    const handler = handlers[index++];
    if (handler) return handler(req, res, next);
    return undefined;
  };
  return next();
}

describe('AfricaFunds allocation API routes', () => {
  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_PREVIOUS;
  });

  test('GET capabilities expose le contrat sans annoncer un moteur actif', () => {
    const [handler] = findRoute('/api/allocation/capabilities', 'get');
    const res = makeResponse();

    handler({ headers: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.code).toBe(200);
    expect(res.payload.data).toEqual(expect.objectContaining({
      schema_version: '2.0.0',
      optimization_enabled: false,
      status: 'CONTRACT_ONLY',
      ownership: 'JWT_USER_ID_ONLY',
    }));
  });

  test('POST validate exige un JWT', () => {
    const handlers = findRoute('/api/allocation/validate', 'post');
    const req = {
      headers: {},
      body: {
        universe: { fund_ids: [1, 2] },
      },
    };
    const res = makeResponse();

    runHandlers(handlers, req, res);

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual(expect.objectContaining({
      error: expect.stringMatching(/Token/),
    }));
  });

  test('POST validate derive owner_user_id du JWT et normalise le contrat', () => {
    process.env.JWT_SECRET = 'allocation-route-' + 'z'.repeat(64);

    const token = signJwt({
      id: 55,
      email: 'owner@example.test',
      role: 'investisseur',
      typeusers_id: 1,
    }, { expiresIn: '5m' });

    const handlers = findRoute('/api/allocation/validate', 'post');
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        universe: {
          fund_ids: [10, 20, 20, 30],
          base_currency: 'USD',
        },
        objective: {
          strategy: 'GLOBAL_MINIMUM_VARIANCE',
        },
        constraints: {
          fund_weight: {
            min: 0.05,
            max: 0.70,
          },
        },
      },
    };
    const res = makeResponse();

    runHandlers(handlers, req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.code).toBe(200);
    expect(res.payload.data.owner_user_id).toBe(55);
    expect(res.payload.data.source_format).toBe('CANONICAL_V2');
    expect(res.payload.data.request.universe.fund_ids).toEqual([10, 20, 30]);
    expect(res.payload.data.request.objective.strategy).toBe('GLOBAL_MINIMUM_VARIANCE');
  });

  test('POST validate refuse owner_user_id injecte par le client', () => {
    process.env.JWT_SECRET = 'allocation-route-' + 'y'.repeat(64);

    const token = signJwt({ id: 9 }, { expiresIn: '5m' });
    const handlers = findRoute('/api/allocation/validate', 'post');
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        owner_user_id: 999,
        universe: {
          fund_ids: [1, 2],
        },
      },
    };
    const res = makeResponse();

    runHandlers(handlers, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload.error).toBe('ALLOCATION_CONTRACT_INVALID');
    expect(res.payload.details).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'CLIENT_OWNERSHIP_FIELD_FORBIDDEN',
      }),
    ]));
  });

  test('POST validate ne transforme pas un payload legacy vide en faux portefeuille', () => {
    process.env.JWT_SECRET = 'allocation-route-' + 'w'.repeat(64);

    const token = signJwt({ id: 10 }, { expiresIn: '5m' });
    const handlers = findRoute('/api/allocation/validate', 'post');
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        fund_data: [],
        param_data: {},
        constraint_data: {},
      },
    };
    const res = makeResponse();

    runHandlers(handlers, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload.details).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'UNIVERSE_TOO_SMALL',
      }),
    ]));
  });
});
