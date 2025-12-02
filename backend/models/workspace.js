module.exports = (sequelize, DataTypes) => {
  const Workspace = sequelize.define('Workspace', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'workspaces',
    timestamps: true,
  });

  Workspace.associate = (models) => {
    Workspace.hasMany(models.Article, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
  };

  return Workspace;
};
