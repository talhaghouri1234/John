import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderOpen } from 'lucide-react';
import useAuth from '../../hooks/useAuth.js';
import { useCategories } from '../../hooks/useCategories.js';
import CategoryCard from '../../components/CategoryCard.jsx';
import Loader from '../../components/Loader.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import MediaLibrary from '../../components/MediaLibrary.jsx';

export default function UserDashboard() {
  const { user } = useAuth();
  const query = useCategories({ limit: 3, isActive: true });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A fresh perspective</p>
          <h1>
            Hello, {user.name.split(' ')[0]} <span className="wave">✳</span>
          </h1>
          <p>Your space to discover, explore, and stay connected.</p>
        </div>
        <Link className="button" to="/user/categories">
          Explore categories <ArrowUpRight size={17} />
        </Link>
      </div>
      <section className="workspace-banner">
        <div>
          <p className="eyebrow">Curated for your curiosity</p>
          <h2>
            Find a little inspiration.
            <br />
            Discover something new.
          </h2>
          <p>
            {query.data
              ? `${query.data.pagination.total} active categories are ready to explore.`
              : 'Your categories, together in one place.'}
          </p>
        </div>
        <div className="banner-orbit">
          <FolderOpen size={62} strokeWidth={1} />
        </div>
      </section>
      <div className="section-label">
        <h2>Recently added</h2>
        <Link to="/user/categories" className="text-sm">
          Browse all ↗
        </Link>
      </div>
      {query.isPending ? (
        <Loader />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={query.refetch} />
      ) : query.data.categories.length ? (
        <div className="category-grid">
          {query.data.categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
      ) : (
        <div className="card empty">There are no active categories yet. Check back soon.</div>
      )}
      <div className="section-label media-section-heading">
        <h2>Shared media</h2>
        <Link to="/user/media">Browse all ↗</Link>
      </div>
      <MediaLibrary compact />
    </>
  );
}
