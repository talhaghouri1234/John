# Media library and storage adapters

Admins upload and permanently delete files at `/admin/media`. All active signed-in
users can browse, preview, and download them at `/user/media`. Both dashboards show
the latest three uploads. This is a shared workspace library, not per-user private storage.

## Try it locally

1. Run `npm run dev` and sign in as `admin@example.com` / `Admin@123`.
2. Open **Media library**, choose a file, and select **Upload file**.
3. Sign out and sign in as `user1@example.com` / `User@123`. The file appears on
   the dashboard and Media library, with previews for images/videos and downloads
   for documents. User accounts have no upload or delete permission.
4. Sign back in as admin to remove the file using its delete button and confirmation.

Files are written to `server/uploads/` (created automatically and Git-ignored).
MongoDB stores metadata only. The default path is resolved relative to the server
source, independent of the shell directory. Set `MEDIA_UPLOAD_DIR` in `server/.env`
to an **absolute path** for a persistent external volume. Keep this directory
private and outside web roots. Back it up together with MongoDB. Seed commands do
not remove media or local files; seeding users may leave old uploader references.

Accepted formats: JPEG, PNG, WebP, GIF; MP4 and WebM; PDF, DOCX, XLSX and PPTX.
One file per request, up to 25 MiB. HTML, SVG, executable files and archives are
not accepted. Office documents are recognized by their container type. File bytes
must match the declared MIME type. Detection is a signature check, not a malware
scan or a full decoder: add scanning/quarantine before storing untrusted uploads
in a public service. Video codecs must also be supported by the user's browser.

## API

All endpoints require access cookies and reject disabled users. Writes follow the
same origin checks as the rest of the API. Uploads are limited to 10 per minute
per admin using an in-process limiter.

| Method | Endpoint | Access | Request / response |
| --- | --- | --- | --- |
| GET | `/api/media` | Signed in | `page`, `limit` (1–24), `search`, `kind` (`image`, `video`, `document`); returns `media` and `pagination` |
| POST | `/api/media` | Admin | Multipart form with exactly one `file`; returns `{ success, media }` with status 201 |
| GET | `/api/media/:id/file` | Signed in | Binary response with correct MIME, private/no-store, range support; documents always download |
| DELETE | `/api/media/:id` | Admin | Removes stored file then metadata; success 200 |

For an image/video, `?download=1` requests an attachment. A missing/empty upload
returns 400, unsupported content 415, oversize 413, unauthorized 401/403, and
missing metadata/file 404. Files have generated UUID names: original names are
display labels, never filesystem paths. Storage keys/providers are omitted from
public metadata. The folder is deliberately not mounted with `express.static`.

Example using the existing authenticated Axios instance:

```js
const form = new FormData();
form.append('file', selectedFile);
const { data } = await api.post('/media', form);
// Do not set Content-Type: the browser supplies the multipart boundary.
const response = await api.get(`/media/${data.media._id}/file`, {
  responseType: 'blob',
});
const previewUrl = URL.createObjectURL(response.data);
// Revoke this object URL when the preview is removed.
```

The UI fetches authenticated blobs through Axios so expired sessions use the
existing refresh interceptor. It revokes object URLs and cancels outstanding
preview requests on unmount. This simple implementation buffers files up to the
25 MiB cap on both server and client. For large videos or high concurrency, use
streaming/staged uploads, shared rate limits and quotas. The local HTTP endpoint
supports ranges, while the current UI loads a complete blob for preview.

## Replace local storage with R2

`server/src/storage/index.js` is the adapter registry. Each MongoDB record retains
its `provider` and `key`; keep the local adapter registered during migration.
Controllers use the following contract:

```js
// save receives validated bytes and returns a unique key, never a public URL.
await adapter.save({ buffer, extension, mimeType }); // => string
await adapter.remove(key); // idempotent if the object is already absent
await adapter.send(req, res, media); // authenticated binary response
```

To add an R2 adapter, install `@aws-sdk/client-s3` in the server workspace. Follow
[Cloudflare's official JavaScript SDK setup](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)
for its endpoint, credentials and `auto` region. Keep secrets in server environment
variables, never Vite variables. Use `PutObjectCommand` for `save` and
`DeleteObjectCommand` for `remove`. Generate UUID keys just as the local adapter does.

Implement `send` with `GetObjectCommand`, forwarding `req.headers.range` if present,
streaming the returned body, setting its length/range headers and 200/206 status.
Preserve the local adapter's MIME, attachment and private-cache behavior. Map missing
objects to 404 and invalid ranges to 416. Keep the bucket private. Proxy streaming
preserves the current client contract without exposing credentials or public URLs.

Register `{ local, r2 }` in `storageFor(provider)`, then select `r2` as
`uploadProvider` for new records. Existing `local` records still read from disk.
For migration, copy each file, verify bytes/checksum, update that record's provider
and key, and only then remove the old copy. No R2 account is needed to run this starter;
R2 integration is intentionally left as a consumer extension, not enabled or tested here.

On metadata-insert failure, the controller removes the newly written object.
On storage-delete failure, it retains metadata so deletion can be retried. Filesystem
and database operations are not a distributed transaction: production consumers
should add an orphan reconciliation job for process crashes or persistent failures.
