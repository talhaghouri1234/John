import { test, expect, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from './server.js';
import { api } from '../api/axios.js';
import { authApi } from '../api/auth.api.js';

test('concurrent unauthorized requests share a single refresh then retry', async () => {
  let refreshed = false,
    calls = 0;
  server.use(
    http.get('*/api/probe', () =>
      HttpResponse.json({ ok: refreshed }, { status: refreshed ? 200 : 401 }),
    ),
    http.post('*/api/auth/refresh', async ({ request }) => {
      expect(request.headers.get('x-csrf-protection')).toBe('1');
      calls++;
      await delay(30);
      refreshed = true;
      return HttpResponse.json({ success: true });
    }),
  );
  const responses = await Promise.all([api.get('/probe'), api.get('/probe')]);
  expect(responses.every((response) => response.status === 200)).toBe(true);
  expect(responses.every((response) => response.config.withCredentials && response.config.headers.get('X-CSRF-Protection') === '1')).toBe(true);
  expect(calls).toBe(1);
});

test('auth and multipart requests use the configured API with credentials and CSRF headers', async () => {
  expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API_URL || '/api');
  expect(api.defaults.withCredentials).toBe(true);
  const paths = [];
  // Observe the real XHR calls: the Node-20-compatible MSW release loses
  // headers in its Fetch representation of requests that have a body.
  const sentHeaders = vi.spyOn(XMLHttpRequest.prototype, 'setRequestHeader');
  let uploadType;
  server.use(
    http.post('*/api/auth/:action', ({ params }) => {
      paths.push(params.action);
      return HttpResponse.json({ user: { _id: '1' } });
    }),
    http.post('*/api/media', ({ request }) => {
      uploadType = request.headers.get('content-type');
      return HttpResponse.json({ success: true });
    }),
  );
  await authApi.register({});
  await authApi.login({});
  await authApi.logout();
  const form = new FormData();
  form.append('file', new File(['file'], 'sample.txt'));
  await api.post('/media', form);
  expect(paths).toEqual(['register', 'login', 'logout']);
  expect(sentHeaders.mock.calls.filter(([name]) => name === 'X-CSRF-Protection')).toEqual([
    ['X-CSRF-Protection', '1'], ['X-CSRF-Protection', '1'],
    ['X-CSRF-Protection', '1'], ['X-CSRF-Protection', '1'],
  ]);
  expect(sentHeaders.mock.contexts.every((xhr) => xhr.withCredentials)).toBe(true);
  expect(uploadType).toContain('multipart/form-data; boundary=');
});
test('failed refresh expires the session and does not retry indefinitely', async () => {
  const expired = vi.fn();
  window.addEventListener('auth:expired', expired);
  server.use(http.get('*/api/probe', () => HttpResponse.json({}, { status: 401 })));
  await expect(api.get('/probe')).rejects.toMatchObject({ response: { status: 401 } });
  expect(expired).toHaveBeenCalledOnce();
  window.removeEventListener('auth:expired', expired);
});
