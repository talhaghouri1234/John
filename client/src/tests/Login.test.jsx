import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from './server.js';
import { AuthProvider } from '../context/AuthContext.jsx';
import Login from '../pages/public/Login.jsx';

function renderLogin() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AuthProvider><MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<Login />} /><Route path="/admin/dashboard" element={<h1>Admin dashboard</h1>} /><Route path="/user/dashboard" element={<h1>User dashboard</h1>} /></Routes></MemoryRouter></AuthProvider></QueryClientProvider>);
}

test('login validates email and password before sending credentials', async () => {
  let sent = 0;
  server.use(http.post('*/api/auth/login', () => { sent++; return HttpResponse.json({}); }));
  const user = userEvent.setup();
  renderLogin();
  await user.click(await screen.findByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Enter a valid email address')).toBeVisible();
  expect(screen.getByText('Enter your password')).toBeVisible();
  expect(sent).toBe(0);
});

test.each(['admin', 'user'])('successful %s login redirects to the correct dashboard', async (role) => {
  server.use(http.post('*/api/auth/login', async ({ request }) => {
    const body = await request.json();
    expect(body).toEqual({ email: 'test@example.com', password: 'Password123!' });
    return HttpResponse.json({ success: true, user: { _id: '1', name: 'Test User', email: body.email, role } });
  }));
  const user = userEvent.setup();
  renderLogin();
  await screen.findByRole('button', { name: 'Sign in' });
  await user.type(screen.getByLabelText('Email address'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'Password123!');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByRole('heading', { name: role === 'admin' ? 'Admin dashboard' : 'User dashboard' })).toBeVisible();
});

test('existing session redirects away from the login page', async () => {
  server.use(http.get('*/api/auth/me', () => HttpResponse.json({ user: { _id: '1', name: 'Admin', role: 'admin' } })));
  renderLogin();
  expect(await screen.findByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
});
