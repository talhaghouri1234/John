import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { dashboardPath } from '../../utils/auth.js';
export default function Unauthorized() { const { user } = useAuth(); return <main className="empty"><p className="eyebrow">403 · Access restricted</p><h1>This space isn’t yours.</h1><p>Your account doesn’t have access to this page.</p><Link className="button" to={user ? dashboardPath(user) : '/login'}>Go to your workspace</Link></main>; }
