const {
  AllocationSimulationError,
  normalizePortfolioInput,
  createAllocationSimulationService,
} = require('../src/services/allocation/simulations');

function row(data) {
  return {
    ...data,
    toJSON() {
      return { ...data };
    },
  };
}

describe('Allocation simulation ownership', () => {
  test('liste uniquement les simulations du owner JWT', async () => {
    const simulationModel = {
      findAll: jest.fn(async () => [
        row({ id: 1, nom: 'S1', description: null }),
      ]),
      findOne: jest.fn(),
      create: jest.fn(),
    };
    const portfolioModel = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const service = createAllocationSimulationService({
      simulationModel,
      simulationPortfolioModel: portfolioModel,
    });

    const result = await service.listForOwner(42);

    expect(simulationModel.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { user_id: 42 },
    }));
    expect(result).toEqual([
      { id: 1, nom: 'S1', description: null },
    ]);
  });

  test('cree toujours la simulation avec le owner fourni par la couche JWT', async () => {
    const simulationModel = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(async values => row({ id: 9, ...values })),
    };
    const portfolioModel = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const service = createAllocationSimulationService({
      simulationModel,
      simulationPortfolioModel: portfolioModel,
    });

    const created = await service.createForOwner(77, {
      name: 'Allocation prudente',
      description: 'Test',
      user_id: 999,
    });

    expect(simulationModel.create).toHaveBeenCalledWith({
      nom: 'Allocation prudente',
      description: 'Test',
      user_id: 77,
    });
    expect(created.user_id).toBe(77);
  });

  test('retourne 404 si la simulation n appartient pas au owner sans reveler son existence', async () => {
    const service = createAllocationSimulationService({
      simulationModel: {
        findAll: jest.fn(),
        findOne: jest.fn(async () => null),
        create: jest.fn(),
      },
      simulationPortfolioModel: {
        findAll: jest.fn(),
        create: jest.fn(),
      },
    });

    await expect(service.getOwnedSimulation(10, 555)).rejects.toEqual(expect.objectContaining({
      code: 'SIMULATION_NOT_FOUND',
      statusCode: 404,
    }));
  });

  test('ne lit les portefeuilles qu apres verification du parent owner', async () => {
    const simulationModel = {
      findAll: jest.fn(),
      findOne: jest.fn(async options => {
        expect(options.where).toEqual({ id: 12, user_id: 8 });
        return row({ id: 12, user_id: 8 });
      }),
      create: jest.fn(),
    };
    const portfolioModel = {
      findAll: jest.fn(async options => {
        expect(options.where).toEqual({ simulation_id: 12 });
        return [row({
          id: 1,
          nom: 'P1',
          fond_ids: '1,2',
          poids: '0.4,0.6',
          simulation_id: 12,
        })];
      }),
      create: jest.fn(),
    };

    const service = createAllocationSimulationService({
      simulationModel,
      simulationPortfolioModel: portfolioModel,
    });

    const portfolios = await service.listPortfoliosForOwner(8, 12);
    expect(portfolios).toHaveLength(1);
    expect(simulationModel.findOne).toHaveBeenCalledTimes(1);
    expect(portfolioModel.findAll).toHaveBeenCalledTimes(1);
  });
});

describe('Allocation portfolio legacy-compatible storage guard', () => {
  test('valide ids et poids puis serialise dans le format historique', () => {
    const normalized = normalizePortfolioInput({
      name: 'Portefeuille 1',
      fund_ids: [101, 202, 303],
      weights: [0.2, 0.3, 0.5],
    });

    expect(normalized.fund_ids_serialized).toBe('101,202,303');
    expect(normalized.weights_serialized).toBe('0.2,0.3,0.5');
  });

  test('refuse une somme de poids differente de 1', () => {
    expect(() => normalizePortfolioInput({
      name: 'Invalide',
      fund_ids: [1, 2],
      weights: [0.4, 0.4],
    })).toThrow(expect.objectContaining({
      code: 'WEIGHTS_MUST_SUM_TO_ONE',
    }));
  });

  test('refuse un fonds duplique', () => {
    expect(() => normalizePortfolioInput({
      name: 'Doublon',
      fund_ids: [1, 1],
      weights: [0.5, 0.5],
    })).toThrow(expect.objectContaining({
      code: 'DUPLICATE_FUND_ID',
    }));
  });

  test('cree un portefeuille seulement sous une simulation possedee par le owner', async () => {
    const simulationModel = {
      findAll: jest.fn(),
      findOne: jest.fn(async () => row({ id: 33, user_id: 5 })),
      create: jest.fn(),
    };
    const portfolioModel = {
      findAll: jest.fn(),
      create: jest.fn(async values => row({ id: 88, ...values })),
    };

    const service = createAllocationSimulationService({
      simulationModel,
      simulationPortfolioModel: portfolioModel,
    });

    const created = await service.createPortfolioForOwner(5, 33, {
      name: 'P',
      fund_ids: [10, 20],
      weights: [0.25, 0.75],
    });

    expect(simulationModel.findOne).toHaveBeenCalledWith({
      where: { id: 33, user_id: 5 },
    });
    expect(portfolioModel.create).toHaveBeenCalledWith({
      nom: 'P',
      fond_ids: '10,20',
      poids: '0.25,0.75',
      simulation_id: 33,
      portefeuille_id: null,
    });
    expect(created.fund_ids).toEqual([10, 20]);
    expect(created.weights).toEqual([0.25, 0.75]);
  });

  test('le service expose une erreur typee et non une erreur DB brute', () => {
    expect(() => normalizePortfolioInput({
      name: '',
      fund_ids: [1, 2],
      weights: [0.5, 0.5],
    })).toThrow(AllocationSimulationError);
  });
});
