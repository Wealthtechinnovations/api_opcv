'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');

    if (!tableDescription.reset_token) {
      await queryInterface.addColumn('users', 'reset_token', {
        type: Sequelize.STRING(255),
        defaultValue: null,
        allowNull: true,
      });
    }

    if (!tableDescription.reset_token_expiry) {
      await queryInterface.addColumn('users', 'reset_token_expiry', {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'reset_token');
    await queryInterface.removeColumn('users', 'reset_token_expiry');
  },
};
