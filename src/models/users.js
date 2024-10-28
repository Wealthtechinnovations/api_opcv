
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      active: {
        type: DataTypes.INTEGER,
      },
      password: {
        type: DataTypes.STRING(255),
      },
      email: {
        type: DataTypes.STRING(255),
      },
      nom: {
        type: DataTypes.STRING(255),
      },
      prenoms: {
        type: DataTypes.STRING(255),
      },
      denomination: {
        type: DataTypes.STRING(255),
      },
      pays: {
        type: DataTypes.STRING(255),
      },
      typeusers: {
        type: DataTypes.STRING(255),
      },

      typeusers_id: {
        type: DataTypes.STRING(255),
      } ,
    
     
    }, {
      timestamps: false,
      updatedAt: false
    })
  }