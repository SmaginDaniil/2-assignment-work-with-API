module.exports = function registerCommentRoutes(app, models, broadcast) {
  const { Article, Comment } = models;

  app.get('/articles/:id/comments', async (req, res) => {
    try {
      const comments = await Comment.findAll({ where: { articleId: req.params.id }, order: [['createdAt','ASC']] });
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  app.post('/articles/:id/comments', async (req, res) => {
    const { content, author } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    try {
      const article = await Article.findByPk(req.params.id);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      const comment = await Comment.create({ content, author, articleId: req.params.id });
      if (broadcast) broadcast({ type: 'comment_created', articleId: req.params.id, comment });
      res.status(201).json(comment);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });

  app.put('/comments/:id', async (req, res) => {
    try {
      const { content } = req.body;
      const comment = await Comment.findByPk(req.params.id);
      if (!comment) return res.status(404).json({ error: 'Comment not found' });
      comment.content = content || comment.content;
      await comment.save();
      res.json(comment);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  });

  app.delete('/comments/:id', async (req, res) => {
    try {
      const affected = await Comment.destroy({ where: { id: req.params.id } });
      if (!affected) return res.status(404).json({ error: 'Comment not found' });
      res.json({ message: 'Comment deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });
};
