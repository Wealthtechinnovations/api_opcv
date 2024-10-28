const { Magic } = require('@magic-sdk/admin');
const { Sequelize, DataTypes, where } = require('sequelize');
const { vl, indice, taux, fond, pays_regulateurs, sequelize, urll, urllsite, portefeuille, portefeuille_vl, portefeuilles_proposes_vls, portefeuilles_proposes, users, societe, classementfonds, performences, transaction, investissement, tsr, cashdb, frais, fiscalite, portefeuille_vl_cumul, devises, portefeuille_base100, favorisfonds, devisedechanges, personnel, documentss, performences_eurs, performences_usds, classementfonds_eurs, classementfonds_usds, actu, tsrhisto, rendement, simulation, simulationportefeuille, date_valorisation, apikeys } = require('../db/sequelize')
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



/**
 * @swagger
 * /api/performances/fond/{fund_id}:
 *  get:
 *     tags:
 *       - Performance Data
 *     summary: Retrieve performance data for a specific fund.
 *     description: Retrieve various performance metrics for a specific fund based on its ID.
 *     parameters:
 *       - name: fund_id
 *         in: path
 *         description: The fund_id of the fund.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response containing various performance metrics.
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
 *                     perfVeille:
 *                       type: number
 *                       format: double
 *                       description: Performance for the previous day.
 *                     perf4Semaines:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 4 weeks.
 *                     perf1erJanvier:
 *                       type: number
 *                       format: double
 *                       description: Performance since January 1st of the current year.
 *                     perf3Mois:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 3 months.
 *                     perf6Mois:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 6 months.
 *                     perf1An:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 1 year.
 *                     perf3Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 3 years.
 *                     perf5Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 5 years.
 *                     perf8Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 8 years.
 *                     perf10Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 10 years.
 *                     perf12Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 12 years.
 *                     perf15Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 15 years.
 *                     perf20Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 20 years.
 *                     perfOrigine:
 *                       type: number
 *                       format: double
 *                       description: Performance since the fund's inception.
 *                     perfFindeMois1An:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (1 year).
 *                     perfFindeMois3Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (3 years).
 *                     perfFindeMois5Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (5 years).
 *                     perfFindeMois8Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (8 years).
 *                     perfFindeMois10Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (10 years).
 *                     perfFindeMois12Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (12 years).
 *                     perfFindeMois15Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (15 years).
 *                     perfFindeMois20Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (20 years).
 *                     perfAnnualized1An:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 1 year.
 *                     perfAnnualized3Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 3 years.
 *                     perfAnnualized5Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 5 years.
 *                     perfAnnualized8Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 8 years.
 *                     perfAnnualized10Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 10 years.
 *                     perfAnnualized12Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 12 years.
 *                     perfAnnualized15Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 15 years.
 *                     perfAnnualized20Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 20 years.
 *                     perfAnnualizedOrigine:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance since the fund's inception.
 */
router.get('/api/performances/fond/:id', async (req, res) => {
  const dateee = req.query.date;
  const resultat = await fond.findOne({
    attributes: ['categorie_libelle', 'categorie_national'],
    where: {
      id: req.params.id,
    },
  });
  const categorie = resultat.categorie_libelle;
  const categorie_national = resultat.categorie_national;
  let performancesCategorie;
  if (dateee) {
    performancesCategorie = await getPerformancesByCategorynow(categorie_national, dateee);
  }
  vl.findAll({
    where: {
      fund_id: req.params.id
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      const values = response.map((data) => data.vl_ajuste); //todo
      const actif_nets = response.map((data) => data.actif_net);
      const lastValueactif_net = actif_nets[actif_nets.length - 1];

      const lastValue = values[values.length - 1];
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]

      const targetYear = groupDatesByYear(dates).length

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const perf3Moisactif_net = calculatePerformance(lastValueactif_net, actif_nets[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);

      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);

      //Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      console.log(values[dates.indexOf(targetDate1An)])

      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])



      //Performances annualizées fin de mois
      const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
      const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
      const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
      const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
      const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
      const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
      const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
      const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
      const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


      //Performances cumulées fin de mois
      const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      //Performances annualizées à date
      const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
      //Performances  annee calendaire
      const ArrayDates = groupDatesByYear(dates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      const multipliedValues = adaptValues1.map(item => {
        const year = item[0];
        const value1 = item[1];
        const value3 = item[2] * 100; // Multipliez la troisième position par 100

        return [year, value1, value3];
      });


      console.log(multipliedValues);
      res.json({
        code: 200,
        data: {
          fund_id: req.params.id,
          lastdatepreviousmonth: lastdatepreviousmonth,
          category: categorie,
          perf3Moisactif_net: perf3Moisactif_net,
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf15Ans: perf15Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
          perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
          perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
          perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
          perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
          perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
          perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
          perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
          perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
          perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
          perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
          perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
          perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
          perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
          perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
          perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
          perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
          perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
          perfAnnualizedtodate1An: perfAnnualizedtodate1An,
          perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
          perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
          perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
          perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
          perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
          perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
          perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
          perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
          adaptValues1: multipliedValues,
          performancesCategorie: dateee ? performancesCategorie : null
        }
      })

    })
})
router.get('/api/performancescomparaison/fond/:id', async (req, res) => {
  const dateee = req.query.date;
  const resultat = await fond.findOne({
    attributes: ['categorie_libelle', 'categorie_national'],
    where: {
      id: req.params.id,
    },
  });
  const categorie = resultat.categorie_libelle;
  const categorie_national = resultat.categorie_national;

  // const performancesCategorie = await getPerformancesByCategorynow(categorie_national, dateee);

  vl.findAll({
    where: {
      fund_id: req.params.id
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      const values = response.map((data) => data.value);
      const actif_nets = response.map((data) => data.actif_net);
      const lastValueactif_net = actif_nets[actif_nets.length - 1];

      const lastValue = values[values.length - 1];
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]

      const targetYear = groupDatesByYear(dates).length

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const perf3Moisactif_net = calculatePerformance(lastValueactif_net, actif_nets[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);

      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);

      //Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      console.log(values[dates.indexOf(targetDate1An)])

      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])



      //Performances annualizées fin de mois
      const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
      const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
      const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
      const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
      const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
      const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
      const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
      const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
      const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


      //Performances cumulées fin de mois
      const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      //Performances annualizées à date
      const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
      //Performances  annee calendaire
      const ArrayDates = groupDatesByYear(dates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      const multipliedValues = adaptValues1.map(item => {
        const year = item[0];
        const value1 = item[1];
        const value3 = item[2] * 100; // Multipliez la troisième position par 100

        return [year, value1, value3];
      });


      console.log(multipliedValues);
      res.json({
        code: 200,
        data: {
          fund_id: req.params.id,
          lastdatepreviousmonth: lastdatepreviousmonth,
          category: categorie,
          perf3Moisactif_net: perf3Moisactif_net,
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf15Ans: perf15Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
          perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
          perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
          perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
          perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
          perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
          perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
          perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
          perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
          perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
          perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
          perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
          perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
          perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
          perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
          perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
          perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
          perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
          perfAnnualizedtodate1An: perfAnnualizedtodate1An,
          perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
          perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
          perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
          perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
          perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
          perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
          perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
          perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
          adaptValues1: multipliedValues,
          //  performancesCategorie: performancesCategorie
        }
      })

    })
})
/////revoir
router.get('/api/performanceswithdate/fond/:id/:date', async (req, res) => {
  try {
    const fondResult = await fond.findOne({
      attributes: ['categorie_libelle', 'categorie_national'],
      where: { id: req.params.id },
    });

    if (!fondResult) {
      return res.status(404).json({ code: 404, message: 'Fond non trouvé' });
    }

    const categorie = fondResult.categorie_libelle;
    const categorie_national = fondResult.categorie_national;
    //   const performancesCategorie = await getPerformancesByCategory(categorie_national);

    const response = await vl.findAll({
      where: {
        fund_id: req.params.id,
        date: { [Op.lte]: req.params.date },
      },
      order: [['date', 'ASC']],
    });

    if (!response.length) {
      return res.status(404).json({ code: 404, message: 'Données de valeur liquidative non trouvées' });
    }
    const valuess = response.map(data => data.value);

    // Dupliquer la VL pour les jours de semaine
    const datess = response.map(data => moment(data.date).format('YYYY-MM-DD'));
  // Nouveau tableau pour stocker les objets date-valeur
  let extendedData = datess.map((date, index) => ({
    date: date,
    value: valuess[index]
  }));
   // Remplir les jours de semaine manquants
for (let i = 0; i < datess.length - 1; i++) {
  const currentDate = moment(datess[i]);
  const nextDate = moment(datess[i + 1]);

  // Ajouter les jours manquants entre la date actuelle et la date suivante
  while (currentDate.clone().add(1, 'days').isBefore(nextDate)) {
    currentDate.add(1, 'days');  // Avancer la date d'un jour

    // Vérifier si le jour est un jour de semaine (lundi à vendredi)
    if (currentDate.isoWeekday() < 6) { // 6 = Samedi, 7 = Dimanche
      extendedData.push({
        date: currentDate.format('YYYY-MM-DD'),
        value: valuess[i]  // Utilisez la valeur de la date actuelle
      });
    }
  }
}

// Trier les données par date
extendedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Extraire les dates et valeurs triées
    const dates = extendedData.map(item => item.date);
    const values = extendedData.map(item => item.value);
    const actif_nets = response.map(data => data.actif_net);
    const lastValue = values[values.length - 1];
    const lastValueactif_net = actif_nets[actif_nets.length - 1];
    const lastDate = dates[dates.length - 1];
    const targetYear = groupDatesByYear(dates).length;

    const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
    const datesFromLastDatePreviousToOrigin = dates.slice(0, dates.indexOf(lastdatepreviousmonth) + 1);

    // Calcul des performances glissantes
    const perfVeille = calculatePerformance(lastValue, values[values.length - 2]);
    const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
    const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
    const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
    const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
    const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
    const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
    const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
    const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
    const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
    const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
    const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
    const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
    const perfOrigine = calculatePerformance(lastValue, values[0]);


    //Calcul performances glissante fin du mois
    const perfVeillem = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(lastdatepreviousmonth) - 1]);
    const perf4Semainesm = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDateWeek(datesFromLastDatePreviousToOrigin))]);
    const perf1erJanvierm = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDateJanuary(datesFromLastDatePreviousToOrigin))]);
    const perf3Moism = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDateMonthlized(datesFromLastDatePreviousToOrigin, 3, lastdatepreviousmonth))]);
    const perf6Moism = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDateMonthlized(datesFromLastDatePreviousToOrigin, 6, lastdatepreviousmonth))]);
    const perf1Anm = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDatemois(datesFromLastDatePreviousToOrigin, 1))]);
    const perf3Ansm = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDatemois(datesFromLastDatePreviousToOrigin, 3))]);
    const perf5Ansm = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDatemois(datesFromLastDatePreviousToOrigin, 5))]);
    const perf8Ansm = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDatemois(datesFromLastDatePreviousToOrigin, 8))]);
    const perf10Ansm = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[datesFromLastDatePreviousToOrigin.indexOf(findNearestDatemois(datesFromLastDatePreviousToOrigin, 10))]);


    const perf3Moisactif_net = calculatePerformance(lastValueactif_net, actif_nets[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);

    const performancesFinDeMois = calculateMonthlyPerformances(dates, values, lastdatepreviousmonth, targetYear);

    // Performances annualisées à date
    const perfAnnualizedToDate = calculateAnnualizedToDate(dates, values, lastValue, targetYear);

    // Performances annuelles par année calendaire
    const ArrayDates = groupDatesByYear(dates);
    const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
    const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates).map(item => [item[0], item[1], item[2] * 100]);

    res.json({
      code: 200,
      data: {
        fund_id: req.params.id,
        lastdatepreviousmonth,
        category: categorie,
        perf3Moisactif_net,
        perfVeille,
        perfVeillem,
        perf4Semaines,
        perf4Semainesm,
        perf1erJanvier,
        perf1erJanvierm,
        perf3Mois,
        perf3Moism,
        perf6Mois,
        perf6Moism,
        perf1An,
        perf1Anm,
        perf3Ans,
        perf3Ansm,
        perf5Ans,
        perf5Ansm,
        perf8Ans,
        perf8Ansm,
        perf10Ans,
        perf10Ansm,
        perf12Ans,
        perf15Ans,
        perf20Ans,
        perfOrigine,
        ...performancesFinDeMois,
        ...perfAnnualizedToDate,
        adaptValues1,
        //  performancesCategorie,
      },
    });
  } catch (error) {
    console.error('Erreur lors du traitement des performances:', error);
    res.status(500).json({ code: 500, message: 'Erreur interne du serveur' });
  }
});
function calculateMonthlyPerformances(dates, values, lastdatepreviousmonth, targetYear) {
  const periods = [1, 3, 5, 8, 10, 12, 15, 20];
  const performances = {};

  periods.forEach(period => {
    const targetDate = findNearestDateAnnualized(dates, period, lastdatepreviousmonth);
    const key = `perfFindeMois${period}Ans`;
    const annualizedKey = `perfFindeMoisAnnualized${period}Ans`;
    const cumulativeKey = `perfCumuleeFindeMois${period}Ans`;

    performances[key] = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[dates.indexOf(targetDate)]);
    performances[annualizedKey] = calculateAnnualizedPerformanceper100(values[dates.indexOf(lastdatepreviousmonth)], values[dates.indexOf(targetDate)], period);
    performances[cumulativeKey] = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[dates.indexOf(targetDate)]);
  });

  const targetDateOrigine = groupDatesByMonth(dates)[0];
  performances.perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])]);
  performances.perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(lastdatepreviousmonth)], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
  performances.perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(lastdatepreviousmonth)], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])]);

  return performances;
}

