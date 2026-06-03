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
const _ = require('lodash');
const path = require('path');
const express = require('express');
const router = express.Router();

const app = express();
const multer = require('multer');
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });
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
const ImageModule = require('docxtemplater-image-module-free');


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
const { generateSlug, generateFundSlug, extractIdFromSlug } = require('../functions/slug');
const { da } = require('date-fns/locale');
const portefeuille_valorise = require('../models/portefeuille_valorise');
const { exit } = require('process');
const { url } = require('inspector');
const apikey = require('../models/apikey');





router.get('/api/getfondbyidmeta/:id', async (req, res) => {
  try {
    // Support both numeric IDs and slugs (extract ID from slug)
    const paramId = req.params.id;
    const fundId = extractIdFromSlug(paramId);

    if (!fundId) {
      return res.status(400).json({ message: 'ID de fond invalide' });
    }

    const response = await fond.findOne({
      where: {
        id: fundId,
      },
      order: [['id', 'DESC']]
    });

    if (!response) {
      return res.status(404).json({ message: 'Fonds introuvable' });
    }

    const funds = {
      id: response.id,
      nom_fond: (response.nom_fond || '').toString(),
      slug: generateFundSlug(response.nom_fond, response.code_ISIN, response.id),
      categorie_libelle: response.categorie_libelle,
      categorie_national: response.categorie_national,
      societe_gestion: response.societe_gestion,
      categorie_globale: response.categorie_globale,
      pays: response.pays,
      devise: response.dev_libelle,
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
    const paramId = extractIdFromSlug(req.params.id);

    if (!req.query.funds) {
      return res.status(400).json({ message: 'Paramètre funds requis' });
    }
    const distinctFundIdss = req.query.funds.replace(/[^0-9A-Za-z\s,]+/g, '').split(',')
    const distinctFundIdsParsed = distinctFundIdss.map(id => parseInt(id)).filter(id => !isNaN(id));

    const response = await fond.findAll({
      where: {
        id: paramId,
      },
      order: [['id', 'DESC']],
      limit: 10000
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
      ],
      limit: 10000
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
      nom_fond: (data.nom_fond || '').toString(),
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
  const conditions = ['f.active = 1'];
  const replacements = {};

  if (minHorizon && maxHorizon) {
    conditions.push('v.date >= :minHorizon AND v.date <= :maxHorizon');
    replacements.minHorizon = minHorizon;
    replacements.maxHorizon = maxHorizon;
  }
  if (selectedPays) {
    conditions.push('LOWER(f.pays) = LOWER(:selectedPays)');
    replacements.selectedPays = selectedPays;
  }
  if (selectedRegion) {
    conditions.push('LOWER(f.region) = LOWER(:selectedRegion)');
    replacements.selectedRegion = selectedRegion;
  }

  const query = `
    SELECT DISTINCT f.id, f.nom_fond, f.code_ISIN
    FROM fond_investissements AS f
    INNER JOIN valorisations AS v ON f.id = v.fund_id
    WHERE ${conditions.join(' AND ')}
  `;

  try {
    const fondsDansCategorie = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements,
    });

    const funds = fondsDansCategorie.map(data => ({
      label: `${data.nom_fond || ''} ${data.code_ISIN || ''}`.trim(),
      value: data.id,
      slug: generateFundSlug(data.nom_fond, data.code_ISIN, data.id),
      nom_fond: (data.nom_fond || '').toString(),
      code_ISIN: data.code_ISIN,
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
    try {
    const fundId = extractIdFromSlug(req.params.id);
    if (!fundId) {
      return res.status(400).json({ message: 'ID de fond invalide', code: 400 });
    }
    const response = await vl.findAll({
      where: {
        fund_id: fundId
      },
      order: [
        ['date', 'ASC']
      ],
      limit: 10000
    });
    if (response.length > 0) {
      /* const graphs = response.map(data => ({
         dates :moment(data.date).format('YYYY-MM-DD'), // Remplacez avec la propriété correcte de l'objet
         bases_100:data.base_100, // Remplacez avec la propriété correcte de l'objet
         bases_100_InRef:data.base_100_InRef,
     }));*/
      const hasIndRef = response.some(data => data.indRef !== null);

      const graphs = response.map(data => {
        if (data.value === null) return null;
        const point = {
          dates: moment(data.date).format('YYYY-MM-DD'),
          values: hasIndRef ? (data.vl_ajuste ?? data.value) : data.value,
        };
        if (hasIndRef && data.indRef != null) {
          point.valuesInd = data.indRef;
        }
        return point;
      }).filter(Boolean);

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
      const baseUrl = urll;
      const libelle_indice = libelle_indices.find(v => v) || null;
      const ID_indice = ID_indices.find(v => v) || null;
      const currentDate = moment();

      const daysDiff = currentDate.diff(lastDate, 'days');
      const weekends = Array.from({ length: daysDiff }, (_, i) => moment(lastValue).add(i, 'days'))
        .filter(date => date.day() === 0 || date.day() === 6)
        .length;
      const missingVl = daysDiff - weekends;

      const safeFetch = async (url) => {
        try {
          const resp = await fetch(url);
          if (!resp.ok) return {};
          return await resp.json();
        } catch (e) {
          console.error('Erreur fetch interne:', url, e.message);
          return {};
        }
      };

      const [lastValData, last1ansRatiosData, lastRatiosData, last5ansRatiosData] = await Promise.all([
        safeFetch(`${baseUrl}/api/performances/fond/${fundid}?date=${lastDate}`),
        safeFetch(`${baseUrl}/api/ratiosnew/1/${fundid}`),
        safeFetch(`${baseUrl}/api/ratiosnew/3/${fundid}`),
        safeFetch(`${baseUrl}/api/ratiosnew/5/${fundid}`),
      ]);

      const resultat = await fond.findOne({
        attributes: ['indice_benchmark','indice', 'structure_fond', 'strategie_politique_invest', 'philosophie_fond', 'code_ISIN', 'date_creation', 'periodicite', "affectation", "minimum_investissement", "frais_souscription", "frais_rachat", "frais_gestion", "frais_entree", "frais_sortie", 'categorie_libelle', 'nom_fond', 'categorie_national', 'pays', 'categorie_globale', 'categorie_regional', 'type_investissement', 'classification', 'societe_gestion', 'nom_gerant', 'indice_fundafrica', 'indice_fundafrica_id', 'categorie_fundafrica_locale', 'categorie_fundafrica_regionale', 'categorie_fundafrica_globale'],
        where: {
          id: fundId,
        },
      });
      if (!resultat) {
        return res.status(404).json({ message: 'Fonds introuvable', code: 404 });
      }
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

      const pays_regul = pays ? await pays_regulateurs.findOne({
        attributes: ['regulateur', 'sitewebregulateur', 'nomdelabourse', 'URLdelabourse', 'nomdevise', 'symboledevise'],
        where: {
          pays: pays,
        },
      }) : null;
      const regulateur = pays_regul ? pays_regul.regulateur : null;
      const sitewebregulateur = pays_regul ? pays_regul.sitewebregulateur : null;
      const nomdelabourse = pays_regul ? pays_regul.nomdelabourse : null;
      const URLdelabourse = pays_regul ? pays_regul.URLdelabourse : null;
      const symboledevise = pays_regul ? pays_regul.symboledevise : null;

      const societegestion = await societe.findOne({
        attributes: ['nom', 'description', 'site_web'],
        where: {
          nom: societe_gestion,
        },
      });

      const societesiteweb=societegestion ? societegestion.site_web || '' : '';

    

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
          attributes: ['id','nom_fond'], // Sélectionner seulement le nom du fond, vous pouvez ajouter d'autres attributs si nécessaire
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
        id:fond.fond_investissement ? fond.fond_investissement.id : null, // Vérifie si fond existe
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
          indice_fundafrica: resultat.indice_fundafrica || null,
          indice_fundafrica_id: resultat.indice_fundafrica_id || null,
          categorie_fundafrica_locale: resultat.categorie_fundafrica_locale || null,
          categorie_fundafrica_regionale: resultat.categorie_fundafrica_regionale || null,
          categorie_fundafrica_globale: resultat.categorie_fundafrica_globale || null,
          lastdatepreviousmonth,
          performances: lastValData,
          ratios3a: lastRatiosData,
          ratios1a: last1ansRatiosData,
          ratios5a: last5ansRatiosData
        }
      });
    } else {
      res.status(404).json({ message: 'Aucune donnée VL trouvée pour ce fonds', code: 404 });

    }
    } catch (error) {
       console.error('Erreur lors de la récupération des données valLiq:', error);
       res.status(500).json({ message: 'Erreur lors de la récupération des données' });
    }
  });

  router.get('/api/valLiqdev/:id/:devise', async (req, res) => {
    try {
    const fundId = extractIdFromSlug(req.params.id);
    if (!fundId) {
      return res.status(400).json({ message: 'ID de fond invalide', code: 400 });
    }
    const response = await vl.findAll({
      where: {
        fund_id: fundId
      },
      order: [
        ['date', 'ASC']
      ],
      limit: 10000
    });
    if (response.length > 0) {

      const indRefField = req.params.devise == "USD" ? 'indRef_USD' : 'indRef_EUR';
      const valueField = req.params.devise == "USD" ? 'vl_ajuste_USD' : 'vl_ajuste_EUR';
      const rawValueField = req.params.devise == "USD" ? 'value_USD' : 'value_EUR';
      const hasIndRef = response.some(data => data[indRefField] !== null && data[indRefField] > 0);

      const firstValid = response.find(d => {
        const v = d[valueField] ?? d[rawValueField];
        return v && v > 0;
      });
      const baseVal = firstValid ? (firstValid[valueField] ?? firstValid[rawValueField]) : 1;

      let baseInd = 1;
      if (hasIndRef && firstValid) {
        const startIdx = response.indexOf(firstValid);
        const firstValidInd = response.slice(startIdx).find(d => d[indRefField] && d[indRefField] > 0);
        if (firstValidInd) baseInd = firstValidInd[indRefField];
      }

      const graphs = response.map(data => {
        const val = data[valueField] ?? data[rawValueField];
        if (!val) return null;
        const point = {
          dates: moment(data.date).format('YYYY-MM-DD'),
          values: (val / baseVal) * 100,
        };
        if (hasIndRef && data[indRefField] != null && data[indRefField] > 0) {
          point.valuesInd = (data[indRefField] / baseInd) * 100;
        }
        return point;
      }).filter(Boolean);
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
      const baseUrl = urll;
      const libelle_indice = libelle_indices.find(v => v) || null;
      const ID_indice = ID_indices.find(v => v) || null;
      const currentDate = moment();

      const daysDiff = currentDate.diff(lastDate, 'days');
      const weekends = Array.from({ length: daysDiff }, (_, i) => moment(lastValue).add(i, 'days'))
        .filter(date => date.day() === 0 || date.day() === 6)
        .length;
      const missingVl = daysDiff - weekends;

      const safeFetch = async (url) => {
        try {
          const resp = await fetch(url);
          if (!resp.ok) return {};
          return await resp.json();
        } catch (e) {
          console.error('Erreur fetch interne:', url, e.message);
          return {};
        }
      };

      const [lastValData, last1ansRatiosData, lastRatiosData, last5ansRatiosData] = await Promise.all([
        safeFetch(`${baseUrl}/api/performancesdev/fond/${fundid}/${req.params.devise}?date=${lastDate}`),
        safeFetch(`${baseUrl}/api/ratiosnewdev/1/${fundid}/${req.params.devise}`),
        safeFetch(`${baseUrl}/api/ratiosnewdev/3/${fundid}/${req.params.devise}`),
        safeFetch(`${baseUrl}/api/ratiosnewdev/5/${fundid}/${req.params.devise}`),
      ]);

      const resultat = await fond.findOne({
        attributes: ['indice_benchmark', 'indice', 'structure_fond', 'code_ISIN', 'date_creation', 'periodicite', "affectation", "minimum_investissement", "frais_souscription", "frais_rachat", "frais_gestion", "frais_entree", "frais_sortie", 'categorie_libelle', 'nom_fond', 'categorie_national', 'pays', 'categorie_globale', 'categorie_regional', 'type_investissement', 'classification', 'societe_gestion', 'nom_gerant', 'indice_fundafrica', 'indice_fundafrica_id', 'categorie_fundafrica_locale', 'categorie_fundafrica_regionale', 'categorie_fundafrica_globale'],
        where: {
          id: fundId,
        },
      });
      if (!resultat) {
        return res.status(404).json({ message: 'Fonds introuvable', code: 404 });
      }
      const indice_benchmark = resultat.indice_benchmark;
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

      const pays_regul = pays ? await pays_regulateurs.findOne({
        attributes: ['regulateur', 'sitewebregulateur', 'nomdelabourse', 'URLdelabourse', 'nomdevise', 'symboledevise'],
        where: {
          pays: pays,
        },
      }) : null;
      const regulateur = pays_regul ? pays_regul.regulateur : null;
      const sitewebregulateur = pays_regul ? pays_regul.sitewebregulateur : null;
      const nomdelabourse = pays_regul ? pays_regul.nomdelabourse : null;
      const URLdelabourse = pays_regul ? pays_regul.URLdelabourse : null;
      const symboledevise = pays_regul ? pays_regul.symboledevise : null;


      res.json({
        code: 200,
        data: {
          ID_indice,
          indice_benchmark,
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
          indice_fundafrica: resultat.indice_fundafrica || null,
          indice_fundafrica_id: resultat.indice_fundafrica_id || null,
          categorie_fundafrica_locale: resultat.categorie_fundafrica_locale || null,
          categorie_fundafrica_regionale: resultat.categorie_fundafrica_regionale || null,
          categorie_fundafrica_globale: resultat.categorie_fundafrica_globale || null,
          lastdatepreviousmonth,
          performances: lastValData,
          ratios3a: lastRatiosData,
          ratios1a: last1ansRatiosData,
          ratios5a: last5ansRatiosData
        }
      });
    } else {
      res.status(404).json({ message: 'Aucune donnée VL trouvée pour ce fonds', code: 404 });

    }
    } catch (error) {
       console.error('Erreur lors de la récupération des données valLiqdev:', error);
       res.status(500).json({ message: 'Erreur lors de la récupération des données' });
    }
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
    }

    if (selectedsociete && selectedsociete != 'undefined') {
      whereClause.societe_gestion = selectedsociete;
    }

    const fondall = await fond.findAll({
      where: whereClause, // Pas besoin d'encapsuler dans Op.and, oùClause est déjà un objet
      group: ['nom_fond'],
      order: [['nom_fond', 'ASC']],
      limit: 10000
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