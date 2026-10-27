import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import MediaLibrary from '../../components/MediaLibrary.jsx';
import { Users, FolderOpen, CircleCheck, ArrowUpRight, UtensilsCrossed } from 'lucide-react';
import { userApi } from '../../api/user.api.js';
import { useCategories } from '../../hooks/useCategories.js';
import { useFoods } from '../../hooks/useFoods.js';
import useAuth from '../../hooks/useAuth.js';
import CategoryTable from '../../components/CategoryTable.jsx';
import Loader from '../../components/Loader.jsx';
import ErrorState from '../../components/ErrorState.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const users = useQuery({
    queryKey: ['users', { limit: 1 }],
    queryFn: () => userApi.list({ limit: 1 }),
  });
  const categories = useCategories({ limit: 5 });
  const active = useCategories({ limit: 1, isActive: true });
  const foods = useFoods({ limit: 5 });

  const requests = [users, categories, active, foods];
  if (requests.some((query) => query.isPending)) return <Loader />;
  const failed = requests.find((query) => query.isError);
  if (failed) return <ErrorState error={failed.error} retry={failed.refetch} />;

  const total = categories.data.pagination.total;
  const activeCount = active.data.pagination.total;
  const totalFoods = foods.data.pagination.total;

  const stats = [
    ['Food items', totalFoods, UtensilsCrossed, 'Dishes on your menu'],
    ['Total categories', total, FolderOpen, 'Organized menu sections'],
    ['Active categories', activeCount, CircleCheck, 'Live in restaurant'],
    ['Team members', users.data.pagination.total, Users, 'Staff and administrators'],
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Restaurant System, at a glance</p>
          <h1>
            Welcome back, {user.name.split(' ')[0]} <span className="wave">✳</span>
          </h1>
          <p>Here’s what’s happening in your restaurant food menu system today.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="button" to="/admin/foods">
            Manage food menu <UtensilsCrossed size={17} />
          </Link>
          <Link className="button secondary" to="/admin/categories">
            Manage categories <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map(([label, count, Icon, detail]) => (
          <div className="card stat-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={18} />
            </div>
            <strong>{count.toString().padStart(2, '0')}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
      <section className="workspace-banner">
        <div>
          <p className="eyebrow">Culinary Excellence</p>
          <h2>
            Restaurant Food Menu
            <br />Management System.
          </h2>
          <p>Keep your dishes fresh, prices accurate, and categories organized.</p>
        </div>
        <div className="banner-orbit">
          <UtensilsCrossed size={62} strokeWidth={1} />
        </div>
      </section>
      <section className="card">
        <div className="section-label">
          <h2>Recently added categories</h2>
          <Link className="text-sm" to="/admin/categories">
            View all ↗
          </Link>
        </div>
        <CategoryTable categories={categories.data.categories} />
      </section>
      <div className="section-label media-section-heading">
        <h2>Shared media</h2>
        <Link to="/admin/media">Manage media ↗</Link>
      </div>
      <MediaLibrary compact />
    </>
  );
}
