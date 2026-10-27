import { api } from './axios.js';

export const foodApi = {
  list: async (params) => (await api.get('/foods', { params })).data,
  get: async (id) => (await api.get(`/foods/${id}`)).data,
  create: async (values) => {
    return (await api.post('/foods', values)).data;
  },
  update: async ({ id, values }) => {
    return (await api.put(`/foods/${id}`, values)).data;
  },
  remove: async (id) => (await api.delete(`/foods/${id}`)).data,
};
