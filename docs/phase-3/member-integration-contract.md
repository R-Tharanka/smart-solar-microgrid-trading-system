# Phase 3 Member Integration Contract

Status: Frozen for parallel implementation  
Owner: Member 1 for identity portions

This document defines the identity boundary Members 2, 3 and 4 may depend on. Changes to routes, claims, roles, policies, identifiers or the active-Prosumer lookup require the change-control process in `docs/phase-2/api-contract-governance.md`.

## Authentication Contract

- Clients authenticate through `POST /api/users/login` and send `Authorization: Bearer <accessToken>` on protected requests.
- `sub` and `user_identifier` contain the Prosumer NIC or normalized staff email.
- `email` and `role` are present for every account; `nic` is present only for a Prosumer.
- Roles are exactly `Backoffice`, `GridOperator`, and `Prosumer`.
- All protected policies require an authenticated, currently `Active` account. Deactivation therefore invalidates access even before an issued token expires.

## Authorization Policies

| Policy | Intended use |
| --- | --- |
| `Authenticated` | Any active account. |
| `Staff` | Active Backoffice or Grid Operator accounts. |
| `BackofficeOnly` | Administrative station, slot, user and approval operations assigned to Backoffice. |
| `GridOperatorOnly` | QR verification and transfer operations assigned only to Grid Operators. |
| `ProsumerOnly` | Own reservation, profile and Prosumer workflows. |

Controllers owned by other members must use these named policies instead of redefining role strings or trusting client-side role checks.

## Member 3 Prosumer Lookup

Inject `IIdentityService` and call:

```csharp
Task<UserResponse> GetActiveProsumerAsync(
    string nic,
    CancellationToken cancellationToken = default);
```

The method normalizes the NIC and returns only when the user exists, has role `Prosumer`, and has status `Active`. Use the authenticated `user_identifier`/`nic` claim for own-reservation operations; do not accept a different owner NIC from the client as authority.

Member 3 must store the returned normalized `Nic` in `energyReservations.prosumerNic`. It must not query the `users` collection directly, consume `User` persistence objects, or access password hashes.

## Cross-Domain Responsibilities

| Member | Identity dependency |
| --- | --- |
| Member 2 | Apply `BackofficeOnly`, `Staff`, or public access exactly as specified by the station/slot API contract. No direct user persistence access is needed. |
| Member 3 | Apply `ProsumerOnly` to own reservation commands and call `GetActiveProsumerAsync` before creating a reservation. Preserve `prosumerNic` and the agreed reservation status values used by the deactivation guard. |
| Member 4 | Apply `GridOperatorOnly` to operator-only QR verification/finalization and use the token business identifier for audit fields. |

## Stability Rules

- MongoDB `_id` is internal to identity and is not an account business identifier.
- Other modules may retain NIC/email snapshots needed for audit, but identity remains the authority for role and active status.
- Other modules must not issue JWTs, hash/check passwords, duplicate user records, or implement alternate authentication middleware.
- Public identity response fields are `nic`, `email`, `firstName`, `lastName`, `phoneNumber`, `address`, `role`, and `status`.
- Identity errors use RFC 7807 Problem Details with `errorCode` and `traceId`.

## Reservation Deactivation Dependency

Member 1 blocks Prosumer deactivation while an `energyReservations` document has the same `prosumerNic` and status `Pending`, `Approved`, `QrIssued`, or `Verified`. Member 3 owns reservation transitions and must coordinate any change to those values before implementation.
