# Member 1 Scope - Identity, Authentication and Account Management

This document defines the Phase 1 foundation for Member 1. It should be used as the design contract before implementing the authentication, role and account features.

## 1. Objective

Member 1 owns the user identity and account lifecycle across:

- ASP.NET Core Web API.
- React web application.
- Native Android Java application.
- Android SQLite login/reference persistence.
- Testing and documentation evidence for identity features.

## 2. Member 1 Requirements

| ID | Requirement |
| --- | --- |
| M1-01 | Create the shared user/account model for Backoffice, Grid Operator and Prosumer users. |
| M1-02 | Register Prosumers from Android using NIC as the unique primary identity. |
| M1-03 | Support Backoffice creation of Backoffice and Grid Operator accounts. |
| M1-04 | Authenticate users through the API and issue a token/session response. |
| M1-05 | Enforce role-based access for protected API endpoints. |
| M1-06 | Prevent deactivated users from logging in. |
| M1-07 | Allow Prosumers to view/update only their own profile. |
| M1-08 | Allow Backoffice to view, deactivate and reactivate eligible accounts. |
| M1-09 | Return consistent validation and authorization errors. |
| M1-10 | Persist required Android login/reference details in SQLite. |

## 3. Account Data Model

The canonical server record is stored in MongoDB collection `users`.

Recommended fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId/string | Yes | MongoDB technical identifier. |
| `nic` | string | Required for Prosumer | Unique prosumer-facing identifier. |
| `email` | string | Yes | Unique login/contact email. |
| `firstName` | string | Yes | User given name. |
| `lastName` | string | Yes | User family name. |
| `phoneNumber` | string | Yes for Prosumer | Contact details. |
| `address` | string | Required for Prosumer | Profile details. |
| `role` | enum | Yes | `Backoffice`, `GridOperator`, `Prosumer`. |
| `status` | enum | Yes | `Pending`, `Active`, `Deactivated`. |
| `passwordHash` | string | Yes | Never store plaintext passwords. |
| `createdAtUtc` | datetime | Yes | Server-generated. |
| `updatedAtUtc` | datetime | Yes | Server-generated. |
| `deactivatedAtUtc` | datetime | Optional | Set on deactivation. |
| `reactivatedAtUtc` | datetime | Optional | Set on reactivation. |
| `createdByIdentifier` | string | Optional | Backoffice email that created a staff account. |
| `statusChangedByIdentifier` | string | Optional | Business identifier of the lifecycle actor. |
| `lastLoginAtUtc` | datetime | Optional | Updated on successful login. |

Recommended indexes:

- Unique index on `email`.
- Unique sparse index on `nic`.
- Index on `role`.
- Index on `status`.

## 4. Role Policy

| Policy | Allowed Roles | Purpose |
| --- | --- | --- |
| `RequireBackoffice` | Backoffice | Admin-only user and account management. |
| `RequireGridOperator` | GridOperator | QR verification and energy transfer workflows. |
| `RequireProsumer` | Prosumer | Prosumer profile and reservation actions. |
| `RequireAuthenticated` | Backoffice, GridOperator, Prosumer | Common profile/session endpoints. |

Rules:

- A user can never choose their own elevated role during public registration.
- Prosumer public registration always creates role `Prosumer`.
- Backoffice is the only role allowed to create Backoffice/Grid Operator accounts.
- Server-side authorization must not rely on hidden UI controls.

## 5. Backend Deliverables

| Deliverable | Details |
| --- | --- |
| Models | `User`, `UserRole`, `UserStatus`. |
| DTOs | Register, login, login response, user response, profile update, password change and staff creation. |
| Services | `IdentityService`, `JwtTokenGenerator`, account deactivation guard. |
| Controllers | `UsersController`. |
| Middleware | Consistent exception/error response middleware. |
| Configuration | JWT issuer/audience/key, token expiry, MongoDB settings. |
| Tests/manual checks | Invalid login, duplicate NIC, inactive account login, unauthorized access, own-profile update rule. |

## 6. Web Deliverables

| Screen/Feature | Description |
| --- | --- |
| Login page | Login form with validation, loading and API error state. |
| Role-based routing | Redirect Backoffice and Grid Operator to correct dashboards. |
| User management | Backoffice create/list/update/deactivate/reactivate users. |
| Prosumer management | Backoffice view and manage prosumer account status. |
| Auth guard | Prevent unauthenticated web access to protected pages. |

## 7. Android Deliverables

| Screen/Feature | Description |
| --- | --- |
| Prosumer registration | Register using NIC, profile details and password. |
| Login | Authenticate through API and store required local login/reference data. |
| Profile view/edit | Allow Prosumer to view and update own profile. |
| Account deactivation request | Allow self-service request/deactivation if implemented by the group. |
| Role home routing | Route Prosumer/Grid Operator to the correct home screen after login. |

## 8. Android SQLite Plan

Recommended local tables:

### `local_session`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY | Single active session row. |
| `user_id` | TEXT | API user id. |
| `nic` | TEXT | Present for Prosumer. |
| `email` | TEXT | User email. |
| `role` | TEXT | User role. |
| `display_name` | TEXT | UI display. |
| `token` | TEXT | Store only if required; prefer secure storage if available. |
| `saved_at_utc` | TEXT | Sync timestamp. |

### `reference_cache`

| Column | Type | Notes |
| --- | --- | --- |
| `key` | TEXT PRIMARY KEY | Reference key. |
| `value_json` | TEXT | Cached reference payload. |
| `updated_at_utc` | TEXT | Cache timestamp. |

Rules:

- SQLite is for local convenience and assignment-required persistence.
- Server data remains authoritative.
- On logout, clear session data.
- Do not store plaintext password in SQLite.

## 9. Identity API Acceptance Tests

| Test | Expected Result |
| --- | --- |
| Register Prosumer with new NIC/email | User created with role `Prosumer`. |
| Register duplicate NIC | API returns `409 Conflict`. |
| Register duplicate email | API returns `409 Conflict`. |
| Login with valid active user | API returns token and user summary. |
| Login with wrong password | API returns `401 Unauthorized`. |
| Login with deactivated account | API returns `403 Forbidden`. |
| Prosumer updates own profile | API updates allowed fields. |
| Prosumer updates another profile | API returns `403 Forbidden`. |
| Grid Operator opens Backoffice user list | API returns `403 Forbidden`. |
| Backoffice deactivates Prosumer | Status changes to `Deactivated`. |
| Deactivated user attempts protected request | API rejects the request. |

## 10. Evidence to Capture

- Screenshot of web login.
- Screenshot of Backoffice user management.
- Screenshot of Android registration.
- Screenshot of Android login.
- Screenshot of Android profile edit.
- API request/response examples for registration, login, `/me`, status update.
- MongoDB `users` document screenshots with password hash visible but plaintext password absent.
- Test table showing invalid login, duplicate NIC, role denial and deactivated-account behavior.
