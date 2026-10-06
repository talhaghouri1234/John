import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return <AuthProvider><Toaster position="top-right" /><AppRoutes /></AuthProvider>;
}