function calculateAnnualizedToDate(dates, values, lastValue, targetYear) {
  const periods = [1, 3, 5, 8, 10, 12, 15, 20];
  const annualizedToDate = {};

  periods.forEach(period => {
    const key = `perfAnnualizedtodate${period}Ans`;
    annualizedToDate[key] = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, period))], period);
  });

  annualizedToDate.perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);

  return annualizedToDate;
}


///////
//////////////////////////////////
router.get('/api/performanceswithdate1/fond/:id/:date', async (req, res) => {
  const resultat = await fond.findOne({
    attributes: ['categorie_libelle', 'categorie_national'],
    where: {
      id: req.params.id,
    },
  });
  const categorie = resultat.categorie_libelle;
  const categorie_national = resultat.categorie_national;

  const performancesCategorie = await getPerformancesByCategory(categorie_national);

  const date = new Date(req.params.date); // Convertir la chaîne de date en objet Date

  vl.findAll({
    where: {
      fund_id: req.params.id,
      date: { [Op.lte]: req.params.date } // Filtrer les valeurs inférieures ou égales à la date fournie
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      const values = response.map((data) => data.value);
      const actif_nets = response.map((data) => data.actif_net);
      const lastValueactif_net = actif_nets[actif_nets.length - 1];

      const lastValue = values[values.length - 1];
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]

      const targetYear = groupDatesByYear(dates).length

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const perf3Moisactif_net = calculatePerformance(lastValueactif_net, actif_nets[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);

      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);

      //Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      console.log(values[dates.indexOf(targetDate1An)])

      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])



      //Performances annualizées fin de mois
      const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
      const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
      const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
      const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
      const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
      const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
      const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
      const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
      const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


      //Performances cumulées fin de mois
      const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      //Performances annualizées à date
      const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
      //Performances  annee calendaire
      const ArrayDates = groupDatesByYear(dates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      const multipliedValues = adaptValues1.map(item => {
        const year = item[0];
        const value1 = item[1];
        const value3 = item[2] * 100; // Multipliez la troisième position par 100

        return [year, value1, value3];
      });


      console.log(multipliedValues);
      res.json({
        code: 200,
        data: {
          fund_id: req.params.id,
          lastdatepreviousmonth: lastdatepreviousmonth,
          category: categorie,
          perf3Moisactif_net: perf3Moisactif_net,
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf15Ans: perf15Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
          perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
          perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
          perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
          perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
          perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
          perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
          perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
          perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
          perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
          perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
          perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
          perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
          perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
          perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
          perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
          perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
          perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
          perfAnnualizedtodate1An: perfAnnualizedtodate1An,
          perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
          perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
          perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
          perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
          perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
          perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
          perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
          perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
          adaptValues1: multipliedValues,
          performancesCategorie: performancesCategorie
        }
      })

    })
})


