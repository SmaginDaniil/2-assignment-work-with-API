import React, { useState } from "react";
import ArticleList from "./components/ArticleList";
import ArticleView from "./components/ArticleView";
import ArticleForm from "./components/ArticleForm";

function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        <ArticleView articleId={selectedArticle} />
      </div>
    </div>
  );
}

export default App;
