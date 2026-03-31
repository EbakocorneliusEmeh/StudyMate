import axios from 'axios';
import { getToken, removeToken, getRefreshToken } from '../utils/storage';

const API_URL = 'http://192.168.1.172:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
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
      console.error(
        '🚨 Network Error: Check if your server is running at 192.168.1.172:3000',
      );
      return Promise.reject(
        new Error('Cannot connect to server. Please check your internet.'),
      );
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          // Token refresh logic would go here
        }
      } catch (_refreshError) {
        // FIXED: Added underscore to avoid ESLint error
        await removeToken();
      }
    }

    return Promise.reject(error);
  },
);