//////////////////////////////////
router.get('/api/performancesindice/fond/:id', async (req, res) => {
  const selectedValues = req.query.query;
  const resultat = await fond.findOne({
    attributes: ['categorie_libelle', 'categorie_national'],
    where: {
      id: req.params.id,
    },
  });
  const categorie = resultat.categorie_libelle;
  const categorie_national = resultat.categorie_national;

  // const performancesCategorie = await getPerformancesByCategory(categorie_national);

  vl.findAll({
    where: {
      fund_id: req.params.id
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      const values = response.map(data => {
        switch (selectedValues) {
          case 'USD':
            return data.indRef_USD; // Assurez-vous d'avoir les valeurs en USD dans votre base de données
          case 'EUR':
            return data.indRef_EUR; // Assurez-vous d'avoir les valeurs en USD dans votre base de données
          default:
            return data.indRef;
        }
      });
      const actif_nets = response.map(data => {
        switch (selectedValues) {
          case 'USD':
            return data.actif_net_USD; // Assurez-vous d'avoir les valeurs en USD dans votre base de données
          case 'EUR':
            return data.actif_net_EUR; // Assurez-vous d'avoir les valeurs en USD dans votre base de données
          default:
            return data.actif_net;
        }
      });
      const lastValueactif_net = actif_nets[actif_nets.length - 1];

      const lastValue = values[values.length - 1];
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]

      const targetYear = groupDatesByYear(dates).length

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const perf3Moisactif_net = calculatePerformance(lastValueactif_net, actif_nets[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);

      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);

      //Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      console.log(values[dates.indexOf(targetDate1An)])

      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])



      //Performances annualizées fin de mois
      const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
      const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
      const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
      const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
      const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
      const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
      const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
      const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
      const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


      //Performances cumulées fin de mois
      const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      //Performances annualizées à date
      const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
      //Performances  annee calendaire
      const ArrayDates = groupDatesByYear(dates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      const multipliedValues = adaptValues1.map(item => {
        const year = item[0];
        const value1 = item[1];
        const value3 = item[2] * 100; // Multipliez la troisième position par 100

        return [year, value1, value3];
      });


      console.log(multipliedValues);
      res.json({
        code: 200,
        data: {
          fund_id: req.params.id,
          lastdatepreviousmonth: lastdatepreviousmonth,
          category: categorie,
          perf3Moisactif_net: perf3Moisactif_net,
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf15Ans: perf15Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
          perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
          perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
          perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
          perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
          perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
          perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
          perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
          perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
          perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
          perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
          perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
          perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
          perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
          perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
          perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
          perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
          perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
          perfAnnualizedtodate1An: perfAnnualizedtodate1An,
          perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
          perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
          perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
          perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
          perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
          perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
          perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
          perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
          adaptValues1: multipliedValues,
          //    performancesCategorie: performancesCategorie
        }
      })

    })
})

router.get('/api/performancescategorie/fond/:id', async (req, res) => {
  const resultat = await fond.findOne({
    attributes: ['categorie_libelle', 'categorie_national'],
    where: {
      id: req.params.id,
    },
  });
  const categorie = resultat.categorie_libelle;
  const categorie_national = resultat.categorie_national;
  // Recherche des fonds ayant la même catégorie nationale
  const fondsMemeCategorie = await fond.findAll({
    attributes: ['id'],
    where: { categorie_national: categorie_national },
  });
  const fondIds = fondsMemeCategorie.map(f => f.id);


  const selectedValues = req.query.query; // Récupérer la devise à partir des paramètres de la requête

  let valueColumn;
  if (selectedValues === 'EUR') {
    valueColumn = 'value_EUR';
  } else if (selectedValues === 'USD') {
    valueColumn = 'value_USD';
  } else {
    valueColumn = 'value'; // Valeur par défaut
  }

  // Requête pour récupérer les valorisations avec la colonne de valeur appropriée
  const valorisationss = await vl.findAll({
    attributes: [
      'fund_id',
      [Sequelize.fn('MAX', Sequelize.col('date')), 'latest_date'],
      [Sequelize.col(valueColumn), 'value'],
      [Sequelize.fn('YEAR', Sequelize.col('date')), 'year']
    ],
    where: {
      fund_id: fondIds,
    },
    group: ['fund_id', 'year'],
    order: [
      ['fund_id', 'ASC'],
      ['year', 'DESC'],
      ['latest_date', 'DESC']
    ],
  });
  // Transform the result to calculate performance
  let fundPerformances = {};
  valorisationss.forEach(val => {
    const { fund_id, year, value, latest_date } = val.dataValues;
    if (!fundPerformances[fund_id]) {
      fundPerformances[fund_id] = {};
    }
    fundPerformances[fund_id][year] = { value, date: latest_date };
  });

  let annualPerformances = {};
  for (let fund_id in fundPerformances) {
    let years = Object.keys(fundPerformances[fund_id]).sort((a, b) => b - a);
    for (let i = 0; i < years.length - 1; i++) {
      let currentYear = years[i];
      let previousYear = years[i + 1];
      let currentValue = fundPerformances[fund_id][currentYear].value;
      let previousValue = fundPerformances[fund_id][previousYear].value;
      let performance = (currentValue - previousValue) / previousValue;
      if (previousValue == 0) {
        performance = 0

      }
      if (!annualPerformances[currentYear]) {
        annualPerformances[currentYear] = [];
      }
      annualPerformances[currentYear].push(performance);
    }
  }

  let multipliedValues = [];
  for (let year in annualPerformances) {
    let averagePerformance = annualPerformances[year].reduce((a, b) => a + b, 0) / annualPerformances[year].length;
    multipliedValues.push([parseInt(year), averagePerformance * 100]);
  }


  multipliedValues.reverse();
  res.json({
    code: 200,
    data: {
      multipliedValues
    }
  });

})
app.get('/api/performancesdevcategorie/fond/:id/:devise', async (req, res) => {
  const resultat = await fond.findOne({
    attributes: ['categorie_libelle', 'categorie_national'],
    where: {
      id: req.params.id,
    },
  });
  const categorie = resultat.categorie_libelle;
  const categorie_national = resultat.categorie_national;
  // Recherche des fonds ayant la même catégorie nationale
  const fondsMemeCategorie = await fond.findAll({
    attributes: ['id'],
    where: { categorie_national: categorie_national },
  });
  let valorisationss;
  if (req.params.devise == "USD") {
    valorisationss = await vl.findAll({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('value_USD')), 'moyenne_vl'],
        'date'
      ],
      where: { fund_id: fondsMemeCategorie.map(fond => fond.id) },
      group: ['date']
    });
  } else {
    valorisationss = await vl.findAll({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('value_EUR')), 'moyenne_vl'],
        'date'
      ],
      where: { fund_id: fondsMemeCategorie.map(fond => fond.id) },
      group: ['date']
    });
  }

  const values = valorisationss.map((data) => data.dataValues.moyenne_vl);
  const dates = valorisationss.map((data) => moment(data.dataValues.date).format('YYYY-MM-DD'));
  //Performances  annee calendaire
  const ArrayDates = groupDatesByYear(dates);
  const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
  const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
  const multipliedValues = adaptValues1.map(item => {
    const year = item[0];
    const value1 = item[1];
    const value3 = item[2] * 100; // Multipliez la troisième position par 100

    return [year, value1, value3];
  });
  res.json({
    code: 200,
    data: {
      multipliedValues
    }
  });

})

router.get('/api/performancesdev/fond/:id/:devise', async (req, res) => {
  const dateee = req.query.date;

  const resultat = await fond.findOne({
    attributes: ['categorie_libelle', 'categorie_national'],
    where: {
      id: req.params.id,
    },
  });
  const categorie = resultat.categorie_libelle;
  const categorie_national = resultat.categorie_national;

  if (dateee) {
    performancesCategorie = await getPerformancesByCategorynow(categorie_national, dateee);
  }
  vl.findAll({
    where: {
      fund_id: req.params.id
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      let values;
      let actif_nets;
      if (req.params.devise == "USD") {
        values = response.map((data) => data.value_USD);
        actif_nets = response.map((data) => data.actif_net_USD);

      } else {
        values = response.map((data) => data.value_EUR);
        actif_nets = response.map((data) => data.actif_net_USD);


      }

      // const values = response.map((data) => data.value);
      const lastValue = values[values.length - 1];
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]
      const lastValueactif_net = actif_nets[actif_nets.length - 1];

      const targetYear = groupDatesByYear(dates).length
      const perf3Moisactif_net = calculatePerformance(lastValueactif_net, actif_nets[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);

      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);

      //Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      console.log(values[dates.indexOf(targetDate1An)])

      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])



      //Performances annualizées fin de mois
      const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
      const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
      const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
      const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
      const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
      const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
      const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
      const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
      const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


      //Performances cumulées fin de mois
      const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      //Performances annualizées à date
      const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
      //Performances  annee calendaire
      const ArrayDates = groupDatesByYear(dates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      const multipliedValues = adaptValues1.map(item => {
        const year = item[0];
        const value1 = item[1];
        const value3 = item[2] * 100; // Multipliez la troisième position par 100

        return [year, value1, value3];
      });


      console.log(multipliedValues);
      res.json({
        code: 200,
        data: {
          fund_id: req.params.id,
          lastdatepreviousmonth: lastdatepreviousmonth,
          perf3Moisactif_net: perf3Moisactif_net,
          category: categorie,
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf15Ans: perf15Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
          perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
          perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
          perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
          perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
          perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
          perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
          perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
          perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
          perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
          perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
          perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
          perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
          perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
          perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
          perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
          perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
          perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
          perfAnnualizedtodate1An: perfAnnualizedtodate1An,
          perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
          perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
          perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
          perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
          perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
          perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
          perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
          perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
          adaptValues1: multipliedValues,
          performancesCategorie: dateee ? performancesCategorie : null
        }
      })

    })
})

