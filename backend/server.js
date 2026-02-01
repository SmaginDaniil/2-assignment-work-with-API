require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const http = require("http");
const WebSocket = require("ws");
const { sequelize, Article, Comment, Workspace, ArticleVersion, User } = require("./models");
const PDFDocument = require('pdfkit');
const { convert } = require('html-to-text');
const roles = require('./constants/roles');
const verifyToken = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");

const app = express();
const PORT = 4000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");

app.use(cors());
app.use(bodyParser.json());

app.use("/auth", authRoutes);
app.use("/api", usersRoutes);

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

app.use("/uploads", express.static(UPLOADS_DIR));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const allowedMime = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (allowedMime.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

const getArticlePath = (id) => path.join(DATA_DIR, `${id}.json`);
const readArticleFile = (id) => {
  const filePath = getArticlePath(id);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

app.get("/articles", verifyToken, async (req, res) => {
  try {
    const where = {};
    if (req.query.workspaceId) where.workspaceId = req.query.workspaceId;

    if (req.query.search) {
      const { Op } = sequelize.Sequelize;
      const search = req.query.search;
      const lower = `%${search.toLowerCase()}%`;

      const matchedVersions = await ArticleVersion.findAll({
        attributes: ["articleId"],
        where: {
          [Op.or]: [
            sequelize.Sequelize.where(sequelize.Sequelize.fn('LOWER', sequelize.Sequelize.col('title')), { [Op.like]: lower }),
            sequelize.Sequelize.where(sequelize.Sequelize.fn('LOWER', sequelize.Sequelize.col('content')), { [Op.like]: lower }),
          ],
        },
        group: ['articleId'],
      });

      const versionIds = matchedVersions.map((v) => v.articleId);

      where[Op.or] = [
        sequelize.Sequelize.where(sequelize.Sequelize.fn('LOWER', sequelize.Sequelize.col('title')), { [Op.like]: lower }),
        sequelize.Sequelize.where(sequelize.Sequelize.fn('LOWER', sequelize.Sequelize.col('content')), { [Op.like]: lower }),
      ];
      if (versionIds.length > 0) {
        where[Op.or].push({ id: { [Op.in]: versionIds } });
      }
    }

    const articles = await Article.findAll({ where, attributes: ["id", "title", "workspaceId"], order: [["createdAt", "DESC"]] });
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch articles." });
  }
});

app.get("/articles/:id", verifyToken, async (req, res) => {
  try {
    const { versionId } = req.query;
    const article = await Article.findByPk(req.params.id, { include: [{ model: Comment, as: 'Comments' }, { model: Workspace, as: 'Workspace' }] });
    if (!article) return res.status(404).json({ error: "Article not found." });

    if (versionId) {
      const version = await ArticleVersion.findByPk(versionId);
      if (!version || version.articleId !== article.id) return res.status(404).json({ error: 'Version not found for this article' });
      return res.json({
        id: article.id,
        title: version.title,
        workspaceId: article.workspaceId,
        userId: article.userId,
        version: { id: version.id, number: version.version, content: version.content, attachments: version.attachments, createdAt: version.createdAt },
        isCurrent: false,
        Comments: article.Comments || []
      });
    }
    const latest = await ArticleVersion.findOne({ where: { articleId: article.id }, order: [['version', 'DESC']] });
    if (latest) {
      return res.json({ id: article.id, title: latest.title, workspaceId: article.workspaceId, userId: article.userId, version: { id: latest.id, number: latest.version, content: latest.content, attachments: latest.attachments, createdAt: latest.createdAt }, isCurrent: true, Comments: article.Comments || [] });
    }

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch article." });
  }
});

app.get('/articles/:id/export', verifyToken, async (req, res) => {
  try {
    const { versionId } = req.query;
    console.log(`Export request: article=${req.params.id} version=${versionId || 'latest'} user=${req.user?.id || 'anonymous'}`);
    const article = await Article.findByPk(req.params.id, { include: [{ model: Workspace, as: 'Workspace' }] });
    if (!article) {
      console.warn(`Export failed: article not found: ${req.params.id}`);
      return res.status(404).json({ error: "Article not found." });
    }

    let version = null;
    if (versionId) {
      version = await ArticleVersion.findByPk(versionId);
      if (!version || version.articleId !== article.id) return res.status(404).json({ error: 'Version not found for this article' });
    } else {
      version = await ArticleVersion.findOne({ where: { articleId: article.id }, order: [['version', 'DESC']] });
    }

    const author = article.userId ? await User.findByPk(article.userId) : null;
    const contentHtml = version ? version.content : article.content || '';

    let contentText = '';
    try {
      contentText = convert(contentHtml, { wordwrap: 130 });
    } catch (e) {
      console.error('html-to-text convert failed, falling back to basic strip:', e);
      contentText = (contentHtml || '').replace(/<[^>]*>/g, '');
    }

    if (!contentText) console.warn(`Export: article ${article.id} produced empty content text`);

    const filenameSafe = (article.title || 'article').replace(/[\\/:*?"<>|]/g, '').slice(0,120);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameSafe}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).text(article.title || 'Untitled', { align: 'left' });
    doc.moveDown(0.2);

    const metaParts = [];
    if (author) metaParts.push(`Author: ${author.email}`);
    if (article.createdAt) metaParts.push(`Created: ${new Date(article.createdAt).toLocaleString()}`);
    if (version) metaParts.push(`Version: ${version.version}`);
    if (article.Workspace && article.Workspace.name) metaParts.push(`Workspace: ${article.Workspace.name}`);
    if (metaParts.length > 0) {
      doc.fontSize(10).fillColor('gray').text(metaParts.join(' • '));
      doc.moveDown();
    }

    doc.fontSize(12).fillColor('black');
    doc.text(contentText, { align: 'left' });

    doc.end();
  } catch (err) {
    console.error('Failed to export PDF:', err);
    res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});

app.get('/internal/test-export', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    doc.pipe(res);
    doc.fontSize(18).text('Test PDF', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('This is a test PDF generated by the server to verify PDF generation is working.');
    doc.end();
  } catch (err) {
    console.error('Test export failed:', err);
    res.status(500).json({ error: 'Failed to generate test PDF.' });
  }
});

app.get('/internal/check-article/:id', async (req, res) => {
  try {
    const a = await Article.findByPk(req.params.id);
    if (!a) return res.status(404).json({ found: false });
    return res.json({ found: true, id: a.id, title: a.title, workspaceId: a.workspaceId });
  } catch (err) {
    console.error('Check article failed:', err);
    res.status(500).json({ error: 'Failed to check article.' });
  }
});

app.post("/articles", verifyToken, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content are required." });
  const { workspaceId } = req.body;
  try {
    const attrs = { title, content, attachments: [], userId: req.user.id };
    if (workspaceId) attrs.workspaceId = workspaceId;
    const article = await Article.create(attrs);

    await ArticleVersion.create({ articleId: article.id, version: 1, title, content, attachments: [] });

    res.status(201).json({ message: "Article created successfully.", id: article.id });
  } catch (err) {
    console.error("POST /articles error:", err.message, err.stack);
    res.status(500).json({ error: "Failed to create article.", details: err.message });
  }
});

app.put("/articles/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  try {
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ error: "Article not found." });

    const isCreator = article.userId === req.user.id;
    const isAdmin = req.user.role === roles.ADMIN;
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: "You can only edit your own articles." });
    }

    if (req.query.versionId) return res.status(400).json({ error: 'Cannot edit a historical version' });

    const latest = await ArticleVersion.findOne({ where: { articleId: id }, order: [['version', 'DESC']] });
    const nextVersion = latest ? latest.version + 1 : 1;

    const attachments = (latest && latest.attachments) ? latest.attachments : [];
    const ver = await ArticleVersion.create({ articleId: id, version: nextVersion, title, content, attachments });

    article.title = title;
    await article.save();

    broadcast({ type: "article_updated", id, version: ver.version, message: "Article updated (new version)" });
    res.json({ message: "Article updated and new version created.", versionId: ver.id, versionNumber: ver.version });
  } catch (err) {
    console.error("PUT /articles/:id error:", err.message, err.stack);
    res.status(500).json({ error: "Failed to update article.", details: err.message });
  }
});

