import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, FolderOpen, CircleCheck, Archive, ArrowUpRight } from 'lucide-react';
import { userApi } from '../../api/user.api.js';
import { useCategories } from '../../hooks/useCategories.js';
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
  const requests = [users, categories, active];
  if (requests.some((query) => query.isPending)) return <Loader />;
  const failed = requests.find((query) => query.isError);
  if (failed) return <ErrorState error={failed.error} retry={failed.refetch} />;
  const total = categories.data.pagination.total;
  const activeCount = active.data.pagination.total;
  const stats = [
    ['Team members', users.data.pagination.total, Users, 'People in your workspace'],
    ['Total categories', total, FolderOpen, 'Organized and ready'],
    ['Active categories', activeCount, CircleCheck, 'Available to your team'],
    ['Inactive categories', total - activeCount, Archive, 'Taking a little break'],
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your workspace, at a glance</p>
          <h1>
            Welcome back, {user.name.split(' ')[0]} <span className="wave">✳</span>
          </h1>
          <p>Here’s what’s happening in your workspace today.</p>
        </div>
        <Link className="button" to="/admin/categories">
          Manage categories <ArrowUpRight size={17} />
        </Link>
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
          <p className="eyebrow">Clarity starts here</p>
          <h2>
            A well-organized workspace.
            <br />A little more room to think.
          </h2>
          <p>Keep your categories current and your team connected.</p>
        </div>
        <div className="banner-orbit">
          <FolderOpen size={62} strokeWidth={1} />
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
    </>
  );
}
