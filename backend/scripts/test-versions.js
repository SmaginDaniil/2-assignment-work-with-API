const BASE = 'http://localhost:4000';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch (e) {}
  if (!res.ok) throw new Error(JSON.stringify({ status: res.status, data }));
  return data;
}

async function run() {
  try {
    const a = await req('/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Versioned article', content: 'v1' }) });
    const articleId = a.id;
    console.log('Article created', articleId);

    await req(`/articles/${articleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Versioned article', content: 'v2' }) });
    console.log('Updated to v2');

    await req(`/articles/${articleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Versioned article', content: 'v3' }) });
    console.log('Updated to v3');

    const versions = await req(`/articles/${articleId}/versions`);
    console.log('Versions list', versions);
    if (versions.length < 3) throw new Error('expected 3 versions');

    const firstVersionId = versions[versions.length - 1].id;
    const v1 = await req(`/articles/${articleId}?versionId=${firstVersionId}`);
    console.log('Fetched v1', v1.version.number, v1.version.content);
    if (v1.version.content !== 'v1') throw new Error('v1 content mismatch');

    try {
      await req(`/articles/${articleId}?versionId=${firstVersionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'x', content: 'x' }) });
      throw new Error('Editing historical version should have failed');
    } catch (err) {
      console.log('Editing historical version rejected as expected');
    }

    console.log('Versioning smoke test passed');
  } catch (err) {
    console.error('Test failed', err.message || err);
    process.exit(1);
  }
}

run();
