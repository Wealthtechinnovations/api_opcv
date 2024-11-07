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
const { createClient } = require('@clickhouse/client');
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
const { Fond } = require('../classes/fond')
const { Indice } = require('../classes/indice')
const { Op } = require("sequelize");
const { fastifySwaggerUi } = require("@fastify/swagger-ui");
const { da } = require('date-fns/locale');
const portefeuille_valorise = require('../models/portefeuille_valorise');
const { exit } = require('process');
const { url } = require('inspector');
const apikey = require('../models/apikey');

var limiter = new Bottleneck({
  minTime: 1000, // 1 request per second
  maxConcurrent: 3 // No more than 5 concurrent requests
});

// Configuration de ClickHouse
const clickhouse = new createClient({
  url: 'http://172.20.27.129:8123', // L'adresse IP de votre WSL et le port 8123
  username: 'default',
  password: 'Testing',  // ou votre mot de passe si défini
  protocol: 'http',
});
// Fonction pour écrire dans un fichier de journal
function writeToLogFile(message) {
  fs.appendFile('logs.txt', message + '\n', (err) => {
    if (err) {
      console.error("Erreur lors de l'écriture dans le fichier de journal :", err);
    } else {
      console.log("Message de journal écrit avec succès dans le fichier de journal.");
    }
  });
}

async function fetchFundsByValorisation1(selectedValues, selectedcategorie, selectedsociete, selectedDevise, frequence, fund1, fund2) {
  try {
    let query;
    if (selectedValues.length >= 1 && selectedValues[0] != '') {

      query = `
    SELECT f.*
    FROM fond_investissements AS f
    WHERE  f.id in (${selectedValues.map(cat => cat).join(',')}) and  f.id IN (SELECT v.fund_id FROM valorisations AS v ) and f.id>=${fund1} and  f.id<=${fund2} 
  `;
    } else {

      query = `
      SELECT f.*
      FROM fond_investissements AS f
      WHERE   f.id IN (SELECT v.fund_id FROM valorisations AS v ) and f.id>=${fund1} and  f.id<=${fund2} 
`;
    }

    if (selectedcategorie != 'undefined') {
      query += `
 
      AND f.categorie_globale = :selectedcategorie
  
`;
    }

    if (selectedDevise != 'undefined') {
      query += `
 
      AND f.dev_libelle = :selectedDevise
  
`;
    }

    if (frequence != 'undefined' && frequence.length >= 1) {
      query += `
 
      AND f.periodicite = :frequence
  
`;
    }

    if (selectedsociete != 'undefined') {
      query += `
 
      AND f.societe_gestion = :selectedsociete
  
`;
    }

    const fondsDansCategorie = await sequelize.query(query, {
      replacements: { selectedsociete, selectedcategorie, selectedDevise, frequence },

      type: sequelize.QueryTypes.SELECT,
    });

    // Retournez la liste des fonds
    return fondsDansCategorie;
  } catch (erreur) {
    console.error('Erreur lors de la récupération des fonds par catégorie :', erreur);
    throw erreur; // Propagez l'erreur pour qu'elle soit gérée ailleurs si nécessaire
  }
}

async function fetchFundsByValorisation(selectedValues, selectedcategorie, selectedsociete, selectedDevise, frequence) {
  try {
    let query;
    if (selectedValues.length >= 1 && selectedValues[0] != '') {

      query = `
    SELECT f.*
    FROM fond_investissements AS f
    WHERE  f.id in (${selectedValues.map(cat => cat).join(',')}) and  f.id IN (SELECT v.fund_id FROM valorisations AS v )
  `;
    } else {

      query = `
      SELECT f.*
      FROM fond_investissements AS f
      WHERE   f.id IN (SELECT v.fund_id FROM valorisations AS v )
`;
    }

    if (selectedcategorie != 'undefined') {
      query += `
 
      AND f.categorie_globale = :selectedcategorie
  
`;
    }

    if (selectedDevise != 'undefined') {
      query += `
 
      AND f.dev_libelle = :selectedDevise
  
`;
    }

    if (frequence != 'undefined' && frequence.length >= 1) {
      query += `
 
      AND f.periodicite = :frequence
  
`;
    }

    if (selectedsociete != 'undefined') {
      query += `
 
      AND f.societe_gestion = :selectedsociete
  
`;
    }

    const fondsDansCategorie = await sequelize.query(query, {
      replacements: { selectedsociete, selectedcategorie, selectedDevise, frequence },

      type: sequelize.QueryTypes.SELECT,
    });

    // Retournez la liste des fonds
    return fondsDansCategorie;
  } catch (erreur) {
    console.error('Erreur lors de la récupération des fonds par catégorie :', erreur);
    throw erreur; // Propagez l'erreur pour qu'elle soit gérée ailleurs si nécessaire
  }
}
function isWeekend(date) {
  const dayOfWeek = date.day();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 pour dimanche, 6 pour samedi
}

