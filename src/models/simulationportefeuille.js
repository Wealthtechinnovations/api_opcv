
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('simulation_portefeuilles', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },


    nom: {
      type: DataTypes.STRING(255),
    },

    fond_ids: {
      type: DataTypes.STRING(255),
    },


    portefeuille_id: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
    },

    poids: {
      type: DataTypes.STRING(255),
    },

    simulation_id: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    }



  }, {
    timestamps: false,
    updatedAt: false
  })
}