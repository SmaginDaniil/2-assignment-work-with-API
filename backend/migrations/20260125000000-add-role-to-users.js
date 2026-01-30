'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const usersDesc = await queryInterface.describeTable('Users').catch(() => null);
    if (usersDesc && !usersDesc.role) {
      await queryInterface.addColumn('Users', 'role', {
        type: Sequelize.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user',
      });
    }

    const articlesDesc = await queryInterface.describeTable('articles').catch(() => null);
    if (articlesDesc && !articlesDesc.userId) {
      await queryInterface.addColumn('articles', 'userId', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const usersDesc = await queryInterface.describeTable('Users').catch(() => null);
    if (usersDesc && usersDesc.role) {
      await queryInterface.removeColumn('Users', 'role');
    }

    const articlesDesc = await queryInterface.describeTable('articles').catch(() => null);
    if (articlesDesc && articlesDesc.userId) {
      await queryInterface.removeColumn('articles', 'userId');
    }
  }
};
