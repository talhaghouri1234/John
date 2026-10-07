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

## Commands and tests

| Command from root | Purpose |
| --- | --- |
| `npm run install:all` | Install both workspaces and root tooling |
| `npm run dev` | Run Express and Vite together; Ctrl+C stops both |
| `npm run seed` / `npm run seed:destroy` | Reset demo data / clear data |
| `npm test` | Run backend and frontend test suites |
| `npm run test:coverage` | Run both coverage reports |
| `npm run lint` | Lint both applications |
| `npm run build` | Build the client into `client/dist` |
| `npm run start --workspace server` | Start the API without Nodemon |
| `npm run test:watch --workspace server` | Watch backend tests |
| `npm run test:watch --workspace client` | Watch frontend tests |

Backend tests use Jest, Supertest, and `mongodb-memory-server`. The test environment
overrides `MONGO_URI` before importing the app and only connects to a disposable
MongoDB instance. It never uses Atlas or an existing database service. On Windows,
tests reuse an installed `mongod` binary automatically. Otherwise, the first run
downloads one; allow time and network access. Set `MONGOMS_SYSTEM_BINARY` to use a
compatible executable explicitly. Each suite uses a fresh temporary data directory.

Frontend tests use Vitest, React Testing Library, jsdom, and MSW. They cover login
validation and redirects for both roles, route guards, category forms/tables, and
refresh concurrency. HTTP requests are mocked. Coverage reports are written under
each workspace's ignored `coverage/` directory. Tests cover behavior rather than
claiming exhaustive coverage of every presentation component.

Both workspaces include ESLint and Prettier configuration. Format files with
`npx prettier --write <path>` from the appropriate workspace.

## API reference

All routes are under `/api`. Authentication uses `accessToken` and `refreshToken`
httpOnly cookies; send credentials with requests. Errors use
`{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }`;
`errors` is included for input-validation errors. Successful responses include
`success`, `message`, and the payload described below.

| Method | Endpoint | Access | Body / result |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health message |
| POST | `/auth/register` | Public | `{name,email,password}`; returns `user` |
| POST | `/auth/login` | Public | `{email,password}`; returns `user` |
| POST | `/auth/refresh` | Refresh cookie | Rotates cookies; returns `user` |
| POST | `/auth/logout` | Public | Revokes matching refresh token and clears cookies |
| GET | `/auth/me` | Authenticated | Current `user` |
| GET | `/categories` | Authenticated | `categories`, `pagination` |
| POST | `/categories` | Admin | `{name,description?,image?,isActive?}`; returns `category` |
| PUT | `/categories/:id` | Admin | One or more editable category fields; returns `category` |
| DELETE | `/categories/:id` | Admin | Deletes category |
| GET | `/users` | Admin | `users`, `pagination` |
| PATCH | `/users/:id/role` | Admin | `{role:"admin"\|"user"}` |
| PATCH | `/users/:id/active` | Admin | `{isActive:boolean}` |
| DELETE | `/users/:id` | Admin | Deletes user |

Category lists accept `page` (default 1), `limit` (default 10, maximum 100),
`search` (literal case-insensitive name search), `sort` (`name`, `-name`,
`createdAt`, `-createdAt`; default `-createdAt`), and `isActive` (`true` or `false`).
User lists accept `page`, `limit`, and a name/email `search`. Pagination is
`{page,limit,total,pages}`. An empty result has `total:0` and `pages:0`.

Registration always creates a user; extra fields such as `role` are rejected.
Administrators can promote another user but cannot change their own access or
delete themselves. Category slugs update when names change. Passwords and refresh
token hashes are never serialized in API responses.
