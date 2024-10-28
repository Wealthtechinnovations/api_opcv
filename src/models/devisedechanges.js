
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('devisedechanges', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      paire: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      date: {
        type:DataTypes.STRING(255),
        allowNull: false,
       
      },
      value: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      }
   
    }, {
      timestamps: false,
      createdAt: 'created',
      updatedAt: false,
   
    })
  }