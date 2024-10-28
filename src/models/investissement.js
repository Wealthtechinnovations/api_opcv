
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('investissements', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.STRING(255),
      },
      achatdate: {
        type: DataTypes.DATE,
      },
      ventedate: {
        type: DataTypes.DATE,
      },
      currentvalue: {
        type: DataTypes.STRING(255),
      },
      montant: {
        type: DataTypes.STRING(255),
      },
      fund_id: {
        type: DataTypes.INTEGER, // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      },
      portefeuille_id:{
        type: DataTypes.INTEGER, // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      },
      prixachat:{
        type: DataTypes.STRING(255), // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      },
      prixvente:{
        type: DataTypes.STRING(255), // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      },
      quantite:{
        type: DataTypes.INTEGER, // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      },
      frais:{
        type: DataTypes.STRING(255), // Utilisez le type de données JSON
        allowNull: true, // Selon vos besoins
      },

     
     
    }, {
      timestamps: false,
      updatedAt: false
    })
  }