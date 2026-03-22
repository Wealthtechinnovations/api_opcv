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
      type: DataTypes.DECIMAL(15, 2),
    },
    portefeuille_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['portefeuille_id'] },
    ]
  });
};
