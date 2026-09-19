const moment = require('moment');
const { vl, fond, portefeuille, portefeuilles_proposes_vls, simulationportefeuille, simulation, sequelize } = require('../db/sequelize');
const { Op } = require('sequelize');
const { groupDatesByYear, adaptValuesToGroupedYears, AdaptTableauwithdate } = require('../functions/dates');

function findCommonDates(dataSets) {
  const sets = dataSets.map(data => new Set(data.map(row => moment(row.date).format('YYYY-MM-DD'))));
  let common = [...sets[0]];
  for (let i = 1; i < sets.length; i++) {
    common = common.filter(date => sets[i].has(date));
  }
  return common;
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
      query += ` AND f.categorie_globale = :selectedcategorie `;
    }
    if (selectedDevise != 'undefined') {
      query += ` AND f.dev_libelle = :selectedDevise `;
    }
    if (frequence != 'undefined' && frequence.length >= 1) {
      query += ` AND f.periodicite = :frequence `;
    }
    if (selectedsociete != 'undefined') {
      query += ` AND f.societe_gestion = :selectedsociete `;
    }

    const fondsDansCategorie = await sequelize.query(query, {
      replacements: { selectedsociete, selectedcategorie, selectedDevise, frequence },
      type: sequelize.QueryTypes.SELECT,
    });
    return fondsDansCategorie;
  } catch (erreur) {
    console.error('Erreur lors de la récupération des fonds par catégorie :', erreur);
    throw erreur;
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
      query += ` AND f.categorie_globale = :selectedcategorie `;
    }
    if (selectedDevise != 'undefined') {
      query += ` AND f.dev_libelle = :selectedDevise `;
    }
    if (frequence != 'undefined' && frequence.length >= 1) {
      query += ` AND f.periodicite = :frequence `;
    }
    if (selectedsociete != 'undefined') {
      query += ` AND f.societe_gestion = :selectedsociete `;
    }

    const fondsDansCategorie = await sequelize.query(query, {
      replacements: { selectedsociete, selectedcategorie, selectedDevise, frequence },
      type: sequelize.QueryTypes.SELECT,
    });
    return fondsDansCategorie;
  } catch (erreur) {
    console.error('Erreur lors de la récupération des fonds par catégorie :', erreur);
    throw erreur;
  }
}

