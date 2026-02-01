import axios from "axios";

const base = axios.create({ baseURL: "http://localhost:4000" });

base.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

base.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export async function getArticles(params = {}) {
  const res = await base.get("/articles", { params });
  return res.data;
}
export async function getArticlesByWorkspace(workspaceId) {
  return getArticles({ workspaceId });
}

export async function getArticle(id) {
  const res = await base.get(`/articles/${id}`);
  return res.data;
}

export async function getArticleVersion(articleId, versionId) {
  const res = await base.get(`/articles/${articleId}`, { params: { versionId } });
  return res.data;
}

export async function getArticleVersions(articleId) {
  const res = await base.get(`/articles/${articleId}/versions`);
  return res.data;
}

export async function exportArticlePdf(articleId, params = {}) {
  const res = await base.get(`/articles/${articleId}/export`, { params, responseType: 'arraybuffer' });
  return res;
}

export async function createArticle(payload) {
  const res = await base.post(`/articles`, payload);
  return res.data;
}

export async function updateArticle(id, payload) {
  const res = await base.put(`/articles/${id}`, payload);
  return res.data;
}

export async function uploadAttachment(articleId, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await base.post(`/articles/${articleId}/attachments`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function uploadMultiple(articleId, files = []) {
  return Promise.all(Array.from(files).map((f) => uploadAttachment(articleId, f)));
}

export async function getWorkspaces() {
  const res = await base.get('/workspaces');
  return res.data;
}

export async function createWorkspace(payload) {
  const res = await base.post('/workspaces', payload);
  return res.data;
}

export async function getComments(articleId) {
  const res = await base.get(`/articles/${articleId}/comments`);
  return res.data;
}

export async function postComment(articleId, payload) {
  const res = await base.post(`/articles/${articleId}/comments`, payload);
  return res.data;
}

export async function updateComment(commentId, payload) {
  const res = await base.put(`/comments/${commentId}`, payload);
  return res.data;
}

export async function deleteComment(commentId) {
  const res = await base.delete(`/comments/${commentId}`);
  return res.data;
}

export async function getUsers() {
  const res = await base.get('/api/users');
  return res.data;
}

export async function updateUserRole(userId, role) {
  const res = await base.put(`/api/users/${userId}/role`, { role });
  return res.data;
}

export default base;
