import { NavLink, Link } from 'react-router-dom';
import {
  Layers3,
  LayoutDashboard,
  UtensilsCrossed,
  FolderOpen,
  Users,
  UserRound,
  ArrowUpRight,
  LogOut,
  Images,
  History,
} from 'lucide-react';
import useAuth from '../hooks/useAuth.js';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/axios.js';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const admin = user.role === 'admin';
  const root = admin ? '/admin' : '/user';
  const links = [
    ['dashboard', 'Overview', LayoutDashboard],
    ['foods', 'Food Items', UtensilsCrossed],
    ['categories', 'Categories', FolderOpen],
    ['media', 'Media library', Images],
    ...(admin ? [['users', 'Team members', Users], ['activity', 'Activity log', History]] : []),
    ['profile', 'Account settings', UserRound],
  ];
  return (
    <aside className="sidebar" data-lenis-prevent>
      <Link to="/" className="brand">
        <span className="brand-mark">
          <Layers3 size={22} />
        </span>
        forma<span className="brand-dot">®</span>
      </Link>
      <div className="workspace-label">
        <span className="workspace-icon">F</span>
        <div>
          Restaurant System<small>{admin ? 'Administrator' : 'Staff / User'}</small>
        </div>
        <span className="badge">{admin ? 'ADMIN' : 'USER'}</span>
      </div>
      <p className="eyebrow">Menu Management</p>
      <nav aria-label="Workspace navigation">
        {links.map(([path, label, Icon]) => (
          <NavLink key={path} to={`${root}/${path}`}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <UtensilsCrossed size={20} />
          <h3>Restaurant Menu</h3>
          <p>
            Culinary excellence in every dish.
            <br />
            Manage dishes & categories.
          </p>
          <Link to="/menu">
            Live food menu <ArrowUpRight size={14} />
          </Link>
        </div>
        <button
          className="signout"
          onClick={() => logout().catch((error) => toast.error(errorMessage(error)))}
        >
          <LogOut size={17} />
          Sign out
        </button>
        <div className="account">
          <span className="avatar">{user.name.slice(0, 1)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
