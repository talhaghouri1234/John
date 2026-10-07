import { useState } from 'react';
import { Upload } from 'lucide-react';
import { mediaApi } from '../api/media.api.js';
import { errorMessage } from '../api/axios.js';

export const ACCEPTED_MEDIA = '.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.pdf,.docx,.xlsx,.pptx';
export default function MediaUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (!file) return setError('Choose a file first.');
    if (file.size > 25 * 1024 * 1024) return setError('File must be 25 MB or smaller.');
    setBusy(true);
    setError('');
    setProgress(0);
    try {
      await mediaApi.upload(file, setProgress);
      setFile(null);
      event.target.reset();
      await onUploaded();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="card media-upload" onSubmit={submit}>
      <div>
        <p className="eyebrow">Share something useful</p>
        <h2>Upload to your library</h2>
        <p id="media-help">
          Images (JPG, PNG, WebP, GIF), videos (MP4, WebM), and documents (PDF, DOCX, XLSX, PPTX).
          One file at a time, up to 25 MB. Visible to all signed-in users.
        </p>
      </div>
      <label htmlFor="media-file">Choose media</label>
      <input
        id="media-file"
        type="file"
        accept={ACCEPTED_MEDIA}
        disabled={busy}
        aria-describedby="media-help"
        onChange={(event) => {
          setFile(event.target.files[0] || null);
          setError('');
        }}
      />
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {busy && (
        <div role="status">
          <progress value={progress} max="100" aria-label="Upload progress" />
          <span>{progress < 100 ? `Uploading ${progress}%` : 'Processing file…'}</span>
        </div>
      )}
      <button className="button" disabled={busy} type="submit">
        <Upload size={17} />
        {busy ? 'Uploading…' : 'Upload file'}
      </button>
    </form>
  );
}
