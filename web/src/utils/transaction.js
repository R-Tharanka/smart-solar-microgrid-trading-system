const transactionStatuses = new Set(['QrIssued', 'Verified', 'Completed']);

export function isTransactionReservation(reservation) {
  return transactionStatuses.has(reservation?.status);
}

export function parseQrPayload(value) {
  const source = value?.trim();
  if (!source) throw new Error('Paste the QR payload before verifying it.');

  let payload;
  try {
    payload = JSON.parse(source);
  } catch {
    throw new Error('The QR payload is not valid JSON.');
  }

  const reservationCode = payload?.reservationCode?.trim();
  const transactionToken = payload?.transactionToken?.trim();
  const expiresAtUtc = payload?.expiresAtUtc;

  if (!reservationCode || !transactionToken) {
    throw new Error('The QR payload must contain a reservation code and transaction token.');
  }
  if (transactionToken.length < 20) {
    throw new Error('The QR transaction token is incomplete.');
  }
  if (!expiresAtUtc || Number.isNaN(Date.parse(expiresAtUtc))) {
    throw new Error('The QR payload contains an invalid expiry time.');
  }

  return { reservationCode, transactionToken, expiresAtUtc };
}

export function transactionStatusCounts(reservations) {
  return reservations.reduce((counts, reservation) => {
    if (reservation.status === 'QrIssued') counts.awaitingVerification += 1;
    if (reservation.status === 'Verified') counts.awaitingFinalization += 1;
    if (reservation.status === 'Completed') counts.completed += 1;
    return counts;
  }, { awaitingVerification: 0, awaitingFinalization: 0, completed: 0 });
}
