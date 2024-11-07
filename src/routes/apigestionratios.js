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




  // Fonction pour calculer la volatilité
  function calculerVolatilite(rendements) {
    let moyenne = rendements.reduce((acc, r) => acc + r, 0) / rendements.length;
    let variance = rendements.reduce((acc, r) => acc + Math.pow(r - moyenne, 2), 0) / rendements.length;
    return Math.sqrt(variance) * Math.sqrt(52); // Annualisation
  }
  function calculerVolatilitejour(rendements) {
    let moyenne = rendements.reduce((acc, r) => acc + r, 0) / rendements.length;
    let variance = rendements.reduce((acc, r) => acc + Math.pow(r - moyenne, 2), 0) / rendements.length;
    return Math.sqrt(variance) * Math.sqrt(252); // Annualisation
  }
  function calculerVolatilitemois(rendements) {
    let moyenne = rendements.reduce((acc, r) => acc + r, 0) / rendements.length;
    let variance = rendements.reduce((acc, r) => acc + Math.pow(r - moyenne, 2), 0) / rendements.length;
    return Math.sqrt(variance) * Math.sqrt(12); // Annualisation
  }
  function trouverElementLePlusProche(array, dateRecherche) {
    // Filtrer les éléments avec une date non nulle
    const elementsAvecDateNonNull = array.filter(d => d.date !== null);

    // Trier les éléments par différence avec la date de recherche
    const elementsTries = _.sortBy(elementsAvecDateNonNull, d => Math.abs(new Date(d.date) - new Date(dateRecherche)));

    // Prendre le premier élément trié (le plus proche)
    const elementLePlusProche = elementsTries[0];

    return elementLePlusProche;
  }


  async function tsrhistos(datee, year) {

    // Récupérer la dernière valeur du mois précédent
    const lastValue = await tsrhisto.findOne({
      where: {
        date: {
          //  [Op.lt]: new Date(new Date().setDate(0))  // Dernier jour du mois précédent
          [Op.lt]: datee
        },
      },
      order: [['date', 'DESC']]
    });

    if (!lastValue) {
      throw new Error('No data found for the last month.');
    }

    const endDate = lastValue.date;
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - parseInt(year));
    let values;
    if (parseInt(year) == 5 || parseInt(year) == 10) {
      // Récupérer les valeurs sur les 10 dernières années
      values = await tsrhisto.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }, annee: parseInt(year)
        },
        order: [['date', 'ASC']]
      });
    } else {
      values = await tsrhisto.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          },
          indice: "MONIA"
        },
        order: [['date', 'ASC']]
      });
    }

    const weeklyRates = values.map((value, index) => {
      if (index === 0) return 0; // Aucun taux hebdomadaire pour la première valeur
      const previousValue = values[index - 1].value;
      const currentValue = value.value;
      const weeklyRate = Math.pow((1 + currentValue) / (1 + previousValue), 1 / 52) - 1;
      return weeklyRate;
    });

    const hebdoValues = values.map(value => {
      const hebdo = Math.pow((1 + value.value) / (1 + (value.value === 0 ? 0 : values[values.indexOf(value) - 1].value)), 1 / 52) - 1;
      return hebdo;
    });
    
    const valueArray = values.map(record => record.value);
    const annualYield = math.mean(valueArray)
    return annualYield;
  }
  router.get('/api/ratiosnew/:year/:id', async (req, res) => {
    const fonds = await fond.findOne({
      where: {
        id: req.params.id, // Supposons que vous récupériez l'ID du fond depuis les paramètres de l'URL
      },
    });

    if (!fonds) {
      return res.status(404).json({ message: "Fond non trouvé" });
    }

    // Maintenant, vous avez le pays du fond
    const paysFond = fonds.pays;



    const response = await vl.findAll({
      where: {
        fund_id: req.params.id,
      },
      order: [['date', 'ASC']],
    });

    if (!response.length) {
      return res.status(404).json({ code: 404, message: 'Données de valeur liquidative non trouvées' });
    }
    const valuess = response.map(data => data.value);
    const valuesindifrefs = response.map(data => data.indRef);

    // Dupliquer la VL pour les jours de semaine
    const datess = response.map(data => moment(data.date).format('YYYY-MM-DD'));
  // Nouveau tableau pour stocker les objets date-valeur
  let extendedData = datess.map((date, index) => {
    let lastIndRef = valuesindifrefs[index]; // Dernière valeur non nulle
    if (lastIndRef === null) {
      for (let j = index; j >= 0; j--) {
        if (valuesindifrefs[j] !== null) {
          lastIndRef = valuesindifrefs[j];
          break;
        }
      }
    }
    return {
      date: date,
      value: valuess[index],
      indRef: lastIndRef !== null ? lastIndRef : valuesindifrefs[index] // Vérifier si indRef est null
    };
  });
   // Remplir les jours de semaine manquants
for (let i = 0; i < datess.length - 1; i++) {
  const currentDate = moment(datess[i]);
  const nextDate = moment(datess[i + 1]);

  // Ajouter les jours manquants entre la date actuelle et la date suivante
  while (currentDate.clone().add(1, 'days').isBefore(nextDate)) {
    currentDate.add(1, 'days');  // Avancer la date d'un jour

    // Vérifier si le jour est un jour de semaine (lundi à vendredi)
    if (currentDate.isoWeekday() < 6) { // 6 = Samedi, 7 = Dimanche
    
      let lastIndRef = valuesindifrefs[i]; // Dernière valeur non nulle
      if (lastIndRef === null) {
        for (let j = i; j >= 0; j--) {
          if (valuesindifrefs[j] !== null) {
            lastIndRef = valuesindifrefs[j];
            break;
          }
        }
      }
      extendedData.push({
        date: currentDate.format('YYYY-MM-DD'),
        value: valuess[i],  // Utilisez la valeur de la date actuelle
        indRef: lastIndRef // Utiliser la dernière valeur non nulle
      });
     
    }
  }
}

// Trier les données par date
extendedData.sort((a, b) =>  new Date(b.date)  - new Date(a.date));

    // Extraire les dates et valeurs triées
    const dates = extendedData.map(item => item.date);
    const values = extendedData.map(item => item.value);
        // const tauxsr=0.03;-0.0116;-0,0234
        // const tauxsr = -0.0234;
        let tauxsr;
        // Valeurs liquidatives
      
        const tsrValues = response.map((data) => data.tsr);
        const valuesindifref = extendedData.map(item => item.indRef);


        const lastValue = values[dates.indexOf(findLastDateOfPreviousMonth(dates))];
        const lastValueInd = valuesindifref[dates.indexOf(findLastDateOfPreviousMonth(dates))];


        // Dernière date du mois précédent
        const lastPreviousDate = findLastDateOfPreviousMonth(dates)

        const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayValuesindifrefnew = valuesindifref.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

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
        //   let tauxsrannu = trouverElementLePlusProche(tableauDonneestsr, findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)));
        if (paysFond == "Maroc") {
          tauxsr = await tsrhistos(lastPreviousDate, req.params.year)
          tauxsr = tauxsr / 100;
        } else {
          tauxsr = 0.01420;
        }

        //  tauxsr = -0.0234; // Ou toute autre valeur par défaut que vous souhaitez

        //si le nombre de rendements de l'indice
        if (req.params.year === "1") {
          // Récupérer la dernière date dans la base de données
          const derniereDate = await tsr.max('date', { where: { pays: paysFond } });

          // Calculer la date un an en arrière à partir de la dernière date
          const dateUnAnAvant = new Date(derniereDate);
          dateUnAnAvant.setFullYear(dateUnAnAvant.getFullYear() - 1);

          // Rechercher le taux sans risque le plus proche à la fin du mois un an en arrière
          const tauxSansRisqueUnAnAvant = await tsr.findOne({
            where: {
              date: {
                [Sequelize.Op.lte]: dateUnAnAvant, // Date un an en arrière ou antérieure
                [Sequelize.Op.gte]: new Date(dateUnAnAvant.getFullYear(), dateUnAnAvant.getMonth() + 1, 0) // Dernier jour du mois
              },
              pays: paysFond,
            },
            order: [['date', 'DESC']], // Tri par date décroissante
          });

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
          // Récupérer la dernière date dans la base de données
          const derniereDate = await tsr.max('date', { where: { pays: paysFond } });

          // Calculer la date un an en arrière à partir de la dernière date
          const dateUnAnAvant = new Date(derniereDate);
          dateUnAnAvant.setFullYear(dateUnAnAvant.getFullYear() - 3);

          // Rechercher le taux sans risque le plus proche à la fin du mois un an en arrière
          const tauxSansRisqueUnAnAvant = await tsr.findOne({
            where: {
              date: {
                [Sequelize.Op.lte]: dateUnAnAvant, // Date un an en arrière ou antérieure
                [Sequelize.Op.gte]: new Date(dateUnAnAvant.getFullYear(), dateUnAnAvant.getMonth() + 1, 0) // Dernier jour du mois
              },
              pays: paysFond,
            },
            order: [['date', 'DESC']], // Tri par date décroissante
          });

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

          const maxDrawdown = calculateMaxDrawdown(Vls)
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
          // Récupérer la dernière date dans la base de données
          const derniereDate = await tsr.max('date', { where: { pays: paysFond } });

          // Calculer la date un an en arrière à partir de la dernière date
          const dateUnAnAvant = new Date(derniereDate);
          dateUnAnAvant.setFullYear(dateUnAnAvant.getFullYear() - 5);

          // Rechercher le taux sans risque le plus proche à la fin du mois un an en arrière
          const tauxSansRisqueUnAnAvant = await tsr.findOne({
            where: {
              date: {
                [Sequelize.Op.lte]: dateUnAnAvant, // Date un an en arrière ou antérieure
                [Sequelize.Op.gte]: new Date(dateUnAnAvant.getFullYear(), dateUnAnAvant.getMonth() + 1, 0) // Dernier jour du mois
              },
              pays: paysFond,
            },
            order: [['date', 'DESC']], // Tri par date décroissante
          });

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
          // Récupérer la dernière date dans la base de données
          const derniereDate = await tsr.max('date', { where: { pays: paysFond } });

          // Calculer la date un an en arrière à partir de la dernière date
          const dateUnAnAvant = new Date(derniereDate);
          dateUnAnAvant.setFullYear(dateUnAnAvant.getFullYear() - 8);

          // Rechercher le taux sans risque le plus proche à la fin du mois un an en arrière
          const tauxSansRisqueUnAnAvant = await tsr.findOne({
            where: {
              date: {
                [Sequelize.Op.lte]: dateUnAnAvant, // Date un an en arrière ou antérieure
                [Sequelize.Op.gte]: new Date(dateUnAnAvant.getFullYear(), dateUnAnAvant.getMonth() + 1, 0) // Dernier jour du mois
              },
              pays: paysFond,
            },
            order: [['date', 'DESC']], // Tri par date décroissante
          });

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
          // Récupérer la dernière date dans la base de données
          const derniereDate = await tsr.max('date', { where: { pays: paysFond } });

          // Calculer la date un an en arrière à partir de la dernière date
          const dateUnAnAvant = new Date(derniereDate);
          dateUnAnAvant.setFullYear(dateUnAnAvant.getFullYear() - 10);

          // Rechercher le taux sans risque le plus proche à la fin du mois un an en arrière
          const tauxSansRisqueUnAnAvant = await tsr.findOne({
            where: {
              date: {
                [Sequelize.Op.lte]: dateUnAnAvant, // Date un an en arrière ou antérieure
                [Sequelize.Op.gte]: new Date(dateUnAnAvant.getFullYear(), dateUnAnAvant.getMonth() + 1, 0) // Dernier jour du mois
              },
              pays: paysFond,
            },
            order: [['date', 'DESC']], // Tri par date décroissante
          });

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
          // Récupérer la dernière date dans la base de données
          const derniereDate = await tsr.max('date', { where: { pays: paysFond } });

          // Calculer la date un an en arrière à partir de la dernière date
          const dateUnAnAvant = new Date(derniereDate);
          dateUnAnAvant.setFullYear(dateUnAnAvant.getFullYear() - 12);

          // Rechercher le taux sans risque le plus proche à la fin du mois un an en arrière
          const tauxSansRisqueUnAnAvant = await tsr.findOne({
            where: {
              date: {
                [Sequelize.Op.lte]: dateUnAnAvant, // Date un an en arrière ou antérieure
                [Sequelize.Op.gte]: new Date(dateUnAnAvant.getFullYear(), dateUnAnAvant.getMonth() + 1, 0) // Dernier jour du mois
              },
              pays: paysFond,
            },
            order: [['date', 'DESC']], // Tri par date décroissante
          });

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
          // Récupérer la dernière date dans la base de données
          const derniereDate = await tsr.max('date', { where: { pays: paysFond } });

          // Calculer la date un an en arrière à partir de la dernière date
          const dateUnAnAvant = new Date(derniereDate);
          dateUnAnAvant.setFullYear(dateUnAnAvant.getFullYear() - 1);

          // Rechercher le taux sans risque le plus proche à la fin du mois un an en arrière
          const tauxSansRisqueUnAnAvant = await tsr.findOne({
            where: {
              date: {
                [Sequelize.Op.lte]: dateUnAnAvant, // Date un an en arrière ou antérieure
                [Sequelize.Op.gte]: new Date(dateUnAnAvant.getFullYear(), dateUnAnAvant.getMonth() + 1, 0) // Dernier jour du mois
              },
              pays: paysFond,
            },
            order: [['date', 'DESC']], // Tri par date décroissante
          });

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
  //revoir
  router.get('/api/ratiosnewithdate/:year/:id/:date', async (req, res) => {
    try {
      // Récupérer les taux_sans_risques en fonction des valeurs de la table fond
      const tauxSansRisques = await tsr.findAll({
        attributes: ['valeur', 'valeur2', 'semaine', 'rate', 'date', 'pays'],
        where: { pays: "Nigeria" },
      });

      const tableauDonneestsr = tauxSansRisques.map(d => ({
        valeur: d.valeur,
        valeur2: d.valeur2,
        semaine: d.semaine,
        rate: d.rate,
        date: d.date,
        pays: d.pays,
      }));

    
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
      const valuesindifrefs = response.map(data => data.indRef);

      // Dupliquer la VL pour les jours de semaine
      const datess = response.map(data => moment(data.date).format('YYYY-MM-DD'));
    // Nouveau tableau pour stocker les objets date-valeur
    let extendedData = datess.map((date, index) => {
      let lastIndRef = valuesindifrefs[index]; // Dernière valeur non nulle
      if (lastIndRef === null) {
        for (let j = index; j >= 0; j--) {
          if (valuesindifrefs[j] !== null) {
            lastIndRef = valuesindifrefs[j];
            break;
          }
        }
      }
      return {
        date: date,
        value: valuess[index],
        indRef: lastIndRef !== null ? lastIndRef : valuesindifrefs[index] // Vérifier si indRef est null
      };
    });
     // Remplir les jours de semaine manquants
  for (let i = 0; i < datess.length - 1; i++) {
    const currentDate = moment(datess[i]);
    const nextDate = moment(datess[i + 1]);
  
    // Ajouter les jours manquants entre la date actuelle et la date suivante
    while (currentDate.clone().add(1, 'days').isBefore(nextDate)) {
      currentDate.add(1, 'days');  // Avancer la date d'un jour
  
      // Vérifier si le jour est un jour de semaine (lundi à vendredi)
      if (currentDate.isoWeekday() < 6) { // 6 = Samedi, 7 = Dimanche
      
        let lastIndRef = valuesindifrefs[i]; // Dernière valeur non nulle
        if (lastIndRef === null) {
          for (let j = i; j >= 0; j--) {
            if (valuesindifrefs[j] !== null) {
              lastIndRef = valuesindifrefs[j];
              break;
            }
          }
        }
        extendedData.push({
          date: currentDate.format('YYYY-MM-DD'),
          value: valuess[i],  // Utilisez la valeur de la date actuelle
          indRef: lastIndRef // Utiliser la dernière valeur non nulle
        });
       
      }
    }
  }
  
  // Trier les données par date
  extendedData.sort((a, b) =>  new Date(b.date)  - new Date(a.date));
  
      // Extraire les dates et valeurs triées
      const dates = extendedData.map(item => item.date);
      const values = extendedData.map(item => item.value);
      const valuesindifref=extendedData.map(item => item.indRef);

      const tauxsr = -0.0234;

      const lastPreviousDate = findLastDateOfPreviousMonth(dates);
      const lastValue = values[dates.indexOf(lastPreviousDate)];
      const lastValueInd = valuesindifref[dates.indexOf(lastPreviousDate)];

      const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
      const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
      const yArrayValuesindifrefnew = valuesindifref.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

      const donneesarray = yArrayValuesnew.map((value, i) => ({ date: yArrayDatesnew[i], value }));
      const donneesarrayindref = yArrayValuesindifrefnew.map((value, i) => ({ date: yArrayDatesnew[i], value }));

      let tauxsrannu = trouverElementLePlusProche(tableauDonneestsr, findNearestDateAnnualized(dates, 1, lastPreviousDate));

      if (req.params.year === "1") {
        handleCalculations(req, res, donneesarray, donneesarrayindref, dates, values, valuesindifref, lastPreviousDate, 1, tableauDonneestsr, tauxsr);
      } else if (req.params.year === "3") {
        handleCalculations(req, res, donneesarray, donneesarrayindref, dates, values, valuesindifref, lastPreviousDate, 3, tableauDonneestsr, tauxsr);
      } else if (req.params.year === "5") {
        handleCalculations(req, res, donneesarray, donneesarrayindref, dates, values, valuesindifref, lastPreviousDate, 5, tableauDonneestsr, tauxsr);
      } else if (req.params.year === "8") {
        handleCalculations(req, res, donneesarray, donneesarrayindref, dates, values, valuesindifref, lastPreviousDate, 8, tableauDonneestsr, tauxsr);
      } else if (req.params.year === "10") {
        handleCalculations(req, res, donneesarray, donneesarrayindref, dates, values, valuesindifref, lastPreviousDate, 10, tableauDonneestsr, tauxsr);
      } else if (req.params.year === "12") {
        handleCalculations(req, res, donneesarray, donneesarrayindref, dates, values, valuesindifref, lastPreviousDate, 12, tableauDonneestsr, tauxsr);
      } else if (req.params.year === "origine") {
        handleCalculations(req, res, donneesarray, donneesarrayindref, dates, values, valuesindifref, lastPreviousDate, groupDatesByYear(dates).length, tableauDonneestsr, tauxsr);
      } else {
        res.status(400).json({ code: 400, message: "Invalid year parameter" });
      }
    } catch (error) {
      console.error('Erreur lors du traitement des ratios:', error);
      res.status(500).json({ code: 500, message: 'Erreur interne du serveur' });
    }
  });

  function handleCalculations(req, res, donneesarray, donneesarrayindref, dates, values, valuesindifref, lastPreviousDate, years, tableauDonneestsr, tauxsr) {
    let rendementsTableau = {};
    let rendementsTableauindice = {};
    let volatilites = {};
    let volatilitesind = {};

    let rendementsTableaujour = {};
    let rendementsTableauindicejour = {};
    let volatilitesjour = {};
    let volatilitesindjour = {};

    let rendementsTableaumois = {};
    let rendementsTableauindicemois = {};
    let volatilitesmois = {};
    let volatilitesindmois = {};
    const periods = {};
    periods[`${years}_ans`] = findNearestDatetoyear(dates, years, lastPreviousDate);
    let Vls = [];
    let Vlsindice = [];
    for (let [periode, dateDebut] of Object.entries(periods)) {

      const donneesPeriodesemaine = grouperParSemaine(donneesarray).filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(lastPreviousDate));
      const donneesPeriodeindicesemaine = grouperParSemaine(donneesarrayindref).filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(lastPreviousDate));

      const donneesPeriodejour = grouperParJour(donneesarray).filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(lastPreviousDate));
      const donneesPeriodeindicejour = grouperParJour(donneesarrayindref).filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(lastPreviousDate));

      const donneesPeriodemois = grouperParMois(donneesarray).filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(lastPreviousDate));
      const donneesPeriodeindicemois = grouperParMois(donneesarrayindref).filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(lastPreviousDate));
      for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
        Vls.push(donneesPeriodejour[i].value)
      }
      for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
        Vlsindice.push(donneesPeriodeindicejour[i].value)
      }
      rendementsTableau[periode] = calculerRendements(donneesPeriodesemaine);
      rendementsTableauindice[periode] = calculerRendements(donneesPeriodeindicesemaine);
      volatilites[periode] = calculerVolatilite(rendementsTableau[periode]);
      volatilitesind[periode] = calculerVolatilite(rendementsTableauindice[periode]);

      rendementsTableaujour[periode] = calculerRendements(donneesPeriodejour);
      rendementsTableauindicejour[periode] = calculerRendements(donneesPeriodeindicejour);
      volatilitesjour[periode] = calculerVolatilitejour(rendementsTableaujour[periode]);
      volatilitesindjour[periode] = calculerVolatilitejour(rendementsTableauindicejour[periode]);

      rendementsTableaumois[periode] = calculerRendements(donneesPeriodemois);
      rendementsTableauindicemois[periode] = calculerRendements(donneesPeriodeindicemois);
      volatilitesmois[periode] = calculerVolatilitemois(rendementsTableaumois[periode]);
      volatilitesindmois[periode] = calculerVolatilitemois(rendementsTableauindicemois[periode]);
    }

    const periode = Object.keys(periods)[0];
    const yDate = findNearestDateAnnualized(dates, parseInt(req.params.year), lastPreviousDate);
    const CAGR = calculerCAGR(values[dates.indexOf(yDate)], values[dates.indexOf(lastPreviousDate)], parseInt(req.params.year));

    const result = {
      volatility: volatilites[periode] * 100,
      volatilityjour: volatilitesjour[periode] * 100,
      volatilitymois: volatilitesmois[periode] * 100,
      volatilityInd: volatilitesind[periode] * 100,
      volatilityIndjour: volatilitesindjour[periode] * 100,
      volatilityIndmois: volatilitesindmois[periode] * 100,
      beta: calculateBetanew(rendementsTableau[periode], rendementsTableauindice[periode]),
      betajour: calculateBetanew(rendementsTableaujour[periode], rendementsTableauindicejour[periode]),
      betamois: calculateBetanew(rendementsTableaumois[periode], rendementsTableauindicemois[periode]),
      perfannu: calculateAnnualizedPerformance(values[dates.indexOf(lastPreviousDate)], values[dates.indexOf(yDate)], parseInt(req.params.year)) * 100,
      CAGR,
      perfannuInd: calculateAnnualizedPerformance(valuesindifref[dates.indexOf(lastPreviousDate)], valuesindifref[dates.indexOf(yDate)], parseInt(req.params.year)) * 100,
      info: calculateInformationRatio(rendementsTableau[periode], rendementsTableauindice[periode]),
      infojour: calculateInformationRatiojour(rendementsTableaujour[periode], rendementsTableauindicejour[periode]),
      infomois: calculateInformationRatio(rendementsTableaumois[periode], rendementsTableauindicemois[periode]),
      r2: calculerR2(rendementsTableau[periode], rendementsTableauindice[periode]),
      r2jour: calculerR2(rendementsTableaujour[periode], rendementsTableauindicejour[periode]),
      r2mois: calculerR2(rendementsTableaumois[periode], rendementsTableauindicemois[periode]),
      correlation: quants.corrcoef(rendementsTableau[periode], rendementsTableauindice[periode], 0),
      correlationjour: quants.corrcoef(rendementsTableaujour[periode], rendementsTableauindicejour[periode], 0),
      correlationmois: quants.corrcoef(rendementsTableaumois[periode], rendementsTableauindicemois[periode], 0),
      omega: calculateOmegaRatio(rendementsTableau[periode], 0),
      omegajour: calculateOmegaRatio(rendementsTableaujour[periode], 0),
      omegamois: calculateOmegaRatio(rendementsTableaumois[periode], 0),
      sortino: calculateSortinoRatio(rendementsTableau[periode], -0.00473, 0.01),
      sortinojour: calculateSortinoRatio(rendementsTableaujour[periode], -0.00473, 0.01),
      sortinomois: calculateSortinoRatio(rendementsTableaumois[periode], -0.00473, 0.01),
      calamar: calculateCalmarRatio(calculateMaxDrawdown(Vls.reverse()), CAGR),
      pertemax: -calculateMaxDrawdown(Vls.reverse()) * 100,
      pertemaxInd: -calculateMaxDrawdown(Vlsindice.reverse()) * 100,
      dsr: calculerDSRAnnualise(rendementsTableau[periode], 0.01),
      dsrjour: calculerDSRAnnualise(rendementsTableaujour[periode], 0.01),
      dsrmois: calculerDSRAnnualise(rendementsTableaumois[periode], 0.01),
      ratiosharpe: (CAGR - tauxsr) / volatilites[periode],
      ratiosharpejour: (CAGR - tauxsr) / volatilitesjour[periode],
      ratiosharpemois: (CAGR - tauxsr) / volatilitesmois[periode],
      trackingerror: calculateTrackingError(rendementsTableau[periode], rendementsTableauindice[periode]) * 100,
      trackingerrorjour: calculateTrackingError(rendementsTableaujour[periode], rendementsTableauindicejour[periode]) * 100,
      trackingerrormois: calculateTrackingError(rendementsTableaumois[periode], rendementsTableauindicemois[periode]) * 100,
      delaiRecouvrement: calculerDelaiRecouvrementFonds(Vls.reverse()),
      betahaussier: calculateHaussierBeta(rendementsTableau[periode], rendementsTableauindice[periode]),
      betahaussierjour: calculateHaussierBeta(rendementsTableaujour[periode], rendementsTableauindicejour[periode]),
      betahaussiermois: calculateHaussierBeta(rendementsTableaumois[periode], rendementsTableauindicemois[periode]),
      betabaissier: calculateDownsideBeta(rendementsTableau[periode], rendementsTableauindice[periode]),
      betabaissierjour: calculateDownsideBeta(rendementsTableaujour[periode], rendementsTableauindicejour[periode]),
      betabaissiermois: calculateDownsideBeta(rendementsTableaumois[periode], rendementsTableauindicemois[periode]),
      upcapture: calculateUpCaptureRatio(rendementsTableau[periode], rendementsTableauindice[periode]),
      upcapturejour: calculateUpCaptureRatio(rendementsTableaujour[periode], rendementsTableauindicejour[periode]),
      upcapturemois: calculateUpCaptureRatio(rendementsTableaumois[periode], rendementsTableauindicemois[periode]),
      downcapture: calculateDownCaptureRatio(rendementsTableau[periode], rendementsTableauindice[periode]),
      downcapturejour: calculateDownCaptureRatio(rendementsTableaujour[periode], rendementsTableauindicejour[periode]),
      downcapturemois: calculateDownCaptureRatio(rendementsTableaumois[periode], rendementsTableauindicemois[periode]),
      skewness: calculerSkewness(rendementsTableau[periode], volatilites[periode]),
      skewnessjour: calculerSkewness(rendementsTableaujour[periode], volatilitesjour[periode]),
      skewnessmois: calculerSkewness(rendementsTableaumois[periode], volatilitesmois[periode]),
      kurtosis: calculateKurtosis(rendementsTableau[periode]),
      kurtosisjour: calculateKurtosis(rendementsTableaujour[periode]),
      kurtosismois: calculateKurtosis(rendementsTableaumois[periode]),
      var95: calculateVAR95(rendementsTableau[periode], 0.95) * 100,
      var95jour: calculateVAR95(rendementsTableaujour[periode], 0.95) * 100,
      var95mois: calculateVAR95(rendementsTableaumois[periode], 0.95) * 100,
      var99: calculateVAR99(rendementsTableau[periode], 0.99) * 100,
      var99jour: calculateVAR99(rendementsTableaujour[periode], 0.99) * 100,
      var99mois: calculateVAR99(rendementsTableaumois[periode], 0.99) * 100
    };

    res.json({ code: 200, data: result });
  }
  ////
  ////////////////////////////////////////////////////
  router.get('/api/ratiosnewithdate1/:year/:id/:date', async (req, res) => {
    // Récupérer les taux_sans_risques en fonction des valeurs de la table fond
    const tauxSansRisques = await tsr.findAll({
      attributes: ['valeur', 'valeur2', 'semaine', 'rate', 'date', 'pays'],
      where: {
        // Ajoutez les conditions spécifiques en fonction de votre logique
        pays: "Nigeria",
      },
    });

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

    await vl.findAll({
      where: {
        fund_id: req.params.id,
        date: { [Op.lte]: req.params.date } // Filtrer les valeurs inférieures ou égales à la date fournie
      },
      order: [
        ['date', 'DESC'] // Modification ici pour trier par date en ordre décroissant
      ]
    })
      .then(async (response) => {
        // const tauxsr=0.03;-0.0116;-0,0234
        const tauxsr = -0.0234;
        // Valeurs liquidatives
        const values = response.map((data) => data.value);
        const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        const tsrValues = response.map((data) => data.tsr);
        const valuesindifref = response.map((data) => data.indRef);


        const lastValue = values[dates.indexOf(findLastDateOfPreviousMonth(dates))];
        const lastValueInd = valuesindifref[dates.indexOf(findLastDateOfPreviousMonth(dates))];


        // Dernière date du mois précédent
        const lastPreviousDate = findLastDateOfPreviousMonth(dates)

        const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayValuesindifrefnew = valuesindifref.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

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
  ///////////////////////////////////////////////////

  router.get('/api/ratiosnewdev/:year/:id/:devise', async (req, res) => {
    // Récupérer les taux_sans_risques en fonction des valeurs de la table fond
    const tauxSansRisques = await tsr.findAll({
      attributes: ['valeur', 'valeur2', 'semaine', 'rate', 'date', 'pays'],
      where: {
        // Ajoutez les conditions spécifiques en fonction de votre logique
        pays: "Nigeria",
      },
    });

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

    await vl.findAll({
      where: {
        fund_id: req.params.id
      },
      order: [
        ['date', 'DESC'] // Modification ici pour trier par date en ordre décroissant
      ]
    })
      .then(async (response) => {
        // const tauxsr=0.03;-0.0116;-0,0234
        const tauxsr = -0.0234;
        let values;
        // Valeurs liquidatives
        if (req.params.devise == "USD") {
          values = response.map((data) => data.value_USD);
        } else {
          values = response.map((data) => data.value_EUR);

        }
        const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        const tsrValues = response.map((data) => data.tsr);
        const valuesindifref = response.map((data) => data.indRef);
        /* let valuesindifref;
         if (req.params.devise == "USD") {
           valuesindifref = response.map((data) => data.indRef_USD);
         } else {
           valuesindifref = response.map((data) => data.indRef_EUR);
   
         }*/


        const lastValue = values[dates.indexOf(findLastDateOfPreviousMonth(dates))];
        const lastValueInd = valuesindifref[dates.indexOf(findLastDateOfPreviousMonth(dates))];


        // Dernière date du mois précédent
        const lastPreviousDate = findLastDateOfPreviousMonth(dates)

        const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayValuesindifrefnew = valuesindifref.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

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

  router.get('/api/ratiosnewdevwithdate/:year/:id/:devise/:date', async (req, res) => {
    // Récupérer les taux_sans_risques en fonction des valeurs de la table fond
    const tauxSansRisques = await tsr.findAll({
      attributes: ['valeur', 'valeur2', 'semaine', 'rate', 'date', 'pays'],
      where: {
        // Ajoutez les conditions spécifiques en fonction de votre logique
        pays: "Nigeria",
      },
    });

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

    await vl.findAll({
      where: {
        fund_id: req.params.id,
        date: { [Op.lte]: req.params.date } // Filtrer les valeurs inférieures ou égales à la date fournie
      },
      order: [
        ['date', 'DESC']
      ]
    })
      .then(async (response) => {
        // const tauxsr=0.03;-0.0116;-0,0234
        const tauxsr = -0.0234;
        let values;
        // Valeurs liquidatives
        if (req.params.devise == "USD") {
          values = response.map((data) => data.value_USD);
        } else {
          values = response.map((data) => data.value_EUR);

        }
        const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        const tsrValues = response.map((data) => data.tsr);
        const valuesindifref = response.map((data) => data.indRef);
        /* let valuesindifref;
         if (req.params.devise == "USD") {
           valuesindifref = response.map((data) => data.indRef_USD);
         } else {
           valuesindifref = response.map((data) => data.indRef_EUR);
   
         }*/


        const lastValue = values[dates.indexOf(findLastDateOfPreviousMonth(dates))];
        const lastValueInd = valuesindifref[dates.indexOf(findLastDateOfPreviousMonth(dates))];


        // Dernière date du mois précédent
        const lastPreviousDate = findLastDateOfPreviousMonth(dates)

        const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayValuesindifrefnew = valuesindifref.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

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