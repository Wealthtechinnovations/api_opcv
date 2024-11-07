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
const router = express.Router();



app.get('/api/rendement/fonds', async (req, res) => {
    const { categorie, ids } = req.query;
    let whereClause = {};

    if (categorie) {
      const categories = categorie.split(',').map(id => id); // Convertir les IDs en entiers

      whereClause = { categorie_globale: { [Op.in]: categories } };
    } else if (ids) {
      const fundIds = ids.split(',').map(id => parseInt(id, 10)); // Convertir les IDs en entiers
      whereClause = { id: { [Op.in]: fundIds } };
    }

    try {
      const fundData = await fond.findAll({
        where: whereClause,
        attributes: ['nom_fond', 'id', 'categorie_globale', 'periodicite', 'pays'], // Ajustez les attributs ici
        include: [
          {
            model: rendement,
            attributes: ['id', 'date', 'fond_id', 'rendement_semaine', 'rendement_mensuel'], // Ajustez les attributs ici
            order: [['date', 'ASC']]
          }
        ]
      });

      // Vérifier la périodicité
      let periodicite = 'Journalière';
      const isHebdomadaire = fundData.some(fund => fund.periodicite === 'Hebdomadaire');
      if (isHebdomadaire) {
        periodicite = 'Hebdomadaire';
      }

      const formattedData = fundData.map(fund => ({
        nom_fond: fund.nom_fond,
        idfond: fund.id,
        categorie: fund.categorie_globale,
        pays: fund.pays,
        rendements: fund.rendements.map(rendement => ({
          date: rendement.date,
          rendement_semaine: rendement.rendement_semaine,
          rendement_mensuel: rendement.rendement_mensuel
        }))
      }));

      res.json({
        code: 200,
        data: {
          fonds: formattedData,
          periodicite: periodicite
        }
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Une erreur s\'est produite lors du traitement de la demande.',
        error: error.message
      });
    }
  });


// Fonction pour calculer les rendements quotidiens
async function calculatejourReturns(fundId) {
  const vlData = await vl.findAll({
    where: {
      fund_id: fundId,
      date: {
        [Op.between]: ['2023-01-01', '2023-12-31']
      }
    },
    order: [['date', 'ASC']],
    attributes: ['date', 'value']
  });

  const dailyReturns = vlData.map((vl, index) => {
    if (index === 0) return null; // Pas de rendement pour le premier jour
    const previousValue = vlData[index - 1].value;
    const currentValue = vl.value;
    const dailyReturn = (currentValue - previousValue) / previousValue;
    return {
      date: vl.date,
      rendement_jour: dailyReturn,
      fond_id: fundId
    };
  }).filter(rendement => rendement !== null);

  return dailyReturns;
}

// Fonction pour insérer les rendements dans la base de données
async function insertRendements(rendements) {
  try {
    await rendement.bulkCreate(rendements);
  } catch (error) {
    console.error('Error inserting rendements:', error);
    throw error;
  }
}
router.get('/api/saverendementsjour', async (req, res) => {

  try {
    const fonds = await vl.findAll({
        attributes: ['fund_id'],
        group: ['fund_id']
      });

      // Traiter chaque fonds de manière séquentielle
    for (const fund of fonds) {
      const fundId = fund.fund_id;

      // Calculer les rendements pour ce fonds
      const dailyReturns = await calculatejourReturns(fundId);

      // Insérer les rendements dans la base de données
      await insertRendements(dailyReturns);
    }

    res.status(200).json({ message: 'Rendements calculés et insérés avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du calcul ou de l\'insertion des rendements', error });
  }
});

router.get('/api/saverendements', async (req, res) => {
    try {
      const fonds = await vl.findAll({
        attributes: ['fund_id'],
        group: ['fund_id']
      });

      for (const fund of fonds) {
        const fundId = fund.fund_id;
        const valorisations = await vl.findAll({
          where: { fund_id: fundId },
          order: [['date', 'ASC']]
        });

        let weeklyValues = {};
        let monthlyValues = {};
        valorisations.forEach((v) => {
          const date = moment(v.date);
          const week = date.isoWeek().toString().padStart(2, '0');
          const year = date.year();
          const month = (date.month() + 1).toString().padStart(2, '0'); // +1 pour obtenir le mois en format 1-12

          weeklyValues[`${year}_W${week}`] = v.value;
          monthlyValues[`${year}_M${month}`] = v.value;
        });

        const sortedWeeklyValues = Object.entries(weeklyValues)
          .sort((a, b) => (a[0] > b[0] ? 1 : -1))
          .reverse();

        // Convertir monthlyValues en un tableau d'entrées, puis trier et inverser
        const sortedMonthlyValues = Object.entries(monthlyValues)
          .sort((a, b) => (a[0] > b[0] ? 1 : -1))
          .reverse();

        let precedentWeekValue = null;
        for (let i = 0; i < sortedWeeklyValues.length; i++) {
          const [week, value] = sortedWeeklyValues[i];
          precedentWeekValue = (sortedWeeklyValues[i + 1] ? sortedWeeklyValues[i + 1][1] : null); // Vérification pour éviter une erreur
          if (precedentWeekValue !== null) {
            const rendement_semaine = (value-precedentWeekValue) / precedentWeekValue;
            await rendement.create({
              date: week,
              fond_id: fundId,
              lastvl: value,
              rendement_semaine,
              rendement_mensuel: null
            });
          }
        }

        let precedentMonthValue = null;
        for (let i = 0; i < sortedMonthlyValues.length; i++) {
          const [month, value] = sortedMonthlyValues[i];
          precedentMonthValue = (sortedMonthlyValues[i + 1] ? sortedMonthlyValues[i + 1][1] : null); // Vérification pour éviter une erreur
          if (precedentMonthValue !== null) {
            const rendement_mensuel = (value-precedentMonthValue) / precedentMonthValue;
            await rendement.create({
              date: month,
              fond_id: fundId,
              lastvl: value,
              rendement_semaine: null,
              rendement_mensuel
            });
          }
        }
      }

      res.status(200).send('Rendements calculés et enregistrés avec succès.');
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors du calcul des rendements.');
    }
  });

  module.exports = router;