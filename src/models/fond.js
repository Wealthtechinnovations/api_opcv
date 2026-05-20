module.exports = (sequelize, DataTypes) => {
  const FondInvestissement = sequelize.define('fond_investissements', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom_fond: {
      type: DataTypes.STRING(255),
    },
    code: {
      type: DataTypes.STRING(255),
    },
    indice_benchmark: {
      type: DataTypes.STRING(255),
    },
    indice: {
      type: DataTypes.STRING(255),
    },
    reseau_placeur: {
      type: DataTypes.STRING(255),
    },
    sensibilite: {
      type: DataTypes.STRING(255),
    },
    pays: {
      type: DataTypes.STRING(255),
    },
    region: {
      type: DataTypes.STRING(255),
    },
    periodicite: {
      type: DataTypes.STRING(255),
    },
    structure_fond: {
      type: DataTypes.STRING(255),
    },
    code_ISIN: {
      type: DataTypes.STRING(255),
    },
    date_creation: {
      type: DataTypes.DATEONLY,
    },
    dev_libelle: {
      type: DataTypes.STRING(255),
    },
    societe_gestion: {
      type: DataTypes.STRING(255),
    },
    societe_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    categorie_libelle: {
      type: DataTypes.STRING(255),
    },
    classification: {
      type: DataTypes.STRING(255),
    },
    type_investissement: {
      type: DataTypes.STRING(255),
    },
    nom_gerant: {
      type: DataTypes.STRING(255),
    },
    categorie_globale: {
      type: DataTypes.STRING(255),
    },
    categorie_national: {
      type: DataTypes.STRING(255),
    },
    categorie_regional: {
      type: DataTypes.STRING(255),
    },
    frais_gestion: {
      type: DataTypes.DOUBLE,
    },
    frais_souscription: {
      type: DataTypes.DOUBLE,
    },
    frais_entree: {
      type: DataTypes.DOUBLE,
    },
    frais_sortie: {
      type: DataTypes.DOUBLE,
    },
    minimum_investissement: {
      type: DataTypes.DOUBLE,
    },
    affectation: {
      type: DataTypes.STRING(255),
    },
    frais_rachat: {
      type: DataTypes.DOUBLE,
    },
    description: {
      type: DataTypes.TEXT,
    },
    strategie_politique_invest: {
      type: DataTypes.TEXT,
    },
    philosophie_fond: {
      type: DataTypes.TEXT,
    },
    horizonplacement: {
      type: DataTypes.STRING(255),
    },
    date_agrement: {
      type: DataTypes.DATEONLY,
    },
    date_premiere_vl: {
      type: DataTypes.DATEONLY,
    },
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    depositaire: {
      type: DataTypes.STRING(255),
    },
    teneur_registre: {
      type: DataTypes.STRING(255),
    },
    valorisateur: {
      type: DataTypes.STRING(255),
    },
    centralisateur: {
      type: DataTypes.STRING(255),
    },
    agent_transfert: {
      type: DataTypes.STRING(255),
    },
    agent_payeur: {
      type: DataTypes.STRING(255),
    },
    numero_agrement: {
      type: DataTypes.STRING(255),
    },
    montant_premier_vl: {
      type: DataTypes.DOUBLE,
    },
    montant_actif_net: {
      type: DataTypes.DOUBLE,
    },
    duree_investissement_recommande: {
      type: DataTypes.STRING(255),
    },
    date_cloture: {
      type: DataTypes.DATEONLY,
    },
    heure_cutt_off: {
      type: DataTypes.STRING(255),
    },
    delai_reglement: {
      type: DataTypes.STRING(255),
    },
    souscripteur: {
      type: DataTypes.STRING(255),
    },
    regulateur: {
      type: DataTypes.STRING(255),
    },
    pays_one: {
      type: DataTypes.STRING(255),
    },
    dividende: {
      type: DataTypes.INTEGER,
    },
    datemoispre: {
      type: DataTypes.DATEONLY,
    },
    datejour: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nombre_part: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    banque: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    IBAN: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    RIB: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    indice_fundafrica: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    indice_fundafrica_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    categorie_fundafrica_locale: {
      type: DataTypes.STRING(200),
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
      { fields: ['code_ISIN'] },
      { fields: ['societe_gestion'] },
      { fields: ['pays'] },
      { fields: ['categorie_libelle'] },
      { fields: ['active'] },
      { fields: ['societe_id'] },
    ]
  });

  return FondInvestissement;
};
