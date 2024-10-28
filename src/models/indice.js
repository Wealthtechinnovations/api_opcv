
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('indice_references', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type_indice_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_indice: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    nom_indice: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    valeur: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    date: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }

  }, {
    timestamps: false,
    createdAt: 'created',
    updatedAt: false,

  })
}