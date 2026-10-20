import axios from 'axios';
import { API_URL } from '../config/api';
import { getToken, refreshAccessToken, removeToken } from '../utils/storage';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers = config.headers ?? {};
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle "Network Error" (Server is down or IP is wrong)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error(`⏱️ Request timed out after 60s at ${API_URL}`);
        return Promise.reject(
          new Error('Request timed out. Please try again.'),
        );
      }
      console.error(
        `🚨 Network Error: Check if your server is running at ${API_URL}`,
      );
      return Promise.reject(
        new Error('Cannot connect to server. Please check your internet.'),
      );
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      await removeToken();
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    return Promise.reject(error);
  },
);
