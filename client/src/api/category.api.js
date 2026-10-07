import { api } from './axios.js';

export const categoryApi = {
  list: async (params) => (await api.get('/categories', { params })).data,
  create: async (values) => (await api.post('/categories', values)).data,
  update: async ({ id, values }) => (await api.put(`/categories/${id}`, values)).data,
  remove: async (id) => (await api.delete(`/categories/${id}`)).data,
};
