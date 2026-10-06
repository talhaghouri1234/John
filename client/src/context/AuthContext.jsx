import { createContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    authApi.me().then((current) => { if (active) setUser(current); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    const expire = () => { setUser(null); queryClient.clear(); };
    window.addEventListener('auth:expired', expire);
    return () => { active = false; window.removeEventListener('auth:expired', expire); };
  }, [queryClient]);
  const authenticate = async (method, values) => {
    const current = await authApi[method](values);
    queryClient.clear();
    setUser(current);
    return current;
  };
  const logout = async () => {
    await authApi.logout();
    queryClient.clear();
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, loading, login: (values) => authenticate('login', values), register: (values) => authenticate('register', values), logout }}>{children}</AuthContext.Provider>;
}
