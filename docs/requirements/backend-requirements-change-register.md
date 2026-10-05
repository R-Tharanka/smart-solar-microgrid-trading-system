# Backend Requirements Change and Alignment Register

Date reconciled: 2026-10-04

Purpose: record backend decisions and requirement changes made after the original project plan, together with their client and documentation impact.

This register does not rewrite the assignment brief. The team must confirm any changed stakeholder requirement and retain evidence of that decision. The assignment PDF remains authoritative for assessment.

## Change Register

| ID | Original plan/brief position | Implemented or revised behavior | Reason/benefit | Impact and required action | State |
| --- | --- | --- | --- | --- | --- |
| CHG-01 | Prosumer profiles use NIC as the primary identity | MongoDB retains `_id`; NIC is unique, required for Prosumers and used as the public business identifier | Preserves MongoDB references while satisfying NIC-based lookup | Clients must never rely on MongoDB `_id`; report must explain business key versus storage key | Accepted in D-06 |
| CHG-02 | Marking table includes a pending-activation web view | Public registration creates `Pending`; the API exposes a Backoffice queue plus activate/reject actions; React provides the review flow | Aligns account creation with the required approval workflow | Verify register/activate/reject/resubmit through the deployed API and Web UI | Implemented in source; live evidence pending |
| CHG-03 | Authentication identifier was not fully specified | Login accepts normalized email or Prosumer NIC | Supports staff email login and NIC-oriented Prosumer login through one route | Web/mobile labels and validation must explain accepted identifiers | Implemented |
| CHG-04 | Rubric mentions create/update/delete for stations and slots; the main scenario specifies deactivation | Accounts/stations use lifecycle status; reservations cancel; no physical delete endpoints | Protects audit history and active references | Explain the soft lifecycle approach and confirm it satisfies the delete wording | Decision required |
| CHG-05 | PDF describes capacity as `kW/h` | Models/contracts use `CapacityKwh`, `BatteryStorageKwh`, `AvailableEnergyKwh` and `PricePerKwh` | Uses a consistent energy quantity for booking/allocation | Report must state the interpretation and avoid silently mixing units | Accepted in D-15 |
| CHG-06 | The "within 7 days" boundary was ambiguous | Scheduled start must be after server UTC now and no later than `now + 7 days` | Creates a deterministic server-owned rule | Clients display server validation; exact boundary tests remain required | Accepted in D-11 |
| CHG-07 | The 12-hour modification rule was high level | Update/cancel is allowed only while server time is at or before `scheduledStart - 12 hours` | Removes timezone/client-clock ambiguity | Boundary tests and user-facing messages are required | Accepted in D-12 |
| CHG-08 | Slot-capacity allocation timing was unspecified | Pending requests do not consume energy; approval conditionally allocates it; update/cancel/reject restores or reallocates it | Prevents unapproved requests from locking capacity | Run competing approval tests against real MongoDB | Implemented |
| CHG-09 | Approval actor was not explicit in the top-level specification | Backoffice and Grid Operator may approve/reject through the `Staff` policy | Allows administrative and operational control | Document the role matrix consistently and verify both roles | Accepted in D-16 |
| CHG-10 | Scenario assigns Grid Operators responsibility for slot availability | Station and slot detail reads are available to Grid Operators; slot detail update is `BackofficeOnly`; slot availability/status change uses `Staff`; station create/update/status and slot creation remain `BackofficeOnly` | Gives Grid Operators operational availability control without permission to edit station data or slot schedule/capacity/price | Keep Web actions and endpoint policies aligned; verify Backoffice/Grid Operator/Prosumer authorization cases | Accepted in D-24 and implemented |
| CHG-11 | Secure QR was required, but payload/storage design was unspecified | API issues an opaque expiring token; a SHA-256 hash is stored in the reservation | Avoids predictable reservation-ID QR values and raw-token storage | Mobile must render/scan the issued payload and prove expiry/replay behavior | Accepted in D-13/D-14 |
| CHG-12 | Four server collections are required | Transaction/audit fields are embedded in `energyReservations`; no fifth transaction collection is used | Keeps the four-collection model and lifecycle together | Database/report diagrams must show embedded transaction fields | Implemented |
| CHG-13 | Final transfer behavior was high level | Grid Operator verifies, then finalizes with actual energy/note; completion and station battery-storage increment occur in a MongoDB transaction without closing the shared slot | Adds auditability, storage-capacity validation and duplicate prevention | Final Atlas tier must support transactions; rollback test required | Implemented |
| CHG-14 | SQLite is required for local user management/login/reference data | Android database v3 retains session token/role/display name/expiry, the single-account API-derived `user_profile` cache, and an API-derived `grid_node_reference` cache containing only station map/list/detail fields and `lastSyncedAt` | Supports session restoration plus offline read-only identity/station reference display without moving authentication, authorization, live slot availability or reservation authority into SQLite | Validate v1-v2-v3 migration, offline/no-cache behavior and logout/expiry clearing on device; redact tokens and personal data. Slots/reservations remain API-only | Implemented in source; device evidence pending |
| CHG-15 | Mobile app is intended for Prosumers and Grid Operators | API login requires `clientType`; Android sends `Android`, permits Prosumer/Grid Operator and rejects Backoffice | Matches the operational scenario and enforces it at the API boundary | Verify role combinations on an installed device against the hosted API | Implemented in source; device evidence pending |
| CHG-16 | Web app is for Backoffice/Grid Operators | API login requires `clientType`; Web sends `Web`, permits Backoffice/Grid Operator and rejects Prosumer | Enforces the required client-role matrix | Verify role combinations and legacy-session handling in a browser | Implemented in source; browser evidence pending |
| CHG-17 | Station deactivation is blocked by active reservations | `Pending`, `Approved`, `QrIssued` and `Verified` reservations block station and relevant slot lifecycle changes | Protects every non-terminal workflow | Keep status lists synchronized across domains and tests | Implemented |
| CHG-18 | Account deactivation behavior was general | Prosumer self-service records a pending request while remaining Active; Backoffice deactivation applies the non-terminal-reservation guard; protected policies deny deactivated accounts before JWT expiry | Separates user intent from administrative lifecycle control without weakening reservation protection | Android uses the request endpoint and shows pending state; React exposes request state/processing. Verify both clients against the same database | Implemented in source; live evidence pending |
| CHG-19 | The original plan did not specify rejected-registration resubmission in detail | A rejected Prosumer's existing NIC record is updated and returned to `Pending` on resubmission | Avoids duplicate identities and maintains Backoffice review | Demonstrate the transition and email uniqueness with real MongoDB | Implemented in source; live evidence pending |
| CHG-20 | The assignment requires nearby nodes through Google Maps but did not define a radius/search contract | Existing `GET /api/stations` accepts optional paired `nearLat`/`nearLng`; the service validates coordinates and applies approximate nearest-first ordering to the status-filtered station set. Android requests `status=Active`, supplies device coordinates when available, and otherwise loads active stations without nearby ordering. The current UI renders those results with osmdroid/OpenStreetMap rather than Google Maps | Reuses the authoritative station response for list, markers and details without adding a second endpoint or client-owned station model | This is ordering, not radius filtering or a MongoDB geo-near query. Replace the map provider or document explicit lecturer approval, then validate real-device location/order | Backend/location source implemented; Google Maps compliance and runtime evidence pending |
| CHG-21 | The original dashboard summary treated every `Approved` reservation as upcoming and Android lacked the planned booking categories/search | `approvedFutureCount` now counts only approved reservations whose scheduled start is after server UTC now; Android exposes live pending/future-approved counts plus client-side search and current/pending/history categories over the authoritative reservation list | Aligns the count label with its actual meaning and closes the planned mobile booking-view gap without caching reservation authority | Verify count/category boundaries, refresh after create/update/cancel/approval, search behavior and empty states against the hosted API on device | Implemented in source; device/E2E evidence pending |
| CHG-22 | The original QR contract left reuse/rotation undecided and allowed issuance only from `Approved` | QR issue now also accepts `QrIssued`; each call generates a new opaque token and atomically replaces the stored hash/expiry while retaining `QrIssued` | Allows a Prosumer to regenerate an unavailable/expired display token without reverting reservation state; every older token becomes invalid | Add a direct renewal/old-token invalidation test; clients must not persist raw QR payloads. The current Android `qr_cache` SharedPreferences violates this rule and must be removed | Backend source implemented; focused test and secure Android handling pending |

