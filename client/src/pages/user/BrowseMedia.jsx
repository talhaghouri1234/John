import MediaLibrary from '../../components/MediaLibrary.jsx';

export default function BrowseMedia() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Made to be shared</p>
          <h1>Media library</h1>
          <p>Explore and download resources shared with your workspace.</p>
        </div>
      </div>
      <MediaLibrary />
    </>
  );
}
