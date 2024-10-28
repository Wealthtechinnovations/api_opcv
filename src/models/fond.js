
module.exports = (sequelize, DataTypes) => {
  const FondInvestissement = sequelize.define('fond_investissements', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom_fond: {
      type: DataTypes.STRING(255),
    },
    code: {
      type: DataTypes.STRING(255),
    },
    indice_benchmark: {
      type: DataTypes.STRING(255),
    },
    indice: {
      type: DataTypes.STRING(255),
    },
    reseau_placeur: {
      type: DataTypes.STRING(255),
    },
    sensibilite: {
      type: DataTypes.STRING(255),
    },
    pays: {
      type: DataTypes.STRING(255),
    },
    region: {
      type: DataTypes.STRING(255),
    },
    periodicite: {
      type: DataTypes.STRING(255),
    },
    structure_fond: {
      type: DataTypes.STRING(255),
    },
    code_ISIN: {
      type: DataTypes.STRING(255),
    },
    date_creation: {
      type: DataTypes.STRING(255),
    },
    dev_libelle: {
      type: DataTypes.STRING(255),
    },

    societe_gestion: {
      type: DataTypes.STRING(255),
    },
    categorie_libelle: {
      type: DataTypes.STRING(255),
    },
    classification: {
      type: DataTypes.STRING(255),
    },
    type_investissement: {
      type: DataTypes.STRING(255),
    },
    pays: {
      type: DataTypes.STRING(255),
    },
    nom_gerant: {
      type: DataTypes.STRING(255),
    },
    categorie_globale: {
      type: DataTypes.STRING(255),
    },
    categorie_national: {
      type: DataTypes.STRING(255),
    },
    categorie_regional: {
      type: DataTypes.STRING(255),
    },
    frais_gestion: {
      type: DataTypes.STRING(255),
    },
    frais_souscription: {
      type: DataTypes.STRING(255),
    },
    frais_entree: {
      type: DataTypes.STRING(255),
    },
    frais_sortie: {
      type: DataTypes.STRING(255),
    },
    periodicite: {
      type: DataTypes.STRING(255),
    },

    minimum_investissement: {
      type: DataTypes.STRING(255),
    },
    affectation: {
      type: DataTypes.STRING(255),
    },
    frais_rachat: {
      type: DataTypes.STRING(255),
    },
    //add
    description: {
      type: DataTypes.STRING(255),
    },
    strategie_politique_invest: {
      type: DataTypes.STRING(255),
    },
    philosophie_fond: {
      type: DataTypes.STRING(255),
    },
    horizonplacement: {
      type: DataTypes.STRING(255),
    },
    date_agrement: {
      type: DataTypes.STRING(255),
    },
    date_premiere_vl: {
      type: DataTypes.STRING(255),
    },
    active: {
      type: DataTypes.INTEGER,
    },
    depositaire: {
      type: DataTypes.STRING(255),
    },
    teneur_registre: {
      type: DataTypes.STRING(255),
    },
    valorisateur: {
      type: DataTypes.STRING(255),
    },
    centralisateur: {
      type: DataTypes.STRING(255),
    },
    agent_transfert: {
      type: DataTypes.STRING(255),
    },
    agent_payeur: {
      type: DataTypes.STRING(255),
    },
    numero_agrement: {
      type: DataTypes.STRING(255),
    },
    montant_premier_vl: {
      type: DataTypes.STRING(255),
    },
    montant_actif_net: {
      type: DataTypes.STRING(255),
    },
    duree_investissement_recommande: {
      type: DataTypes.STRING(255),
    },
    date_cloture: {
      type: DataTypes.STRING(255),
    },
    heure_cutt_off: {
      type: DataTypes.STRING(255),
    },
    delai_reglement: {
      type: DataTypes.STRING(255),
    },
    classification: {
      type: DataTypes.STRING(255),
    },
    structure_fond: {
      type: DataTypes.STRING(255),
    },
    affectation: {
      type: DataTypes.STRING(255),
    },
    souscripteur: {
      type: DataTypes.STRING(255),
    },

    regulateur: {
      type: DataTypes.STRING(255),
    },
    pays_one: {
      type: DataTypes.STRING(255),
    },
   
    dividende: {
      type: DataTypes.INTEGER,
    },


    datemoispre: {
      type: DataTypes.STRING(255),
    },
    //
    datejour: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    nombre_part: {
      type: DataTypes.INTEGER,
      allowNull: true,

    },
    banque: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    IBAN: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    RIB: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }

  }, {
    timestamps: false,
    updatedAt: false
  });

  return FondInvestissement;
};