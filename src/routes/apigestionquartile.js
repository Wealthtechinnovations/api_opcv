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



router.get('/api/classementquartilemysql/:id', async (req, res) => {
    try {
      const fundId = req.params.id;

      // Assuming classementfond has a field called 'type' to distinguish between type 1 and type 2
      const classementType1 = await classementfonds.findOne({
        where: {
          fond_id: fundId,
          type_classement: 1,
        },
      });

      const classementType2 = await classementfonds.findOne({
        where: {
          fond_id: fundId,
          type_classement: 2,
        },
      });



      // Assuming you want to send both classements in the response
      res.json({
        code: 200, data: {
          classementType1: classementType1 ? classementType1.toJSON() : {},
          classementType2: classementType2 ? classementType2.toJSON() : {},
        },

      });
    } catch (error) {
      console.error('Erreur lors de la recherche du classement :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la recherche du classement.' });
    }
  });

  router.get('/api/classementquartile/:id', async (req, res) => {
    try {
        const fundId = req.params.id;

        // Requête pour le classement de type 1
        const classementType1Query = {
            query: `
                SELECT * FROM classementfonds 
                WHERE fond_id = ? AND type_classement = 1 
                LIMIT 1
            `,
            clickhouse_settings: {
                // Optional settings can be added here
            },
        };

        const classementType1 = await clickhouse.query(classementType1Query)
            .then(async (resultSet) => {
                const data = await resultSet.json();
                return data.length > 0 ? data[0] : {}; // Retourne le premier élément ou un objet vide
            })
            .catch(error => {
                console.error('Error querying classementType1:', error);
                return {}; // Retourne un objet vide en cas d'erreur
            });

        // Requête pour le classement de type 2
        const classementType2Query = {
            query: `
                SELECT * FROM classementfonds 
                WHERE fond_id = ? AND type_classement = 2 
                LIMIT 1
            `,
            clickhouse_settings: {
                // Optional settings can be added here
            },
        };

        const classementType2 = await clickhouse.query(classementType2Query)
            .then(async (resultSet) => {
                const data = await resultSet.json();
                return data.length > 0 ? data[0] : {}; // Retourne le premier élément ou un objet vide
            })
            .catch(error => {
                console.error('Error querying classementType2:', error);
                return {}; // Retourne un objet vide en cas d'erreur
            });

        // Réponse avec les classements
        res.json({
            code: 200,
            data: {
              classementType1: classementType1 ? classementType1.toJSON() : {},
              classementType2: classementType2 ? classementType2.toJSON() : {},
            },
        });
    } catch (error) {
        console.error('Erreur lors de la recherche du classement :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la recherche du classement.' });
    }
});


  router.get('/api/classementquartiledev/:id/:dev', async (req, res) => {
    try {
      const fundId = req.params.id;
      const devise = req.params.dev;
      let classementType1, classementType2;
      // Assuming classementfond has a field called 'type' to distinguish between type 1 and type 2
      if (devise == "EUR") {
        classementType1 = await classementfonds_eurs.findOne({
          where: {
            fond_id: fundId,
            type_classement: 1,
          },
        });

        classementType2 = await classementfonds_eurs.findOne({
          where: {
            fond_id: fundId,
            type_classement: 2,
          },
        });
      } else {
        classementType1 = await classementfonds_usds.findOne({
          where: {
            fond_id: fundId,
            type_classement: 1,
          },
        });

        classementType2 = await classementfonds_usds.findOne({
          where: {
            fond_id: fundId,
            type_classement: 2,
          },
        });
      }


      if (!classementType1 || !classementType2) {
        return res.status(404).json({ error: 'Classement not found for the specified fund ID.' });
      }

      // Assuming you want to send both classements in the response
      res.json({
        code: 200, data: {
          classementType1: classementType1.toJSON(),
          classementType2: classementType2.toJSON(),
        }

      });
    } catch (error) {
      console.error('Erreur lors de la recherche du classement :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la recherche du classement.' });
    }
  });

  module.exports = router;