
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
      type: DataTypes.STRING(255),
    },
    cash: {
      type: DataTypes.STRING(255),
    },
    devise: {
      type: DataTypes.STRING(255),
    },
    funds: {
      type: DataTypes.JSON, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    poidsportefeuille: {
      type: DataTypes.JSON, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    portefeuilletype: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    horizon: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    categorie: {
      type: DataTypes.JSON, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    univers: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    universsous: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    fundids: {
      type: DataTypes.JSON, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    user_id: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    maj: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },



  }, {
    timestamps: false,
    updatedAt: false
  })
}