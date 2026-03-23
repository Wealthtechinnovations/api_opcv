module.exports = (sequelize, DataTypes) => {
  return sequelize.define('actualites', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.DATE,
    },
    description: {
      type: DataTypes.STRING(1000),
    },
    image: {
      type: DataTypes.STRING(255),
    },
    username: {
      type: DataTypes.STRING(255),
    },
    type: {
      type: DataTypes.STRING(255),
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['date'] },
    ]
  });
};
