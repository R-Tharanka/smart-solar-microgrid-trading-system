import axios from 'axios';
import { clearAuthSession } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthHandling) {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent('auth:session-ended', {
        detail: { reason: 'Your session expired. Sign in again to continue.' },
      }));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
