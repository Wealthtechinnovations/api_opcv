require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// ---------------------
// Model Imports
// ---------------------
const INDICE = require('../../src/models/indice');
const TAUX = require('../../src/models/tsr');
const VL = require('../../src/models/vl');
const CASH = require('../../src/models/cash');
const TRA = require('../../src/models/tra');
const SOCIETE = require('../../src/models/societe');
const CLASSEMENTFOND = require('../../src/models/classementfond');
const CLASSEMENTFOND_EURS = require('../../src/models/classementfond_eurs');
const CLASSEMENTFOND_USDS = require('../../src/models/classementfond_usds');
const RENDEMENT = require('../../src/models/rendement');
const SIMULATION = require('../../src/models/simulation');
const SIMULATIONPORTEFEUILLE = require('../../src/models/simulationportefeuille');
const USERS = require('../../src/models/users');
const PERFORMENCE = require('../../src/models/performence');
const PERFORMENCE_EURS = require('../../src/models/performence_eurs');
const PERFORMENCE_USDS = require('../../src/models/performence_usds');
const ACTUALITE = require('../../src/models/actualite');
const Transaction = require('../../src/models/transaction');
const Investissement = require('../../src/models/investissement');
const Portefeuille = require('../../src/models/portefeuille');
const Portefeuille_vl = require('../../src/models/portefeuille_vl');
const Portefeuille_vl_cumul = require('../../src/models/portefeuille_valorise');
const Frais = require('../../src/models/frais');
const Fiscalite = require('../../src/models/fiscalite');
const Devise = require('../../src/models/devise');
const PAYS_REGULATEUR = require('../../src/models/pays_regulateurs');
const FOND = require('../../src/models/fond');
const ROBOPORTFEUILLE = require('../../src/models/portefeuilles_proposes_vls');
const ROBOPORTFEUILLEPORTEFEUILLE = require('../../src/models/portefeuilles_proposes');
const Portefeuille_base100 = require('../../src/models/portefeuille_base100');
const Favorisfonds = require('../../src/models/favorisfonds');
const Devisedechanges = require('../../src/models/devisedechanges');
const PERSONNEL = require('../../src/models/personnel');
const DOCUMENT = require('../../src/models/document');
const APIKEY = require('../../src/models/apikey');
const TSRHISTO = require('../../src/models/tsrhisto');
const Datevalorisation = require('../../src/models/datevalorisation');
const TAUX_CHANGE = require('../../src/models/taux_change');

// ---------------------
// Database Connection (from environment variables)
// ---------------------
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mysql',
    dialectOptions: {
      timezone: process.env.DB_TIMEZONE || '+00:00',
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
    },
  }
);

