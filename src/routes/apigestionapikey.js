const { Magic } = require('@magic-sdk/admin');
const { Sequelize, DataTypes, where } = require('sequelize');
const { vl, indice, taux, fond, pays_regulateurs, sequelize, urll,urllsite, portefeuille, portefeuille_vl, portefeuilles_proposes_vls, portefeuilles_proposes, users, societe, classementfonds, performences, transaction, investissement, tsr, cashdb, frais, fiscalite, portefeuille_vl_cumul, devises, portefeuille_base100, favorisfonds, devisedechanges, personnel, documentss, performences_eurs, performences_usds, classementfonds_eurs, classementfonds_usds, actu, tsrhisto, rendement, simulation, simulationportefeuille,date_valorisation,apikeys } = require('../db/sequelize')
const moment = require('moment');
const math = require('mathjs');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const cron = require('node-cron');
const _ = require('lodash');
const path = require('path');
const express = require('express');
const router = express.Router();

const app = express();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Set your upload directory
const PortfolioAnalytics = require('portfolio-analytics');
const ss = require('simple-statistics')
const socktrader = require('@socktrader/indicators');
const quants = require('quants');
const bodyParser = require('body-parser');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache valide pendant 1 heure
const magic = new Magic(process.env.MAGIC_SECRET_KEY);
const Bottleneck = require('bottleneck');
const { fork } = require('child_process');
const exceljs = require('exceljs');
const { PDFDocument, rgb } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { Image } = require('docxtemplater');
const puppeteer = require('puppeteer');
const ImageModule = require('docxtemplater-image-module').ImageModule;




//Fonction pour generer des api key
function generateApiKey() {
    const apiKey = crypto.randomBytes(20).toString('hex');
    const renewalToken = crypto.randomBytes(20).toString('hex');
    return { apiKey, renewalToken };
  }

  // Middleware pour vérifier la clé API
  async function checkApiKey(req, res, next) {
    const apiKey = req.header('x-api-key');
    if (!apiKey) {
        return res.status(403).json({ message: "Clé API manquante" });
    }
  
    try {
        const apiKeyInfo = await apikeys.findOne({ where: { api_key: apiKey } });
        
        if (!apiKeyInfo) {
            return res.status(403).json({ message: "Clé API invalide" });
        }
  
        const now = moment();
        // Vérifier si la clé a expiré
        if (moment(apiKeyInfo.expires_at).isBefore(now)) {
            return res.status(403).json({ message: "Clé API expirée" });
        }
  
        // Vérifier la limite d'appels
        if (apiKeyInfo.calls_made >= apiKeyInfo.rate_limit) {
            return res.status(429).json({ message: "Limite d'appels atteinte" });
        }
  
        // Mettre à jour le nombre d'appels
        await apikeys.update(
            { calls_made: apiKeyInfo.calls_made + 1 },
            { where: { api_key: apiKey } }
        );
        next();
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur" });
    }
  }
  
  // Route pour générer une clé API pour un utilisateur avec expiration et limites
  router.post('/api/generate-api-key', async (req, res) => {
    const { user_id, duration_in_days, rate_limit } = req.body;
  
    if (!user_id || !duration_in_days || !rate_limit) {
        return res.status(400).json({ message: "Paramètres manquants" });
    }
  
    const { apiKey, renewalToken } = generateApiKey();
    const expiresAt = moment().add(duration_in_days, 'days').toDate(); // Utilisez toDate() pour obtenir un objet Date
  
    try {
        // Stocker la clé dans la base de données
        const newApiKey = await apikeys.create({
            user_id,
            api_key: apiKey,
            expires_at: expiresAt,
            rate_limit,
            renewal_token: renewalToken
        });
  
        res.status(201).json({
          code:200,
            message: "Clé API générée avec succès",
            apiKey: newApiKey.api_key,
            expires_at: newApiKey.expires_at,
            renewal_token: newApiKey.renewal_token
        });
    } catch (error) {
        return res.status(500).json({ message: "Erreur lors de la génération de la clé API" });
    }
  });
  
  // Route pour renouveler une clé API expirée
  router.post('/api/renew-api-key', async (req, res) => {
    const { api_key, renewal_token, duration_in_days } = req.body;
  
    if (!api_key || !renewal_token || !duration_in_days) {
        return res.status(400).json({ message: "Paramètres manquants" });
    }
  
    try {
        const apiKeyInfo = await apikeys.findOne({
            where: { api_key, renewal_token }
        });
  
        if (!apiKeyInfo) {
            return res.status(403).json({ message: "Token de renouvellement ou clé API invalide" });
        }
  
        const expiresAt = moment().add(duration_in_days, 'days').toDate();
  
        // Mettre à jour la date d'expiration et réinitialiser le nombre d'appels
        await apikeys.update(
            { expires_at: expiresAt, calls_made: 0 },
            { where: { api_key } }
        );
  
        res.json({
            message: "Clé API renouvelée avec succès",
            new_expires_at: expiresAt
        });
    } catch (error) {
        return res.status(500).json({ message: "Erreur lors du renouvellement de la clé API" });
    }
  });
  
  // Route protégée par la clé API
  router.get('/api/resource', checkApiKey, (req, res) => {
    res.json({ message: "Accès à la ressource protégée !" });
  });
  
  // Route pour récupérer toutes les clés API
  router.get('/api/api-keys', async (req, res) => {
    try {
        const apiKeys = await apikeys.findAll();
  
        const apiKeysWithRenewal = apiKeys.map(key => ({
            api_key: key.api_key,
            user_id: key.user_id,
            expires_at: key.expires_at,
            rate_limit: key.rate_limit,
            calls_made: key.calls_made,
            renewal_token:key.renewal_token,
            is_expired: moment(key.expires_at).isBefore(moment()) // Vérifie si la clé a expiré
        }));
  
        res.json(apiKeysWithRenewal);
    } catch (error) {
        return res.status(500).json({ message: "Erreur lors de la récupération des clés API" });
    }
  });

  module.exports = router;