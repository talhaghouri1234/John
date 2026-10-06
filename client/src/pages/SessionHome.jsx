import useAuth from '../hooks/useAuth.js';
import toast from 'react-hot-toast';
import { errorMessage } from '../api/axios.js';
export default function SessionHome() { const { user, logout } = useAuth(); return <main className="empty"><p className="eyebrow">{user.role} workspace</p><h1>Welcome, {user.name}.</h1><p>You’re signed in as {user.email}.</p><button className="button" onClick={() => logout().catch((error) => toast.error(errorMessage(error)))}>Sign out</button></main>; }
