import { test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FoodForm from '../components/FoodForm.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from './server.js';
import { http, HttpResponse } from 'msw';

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

test('food form validates required fields and submits properly', async () => {
  server.use(
    http.get('*/api/categories', () => {
      return HttpResponse.json({
        success: true,
        categories: [{ _id: '507f1f77bcf86cd799439011', name: 'Italian Pasta' }],
        pagination: { total: 1, page: 1, pages: 1 },
      });
    }),
  );

  const submit = vi.fn();
  const user = userEvent.setup();

  renderWithClient(
    <FoodForm
      initialValues={{
        name: 'Gourmet Burger',
        price: 12.99,
        category: '507f1f77bcf86cd799439011',
        description: 'Delicious burger',
        isAvailable: true,
      }}
      onSubmit={submit}
      onCancel={() => {}}
    />,
  );

  expect(screen.getByLabelText('Food item name *')).toHaveValue('Gourmet Burger');
  expect(screen.getByLabelText('Price ($) *')).toHaveValue(12.99);

  await user.click(screen.getByRole('button', { name: 'Save food item' }));
  await waitFor(() => expect(submit).toHaveBeenCalled());

  expect(submit.mock.calls[0][0].name).toBe('Gourmet Burger');
  expect(submit.mock.calls[0][0].price).toBe(12.99);
});

test('blank price is required rather than silently converted to zero', async () => {
  server.use(http.get('*/api/categories', () => HttpResponse.json({ categories: [{ _id: '507f1f77bcf86cd799439011', name: 'Pasta' }] })));
  const submit = vi.fn();
  renderWithClient(<FoodForm initialValues={{ name: 'Pasta', category: '507f1f77bcf86cd799439011' }} onSubmit={submit} onCancel={() => {}} />);
  await screen.findByRole('option', { name: 'Pasta' });
  await userEvent.click(screen.getByRole('button', { name: 'Save food item' }));
  expect(await screen.findByText('Enter a valid price')).toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
});

test('food photo and category are submitted together as multipart data', async () => {
  URL.createObjectURL = vi.fn(() => 'blob:food-preview');
  URL.revokeObjectURL = vi.fn();
  server.use(http.get('*/api/categories', () => HttpResponse.json({ categories: [{ _id: '507f1f77bcf86cd799439011', name: 'Pasta' }] })));
  const submit = vi.fn();
  const user = userEvent.setup();
  renderWithClient(<FoodForm initialValues={{ name: 'Pasta', price: 8, category: '507f1f77bcf86cd799439011' }} onSubmit={submit} onCancel={() => {}} />);
  await screen.findByRole('option', { name: 'Pasta' });
  const file = new File(['photo'], 'pasta.png', { type: 'image/png' });
  await user.upload(document.getElementById('food-file-upload'), file);
  await user.click(screen.getByRole('button', { name: 'Save food item' }));
  await waitFor(() => expect(submit).toHaveBeenCalledOnce());
  expect(submit.mock.calls[0][0].get('image')).toBe(file);
  expect(submit.mock.calls[0][0].get('category')).toBe('507f1f77bcf86cd799439011');
  expect(submit.mock.calls[0][0].get('price')).toBe('8');
});
