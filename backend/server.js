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

app.get("/articles", (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR);
    const articles = files.map((file) => {
      const filePath = path.join(DATA_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return { id: data.id, title: data.title };
    });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: "Failed to read articles." });
  }
});

app.get("/articles/:id", (req, res) => {
  const filePath = path.join(DATA_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Article not found." });
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  res.json(data);
});

app.post("/articles", (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  const id = uuidv4();
  const article = { id, title, content };
  const filePath = path.join(DATA_DIR, `${id}.json`);

  try {
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
    res.status(201).json({ message: "Article created successfully.", id });
  } catch (err) {
    res.status(500).json({ error: "Failed to save article." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
