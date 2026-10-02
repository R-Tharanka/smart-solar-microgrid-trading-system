const FRIENDLY_MESSAGES = {
  AUTH_CLIENT_ROLE_FORBIDDEN: 'Prosumer accounts are accessed through the Smart Solar mobile application. Please use the mobile app to sign in.',
  AUTH_ACCOUNT_PENDING: 'Your registration is waiting for Backoffice activation.',
  AUTH_REGISTRATION_REJECTED: 'Your registration was rejected. You can submit it again through the mobile application for review.',
  AUTH_ACCOUNT_DEACTIVATED: 'Your account has been deactivated. Contact a Backoffice administrator for assistance.',
  USER_DEACTIVATION_ALREADY_REQUESTED: 'A deactivation request is already awaiting Backoffice review. The account remains active.',
  VALIDATION_IDENTITY: 'Review the submitted information and try again.',
  AUTH_INVALID_CREDENTIALS: 'The identifier or password is incorrect.',
  AUTH_ACCOUNT_INACTIVE: 'This account is not active. Contact a Backoffice administrator.',
  AUTH_CURRENT_PASSWORD_INVALID: 'The current password is incorrect.',
  AUTH_PASSWORD_UNCHANGED: 'Choose a new password that differs from the current password.',
  USER_EMAIL_EXISTS: 'An account already uses this email address.',
  USER_NIC_EXISTS: 'An account already uses this NIC.',
  USER_IDENTIFIER_EXISTS: 'An account already uses this identifier.',
  USER_INVALID_STATUS: 'That account status change is not allowed.',
  USER_ACTIVE_RESERVATIONS: 'This Prosumer has an active reservation. Complete or cancel it before deactivating the account.',
  USER_SELF_ADMIN_DEACTIVATION: 'You cannot deactivate your own Backoffice account.',
  USER_LAST_ADMIN: 'The final active Backoffice account cannot be deactivated.',
  USER_NOT_FOUND: 'The requested account could not be found.',
  VALIDATION_REQUEST: 'Review the highlighted information and try again.',
  TRANSACTION_NOT_FOUND: 'The requested reservation transaction could not be found.',
  TRANSACTION_FORBIDDEN: 'You cannot issue or manage this reservation transaction.',
  QR_STATUS_INVALID: 'This reservation is not awaiting QR verification.',
  QR_WINDOW_EXPIRED: 'The reservation window has already expired.',
  QR_ALREADY_ISSUED: 'A QR transaction has already been issued for this reservation.',
  QR_EXPIRED: 'This QR transaction has expired. Request a new approved transaction.',
  QR_TOKEN_INVALID: 'The QR transaction token is invalid.',
  QR_VERIFY_CONFLICT: 'This QR transaction was already processed or changed.',
  FINALIZE_STATUS_INVALID: 'Only a verified transaction can be finalized.',
  FINALIZE_CONFLICT: 'This transfer was already finalized or changed.',
  TRANSFER_ENERGY_INVALID: 'Transferred energy must be positive and cannot exceed the reserved amount.',
};

export function getApiError(error, fallback = 'The request could not be completed.') {
  const status = error?.response?.status;
  const problem = error?.response?.data;
  const errorCode = problem?.errorCode;

  if (!error?.response) {
    return {
      status: null,
      errorCode: 'NETWORK_ERROR',
      message: 'The platform is temporarily unavailable. Check your connection and try again.',
      validationErrors: {},
    };
  }

  const statusMessage = {
    400: 'Review the submitted information and try again.',
    401: 'Your session is invalid or has expired. Sign in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested item could not be found.',
    409: 'The request conflicts with the current account state.',
    422: 'The request violates an energy transaction rule.',
    500: 'The service encountered an error. Try again later.',
  }[status];

  const safeDetail = status && status < 500 ? problem?.detail : null;

  return {
    status,
    errorCode,
    title: ({ AUTH_CLIENT_ROLE_FORBIDDEN: 'Mobile application required', AUTH_ACCOUNT_PENDING: 'Awaiting activation', AUTH_REGISTRATION_REJECTED: 'Registration not approved', AUTH_ACCOUNT_DEACTIVATED: 'Account deactivated', AUTH_INVALID_CREDENTIALS: 'Check your sign-in details' })[errorCode],
    message: FRIENDLY_MESSAGES[errorCode] || safeDetail || statusMessage || fallback,
    validationErrors: problem?.errors || {},
  };
}

export function firstValidationMessage(validationErrors, fieldName) {
  const match = Object.entries(validationErrors || {}).find(
    ([key]) => key.toLowerCase() === fieldName.toLowerCase(),
  );
  return match?.[1]?.[0] || '';
}
