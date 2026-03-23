module.exports = (sequelize, DataTypes) => {
  return sequelize.define('classementfonds_usds', {
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
