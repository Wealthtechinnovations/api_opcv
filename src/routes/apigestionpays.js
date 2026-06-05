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
const { Op } = require('sequelize'); // Ajout de l'importation de Op

const findCategoryByFundId = async (fundId) => {
  try {
    const categoryQuery = `
          SELECT categorie_globale
          FROM fond_investissements
          WHERE id = :fundId
      `;

    const [result] = await sequelize.query(categoryQuery, {
      replacements: { fundId: fundId },
      type: sequelize.QueryTypes.SELECT
    });

    return result?.categorie_globale || null;
  } catch (error) {
    console.error('Erreur findCategoryByFundId:', error);
    return null;
  }
};

router.get('/api/getpaysidmeta/:id', (req, res) => {
  const societeId = req.params.id;
  pays_regulateurs.findOne({
    where: { pays: societeId }
  }).then(pays => {
    if (!pays) {
      return res.status(404).json({ error: "Pays not found" });
    }
    res.json({
      code: 200,
      data: {
        pays: pays
      }
    });
  })
  .catch(error => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
  });
});
  //Graph by pays
  router.get('/api/getPaysbyidfisrt/:id', async (req, res) => {
    const selectedValues = req.query.query;

    // Recherche de la société par nom
    pays_regulateurs.findOne({
      where: { pays: req.params.id }
    })
      .then(async response => {
        if (!response) {
          return res.status(404).json({ code: 404, error: 'Pays non trouvé.' });
        }
        // Récupération des informations de base de la société
        const societeData = {
          nom: response.pays,
          placeFinanciere:response.nomdelabourse,
          devise:response.symboledevise,
          tauxObligations10Ans:response.tsr10,
          tauxSansRisque:response.to10

        };

        // Recherche du nombre de fonds associés à cette société
        const nbrePart = await fond.count({ where: { pays: response.pays } });
        const nbresocietes= await societe.count({ where: { pays: response.pays } });
        var latestValorisations;
        var latestDate;
        var performa;
        var result;
        var result5;
        var sumActifNetByYear;
        if (selectedValues == "EUR") {
          performa = await performences_eurs.findAll({
            attributes: ['fond_id', 'volatility1an', 'perfannu1an', 'volatility3an', 'perfannu3an', 'volatility5an', 'perfannu5an'], // Colonnes à sélectionner
            include: {
              model: fond, // Joindre la table fond
              attributes: ['nom_fond', 'categorie_globale'], // Aucune colonne sélectionnée de fond, juste pour la jointure
              where: { pays: req.params.id } // Filtrer par la société spécifiée
            },
            where: {
              date: Sequelize.literal(`(performences_eurs.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences_eurs GROUP BY fond_id)`)
            },
            limit: 500
          });
          const sumActifNetQuery = `
  SELECT SUM(latest_valorisations.actif_net_EUR) AS sumActifNet
  FROM (
      SELECT v.fund_id, MAX(v.date) AS latest_date
      FROM valorisations v
      INNER JOIN fond_investissements f ON v.fund_id = f.id
      WHERE f.pays = :pays
      GROUP BY v.fund_id
  ) AS latest_dates
  INNER JOIN valorisations latest_valorisations 
  ON latest_dates.fund_id = latest_valorisations.fund_id 
  AND latest_dates.latest_date = latest_valorisations.date
  WHERE latest_valorisations.actif_net_EUR != '#N/A';
`;

          [result] = await sequelize.query(sumActifNetQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });



          const latestDateQuery = `
    SELECT MAX(valorisations.date) AS latestDate
    FROM valorisations
    INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
    WHERE fond_investissements.pays = :pays
`;

          // Exécuter la requête avec les paramètres nécessaires
          [result5] = await sequelize.query(latestDateQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });

          latestDate = result5?.latestDate || null;

          const latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net_EUR, YEAR(valorisations.date) AS year
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.pays = :pays
          GROUP BY valorisations.fund_id, year
          ORDER BY valorisations.date DESC
      `;

          // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
          latestValorisations = await sequelize.query(latestValorisationsQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });

          sumActifNetByYear = {};
          fundCountByYear = {};
          // Calcul de la somme des actifs nets par année
          for (const { year } of latestValorisations) {
            fundCountByYear[year] = 0;
          }
          // Calcul de la somme des actifs nets par année
          for (const { year, actif_net_EUR } of latestValorisations) {
            if (!sumActifNetByYear[year]) {
              sumActifNetByYear[year] = 0;
            }
            if (actif_net_EUR !== '#N/A') {
              sumActifNetByYear[year] += parseFloat(actif_net_EUR);
              fundCountByYear[year] += 1; // Increment the count for the year

            }
          }
        } else if (selectedValues == "USD") {
          performa = await performences_usds.findAll({
            attributes: ['fond_id', 'volatility1an', 'perfannu1an', 'volatility3an', 'perfannu3an', 'volatility5an', 'perfannu5an'], // Colonnes à sélectionner
            include: {
              model: fond, // Joindre la table fond
              attributes: ['nom_fond', 'categorie_globale'], // Aucune colonne sélectionnée de fond, juste pour la jointure
              where: { pays: req.params.id } // Filtrer par la société spécifiée
            },
            where: {
              date: Sequelize.literal(`(performences_usds.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences_usds GROUP BY fond_id)`)
            },
            limit: 500
          });

          const sumActifNetQuery = `
  SELECT SUM(latest_valorisations.actif_net_USD) AS sumActifNet
  FROM (
      SELECT v.fund_id, MAX(v.date) AS latest_date
      FROM valorisations v
      INNER JOIN fond_investissements f ON v.fund_id = f.id
      WHERE f.pays = :pays
      GROUP BY v.fund_id
  ) AS latest_dates
  INNER JOIN valorisations latest_valorisations 
  ON latest_dates.fund_id = latest_valorisations.fund_id 
  AND latest_dates.latest_date = latest_valorisations.date
  WHERE latest_valorisations.actif_net_USD != '#N/A';
`;

          [result] = await sequelize.query(sumActifNetQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });



          const latestDateQuery = `
    SELECT MAX(valorisations.date) AS latestDate
    FROM valorisations
    INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
    WHERE fond_investissements.pays = :pays
`;

          // Exécuter la requête avec les paramètres nécessaires
          [result5] = await sequelize.query(latestDateQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });

          latestDate = result5?.latestDate || null;

          const latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net_USD, YEAR(valorisations.date) AS year
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.pays = :pays
          GROUP BY valorisations.fund_id, year
          ORDER BY valorisations.date DESC
      `;

          // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
          latestValorisations = await sequelize.query(latestValorisationsQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });

          sumActifNetByYear = {};
          fundCountByYear = {};
          // Calcul de la somme des actifs nets par année
          for (const { year } of latestValorisations) {
            fundCountByYear[year] = 0;
          }
          // Calcul de la somme des actifs nets par année
          for (const { year, actif_net_USD } of latestValorisations) {
            if (!sumActifNetByYear[year]) {
              sumActifNetByYear[year] = 0;
            }
            if (actif_net_USD !== '#N/A') {
              sumActifNetByYear[year] += parseFloat(actif_net_USD);
              fundCountByYear[year] += 1; // Increment the count for the year

            }
          }
        } else {
          performa = await performences.findAll({
            attributes: ['fond_id', 'volatility1an', 'perfannu1an', 'volatility3an', 'perfannu3an', 'volatility5an', 'perfannu5an'], // Colonnes à sélectionner
            include: {
              model: fond, // Joindre la table fond
              attributes: ['nom_fond', 'categorie_globale'], // Aucune colonne sélectionnée de fond, juste pour la jointure
              where: { pays: req.params.id } // Filtrer par la société spécifiée
            },
            where: {
              date: Sequelize.literal(`(performences.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences GROUP BY fond_id)`)
            },
            limit: 500
          });

          const sumActifNetQuery = `
  SELECT SUM(latest_valorisations.actif_net) AS sumActifNet
  FROM (
      SELECT v.fund_id, MAX(v.date) AS latest_date
      FROM valorisations v
      INNER JOIN fond_investissements f ON v.fund_id = f.id
      WHERE f.pays = :pays
      GROUP BY v.fund_id
  ) AS latest_dates
  INNER JOIN valorisations latest_valorisations 
  ON latest_dates.fund_id = latest_valorisations.fund_id 
  AND latest_dates.latest_date = latest_valorisations.date
  WHERE latest_valorisations.actif_net != '#N/A';
`;

          [result] = await sequelize.query(sumActifNetQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });



          const latestDateQuery = `
    SELECT MAX(valorisations.date) AS latestDate
    FROM valorisations
    INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
    WHERE fond_investissements.pays = :pays
`;

          // Exécuter la requête avec les paramètres nécessaires
          [result5] = await sequelize.query(latestDateQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });

          latestDate = result5?.latestDate || null;

          const latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net, YEAR(valorisations.date) AS year
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.pays = :pays
          GROUP BY valorisations.fund_id, year
          ORDER BY valorisations.date DESC
      `;

          // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
          latestValorisations = await sequelize.query(latestValorisationsQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });

          sumActifNetByYear = {};
          fundCountByYear = {};
          // Calcul de la somme des actifs nets par année
          for (const { year } of latestValorisations) {
            fundCountByYear[year] = 0;
          }
          // Calcul de la somme des actifs nets par année
          for (const { year, actif_net } of latestValorisations) {
            if (!sumActifNetByYear[year]) {
              sumActifNetByYear[year] = 0;
            }
            if (actif_net !== '#N/A') {
              sumActifNetByYear[year] += parseFloat(actif_net);
              fundCountByYear[year] += 1; // Increment the count for the year

            }
          }

        }


        // Renvoi des données
        res.json({
          code: 200,
          data: {
            performa,
            fundCountByYear: fundCountByYear,
            graph: sumActifNetByYear,
            societeData: societeData,
            nbrePart: nbrePart,
            nbresocietes:nbresocietes,
            latestDate: latestDate,
            sumActifNet: result.sumActifNet || 0 // Utilisation de 0 si la somme est null
          }
        });
      })
      .catch(error => {
        // En cas d'erreur, renvoyer un code d'erreur approprié
        res.status(500).json({ error: "Erreur lors de la récupération des données de la société." });
      });
  });
  router.get('/api/getPaysbyidstat/:id', async (req, res) => {
    // Recherche de la société par nom
    const selectedValues = req.query.query;

    pays_regulateurs.findOne({
      where: { pays: req.params.id }
    })
      .then(async response => {
        if (!response) {
          return res.status(404).json({ code: 404, error: 'Pays non trouvé.' });
        }
        // Récupération des informations de base de la société
        const societeData = {
          nom: response.pays,

        };
        const repartition = await fond.findAll({
          attributes: ['categorie_globale', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          where: {
            pays: req.params.id,
            categorie_globale: {
              [Sequelize.Op.not]: null
            }
          },
          group: ['categorie_globale'],
          limit: 500
        });
        var sumActifNetByCategory;
        var latestValorisations;
        var performa;
        var totalfondscompose = 0;
        var totalfonds = 0;
        var totalfondsignore = 0;
        totalfonds = await fond.count();

        if (selectedValues == "EUR") {
          performa = await performences_eurs.findAll({
            attributes: ['fond_id', 'volatility1an', 'perfannu1an', 'volatility3an', 'perfannu3an', 'volatility5an', 'perfannu5an'], // Colonnes à sélectionner
            include: {
              model: fond, // Joindre la table fond
              attributes: ['nom_fond', 'categorie_globale'], // Aucune colonne sélectionnée de fond, juste pour la jointure
              where: { pays: req.params.id } // Filtrer par la société spécifiée
            },
            where: {
              date: Sequelize.literal(`(performences_eurs.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences_eurs GROUP BY fond_id)`)
            },
            limit: 500
          });

          latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net_EUR
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.pays = :pays and fond_investissements.categorie_globale is not null
          GROUP BY valorisations.fund_id
          ORDER BY valorisations.date DESC
      `;
          // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
          latestValorisations = await sequelize.query(latestValorisationsQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });
          sumActifNetByCategory = {};

          // Calcul de la somme des actifs nets par catégorie
          // Calcul de la somme des actifs nets par catégorie
          for (const { fund_id, actif_net_EUR } of latestValorisations) {
            const category = await findCategoryByFundId(fund_id); // Fonction à implémenter pour trouver la catégorie à partir de l'ID du fond

            if (!sumActifNetByCategory[category]) {
              sumActifNetByCategory[category] = 0;
            }
            if (actif_net_EUR !== '#N/A') {
              totalfondscompose += 1;
              sumActifNetByCategory[category] += parseFloat(actif_net_EUR);
            }

          }
        } else if (selectedValues == "USD") {
          performa = await performences_usds.findAll({
            attributes: ['fond_id', 'volatility1an', 'perfannu1an', 'volatility3an', 'perfannu3an', 'volatility5an', 'perfannu5an'], // Colonnes à sélectionner
            include: {
              model: fond, // Joindre la table fond
              attributes: ['nom_fond', 'categorie_globale'], // Aucune colonne sélectionnée de fond, juste pour la jointure
              where: { pays: req.params.id } // Filtrer par la société spécifiée
            },
            where: {
              date: Sequelize.literal(`(performences_usds.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences_usds GROUP BY fond_id)`)
            },
            limit: 500
          });

          latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net_USD
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.pays = :pays and fond_investissements.categorie_globale is not null
          GROUP BY valorisations.fund_id
          ORDER BY valorisations.date DESC
      `;
          // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
          latestValorisations = await sequelize.query(latestValorisationsQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });
          sumActifNetByCategory = {};

          // Calcul de la somme des actifs nets par catégorie
          // Calcul de la somme des actifs nets par catégorie
          for (const { fund_id, actif_net_USD } of latestValorisations) {
            const category = await findCategoryByFundId(fund_id); // Fonction à implémenter pour trouver la catégorie à partir de l'ID du fond

            if (!sumActifNetByCategory[category]) {
              sumActifNetByCategory[category] = 0;
            }

            if (actif_net_USD !== '#N/A') {
              totalfondscompose += 1;

              sumActifNetByCategory[category] += parseFloat(actif_net_USD);
            }
          }
        } else {
          performa = await performences.findAll({
            attributes: ['fond_id', 'volatility1an', 'perfannu1an', 'volatility3an', 'perfannu3an', 'volatility5an', 'perfannu5an'], // Colonnes à sélectionner
            include: {
              model: fond, // Joindre la table fond
              attributes: ['nom_fond', 'categorie_globale'], // Aucune colonne sélectionnée de fond, juste pour la jointure
              where: { pays: req.params.id } // Filtrer par la société spécifiée
            },
            where: {
              date: Sequelize.literal(`(performences.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences GROUP BY fond_id)`)
            },
            limit: 500
          });

          latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.pays = :pays and fond_investissements.categorie_globale is not null
          GROUP BY valorisations.fund_id
          ORDER BY valorisations.date DESC
      `;
          // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
          latestValorisations = await sequelize.query(latestValorisationsQuery, {
            replacements: { pays: response.pays },
            type: sequelize.QueryTypes.SELECT
          });
          sumActifNetByCategory = {};

          // Calcul de la somme des actifs nets par catégorie
          // Calcul de la somme des actifs nets par catégorie
          for (const { fund_id, actif_net } of latestValorisations) {
            const category = await findCategoryByFundId(fund_id); // Fonction à implémenter pour trouver la catégorie à partir de l'ID du fond

            if (!sumActifNetByCategory[category]) {
              sumActifNetByCategory[category] = 0;
            }

            if (actif_net !== '#N/A') {
              totalfondscompose += 1;
              sumActifNetByCategory[category] += parseFloat(actif_net);
            }
          }
        }
        totalfondsignore = totalfonds - totalfondscompose;
        // Renvoi des données
        res.json({
          code: 200,
          data: {
            performa,
            totalfondscompose,
            totalfonds,
            totalfondsignore,
            results2: sumActifNetByCategory,
            repartition: repartition,
            societe: societeData,

          }
        });
      })
      .catch(error => {
        // En cas d'erreur, renvoyer un code d'erreur approprié
        res.status(500).json({ error: "Erreur lors de la récupération des données de la société." });
      });
  });
 

