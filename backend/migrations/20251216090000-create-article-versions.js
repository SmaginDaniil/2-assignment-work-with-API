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
        references: { model: "articles", key: "id" },
        onDelete: "CASCADE",
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      attachments: { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Migrate existing articles to versions table (if articles table has data)
    try {
      const articles = await queryInterface.sequelize.query(
        'SELECT id, title, content, attachments, "createdAt", "updatedAt" FROM articles',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      for (const a of articles) {
        await queryInterface.bulkInsert("ArticleVersions", [
          {
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
    } catch (err) {
      // If articles table is empty or doesn't exist yet, skip migration
      console.log("articles table empty or not yet created, skipping version migration");
    }
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
