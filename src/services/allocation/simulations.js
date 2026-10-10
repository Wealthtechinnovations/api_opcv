'use strict';

class AllocationSimulationError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.name = 'AllocationSimulationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AllocationSimulationError(
      'INVALID_IDENTIFIER',
      `${field} doit etre un entier positif.`,
      400,
      { field }
    );
  }
  return number;
}

function cleanText(value, field, { required = false, maxLength = 255 } = {}) {
  if (value === undefined || value === null) {
    if (required) {
      throw new AllocationSimulationError('FIELD_REQUIRED', `${field} est requis.`, 400, { field });
    }
    return null;
  }

  const text = String(value).trim();
  if (!text && required) {
    throw new AllocationSimulationError('FIELD_REQUIRED', `${field} est requis.`, 400, { field });
  }
  if (text.length > maxLength) {
    throw new AllocationSimulationError(
      'FIELD_TOO_LONG',
      `${field} depasse ${maxLength} caracteres.`,
      400,
      { field, max_length: maxLength }
    );
  }
  return text || null;
}

function plain(row) {
  if (!row) return row;
  if (typeof row.toJSON === 'function') return row.toJSON();
  return { ...row };
}

function normalizePortfolioInput(input) {
  const payload = input || {};
  const name = cleanText(payload.name ?? payload.nom, 'name', { required: true });

  const fundIds = payload.fund_ids ?? payload.fundIds;
  const weights = payload.weights ?? payload.poids;

  if (!Array.isArray(fundIds) || !fundIds.length) {
    throw new AllocationSimulationError(
      'FUND_IDS_REQUIRED',
      'fund_ids doit etre un tableau non vide.',
      400
    );
  }
  if (!Array.isArray(weights) || weights.length !== fundIds.length) {
    throw new AllocationSimulationError(
      'WEIGHTS_LENGTH_MISMATCH',
      'weights doit etre un tableau de meme longueur que fund_ids.',
      400
    );
  }

  const normalizedFundIds = fundIds.map((id, index) => positiveInteger(id, `fund_ids[${index}]`));
  if (new Set(normalizedFundIds).size !== normalizedFundIds.length) {
    throw new AllocationSimulationError('DUPLICATE_FUND_ID', 'Un fonds ne peut apparaitre qu une fois dans un portefeuille.', 400);
  }

  const normalizedWeights = weights.map((weight, index) => {
    const number = Number(weight);
    if (!Number.isFinite(number) || number < 0 || number > 1) {
      throw new AllocationSimulationError(
        'INVALID_WEIGHT',
        'Chaque poids doit etre un decimal fini compris entre 0 et 1.',
        400,
        { index }
      );
    }
    return number;
  });

  const sum = normalizedWeights.reduce((total, weight) => total + weight, 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new AllocationSimulationError(
      'WEIGHTS_MUST_SUM_TO_ONE',
      'La somme des poids doit etre egale a 1.',
      400,
      { sum }
    );
  }

  const fundIdsSerialized = normalizedFundIds.join(',');
  const weightsSerialized = normalizedWeights.join(',');
  if (fundIdsSerialized.length > 255 || weightsSerialized.length > 255) {
    throw new AllocationSimulationError(
      'LEGACY_STORAGE_CAPACITY_EXCEEDED',
      'Le portefeuille depasse la capacite des colonnes historiques. Utiliser le futur schema normalise AF-TASK-015.',
      422,
      {
        fund_ids_length: fundIdsSerialized.length,
        weights_length: weightsSerialized.length,
      }
    );
  }

  return {
    name,
    fund_ids: normalizedFundIds,
    weights: normalizedWeights,
    fund_ids_serialized: fundIdsSerialized,
    weights_serialized: weightsSerialized,
  };
}

function createAllocationSimulationService({
  simulationModel,
  simulationPortfolioModel,
}) {
  if (!simulationModel || typeof simulationModel.findAll !== 'function' || typeof simulationModel.findOne !== 'function' || typeof simulationModel.create !== 'function') {
    throw new TypeError('simulationModel findAll/findOne/create are required');
  }
  if (!simulationPortfolioModel || typeof simulationPortfolioModel.findAll !== 'function' || typeof simulationPortfolioModel.create !== 'function') {
    throw new TypeError('simulationPortfolioModel findAll/create are required');
  }

  async function getOwnedSimulation(ownerUserId, simulationId) {
    const owner = positiveInteger(ownerUserId, 'owner_user_id');
    const id = positiveInteger(simulationId, 'simulation_id');

    const row = await simulationModel.findOne({
      where: {
        id,
        user_id: owner,
      },
    });

    if (!row) {
      // 404 instead of 403: do not reveal whether another user owns the id.
      throw new AllocationSimulationError(
        'SIMULATION_NOT_FOUND',
        'Simulation introuvable.',
        404
      );
    }
    return row;
  }

  async function listForOwner(ownerUserId) {
    const owner = positiveInteger(ownerUserId, 'owner_user_id');
    const rows = await simulationModel.findAll({
      where: { user_id: owner },
      attributes: ['id', 'nom', 'description'],
      order: [['id', 'ASC']],
    });
    return (rows || []).map(plain);
  }

  async function createForOwner(ownerUserId, input) {
    const owner = positiveInteger(ownerUserId, 'owner_user_id');
    const payload = input || {};
    const name = cleanText(payload.name ?? payload.nom, 'name', { required: true });
    const description = cleanText(payload.description, 'description');

    const created = await simulationModel.create({
      nom: name,
      description,
      user_id: owner,
    });
    return plain(created);
  }

  async function listPortfoliosForOwner(ownerUserId, simulationId) {
    const simulation = await getOwnedSimulation(ownerUserId, simulationId);
    const id = Number(plain(simulation).id);

    const rows = await simulationPortfolioModel.findAll({
      where: { simulation_id: id },
      attributes: ['id', 'nom', 'fond_ids', 'poids', 'portefeuille_id', 'simulation_id'],
      order: [['id', 'ASC']],
    });

    return (rows || []).map(plain);
  }

  async function createPortfolioForOwner(ownerUserId, simulationId, input) {
    const simulation = await getOwnedSimulation(ownerUserId, simulationId);
    const id = Number(plain(simulation).id);
    const portfolio = normalizePortfolioInput(input);

    const created = await simulationPortfolioModel.create({
      nom: portfolio.name,
      fond_ids: portfolio.fund_ids_serialized,
      poids: portfolio.weights_serialized,
      simulation_id: id,
      portefeuille_id: null,
    });

    return {
      ...plain(created),
      fund_ids: portfolio.fund_ids,
      weights: portfolio.weights,
    };
  }

  return {
    getOwnedSimulation,
    listForOwner,
    createForOwner,
    listPortfoliosForOwner,
    createPortfolioForOwner,
  };
}

module.exports = {
  AllocationSimulationError,
  normalizePortfolioInput,
  createAllocationSimulationService,
};
