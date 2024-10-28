
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('cashs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      
      date: {
        type: DataTypes.DATE,
      },
      
      montant: {
        type: DataTypes.STRING(255),
      },
     
      portefeuille_id:{
        type: DataTypes.INTEGER, // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      }
  
     
     
    }, {
      timestamps: false,
      updatedAt: false
    })
  }