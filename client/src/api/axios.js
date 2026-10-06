import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
export const api = axios.create({ baseURL, withCredentials: true, timeout: 15000 });
const refreshClient = axios.create({ baseURL, withCredentials: true, timeout: 15000 });
let refreshRequest;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retried ||
      /\/auth\/(login|register|refresh|logout)$/.test(request.url)
    ) {
      return Promise.reject(error);
    }
    request._retried = true;
    try {
      if (!refreshRequest) {
        refreshRequest = refreshClient.post('/auth/refresh').finally(() => {
          refreshRequest = null;
        });
      }
      await refreshRequest;
      return await api(request);
    } catch (refreshError) {
      if (refreshError.response?.status === 401) window.dispatchEvent(new Event('auth:expired'));
      return Promise.reject(refreshError);
    }
  },
);

export const errorMessage = (error) =>
  error.response?.data?.message || 'Something went wrong. Please try again.';