// ---------------------
// Model Initialization
// ---------------------
const apikeys = APIKEY(sequelize, DataTypes);
const indice = INDICE(sequelize, DataTypes);
const taux = TAUX(sequelize, DataTypes);
const tra = TRA(sequelize, DataTypes);
const tsr = taux; // TSR and TAUX use the same model - avoid duplicate init
const vl = VL(sequelize, DataTypes);
const fond = FOND(sequelize, DataTypes);
const performences = PERFORMENCE(sequelize, DataTypes);
const performences_eurs = PERFORMENCE_EURS(sequelize, DataTypes);
const performences_usds = PERFORMENCE_USDS(sequelize, DataTypes);
const tsrhisto = TSRHISTO(sequelize, DataTypes);
const cashdb = CASH(sequelize, DataTypes);
const frais = Frais(sequelize, DataTypes);
const fiscalite = Fiscalite(sequelize, DataTypes);
const documentss = DOCUMENT(sequelize, DataTypes);
const actu = ACTUALITE(sequelize, DataTypes);
const rendement = RENDEMENT(sequelize, DataTypes);
const simulation = SIMULATION(sequelize, DataTypes);
const simulationportefeuille = SIMULATIONPORTEFEUILLE(sequelize, DataTypes);
const users = USERS(sequelize, DataTypes);
const personnel = PERSONNEL(sequelize, DataTypes);
const societe = SOCIETE(sequelize, DataTypes);
const classementfonds = CLASSEMENTFOND(sequelize, DataTypes);
const classementfonds_eurs = CLASSEMENTFOND_EURS(sequelize, DataTypes);
const classementfonds_usds = CLASSEMENTFOND_USDS(sequelize, DataTypes);
const date_valorisation = Datevalorisation(sequelize, DataTypes);
const favorisfonds = Favorisfonds(sequelize, DataTypes);
const portefeuille_base100 = Portefeuille_base100(sequelize, DataTypes);
const portefeuille = Portefeuille(sequelize, DataTypes);
const devisedechanges = Devisedechanges(sequelize, DataTypes);
const transaction = Transaction(sequelize, DataTypes);
const investissement = Investissement(sequelize, DataTypes);
const portefeuille_vl = Portefeuille_vl(sequelize, DataTypes);
const portefeuille_vl_cumul = Portefeuille_vl_cumul(sequelize, DataTypes);
const devises = Devise(sequelize, DataTypes);
const pays_regulateurs = PAYS_REGULATEUR(sequelize, DataTypes);
const portefeuilles_proposes = ROBOPORTFEUILLEPORTEFEUILLE(sequelize, DataTypes);
const portefeuilles_proposes_vls = ROBOPORTFEUILLE(sequelize, DataTypes);
const taux_change = TAUX_CHANGE(sequelize, DataTypes);

// ---------------------
// Associations
// ---------------------

// Fond <-> VL (Valorisations)
fond.hasMany(vl, { foreignKey: 'fund_id' });
vl.belongsTo(fond, { foreignKey: 'fund_id' });

// Fond <-> Performances
fond.hasMany(performences, { foreignKey: 'fond_id' });
performences.belongsTo(fond, { foreignKey: 'fond_id' });
performences_eurs.belongsTo(fond, { foreignKey: 'fond_id' });
performences_usds.belongsTo(fond, { foreignKey: 'fond_id' });

// Fond <-> Rendement
fond.hasMany(rendement, { foreignKey: 'fond_id' });
rendement.belongsTo(fond, { foreignKey: 'fond_id' });

// Date valorisation <-> VL
date_valorisation.belongsTo(vl, { foreignKey: 'date' });
vl.hasMany(date_valorisation, { foreignKey: 'date' });

// Transaction associations
transaction.belongsTo(fond, { foreignKey: 'fond_ids' });
transaction.belongsTo(portefeuille, { foreignKey: 'portefeuille_id' });
transaction.belongsTo(devisedechanges, { foreignKey: 'date' });

// Fond <-> Investissement
fond.hasMany(investissement, { foreignKey: 'fund_id' });
investissement.belongsTo(fond, { foreignKey: 'fund_id' });

// Portefeuille <-> Investissement
portefeuille.hasMany(investissement, { foreignKey: 'portefeuille_id' });
investissement.belongsTo(portefeuille, { foreignKey: 'portefeuille_id' });

// Fond <-> Frais
fond.hasMany(frais, { foreignKey: 'fond_id' });
frais.belongsTo(fond, { foreignKey: 'fond_id' });

// Portefeuille <-> Portefeuille_vl
portefeuille.hasMany(portefeuille_vl, { foreignKey: 'portefeuille_id' });
portefeuille_vl.belongsTo(portefeuille, { foreignKey: 'portefeuille_id' });

// Fond <-> Portefeuille_vl
fond.hasMany(portefeuille_vl, { foreignKey: 'fund_id' });
portefeuille_vl.belongsTo(fond, { foreignKey: 'fund_id' });

// Portefeuille <-> Portefeuille_vl_cumul
portefeuille.hasMany(portefeuille_vl_cumul, { foreignKey: 'portefeuille_id' });
portefeuille_vl_cumul.belongsTo(portefeuille, { foreignKey: 'portefeuille_id' });

