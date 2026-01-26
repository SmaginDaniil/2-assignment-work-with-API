import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import ArticleList from "./components/ArticleList";
import ArticleView from "./components/ArticleView";
import ArticleForm from "./components/ArticleForm";
import Workspaces from "./components/Workspaces";
import UserManagement from "./components/UserManagement";

function MainApp() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showUserMgmt, setShowUserMgmt] = useState(false);
  const { logout, user } = useContext(AuthContext);

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
    <div>
      <button onClick={logout} style={{ position: "absolute", top: 10, right: 10 }}>
        Logout
      </button>
      {user?.role === 'admin' && (
        <button 
          onClick={() => setShowUserMgmt(!showUserMgmt)} 
          style={{ position: "absolute", top: 10, right: 120 }}
        >
          {showUserMgmt ? 'Hide' : 'User Mgmt'}
        </button>
      )}
      {showUserMgmt && user?.role === 'admin' ? (
        <UserManagement />
      ) : (
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
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
