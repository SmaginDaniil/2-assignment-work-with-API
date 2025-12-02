module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    workspaceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'articles',
    timestamps: true,
    underscored: false,
  });

  return Article;
};
