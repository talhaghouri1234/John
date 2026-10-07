import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('*/api/auth/me', () =>
    HttpResponse.json({ success: false, message: 'Authentication required' }, { status: 401 }),
  ),
  http.post('*/api/auth/refresh', () =>
    HttpResponse.json({ success: false, message: 'Session expired' }, { status: 401 }),
  ),
);
