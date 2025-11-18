import React, { useEffect, useState } from "react";
import { getArticles } from "../services/api";

function ArticleList({ onSelectArticle }) {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");

  const fetchArticles = async () => {
    try {
      const res = await getArticles();
      setArticles(res);
      setError("");
    } catch (err) {
      setError("Failed to load articles.");
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="article-list">
      <h2>Articles</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {articles.length === 0 ? (
        <p>No articles yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {articles.map((article) => (
            <li key={article.id} onClick={() => onSelectArticle(article.id)} style={{ cursor: "pointer", padding: "8px", borderBottom: "1px solid #ddd" }}>
              {article.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ArticleList;