module.exports = (app) => {

  app.get('/api/robotadvisor/fonds', async (req, res) => {
    const ids = req.query.ids.split(',');
    const fundIds = ids;
    var PortfolioAllocation = require('portfolio-allocation');
    const formdata = req.params.formData;
    var minWeight = [];
    var maxWeight = []
    if (req.query.minweight) {
      minWeight = JSON.parse(req.query.minweight);
      maxWeight = JSON.parse(req.query.maxweight);
    }

    const minReturn = req.query.minReturn / 100;
    const maxReturn = req.query.maxReturn / 100;
    const minVolatility = req.query.minVolatility / 100;
    const maxVolatility = req.query.maxVolatility / 100;

    try {
      const fundData = await Promise.all(
        fundIds.map(async fundId => {
          const data = await vl.findAll({
            where: { fund_id: fundId },
            order: [['date', 'ASC']],
            limit: 500,
          });
          return { fundId, data };
        })
      );

      const commonDates = findCommonDates(fundData.map(entry => entry.data));

      const filteredData = fundData.map(entry => {
        const filteredValues = entry.data.filter(row => commonDates.includes(moment(row.date).format('YYYY-MM-DD')));
        return {
          fundId: entry.fundId,
          values: filteredValues.map(row => row.value)
        };
      });

      const returnsData = filteredData.map(entry => {
        const values = entry.values;
        const ArrayDates = groupDatesByYear(commonDates);
        const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
        const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
        return { fundId: entry.fundId, returns: adaptValues1 };
      });

      const ddd = returnsData.map(entry => entry.returns);
      const extraireRendements = ddd.map(fond => {
        return fond.map(anneeData => anneeData[2]);
      });
      const tableauConcatené = extraireRendements.map((sousTableau) => {
        return sousTableau.flatMap((element) => element);
      });
      const tableauTransformé = [];
      for (let i = 0; i < tableauConcatené[0].length; i++) {
        const colonne = [];
        for (let j = 0; j < tableauConcatené.length; j++) {
          colonne.push(tableauConcatené[j][i]);
        }
        tableauTransformé.push(colonne);
      }

      const minnestedArray = [];
      for (let i = 0; i < fundIds.length; i++) { minnestedArray.push(minReturn); }
      const maxnestedArray = [];
      for (let i = 0; i < fundIds.length; i++) { maxnestedArray.push(maxReturn); }

      const meanReturns = PortfolioAllocation.meanVector(tableauConcatené);
      const covMatrix = PortfolioAllocation.covarianceMatrix(tableauConcatené);
      var opt = {}
      if (minWeight.length > 0) {
        opt = {
          discretizationType: 'volatility',
          nbPortfolios: 1000,
          optimizationMethod: 'automatic',
          constraints: { minWeights: minWeight, maxWeights: maxWeight }
        };
      } else {
        opt = {
          discretizationType: 'volatility',
          nbPortfolios: 1000,
          optimizationMethod: 'automatic',
        };
      }

      const portfolios = PortfolioAllocation.meanVarianceEfficientFrontierPortfolios(meanReturns, covMatrix, opt);
      const filteredPortfolios = portfolios.filter(portfolio => {
        const portfolioReturn = portfolio[1];
        const portfolioVolatility = portfolio[2];
        return portfolioReturn >= minReturn && portfolioReturn <= maxReturn &&
          portfolioVolatility >= minVolatility && portfolioVolatility <= maxVolatility;
      });

      res.json({
        code: 200,
        data: { filteredPortfolios: filteredPortfolios }
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Une erreur s\'est produite lors du traitement de la demande.',
        error: error.message
      });
    }
  });

  app.get('/api/roboadvisorsetvalue', async (req, res) => {
    try {
      const { date, montantinvest, fundids, portefeuilleselect, poids } = req.query;
      const poidsfond = poids.split(',');
      const fondids = fundids.split(',');

      for (const f of fondids) {
        const index = fondids.indexOf(f);
        let vls = await vl.findAll({
          where: { fund_id: f, date: { [Op.gte]: date } },
          limit: 500,
        });

        const valorisations = [];
        const quantite = (montantinvest * poidsfond[index]) / vls[0].value;
        for (const dateRow of vls) {
          const valorisation = quantite * dateRow.value;
          valorisations.push({ date: dateRow.date, value: valorisation, fund_id: f, portefeuille_id: portefeuilleselect });
        }
        await portefeuilles_proposes_vls.bulkCreate(valorisations);
      }

      const updatedData = { poidsportefeuille: poidsfond };
      await portefeuille.update(updatedData, { where: { id: portefeuilleselect } });
      return res.json({ code: 200, data: "Succes" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors du calcul de la valorisation" });
    }
  });

  app.post('/api/postportefeuillepropose', async (req, res) => {
    try {
      const { portfolios } = req.body;
      for (const portfolio of portfolios) {
        const { poids, fond, simulation_id, portefeuille_id, nom } = portfolio;
        await simulationportefeuille.create({
          poids: poids.toString(),
          fond_ids: fond,
          nom,
          simulation_id,
          portefeuille_id
        });
      }
      res.status(200).json({ message: 'Données insérées avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'insertion en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
    }
  });

  app.get('/api/getsimulationportefeuillebyuser/:id', async (req, res) => {
    simulationportefeuille.findAll({
      where: { simulation_id: req.params.id },
      order: [['id', 'ASC']],
      limit: 500,
    })
      .then(response => {
        const simulations = response.map(data => ({
          id: data.portefeuille_id,
          poids: data.poids,
          nom: data.nom,
          fond_ids: data.fond_ids
        }));
        res.json({ code: 200, data: { simulations } })
      })
      .catch(err => {
        console.error('Erreur getsimulationportefeuillebyuser:', err);
        if (!res.headersSent) res.status(500).json({ code: 500, message: 'Erreur serveur' });
      })
  })

  app.post('/api/postsimulation', async (req, res) => {
    try {
      const { nom, description, userid } = req.body;
      simulation.create({ nom: nom, description: description, user_id: userid })
      res.status(200).json({ message: 'Données insérées avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'insertion en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
    }
  });

  app.get('/api/getsimulationbyuser/:id', async (req, res) => {
    simulation.findAll({
      where: { user_id: req.params.id },
      order: [['id', 'ASC']],
      limit: 500,
    })
      .then(response => {
        const simulations = response.map(data => ({
          id: data.id,
          nom: data.nom,
          description: data.description
        }));
        res.json({ code: 200, data: { simulations } })
      })
      .catch(err => {
        console.error('Erreur getsimulationbyuser:', err);
        if (!res.headersSent) res.status(500).json({ code: 500, message: 'Erreur serveur' });
      })
  })

  app.get('/api/getportefeuillebysimulation/:id', async (req, res) => {
    simulationportefeuille.findAll({
      where: { simulation_id: req.params.id },
      order: [['id', 'ASC']],
      limit: 500,
    })
      .then(response => {
        const simulations = response.map(data => ({
          nom: data.nom,
          fond_ids: data.fond_ids,
          poids: data.poids,
          portefeuille_id: data.portefeuille_id,
        }));
        res.json({ code: 200, data: { simulations } })
      })
      .catch(err => {
        console.error('Erreur getportefeuillebysimulation:', err);
        if (!res.headersSent) res.status(500).json({ code: 500, message: 'Erreur serveur' });
      })
  })

};

module.exports.fetchFundsByValorisation = fetchFundsByValorisation;
module.exports.fetchFundsByValorisation1 = fetchFundsByValorisation1;
module.exports.findCommonDates = findCommonDates;
