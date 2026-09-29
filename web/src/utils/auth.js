export const AUTH_STORAGE_KEYS = {
  token: 'token',
  user: 'user',
  expiresAt: 'tokenExpiresAtUtc',
};

export const ROLE_HOME_PATHS = {
  Backoffice: '/backoffice',
  GridOperator: '/grid-operator',
  Prosumer: '/prosumer',
};

export function homePathForRole(role) {
  return ROLE_HOME_PATHS[role] || '/access-denied';
}

export function normalizeUser(user) {
  if (!user) return null;

  return {
    nic: user.nic || null,
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phoneNumber: user.phoneNumber || null,
    address: user.address || null,
    role: user.role || '',
    status: user.status || '',
    id: user.nic || user.email || '',
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
  };
}

export function isExpired(expiresAtUtc, now = Date.now()) {
  if (!expiresAtUtc) return true;
  const expiry = Date.parse(expiresAtUtc);
  return !Number.isFinite(expiry) || expiry <= now;
}

export function readAuthSession(storage = globalThis.localStorage) {
  if (!storage) return null;

  try {
    const token = storage.getItem(AUTH_STORAGE_KEYS.token);
    const user = JSON.parse(storage.getItem(AUTH_STORAGE_KEYS.user) || 'null');
    const expiresAtUtc = storage.getItem(AUTH_STORAGE_KEYS.expiresAt);

    if (!token || !user || isExpired(expiresAtUtc)) {
      clearAuthSession(storage);
      return null;
    }

    return { token, user: normalizeUser(user), expiresAtUtc };
  } catch {
    clearAuthSession(storage);
    return null;
  }
}

export function writeAuthSession({ token, user, expiresAtUtc }, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(AUTH_STORAGE_KEYS.token, token);
  storage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(normalizeUser(user)));
  storage.setItem(AUTH_STORAGE_KEYS.expiresAt, expiresAtUtc);
}

export function clearAuthSession(storage = globalThis.localStorage) {
  if (!storage) return;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => storage.removeItem(key));
}
