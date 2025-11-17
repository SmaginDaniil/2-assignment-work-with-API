import React, { useState, useEffect } from "react";
import ArticleList from "./components/ArticleList";
import ArticleView from "./components/ArticleView";
import ArticleForm from "./components/ArticleForm";

function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");
    ws.onopen = () => console.log("WS connected");
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        setNotifications((n) => [{ ...data, receivedAt: Date.now() }, ...n].slice(0, 5));
        if (data.type === "article_updated" || data.type === "attachment_added") {
          setRefreshKey((k) => k + 1);
        }
      } catch (e) {
        console.error("Invalid ws message", e);
      }
    };
    ws.onclose = () => console.log("WS closed");
    return () => ws.close();
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr",
        gap: "20px",
        padding: "20px",
      }}
    >
      <div>
        <ArticleList
          key={refreshKey}
          onSelectArticle={(id) => setSelectedArticle(id)}
        />
        <ArticleForm onArticleCreated={() => setRefreshKey((k) => k + 1)} />
      </div>
      <div>
        <div style={{ position: "relative" }}>
          <div style={{ marginBottom: 10 }}>
            {notifications.map((n, i) => (
              <div
                key={i}
                style={{
                  background: "#fff8c6",
                  border: "1px solid #f0e68c",
                  padding: "8px",
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                <strong>{n.type}</strong>: {n.message}
              </div>
            ))}
          </div>
          <ArticleView articleId={selectedArticle} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}

export default App;
