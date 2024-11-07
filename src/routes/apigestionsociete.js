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
const { Op } = require('sequelize'); // Ajout de l'importation de Op
const findCategoryByFundId = async (fundId) => {
  // Implémentez ici la logique pour récupérer la catégorie à partir de l'identifiant du fond
  // Par exemple, vous pouvez exécuter une requête SQL pour obtenir la catégorie à partir de l'identifiant du fond

  // Exemple fictif de requête SQL
  const categoryQuery = `
        SELECT categorie_globale
        FROM fond_investissements
        WHERE id = :fundId
    `;

  // Exécutez la requête SQL avec le paramètre fundId
  const [result] = await sequelize.query(categoryQuery, {
    replacements: { fundId: fundId },
    type: sequelize.QueryTypes.SELECT
  });

  // Retournez la catégorie extraite de la requête
  return result.categorie_globale;
};


// Update management company information
router.post('/api/addSociete', async (req, res) => {
  try {
    const { societeadd, pays } = req.body;
    societe.create({
      nom: societeadd,
      pays: pays,
      // Ajoutez d'autres champs ici
    })


    res.status(200).json({ message: 'Données insérées avec succès' });
  } catch (error) {
    // Gérez les erreurs ici
    console.error('Erreur lors de l\'insertion en base de données :', error);
    res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
  }
});
router.post('/api/updateSociete', async (req, res) => {
  const { societ, nom, description, email, tel, numeroagrement, pays, regulateur, dateimmatriculation, site_web, devise, password } = req.body;

  const updatedSociete = await societe.update(
    {
      //  nom: nom !== undefined ? nom : societ,
      description: description,
      email: email,
      tel: tel,
      numeroagrement: numeroagrement,
      pays: pays,
      regulateur: regulateur,
      dateimmatriculation: dateimmatriculation,
      site_web: site_web,
      devise: devise
    },
    {
      where: { nom: societ },
    }
  );

  const utilisateurs = await users.findOne({
    where: { denomination: societ }
  });

  if (utilisateurs.length > 0) {
    const utilisateur = utilisateurs[0]; // Vous pouvez modifier cela pour choisir l'utilisateur que vous souhaitez

    if (password != '') {
      // Modification du mot de passe de l'utilisateur
      const newPassword = 'nouveauMotDePasse'; // Remplacez 'nouveauMotDePasse' par le nouveau mot de passe souhaité
      const hashedPassword = await bcrypt.hash(newPassword, 10); // Hashage du mot de passe

      // Modification du champ password dans la base de données
      await utilisateur.update({ password: password,/* denomination: nom !== undefined ? nom : societ*/ });
    }

  }

    res.json({code:200, message: 'Societe information updated successfully' });

});
router.get('/api/getSocietebyid/:id', async (req, res) => {

  societe.findOne({
    where: { nom: req.params.id }
  })
    .then(response => {

      const societe = {
        nom: response.nom,
        description: response.description,
        email: response.email,
        tel: response.tel,
        numeroagrement: response.numeroagrement,
        pays: response.pays,
        regulateur: response.regulateur,
        dateimmatriculation: response.dateimmatriculation,
        site_web: response.site_web,
        devise: response.devise


      };
      res.json({
        code: 200,
        data: {
          societe
        }
      })
    })
})
router.get('/api/getSocietebyidfisrt/:id', async (req, res) => {
  const selectedValues = req.query.query;

  // Recherche de la société par nom
  societe.findOne({
    where: { nom: req.params.id }
  })
    .then(async response => {
      // Récupération des informations de base de la société
      const societeData = {
        nom: response.nom,
        description: response.description,
        email: response.email,
        tel: response.tel,
        numeroagrement: response.numeroagrement,
        pays: response.pays,
        regulateur: response.regulateur,
        dateimmatriculation: response.dateimmatriculation,
        site_web: response.site_web,
        devise: response.devise
      };

      // Recherche du nombre de fonds associés à cette société
      const nbrePart = await fond.count({ where: { societe_gestion: response.nom } });
      var latestValorisations;
      var latestDate;
      var latestDateQuery;
      var result;
      var result5;
      var sumActifNetByYear;
      if (selectedValues == "EUR") {
        const sumActifNetQuery = `
  SELECT SUM(latest_valorisations.actif_net_EUR) AS sumActifNet
  FROM (
      SELECT v.fund_id, MAX(v.date) AS latest_date
      FROM valorisations v
      INNER JOIN fond_investissements f ON v.fund_id = f.id
      WHERE f.societe_gestion = :societeNom
      GROUP BY v.fund_id
  ) AS latest_dates
  INNER JOIN valorisations latest_valorisations 
  ON latest_dates.fund_id = latest_valorisations.fund_id 
  AND latest_dates.latest_date = latest_valorisations.date
  WHERE latest_valorisations.actif_net_EUR != '#N/A';
`;

        [result] = await sequelize.query(sumActifNetQuery, {
          replacements: { societeNom: response.nom },
          type: sequelize.QueryTypes.SELECT
        });



        const latestDateQuery = `
    SELECT MAX(valorisations.date) AS latestDate
    FROM valorisations
    INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
    WHERE fond_investissements.societe_gestion = :societeNom
`;

        // Exécuter la requête avec les paramètres nécessaires
        [result5] = await sequelize.query(latestDateQuery, {
          replacements: { societeNom: response.nom },
          type: sequelize.QueryTypes.SELECT
        });

        latestDate = result5.latestDate;

        const latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net_EUR, YEAR(valorisations.date) AS year
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.societe_gestion = :societeNom
          GROUP BY valorisations.fund_id, year
          ORDER BY valorisations.date DESC
      `;

        // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
        latestValorisations = await sequelize.query(latestValorisationsQuery, {
          replacements: { societeNom: response.nom },
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
          sumActifNetByYear[year] += parseFloat(actif_net_EUR);
          fundCountByYear[year] += 1; // Increment the count for the year

        }
      } else if (selectedValues == "USD") {
        const sumActifNetQuery = `
  SELECT SUM(latest_valorisations.actif_net_USD) AS sumActifNet
  FROM (
      SELECT v.fund_id, MAX(v.date) AS latest_date
      FROM valorisations v
      INNER JOIN fond_investissements f ON v.fund_id = f.id
      WHERE f.societe_gestion = :societeNom
      GROUP BY v.fund_id
  ) AS latest_dates
  INNER JOIN valorisations latest_valorisations 
  ON latest_dates.fund_id = latest_valorisations.fund_id 
  AND latest_dates.latest_date = latest_valorisations.date
  WHERE latest_valorisations.actif_net_USD != '#N/A';
`;

        [result] = await sequelize.query(sumActifNetQuery, {
          replacements: { societeNom: response.nom },
          type: sequelize.QueryTypes.SELECT
        });



        const latestDateQuery = `
    SELECT MAX(valorisations.date) AS latestDate
    FROM valorisations
    INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
    WHERE fond_investissements.societe_gestion = :societeNom
`;

        // Exécuter la requête avec les paramètres nécessaires
        [result5] = await sequelize.query(latestDateQuery, {
          replacements: { societeNom: response.nom },
          type: sequelize.QueryTypes.SELECT
        });

        latestDate = result5.latestDate;

        const latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net_USD, YEAR(valorisations.date) AS year
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.societe_gestion = :societeNom
          GROUP BY valorisations.fund_id, year
          ORDER BY valorisations.date DESC
      `;

        // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
        latestValorisations = await sequelize.query(latestValorisationsQuery, {
          replacements: { societeNom: response.nom },
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
          sumActifNetByYear[year] += parseFloat(actif_net_USD);
          fundCountByYear[year] += 1; // Increment the count for the year

        }
      } else {
        const sumActifNetQuery = `
  SELECT SUM(latest_valorisations.actif_net) AS sumActifNet
  FROM (
      SELECT v.fund_id, MAX(v.date) AS latest_date
      FROM valorisations v
      INNER JOIN fond_investissements f ON v.fund_id = f.id
      WHERE f.societe_gestion = :societeNom
      GROUP BY v.fund_id
  ) AS latest_dates
  INNER JOIN valorisations latest_valorisations 
  ON latest_dates.fund_id = latest_valorisations.fund_id 
  AND latest_dates.latest_date = latest_valorisations.date
  WHERE latest_valorisations.actif_net != '#N/A';
`;

        [result] = await sequelize.query(sumActifNetQuery, {
          replacements: { societeNom: response.nom },
          type: sequelize.QueryTypes.SELECT
        });



        const latestDateQuery = `
    SELECT MAX(valorisations.date) AS latestDate
    FROM valorisations
    INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
    WHERE fond_investissements.societe_gestion = :societeNom
`;

        // Exécuter la requête avec les paramètres nécessaires
        [result5] = await sequelize.query(latestDateQuery, {
          replacements: { societeNom: response.nom },
          type: sequelize.QueryTypes.SELECT
        });

        latestDate = result5.latestDate;

        const latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net, YEAR(valorisations.date) AS year

          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.societe_gestion = :societeNom
          GROUP BY valorisations.fund_id, year
          ORDER BY valorisations.date DESC
      `;

        // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
        latestValorisations = await sequelize.query(latestValorisationsQuery, {
          replacements: { societeNom: response.nom },
          type: sequelize.QueryTypes.SELECT
        });

        sumActifNetByYear = {};
        fundCountByYear = {};
        // Calcul de la somme des actifs nets par année
        for (const { year } of latestValorisations) {
          fundCountByYear[year] = 0;
        }
        for (const { year, actif_net } of latestValorisations) {
          if (!sumActifNetByYear[year]) {
            sumActifNetByYear[year] = 0;
          }
          sumActifNetByYear[year] += parseFloat(actif_net);
          fundCountByYear[year] += 1; // Increment the count for the year

        }

      }


      // Renvoi des données
      res.json({
        code: 200,
        data: {
          fundCountByYear: fundCountByYear,
          graph: sumActifNetByYear,
          societe: societeData,
          nbrePart: nbrePart,
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


router.get('/api/getSocietebyidstat/:id', async (req, res) => {
  // Recherche de la société par nom
  const selectedValues = req.query.query;

  societe.findOne({
    where: { nom: req.params.id }
  })
    .then(async response => {
      // Récupération des informations de base de la société
      const societeData = {
        nom: response.nom,
        description: response.description,
        email: response.email,
        tel: response.tel,
        numeroagrement: response.numeroagrement,
        pays: response.pays,
        regulateur: response.regulateur,
        dateimmatriculation: response.dateimmatriculation,
        site_web: response.site_web,
        devise: response.devise
      };

      const repartition = await fond.findAll({
        attributes: ['categorie_globale', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: {
          societe_gestion: req.params.id,
          categorie_globale: {
            [Sequelize.Op.not]: null
          }
        },
        group: ['categorie_globale']
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
            where: { societe_gestion: req.params.id } // Filtrer par la société spécifiée
          },
          where: {
            date: Sequelize.literal(`(performences_eurs.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences_eurs GROUP BY fond_id)`)
          }
        });

        latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net_EUR
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.societe_gestion = :societeNom and  fond_investissements.categorie_globale is not null
          GROUP BY valorisations.fund_id
          ORDER BY valorisations.date DESC
      `;
        // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
        latestValorisations = await sequelize.query(latestValorisationsQuery, {
          replacements: { societeNom: response.nom },
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
            totalfondscompose += totalfondscompose;

            sumActifNetByCategory[category] += parseFloat(actif_net_EUR);
          }
        }
      } else if (selectedValues == "USD") {
        performa = await performences_usds.findAll({
          attributes: ['fond_id', 'volatility1an', 'perfannu1an', 'volatility3an', 'perfannu3an', 'volatility5an', 'perfannu5an'], // Colonnes à sélectionner
          include: {
            model: fond, // Joindre la table fond
            attributes: ['nom_fond', 'categorie_globale'], // Aucune colonne sélectionnée de fond, juste pour la jointure
            where: { societe_gestion: req.params.id } // Filtrer par la société spécifiée
          },
          where: {
            date: Sequelize.literal(`(performences_usds.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences_usds GROUP BY fond_id)`)
          }
        });

        latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net_USD
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.societe_gestion = :societeNom and  fond_investissements.categorie_globale is not null
          GROUP BY valorisations.fund_id
          ORDER BY valorisations.date DESC
      `;
        // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
        latestValorisations = await sequelize.query(latestValorisationsQuery, {
          replacements: { societeNom: response.nom },
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
            totalfondscompose += totalfondscompose;

            sumActifNetByCategory[category] += parseFloat(actif_net_USD);
          }
        }
      } else {
        performa = await performences.findAll({
          attributes: ['fond_id', 'volatility1an', 'perfannu1an', 'volatility3an', 'perfannu3an', 'volatility5an', 'perfannu5an'], // Colonnes à sélectionner
          include: {
            model: fond, // Joindre la table fond
            attributes: ['nom_fond', 'categorie_globale'], // Aucune colonne sélectionnée de fond, juste pour la jointure
            where: { societe_gestion: req.params.id } // Filtrer par la société spécifiée
          },
          where: {
            date: Sequelize.literal(`(performences.date, fond_id) IN (SELECT MAX(date), fond_id FROM performences GROUP BY fond_id)`)
          }
        });

        latestValorisationsQuery = `
          SELECT valorisations.fund_id, valorisations.actif_net
          FROM valorisations
          INNER JOIN fond_investissements ON valorisations.fund_id = fond_investissements.id
          WHERE fond_investissements.societe_gestion = :societeNom and  fond_investissements.categorie_globale is not null
          GROUP BY valorisations.fund_id
          ORDER BY valorisations.date DESC
      `;
        // Exécuter la requête pour obtenir les dernières valorisations pour chaque fonds
        latestValorisations = await sequelize.query(latestValorisationsQuery, {
          replacements: { societeNom: response.nom },
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
            totalfondscompose += totalfondscompose;

            sumActifNetByCategory[category] += parseFloat(actif_net);
          }
        }
      }
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
router.post('/api/listeproduitsociete/:id', async (req, res) => {
  const formData = req.body.formData;
  const selectedValues = req.query.query;
  const selectedCategorie = req.query.selectedcategorie; // Corrected variable name

  let valuesArray; // Déclaration en dehors de la condition

  if (selectedValues) {
    valuesArray = selectedValues.split(',');
  }

  let whereClause = { societe_gestion: req.params.id }; // Utilisation de let au lieu de const

  if (valuesArray) {
    whereClause = {
      [Op.or]: valuesArray.map(value => ({
        id: value // Créer une condition pour chaque valeur dans valuesArray
      }))
    };
  }

  if (typeof selectedCategorie !== 'undefined' && selectedCategorie !== 'undefined') {
    whereClause.categorie_globale = selectedCategorie; // Filtrer par la catégorie globale si elle est renseignée
  }

  const funds = await fond.findAll({
    where: {
      [Op.and]: [whereClause] // Utiliser Op.and pour combiner les conditions
    }
  });


  const fundsWithAllData = await Promise.all(funds.map(async (fund) => {
    try {
      const fundData = await fond.findByPk(fund.id);

      if (!fundData) {
        return { error: `Aucun élément trouvé pour l'ID ${fund.id}` };
      }

      // Create an array of promises for the external API calls
      const promessesPerformances = performences.findOne({
        where: {
          fond_id: fund.id,
        },
        order: [
          ['date', 'DESC']
        ]
      })
        .catch((error) => {
          console.error('Erreur lors de la recherche des performances :', error);
          return { error: 'Erreur lors de la recherche des performances.' };
        });

      // Use Promise.all to wait for all queries to finish
      const [performanceResults] = await Promise.all([promessesPerformances]);

      // Combine data from both sources
      const fundCombinedData = {
        id: fund.id,
        fundData: fundData.toJSON(),
        performanceData: performanceResults.toJSON(),
      };

      return fundCombinedData;
    } catch (error) {
      console.error('Erreur lors de la recherche des données :', error);
      return { error: 'Une erreur est survenue lors de la récupération des données.' };
    }
  }));



  let resultats = fundsWithAllData;


  // Envoyez les résultats en tant que réponse JSON
  res.json({
    code: 200,
    data: { funds: resultats }
  });
});
router.get('/api/getsocieterecherche', (req, res) => {
  // Première requête pour récupérer toutes les sociétés de gestion
  societe.findAll({
    group: ['nom'],
    order: [['nom', 'ASC']]
  }).then(societes => {
    const societesGestion = societes.map(societe => societe.nom);

    // Pour chaque société de gestion, effectuez une deuxième requête pour compter le nombre de fonds associés
    const promises = societesGestion.map(societeGestion => {
      return fond.count({
        where: {
          societe_gestion: societeGestion
        }
      });
    });

    // Attendez que toutes les promesses soient résolues
    return Promise.all(promises)
      .then(counts => {
        const societesAvecCounts = societesGestion.map((societeGestion, index) => ({
          ...societes.find(societe => societe.nom === societeGestion).toJSON(), // Ajouter toutes les colonnes de la société
          nbre_fonds: counts[index]
        }));
        return societesAvecCounts;
      });
  })
    .then(societesAvecCounts => {
      res.json({
        code: 200,
        data: {
          societes: societesAvecCounts
        }
      });
    })
    .catch(error => {
      console.error('Error:', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
    });
});

router.get('/api/getsocieteidmeta/:id', (req, res) => {
  const societeId = req.params.id;
  societe.findOne({
    where: { nom: societeId }
  }).then(societe => {
    if (!societe) {
      return res.status(404).json({ error: "Societe not found" });
    }
    res.json({
      code: 200,
      data: {
        societe: societe
      }
    });
  })
    .catch(error => {
      console.error('Error:', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
    });
});

module.exports = router;