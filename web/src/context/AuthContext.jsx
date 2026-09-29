import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';
import {
  clearAuthSession,
  homePathForRole,
  normalizeUser,
  readAuthSession,
  writeAuthSession,
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

    if (!stored) {
      setLoading(false);
      return () => {
        active = false;
        window.removeEventListener('auth:session-ended', handleSessionEnded);
      };
    }

    setUser(stored.user);
    apiClient.get('/users/me')
      .then((response) => {
        if (!active) return;
        const currentUser = normalizeUser(response.data.data);
        setUser(currentUser);
        writeAuthSession({ token: stored.token, user: currentUser, expiresAtUtc: stored.expiresAtUtc });
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 403) {
          clearAuthSession();
          setUser(null);
          setSessionNotice('This account is no longer active.');
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
      { identifier: identifier.trim(), password },
      { skipAuthHandling: true },
    );
    const { accessToken, expiresAtUtc, user: backendUser } = response.data.data;
    const userData = normalizeUser(backendUser);

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
    const stored = readAuthSession();
    if (stored) {
      writeAuthSession({ ...stored, user: currentUser });
    }
    setUser(currentUser);
    return currentUser;
  }, []);

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
