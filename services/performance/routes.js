const express = require('express');
const router = express.Router();
const moment = require('moment');
const math = require('mathjs');
const _ = require('lodash');
const PortfolioAnalytics = require('portfolio-analytics');
const ss = require('simple-statistics');
const quants = require('quants');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

// Database models
const {
  vl, indice, taux, fond, pays_regulateurs, sequelize, urll, urllsite,
  portefeuille, portefeuille_vl, portefeuilles_proposes_vls, portefeuilles_proposes,
  users, societe, classementfonds, performences, transaction, investissement, tsr,
  cashdb, frais, fiscalite, portefeuille_vl_cumul, devises, portefeuille_base100,
  favorisfonds, devisedechanges, personnel, documentss, performences_eurs,
  performences_usds, classementfonds_eurs, classementfonds_usds, actu, tsrhisto,
  rendement, simulation, simulationportefeuille, date_valorisation, apikeys
} = require('../shared/db');

// Date utility functions
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
} = require('../../src/functions/dates');

// Performance calculation functions
const { calculatePerformance, calculateAnnualizedPerformance, calculateAnnualizedPerformanceper100 } = require('../../src/functions/performances');

// Ratio/statistics functions
const {
  calculateVolatility,
  calculateDSR,
  calculateSharpeRatio,
  calculateVAR95,
  calculateTrackingError,
  calculateVAR99,
  calculateInformationRatio,
  calculateSortinoRatio,
  calculateDownCaptureRatio,
  calculateUpCaptureRatio,
  calculateMaxDrawdown,
  calculateDownsideBeta,
  calculateHaussierBeta,
  calculateOmegaRatio,
  calculateCalmarRatio,
  calculerCAGR,
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
} = require('../../src/functions/newratios');

// Rendement/utility functions
const {
  CalculateRendHebdo, CalculateRendMensuel, CalculateRendJournalier, calculerRendements,
  grouperParAnnee,
  grouperParMois,
  grouperParSemaine,
  grouperTauxParSemaine,
  grouperParJour
} = require('../../src/functions/utils');

// Volatility helper functions (defined locally as they are not exported from newratios)
function calculerVolatilite(rendements) {
  const n = rendements.length;
  const mean = rendements.reduce((sum, r) => sum + r, 0) / n;
  const variance = rendements.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance) * Math.sqrt(52); // Annualized from weekly
}

function calculerVolatilitejour(rendements) {
  const n = rendements.length;
  const mean = rendements.reduce((sum, r) => sum + r, 0) / n;
  const variance = rendements.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized from daily
}

function calculerVolatilitemois(rendements) {
  const n = rendements.length;
  const mean = rendements.reduce((sum, r) => sum + r, 0) / n;
  const variance = rendements.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance) * Math.sqrt(12); // Annualized from monthly
}

const {
  calculerDelaiRecouvrement,
  calculerUpCaptureRatio,
  calculerDownCaptureRatio,
  calculateBeta,
  calculateBetaHaussier,
  calculateBetaBaissier
} = require('../../src/functions/delai_Beta_capture');

const { Op } = require('sequelize');

// =====================================================
// Mount existing route files for performance-related APIs
// =====================================================

// apigestionperformance.js handles:
//   /api/performances/fond/:id, /api/performancescomparaison/fond/:id,
//   /api/performanceswithdate/fond/:id/:date, /api/performancesindice/fond/:id,
//   /api/performancescategorie/fond/:id, /api/performancesdevcategorie/fond/:id/:devise,
//   /api/performancemonthyear/fond/:id, /api/performanceindicemonthyear/fond/:id, etc.
const performanceRoutes = require('../../src/routes/apigestionperformance');
router.use(performanceRoutes);

// apigestionquartile.js handles:
//   /api/classementquartilemysql/:id, /api/classementquartile/:id,
//   /api/classementquartiledev/:id/:dev
const quartileRoutes = require('../../src/routes/apigestionquartile');
router.use(quartileRoutes);

// apigestionrendement.js handles:
//   /api/rendement/fonds, /api/saverendementsjour, /api/saverendements
const rendementRoutes = require('../../src/routes/apigestionrendement');
router.use(rendementRoutes);

// apigestionratios.js handles:
//   /api/ratiosnew/:year/:id, /api/ratiosnewithdate/:year/:id/:date,
//   /api/ratiosnewithdate1/:year/:id/:date, /api/ratiosnewdev/:year/:id/:devise,
//   /api/ratiosnewdevwithdate/:year/:id/:devise/:date
const ratiosRoutes = require('../../src/routes/apigestionratios');
router.use(ratiosRoutes);

// =====================================================
// Helper functions (extracted from routes_vl.js)
// =====================================================

async function getTransactionData(portefeuilleId) {
  try {
    const transactions = await transaction.findAll({
      where: {
        portefeuille_id: portefeuilleId
      },
      order: [
        ['date', 'ASC']
      ],
      limit: 500,
    });
    return transactions;
  } catch (error) {
    throw new Error("Erreur lors de la récupération des transactions : " + error.message);
  }
}

function calculateYearsBetweenDates(dates) {
  const minDate = new Date(Math.min(...dates.map(date => new Date(date))));
  const maxDate = new Date(Math.max(...dates.map(date => new Date(date))));
  const diffInMs = maxDate - minDate;
  const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
  return diffInYears;
}

// =====================================================
// Routes extracted from routes_vl.js
// =====================================================

// --- /api/calculatePerformance (POST) ---

router.post('/api/calculatePerformance', async (req, res) => {
    const { selectedIndex, selectedCategory } = req.body;

    // Implémentez ici votre logique pour calculer les performances
    const performances = await calculatePerformance(selectedIndex, selectedCategory);

    res.json({
      code: 200,
      data: performances
    });
});

// --- /api/performancesportefeuillewithindice (GET) ---

router.get('/api/performancesportefeuillewithindice/fond/:id/:categorie/:date', async (req, res) => {

    performancesCategorie = await getPerformancesByCategorynow(req.params.categorie, "2024-03-22");


    portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: req.params.id
      },
      order: [
        ['date', 'ASC']
      ],
      limit: 500,
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
            performancesCategorie: performancesCategorie
          }
        })

      })
  })

// --- /api/ratiosportfeuillewithindice (GET) ---

router.get('/api/ratiosportfeuillewithindice/:year/:id/:tsr/:indice', async (req, res) => {
    try {


      const response = await portefeuille_vl_cumul.findAll({
        where: {
          portefeuille_id: req.params.id
        },
        order: [
          ['date', 'DESC']
        ],
        limit: 500,
      })
      const response1 = await indice.findAll({
        where: {
          id_indice: req.params.indice
        },
        order: [
          ['date', 'DESC']
        ],
        limit: 500,
      })

      ////////////////////////////

      // Convertir les dates en format YYYY-MM-DD
      const dates = response.map(data => moment(data.date).format('YYYY-MM-DD'));
      const values = response.map(data => parseFloat(data.base_100_bis));

      const datesInd = response1.map(data => moment(data.date).format('YYYY-MM-DD'));
      const valuesInd = response1.map(data => data.valeur);

      // Trouver les dates communes entre les deux ensembles de données
      const commonDates = dates.filter(date => datesInd.includes(date));

      // Récupérer les valeurs pour les dates communes
      const commonValues = commonDates.map(date => ({
        date,
        value: values[dates.indexOf(date)],
        indValueRef: valuesInd[datesInd.indexOf(date)]
      }));

      const datescomun = commonValues.map(commun => commun.date);
      const valuescomun = commonValues.map(commun => commun.value);
      const valuesindcomun = commonValues.map(commun => commun.indValueRef);

      // Exécuter les calculs en fonction de l'année
      const tauxsr = parseFloat(req.params.tsr);


      const lastPreviousDate = findLastDateOfPreviousMonth(datescomun);
      const lastValue = commonValues.find(cv => cv.date === lastPreviousDate)?.value;
      const lastValueInd = commonValues.find(cv => cv.date === lastPreviousDate)?.indValueRef;

      // Période de calcul (ajustée pour les dates communes)
      // Trouver l'index de lastPreviousDate dans commonDates
      const startIndex = commonDates.indexOf(lastPreviousDate);
      // Extraire les données depuis lastPreviousDate jusqu'à la fin des données
      const yArrayValuesnew = commonValues.slice(startIndex).map(cv => cv.value);
      const yArrayDatesnew = commonValues.slice(startIndex).map(cv => cv.date);
      const yArrayValuesindifrefnew = commonValues.slice(startIndex).map(cv => cv.indValueRef);

      const donneesarray = yArrayValuesnew.map((value, i) => ({ date: yArrayDatesnew[i], value }));
      const donneesarrayindref = yArrayValuesindifrefnew.map((value, i) => ({ date: yArrayDatesnew[i], value }));


      const numberOfUniqueYears = calculateYearsBetweenDates(datescomun);

      if (req.params.year === "1" && numberOfUniqueYears >= 1) {
        handleCalculations(req, res, donneesarray, donneesarrayindref, datescomun, values, valuesindcomun, lastPreviousDate, 1, 1, tauxsr);
      } else if (req.params.year === "3" && numberOfUniqueYears >= 3) {
        handleCalculations(req, res, donneesarray, donneesarrayindref, datescomun, values, valuesindcomun, lastPreviousDate, 3, 1, tauxsr);
      } else if (req.params.year === "5" && numberOfUniqueYears >= 5) {
        handleCalculations(req, res, donneesarray, donneesarrayindref, datescomun, values, valuesindcomun, lastPreviousDate, 5, 1, tauxsr);
      } else {
        res.status(200).json({ code: 200, message: "Invalid year parameter" });
      }
    } catch (error) {
      console.error('Erreur lors du traitement des ratios:', error);
      res.status(500).json({ code: 500, message: 'Erreur interne du serveur' });
    }
  });

  function calculateYearsBetweenDates(dates) {
    // Convertir les dates en objets Date
    const minDate = new Date(Math.min(...dates.map(date => new Date(date))));
    const maxDate = new Date(Math.max(...dates.map(date => new Date(date))));

    // Calculer la différence en millisecondes
    const diffInMs = maxDate - minDate;

    // Convertir la différence en années
    const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);

    return diffInYears;
  }

