module.exports = (sequelize, DataTypes) => {
  return sequelize.define('portefeuilles', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom_portefeuille: {
      type: DataTypes.STRING(255),
    },
    description: {
      type: DataTypes.STRING(255),
    },
    montant_invest: {
      type: DataTypes.DECIMAL(15, 2),
    },
    cash: {
      type: DataTypes.DECIMAL(15, 2),
    },
    devise: {
      type: DataTypes.STRING(255),
    },
    funds: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    poidsportefeuille: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    portefeuilletype: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    horizon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    categorie: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    univers: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    universsous: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fundids: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    maj: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
    ]
  });
};
