# Identity API Contract

Status: Implemented in Phase 3
Owner: Member 1
Base path: `/api/users`

This contract supersedes the earlier Phase 1 identity route sketch. User-facing operations use NIC for Prosumers and normalized email for staff. MongoDB `_id` is not exposed by this module.

## Conventions

- Protected requests use `Authorization: Bearer <accessToken>`.
- Email is stored lowercase; NIC is stored uppercase.
- Public Prosumer registration creates an `Active` Prosumer account.
- Only `Active` accounts satisfy protected authorization policies, including when an older JWT has not expired.
- Passwords require 8-128 characters, uppercase, lowercase, number, special character, and no whitespace.
- NIC accepts the Sri Lankan 12-digit form or 9 digits followed by `V`/`X`.
- Successful resource responses use `{ "data": ..., "message": ... }`.
- Errors use RFC 7807 Problem Details with `errorCode` and `traceId` extensions.

## Response Models

```json
{
  "nic": "200012345678",
  "email": "prosumer@example.com",
  "firstName": "Sample",
  "lastName": "Prosumer",
  "phoneNumber": "0771234567",
  "address": "Colombo",
  "role": "Prosumer",
  "status": "Active"
}
```

Login data adds `accessToken`, `expiresAtUtc`, and the user object. Password hashes and MongoDB identifiers are never returned.

## Endpoints

### Register Prosumer

`POST /api/users/prosumer/register`
Authorization: Public

```json
{
  "nic": "200012345678",
  "email": "prosumer@example.com",
  "password": "StrongPassword123!",
  "firstName": "Sample",
  "lastName": "Prosumer",
  "phoneNumber": "0771234567",
  "address": "Colombo"
}
```

Returns `201 Created`. Duplicate normalized NIC or email returns `409 Conflict`.

### Login

`POST /api/users/login`
Authorization: Public

```json
{
  "identifier": "200012345678",
  "password": "StrongPassword123!"
}
```

`identifier` may be a Prosumer NIC or staff/Prosumer email. Valid credentials for an active account return `200 OK` and a signed JWT. Invalid credentials return `401`; Pending or Deactivated accounts return `403`.

### Current Profile

`GET /api/users/me`
Authorization: `Authenticated`

Returns `200 OK` with the authenticated user's profile.

### Update Current Profile

`PUT /api/users/me`
Authorization: `Authenticated`

```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phoneNumber": "+94771234567",
  "address": "Colombo 03"
}
```

NIC, email, role and status cannot be changed by this endpoint. `phoneNumber` and `address` are required for Prosumer updates and are ignored for staff when omitted.

### Change Password

`POST /api/users/change-password`
Authorization: `Authenticated`

```json
{
  "currentPassword": "StrongPassword123!",
  "newPassword": "NewStrongPassword456!"
}
```

Returns `204 No Content`. The current password must be correct, the new password must satisfy the shared password rules, and it must differ from the current password.

### Deactivate Own Prosumer Account

`POST /api/users/me/deactivate`
Authorization: `ProsumerOnly`

Returns `204 No Content`. Deactivation is rejected with `409 USER_ACTIVE_RESERVATIONS` while the Prosumer has a `Pending`, `Approved`, `QrIssued`, or `Verified` reservation.

### Create Staff

`POST /api/users/staff`
Authorization: `BackofficeOnly`

```json
{
  "email": "operator@example.com",
  "password": "StrongPassword123!",
  "firstName": "Grid",
  "lastName": "Operator",
  "role": "GridOperator"
}
```

Role must be `Backoffice` or `GridOperator`. Returns `201 Created`.

### List Users

`GET /api/users`
Authorization: `BackofficeOnly`

Returns `200 OK` with users sorted by role and email.

### Reactivate User

`POST /api/users/{identifier}/reactivate`
Authorization: `BackofficeOnly`

Only a `Deactivated` account may transition to `Active`. Returns `204 No Content`.

### Deactivate User

`POST /api/users/{identifier}/deactivate`
Authorization: `BackofficeOnly`

Only an `Active` account may transition to `Deactivated`. A Backoffice user cannot deactivate their own account or the final active Backoffice account. Prosumer reservation protection also applies. Returns `204 No Content`.

## JWT Claims

- `sub`: NIC for a Prosumer, normalized email for staff.
- `email`: normalized email.
- `role`: `Backoffice`, `GridOperator`, or `Prosumer`.
- `user_identifier`: NIC or email used for account lookup.
- `nic`: included only for a Prosumer.
- `jti`, `iat`, `nbf`, and `exp`: token lifecycle claims.

The default access-token lifetime is 60 minutes. Protected policies also query current account status, so deactivation takes effect before token expiry.

## Internal Member Contract

Member 3 validates a reservation owner through `IIdentityService.GetActiveProsumerAsync(nic)`. The method normalizes the NIC and returns the public `UserResponse` only when the account exists, has role `Prosumer`, and has status `Active`. Other modules must not query the `users` collection directly or access `passwordHash`.

Account lifecycle writes record `deactivatedAtUtc` or `reactivatedAtUtc` and `statusChangedByIdentifier` in MongoDB. These audit fields are server-side data and are not included in `UserResponse`.

## Stable Identity Error Codes

| Code | Meaning |
| --- | --- |
| `AUTH_INVALID_CREDENTIALS` | Identifier or password is invalid. |
| `AUTH_ACCOUNT_INACTIVE` | Account is Pending or Deactivated. |
| `AUTH_CURRENT_PASSWORD_INVALID` | Current password supplied for a password change is incorrect. |
| `AUTH_PASSWORD_UNCHANGED` | New password is the same as the current password. |
| `USER_NIC_EXISTS` | NIC is already registered. |
| `USER_EMAIL_EXISTS` | Email is already registered. |
| `USER_IDENTIFIER_EXISTS` | A concurrent duplicate write was rejected. |
| `USER_NOT_FOUND` | Target account does not exist. |
| `USER_INVALID_STATUS` | Requested state transition is not allowed. |
| `USER_ACTIVE_RESERVATIONS` | Prosumer has a non-terminal reservation. |
| `USER_SELF_ADMIN_DEACTIVATION` | Backoffice attempted to deactivate itself. |
| `USER_LAST_ADMIN` | Operation would remove the final active Backoffice account. |
| `VALIDATION_REQUEST` | Request DTO validation failed. |
