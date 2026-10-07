import { api } from './axios.js';

export const mediaApi = {
  list: async (params) => (await api.get('/media', { params })).data,
  upload: async (file, onProgress) => {
    const body = new FormData();
    body.append('file', file);
    return (await api.post('/media', body, {
      timeout: 120000,
      onUploadProgress: (event) => onProgress?.(event.total ? Math.round(event.loaded * 100 / event.total) : 0),
    })).data;
  },
  remove: async (id) => (await api.delete(`/media/${id}`)).data,
  file: async (id, signal) => (await api.get(`/media/${id}/file`, { responseType: 'blob', signal, timeout: 120000 })).data,
};
