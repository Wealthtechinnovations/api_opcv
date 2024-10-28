
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('pays_regulateurs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      pays: {
        type: DataTypes.STRING(255),
      },
      economy: {
        type: DataTypes.STRING(255),
      },
      nomdelabourse: {
        type: DataTypes.STRING(255),
      },
      URLdelabourse: {
        type: DataTypes.STRING(255),
      } ,
      regulateur: {
       type:DataTypes.STRING(255),
      
     },
     sitewebregulateur: {
      type:DataTypes.STRING(255),
     
    },
    nomdevise: {
      type:DataTypes.STRING(255),
     
    },
    symboledevise: {
      type:DataTypes.STRING(255),
     
    }
     ,
     tsr10: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    to10: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
        }, {
      timestamps: false,
      updatedAt: false
    })
  }