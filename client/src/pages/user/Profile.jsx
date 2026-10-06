import { ShieldCheck } from 'lucide-react';
import useAuth from '../../hooks/useAuth.js';

export default function Profile() {
  const { user } = useAuth();
  return <><div className="page-heading"><div><p className="eyebrow">Your corner of the workspace</p><h1>My profile</h1><p>Your account details, all in one place.</p></div></div><section className="card profile-card"><div className="profile-heading"><span className="avatar">{user.name.slice(0, 1)}</span><div><h2>{user.name}</h2><p>{user.email}</p></div><span className="badge">Active account</span></div><dl>{[['Full name', user.name], ['Email address', user.email], ['Account role', user.role], ['Member since', new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="profile-note"><ShieldCheck size={20} /><p>Your session is protected. Contact your workspace administrator for account changes.</p></div></section></>;
}
