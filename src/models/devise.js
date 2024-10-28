
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('devises', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },


    Symbole: {
      type: DataTypes.STRING(255),
      allowNull: false,
      index: true
    },
  }, {
    timestamps: false,
    updatedAt: false,

  })
}