
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('portefeuilles_vls', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    portefeuille_id: {
      type: DataTypes.INTEGER,
    },
    fund_id: {
      type: DataTypes.INTEGER,
    },
    valeur_portefeuille: {
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
    cash_USD: {
      type: DataTypes.STRING(255),
    },
    cash_EUR: {
      type: DataTypes.STRING(255),
    },
    quantite: {
      type: DataTypes.STRING(255),
    },
    montantdepense: {
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
    vl: {
      type: DataTypes.STRING(255),
    },
    frais: {
      type: DataTypes.STRING(255),
    },
    prix_moyen: {
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