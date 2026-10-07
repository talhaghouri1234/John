export default function Loader() {
  return (
    <div className="loading-skeleton" role="status" aria-label="Loading">
      <div className="loading">
        <span className="spinner" />
        Loading your workspace…
      </div>
      <div className="skeleton-grid" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <div className="skeleton" key={item}>
            <div />
            <div />
            <div />
          </div>
        ))}
      </div>
    </div>
  );
}
