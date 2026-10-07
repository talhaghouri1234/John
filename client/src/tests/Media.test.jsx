import { test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MediaUpload from '../components/MediaUpload.jsx';
import MediaLibrary from '../components/MediaLibrary.jsx';
import MediaCard from '../components/MediaCard.jsx';
import { mediaApi } from '../api/media.api.js';

test('upload requires a file and sends the selected file with progress', async () => {
  const user = userEvent.setup();
  const uploaded = vi.fn();
  const upload = vi
    .spyOn(mediaApi, 'upload')
    .mockImplementation(async (_file, progress) => progress(100));
  render(<MediaUpload onUploaded={uploaded} />);
  await user.click(screen.getByRole('button', { name: 'Upload file' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a file');
  const file = new File(['test'], 'photo.png', { type: 'image/png' });
  await user.upload(screen.getByLabelText('Choose media'), file);
  await user.click(screen.getByRole('button', { name: 'Upload file' }));
  await waitFor(() => expect(uploaded).toHaveBeenCalledOnce());
  expect(upload.mock.calls[0][0]).toBe(file);
  expect(screen.getByLabelText('Choose media').files.length).toBe(0);
});

test('oversized file is blocked locally and server errors remain visible', async () => {
  const user = userEvent.setup();
  const upload = vi
    .spyOn(mediaApi, 'upload')
    .mockRejectedValue({
      response: { data: { message: 'File contents do not match a supported file type' } },
    });
  render(<MediaUpload onUploaded={vi.fn()} />);
  const oversized = new File(['small'], 'large.png', { type: 'image/png' });
  Object.defineProperty(oversized, 'size', { value: 26 * 1024 * 1024 });
  await user.upload(screen.getByLabelText('Choose media'), oversized);
  await user.click(screen.getByRole('button', { name: 'Upload file' }));
  expect(screen.getByRole('alert')).toHaveTextContent('25 MB');
  expect(upload).not.toHaveBeenCalled();
  await user.upload(
    screen.getByLabelText('Choose media'),
    new File(['bad'], 'fake.png', { type: 'image/png' }),
  );
  await user.click(screen.getByRole('button', { name: 'Upload file' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('File contents');
});

const documentMedia = {
  _id: 'abc',
  name: 'Guide.pdf',
  kind: 'document',
  size: 100,
  createdAt: '2026-10-07',
};
const mountLibrary = (admin) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MediaLibrary admin={admin} />
    </QueryClientProvider>,
  );

test('read-only library has documents and filters but no upload or deletion controls', async () => {
  const list = vi
    .spyOn(mediaApi, 'list')
    .mockResolvedValue({ media: [documentMedia], pagination: { page: 1, pages: 1, total: 1 } });
  const user = userEvent.setup();
  mountLibrary(false);
  expect(await screen.findByText('Guide.pdf')).toBeVisible();
  expect(screen.queryByLabelText('Choose media')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Delete Guide.pdf' })).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Filter media type'), 'document');
  await waitFor(() =>
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'document', page: 1 })),
  );
});

test('admin must confirm deletion before the API is called', async () => {
  vi.spyOn(mediaApi, 'list').mockResolvedValue({
    media: [documentMedia],
    pagination: { page: 1, pages: 1, total: 1 },
  });
  const remove = vi.spyOn(mediaApi, 'remove').mockResolvedValue({ success: true });
  const user = userEvent.setup();
  mountLibrary(true);
  await user.click(await screen.findByRole('button', { name: 'Delete Guide.pdf' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Delete file' }));
  await waitFor(() => expect(remove).toHaveBeenCalled());
  expect(remove.mock.calls[0][0]).toBe('abc');
});

test('image preview uses authenticated blob request and releases its URL on unmount', async () => {
  const create = vi.fn(() => 'blob:preview');
  const revoke = vi.fn();
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = create;
  URL.revokeObjectURL = revoke;
  vi.spyOn(mediaApi, 'file').mockResolvedValue(new Blob(['image'], { type: 'image/png' }));
  try {
    const view = render(
      <MediaCard media={{ ...documentMedia, kind: 'image', name: 'Photo.png' }} />,
    );
    expect(await screen.findByRole('img', { name: 'Photo.png' })).toHaveAttribute(
      'src',
      'blob:preview',
    );
    view.unmount();
    expect(revoke).toHaveBeenCalledWith('blob:preview');
  } finally {
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
  }
});
