
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('actualites', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    date: {
      type: DataTypes.DATE,
    },

    description: {
      type: DataTypes.STRING(1000),
    },
    image: {
      type: DataTypes.STRING(255),
    },
    username: {
      type: DataTypes.STRING(255),
    },
    type: {
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