import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  // Route rendering must not wait for an exit animation: navigation and lazy
  // loading can interrupt it and leave the entire application transparent.
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  );
}
