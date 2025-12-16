# Backend Setup 

Prerequisites:

1) Install dependencies:

2) Create a Postgres database (example):

3) Set environment variables (optional — defaults used if not set):

Prerequisites:
- Node.js and npm
- PostgreSQL server running locally

1) Install dependencies:
cd backend
npm install

2) Create a Postgres database (example):
psql -U postgres -c "CREATE DATABASE articles_db;"

3) Set environment variables (optional — defaults used if not set):
$env:DB_USER='postgres'
$env:DB_PASS='postgres'
$env:DB_NAME='articles_db'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='5432'

4) Run migrations:
cd backend
npm run migrate

5) Start the server
npm start

6) Smoke test comment CRUD (after DB is running and migrations applied)
```powershell
cd backend
npm run test-comments
```

Note: If you don't have a local Postgres, the server will start but endpoints that rely on the DB will return errors; run migrations and ensure Postgres is reachable to fully exercise CRUD flows.

