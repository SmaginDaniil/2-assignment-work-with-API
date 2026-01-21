require('dotenv').config();
const path = require('path');

const useSqlite = process.env.DB_DIALECT === 'sqlite';

module.exports = {
  development: useSqlite ? {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'data', 'dev.sqlite'),
    logging: false,
  } : {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'articles_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
  test: useSqlite ? {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'data', 'test.sqlite'),
    logging: false,
  } : {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'articles_db_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
  }
};
