module.exports = (sequelize, DataTypes) => {
  const Valorisation = sequelize.define('valorisations', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fund_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fund_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    value: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    value_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    value_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    dividende: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    dividende_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    dividende_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    vl_ajuste: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    vl_ajuste_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    vl_ajuste_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    indice_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    base_100: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    base_100_InRef: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    tsr: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    tra: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    indRef: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    indRef_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    indRef_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    indice_comparaison: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    actif_net: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    actif_net_USD: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    actif_net_EUR: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    libelle_fond: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    souscription: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    ID_indice: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rachat: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  }, {
    timestamps: false,
    createdAt: 'created',
    updatedAt: false,
    indexes: [
      { fields: ['fund_id'] },
      { fields: ['date'] },
      { fields: ['fund_name'] },
      { fields: ['fund_id', 'date'], name: 'idx_valorisations_fund_id_date' },
    ]
  });

  Valorisation.associate = models => {
    Valorisation.belongsTo(models.FondInvestissement, { foreignKey: 'fund_id' });
  };

  return Valorisation;
};
