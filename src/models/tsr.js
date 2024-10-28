
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('taux_sans_risques', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      valeur: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      valeur2: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      semaine: {
        type: DataTypes.STRING(50),
        allowNull: false,
        index:true
      },
      rate: {
        type: DataTypes.STRING(50),
        allowNull: false,
        index:true
      },
      date: {
        type: DataTypes.STRING(255),
        allowNull: false,
        index:true
      },
      pays: {
        type: DataTypes.STRING(255),
        allowNull: false,
        index:true
      },
    }, {
      timestamps: true,
      updatedAt: false,
     
    })
  }