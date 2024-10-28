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


const {
  AdaptTableaumonthwithdate,
  findNearestDateAnnualized,
  findLastDateOfPreviousMonth,
  findNearestDate,
  findNearestDateWeek,
  findNearestDateJanuary,
  findNearestDatetoyear,
  findLastDatesForEachPreviousYear,
  groupDatesByWeek,
  groupDatesByMonth,
  groupDatesByMonth1,
  groupDatesByYear,
  adaptValuesToGroupedWeeks,
  adaptValuesToGroupedYears,
  adaptValuesToGroupedMonths,
  AdaptTableauwithdate,
  AdaptTableauweekwithdate,
  findNearestDateMonthlized,
  findNearestDatemois
} = require('../functions/dates')

const { calculatePerformance, calculateAnnualizedPerformance, calculateAnnualizedPerformanceper100 } = require('../functions/performances')


const {
  calculateVolatility,
  calculateDSR,
  calculateSharpeRatio,
  calculateVAR95,
  calculateTrackingError,
  calculateVolatilityJour,
  calculateVolatilityMois,
  calculateVAR99,
  calculateInformationRatio,
  calculateSortinoRatio,
  calculateInformationRationew,
  calculateDSRnew,
  //calculateBetanew,
  calculateDownCaptureRatio,
  calculateUpCaptureRatio,
  calculateMaxDrawdown,
  calculateDownsideBeta,
  calculateHaussierBeta,
  calculateOmegaRatio,
  calculateCalmarRatio,
  calculerCAGR,
  calculateSortinoRationew,
  calculateVariance,
  calculateCovariance,
  calculateBetanew,
  calculateInformationRatiojour,
  calculerR2,
  calculerSkewness,
  calculateKurtosis,
  calculerDelaiRecouvrementOPCVM,
  calculerDelaiRecouvrementFonds,
  calculerDSRAnnualise
} = require('../functions/newratios')


const { CalculateRendHebdo, CalculateRendMensuel, CalculateRendJournalier, calculerRendements,
  grouperParAnnee,
  grouperParMois,
  grouperParSemaine,
  grouperTauxParSemaine,
  grouperParJour } = require('../functions/utils')

const {
  calculerDelaiRecouvrement,
  calculerUpCaptureRatio,
  calculerDownCaptureRatio,
  calculateBeta,
  calculateBetaHaussier,

  calculateBetaBaissier
} = require('../functions/delai_Beta_capture')
const { Fond } = require('../classes/fond')
const { Indice } = require('../classes/indice')
const { Op } = require("sequelize");
const { fastifySwaggerUi } = require("@fastify/swagger-ui");
const { da } = require('date-fns/locale');
const portefeuille_valorise = require('../models/portefeuille_valorise');
const { exit } = require('process');
const { url } = require('inspector');
const apikey = require('../models/apikey');





