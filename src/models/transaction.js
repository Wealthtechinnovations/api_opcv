module.exports = (sequelize, DataTypes) => {
  return sequelize.define('transactions', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING(50),
    },
    date: {
      type: DataTypes.DATE,
    },
    montant: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    fond_ids: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    portefeuille_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    prixparunite: {
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
    frais_entree: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    frais_sortie: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    frais_transaction: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    devise: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    plus_moins_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    average: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    invest: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['fond_ids'] },
      { fields: ['portefeuille_id'] },
      { fields: ['date'] },
    ]
  });
};
