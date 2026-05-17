
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('tsrhistos', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    value: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },

    date: {
      type: DataTypes.STRING(255),
      allowNull: false,
      index: true
    },

    pays: {
      type: DataTypes.STRING(255),
      allowNull: false,
      index: true
    },
    indice: {
      type: DataTypes.STRING(255),
      allowNull: false,
      index: true
    },
    annee: {
      type: DataTypes.NUMBER,
      allowNull: false,
      index: true
    }

  }, {
    timestamps: false,
    updatedAt: false,

  })
}