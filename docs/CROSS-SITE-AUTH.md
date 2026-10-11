# Cross-site authentication: problem, fix and deployment settings

## The problem we investigated

The intended deployment puts React on Vercel or Netlify and Express on Render, for example `https://myapp.vercel.app` and `https://myapi.onrender.com`. These are different sites. The same problem affects the combined repository when its two applications are deployed separately; local folder layout does not determine cookie behavior.

We identified two definite blockers in the original code:

1. `server/src/utils/generateToken.js` always issued `SameSite=Lax` cookies. Browsers do not send these on cross-site Axios requests.
2. `server/src/app.js` rejected every unsafe request marked `Sec-Fetch-Site: cross-site`, including requests from the intended frontend.

Axios already used `withCredentials: true` and the configured VITE_API_URL. Token rotation, hashing and authorization were already present. Changing only the cookie flag would have left the origin rejection in place, and removing that rejection without another defense would have weakened CSRF protection.

These findings came from source inspection and regression tests. No live Vercel/Netlify/Render production deployment was supplied or changed during this fix.

## What changed

| Area | Before | Now |
| --- | --- | --- |
| Production cookies | Always Lax | Default None + Secure + HttpOnly |
| Local HTTP cookies | Lax, HttpOnly | Preserved |
| Allowed frontends | One loosely validated URL | Validated exact origin plus optional explicit additional origins |
| Cross-site writes | Rejected unconditionally | Allowed only with trusted browser provenance and the custom CSRF header |
| Missing browser provenance | Could reach write endpoints | Denied; missing Origin can fall back to a trusted Referer |
| Preflight | Generic CORS setup | Exact-origin credentialed CORS with explicit methods/header list |
| Axios | Cookies and refresh retries | Same behavior plus a CSRF-header interceptor on BOTH clients |
| Logout | Shared cookie configuration | Still uses the same settings as cookie creation, including new SameSite value |

No database schema changes, JWT response fields, localStorage tokens, new authentication endpoints or new dependencies were introduced. JWTs remain in HttpOnly cookies. Existing password hashing, refresh-token rotation, single-session behavior, authorization, upload checks and rate limits remain in place.

## Exact production settings: no custom domain required

Backend hosting environment:

```dotenv
NODE_ENV=production
CLIENT_URL=https://myapp.vercel.app
# Optional: only additional frontends you control and fully trust.
CLIENT_ORIGINS=https://myapp.netlify.app
# Optional: production already defaults to none when this variable is omitted.
COOKIE_SAME_SITE=none
```

Keep your existing production MONGO_URI, distinct JWT_ACCESS_SECRET/JWT_REFRESH_SECRET, expiration settings, PORT and MEDIA_UPLOAD_DIR. None of those secrets or data were changed by this fix. All configured production frontend origins must use HTTPS.

Frontend BUILD environment:

```dotenv
VITE_API_URL=https://myapi.onrender.com/api
```

Replace the example names with your real deployed addresses. CLIENT_URL has no route or `/api` suffix. VITE_API_URL includes `/api` exactly once. Additional origins are comma-separated full origins; wildcard domains and preview-domain patterns are not accepted. Trailing root slashes are normalized. Paths, credentials, query strings and fragments in configured frontend origins are rejected at startup.

An additional allowed origin has the same ability to act through the API as the primary frontend. Do not include third-party sites, arbitrary preview deployments or domains you no longer control. Use a separate staging backend/database for untrusted preview code.

Redeploy/restart the backend after environment changes. Rebuild and redeploy the frontend after changing VITE_API_URL. Both frontend code and backend code must be updated together: older clients do not send the newly required CSRF header and will receive 403 on writes. A coordinated deployment/brief maintenance window is preferable to temporarily disabling the check.

## Local development stays the same

Backend:

```dotenv
NODE_ENV=development
CLIENT_URL=http://localhost:5173
CLIENT_ORIGINS=
# Omit COOKIE_SAME_SITE, or set it to lax.
```

