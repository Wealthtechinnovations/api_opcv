const express = require('express');
const multer = require('multer');
const router = express.Router();

const { fond } = require('../shared/db');
const { authenticate, authorize } = require('../shared/middleware');

const upload = multer({ dest: 'uploads/' });

router.post('/api/postfond', authenticate, authorize('admin', 'socGest'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/updatefond/:id', authenticate, authorize('admin', 'socGest'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/updatefondmodif/:id', authenticate, authorize('admin', 'socGest'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondbyadmin', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondbyuser/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondbyuservalide/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondbysociete/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondbypays/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/fondscharge/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/insertfond', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getData', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/recherchefonds', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/rechercheravance-fonds', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/ajoutVL/:id', authenticate, authorize('admin', 'socGest'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/ajoutIndice/:id', authenticate, authorize('admin', 'socGest'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/uploadsfilevl/:id', authenticate, authorize('admin', 'socGest'), upload.single('file'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/uploadsfileindice/:id', authenticate, authorize('admin', 'socGest'), upload.single('file'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/uploadsocietefilenew/:societe', authenticate, authorize('admin', 'socGest'), upload.single('file'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/verifvlimport', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/vlspresui/:id/:value/:date', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/updateValues/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfondsanomalie/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getallfondsvlanomalie', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getallfondsvlmanquant', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/doc', authenticate, upload.single('fichier'), async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/documents/:societe', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/documentsfond/:fond', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfraisbyadmin', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/getfraisbyadminid/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/createfrais', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.post('/api/updatefraisbyadminid/:id', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

router.get('/api/comparaison', authenticate, async (req, res) => {
  res.json({ message: 'TODO' });
});

module.exports = router;
