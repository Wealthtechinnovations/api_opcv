'use strict';

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const {
  AllocationContractError,
  normalizeOptimizationRequest,
  getAuthenticatedUserId,
  buildCapabilities,
} = require('../services/allocation/contract');
const { simulation, simulationportefeuille } = require('../db/sequelize');
const {
  AllocationSimulationError,
  createAllocationSimulationService,
} = require('../services/allocation/simulations');

const simulationService = createAllocationSimulationService({
  simulationModel: simulation,
  simulationPortfolioModel: simulationportefeuille,
});

/**
 * GET /api/allocation/capabilities
 *
 * Public, read-only contract discovery. This endpoint deliberately reports
 * optimization_enabled=false until the canonical Node engine is implemented
 * and certified by AF-TASK-014/016.
 */
router.get('/api/allocation/capabilities', (req, res) => {
  return res.json({
    code: 200,
    data: buildCapabilities(),
  });
});

/**
 * POST /api/allocation/validate
 *
 * Authenticated validation/normalization only.
 * No data fetch, DB write or optimizer execution is performed.
 * Ownership is derived exclusively from the verified JWT.
 */
router.post('/api/allocation/validate', authenticate, (req, res) => {
  try {
    const ownerUserId = getAuthenticatedUserId(req);
    const normalized = normalizeOptimizationRequest(req.body);

    return res.json({
      code: 200,
      data: {
        owner_user_id: ownerUserId,
        ...normalized,
      },
    });
  } catch (error) {
    if (error instanceof AllocationContractError) {
      return res.status(error.statusCode || 400).json({
        code: error.statusCode || 400,
        error: error.code,
        message: error.message,
        details: error.errors,
      });
    }

    console.error('[allocation.validate]', error && error.message ? error.message : error);
    return res.status(500).json({
      code: 500,
      error: 'ALLOCATION_VALIDATION_ERROR',
      message: 'Erreur interne lors de la validation de la demande allocation.',
    });
  }
});


function sendSimulationError(res, error) {
  if (error instanceof AllocationSimulationError) {
    return res.status(error.statusCode || 400).json({
      code: error.statusCode || 400,
      error: error.code,
      message: error.message,
      details: error.details,
    });
  }

  console.error('[allocation.simulation]', error && error.message ? error.message : error);
  return res.status(500).json({
    code: 500,
    error: 'ALLOCATION_SIMULATION_ERROR',
    message: 'Erreur interne lors du traitement de la simulation allocation.',
  });
}

/**
 * GET /api/allocation/simulations
 * Owner-only listing. user_id is never accepted from query/body.
 */
router.get('/api/allocation/simulations', authenticate, async (req, res) => {
  try {
    const ownerUserId = getAuthenticatedUserId(req);
    const simulations = await simulationService.listForOwner(ownerUserId);
    return res.json({ code: 200, data: { simulations } });
  } catch (error) {
    return sendSimulationError(res, error);
  }
});

/**
 * POST /api/allocation/simulations
 * Creates a simulation for the JWT owner only.
 */
router.post('/api/allocation/simulations', authenticate, async (req, res) => {
  try {
    const ownerUserId = getAuthenticatedUserId(req);
    const created = await simulationService.createForOwner(ownerUserId, req.body);
    return res.status(201).json({ code: 201, data: { simulation: created } });
  } catch (error) {
    return sendSimulationError(res, error);
  }
});

/**
 * GET /api/allocation/simulations/:simulationId/portfolios
 * The parent simulation must belong to the JWT owner.
 */
router.get('/api/allocation/simulations/:simulationId/portfolios', authenticate, async (req, res) => {
  try {
    const ownerUserId = getAuthenticatedUserId(req);
    const portfolios = await simulationService.listPortfoliosForOwner(
      ownerUserId,
      req.params.simulationId
    );
    return res.json({ code: 200, data: { portfolios } });
  } catch (error) {
    return sendSimulationError(res, error);
  }
});

/**
 * POST /api/allocation/simulations/:simulationId/portfolios
 * Backward-compatible storage into simulation_portefeuilles, but only after
 * ownership and weights validation. AF-TASK-015 will migrate persistence
 * additively to the normalized run schema.
 */
router.post('/api/allocation/simulations/:simulationId/portfolios', authenticate, async (req, res) => {
  try {
    const ownerUserId = getAuthenticatedUserId(req);
    const created = await simulationService.createPortfolioForOwner(
      ownerUserId,
      req.params.simulationId,
      req.body
    );
    return res.status(201).json({ code: 201, data: { portfolio: created } });
  } catch (error) {
    return sendSimulationError(res, error);
  }
});

module.exports = router;
