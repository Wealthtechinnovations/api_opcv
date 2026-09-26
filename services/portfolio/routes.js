const express = require('express');
const router = express.Router();

const { portefeuille, portefeuille_vl, transaction, fond, vl } = require('../shared/db');
const { authenticate } = require('../shared/middleware');

router.get('/api/portefeuille', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/postportefeuille', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/updateportefeuille', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getportefeuille/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getportefeuillebyuser/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/assignportefeuille', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/portefeuillebase100/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/portefeuillebase100dev/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/portefeuillebase100s/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/valLiqportefeuille/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/valLiqportefeuilledev/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/valLiqportefeuillewithindice/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/valoriserportefeuille', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/createtransactions', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/gettransactions/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/managecash', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/vlpardate/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/changedevise', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/favorites', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/favoritesdata/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/favoritesdataall/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/saveValuationData', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/exportToExcel/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/usersWithFunds', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

module.exports = router;
