const express = require('express');
const router = express.Router();
const { Sequelize, Op } = require('sequelize');
const math = require('mathjs');
const bcrypt = require('bcrypt');

const {
  sequelize,
  pays_regulateurs,
  societe,
  devises,
  devisedechanges,
  fond,
  indice,
  tsrhisto,
  users,
  performences,
  performences_eurs,
  performences_usds,
  vl,
} = require('../shared/db');

const { generateSlug } = require('../../src/functions/slug');

// =============================================
// Pays Routes
// =============================================

// GET /api/getPays - Liste des pays (distinct)
router.get('/api/getPays', (req, res) => {
  pays_regulateurs
    .findAll({
      attributes: ['id', 'pays'],
      group: ['pays'],
      order: [['pays', 'ASC']],
      limit: 500,
    })
    .then(response => {
      const paysOptions = response.map((data) => ({
        value: data.pays,
        label: data.pays,
      }));
      res.json({
        code: 200,
        data: {
          paysOptions
        }
      });
    });
});

// GET /api/getPaysall - Liste des pays avec nombre de sociétés et fonds
router.get('/api/getPaysall', async (req, res) => {
  try {
    const countries = await pays_regulateurs.findAll({
      attributes: [[sequelize.literal('DISTINCT pays'), 'pays']],
      order: [['pays', 'ASC']],
      limit: 500,
    });

    const companiesPerCountry = await sequelize.query(`
      SELECT pays, COUNT(*) AS companyCount
      FROM societes
      GROUP BY pays
    `, { type: sequelize.QueryTypes.SELECT });

    const fondsPerCountry = await sequelize.query(`
      SELECT pays, COUNT(*) AS fondsCount
      FROM fond_investissements
      GROUP BY pays
    `, { type: sequelize.QueryTypes.SELECT });

    const countriesWithCompanies = countries.map(country => ({
      pays: country.pays,
      slug: generateSlug(country.pays),
      companyCount: companiesPerCountry.find(c => c.pays === country.pays)?.companyCount ?? 0,
      fondscount: fondsPerCountry.find(c => c.pays === country.pays)?.fondsCount ?? 0
    }));

    const tableData = countriesWithCompanies.map(({ pays, companyCount, fondscount }) => ({ pays, companyCount, fondscount }));

    res.json({
      code: 200,
      data: {
        countriesWithCompanies: tableData
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error'
    });
  }
});

// GET /api/getCompaniesInCountry - Alias/placeholder for getting companies in a country
// (Not found in the monolith, registered in service registry - delegates to getSocietesbypays logic)
router.get('/api/getCompaniesInCountry/:pays', async (req, res) => {
  const pays = req.params.pays;

  societe.findAll({
    where: { pays: pays },
    limit: 500,
  })
    .then(response => {
      const societes = response.map((data) => ({
        id: data.id,
        name: data.nom,
        description: data.description,
        email: data.email,
        tel: data.tel,
      }));
      res.json({
        code: 200,
        data: {
          societes
        }
      });
    })
    .catch(error => {
      console.error('Error:', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
    });
});

// =============================================
// Regulateur & Devise Routes
// =============================================

// GET /api/getRegulateur - Recherche du régulateur par pays
router.get('/api/getRegulateur', (req, res) => {
  const selectedPays = req.query.pays;

  pays_regulateurs
    .findOne({
      attributes: ['regulateur'],
      where: { pays: selectedPays },
    })
    .then((response) => {
      if (response) {
        const regulateur = {
          value: response.regulateur,
          label: response.regulateur,
        };

        res.json({
          code: 200,
          data: {
            regulateur
          }
        });
      } else {
        res.status(404).json({
          code: 404,
          error: 'Régulateur introuvable pour ce pays.',
        });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({
        code: 500,
        error: 'Une erreur s\'est produite lors de la récupération du régulateur.',
      });
    });
});

// GET /api/getDevise - Recherche de la devise par pays
router.get('/api/getDevise', (req, res) => {
  const selectedPays = req.query.pays;

  pays_regulateurs
    .findOne({
      attributes: ['symboledevise'],
      where: { pays: selectedPays },
    })
    .then((response) => {
      if (response) {
        const deviseData = {
          value: response.symboledevise,
          label: response.symboledevise,
        };

        res.json({
          code: 200,
          data: {
            devises: deviseData
          }
        });
      } else {
        res.status(404).json({
          code: 404,
          error: 'Devise introuvable pour ce pays.',
        });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({
        code: 500,
        error: 'Une erreur s\'est produite lors de la récupération du régulateur.',
      });
    });
});

// GET /api/getDevises - Liste de toutes les devises
router.get('/api/getDevises', async (req, res) => {
  devises.findAll({
    limit: 500,
  })
    .then(response => {
      const devisesData = response.map((data) => ({
        id: data.id,
        devise: data.Symbole,
      }));
      res.json({
        code: 200,
        data: {
          devises: devisesData
        }
      });
    });
});

// GET /api/fetch-currency-pairs - Récupérer les paires de devises depuis l'API
router.get('/api/fetch-currency-pairs', async (req, res) => {
  try {
    const apikey = "92f2058ef24f7fcdd129c260";
    const url = `https://v6.exchangerate-api.com/v6/${apikey}/latest/USD`;

    const response = await fetch(url);
    const data = await response.json();

    const pairs = Object.keys(data.conversion_rates).map(pair => ({
      paire: `USD/${pair}`,
      value: data.conversion_rates[pair],
      date: new Date()
    }));

    await devisedechanges.bulkCreate(pairs);

    res.status(200).json({ message: 'Les paires de devises ont été récupérées et enregistrées avec succès.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des paires de devises.' });
  }
});

// =============================================
// Categories & Indice Routes
// =============================================

// GET /api/getCategories - Catégories régionales et nationales distinctes
router.get('/api/getCategories', async (req, res) => {
  try {
    const categoriesRegion = await fond.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('categorie_regional')), 'categorie_regional']
      ],
      limit: 500,
    });

    const categoriesNational = await fond.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('categorie_national')), 'categorie_national']
      ],
      limit: 500,
    });

    const filteredCategoriesRegion = categoriesRegion
      .map(item => item.get('categorie_regional'))
      .filter(categorie => categorie !== null && categorie !== '');

    const filteredCategoriesNational = categoriesNational
      .map(item => item.get('categorie_national'))
      .filter(categorie => categorie !== null && categorie !== '');

    const distinctCategorieregional = filteredCategoriesRegion.map(category => category);
    const distinctNationalCategories = filteredCategoriesNational.map(category => category);

    res.json({
      code: 200,
      data: {
        categoriesRegional: distinctCategorieregional,
        categoriesNational: distinctNationalCategories
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// GET /api/getIndice - Indices distincts
router.get('/api/getIndice', async (req, res) => {
  try {
    const indices = await indice.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('id_indice')), 'nom_indice']
      ],
      limit: 500,
    });

    res.json({
      code: 200,
      data: {
        indices: indices.map(index => ({ id: index.id, name: index.nom_indice })),
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// =============================================
// Societe Routes
// =============================================

// GET /api/getSocietes - Liste de toutes les sociétés
router.get('/api/getSocietes', async (req, res) => {
  societe.findAll({
    limit: 500,
  })
    .then(response => {
      const societes = response.map((data) => ({
        id: data.id,
        name: data.nom,
        slug: generateSlug(data.nom),
        description: data.description,
        email: data.email,
        tel: data.tel,
      }));
      res.json({
        code: 200,
        data: {
          societes
        }
      });
    });
});

// GET /api/getSocietesbypays/:pays - Sociétés filtrées par pays
router.get('/api/getSocietesbypays/:pays', async (req, res) => {
  const pays = req.params.pays;

  societe.findAll({
    where: { pays: pays },
    limit: 500,
  })
    .then(response => {
      const societes = response.map((data) => ({
        id: data.id,
        name: data.nom,
        description: data.description,
        email: data.email,
        tel: data.tel,
      }));
      res.json({
        code: 200,
        data: {
          societes
        }
      });
    });
});

// GET /api/getSocietebyid/:id - Détails d'une société par nom
router.get('/api/getSocietebyid/:id', async (req, res) => {
  try {
    const response = await societe.findOne({
      where: { nom: req.params.id }
    });

    if (!response) {
      return res.status(404).json({ error: 'Société non trouvée' });
    }

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
    res.json({
      code: 200,
      data: {
        societe: societeData
      }
    });
  } catch (error) {
    console.error('Error fetching societe:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de la société.' });
  }
});

// POST /api/addSociete - Ajouter une société
router.post('/api/addSociete', async (req, res) => {
  try {
    const { societeadd, pays } = req.body;
    await societe.create({
      nom: societeadd,
      pays: pays,
    });

    res.status(200).json({ message: 'Données insérées avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'insertion en base de données :', error);
    res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
  }
});

// POST /api/updateSociete - Mettre à jour une société
router.post('/api/updateSociete', async (req, res) => {
  try {
    const { societ, nom, description, email, tel, numeroagrement, pays, regulateur, dateimmatriculation, site_web, devise, password } = req.body;

    await societe.update(
      {
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

    const utilisateur = await users.findOne({
      where: { denomination: societ }
    });

    if (utilisateur && password && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await utilisateur.update({ password: hashedPassword });
    }

    res.json({ code: 200, message: 'Societe information updated successfully' });
  } catch (error) {
    console.error('Error updating societe:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la société' });
  }
});

// POST /api/listesociete - Liste des sociétés avec filtres
router.post('/api/listesociete', async (req, res) => {
  const formData = req.body.formData;
  const selectedValues = req.query.query;
  const selectedpays = req.query.selectedpays;

  let valuesArray;

  if (selectedValues) {
    valuesArray = selectedValues.split(',');
  }

  let whereClause = {};

  if (valuesArray) {
    whereClause = {
      [Op.or]: valuesArray.map(value => ({
        nom: value
      }))
    };
  }

  if (selectedpays && selectedpays != 'undefined') {
    whereClause.pays = selectedpays;
  } else {
  }

  const societes = await societe.findAll({
    where: whereClause,
    group: ['nom'],
    order: [['nom', 'ASC']],
    limit: 500
  });

  let resultats = [];

  for (const soc of societes) {
    const nombreFonds = await fond.count({ where: { societe_gestion: soc.nom } });
    let sommeActifNet = 0;

    const resultatSociete = {
      nom: soc.nom,
      pays: soc.pays,
      nombreFonds: nombreFonds,
      sommeActifNet: sommeActifNet || 0
    };

    resultats.push(resultatSociete);
  }

  res.json({
    code: 200,
    data: { societes: resultats }
  });
});

// POST /api/listesocietepays/:id - Liste des sociétés par pays
router.post('/api/listesocietepays/:id', async (req, res) => {
  const formData = req.body.formData;
  const selectedValues = req.query.query;
  const selectedpays = req.query.selectedpays;

  let valuesArray;

  if (selectedValues) {
    valuesArray = selectedValues.split(',');
  }

  let whereClause = { pays: req.params.id };

  if (valuesArray) {
    whereClause = {
      [Op.or]: valuesArray.map(value => ({
        nom: value
      }))
    };
  }

  const societes = await societe.findAll({
    where: whereClause,
    limit: 500
  });

  let resultats = [];

  for (const soc of societes) {
    const nombreFonds = await fond.count({ where: { societe_gestion: soc.nom } });
    let sommeActifNet = 0;

    const resultatSociete = {
      nom: soc.nom,
      pays: soc.pays,
      nombreFonds: nombreFonds,
      sommeActifNet: sommeActifNet || 0
    };

    resultats.push(resultatSociete);
  }

  res.json({
    code: 200,
    data: { societes: resultats }
  });
});

// =============================================
// TSR Route
// =============================================

// GET /api/tsr/:year - Taux sans risque
router.get('/api/tsr/:year', async (req, res) => {
  try {
    const lastValue = await tsrhisto.findOne({
      where: {
        date: {
          [Op.lt]: new Date(new Date().setDate(0))
        },
        annee: req.params.year
      },
      order: [['date', 'DESC']]
    });

    if (!lastValue) {
      throw new Error('No data found for the last month.');
    }

    const endDate = lastValue.date;
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 10);

    const values = await tsrhisto.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        },
        annee: req.params.year
      },
      order: [['date', 'ASC']],
      limit: 500,
    });

    const valueArray = values.map(record => record.value);
    const annualYield = math.mean(valueArray);


    res.json({
      code: 200,
      data: {
        year: req.params.year,
        tsr: annualYield
      }
    });
  } catch (error) {
    console.error('Error fetching TSR:', error);
    res.status(500).json({ error: 'Erreur lors du calcul du taux sans risque.' });
  }
});

module.exports = router;