router.post('/api/listesociete', async (req, res) => {
  try {
  const formData = req.body.formData;
  const selectedValues = req.query.query;
  const selectedpays = req.query.selectedpays; // Corrected variable name

  let valuesArray; // Déclaration en dehors de la condition

  if (selectedValues) {
    valuesArray = selectedValues.split(',');
  }

  let whereClause = {}; // Utilisation de let au lieu de const

  if (valuesArray) {
    whereClause = {
      [Op.or]: valuesArray.map(value => ({
        nom: value // Créer une condition pour chaque valeur dans valuesArray
      }))
    };
  }

  if (selectedpays && selectedpays != 'undefined') {
    whereClause.pays = selectedpays; // Filtrer par la catégorie globale si elle est renseignée
  } else {
    // Gérer le cas où selectedpays n'est pas défini
    // Ou effectuer une autre action appropriée, comme attribuer une valeur par défaut à whereClause.pays
  }

  const societes = await societe.findAll({
    where: whereClause, // Pas besoin d'encapsuler dans Op.and, oùClause est déjà un objet
    group: ['nom'],
    order: [['nom', 'ASC']],
    limit: 500
  });

  // Pour stocker les résultats finaux
  let resultats = [];

  // Boucle à travers chaque société pour obtenir le nombre de fonds et la somme des actifs nets
  for (const soc of societes) {
    const nombreFonds = await fond.count({ where: { societe_gestion: soc.nom } });
    // const fonds = await fond.findAll({ where: { societe_gestion: soc.nom } });
    let sommeActifNet = 0;

    // Parcourir tous les fonds de la société
    /*  for (const f of fonds) {
        const dernierEnregistrement = await vl.findOne({
          include: [{ model: fond, where: { societe_gestion: soc.nom } }], // Effectuer une jointure avec la table fond pour récupérer les informations sur le fond
          order: [['date', 'DESC']] // Trier par date en ordre décroissant pour obtenir le dernier enregistrement
        });
 
        if (dernierEnregistrement) {
          sommeActifNet += dernierEnregistrement.actif_net;
        }
      }*/
    // Stocker les résultats dans un objet
    const resultatSociete = {
      nom: soc.nom,
      pays: soc.pays,
      // Ajouter le nombre de fonds et la somme des actifs nets à l'objet
      nombreFonds: nombreFonds,
      sommeActifNet: sommeActifNet || 0 // Assurer qu'il y a une valeur par défaut si aucune somme n'est trouvée
    };

    // Ajouter l'objet résultat à la liste des résultats
    resultats.push(resultatSociete);
  }







  // Envoyez les résultats en tant que réponse JSON
  res.json({
    code: 200,
    data: { societes: resultats }
  });
  } catch (error) {
    console.error('Erreur /api/listesociete:', error.message);
    res.status(500).json({ code: 500, message: 'Erreur serveur' });
  }
});

