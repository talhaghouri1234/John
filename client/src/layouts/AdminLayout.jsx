import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import useAuth from '../hooks/useAuth.js';

export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className="workspace-shell">
      <Sidebar />
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span>
            Workspace <span className="muted">/ Administration</span>
          </span>
          <div>
            <span className="status-dot" />
            All systems connected <span className="avatar">{user.name.slice(0, 1)}</span>
          </div>
        </header>
        <main className="workspace-content">
          <Outlet />
        </main>
        <div className="workspace-footer">
          A little structure goes a long way.<span>Forma Workspace</span>
        </div>
      </div>
    </div>
  );
}
