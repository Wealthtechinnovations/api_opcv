module.exports = (sequelize, DataTypes) => {
  return sequelize.define('simulation_portefeuilles', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING(255),
    },
    fond_ids: {
      type: DataTypes.STRING(255),
    },
    portefeuille_id: {
      type: DataTypes.INTEGER,
    },
    poids: {
      type: DataTypes.STRING(255),
    },
    simulation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['simulation_id'] },
      { fields: ['portefeuille_id'] },
    ]
  });
};
