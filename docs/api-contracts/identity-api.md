# Identity API Contract

Status: Implemented in Phase 3
Owner: Member 1
Base path: `/api/users`

This contract supersedes the earlier Phase 1 identity route sketch. User-facing operations use NIC for Prosumers and normalized email for staff. MongoDB `_id` is not exposed by this module.

## Conventions

- Protected requests use `Authorization: Bearer <accessToken>`.
- Email is stored lowercase; NIC is stored uppercase.
- Public Prosumer registration creates a `Pending` Prosumer account for Backoffice review.
- Backoffice may create and update Prosumer accounts through dedicated `BackofficeOnly` endpoints.
- Only `Active` accounts satisfy protected authorization policies, including when an older JWT has not expired.
- Account status uses the existing `status` response property with values `Pending`, `Active`, `Deactivated`, or `Rejected`.
- Login requires `clientType`: Web permits Backoffice and Grid Operator; Android permits Prosumer and Grid Operator.
- `clientType` is an application-level access rule, not device attestation; it does not prove that a request originated from a particular device.
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
  "status": "Active",
  "deactivationRequested": false,
  "deactivationRequestedAtUtc": null,
  "rejectionReason": null
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

Returns `201 Created` with status `Pending`. Duplicate normalized NIC or email returns `409 Conflict`. If the NIC belongs to a `Rejected` Prosumer registration, the existing document is updated and returned to `Pending`; a second user document is not created.

### Create Prosumer as Backoffice

`POST /api/users/prosumers`
Authorization: `BackofficeOnly`

Uses the same validated request body as public registration. The new account is `Active`, always has role `Prosumer`, and records the authenticated Backoffice email in `createdByIdentifier`. Duplicate normalized NIC or email returns `409 Conflict`.

### Update Prosumer as Backoffice

`PUT /api/users/prosumers/{nic}`
Authorization: `BackofficeOnly`

```json
{
  "email": "updated@example.com",
  "firstName": "Updated",
  "lastName": "Prosumer",
  "phoneNumber": "+94771234567",
  "address": "Colombo 03"
}
```

Returns the updated public profile. NIC, role, status, and password are immutable in this operation. Email remains globally unique. Backoffice may correct the contact profile of an active or deactivated Prosumer; lifecycle changes continue to use the dedicated deactivate/reactivate commands.

### Login

`POST /api/users/login`
Authorization: Public

```json
{
  "identifier": "200012345678",
  "password": "StrongPassword123!",
  "clientType": "Android"
}
```

`identifier` may be a Prosumer NIC or staff/Prosumer email. `clientType` is required and must be `Web` or `Android`. Valid credentials for an allowed active account return `200 OK` and a signed JWT. Web permits Backoffice and Grid Operator; Android permits Prosumer and Grid Operator. A valid but disallowed role/client combination returns `403 AUTH_CLIENT_ROLE_FORBIDDEN`. Invalid credentials return `401`; Pending, Rejected, or Deactivated accounts return distinct `403` errors.

### List Pending Prosumer Registrations

`GET /api/users/prosumers/pending`
Authorization: `BackofficeOnly`

Returns pending Prosumer profile information needed for registration review.

### Activate Pending Prosumer

`POST /api/users/prosumers/{nic}/activate`
Authorization: `BackofficeOnly`

Transitions only `Pending -> Active` and returns `204 No Content`.

### Reject Pending Prosumer

`POST /api/users/prosumers/{nic}/reject`
Authorization: `BackofficeOnly`

```json
{
  "reason": "Registration details could not be verified."
}
```

Transitions only `Pending -> Rejected`, persists the review reason and audit fields, and returns `204 No Content`.

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

### Request Own Prosumer Deactivation

`POST /api/users/me/deactivation-request`
Authorization: `ProsumerOnly`

Returns `204 No Content`. The account remains `Active`; `deactivationRequested` and `deactivationRequestedAtUtc` are recorded for Backoffice processing. A duplicate pending request returns `409 USER_DEACTIVATION_ALREADY_REQUESTED`. Reservation checks are applied later when Backoffice performs the actual deactivation.

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

Only a `Deactivated` account may transition to `Active`. The endpoint is not available to Grid Operators or Prosumers, including self-reactivation. Returns `204 No Content`.

### Deactivate User

`POST /api/users/{identifier}/deactivate`
Authorization: `BackofficeOnly`

Only an `Active` account may transition to `Deactivated`. This is the only endpoint that performs the administrative deactivation transition. A Backoffice user cannot deactivate their own account or the final active Backoffice account. Prosumer reservation protection still blocks deactivation while a `Pending`, `Approved`, `QrIssued`, or `Verified` reservation exists. A completed Prosumer deactivation clears its pending request marker. Returns `204 No Content`.

## Account Lifecycle

- Public registration: new or resubmitted rejected Prosumer `-> Pending`.
- Backoffice approval: `Pending -> Active`.
- Backoffice rejection: `Pending -> Rejected`.
- Prosumer deactivation request: `Active -> Active` plus pending-request metadata.
- Backoffice deactivation: `Active -> Deactivated`, subject to reservation safeguards.
- Backoffice reactivation: `Deactivated -> Active`.

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

Backoffice-created accounts record `createdByIdentifier`. Account lifecycle writes record `deactivatedAtUtc` or `reactivatedAtUtc` and `statusChangedByIdentifier` in MongoDB. These audit fields are server-side data and are not included in `UserResponse`.

## Stable Identity Error Codes

| Code | Meaning |
| --- | --- |
| `AUTH_INVALID_CREDENTIALS` | Identifier or password is invalid. |
| `AUTH_ACCOUNT_PENDING` | Prosumer registration is awaiting Backoffice activation. |
| `AUTH_REGISTRATION_REJECTED` | Prosumer registration was rejected and may be resubmitted. |
| `AUTH_ACCOUNT_DEACTIVATED` | Account was administratively deactivated. |
| `AUTH_CLIENT_ROLE_FORBIDDEN` | The role is not permitted on the declared Web/Android client. |
| `AUTH_ACCOUNT_INACTIVE` | Fallback for an unsupported inactive state. |
| `AUTH_CURRENT_PASSWORD_INVALID` | Current password supplied for a password change is incorrect. |
| `AUTH_PASSWORD_UNCHANGED` | New password is the same as the current password. |
| `USER_NIC_EXISTS` | NIC is already registered. |
| `USER_EMAIL_EXISTS` | Email is already registered. |
| `USER_IDENTIFIER_EXISTS` | A concurrent duplicate write was rejected. |
| `USER_NOT_FOUND` | Target account does not exist. |
| `USER_INVALID_STATUS` | Requested state transition is not allowed. |
| `USER_ACTIVE_RESERVATIONS` | Prosumer has a non-terminal reservation. |
| `USER_DEACTIVATION_ALREADY_REQUESTED` | Prosumer already has a pending deactivation request. |
| `USER_SELF_ADMIN_DEACTIVATION` | Backoffice attempted to deactivate itself. |
| `USER_LAST_ADMIN` | Operation would remove the final active Backoffice account. |
| `VALIDATION_REQUEST` | Request DTO validation failed. |
