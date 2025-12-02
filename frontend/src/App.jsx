import React, { useState, useEffect } from "react";
import ArticleList from "./components/ArticleList";
import ArticleView from "./components/ArticleView";
import ArticleForm from "./components/ArticleForm";
import Workspaces from "./components/Workspaces";

function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");
    ws.onopen = () => console.log("WS connected");
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        setNotifications((n) => {
          const added = [{ ...data, receivedAt: Date.now() }, ...n].slice(0, 8);
          return added;
        });
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

  useEffect(() => {
    if (!notifications.length) return;
    const timers = notifications.map((n, idx) =>
      setTimeout(() => setNotifications((cur) => cur.filter((c) => c !== n)), 6000 + idx * 500)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [notifications]);

  return (
    <div className="app-grid">
      <div className="panel">
        <Workspaces selectedId={selectedWorkspace} onSelect={(id) => setSelectedWorkspace(id)} />
        <div style={{ marginTop: 12 }}>
          <ArticleList key={`${refreshKey}-${selectedWorkspace||''}`} workspaceId={selectedWorkspace} onSelectArticle={(id) => setSelectedArticle(id)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <ArticleForm onArticleCreated={() => setRefreshKey((k) => k + 1)} workspaceId={selectedWorkspace} />
        </div>
      </div>
      <div className="panel">
        <div className="notifications">
          {notifications.map((n, i) => (
            <div key={i} className="notification">
              <strong>{n.type}</strong>: {n.message}
            </div>
          ))}
        </div>
        <ArticleView articleId={selectedArticle} refreshKey={refreshKey} />
      </div>
    </div>
  );
}

export default App;
