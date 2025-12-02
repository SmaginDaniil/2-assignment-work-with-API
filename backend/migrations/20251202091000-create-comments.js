"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('comments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      articleId: {
        type: Sequelize.UUID,
        references: {
          model: 'articles',
          key: 'id'
        },
        onDelete: 'CASCADE',
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('comments');
  }
};
