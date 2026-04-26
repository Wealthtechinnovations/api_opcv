const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Magic } = require('@magic-sdk/admin');

const {
  sequelize,
  users,
} = require('../shared/db');

const { authenticate, authorize, generateToken } = require('../shared/middleware');

const magic = new Magic(process.env.MAGIC_SECRET_KEY);

// =====================
// AUTH ROUTES
// =====================

// GET /api/login - Validate Magic link token
router.get('/api/login', async (req, res) => {
  try {
    const didToken = req.headers.authorization?.substr(7);
    if (!didToken) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    await magic.token.validate(didToken);
    res.status(200).json({ authenticated: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/login - Validate Magic link token
router.post('/api/login', async (req, res) => {
  try {
    const didToken = req.headers.authorization?.substr(7);

    if (!didToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await magic.token.validate(didToken);
    res.status(200).json({ authenticated: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/userlogin - Authentification sécurisée (credentials dans le body, pas l'URL)
router.post('/api/userlogin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: 400, message: 'Email et mot de passe requis' });
    }

    const user = await users.findOne({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        code: 401,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = generateToken(user);

    const userData = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenoms: user.prenoms,
      denomination: user.denomination,
      typeusers: user.typeusers,
      typeusers_id: user.typeusers_id,
      active: user.active,
      pays: user.pays
    };

    return res.json({
      code: 200,
      token,
      data: {
        token,
        user: userData,
        userExists: userData,
      }
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: 'Erreur interne du serveur' });
  }
});

// GET /api/userlogin - Rétrocompatibilité (déprécié, utiliser POST)
router.get('/api/userlogin', async (req, res) => {
  try {
    const userEmail = req.query.email;
    const password = req.query.password;

    if (!userEmail || !password) {
      return res.status(400).json({ code: 400, message: 'Email et mot de passe requis' });
    }

    const user = await users.findOne({
      where: { email: userEmail }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        code: 401,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = generateToken(user);

    const userData = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenoms: user.prenoms,
      denomination: user.denomination,
      typeusers: user.typeusers,
      typeusers_id: user.typeusers_id,
      active: user.active,
      pays: user.pays
    };

    return res.json({
      code: 200,
      token,
      data: {
        token,
        user: userData,
        userExists: userData
      }
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: 'Erreur interne du serveur' });
  }
});

// GET /api/userexist - Check if a user exists by email
router.get('/api/userexist', async (req, res) => {
  try {
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(400).json({ code: 400, message: 'Email parameter is missing' });
    }

    const user = await users.findOne({
      where: { email: userEmail }
    });

    // Ne pas retourner l'objet utilisateur complet pour éviter la fuite d'informations
    return res.json({
      code: user ? 200 : 400,
      data: {
        userExists: !!user
      }
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
});

// POST /api/postuserportefeuille - Create a new user account
router.post('/api/postuserportefeuille', async (req, res) => {
  try {
    const {
      email,
      password,
      nom,
      prenoms,
      denomination,
      pays,
      typeusers,
      typeusers_id
    } = req.body;

    // Validation des champs obligatoires
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    // Validation de la force du mot de passe
    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Vérification de l'unicité de l'email
    const existingUser = await users.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Un compte avec cet email existe déjà' });
    }

    const newUser = await users.create({
      email,
      password: bcrypt.hashSync(password, 10),
      nom: nom || null,
      prenoms: prenoms || null,
      denomination: denomination || null,
      pays: pays || null,
      typeusers: typeusers || null,
      typeusers_id: typeusers_id || 0,
      active: typeusers_id != 1 ? 0 : 1
    });

    // Générer un token JWT pour l'utilisateur créé
    const token = generateToken(newUser);

    res.status(201).json({
      code: 201,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          nom: newUser.nom,
          prenoms: newUser.prenoms,
          typeusers: newUser.typeusers,
          active: newUser.active
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du compte' });
  }
});

// POST /api/forgot-password - Send password reset email
router.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  // Vérifiez si l'utilisateur existe
  const user = await users.findOne({ where: { email: email } });
  if (!user) {
    return res.status(404).send('Utilisateur non trouvé');
  }

  // Créer un jeton de réinitialisation
  const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Lien de réinitialisation
  const resetUrl = `${process.env.FRONTEND_URL}/panel/societegestionpanel/login/reset-password?token=${resetToken}`;

  // Configurer nodemailer pour envoyer l'email
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Réinitialisation de mot de passe',
    html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
           <a href="${resetUrl}">Réinitialiser le mot de passe</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Email de réinitialisation envoyé');
  } catch (error) {
    res.status(500).send('Erreur lors de l\'envoi de l\'email');
  }
});

// POST /api/reset-password - Reset user password with token
router.post('/api/reset-password', async (req, res) => {
  const { tokenapp, newPassword } = req.body;

  try {
    // Vérifier le jeton
    const decoded = jwt.verify(tokenapp, process.env.JWT_SECRET);
    const user = await users.findOne({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(404).send('Utilisateur non trouvé');
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).send('Mot de passe réinitialisé avec succès');
  } catch (error) {
    res.status(400).send('Jeton invalide ou expiré');
  }
});

// POST /api/activate-user/:id - Activate a user account (admin only)
router.post('/api/activate-user/:id', authenticate, authorize('admin'), (req, res) => {
  const userId = req.params.id;

  // Trouver l'utilisateur avec l'ID
  users.findOne({
    where: {
      id: userId
    }
  })
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Mettre à jour l'utilisateur pour l'activer
      return user.update({ active: 1 });
    })
    .then(updatedUser => {
      // Répondre avec une confirmation de l'activation
      res.json({
        code: 200,
        message: "L'utilisateur a été activé avec succès",
        data: {
          id: updatedUser.id,
          nom: updatedUser.nom,
          active: updatedUser.active,
        }
      });
    })
    .catch(error => {
      console.error('Erreur lors de l\'activation de l\'utilisateur:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    });
});

// PUT /api/users/:id - Update user profile (exclude password from update)
router.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const existingUser = await users.findByPk(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    const { password, ...updateData } = req.body;
    await existingUser.update(updateData);
    res.json({ code: 200, data: existingUser });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l\'utilisateur' });
  }
});

// GET /api/getusersbyadmin - Get all users (admin only)
router.get('/api/getusersbyadmin', authenticate, authorize('admin'), (req, res) => {
  users.findAll({
    where: {
    },
    order: [
      ['id', 'DESC']
    ],
    limit: 500,
  })
    .then(response => {
      const userss = response.map(data => ({
        id: data.id,
        email: data.email,
        nom: data.nom,
        prenoms: data.prenoms,
        active: data.active
      }));
      res.json({
        code: 200,
        data: {
          userss
        }
      })
    })
});

module.exports = router;
