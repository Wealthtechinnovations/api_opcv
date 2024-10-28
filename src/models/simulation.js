
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('simulations', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nom: {
      type: DataTypes.STRING(255),
    },
    description: {
      type: DataTypes.STRING(255),
    },


    user_id: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    }



  }, {
    timestamps: false,
    updatedAt: false
  })
}