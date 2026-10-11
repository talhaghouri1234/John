import { api } from './axios.js';

export const accountApi = {
  forgot: async (values) => (await api.post('/auth/forgot-password', values)).data,
  reset: async (values) => (await api.post('/auth/reset-password', values)).data,
  verify: async (values) => (await api.post('/auth/verify-email', values)).data,
  resend: async () => (await api.post('/account/resend-verification')).data,
  profile: async (values) => (await api.patch('/account/profile', values)).data.user,
  password: async (values) => (await api.post('/account/change-password', values)).data,
  email: async (values) => (await api.post('/account/change-email', values)).data,
  cancelEmail: async () => (await api.delete('/account/pending-email')).data,
  sessions: async () => (await api.get('/account/sessions')).data.sessions,
  revoke: async (id) => (await api.delete(`/account/sessions/${id}`)).data,
  revokeOthers: async () => (await api.delete('/account/sessions/others')).data,
  avatar: async (signal) => (await api.get('/account/avatar', { responseType: 'blob', signal })).data,
  uploadAvatar: async (file) => {
    const body = new FormData();
    body.append('file', file);
    return (await api.post('/account/avatar', body)).data.user;
  },
  deleteAvatar: async () => (await api.delete('/account/avatar')).data.user,
  audit: async (params) => (await api.get('/audit', { params })).data,
};
