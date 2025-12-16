const axios = require('axios');

const base = axios.create({ baseURL: 'http://localhost:4000' });

async function run() {
  try {
    // Create an article to attach comments to
    const a = await base.post('/articles', { title: 'Test Article for Comments', content: 'body' });
    const articleId = a.data.id;
    console.log('Article created', articleId);

    // Create comment
    const c1 = await base.post(`/articles/${articleId}/comments`, { content: 'First comment', author: 'Tester' });
    console.log('Comment created', c1.data);

    // Update comment
    const updated = await base.put(`/comments/${c1.data.id}`, { content: 'Updated content' });
    console.log('Comment updated', updated.data);

    // Get comments
    const res = await base.get(`/articles/${articleId}/comments`);
    console.log('Comments for article', res.data);

    // Delete comment
    const del = await base.delete(`/comments/${c1.data.id}`);
    console.log('Comment deleted', del.data);

    // Cleanup: delete article
    await base.delete(`/articles/${articleId}`);
    console.log('Article deleted');

    console.log('Comment CRUD smoke test completed successfully');
  } catch (err) {
    console.error('Test failed', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
