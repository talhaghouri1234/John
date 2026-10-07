import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import RoleRoute from '../routes/RoleRoute.jsx';

function route(user, loading = false) {
  render(
    <AuthContext.Provider value={{ user, loading }}>
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute>
                <RoleRoute role="admin">
                  <h1>Private content</h1>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<h1>Login required</h1>} />
          <Route path="/unauthorized" element={<h1>Access denied</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
test('anonymous visitor is redirected to login', () => {
  route(null);
  expect(screen.getByText('Login required')).toBeVisible();
});
test('wrong role is redirected to unauthorized', () => {
  route({ role: 'user' });
  expect(screen.getByText('Access denied')).toBeVisible();
});
test('admin can access admin route', () => {
  route({ role: 'admin' });
  expect(screen.getByText('Private content')).toBeVisible();
});
test('session loading does not expose protected content', () => {
  route(null, true);
  expect(screen.getByRole('status')).toBeVisible();
  expect(screen.queryByText('Private content')).not.toBeInTheDocument();
});