router.get('/api/savevlmanquante', async (req, res) => {
  const allFunds = await fetchFundsByValorisation([], 'undefined', 'undefined', 'undefined', 'undefined');

  //const allFunds = await fond.findAll();

  for (const fund of allFunds) {
    let anomalie = "";
    const fundId = fund.id;
    const periodicite = fund.periodicite;
    const firstVlDate = await vl.min('date', { where: { fund_id: fundId } });
    const increment = periodicite === 'journaliere' ? 'days' : 'weeks';
    for (let date = moment(firstVlDate); date.isBefore(moment()); date.add(1, increment)) {
      // Si la périodicité est journalière et la date est un week-end, passer à la prochaine date
      if (periodicite === 'journaliere' && isWeekend(date)) {
        continue;
      }

      // Vérifier si la VL est manquante pour cette date
      const vlExists = await vl.findOne({ where: { fund_id: fundId, date: date.format('YYYY-MM-DD') } });

      // Si la VL n'existe pas, ajouter l'anomalie VL manquante
      if (!vlExists) {
        anomalie = "VL MANQUANTE"
        break; // Arrêter la boucle après avoir trouvé une anomalie de VL manquante
        //anomalies.push({ fond_id: id, date: date.format('YYYY-MM-DD'), type_anomalie: 'VL manquant' });
      }
    }
    const existingperf = await performences.findOne({
      where: { fond_id: fundId },
      order: [['date', 'DESC']], // Trie par date décroissante
    });
    if (existingperf) {
      // Le fond existe, mettez à jour son classement en fonction de la catégorie
      existingperf.anomalie = anomalie;
      await existingperf.save();
    }

  }
  res.json({
    code: 200,
    data: "OK"
  });
});
// Fonction pour parcourir les fonds avec "dividende" à "oui" et mettre à jour les VL en fonction du cumul des dividendes.
router.get('/api/updatewithdividende', async (req, res) => {
    try {
      // Récupérer tous les fonds où "dividende" est défini à "oui"
      const fondsAvecDividende = await fond.findAll({
        where: { affectation: "Distribuant" },
        include: [{
          model: vl,
          order: [['date', 'ASC']] // Assurez-vous que les VL sont triées par date croissante
        }]
      });
  
      // Parcourir chaque fonds et mettre à jour la table VL en tenant compte du cumul des dividendes
      for (const fonds of fondsAvecDividende) {
        const vlRecords = fonds.valorisations; // Obtenir les VL associés au fonds
        let totalDividende = 0; // Initialiser le cumul des dividendes à zéro
        let totalDividende_EUR = 0; // Initialiser le cumul des dividendes à zéro
        let totalDividende_USD = 0; // Initialiser le cumul des dividendes à zéro
  
        // Parcourir chaque VL du fonds, trié par date croissante
        for (const vl of vlRecords) {
          // Remplacer null par 0 pour éviter les erreurs de calcul
          const valeur = vl.value || 0;
          const dividende = vl.dividende || 0;
          const valeurEUR = vl.value_EUR || 0;
          const dividendeEUR = vl.dividende_EUR || 0;
          const valeurUSD = vl.value_USD || 0;
          const dividendeUSD = vl.dividende_USD || 0;
  
          // Ajouter le dividende courant au cumul total si un dividende est présent
          if (dividende > 0 ) {
            totalDividende += dividende; // Ajouter le dividende courant au cumul total
          }
          if(dividendeEUR > 0 ){
            totalDividende_EUR += dividendeEUR;// Ajouter le dividende courant au cumul total
          }
          if(dividendeUSD > 0 ){
            totalDividende_USD += dividendeUSD;// Ajouter le dividende courant au cumul total
          }
  
          // Calculer les nouvelles valeurs en ajoutant le cumul des dividendes aux valeurs existantes
          const newValue = valeur + totalDividende;
          const newValueEUR = valeurEUR + totalDividende_EUR;
          const newValueUSD = valeurUSD + totalDividende_USD;
  
          // Mettre à jour la table VL avec la nouvelle valeur cumulative
          await vl.update({ vl_ajuste: newValue, vl_ajuste_EUR: newValueEUR, vl_ajuste_USD: newValueUSD }, { where: { id: vl.id } });
        }
      }
  
      return res.status(200).json({ message: 'Mise à jour des VL avec cumul des dividendes réussie.' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des VL avec dividendes:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour des VL avec cumul des dividendes.' });
    }
  });

  async function anneevalorisation(fundid) {
    try {
      let query;
      // MAX(YEAR(v.date))-MIN(YEAR(v.date)) as annee


      query = `
        SELECT
        f.*,
        MIN(YEAR(v.date)) AS first_valorisation_year,
        MAX(YEAR(v.date)) AS last_valorisation_year,
       
        DATEDIFF(MAX(v.date), MIN(v.date))/365 AS annee
      FROM
        fond_investissements AS f
      JOIN
        valorisations AS v ON f.id = v.fund_id
      WHERE
        f.id = :fundid AND
        f.id IN (
          SELECT v.fund_id
          FROM valorisations AS v
          WHERE v.fund_id = :fundid
          GROUP BY v.fund_id
          
        )
      GROUP BY
        f.id
 `;






      const fondsDansCategorie = await sequelize.query(query, {
        replacements: { fundid, },

        type: sequelize.QueryTypes.SELECT,
      });

      // Retournez la liste des fonds
      return fondsDansCategorie;
    } catch (erreur) {
      console.error('Erreur lors de la récupération des fonds par catégorie :', erreur);
      throw erreur; // Propagez l'erreur pour qu'elle soit gérée ailleurs si nécessaire
    }
  }
  /**
  * Fonction asynchrone pour calculer le classement d'un fond dans une catégorie spécifique.
  *
  * @param {string} category - Catégorie du fond.
  * @param {number} fundId - ID du fond.
  * @returns {Object} - Résultat du calcul du classement.
  */
  async function calculateRankmysql(category, fundId, datedebut) {
    try {
      const selectedFundId = fundId;
      const selectedFundCategory = category;
      const fundsWithPerformance = await sequelize.query(`
      SELECT 
        p1.fond_id, 
        p1.perfveille, 

        p1.perf3m, 
        p1.perf6m, 
        p1.perf1an, 
        p1.perf3ans, 
        p1.perf5ans, 
        p1.ytd,
        p1.perfveillem, 

        p1.perf3mm, 
        p1.perf6mm, 
        p1.perf1anm, 
        p1.perf3ansm, 
        p1.perf5ansm, 
        p1.ytdm,
        p1.volatility3an,
        p1.ratiosharpe3an,
        p1.pertemax3an,
        p1.sortino3an,
        p1.info3an,
        p1.calamar3an,
        p1.var953an,
        p1.betabaissier3an,
        p1.sortino3an,
        p1.omega3an,
        p1.dsr3an
        
      FROM performences p1
      
        WHERE date= :datedebut  and  categorie_nationale = :selectedFundCategory

        GROUP BY fond_id
   
    `, {
        replacements: { selectedFundCategory, datedebut },
        type: sequelize.QueryTypes.SELECT,
      });

      // Étape 2 : Trouver les performances du fond sélectionné
      const selectedFund = fundsWithPerformance.find((fund) => fund.fond_id === selectedFundId);

      if (!selectedFund) {
        return { error: 'Fond non trouvé.' };
      }

      // Étape 3 : Calculer les rangs pour chaque période de performance
      const calculateRankForPeriod = (period) => {
        // Filtrer les performances non valides pour le champ spécifique
        const validPerformances = fundsWithPerformance.filter((fund) =>
          fund[period] != null && fund[period] != "-"
        );

        // Si toutes les performances pour ce champ sont invalides, retourner null
        if (validPerformances.length === 0) {
          return null;
        }
        const rantotal = validPerformances.length;
        // Sinon, effectuer le classement
        // Vérifier si le champ est 'pertemax3an' pour déterminer l'ordre du tri
        if (period === 'pertemax3an' || period === "calamar3an" || period === "betabaissier3an" || period === "volatility3an" || period === "dsr3an") {
          // Pour 'pertemax3an', les valeurs plus proches de zéro sont meilleures
          validPerformances.sort((a, b) => a[period] - b[period]);
        } else {
          // Pour les autres champs, les valeurs plus élevées sont meilleures
          validPerformances.sort((a, b) => b[period] - a[period]);
        }
        const rank = validPerformances.findIndex((fund) => fund.fond_id === selectedFundId) + 1;
        return [rank, rantotal];
      };
      const rankveille = calculateRankForPeriod('perfveille');
      const rank3Mois = calculateRankForPeriod('perf3m');
      const rank6Mois = calculateRankForPeriod('perf6m');
      const rank1An = calculateRankForPeriod('perf1an');
      const rank3Ans = calculateRankForPeriod('perf3ans');
      const rank5Ans = calculateRankForPeriod('perf5ans');
      const rank1erJanvier = calculateRankForPeriod('ytd');
      const rankveillem = calculateRankForPeriod('perfveillem');
      const rank3Moism = calculateRankForPeriod('perf3mm');
      const rank6Moism = calculateRankForPeriod('perf6mm');
      const rank1Anm = calculateRankForPeriod('perf1anm');
      const rank3Ansm = calculateRankForPeriod('perf3ansm');
      const rank5Ansm = calculateRankForPeriod('perf5ansm');
      const rank1erJanvierm = calculateRankForPeriod('ytdm');
      const rankvolatilite = calculateRankForPeriod('volatility3an');
      const ranksharpe = calculateRankForPeriod('ratiosharpe3an');
      const rankdsr = calculateRankForPeriod('dsr3an');
      const rankomega = calculateRankForPeriod('omega3an');
      const ranksortino = calculateRankForPeriod('sortino3an');
      const rankbetabaissier = calculateRankForPeriod('betabaissier3an');
      const rankvar95 = calculateRankForPeriod('var953an');
      const rankcalamar = calculateRankForPeriod('calamar3an');
      const rankinfo = calculateRankForPeriod('info3an');
      const rankpertemax = calculateRankForPeriod('pertemax3an');

      // Étape 4 : Envoyer la réponse JSON
      return {
        code: 200,
        data: {
          rank3Mois: rank3Mois[0],
          rank6Mois: rank6Mois[0],
          rank1An: rank1An[0],
          rank3Ans: rank3Ans[0],
          rank5Ans: rank5Ans[0],
          rank1erJanvier: rank1erJanvier[0],
          rank3Moistotal: rank3Mois[1],
          rank6Moistotal: rank6Mois[1],
          rank1Antotal: rank1An[1],
          rank3Anstotal: rank3Ans[1],
          rank5Anstotal: rank5Ans[1],
          rank1erJanviertotal: rank1erJanvier[1],
          rank3Moism: rank3Moism[0],
          rank6Moism: rank6Moism[0],
          rank1Anm: rank1Anm[0],
          rank3Ansm: rank3Ansm[0],
          rank5Ansm: rank5Ansm[0],
          rank1erJanvierm: rank1erJanvierm[0],
          rank3Moistotalm: rank3Moism[1],
          rank6Moistotalm: rank6Moism[1],
          rank1Antotalm: rank1Anm[1],
          rank3Anstotalm: rank3Ansm[1],
          rank5Anstotalm: rank5Ansm[1],
          rank1erJanviertotalm: rank1erJanvierm[1],
          rankvolatilite: rankvolatilite[0],
          ranksharpe: ranksharpe[0],
          rankdsr: rankdsr[0],
          rankomega: rankomega[0],
          ranksortino: ranksortino[0],
          rankbetabaissier: rankbetabaissier[0],
          rankvar95: rankvar95[0],
          rankcalamar: rankcalamar[0],
          rankinfo: rankinfo[0],
          rankpertemax: rankpertemax[0],
          rankvolatilitetotal: rankvolatilite[1],
          ranksharpetotal: ranksharpe[1],
          rankdsrtotal: rankdsr[1],
          rankomegatotal: rankomega[1],
          ranksortinototal: ranksortino[1],
          rankbetabaissiertotal: rankbetabaissier[1],
          rankvar95total: rankvar95[1],
          rankcalamartotal: rankcalamar[1],
          rankinfototal: rankinfo[1],
          rankpertemaxtotal: rankpertemax[1],
          ranktotal: fundsWithPerformance.length,
          category: selectedFundCategory,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      return { error: 'Erreur lors de la récupération des données.' };
    }
  }

  async function calculateRankdev(category, fundId, devise) {
    try {
      const selectedFundId = fundId;
      const selectedFundCategory = category;
      let fundsWithPerformance;

      if (devise == "EUR") {
        // Étape 1 : Récupérer toutes les performances pour la catégorie spécifiée
        fundsWithPerformance = await performences_eurs.findAll({
          where: { categorie_nationale: selectedFundCategory },
          attributes: ['fond_id', 'perf3m', 'perf6m', 'perf1an', 'perf3ans', 'perf5ans', 'ytd'],
          order: [['fond_id', 'DESC']], // Choisissez la colonne de tri et l'ordre en fonction de vos besoins
        });
      } else {
        // Étape 1 : Récupérer toutes les performances pour la catégorie spécifiée
        fundsWithPerformance = await performences_usds.findAll({
          where: { categorie_nationale: selectedFundCategory },
          attributes: ['fond_id', 'perf3m', 'perf6m', 'perf1an', 'perf3ans', 'perf5ans', 'ytd'],
          order: [['fond_id', 'DESC']], // Choisissez la colonne de tri et l'ordre en fonction de vos besoins
        });
      }
      // Étape 2 : Trouver les performances du fond sélectionné
      const selectedFund = fundsWithPerformance.find((fund) => fund.fond_id === selectedFundId);

      if (!selectedFund) {
        return { error: 'Fond non trouvé.' };
      }

      // Étape 3 : Calculer les rangs pour chaque période de performance
      const calculateRankForPeriod = (period) => {
        // Filtrer les performances non valides pour le champ spécifique
        const validPerformances = fundsWithPerformance.filter((fund) =>
          fund[period] !== null && fund[period] != "-"
        );

        // Si toutes les performances pour ce champ sont invalides, retourner null
        if (validPerformances.length === 0) {
          return null;
        }
        const rantotal = validPerformances.length;
        // Sinon, effectuer le classement
        validPerformances.sort((a, b) => b[period] - a[period]);
        const rank = validPerformances.findIndex((fund) => fund.fond_id === selectedFundId) + 1;
        return [rank, rantotal];
      };

      const rank3Mois = calculateRankForPeriod('perf3m');
      const rank6Mois = calculateRankForPeriod('perf6m');
      const rank1An = calculateRankForPeriod('perf1an');
      const rank3Ans = calculateRankForPeriod('perf3ans');
      const rank5Ans = calculateRankForPeriod('perf5ans');
      const rank1erJanvier = calculateRankForPeriod('ytd');


      // Étape 4 : Envoyer la réponse JSON
      return {
        code: 200,
        data: {
          rank3Mois: rank3Mois[0],
          rank6Mois: rank6Mois[0],
          rank1An: rank1An[0],
          rank3Ans: rank3Ans[0],
          rank5Ans: rank5Ans[0],
          rank1erJanvier: rank1erJanvier[0],
          rank3Moistotal: rank3Mois[1],
          rank6Moistotal: rank6Mois[1],
          rank1Antotal: rank1An[1],
          rank3Anstotal: rank3Ans[1],
          rank5Anstotal: rank5Ans[1],
          rank1erJanviertotal: rank1erJanvier[1],
          ranktotal: fundsWithPerformance.length,
          category: selectedFundCategory,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      return { error: 'Erreur lors de la récupération des données.' };
    }
  }

  /**
  * Fonction asynchrone pour calculer le classement d'un fond dans une catégorie régionale spécifique.
  *
  * @param {string} category - Catégorie régionale du fond.
  * @param {number} fundId - ID du fond.
  * @returns {Object} - Résultat du calcul du classement régional.
  */
  async function calculateRankregionalmysql(category, fundId, datedebut) {
    try {
      const selectedFundId = fundId;
      const selectedFundCategory = category;

      const fundsWithPerformance = await sequelize.query(`
       SELECT 
        p1.fond_id, 
        p1.perf3m, 
        p1.perf6m, 
        p1.perf1an, 
        p1.perf3ans, 
        p1.perf5ans, 
        p1.ytd
      FROM performences p1
      
        WHERE date= :datedebut  and  categorie_regionale = :selectedFundCategory

        GROUP BY fond_id
    `, {
        replacements: { selectedFundCategory, datedebut },
        type: sequelize.QueryTypes.SELECT,
      });

      // Étape 2 : Trouver les performances du fond sélectionné
      const selectedFund = fundsWithPerformance.find((fund) => fund.fond_id === selectedFundId);

      if (!selectedFund) {
        return { error: 'Fond non trouvé.' };
      }

      // Étape 3 : Calculer les rangs pour chaque période de performance
      const calculateRankForPeriod = (period) => {
        // Filtrer les performances non valides pour le champ spécifique
        const validPerformances = fundsWithPerformance.filter((fund) =>
          fund[period] !== null && fund[period] != "-"
        );

        // Si toutes les performances pour ce champ sont invalides, retourner null
        if (validPerformances.length === 0) {
          return null;
        }
        const rantotal = validPerformances.length;
        // Sinon, effectuer le classement
        validPerformances.sort((a, b) => b[period] - a[period]);
        const rank = validPerformances.findIndex((fund) => fund.fond_id === selectedFundId) + 1;
        return [rank, rantotal];
      };

      const rank3Mois = calculateRankForPeriod('perf3m');
      const rank6Mois = calculateRankForPeriod('perf6m');
      const rank1An = calculateRankForPeriod('perf1an');
      const rank3Ans = calculateRankForPeriod('perf3ans');
      const rank5Ans = calculateRankForPeriod('perf5ans');
      const rank1erJanvier = calculateRankForPeriod('ytd');


      // Étape 4 : Envoyer la réponse JSON
      return {
        code: 200,
        data: {
          rank3Mois: rank3Mois[0],
          rank6Mois: rank6Mois[0],
          rank1An: rank1An[0],
          rank3Ans: rank3Ans[0],
          rank5Ans: rank5Ans[0],
          rank1erJanvier: rank1erJanvier[0],
          rank3Moistotal: rank3Mois[1],
          rank6Moistotal: rank6Mois[1],
          rank1Antotal: rank1An[1],
          rank3Anstotal: rank3Ans[1],
          rank5Anstotal: rank5Ans[1],
          rank1erJanviertotal: rank1erJanvier[1],
          ranktotal: fundsWithPerformance.length,
          category: selectedFundCategory,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      return { error: 'Erreur lors de la récupération des données.' };
    }
  }

  async function calculateRankregionaldev(category, fundId, devise) {
    try {
      const selectedFundId = fundId;
      const selectedFundCategory = category;
      let fundsWithPerformance;

      if (devise == "EUR") {
        // Étape 1 : Récupérer toutes les performances pour la catégorie spécifiée
        fundsWithPerformance = await performences_eurs.findAll({
          where: { categorie_regionale: selectedFundCategory },
          attributes: ['fond_id', 'perf3m', 'perf6m', 'perf1an', 'perf3ans', 'perf5ans', 'ytd'],
          order: [['fond_id', 'DESC']], // Choisissez la colonne de tri et l'ordre en fonction de vos besoins
        });
      } else {
        // Étape 1 : Récupérer toutes les performances pour la catégorie spécifiée
        fundsWithPerformance = await performences_usds.findAll({
          where: { categorie_nationale: selectedFundCategory },
          attributes: ['fond_id', 'perf3m', 'perf6m', 'perf1an', 'perf3ans', 'perf5ans', 'ytd'],
          order: [['fond_id', 'DESC']], // Choisissez la colonne de tri et l'ordre en fonction de vos besoins
        });
      }


      // Étape 2 : Trouver les performances du fond sélectionné
      const selectedFund = fundsWithPerformance.find((fund) => fund.fond_id === selectedFundId);

      if (!selectedFund) {
        return { error: 'Fond non trouvé.' };
      }

      // Étape 3 : Calculer les rangs pour chaque période de performance
      const calculateRankForPeriod = (period) => {
        // Filtrer les performances non valides pour le champ spécifique
        const validPerformances = fundsWithPerformance.filter((fund) =>
          fund[period] !== null && fund[period] != "-"
        );

        // Si toutes les performances pour ce champ sont invalides, retourner null
        if (validPerformances.length === 0) {
          return null;
        }
        const rantotal = validPerformances.length;
        // Sinon, effectuer le classement
        validPerformances.sort((a, b) => b[period] - a[period]);
        const rank = validPerformances.findIndex((fund) => fund.fond_id === selectedFundId) + 1;
        return [rank, rantotal];
      };

      const rank3Mois = calculateRankForPeriod('perf3m');
      const rank6Mois = calculateRankForPeriod('perf6m');
      const rank1An = calculateRankForPeriod('perf1an');
      const rank3Ans = calculateRankForPeriod('perf3ans');
      const rank5Ans = calculateRankForPeriod('perf5ans');
      const rank1erJanvier = calculateRankForPeriod('ytd');


      // Étape 4 : Envoyer la réponse JSON
      return {
        code: 200,
        data: {
          rank3Mois: rank3Mois[0],
          rank6Mois: rank6Mois[0],
          rank1An: rank1An[0],
          rank3Ans: rank3Ans[0],
          rank5Ans: rank5Ans[0],
          rank1erJanvier: rank1erJanvier[0],
          rank3Moistotal: rank3Mois[1],
          rank6Moistotal: rank6Mois[1],
          rank1Antotal: rank1An[1],
          rank3Anstotal: rank3Ans[1],
          rank5Anstotal: rank5Ans[1],
          rank1erJanviertotal: rank1erJanvier[1],
          ranktotal: fundsWithPerformance.length,
          category: selectedFundCategory,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      return { error: 'Erreur lors de la récupération des données.' };
    }
  }

  async function calculateRank(category, fundId, datedebut) {
    try {
        const selectedFundId = fundId;
        const selectedFundCategory = category;

        const performanceQuery = {
          query: `
              SELECT 
        fond_id, 
        perfveille, perf3m, perf6m, perf1an, perf3ans, perf5ans, ytd,
        perfveillem, perf3mm, perf6mm, perf1anm, perf3ansm, perf5ansm, ytdm,
        volatility3an, ratiosharpe3an, pertemax3an, sortino3an, info3an, 
        calamar3an, var953an, betabaissier3an, omega3an, dsr3an
    FROM performences
    WHERE date = '${datedebut}' AND categorie_nationale = '${selectedFundCategory}' 
              `,
          clickhouse_settings: {
              // Optional settings can be added here
          },
      };

      const fundsWithPerformance = await clickhouse.query(performanceQuery)
      .then(async (resultSet) => {
          // Conversion du ResultSet en JSON
          const data = await resultSet.json(); // Assurez-vous que c'est au format JSON
          console.log('Funds with Performance:', data);
          return data.data; // Retourne les données JSON
      })
      .catch(error => {
          console.error('Error querying performances:', error);
      });

        // Étape 2 : Trouver les performances du fond sélectionné
        const selectedFund = fundsWithPerformance.find(fund => fund.fond_id === selectedFundId);

        if (!selectedFund) {
            return { error: 'Fond non trouvé.' };
        }

        // Étape 3 : Calcul des rangs
        const calculateRankForPeriod = (period) => {
            const validPerformances = fundsWithPerformance.filter(fund =>
                fund[period] != null && fund[period] !== "-"
            );

            if (validPerformances.length === 0) {
                return null;
            }

            validPerformances.sort((a, b) => {
                if (period === 'pertemax3an' || period === 'calamar3an') {
                    return a[period] - b[period]; // Plus proche de zéro est meilleur
                }
                return b[period] - a[period]; // Plus haut est meilleur
            });

            const rank = validPerformances.findIndex(fund => fund.fond_id === selectedFundId) + 1;
            return [rank, validPerformances.length];
        };

        const rankResults = {
            rank3Mois: calculateRankForPeriod('perf3m'),
            rank6Mois: calculateRankForPeriod('perf6m'),
            rank1An: calculateRankForPeriod('perf1an'),
            rank3Ans: calculateRankForPeriod('perf3ans'),
            rank5Ans: calculateRankForPeriod('perf5ans'),
            rank1erJanvier: calculateRankForPeriod('ytd'),
            rank3Moism: calculateRankForPeriod('perf3mm'),
            rank6Moism: calculateRankForPeriod('perf6mm'),
            rank1Anm: calculateRankForPeriod('perf1anm'),
            rank3Ansm: calculateRankForPeriod('perf3ansm'),
            rank5Ansm: calculateRankForPeriod('perf5ansm'),
            rank1erJanvierm: calculateRankForPeriod('ytdm'),
            rankvolatilite: calculateRankForPeriod('volatility3an'),
            ranksharpe: calculateRankForPeriod('ratiosharpe3an'),
            rankdsr: calculateRankForPeriod('dsr3an'),
            rankomega: calculateRankForPeriod('omega3an'),
            ranksortino: calculateRankForPeriod('sortino3an'),
            rankbetabaissier: calculateRankForPeriod('betabaissier3an'),
            rankvar95: calculateRankForPeriod('var953an'),
            rankcalamar: calculateRankForPeriod('calamar3an'),
            rankinfo: calculateRankForPeriod('info3an'),
            rankpertemax: calculateRankForPeriod('pertemax3an'),
            ranktotal: fundsWithPerformance.length
        };

        return {
            code: 200,
            data: rankResults
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        return { error: 'Erreur lors de la récupération des données.' };
    }
}

async function calculateRankregional(category, fundId, datedebut) {
  try {
      const selectedFundId = fundId;
      const selectedFundCategory = category;

     const performanceQuery = {
          query: `
          SELECT 
              fond_id, 
              perf3m, perf6m, perf1an, perf3ans, perf5ans, ytd
          FROM performances
          WHERE date = '${datedebut}' AND categorie_regionale = '${selectedFundCategory}'
          
      ` ,
      clickhouse_settings: {
          // Optional settings can be added here
      },
  };

      const fundsWithPerformance = await clickhouse.query(performanceQuery)
      .then(async (resultSet) => {
          // Conversion du ResultSet en JSON
          const data = await resultSet.json(); // Assurez-vous que c'est au format JSON
          console.log('Funds with Performance:', data);
          return data.data; // Retourne les données JSON
      })
      .catch(error => {
          console.error('Error querying performances:', error);
      });

      const selectedFund = fundsWithPerformance.find(fund => fund.fond_id === selectedFundId);

      if (!selectedFund) {
          return { error: 'Fond non trouvé.' };
      }

      const rankResults = {
          rank3Mois: calculateRankForPeriod('perf3m'),
          rank6Mois: calculateRankForPeriod('perf6m'),
          rank1An: calculateRankForPeriod('perf1an'),
          rank3Ans: calculateRankForPeriod('perf3ans'),
          rank5Ans: calculateRankForPeriod('perf5ans'),
          rank1erJanvier: calculateRankForPeriod('ytd'),
          ranktotal: fundsWithPerformance.length
      };

      return {
          code: 200,
          data: rankResults
      };
  } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      return { error: 'Erreur lors de la récupération des données.' };
  }
}



router.get('/api/classementclickhouse', async (req, res) => {
  try {
    const queryParams = {
      query: 'TRUNCATE TABLE classementfonds', // Ensure this query is correct
      clickhouse_settings: { /* Optional settings */ },
      query_params: { /* Optional query parameters */ },
  };

  

    // Vider la table `classementfonds`
   await clickhouse.query(queryParams);
    const allFunds = await fetchFundsByValorisation([], 'undefined', 'undefined', 'undefined', '');

    for (const fund of allFunds) {
      const fundId = fund.id;
      const category = fund.categorie_national;
      const categorie_regionale = fund.categorie_regional;
      const categorie_libelle = fund.categorie_libelle;
      const datemoispre = fund.datemoispre;
      const datejour = fund.datejour;

      // Recherchez si le fond existe déjà dans la table `classementfonds`
      // Query for existing ranking
       // Query for existing ranking
    const existingRanking = await clickhouse.query({
      query: `
          SELECT * FROM classementfonds 
          WHERE fond_id = ${fundId} AND type_classement = 1 
          LIMIT 1
      `, // Directly inject parameters into the query
      clickhouse_settings: {
          // Optional settings can be added here
      }
  });

  // Query for existing regional ranking
  const existingRankingRegional = await clickhouse.query({
      query: `
          SELECT * FROM classementfonds 
          WHERE fond_id = ${fundId} AND type_classement = 2 
          LIMIT 1
      `, // Directly inject parameters into the query
      clickhouse_settings: {
          // Optional settings can be added here
      }
  });

      // Calculez les classements
      const rankingData = await calculateRank(category, fundId, datejour);
      const rankingDataRegional = await calculateRankregional(categorie_regionale, fundId, datejour);

      if (existingRanking) {
        // Mettre à jour le classement existant pour `type_classement` = 1
        await clickhouse.query(`
          ALTER TABLE classementfonds UPDATE
            rank3Mois = ${rankingData.data.rank3Mois},
            rank6Mois = ${rankingData.data.rank6Mois},
            rank1An = ${rankingData.data.rank1An},
            rank3Ans = ${rankingData.data.rank3Ans},
            rank5Ans = ${rankingData.data.rank5Ans},
            rank1erJanvier = ${rankingData.data.rank1erJanvier},
            rank3Moistotal = ${rankingData.data.rank3Moistotal},
            rank6Moistotal = ${rankingData.data.rank6Moistotal},
            rank1Antotal = ${rankingData.data.rank1Antotal},
            rank3Anstotal = ${rankingData.data.rank3Anstotal},
            rank5Anstotal = ${rankingData.data.rank5Anstotal},
            rank1erJanviertotal = ${rankingData.data.rank1erJanviertotal},
            rankvolatilite = ${rankingData.data.rankvolatilite},
            ranksharpe = ${rankingData.data.ranksharpe},
            rankcalamar = ${rankingData.data.rankcalamar},
            rankomega = ${rankingData.data.rankomega},
            rankdsr = ${rankingData.data.rankdsr},
            ranksortino = ${rankingData.data.ranksortino},
            rankvar95 = ${rankingData.data.rankvar95},
            rankbetabaissier = ${rankingData.data.rankbetabaissier},
            rankinfo = ${rankingData.data.rankinfo},
            rankpertemax = ${rankingData.data.rankpertemax}
          WHERE fond_id = ${fundId} AND type_classement = 1
        `).toPromise();
      } else {
        // Insérer un nouveau classement pour `type_classement` = 1
        if (rankingData && rankingData.code == 200) {
          await clickhouse.query(`
            INSERT INTO classementfonds (fond_id, categorie_nationale, type_classement, categorie_regionale, categorie, rank3Mois, rank6Mois, rank1An, rank3Ans, rank5Ans, rank1erJanvier, rank3Moistotal, rank6Moistotal, rank1Antotal, rank3Anstotal, rank5Anstotal, rank1erJanviertotal, rankvolatilite, ranksharpe, rankcalamar, rankomega, rankdsr, ranksortino, rankvar95, rankbetabaissier, rankinfo, rankpertemax)
            VALUES (${fundId}, '${category}', 1, '${categorie_regionale}', '${categorie_libelle}', ${rankingData.data.rank3Mois}, ${rankingData.data.rank6Mois}, ${rankingData.data.rank1An}, ${rankingData.data.rank3Ans}, ${rankingData.data.rank5Ans}, ${rankingData.data.rank1erJanvier}, ${rankingData.data.rank3Moistotal}, ${rankingData.data.rank6Moistotal}, ${rankingData.data.rank1Antotal}, ${rankingData.data.rank3Anstotal}, ${rankingData.data.rank5Anstotal}, ${rankingData.data.rank1erJanviertotal}, ${rankingData.data.rankvolatilite}, ${rankingData.data.ranksharpe}, ${rankingData.data.rankcalamar}, ${rankingData.data.rankomega}, ${rankingData.data.rankdsr}, ${rankingData.data.ranksortino}, ${rankingData.data.rankvar95}, ${rankingData.data.rankbetabaissier}, ${rankingData.data.rankinfo}, ${rankingData.data.rankpertemax})
          `).toPromise();
        }
      }

      if (existingRankingRegional) {
        // Mettre à jour le classement existant pour `type_classement` = 2
        await clickhouse.query(`
          ALTER TABLE classementfonds UPDATE
            rank3Mois = ${rankingDataRegional.data.rank3Mois},
            rank6Mois = ${rankingDataRegional.data.rank6Mois},
            rank1An = ${rankingDataRegional.data.rank1An},
            rank3Ans = ${rankingDataRegional.data.rank3Ans},
            rank5Ans = ${rankingDataRegional.data.rank5Ans},
            rank1erJanvier = ${rankingDataRegional.data.rank1erJanvier},
            rank3Moistotal = ${rankingDataRegional.data.rank3Moistotal},
            rank6Moistotal = ${rankingDataRegional.data.rank6Moistotal},
            rank1Antotal = ${rankingDataRegional.data.rank1Antotal},
            rank3Anstotal = ${rankingDataRegional.data.rank3Anstotal},
            rank5Anstotal = ${rankingDataRegional.data.rank5Anstotal},
            rank1erJanviertotal = ${rankingDataRegional.data.rank1erJanviertotal}
          WHERE fond_id = ${fundId} AND type_classement = 2
        `).toPromise();
      } else {
        // Insérer un nouveau classement pour `type_classement` = 2
        if (rankingDataRegional.code == 200) {
          await clickhouse.query(`
            INSERT INTO classementfonds (fond_id, categorie_nationale, type_classement, categorie_regionale, categorie, rank3Mois, rank6Mois, rank1An, rank3Ans, rank5Ans, rank1erJanvier, rank3Moistotal, rank6Moistotal, rank1Antotal, rank3Anstotal, rank5Anstotal, rank1erJanviertotal)
            VALUES (${fundId}, '${category}', 2, '${categorie_regionale}', '${categorie_libelle}', ${rankingDataRegional.data.rank3Mois}, ${rankingDataRegional.data.rank6Mois}, ${rankingDataRegional.data.rank1An}, ${rankingDataRegional.data.rank3Ans}, ${rankingDataRegional.data.rank5Ans}, ${rankingDataRegional.data.rank1erJanvier}, ${rankingDataRegional.data.rank3Moistotal}, ${rankingDataRegional.data.rank6Moistotal}, ${rankingDataRegional.data.rank1Antotal}, ${rankingDataRegional.data.rank3Anstotal}, ${rankingDataRegional.data.rank5Anstotal}, ${rankingDataRegional.data.rank1erJanviertotal})
          `).toPromise();
        }
      }
    }

    console.log("finishrank");
    res.json("finishrank");
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des classements' });
  }
});

  router.get('/api/classementmysql', async (req, res) => {
    try {
      await classementfonds.destroy({

        truncate: true
      });
      const allFunds = await fetchFundsByValorisation([], 'undefined', 'undefined', 'undefined', '');
      for (const fund of allFunds) {
        const fundId = fund.id;
        const category = fund.categorie_national;
        const categorie_regionale = fund.categorie_regional;
        const categorie_libelle = fund.categorie_libelle;
        const datemoispre = fund.datemoispre;
        const datejour = fund.datejour;

        // Vérifiez si le fond existe dans la table classementfond
        const existingRanking = await classementfonds.findOne({
          where: { fond_id: fundId, type_classement: 1 },
        });

        const existingRankingregional = await classementfonds.findOne({
          where: { fond_id: fundId, type_classement: 2 },
        });

        // Calculez le classement en fonction de la catégorie
        const rankingData = await calculateRankmysql(category, fundId, datejour);
        const rankingDataregional = await calculateRankregionalmysql(categorie_regionale, fundId, datejour);


        if (existingRanking) {
          // Le fond existe, mettez à jour son classement en fonction de la catégorie
          existingRanking.rank3Mois = rankingData.data.rank3Mois;
          existingRanking.rank6Mois = rankingData.data.rank6Mois;
          existingRanking.rank1An = rankingData.data.rank1An;
          existingRanking.rank3Ans = rankingData.data.rank3Ans;
          existingRanking.rank5Ans = rankingData.data.rank5Ans;
          existingRanking.rank1erJanvier = rankingData.data.rank1erJanvier;
          existingRanking.rank3Moistotal = rankingData.data.rank3Moistotal;
          existingRanking.rank6Moistotal = rankingData.data.rank6Moistotal;
          existingRanking.rank1Antotal = rankingData.data.rank1Antotal;
          existingRanking.rank3Anstotal = rankingData.data.rank3Anstotal;
          existingRanking.rank5Anstotal = rankingData.data.rank5Anstotal;
          existingRanking.rank1erJanviertotal = rankingData.data.rank1erJanviertotal;

          existingRanking.rank3Moism = rankingData.data.rank3Moism;
          existingRanking.rank6Moism = rankingData.data.rank6Moism;
          existingRanking.rank1Anm = rankingData.data.rank1Anm;
          existingRanking.rank3Ansm = rankingData.data.rank3Ansm;
          existingRanking.rank5Ansm = rankingData.data.rank5Ansm;
          existingRanking.rank1erJanvierm = rankingData.data.rank1erJanvierm;
          existingRanking.rank3Moistotalm = rankingData.data.rank3Moistotalm;
          existingRanking.rank6Moistotalm = rankingData.data.rank6Moistotalm;
          existingRanking.rank1Antotalm = rankingData.data.rank1Antotalm;
          existingRanking.rank3Anstotalm = rankingData.data.rank3Anstotalm;
          existingRanking.rank5Anstotalm = rankingData.data.rank5Anstotalm;
          existingRanking.rank1erJanviertotalm = rankingData.data.rank1erJanviertotalm;

          existingRanking.rankvolatilite = rankingData.data.rankvolatilite;
          existingRanking.ranksharpe = rankingData.data.ranksharpe;
          existingRanking.rankcalamar = rankingData.data.rankcalamar;
          existingRanking.rankomega = rankingData.data.rankomega;
          existingRanking.rankdsr = rankingData.data.rankdsr;
          existingRanking.ranksortino = rankingData.data.ranksortino;
          existingRanking.rankvar95 = rankingData.data.rankvar95;
          existingRanking.rankbetabaissier = rankingData.data.rankbetabaissier;
          existingRanking.rankinfo = rankingData.data.rankinfo;
          existingRanking.rankpertemax = rankingData.data.rankpertemax;
          existingRanking.rankvolatilitetotal = rankingData.data.rankvolatilitetotal;
          existingRanking.ranksharpetotal = rankingData.data.ranksharpetotal;
          existingRanking.rankcalamartotal = rankingData.data.rankcalamartotal;
          existingRanking.rankomegatotal = rankingData.data.rankomegatotal;
          existingRanking.rankdsrtotal = rankingData.data.rankdsrtotal;
          existingRanking.ranksortinototal = rankingData.data.ranksortinototal;
          existingRanking.rankvar95total = rankingData.data.rankvar95total;
          existingRanking.rankbetabaissiertotal = rankingData.data.rankbetabaissiertotal;
          existingRanking.rankinfototal = rankingData.data.rankinfototal;
          existingRanking.rankpertemaxtotal = rankingData.data.rankpertemaxtotal;
          existingRanking.type_classement = 1;
          await existingRanking.save();
        } else {
          // Le fond n'existe pas, créez une nouvelle entrée dans la table classementfond
          if (rankingData && rankingData.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 1,
              categorie_regionale: categorie_regionale,
              categorie: categorie_libelle,
              rank3Mois: rankingData.data.rank3Mois,
              rank6Mois: rankingData.data.rank6Mois,
              rank1An: rankingData.data.rank1An,
              rank3Ans: rankingData.data.rank3Ans,
              rank5Ans: rankingData.data.rank5Ans,
              rank1erJanvier: rankingData.data.rank1erJanvier,
              rank3Moistotal: rankingData.data.rank3Moistotal,
              rank6Moistotal: rankingData.data.rank6Moistotal,
              rank1Antotal: rankingData.data.rank1Antotal,
              rank3Anstotal: rankingData.data.rank3Anstotal,
              rank5Anstotal: rankingData.data.rank5Anstotal,
              rank1erJanviertotal: rankingData.data.rank1erJanviertotal,

              rank3Moism: rankingData.data.rank3Moism,
              rank6Moism: rankingData.data.rank6Moism,
              rank1Anm: rankingData.data.rank1Anm,
              rank3Ansm: rankingData.data.rank3Ansm,
              rank5Ansm: rankingData.data.rank5Ansm,
              rank1erJanvierm: rankingData.data.rank1erJanvierm,
              rank3Moistotalm: rankingData.data.rank3Moistotalm,
              rank6Moistotalm: rankingData.data.rank6Moistotalm,
              rank1Antotalm: rankingData.data.rank1Antotalm,
              rank3Anstotalm: rankingData.data.rank3Anstotalm,
              rank5Anstotalm: rankingData.data.rank5Anstotalm,
              rank1erJanviertotalm: rankingData.data.rank1erJanviertotalm,

              rankvolatilite: rankingData.data.rankvolatilite,
              ranksharpe: rankingData.data.ranksharpe,
              rankcalamar: rankingData.data.rankcalamar,
              rankomega: rankingData.data.rankomega,
              rankdsr: rankingData.data.rankdsr,
              ranksortino: rankingData.data.ranksortino,
              rankvar95: rankingData.data.rankvar95,
              rankbetabaissier: rankingData.data.rankbetabaissier,
              rankinfo: rankingData.data.rankinfo,
              rankpertemax: rankingData.data.rankpertemax,
              rankvolatilitetotal: rankingData.data.rankvolatilitetotal,
              ranksharpetotal: rankingData.data.ranksharpetotal,
              rankcalamartotal: rankingData.data.rankcalamartotal,
              rankomegatotal: rankingData.data.rankomegatotal,
              rankdsrtotal: rankingData.data.rankdsrtotal,
              ranksortinototal: rankingData.data.ranksortinototal,
              rankvar95total: rankingData.data.rankvar95total,
              rankbetabaissiertotal: rankingData.data.rankbetabaissiertotal,
              rankinfototal: rankingData.data.rankinfototal,
              rankpertemaxtotal: rankingData.data.rankpertemaxtotal
            });
        }

        if (existingRankingregional) {
          // Le fond existe, mettez à jour son classement en fonction de la catégorie
          existingRankingregional.rank3Mois = rankingDataregional.data.rank3Mois;
          existingRankingregional.rank6Mois = rankingDataregional.data.rank6Mois;
          existingRankingregional.rank1An = rankingDataregional.data.rank1An;
          existingRankingregional.rank3Ans = rankingDataregional.data.rank3Ans;
          existingRankingregional.rank5Ans = rankingDataregional.data.rank5Ans;
          existingRankingregional.rank1erJanvier = rankingDataregional.data.rank1erJanvier;
          existingRankingregional.rank1erJanvier = rankingDataregional.data.rank1erJanvier;
          existingRankingregional.rank3Moistotal = rankingDataregional.data.rank3Moistotal;
          existingRankingregional.rank6Moistotal = rankingDataregional.data.rank6Moistotal;
          existingRankingregional.rank1Antotal = rankingDataregional.data.rank1Antotal;
          existingRankingregional.rank3Anstotal = rankingDataregional.data.rank3Anstotal;
          existingRankingregional.rank5Anstotal = rankingDataregional.data.rank5Anstotal;
          existingRankingregional.rank1erJanviertotal = rankingDataregional.data.rank1erJanviertotal;
          existingRankingregional.type_classement = 1;
          await existingRankingregional.save();
        } else {

          // Le fond n'existe pas, créez une nouvelle entrée dans la table classementfond
          if (rankingDataregional.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 2,
              categorie_regionale: categorie_regionale,
              categorie: categorie_libelle,
              rank3Mois: rankingDataregional.data.rank3Mois,
              rank6Mois: rankingDataregional.data.rank6Mois,
              rank1An: rankingDataregional.data.rank1An,
              rank3Ans: rankingDataregional.data.rank3Ans,
              rank5Ans: rankingDataregional.data.rank5Ans,
              rank1erJanvier: rankingDataregional.data.rank1erJanvier,
              rank3Moistotal: rankingDataregional.data.rank3Moistotal,
              rank6Moistotal: rankingDataregional.data.rank6Moistotal,
              rank1Antotal: rankingDataregional.data.rank1Antotal,
              rank3Anstotal: rankingDataregional.data.rank3Anstotal,
              rank5Anstotal: rankingDataregional.data.rank5Anstotal,
              rank1erJanviertotal: rankingDataregional.data.rank1erJanviertotal,
            });
        }
      }
      console.log("finishrank");
      res.json("finishrank");
    } catch (error) {
      console.error('Une erreur s\'est produite :', error);
    }
  });

  router.get('/api/classementeur', async (req, res) => {
    try {
      await classementfonds_eurs.destroy({

        truncate: true
      });
      const allFunds = await fetchFundsByValorisation([], 'undefined', 'undefined', 'undefined', '');
      for (const fund of allFunds) {
        const fundId = fund.id;
        const category = fund.categorie_national;
        const categorie_regionale = fund.categorie_regional;
        const categorie_libelle = fund.categorie_libelle;

        // Vérifiez si le fond existe dans la table classementfond
        const existingRanking = await classementfonds_eurs.findOne({
          where: { fond_id: fundId, type_classement: 1 },
        });

        const existingRankingregional = await classementfonds_eurs.findOne({
          where: { fond_id: fundId, type_classement: 2 },
        });

        // Calculez le classement en fonction de la catégorie
        const rankingData = await calculateRankdev(category, fundId, "EUR");
        const rankingDataregional = await calculateRankregionaldev(categorie_regionale, fundId, "EUR");


        if (existingRanking) {
          // Le fond existe, mettez à jour son classement en fonction de la catégorie
          existingRanking.rank3Mois = rankingData.data.rank3Mois;
          existingRanking.rank6Mois = rankingData.data.rank6Mois;
          existingRanking.rank1An = rankingData.data.rank1An;
          existingRanking.rank3Ans = rankingData.data.rank3Ans;
          existingRanking.rank5Ans = rankingData.data.rank5Ans;
          existingRanking.rank1erJanvier = rankingData.data.rank1erJanvier;
          existingRanking.rank1erJanvier = rankingData.data.rank1erJanvier;
          existingRanking.rank3Moistotal = rankingData.data.rank3Moistotal;
          existingRanking.rank6Moistotal = rankingData.data.rank6Moistotal;
          existingRanking.rank1Antotal = rankingData.data.rank1Antotal;
          existingRanking.rank3Anstotal = rankingData.data.rank3Anstotal;
          existingRanking.rank5Anstotal = rankingData.data.rank5Anstotal;
          existingRanking.rank1erJanviertotal = rankingData.data.rank1erJanviertotal;
          existingRanking.type_classement = 1;
          await existingRanking.save();
        } else {
          // Le fond n'existe pas, créez une nouvelle entrée dans la table classementfond
          if (rankingData.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 1,
              categorie_regionale: categorie_regionale,
              categorie: categorie_libelle,
              rank3Mois: rankingData.data.rank3Mois,
              rank6Mois: rankingData.data.rank6Mois,
              rank1An: rankingData.data.rank1An,
              rank3Ans: rankingData.data.rank3Ans,
              rank5Ans: rankingData.data.rank5Ans,
              rank1erJanvier: rankingData.data.rank1erJanvier,
              rank3Moistotal: rankingData.data.rank3Moistotal,
              rank6Moistotal: rankingData.data.rank6Moistotal,
              rank1Antotal: rankingData.data.rank1Antotal,
              rank3Anstotal: rankingData.data.rank3Anstotal,
              rank5Anstotal: rankingData.data.rank5Anstotal,
              rank1erJanviertotal: rankingData.data.rank1erJanviertotal,
            });
        }

        if (existingRankingregional) {
          // Le fond existe, mettez à jour son classement en fonction de la catégorie
          existingRankingregional.rank3Mois = rankingDataregional.data.rank3Mois;
          existingRankingregional.rank6Mois = rankingDataregional.data.rank6Mois;
          existingRankingregional.rank1An = rankingDataregional.data.rank1An;
          existingRankingregional.rank3Ans = rankingDataregional.data.rank3Ans;
          existingRankingregional.rank5Ans = rankingDataregional.data.rank5Ans;
          existingRankingregional.rank1erJanvier = rankingDataregional.data.rank1erJanvier;
          existingRankingregional.rank1erJanvier = rankingDataregional.data.rank1erJanvier;
          existingRankingregional.rank3Moistotal = rankingDataregional.data.rank3Moistotal;
          existingRankingregional.rank6Moistotal = rankingDataregional.data.rank6Moistotal;
          existingRankingregional.rank1Antotal = rankingDataregional.data.rank1Antotal;
          existingRankingregional.rank3Anstotal = rankingDataregional.data.rank3Anstotal;
          existingRankingregional.rank5Anstotal = rankingDataregional.data.rank5Anstotal;
          existingRankingregional.rank1erJanviertotal = rankingDataregional.data.rank1erJanviertotal;
          existingRankingregional.type_classement = 1;
          await existingRankingregional.save();
        } else {

          // Le fond n'existe pas, créez une nouvelle entrée dans la table classementfond
          if (rankingDataregional.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 2,
              categorie_regionale: categorie_regionale,
              categorie: categorie_libelle,
              rank3Mois: rankingDataregional.data.rank3Mois,
              rank6Mois: rankingDataregional.data.rank6Mois,
              rank1An: rankingDataregional.data.rank1An,
              rank3Ans: rankingDataregional.data.rank3Ans,
              rank5Ans: rankingDataregional.data.rank5Ans,
              rank1erJanvier: rankingDataregional.data.rank1erJanvier,
              rank3Moistotal: rankingDataregional.data.rank3Moistotal,
              rank6Moistotal: rankingDataregional.data.rank6Moistotal,
              rank1Antotal: rankingDataregional.data.rank1Antotal,
              rank3Anstotal: rankingDataregional.data.rank3Anstotal,
              rank5Anstotal: rankingDataregional.data.rank5Anstotal,
              rank1erJanviertotal: rankingDataregional.data.rank1erJanviertotal,
            });
        }
      }
      console.log("finishrank");
      res.json("finishrank");
    } catch (error) {
      console.error('Une erreur s\'est produite :', error);
    }
  });

  router.get('/api/classementusd', async (req, res) => {
    try {
      await classementfonds_usds.destroy({

        truncate: true
      });
      const allFunds = await fetchFundsByValorisation([], 'undefined', 'undefined', 'undefined', '');
      for (const fund of allFunds) {
        const fundId = fund.id;
        const category = fund.categorie_national;
        const categorie_regionale = fund.categorie_regional;
        const categorie_libelle = fund.categorie_libelle;

        // Vérifiez si le fond existe dans la table classementfond
        const existingRanking = await classementfonds_usds.findOne({
          where: { fond_id: fundId, type_classement: 1 },
        });

        const existingRankingregional = await classementfonds_usds.findOne({
          where: { fond_id: fundId, type_classement: 2 },
        });

        // Calculez le classement en fonction de la catégorie
        const rankingData = await calculateRankdev(category, fundId, "USD");
        const rankingDataregional = await calculateRankregionaldev(categorie_regionale, fundId, "USD");


        if (existingRanking) {
          // Le fond existe, mettez à jour son classement en fonction de la catégorie
          existingRanking.rank3Mois = rankingData.data.rank3Mois;
          existingRanking.rank6Mois = rankingData.data.rank6Mois;
          existingRanking.rank1An = rankingData.data.rank1An;
          existingRanking.rank3Ans = rankingData.data.rank3Ans;
          existingRanking.rank5Ans = rankingData.data.rank5Ans;
          existingRanking.rank1erJanvier = rankingData.data.rank1erJanvier;
          existingRanking.rank1erJanvier = rankingData.data.rank1erJanvier;
          existingRanking.rank3Moistotal = rankingData.data.rank3Moistotal;
          existingRanking.rank6Moistotal = rankingData.data.rank6Moistotal;
          existingRanking.rank1Antotal = rankingData.data.rank1Antotal;
          existingRanking.rank3Anstotal = rankingData.data.rank3Anstotal;
          existingRanking.rank5Anstotal = rankingData.data.rank5Anstotal;
          existingRanking.rank1erJanviertotal = rankingData.data.rank1erJanviertotal;
          existingRanking.type_classement = 1;
          await existingRanking.save();
        } else {
          // Le fond n'existe pas, créez une nouvelle entrée dans la table classementfond
          if (rankingData.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 1,
              categorie_regionale: categorie_regionale,
              categorie: categorie_libelle,
              rank3Mois: rankingData.data.rank3Mois,
              rank6Mois: rankingData.data.rank6Mois,
              rank1An: rankingData.data.rank1An,
              rank3Ans: rankingData.data.rank3Ans,
              rank5Ans: rankingData.data.rank5Ans,
              rank1erJanvier: rankingData.data.rank1erJanvier,
              rank3Moistotal: rankingData.data.rank3Moistotal,
              rank6Moistotal: rankingData.data.rank6Moistotal,
              rank1Antotal: rankingData.data.rank1Antotal,
              rank3Anstotal: rankingData.data.rank3Anstotal,
              rank5Anstotal: rankingData.data.rank5Anstotal,
              rank1erJanviertotal: rankingData.data.rank1erJanviertotal,
            });
        }

        if (existingRankingregional) {
          // Le fond existe, mettez à jour son classement en fonction de la catégorie
          existingRankingregional.rank3Mois = rankingDataregional.data.rank3Mois;
          existingRankingregional.rank6Mois = rankingDataregional.data.rank6Mois;
          existingRankingregional.rank1An = rankingDataregional.data.rank1An;
          existingRankingregional.rank3Ans = rankingDataregional.data.rank3Ans;
          existingRankingregional.rank5Ans = rankingDataregional.data.rank5Ans;
          existingRankingregional.rank1erJanvier = rankingDataregional.data.rank1erJanvier;
          existingRankingregional.rank1erJanvier = rankingDataregional.data.rank1erJanvier;
          existingRankingregional.rank3Moistotal = rankingDataregional.data.rank3Moistotal;
          existingRankingregional.rank6Moistotal = rankingDataregional.data.rank6Moistotal;
          existingRankingregional.rank1Antotal = rankingDataregional.data.rank1Antotal;
          existingRankingregional.rank3Anstotal = rankingDataregional.data.rank3Anstotal;
          existingRankingregional.rank5Anstotal = rankingDataregional.data.rank5Anstotal;
          existingRankingregional.rank1erJanviertotal = rankingDataregional.data.rank1erJanviertotal;
          existingRankingregional.type_classement = 1;
          await existingRankingregional.save();
        } else {

          // Le fond n'existe pas, créez une nouvelle entrée dans la table classementfond
          if (rankingDataregional.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 2,
              categorie_regionale: categorie_regionale,
              categorie: categorie_libelle,
              rank3Mois: rankingDataregional.data.rank3Mois,
              rank6Mois: rankingDataregional.data.rank6Mois,
              rank1An: rankingDataregional.data.rank1An,
              rank3Ans: rankingDataregional.data.rank3Ans,
              rank5Ans: rankingDataregional.data.rank5Ans,
              rank1erJanvier: rankingDataregional.data.rank1erJanvier,
              rank3Moistotal: rankingDataregional.data.rank3Moistotal,
              rank6Moistotal: rankingDataregional.data.rank6Moistotal,
              rank1Antotal: rankingDataregional.data.rank1Antotal,
              rank3Anstotal: rankingDataregional.data.rank3Anstotal,
              rank5Anstotal: rankingDataregional.data.rank5Anstotal,
              rank1erJanviertotal: rankingDataregional.data.rank1erJanviertotal,
            });
        }
      }
      console.log("finishrank");
      res.json("finishrank");
    } catch (error) {
      console.error('Une erreur s\'est produite :', error);
    }
  });


  app.get('/api/killlimiter', async (req, res) => {
    limiter.stop();
    // Vider la file d'attente des tâches en cours
    // Déconnecter Bottleneck (vide la file d'attente)
    limiter.disconnect();      // Redémarrer la planification des tâches
  });
  app.get('/api/startlimiter/:max/:min', async (req, res) => {
    limiter = new Bottleneck({
      maxConcurrent: parseInt(req.params.max),
      minTime: parseInt(req.params.min)
    });
  });

  router.get('/api/saveperfdateclickhouse/:fond1/:fond2', async (req, res) => {
    try {

      const allFunds = await fetchFundsByValorisation1([], 'undefined', 'undefined', 'undefined', 'undefined', parseInt(req.params.fond1), parseInt(req.params.fond2));

      // Sequential processing using for loop with await
      /*for (const fund of allFunds) {
        try {
          await processFund(fund);
        } catch (error) {
          console.error('Error processing fund:', fund, error);
        }
      }*/
      // Ajouter les fonds à la file d'attente pour traitement
      // Définissez le nombre de travailleurs à utiliser

      /*  for (const fund of allFunds) {
          await limiter.schedule(async () => {
            await processFund(fund);
          });
        }*/
      limiter.stop();
      // Vider la file d'attente des tâches en cours
      // Déconnecter Bottleneck (vide la file d'attente)
      limiter.disconnect();      // Redémarrer la planification des tâches
      // Réinitialiser Bottleneck avec les configurations initiales
      limiter = new Bottleneck({
        maxConcurrent: 3,
        minTime: 250
      });
      const promises = allFunds.map(async (fund) => {
        try {
          // Attendre que Bottleneck autorise la requête
          await limiter.schedule(async () => {
            await processFund(fund);
          });
        } catch (error) {
          console.error('Erreur lors du traitement du fond:', fund, error);
        }
      });
      // Attendre la fin de toutes les promesses
      await Promise.all(promises);



      res.json("Traitement des fonds terminé avec succès");
    } catch (error) {
      console.error('Une erreur s\'est produite :', error);
      res.status(500).json({ error: 'Une erreur s\'est produite lors du traitement.' });
    }
  });

  router.get('/api/saveperfdatemysql/:fond1/:fond2', async (req, res) => {
    try {

      const allFunds = await fetchFundsByValorisation1([], 'undefined', 'undefined', 'undefined', 'undefined', parseInt(req.params.fond1), parseInt(req.params.fond2));

      // Sequential processing using for loop with await
      for (const fund of allFunds) {
        try {
          await processFundmysql(fund);
        } catch (error) {
          console.error('Error processing fund:', fund, error);
        }
      }
      // Ajouter les fonds à la file d'attente pour traitement
      // Définissez le nombre de travailleurs à utiliser

      /*  for (const fund of allFunds) {
          await limiter.schedule(async () => {
            await processFund(fund);
          });
        }*/
      // limiter.stop();
      // // Vider la file d'attente des tâches en cours
      // // Déconnecter Bottleneck (vide la file d'attente)
      // limiter.disconnect();      // Redémarrer la planification des tâches
      // // Réinitialiser Bottleneck avec les configurations initiales
      // limiter = new Bottleneck({
      //   maxConcurrent: 3,
      //   minTime: 250
      // });
      // const promises = allFunds.map(async (fund) => {
      //   try {
      //     // Attendre que Bottleneck autorise la requête
      //     await limiter.schedule(async () => {
      //       await processFundmysql(fund);
      //     });
      //   } catch (error) {
      //     console.error('Erreur lors du traitement du fond:', fund, error);
      //   }
      // });
      // // Attendre la fin de toutes les promesses
      // await Promise.all(promises);



      res.json("Traitement des fonds terminé avec succès");
    } catch (error) {
      console.error('Une erreur s\'est produite :', error);
      res.status(500).json({ error: 'Une erreur s\'est produite lors du traitement.' });
    }
  });


  async function processFund(fund) {
    const fundId = fund.id;
    const code_ISIN = fund.code_ISIN;
    const categorie_nationale = fund.categorie_national;
    const categorie_regionale = fund.categorie_regional;

    const allVlDates = await vl.findAll({
      attributes: ['date'],
      where: {
        fund_id: fundId, date: {
          [Op.gt]: '2023-12-31' // Sélectionner les dates supérieures à '2021-12-31'
        }
      }, // Condition where pour filtrer par fund_id
      order: [['date', 'DESC']] // Trier les dates en ordre chronologique
    });

    const yearsSinceValorisation = await anneevalorisation(fundId);
    const years = yearsSinceValorisation[0].annee;

    for (let i = 0; i < allVlDates.length; i++) {
      const currentDate = allVlDates[i].date;

      try {
        const performanceResponse = await fetch(`${urll}/api/performanceswithdate/fond/${fundId}/${currentDate}`);
        if (performanceResponse.status === 200) {
          const performanceData = await performanceResponse.json();

          const ratioData = await fetchRatioData(fundId, currentDate, years);
         // await upsertPerformance(fundId, code_ISIN, categorie_nationale, categorie_regionale, fund.dev_libelle, currentDate, performanceData.data, ratioData);
          await insertIntoClickHouse(fundId, code_ISIN, categorie_nationale,categorie_nationale, categorie_regionale, fund.dev_libelle, currentDate, performanceData.data, ratioData);

        } else {
          writeToLogFile(`Erreur lors de l'appel à l'API pour le fond avec l'ID ${fundId}`)
          console.error(`Erreur lors de l'appel à l'API pour le fond avec l'ID ${fundId}`);
        }
      } catch (error) {
        writeToLogFile(`Une erreur s'est produite lors du traitement du fond avec l'ID ${fundId} à la date ${currentDate}:`, error)
        console.error(`Une erreur s'est produite lors du traitement du fond avec l'ID ${fundId} à la date ${currentDate}:`, error);
        continue;
      }
    }

    writeToLogFile(`finish l'ID ${fundId}`);
  }

  async function processFundmysql(fund) {
    const fundId = fund.id;
    const code_ISIN = fund.code_ISIN;
    const categorie_nationale = fund.categorie_national;
    const categorie_regionale = fund.categorie_regional;
    const allVlDates = await vl.findAll({
      attributes: ['date'],
      where: {
        fund_id: fundId, 
        date: {
          [Op.gt]: '2024-07-31' //2024-07-31  Sélectionner les dates supérieures à '2023-12-31'
        }
      },
      order: [['date', 'DESC']] // Trier les dates en ordre décroissant
    });
    
    // Obtenir l'année de valorisation
    const yearsSinceValorisation = await anneevalorisation(fundId);
    const years = yearsSinceValorisation[0].annee;
    
    // Extraire les dates dans un tableau moment.js pour manipulation
    let allDates = allVlDates.map(vl => moment(vl.date, 'YYYY-MM-DD'));
    
    // Tableau pour stocker les dates manquantes
    let missingDates = [];
    
    // Initialiser la date la plus ancienne et la date actuelle (plus récente)
    let startDate = moment(allDates[allDates.length - 1]); // La date la plus ancienne
    let endDate = moment(allDates[0]); // La date la plus récente
    
    // Parcourir chaque jour entre startDate et endDate
    let currentDate = startDate.clone().add(1, 'days'); // Commencer après startDate pour ne pas l'inclure elle-même
    
    while (currentDate.isBefore(endDate)) {
      // Vérifier si le jour n'est pas un week-end (samedi ou dimanche)
      const dayOfWeek = currentDate.day();
      if (dayOfWeek !== 6 && dayOfWeek !== 0) { // 6 = samedi, 0 = dimanche
        // Vérifier si la date n'existe pas déjà dans allDates
        if (!allDates.some(date => date.isSame(currentDate, 'day'))) {
          // Ajouter la date manquante
          missingDates.push(currentDate.clone());
        }
      }
    
      // Passer au jour suivant
      currentDate.add(1, 'days');
    }
    
    // Combiner les dates existantes avec les dates manquantes
    let allDatesWithMissing = [...allDates, ...missingDates];
    
    // Trier le tableau combiné par ordre chronologique (du plus ancien au plus récent)
    allDatesWithMissing.sort((a, b) => b - a);

    for (let i = 0; i < allDatesWithMissing.length; i++) {
      const currentDate = allDatesWithMissing[i].format('YYYY-MM-DD');

      try {
        const performanceResponse = await fetch(`${urll}/api/performanceswithdate/fond/${fundId}/${currentDate}`);
        if (performanceResponse.status === 200) {
          const performanceData = await performanceResponse.json();

          const ratioData = await fetchRatioData(fundId, currentDate, years);
          await upsertPerformance(fundId, code_ISIN, categorie_nationale, categorie_regionale, fund.dev_libelle, currentDate, performanceData.data, ratioData);
         // await insertIntoClickHouse(fundId, code_ISIN, categorie_nationale,categorie_nationale, categorie_regionale, fund.dev_libelle, currentDate, performanceData.data, ratioData);

        } else {
          writeToLogFile(`Erreur lors de l'appel à l'API pour le fond avec l'ID ${fundId}`)
          console.error(`Erreur lors de l'appel à l'API pour le fond avec l'ID ${fundId}`);
        }
      } catch (error) {
        writeToLogFile(`Une erreur s'est produite lors du traitement du fond avec l'ID ${fundId} à la date ${currentDate}:`, error)
        console.error(`Une erreur s'est produite lors du traitement du fond avec l'ID ${fundId} à la date ${currentDate}:`, error);
        continue;
      }
    }

    writeToLogFile(`finish l'ID ${fundId}`);
  }

  async function fetchRatioData(fundId, currentDate, years) {
    const ratioData = {};

    if (years > 1) {
      const ratioResponse1an = await fetch(`${urll}/api/ratiosnewithdate/1/${fundId}/${currentDate}`);
      ratioData.data1an = await ratioResponse1an.json();
    }

    if (years > 3) {
      const ratioResponse3ans = await fetch(`${urll}/api/ratiosnewithdate/3/${fundId}/${currentDate}`);
      ratioData.data3an = await ratioResponse3ans.json();
    }

    if (years > 5) {
      const ratioResponse5ans = await fetch(`${urll}/api/ratiosnewithdate/5/${fundId}/${currentDate}`);
      ratioData.data5an = await ratioResponse5ans.json();
    }

    return ratioData;
  }

  async function upsertPerformance(fundId, code_ISIN, categorie_nationale, categorie_regionale, devise, currentDate, performanceData, ratioData) {
    const existingperf = await performences.findOne({ where: { fond_id: fundId, date: currentDate } });

    if (existingperf) {
      Object.assign(existingperf, {
        ytd: performanceData.perf1erJanvier,
        perfveille: performanceData.perfVeille,
        perf1an: performanceData.perf1An,
        perf3ans: performanceData.perf3Ans,
        perf5ans: performanceData.perf5Ans,
        perf8ans: performanceData.perf8Ans,
        perf10ans: performanceData.perf10Ans,
        perf4s: performanceData.perf4Semaines,
        perf3m: performanceData.perf3Mois,
        perf6m: performanceData.perf6Mois,
        ytdm: performanceData.perf1erJanvierm,
        perfveillem: performanceData.perfVeillem,
        perf1anm: performanceData.perf1Anm,
        perf3ansm: performanceData.perf3Ansm,
        perf5ansm: performanceData.perf5Ansm,
        perf8ansm: performanceData.perf8Ansm,
        perf10ansm: performanceData.perf10Ansm,
        perf4sm: performanceData.perf4Semainesm,
        perf3mm: performanceData.perf3Moism,
        perf6mm: performanceData.perf6Moism,
        lastdatepreviousmonth: performanceData.lastdatepreviousmonth,
        ...getRatioDataFields(ratioData, '1an'),
        ...getRatioDataFields(ratioData, '3an'),
        ...getRatioDataFields(ratioData, '5an')
      });
      await existingperf.save();
    } else {
      await performences.create({
        date: currentDate,
        fond_id: fundId,
        code_ISIN,
        categorie: performanceData.category,
        categorie_nationale,
        categorie_regionale,
        devise,
        lastdatepreviousmonth: performanceData.lastdatepreviousmonth,
        ytd: performanceData.perf1erJanvier,
        ytdm: performanceData.perf1erJanvierm,
        perfveille: performanceData.perfVeille,
        perf1an: performanceData.perf1An,
        perf3ans: performanceData.perf3Ans,
        perf5ans: performanceData.perf5Ans,
        perf8ans: performanceData.perf8Ans,
        perf10ans: performanceData.perf10Ans,
        perf4s: performanceData.perf4Semaines,
        perf3m: performanceData.perf3Mois,
        perf6m: performanceData.perf6Mois,
        perfveillem: performanceData.perfVeillem,
        perf1anm: performanceData.perf1Anm,
        perf3ansm: performanceData.perf3Ansm,
        perf5ansm: performanceData.perf5Ansm,
        perf8ansm: performanceData.perf8Ansm,
        perf10ansm: performanceData.perf10Ansm,
        perf4sm: performanceData.perf4Semainesm,
        perf3mm: performanceData.perf3Moism,
        perf6mm: performanceData.perf6Moism,
        lastdatepreviousmonth: performanceData.lastdatepreviousmonth,
        ...getRatioDataFields(ratioData, '1an'),
        ...getRatioDataFields(ratioData, '3an'),
        ...getRatioDataFields(ratioData, '5an')
      });
    }
  }

  // Fonction pour remplacer undefined par une chaîne vide ou une valeur par défaut
function safeValue(value, defaultValue = '-') {
  return value === undefined || value === null ? defaultValue : value;
}
  // Fonction pour insérer les performances dans ClickHouse
async function insertIntoClickHouse(fundId, code_ISIN, categorie, categorie_nationale, categorie_regionale, devise, currentDate, performanceData, ratioData) {
 

  try {
    // Conversion des données en JSON ou d'autres formats nécessaires
    await clickhouse.insert({
      table: 'performences', // Nom de la table
      values: [
        {
          id: null, // ID auto-incrémenté
          fond: safeValue(fundId.toString()),
          fond_id: safeValue(fundId),
          date: safeValue(currentDate),
          code_ISIN: safeValue(code_ISIN),
          categorie: safeValue(performanceData.category),
          devise: safeValue(devise),
          categorie_nationale: safeValue(categorie_nationale),
          categorie_regionale: safeValue(categorie_regionale),
          ytd: safeValue(performanceData.perf1erJanvier),
          perfveille: safeValue(performanceData.perfVeille),
          perf1an: safeValue(performanceData.perf1An),
          perf3ans: safeValue(performanceData.perf3Ans),
          perf5ans: safeValue(performanceData.perf5Ans),
          perf8ans: safeValue(performanceData.perf8Ans),
          perf10ans: safeValue(performanceData.perf10Ans),
          perf4s: safeValue(performanceData.perf4Semaines),
          perf3m: safeValue(performanceData.perf3Mois),
          perf6m: safeValue(performanceData.perf6Mois),
          perfannu1an: safeValue(ratioData.data1an?.perfannu),
          volatility1an: safeValue(ratioData.data1an?.volatility),
          ratiosharpe1an: safeValue(ratioData.data1an?.ratiosharpe),
          pertemax1an: safeValue(ratioData.data1an?.pertemax),
          sortino1an: safeValue(ratioData.data1an?.sortino),
          omega1an: safeValue(ratioData.data1an?.omega),
          dsr1an: safeValue(ratioData.data1an?.dsr),
          downcapture1an: safeValue(ratioData.data1an?.downcapture),
          upcapture1an: safeValue(ratioData.data1an?.upcapture),
          skewness1an: safeValue(ratioData.data1an?.skewness),
          kurtosis1an: safeValue(ratioData.data1an?.kurtosis),
          info1an: safeValue(ratioData.data1an?.info),
          calamar1an: safeValue(ratioData.data1an?.calamar),
          var991an: safeValue(ratioData.data1an?.var99),
          var951an: safeValue(ratioData.data1an?.var95),
          trackingerror1an: safeValue(ratioData.data1an?.trackingerror),
          betahaussier1an: safeValue(ratioData.data1an?.betahaussier),
          betabaissier1an: safeValue(ratioData.data1an?.betabaissier),
          beta1an: safeValue(ratioData.data1an?.beta),
          perfannu3an: safeValue(ratioData.data3an?.perfannu),
          volatility3an: safeValue(ratioData.data3an?.volatility),
          ratiosharpe3an: safeValue(ratioData.data3an?.ratiosharpe),
          pertemax3an: safeValue(ratioData.data3an?.pertemax),
          sortino3an: safeValue(ratioData.data3an?.sortino),
          omega3an: safeValue(ratioData.data3an?.omega),
          dsr3an: safeValue(ratioData.data3an?.dsr),
          downcapture3an: safeValue(ratioData.data3an?.downcapture),
          upcapture3an: safeValue(ratioData.data3an?.upcapture),
          skewness3an: safeValue(ratioData.data3an?.skewness),
          kurtosis3an: safeValue(ratioData.data3an?.kurtosis),
          info3an: safeValue(ratioData.data3an?.info),
          calamar3an: safeValue(ratioData.data3an?.calamar),
          var993an: safeValue(ratioData.data3an?.var99),
          var953an: safeValue(ratioData.data3an?.var95),
          trackingerror3an: safeValue(ratioData.data3an?.trackingerror),
          betahaussier3an: safeValue(ratioData.data3an?.betahaussier),
          betabaissier3an: safeValue(ratioData.data3an?.betabaissier),
          beta3an: safeValue(ratioData.data3an?.beta),
          perfannu5an: safeValue(ratioData.data5an?.perfannu),
          volatility5an: safeValue(ratioData.data5an?.volatility),
          ratiosharpe5an: safeValue(ratioData.data5an?.ratiosharpe),
          pertemax5an: safeValue(ratioData.data5an?.pertemax),
          sortino5an: safeValue(ratioData.data5an?.sortino),
          omega5an: safeValue(ratioData.data5an?.omega),
          dsr5an: safeValue(ratioData.data5an?.dsr),
          downcapture5an: safeValue(ratioData.data5an?.downcapture),
          upcapture5an: safeValue(ratioData.data5an?.upcapture),
          skewness5an: safeValue(ratioData.data5an?.skewness),
          kurtosis5an: safeValue(ratioData.data5an?.kurtosis),
          info5an: safeValue(ratioData.data5an?.info),
          calamar5an: safeValue(ratioData.data5an?.calamar),
          var995an: safeValue(ratioData.data5an?.var99),
          var955an: safeValue(ratioData.data5an?.var95),
          trackingerror5an: safeValue(ratioData.data5an?.trackingerror),
          betahaussier5an: safeValue(ratioData.data5an?.betahaussier),
          betabaissier5an: safeValue(ratioData.data5an?.betabaissier),
          beta5an: safeValue(ratioData.data5an?.beta)
        }
      ],
      format: 'JSONEachRow' // Format attendu pour l'insertion
    });

    console.log('Données insérées avec succès dans ClickHouse');
  } catch (error) {
    console.error('Erreur lors de l\'insertion dans ClickHouse:', error);
  }
}


  function getRatioDataFields(ratioData, period) {
    const fields = ['perfannu', 'volatility', 'ratiosharpe', 'pertemax', 'sortino', 'info', 'calamar', 'var99', 'var95', 'trackingerror', 'betahaussier', 'betabaissier', 'beta', 'omega', 'dsr', 'downcapture', 'upcapture', 'skewness', 'kurtosis'];
    const result = {};

    fields.forEach(field => {
      result[`${field}${period}`] = ratioData[`data${period}`] ? ratioData[`data${period}`].data[field] : '-';
    });

    return result;
  }


  

  module.exports = router;