const FondInvestissement = require('./fond'); // Remplacez le chemin par le chemin correct vers votre fichier FondInvestissement

module.exports = (sequelize, DataTypes) => {
  const Valorisation = sequelize.define('valorisations', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fund_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fund_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    value: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    value_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    value_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    dividende: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    dividende_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    dividende_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    vl_ajuste: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    vl_ajuste_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    vl_ajuste_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    indice_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    base_100: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    base_100_InRef: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    tsr: {
      type: DataTypes.DOUBLE,
      allowNull: false,

    },
    tra: {
      type: DataTypes.DOUBLE,
      allowNull: false,

    },
    indRef: {
      type: DataTypes.DOUBLE,
      allowNull: false,

    },
    indRef_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,

    },
    indRef_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,

    },
    indice_comparaison: {
      type: DataTypes.DOUBLE,
      allowNull: false,

    }
    ,
    actif_net: {
      type: DataTypes.STRING(255),
      allowNull: false,

    }
    ,
    actif_net_USD: {
      type: DataTypes.STRING(255),
      allowNull: false,

    }
    ,
    actif_net_EUR: {
      type: DataTypes.STRING(255),
      allowNull: false,

    }
    ,
    libelle_fond: {
      type: DataTypes.STRING(255),
      allowNull: false,

    },
    souscription: {
      type: DataTypes.STRING(255),
      allowNull: false,

    }
    ,
    ID_indice: {
      type: DataTypes.STRING(255),
      allowNull: false,

    },
    rachat: {
      type: DataTypes.STRING(255),
      allowNull: false,

    }
    ,
    date: {
      type: DataTypes.STRING(255),
      allowNull: false,

    }

  }, {
    timestamps: false,
    createdAt: 'created',
    updatedAt: false
  });

  Valorisation.associate = models => {
    // Utilisez le modèle FondInvestissement pour définir l'association
    Valorisation.belongsTo(models.FondInvestissement, { foreignKey: 'fund_id' });
  };

  return Valorisation;
};