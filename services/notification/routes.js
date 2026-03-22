const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const moment = require('moment');
const path = require('path');

const {
  sequelize,
  actu,
  users,
  personnel,
  fond,
  apikeys,
} = require('../shared/db');

// ---------------------
// Multer Configuration
// ---------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ---------------------
// Helper Functions
// ---------------------
function getDateToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateApiKey() {
  const apiKey = crypto.randomBytes(20).toString('hex');
  const renewalToken = crypto.randomBytes(20).toString('hex');
  return { apiKey, renewalToken };
}

// Middleware to verify API key
async function checkApiKey(req, res, next) {
  const apiKey = req.header('x-api-key');
  if (!apiKey) {
    return res.status(403).json({ message: "Cle API manquante" });
  }

  try {
    const apiKeyInfo = await apikeys.findOne({ where: { api_key: apiKey } });

    if (!apiKeyInfo) {
      return res.status(403).json({ message: "Cle API invalide" });
    }

    const now = moment();
    // Check if key has expired
    if (moment(apiKeyInfo.expires_at).isBefore(now)) {
      return res.status(403).json({ message: "Cle API expiree" });
    }

    // Check call limit
    if (apiKeyInfo.calls_made >= apiKeyInfo.rate_limit) {
      return res.status(429).json({ message: "Limite d'appels atteinte" });
    }

    // Update call count
    await apikeys.update(
      { calls_made: apiKeyInfo.calls_made + 1 },
      { where: { api_key: apiKey } }
    );
    next();
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

// =====================
// ACTUALITES (NEWS)
// =====================

// Upload a new article/actualite
router.post('/api/actualite', upload.single('fichier'), async (req, res) => {
  try {
    const { description, date, type, user_id, username } = req.body;
    const image = req.file;
    const dateToday = getDateToday();
    const user = await users.findOne({ where: { denomination: user_id } });
    const nouveauDocument = await actu.create({
      date: dateToday,
      user_id: user.id,
      username: username,
      description,
      type,
      image: image.filename
    });

    res.status(200).json({ message: 'Article uploaded successfully', document: nouveauDocument });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all actualites
router.get('/api/getactualite', async (req, res) => {
  try {
    const actualites = await actu.findAll({
      order: [['id', 'DESC']],
      limit: 500,
    });
    res.status(200).json(actualites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

// =====================
// CONTACT FORM
// =====================

// Send a contact email
router.post('/api/contact', async (req, res) => {
  const { name, email, description } = req.body;

  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `Nouveau message de ${name}`,
    text: description,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email envoye avec succes' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email' });
  }
});

// =====================
// PERSONNEL MANAGEMENT
// =====================

// Create a new personnel member
router.post('/api/personnelsociete', upload.single('photo'), async (req, res) => {
  try {
    const selectedValues = req.query.query;
    let valuesArray = [];
    if (selectedValues) {
      valuesArray = selectedValues.split(',');
    }

    const { nom, prenom, email, numero, fonction, societe, activite, photo } = req.body;

    if (valuesArray.length >= 1 && valuesArray[0] !== '') {
      // Sanitize: only allow numeric IDs to prevent SQL injection
      const sanitizedIds = valuesArray
        .map(value => parseInt(value, 10))
        .filter(value => !isNaN(value));

      if (sanitizedIds.length > 0) {
        await fond.update(
          { nom_gerant: nom },
          { where: { id: sanitizedIds } }
        );
      }
    }

    const fonc = fonction.toString();
    const activiteString = JSON.stringify(activite);
    let photos = null;

    if (req.file) {
      photos = req.file.filename;
    }

    const newPersonnel = await personnel.create({
      nom,
      prenom,
      email,
      numero,
      societe,
      photo: photos,
      fonction: fonc,
      activite: activiteString
    });

    res.status(200).json(newPersonnel);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la creation de la personne.' });
  }
});

// Get all personnel for a given societe
router.get('/api/personnel/:societe', async (req, res) => {
  const { societe } = req.params;
  const query = `
    SELECT *
    FROM personnel_sgs
    WHERE societe = :societe
  `;

  try {
    const documents = await sequelize.query(query, {
      replacements: { societe },
      type: sequelize.QueryTypes.SELECT,
    });

    res.status(200).json(documents);
  } catch (error) {
    console.error('Erreur lors de la recuperation des documents:', error);
    res.status(500).json({ message: 'Erreur lors de la recuperation des documents' });
  }
});

// Get a single personnel member by ID
router.get('/api/personnelsocietecharge/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const existingPersonnel = await personnel.findOne({ where: { id } });

    if (!existingPersonnel) {
      return res.status(404).json({ error: "Personnel not found" });
    }

    res.status(200).json(existingPersonnel);
  } catch (error) {
    console.error("Error fetching personnel:", error);
    res.status(500).json({ error: 'An error occurred while fetching personnel data.' });
  }
});

// Update a personnel member
router.post('/api/personnelsocietemodif', upload.single('photo'), async (req, res) => {
  try {
    const selectedValues = req.query.query;
    let valuesArray = [];
    if (selectedValues) {
      valuesArray = selectedValues.split(',');
    }

    const { id, nom, prenom, email, numero, fonction, activite, photo } = req.body;

    if (valuesArray.length >= 1 && valuesArray[0] !== '') {
      // Sanitize: only allow numeric IDs to prevent SQL injection
      const sanitizedIds = valuesArray
        .map(value => parseInt(value, 10))
        .filter(value => !isNaN(value));

      if (sanitizedIds.length > 0) {
        await fond.update(
          { nom_gerant: nom },
          { where: { id: sanitizedIds } }
        );
      }
    }

    const fonc = fonction.toString();
    const activiteString = JSON.stringify(activite);
    let photos = null;

    if (req.file) {
      photos = req.file.filename;
    }

    const existingPersonnel = await personnel.findOne({ where: { id: parseInt(id) } });

    if (!existingPersonnel) {
      return res.status(404).json({ error: "Personnel not found" });
    }

    existingPersonnel.nom = nom;
    existingPersonnel.prenom = prenom;
    existingPersonnel.email = email;
    existingPersonnel.numero = numero;
    existingPersonnel.fonction = fonc;
    existingPersonnel.activite = activiteString;

    if (photos) {
      existingPersonnel.photo = photos;
    }

    await existingPersonnel.save();

    res.status(200).json(existingPersonnel);
  } catch (error) {
    console.error("Error updating personnel:", error);
    res.status(500).json({ error: 'An error occurred while updating personnel.' });
  }
});

// =====================
// API KEY MANAGEMENT
// =====================

// Generate an API key for a user with expiration and rate limits
router.post('/api/generate-api-key', async (req, res) => {
  const { user_id, duration_in_days, rate_limit } = req.body;

  if (!user_id || !duration_in_days || !rate_limit) {
    return res.status(400).json({ message: "Parametres manquants" });
  }

  const { apiKey, renewalToken } = generateApiKey();
  const expiresAt = moment().add(duration_in_days, 'days').toDate();

  try {
    const newApiKey = await apikeys.create({
      user_id,
      api_key: apiKey,
      expires_at: expiresAt,
      rate_limit,
      renewal_token: renewalToken
    });

    res.status(201).json({
      code: 200,
      message: "Cle API generee avec succes",
      apiKey: newApiKey.api_key,
      expires_at: newApiKey.expires_at,
      renewal_token: newApiKey.renewal_token
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la generation de la cle API" });
  }
});

// Renew an expired API key
router.post('/api/renew-api-key', async (req, res) => {
  const { api_key, renewal_token, duration_in_days } = req.body;

  if (!api_key || !renewal_token || !duration_in_days) {
    return res.status(400).json({ message: "Parametres manquants" });
  }

  try {
    const apiKeyInfo = await apikeys.findOne({
      where: { api_key, renewal_token }
    });

    if (!apiKeyInfo) {
      return res.status(403).json({ message: "Token de renouvellement ou cle API invalide" });
    }

    const expiresAt = moment().add(duration_in_days, 'days').toDate();

    await apikeys.update(
      { expires_at: expiresAt, calls_made: 0 },
      { where: { api_key } }
    );

    res.json({
      message: "Cle API renouvelee avec succes",
      new_expires_at: expiresAt
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors du renouvellement de la cle API" });
  }
});

// Protected resource route (requires valid API key)
router.get('/api/resource', checkApiKey, (req, res) => {
  res.json({ message: "Acces a la ressource protegee !" });
});

// Get all API keys
router.get('/api/api-keys', async (req, res) => {
  try {
    const apiKeys = await apikeys.findAll();

    const apiKeysWithRenewal = apiKeys.map(key => ({
      api_key: key.api_key,
      user_id: key.user_id,
      expires_at: key.expires_at,
      rate_limit: key.rate_limit,
      calls_made: key.calls_made,
      renewal_token: key.renewal_token,
      is_expired: moment(key.expires_at).isBefore(moment())
    }));

    res.json(apiKeysWithRenewal);
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la recuperation des cles API" });
  }
});

// Serve uploaded files statically
const parentPath = path.resolve(__dirname, '../..');
const uploadDirectory = path.join(parentPath, 'uploads');
router.use('/uploads', express.static(uploadDirectory));

module.exports = router;
