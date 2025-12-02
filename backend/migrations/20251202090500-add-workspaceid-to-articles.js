"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('articles', 'workspaceId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'workspaces',
        key: 'id'
      },
      onDelete: 'CASCADE',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('articles', 'workspaceId');
  }
};
