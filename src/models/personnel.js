
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('personnel_sgs', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING(255),

    },
    prenom: {
      type: DataTypes.STRING(255),

    },
    email: {
      type: DataTypes.STRING(255),

    },
    numero: {
      type: DataTypes.STRING(255),

    },
    fonction: {
      type: DataTypes.STRING(255),

    },
    societe: {
      type: DataTypes.STRING(255),

    },
    activite: {
      type: DataTypes.STRING(255),
    },
    photo: {
      type: DataTypes.STRING(255),
    }


  }, {
    timestamps: false,
    updatedAt: false,

  })
}