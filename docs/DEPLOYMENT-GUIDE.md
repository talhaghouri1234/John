# Deployment guide: combined and separate MERN projects

Written for this starter kit on 9 October 2026. All commands below are instructions for you to run later. Creating this guide does not deploy anything, modify production data, or run tests.

## 1. What deployment means

Deployment makes the application available on the internet without your laptop running.

You need three services plus somewhere to keep uploads:

| Part | What it does | Where it runs in this guide |
| --- | --- | --- |
| React client | Displays pages in the visitor's browser | Render Static Site |
| Express server | Handles login, permissions, categories and media | Render Node Web Service |
| MongoDB | Stores users, categories and media metadata | MongoDB Atlas |
| Upload directory | Stores actual image, video and document bytes | Persistent disk attached to the backend |

The combined repository still produces two deployed applications. Keeping client and server in one Git repository does not require them to run on one computer.

```text
Visitor opens https://app.yourdomain.com
                   |
                   | browser sends HTTPS requests + login cookies
                   v
          https://api.yourdomain.com/api
                   |
                   +--> MongoDB Atlas: records and permissions
                   +--> persistent disk: uploaded file bytes
```

The custom-domain examples below are optional. You can instead use your existing Vercel/Netlify frontend URL and Render backend URL with the cross-site settings in section 3. Example addresses are placeholders.

## 2. Choose the correct project layout

### A. Combined repository

Local folder: `E:\mern-starter-kit`

```text
mern-starter-kit/
  package.json           workspace configuration
  package-lock.json      shared dependency lockfile
  client/
    package.json
    src/
  server/
    package.json
    src/
```

Repository: https://github.com/theUsamaHub/mern-starter-kit

