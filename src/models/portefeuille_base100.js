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
      type: DataTypes.DOUBLE,
    },
    valeur_portefeuille: {
      type: DataTypes.DOUBLE,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['portefeuille_id'] },
      { fields: ['date'] },
    ]
  });
};
