# MERN Starter Kit

A React, Express, Node.js, and MongoDB monorepo with cookie-based authentication,
role-based access, and category management.

## Development

This project is being built module by module on `develop`. Feature branches are
tested and linted before merging. `main` receives the completed release.

Requires Node.js 24 LTS and npm 11. Setup and API documentation will be added
alongside the corresponding modules.

Local environment files and dependencies are excluded from version control.

## Folder structure

```text
mern-starter-kit/
  package.json          npm workspaces and combined commands
  server/
    src/                Express API, database configuration, models and middleware
    tests/              API integration tests using an isolated MongoDB instance
  client/
    src/                React application, pages, layouts, components and hooks
    index.html          Vite HTML entry
```

Run `npm run install:all` from the repository root to install both workspaces.
`npm run lint` checks both applications; `npm run build` builds the React client.

## Dependency audit

On 2026-10-06, `npm audit --omit=dev` reported zero vulnerabilities. The full
audit reports upstream issues in the requested Jest and Nodemon tooling
(`sprintf-js` and `braces`). npm's suggested major downgrades are not applied.
Recheck with `npm audit` when updating dependencies. Development tools should
only run in a trusted development environment.

## User administration

All `/api/users` routes require an active admin session. List users with `GET /`
and `page`, `limit`, and `search` query parameters. Use `PATCH /:id/role` with
`{ "role": "admin" }` or `{ "role": "user" }`, `PATCH /:id/active` with
`{ "isActive": false }`, and `DELETE /:id`. Administrators cannot modify their
own access or delete themselves. Public registration only accepts user accounts.

## Seed data

Run `npm run seed` from the root. This **deletes all existing users and categories**
in the database selected by `server/.env`, then inserts three accounts and ten
categories. `npm run seed:destroy` only deletes those collections' documents.
These commands are disabled when `NODE_ENV=production`.

| Role | Email | Demo password |
| --- | --- | --- |
| Admin | admin@example.com | Admin@123 |
| User | user1@example.com | User@123 |
| User | user2@example.com | User@123 |

These are public demonstration credentials, not production accounts.
