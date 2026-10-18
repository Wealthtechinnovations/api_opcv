module.exports = (sequelize, DataTypes) => {
  return sequelize.define('performences', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fond: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fond_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    code_ISIN: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    categorie: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    categorie_nationale: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    categorie_regionale: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    categorie_fundafrica_regionale: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    categorie_fundafrica_globale: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    anomalie: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    devise: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ytd: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perfveille: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf3ans: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf5ans: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf8ans: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf10ans: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf4s: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf3m: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf6m: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    ytdm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perfveillem: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf1anm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf3ansm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf5ansm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf8ansm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf10ansm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf4sm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf3mm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perf6mm: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perfannu1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    volatility1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    ratiosharpe1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    pertemax1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    sortino1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    info1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    calamar1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    var991an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    var951an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    trackingerror1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    betahaussier1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    betabaissier1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    beta1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    omega1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    dsr1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    downcapture1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    upcapture1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    skewness1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    kurtosis1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perfannu3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    volatility3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    ratiosharpe3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    pertemax3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    info3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    calamar3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    var993an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    var953an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    trackingerror3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    betahaussier3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    betabaissier3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    beta3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    sortino3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    omega3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    dsr3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    downcapture3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    upcapture3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    skewness3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    kurtosis3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    perfannu5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    volatility5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    ratiosharpe5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    pertemax5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    sortino5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    info5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    calamar5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    var995an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    var955an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    trackingerror5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    betahaussier5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    betabaissier5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    beta5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    omega5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    dsr5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    downcapture5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    upcapture5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    skewness5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    kurtosis5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    r2_1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    r2_3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    r2_5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    alpha1an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    alpha3an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    alpha5an: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['fond_id'] },
      { fields: ['code_ISIN'] },
      { fields: ['date'] },
    ]
  });
};
