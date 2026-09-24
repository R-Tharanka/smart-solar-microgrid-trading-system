# Phase 3 - Member 1 Identity Backend

Status: Implementation complete; live Atlas HTTP verification requires deployment credentials
Scope: Identity, authentication, authorization and account management

## Decisions Closed

| Question | Phase 3 decision |
| --- | --- |
| Prosumer registration status | Immediately `Active`; `Pending` remains reserved for a future approval workflow. |
| Public identity | NIC for Prosumers and normalized email for staff; MongoDB `_id` remains internal. |
| Initial Backoffice account | Optional one-time environment-configured bootstrap; no default password exists in source. |
| Prosumer deactivation with reservations | Block while any reservation is `Pending`, `Approved`, `QrIssued`, or `Verified`. |
| Deactivated JWT behavior | All protected policies re-check the account and deny non-Active users immediately. |

## Delivered

- Validated MongoDB, JWT and bootstrap configuration.
- BCrypt password hashing with no plaintext persistence or logging.
- Camel-case MongoDB user serialization and unique email / sparse unique NIC indexes.
- Idempotent migration of user documents created by the earlier Pascal-case prototype.
- Repository, identity service, JWT generator and controller layers.
- `Authenticated`, `ProsumerOnly`, `GridOperatorOnly`, `BackofficeOnly`, and shared staff policies.
- Public registration and login; profile read/update; staff creation; user list; explicit deactivate/reactivate commands.
- Normalization, DTO validation, guarded state transitions, duplicate-write handling, and RFC 7807 errors.
- Automated tests for identity rules, validation, JWT claims and role/account-status authorization.

## Secure Configuration

Copy `.env.example` to `.env` and set all blank values. Required runtime values are:

```text
MONGODB_CONNECTION_STRING
MONGODB_DATABASE_NAME
JWT_SIGNING_KEY
```

The JWT key must contain at least 32 UTF-8 bytes. For first startup only, set:

```text
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_EMAIL=<valid staff email>
BOOTSTRAP_ADMIN_PASSWORD=<strong password>
```

After the first Backoffice account is present, set `BOOTSTRAP_ADMIN_ENABLED=false`. Startup skips bootstrap whenever any Backoffice account already exists.

## Run And Verify

```powershell
dotnet restore backend/SmartSolarMicrogrid.slnx
dotnet test backend/SmartSolarMicrogrid.slnx --no-restore
docker compose up --build
```

Health endpoints are `/health/live` and `/health/ready`. The readiness endpoint confirms MongoDB connectivity.

## Verification Status

| Area | Automated coverage | Status |
| --- | --- | --- |
| Registration and duplicate identifiers | Service and DTO tests | Passed |
| Email, NIC, password, role and required values | DTO/service tests | Passed |
| Correct, wrong, unknown and inactive login | Service tests | Passed |
| JWT business identifier and role claims | Token test | Passed |
| Backoffice, Grid Operator and Prosumer policies | Authorization tests | Passed |
| Profile ownership | Controller always derives identity from JWT claim | Implemented |
| Deactivation/reactivation transitions | Service tests | Passed |
| Reservation-aware deactivation | Guard/service test | Passed |
| MongoDB indexes and persistence | Startup initializer | Requires live Atlas verification |
| HTTP status/response evidence | Controller contracts | Requires running API/Postman capture |

Current automated result: 31 tests passed, 0 failed.

## Member 3 Integration Contract

The reservation module must preserve the agreed status strings and `prosumerNic` field in `energyReservations`. Member 1 reads those values to block account deactivation during non-terminal workflows. Member 3 remains the only owner of reservation state transitions.
