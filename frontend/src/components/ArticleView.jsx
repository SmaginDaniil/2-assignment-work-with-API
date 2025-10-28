import React, { useEffect, useState } from "react";
import axios from "axios";

function ArticleView({ articleId }) {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;
      try {
        const res = await axios.get(
          `http://localhost:4000/articles/${articleId}`
        );
        setArticle(res.data);
        setError("");
      } catch (err) {
        setError("Failed to load article.");
      }
    };
    fetchArticle();
  }, [articleId]);

  if (!articleId) {
    return <p>Select an article to view it.</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!article) {
    return <p>Loading article...</p>;
  }

  return (
    <div className="article-view">
      <h2>{article.title}</h2>
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
        style={{
          background: "#f9f9f9",
          padding: "15px",
          borderRadius: "8px",
          minHeight: "200px",
        }}
      />
    </div>
  );
}

export default ArticleView;
