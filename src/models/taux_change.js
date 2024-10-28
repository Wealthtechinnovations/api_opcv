
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('taux_changes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    
      devise_national: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      devise_eur: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      devise_usd: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      devise_xaf: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      devise_xof: {
        type: DataTypes.DOUBLE,
        allowNull: false,
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