router.get('/api/performancesdevwithdate/fond/:id/:devise/:date', async (req, res) => {

  const resultat = await fond.findOne({
    attributes: ['categorie_libelle', 'categorie_national'],
    where: {
      id: req.params.id,
    },
  });
  const categorie = resultat.categorie_libelle;
  const categorie_national = resultat.categorie_national;

  //const performancesCategorie = await getPerformancesByCategory(categorie_national);

  vl.findAll({
    where: {
      fund_id: req.params.id,
      date: { [Op.lte]: req.params.date } // Filtrer les valeurs inférieures ou égales à la date fournie
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      let values;
      let actif_nets;
      if (req.params.devise == "USD") {
        values = response.map((data) => data.value_USD);
        actif_nets = response.map((data) => data.actif_net_USD);

      } else {
        values = response.map((data) => data.value_EUR);
        actif_nets = response.map((data) => data.actif_net_USD);


      }

      // const values = response.map((data) => data.value);
      const lastValue = values[values.length - 1];
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]
      const lastValueactif_net = actif_nets[actif_nets.length - 1];

      const targetYear = groupDatesByYear(dates).length
      const perf3Moisactif_net = calculatePerformance(lastValueactif_net, actif_nets[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);

      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);

      //Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      console.log(values[dates.indexOf(targetDate1An)])

      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])



      //Performances annualizées fin de mois
      const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
      const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
      const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
      const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
      const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
      const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
      const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
      const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
      const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


      //Performances cumulées fin de mois
      const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      //Performances annualizées à date
      const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
      //Performances  annee calendaire
      const ArrayDates = groupDatesByYear(dates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      const multipliedValues = adaptValues1.map(item => {
        const year = item[0];
        const value1 = item[1];
        const value3 = item[2] * 100; // Multipliez la troisième position par 100

        return [year, value1, value3];
      });


      console.log(multipliedValues);
      res.json({
        code: 200,
        data: {
          fund_id: req.params.id,
          lastdatepreviousmonth: lastdatepreviousmonth,
          perf3Moisactif_net: perf3Moisactif_net,
          category: categorie,
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf15Ans: perf15Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
          perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
          perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
          perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
          perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
          perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
          perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
          perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
          perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
          perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
          perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
          perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
          perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
          perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
          perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
          perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
          perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
          perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
          perfAnnualizedtodate1An: perfAnnualizedtodate1An,
          perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
          perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
          perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
          perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
          perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
          perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
          perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
          perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
          adaptValues1: multipliedValues,
          //  performancesCategorie: performancesCategorie
        }
      })

    })
})
router.get('/api/performancemonthyear/fond/:id', async (req, res) => {
  vl.findAll({
    where: {
      fund_id: req.params.id
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      const selectedValues = req.query.query;
      let values;
      let monthlyPerformance;
      let annualPerformance;
      let dates;
      if (selectedValues == "EUR") {
        values = response.map((data) => data.value_EUR);

        dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

        monthlyPerformance = calculatemPerformance(values, dates);
        annualPerformance = calculateAnnualPerformance(values, dates);
      } else if (selectedValues == "USD") {
        values = response.map((data) => data.value_USD);

        dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

        monthlyPerformance = calculatemPerformance(values, dates);
        annualPerformance = calculateAnnualPerformance(values, dates);
      } else {
        values = response.map((data) => data.value);

        dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

        monthlyPerformance = calculatemPerformance(values, dates);
        annualPerformance = calculateAnnualPerformance(values, dates);
      }

      res.json({ monthlyPerformance, annualPerformance });

    });
})

router.get('/api/performanceindicemonthyear/fond/:id', async (req, res) => {
  vl.findAll({
    where: {
      fund_id: req.params.id
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      const selectedValues = req.query.query;
      let values;
      let monthlyPerformance;
      let annualPerformance;
      let dates;
      if (selectedValues == "EUR") {
        values = response.map((data) => data.indRef_EUR);

        dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

        monthlyPerformance = calculatemPerformance(values, dates);
        annualPerformance = calculateAnnualPerformance(values, dates);
      } else if (selectedValues == "USD") {
        values = response.map((data) => data.indRef_USD);

        dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

        monthlyPerformance = calculatemPerformance(values, dates);
        annualPerformance = calculateAnnualPerformance(values, dates);
      } else {
        values = response.map((data) => data.indRef);

        dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

        monthlyPerformance = calculatemPerformance(values, dates);
        annualPerformance = calculateAnnualPerformance(values, dates);
      }

      res.json({ monthlyPerformance, annualPerformance });

    });
})

// Fonction pour calculer les performances mensuelles
function calculatemPerformance(values, dates) {
  const monthlyPerformances = {};

  for (let i = 0; i < values.length; i++) {
    const month = moment(dates[i]).format('YYYY-MM');
    const value = values[i];

    // Si le mois n'existe pas encore dans les performances mensuelles,
    // ou si la date actuelle est après celle enregistrée pour ce mois,
    // alors mettez à jour la performance mensuelle.
    if (!monthlyPerformances[month] || moment(dates[i]).isAfter(moment(monthlyPerformances[month].date))) {
      monthlyPerformances[month] = { date: dates[i], value: value };
    }
  }

  // Construire un tableau de performances mensuelles
  const monthlyPerformanceValues = Object.values(monthlyPerformances).map(monthly => monthly.value);
  const monthlyPerformanceDates = Object.values(monthlyPerformances).map(monthly => monthly.date);

  const monthlyPerformancesResults = {};

  for (let i = 1; i < monthlyPerformanceValues.length; i++) {
    const performance = calculatePerformance(monthlyPerformanceValues[i], monthlyPerformanceValues[i - 1]);
    const month = moment(monthlyPerformanceDates[i]).format('YYYY-MM');
    monthlyPerformancesResults[month] = performance;
  }

  return monthlyPerformancesResults;
}
/*function calculatemPerformance(values, dates) {
  const monthlyPerformances = {};
 
  for (let i = 0; i < values.length; i++) {
    const month = moment(dates[i]).format('YYYY-MM');
    const value = values[i];
 
    // Si le mois n'existe pas encore dans les performances mensuelles,
    // ou si la date actuelle est après celle enregistrée pour ce mois,
    // alors mettez à jour la performance mensuelle.
    if (!monthlyPerformances[month] || moment(dates[i]).isAfter(moment(monthlyPerformances[month].date))) {
      monthlyPerformances[month] = { date: dates[i], value: value };
    }
  }
 
  // Construire un tableau de performances mensuelles
  const monthlyPerformanceValues = Object.values(monthlyPerformances).map(monthly => monthly.value);
  const monthlyPerformanceDates = Object.values(monthlyPerformances).map(monthly => monthly.date);
 
  return { values: monthlyPerformanceValues, dates: monthlyPerformanceDates };
}
 
function calculatemPerformance(values, dates) {
  const monthlyPerformances = {};
 
  for (let i = 1; i < values.length; i++) {
    const month = moment(dates[i]).format('YYYY-MM');
    if (!monthlyPerformances[month]) {
      const startValue = values[i - 1];
      const endValue = values[i];
      //    const performance = ((endValue - startValue) / startValue) * 100;
      const performance = calculatePerformance(endValue, startValue)
      monthlyPerformances[month] = performance;
    }
  }
 
  return monthlyPerformances;
}*/

// Fonction pour calculer les performances annuelles
/*function calculateAnnualPerformance(values, dates) {
  const annualPerformances = {};
 
  for (let i = 1; i < values.length; i++) {
    const year = moment(dates[i]).format('YYYY');
    if (!annualPerformances[year]) {
      const startValue = values[i - 1];
      const endValue = values[i];
      //   const performance = ((endValue - startValue) / startValue) * 100;
      const performance = calculatePerformance(endValue, startValue)
      annualPerformances[year] = performance;
    }
  }
 
  return annualPerformances;
}*/
function calculateAnnualPerformance(values, dates) {
  const annualPerformances = {};

  for (let i = 0; i < values.length; i++) {
    const year = moment(dates[i]).format('YYYY');
    const value = values[i];

    // Si l'année n'existe pas encore dans les performances annuelles,
    // ou si la date actuelle est après celle enregistrée pour cette année,
    // alors mettez à jour la performance annuelle.
    if (!annualPerformances[year] || moment(dates[i]).isAfter(moment(annualPerformances[year].date))) {
      annualPerformances[year] = { date: dates[i], value: value };
    }
  }

  // Construire un tableau de performances annuelles
  const annualPerformanceValues = Object.values(annualPerformances).map(annual => annual.value);
  const annualPerformanceDates = Object.values(annualPerformances).map(annual => annual.date);

  const annualPerformancesResults = {};

  for (let i = 1; i < annualPerformanceValues.length; i++) {
    const performance = calculatePerformance(annualPerformanceValues[i], annualPerformanceValues[i - 1]);
    const year = moment(annualPerformanceDates[i]).format('YYYY');
    annualPerformancesResults[year] = performance;
  }

  return annualPerformancesResults;
}



const getPerformancesByCategory = async (categorie) => {
  /* const performancesCategorie = await sequelize.query(`
     SELECT
       categorie_nationale,
       AVG(CAST(ytd AS DECIMAL(10,2))) AS moyenne_ytd,
       AVG(CAST(perfveille AS DECIMAL(10,2))) AS moyenne_perfveille,
       AVG(CAST(perf1an AS DECIMAL(10,2))) AS moyenne_perf1an,
       AVG(CAST(perf3ans AS DECIMAL(10,2))) AS moyenne_perf3ans,
       AVG(CAST(perf5ans AS DECIMAL(10,2))) AS moyenne_perf5ans,
       AVG(CAST(perf8ans AS DECIMAL(10,2))) AS moyenne_perf8ans,
       AVG(CAST(perf10ans AS DECIMAL(10,2))) AS moyenne_perf10ans,
       AVG(CAST(perf4s AS DECIMAL(10,2))) AS moyenne_perf4s,
       AVG(CAST(perf3m AS DECIMAL(10,2))) AS moyenne_perf3m,
       AVG(CAST(perf6m AS DECIMAL(10,2))) AS moyenne_perf6m,
       AVG(CAST(perfannu1an AS DECIMAL(10,2))) AS moyenne_perfannu1an,
       AVG(CAST(perfannu3an AS DECIMAL(10,2))) AS moyenne_perfannu3an,
       AVG(CAST(perfannu5an AS DECIMAL(10,2))) AS moyenne_perfannu5an,
       AVG(CAST(volatility1an AS DECIMAL(10,2))) AS moyenne_volatility1an,
       AVG(CAST(volatility3an AS DECIMAL(10,2))) AS moyenne_volatility3an,
       AVG(CAST(volatility5an AS DECIMAL(10,2))) AS moyenne_volatility5an,
       AVG(CAST(ratiosharpe3an AS DECIMAL(10,2))) AS moyenne_ratiosharpe3an,
       AVG(CAST(pertemax1an AS DECIMAL(10,2))) AS moyenne_pertemax1an,
       AVG(CAST(pertemax3an AS DECIMAL(10,2))) AS moyenne_pertemax3an,
       AVG(CAST(pertemax5an AS DECIMAL(10,2))) AS moyenne_pertemax5an,
       AVG(CAST(sortino3an AS DECIMAL(10,2))) AS moyenne_sortino3an,
       AVG(CAST(info3an AS DECIMAL(10,2))) AS moyenne_info3an,
       AVG(CAST(calamar3an AS DECIMAL(10,2))) AS moyenne_calamar3an,
       AVG(CAST(var993an AS DECIMAL(10,2))) AS moyenne_var993an,
       AVG(CAST(var953an AS DECIMAL(10,2))) AS moyenne_var953an
     FROM performences
     WHERE 
       categorie_nationale = :categorie
       AND (
       ytd IS NOT NULL AND ytd <> '-' OR
       perfveille IS NOT NULL AND perfveille <> '-' OR
       perf1an IS NOT NULL AND perf1an <> '-' OR
       perf3ans IS NOT NULL AND perf3ans <> '-' OR
       perf5ans IS NOT NULL AND perf5ans <> '-' OR
       perf8ans IS NOT NULL AND perf8ans <> '-' OR
       perf10ans IS NOT NULL AND perf10ans <> '-' OR
       perf4s IS NOT NULL AND perf4s <> '-' OR
       perf3m IS NOT NULL AND perf3m <> '-' OR
       perf6m IS NOT NULL AND perf6m <> '-' OR
       perfannu3an IS NOT NULL AND perfannu3an <> '-' OR
       volatility3an IS NOT NULL AND volatility3an <> '-' OR
       ratiosharpe3an IS NOT NULL AND ratiosharpe3an <> '-' OR
       pertemax3an IS NOT NULL AND pertemax3an <> '-' OR
       sortino3an IS NOT NULL AND sortino3an <> '-' OR
       info3an IS NOT NULL AND info3an <> '-' OR
       calamar3an IS NOT NULL AND calamar3an <> '-' OR
       var993an IS NOT NULL AND var993an <> '-' OR
       var953an IS NOT NULL AND var953an <> '-'
   )
     GROUP BY categorie_nationale
   `, {
     replacements: { categorie: categorie },
     type: sequelize.QueryTypes.SELECT,
   });*/

  const performancesCategorie = await sequelize.query(`

  SELECT
    categorie_nationale,
    AVG(CAST(ytd AS DECIMAL(10,2))) AS moyenne_ytd,
    AVG(CAST(perfveille AS DECIMAL(10,2))) AS moyenne_perfveille,
    AVG(CAST(perf1an AS DECIMAL(10,2))) AS moyenne_perf1an,
    AVG(CAST(perf3ans AS DECIMAL(10,2))) AS moyenne_perf3ans,
    AVG(CAST(perf5ans AS DECIMAL(10,2))) AS moyenne_perf5ans,
    AVG(CAST(perf8ans AS DECIMAL(10,2))) AS moyenne_perf8ans,
    AVG(CAST(perf10ans AS DECIMAL(10,2))) AS moyenne_perf10ans,
    AVG(CAST(perf4s AS DECIMAL(10,2))) AS moyenne_perf4s,
    AVG(CAST(perf3m AS DECIMAL(10,2))) AS moyenne_perf3m,
    AVG(CAST(perf6m AS DECIMAL(10,2))) AS moyenne_perf6m,
    AVG(CAST(perfannu1an AS DECIMAL(10,2))) AS moyenne_perfannu1an,
    AVG(CAST(perfannu3an AS DECIMAL(10,2))) AS moyenne_perfannu3an,
    AVG(CAST(perfannu5an AS DECIMAL(10,2))) AS moyenne_perfannu5an,
    AVG(CAST(volatility1an AS DECIMAL(10,2))) AS moyenne_volatility1an,
    AVG(CAST(volatility3an AS DECIMAL(10,2))) AS moyenne_volatility3an,
    AVG(CAST(volatility5an AS DECIMAL(10,2))) AS moyenne_volatility5an,
    AVG(CAST(ratiosharpe3an AS DECIMAL(10,2))) AS moyenne_ratiosharpe3an,
    AVG(CAST(pertemax1an AS DECIMAL(10,2))) AS moyenne_pertemax1an,
    AVG(CAST(pertemax3an AS DECIMAL(10,2))) AS moyenne_pertemax3an,
    AVG(CAST(pertemax5an AS DECIMAL(10,2))) AS moyenne_pertemax5an,
    AVG(CAST(sortino3an AS DECIMAL(10,2))) AS moyenne_sortino3an,
    AVG(CAST(info3an AS DECIMAL(10,2))) AS moyenne_info3an,
    AVG(CAST(calamar3an AS DECIMAL(10,2))) AS moyenne_calamar3an,
    AVG(CAST(var993an AS DECIMAL(10,2))) AS moyenne_var993an,
    AVG(CAST(var953an AS DECIMAL(10,2))) AS moyenne_var953an
FROM (
    SELECT
        p1.*
    FROM
        performences p1
    INNER JOIN (
        SELECT
            fond_id,
            MAX(date) AS latest_date
        FROM
            performences
        GROUP BY
            fond_id
    ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.latest_date
) AS latest_performance
WHERE
    categorie_nationale = :categorie
    AND (
        ytd IS NOT NULL AND ytd <> '-' OR
        perfveille IS NOT NULL AND perfveille <> '-' OR
        perf1an IS NOT NULL AND perf1an <> '-' OR
        perf3ans IS NOT NULL AND perf3ans <> '-' OR
        perf5ans IS NOT NULL AND perf5ans <> '-' OR
        perf8ans IS NOT NULL AND perf8ans <> '-' OR
        perf10ans IS NOT NULL AND perf10ans <> '-' OR
        perf4s IS NOT NULL AND perf4s <> '-' OR
        perf3m IS NOT NULL AND perf3m <> '-' OR
        perf6m IS NOT NULL AND perf6m <> '-' OR
        perfannu1an IS NOT NULL AND perfannu1an <> '-' OR
        perfannu3an IS NOT NULL AND perfannu3an <> '-' OR
        perfannu5an IS NOT NULL AND perfannu5an <> '-' OR
        volatility1an IS NOT NULL AND volatility1an <> '-' OR
        volatility3an IS NOT NULL AND volatility3an <> '-' OR
        volatility5an IS NOT NULL AND volatility5an <> '-' OR
        ratiosharpe3an IS NOT NULL AND ratiosharpe3an <> '-' OR
        pertemax1an IS NOT NULL AND pertemax1an <> '-' OR
        pertemax3an IS NOT NULL AND pertemax3an <> '-' OR
        pertemax5an IS NOT NULL AND pertemax5an <> '-' OR
        sortino3an IS NOT NULL AND sortino3an <> '-' OR
        info3an IS NOT NULL AND info3an <> '-' OR
        calamar3an IS NOT NULL AND calamar3an <> '-' OR
        var993an IS NOT NULL AND var993an <> '-' OR
        var953an IS NOT NULL AND var953an <> '-'
    )
GROUP BY
    categorie_nationale;

    `, {
    replacements: { categorie: categorie },
    type: sequelize.QueryTypes.SELECT,
  });
  return performancesCategorie;
};

const getPerformancesByCategorynow = async (categorie, datedebut) => {


  // Convertir datefin au format YYYY-MM-DD
  const performancesCategorie = await sequelize.query(`
 SELECT
    categorie_nationale,
    AVG(CASE WHEN ytd IS NOT NULL AND ytd != '-' THEN CAST(ytd AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_ytd,
    AVG(CASE WHEN perfveille IS NOT NULL AND perfveille != '-' THEN CAST(perfveille AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perfveille,
    AVG(CASE WHEN perf1an IS NOT NULL AND perf1an != '-' THEN CAST(perf1an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perf1an,
    AVG(CASE WHEN perf3ans IS NOT NULL AND perf3ans != '-' THEN CAST(perf3ans AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perf3ans,
    AVG(CASE WHEN perf5ans IS NOT NULL AND perf5ans != '-' THEN CAST(perf5ans AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perf5ans,
    AVG(CASE WHEN perf8ans IS NOT NULL AND perf8ans != '-' THEN CAST(perf8ans AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perf8ans,
    AVG(CASE WHEN perf10ans IS NOT NULL AND perf10ans != '-' THEN CAST(perf10ans AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perf10ans,
    AVG(CASE WHEN perf4s IS NOT NULL AND perf4s != '-' THEN CAST(perf4s AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perf4s,
    AVG(CASE WHEN perf3m IS NOT NULL AND perf3m != '-' THEN CAST(perf3m AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perf3m,
    AVG(CASE WHEN perf6m IS NOT NULL AND perf6m != '-' THEN CAST(perf6m AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perf6m,
    AVG(CASE WHEN perfannu1an IS NOT NULL AND perfannu1an != '-' THEN CAST(perfannu1an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perfannu1an,
    AVG(CASE WHEN perfannu3an IS NOT NULL AND perfannu3an != '-' THEN CAST(perfannu3an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perfannu3an,
    AVG(CASE WHEN perfannu5an IS NOT NULL AND perfannu5an != '-' THEN CAST(perfannu5an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_perfannu5an,
    AVG(CASE WHEN volatility1an IS NOT NULL AND volatility1an != '-' THEN CAST(volatility1an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_volatility1an,
    AVG(CASE WHEN volatility3an IS NOT NULL AND volatility3an != '-' THEN CAST(volatility3an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_volatility3an,
    AVG(CASE WHEN volatility5an IS NOT NULL AND volatility5an != '-' THEN CAST(volatility5an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_volatility5an,
    AVG(CASE WHEN ratiosharpe3an IS NOT NULL AND ratiosharpe3an != '-' THEN CAST(ratiosharpe3an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_ratiosharpe3an,
    AVG(CASE WHEN pertemax1an IS NOT NULL AND pertemax1an != '-' THEN CAST(pertemax1an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_pertemax1an,
    AVG(CASE WHEN pertemax3an IS NOT NULL AND pertemax3an != '-' THEN CAST(pertemax3an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_pertemax3an,
    AVG(CASE WHEN pertemax5an IS NOT NULL AND pertemax5an != '-' THEN CAST(pertemax5an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_pertemax5an,
    AVG(CASE WHEN sortino3an IS NOT NULL AND sortino3an != '-' THEN CAST(sortino3an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_sortino3an,
    AVG(CASE WHEN info3an IS NOT NULL AND info3an != '-' THEN CAST(info3an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_info3an,
    AVG(CASE WHEN calamar3an IS NOT NULL AND calamar3an != '-' THEN CAST(calamar3an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_calamar3an,
    AVG(CASE WHEN var993an IS NOT NULL AND var993an != '-' THEN CAST(var993an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_var993an,
    AVG(CASE WHEN var953an IS NOT NULL AND var953an != '-' THEN CAST(var953an AS DECIMAL(10,2)) ELSE NULL END) AS moyenne_var953an
FROM 
    performences
WHERE
    categorie_nationale = :categorie
    AND date = :datedebut
GROUP BY
    categorie_nationale;

  `, {
    replacements: { categorie: categorie, datedebut: datedebut },
    type: sequelize.QueryTypes.SELECT,
  });
  return performancesCategorie;
};


router.get('/api/performancesportefeuille/fond/:id', async (req, res) => {



  portefeuille_vl_cumul.findAll({
    where: {
      portefeuille_id: req.params.id
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      let lastValuep = response[response.length - 1].base_100_bis; // Dernière valeur


      // Valeurs liquidatives
      const values = response.map((data) => data.base_100_bis);
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

      //  const values = response.map((data) => data.value);
      const lastValue = lastValuep;
      //  const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]

      const targetYear = groupDatesByYear(dates).length

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);

      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);

      //Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      console.log(findLastDateOfPreviousMonth(dates))
      //Performances annualizées fin de mois
      const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
      const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
      const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
      const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
      const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
      const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
      const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
      const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
      const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


      //Performances cumulées fin de mois
      const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      //Performances annualizées à date
      const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
      //Performances  annee calendaire
      const ArrayDates = groupDatesByYear(dates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      const multipliedValues = adaptValues1.map(item => {
        const year = item[0];
        const value1 = item[1];
        const value3 = item[2] * 100; // Multipliez la troisième position par 100

        return [year, value1, value3];
      });


      console.log(multipliedValues);
      res.json({
        code: 200,
        data: {
          portefeuille: req.params.id,
          lastdatepreviousmonth: lastdatepreviousmonth,
          //    perf3Moisactif_net: perf3Moisactif_net,
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf15Ans: perf15Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
          perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
          perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
          perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
          perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
          perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
          perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
          perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
          perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
          perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
          perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
          perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
          perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
          perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
          perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
          perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
          perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
          perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
          perfAnnualizedtodate1An: perfAnnualizedtodate1An,
          perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
          perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
          perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
          perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
          perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
          perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
          perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
          perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
          adaptValues1: multipliedValues,
          //  performancesCategorie:performancesCategorie
        }
      })

    })
})

router.get('/api/performancesportefeuilledev/fond/:id/:devise', async (req, res) => {



  portefeuille_vl_cumul.findAll({
    where: {
      portefeuille_id: req.params.id
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      let baseProperty;
      if (req.params.devise === 'EUR') {
        baseProperty = 'base_100_bis_EUR';
      } else if (req.params.devise === 'USD') {
        baseProperty = 'base_100_bis_USD';
      } else {
        // Handle other cases or set a default property
        baseProperty = 'base_100_bis';
      }
      let lastValuep = response[response.length - 1][baseProperty]; // Dernière valeur

      // const tauxsr=0.03;-0.0116;-0,0234
      const tauxsr = -0.0234;
      // Valeurs liquidatives
      const values = response.map((data) => data[baseProperty]);
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

      //  const values = response.map((data) => data.value);
      const lastValue = lastValuep;
      //  const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]

      const targetYear = groupDatesByYear(dates).length

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);

      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);

      //Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      console.log(findLastDateOfPreviousMonth(dates))
      //Performances annualizées fin de mois
      const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
      const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
      const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
      const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
      const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
      const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
      const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
      const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
      const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


      //Performances cumulées fin de mois
      const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
      const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
      const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
      const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
      const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
      const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
      const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
      const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
      const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

      //Performances annualizées à date
      const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
      //Performances  annee calendaire
      const ArrayDates = groupDatesByYear(dates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      const multipliedValues = adaptValues1.map(item => {
        const year = item[0];
        const value1 = item[1];
        const value3 = item[2] * 100; // Multipliez la troisième position par 100

        return [year, value1, value3];
      });


      console.log(multipliedValues);
      res.json({
        code: 200,
        data: {
          portefeuille: req.params.id,
          lastdatepreviousmonth: lastdatepreviousmonth,
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf15Ans: perf15Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
          perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
          perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
          perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
          perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
          perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
          perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
          perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
          perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
          perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
          perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
          perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
          perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
          perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
          perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
          perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
          perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
          perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
          perfAnnualizedtodate1An: perfAnnualizedtodate1An,
          perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
          perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
          perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
          perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
          perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
          perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
          perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
          perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
          adaptValues1: multipliedValues,
          //  performancesCategorie:performancesCategorie
        }
      })

    })
})


/**
 * @swagger
 * /api/performances/indice/{ind_id}:
 *  get:
 *     tags:
 *       - Performance Data
 *     summary: Retrieve performance data for a specific indice.
 *     description: Retrieve various performance metrics for a specific fund based on its ind_id.
 *     parameters:
 *       - name: ind_id
 *         in: path
 *         description: The ind_id of the indice.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response containing various performance metrics.
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
 *                     perfVeille:
 *                       type: number
 *                       format: double
 *                       description: Performance for the previous day.
 *                     perf4Semaines:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 4 weeks.
 *                     perf1erJanvier:
 *                       type: number
 *                       format: double
 *                       description: Performance since January 1st of the current year.
 *                     perf3Mois:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 3 months.
 *                     perf6Mois:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 6 months.
 *                     perf1An:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 1 year.
 *                     perf3Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 3 years.
 *                     perf5Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 5 years.
 *                     perf8Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 8 years.
 *                     perf10Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 10 years.
 *                     perf12Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 12 years.
 *                     perf15Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 15 years.
 *                     perf20Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 20 years.
 *                     perfOrigine:
 *                       type: number
 *                       format: double
 *                       description: Performance since the fund's inception.
 *                     perfFindeMois1An:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (1 year).
 *                     perfFindeMois3Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (3 years).
 *                     perfFindeMois5Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (5 years).
 *                     perfFindeMois8Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (8 years).
 *                     perfFindeMois10Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (10 years).
 *                     perfFindeMois12Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (12 years).
 *                     perfFindeMois15Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (15 years).
 *                     perfFindeMois20Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (20 years).
 *                     perfAnnualized1An:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 1 year.
 *                     perfAnnualized3Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 3 years.
 *                     perfAnnualized5Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 5 years.
 *                     perfAnnualized8Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 8 years.
 *                     perfAnnualized10Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 10 years.
 *                     perfAnnualized12Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 12 years.
 *                     perfAnnualized15Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 15 years.
 *                     perfAnnualized20Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 20 years.
 *                     perfAnnualizedOrigine:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance since the fund's inception.
 */
router.get('/api/performances/indice/:id/:type', (req, res) => {
  indice.findAll({
    where: {
      id_indice: req.params.id,
      type_indice_id: req.params.type
    },
    order: [
      ['date', 'ASC']
    ]
  })
    .then(response => {
      const values = response.map((data) => data.valeur);
      const lastValue = values[response.length - 1];
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1]


      // Calcul des performances glissantes
      const previousValue = values[values.length - 2];
      const perfVeille = calculatePerformance(lastValue, previousValue);
      const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
      const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
      const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
      const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
      const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
      const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
      const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
      const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
      const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
      const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
      const perf18Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 18))]);
      const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
      const perfOrigine = calculatePerformance(lastValue, values[0]);



      ///Performances fin de mois
      const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
      const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
      const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
      const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
      const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
      const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
      const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
      const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
      const targetDateOrigine = groupDatesByMonth(dates)[0]
      const perfFindeMois1An = calculatePerformance(lastValue, values[dates.indexOf(targetDate1An)])
      const perfFindeMois3Ans = calculatePerformance(lastValue, values[dates.indexOf(targetDate3Ans)])
      const perfFindeMois5Ans = calculatePerformance(lastValue, values[dates.indexOf(targetDate5Ans)])
      const perfFindeMois8Ans = calculatePerformance(lastValue, values[dates.indexOf(targetDate8Ans)])
      const perfFindeMois10Ans = calculatePerformance(lastValue, values[dates.indexOf(targetDate10Ans)])
      const perfFindeMois12Ans = calculatePerformance(lastValue, values[dates.indexOf(targetDate12Ans)])
      const perfFindeMois15Ans = calculatePerformance(lastValue, values[dates.indexOf(targetDate15Ans)])
      const perfFindeMois20Ans = calculatePerformance(lastValue, values[dates.indexOf(targetDate20Ans)])
      const perfFindeMoisOrigine = calculatePerformance(lastValue, values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])


      //Performances annualisée
      const perfAnnualized1An = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
      const perfAnnualized3Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
      const perfAnnualized5Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
      const perfAnnualized8Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
      const perfAnnualized10Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
      const perfAnnualized12Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
      const perfAnnualized15Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
      const perfAnnualized20Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
      const targetYear = groupDatesByYear(dates).length
      const perfAnnualizedOrigine = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);

      res.json({
        code: 200,
        data: {
          perfVeille: perfVeille,
          perf4Semaines: perf4Semaines,
          perf1erJanvier: perf1erJanvier,
          perf3Mois: perf3Mois,
          perf6Mois: perf6Mois,
          perf1An: perf1An,
          perf3Ans: perf3Ans,
          perf5Ans: perf5Ans,
          perf8Ans: perf8Ans,
          perf10Ans: perf10Ans,
          perf12Ans: perf12Ans,
          perf18Ans: perf18Ans,
          perf20Ans: perf20Ans,
          perfOrigine: perfOrigine,
          perfFindeMois1An: perfFindeMois1An,
          perfFindeMois3Ans: perfFindeMois3Ans,
          perfFindeMois5Ans: perfFindeMois5Ans,
          perfFindeMois8Ans: perfFindeMois8Ans,
          perfFindeMois10Ans: perfFindeMois10Ans,
          perfFindeMois12Ans: perfFindeMois12Ans,
          perfFindeMois15Ans: perfFindeMois15Ans,
          perfFindeMois20Ans: perfFindeMois20Ans,
          perfFindeMoisOrigine: perfFindeMoisOrigine,
          perfAnnualized1An: perfAnnualized1An,
          perfAnnualized3Ans: perfAnnualized3Ans,
          perfAnnualized5Ans: perfAnnualized5Ans,
          perfAnnualized8Ans: perfAnnualized8Ans,
          perfAnnualized10Ans: perfAnnualized10Ans,
          perfAnnualized12Ans: perfAnnualized12Ans,
          perfAnnualized15Ans: perfAnnualized15Ans,
          perfAnnualized20Ans: perfAnnualized20Ans,
          perfAnnualizedOrigine: perfAnnualizedOrigine,
        }
      })

    })

})






