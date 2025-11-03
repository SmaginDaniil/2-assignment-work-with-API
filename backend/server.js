const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 4000;
const DATA_DIR = path.join(__dirname, "data");

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

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
  const article = { id, title, content };
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

  const updatedArticle = { id, title, content };
  fs.writeFileSync(filePath, JSON.stringify(updatedArticle, null, 2));

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
