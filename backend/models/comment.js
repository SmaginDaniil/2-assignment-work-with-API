module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'comments',
    timestamps: true,
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.Article, { foreignKey: 'articleId', onDelete: 'CASCADE' });
  };

  return Comment;
};
