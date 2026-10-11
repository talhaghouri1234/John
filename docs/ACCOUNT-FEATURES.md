# Account features: setup, use, and deployment

This guide applies to the combined `E:\mern-starter-kit` repository and the independent `E:\client` and `E:\server` repositories. The separate frontend uses the same APIs and screens. Only its API URL and installation commands differ.

## What was added

| Feature | Where to use it |
| --- | --- |
| Forgot/reset password | **Forgot password?** on the sign-in page |
| Email verification | Registration email, or **Account settings → Send verification email** |
| Change password | **Account settings → Change password** |
| Reusable email service | Backend queue, local email previews, SMTP or Resend HTTPS delivery |
| Account settings | Both admin and user sidebars: name, photo, email, password |
| Device sessions | **Account settings → Signed-in devices** |
| Admin activity history | Admin sidebar: **Activity log** |

## First: understand email delivery

The frontend never sends mail directly. It asks your backend, which stores an encrypted email job in MongoDB. A worker inside the running backend sends the job. You do not need a second worker command.

There are three delivery modes:

| Mode | Where the message goes | Use |
| --- | --- | --- |
| `file` | A JSON file in the backend's `mail-outbox` directory | Local development, no email account required |
| `smtp` | Your SMTP provider | Production or development with a mail provider |
| `resend` | Resend's HTTPS email API | Production, including hosts that block SMTP ports |

`file` is the default outside production. `smtp` is the default in production. Production rejects file delivery and missing provider configuration at startup, so it cannot silently pretend to send real email.

### Local setup: no mail provider required

1. Start the project as described in BEGINNER-GUIDE.md. Keep `NODE_ENV=development`.
2. Optionally add `MAIL_MODE=file` to the backend `.env`. Without it, development already uses file mode.
3. Set `CLIENT_URL=http://localhost:5173` (or the actual frontend origin). Links always use this configured address, never the incoming Host header.
4. Register a new account with an email address, or request a password reset for an existing account.
5. Wait a few seconds. Open the newest JSON file in:
   - Combined: `E:\mern-starter-kit\server\mail-outbox`
   - Separate backend: `E:\server\mail-outbox`
6. Copy the link from the JSON `text` field and open it in your browser. If the editor shows escaped `\n`, copy only the URL, not the newline escape.
7. For verification, press **Verify email**. For recovery, enter and confirm a new password.

The separate frontend has no outbox: email belongs to the backend. File mode does not send anything to a real inbox. The outbox contains private links; it is ignored by Git and must never be publicly served. Delete local preview files when you no longer need them.

### Production option A: SMTP

Add these only to the backend host's environment settings:

```dotenv
NODE_ENV=production
CLIENT_URL=https://your-frontend.example
MAIL_MODE=smtp
MAIL_FROM=noreply@your-verified-domain.example
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=587
SMTP_USER=your-provider-username
SMTP_PASS=your-provider-password-or-app-password
```

Copy the actual SMTP values from your mail provider; the examples above are placeholders. Use a sender address/domain approved by the provider. Port 465 uses TLS immediately; other ports require STARTTLS. Certificate validation is not disabled. If your provider uses authentication, configure both username and password.

Keep all MongoDB, JWT, cookie, and frontend URL configuration from the deployment guide. No mail secrets belong in `VITE_*` variables, client source, or Git.

### Production option B: Resend HTTPS

```dotenv
NODE_ENV=production
CLIENT_URL=https://your-frontend.example
MAIL_MODE=resend
MAIL_FROM=noreply@your-verified-domain.example
RESEND_API_KEY=your-private-provider-api-key
```

Create the key in your provider account and complete its sender/domain verification. Testing senders may restrict recipients; check your provider account before sending to real users. SMTP variables are not required in this mode. The implementation calls the provider over HTTPS and uses the email-job ID as an idempotency key for retries.

