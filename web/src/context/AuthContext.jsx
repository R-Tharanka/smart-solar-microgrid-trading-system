import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';
import {
  clearAuthSession,
  homePathForRole,
  normalizeUser,
  readAuthSession,
  writeAuthSession,
  isWebUser, MOBILE_NOTICE, INACTIVE_NOTICE,
} from '../utils/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState('');

  useEffect(() => {
    let active = true;
    const stored = readAuthSession();

    const handleSessionEnded = (event) => {
      if (!active) return;
      setUser(null);
      setSessionNotice(event.detail?.reason || 'Your session ended. Sign in again.');
    };

    window.addEventListener('auth:session-ended', handleSessionEnded);

    if (!stored || !isWebUser(stored.user)) {
      if (stored) {
        clearAuthSession();
        setSessionNotice(stored.user.role === 'Prosumer' ? MOBILE_NOTICE : INACTIVE_NOTICE);
      }
      setLoading(false);
      return () => {
        active = false;
        window.removeEventListener('auth:session-ended', handleSessionEnded);
      };
    }

    setUser(stored.user);
    apiClient.get('/users/me')
      .then((response) => {
        if (!active || localStorage.getItem('token') !== stored.token) return;
        const currentUser = normalizeUser(response.data.data);
        if (!isWebUser(currentUser)) {
          clearAuthSession();
          setUser(null);
          setSessionNotice(currentUser?.role === 'Prosumer' ? MOBILE_NOTICE : INACTIVE_NOTICE);
          return;
        }
        setUser(currentUser);
        writeAuthSession({ token: stored.token, user: currentUser, expiresAtUtc: stored.expiresAtUtc });
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 403) {
          clearAuthSession();
          setUser(null);
          setSessionNotice(INACTIVE_NOTICE);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.removeEventListener('auth:session-ended', handleSessionEnded);
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    const response = await apiClient.post(
      '/users/login',
      { identifier: identifier.trim(), password, clientType: 'Web' },
      { skipAuthHandling: true },
    );
    const { accessToken, expiresAtUtc, user: backendUser } = response.data.data;
    const userData = normalizeUser(backendUser);
    if (!isWebUser(userData)) {
      clearAuthSession();
      setUser(null);
      throw { response: { status: 403, data: { errorCode: userData?.role === 'Prosumer' ? 'AUTH_CLIENT_ROLE_FORBIDDEN' : 'AUTH_ACCOUNT_INACTIVE' } } };
    }

    writeAuthSession({ token: accessToken, user: userData, expiresAtUtc });
    setSessionNotice('');
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback((notice = '') => {
    clearAuthSession();
    setUser(null);
    setSessionNotice(notice);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await apiClient.get('/users/me');
    const currentUser = normalizeUser(response.data.data);
    if (!isWebUser(currentUser)) {
      logout(currentUser?.role === 'Prosumer' ? MOBILE_NOTICE : INACTIVE_NOTICE);
      return null;
    }
    const stored = readAuthSession();
    if (stored) {
      writeAuthSession({ ...stored, user: currentUser });
    }
    setUser(currentUser);
    return currentUser;
  }, [logout]);

  const clearSessionNotice = useCallback(() => setSessionNotice(''), []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshUser,
    sessionNotice,
    clearSessionNotice,
    homePath: homePathForRole(user?.role),
  }), [clearSessionNotice, loading, login, logout, refreshUser, sessionNotice, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
