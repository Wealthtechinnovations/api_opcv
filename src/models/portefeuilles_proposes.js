
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('portefeuilles_proposes', {
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
      funds: {
        type: DataTypes.JSON, // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      },
      fundids: {
        type: DataTypes.JSON, // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      },

     
     
    }, {
      timestamps: false,
      updatedAt: false
    })
  }