import test from 'node:test';
import assert from 'node:assert/strict';
import { firstValidationMessage, getApiError } from '../src/utils/apiError.js';

test('maps active reservation conflicts to a useful account message', () => {
  const error = { response: { status: 409, data: { errorCode: 'USER_ACTIVE_RESERVATIONS', detail: 'Internal wording' } } };
  assert.match(getApiError(error).message, /active reservation/i);
});

test('does not expose server detail for 500 responses', () => {
  const error = { response: { status: 500, data: { detail: 'MongoDB connection secret details' } } };
  const result = getApiError(error);
  assert.doesNotMatch(result.message, /MongoDB/);
  assert.match(result.message, /service encountered an error/i);
});

test('returns a stable network failure message', () => {
  assert.equal(getApiError(new Error('ECONNREFUSED')).errorCode, 'NETWORK_ERROR');
});

test('finds ASP.NET validation fields without case sensitivity', () => {
  assert.equal(firstValidationMessage({ Email: ['Email is invalid.'] }, 'email'), 'Email is invalid.');
});
