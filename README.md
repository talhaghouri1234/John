# Forma — MERN Starter Kit

A complete React + Express + Node.js + MongoDB workspace with cookie-based JWT
authentication, admin/user access controls, category CRUD, user administration,
responsive dark mode, and isolated automated tests.

## Quick start

Requires **Node.js 24 LTS**, **npm 11**, Git, and a MongoDB database (Atlas or local).

```sh
git clone https://github.com/theUsamaHub/mern-starter-kit.git
cd mern-starter-kit
npm run install:all
```

1. Copy `server/.env.example` to `server/.env` and fill in the values below.
2. Optionally copy `client/.env.example` to `client/.env`; development defaults work without it.
3. Run `npm run seed` against a dedicated development database.
4. Run `npm run dev` to start both applications.
5. Open **http://localhost:5173**. The API listens on **http://localhost:5000**.

Use `localhost` consistently: CORS and browser-origin checks use
`http://localhost:5173`. Vite proxies `/api` to Express during development.
Run workspace commands from the repository root as shown in this guide.
