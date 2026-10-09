import { test, expect, afterAll, jest } from '@jest/globals';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from './request.js';
import Media from '../src/models/Media.js';
import { MAX_MEDIA_BYTES } from '../src/middleware/upload.js';

const root = await mkdtemp(path.join(tmpdir(), 'mern-media-test-'));
process.env.MEDIA_UPLOAD_DIR = root;
const { default: app } = await import('../src/app.js');
const { session } = await import('./helpers.js');
const { storage } = await import('../src/storage/index.js');
afterAll(async () => {
  if (path.dirname(root) !== path.resolve(tmpdir()) || !path.basename(root).startsWith('mern-media-test-')) throw new Error('Unexpected test directory');
  await rm(root, { recursive: true, force: true });
});
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const upload = (agent, name = 'sample.png') => agent.post('/api/media').attach('file', png, { filename: name, contentType: 'image/png' });

test('admin uploads private image; user lists and reads ranges; deletion removes disk file', async () => {
  const { agent } = await session();
  const { agent: reader } = await session('user');
  const created = await upload(agent);
  expect(created.status).toBe(201);
  expect(created.body.media).toMatchObject({ kind: 'image', size: png.length, name: 'sample.png' });
  expect(created.body.media.key).toBeUndefined();
  const id = created.body.media._id;
  const list = await reader.get('/api/media');
  expect(list.body.pagination.total).toBe(1);
  expect(list.body.media[0].provider).toBeUndefined();
  expect((await request(app).get(`/api/media/${id}/file`)).status).toBe(401);
  const file = await reader.get(`/api/media/${id}/file`).set('Range', 'bytes=0-7');
  expect(file.status).toBe(206);
  expect(file.headers['content-type']).toContain('image/png');
  expect(file.headers['cache-control']).toBe('private, no-store');
  expect((await reader.delete(`/api/media/${id}`)).status).toBe(403);
  const stored = await Media.findById(id).select('+key');
  expect((await agent.delete(`/api/media/${id}`)).status).toBe(200);
  expect(await readdir(root)).not.toContain(stored.key);
  expect((await reader.get(`/api/media/${id}/file`)).status).toBe(404);
});

test('only admins can upload; forged images, HTML, empty and extra files are rejected', async () => {
  const { agent } = await session();
  const { agent: reader } = await session('user');
  expect((await upload(request(app))).status).toBe(401);
  expect((await upload(reader)).status).toBe(403);
  expect((await agent.post('/api/media')).status).toBe(400);
  expect((await agent.post('/api/media').attach('file', Buffer.from('<script>alert(1)</script>'), 'fake.png')).status).toBe(415);
  expect((await agent.post('/api/media').attach('file', Buffer.from('<html/>'), 'page.html')).status).toBe(415);
  expect((await agent.post('/api/media').attach('file', Buffer.alloc(0), 'empty.png')).status).toBe(400);
  expect((await upload(agent).attach('file', png, 'second.png')).status).toBe(400);
});

test('oversized uploads return 413 without creating metadata', async () => {
  const { agent } = await session();
  const result = await agent.post('/api/media').attach('file', Buffer.alloc(MAX_MEDIA_BYTES + 1), 'big.png');
  expect(result.status).toBe(413);
  expect(await Media.countDocuments()).toBe(0);
});

test('PDF downloads as attachment; pagination, literal search, filtering and ids are validated', async () => {
  const { agent } = await session();
  await upload(agent, 'photo(1).png');
  const pdf = await agent.post('/api/media').attach('file', Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF'), 'guide.pdf');
  expect(pdf.status).toBe(201);
  expect(pdf.body.media.kind).toBe('document');
  const response = await agent.get(`/api/media/${pdf.body.media._id}/file`);
  expect(response.headers['content-disposition']).toContain('attachment');
  expect((await agent.get('/api/media?kind=document&limit=1')).body.pagination.total).toBe(1);
  expect((await agent.get('/api/media').query({ search: '(1)' })).body.pagination.total).toBe(1);
  expect((await agent.get('/api/media?limit=1000')).status).toBe(400);
  expect((await agent.get('/api/media/not-an-id/file')).status).toBe(400);
  expect((await agent.delete('/api/media/507f1f77bcf86cd799439011')).status).toBe(404);
});

test('failed database insert cleans file and storage failure keeps metadata for retry', async () => {
  const { agent } = await session();
  const before = await readdir(root);
  const create = jest.spyOn(Media, 'create').mockRejectedValueOnce(new Error('Database unavailable'));
  expect((await upload(agent)).status).toBe(500);
  create.mockRestore();
  expect(await readdir(root)).toEqual(before);
  const created = await upload(agent);
  const remove = jest.spyOn(storage, 'remove').mockRejectedValueOnce(new Error('Disk unavailable'));
  expect((await agent.delete(`/api/media/${created.body.media._id}`)).status).toBe(500);
  remove.mockRestore();
  expect(await Media.findById(created.body.media._id)).not.toBeNull();
});
