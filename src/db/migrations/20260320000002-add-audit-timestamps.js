'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = [
      'fond_investissements',
      'users',
      'investissements',
      'societes',
      'documents',
    ];

    for (const table of tables) {
      await queryInterface.addColumn(table, 'created_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      }).catch(() => {});

      await queryInterface.addColumn(table, 'updated_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        allowNull: true,
      }).catch(() => {});
    }

    // Add only created_at to transaction tables
    const txTables = ['transactions'];
    for (const table of txTables) {
      await queryInterface.addColumn(table, 'created_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      }).catch(() => {});
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = [
      'fond_investissements',
      'users',
      'investissements',
      'societes',
      'documents',
    ];

    for (const table of tables) {
      await queryInterface.removeColumn(table, 'created_at').catch(() => {});
      await queryInterface.removeColumn(table, 'updated_at').catch(() => {});
    }

    await queryInterface.removeColumn('transactions', 'created_at').catch(() => {});
  }
};
