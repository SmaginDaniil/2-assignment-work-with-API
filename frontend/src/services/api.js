import axios from "axios";

const base = axios.create({ baseURL: "http://localhost:4000" });

export async function getArticles() {
  const res = await base.get("/articles");
  return res.data;
}

export async function getArticle(id) {
  const res = await base.get(`/articles/${id}`);
  return res.data;
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

export default base;
