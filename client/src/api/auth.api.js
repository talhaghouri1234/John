import { api } from './axios.js';

export const authApi = {
  me: async () => (await api.get('/auth/me')).data.user,
  login: async (values) => (await api.post('/auth/login', values)).data.user,
  register: async (values) => (await api.post('/auth/register', values)).data.user,
  logout: async () => api.post('/auth/logout'),
};
