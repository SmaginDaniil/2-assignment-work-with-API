import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";

function ArticleForm({ onArticleCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !content.trim() || content === "<p><br></p>") {
      setError("Please fill in both title and content.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:4000/articles", {
        title,
        content,
      });

      if (res.status === 201) {
        setTitle("");
        setContent("");
        setSuccess("Article successfully created!");
        if (onArticleCreated) onArticleCreated();
      } else {
        setError("Failed to create the article. Please try again.");
      }
    } catch (err) {
      console.error("Error saving article:", err);
      setError(err.response?.data?.error || "An unexpected error occurred.");
    }
  };

  return (
    <div className="article-form" style={{ margin: "20px 0" }}>
      <h2>Create a New Article</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter article title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            padding: "8px",
            fontSize: "16px",
          }}
        />

        <div style={{ marginBottom: "40px" }}>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            placeholder="Write your article content here..."
            style={{ height: "200px" }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Save
        </button>
      </form>
    </div>
  );
}

export default ArticleForm;
