
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fiscalites', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      frais: {
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