Both hosting services connect to this same repository and its `main` branch. Leave their hosting Root Directory empty, because the package-lock.json and workspace configuration are at the repository root. Do not use the standalone commands for this layout. [Render monorepo guidance](https://render.com/docs/monorepo-support).

### B. Separate client and server projects

Local folders: `E:\client` and `E:\server`

Each has its own package.json, package-lock.json, .npmrc and .nvmrc. The local copies do not automatically become separate GitHub repositories. Publish each to its own repository if you want to deploy them independently from Git.

Before uploading, confirm these are excluded by .gitignore: `.env`, `.env.*` except `.env.example`, `node_modules/`, `uploads/`, `coverage/` and `dist/`. Commit package-lock.json and .env.example. Do not upload your private .env or uploaded files through Git.

For each NEW repository, create an empty GitHub repository first, without an initial README. Example PowerShell commands for the client:

```powershell
cd E:\client
git init -b main
git add .
git status
# Review the staged file list before continuing. No secrets or uploads should appear.
git commit -m "chore: initialize standalone client"
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-CLIENT-REPO.git
git push -u origin main
```

Repeat from `E:\server`, using a different repository URL and server commit message. If Git is already initialized or `origin` already exists, inspect `git status` and `git remote -v` instead of repeating initialization or overwriting the remote. Replace all uppercase placeholders before running commands.

The frontend hosting service connects to the client repository. The backend service connects to the server repository. Leave Root Directory empty in both because each repository starts with its own package.json.

## 3. Choose your public URLs before configuring login

Use these addresses for the main walkthrough:

| Purpose | Example |
| --- | --- |
| Frontend | `https://app.yourdomain.com` |
| Backend | `https://api.yourdomain.com` |
| API base URL used by React | `https://api.yourdomain.com/api` |
| Backend health endpoint | `https://api.yourdomain.com/api/health` |

These two HTTPS subdomains are different origins but the same site. The existing cookies can work with them, together with the existing credentialed Axios and CORS configuration. You do not need to add a cookie Domain setting.

### Direct Vercel/Netlify to Render: no custom domain required

The cross-site authentication fix now supports a frontend such as `https://myapp.vercel.app` or `https://myapp.netlify.app` calling `https://myapi.onrender.com/api` directly. Use the appropriate provider URLs instead of the custom-domain examples throughout this guide; skip the custom-domain/DNS step if using those URLs.

Backend: set `NODE_ENV=production` and `CLIENT_URL=https://myapp.vercel.app`. Production defaults to `SameSite=None; Secure; HttpOnly` cookies; optionally set `COOKIE_SAME_SITE=none` explicitly. Frontend: set `VITE_API_URL=https://myapi.onrender.com/api` before building. The updated frontend automatically sends the CSRF header required by the backend. Optional `CLIENT_ORIGINS` adds other exact trusted HTTPS frontend origins, comma-separated; never use wildcards.

This fixes the old Lax-cookie and blanket cross-site rejection behavior. It does not override browser privacy policies: direct cross-site cookie authentication remains unsupported when the browser blocks third-party cookies. A same-origin API proxy is the smallest secure fallback for those browsers and can use provider domains. Custom related subdomains are another option. Read [the cross-site problem, solution and browser limitation](CROSS-SITE-AUTH.md) before choosing your deployment arrangement.

Production requires HTTPS for both services. Production cookies are Secure and will not work correctly with an HTTP frontend.

## 4. Prepare MongoDB Atlas

1. Create an Atlas project and cluster for the deployed application.
2. Create a database user with read/write access to the application's database. This is separate from your Atlas website login.
3. Use a dedicated database name, for example `forma_production`. Do not point a public production application at the institute/demo database accidentally.
4. In Network Access, allow the backend host's outbound IP addresses/ranges. Your laptop's IP alone will not permit the deployed backend to connect. Render exposes outbound ranges in its service information; use all ranges relevant to that service. Avoid leaving an unrestricted all-IP entry as the permanent configuration.
5. Choose the connection option for a Node.js driver and copy the URI privately.
6. Replace its database username/password placeholders and set the database name before the `?` query string. URI-encode special characters in credentials. Keep the provider's query parameters.

Example structure only:

```dotenv
MONGO_URI=mongodb+srv://DB_USER:ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/forma_production?retryWrites=true&w=majority
```

Store the real value in backend hosting secrets. Never put it in a frontend variable, screenshot, public README or Git commit. [Atlas connection prerequisites](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/) and [Render outbound addresses](https://render.com/docs/outbound-ip-addresses).

## 5. Generate two JWT secrets

Run this locally in a terminal twice:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Save the first result as JWT_ACCESS_SECRET and the second as JWT_REFRESH_SECRET in the hosting secret settings. They must be different. The app requires at least 32 characters; this command generates 96 hexadecimal characters.

Use new secrets for production. Do not use the example/demo values. Keep them stable across ordinary redeploys, or users will lose their sessions. Rotating them intentionally also requires restarting the backend.

## 6. Environment variables: exactly what goes where

### Backend environment

Enter these in the backend service's Environment settings. Hosting services do not receive your ignored local .env from Git.

| Variable | Example / value | Meaning |
| --- | --- | --- |
| `NODE_ENV` | `production` | Enables production behavior and Secure cookies |
| `PORT` | Use the host-provided value | Internal HTTP port; Render supplies this automatically |
| `MONGO_URI` | Your private production Atlas URI | Database connection |
| `JWT_ACCESS_SECRET` | First generated secret | Signs access tokens |
| `JWT_REFRESH_SECRET` | Second generated secret | Signs refresh tokens |
| `JWT_ACCESS_EXPIRES` | `15m` | Access-token lifetime |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh-token lifetime |
| `CLIENT_URL` | `https://app.yourdomain.com` or your Vercel/Netlify URL | Primary exact trusted frontend origin; no `/api` |
| `CLIENT_ORIGINS` | Optional additional trusted HTTPS origins | Comma-separated, no wildcard patterns |
| `COOKIE_SAME_SITE` | Omit, or `none` for direct cross-site production | Defaults to `none` in production and `lax` locally; `lax`/`strict` available for deliberate same-site deployments |
| `MEDIA_UPLOAD_DIR` | `/var/data/uploads` | Absolute directory on the persistent disk |
| `NODE_VERSION` | e.g. `24.20.0` | Render runtime selection; this example matches the locally verified Node 24 version |

Prefer a maintained, patched Node 24 release for new production deployments. Node 20.1/npm 9 support exists for institute compatibility. The repository .nvmrc selects Node 20.20.2; set NODE_VERSION explicitly on Render to override that pin for hosting. Keep the npm version bundled with the selected Node release. [Render version selection](https://render.com/docs/node-version). See [Node/npm guide](NODE-VERSIONS.md) for local version requirements.

The app already reads PORT and does not bind only to localhost. Do not put a public domain, URL or `https://` in PORT. On a VPS using the optional configuration below, use `PORT=5000`. [Render port requirements](https://render.com/docs/web-services).

### Frontend build environment

```dotenv
VITE_API_URL=https://api.yourdomain.com/api
NODE_VERSION=24.20.0
```

VITE_API_URL tells the browser where the backend lives. Include `/api` once. Do not use localhost in a deployed frontend: localhost means the visitor's own computer.

Vite embeds VITE_ values into the compiled JavaScript at build time. They are public. Never create VITE_MONGO_URI or VITE_JWT_SECRET. A URL change requires a new frontend build and deployment; a backend restart alone cannot change already-built browser code. [Vite environment documentation](https://vite.dev/guide/env-and-mode).

Neither Render nor the browser uses `E:\client` or `E:\server` as a public address. Those are local filesystem paths only.

## 7. Deploy the backend on Render

In Render, choose **New → Web Service**, connect the appropriate Git repository, select `main`, and choose the Node runtime. Pick a region reasonably close to your Atlas cluster. [Web-service setup](https://render.com/docs/web-services).

Use the correct column:

| Setting | Combined repository | Standalone server repository |
| --- | --- | --- |
| Root Directory | Empty | Empty |
| Build Command | `npm ci --omit=dev --workspace server --include-workspace-root=false` | `npm ci --omit=dev` |
| Start Command | `npm run start --workspace server` | `npm start` |
| Health Check Path | `/api/health` | `/api/health` |
| Public custom domain | `api.yourdomain.com` | `api.yourdomain.com` |

The backend is plain JavaScript and has no compile step. Its production installation omits development-only tools. Do not use `npm run dev`, Nodemon, the root combined development command, or any seed command as the production Start Command.

Add the backend variables from section 6. Use a compute plan supporting a persistent disk if you keep the current local-media adapter.

Create a disk with mount path `/var/data`. Set MEDIA_UPLOAD_DIR to `/var/data/uploads`. The application creates its uploads subdirectory when saving a file, provided the mount is writable. Only files under the mounted path are persistent. Render's ordinary service filesystem is ephemeral; a persistent disk requires an eligible paid service. A disk belongs to a single service instance and affects deployment/scaling options. [Persistent-disk documentation](https://render.com/docs/disks).

Deploy and read the deployment logs. A successful backend startup prints `API listening on port ...`. A database connection failure prevents it from starting. A healthy `/api/health` returns:

```json
{"success":true,"message":"API is healthy"}
```

This endpoint reports HTTP liveness. It is not a continuous database-readiness check.

### Reverse-proxy configuration before public use

The hosting platform forwards requests to Express through a proxy. This app currently does not set Express `trust proxy`. Without a correct setting, IP rate limiting can treat all visitors as one address or report forwarded-header validation errors.

For a topology with **exactly one trusted proxy hop, where requests cannot bypass that proxy**, the configuration is:

```js
const app = express();
app.set('trust proxy', 1);
```

Place the setting immediately after app creation in `server/src/app.js` for the combined project, or `src/app.js` in the standalone backend. This is an instruction for a deployment-specific code change; it has not been applied by creating this guide.

Confirm the proxy path with your hosting provider before selecting the value. If there are multiple hops or paths, configure the actual trusted proxy addresses/subnets or appropriate verified topology. Do not blindly use `true`, and do not copy the one-hop example into a different network. The final trusted proxy must overwrite untrusted forwarded headers. [Express proxy configuration](https://expressjs.com/en/guide/behind-proxies/).

## 8. Deploy the frontend on Render

Choose **New → Static Site**. Connect the same combined repository, or the separate client repository. Use `main`. Add the frontend build variables from section 6 before building. [Static-site setup](https://render.com/docs/static-sites).

| Setting | Combined repository | Standalone client repository |
| --- | --- | --- |
| Root Directory | Empty | Empty |
| Build Command | `npm ci --include=dev --workspace client --include-workspace-root=false && npm run build --workspace client` | `npm ci --include=dev && npm run build` |
| Publish Directory | `client/dist` | `dist` |
| Start Command | None: static hosting | None: static hosting |
| Custom domain | `app.yourdomain.com` | `app.yourdomain.com` |

The frontend needs development dependencies during its build because Vite is a build tool. They are not uploaded to visitors; the output is static HTML, CSS and JavaScript. The `&&` commands above are entered in the host's build-command field, not older Windows PowerShell.

Add this Redirect/Rewrite rule:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | Rewrite |

It lets React Router handle direct visits and refreshes at `/user/dashboard`, `/user/categories`, `/admin/dashboard`, and other frontend routes. Use a rewrite, not a redirect that changes every URL to `/index.html`. The API in this walkthrough uses its separate domain, so API requests do not go through this SPA fallback. [Render rewrites](https://render.com/docs/redirects-rewrites).

The local Vite proxy in the combined project's vite.config.js is for development only. It does not become a production proxy when you run the build. Do not publish src/, node_modules/ or the whole repository as a static-site directory.

## 9. Connect domains and HTTPS

1. Add `api.yourdomain.com` as the backend custom domain and `app.yourdomain.com` as the frontend custom domain in the hosting dashboard.
2. At your domain registrar/DNS provider, add exactly the records the host requests. For subdomains these commonly involve CNAME records; use the actual targets supplied by the host rather than guessing an IP.
3. Wait for DNS verification and HTTPS certificate activation for both names.
4. Confirm backend CLIENT_URL is the final frontend HTTPS origin and frontend VITE_API_URL is the final backend HTTPS URL plus `/api`.
5. Restart/redeploy the backend after changing its variables. Rebuild/redeploy the frontend after changing its variables.
6. Use the custom frontend domain for login. A provider preview domain will not automatically be an allowed CLIENT_URL.

You may deploy the backend before DNS is ready, using the planned frontend URL in CLIENT_URL. Provider URLs can help inspect health, but use the final domain pair for the actual authenticated application. Follow the host's [custom-domain instructions](https://render.com/docs/custom-domains).

## 10. Create the first production administrator without a demo reset

The normal registration endpoint always creates a `user`. It cannot create an administrator from a browser-supplied role.

1. Open the deployed frontend and register your own account with a unique strong password.
2. In Atlas, open the intended production database and the `users` collection.
3. Find the one document matching your exact email. Verify you are editing the account you just created.
4. Change its `role` field from `user` to `admin`. Leave its stored password hash and other fields unchanged. Ensure `isActive` is true.
5. Sign out and sign back in through the frontend. You should now reach the admin dashboard.
6. Create real categories through the admin UI. Manage subsequent accounts using the existing admin controls.

Do not store a plaintext password directly in MongoDB. Registering through the application performs hashing.

**Do not run `npm run seed` or `npm run seed:destroy` on production.** Those commands delete users and categories. Do not leave publicly documented demo credentials enabled in an internet-facing database. If you deliberately reuse an old demo database, review its existing users and media first; using a fresh production database is simpler.

## 11. Move existing uploaded media correctly

MongoDB stores media metadata, not the file bytes. Copying the database alone does not copy uploaded images, documents or videos.

| Source layout | Existing local files |
| --- | --- |
| Combined | `E:\mern-starter-kit\server\uploads` |
| Separate | `E:\server\uploads` |
| Example hosted destination | `/var/data/uploads` |

If preserving existing records, take a backup, then use the host's supported secure file-transfer method to copy the corresponding files to the mounted upload directory. Keep every generated UUID filename unchanged. Preserve the relationship between the database records and the file set; do not rename files to their display names. Confirm the backend account can read, write and delete in that directory.

A fresh production database does not know about copied files. Either upload them through the admin interface after deployment, or plan a coordinated database-and-files migration. Copying local upload files without their records makes them undiscoverable; importing records without their files produces media 404 responses.

Do not expose the upload directory as a public static folder. File downloads currently go through authenticated `/api/media/:id/file` requests. Admins upload/delete; active signed-in users can read the shared library.

The current limit is one file up to **25 MiB**. Supported formats: JPEG, PNG, WebP, GIF, MP4, WebM, PDF, DOCX, XLSX and PPTX. The application inspects file contents. Configure any proxy upload limit slightly above 25 MiB to leave room for multipart overhead; for example, 30 MiB. A provider with a smaller request-size limit is unsuitable for the full current upload feature without changes.

Uploads are buffered in memory, and the client loads full media blobs for previews. Large concurrent uploads/previews need sufficient memory; this implementation is not a large-video streaming platform.

## 12. Cloudflare R2 later

R2 storage is **not implemented yet**. Adding R2 credentials to environment settings does not activate object storage.

The extension points are `src/storage/index.js` and `src/storage/local.js` inside the backend. A future adapter must implement save, remove and authenticated send behavior, preserve provider/key metadata, and migrate existing files deliberately. Keep the local adapter available while old records still use it. Keep object-storage secrets on the backend, not in VITE_ variables.

See [Media storage and the R2 adapter contract](media-storage.md). Until an adapter is implemented, use a persistent disk and one backend instance.

## 13. After deployment: manual checks for you

These are a future deployment checklist, not commands executed while writing this guide:

- Open the backend health URL and the frontend custom domain over HTTPS.
- Register/sign in as an ordinary user; verify categories and profile.
- Sign in as your production admin; verify the admin dashboard and sign out.
- Refresh `/user/categories` and `/user/dashboard` directly; the SPA rewrite should keep them working.
- Upload a small image, video and document as admin. Confirm a user can view/download them.
- Redeploy/restart the backend and confirm the uploaded files still exist. This checks persistent-storage configuration.
- In browser developer tools, confirm requests go to your production API, not localhost. Inspect failed requests' status and cookie/CORS messages without sharing token values.
- Check backend logs for database errors, repeated 401/403 responses, forwarded-header warnings and failed uploads.

## 14. Updates, rollback and backups

### Combined repository updates

Both services track the same repository but deploy independently. A backend-only change can require only a backend deployment; a frontend change requires a client build. Initially, avoid narrow path filters that accidentally exclude the shared package-lock.json. If you later configure filters, include root configuration and lockfile changes for both services.

### Separate repository updates

Push frontend changes to its repository and backend changes to its repository. An API change may require coordinated deployments. Deploy backwards-compatible backend additions first, then the frontend that uses them. Keep existing endpoints working during the transition.

### Recovery

Record the last good commit for each service. Use your host's deployment rollback or redeploy that commit if a release fails. Code rollback does not undo database changes, recover deleted files or change hosted environment variables automatically. Never use seeding as a rollback mechanism.

Back up the production MongoDB database AND the upload directory, with a retention schedule appropriate to your data. Coordinate their backups and restores so media records match files. Keep backups separate from the running service. Configure the backup features available for your Atlas plan and hosting disk; persistence alone is not a backup policy.

Keep JWT secrets and environment configuration in a secure password/secret manager. Monitor disk space, memory and backend errors. The current API rate-limit store is per-process memory; multiple backend instances would need a shared rate-limit store as well as shared media storage.

## 15. Alternative: one public origin behind your own reverse proxy

Choose this if you already manage a Linux server with a maintained Node runtime, Nginx, a process supervisor, HTTPS certificates and firewall rules. OS setup is outside the managed-host walkthrough. The public shape is:

```text
https://app.yourdomain.com/       -> built frontend files
https://app.yourdomain.com/api/   -> private Node process on port 5000
```

Use `VITE_API_URL=/api` during the frontend build and `CLIENT_URL=https://app.yourdomain.com` on the backend. The server folder can be anywhere; the browser connects through the URL, not the folder.

Linux build/start commands (choose your layout):

```bash
# Combined checkout at /srv/forma:
cd /srv/forma
npm ci --include=dev
VITE_API_URL=/api npm run build
# Configure a process supervisor to run this from /srv/forma:
npm run start --workspace server

# OR independent folders:
cd /srv/client
npm ci --include=dev
VITE_API_URL=/api npm run build
cd /srv/server
npm ci --omit=dev
# Configure a process supervisor to run this from /srv/server:
npm start
```

Supply the production backend variables through the supervisor/host secrets. If using a private .env instead: the combined start command runs the server workspace, so place it in `/srv/forma/server/.env`; the standalone command reads `/srv/server/.env`. Restrict its filesystem permissions. Keep media outside replaceable release directories, for example `/var/lib/forma/uploads`, and set MEDIA_UPLOAD_DIR accordingly. Give the application service user ownership of that media directory.

Copy the chosen frontend build output (`/srv/forma/client/dist/` or `/srv/client/dist/`) into `/var/www/forma/`. Configure the process supervisor for automatic restart and startup after server reboot, using a non-root service user and the correct working directory. A terminal session alone is not a production process supervisor.

Example Nginx locations **inside your existing HTTPS server block**, with `root /var/www/forma;`:

```nginx
client_max_body_size 30m;

location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_read_timeout 60s;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

The proxy_pass address intentionally has no trailing `/`, so `/api` remains in the upstream path. Keep API routing ahead of the frontend fallback. Overwriting X-Forwarded-For here is appropriate for this single public Nginx proxy; a CDN or another proxy in front requires a different, verified trust configuration. [Nginx proxy reference](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).

For Node reached only through Nginx on the same machine, use `app.set('trust proxy', 'loopback')` rather than the managed-host one-hop example. Block external access to port 5000 with the firewall/private network and expose only the required HTTPS/HTTP/administration ports. Configure certificates and HTTP-to-HTTPS redirect before enabling production login. These are deployment steps you must perform; this guide does not configure Nginx or Express for you.

If Nginx and Node are on different servers, use their private network and trust only the actual proxy addresses; do not reuse the localhost example unchanged.

## 16. Troubleshooting

| Symptom | Check / fix |
| --- | --- |
| `npm ci` says no lockfile | Wrong repository root, missing committed package-lock.json, or standalone commands applied to a workspace subfolder |
| `EBADENGINE` | Check Node/npm selection; Render NODE_VERSION overrides .nvmrc; use a compatible bundled pair |
| `vite: not found` | Frontend build omitted development dependencies; use the frontend build command from section 8 |
| `Missing script: start` | Combined root has no generic start script; use `npm run start --workspace server` |
| Cannot detect an open backend port | Read startup logs; check database connectivity and host-provided PORT; do not start Vite as the backend |
| `Invalid environment: ...` | Set each named backend variable; JWT secrets must differ and be at least 32 characters |
| Database connection failed | Check database user/password, encoded URI, database name and deployed backend outbound-IP allowlist |
| API root `/` returns 404 | Expected: this server exposes `/api/...`; use `/api/health` |
| Frontend API URL includes localhost | Correct VITE_API_URL in hosting settings and rebuild the client |
| API response is HTML / `Unexpected token '<'` | Request went to frontend SPA fallback; fix API base URL or proxy routing |
| Refreshing a dashboard returns a host 404 | Add the frontend rewrite to index.html |
| CORS error | CLIENT_URL must exactly match the browser's HTTPS frontend origin; keep credentialed CORS; don't use `*` |
| `Origin not allowed` | Missing/untrusted Origin (or Referer fallback); verify the exact configured allowlist |
| `CSRF protection required` | Old frontend build or missing X-CSRF-Protection header; update both applications together |
| Login succeeds but session disappears | Check HTTPS, cookie mode, third-party-cookie blocking, credentialed requests, and a recent secret change |
| Logout/login in one browser affects another | Each account currently has one stored refresh-token session; signing in again replaces it |
| Everyone gets 429 / forwarded-header warning | Correct proxy trust for your actual topology; a shared limiter store is needed when scaling |
| Upload returns 413 | App cap is 25 MiB; proxy/provider may enforce a lower request-size limit |
| Upload returns 415 | File signature/type is unsupported or does not match the claimed MIME type |
| Upload returns filesystem permission error | Check absolute MEDIA_UPLOAD_DIR, disk mount and application-user write permission |
| Uploads disappear after deploy | Files were saved outside the persistent mount or on ephemeral hosting |
| Media card exists but file returns 404 | Metadata exists but its generated file is missing from the configured upload directory |
| Admin actions return 403 | Verify that account's role/isActive in the correct database; ordinary registrations are users |
| Preview deployment cannot log in | Its origin is not CLIENT_URL; use a separately configured staging backend/domain pair |

## 17. Copy-and-fill deployment worksheet

Keep actual secrets in the host/secret manager, not in this document.

```text
Layout: combined / separate
Frontend Git repository:
Backend Git repository (same as frontend if combined):
Deploy branch: main
Frontend public origin:
Backend public origin:
Frontend VITE_API_URL:
Backend CLIENT_URL:
Atlas database name:
Atlas backend network access configured: yes / no
Backend secret variables entered privately: yes / no
Chosen Node runtime:
Frontend build command:
Frontend publish directory:
Backend install command:
Backend start command:
Proxy trust configured for actual topology: yes / no
Persistent disk mount:
MEDIA_UPLOAD_DIR:
SPA rewrite configured: yes / no
HTTPS active on both domains: yes / no
Production admin created without demo seeding: yes / no
Database backup location/policy:
Upload backup location/policy:
Last good frontend commit:
Last good backend commit:
```

Related references: [Beginner guide](BEGINNER-GUIDE.md), [Node/npm compatibility](NODE-VERSIONS.md), and [media storage](media-storage.md).