/**
 * @swagger
 * /api/performances/ecart/{fund_id}:
 *  get:
 *     tags:
 *       - Performance Data
 *     summary: Retrieve performance gap data between fund and indice.
 *     description: Retrieve various performance metrics for a specific fund based on its fund_id.
 *     parameters:
 *       - name: fund_id
 *         in: path
 *         description: The fund_id of the fund.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response containing various performance metrics.
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
 *                     perfVeille:
 *                       type: number
 *                       format: double
 *                       description: Performance for the previous day.
 *                     perf4Semaines:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 4 weeks.
 *                     perf1erJanvier:
 *                       type: number
 *                       format: double
 *                       description: Performance since January 1st of the current year.
 *                     perf3Mois:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 3 months.
 *                     perf6Mois:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 6 months.
 *                     perf1An:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 1 year.
 *                     perf3Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 3 years.
 *                     perf5Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 5 years.
 *                     perf8Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 8 years.
 *                     perf10Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 10 years.
 *                     perf12Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 12 years.
 *                     perf15Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 15 years.
 *                     perf20Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last 20 years.
 *                     perfOrigine:
 *                       type: number
 *                       format: double
 *                       description: Performance since the fund's inception.
 *                     perfFindeMois1An:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (1 year).
 *                     perfFindeMois3Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (3 years).
 *                     perfFindeMois5Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (5 years).
 *                     perfFindeMois8Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (8 years).
 *                     perfFindeMois10Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (10 years).
 *                     perfFindeMois12Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (12 years).
 *                     perfFindeMois15Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (15 years).
 *                     perfFindeMois20Ans:
 *                       type: number
 *                       format: double
 *                       description: Performance for the last month (20 years).
 *                     perfAnnualized1An:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 1 year.
 *                     perfAnnualized3Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 3 years.
 *                     perfAnnualized5Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 5 years.
 *                     perfAnnualized8Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 8 years.
 *                     perfAnnualized10Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 10 years.
 *                     perfAnnualized12Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 12 years.
 *                     perfAnnualized15Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 15 years.
 *                     perfAnnualized20Ans:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance for the last 20 years.
 *                     perfAnnualizedOrigine:
 *                       type: number
 *                       format: double
 *                       description: Annualized performance since the fund's inception.
 */