## Current Identity Client/Role Matrix

| Client | Backoffice | Grid Operator | Prosumer |
| --- | --- | --- | --- |
| Web | Allowed | Allowed | Rejected |
| Android | Rejected | Allowed | Allowed |

Only `Active` accounts can establish a normal session. The client indicator is an application-level rule, not device attestation.

## Current Prosumer State Machine

```text
Public registration -> Pending --Backoffice activate--> Active
                                --Backoffice reject----> Rejected
Rejected --resubmit same NIC record--> Pending
Active --Prosumer request--> Active + deactivationRequested
Active + request --Backoffice deactivate (reservation guard)--> Deactivated
Deactivated --Backoffice reactivate--> Active
```

`Pending` registration and an `Active` account with a pending deactivation request are distinct. A request does not revoke the current session or prevent a later login. The existing active-account authorization rejects a protected call after actual administrative deactivation.

## Current Reservation State Machine

```text
Pending --approve--> Approved --issue QR--> QrIssued --verify--> Verified --finalize--> Completed
   |                     |
   +--reject--> Rejected +--cancel (12-hour rule)--> Cancelled
   +--cancel (12-hour rule)------------------------> Cancelled
```

`QrIssued --reissue/rotate QR--> QrIssued` replaces the stored token hash and invalidates every earlier token without reopening reservation editing.

