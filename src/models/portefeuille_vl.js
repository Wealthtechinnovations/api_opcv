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
      type: DataTypes.DOUBLE,
    },
    valeur_jour: {
      type: DataTypes.DOUBLE,
    },
    valeur_jour_EUR: {
      type: DataTypes.DOUBLE,
    },
    valeur_jour_USD: {
      type: DataTypes.DOUBLE,
    },
    cash: {
      type: DataTypes.DOUBLE,
    },
    cash_USD: {
      type: DataTypes.DOUBLE,
    },
    cash_EUR: {
      type: DataTypes.DOUBLE,
    },
    quantite: {
      type: DataTypes.DOUBLE,
    },
    montantdepense: {
      type: DataTypes.DOUBLE,
    },
    investissement: {
      type: DataTypes.DOUBLE,
    },
    investissement_EUR: {
      type: DataTypes.DOUBLE,
    },
    investissement_USD: {
      type: DataTypes.DOUBLE,
    },
    vl: {
      type: DataTypes.DOUBLE,
    },
    frais: {
      type: DataTypes.DOUBLE,
    },
    prix_moyen: {
      type: DataTypes.DOUBLE,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['portefeuille_id'] },
      { fields: ['fund_id'] },
      { fields: ['date'] },
    ]
  });
};
