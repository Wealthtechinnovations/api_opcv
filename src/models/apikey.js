module.exports = (sequelize, DataTypes) => {
  return sequelize.define('api_keys', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    api_key: {
      type: DataTypes.STRING(100), // Taille réduite ou ajustée selon vos besoins
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE, // Date d'expiration
      allowNull: true, // Peut être null si aucune expiration n'est définie
    },
    rate_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 100, // Par défaut, 100 appels autorisés
    },
    calls_made: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Compteur pour les appels effectués
    },
    renewal_token: {
      type: DataTypes.STRING(255), // Token pour le renouvellement
      allowNull: true,
    },
   
  }, {
    timestamps: true,
    createdAt: 'created_at', // Nom personnalisé pour createdAt
    updatedAt: false, // Désactiver updatedAt
    tableName: 'api_keys', // Nom de la table explicite si nécessaire
  });
}
