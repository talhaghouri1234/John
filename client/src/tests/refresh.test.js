import { test, expect, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from './server.js';
import { api } from '../api/axios.js';

test('concurrent unauthorized requests share a single refresh then retry', async () => {
  let refreshed = false,
    calls = 0;
  server.use(
    http.get('*/api/probe', () =>
      HttpResponse.json({ ok: refreshed }, { status: refreshed ? 200 : 401 }),
    ),
    http.post('*/api/auth/refresh', async () => {
      calls++;
      await delay(30);
      refreshed = true;
      return HttpResponse.json({ success: true });
    }),
  );
  const responses = await Promise.all([api.get('/probe'), api.get('/probe')]);
  expect(responses.every((response) => response.status === 200)).toBe(true);
  expect(calls).toBe(1);
});
test('failed refresh expires the session and does not retry indefinitely', async () => {
  const expired = vi.fn();
  window.addEventListener('auth:expired', expired);
  server.use(http.get('*/api/probe', () => HttpResponse.json({}, { status: 401 })));
  await expect(api.get('/probe')).rejects.toMatchObject({ response: { status: 401 } });
  expect(expired).toHaveBeenCalledOnce();
  window.removeEventListener('auth:expired', expired);
});
