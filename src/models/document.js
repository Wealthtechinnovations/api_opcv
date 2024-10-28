
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('documents', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.STRING(255),

    },
    mois: {
      type: DataTypes.INTEGER,

    },
    annee: {
      type: DataTypes.INTEGER,

    },
    nom: {
      type: DataTypes.STRING(255),

    },
    objet: {
      type: DataTypes.STRING(255),

    },
    fichier: {
      type: DataTypes.STRING(255),

    },
    type_fichier: {
      type: DataTypes.STRING(255),

    },

    societe: {
      type: DataTypes.STRING(255),

    },
    fond_id: {
      type: DataTypes.INTEGER,

    },
    fond: {
      type: DataTypes.STRING(255),

    }



  }, {
    timestamps: false,
    updatedAt: false,

  })
}