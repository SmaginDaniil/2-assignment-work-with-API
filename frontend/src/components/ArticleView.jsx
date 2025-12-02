import React, { useEffect, useState } from "react";
import { getArticle, updateArticle, uploadMultiple, getComments, postComment } from "../services/api";

function ArticleView({ articleId, refreshKey = 0 }) {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [filesToUpload, setFilesToUpload] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;
      try {
        const res = await getArticle(articleId);
        setArticle(res);
        const cs = await getComments(articleId);
        setComments(cs);
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

  const startEdit = () => {
    setIsEditing(true);
    setEditTitle(article.title);
    setEditContent(article.content);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async () => {
    try {
      await updateArticle(articleId, { title: editTitle, content: editContent });
      if (filesToUpload && filesToUpload.length > 0) {
        await uploadMultiple(articleId, filesToUpload);
        setFilesToUpload(null);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Save failed.");
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const c = await postComment(articleId, { content: commentText, author: 'Anonymous' });
      setComments((arr) => [...arr, c]);
      setCommentText("");
    } catch (e) {
      setError('Failed to post comment');
    }
  };

  return (
    <div className="article-view">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{article.title}</h2>
        {article.Workspace && <div style={{ color: '#6b7280', fontSize: 14 }}>in {article.Workspace.name}</div>}
      </div>

      {article.attachments && article.attachments.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <strong>Attachments:</strong>
          <div className="attachments">
            {article.attachments.map((att) => (
              <a
                key={att.filename}
                href={`http://localhost:4000${att.url}`}
                target="_blank"
                rel="noreferrer"
                className="attachment-link"
              >
                {att.originalname}
              </a>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <h4>Comments</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {comments.map((c) => (
            <li key={c.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
              <div style={{ color: '#555', fontSize: 13 }}>{c.author || 'Anonymous'} · {new Date(c.createdAt).toLocaleString()}</div>
              <div>{c.content}</div>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 8 }}>
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} style={{ width: '100%', padding: 8 }} />
          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={addComment}>Add Comment</button>
          </div>
        </div>
      </div>

      {!isEditing ? (
        <>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", minHeight: "200px" }} />

          <div style={{ marginTop: 12 }}>
            <button onClick={startEdit} style={{ padding: "8px 12px", marginRight: 8 }}>Edit</button>
          </div>
        </>
      ) : (
        <div style={{ background: "#fff", padding: 12, borderRadius: 6 }}>
          <div style={{ marginBottom: 8 }}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={10} style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              Attach files (images or PDF):
              <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => setFilesToUpload(e.target.files)} style={{ display: "block", marginTop: 6 }} />
            </label>
          </div>
          <div>
            <button onClick={saveEdit} style={{ padding: "8px 12px", marginRight: 8 }}>Save</button>
            <button onClick={cancelEdit} style={{ padding: "8px 12px" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleView;
