import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createArticle, uploadMultiple } from "../services/api";

function ArticleForm({ onArticleCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !content.trim() || content === "<p><br></p>") {
      setError("Please fill in both title and content.");
      return;
    }

    try {
      const res = await createArticle({ title, content });
      const id = res.id;
      if (files && files.length > 0) {
        const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
        for (const f of files) {
          if (!allowed.includes(f.type)) throw new Error("Invalid file type selected.");
        }
        await uploadMultiple(id, files);
      }
      setTitle("");
      setContent("");
      setFiles(null);
      setSuccess("Article successfully created!");
      if (onArticleCreated) onArticleCreated();
    } catch (err) {
      console.error("Error saving article:", err);
      setError(err.response?.data?.error || err.message || "An unexpected error occurred.");
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
          style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", fontSize: "16px" }}
        />

        <div className="editor-block">
          <ReactQuill theme="snow" value={content} onChange={setContent} placeholder="Write your article content here..." style={{ height: "200px" }} />
        </div>

        <div className="attach-row" style={{ marginBottom: 12 }}>
          <button type="button" className="btn secondary" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            Attach files
          </button>
          <div style={{ color: "var(--muted)", fontSize: 13, marginLeft: 8 }}>
            {files && files.length > 0 ? Array.from(files).map((f) => f.name).join(", ") : "No files selected"}
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" onChange={(e) => setFiles(e.target.files)} style={{ display: "none" }} />
        </div>

        <div className="form-actions" style={{ marginTop: 6 }}>
          <button type="submit" className="btn">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default ArticleForm;
