
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('favorisfonds', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fund_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      }
   
    }, {
      timestamps: false,
      createdAt: 'created',
      updatedAt: false,
   
    })
  }