"use strict";
module.exports = (sequelize, DataTypes) => {
  const ArticleVersion = sequelize.define(
    "ArticleVersion",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      articleId: { type: DataTypes.UUID, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      attachments: { type: DataTypes.JSONB, allowNull: true },
    },
    {}
  );

  ArticleVersion.associate = function (models) {
    ArticleVersion.belongsTo(models.Article, { foreignKey: "articleId", as: "Article" });
  };

  return ArticleVersion;
};