Render free web services block the common SMTP ports 25, 465, and 587. Use this HTTPS option, or a hosting plan that permits your SMTP provider. See [Render's SMTP restriction](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports), [Nodemailer SMTP settings](https://nodemailer.com/smtp), and [Resend idempotency](https://resend.com/changelog/idempotency-keys).

### Delivery retries and operations

- The running backend claims one queued message per second; multiple backend instances use an atomic two-minute lease to avoid simultaneous claims.
- Failed deliveries retry with increasing delays, up to five attempts, and never past the job's expiry.
- Delivered jobs are removed. Expired jobs are removed by MongoDB's TTL index; deletion is asynchronous.
- Failed jobs with five attempts remain until expiry for inspection. Logs contain a generic error, not addresses, passwords, or reset links.
- After correcting provider settings, users can request a new link. Requests for the same account have a one-minute cooldown.
- SMTP delivery is at-least-once: a process crash after provider acceptance can result in a duplicate message. The link itself still works only once. Resend uses idempotency keys to reduce duplicates.
- Email bodies are encrypted in MongoDB using AES-256-GCM with a key derived from `JWT_REFRESH_SECRET`. Rotating that secret invalidates sessions and makes existing queued email unreadable. After rotation, clear only obsolete email jobs through your normal database maintenance process and request new links; do not seed or erase users.
- This starter does not implement provider bounce webhooks or a mail administration UI. Check delivery status with your provider when diagnosing missing emails.

## How each feature behaves

### Password recovery

The forgot-password endpoint returns the same confirmation for missing, inactive, and eligible addresses. It queues mail instead of waiting for the provider. Requests are rate limited. Tokens use 32 random bytes, are hashed on the user record, expire after 30 minutes, and are consumed atomically. Two concurrent reset attempts cannot both succeed.

A successful reset revokes every device session, invalidates pending email changes, clears the current browser cookies, and sends a password-change notification. Sign in again with the new password. Old access tokens fail immediately on subsequent authenticated requests, not merely when they expire.

### Email verification and address changes

Registration queues a verification email. Verification links expire after 24 hours and work once. Opening the page alone does not verify: the person presses a button, preventing ordinary mail-link previews from consuming it. Successful initial verification queues a welcome email.

Verification status is visible in account settings. **Verification does not block existing dashboard access by default.** This keeps existing users and demo accounts usable. Applications needing verified-only actions should add an explicit `emailVerified` check to those routes.

Changing email requires the current password. The old address remains the login address until the new address is confirmed. Confirmation sets the new address as verified, revokes all sessions and old reset links, and notifies the old address. The unique email index prevents two accounts from claiming the same address. If another account takes the requested address before confirmation, choose another address and request a fresh link.

**Cancel pending email change** invalidates the pending confirmation link. **Send verification email** resends to a pending address when one exists, otherwise to the current unverified address. Wait one minute between requests.

### Password changes

The signed-in form requires the current password and a new password of 8–72 characters, with a backend limit of 72 UTF-8 bytes for bcrypt. The confirmation field catches typing mistakes. A successful change signs out every device, invalidates pending recovery/email-change links, and sends a notification.

### Profile and photos

Both roles can edit their name. Profile updates cannot change roles or activation status. Photo uploads accept JPEG, PNG, WebP, or GIF up to 2 MB; the server checks binary signatures instead of trusting the extension. SVG and HTML are not accepted.

Photos are private to the account, displayed in account settings, and retrieved through the authenticated API. They use the existing local storage adapter and `MEDIA_UPLOAD_DIR`. Use a persistent disk in production and back it up with the database. Replacement and removal clean up old files during normal operation. As with media, database and filesystem changes are not a distributed transaction; investigate orphaned files after disk/database failures. R2 remains an adapter extension point, not a configured provider.

### Devices and sessions

Each login creates an independent session. Refresh tokens rotate atomically inside that session. Login on a second device no longer invalidates the first device's refresh token.

Users can sign out one device, all other devices, or their current device. Session IDs are scoped to the signed-in account. A revoked session fails both access and refresh checks. Device descriptions are browser User-Agent strings, not trusted physical-device identities. Last active means login or latest refresh, not every page click. Expired records disappear through MongoDB TTL cleanup.

Admin changes to a user's role or active status revoke that user's sessions. The user must sign in again to receive the new access. Password reset, password change, and confirmed email change revoke all sessions as described above.

### Admin activity history

The admin-only, paginated log supports action filters and records actor, time, action, target record ID, and selected non-secret details for:

- User role changes, activation/deactivation, and deletion.
- Category creation, updates, and deletion.
- Media uploads and deletion.

There are no API routes to modify or delete audit events. Deleted actors display as "Deleted account". Events start with this release; historical actions are not reconstructed. The log is operational history, not a tamper-proof compliance ledger. A business write and its audit insert are separate database operations; a database failure between them can leave a missing event. Add transactional auditing and an external append-only sink if your application requires stronger guarantees. Set a retention policy appropriate to your application before large-scale use.

## Upgrade existing installations safely

1. Back up MongoDB and the uploads directory. Do not run `seed` or `seed:destroy` for this upgrade.
2. Pull `main` in each repository you deploy.
3. Install dependencies using `npm ci` at the combined root, or separately inside the standalone client and server folders.
4. Configure production email mode and sender credentials before starting the new backend. Keep existing MongoDB and JWT secrets unless you intentionally rotate them.
5. Deploy frontend and backend together. The frontend needs the new routes; the backend needs the new session and account models.
6. Existing cookies from the old single-session implementation are intentionally rejected. Everyone signs in again once. Existing users, passwords, categories, and media are retained.
7. Existing accounts start with an unverified status. They can sign in and request verification from Account settings. No automatic bulk email is sent to existing users.
8. New collections (`sessions`, `emailjobs`, `auditevents`) and indexes are created by Mongoose under the current application setup. If you disable automatic indexing, provision the declared indexes using your deployment process.
9. Confirm your frontend host sends `/forgot-password`, `/reset-password`, and `/verify-email` to the SPA entry point, just like other React routes. Mail links use `#token=...`; preserve the fragment. Do not attach analytics that collect complete recovery URLs.
10. Confirm real mail delivery, registration verification, password recovery, and device revocation on staging before inviting users.

All existing CORS, credentialed-cookie, and CSRF protections remain. On unrelated frontend/backend sites, browser third-party-cookie restrictions still apply; see CROSS-SITE-AUTH.md for the first-party proxy option. This release adds browser account features, not a native mobile bearer-token API.

## API reference

Every write requires the existing trusted browser origin and `X-CSRF-Protection: 1` header. The React API client adds it. Signed-in endpoints also require the existing HttpOnly cookies.

| Method and path | Authentication | Body / purpose |
| --- | --- | --- |
| `POST /api/auth/forgot-password` | Public | `{ email }` |
| `POST /api/auth/reset-password` | Public | `{ token, password }` |
| `POST /api/auth/verify-email` | Public | `{ token }` |
| `POST /api/account/resend-verification` | Signed in | Queue a new verification link |
| `PATCH /api/account/profile` | Signed in | `{ name }` |
| `POST /api/account/change-password` | Signed in | `{ currentPassword, password }` |
| `POST /api/account/change-email` | Signed in | `{ currentPassword, email }` |
| `DELETE /api/account/pending-email` | Signed in | Cancel pending change |
| `GET /api/account/sessions` | Signed in | Own active sessions |
| `DELETE /api/account/sessions/others` | Signed in | Revoke all except current session |
| `DELETE /api/account/sessions/:id` | Signed in | Revoke one owned session |
| `POST /api/account/avatar` | Signed in | Multipart `file`, image up to 2 MB |
| `GET /api/account/avatar` | Signed in | Own photo bytes |
| `DELETE /api/account/avatar` | Signed in | Remove own photo |
| `GET /api/audit?page=1&limit=15&action=category.delete` | Admin | Paginated administrative activity |

## File map

Paths below are relative to the combined repository. In separate repositories, remove the leading `server/` or `client/`.

| File | Responsibility |
| --- | --- |
| `server/src/models/User.js` | Verification, recovery, password version, and profile fields |
| `server/src/models/Session.js` | One record per login; hashed refresh token and expiry |
| `server/src/models/EmailJob.js` | Encrypted delivery payload, retries, lease, expiry |
| `server/src/models/AuditEvent.js` | Administrative activity records |
| `server/src/utils/email.js` | Encryption, file/SMTP/HTTPS transports, queue worker |
| `server/src/utils/audit.js` | Writes selected audit data |
| `server/src/controllers/account.js` | Recovery, verification, settings, sessions, photos, audit listing |
| `server/src/validators/account.js` | Strict request schemas |
| `server/src/routes/account.js` | Signed-in endpoints and sensitive-action limits |
| `server/src/routes/auth.js` | Public recovery/verification routes and limits |
| `server/src/middleware/auth.js` | Checks user, session, and password/security version |
| `server/src/utils/generateToken.js` | JWT session ID/version and cookie helpers |
| `server/src/config/env.js` | Email environment validation |
| `server/src/server.js` | Starts the mail worker after MongoDB connects |
| `client/src/api/account.api.js` | Frontend calls to new endpoints |
| `client/src/pages/public/AccountLink.jsx` | Forgot/reset/verification forms |
| `client/src/pages/user/Profile.jsx` | Shared admin/user account settings |
| `client/src/pages/admin/ActivityLog.jsx` | Filtered, paginated activity table |
| `server/tests/account.test.js`, `email.test.js`, `media.test.js` | Backend integration and provider-adapter coverage |
| `client/src/tests/Account.test.jsx` | Browser-form interactions and activity UI |

The rate limiters use memory per server process. For multiple replicas, use a shared rate-limit store and configure Express's proxy trust for your actual hosting topology; do not blindly trust all forwarded headers.

Automated tests use disposable MongoDB instances and mocked mail delivery, never real inboxes or your configured database. Real provider delivery and hosted browser checks require your deployment credentials. The implementation follows the [OWASP account recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) for expiring, one-use recovery links and generic public responses.
