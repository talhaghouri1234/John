# Node.js and npm versions

## Which versions can I use?

The combined project and the separate client/server projects support Node **20.1.0 or later in the 20.x line**, **22.x**, and **24 or newer**. The minimum npm version is **9.6.4**. Keep the npm version included with your Node installation: Node 20.1 includes npm 9.6.4; later Node 20 releases include npm 10; Node 24 includes npm 11.

Run these commands in any terminal:

```powershell
node --version
npm --version
```

Examples that meet the requirements: Node 20.1.0/npm 9.6.4, Node 20.19/npm 10, Node 22/npm 10, and Node 24/npm 11. Node 18 and Node 20.0 are outside this project's supported range. The .nvmrc file selects Node 20.20.2 when using a version manager; it does not require you to replace an already compatible installation. The .npmrc file rejects unsupported engine versions during installation instead of allowing a broken setup.

Node 20 is provided for institute compatibility. It is now out of upstream maintenance; prefer a maintained Node release for a newly deployed production server. See the [official Node 20 archive](https://nodejs.org/en/download/archive/v20).

## Combined project

Stop the running development processes with Ctrl+C, then:

```powershell
cd E:\mern-starter-kit
npm ci
npm run dev
```

One install command installs both workspaces. Keep the root package-lock.json. Do not run npm install separately inside the combined client and server folders.

## Separate projects

Stop each running development process. Install once in each folder:

```powershell
cd E:\server
npm ci
npm run dev
```

In a second terminal:

```powershell
cd E:\client
npm ci
npm run dev
```

Each independent folder has its own package-lock.json. npm ci replaces node_modules but preserves your source, .env and uploaded files. Run it after switching Node major versions so native dependencies match the active runtime. Do not copy node_modules between computers. Do not run the old combined app and the separate copies on the same ports simultaneously.

Your frontend URL, backend URL, JWT settings, MongoDB connection and uploads do not change when you change Node versions. No reseeding is necessary.

## Why dependencies changed

Vite 7, Mongoose 9, Vitest 5 and other newer tools exclude early Node 20 releases. This project uses compatible versions: Vite 6.4.4, Mongoose 8.24.5, Vitest/coverage 4.1.11, jsdom 26.1.0, file-type 21.3.4 and ESLint 8.57.1. Test mocking is pinned to MSW 2.4.11. Rollup is pinned to 4.62.2 to avoid an optional binary with a newer runtime requirement. These compatibility pins are intentional; do not run npm audit fix --force or upgrade these major versions without checking the Node 20.1 tests again. The lockfiles use format 3, supported by npm 9, 10 and 11.

## Common problems

- EBADENGINE: check both version commands. Use a compatible Node/npm pair; do not install npm 11 on early Node 20.
- npm.ps1 cannot be loaded: use npm.cmd in PowerShell or open Command Prompt.
- Native module or missing package error after switching Node: stop the app, then run npm ci in the appropriate project root.
- Test MongoDB download is slow: tests use an isolated MongoDB instance. On this computer, an installed MongoDB binary is detected automatically. To skip a duplicate install-time download in PowerShell, set $env:MONGOMS_DISABLE_POSTINSTALL="1" before npm ci. On a new computer without MongoDB, allow the test binary download.
- A dependency deprecation notice is not an installation failure. Some development tools are intentionally older for institute compatibility. Check the command's final result.

## Verification commands

Combined: npm run lint, npm test, npm run build, npm run test:coverage.
Separate client: npm run lint, npm test, npm run build, npm run test:coverage.
Separate server: npm run lint, npm test, npm run test:coverage.

Backend tests create disposable databases; they do not reset your configured application database.
