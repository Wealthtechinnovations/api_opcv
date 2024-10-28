
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('societes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    pays: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    tel: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },



    description: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    numeroagrement: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    regulateur: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    dateimmatriculation: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    devise: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    site_web: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }


  }, {
    timestamps: false,
    updatedAt: false
  })
}