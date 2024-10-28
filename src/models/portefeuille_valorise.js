
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('portefeuilles_vls_cumuls', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    portefeuille_id: {
      type: DataTypes.INTEGER,
    },

    valeur_portefeuille: {
      type: DataTypes.STRING(255),
    },
    valeur_portefeuille_EUR: {
      type: DataTypes.STRING(255),
    },
    valeur_portefeuille_USD: {
      type: DataTypes.STRING(255),
    },
    valeur_jour: {
      type: DataTypes.STRING(255),
    },
    valeur_jour_EUR: {
      type: DataTypes.STRING(255),
    },
    valeur_jour_USD: {
      type: DataTypes.STRING(255),
    },
    cash: {
      type: DataTypes.STRING(255),
    },
    plus_moins_value: {
      type: DataTypes.STRING(255),
    },
    cash_EUR: {
      type: DataTypes.STRING(255),
    },
    plus_moins_value_EUR: {
      type: DataTypes.STRING(255),
    },
    cash_USD: {
      type: DataTypes.STRING(255),
    },
    plus_moins_value_USD: {
      type: DataTypes.STRING(255),
    },
    base_100: {
      type: DataTypes.STRING(255),
    },
    base_100_bis: {
      type: DataTypes.STRING(255),
    },
    base_100_bis_2: {
      type: DataTypes.STRING(255),
    },
    base_100_bis_EUR: {
      type: DataTypes.STRING(255),
    },
    base_100_bis_USD: {
      type: DataTypes.STRING(255),
    },

    investissement: {
      type: DataTypes.STRING(255),
    },
    investissement_EUR: {
      type: DataTypes.STRING(255),
    },
    investissement_USD: {
      type: DataTypes.STRING(255),
    },
    quantite: {
      type: DataTypes.STRING(255),
    },
    date: {
      type: DataTypes.STRING(255),
      allowNull: false,

    }

  }, {
    timestamps: false,
    updatedAt: false
  })
}