// --- /api/ratiosportefeuille (GET) ---

router.get('/api/ratiosportefeuille/:year/:id', async (req, res) => {
    // Récupérer les taux_sans_risques en fonction des valeurs de la table fond
    const tauxSansRisques = await tsr.findAll({
      attributes: ['valeur', 'valeur2', 'semaine', 'rate', 'date', 'pays'],
      where: {
        // Ajoutez les conditions spécifiques en fonction de votre logique
        pays: "Nigeria",
      },
      limit: 500,
    });

    const transactionDatas = await getTransactionData(req.params.id);



    await portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: req.params.id
      },
      order: [
        ['date', 'DESC'] // Modification ici pour trier par date en ordre décroissant
      ],
      limit: 500,
    })
      .then(async (response) => {

        // const tauxsr=0.03;-0.0116;-0,0234
        //const tauxsr = -0.0234;
        const tauxsr = 0.03
        // const tauxacc = -0.00473;
        const tauxacc = 0.02;

        // Valeurs liquidatives
        const values = response.map((data) => data.base_100_bis);
        const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        //  const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        const valuesindifref = response.map((data) => data.base_100_bis);


        const lastValue = values[dates.indexOf(findLastDateOfPreviousMonth(dates))];
        const lastValueInd = valuesindifref[dates.indexOf(findLastDateOfPreviousMonth(dates))];


        // Dernière date du mois précédent
        const lastPreviousDate = findLastDateOfPreviousMonth(dates)

        const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayValuesindifrefnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

        const donneesarray = [];
        const donneesarrayindref = [];

        for (let i = 0; i < yArrayValuesnew.length; i++) {
          const date = yArrayDatesnew[i];
          const value = yArrayValuesnew[i];

          donneesarray.push({ date, value });
        }

        for (let i = 0; i < yArrayValuesindifrefnew.length; i++) {
          const date = yArrayDatesnew[i];
          const value = yArrayValuesindifrefnew[i];

          donneesarrayindref.push({ date, value });
        }




        //si le nombre de rendements de l'indice
        if (req.params.year === "1") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '1_an': findNearestDatetoyear(dates, 1, endDate),

          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSSjour);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;
          }

          if (rendementsTableau['1_an'].length > 0) {

            const yDate = findNearestDateAnnualized(dates, 1, lastPreviousDate)

            const portfolioReturns = rendementsTableau['1_an']

            const benchmarkReturns = rendementsTableauindice['1_an'];
            const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], lastValue, 1)

            //  const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
            //  const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])
            const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
            const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);

            const info = calculateInformationRatio([...rendementsTableau['1_an']], [...rendementsTableauindice['1_an']])
            const infojour = calculateInformationRatiojour([...rendementsTableaujour['1_an']], [...rendementsTableauindicejour['1_an']])
            const infomois = calculateInformationRatio([...rendementsTableaumois['1_an']], [...rendementsTableauindicemois['1_an']])

            // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
            const beta = calculateBetanew(rendementsTableau['1_an'], rendementsTableauindice['1_an'])
            const betajour = calculateBetanew(rendementsTableaujour['1_an'], rendementsTableauindicejour['1_an'])
            const betamois = calculateBetanew(rendementsTableaumois['1_an'], rendementsTableauindicemois['1_an'])

            const VAR95 = calculateVAR95([...rendementsTableau["1_an"]], 0.95);
            const VAR95jour = calculateVAR95([...rendementsTableaujour["1_an"]], 0.95);
            const VAR95mois = calculateVAR95([...rendementsTableaumois["1_an"]], 0.95);

            const VAR99 = calculateVAR99([...rendementsTableau["1_an"]], 0.99)
            const VAR99jour = calculateVAR99([...rendementsTableaujour["1_an"]], 0.99)
            const VAR99mois = calculateVAR99([...rendementsTableaumois["1_an"]], 0.99)

            const skewness = calculerSkewness([...rendementsTableau["1_an"]], volatilites["1_an"])
            const skewnessjour = calculerSkewness([...rendementsTableaujour["1_an"]], volatilitesjour["1_an"])
            const skewnessmois = calculerSkewness([...rendementsTableaumois["1_an"]], volatilitesmois["1_an"])


            const kurtosis = calculateKurtosis([...rendementsTableau["1_an"]])
            const kurtosisjour = calculateKurtosis([...rendementsTableaujour["1_an"]])
            const kurtosismois = calculateKurtosis([...rendementsTableaumois["1_an"]])

            const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
            const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
            const dsr = calculerDSRAnnualise([...rendementsTableau["1_an"]], 0.01)
            const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["1_an"]], 0.01)
            const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["1_an"]], 0.01)

            const omega = calculateOmegaRatio([...rendementsTableau["1_an"]], 0);
            const omegajour = calculateOmegaRatio([...rendementsTableaujour["1_an"]], 0);
            const omegamois = calculateOmegaRatio([...rendementsTableaumois["1_an"]], 0);

            const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

            const sortino = calculateSortinoRatio([...rendementsTableau["1_an"]], tauxacc, 0.01);
            const sortinojour = calculateSortinoRatio([...rendementsTableaujour["1_an"]], tauxacc, 0.01);
            const sortinomois = calculateSortinoRatio([...rendementsTableaumois["1_an"]], tauxacc, 0.01);

            const betaBaiss = calculateDownsideBeta([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const betaHaussier = calculateHaussierBeta([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const trackingError = calculateTrackingError([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const trackingErrormois = calculateTrackingError([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            // const dsr = calculerDSRAnnualise([...rendementsTableau["1_an"]], 0) 

            const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


            // const ratioSharpe = calculateSharpeRatio(rendementsTableau["1_an"], 0.000751923)
            const ratioSharpe = (CAGR - tauxsr) / volatilites["1_an"];
            const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["1_an"];
            const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["1_an"];

            const correlation = quants.corrcoef([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]], 0)
            const correlationjour = quants.corrcoef([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]], 0)
            const correlationmois = quants.corrcoef([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]], 0)

            // const r2 = quants.linreg([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]]).rsq
            const r2 = calculerR2([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const r2jour = calculerR2([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const r2mois = calculerR2([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])



            res.json({
              code: 200,
              data: {

                volatility: volatilites["1_an"] * 100,
                volatilityjour: volatilitesjour["1_an"] * 100,
                volatilitymois: volatilitesmois["1_an"] * 100,
                volatilityInd: volatilitesind["1_an"] * 100,
                volatilityIndjour: volatilitesindjour["1_an"] * 100,
                volatilityIndmois: volatilitesindmois["1_an"] * 100,
                beta,
                betajour,
                betamois,
                perfAnnualisee: perfAnnualisee * 100,
                CAGR,
                perfAnnualiseeInd: perfAnnualiseeInd * 100,
                info,
                infojour: infojour,
                infomois: infomois,
                r2,
                r2jour,
                r2mois,
                // skewness,
                correlation,
                correlationjour,
                correlationmois,
                omega,
                omegajour,
                omegamois,
                sortino,
                sortinojour,
                sortinomois,
                calmar,

                // volatilityInd,
                maxDrawdown: -maxDrawdown * 100,
                maxDrawdownInd: -maxDrawdownInd * 100,
                dsr,
                dsrjour,
                dsrmois,
                ratioSharpe,
                ratioSharpejour,
                ratioSharpemois,
                // kurtosis,
                // betaHaussier,
                // betaBaiss,
                VAR95: VAR95 * 100,
                VAR95jour: VAR95jour * 100,
                VAR95jour: VAR95mois * 100,
                trackingError: trackingError * 100,
                trackingErrorjour: trackingErrorjour * 100,
                trackingErrorjour: trackingErrormois * 100,

                VAR99: VAR99 * 100,
                VAR99jour: VAR99jour * 100,
                VAR99mois: VAR99mois * 100,

                delaiRecouvrement,
                betaHaussier,
                betaHaussierjour,
                betaHaussiermois,

                betaBaiss,
                betaBaissjour,
                betaBaissmois,

                UpCaptureRatio,
                UpCaptureRatiojour,
                UpCaptureRatiomois,

                DownCaptureRatio,
                DownCaptureRatiojour,
                DownCaptureRatiomois,

                skewness,
                skewnessjour,
                skewnessmois,

                kurtosis,
                kurtosisjour,
                kurtosismois,


                // dd: (perfAnnualisee - perfAnnualiseeInd)
                // delaiRecouvrementInd
              }
            })
          } else {
            res.json({
              code: 200,
              data: {
                volatility: '-',
                volatilityInd: '-',
                beta: '-',
                perfAnnualisee: '-',
                perfAnnualiseeInd: '-',
                info: '-',
                r2: '-',
                // skewness,
                correlation: '-',
                omega: '-',
                sortino: '-',
                calmar: '-',
                // volatilityInd,
                maxDrawdown: '-',
                maxDrawdownInd: '-',
                dsr: '-',
                ratioSharpe: '-',
                // kurtosis,
                betaHaussier: '-',
                betaBaiss: '-',
                VAR95: '-',
                trackingError: '-',
                VAR99: '-',
                /* delaiRecouvrement,
                 betaHaussier,*/
                // betaBaiss:'-',
                /*  upCaptureRatio,
                  downCaptureRatio,*/
                // dd: (perfAnnualisee - perfAnnualiseeInd)
                // delaiRecouvrementInd
              }
            })
          }
        } else if (req.params.year === "3") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '3_ans': findNearestDatetoyear(dates, 3, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};


          let Vls = [];
          let Vlsindice = [];

          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          //   if(rendementsTableau['3_an'].length>0){
          const yDate = findNearestDateAnnualized(dates, 3, lastPreviousDate)
          const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], lastValue, 3)
          const portfolioReturns = rendementsTableau['3_ans']

          const benchmarkReturns = rendementsTableauindice['3_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
          //  const varindice = calculateVariance([...rendementsTableauindice['3_ans']]);
          //  const cov = calculateCovariance(rendementsTableau['3_ans'], [...rendementsTableauindice['3_ans']])
          /*
                  const info= calculateInformationRatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])
                  const infojour= calculateInformationRatiojour([...rendementsTableaujour['3_ans']], [...rendementsTableauindicejour['3_ans']])
          
                  // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
                  const beta=calculateBeta(rendementsTableau['3_ans'], rendementsTableauindice['3_ans'])
                  const VAR95 = calculateVAR95([...rendementsTableau["3_ans"]], 0.95);
                  const VAR99 = calculateVAR99([...rendementsTableau["3_ans"]], 0.99);
                
                console.log(valuesindifref.slice((dates.indexOf(lastPreviousDate)),dates.indexOf(yDate)  + 1))
                  const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
                  const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
                  const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0)
                  const omega = calculateOmegaRatio([...rendementsTableau["3_ans"]], 0);
                  const calmar = calculateCalmarRatio(maxDrawdown,CAGR)
                  const sortino = calculateSortinoRatio([...rendementsTableau["3_ans"]],-0.00473,  0.01);
                  const betaBaiss = calculateDownsideBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
                  const betaHaussier = calculateHaussierBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
                  const trackingError = calculateTrackingError([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const delaiRecouvrement=calculerDelaiRecouvrementFonds(Vls.reverse());
          
                  
          
          
                  //const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], -0.00473)
                //  const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], 0.000751923)
                  const ratioSharpe = (CAGR- tauxsr)/volatilites["3_ans"];
          
                  const correlation = quants.corrcoef([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]], 0)
                  
                 // const r2 = quants.linreg([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]).rsq
                  const r2 = calculerR2([...rendementsTableau["3_ans"]],[...rendementsTableauindice["3_ans"]])
          */
          const info = calculateInformationRatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])
          const infojour = calculateInformationRatiojour([...rendementsTableaujour['3_ans']], [...rendementsTableauindicejour['3_ans']])
          const infomois = calculateInformationRatiojour([...rendementsTableaumois['3_ans']], [...rendementsTableauindicemois['3_ans']])

          // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
          const beta = calculateBetanew(rendementsTableau['3_ans'], rendementsTableauindice['3_ans'])
          const betajour = calculateBetanew(rendementsTableaujour['3_ans'], rendementsTableauindicejour['3_ans'])
          const betamois = calculateBetanew(rendementsTableaumois['3_ans'], rendementsTableauindicemois['3_ans'])

          const VAR95 = calculateVAR95([...rendementsTableau["3_ans"]], 0.95);
          const VAR95jour = calculateVAR95([...rendementsTableaujour["3_ans"]], 0.95);
          const VAR95mois = calculateVAR95([...rendementsTableaumois["3_ans"]], 0.95);

          const VAR99 = calculateVAR99([...rendementsTableau["3_ans"]], 0.99)
          const VAR99jour = calculateVAR99([...rendementsTableaujour["3_ans"]], 0.99)
          const VAR99mois = calculateVAR99([...rendementsTableaumois["3_ans"]], 0.99)

          const skewness = calculerSkewness([...rendementsTableau["3_ans"]], volatilites["3_ans"])
          const skewnessjour = calculerSkewness([...rendementsTableaujour["3_ans"]], volatilitesjour["3_ans"])
          const skewnessmois = calculerSkewness([...rendementsTableaumois["3_ans"]], volatilitesmois["3_ans"])

          const kurtosis = calculateKurtosis([...rendementsTableau["3_ans"]])
          const kurtosisjour = calculateKurtosis([...rendementsTableaujour["3_ans"]])
          const kurtosismois = calculateKurtosis([...rendementsTableaumois["3_ans"]])

          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0.01)
          const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["3_ans"]], 0.01)
          const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["3_ans"]], 0.01)

          const omega = calculateOmegaRatio([...rendementsTableau["3_ans"]], 0);
          const omegajour = calculateOmegaRatio([...rendementsTableaujour["3_ans"]], 0);
          const omegamois = calculateOmegaRatio([...rendementsTableaumois["3_ans"]], 0);

          const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

          const sortino = calculateSortinoRatio([...rendementsTableau["3_ans"]], tauxacc, 0.01);
          const sortinojour = calculateSortinoRatio([...rendementsTableaujour["3_ans"]], tauxacc, 0.01);
          const sortinomois = calculateSortinoRatio([...rendementsTableaumois["3_ans"]], tauxacc, 0.01);

          const betaBaiss = calculateDownsideBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const betaHaussier = calculateHaussierBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const trackingError = calculateTrackingError([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const trackingErrormois = calculateTrackingError([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          // const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0) 

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


          // const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], 0.000751923)
          const ratioSharpe = (CAGR - tauxsr) / volatilites["3_ans"];
          const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["3_ans"];
          const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["3_ans"];

          const correlation = quants.corrcoef([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]], 0)
          const correlationjour = quants.corrcoef([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]], 0)
          const correlationmois = quants.corrcoef([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const r2jour = calculerR2([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const r2mois = calculerR2([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])



          res.json({
            code: 200,
            data: {

              volatility: volatilites["3_ans"] * 100,
              volatilityjour: volatilitesjour["3_ans"] * 100,
              volatilitymois: volatilitesmois["3_ans"] * 100,
              volatilityInd: volatilitesind["3_ans"] * 100,
              volatilityIndjour: volatilitesindjour["3_ans"] * 100,
              volatilityIndmois: volatilitesindmois["3_ans"] * 100,
              beta,
              betajour,
              betamois,
              perfAnnualisee: perfAnnualisee * 100,
              CAGR,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              infojour: infojour,
              infomois: infomois,
              r2,
              r2jour,
              r2mois,
              // skewness,
              correlation,
              correlationjour,
              correlationmois,
              omega,
              omegajour,
              omegamois,
              sortino,
              sortinojour,
              sortinomois,
              calmar,

              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              dsrjour,
              dsrmois,
              ratioSharpe,
              ratioSharpejour,
              ratioSharpemois,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              VAR95jour: VAR95jour * 100,
              VAR95jour: VAR95mois * 100,
              trackingError: trackingError * 100,
              trackingErrorjour: trackingErrorjour * 100,
              trackingErrorjour: trackingErrormois * 100,

              VAR99: VAR99 * 100,
              VAR99jour: VAR99jour * 100,
              VAR99mois: VAR99mois * 100,

              delaiRecouvrement,
              betaHaussier,
              betaHaussierjour,
              betaHaussiermois,

              betaBaiss,
              betaBaissjour,
              betaBaissmois,

              UpCaptureRatio,
              UpCaptureRatiojour,
              UpCaptureRatiomois,

              DownCaptureRatio,
              DownCaptureRatiojour,
              DownCaptureRatiomois,

              skewness,
              skewnessjour,
              skewnessmois,

              kurtosis,
              kurtosisjour,
              kurtosismois,

              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
          /*   }else{
               res.json({
                 code: 200,
                 data: {
                   volatility: '-',
                   volatilityInd: '-',
                   beta:'-',
                   perfAnnualisee: '-',
                   perfAnnualiseeInd: '-',
                   info:'-',
                   r2:'-',
                   // skewness,
                   correlation:'-',
                   omega:'-',
                   sortino:'-',
                   calmar:'-',
                   // volatilityInd,
                   maxDrawdown: '-',
                   maxDrawdownInd: '-',
                   dsr:'-',
                   ratioSharpe:'-',
                   // kurtosis,
                   // betaHaussier,
                   // betaBaiss,
                   VAR95: '-',
                   trackingError: '-',
                   VAR99: '-',
                 
                  
                   betaBaiss:'-',
                  
                   // dd: (perfAnnualisee - perfAnnualiseeInd)
                   // delaiRecouvrementInd
                 }
               })
             }*/
        } else if (req.params.year === "5") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          console.log(donneesarray);
          console.log(donneesGroupéesSS)

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '5_ans': findNearestDatetoyear(dates, 5, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            //  console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            console.log(donneesPeriodesemaine);

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          //     if(rendementsTableau['5_an'].length>0){
          const yDate = findNearestDateAnnualized(dates, 5, lastPreviousDate)

          const portfolioReturns = rendementsTableau['5_ans']
          const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], lastValue, 5)
          const benchmarkReturns = rendementsTableauindice['5_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
          //    const varindice = calculateVariance([...rendementsTableauindice['5_ans']]);
          //    const cov = calculateCovariance(rendementsTableau['5_ans'], [...rendementsTableauindice['5_ans']])
          const info = calculateInformationRatio([...rendementsTableau['5_ans']], [...rendementsTableauindice['5_ans']])
          const infojour = calculateInformationRatiojour([...rendementsTableaujour['5_ans']], [...rendementsTableauindicejour['5_ans']])
          const infomois = calculateInformationRatiojour([...rendementsTableaumois['5_ans']], [...rendementsTableauindicemois['5_ans']])

          // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
          const beta = calculateBetanew(rendementsTableau['5_ans'], rendementsTableauindice['5_ans'])
          const betajour = calculateBetanew(rendementsTableaujour['5_ans'], rendementsTableauindicejour['5_ans'])
          const betamois = calculateBetanew(rendementsTableaumois['5_ans'], rendementsTableauindicemois['5_ans'])

          const VAR95 = calculateVAR95([...rendementsTableau["5_ans"]], 0.95);
          const VAR95jour = calculateVAR95([...rendementsTableaujour["5_ans"]], 0.95);
          const VAR95mois = calculateVAR95([...rendementsTableaumois["5_ans"]], 0.95);

          const VAR99 = calculateVAR99([...rendementsTableau["5_ans"]], 0.99)
          const VAR99jour = calculateVAR99([...rendementsTableaujour["5_ans"]], 0.99)
          const VAR99mois = calculateVAR99([...rendementsTableaumois["5_ans"]], 0.99)

          const skewness = calculerSkewness([...rendementsTableau["5_ans"]], volatilites["5_ans"])
          const skewnessjour = calculerSkewness([...rendementsTableaujour["5_ans"]], volatilitesjour["5_ans"])
          const skewnessmois = calculerSkewness([...rendementsTableaumois["5_ans"]], volatilitesmois["5_ans"])
          const kurtosis = calculateKurtosis([...rendementsTableau["5_ans"]])
          const kurtosisjour = calculateKurtosis([...rendementsTableaujour["5_ans"]])
          const kurtosismois = calculateKurtosis([...rendementsTableaumois["5_ans"]])

          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["5_ans"]], 0.01)
          const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["5_ans"]], 0.01)
          const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["5_ans"]], 0.01)

          const omega = calculateOmegaRatio([...rendementsTableau["5_ans"]], 0);
          const omegajour = calculateOmegaRatio([...rendementsTableaujour["5_ans"]], 0);
          const omegamois = calculateOmegaRatio([...rendementsTableaumois["5_ans"]], 0);

          const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

          const sortino = calculateSortinoRatio([...rendementsTableau["5_ans"]], -0.00473, 0.01);
          const sortinojour = calculateSortinoRatio([...rendementsTableaujour["5_ans"]], -0.00473, 0.01);
          const sortinomois = calculateSortinoRatio([...rendementsTableaumois["5_ans"]], -0.00473, 0.01);

          const betaBaiss = calculateDownsideBeta([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const betaHaussier = calculateHaussierBeta([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const trackingError = calculateTrackingError([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const trackingErrormois = calculateTrackingError([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          // const dsr = calculerDSRAnnualise([...rendementsTableau["5_ans"]], 0) 

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


          // const ratioSharpe = calculateSharpeRatio(rendementsTableau["5_ans"], 0.000751923)
          const ratioSharpe = (CAGR - tauxsr) / volatilites["5_ans"];
          const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["5_ans"];
          const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["5_ans"];

          const correlation = quants.corrcoef([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]], 0)
          const correlationjour = quants.corrcoef([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]], 0)
          const correlationmois = quants.corrcoef([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const r2jour = calculerR2([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const r2mois = calculerR2([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])



          res.json({
            code: 200,
            data: {

              volatility: volatilites["5_ans"] * 100,
              volatilityjour: volatilitesjour["5_ans"] * 100,
              volatilitymois: volatilitesmois["5_ans"] * 100,
              volatilityInd: volatilitesind["5_ans"] * 100,
              volatilityIndjour: volatilitesindjour["5_ans"] * 100,
              volatilityIndmois: volatilitesindmois["5_ans"] * 100,
              beta,
              betajour,
              betamois,
              perfAnnualisee: perfAnnualisee * 100,
              CAGR,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              infojour: infojour,
              infomois: infomois,
              r2,
              r2jour,
              r2mois,
              // skewness,
              correlation,
              correlationjour,
              correlationmois,
              omega,
              omegajour,
              omegamois,
              sortino,
              sortinojour,
              sortinomois,
              calmar,

              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              dsrjour,
              dsrmois,
              ratioSharpe,
              ratioSharpejour,
              ratioSharpemois,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              VAR95jour: VAR95jour * 100,
              VAR95jour: VAR95mois * 100,
              trackingError: trackingError * 100,
              trackingErrorjour: trackingErrorjour * 100,
              trackingErrorjour: trackingErrormois * 100,

              VAR99: VAR99 * 100,
              VAR99jour: VAR99jour * 100,
              VAR99mois: VAR99mois * 100,

              delaiRecouvrement,
              betaHaussier,
              betaHaussierjour,
              betaHaussiermois,

              betaBaiss,
              betaBaissjour,
              betaBaissmois,

              UpCaptureRatio,
              UpCaptureRatiojour,
              UpCaptureRatiomois,

              DownCaptureRatio,
              DownCaptureRatiojour,
              DownCaptureRatiomois,

              skewness,
              skewnessjour,
              skewnessmois,

              kurtosis,
              kurtosisjour,
              kurtosismois,
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
          /*  }else{
              res.json({
                code: 200,
                data: {
                  volatility: '-',
                  volatilityInd: '-',
                  beta:'-',
                  perfAnnualisee: '-',
                  perfAnnualiseeInd: '-',
                  info:'-',
                  r2:'-',
                  // skewness,
                  correlation:'-',
                  omega:'-',
                  sortino:'-',
                  calmar:'-',
                  // volatilityInd,
                  maxDrawdown: '-',
                  maxDrawdownInd: '-',
                  dsr:'-',
                  ratioSharpe:'-',
                  // kurtosis,
                  // betaHaussier,
                  // betaBaiss,
                  VAR95: '-',
                  trackingError: '-',
                  VAR99: '-',
               
                  betaBaiss:'-',
                  
                  // dd: (perfAnnualisee - perfAnnualiseeInd)
                  // delaiRecouvrementInd
                }
              })
            }*/
        } else if (req.params.year === "8") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '8_ans': findNearestDatetoyear(dates, 8, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 8, lastPreviousDate)

          const portfolioReturns = rendementsTableau['8_ans']

          const benchmarkReturns = rendementsTableauindice['8_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['8_ans']], [...rendementsTableauindice['8_ans']])
          const beta = calculateBeta(rendementsTableau['8_ans'], rendementsTableauindice['8_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["8_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["8_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["8_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["8_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["8_ans"]], 8)
          const sortino = calculateSortinoRatio([...rendementsTableau["8_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());




          const ratioSharpe = calculateSharpeRatio(rendementsTableau["8_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["8_ans"] * 100,
              volatilityInd: volatilitesind["8_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /*betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "10") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '10_ans': findNearestDatetoyear(dates, 10, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 10, lastPreviousDate)

          const portfolioReturns = rendementsTableau['10_ans']

          const benchmarkReturns = rendementsTableauindice['10_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatiojour([...rendementsTableaujour['10_ans']], [...rendementsTableauindicejour['10_ans']])
          const beta = calculateBeta(rendementsTableau['10_ans'], rendementsTableauindice['10_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["10_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["10_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["10_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["10_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["10_ans"]], 10)
          const sortino = calculateSortinoRatio([...rendementsTableau["10_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());



          const ratioSharpe = calculateSharpeRatio(rendementsTableau["10_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["10_ans"] * 100,
              volatilityInd: volatilitesind["10_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /*  betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "12") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '12_ans': findNearestDatetoyear(dates, 12, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 12, lastPreviousDate)

          const portfolioReturns = rendementsTableau['12_ans']

          const benchmarkReturns = rendementsTableauindice['12_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['12_ans']], [...rendementsTableauindice['12_ans']])
          const beta = calculateBeta(rendementsTableau['12_ans'], rendementsTableauindice['12_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["12_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["12_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["12_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["12_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["12_ans"]], 12)
          const sortino = calculateSortinoRatio([...rendementsTableau["12_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());



          const ratioSharpe = calculateSharpeRatio(rendementsTableau["12_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]], 0)

          //const r2 = quants.linreg([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["12_ans"] * 100,
              volatilityInd: volatilitesind["12_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /* betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "origine") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {

            'origine': findNearestDatetoyear(dates, 5, endDate)


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const targetYear = groupDatesByYear(dates).length
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[0], targetYear);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[0], targetYear);

          const portfolioReturns = rendementsTableau['origine']

          const benchmarkReturns = rendementsTableauindice['origine'];
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['origine']], [...rendementsTableauindice['origine']])
          const beta = calculateBeta(rendementsTableau['origine'], rendementsTableauindice['origine'])
          const VAR95 = calculateVAR95([...rendementsTableau["origine"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["origine"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["origine"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["origine"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["origine"]], 0)
          const sortino = calculateSortinoRatio([...rendementsTableau["origine"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const trackingError = calculateTrackingError([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])




          const ratioSharpe = calculateSharpeRatio(rendementsTableau["origine"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]]).rsq
          const r2 = calculerR2([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["origine"] * 100,
              volatilityInd: volatilitesind["origine"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              /* delaiRecouvrement,
               betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        }





      })
  })

// --- /api/ratiosportefeuilledev (GET) ---

router.get('/api/ratiosportefeuilledev/:year/:id/:devise', async (req, res) => {
    // Récupérer les taux_sans_risques en fonction des valeurs de la table fond
    const tauxSansRisques = await tsr.findAll({
      attributes: ['valeur', 'valeur2', 'semaine', 'rate', 'date', 'pays'],
      where: {
        // Ajoutez les conditions spécifiques en fonction de votre logique
        pays: "Nigeria",
      },
      limit: 500,
    });

    const transactionDatas = await getTransactionData(req.params.id);

    // Tableau pour stocker les résultats
    const tableauDonneestsr = [];

    // Boucle à travers les résultats et stocke les données dans le tableau
    tauxSansRisques.forEach(d => {
      tableauDonneestsr.push({
        valeur: d.valeur,
        valeur2: d.valeur2,
        semaine: d.semaine,
        rate: d.rate,
        date: d.date,
        pays: d.pays,
      });
    });

    await portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: req.params.id
      },
      order: [
        ['date', 'DESC'] // Modification ici pour trier par date en ordre décroissant
      ],
      limit: 500,
    })
      .then(async (response) => {
        let baseProperty;
        if (req.params.devise === 'EUR') {
          baseProperty = 'base_100_bis_EUR';
        } else if (req.params.devise === 'USD') {
          baseProperty = 'base_100_bis_USD';
        } else {
          // Handle other cases or set a default property
          baseProperty = 'base_100_bis';
        }
        // const tauxsr=0.03;-0.0116;-0,0234
        const tauxsr = -0.0234;
        // Valeurs liquidatives
        const values = response.map((data) => data[baseProperty]);
        const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        //  const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        const valuesindifref = response.map((data) => data[baseProperty]);


        const lastValue = values[dates.indexOf(findLastDateOfPreviousMonth(dates))];
        const lastValueInd = valuesindifref[dates.indexOf(findLastDateOfPreviousMonth(dates))];


        // Dernière date du mois précédent
        const lastPreviousDate = findLastDateOfPreviousMonth(dates)

        const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayValuesindifrefnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

        const donneesarray = [];
        const donneesarrayindref = [];

        for (let i = 0; i < yArrayValuesnew.length; i++) {
          const date = yArrayDatesnew[i];
          const value = yArrayValuesnew[i];

          donneesarray.push({ date, value });
        }

        for (let i = 0; i < yArrayValuesindifrefnew.length; i++) {
          const date = yArrayDatesnew[i];
          const value = yArrayValuesindifrefnew[i];

          donneesarrayindref.push({ date, value });
        }


        //  const tauxGroupesParSemaine = grouperTauxParSemaine(tableauDonneestsr);
        /*   tableauDonneestsr.forEach((expObject) => {
       expObject.date = grouperTauxParSemaine(expObject.semaine);
     });*/
        let tauxsrannu = trouverElementLePlusProche(tableauDonneestsr, findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)));

        //si le nombre de rendements de l'indice
        if (req.params.year === "1") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '1_an': findNearestDatetoyear(dates, 1, endDate),

          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSSjour);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;
          }

          if (rendementsTableau['1_an'].length > 0) {

            const yDate = findNearestDateAnnualized(dates, 1, lastPreviousDate)

            const portfolioReturns = rendementsTableau['1_an']

            const benchmarkReturns = rendementsTableauindice['1_an'];
            const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], lastValue, 1)

            //  const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
            //  const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])
            const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
            const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);

            const info = calculateInformationRatio([...rendementsTableau['1_an']], [...rendementsTableauindice['1_an']])
            const infojour = calculateInformationRatiojour([...rendementsTableaujour['1_an']], [...rendementsTableauindicejour['1_an']])
            const infomois = calculateInformationRatio([...rendementsTableaumois['1_an']], [...rendementsTableauindicemois['1_an']])

            // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
            const beta = calculateBetanew(rendementsTableau['1_an'], rendementsTableauindice['1_an'])
            const betajour = calculateBetanew(rendementsTableaujour['1_an'], rendementsTableauindicejour['1_an'])
            const betamois = calculateBetanew(rendementsTableaumois['1_an'], rendementsTableauindicemois['1_an'])

            const VAR95 = calculateVAR95([...rendementsTableau["1_an"]], 0.95);
            const VAR95jour = calculateVAR95([...rendementsTableaujour["1_an"]], 0.95);
            const VAR95mois = calculateVAR95([...rendementsTableaumois["1_an"]], 0.95);

            const VAR99 = calculateVAR99([...rendementsTableau["1_an"]], 0.99)
            const VAR99jour = calculateVAR99([...rendementsTableaujour["1_an"]], 0.99)
            const VAR99mois = calculateVAR99([...rendementsTableaumois["1_an"]], 0.99)

            const skewness = calculerSkewness([...rendementsTableau["1_an"]], volatilites["1_an"])
            const skewnessjour = calculerSkewness([...rendementsTableaujour["1_an"]], volatilitesjour["1_an"])
            const skewnessmois = calculerSkewness([...rendementsTableaumois["1_an"]], volatilitesmois["1_an"])


            const kurtosis = calculateKurtosis([...rendementsTableau["1_an"]])
            const kurtosisjour = calculateKurtosis([...rendementsTableaujour["1_an"]])
            const kurtosismois = calculateKurtosis([...rendementsTableaumois["1_an"]])

            const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
            const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
            const dsr = calculerDSRAnnualise([...rendementsTableau["1_an"]], 0.01)
            const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["1_an"]], 0.01)
            const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["1_an"]], 0.01)

            const omega = calculateOmegaRatio([...rendementsTableau["1_an"]], 0);
            const omegajour = calculateOmegaRatio([...rendementsTableaujour["1_an"]], 0);
            const omegamois = calculateOmegaRatio([...rendementsTableaumois["1_an"]], 0);

            const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

            const sortino = calculateSortinoRatio([...rendementsTableau["1_an"]], -0.00473, 0.01);
            const sortinojour = calculateSortinoRatio([...rendementsTableaujour["1_an"]], -0.00473, 0.01);
            const sortinomois = calculateSortinoRatio([...rendementsTableaumois["1_an"]], -0.00473, 0.01);

            const betaBaiss = calculateDownsideBeta([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const betaHaussier = calculateHaussierBeta([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const trackingError = calculateTrackingError([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const trackingErrormois = calculateTrackingError([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            // const dsr = calculerDSRAnnualise([...rendementsTableau["1_an"]], 0) 

            const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


            // const ratioSharpe = calculateSharpeRatio(rendementsTableau["1_an"], 0.000751923)
            const ratioSharpe = (CAGR - tauxsr) / volatilites["1_an"];
            const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["1_an"];
            const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["1_an"];

            const correlation = quants.corrcoef([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]], 0)
            const correlationjour = quants.corrcoef([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]], 0)
            const correlationmois = quants.corrcoef([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]], 0)

            // const r2 = quants.linreg([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]]).rsq
            const r2 = calculerR2([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const r2jour = calculerR2([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const r2mois = calculerR2([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])



            res.json({
              code: 200,
              data: {

                volatility: volatilites["1_an"] * 100,
                volatilityjour: volatilitesjour["1_an"] * 100,
                volatilitymois: volatilitesmois["1_an"] * 100,
                volatilityInd: volatilitesind["1_an"] * 100,
                volatilityIndjour: volatilitesindjour["1_an"] * 100,
                volatilityIndmois: volatilitesindmois["1_an"] * 100,
                beta,
                betajour,
                betamois,
                perfAnnualisee: perfAnnualisee * 100,
                CAGR,
                perfAnnualiseeInd: perfAnnualiseeInd * 100,
                info,
                infojour: infojour,
                infomois: infomois,
                r2,
                r2jour,
                r2mois,
                // skewness,
                correlation,
                correlationjour,
                correlationmois,
                omega,
                omegajour,
                omegamois,
                sortino,
                sortinojour,
                sortinomois,
                calmar,

                // volatilityInd,
                maxDrawdown: -maxDrawdown * 100,
                maxDrawdownInd: -maxDrawdownInd * 100,
                dsr,
                dsrjour,
                dsrmois,
                ratioSharpe,
                ratioSharpejour,
                ratioSharpemois,
                // kurtosis,
                // betaHaussier,
                // betaBaiss,
                VAR95: VAR95 * 100,
                VAR95jour: VAR95jour * 100,
                VAR95jour: VAR95mois * 100,
                trackingError: trackingError * 100,
                trackingErrorjour: trackingErrorjour * 100,
                trackingErrorjour: trackingErrormois * 100,

                VAR99: VAR99 * 100,
                VAR99jour: VAR99jour * 100,
                VAR99mois: VAR99mois * 100,

                delaiRecouvrement,
                betaHaussier,
                betaHaussierjour,
                betaHaussiermois,

                betaBaiss,
                betaBaissjour,
                betaBaissmois,

                UpCaptureRatio,
                UpCaptureRatiojour,
                UpCaptureRatiomois,

                DownCaptureRatio,
                DownCaptureRatiojour,
                DownCaptureRatiomois,

                skewness,
                skewnessjour,
                skewnessmois,

                kurtosis,
                kurtosisjour,
                kurtosismois,


                // dd: (perfAnnualisee - perfAnnualiseeInd)
                // delaiRecouvrementInd
              }
            })
          } else {
            res.json({
              code: 200,
              data: {
                volatility: '-',
                volatilityInd: '-',
                beta: '-',
                perfAnnualisee: '-',
                perfAnnualiseeInd: '-',
                info: '-',
                r2: '-',
                // skewness,
                correlation: '-',
                omega: '-',
                sortino: '-',
                calmar: '-',
                // volatilityInd,
                maxDrawdown: '-',
                maxDrawdownInd: '-',
                dsr: '-',
                ratioSharpe: '-',
                // kurtosis,
                betaHaussier: '-',
                betaBaiss: '-',
                VAR95: '-',
                trackingError: '-',
                VAR99: '-',
                /* delaiRecouvrement,
                 betaHaussier,*/
                // betaBaiss:'-',
                /*  upCaptureRatio,
                  downCaptureRatio,*/
                // dd: (perfAnnualisee - perfAnnualiseeInd)
                // delaiRecouvrementInd
              }
            })
          }
        } else if (req.params.year === "3") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '3_ans': findNearestDatetoyear(dates, 3, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};


          let Vls = [];
          let Vlsindice = [];

          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          //   if(rendementsTableau['3_an'].length>0){
          const yDate = findNearestDateAnnualized(dates, 3, lastPreviousDate)
          const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], lastValue, 3)
          const portfolioReturns = rendementsTableau['3_ans']

          const benchmarkReturns = rendementsTableauindice['3_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
          //  const varindice = calculateVariance([...rendementsTableauindice['3_ans']]);
          //  const cov = calculateCovariance(rendementsTableau['3_ans'], [...rendementsTableauindice['3_ans']])
          /*
                  const info= calculateInformationRatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])
                  const infojour= calculateInformationRatiojour([...rendementsTableaujour['3_ans']], [...rendementsTableauindicejour['3_ans']])
          
                  // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
                  const beta=calculateBeta(rendementsTableau['3_ans'], rendementsTableauindice['3_ans'])
                  const VAR95 = calculateVAR95([...rendementsTableau["3_ans"]], 0.95);
                  const VAR99 = calculateVAR99([...rendementsTableau["3_ans"]], 0.99);
                
                console.log(valuesindifref.slice((dates.indexOf(lastPreviousDate)),dates.indexOf(yDate)  + 1))
                  const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
                  const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
                  const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0)
                  const omega = calculateOmegaRatio([...rendementsTableau["3_ans"]], 0);
                  const calmar = calculateCalmarRatio(maxDrawdown,CAGR)
                  const sortino = calculateSortinoRatio([...rendementsTableau["3_ans"]],-0.00473,  0.01);
                  const betaBaiss = calculateDownsideBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
                  const betaHaussier = calculateHaussierBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
                  const trackingError = calculateTrackingError([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const delaiRecouvrement=calculerDelaiRecouvrementFonds(Vls.reverse());
          
                  
          
          
                  //const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], -0.00473)
                //  const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], 0.000751923)
                  const ratioSharpe = (CAGR- tauxsr)/volatilites["3_ans"];
          
                  const correlation = quants.corrcoef([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]], 0)
                  
                 // const r2 = quants.linreg([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]).rsq
                  const r2 = calculerR2([...rendementsTableau["3_ans"]],[...rendementsTableauindice["3_ans"]])
          */
          const info = calculateInformationRatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])
          const infojour = calculateInformationRatiojour([...rendementsTableaujour['3_ans']], [...rendementsTableauindicejour['3_ans']])
          const infomois = calculateInformationRatiojour([...rendementsTableaumois['3_ans']], [...rendementsTableauindicemois['3_ans']])

          // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
          const beta = calculateBetanew(rendementsTableau['3_ans'], rendementsTableauindice['3_ans'])
          const betajour = calculateBetanew(rendementsTableaujour['3_ans'], rendementsTableauindicejour['3_ans'])
          const betamois = calculateBetanew(rendementsTableaumois['3_ans'], rendementsTableauindicemois['3_ans'])

          const VAR95 = calculateVAR95([...rendementsTableau["3_ans"]], 0.95);
          const VAR95jour = calculateVAR95([...rendementsTableaujour["3_ans"]], 0.95);
          const VAR95mois = calculateVAR95([...rendementsTableaumois["3_ans"]], 0.95);

          const VAR99 = calculateVAR99([...rendementsTableau["3_ans"]], 0.99)
          const VAR99jour = calculateVAR99([...rendementsTableaujour["3_ans"]], 0.99)
          const VAR99mois = calculateVAR99([...rendementsTableaumois["3_ans"]], 0.99)

          const skewness = calculerSkewness([...rendementsTableau["3_ans"]], volatilites["3_ans"])
          const skewnessjour = calculerSkewness([...rendementsTableaujour["3_ans"]], volatilitesjour["3_ans"])
          const skewnessmois = calculerSkewness([...rendementsTableaumois["3_ans"]], volatilitesmois["3_ans"])

          const kurtosis = calculateKurtosis([...rendementsTableau["3_ans"]])
          const kurtosisjour = calculateKurtosis([...rendementsTableaujour["3_ans"]])
          const kurtosismois = calculateKurtosis([...rendementsTableaumois["3_ans"]])

          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0.01)
          const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["3_ans"]], 0.01)
          const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["3_ans"]], 0.01)

          const omega = calculateOmegaRatio([...rendementsTableau["3_ans"]], 0);
          const omegajour = calculateOmegaRatio([...rendementsTableaujour["3_ans"]], 0);
          const omegamois = calculateOmegaRatio([...rendementsTableaumois["3_ans"]], 0);

          const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

          const sortino = calculateSortinoRatio([...rendementsTableau["3_ans"]], -0.00473, 0.01);
          const sortinojour = calculateSortinoRatio([...rendementsTableaujour["3_ans"]], -0.00473, 0.01);
          const sortinomois = calculateSortinoRatio([...rendementsTableaumois["3_ans"]], -0.00473, 0.01);

          const betaBaiss = calculateDownsideBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const betaHaussier = calculateHaussierBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const trackingError = calculateTrackingError([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const trackingErrormois = calculateTrackingError([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          // const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0) 

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


          // const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], 0.000751923)
          const ratioSharpe = (CAGR - tauxsr) / volatilites["3_ans"];
          const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["3_ans"];
          const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["3_ans"];

          const correlation = quants.corrcoef([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]], 0)
          const correlationjour = quants.corrcoef([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]], 0)
          const correlationmois = quants.corrcoef([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const r2jour = calculerR2([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const r2mois = calculerR2([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])



          res.json({
            code: 200,
            data: {

              volatility: volatilites["3_ans"] * 100,
              volatilityjour: volatilitesjour["3_ans"] * 100,
              volatilitymois: volatilitesmois["3_ans"] * 100,
              volatilityInd: volatilitesind["3_ans"] * 100,
              volatilityIndjour: volatilitesindjour["3_ans"] * 100,
              volatilityIndmois: volatilitesindmois["3_ans"] * 100,
              beta,
              betajour,
              betamois,
              perfAnnualisee: perfAnnualisee * 100,
              CAGR,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              infojour: infojour,
              infomois: infomois,
              r2,
              r2jour,
              r2mois,
              // skewness,
              correlation,
              correlationjour,
              correlationmois,
              omega,
              omegajour,
              omegamois,
              sortino,
              sortinojour,
              sortinomois,
              calmar,

              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              dsrjour,
              dsrmois,
              ratioSharpe,
              ratioSharpejour,
              ratioSharpemois,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              VAR95jour: VAR95jour * 100,
              VAR95jour: VAR95mois * 100,
              trackingError: trackingError * 100,
              trackingErrorjour: trackingErrorjour * 100,
              trackingErrorjour: trackingErrormois * 100,

              VAR99: VAR99 * 100,
              VAR99jour: VAR99jour * 100,
              VAR99mois: VAR99mois * 100,

              delaiRecouvrement,
              betaHaussier,
              betaHaussierjour,
              betaHaussiermois,

              betaBaiss,
              betaBaissjour,
              betaBaissmois,

              UpCaptureRatio,
              UpCaptureRatiojour,
              UpCaptureRatiomois,

              DownCaptureRatio,
              DownCaptureRatiojour,
              DownCaptureRatiomois,

              skewness,
              skewnessjour,
              skewnessmois,

              kurtosis,
              kurtosisjour,
              kurtosismois,

              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
          /*   }else{
               res.json({
                 code: 200,
                 data: {
                   volatility: '-',
                   volatilityInd: '-',
                   beta:'-',
                   perfAnnualisee: '-',
                   perfAnnualiseeInd: '-',
                   info:'-',
                   r2:'-',
                   // skewness,
                   correlation:'-',
                   omega:'-',
                   sortino:'-',
                   calmar:'-',
                   // volatilityInd,
                   maxDrawdown: '-',
                   maxDrawdownInd: '-',
                   dsr:'-',
                   ratioSharpe:'-',
                   // kurtosis,
                   // betaHaussier,
                   // betaBaiss,
                   VAR95: '-',
                   trackingError: '-',
                   VAR99: '-',
                 
                  
                   betaBaiss:'-',
                  
                   // dd: (perfAnnualisee - perfAnnualiseeInd)
                   // delaiRecouvrementInd
                 }
               })
             }*/
        } else if (req.params.year === "5") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          console.log(donneesarray);
          console.log(donneesGroupéesSS)

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '5_ans': findNearestDatetoyear(dates, 5, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            //  console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            console.log(donneesPeriodesemaine);

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          //     if(rendementsTableau['5_an'].length>0){
          const yDate = findNearestDateAnnualized(dates, 5, lastPreviousDate)

          const portfolioReturns = rendementsTableau['5_ans']
          const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], lastValue, 5)
          const benchmarkReturns = rendementsTableauindice['5_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
          //    const varindice = calculateVariance([...rendementsTableauindice['5_ans']]);
          //    const cov = calculateCovariance(rendementsTableau['5_ans'], [...rendementsTableauindice['5_ans']])
          const info = calculateInformationRatio([...rendementsTableau['5_ans']], [...rendementsTableauindice['5_ans']])
          const infojour = calculateInformationRatiojour([...rendementsTableaujour['5_ans']], [...rendementsTableauindicejour['5_ans']])
          const infomois = calculateInformationRatiojour([...rendementsTableaumois['5_ans']], [...rendementsTableauindicemois['5_ans']])

          // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
          const beta = calculateBetanew(rendementsTableau['5_ans'], rendementsTableauindice['5_ans'])
          const betajour = calculateBetanew(rendementsTableaujour['5_ans'], rendementsTableauindicejour['5_ans'])
          const betamois = calculateBetanew(rendementsTableaumois['5_ans'], rendementsTableauindicemois['5_ans'])

          const VAR95 = calculateVAR95([...rendementsTableau["5_ans"]], 0.95);
          const VAR95jour = calculateVAR95([...rendementsTableaujour["5_ans"]], 0.95);
          const VAR95mois = calculateVAR95([...rendementsTableaumois["5_ans"]], 0.95);

          const VAR99 = calculateVAR99([...rendementsTableau["5_ans"]], 0.99)
          const VAR99jour = calculateVAR99([...rendementsTableaujour["5_ans"]], 0.99)
          const VAR99mois = calculateVAR99([...rendementsTableaumois["5_ans"]], 0.99)

          const skewness = calculerSkewness([...rendementsTableau["5_ans"]], volatilites["5_ans"])
          const skewnessjour = calculerSkewness([...rendementsTableaujour["5_ans"]], volatilitesjour["5_ans"])
          const skewnessmois = calculerSkewness([...rendementsTableaumois["5_ans"]], volatilitesmois["5_ans"])
          const kurtosis = calculateKurtosis([...rendementsTableau["5_ans"]])
          const kurtosisjour = calculateKurtosis([...rendementsTableaujour["5_ans"]])
          const kurtosismois = calculateKurtosis([...rendementsTableaumois["5_ans"]])

          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["5_ans"]], 0.01)
          const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["5_ans"]], 0.01)
          const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["5_ans"]], 0.01)

          const omega = calculateOmegaRatio([...rendementsTableau["5_ans"]], 0);
          const omegajour = calculateOmegaRatio([...rendementsTableaujour["5_ans"]], 0);
          const omegamois = calculateOmegaRatio([...rendementsTableaumois["5_ans"]], 0);

          const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

          const sortino = calculateSortinoRatio([...rendementsTableau["5_ans"]], -0.00473, 0.01);
          const sortinojour = calculateSortinoRatio([...rendementsTableaujour["5_ans"]], -0.00473, 0.01);
          const sortinomois = calculateSortinoRatio([...rendementsTableaumois["5_ans"]], -0.00473, 0.01);

          const betaBaiss = calculateDownsideBeta([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const betaHaussier = calculateHaussierBeta([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const trackingError = calculateTrackingError([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const trackingErrormois = calculateTrackingError([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          // const dsr = calculerDSRAnnualise([...rendementsTableau["5_ans"]], 0) 

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


          // const ratioSharpe = calculateSharpeRatio(rendementsTableau["5_ans"], 0.000751923)
          const ratioSharpe = (CAGR - tauxsr) / volatilites["5_ans"];
          const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["5_ans"];
          const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["5_ans"];

          const correlation = quants.corrcoef([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]], 0)
          const correlationjour = quants.corrcoef([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]], 0)
          const correlationmois = quants.corrcoef([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const r2jour = calculerR2([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const r2mois = calculerR2([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])



          res.json({
            code: 200,
            data: {

              volatility: volatilites["5_ans"] * 100,
              volatilityjour: volatilitesjour["5_ans"] * 100,
              volatilitymois: volatilitesmois["5_ans"] * 100,
              volatilityInd: volatilitesind["5_ans"] * 100,
              volatilityIndjour: volatilitesindjour["5_ans"] * 100,
              volatilityIndmois: volatilitesindmois["5_ans"] * 100,
              beta,
              betajour,
              betamois,
              perfAnnualisee: perfAnnualisee * 100,
              CAGR,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              infojour: infojour,
              infomois: infomois,
              r2,
              r2jour,
              r2mois,
              // skewness,
              correlation,
              correlationjour,
              correlationmois,
              omega,
              omegajour,
              omegamois,
              sortino,
              sortinojour,
              sortinomois,
              calmar,

              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              dsrjour,
              dsrmois,
              ratioSharpe,
              ratioSharpejour,
              ratioSharpemois,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              VAR95jour: VAR95jour * 100,
              VAR95jour: VAR95mois * 100,
              trackingError: trackingError * 100,
              trackingErrorjour: trackingErrorjour * 100,
              trackingErrorjour: trackingErrormois * 100,

              VAR99: VAR99 * 100,
              VAR99jour: VAR99jour * 100,
              VAR99mois: VAR99mois * 100,

              delaiRecouvrement,
              betaHaussier,
              betaHaussierjour,
              betaHaussiermois,

              betaBaiss,
              betaBaissjour,
              betaBaissmois,

              UpCaptureRatio,
              UpCaptureRatiojour,
              UpCaptureRatiomois,

              DownCaptureRatio,
              DownCaptureRatiojour,
              DownCaptureRatiomois,

              skewness,
              skewnessjour,
              skewnessmois,

              kurtosis,
              kurtosisjour,
              kurtosismois,
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
          /*  }else{
              res.json({
                code: 200,
                data: {
                  volatility: '-',
                  volatilityInd: '-',
                  beta:'-',
                  perfAnnualisee: '-',
                  perfAnnualiseeInd: '-',
                  info:'-',
                  r2:'-',
                  // skewness,
                  correlation:'-',
                  omega:'-',
                  sortino:'-',
                  calmar:'-',
                  // volatilityInd,
                  maxDrawdown: '-',
                  maxDrawdownInd: '-',
                  dsr:'-',
                  ratioSharpe:'-',
                  // kurtosis,
                  // betaHaussier,
                  // betaBaiss,
                  VAR95: '-',
                  trackingError: '-',
                  VAR99: '-',
               
                  betaBaiss:'-',
                  
                  // dd: (perfAnnualisee - perfAnnualiseeInd)
                  // delaiRecouvrementInd
                }
              })
            }*/
        } else if (req.params.year === "8") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '8_ans': findNearestDatetoyear(dates, 8, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 8, lastPreviousDate)

          const portfolioReturns = rendementsTableau['8_ans']

          const benchmarkReturns = rendementsTableauindice['8_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['8_ans']], [...rendementsTableauindice['8_ans']])
          const beta = calculateBeta(rendementsTableau['8_ans'], rendementsTableauindice['8_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["8_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["8_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["8_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["8_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["8_ans"]], 8)
          const sortino = calculateSortinoRatio([...rendementsTableau["8_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());




          const ratioSharpe = calculateSharpeRatio(rendementsTableau["8_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["8_ans"] * 100,
              volatilityInd: volatilitesind["8_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /*betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "10") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '10_ans': findNearestDatetoyear(dates, 10, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 10, lastPreviousDate)

          const portfolioReturns = rendementsTableau['10_ans']

          const benchmarkReturns = rendementsTableauindice['10_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatiojour([...rendementsTableaujour['10_ans']], [...rendementsTableauindicejour['10_ans']])
          const beta = calculateBeta(rendementsTableau['10_ans'], rendementsTableauindice['10_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["10_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["10_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["10_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["10_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["10_ans"]], 10)
          const sortino = calculateSortinoRatio([...rendementsTableau["10_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());



          const ratioSharpe = calculateSharpeRatio(rendementsTableau["10_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["10_ans"] * 100,
              volatilityInd: volatilitesind["10_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /*  betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "12") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '12_ans': findNearestDatetoyear(dates, 12, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 12, lastPreviousDate)

          const portfolioReturns = rendementsTableau['12_ans']

          const benchmarkReturns = rendementsTableauindice['12_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['12_ans']], [...rendementsTableauindice['12_ans']])
          const beta = calculateBeta(rendementsTableau['12_ans'], rendementsTableauindice['12_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["12_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["12_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["12_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["12_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["12_ans"]], 12)
          const sortino = calculateSortinoRatio([...rendementsTableau["12_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());



          const ratioSharpe = calculateSharpeRatio(rendementsTableau["12_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]], 0)

          //const r2 = quants.linreg([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["12_ans"] * 100,
              volatilityInd: volatilitesind["12_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /* betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "origine") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {

            'origine': findNearestDatetoyear(dates, 5, endDate)


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const targetYear = groupDatesByYear(dates).length
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[0], targetYear);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[0], targetYear);

          const portfolioReturns = rendementsTableau['origine']

          const benchmarkReturns = rendementsTableauindice['origine'];
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['origine']], [...rendementsTableauindice['origine']])
          const beta = calculateBeta(rendementsTableau['origine'], rendementsTableauindice['origine'])
          const VAR95 = calculateVAR95([...rendementsTableau["origine"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["origine"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["origine"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["origine"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["origine"]], 0)
          const sortino = calculateSortinoRatio([...rendementsTableau["origine"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const trackingError = calculateTrackingError([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])




          const ratioSharpe = calculateSharpeRatio(rendementsTableau["origine"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]]).rsq
          const r2 = calculerR2([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["origine"] * 100,
              volatilityInd: volatilitesind["origine"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              /* delaiRecouvrement,
               betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        }





      })
  })

module.exports = router;
