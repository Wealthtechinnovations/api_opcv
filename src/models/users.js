module.exports = (sequelize, DataTypes) => {
  return sequelize.define('users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    nom: {
      type: DataTypes.STRING(255),
    },
    prenoms: {
      type: DataTypes.STRING(255),
    },
    denomination: {
      type: DataTypes.STRING(255),
    },
    pays: {
      type: DataTypes.STRING(255),
    },
    typeusers: {
      type: DataTypes.STRING(255),
    },
    typeusers_id: {
      type: DataTypes.STRING(255),
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
      { unique: true, fields: ['email'] },
    ]
  });
};
