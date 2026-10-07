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

## Environment configuration

Keep actual values in the ignored `server/.env`; never place credentials in
`.env.example`, source code, or Git. The server validates configuration before starting.

| Variable | Purpose / development value |
| --- | --- |
| `PORT` | API port, `5000` |
| `NODE_ENV` | `development`, `test`, or `production` |
| `MONGO_URI` | Your MongoDB URI, including the intended database name |
| `JWT_ACCESS_SECRET` | Random secret of at least 32 characters |
| `JWT_REFRESH_SECRET` | A different random secret of at least 32 characters |
| `JWT_ACCESS_EXPIRES` | Access lifetime, `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh lifetime, `7d` |
| `CLIENT_URL` | Browser origin, `http://localhost:5173` |
| `VITE_API_URL` | Client API path, `/api`; client-side values are public |

Generate each JWT secret independently with:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64'))"
```

In Atlas, create a database user, allow your development machine in Network Access,
and copy the driver connection string. URL-encode special characters in its password.
Include a database name in the URI so seeding targets the intended database.
Restart the API after changing environment variables.

## Seed data and demo accounts

`npm run seed` **deletes every user and category in the configured database**, then
creates these accounts and ten categories owned by the admin. Use a dedicated
development database. `npm run seed:destroy` only clears users and categories.
Both commands refuse to run with `NODE_ENV=production`.

| Role | Email | Demo password | Dashboard |
| --- | --- | --- | --- |
| Admin | admin@example.com | Admin@123 | `/admin/dashboard` |
| User | user1@example.com | User@123 | `/user/dashboard` |
| User | user2@example.com | User@123 | `/user/dashboard` |

These credentials are public demo fixtures. Do not use them for production accounts.
The seed creates Electronics, Fashion, Books, Home, Sports, Toys, Beauty, Grocery,
Automotive, and Health. It prints account credentials after successful creation.
