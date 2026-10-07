import { test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryForm from '../components/CategoryForm.jsx';

test('invalid category name prevents submission', async () => {
  const submit = vi.fn();
  const user = userEvent.setup();
  render(<CategoryForm onSubmit={submit} onCancel={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'Save category' }));
  expect(await screen.findByText('Enter at least 2 characters')).toBeVisible();
  expect(submit).not.toHaveBeenCalled();
});

test('editing a category preserves initial fields and submits the selected status', async () => {
  const submit = vi.fn();
  const cancel = vi.fn();
  const user = userEvent.setup();
  render(
    <CategoryForm
      initialValues={{ name: 'Books', description: 'Read more', image: '', isActive: false }}
      onSubmit={submit}
      onCancel={cancel}
    />,
  );
  expect(screen.getByLabelText('Category name')).toHaveValue('Books');
  expect(screen.getByLabelText('Active category')).not.toBeChecked();
  await user.clear(screen.getByLabelText('Category name'));
  await user.type(screen.getByLabelText('Category name'), 'New Books');
  await user.click(screen.getByRole('button', { name: 'Save category' }));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][0]).toEqual({
    name: 'New Books',
    description: 'Read more',
    image: '',
    isActive: false,
  });
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(cancel).toHaveBeenCalledOnce();
});
