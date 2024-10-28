
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('classementfonds', {
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
      type: DataTypes.STRING(255),
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

    categorie_nationale: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },

    rank3Mois: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank3Moistotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank6Mois: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank6Moistotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank1An: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank1Antotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank3Ans: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank3Anstotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank5Ans: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank5Anstotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank1erJanvier: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank1erJanviertotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },

    rank3Moism: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank3Moistotalm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank6Moism: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank6Moistotalm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank1Anm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank1Antotalm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank3Ansm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank3Anstotalm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank5Ansm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank5Anstotalm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank1erJanvierm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rank1erJanviertotalm: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },

    //add
    ranksharpe: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    ranksharpetotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },

    rankvolatilite: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankvolatilitetotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankdsr: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankdsrtotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankpertemax: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankpertemaxtotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankinfo: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankinfototal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    ranksortino: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    ranksortinototal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankbetabaissier: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankbetabaissiertotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankomega: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankomegatotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankvar95: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankvar95total: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankcalamar: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    rankcalamartotal: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },
    //add

    type_classement: {
      type: DataTypes.INTEGER,
      allowNull: true,

    },



  }, {
    timestamps: false,
    updatedAt: false
  })
}