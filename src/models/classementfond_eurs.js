module.exports = (sequelize, DataTypes) => {
  return sequelize.define('classementfonds_eurs', {
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
    categorie: {
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
    rank3Mois: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank3Moistotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank6Mois: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank6Moistotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank1An: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank1Antotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank3Ans: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank3Anstotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank5Ans: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank5Anstotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank1erJanvier: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank1erJanviertotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank3Moism: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank3Moistotalm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank6Moism: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank6Moistotalm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank1Anm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank1Antotalm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank3Ansm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank3Anstotalm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank5Ansm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank5Anstotalm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank1erJanvierm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rank1erJanviertotalm: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ranksharpe: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ranksharpetotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankvolatilite: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankvolatilitetotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankdsr: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankdsrtotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankpertemax: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankpertemaxtotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankinfo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankinfototal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ranksortino: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ranksortinototal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankbetabaissier: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankbetabaissiertotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankomega: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankomegatotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankvar95: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankvar95total: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankcalamar: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rankcalamartotal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type_classement: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    timestamps: false,
    updatedAt: false,
    indexes: [
      { fields: ['fond_id'] },
      { fields: ['categorie'] },
    ]
  });
};
