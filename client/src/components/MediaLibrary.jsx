import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { mediaApi } from '../api/media.api.js';
import { errorMessage } from '../api/axios.js';
import MediaCard from './MediaCard.jsx';
import MediaUpload from './MediaUpload.jsx';
import Pagination from './Pagination.jsx';
import Modal from './Modal.jsx';
import Loader from './Loader.jsx';
import ErrorState from './ErrorState.jsx';

export default function MediaLibrary({ admin = false, compact = false }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [deleting, setDeleting] = useState(null);
  const client = useQueryClient();
  const params = { page, limit: compact ? 3 : 6, search, ...(kind ? { kind } : {}) };
  const query = useQuery({ queryKey: ['media', params], queryFn: () => mediaApi.list(params) });
  const remove = useMutation({
    mutationFn: mediaApi.remove,
    onSuccess: async () => {
      setDeleting(null);
      toast.success('Media deleted');
      if (query.data?.media.length === 1 && page > 1) setPage(page - 1);
      await client.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  return (
    <section aria-label="Media library">
      {admin && (
        <MediaUpload
          onUploaded={async () => {
            setPage(1);
            toast.success('Media uploaded');
            await client.invalidateQueries({ queryKey: ['media'] });
          }}
        />
      )}
      {!compact && (
        <div className="toolbar media-toolbar">
          <input
            aria-label="Search media"
            placeholder="Search files…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Filter media type"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
        </div>
      )}
      {query.isPending ? (
        <Loader />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={query.refetch} />
      ) : query.data.media.length ? (
        <>
          <div className="media-grid">
            {query.data.media.map((media) => (
              <MediaCard key={media._id} media={media} onDelete={admin ? setDeleting : undefined} />
            ))}
          </div>
          {!compact && <Pagination pagination={query.data.pagination} onPageChange={setPage} />}
        </>
      ) : (
        <div className="card empty">
          <h3>{search || kind ? 'No matching files' : 'Your media library starts here'}</h3>
          <p>
            {admin
              ? 'Upload an image, video, or document to share with your workspace.'
              : 'Files shared by your administrator will appear here.'}
          </p>
        </div>
      )}
      {deleting && (
        <Modal title="Delete media?" busy={remove.isPending} onClose={() => setDeleting(null)}>
          <p>
            Permanently delete <strong>{deleting.name}</strong> and its stored file? Everyone will
            lose access to it.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={remove.isPending}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button
              className="button danger"
              disabled={remove.isPending}
              onClick={() => remove.mutate(deleting._id)}
            >
              {remove.isPending ? 'Deleting…' : 'Delete file'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
