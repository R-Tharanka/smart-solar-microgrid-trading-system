import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTransactionReservation,
  parseQrPayload,
  transactionStatusCounts,
} from '../src/utils/transaction.js';

test('parseQrPayload returns the secure QR fields', () => {
  const result = parseQrPayload(JSON.stringify({
    reservationCode: 'RSV-20260929-ABC123',
    transactionToken: 'opaque-token-with-enough-characters',
    expiresAtUtc: '2026-09-29T12:30:00Z',
  }));

  assert.equal(result.reservationCode, 'RSV-20260929-ABC123');
  assert.equal(result.transactionToken, 'opaque-token-with-enough-characters');
});

test('parseQrPayload rejects invalid or incomplete payloads', () => {
  assert.throws(() => parseQrPayload('not-json'), /not valid JSON/);
  assert.throws(() => parseQrPayload('{"reservationCode":"RSV-1"}'), /must contain/);
  assert.throws(() => parseQrPayload(JSON.stringify({
    reservationCode: 'RSV-1',
    transactionToken: 'short',
    expiresAtUtc: '2026-09-29T12:30:00Z',
  })), /incomplete/);
});

test('transaction helpers select and count Member 4 lifecycle states', () => {
  const reservations = [
    { status: 'Pending' },
    { status: 'QrIssued' },
    { status: 'Verified' },
    { status: 'Completed' },
    { status: 'Completed' },
  ];

  assert.deepEqual(reservations.filter(isTransactionReservation).map((item) => item.status), [
    'QrIssued', 'Verified', 'Completed', 'Completed',
  ]);
  assert.deepEqual(transactionStatusCounts(reservations), {
    awaitingVerification: 1,
    awaitingFinalization: 1,
    completed: 2,
  });
});
