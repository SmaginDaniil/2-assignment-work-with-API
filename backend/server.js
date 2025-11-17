const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const http = require("http");
const WebSocket = require("ws");

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

const getArticlePath = (id) => path.join(DATA_DIR, `${id}.json`);
const readArticleFile = (id) => {
  const filePath = getArticlePath(id);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

app.get("/articles", (req, res) => {
  const files = fs.readdirSync(DATA_DIR);
  const articles = files.map((file) => {
    const content = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    const { id, title } = JSON.parse(content);
    return { id, title };
  });
  res.json(articles);
});

app.get("/articles/:id", (req, res) => {
  const article = readArticleFile(req.params.id);
  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }
  res.json(article);
});

app.post("/articles", (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  const id = uuidv4();
  const article = { id, title, content, attachments: [] };
  fs.writeFileSync(getArticlePath(id), JSON.stringify(article, null, 2));

  res.status(201).json({ message: "Article created successfully.", id });
});

app.put("/articles/:id", (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  const filePath = getArticlePath(id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Article not found." });
  }

  const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const updatedArticle = { id, title, content, attachments: existing.attachments || [] };
  fs.writeFileSync(filePath, JSON.stringify(updatedArticle, null, 2));

  broadcast({ type: "article_updated", id, message: "Article updated" });

  res.json({ message: "Article updated successfully." });
});

app.delete("/articles/:id", (req, res) => {
  const { id } = req.params;
  const filePath = getArticlePath(id); 

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Article not found." });
  }

  fs.unlinkSync(filePath);
  res.json({ message: "Article deleted successfully." });
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

app.post("/articles/:id/attachments", upload.single("file"), (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  const article = readArticleFile(id);
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

  article.attachments = article.attachments || [];
  article.attachments.push(attachment);
  fs.writeFileSync(getArticlePath(id), JSON.stringify(article, null, 2));

  broadcast({ type: "attachment_added", id, message: `Attachment ${attachment.originalname} added` });

  res.status(201).json({ message: "Attachment uploaded.", attachment });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
