# Identity API Contract

Base path: `/api`  
Authentication: Bearer token for protected endpoints  
Owner: Member 1

## Shared DTOs

### `ApiResponse<T>`

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

### `ApiErrorResponse`

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Email is required."
    }
  ]
}
```

## Endpoints

### Register Prosumer

`POST /api/prosumers/register`

Authorization: Public

Request:

```json
{
  "nic": "200012345678",
  "fullName": "Sample Prosumer",
  "email": "prosumer@example.com",
  "phoneNumber": "0771234567",
  "address": "Colombo",
  "password": "StrongPassword123!"
}
```

Validation:

- `nic`, `fullName`, `email`, `phoneNumber`, `address` and `password` are required.
- `nic` must be unique.
- `email` must be unique and valid.
- Password must satisfy the agreed password policy.
- Role is always assigned as `Prosumer`.

Success: `201 Created`

```json
{
  "success": true,
  "message": "Prosumer registered successfully.",
  "data": {
    "userId": "66f000000000000000000001",
    "nic": "200012345678",
    "email": "prosumer@example.com",
    "role": "Prosumer",
    "status": "Active"
  }
}
```

Errors: `400`, `409`, `500`

### Login

`POST /api/auth/login`

Authorization: Public

Request:

```json
{
  "emailOrNic": "prosumer@example.com",
  "password": "StrongPassword123!"
}
```

Validation:

- `emailOrNic` and `password` are required.
- Deactivated users cannot login.

Success: `200 OK`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "jwt-token",
    "expiresAtUtc": "2026-09-23T18:30:00Z",
    "user": {
      "userId": "66f000000000000000000001",
      "nic": "200012345678",
      "email": "prosumer@example.com",
      "fullName": "Sample Prosumer",
      "role": "Prosumer",
      "status": "Active"
    }
  }
}
```

Errors: `400`, `401`, `403`, `500`

### Current User

`GET /api/auth/me`

Authorization: Any authenticated user

Success: `200 OK`

```json
{
  "success": true,
  "message": "Current user loaded.",
  "data": {
    "userId": "66f000000000000000000001",
    "nic": "200012345678",
    "email": "prosumer@example.com",
    "fullName": "Sample Prosumer",
    "role": "Prosumer",
    "status": "Active"
  }
}
```

Errors: `401`, `403`, `404`

### Create Staff User

`POST /api/users`

Authorization: Backoffice

Request:

```json
{
  "fullName": "Grid Operator 01",
  "email": "operator@example.com",
  "username": "operator01",
  "role": "GridOperator",
  "password": "StrongPassword123!"
}
```

Validation:

- Role must be `Backoffice` or `GridOperator`.
- Email must be unique.
- Only Backoffice users can call this endpoint.

Success: `201 Created`

Errors: `400`, `401`, `403`, `409`

### List Users

`GET /api/users?role=Prosumer&status=Active`

Authorization: Backoffice

Success: `200 OK`

```json
{
  "success": true,
  "message": "Users loaded.",
  "data": [
    {
      "userId": "66f000000000000000000001",
      "nic": "200012345678",
      "email": "prosumer@example.com",
      "fullName": "Sample Prosumer",
      "role": "Prosumer",
      "status": "Active"
    }
  ]
}
```

Errors: `401`, `403`

### Get User by Id

`GET /api/users/{userId}`

Authorization: Backoffice

Success: `200 OK`

Errors: `401`, `403`, `404`

### Update Own Prosumer Profile

`PUT /api/prosumers/me`

Authorization: Prosumer

Request:

```json
{
  "fullName": "Updated Prosumer",
  "phoneNumber": "0777654321",
  "address": "Kandy"
}
```

Validation:

- The authenticated user must be a Prosumer.
- NIC and role cannot be changed through this endpoint.
- Email change should be handled only if the group explicitly supports email verification.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`

### Update User Status

`PATCH /api/users/{userId}/status`

Authorization: Backoffice

Request:

```json
{
  "status": "Deactivated",
  "reason": "Requested by user"
}
```

Validation:

- Status must be one of `PendingActivation`, `Active`, `Deactivated`, `Rejected`.
- Backoffice cannot deactivate their own account through this endpoint unless another admin exists and the group explicitly allows it.

Success: `200 OK`

Errors: `400`, `401`, `403`, `404`, `409`

### Change Password

`POST /api/auth/change-password`

Authorization: Any authenticated user

Request:

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

Validation:

- Current password must match.
- New password must satisfy password policy.

Success: `200 OK`

Errors: `400`, `401`, `403`

## Implementation Notes

- Use server-side role claims in the access token.
- Re-check account status for important protected requests where practical.
- Never return `passwordHash` to clients.
- Record `lastLoginAtUtc` on successful login.
- Use consistent error response format across all modules.

