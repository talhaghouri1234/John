import MediaLibrary from '../../components/MediaLibrary.jsx';

export default function ManageMedia() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A shared collection</p>
          <h1>Media library</h1>
          <p>Bring your workspace to life with images, videos, and documents.</p>
        </div>
      </div>
      <MediaLibrary admin />
    </>
  );
}
