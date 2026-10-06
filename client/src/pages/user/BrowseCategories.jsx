import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories.js';
import CategoryCard from '../../components/CategoryCard.jsx';
import Pagination from '../../components/Pagination.jsx';
import Loader from '../../components/Loader.jsx';
import ErrorState from '../../components/ErrorState.jsx';

export default function BrowseCategories() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const query = useCategories({ page, limit: 6, search, sort });
  return <><div className="page-heading"><div><p className="eyebrow">Room to explore</p><h1>Discover categories</h1><p>A thoughtfully organized world of possibilities.</p></div></div><div className="toolbar"><input aria-label="Search categories" placeholder="Find something interesting…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><select aria-label="Sort categories" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="name">Name A–Z</option><option value="-name">Name Z–A</option><option value="-createdAt">Newest first</option></select></div>{query.isPending ? <Loader /> : query.isError ? <ErrorState error={query.error} retry={query.refetch} /> : <>{query.data.categories.length ? <div className="category-grid">{query.data.categories.map((category) => <CategoryCard key={category._id} category={category} />)}</div> : <div className="card empty"><h3>No matches just yet.</h3><p>Try a different search to find what you’re looking for.</p></div>}<Pagination pagination={query.data.pagination} onPageChange={setPage} /></>}</>;
}
