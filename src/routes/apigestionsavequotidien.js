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
const { Fond } = require('../classes/fond')
const { Indice } = require('../classes/indice')
const ranking = require('../services/ranking.service')
const { Op } = require("sequelize");
const { da } = require('date-fns/locale');
const portefeuille_valorise = require('../models/portefeuille_valorise');
const { exit } = require('process');
const { url } = require('inspector');
const apikey = require('../models/apikey');

var limiter = new Bottleneck({
  minTime: 1000, // 1 request per second
  maxConcurrent: 3 // No more than 5 concurrent requests
});

// Fonction pour écrire dans un fichier de journal
function writeToLogFile(message) {
  fs.appendFile('logs.txt', message + '\n', (err) => {
    if (err) {
      console.error("Erreur lors de l'écriture dans le fichier de journal :", err);
    } else {
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
  try {
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
  } catch (error) {
    console.error('Erreur savevlmanquante:', error);
    res.status(500).json({ error: 'Erreur lors de la détection des VL manquantes.' });
  }
});
// Fonction pour parcourir les fonds avec "dividende" à "oui" et mettre à jour les VL en fonction du cumul des dividendes.
router.get('/api/updatewithdividende', async (req, res) => {
    try {
      // Récupérer tous les fonds où "dividende" est défini à "oui"
      const fondsAvecDividende = await fond.findAll({
        where: { affectation: "Distribuant" },
        include: [{
          model: vl,
          order: [['date', 'ASC']]
        }],
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
  const calculateRankmysql = (category, fundId, date) => ranking.calculateRankNational(category, fundId, date);
  const calculateRankdev = (category, fundId, devise) => ranking.calculateRankNationalDev(category, fundId, devise);
  const calculateRankregionalmysql = (category, fundId) => ranking.calculateRankRegional(category, fundId);
  const calculateRankGlobalmysql = (category, fundId) => ranking.calculateRankGlobal(category, fundId);
  const calculateRankregionaldev = (category, fundId, devise) => ranking.calculateRankRegionalDev(category, fundId, devise);
  const calculateRankGlobaldev = (category, fundId, devise) => ranking.calculateRankGlobalDev(category, fundId, devise);

  router.get('/api/classementmysql', async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      await classementfonds.destroy({ where: {}, transaction });
      const allFunds = await fetchFundsByValorisation([], 'undefined', 'undefined', 'undefined', '');
      for (const fund of allFunds) {
        const fundId = fund.id;
        const category = fund.categorie_national;
        const categorie_regionale = fund.categorie_regional;
        const categorie_fundafrica_regionale = fund.categorie_fundafrica_regionale;
        const categorie_fundafrica_globale = fund.categorie_fundafrica_globale;
        const categorie_libelle = fund.categorie_libelle;
        const datemoispre = fund.datemoispre;
        const datejour = fund.datejour;

        // Vérifiez si le fond existe dans la table classementfond
        const existingRanking = await classementfonds.findOne({
          where: { fond_id: fundId, type_classement: 1 },
          transaction,
        });

        const existingRankingregional = await classementfonds.findOne({
          where: { fond_id: fundId, type_classement: 2 },
          transaction,
        });

        const existingRankingGlobal = await classementfonds.findOne({
          where: { fond_id: fundId, type_classement: 3 },
          transaction,
        });

        // Calculez le classement en fonction de la catégorie
        const rankingData = await calculateRankmysql(category, fundId, datejour);
        const rankingDataregional = await calculateRankregionalmysql(categorie_fundafrica_regionale, fundId, datejour);
        const rankingDataGlobal = await calculateRankGlobalmysql(categorie_fundafrica_globale, fundId);


        if (existingRanking && rankingData && rankingData.code == 200) {
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
          await existingRanking.save({ transaction });
        } else {
          // Le fond n'existe pas, créez une nouvelle entrée dans la table classementfond
          if (rankingData && rankingData.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 1,
              categorie_regionale: categorie_regionale,
              categorie_fundafrica_regionale: fund.categorie_fundafrica_regionale || null,
              categorie_fundafrica_globale: fund.categorie_fundafrica_globale || null,
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
            }, { transaction });
        }

        if (existingRankingregional && rankingDataregional && rankingDataregional.code == 200) {
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
          existingRankingregional.type_classement = 2;
          await existingRankingregional.save({ transaction });
        } else {

          // Le fond n'existe pas, créez une nouvelle entrée dans la table classementfond
          if (rankingDataregional && rankingDataregional.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 2,
              categorie_regionale: categorie_regionale,
              categorie_fundafrica_regionale: fund.categorie_fundafrica_regionale || null,
              categorie_fundafrica_globale: fund.categorie_fundafrica_globale || null,
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
            }, { transaction });
        }

        if (existingRankingGlobal && rankingDataGlobal && rankingDataGlobal.code == 200) {
          existingRankingGlobal.rank3Mois = rankingDataGlobal.data.rank3Mois;
          existingRankingGlobal.rank6Mois = rankingDataGlobal.data.rank6Mois;
          existingRankingGlobal.rank1An = rankingDataGlobal.data.rank1An;
          existingRankingGlobal.rank3Ans = rankingDataGlobal.data.rank3Ans;
          existingRankingGlobal.rank5Ans = rankingDataGlobal.data.rank5Ans;
          existingRankingGlobal.rank1erJanvier = rankingDataGlobal.data.rank1erJanvier;
          existingRankingGlobal.rank3Moistotal = rankingDataGlobal.data.rank3Moistotal;
          existingRankingGlobal.rank6Moistotal = rankingDataGlobal.data.rank6Moistotal;
          existingRankingGlobal.rank1Antotal = rankingDataGlobal.data.rank1Antotal;
          existingRankingGlobal.rank3Anstotal = rankingDataGlobal.data.rank3Anstotal;
          existingRankingGlobal.rank5Anstotal = rankingDataGlobal.data.rank5Anstotal;
          existingRankingGlobal.rank1erJanviertotal = rankingDataGlobal.data.rank1erJanviertotal;
          existingRankingGlobal.type_classement = 3;
          await existingRankingGlobal.save({ transaction });
        } else {
          if (rankingDataGlobal && rankingDataGlobal.code == 200)
            await classementfonds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 3,
              categorie_regionale: categorie_regionale,
              categorie_fundafrica_regionale: fund.categorie_fundafrica_regionale || null,
              categorie_fundafrica_globale: fund.categorie_fundafrica_globale || null,
              categorie: categorie_libelle,
              rank3Mois: rankingDataGlobal.data.rank3Mois,
              rank6Mois: rankingDataGlobal.data.rank6Mois,
              rank1An: rankingDataGlobal.data.rank1An,
              rank3Ans: rankingDataGlobal.data.rank3Ans,
              rank5Ans: rankingDataGlobal.data.rank5Ans,
              rank1erJanvier: rankingDataGlobal.data.rank1erJanvier,
              rank3Moistotal: rankingDataGlobal.data.rank3Moistotal,
              rank6Moistotal: rankingDataGlobal.data.rank6Moistotal,
              rank1Antotal: rankingDataGlobal.data.rank1Antotal,
              rank3Anstotal: rankingDataGlobal.data.rank3Anstotal,
              rank5Anstotal: rankingDataGlobal.data.rank5Anstotal,
              rank1erJanviertotal: rankingDataGlobal.data.rank1erJanviertotal,
            }, { transaction });
        }
      }
      await transaction.commit();
      res.json("finishrank");
    } catch (error) {
      await transaction.rollback();
      console.error('Une erreur s\'est produite :', error);
      res.status(500).json({ error: 'Erreur classement local' });
    }
  });

  router.get('/api/classementeur', async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      await classementfonds_eurs.destroy({ where: {}, transaction });
      const allFunds = await fetchFundsByValorisation([], 'undefined', 'undefined', 'undefined', '');
      for (const fund of allFunds) {
        const fundId = fund.id;
        const category = fund.categorie_national;
        const categorie_regionale = fund.categorie_regional;
        const categorie_fundafrica_regionale = fund.categorie_fundafrica_regionale;
        const categorie_fundafrica_globale = fund.categorie_fundafrica_globale;
        const categorie_libelle = fund.categorie_libelle;

        // Vérifiez si le fond existe dans la table classementfond
        const existingRanking = await classementfonds_eurs.findOne({
          where: { fond_id: fundId, type_classement: 1 },
          transaction,
        });

        const existingRankingregional = await classementfonds_eurs.findOne({
          where: { fond_id: fundId, type_classement: 2 },
          transaction,
        });

        const existingRankingGlobal = await classementfonds_eurs.findOne({
          where: { fond_id: fundId, type_classement: 3 },
          transaction,
        });

        // Calculez le classement en fonction de la catégorie
        const rankingData = await calculateRankdev(category, fundId, "EUR");
        const rankingDataregional = await calculateRankregionaldev(categorie_fundafrica_regionale, fundId, "EUR");
        const rankingDataGlobal = await calculateRankGlobaldev(categorie_fundafrica_globale, fundId, "EUR");


        if (existingRanking && rankingData && rankingData.code == 200) {
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
          existingRanking.rank3Moistotalm = rankingData.data.rank3Moistotalm;
          existingRanking.rank6Moism = rankingData.data.rank6Moism;
          existingRanking.rank6Moistotalm = rankingData.data.rank6Moistotalm;
          existingRanking.rank1Anm = rankingData.data.rank1Anm;
          existingRanking.rank1Antotalm = rankingData.data.rank1Antotalm;
          existingRanking.rank3Ansm = rankingData.data.rank3Ansm;
          existingRanking.rank3Anstotalm = rankingData.data.rank3Anstotalm;
          existingRanking.rank5Ansm = rankingData.data.rank5Ansm;
          existingRanking.rank5Anstotalm = rankingData.data.rank5Anstotalm;
          existingRanking.rank1erJanvierm = rankingData.data.rank1erJanvierm;
          existingRanking.rank1erJanviertotalm = rankingData.data.rank1erJanviertotalm;
          existingRanking.ranksharpe = rankingData.data.ranksharpe;
          existingRanking.ranksharpetotal = rankingData.data.ranksharpetotal;
          existingRanking.rankvolatilite = rankingData.data.rankvolatilite;
          existingRanking.rankvolatilitetotal = rankingData.data.rankvolatilitetotal;
          existingRanking.rankdsr = rankingData.data.rankdsr;
          existingRanking.rankdsrtotal = rankingData.data.rankdsrtotal;
          existingRanking.rankpertemax = rankingData.data.rankpertemax;
          existingRanking.rankpertemaxtotal = rankingData.data.rankpertemaxtotal;
          existingRanking.rankinfo = rankingData.data.rankinfo;
          existingRanking.rankinfototal = rankingData.data.rankinfototal;
          existingRanking.ranksortino = rankingData.data.ranksortino;
          existingRanking.ranksortinototal = rankingData.data.ranksortinototal;
          existingRanking.rankbetabaissier = rankingData.data.rankbetabaissier;
          existingRanking.rankbetabaissiertotal = rankingData.data.rankbetabaissiertotal;
          existingRanking.rankomega = rankingData.data.rankomega;
          existingRanking.rankomegatotal = rankingData.data.rankomegatotal;
          existingRanking.rankvar95 = rankingData.data.rankvar95;
          existingRanking.rankvar95total = rankingData.data.rankvar95total;
          existingRanking.rankcalamar = rankingData.data.rankcalamar;
          existingRanking.rankcalamartotal = rankingData.data.rankcalamartotal;
          existingRanking.type_classement = 1;
          await existingRanking.save({ transaction });
        } else {
          if (rankingData && rankingData.code == 200)
            await classementfonds_eurs.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 1,
              categorie_regionale: categorie_regionale,
              categorie_fundafrica_regionale: categorie_fundafrica_regionale || null,
              categorie_fundafrica_globale: categorie_fundafrica_globale || null,
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
              rank3Moistotalm: rankingData.data.rank3Moistotalm,
              rank6Moism: rankingData.data.rank6Moism,
              rank6Moistotalm: rankingData.data.rank6Moistotalm,
              rank1Anm: rankingData.data.rank1Anm,
              rank1Antotalm: rankingData.data.rank1Antotalm,
              rank3Ansm: rankingData.data.rank3Ansm,
              rank3Anstotalm: rankingData.data.rank3Anstotalm,
              rank5Ansm: rankingData.data.rank5Ansm,
              rank5Anstotalm: rankingData.data.rank5Anstotalm,
              rank1erJanvierm: rankingData.data.rank1erJanvierm,
              rank1erJanviertotalm: rankingData.data.rank1erJanviertotalm,
              ranksharpe: rankingData.data.ranksharpe,
              ranksharpetotal: rankingData.data.ranksharpetotal,
              rankvolatilite: rankingData.data.rankvolatilite,
              rankvolatilitetotal: rankingData.data.rankvolatilitetotal,
              rankdsr: rankingData.data.rankdsr,
              rankdsrtotal: rankingData.data.rankdsrtotal,
              rankpertemax: rankingData.data.rankpertemax,
              rankpertemaxtotal: rankingData.data.rankpertemaxtotal,
              rankinfo: rankingData.data.rankinfo,
              rankinfototal: rankingData.data.rankinfototal,
              ranksortino: rankingData.data.ranksortino,
              ranksortinototal: rankingData.data.ranksortinototal,
              rankbetabaissier: rankingData.data.rankbetabaissier,
              rankbetabaissiertotal: rankingData.data.rankbetabaissiertotal,
              rankomega: rankingData.data.rankomega,
              rankomegatotal: rankingData.data.rankomegatotal,
              rankvar95: rankingData.data.rankvar95,
              rankvar95total: rankingData.data.rankvar95total,
              rankcalamar: rankingData.data.rankcalamar,
              rankcalamartotal: rankingData.data.rankcalamartotal,
            }, { transaction });
        }

        if (existingRankingregional && rankingDataregional && rankingDataregional.code == 200) {
          existingRankingregional.rank3Mois = rankingDataregional.data.rank3Mois;
          existingRankingregional.rank6Mois = rankingDataregional.data.rank6Mois;
          existingRankingregional.rank1An = rankingDataregional.data.rank1An;
          existingRankingregional.rank3Ans = rankingDataregional.data.rank3Ans;
          existingRankingregional.rank5Ans = rankingDataregional.data.rank5Ans;
          existingRankingregional.rank1erJanvier = rankingDataregional.data.rank1erJanvier;
          existingRankingregional.rank3Moistotal = rankingDataregional.data.rank3Moistotal;
          existingRankingregional.rank6Moistotal = rankingDataregional.data.rank6Moistotal;
          existingRankingregional.rank1Antotal = rankingDataregional.data.rank1Antotal;
          existingRankingregional.rank3Anstotal = rankingDataregional.data.rank3Anstotal;
          existingRankingregional.rank5Anstotal = rankingDataregional.data.rank5Anstotal;
          existingRankingregional.rank1erJanviertotal = rankingDataregional.data.rank1erJanviertotal;
          existingRankingregional.type_classement = 2;
          await existingRankingregional.save({ transaction });
        } else {
          if (rankingDataregional && rankingDataregional.code == 200)
            await classementfonds_eurs.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 2,
              categorie_regionale: categorie_regionale,
              categorie_fundafrica_regionale: categorie_fundafrica_regionale || null,
              categorie_fundafrica_globale: categorie_fundafrica_globale || null,
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
            }, { transaction });
        }

        // Type 3 : Classement Afrique (par categorie_fundafrica_globale)
        if (categorie_fundafrica_globale) {
          if (existingRankingGlobal && rankingDataGlobal && rankingDataGlobal.code == 200) {
            existingRankingGlobal.rank3Mois = rankingDataGlobal.data.rank3Mois;
            existingRankingGlobal.rank6Mois = rankingDataGlobal.data.rank6Mois;
            existingRankingGlobal.rank1An = rankingDataGlobal.data.rank1An;
            existingRankingGlobal.rank3Ans = rankingDataGlobal.data.rank3Ans;
            existingRankingGlobal.rank5Ans = rankingDataGlobal.data.rank5Ans;
            existingRankingGlobal.rank1erJanvier = rankingDataGlobal.data.rank1erJanvier;
            existingRankingGlobal.rank3Moistotal = rankingDataGlobal.data.rank3Moistotal;
            existingRankingGlobal.rank6Moistotal = rankingDataGlobal.data.rank6Moistotal;
            existingRankingGlobal.rank1Antotal = rankingDataGlobal.data.rank1Antotal;
            existingRankingGlobal.rank3Anstotal = rankingDataGlobal.data.rank3Anstotal;
            existingRankingGlobal.rank5Anstotal = rankingDataGlobal.data.rank5Anstotal;
            existingRankingGlobal.rank1erJanviertotal = rankingDataGlobal.data.rank1erJanviertotal;
            existingRankingGlobal.type_classement = 3;
            await existingRankingGlobal.save({ transaction });
          } else {
            if (rankingDataGlobal && rankingDataGlobal.code == 200)
              await classementfonds_eurs.create({
                fond_id: fundId,
                categorie_nationale: category,
                type_classement: 3,
                categorie_regionale: categorie_regionale,
                categorie_fundafrica_regionale: categorie_fundafrica_regionale || null,
                categorie_fundafrica_globale: categorie_fundafrica_globale || null,
                categorie: categorie_libelle,
                rank3Mois: rankingDataGlobal.data.rank3Mois,
                rank6Mois: rankingDataGlobal.data.rank6Mois,
                rank1An: rankingDataGlobal.data.rank1An,
                rank3Ans: rankingDataGlobal.data.rank3Ans,
                rank5Ans: rankingDataGlobal.data.rank5Ans,
                rank1erJanvier: rankingDataGlobal.data.rank1erJanvier,
                rank3Moistotal: rankingDataGlobal.data.rank3Moistotal,
                rank6Moistotal: rankingDataGlobal.data.rank6Moistotal,
                rank1Antotal: rankingDataGlobal.data.rank1Antotal,
                rank3Anstotal: rankingDataGlobal.data.rank3Anstotal,
                rank5Anstotal: rankingDataGlobal.data.rank5Anstotal,
                rank1erJanviertotal: rankingDataGlobal.data.rank1erJanviertotal,
              }, { transaction });
          }
        }
      }
      await transaction.commit();
      res.json("finishrank");
    } catch (error) {
      await transaction.rollback();
      console.error('Une erreur s\'est produite :', error);
      res.status(500).json({ error: 'Erreur classement EUR' });
    }
  });

  router.get('/api/classementusd', async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      await classementfonds_usds.destroy({ where: {}, transaction });
      const allFunds = await fetchFundsByValorisation([], 'undefined', 'undefined', 'undefined', '');
      for (const fund of allFunds) {
        const fundId = fund.id;
        const category = fund.categorie_national;
        const categorie_regionale = fund.categorie_regional;
        const categorie_fundafrica_regionale = fund.categorie_fundafrica_regionale;
        const categorie_fundafrica_globale = fund.categorie_fundafrica_globale;
        const categorie_libelle = fund.categorie_libelle;

        const existingRanking = await classementfonds_usds.findOne({
          where: { fond_id: fundId, type_classement: 1 },
          transaction,
        });

        const existingRankingregional = await classementfonds_usds.findOne({
          where: { fond_id: fundId, type_classement: 2 },
          transaction,
        });

        const existingRankingGlobal = await classementfonds_usds.findOne({
          where: { fond_id: fundId, type_classement: 3 },
          transaction,
        });

        const rankingData = await calculateRankdev(category, fundId, "USD");
        const rankingDataregional = await calculateRankregionaldev(categorie_fundafrica_regionale, fundId, "USD");
        const rankingDataGlobal = await calculateRankGlobaldev(categorie_fundafrica_globale, fundId, "USD");

        if (existingRanking && rankingData && rankingData.code == 200) {
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
          existingRanking.rank3Moistotalm = rankingData.data.rank3Moistotalm;
          existingRanking.rank6Moism = rankingData.data.rank6Moism;
          existingRanking.rank6Moistotalm = rankingData.data.rank6Moistotalm;
          existingRanking.rank1Anm = rankingData.data.rank1Anm;
          existingRanking.rank1Antotalm = rankingData.data.rank1Antotalm;
          existingRanking.rank3Ansm = rankingData.data.rank3Ansm;
          existingRanking.rank3Anstotalm = rankingData.data.rank3Anstotalm;
          existingRanking.rank5Ansm = rankingData.data.rank5Ansm;
          existingRanking.rank5Anstotalm = rankingData.data.rank5Anstotalm;
          existingRanking.rank1erJanvierm = rankingData.data.rank1erJanvierm;
          existingRanking.rank1erJanviertotalm = rankingData.data.rank1erJanviertotalm;
          existingRanking.ranksharpe = rankingData.data.ranksharpe;
          existingRanking.ranksharpetotal = rankingData.data.ranksharpetotal;
          existingRanking.rankvolatilite = rankingData.data.rankvolatilite;
          existingRanking.rankvolatilitetotal = rankingData.data.rankvolatilitetotal;
          existingRanking.rankdsr = rankingData.data.rankdsr;
          existingRanking.rankdsrtotal = rankingData.data.rankdsrtotal;
          existingRanking.rankpertemax = rankingData.data.rankpertemax;
          existingRanking.rankpertemaxtotal = rankingData.data.rankpertemaxtotal;
          existingRanking.rankinfo = rankingData.data.rankinfo;
          existingRanking.rankinfototal = rankingData.data.rankinfototal;
          existingRanking.ranksortino = rankingData.data.ranksortino;
          existingRanking.ranksortinototal = rankingData.data.ranksortinototal;
          existingRanking.rankbetabaissier = rankingData.data.rankbetabaissier;
          existingRanking.rankbetabaissiertotal = rankingData.data.rankbetabaissiertotal;
          existingRanking.rankomega = rankingData.data.rankomega;
          existingRanking.rankomegatotal = rankingData.data.rankomegatotal;
          existingRanking.rankvar95 = rankingData.data.rankvar95;
          existingRanking.rankvar95total = rankingData.data.rankvar95total;
          existingRanking.rankcalamar = rankingData.data.rankcalamar;
          existingRanking.rankcalamartotal = rankingData.data.rankcalamartotal;
          existingRanking.type_classement = 1;
          await existingRanking.save({ transaction });
        } else {
          if (rankingData && rankingData.code == 200)
            await classementfonds_usds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 1,
              categorie_regionale: categorie_regionale,
              categorie_fundafrica_regionale: categorie_fundafrica_regionale || null,
              categorie_fundafrica_globale: categorie_fundafrica_globale || null,
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
              rank3Moistotalm: rankingData.data.rank3Moistotalm,
              rank6Moism: rankingData.data.rank6Moism,
              rank6Moistotalm: rankingData.data.rank6Moistotalm,
              rank1Anm: rankingData.data.rank1Anm,
              rank1Antotalm: rankingData.data.rank1Antotalm,
              rank3Ansm: rankingData.data.rank3Ansm,
              rank3Anstotalm: rankingData.data.rank3Anstotalm,
              rank5Ansm: rankingData.data.rank5Ansm,
              rank5Anstotalm: rankingData.data.rank5Anstotalm,
              rank1erJanvierm: rankingData.data.rank1erJanvierm,
              rank1erJanviertotalm: rankingData.data.rank1erJanviertotalm,
              ranksharpe: rankingData.data.ranksharpe,
              ranksharpetotal: rankingData.data.ranksharpetotal,
              rankvolatilite: rankingData.data.rankvolatilite,
              rankvolatilitetotal: rankingData.data.rankvolatilitetotal,
              rankdsr: rankingData.data.rankdsr,
              rankdsrtotal: rankingData.data.rankdsrtotal,
              rankpertemax: rankingData.data.rankpertemax,
              rankpertemaxtotal: rankingData.data.rankpertemaxtotal,
              rankinfo: rankingData.data.rankinfo,
              rankinfototal: rankingData.data.rankinfototal,
              ranksortino: rankingData.data.ranksortino,
              ranksortinototal: rankingData.data.ranksortinototal,
              rankbetabaissier: rankingData.data.rankbetabaissier,
              rankbetabaissiertotal: rankingData.data.rankbetabaissiertotal,
              rankomega: rankingData.data.rankomega,
              rankomegatotal: rankingData.data.rankomegatotal,
              rankvar95: rankingData.data.rankvar95,
              rankvar95total: rankingData.data.rankvar95total,
              rankcalamar: rankingData.data.rankcalamar,
              rankcalamartotal: rankingData.data.rankcalamartotal,
            }, { transaction });
        }

        if (existingRankingregional && rankingDataregional && rankingDataregional.code == 200) {
          existingRankingregional.rank3Mois = rankingDataregional.data.rank3Mois;
          existingRankingregional.rank6Mois = rankingDataregional.data.rank6Mois;
          existingRankingregional.rank1An = rankingDataregional.data.rank1An;
          existingRankingregional.rank3Ans = rankingDataregional.data.rank3Ans;
          existingRankingregional.rank5Ans = rankingDataregional.data.rank5Ans;
          existingRankingregional.rank1erJanvier = rankingDataregional.data.rank1erJanvier;
          existingRankingregional.rank3Moistotal = rankingDataregional.data.rank3Moistotal;
          existingRankingregional.rank6Moistotal = rankingDataregional.data.rank6Moistotal;
          existingRankingregional.rank1Antotal = rankingDataregional.data.rank1Antotal;
          existingRankingregional.rank3Anstotal = rankingDataregional.data.rank3Anstotal;
          existingRankingregional.rank5Anstotal = rankingDataregional.data.rank5Anstotal;
          existingRankingregional.rank1erJanviertotal = rankingDataregional.data.rank1erJanviertotal;
          existingRankingregional.type_classement = 2;
          await existingRankingregional.save({ transaction });
        } else {
          if (rankingDataregional && rankingDataregional.code == 200)
            await classementfonds_usds.create({
              fond_id: fundId,
              categorie_nationale: category,
              type_classement: 2,
              categorie_regionale: categorie_regionale,
              categorie_fundafrica_regionale: categorie_fundafrica_regionale || null,
              categorie_fundafrica_globale: categorie_fundafrica_globale || null,
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
            }, { transaction });
        }

        // Type 3 : Classement Afrique (par categorie_fundafrica_globale)
        if (categorie_fundafrica_globale) {
          if (existingRankingGlobal && rankingDataGlobal && rankingDataGlobal.code == 200) {
            existingRankingGlobal.rank3Mois = rankingDataGlobal.data.rank3Mois;
            existingRankingGlobal.rank6Mois = rankingDataGlobal.data.rank6Mois;
            existingRankingGlobal.rank1An = rankingDataGlobal.data.rank1An;
            existingRankingGlobal.rank3Ans = rankingDataGlobal.data.rank3Ans;
            existingRankingGlobal.rank5Ans = rankingDataGlobal.data.rank5Ans;
            existingRankingGlobal.rank1erJanvier = rankingDataGlobal.data.rank1erJanvier;
            existingRankingGlobal.rank3Moistotal = rankingDataGlobal.data.rank3Moistotal;
            existingRankingGlobal.rank6Moistotal = rankingDataGlobal.data.rank6Moistotal;
            existingRankingGlobal.rank1Antotal = rankingDataGlobal.data.rank1Antotal;
            existingRankingGlobal.rank3Anstotal = rankingDataGlobal.data.rank3Anstotal;
            existingRankingGlobal.rank5Anstotal = rankingDataGlobal.data.rank5Anstotal;
            existingRankingGlobal.rank1erJanviertotal = rankingDataGlobal.data.rank1erJanviertotal;
            existingRankingGlobal.type_classement = 3;
            await existingRankingGlobal.save({ transaction });
          } else {
            if (rankingDataGlobal && rankingDataGlobal.code == 200)
              await classementfonds_usds.create({
                fond_id: fundId,
                categorie_nationale: category,
                type_classement: 3,
                categorie_regionale: categorie_regionale,
                categorie_fundafrica_regionale: categorie_fundafrica_regionale || null,
                categorie_fundafrica_globale: categorie_fundafrica_globale || null,
                categorie: categorie_libelle,
                rank3Mois: rankingDataGlobal.data.rank3Mois,
                rank6Mois: rankingDataGlobal.data.rank6Mois,
                rank1An: rankingDataGlobal.data.rank1An,
                rank3Ans: rankingDataGlobal.data.rank3Ans,
                rank5Ans: rankingDataGlobal.data.rank5Ans,
                rank1erJanvier: rankingDataGlobal.data.rank1erJanvier,
                rank3Moistotal: rankingDataGlobal.data.rank3Moistotal,
                rank6Moistotal: rankingDataGlobal.data.rank6Moistotal,
                rank1Antotal: rankingDataGlobal.data.rank1Antotal,
                rank3Anstotal: rankingDataGlobal.data.rank3Anstotal,
                rank5Anstotal: rankingDataGlobal.data.rank5Anstotal,
                rank1erJanviertotal: rankingDataGlobal.data.rank1erJanviertotal,
              }, { transaction });
          }
        }
      }
      await transaction.commit();
      res.json("finishrank");
    } catch (error) {
      await transaction.rollback();
      console.error('Une erreur s\'est produite :', error);
      res.status(500).json({ error: 'Erreur classement USD' });
    }
  });

  // ====================================================================
  // BATCH: Peupler performences_eurs depuis performancesdev EUR
  // ====================================================================
  // ====================================================================
  // Verdict d'un traitement par lot.
  //
  // POURQUOI. Les trois routes `saveperfdate*` sont appelees par cron. Elles
  // attrapent l'erreur de CHAQUE fonds pour ne pas interrompre le lot — ce qui
  // est juste — mais renvoyaient ensuite 200 quel que soit le nombre d'echecs.
  // Un lot ou les 600 fonds echouent repondait « Traitement termine avec
  // succes », le cron notait OK, et personne ne voyait rien. C'est le meme
  // mensonge que le `tee` des scripts cron, un etage plus haut : le controle
  // du 2026-08-22 mesure 86 jours de retard moyen sur les performances Maroc
  // et Tunisie, avec 1,6 % et 3,8 % des fonds a jour, sans qu'aucune alerte
  // n'ait jamais ete levee.
  //
  // Un echec isole ne doit pas rougir tout le lot — sinon un seul fonds coince
  // rend le cron rouge chaque nuit et l'alerte cesse d'etre lue. Un echec
  // systemique, lui, doit sortir non nul. D'ou le seuil.
  //
  // SEUIL : 10 %, premiere calibration. A confronter aux taux d'echec reels
  // une fois quelques nuits observees — un invariant jamais confronte aux
  // donnees n'est qu'une affirmation de plus.
  const SEUIL_ECHEC_LOT = 0.1;

  function repondreLot(res, libelle, total, traites, erreurs) {
    const message = `${libelle}: ${traites}/${total} fonds traites, ${erreurs} erreur(s)`;
    const systemique = total > 0 && (traites === 0 || erreurs > total * SEUIL_ECHEC_LOT);
    if (systemique) {
      console.error(`[LOT EN ECHEC] ${message}`);
      return res.status(500).json({ error: message, total, traites, erreurs });
    }
    return res.json({ message, total, traites, erreurs });
  }

  router.get('/api/saveperfdateeur/:fond1/:fond2', async (req, res) => {
    try {
      const allFunds = await fetchFundsByValorisation1([], 'undefined', 'undefined', 'undefined', 'undefined', parseInt(req.params.fond1), parseInt(req.params.fond2));
      let processed = 0;
      let errors = 0;
      for (const fund of allFunds) {
        try {
          await processFundDevise(fund, 'EUR', performences_eurs);
          processed++;
        } catch (error) {
          errors++;
          console.error(`Error processing fund EUR ${fund.id}:`, error.message);
        }
      }
      return repondreLot(res, 'EUR performances', allFunds.length, processed, errors);
    } catch (error) {
      console.error('Erreur saveperfdateeur:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ====================================================================
  // BATCH: Peupler performences_usds depuis performancesdev USD
  // ====================================================================
  router.get('/api/saveperfdateusd/:fond1/:fond2', async (req, res) => {
    try {
      const allFunds = await fetchFundsByValorisation1([], 'undefined', 'undefined', 'undefined', 'undefined', parseInt(req.params.fond1), parseInt(req.params.fond2));
      let processed = 0;
      let errors = 0;
      for (const fund of allFunds) {
        try {
          await processFundDevise(fund, 'USD', performences_usds);
          processed++;
        } catch (error) {
          errors++;
          console.error(`Error processing fund USD ${fund.id}:`, error.message);
        }
      }
      return repondreLot(res, 'USD performances', allFunds.length, processed, errors);
    } catch (error) {
      console.error('Erreur saveperfdateusd:', error);
      res.status(500).json({ error: error.message });
    }
  });

  async function processFundDevise(fund, devise, perfTable) {
    const fundId = fund.id;
    const code_ISIN = fund.code_ISIN;
    const categorie_nationale = fund.categorie_national;
    const categorie_regionale = fund.categorie_regional;
    const categorie_fundafrica_regionale = fund.categorie_fundafrica_regionale || null;
    const categorie_fundafrica_globale = fund.categorie_fundafrica_globale || null;

    const latestPerf = await perfTable.findOne({
      where: { fond_id: fundId },
      order: [['date', 'DESC']],
    });
    const sinceDate = latestPerf ? latestPerf.date : '2020-01-01';

    const allVlDates = await vl.findAll({
      attributes: ['date'],
      where: {
        fund_id: fundId,
        date: { [Op.gt]: sinceDate }
      },
      order: [['date', 'DESC']],
      limit: 10000,
    });

    if (allVlDates.length === 0) return;

    for (let i = 0; i < allVlDates.length; i++) {
      const currentDate = moment(allVlDates[i].date).format('YYYY-MM-DD');
      try {
        const performanceResponse = await fetch(`${urll}/api/performancesdevwithdate/fond/${fundId}/${devise}/${currentDate}`);
        if (performanceResponse.status === 200) {
          const performanceData = await performanceResponse.json();
          if (performanceData.data) {
            await upsertPerformanceDevise(fundId, code_ISIN, categorie_nationale, categorie_regionale, categorie_fundafrica_regionale, categorie_fundafrica_globale, devise, currentDate, performanceData.data, perfTable);
          }
        }
      } catch (error) {
        console.error(`Erreur perf ${devise} fond ${fundId} date ${currentDate}:`, error.message);
        continue;
      }
    }
  }

  async function upsertPerformanceDevise(fundId, code_ISIN, categorie_nationale, categorie_regionale, categorie_fundafrica_regionale, categorie_fundafrica_globale, devise, currentDate, data, perfTable) {
    const existing = await perfTable.findOne({ where: { fond_id: fundId, date: currentDate } });
    const fields = {
      ytd: data.perf1erJanvier,
      perfveille: data.perfVeille,
      perf1an: data.perf1An,
      perf3ans: data.perf3Ans,
      perf5ans: data.perf5Ans,
      perf8ans: data.perf8Ans,
      perf10ans: data.perf10Ans,
      perf4s: data.perf4Semaines,
      perf3m: data.perf3Mois,
      perf6m: data.perf6Mois,
    };

    if (existing) {
      Object.assign(existing, fields);
      if (!existing.categorie_fundafrica_regionale) existing.categorie_fundafrica_regionale = categorie_fundafrica_regionale;
      if (!existing.categorie_fundafrica_globale) existing.categorie_fundafrica_globale = categorie_fundafrica_globale;
      await existing.save();
    } else {
      await perfTable.create({
        date: currentDate,
        fond_id: fundId,
        fond: fundId.toString(),
        code_ISIN,
        categorie: data.category || categorie_nationale,
        categorie_nationale,
        categorie_regionale,
        categorie_fundafrica_regionale,
        categorie_fundafrica_globale,
        devise,
        ...fields,
      });
    }
  }

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

  router.get('/api/saveperfdatemysql/:fond1/:fond2', async (req, res) => {
    try {

      const allFunds = await fetchFundsByValorisation1([], 'undefined', 'undefined', 'undefined', 'undefined', parseInt(req.params.fond1), parseInt(req.params.fond2));

      // Sequential processing using for loop with await
      let processed = 0;
      let errors = 0;
      for (const fund of allFunds) {
        try {
          await processFundmysql(fund);
          processed++;
        } catch (error) {
          errors++;
          console.error(`Error processing fund ${fund && fund.id}:`, error && error.message);
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



      return repondreLot(res, 'Performances locales', allFunds.length, processed, errors);
    } catch (error) {
      console.error('Une erreur s\'est produite :', error);
      res.status(500).json({ error: 'Une erreur s\'est produite lors du traitement.' });
    }
  });


  async function processFundmysql(fund) {
    const fundId = fund.id;
    const code_ISIN = fund.code_ISIN;
    const categorie_nationale = fund.categorie_national;
    const categorie_regionale = fund.categorie_regional;
    const categorie_fundafrica_regionale = fund.categorie_fundafrica_regionale || null;
    const categorie_fundafrica_globale = fund.categorie_fundafrica_globale || null;
    const allVlDates = await vl.findAll({
      attributes: ['date'],
      where: {
        fund_id: fundId,
        date: {
          [Op.gt]: '2019-12-31'
        }
      },
      order: [['date', 'DESC']],
      limit: 10000,
    });

    if (allVlDates.length === 0) {
      writeToLogFile(`Aucune VL pour fond ${fundId}, skip`);
      return;
    }

    // Obtenir l'année de valorisation
    const yearsSinceValorisation = await anneevalorisation(fundId);
    if (!yearsSinceValorisation || yearsSinceValorisation.length === 0) {
      writeToLogFile(`Pas de donnees anneevalorisation pour fond ${fundId}, skip`);
      return;
    }
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
          await upsertPerformance(fundId, code_ISIN, categorie_nationale, categorie_regionale, categorie_fundafrica_regionale, categorie_fundafrica_globale, fund.dev_libelle, currentDate, performanceData.data, ratioData);

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

  async function upsertPerformance(fundId, code_ISIN, categorie_nationale, categorie_regionale, categorie_fundafrica_regionale, categorie_fundafrica_globale, devise, currentDate, performanceData, ratioData) {
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
        categorie_fundafrica_regionale,
        categorie_fundafrica_globale,
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



  function getRatioDataFields(ratioData, period) {
    const fields = ['perfannu', 'volatility', 'ratiosharpe', 'pertemax', 'sortino', 'info', 'calamar', 'var99', 'var95', 'trackingerror', 'betahaussier', 'betabaissier', 'beta', 'omega', 'dsr', 'downcapture', 'upcapture', 'skewness', 'kurtosis'];
    const result = {};
    const data = ratioData[`data${period}`]?.data;

    fields.forEach(field => {
      result[`${field}${period}`] = data ? data[field] : '-';
    });

    result[`r2_${period}`] = data ? data.r2 : '-';
    result[`alpha${period}`] = data ? data.alphaJensen : '-';

    return result;
  }


  

  module.exports = router;