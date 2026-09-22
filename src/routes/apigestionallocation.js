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

module.exports = router;
