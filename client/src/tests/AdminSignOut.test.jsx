import { test, expect } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from './server.js';
import { AuthProvider } from '../context/AuthContext.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';

test('admin header sign-out revokes session, clears cached data and redirects to login', async () => {
  let logoutCalls = 0;
  server.use(
    http.get('*/api/auth/me', () =>
      HttpResponse.json({ user: { name: 'Admin', email: 'admin@example.com', role: 'admin' } }),
    ),
    http.post('*/api/auth/logout', async () => {
      logoutCalls += 1;
      await delay(100);
      return HttpResponse.json({ success: true });
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['private-data'], ['admin-only']);
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />} />
            </Route>
            <Route path="/login" element={<h1>Login page</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
  const header = await screen.findByRole('banner');
  const user = userEvent.setup();
  await user.click(within(header).getByRole('button', { name: 'Sign out', exact: true }));
  expect(within(header).getByRole('button', { name: 'Signing out…' })).toBeDisabled();
  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeVisible();
  await waitFor(() => expect(client.getQueryData(['private-data'])).toBeUndefined());
  expect(logoutCalls).toBe(1);
});
