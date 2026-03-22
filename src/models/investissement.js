module.exports = (sequelize, DataTypes) => {
  return sequelize.define('investissements', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING(255),
    },
    achatdate: {
      type: DataTypes.DATE,
    },
    ventedate: {
      type: DataTypes.DATE,
    },
    currentvalue: {
      type: DataTypes.DECIMAL(15, 4),
    },
    montant: {
      type: DataTypes.DECIMAL(15, 2),
    },
    fund_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    portefeuille_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    prixachat: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    prixvente: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    frais: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['fund_id'] },
      { fields: ['portefeuille_id'] },
    ]
  });
};
