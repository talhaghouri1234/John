import { api } from './axios.js';

export const userApi = {
  list: async (params) => (await api.get('/users', { params })).data,
  role: async ({ id, role }) => (await api.patch(`/users/${id}/role`, { role })).data,
  active: async ({ id, isActive }) => (await api.patch(`/users/${id}/active`, { isActive })).data,
};
