import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const config = {
  baseURL,
  withCredentials: true,
  timeout: 30000,
};
export const api = axios.create(config);
const refreshClient = axios.create(config);
for (const client of [api, refreshClient]) {
  client.interceptors.request.use((request) => {
    // Not a token: this non-simple header enforces the CORS/CSRF contract.
    request.headers.set('X-CSRF-Protection', '1');
    return request;
  });
}
let refreshRequest;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retried ||
      /\/auth\/(login|register|refresh|logout|forgot-password|reset-password|verify-email)$/.test(request.url)
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
