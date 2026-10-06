import { Link } from 'react-router-dom';
export default function NotFound() { return <main className="empty"><p className="eyebrow">404 · A little off course</p><h1>Nothing lives here.</h1><p>Let’s get you back to familiar ground.</p><Link className="button" to="/">Back to home</Link></main>; }
