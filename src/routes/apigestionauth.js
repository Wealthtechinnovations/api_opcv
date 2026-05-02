const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { users } = require('../db/sequelize');
const { Op } = require('sequelize');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 heure

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    },
  });
}

module.exports = (app) => {

  /**
   * POST /api/forgot-password
   * Body: { email }
   * Génère un token de réinitialisation et envoie un email
   */
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ code: 400, message: 'Email requis.' });
      }

      const user = await users.findOne({ where: { email } });

      // Réponse identique qu'il existe ou non (sécurité : pas d'énumération)
      if (!user) {
        return res.json({
          code: 200,
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
        });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + TOKEN_EXPIRY_MS);

      await user.update({
        reset_token: token,
        reset_token_expiry: expiry,
      });

      const resetLink = `${FRONTEND_URL}/panel/management/login/reset-password?token=${token}`;

      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"AfricaFunds" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe - AfricaFunds',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Réinitialisation de mot de passe</h2>
            <p>Bonjour ${user.prenoms || user.denomination || ''},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe AfricaFunds.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">Ce lien est valable pendant 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="color: #aaa; font-size: 12px;">AfricaFunds - Plateforme d'analyse de fonds OPCVM en Afrique</p>
          </div>
        `,
      });

      return res.json({
        code: 200,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    } catch (error) {
      console.error('[forgot-password]', error.message);
      return res.status(500).json({ code: 500, message: 'Erreur serveur. Réessayez plus tard.' });
    }
  });

  /**
   * POST /api/reset-password
   * Body: { token, password }
   * Valide le token et met à jour le mot de passe
   */
  app.post('/api/reset-password', async (req, res) => {
    try {
      const token = req.body.token || req.body.tokenapp;
      const password = req.body.password || req.body.newPassword;

      if (!token || !password) {
        return res.status(400).json({ code: 400, message: 'Token et nouveau mot de passe requis.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ code: 400, message: 'Le mot de passe doit contenir au moins 8 caractères.' });
      }

      const user = await users.findOne({
        where: {
          reset_token: token,
          reset_token_expiry: { [Op.gt]: new Date() },
        },
      });

      if (!user) {
        return res.status(400).json({
          code: 400,
          message: 'Lien invalide ou expiré. Faites une nouvelle demande de réinitialisation.',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await user.update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      });

      return res.json({
        code: 200,
        message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
      });
    } catch (error) {
      console.error('[reset-password]', error.message);
      return res.status(500).json({ code: 500, message: 'Erreur serveur. Réessayez plus tard.' });
    }
  });

};
