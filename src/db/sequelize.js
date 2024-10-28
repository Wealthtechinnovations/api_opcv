const { Sequelize, DataTypes } = require('sequelize')
const INDICE = require('../models/indice')
const TAUX = require('../models/tsr')
const VL = require('../models/vl')
const CASH = require('../models/cash')
const TRA = require('../models/tra')
const TSR = require('../models/tsr')
const SOCIETE = require('../models/societe')
const CLASSEMENTFOND = require('../models/classementfond')
const CLASSEMENTFOND_EURS = require('../models/classementfond_eurs')
const CLASSEMENTFOND_USDS = require('../models/classementfond_usds')
const RENDEMENT = require('../models/rendement')
const SIMULATION = require('../models/simulation')
const SIMULATIONPORTEFEUILLE = require('../models/simulationportefeuille')
const USERS = require('../models/users')
const PERFORMENCE = require('../models/performence')
const PERFORMENCE_EURS = require('../models/performence_eurs')
const PERFORMENCE_USDS = require('../models/performence_usds')
const ACTUALITE = require('../models/actualite')
const Transaction = require('../models/transaction')
const Investissement = require('../models/investissement')
const Portefeuille = require('../models/portefeuille')
const Portefeuille_vl = require('../models/portefeuille_vl')
const Portefeuille_vl_cumul = require('../models/portefeuille_valorise')
const Frais = require('../models/frais')
const Fiscalite = require('../models/fiscalite')
const Devise = require('../models/devise')
const PAYS_REGULATEUR = require('../models/pays_regulateurs')
const FOND = require('../models/fond')
const ROBOPORTFEUILLE = require('../models/portefeuilles_proposes_vls')
const ROBOPORTFEUILLEPORTEFEUILLE = require('../models/portefeuilles_proposes')
const Portefeuille_base100 = require('../models/portefeuille_base100')
const Favorisfonds = require('../models/favorisfonds')
const Devisedechanges = require('../models/devisedechanges')
const PERSONNEL = require('../models/personnel')
const DOCUMENT = require('../models/document')
const APIKEY=require('../models/apikey')
const TSRHISTO = require('../models/tsrhisto')
const Datevalorisation=require('../models/datevalorisation')
const sequelize = new Sequelize(
    'fond_opcvm',
    'root',
    'root',
    {
        host: 'localhost',
        dialect: 'mysql',
        dialectOptions: {
            // collate: "utf8_general_ci",
            timezone: '+00:00'
        },
        logging: false
    }
);


const apikeys = APIKEY(sequelize, DataTypes)
const indice = INDICE(sequelize, DataTypes)
const taux = TAUX(sequelize, DataTypes)
const tra = TRA(sequelize, DataTypes)
const tsr = TSR(sequelize, DataTypes)
const vl = VL(sequelize, DataTypes)
const fond = FOND(sequelize, DataTypes)
const performences = PERFORMENCE(sequelize, DataTypes)
const performences_eurs = PERFORMENCE_EURS(sequelize, DataTypes)
const performences_usds = PERFORMENCE_USDS(sequelize, DataTypes)
const tsrhisto = TSRHISTO(sequelize, DataTypes)
// Maintenant vous pouvez faire une jointure entre ces deux tables
fond.hasMany(vl, { foreignKey: 'fund_id' });
vl.belongsTo(fond, { foreignKey: 'fund_id' });
// Maintenant vous pouvez faire une jointure entre ces deux tables
fond.hasMany(performences, { foreignKey: 'fond_id' });
performences.belongsTo(fond, { foreignKey: 'fond_id' });
performences_eurs.belongsTo(fond, { foreignKey: 'fond_id' });
performences_usds.belongsTo(fond, { foreignKey: 'fond_id' });
const cashdb = CASH(sequelize, DataTypes)
const frais = Frais(sequelize, DataTypes)
const fiscalite = Fiscalite(sequelize, DataTypes)
const documentss = DOCUMENT(sequelize, DataTypes)
const actu = ACTUALITE(sequelize, DataTypes)
const rendement = RENDEMENT(sequelize, DataTypes)
fond.hasMany(rendement, { foreignKey: 'fond_id' });
rendement.belongsTo(fond, { foreignKey: 'fond_id' });
const simulation = SIMULATION(sequelize, DataTypes)
const simulationportefeuille = SIMULATIONPORTEFEUILLE(sequelize, DataTypes)

const users = USERS(sequelize, DataTypes)
const personnel = PERSONNEL(sequelize, DataTypes)
const societe = SOCIETE(sequelize, DataTypes)
const classementfonds = CLASSEMENTFOND(sequelize, DataTypes)
const classementfonds_eurs = CLASSEMENTFOND_EURS(sequelize, DataTypes)
const classementfonds_usds = CLASSEMENTFOND_USDS(sequelize, DataTypes)
const date_valorisation = Datevalorisation(sequelize, DataTypes)
date_valorisation.belongsTo(vl, { foreignKey: 'date' });
vl.hasMany(date_valorisation, { foreignKey: 'date' });
const favorisfonds = Favorisfonds(sequelize, DataTypes)
const portefeuille_base100 = Portefeuille_base100(sequelize, DataTypes)
const portefeuille = Portefeuille(sequelize, DataTypes)
const devisedechanges = Devisedechanges(sequelize, DataTypes)
const transaction = Transaction(sequelize, DataTypes)
transaction.belongsTo(fond, { foreignKey: 'fond_ids' });
transaction.belongsTo(portefeuille, { foreignKey: 'portefeuille_id' });
transaction.belongsTo(devisedechanges, { foreignKey: 'date' });
const investissement = Investissement(sequelize, DataTypes)
const portefeuille_vl = Portefeuille_vl(sequelize, DataTypes)
const portefeuille_vl_cumul = Portefeuille_vl_cumul(sequelize, DataTypes)
const devises = Devise(sequelize, DataTypes)
const pays_regulateurs = PAYS_REGULATEUR(sequelize, DataTypes)
const portefeuilles_proposes = ROBOPORTFEUILLEPORTEFEUILLE(sequelize, DataTypes)
const portefeuilles_proposes_vls = ROBOPORTFEUILLE(sequelize, DataTypes)
const urll = "http://localhost:3005";
const urllsite = "http://localhost:3000";

// const urll="https://api.funds.chainsolutions.fr";

// const User = UserModel(sequelize, DataTypes)

const initDb = async () => {
    //await indice.sync();
    await taux.sync();
    await tra.sync();
    // await vl.sync();
    // return sequelize.sync({force: true}).then(_ => {
    //   console.log('La base de donnée a bien été initialisée ! ')
    // })
}


module.exports = {
    initDb, vl, indice, taux, tra, fond, pays_regulateurs, sequelize, urll,urllsite, portefeuille, portefeuille_vl, portefeuilles_proposes_vls, portefeuilles_proposes, users, societe, classementfonds, performences, transaction, investissement, tsr, cashdb, frais, fiscalite, portefeuille_vl_cumul, devises, portefeuille_base100, favorisfonds, devisedechanges, personnel, documentss, performences_eurs, performences_usds, classementfonds_eurs, classementfonds_usds, actu, tsrhisto, rendement, simulation, simulationportefeuille,date_valorisation,apikeys
}