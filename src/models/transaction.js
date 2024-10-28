
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('transactions', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING(255),
    },
    date: {
      type: DataTypes.DATE,
    },

    montant: {
      type: DataTypes.STRING(255),
    },
    fond_ids: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    portefeuille_id: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    prixparunite: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    quantite: {
      type: DataTypes.INTEGER, // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    frais: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    frais_entree: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    frais_sortie: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    frais_transaction: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    devise: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    plus_moins_value: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    average: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    },
    invest: {
      type: DataTypes.STRING(255), // Utilisez le type de données JSON
      allowNull: true, // Selon vos besoins
    }


  }, {
    timestamps: false,
    updatedAt: false
  })
}