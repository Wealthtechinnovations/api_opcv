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
      type: DataTypes.DOUBLE,
    },
    valeur_portefeuille_EUR: {
      type: DataTypes.DOUBLE,
    },
    valeur_portefeuille_USD: {
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
    plus_moins_value: {
      type: DataTypes.DOUBLE,
    },
    cash_EUR: {
      type: DataTypes.DOUBLE,
    },
    plus_moins_value_EUR: {
      type: DataTypes.DOUBLE,
    },
    cash_USD: {
      type: DataTypes.DOUBLE,
    },
    plus_moins_value_USD: {
      type: DataTypes.DOUBLE,
    },
    base_100: {
      type: DataTypes.DOUBLE,
    },
    base_100_bis: {
      type: DataTypes.DOUBLE,
    },
    base_100_bis_2: {
      type: DataTypes.DOUBLE,
    },
    base_100_bis_EUR: {
      type: DataTypes.DOUBLE,
    },
    base_100_bis_USD: {
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
    quantite: {
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
      { fields: ['date'] },
    ]
  });
};
