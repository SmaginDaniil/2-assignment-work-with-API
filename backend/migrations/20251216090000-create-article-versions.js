"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ArticleVersions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      articleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Articles", key: "id" },
        onDelete: "CASCADE",
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      attachments: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    
    const articles = await queryInterface.sequelize.query(
      'SELECT id, title, content, attachments, "createdAt", "updatedAt" FROM "Articles"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const a of articles) {
      await queryInterface.bulkInsert("ArticleVersions", [
        {
          id: Sequelize.Utils ? Sequelize.Utils.toDefaultValue(Sequelize.UUIDV4) : undefined,
          articleId: a.id,
          version: 1,
          title: a.title || "",
          content: a.content || "",
          attachments: a.attachments || null,
          createdAt: a.createdAt || new Date(),
          updatedAt: a.updatedAt || new Date(),
        },
      ]);
    }

    
    await queryInterface.removeColumn("Articles", "content");
    await queryInterface.removeColumn("Articles", "attachments");
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.addColumn("Articles", "content", { type: Sequelize.TEXT });
    await queryInterface.addColumn("Articles", "attachments", { type: Sequelize.JSONB });

    
    const latest = await queryInterface.sequelize.query(
      `SELECT a."articleId" as id, a.title, a.content, a.attachments FROM "ArticleVersions" a
       INNER JOIN (
         SELECT "articleId", MAX(version) as mv FROM "ArticleVersions" GROUP BY "articleId"
       ) m ON a."articleId" = m."articleId" AND a.version = m.mv`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const row of latest) {
      await queryInterface.sequelize.query(
        `UPDATE "Articles" SET title = :title, content = :content, attachments = :attachments WHERE id = :id`,
        { replacements: { title: row.title, content: row.content, attachments: row.attachments, id: row.id } }
      );
    }

    await queryInterface.dropTable("ArticleVersions");
  },
};
