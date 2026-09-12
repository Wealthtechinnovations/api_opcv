'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('fond_investissements');

    if (!tableDesc.societe_id) {
      await queryInterface.addColumn('fond_investissements', 'societe_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        after: 'societe_gestion',
      });
      await queryInterface.addIndex('fond_investissements', ['societe_id'], {
        name: 'idx_fond_societe_id',
      });
    }

    // documents
    const docDesc = await queryInterface.describeTable('documents');
    if (!docDesc.societe_id) {
      await queryInterface.addColumn('documents', 'societe_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
      await queryInterface.addIndex('documents', ['societe_id'], {
        name: 'idx_doc_societe_id',
      });
    }

    // personnel_sgs
    const persDesc = await queryInterface.describeTable('personnel_sgs');
    if (!persDesc.societe_id) {
      await queryInterface.addColumn('personnel_sgs', 'societe_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
      await queryInterface.addIndex('personnel_sgs', ['societe_id'], {
        name: 'idx_pers_societe_id',
      });
    }

    // Populate societe_id from string match
    await queryInterface.sequelize.query(`
      UPDATE fond_investissements f
      INNER JOIN societes s ON TRIM(f.societe_gestion) = TRIM(s.nom)
      SET f.societe_id = s.id
      WHERE f.societe_id IS NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE documents d
      INNER JOIN societes s ON TRIM(d.societe) = TRIM(s.nom)
      SET d.societe_id = s.id
      WHERE d.societe_id IS NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE personnel_sgs p
      INNER JOIN societes s ON TRIM(p.societe) = TRIM(s.nom)
      SET p.societe_id = s.id
      WHERE p.societe_id IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('fond_investissements', 'societe_id');
    await queryInterface.removeColumn('documents', 'societe_id');
    await queryInterface.removeColumn('personnel_sgs', 'societe_id');
  },
};
