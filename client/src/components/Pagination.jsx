import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function Pagination({ pagination, onPageChange }) {
  const { page, pages, total } = pagination;
  return (
    <div className="pagination">
      <span>
        {total} {total === 1 ? 'result' : 'results'} · Page {page} of {Math.max(1, pages)}
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
