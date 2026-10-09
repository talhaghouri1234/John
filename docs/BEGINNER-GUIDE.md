# Start here: your MERN project, explained step by step

This guide assumes you have never set up a full-stack project. Follow sections
1–8 in order for your first run. Later, use the file map and troubleshooting tables
as a reference. All paths are relative to the `mern-starter-kit` folder unless stated.

**Already using the configured project on this computer?** Open `E:\mern-starter-kit`
and start at [Running the app](#7-run-the-frontend-and-backend).
Do not overwrite an existing `.env`, regenerate working secrets, or reseed existing
data just to start the app. The earlier setup already created your local configuration.

## Contents

1. [What the pieces do](#1-what-you-are-running)
2. [Install your tools](#2-install-your-tools)
3. [Open the project and install packages](#3-get-the-project-and-install-its-packages)
4. [Choose a database](#4-set-up-mongodb)
5. [Configure the backend and JWT secrets](#5-configure-the-backend)
6. [Configure the frontend and URLs](#6-configure-the-frontend)
7. [Run both apps](#7-run-the-frontend-and-backend)
8. [Demo accounts and everyday use](#8-create-demo-data-once-and-try-the-app)
9. [How a request travels](#9-follow-one-request-through-the-code)
10. [Folders and files](#10-where-everything-lives)
11. [Make your first changes](#11-how-to-make-changes)
12. [Tests and commands](#12-command-reference)
13. [Common errors](#13-troubleshooting)
14. [Deployment and Git](#14-before-putting-it-online)
15. [Quick reference](#15-your-everyday-checklist)

## 1. What you are running

| Word | Meaning in this project |
| --- | --- |
| Frontend / client | The React screens you see and click in your browser. Files live in `client/`. |
| Backend / server / API | The Express application that checks logins, permissions and data. Files live in `server/`. |
| Node.js | Runs JavaScript on your computer, including the backend and development tools. |
| npm | Installs the project's packages and runs commands defined in `package.json`. |
| MongoDB | Saves users, categories and media metadata so they survive a restart. |
| Mongoose | Helps backend code read/write MongoDB records using defined models. |
| Vite | Runs the frontend development server and builds the frontend for deployment. |
| Port | A number identifying a running service: frontend `5173`, backend `5000`. |
| localhost | Your own computer. These URLs work while your local servers are running. |
| Environment variable | A setting the app reads at startup, such as a database address. |
| `.env` | Your private settings file. It is not uploaded to GitHub. |
| `.env.example` | A shareable list of settings to fill in. It contains no real secrets. |
| Terminal | A window where you type commands. In VS Code use **Terminal → New Terminal**. |

```text
Browser (React, localhost:5173)
  → /api request → Vite development proxy → Express (localhost:5000)
                                         → MongoDB (records)
                                         → server/uploads (file bytes)
```

The browser never connects directly to MongoDB and never needs a JWT signing secret.
You normally run two apps and one database. `npm run dev` starts the two apps together.

## 2. Install your tools

Use Node.js **20.1+**, **22.x**, or **24+**, with npm **9.6.4+**. Keep the npm version bundled with Node.
Get Node from the [official download page](https://nodejs.org/en/download), Git
from [git-scm.com](https://git-scm.com/downloads), and an editor such as VS Code.
For institute computers, early Node 20 is supported. See [Node/npm compatibility](NODE-VERSIONS.md) for commands and exact requirements.
npm is included with Node. You do not need to install React or Express globally.

Close and reopen the terminal after installing. Check:

```powershell
node --version
npm --version
git --version
```

For example, `v20.1.0` with `9.6.4`, or `v24...` with `11...`, and a Git version. If PowerShell blocks `npm.ps1`, use
`npm.cmd` instead of `npm` in the commands below, or use a Command Prompt terminal.
You do not need to disable your computer's execution policy.

Choose either MongoDB Atlas (online database) or a local MongoDB Community server
in section 4. Compass is an optional database viewer; installing Compass alone does
not install or start a database server.

## 3. Get the project and install its packages

For a fresh copy, open a terminal in the parent folder where you want the project:

```powershell
git clone https://github.com/theUsamaHub/mern-starter-kit.git
cd mern-starter-kit
npm run install:all
```

If the project already exists at `E:\mern-starter-kit`, skip cloning:

```powershell
cd E:\mern-starter-kit
npm run install:all
```

This folder is the **repository root**. It contains `package.json`, `client`, and
`server`. Commands in this guide run from here unless a different location is shown.
Do not run `npm create vite`, `npm init`, or create another Express app: both apps
already exist. One install command installs the root and both npm workspaces.

`node_modules/` contains downloaded packages. Do not edit it or commit it.
`package-lock.json` records exact package versions and should stay in Git.

## 4. Set up MongoDB

### Option A: Atlas

Atlas hosts MongoDB for you. In your Atlas project:

1. Create or select a cluster suitable for development.
2. Create a **database user** with read/write access to your development database.
   This is different from the account you use to sign in to the Atlas website.
3. Add your current public IP to the project's network/IP access list. If your
   network changes, you may need to update this entry.
4. Choose the cluster's **Connect → Drivers** flow for Node.js and copy its URI.
5. Replace username/password placeholders locally and include a database name such
   as `mern_starter_dev` after the hostname's `/`, before any `?` options.

The shape is:

```dotenv
MONGO_URI=mongodb+srv://YOUR_DB_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER_HOST/mern_starter_dev?retryWrites=true&w=majority
```

This line is a template, not a working database. Use the exact host and options
provided by Atlas. Special characters in the password must be URL-encoded: for
example `@` becomes `%40` and `#` becomes `%23`. Encode only the credential component,
not the whole URI. Never paste a real password into an online encoding website.

Save the finished URI only in `server/.env`. Do not post it in screenshots, chat,
or GitHub. See [Atlas connection instructions](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
if the labels in Atlas have changed.

### Option B: local MongoDB

Install MongoDB Community Server for your operating system and start its service.
For a local development server with no authentication configured:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/mern_starter_dev
```

`27017` is the usual MongoDB port. This URI works only if a MongoDB server is actually
running there. If you enabled database authentication, use its appropriate authenticated
connection string instead. Do not expose an unauthenticated local database to the internet.

The app creates collections when it first writes data. You do not have to manually
create Users or Categories tables. MongoDB calls them **collections**.

## 5. Configure the backend

### Create the settings file safely

On Windows PowerShell, from the repository root:

```powershell
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
if (-not (Test-Path client/.env)) { Copy-Item client/.env.example client/.env }
```

On macOS/Linux, the equivalent is:

```sh
test -f server/.env || cp server/.env.example server/.env
test -f client/.env || cp client/.env.example client/.env
```

Open `server/.env` in the editor. Make sure its filename is exactly `.env`, not
`.env.txt`, and that it is inside `server/`, not `server/src/` or the root.

### Generate the two JWT secrets

A JWT is a signed login token. The backend uses a secret to check that the token
was issued by your app. A secret is **not** your MongoDB password, login password,
email address, or a token copied from a website.

Run this command **twice**, once for each key:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Each run prints a different random 96-character string. Copy the first result
after `JWT_ACCESS_SECRET=` and the second after `JWT_REFRESH_SECRET=`. Do not
include surrounding terminal text or line breaks. Generate these on your own
computer; no external key-generator website is needed.

Keep the two values different. The backend requires at least 32 characters each.
Generate them once per environment and keep them stable across ordinary restarts.
Changing a secret invalidates tokens signed with that secret, so users may need
to sign in again. Use separate new secrets for a real production deployment.

### Your complete backend settings

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=REPLACE_WITH_YOUR_DATABASE_URI
JWT_ACCESS_SECRET=REPLACE_WITH_FIRST_GENERATED_SECRET
JWT_REFRESH_SECRET=REPLACE_WITH_SECOND_GENERATED_SECRET
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:5173
MEDIA_UPLOAD_DIR=
```

Replace the three `REPLACE_...` values before starting. Leave the other values
as shown for the first local run. Do not copy this template over working settings.

| Setting | What it means | What to enter locally |
| --- | --- | --- |
| `PORT` | The backend's HTTP port | `5000` |
| `NODE_ENV` | How the backend is running | `development`; do not use `production` for this HTTP setup |
| `MONGO_URI` | Where MongoDB is and how to log in | The URI from section 4 |
| `JWT_ACCESS_SECRET` | Signs/checks the short-lived login token | First independently generated secret |
| `JWT_REFRESH_SECRET` | Signs/checks the token used to renew login | Second independently generated secret |
| `JWT_ACCESS_EXPIRES` | How long an access token lasts | `15m` means 15 minutes |
| `JWT_REFRESH_EXPIRES` | How long a refresh token lasts | `7d` means 7 days |
| `CLIENT_URL` | The exact frontend origin permitted to call the API | `http://localhost:5173`, no `/login`, `/api`, or trailing slash |
| `MEDIA_UPLOAD_DIR` | Optional private folder for uploaded file bytes | Leave blank for `server/uploads/`; otherwise use an absolute path such as `E:/mern-data/uploads` |

Expiry values use a whole number followed by `s`, `m`, `h` or `d` (seconds,
minutes, hours, days). Use the defaults until you have a reason to change them.

Restart the backend after `.env` changes: stop it with Ctrl+C and start again.
The startup validator reports variable **names**, not their secret values.

## 6. Configure the frontend

Open `client/.env`. Its complete normal local configuration is:

```dotenv
VITE_API_URL=/api
```

That is all the frontend needs. It is also the default if this file is absent.
Do not put `MONGO_URI`, JWT secrets, database passwords, or R2 access keys here.
Vite includes `VITE_` variables in browser code; they are public settings, as the
[Vite environment guide](https://vite.dev/guide/env-and-mode) explains.

### CLIENT_URL versus VITE_API_URL

| Variable | File | Answers this question |
| --- | --- | --- |
| `CLIENT_URL` | `server/.env` | Which frontend website is allowed to make browser requests? |
| `VITE_API_URL` | `client/.env` | Where should the frontend send API requests? |

With the default `/api`, a frontend request to `/api/categories` goes to Vite on
port 5173. `client/vite.config.js` forwards it to the backend on port 5000. This
forwarder is the development **proxy**. Leave it alone for your first run.

An explicit direct-backend option is `VITE_API_URL=http://localhost:5000/api`.
It requires the backend to allow the actual frontend origin and uses credentialed
cross-origin requests. The existing Axios client already sets `withCredentials`.
Use the simpler `/api` default unless your environment needs a separate API host.

Open `http://localhost:5173` consistently. `http://127.0.0.1:5173` is a different
origin even on the same machine, so it will not match the default `CLIENT_URL`.

If you change the frontend port, change `server.port` in `client/vite.config.js`
and `CLIENT_URL` in `server/.env` to match. If you change the backend port, change
`PORT` and the `/api` proxy target in `client/vite.config.js`. Restart both apps.

## 7. Run the frontend and backend

From the repository root:

```powershell
npm run dev
```

Leave this terminal running. Look for Vite's local URL and `API listening on port
5000`. The API only starts listening after MongoDB connects successfully.

Open these in your browser:

| URL | Expected result |
| --- | --- |
| `http://localhost:5173` | Forma landing page |
| `http://localhost:5173/login` | Login screen |
| `http://localhost:5000/api/health` | JSON containing `success: true` and `API is healthy` |

The health response checks that the HTTP service responds; it is not an ongoing
database-readiness guarantee. Port 5000 serves JSON/API responses, not the React UI.

If you prefer separate terminals, run these **instead of** the combined command:

```powershell
# Terminal 1, repository root
npm run dev --workspace server
```

```powershell
# Terminal 2, repository root
npm run dev --workspace client
```

Do not run both approaches at the same time: they compete for the same ports.
To stop, focus the terminal and press Ctrl+C. To start tomorrow, return to the root
and run `npm run dev` again. You do not need to install, regenerate keys or seed daily.

## 8. Create demo data once and try the app

Seeding means putting example records into your database. For a **new, dedicated
development database**, run this from the root in another terminal:

```powershell
npm run seed
```

**This deletes all existing users and categories in the database named by your
current `MONGO_URI`, then creates the examples.** Do not run it against data you
want to keep. `npm run seed:destroy` only deletes those users/categories. Neither
command clears media. Both refuse to run with `NODE_ENV=production`.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin@123` |
| User | `user1@example.com` | `User@123` |
| User | `user2@example.com` | `User@123` |

Passwords are case-sensitive. These public demo passwords are for learning only.
Registration creates a normal user. An existing admin can promote another account
from **Team members**; a frontend-only role change cannot bypass backend checks.

Try these steps:

1. Sign in as admin. You should reach `/admin/dashboard`.
2. Open **Categories**, add a category, edit it, and try searching for it.
3. Open **Media library**, select an image, MP4/WebM video, or supported document,
   then choose **Upload file**. The limit is one file up to 25 MiB.
4. Sign out and sign in as `user1@example.com`. You should reach `/user/dashboard`.
5. View categories and shared media. Users can download files but cannot manage them.
6. Open **My profile** to see the signed-in user's information.

Uploads go to `server/uploads/`; MongoDB stores their names, type, size, owner and
storage key. The folder is created on first upload and is excluded from Git.
Do not manually rename files there: their names connect them to database metadata.
R2 is optional and is not needed locally. Read [Media storage](media-storage.md)
for the supported formats, API and the R2 extension point.

## 9. Follow one request through the code

For a category list:

```text
BrowseCategories.jsx (screen)
  → useCategories.js (load/cache state)
  → category.api.js (API function)
  → axios.js (base URL, cookies, refresh)
  → Express app.js → routes/index.js → routes/category.js
  → auth.js middleware (signed in?) → validation (valid query?)
  → controllers/category.js (read records)
  → models/Category.js → MongoDB
  → JSON response → category cards on the screen
```

A **route** chooses which operation handles a URL. **Middleware** checks the request
before that operation. A **controller** performs the operation. A **model** describes
and accesses saved data. A **component** draws part of the frontend.

For login, the backend checks a password hash and sets two httpOnly cookies.
The browser sends these cookies automatically; JavaScript does not read their values.
The frontend asks `/auth/me` who is signed in. When an access token expires, the
Axios interceptor tries `/auth/refresh` and retries the request once. Each account
has one current refresh session, so another login replaces it. Logout clears browser
cookies and revokes that refresh session. A copied access token can remain valid
until expiry unless the account is disabled/deleted.

## 10. Where everything lives

### Root and configuration

```text
mern-starter-kit/
├── client/              React frontend
├── server/              Express backend
├── docs/                Reference guides
├── package.json         Combined commands and workspace definitions
├── package-lock.json    Exact dependency versions
├── .gitignore           Files Git must leave out
└── README.md            Shorter setup, API and development reference
```

| File | Responsibility |
| --- | --- |
| `package.json` | Runs both workspaces; defines required Node version and dependency override. |
| `package-lock.json` | Makes dependency installations repeatable. Let npm update it. |
| `.gitignore` | Excludes secrets, installed packages, builds, coverage and local uploads. |
| `README.md` | Main project introduction, API table and extension instructions. |
| `docs/BEGINNER-GUIDE.md` | This step-by-step reference. |
| `docs/media-storage.md` | Upload behavior, storage contract and R2 migration notes. |
| `server/package.json` | Backend dependencies and start/test/seed commands. |
| `server/.env.example` | Safe backend settings template; copy to private `.env`. |
| `server/nodemon.json` | Restarts development backend on source changes, not uploads. |
| `server/eslint.config.js`, `server/.prettierrc.json` | Backend code checks and formatting. |
| `server/jest.config.js` | Backend test runner setup and coverage settings. |
| `client/package.json` | Frontend dependencies and dev/build/test commands. |
| `client/.env.example` | Public frontend API path template. |
| `client/index.html` | HTML document Vite uses to mount React. |
| `client/vite.config.js` | React/Tailwind plugins, dev port/proxy, build chunks and Vitest settings. |
| `client/eslint.config.js`, `client/.prettierrc.json` | Frontend code checks and formatting. |

### Backend files — paths below start with `server/src/`

| File | What it does |
| --- | --- |
| `server.js` | Connects MongoDB, starts HTTP listening, handles shutdown. |
| `app.js` | Builds Express app, installs security/parsing middleware and routes. Tests import this without starting a real app server. |
| `config/env.js` | Loads `.env` and validates required settings without printing secrets. |
| `config/db.js` | Opens the Mongoose database connection. |
| `models/User.js` | User fields, password hashing, role, activity and refresh-token hash. |
| `models/Category.js` | Category fields, owner, activity, unique slug generation. |
| `models/Media.js` | Media metadata; actual file bytes live in storage. |
| `controllers/auth.js` | Register, login, rotate refresh token, logout, current user. |
| `controllers/category.js` | List/search/page, create, edit and delete categories. |
| `controllers/user.js` | Admin list, role/status changes and deletion of users. |
| `controllers/media.js` | List, validate/store upload, serve file, delete file and metadata. |
| `routes/index.js` | Mounts auth, users, categories, media and health endpoints under `/api`. |
| `routes/auth.js` | Auth URL handlers, validation and rate limits. |
| `routes/category.js` | Category URLs, with admin-only writes. |
| `routes/user.js` | Admin-only user management URLs. |
| `routes/media.js` | Media URLs, query validation, authentication and upload limits. |
| `middleware/auth.js` | Verifies access cookie and reloads the active user. |
| `middleware/role.js` | Checks whether the current role is allowed. |
| `middleware/validate.js` | Checks request body/query/params against a Zod schema. |
| `middleware/upload.js` | Parses one multipart file, limits size and checks detected type. |
| `middleware/notFound.js` | Handles API URLs that do not exist. |
| `middleware/error.js` | Converts errors into consistent JSON, hiding internal details. |
| `validators/auth.js` | Rules for registration and login fields. |
| `validators/category.js` | Rules for category fields, IDs and list queries. |
| `validators/user.js` | Rules for admin user operations and list queries. |
| `utils/generateToken.js` | Signs/verifies JWTs, hashes refresh tokens, sets/clears cookies. |
| `utils/ApiError.js` | Error class carrying an HTTP status and optional field errors. |
| `utils/asyncHandler.js` | Forwards async controller errors to the error middleware. |
| `utils/escapeRegex.js` | Makes search text literal rather than a user-supplied regex. |
| `storage/local.js` | Writes generated filenames, serves private files with range support, deletes files. |
| `storage/index.js` | Chooses storage adapter/provider; extension point for R2. |
| `seed/seed.js` | Runs the destructive demo-data reset or destroy command. |
| `seed/options.js` | Parses seed options and rejects production execution. |
| `seed/users.js` | Demo account definitions. |
| `seed/categories.js` | Ten example category definitions. |

### Frontend files — paths below start with `client/src/`

| File | What it does |
| --- | --- |
| `main.jsx` | Mounts React into the HTML page. |
| `App.jsx` | Connects providers, routing, notifications and smooth scrolling. |
| `styles.css` | Tailwind import, colors, light/dark themes, layouts and responsive styles. |
| `api/axios.js` | Shared API URL, cookie sending, refresh/retry behavior and friendly errors. |
| `api/queryClient.js` | Shared React Query cache settings. |
| `api/auth.api.js` | Functions calling auth endpoints. |
| `api/category.api.js` | Functions calling category endpoints. |
| `api/user.api.js` | Functions calling admin user endpoints. |
| `api/media.api.js` | List/upload/download/delete calls and upload progress handling. |
| `context/AuthContext.jsx` | Current user, initial session loading, login/register/logout and cache cleanup. |
| `hooks/useAuth.js` | Lets components read the auth context. |
| `hooks/useCategories.js` | Fetches categories and invalidates cached lists after mutations. |
| `routes/AppRoutes.jsx` | Maps browser URLs to lazy-loaded pages. |
| `routes/ProtectedRoute.jsx` | Redirects signed-out visitors to login. |
| `routes/RoleRoute.jsx` | Shows only pages for the required role. Backend still enforces permissions. |
| `layouts/PublicLayout.jsx` | Shared public-page navigation/footer. |
| `layouts/AdminLayout.jsx` | Shared admin sidebar/header/layout. |
| `layouts/UserLayout.jsx` | Shared user sidebar/header/layout. |
| `utils/auth.js` | Chooses the dashboard path for a role. |
| `pages/public/Home.jsx` | Landing page assembled from hero and feature sections. |
| `pages/public/Login.jsx`, `Register.jsx` | Render the shared auth form in the appropriate mode. |
| `pages/public/Unauthorized.jsx`, `NotFound.jsx` | Permission-denied and missing-page screens. |
| `pages/admin/AdminDashboard.jsx` | Admin stats, recent categories and shared media. |
| `pages/admin/ManageCategories.jsx` | Category search/filter and create/edit/delete flows. |
| `pages/admin/ManageUsers.jsx` | Team list and role/activity changes. |
| `pages/admin/ManageMedia.jsx` | Admin media page with upload and deletion controls. |
| `pages/user/UserDashboard.jsx` | User welcome, categories and recent media. |
| `pages/user/BrowseCategories.jsx` | Search/sort/page through categories. |
| `pages/user/BrowseMedia.jsx` | Read-only media library. |
| `pages/user/Profile.jsx` | Read-only current account information. |

### Reusable frontend pieces — `client/src/components/`

| File | Used for |
| --- | --- |
| `AuthForm.jsx` | Login/register inputs, validation, errors and submission. |
| `CategoryForm.jsx` | Validated category editor. |
| `CategoryTable.jsx` | Admin category rows and optional actions/pagination. |
| `CategoryCard.jsx` | Category tiles in user views. |
| `MediaUpload.jsx` | File selection, size check, progress and upload submission. |
| `MediaLibrary.jsx` | Shared media loading/search/filter/pagination and admin confirmation. |
| `MediaCard.jsx` | Image/video previews, document cards and downloads; releases temporary blob URLs. |
| `Modal.jsx` | Reusable native dialog with focus handling and animation. |
| `Pagination.jsx` | Previous/next page controls. |
| `Loader.jsx` | Loading message/skeletons. |
| `ErrorState.jsx` | Error feedback and retry. |
| `Navbar.jsx` | Public navigation. |
| `Sidebar.jsx` | Admin/user navigation and sign-out control. |
| `Hero.jsx` | Landing-page headline and hero artwork. |
| `LandingSections.jsx` | Landing features and calls to action. |
| `ThemeToggle.jsx` | Light/dark switch and saved preference. |
| `PageTransition.jsx` | Motion when changing pages. |
| `ScrollReveal.jsx` | Reveals sections when they enter view. |

### Test files

| Location | What is checked |
| --- | --- |
| `server/tests/env.js` | Isolated test environment values and MongoDB binary selection. |
| `server/tests/setup.js` | Starts a temporary database, clears it between tests, shuts down. |
| `server/tests/helpers.js` | Creates test accounts and authenticated sessions. |
| `server/tests/setup.test.js` | App/configuration smoke checks. |
| `server/tests/auth.test.js` | Registration/login and invalid input. |
| `server/tests/session.test.js` | Refresh/logout and protected sessions. |
| `server/tests/role.test.js` | Role and admin access restrictions. |
| `server/tests/category.test.js` | Category create/edit/delete rules. |
| `server/tests/category-list.test.js` | Search, sorting, filters and pagination. |
| `server/tests/seed.test.js` | Seed fixtures/options and safety rules. |
| `server/tests/media.test.js` | Upload permissions/type/size, private reads, deletion and failure cleanup. |
| `client/src/tests/setup.js`, `server.js` | DOM helpers and mocked HTTP setup (this `server.js` is a test mock, not Express). |
| `client/src/tests/Login.test.jsx` | Auth form and role redirects. |
| `client/src/tests/Routes.test.jsx` | Protected and role-only frontend routes. |
| `client/src/tests/CategoryForm.test.jsx` | Category form validation and edits. |
| `client/src/tests/CategoryTable.test.jsx` | Rows and table actions. |
| `client/src/tests/refresh.test.js` | Shared token refresh and expired-session behavior. |
| `client/src/tests/Media.test.jsx` | Upload validation, role controls, delete confirmation and preview cleanup. |

`.gitkeep` files only keep otherwise-empty folders in Git; they run no code.
Generated `node_modules`, `dist`, `.vite`, `coverage` and `uploads` folders are not
source code you need to edit. Private `.env` files are deliberately absent on a fresh clone.

## 11. How to make changes

| I want to… | Start here |
| --- | --- |
| Change landing-page text | `Hero.jsx` and `LandingSections.jsx` |
| Change colors/layout | `client/src/styles.css` |
| Add a menu item/page | A page component, `AppRoutes.jsx`, and `Sidebar.jsx` or `Navbar.jsx` |
| Add a database field | Model, backend validator/controller, frontend form/display and tests |
| Change auth permissions | Backend route middleware first, then frontend route/menu visibility |
| Change file storage | `server/src/storage/index.js` and an adapter following `docs/media-storage.md` |
| Change an API address | `client/.env` and, for proxy development, `client/vite.config.js` |

For a first harmless change, edit the welcome wording in `Hero.jsx`, save, and
watch the browser update. Then run `npm run lint` and `npm run build`.

To add a resource such as Projects, follow the existing Category pattern: model →
validation → controller → backend route → API client → query hook → page/form →
frontend route/navigation → tests. The README has a longer resource-extension guide.
Changing only the frontend does not create a database/API feature.

## 12. Command reference

Run from the root; `--workspace server` means run that package's command in `server/`.

| Command | When to use it |
| --- | --- |
| `npm run install:all` | First setup or after dependency changes. |
| `npm ci` | Clean reproducible install using the lockfile; replaces installed packages. |
| `npm run dev` | Everyday development: both apps together. |
| `npm run dev --workspace server` | Backend alone with automatic source restarts. |
| `npm run dev --workspace client` | Frontend alone. |
| `npm run seed` | Explicitly reset a disposable development database's users/categories. |
| `npm run seed:destroy` | Explicitly delete users/categories without recreating them. |
| `npm test` | Run backend and frontend tests once. |
| `npm run test --workspace server` | Backend tests only. |
| `npm run test --workspace client` | Frontend tests only. |
| `npm run test:coverage` | Tests plus reports in each workspace's `coverage/`. |
| `npm run test:watch --workspace server` | Re-run backend tests as you edit. |
| `npm run test:watch --workspace client` | Re-run frontend tests as you edit. |
| `npm run lint` | Check code quality; not the same as running tests. |
| `npm run build` | Create production frontend files in `client/dist`. |
| `npm run start --workspace server` | Run backend without Nodemon; environment still determines production mode. |
| `npm audit --omit=dev` | Check production dependency advisories. |
| `git status --short` | Inspect changed/untracked files before committing. |

Tests use a disposable MongoDB process and temporary media folder, not your Atlas
data. The first backend test run may download a large MongoDB binary; wait for it.
Frontend tests mock HTTP, so they do not need a running API. Tests and a successful
build are useful checks, but still try your feature in the browser.

Vite's `preview` command previews a built frontend; it is not a production server.
Its default port differs from `CLIENT_URL`, so a full login demo needs matching
origin/proxy settings. Use `npm run dev` for the normal local workflow.

## 13. Troubleshooting

| Symptom | What to check |
| --- | --- |
| `node`/`npm` not recognized | Install a compatible Node version (20.1+, 22.x or 24+) and reopen the terminal. |
| `npm.ps1 cannot be loaded` | Run `npm.cmd ...` or switch the terminal to Command Prompt. |
| `package.json` not found | Run `cd E:\mern-starter-kit` (or your own clone path) first. |
| `Invalid environment: ...` | Open `server/.env`; fill the named variable, remove placeholder text and restart. |
| `JWT secrets must be different` | Generate two separate random values; do not reuse one for both settings. |
| Database connection failed | Check MongoDB is running, URI database/credentials, Atlas IP list, network and password encoding. |
| Login page opens but requests fail | Frontend can run while API is down; check backend startup and `/api/health`. |
| API port 5000 returns 404 at `/` | Try `/api/health`. React is served on port 5173. |
| `Origin not allowed` | Browser origin must exactly match `CLIENT_URL`; use `localhost`, not `127.0.0.1`. |
| Port already in use | Stop the previous dev terminal with Ctrl+C; do not launch duplicate servers. |
| Demo credentials fail | Check spelling/case and whether this exact database was seeded; do not reset valuable data just to fix a login. |
| Cookies/login fail after setting production | Production cookies require HTTPS. Use `NODE_ENV=development` for local HTTP. |
| Blank page after switching branches/installing | Stop/restart both dev processes and reload; inspect browser console and terminal errors. |
| Changed `.env` has no effect | Restart the relevant app. Frontend production env changes require a new build. |
| Upload returns 413 | Choose a file no larger than 25 MiB. |
| Upload returns 415 | Use an allowed format with matching bytes; renaming an `.exe` to `.png` does not convert it. |
| Upload returns 429 | Wait one minute; uploads are limited per admin. |
| Video fails to play | Its container may be accepted but codec unsupported by that browser; try a compatible MP4/WebM. |
| Media metadata exists but file is missing | Restore the upload volume backup; a database backup alone does not include files. |
| Backend tests initially take a long time | Allow the MongoDB download or set `MONGOMS_SYSTEM_BINARY` to an installed compatible `mongod`. |
| Tests cannot open sockets/temp files | Run in an environment permitting local processes and loopback connections. |

Do not post your `.env` when asking for help. Share the error message and variable
names with values removed. If a secret was committed, changing/removing the file is
not enough: rotate the exposed credential and address the Git history separately.

## 14. Before putting it online

Local setup and deployment are different tasks. The simplest deployment serves
React and `/api` behind **one HTTPS origin**:

```text
https://your-domain.example       → client/dist with SPA fallback to index.html
https://your-domain.example/api   → running Express server
```

Build with `VITE_API_URL=/api`; set backend `CLIENT_URL=https://your-domain.example`
and `NODE_ENV=production`. Your hosting reverse proxy must forward `/api`, and
the static host must return `index.html` for React routes like `/user/media`.
Express in this starter does not automatically serve `client/dist`.

Set fresh server secrets and a production database through the host's private
environment settings. Never deploy public demo accounts. Do not run the demo seed
against production. Uploads need a persistent private volume or an implemented R2
adapter; temporary hosting disks may disappear after a restart/deployment.
Keep database and file backups. Multi-instance hosting also needs shared storage,
shared rate limiting and appropriately configured proxy trust.

Different frontend/backend sites are supported with production `SameSite=None; Secure`
cookies, exact trusted origins and a custom CSRF header. Local development keeps Lax.
Browsers blocking third-party cookies remain a limitation of direct cross-site
authentication. Read [the problem and fix](CROSS-SITE-AUTH.md) for exact settings
and the optional first-party proxy fallback.

### Save your code with Git

Git stores code changes; GitHub hosts that history. Neither is a backup of your
local `.env`, database or uploaded files. For a new change, start from an up-to-date
`develop` branch and make a focused branch:

```powershell
git status --short
git checkout develop
git pull --ff-only origin develop
git checkout -b feature/my-small-change
# Edit files, then run the relevant tests and lint.
git add path/to/the/file-you-edited
git diff --cached
git commit -m "feat: describe the change"
git push -u origin feature/my-small-change
```

`path/to/...` is a placeholder: replace it with the file you actually changed.
Inspect the staged diff before committing. Do not use force-push to fix a rejected
push; inspect the error first. In this repository, completed modules merge into
`develop` with `--no-ff`; `main` receives completed releases. Existing release tags
are kept intact. See the README and project workflow before making release merges.

## 15. Your everyday checklist

**First setup:** Node/Git → clone → install → choose MongoDB → private backend
settings → two JWT secrets → frontend `/api` → optional demo seed → run.

**Normal day:** open the root folder → `npm run dev` → open `http://localhost:5173`.

**Before pushing code:** run relevant tests + lint + build → inspect `git diff`
and `git status` → commit source files → push your branch.

**Remember:** keep database credentials and JWT secrets in `server/.env`, leave
frontend `VITE_API_URL=/api` for normal local development, and do not reseed or
regenerate keys every time you run the app.
