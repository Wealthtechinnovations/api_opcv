
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('portefeuille_base100s', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      portefeuille_id: {
        type: DataTypes.INTEGER,
      },
   
      value: {
        type: DataTypes.STRING(255),
      },

      valeur_portefeuille: {
        type: DataTypes.STRING(255),
      },
     
    
      date: {
       type:DataTypes.STRING(255),
       allowNull: false,
      
     }
     
    }, {
      timestamps: false,
      updatedAt: false
    })
  }