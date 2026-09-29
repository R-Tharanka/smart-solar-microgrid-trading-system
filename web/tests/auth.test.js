import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearAuthSession,
  homePathForRole,
  isExpired,
  normalizeUser,
  readAuthSession,
  writeAuthSession,
} from '../src/utils/auth.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('maps every supported role to its workspace', () => {
  assert.equal(homePathForRole('Backoffice'), '/backoffice');
  assert.equal(homePathForRole('GridOperator'), '/grid-operator');
  assert.equal(homePathForRole('Prosumer'), '/prosumer');
  assert.equal(homePathForRole('Unknown'), '/access-denied');
});

test('normalizes the API user without internal identifiers', () => {
  const user = normalizeUser({
    nic: '200012345678',
    email: 'person@example.com',
    firstName: 'Solar',
    lastName: 'Owner',
    role: 'Prosumer',
    status: 'Active',
  });
  assert.equal(user.id, '200012345678');
  assert.equal(user.name, 'Solar Owner');
  assert.equal(user.role, 'Prosumer');
});

test('persists and restores a non-expired session', () => {
  const storage = memoryStorage();
  const session = {
    token: 'jwt-value',
    expiresAtUtc: '2030-01-01T00:00:00Z',
    user: { email: 'admin@example.com', firstName: 'Grid', lastName: 'Admin', role: 'Backoffice', status: 'Active' },
  };
  writeAuthSession(session, storage);
  assert.equal(readAuthSession(storage).user.name, 'Grid Admin');
  clearAuthSession(storage);
  assert.equal(readAuthSession(storage), null);
});

test('rejects expired sessions', () => {
  assert.equal(isExpired('2020-01-01T00:00:00Z', Date.parse('2021-01-01T00:00:00Z')), true);
  assert.equal(isExpired('2030-01-01T00:00:00Z', Date.parse('2029-01-01T00:00:00Z')), false);
});
