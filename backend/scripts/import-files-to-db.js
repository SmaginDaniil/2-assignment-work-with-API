const fs = require('fs');
const path = require('path');
const { sequelize, Article } = require('../models');

async function importFiles() {
  const DATA_DIR = path.join(__dirname, '../data');
  if (!fs.existsSync(DATA_DIR)) {
    console.log('No data directory found. Nothing to import.');
    return;
  }
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  if (!files.length) {
    console.log('No article files found to import.');
    return;
  }
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      const existing = await Article.findByPk(content.id);
      if (existing) {
        console.log(`Skipping ${content.id} (exists)`);
        continue;
      }
      await Article.create({ id: content.id, title: content.title, content: content.content, attachments: content.attachments || [] });
      console.log(`Imported ${content.id}`);
    } catch (e) {
      console.error('Failed to import', file, e.message);
    }
  }
}

importFiles().then(() => { console.log('Done'); sequelize.close(); }).catch((err) => { console.error(err); sequelize.close(); });
