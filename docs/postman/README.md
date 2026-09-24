# Member 1 Postman Verification

This package tests every currently implemented HTTP endpoint in the backend and the complete Phase 3 identity/account-management contract.

## File

- `Smart-Solar-Microgrid-Identity.postman_collection.json`

## Prerequisites

1. Start the latest API image:

   ```powershell
   docker compose up -d --build --force-recreate api
   ```

2. Confirm `GET http://localhost:5080/health/ready` returns `200`.
3. Ensure an active Backoffice account exists and that its real password is known. Bootstrap settings only create the first Backoffice account; changing `.env` does not reset an existing password.

## Import And Configure

1. In Postman, select **Import** and import the collection JSON file.
2. Open the imported collection, select **Variables**, and set the **Current value** of `adminEmail` to the active Backoffice email.
3. Set the **Current value** of `adminPassword` to its current password. Do not save a real password into the repository copy or commit a re-export containing it.
4. Keep `baseUrl` as `http://localhost:5080` for Docker, or change its current value for another deployment.
5. Run the entire collection in its existing numeric order.

The first registration request generates unique Prosumer, Grid Operator, and secondary Backoffice identifiers. Later requests automatically capture `prosumerToken`, `operatorToken`, and `adminToken`.

## Coverage

| Area | Scenarios |
| --- | --- |
| System | API information, liveness, MongoDB readiness |
| Registration | Valid registration, duplicate NIC/email, invalid and empty requests |
| Authentication | Unknown user, wrong password, successful login, JWT claims |
| Profile | Read and update own profile, reject incomplete Prosumer contact details |
| Password | Wrong current password, unchanged password, successful change, old/new login |
| Authorization | Missing/malformed JWT, Prosumer and Grid Operator role denials |
| Staff | Create Grid Operator and Backoffice, duplicate email, invalid role, list users |
| Lifecycle | Admin and self-deactivation, immediate old-JWT denial, reactivation, invalid transitions |
| Security | No password hash or MongoDB ID in user responses |

## Expected Run Behavior

- All Postman tests should pass.
- Generated Prosumer and Grid Operator accounts finish as `Active`.
- The generated secondary Backoffice finishes as `Deactivated`.
- Generated records remain in Atlas as test evidence; each collection run uses new identifiers.
- Password-change testing leaves the generated Prosumer using `prosumerNewPassword`.

## Evidence To Capture

- Collection Runner summary showing all tests passed.
- Successful Backoffice, Prosumer, and Grid Operator login responses with tokens visually redacted.
- Representative `400`, `401`, `403`, `404`, and `409` Problem Details responses.
- Atlas `users` documents showing roles, statuses, lifecycle audit fields, and BCrypt hashes without exposing the complete hashes publicly.
- Atlas indexes `ux_users_email`, `ux_users_nic`, and `ix_users_role_status`.

## Tests Outside This Collection

`IIdentityService.GetActiveProsumerAsync` is an internal backend service contract for Member 3 and has no public HTTP route. It is covered by automated .NET tests and must also be verified during reservation-module integration.

`USER_ACTIVE_RESERVATIONS` requires Member 3's reservation data. Once that module is implemented, create a `Pending`, `Approved`, `QrIssued`, or `Verified` reservation for a test Prosumer and confirm both self-deactivation and Backoffice deactivation return `409 USER_ACTIVE_RESERVATIONS`.
