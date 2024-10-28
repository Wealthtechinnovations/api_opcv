
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('frais', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    frais_achat: {
      type: DataTypes.DOUBLE,
    },
    frais_vente: {
      type: DataTypes.DOUBLE,
    },
    frais_transa_achat: {
      type: DataTypes.DOUBLE,
    },
    frais_transa_vente: {
      type: DataTypes.DOUBLE,
    },
    fond_id: {
      type: DataTypes.INTEGER,
    },
    fond: {
      type: DataTypes.STRING(255),
    },


  }, {
    timestamps: true,
    updatedAt: false,

  })
}