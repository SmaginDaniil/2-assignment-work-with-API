import React, { useEffect, useState } from "react";
import axios from "axios";

function ArticleView({ articleId, refreshKey = 0 }) {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

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
  }, [articleId, refreshKey]);

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

      {article.attachments && article.attachments.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <strong>Attachments:</strong>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            {article.attachments.map((att) => (
              <a
                key={att.filename}
                href={`http://localhost:4000${att.url}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  background: "#eef",
                  borderRadius: 6,
                  textDecoration: "none",
                  color: "#004",
                }}
              >
                {att.originalname}
              </a>
            ))}
          </div>
        </div>
      )}

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

      <div style={{ marginTop: 12 }}>
        <h4>Attach a file</h4>
        {uploadError && <p style={{ color: "red" }}>{uploadError}</p>}
        {uploadSuccess && <p style={{ color: "green" }}>{uploadSuccess}</p>}
        <input
          type="file"
          onChange={(e) => {
            setUploadError("");
            setUploadSuccess("");
            setFile(e.target.files[0]);
          }}
        />
        <div style={{ marginTop: 8 }}>
          <button
            onClick={async () => {
              setUploadError("");
              setUploadSuccess("");
              if (!file) {
                setUploadError("Please select a file to upload.");
                return;
              }
              const allowed = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "application/pdf",
              ];
              if (!allowed.includes(file.type)) {
                setUploadError("Only JPG/PNG/GIF images and PDFs are allowed.");
                return;
              }

              const form = new FormData();
              form.append("file", file);
              try {
                const res = await axios.post(
                  `http://localhost:4000/articles/${articleId}/attachments`,
                  form,
                  { headers: { "Content-Type": "multipart/form-data" } }
                );
                setUploadSuccess("File uploaded successfully.");
                setFile(null);
              } catch (err) {
                setUploadError(err.response?.data?.error || "Upload failed.");
              }
            }}
            style={{ padding: "8px 12px", marginRight: 8 }}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArticleView;