app.delete("/articles/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await Article.destroy({ where: { id } });
    if (!affected) return res.status(404).json({ error: "Article not found." });
    res.json({ message: "Article deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete article." });
  }
});

app.post("/articles/:id/attachments", verifyToken, upload.single("file"), async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  const article = await Article.findByPk(id);
  if (!article) {
    fs.unlinkSync(file.path);
    return res.status(404).json({ error: "Article not found." });
  }

  const attachment = {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    url: `/uploads/${file.filename}`,
    size: file.size,
  };

  const latest = await ArticleVersion.findOne({ where: { articleId: id }, order: [['version', 'DESC']] });
  const nextVersion = latest ? latest.version + 1 : 1;
  const attachments = (latest && latest.attachments) ? (latest.attachments || []).concat([attachment]) : [attachment];

  const ver = await ArticleVersion.create({ articleId: id, version: nextVersion, title: latest ? latest.title : article.title || '', content: latest ? latest.content : '', attachments });

  broadcast({ type: "attachment_added", id, version: ver.version, message: `Attachment ${attachment.originalname} added` });

  res.status(201).json({ message: "Attachment uploaded and new version created.", attachment, versionId: ver.id });
});

app.get('/articles/:id/versions', verifyToken, async (req, res) => {
  try {
    const versions = await ArticleVersion.findAll({ where: { articleId: req.params.id }, order: [['version','DESC']] });
    res.json(versions.map(v => ({ id: v.id, version: v.version, createdAt: v.createdAt })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

app.get('/workspaces', verifyToken, async (req, res) => {
  try {
    const ws = await Workspace.findAll({ order: [['createdAt','ASC']]});
    res.json(ws);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

app.post('/workspaces', verifyToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const w = await Workspace.create({ name });
    res.status(201).json(w);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

app.get('/articles/:id/comments', verifyToken, async (req, res) => {
  try {
    const comments = await Comment.findAll({ where: { articleId: req.params.id }, order: [['createdAt','ASC']] });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/articles/:id/comments', verifyToken, async (req, res) => {
  const { content, author } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const comment = await Comment.create({ content, author, articleId: req.params.id });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

app.put('/comments/:id', verifyToken, async (req, res) => {
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

app.delete('/comments/:id', verifyToken, async (req, res) => {
  try {
    const affected = await Comment.destroy({ where: { id: req.params.id } });
    if (!affected) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

app.get("/", (req, res) => {
  res.send("Article Management API is running.");
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
  ws.on("message", (msg) => {
    console.log("received ws message", msg.toString());
  });
});

require('./routes/comments')(app, { Article, Comment }, broadcast);

(async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    if (process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized (sync)');
    }
  } catch (err) {
    console.error('Database connection failed', err);
  } finally {
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
})();
