
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('date_valorisations', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    date: {
      type: DataTypes.STRING(255),
    },

    pays: {
      type: DataTypes.STRING(255),
    }
  }, {
    timestamps: false,
    updatedAt: false
  })
}