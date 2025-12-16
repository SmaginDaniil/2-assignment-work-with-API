const BASE = 'http://localhost:4000';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch (e) {}
  if (!res.ok) throw new Error(JSON.stringify({ status: res.status, data }));
  return data;
}

async function run() {
  try {
    const a = await req('/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Test Article for Comments', content: 'body' }) });
    const articleId = a.id;
    console.log('Article created', articleId);

    const c1 = await req(`/articles/${articleId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'First comment', author: 'Tester' }) });
    console.log('Comment created', c1);

    const updated = await req(`/comments/${c1.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Updated content' }) });
    console.log('Comment updated', updated);

    const res = await req(`/articles/${articleId}/comments`);
    console.log('Comments for article', res);

    const del = await req(`/comments/${c1.id}`, { method: 'DELETE' });
    console.log('Comment deleted', del);

    await req(`/articles/${articleId}`, { method: 'DELETE' });
    console.log('Article deleted');

    console.log('Comment CRUD smoke test completed successfully');
  } catch (err) {
    console.error('Test failed', err.message || err);
    process.exit(1);
  }
}

run();
