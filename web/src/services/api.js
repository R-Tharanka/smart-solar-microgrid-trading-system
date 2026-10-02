import axios from 'axios';
import { clearAuthSession, isWebUser, MOBILE_NOTICE, INACTIVE_NOTICE } from '../utils/auth';

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

let accountCheck;
function endSession(reason, token) {
  if (!token || localStorage.getItem('token') !== token) return;
  clearAuthSession();
  window.dispatchEvent(new CustomEvent('auth:session-ended', { detail: { reason } }));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const token = error.config?.headers?.Authorization?.replace(/^Bearer /, '');
    if (!error.config?.skipAuthHandling && token) {
      if (error.response?.status === 401) {
        endSession('Your session expired. Sign in again to continue.', token);
      } else if (error.response?.status === 403) {
        const code = error.response.data?.errorCode;
        if (error.config.url === '/users/me' || ['AUTH_ACCOUNT_INACTIVE', 'AUTH_ACCOUNT_DEACTIVATED', 'AUTH_ACCOUNT_PENDING', 'AUTH_REGISTRATION_REJECTED'].includes(code)) {
          endSession(INACTIVE_NOTICE, token);
        } else {
          // A role denial must not end an otherwise valid session. Check only after a denial.
          if (!accountCheck || accountCheck.token !== token) {
            const check = { token };
            check.promise = apiClient.get('/users/me', { skipAuthHandling: true }).then(({ data }) => {
              if (!isWebUser(data.data)) endSession(data.data?.role === 'Prosumer' ? MOBILE_NOTICE : INACTIVE_NOTICE, token);
            }).catch((failure) => {
              if ([401, 403].includes(failure.response?.status)) endSession(INACTIVE_NOTICE, token);
            }).finally(() => { if (accountCheck === check) accountCheck = null; });
            accountCheck = check;
          }
          await accountCheck.promise;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