// Portefeuille <-> Portefeuille_base100
portefeuille.hasMany(portefeuille_base100, { foreignKey: 'portefeuille_id' });
portefeuille_base100.belongsTo(portefeuille, { foreignKey: 'portefeuille_id' });

// User <-> Portefeuille
users.hasMany(portefeuille, { foreignKey: 'user_id' });
portefeuille.belongsTo(users, { foreignKey: 'user_id' });

// User <-> Favorisfonds
users.hasMany(favorisfonds, { foreignKey: 'user_id' });
favorisfonds.belongsTo(users, { foreignKey: 'user_id' });

// Fond <-> Favorisfonds
fond.hasMany(favorisfonds, { foreignKey: 'fund_id' });
favorisfonds.belongsTo(fond, { foreignKey: 'fund_id' });

// User <-> Actualite
users.hasMany(actu, { foreignKey: 'user_id' });
actu.belongsTo(users, { foreignKey: 'user_id' });

// Fond <-> Document
fond.hasMany(documentss, { foreignKey: 'fond_id' });
documentss.belongsTo(fond, { foreignKey: 'fond_id' });

// User <-> Simulation
users.hasMany(simulation, { foreignKey: 'user_id' });
simulation.belongsTo(users, { foreignKey: 'user_id' });

// Simulation <-> SimulationPortefeuille
simulation.hasMany(simulationportefeuille, { foreignKey: 'simulation_id' });
simulationportefeuille.belongsTo(simulation, { foreignKey: 'simulation_id' });

// Portefeuille <-> SimulationPortefeuille
portefeuille.hasMany(simulationportefeuille, { foreignKey: 'portefeuille_id' });
simulationportefeuille.belongsTo(portefeuille, { foreignKey: 'portefeuille_id' });

// Portefeuille <-> Transaction (reverse association)
portefeuille.hasMany(transaction, { foreignKey: 'portefeuille_id' });

// Fond <-> Transaction (reverse)
fond.hasMany(transaction, { foreignKey: 'fond_ids' });

// User <-> ApiKey
users.hasMany(apikeys, { foreignKey: 'user_id' });
apikeys.belongsTo(users, { foreignKey: 'user_id' });

// Portefeuille <-> Cash
portefeuille.hasMany(cashdb, { foreignKey: 'portefeuille_id' });
cashdb.belongsTo(portefeuille, { foreignKey: 'portefeuille_id' });

// Fond <-> Classementfonds
fond.hasMany(classementfonds, { foreignKey: 'fond_id' });
classementfonds.belongsTo(fond, { foreignKey: 'fond_id' });

// ---------------------
// URLs (from environment)
// ---------------------
const urll = process.env.API_BASE_URL || 'http://localhost:3005';
const urllsite = process.env.SITE_BASE_URL || 'http://localhost:3000';

// ---------------------
// Database Init
// ---------------------
const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie.');

    // Sync models that need it
    await taux.sync();
    await tra.sync();

    console.log('Modèles synchronisés.');
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

// ---------------------
// Exports
// ---------------------
module.exports = {
  initDb,
  sequelize,
  urll,
  urllsite,
  // Models
  vl,
  indice,
  taux,
  tra,
  tsr,
  fond,
  pays_regulateurs,
  portefeuille,
  portefeuille_vl,
  portefeuilles_proposes_vls,
  portefeuilles_proposes,
  users,
  societe,
  classementfonds,
  performences,
  transaction,
  investissement,
  cashdb,
  frais,
  fiscalite,
  portefeuille_vl_cumul,
  devises,
  portefeuille_base100,
  favorisfonds,
  devisedechanges,
  personnel,
  documentss,
  performences_eurs,
  performences_usds,
  classementfonds_eurs,
  classementfonds_usds,
  actu,
  tsrhisto,
  rendement,
  simulation,
  simulationportefeuille,
  date_valorisation,
  apikeys,
  taux_change,
};
