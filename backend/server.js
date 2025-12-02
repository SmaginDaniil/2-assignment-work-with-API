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
const { sequelize, Article, Comment, Workspace } = require("./models");

const app = express();
const PORT = 4000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");

app.use(cors());
app.use(bodyParser.json());

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

// file-based persistence functions kept for backward compatibility
const getArticlePath = (id) => path.join(DATA_DIR, `${id}.json`);
const readArticleFile = (id) => {
  const filePath = getArticlePath(id);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

app.get("/articles", async (req, res) => {
  try {
    const where = {};
    if (req.query.workspaceId) where.workspaceId = req.query.workspaceId;
    const articles = await Article.findAll({ where, attributes: ["id", "title", "workspaceId"], order: [["createdAt", "DESC"]] });
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch articles." });
  }
});

app.get("/articles/:id", async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: Comment, as: 'Comments' }, { model: Workspace, as: 'Workspace' }]
    });
    if (!article) return res.status(404).json({ error: "Article not found." });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch article." });
  }
});

app.post("/articles", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content are required." });
  const { workspaceId } = req.body;
  try {
    const attrs = { title, content };
    if (workspaceId) attrs.workspaceId = workspaceId;
    const article = await Article.create(attrs);
    res.status(201).json({ message: "Article created successfully.", id: article.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create article." });
  }
});

app.put("/articles/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  try {
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ error: "Article not found." });
    article.title = title;
    article.content = content;
    await article.save();
    broadcast({ type: "article_updated", id, message: "Article updated" });
    res.json({ message: "Article updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update article." });
  }
});

app.delete("/articles/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await Article.destroy({ where: { id } });
    if (!affected) return res.status(404).json({ error: "Article not found." });
    res.json({ message: "Article deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete article." });
  }
});

app.get('/workspaces', async (req, res) => {
  try {
    const ws = await Workspace.findAll({ order: [['createdAt','ASC']]});
    res.json(ws);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

app.post('/workspaces', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const w = await Workspace.create({ name });
    res.status(201).json(w);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

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

app.post("/articles/:id/attachments", upload.single("file"), async (req, res) => {
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

  article.attachments = (article.attachments || []).concat([attachment]);
  await article.save();

  broadcast({ type: "attachment_added", id, message: `Attachment ${attachment.originalname} added` });

  res.status(201).json({ message: "Attachment uploaded.", attachment });
});

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
