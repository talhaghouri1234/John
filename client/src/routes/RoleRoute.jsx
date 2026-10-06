import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Loader from '../components/Loader.jsx';

export default function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === role ? children || <Outlet /> : <Navigate to="/unauthorized" replace />;
}
