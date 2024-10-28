
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('rendements', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    date: {
      type: DataTypes.STRING(255),
    },
    lastvl: {
             type: DataTypes.DOUBLE,

    },

    rendement_semaine: {
      type: DataTypes.STRING(255),
    },
    rendement_mensuel: {
      type: DataTypes.STRING(255),
    },
    rendement_jour: {
      type: DataTypes.STRING(255),
    },

    fond_id: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    }



  }, {
    timestamps: false,
    updatedAt: false
  })
}