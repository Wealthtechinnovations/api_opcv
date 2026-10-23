module.exports = (sequelize, DataTypes) => {
  return sequelize.define('rendements', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.DATEONLY,
    },
    lastvl: {
      type: DataTypes.DOUBLE,
    },
    rendement_jour: {
      type: DataTypes.DOUBLE,
    },
    rendement_jour_eur: {
      type: DataTypes.DOUBLE,
    },
    rendement_jour_usd: {
      type: DataTypes.DOUBLE,
    },
    rendement_semaine: {
      type: DataTypes.DOUBLE,
    },
    rendement_semaine_eur: {
      type: DataTypes.DOUBLE,
    },
    rendement_semaine_usd: {
      type: DataTypes.DOUBLE,
    },
    rendement_mensuel: {
      type: DataTypes.DOUBLE,
    },
    rendement_mensuel_eur: {
      type: DataTypes.DOUBLE,
    },
    rendement_mensuel_usd: {
      type: DataTypes.DOUBLE,
    },
    fond_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['fond_id'] },
      { fields: ['date'] },
    ]
  });
};
