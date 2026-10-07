import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryTable from '../components/CategoryTable.jsx';

const category = {
  _id: '1',
  name: 'Books',
  description: 'Read more',
  isActive: true,
  createdAt: '2026-10-06T00:00:00Z',
};
test('table renders category data and supports edit delete and next-page actions', async () => {
  const edit = vi.fn(),
    remove = vi.fn(),
    page = vi.fn();
  const user = userEvent.setup();
  render(
    <CategoryTable
      categories={[category]}
      pagination={{ page: 1, pages: 2, total: 2 }}
      onPageChange={page}
      onEdit={edit}
      onDelete={remove}
    />,
  );
  expect(screen.getByText('Books')).toBeVisible();
  expect(screen.getByText('Active')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Edit Books' }));
  expect(edit).toHaveBeenCalledWith(category);
  await user.click(screen.getByRole('button', { name: 'Delete Books' }));
  expect(remove).toHaveBeenCalledWith(category);
  await user.click(screen.getByRole('button', { name: 'Next page' }));
  expect(page).toHaveBeenCalledWith(2);
});
test('empty read-only table has no mutation controls', () => {
  render(<CategoryTable categories={[]} />);
  expect(screen.getByText('No categories found')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