router.get('/api/performances/ecart/:id', async (req, res) => {
  let values = []
  let dates = []
  let valuesindifref = []
  let indref;

  await vl.findAll({
    where: {
      fund_id: req.params.id
    },
    order: [
      ['created', 'ASC']
    ]
  }).then((t) => {
    values = t.map((data) => data.value);
    valuesindifref = t.map((data) => data.indRef);
    dates = t.map((data) => moment(data.created).format('YYYY-MM-DD'));
    indref = t[0].indRef
  })

  /* await indice.findAll({
       where: {
           fund_id: indref
       },
       order: [
           ['created', 'ASC']
       ]
   }).then((t) => {
       valuesindifref = t.map((data) => data.value);
       dates = t.map((data) => moment(data.created).format('YYYY-MM-DD'));
   })*/

  const lastValue = values[values.length - 1];
  const previousValue = values[values.length - 2]
  const lastValueInd = values[valuesindifref.length - 1];
  const previousValueInd = values[valuesindifref.length - 2]
  const lastDate = dates[dates.length - 1]

  //Ecart performances glissantes
  const EcartperfVeille = calculatePerformance(lastValue, previousValue) - calculatePerformance(lastValueInd, previousValueInd);
  const Ecartperf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateWeek(dates))])
  const Ecartperf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
  const Ecartperf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
  const Ecartperf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
  const Ecartperf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 1))]);
  const Ecartperf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 3))]);
  const Ecartperf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 5))])
  const Ecartperf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 8))])
  const Ecartperf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 10))])
  const Ecartperf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 12))])
  const Ecartperf18Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 15))])
  const Ecartperf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 20))])
  const EcartperfOrigine = calculatePerformance(lastValue, values[0]) - calculatePerformance(lastValueInd, valuesindifref[0]);


  //Ecart performances fin de mois
  const targetDate1AnFond = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
  const targetDate3AnsFond = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
  const targetDate5AnsFond = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
  const targetDate8AnsFond = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
  const targetDate10AnsFond = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
  const targetDate12AnsFond = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
  const targetDate15AnsFond = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
  const targetDate20AnsFond = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
  const targetDateOrigineFond = groupDatesByMonth(dates)[0]

  const targetDate1AnIndice = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
  const targetDate3AnsIndice = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
  const targetDate5AnsIndice = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
  const targetDate8AnsIndice = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
  const targetDate10AnsIndice = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
  const targetDate12AnsIndice = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
  const targetDate15AnsIndice = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
  const targetDate20AnsIndice = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
  const targetDateOrigineIndice = groupDatesByMonth(dates)[0]

  const EcartperfFindeMois1AnFond = calculatePerformance(lastValue, values[dates.indexOf(targetDate1AnFond)]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDate1AnIndice)])
  const EcartperfFindeMois3AnsFond = calculatePerformance(lastValue, values[dates.indexOf(targetDate3AnsFond)]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDate3AnsIndice)])
  const EcartperfFindeMois5AnsFond = calculatePerformance(lastValue, values[dates.indexOf(targetDate5AnsFond)]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDate5AnsIndice)])
  const EcartperfFindeMois8AnsFond = calculatePerformance(lastValue, values[dates.indexOf(targetDate8AnsFond)]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDate8AnsIndice)])
  const EcartperfFindeMois10AnsFond = calculatePerformance(lastValue, values[dates.indexOf(targetDate10AnsFond)]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDate10AnsIndice)])
  const EcartperfFindeMois12AnsFond = calculatePerformance(lastValue, values[dates.indexOf(targetDate12AnsFond)]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDate12AnsIndice)])
  const EcartperfFindeMois15AnsFond = calculatePerformance(lastValue, values[dates.indexOf(targetDate15AnsFond)]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDate15AnsIndice)])
  const EcartperfFindeMois20AnsFond = calculatePerformance(lastValue, values[dates.indexOf(targetDate20AnsFond)]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDate20AnsIndice)])
  const EcartperfFindeMoisOrigineFond = calculatePerformance(lastValue, values[dates.indexOf(targetDateOrigineFond[targetDateOrigineFond.length - 1])]) - calculatePerformance(lastValueInd, valuesindifref[dates.indexOf(targetDateOrigineIndice[targetDateOrigineIndice.length - 1])])


  //Ecart performances annualisées
  const EcartperfAnnualized1An = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 1))], 1)
  const EcartperfAnnualized3Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 3))], 3)
  const EcartperfAnnualized5Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 5))], 5)
  const EcartperfAnnualized8Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 8))], 8)
  const EcartperfAnnualized10Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 10))], 10)
  const EcartperfAnnualized12Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 12))], 12)
  const EcartperfAnnualized15Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 15))], 15)
  const EcartperfAnnualized20Ans = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, 20))], 20)
  const targetYear = groupDatesByYear(dates).length
  const targetYearInd = groupDatesByYear(dates).length
  const EcartperfAnnualizedOrigine = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear) - calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDate(dates, targetYearInd))], targetYearInd);

  res.json({
    code: 200,
    data: {
      // ecart perf glissantes
      EcartperfVeille: EcartperfVeille,
      Ecartperf4Semaines: Ecartperf4Semaines,
      Ecartperf1erJanvier: Ecartperf1erJanvier,
      Ecartperf3Mois: Ecartperf3Mois,
      Ecartperf6Mois: Ecartperf6Mois,
      Ecartperf1An: Ecartperf1An,
      Ecartperf3Ans: Ecartperf3Ans,
      Ecartperf5Ans: Ecartperf5Ans,
      Ecartperf8Ans: Ecartperf8Ans,
      Ecartperf10Ans: Ecartperf10Ans,
      Ecartperf12Ans: Ecartperf12Ans,
      Ecartperf18Ans: Ecartperf18Ans,
      Ecartperf20Ans: Ecartperf20Ans,
      EcartperfOrigine: EcartperfOrigine,

      // ecart perf fin de mois
      EcartperfFindeMois1AnFond: EcartperfFindeMois1AnFond,
      EcartperfFindeMois3AnsFond: EcartperfFindeMois3AnsFond,
      EcartperfFindeMois5AnsFond: EcartperfFindeMois5AnsFond,
      EcartperfFindeMois8AnsFond: EcartperfFindeMois8AnsFond,
      EcartperfFindeMois10AnsFond: EcartperfFindeMois10AnsFond,
      EcartperfFindeMois12AnsFond: EcartperfFindeMois12AnsFond,
      EcartperfFindeMois15AnsFond: EcartperfFindeMois15AnsFond,
      EcartperfFindeMois20AnsFond: EcartperfFindeMois20AnsFond,
      EcartperfFindeMoisOrigineFond: EcartperfFindeMoisOrigineFond,

      //ecart perf annualisée
      EcartperfAnnualized1An: EcartperfAnnualized1An,
      EcartperfAnnualized3Ans: EcartperfAnnualized3Ans,
      EcartperfAnnualized5Ans: EcartperfAnnualized5Ans,
      EcartperfAnnualized8Ans: EcartperfAnnualized8Ans,
      EcartperfAnnualized10Ans: EcartperfAnnualized10Ans,
      EcartperfAnnualized12Ans: EcartperfAnnualized12Ans,
      EcartperfAnnualized15Ans: EcartperfAnnualized15Ans,
      EcartperfAnnualized20Ans: EcartperfAnnualized20Ans,
      EcartperfAnnualizedOrigine: EcartperfAnnualizedOrigine
    }
  })

})



module.exports = router;