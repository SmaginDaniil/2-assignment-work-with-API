import React, { useEffect, useState } from "react";
import { getArticles } from "../services/api";

function ArticleList({ onSelectArticle, workspaceId }) {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  const fetchArticles = async (search = "") => {
    try {
      const params = {};
      if (workspaceId) params.workspaceId = workspaceId;
      if (search) params.search = search;
      const res = await getArticles(params);
      setArticles(res);
      setError("");
    } catch (err) {
      setError("Failed to load articles.");
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    fetchArticles(debounced);
  }, [workspaceId, debounced]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  return (
    <div className="article-list">
      <h2>Articles</h2>
      <input
        type="text"
        placeholder="Search articles by title or content"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px", boxSizing: "border-box" }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {articles.length === 0 ? (
        <p>{debounced ? "No results." : "No articles yet."}</p>
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