router.get('/api/getfondbyidmeta/:id', async (req, res) => {
  try {
    const response = await fond.findOne({
      where: {
        id: parseInt(req.params.id),
        // ...
      },
      order: [['id', 'DESC']]
    });





    const funds = {
      id: response.id,
      nom_fond: response.nom_fond.toString(),
      categorie_libelle: response.categorie_libelle,
      categorie_national: response.categorie_national,
      societe_gestion:response.societe_gestion,
      categorie_globale:response.categorie_globale,
      pays:response.pays,
      devise: response.dev_libelle, // assuming dev_libelle is the currency
      datejour: response.datejour,
      active: response.active,
      code_ISIN: response.code_ISIN
    };

    res.json({
      code: 200,
      funds,
    });
  } catch (error) {
    console.error("Une erreur s'est produite :", error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});
router.get('/api/getfondbyid/:id', async (req, res) => {
  try {


    const distinctFundIdss = req.query.funds.replace(/[^0-9A-Za-z\s,]+/g, '').split(',')
    const distinctFundIdsParsed = distinctFundIdss.map(id => parseInt(id));

    const response = await fond.findAll({
      where: {
        id: req.params.id,
        // ...
      },
      order: [['id', 'DESC']]
    });

    const commonDates = await vl.findAll({
      attributes: ['date'],
      where: {
        fund_id: distinctFundIdsParsed
      },
      group: ['date'],
      having: Sequelize.literal(`COUNT(DISTINCT fund_id) = ${distinctFundIdsParsed.length}`),
      order: [['date', 'DESC']],
      limit: 1,
      raw: true
    });
    const commonDate = commonDates.length > 0 ? commonDates[0].date : new Date();;

    const response1 = await vl.findAll({
      where: {
        fund_id: req.params.id,
        date: {
          [Sequelize.Op.lte]: commonDate
        }
      },
      order: [
        ['date', 'ASC']
      ]
    });


    const values = response1.map((data) => data.value);
    const values_eur = response1.map((data) => data.value_EUR);
    const values_usd = response1.map((data) => data.value_USD);


    const lastValue = values[response1.length - 1];
    const lastValue_EUR = values_eur[response1.length - 1];
    const lastValue_USD = values_usd[response1.length - 1];

    const funds = response.map(data => ({
      id: data.id,
      lastValue: lastValue,
      lastValue_EUR: lastValue_EUR,
      lastValue_USD: lastValue_USD,
      nom_fond: data.nom_fond.toString(),
      code_ISIN: data.dev_libelle,
      categorie_libelle: data.categorie_libelle,
      categorie_national: data.categorie_national,
      devise: data.dev_libelle,
      datejour: commonDate,
      active: data.active,
      code_ISIN: data.code_ISIN
    }));
    const baseUrl = urll; // Remplacez par votre URL de base

    const lastValResponse = await fetch(`${baseUrl}/api/performances/fond/${req.params.id}`);

    if (!lastValResponse.ok) {
      return res.status(404).json({ message: 'Fonds introuvable' });
    }

    const lastValData = await lastValResponse.json();
    res.json({
      code: 200,
      data: {
        funds,
        performances: lastValData
      }
    });
  } catch (error) {
    console.error("Une erreur s'est produite :", error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

router.get('/api/searchFunds', async (req, res) => {
  const { minHorizon, maxHorizon, selectedPays, selectedRegion } = req.query;
  let query = `
  SELECT DISTINCT f.id, f.nom_fond, f.code_ISIN
  FROM fond_investissements AS f
  INNER JOIN valorisations AS v ON f.id = v.fund_id
`;

  if (minHorizon && maxHorizon) {
    query += `
    WHERE v.date >= :minHorizon
    AND v.date <= :maxHorizon
  `;
  }

  if (selectedPays) {
    query = ` SELECT DISTINCT f.id, f.nom_fond, f.code_ISIN
  FROM fond_investissements AS f
  INNER JOIN valorisations AS v ON f.id = v.fund_id
WHERE
         f.pays = :selectedPays

  `;
  }

  if (selectedRegion) {
    query = ` SELECT DISTINCT f.id, f.nom_fond, f.code_ISIN
  FROM fond_investissements AS f
  INNER JOIN valorisations AS v ON f.id = v.fund_id
WHERE
     f.region = :selectedRegion
   
  `;
  }

  try {
    const fondsDansCategorie = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { minHorizon, maxHorizon },
    });

    const funds = fondsDansCategorie.map(data => ({
      label: `${data.nom_fond.toString()} ${data.code_ISIN}`,
      value: data.id,
      // name: data.nom_fond.toString(),
      // description: data.description.toString()
    }));

    res.json({
      code: 200,
      data: {
        funds,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la requête SQL :", error);
    res.status(500).json({ error: 'Erreur lors de la requête SQL.' });
  }
});


  /**
   * @swagger
   * /api/valLiq/{fund_id}:
   *   get:
   *     tags:
   *       - Derniere Valeur Liquidative
   *     summary: Retrieve the last value and date for a specific record.
   *     description: Retrieve the last liquidation value and date for a specific record.
   *     parameters:
   *       - name: fund_id
   *         in: path
   *         description: The fund_id of the record.
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful response containing the last value and date.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 data:
   *                   type: object
   *                   properties:
   *                     lastValue:
   *                       type: number
   *                       format: double
   *                       example: 123.45
   *                       description: The last liquidation value.
   *                     lastDate:
   *                       type: string
   *                       format: date
   *                       example: "2023-09-02"
   *                       description: The date corresponding to the last value.
   */
  router.get('/api/valLiq/:id', async (req, res) => {
    //  try {
    const response = await vl.findAll({
      where: {
        fund_id: req.params.id
      },
      order: [
        ['date', 'ASC']
      ]
    });
    if (response.length > 0) {
      /* const graphs = response.map(data => ({
         dates :moment(data.date).format('YYYY-MM-DD'), // Remplacez avec la propriété correcte de l'objet
         bases_100:data.base_100, // Remplacez avec la propriété correcte de l'objet
         bases_100_InRef:data.base_100_InRef,
     }));*/
      const hasIndRef = response.some(data => data.indRef !== null);

      const graphs = response.map(data => {
        if (hasIndRef) {
          if (data.value !== null && data.indRef !== null) {
            return {
              dates: moment(data.date).format('YYYY-MM-DD'), // Remplacez avec la propriété correcte de l'objet
              values: data.vl_ajuste, //todo Remplacez avec la propriété correcte de l'objet
              valuesInd: data.indRef, // Inclure indRef seulement si non nul
            };
          };
        } else {
          return {
            dates: moment(data.date).format('YYYY-MM-DD'), // Remplacez avec la propriété correcte de l'objet
            values: data.value, // Remplacez avec la propriété correcte de l'objet
          };
        }

      }).filter(Boolean); // Supprimer les valeurs nulles de l'array

      // Faites ce que vous voulez avec l'array `graphs` ici

      const values = response.map((data) => data.value);//todo
      //  const bases_100 = response.map((data) => data.base_100);
      //  const bases_100_InRef = response.map((data) => data.base_100_InRef);
      const fundnames = response.map((data) => data.fund_name);
      const libelle_fonds = response.map((data) => data.libelle_fond);
      const fundids = response.map((data) => data.fund_id);
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const libelle_indices = response.map((data) => data.indice_name);
      const ID_indices = response.map((data) => data.ID_indice);

      const lastValue = values[response.length - 1];
      const lastDate = dates[response.length - 1];
      const fundname = fundnames[response.length - 1];
      const fundid = fundids[response.length - 1];
      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const baseUrl = urll; // Remplacez par votre URL de base
      const lastValResponse = await fetch(`${baseUrl}/api/performances/fond/${fundid}?date=${lastDate}`);
      const libelle_indice = libelle_indices[response.length - 1];
      const ID_indice = ID_indices[0];
      const currentDate = moment();

      // Calculate the number of missing days
      const daysDiff = currentDate.diff(lastDate, 'days');

      // Calculate the number of missing weekends
      const weekends = Array.from({ length: daysDiff }, (_, i) => moment(lastValue).add(i, 'days'))
        .filter(date => date.day() === 0 || date.day() === 6)
        .length;

      // Calculate the number of missing Vl dates
      const missingVl = daysDiff - weekends;
      if (!lastValResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const lastValData = await lastValResponse.json();

      const last1ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosnew/1/${fundid}`);

      if (!last1ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last1ansRatiosData = await last1ansRatiosResponse.json();

      const lastRatiosResponse = await fetch(`${baseUrl}/api/ratiosnew/3/${fundid}`);

      if (!lastRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const lastRatiosData = await lastRatiosResponse.json();

      const last5ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosnew/5/${fundid}`);

      if (!last5ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last5ansRatiosData = await last5ansRatiosResponse.json();

      const resultat = await fond.findOne({
        attributes: ['indice_benchmark','indice', 'structure_fond', 'strategie_politique_invest', 'philosophie_fond', 'code_ISIN', 'date_creation', 'periodicite', "affectation", "minimum_investissement", "frais_souscription", "frais_rachat", "frais_gestion", "frais_entree", "frais_sortie", 'categorie_libelle', 'nom_fond', 'categorie_national', 'pays', 'categorie_globale', 'categorie_regional', 'type_investissement', 'classification', 'societe_gestion', 'nom_gerant'],
        where: {
          id: parseInt(req.params.id),
        },
      });
      const indice_benchmark = resultat.indice_benchmark;
      const indice = resultat.indice;
      const affectation = resultat.affectation;
      const structure_fond = resultat.structure_fond;
      const code_ISIN = resultat.code_ISIN;
      const frais_souscription = resultat.frais_souscription;
      const frais_rachat = resultat.frais_rachat;
      const frais_gestion = resultat.frais_gestion;
      const frais_entree = resultat.frais_entree;
      const frais_sortie = resultat.frais_sortie;
      const minimum_investissement = resultat.minimum_investissement;

      const categorie_libelle = resultat.categorie_libelle;
      const pays = resultat.pays;
      const date_creationfund = resultat.date_creation;

      const categorie_national = resultat.categorie_national;
      const categorie_globale = resultat.categorie_globale;
      const categorie_regional = resultat.categorie_regional;
      const type_investissement = resultat.type_investissement;
      const periodicite = resultat.periodicite;
      const philosophie_fond = resultat.philosophie_fond;
      const strategie_politique_invest = resultat.strategie_politique_invest;

      const classification = resultat.classification;
      const societe_gestion = resultat.societe_gestion;
      const nom_gerant = resultat.nom_gerant;
      const libelle_fond = resultat.nom_fond;

      const pays_regul = await pays_regulateurs.findOne({
        attributes: ['regulateur', 'sitewebregulateur', 'nomdelabourse', 'URLdelabourse', 'nomdevise', 'symboledevise'],
        where: {
          pays: pays,
        },
      });
      const regulateur = pays_regul.regulateur;
      const sitewebregulateur = pays_regul.sitewebregulateur;
      const nomdelabourse = pays_regul.nomdelabourse;
      const URLdelabourse = pays_regul.URLdelabourse;
      const symboledevise = pays_regul.symboledevise;

      const societegestion = await societe.findOne({
        attributes: ['nom', 'description', 'site_web'],
        where: {
          nom: societe_gestion,
        },
      });

      const societesiteweb=societegestion.site_web;

    

      const meilleursFonds = await performences.findAll({
        attributes: [
          'fond_investissement.nom_fond',
          'perfannu3an',
          'perf1an',
          'perf3ans',
          'ytd',
          'volatility3an'
        ],
        include: [{
          model: fond,
          attributes: ['nom_fond'], // Sélectionner seulement le nom du fond, vous pouvez ajouter d'autres attributs si nécessaire
          required: true
        }],
        where: {
          date: lastDate
        },
        order: [
          ['perfannu3an', 'DESC']
        ],
        limit: 5
      });

      const resultatsMeilleursFonds = meilleursFonds.map(fond => ({
        nom_fond: fond.fond_investissement ? fond.fond_investissement.nom_fond : null, // Vérifie si fond existe
        performance_annualisee: parseFloat(fond.perfannu3an),
        performance_1_an: parseFloat(fond.perf1an),
        performance_3_ans: parseFloat(fond.perfannu3an),
        performance_ytd: parseFloat(fond.ytd),
        volatility3an: parseFloat(fond.volatility3an)
      }));

     
      res.json({
        code: 200,
        data: {
          meilleursFonds: resultatsMeilleursFonds,
          societesiteweb: societesiteweb || null,
          ID_indice: indice,
          indice_benchmark,
          affectation,
          strategie_politique_invest,
          philosophie_fond,
          frais_souscription,
          frais_rachat,
          frais_gestion,
          frais_entree,
          frais_sortie,
          periodicite,
          structure_fond,
          minimum_investissement,
          missingVl,
          code_ISIN,
          date_creationfund,
          regulateur,
          sitewebregulateur,
          nomdelabourse,
          URLdelabourse,
          symboledevise,
          graphs: graphs,
          categorie_libelle,
          categorie_national,
          nom_gerant,
          categorie_globale,
          societe_gestion,
          categorie_regional,
          classification,
          type_investissement,
          lastValue,
          pays,
          lastDate,
          fundname,
          fundid,
          libelle_fond,
          libelle_indice,
          lastdatepreviousmonth,
          performances: lastValData,
          ratios3a: lastRatiosData,
          ratios1a: last1ansRatiosData,
          ratios5a: last5ansRatiosData
        }
      });
    } else {
      res.status(500).json({ message: 'Erreur lors de la récupération des données' });

    }
    /* } catch (error) {
       console.error('Erreur lors de la récupération des données:', error);
       res.status(500).json({ message: 'Erreur lors de la récupération des données' });
     }*/
  });

  router.get('/api/valLiqdev/:id/:devise', async (req, res) => {
    //  try {
    const response = await vl.findAll({
      where: {
        fund_id: req.params.id
      },
      order: [
        ['date', 'ASC']
      ]
    });
    if (response.length > 0) {

      const graphs = response.map(data => {
        if (data.value !== null && data.indRef_EUR !== null) {
          return {
            dates: moment(data.date).format('YYYY-MM-DD'), // Remplacez avec la propriété correcte de l'objet
            values: data.value, // Remplacez avec la propriété correcte de l'objet
            valuesInd: req.params.devise == "USD" ? data.indRef_USD : data.indRef_EUR,
          };
        } else {
          return null; // Ignorer les lignes où la condition n'est pas satisfaite
        }
      }).filter(Boolean); // Supprimer les valeurs nulles de l'array
      let values;
      if (req.params.devise == "USD") {
        values = response.map((data) => data.value_USD);
      } else {
        values = response.map((data) => data.value_EUR);
      }

      //  const bases_100 = response.map((data) => data.base_100);
      //  const bases_100_InRef = response.map((data) => data.base_100_InRef);
      const fundnames = response.map((data) => data.fund_name);
      const libelle_fonds = response.map((data) => data.libelle_fond);
      const fundids = response.map((data) => data.fund_id);
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const libelle_indices = response.map((data) => data.indice_name);
      const ID_indices = response.map((data) => data.ID_indice);

      const lastValue = values[response.length - 1];
      const lastDate = dates[response.length - 1];
      const fundname = fundnames[response.length - 1];
      const fundid = fundids[response.length - 1];
      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const baseUrl = urll; // Remplacez par votre URL de base
      const lastValResponse = await fetch(`${baseUrl}/api/performancesdev/fond/${fundid}/${req.params.devise}?date=${lastDate}`);
      const libelle_indice = libelle_indices[response.length - 1];
      const ID_indice = ID_indices[response.length - 1];
      const currentDate = moment();

      // Calculate the number of missing days
      const daysDiff = currentDate.diff(lastDate, 'days');

      // Calculate the number of missing weekends
      const weekends = Array.from({ length: daysDiff }, (_, i) => moment(lastValue).add(i, 'days'))
        .filter(date => date.day() === 0 || date.day() === 6)
        .length;

      // Calculate the number of missing Vl dates
      const missingVl = daysDiff - weekends;
      if (!lastValResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const lastValData = await lastValResponse.json();

      const last1ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosnewdev/1/${fundid}/${req.params.devise}`);

      if (!last1ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last1ansRatiosData = await last1ansRatiosResponse.json();

      const lastRatiosResponse = await fetch(`${baseUrl}/api/ratiosnewdev/3/${fundid}/${req.params.devise}`);

      if (!lastRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const lastRatiosData = await lastRatiosResponse.json();

      const last5ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosnewdev/5/${fundid}/${req.params.devise}`);

      if (!last5ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last5ansRatiosData = await last5ansRatiosResponse.json();

      const resultat = await fond.findOne({
        attributes: ['structure_fond', 'code_ISIN', 'date_creation', 'periodicite', "affectation", "minimum_investissement", "frais_souscription", "frais_rachat", "frais_gestion", "frais_entree", "frais_sortie", 'categorie_libelle', 'nom_fond', 'categorie_national', 'pays', 'categorie_globale', 'categorie_regional', 'type_investissement', 'classification', 'societe_gestion', 'nom_gerant'],
        where: {
          id: req.params.id,
        },
      });
      const affectation = resultat.affectation;
      const structure_fond = resultat.structure_fond;
      const code_ISIN = resultat.code_ISIN;
      const frais_souscription = resultat.frais_souscription;
      const frais_rachat = resultat.frais_rachat;
      const frais_gestion = resultat.frais_gestion;
      const frais_entree = resultat.frais_entree;
      const frais_sortie = resultat.frais_sortie;
      const minimum_investissement = resultat.minimum_investissement;

      const categorie_libelle = resultat.categorie_libelle;
      const pays = resultat.pays;
      const date_creationfund = resultat.date_creation;

      const categorie_national = resultat.categorie_national;
      const categorie_globale = resultat.categorie_globale;
      const categorie_regional = resultat.categorie_regional;
      const type_investissement = resultat.type_investissement;
      const periodicite = resultat.periodicite;

      const classification = resultat.classification;
      const societe_gestion = resultat.societe_gestion;
      const nom_gerant = resultat.nom_gerant;
      const libelle_fond = resultat.nom_fond;

      const pays_regul = await pays_regulateurs.findOne({
        attributes: ['regulateur', 'sitewebregulateur', 'nomdelabourse', 'URLdelabourse', 'nomdevise', 'symboledevise'],
        where: {
          pays: pays,
        },
      });
      const regulateur = pays_regul.regulateur;
      const sitewebregulateur = pays_regul.sitewebregulateur;
      const nomdelabourse = pays_regul.nomdelabourse;
      const URLdelabourse = pays_regul.URLdelabourse;
      const symboledevise = pays_regul.symboledevise;


      res.json({
        code: 200,
        data: {
          ID_indice,
          affectation,
          frais_souscription,
          frais_rachat,
          frais_gestion,
          frais_entree,
          frais_sortie,
          periodicite,
          structure_fond,
          minimum_investissement,
          missingVl,
          code_ISIN,
          date_creationfund,
          regulateur,
          sitewebregulateur,
          nomdelabourse,
          URLdelabourse,
          symboledevise,
          graphs: graphs,
          categorie_libelle,
          categorie_national,
          nom_gerant,
          categorie_globale,
          societe_gestion,
          categorie_regional,
          classification,
          type_investissement,
          lastValue,
          pays,
          lastDate,
          fundname,
          fundid,
          libelle_fond,
          libelle_indice,
          lastdatepreviousmonth,
          performances: lastValData,
          ratios3a: lastRatiosData,
          ratios1a: last1ansRatiosData,
          ratios5a: last5ansRatiosData
        }
      });
    } else {
      res.status(500).json({ message: 'Erreur lors de la récupération des données' });

    }
    /* } catch (error) {
       console.error('Erreur lors de la récupération des données:', error);
       res.status(500).json({ message: 'Erreur lors de la récupération des données' });
     }*/
  });


  router.post('/api/listeopcvm', async (req, res) => {
    const formData = req.body.formData;
    const selectedValues = req.query.query;
    const selectedpays = req.query.selectedpays; // Corrected variable name
    const selectedsociete=req.query.selectedsociete;

    let valuesArray; // Déclaration en dehors de la condition

    if (selectedValues) {
      valuesArray = selectedValues.split(',');
    }

    let whereClause = {}; // Utilisation de let au lieu de const

    if (valuesArray) {
      whereClause = {
        [Op.or]: valuesArray.map(value => ({
          id: value // Créer une condition pour chaque valeur dans valuesArray
        }))
      };
    }

    if (selectedpays && selectedpays != 'undefined') {
      whereClause.pays = selectedpays; // Filtrer par la catégorie globale si elle est renseignée
    } else {
      // Gérer le cas où selectedpays n'est pas défini
      console.log("selectedpays n'est pas défini");
      // Ou effectuer une autre action appropriée, comme attribuer une valeur par défaut à whereClause.pays
    }

    if (selectedsociete && selectedsociete != 'undefined') {
      whereClause.societe_gestion = selectedsociete; // Filtrer par la catégorie globale si elle est renseignée
    } else {
      // Gérer le cas où selectedpays n'est pas défini
      console.log("selectedsociete n'est pas défini");
      // Ou effectuer une autre action appropriée, comme attribuer une valeur par défaut à whereClause.pays
    }

    const fondall = await fond.findAll({
      where: whereClause, // Pas besoin d'encapsuler dans Op.and, oùClause est déjà un objet
      group: ['nom_fond'],
      order: [['nom_fond', 'ASC']]
    });

    // Pour stocker les résultats finaux
    let resultats = [];

  




    // Envoyez les résultats en tant que réponse JSON
    res.json({
      code: 200,
      data: { fonds: fondall }
    });
  });

  module.exports = router;