The combined frontend uses `VITE_API_URL=/api` with its Vite development proxy. The separate frontend uses `VITE_API_URL=http://localhost:5000/api`. Keep localhost consistent rather than mixing localhost and 127.0.0.1.

Development/test default to Lax cookies without Secure so local HTTP still works. Production uses Secure cookies. Setting COOKIE_SAME_SITE=none outside production is rejected to avoid an insecure/misleading local configuration. For a deliberate same-site or same-origin HTTPS deployment, production can use COOKIE_SAME_SITE=lax or strict instead.

## How CSRF protection works now

Every method other than GET, HEAD and OPTIONS must pass BOTH checks:

1. Origin must match the exact allowlist. Only when Origin is absent, the backend extracts the origin from Referer and checks it. An invalid, `null` or untrusted Origin cannot be rescued by a trusted Referer. Missing/invalid provenance is denied.
2. `X-CSRF-Protection: 1` must be present. Navigation/document submissions are rejected as well.

The header is a fixed marker, **not a secret token or JWT**. Browser forms cannot attach it. A foreign script needs a successful CORS preflight to send it, and the backend grants that permission only to configured origins. This also protects multipart uploads, login, refresh and logout. This is the custom-header defense for an AJAX-only API, combined with strict source-origin validation. See [OWASP's custom-header CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-custom-request-headers-for-ajaxapi).

Fetch Metadata is no longer used as an unconditional cross-site ban. A cross-site request must satisfy the checks above; a claim of same-origin does not bypass them. Credentialed CORS never returns `*` or reflects an arbitrary origin.

Both Axios instances attach the marker immediately before sending requests. The private refresh client therefore follows the same contract, and the existing one-refresh-at-a-time retry behavior remains intact.

If writing another client or using curl/Postman, include your configured Origin and `X-CSRF-Protection: 1` on writes along with any required session cookies. Non-browser software can forge headers, but still needs valid credentials; this defense prevents browser-driven CSRF, not stolen-cookie use or XSS on a trusted frontend.

## The remaining browser limitation

**Direct cross-site authentication works only where browser cookie policy permits it.** SameSite=None; Secure makes cookies eligible for cross-site use; it cannot force a browser to store/send third-party cookies. Privacy settings, browser policies and extensions may block them. That can produce a successful login HTTP response followed by a 401 on `/auth/me` or `/auth/refresh`. See [MDN's third-party-cookie explanation](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies).

No browser matrix with third-party cookies disabled was executed here. Such browsers are explicitly unsupported by the direct cross-site cookie architecture. The server tests inspect cookie attributes and replay cookies explicitly; they do not simulate a browser accepting them. Do not interpret passing server tests as universal browser compatibility.

This fix does not introduce CHIPS/Partitioned cookies or a Storage Access API flow, whose browser support and semantics need a separate design. It also does not move tokens into localStorage or disable HttpOnly to work around browser privacy restrictions.

### Smallest secure fallback when third-party cookies are blocked

Proxy `/api/*` through the frontend host to the existing backend, so the browser sees first-party requests. This can use the existing provider domains and requires no purchased custom domain. It is an optional architectural fallback, not a requirement for the direct cross-site mode implemented above.

For Vercel, an external rewrite can forward requests to Render. Example API rewrite entry to place before any frontend SPA catch-all:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://myapi.onrender.com/api/:path*"
    }
  ]
}
```

This is a documentation example, not a deployed vercel.json. Put routing configuration in the deployment's configured project root and preserve its existing SPA routing. Set frontend VITE_API_URL=/api, keep backend CLIENT_URL equal to the public frontend origin, and optionally select COOKIE_SAME_SITE=lax in production. Rebuild/redeploy both as needed.

The proxy must preserve request cookies, Origin and the custom header, forward every Set-Cookie header, and avoid caching authenticated API responses. Host-only cookies need no backend-domain rewrite because this app sets no Domain attribute. Verify the provider's upload/body-size limits before using this path for the current 25 MiB media feature. Inspect proxy trust/rate-limit settings for the new topology. [Vercel external rewrites](https://vercel.com/docs/routing/rewrites).

## Files responsible for the fix

Paths below are relative to the combined project; drop the client/server prefix inside an independent folder.

| File | Responsibility |
| --- | --- |
| `server/src/config/env.js` | Normalize/validate origins; production HTTPS and cookie-mode defaults |
| `server/src/utils/generateToken.js` | Shared cookie attributes for issuance and deletion |
| `server/src/middleware/browserSecurity.js` | CORS allowlist and write-request CSRF/provenance checks |
| `server/src/app.js` | Apply CORS and write protection before parsers/routes |
| `server/.env.example` | Optional additional origins and SameSite setting |
| `client/src/api/axios.js` | Credentials, base URL, CSRF header and refresh/retry behavior |
| `server/tests/cross-site.test.js` | Production cross-site security/session regression cases |
| `server/tests/request.js` | Trusted-local-frontend headers for existing integration tests |
| `client/src/tests/refresh.test.js` | Header/credential behavior, multipart, concurrent refresh and failure handling |

The same targeted code changes are copied into E:\client and E:\server. Their standalone package setup and API URLs are retained. Private .env files are not overwritten.

## Verification and troubleshooting

Automated coverage includes production registration/login cookie flags, credentialed reads, expired access tokens, refresh rotation and replay rejection, logout revocation/clearing, trusted and rejected preflights, forged/missing provenance, simple forms, multipart uploads and local development regression tests. Frontend checks cover both Axios paths and request retries. Databases used by the backend suite are temporary; production/demo data is not reset.

For your deployed browser session:

1. In Network tools, confirm login targets the correct `/api/auth/login` URL.
2. Check OPTIONS: trusted requests should get an exact Access-Control-Allow-Origin and Access-Control-Allow-Credentials: true, plus permission for X-CSRF-Protection.
3. Check login's cookies: Secure, HttpOnly, SameSite=None and Path=/, with no unexpected Domain attribute.
4. Inspect the browser's cookie-blocking messages. A rejected third-party cookie is a browser-policy limitation, not a reason to loosen CORS.
5. Open a protected page and refresh it. Verify `/auth/me` succeeds, refresh still works after access expiry, and logout prevents another refresh.
6. Test your target browsers with their normal privacy settings before claiming compatibility.

| Error | Likely cause / next step |
| --- | --- |
| Origin not allowed | Browser origin is absent/untrusted, or hosting environment was not restarted |
| CSRF protection required | Old frontend build or another client missing X-CSRF-Protection: 1 |
| Preflight fails | Wrong exact origin, unsupported header, or a proxy intercepting OPTIONS |
| Login 200 then protected 401 | Browser blocked cookies, wrong cookie mode, HTTP in production, or wrong API URL |
| Cookie not sent after deployment | Inspect SameSite/Secure settings and browser third-party-cookie policy |
| Logout appears ineffective | Verify both applications are updated and using the same API; inspect clear-cookie attributes |
| Startup rejects production origins | Every trusted production origin must be an HTTPS origin without a path |

See [the complete deployment guide](DEPLOYMENT-GUIDE.md) for hosting, storage, first-admin creation and rollback. Keep the previous frontend/backend release pair available for a coordinated rollback; never disable origin/CSRF checks as a temporary fix.

### Recorded results for this change

- Combined project on Node 24.20.0/npm 11: backend 53 tests passed; frontend 23 tests passed; both linters and frontend build passed.
- Independent projects on Node 20.1.0/npm 9.6.4: backend 53 tests passed; frontend 23 tests passed; both linters and frontend build passed.
- These are local automated results, including production cookie configuration in an isolated backend suite. No hosted cross-site browser deployment or third-party-cookie-blocking browser matrix was executed.

## Account-feature release

The browser origin, custom header, and cookie rules in this document still apply
to recovery, verification, profile, and device-session endpoints. This release
also requires mail-provider configuration in production and a one-time sign-in
after upgrading. See [ACCOUNT-FEATURES.md](ACCOUNT-FEATURES.md).
