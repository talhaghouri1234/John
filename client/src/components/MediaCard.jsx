import { useEffect, useState } from 'react';
import { FileText, Image, Video, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { mediaApi } from '../api/media.api.js';

export default function MediaCard({ media, onDelete }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    if (media.kind === 'document') return;
    const controller = new AbortController();
    let objectUrl;
    setUrl('');
    setError(false);
    mediaApi
      .file(media._id, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media._id, media.kind, attempt]);
  const download = async () => {
    setDownloading(true);
    try {
      const blob = await mediaApi.file(media._id);
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = media.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch {
      toast.error('Could not download this file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };
  const Icon = media.kind === 'image' ? Image : media.kind === 'video' ? Video : FileText;
  return (
    <article className="media-card card">
      <div className="media-preview">
        {media.kind === 'document' ? (
          <FileText size={48} strokeWidth={1.25} />
        ) : error ? (
          <button className="button secondary" onClick={() => setAttempt(attempt + 1)}>
            Retry preview
          </button>
        ) : !url ? (
          <span role="status">Loading preview…</span>
        ) : media.kind === 'image' ? (
          <img src={url} alt={media.name} onError={() => setError(true)} />
        ) : (
          <video
            src={url}
            controls
            preload="metadata"
            aria-label={media.name}
            onError={() => setError(true)}
          />
        )}
      </div>
      <div className="media-info">
        <span className="badge">
          <Icon size={13} /> {media.kind}
        </span>
        <h3 title={media.name}>{media.name}</h3>
        <p className="muted">
          {(media.size / 1024 / 1024).toFixed(2)} MB ·{' '}
          {new Date(media.createdAt).toLocaleDateString()}
        </p>
        <div className="media-actions">
          <button className="button secondary" disabled={downloading} onClick={download}>
            <Download size={15} />
            {downloading ? 'Downloading…' : 'Download'}
          </button>
          {onDelete && (
            <button
              className="icon-button"
              aria-label={`Delete ${media.name}`}
              onClick={() => onDelete(media)}
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
