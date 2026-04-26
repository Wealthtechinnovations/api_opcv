const express = require('express');
const router = express.Router();

const { fond } = require('../shared/db');
const { authenticate } = require('../shared/middleware');

router.post('/api/postfond', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/updatefond/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/updatefondmodif/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondbyadmin', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondbyuser/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondbyuservalide/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

module.exports = router;