Terminal states are `Rejected`, `Cancelled`, `Expired` and `Completed`. Physical deletion is not part of the current backend lifecycle.

## Confirmation Checklist

- [x] Pending public registration and Backoffice activation/rejection restored in the backend.
- [x] Web and Android source send their client type and use the corrected activation/deactivation-request contracts.
- [x] Grid Operators may view stations/slots and change slot availability/status, but may not edit station or slot details.
- [ ] Team confirms that status/deactivation satisfies the rubric's "delete" wording.
- [x] Member 1 SQLite scope includes session persistence and bounded authenticated-profile reference caching; server remains authoritative and offline writes are excluded.
- [x] Member 2 SQLite scope includes bounded grid-node reference caching; live slot availability and reservations remain API-only.
- [x] Nearby station source uses the existing paired-coordinate API and a non-blocking no-location fallback; no radius contract was invented.
- [x] Prosumer dashboard `approvedFutureCount` excludes past approved reservations; Android search/categories/counts consume authoritative API data.
- [ ] Android removes raw QR payload/token persistence and QR renewal/old-token invalidation is directly tested.
- [ ] API contracts, web/mobile labels, diagrams and final report use the same decisions.
- [ ] All four members sign the Phase 2 contract/handoff record.

## Evidence Needed for Changed Rules

- Boundary tests for exactly seven days and exactly twelve hours.
- Competing approvals proving energy cannot be over-allocated.
- Deactivation rejection with a non-terminal reservation.
- Wrong-role tests for station/slot and approval actions.
- QR invalid, expired, replay and duplicate-finalization tests.
- QR renewal, old-token invalidation and proof that Android logout/backup/storage retains no raw transaction token.
- MongoDB transaction rollback evidence.
- Android SQLite evidence with secrets and tokens redacted.