router.post('/api/listeproduitpayssociete/:id', async (req, res) => {
  try {
  const formData = req.body.formData;
  const selectedValues = req.query.query;
  const selectedCategorie = req.query.selectedcategorie; // Corrected variable name

  let valuesArray; // Déclaration en dehors de la condition

  if (selectedValues) {
    valuesArray = selectedValues.split(',');
  }

  let whereClause = {};

  if (valuesArray) {
    whereClause = {
      [Op.or]: valuesArray.map(value => ({
        id: value
      }))
    };
  } else {
    whereClause = sequelize.where(sequelize.fn('LOWER', sequelize.col('pays')), req.params.id.toLowerCase());
  }

  let conditions = [whereClause];
  if (typeof selectedCategorie !== 'undefined') {
    conditions.push(sequelize.where(sequelize.fn('LOWER', sequelize.col('categorie_globale')), selectedCategorie.toLowerCase()));
  }

  const funds = await fond.findAll({
    where: {
      [Op.and]: conditions
    },
    limit: 500
  });

  const fundIds = funds.map(f => f.id);
  const allPerformances = fundIds.length > 0 ? await performences.findAll({
    where: { fond_id: fundIds },
    order: [['date', 'DESC']],
  }) : [];
  const perfMap = {};
  allPerformances.forEach(p => {
    if (!perfMap[p.fond_id]) perfMap[p.fond_id] = p;
  });

  const fundsWithAllData = funds.map(fund => {
    const perf = perfMap[fund.id] || null;
    return {
      id: fund.id,
      fundData: fund.toJSON(),
      performanceData: perf ? perf.toJSON() : null,
    };
  });



  let resultats = fundsWithAllData;


  // Envoyez les résultats en tant que réponse JSON
  res.json({
    code: 200,
    data: { funds: resultats }
  });
  } catch (error) {
    console.error('Erreur /api/listeproduitpayssociete:', error.message);
    res.status(500).json({ code: 500, message: 'Erreur serveur' });
  }
});
router.post('/api/listesocietepays/:id', async (req, res) => {
  try {
  const formData = req.body.formData;
  const selectedValues = req.query.query;
  const selectedpays = req.query.selectedpays; // Corrected variable name

  let valuesArray; // Déclaration en dehors de la condition

  if (selectedValues) {
    valuesArray = selectedValues.split(',');
  }

  let whereClause;

  if (valuesArray) {
    whereClause = {
      [Op.or]: valuesArray.map(value => ({
        nom: value
      }))
    };
  } else {
    whereClause = sequelize.where(sequelize.fn('LOWER', sequelize.col('pays')), req.params.id.toLowerCase());
  }

  const societes = await societe.findAll({
    where: whereClause,
    limit: 500
  });

  let resultats = [];

  for (const soc of societes) {
    const nombreFonds = await fond.count({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('societe_gestion')), soc.nom.toLowerCase()) });
    //   const fonds = await fond.findAll({ where: { societe_gestion: soc.nom } });
    let sommeActifNet = 0;

    // Parcourir tous les fonds de la société
    /*  for (const f of fonds) {
        const dernierEnregistrement = await vl.findOne({
          include: [{ model: fond, where: { societe_gestion: soc.nom } }], // Effectuer une jointure avec la table fond pour récupérer les informations sur le fond
          order: [['date', 'DESC']] // Trier par date en ordre décroissant pour obtenir le dernier enregistrement
        });
 
        if (dernierEnregistrement) {
          sommeActifNet += dernierEnregistrement.actif_net;
        }
      }*/
    // Stocker les résultats dans un objet
    const resultatSociete = {
      nom: soc.nom,
      pays: soc.pays,
      // Ajouter le nombre de fonds et la somme des actifs nets à l'objet
      nombreFonds: nombreFonds,
      sommeActifNet: sommeActifNet || 0 // Assurer qu'il y a une valeur par défaut si aucune somme n'est trouvée
    };

    // Ajouter l'objet résultat à la liste des résultats
    resultats.push(resultatSociete);
  }







  // Envoyez les résultats en tant que réponse JSON
  res.json({
    code: 200,
    data: { societes: resultats }
  });
  } catch (error) {
    console.error('Erreur /api/listesocietepays:', error.message);
    res.status(500).json({ code: 500, message: 'Erreur serveur' });
  }
});

  module.exports = router;